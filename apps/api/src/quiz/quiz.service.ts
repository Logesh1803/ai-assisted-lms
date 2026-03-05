import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { SystemsDatabaseService } from '@thinkbloom/data-sources';
import { GeminiService } from '../gemini/gemini.service';
import { getTimestamps } from 'utils/src/date-formatter.service';
import {
  GenerateQuestionsDto,
  QueryQuizAttemptDto,
  QuestionType,
  StartQuizDto,
  SubmitQuizDto,
} from './dto/quiz.dto';
import { NotificationProducerService } from 'message-queues/src';

@Injectable()
export class QuizAttemptService {
  private readonly logger = new Logger(QuizAttemptService.name);

  constructor(
    private prisma: SystemsDatabaseService,
    private geminiService: GeminiService,
    private notificationProducer: NotificationProducerService,
  ) {}

  // ─── Generate Questions (AI) ──────────────────────────────────────────────

  async generateQuestions(courseUuid: string, dto: GenerateQuestionsDto) {
    const course = await this.prisma.course.findUnique({
      where: { uuid: courseUuid },
      include: {
        lessons: {
          where: { deleted_at: null },
          orderBy: { order: 'asc' },
          select: { title: true, content: true },
        },
      },
    });

    if (!course) throw new NotFoundException('Course not found');
    if (course.lessons.length === 0)
      throw new BadRequestException('Course has no lessons to generate quiz from');

    const lessons = course.lessons.map((l) => ({
      title: l.title,
      content: l.content ?? '',
    }));

    const mcqCount = dto.mcqCount ?? 8;
    const shortCount = dto.shortAnswerCount ?? 2;

    const [mcqQuestions, shortQuestions] = await Promise.all([
      mcqCount > 0
        ? this.geminiService.generateQuizQuestions(course.title, lessons, mcqCount)
        : [],
      shortCount > 0
        ? this.geminiService.generateShortAnswerQuestions(course.title, lessons, shortCount)
        : [],
    ]);

    // Re-index IDs to be sequential across both types
    const allQuestions = [
      ...mcqQuestions,
      ...shortQuestions.map((q: any, i: number) => ({
        ...q,
        id: mcqQuestions.length + i + 1,
      })),
    ];

    return { questions: allQuestions, mcqCount, shortAnswerCount: shortCount };
  }

  // ─── Start Quiz Attempt ───────────────────────────────────────────────────

  async start(courseUuid: string, studentId: number, dto: StartQuizDto) {
    const course = await this.prisma.course.findUnique({
      where: { uuid: courseUuid },
    });
    if (!course) throw new NotFoundException('Course not found');

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        student_id_course_id: { student_id: studentId, course_id: course.id },
      },
    });
    if (!enrollment)
      throw new ForbiddenException('Student is not enrolled in this course');

    return this.prisma.quizAttempt.create({
      data: {
        enrollment_id: enrollment.id,
        student_id: studentId,
        course_id: course.id,
        questions: JSON.parse(JSON.stringify(dto.questions)),
        answers: [],
        score: 0,
        total_questions: dto.questions.length,
        correct_answers: 0,
        strong_topics: [],
        weak_topics: [],
        started_at: BigInt(Date.now()),
        created_by: studentId,
        updated_by: studentId,
        ...getTimestamps('create'),
      },
    });
  }

  // ─── Submit Quiz ──────────────────────────────────────────────────────────

  async submit(attemptUuid: string, studentId: number, dto: SubmitQuizDto) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { uuid: attemptUuid },
    });
    if (!attempt) throw new NotFoundException('Quiz attempt not found');
    if (attempt.student_id !== studentId)
      throw new ForbiddenException('Not your quiz attempt');
    if (attempt.submitted_at)
      throw new BadRequestException('Quiz already submitted');

    const course = await this.prisma.course.findUnique({
      where: { id: attempt.course_id },
      select: { title: true },
    });

    const questions = attempt.questions as any[];
    let totalScore = 0;
    const topicResults: Record<string, { score: number; total: number }> = {};

    // Validate short answers via AI in parallel
    const shortAnswerValidations = await Promise.all(
      questions
        .filter((q) => q.type === QuestionType.SHORT_ANSWER)
        .map(async (q) => {
          const studentAnswer = dto.answers.find((a) => a.questionId === q.id);
          if (!studentAnswer) return { id: q.id, score: 0, feedback: 'No answer provided' };
          const result = await this.geminiService.validateShortAnswer(
            q.question,
            q.correct_answer,
            studentAnswer.answer,
            q.keywords ?? [],
          );
          return { id: q.id, ...result };
        }),
    );

    const shortAnswerMap = new Map(shortAnswerValidations.map((v) => [v.id, v]));

    for (const question of questions) {
      const studentAnswer = dto.answers.find((a) => a.questionId === question.id);
      if (!topicResults[question.topic]) {
        topicResults[question.topic] = { score: 0, total: 0 };
      }
      topicResults[question.topic].total += 1;

      if (question.type === QuestionType.SHORT_ANSWER) {
        const validation = shortAnswerMap.get(question.id);
        const score = validation?.score ?? 0;
        totalScore += score;
        topicResults[question.topic].score += score;
      } else {
        // MCQ — exact match
        const isCorrect = studentAnswer?.answer === question.correct_answer;
        if (isCorrect) {
          totalScore += 1;
          topicResults[question.topic].score += 1;
        }
      }
    }

    const scorePercent = Math.round((totalScore / questions.length) * 100);
    const strongTopics: string[] = [];
    const weakTopics: string[] = [];

    for (const [topic, result] of Object.entries(topicResults)) {
      result.score / result.total >= 0.7
        ? strongTopics.push(topic)
        : weakTopics.push(topic);
    }

    const aiFeedback = await this.geminiService.generateQuizFeedback(
      course!.title,
      Math.round(totalScore),
      questions.length,
      strongTopics,
      weakTopics,
    );

    const updatedAttempt = await this.prisma.quizAttempt.update({
      where: { uuid: attemptUuid },
      data: {
        answers: JSON.parse(JSON.stringify(dto.answers)),
        score: scorePercent,
        correct_answers: Math.round(totalScore),
        strong_topics: strongTopics,
        weak_topics: weakTopics,
        ai_feedback: aiFeedback,
        submitted_at: BigInt(Date.now()),
        updated_by: studentId,
        ...getTimestamps('update'),
      },
    });

    // Dispatch quiz result email via queue (non-blocking)
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: { first_name: true, email: true },
    });
    if (student) {
      this.notificationProducer.dispatchQuizCompleted({
        studentName: student.first_name,
        studentEmail: student.email,
        courseTitle: course!.title,
        score: scorePercent,
        totalQuestions: questions.length,
        correctAnswers: Math.round(totalScore),
        strongTopics,
        weakTopics,
        aiFeedback,
      }).catch((err) => this.logger.error('Failed to dispatch quiz completed email', err));
    }

    return updatedAttempt;
  }

  // ─── Get My Attempts ──────────────────────────────────────────────────────

  async getMyAttempts(courseUuid: string, studentId: number) {
    const course = await this.prisma.course.findUnique({
      where: { uuid: courseUuid },
    });
    if (!course) throw new NotFoundException('Course not found');

    return this.prisma.quizAttempt.findMany({
      where: { student_id: studentId, course_id: course.id },
      orderBy: { created_at: 'desc' },
      select: {
        uuid: true,
        score: true,
        total_questions: true,
        correct_answers: true,
        strong_topics: true,
        weak_topics: true,
        ai_feedback: true,
        started_at: true,
        submitted_at: true,
      },
    });
  }

  // ─── Get Single Attempt ───────────────────────────────────────────────────

  async findOne(attemptUuid: string, studentId: number) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { uuid: attemptUuid },
    });
    if (!attempt) throw new NotFoundException('Quiz attempt not found');
    if (attempt.student_id !== studentId)
      throw new ForbiddenException('Not your quiz attempt');
    return attempt;
  }

  // ─── Get All Attempts (teacher view) ─────────────────────────────────────

  async getCourseAttempts(courseUuid: string, query: QueryQuizAttemptDto) {
    const course = await this.prisma.course.findUnique({
      where: { uuid: courseUuid },
    });
    if (!course) throw new NotFoundException('Course not found');

    const { page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const [total, attempts] = await Promise.all([
      this.prisma.quizAttempt.count({ where: { course_id: course.id } }),
      this.prisma.quizAttempt.findMany({
        where: { course_id: course.id },
        skip,
        take: Number(limit),
        orderBy: { created_at: 'desc' },
        include: {
          student: {
            select: { uuid: true, first_name: true, last_name: true, email: true },
          },
        },
      }),
    ]);

    return { page, limit, total, attempts };
  }
}
