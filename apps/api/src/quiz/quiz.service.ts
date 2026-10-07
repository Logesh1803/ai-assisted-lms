import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import {
  NotificationType,
  SystemsDatabaseService,
} from "@thinkbloom/data-sources";
import { GeminiService } from "../gemini/gemini.service";
import { getTimestamps } from "@thinkbloom/utils";
import {
  GenerateQuestionsDto,
  QueryQuizAttemptDto,
  QuestionType,
  StartQuizDto,
  SubmitQuizDto,
} from "./dto/quiz.dto";
import { NotificationProducerService } from "@thinkbloom/message-queues";
import { InAppNotificationService } from "../notification/notification.service";
import { scoreQuizAttempt, StoredQuizQuestion } from "./quiz-scoring";

@Injectable()
export class QuizAttemptService {
  private readonly logger = new Logger(QuizAttemptService.name);

  constructor(
    private prisma: SystemsDatabaseService,
    private geminiService: GeminiService,
    private notificationProducer: NotificationProducerService,
    private inAppNotification: InAppNotificationService,
  ) {}

  // ─── Generate Questions (AI) ──────────────────────────────────────────────

  async generateQuestions(courseUuid: string, dto: GenerateQuestionsDto) {
    const course = await this.prisma.course.findUnique({
      where: { uuid: courseUuid },
      include: {
        lessons: {
          where: { deleted_at: null },
          orderBy: { order: "asc" },
          select: { title: true, content: true },
        },
      },
    });

    if (!course) throw new NotFoundException("Course not found");
    if (course.lessons.length === 0)
      throw new BadRequestException(
        "Course has no lessons to generate quiz from",
      );

    const lessons = course.lessons.map((lesson) => ({
      title: lesson.title,
      content: lesson.content ?? "",
    }));

    const mcqCount = dto.mcqCount ?? 8;
    const shortCount = dto.shortAnswerCount ?? 2;

    const [mcqQuestions, shortQuestions] = await Promise.all([
      mcqCount > 0
        ? this.geminiService.generateQuizQuestions(
            course.title,
            lessons,
            mcqCount,
          )
        : [],
      shortCount > 0
        ? this.geminiService.generateShortAnswerQuestions(
            course.title,
            lessons,
            shortCount,
          )
        : [],
    ]);

    // Re-index IDs to be sequential across both types
    const allQuestions = [
      ...mcqQuestions,
      ...shortQuestions.map((question, index) => ({
        ...question,
        id: mcqQuestions.length + index + 1,
      })),
    ];

    return { questions: allQuestions, mcqCount, shortAnswerCount: shortCount };
  }

  // ─── Start Quiz Attempt ───────────────────────────────────────────────────

  async start(courseUuid: string, studentId: number, dto: StartQuizDto) {
    const course = await this.prisma.course.findUnique({
      where: { uuid: courseUuid },
    });
    if (!course) throw new NotFoundException("Course not found");

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        student_id_course_id: { student_id: studentId, course_id: course.id },
      },
    });
    if (!enrollment)
      throw new ForbiddenException("Student is not enrolled in this course");

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
        ...getTimestamps("create"),
      },
    });
  }

  // ─── Submit Quiz ──────────────────────────────────────────────────────────

  async submit(attemptUuid: string, studentId: number, dto: SubmitQuizDto) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { uuid: attemptUuid },
    });
    if (!attempt) throw new NotFoundException("Quiz attempt not found");
    if (attempt.student_id !== studentId)
      throw new ForbiddenException("Not your quiz attempt");
    if (attempt.submitted_at)
      throw new BadRequestException("Quiz already submitted");

    // Fetch the course together with its teacher, so the notification step
    // below does not have to query the same course row a second time.
    const course = await this.prisma.course.findUnique({
      where: { id: attempt.course_id },
      select: {
        title: true,
        uuid: true,
        teacher: { select: { id: true, first_name: true, email: true } },
      },
    });
    if (!course) throw new NotFoundException("Course not found");

    // `questions` is a Json column, so it needs a cast to its stored shape.
    const questions = attempt.questions as unknown as StoredQuizQuestion[];
    if (questions.length === 0)
      throw new BadRequestException(
        "This quiz attempt has no questions to score",
      );

    const answersByQuestionId = new Map(
      dto.answers.map((answer) => [answer.questionId, answer]),
    );

    // Grade the written answers with the AI, all at the same time
    const writtenAnswerGrades = await Promise.all(
      questions
        .filter((question) => question.type === QuestionType.SHORT_ANSWER)
        .map(async (question) => {
          const studentAnswer = answersByQuestionId.get(question.id);
          if (!studentAnswer)
            return {
              id: question.id,
              score: 0,
              feedback: "No answer provided",
            };
          const grade = await this.geminiService.validateShortAnswer(
            question.question,
            question.correct_answer,
            studentAnswer.answer,
            question.keywords ?? [],
          );
          return { id: question.id, ...grade };
        }),
    );

    // The marking rules themselves live in quiz-scoring.ts, away from the
    // database and AI calls, so they can be read and tested on their own.
    const { correctAnswerCount, scorePercent, strongTopics, weakTopics } =
      scoreQuizAttempt(questions, dto.answers, writtenAnswerGrades);

    const aiFeedback = await this.geminiService.generateQuizFeedback(
      course.title,
      correctAnswerCount,
      questions.length,
      strongTopics,
      weakTopics,
    );

    const updatedAttempt = await this.prisma.quizAttempt.update({
      where: { uuid: attemptUuid },
      data: {
        answers: JSON.parse(JSON.stringify(dto.answers)),
        score: scorePercent,
        correct_answers: correctAnswerCount,
        strong_topics: strongTopics,
        weak_topics: weakTopics,
        ai_feedback: aiFeedback,
        submitted_at: BigInt(Date.now()),
        updated_by: studentId,
        ...getTimestamps("update"),
      },
    });

    // Notify student (email) and teacher (in-app + email) non-blocking
    this.notifyOnSubmit({
      studentId,
      courseTitle: course.title,
      courseUuid: course.uuid,
      teacher: course.teacher,
      attemptUuid,
      scorePercent,
      totalQuestions: questions.length,
      correctAnswers: correctAnswerCount,
      strongTopics,
      weakTopics,
      aiFeedback,
    }).catch((error) =>
      this.logger.error("Failed to send quiz notifications", error),
    );

    return updatedAttempt;
  }

  // ─── Get My Attempts ──────────────────────────────────────────────────────

  async getMyAttempts(courseUuid: string, studentId: number) {
    const course = await this.prisma.course.findUnique({
      where: { uuid: courseUuid },
    });
    if (!course) throw new NotFoundException("Course not found");

    return this.prisma.quizAttempt.findMany({
      where: { student_id: studentId, course_id: course.id },
      orderBy: { created_at: "desc" },
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
    if (!attempt) throw new NotFoundException("Quiz attempt not found");
    if (attempt.student_id !== studentId)
      throw new ForbiddenException("Not your quiz attempt");
    return attempt;
  }

  // ─── Get All Attempts (teacher view) ─────────────────────────────────────

  async getCourseAttempts(courseUuid: string, query: QueryQuizAttemptDto) {
    const course = await this.prisma.course.findUnique({
      where: { uuid: courseUuid },
    });
    if (!course) throw new NotFoundException("Course not found");

    const { page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const [total, attempts] = await Promise.all([
      this.prisma.quizAttempt.count({ where: { course_id: course.id } }),
      this.prisma.quizAttempt.findMany({
        where: { course_id: course.id },
        skip,
        take: Number(limit),
        orderBy: { created_at: "desc" },
        include: {
          student: {
            select: {
              uuid: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return { page, limit, total, attempts };
  }

  // ─── Internal: notify student + teacher after quiz submit ─────────────────

  private async notifyOnSubmit(result: {
    studentId: number;
    courseTitle: string;
    courseUuid: string;
    teacher: { id: number; first_name: string; email: string } | null;
    attemptUuid: string;
    scorePercent: number;
    totalQuestions: number;
    correctAnswers: number;
    strongTopics: string[];
    weakTopics: string[];
    aiFeedback?: string;
  }) {
    // The course and its teacher were already loaded by the caller, so only
    // the student still has to be looked up here.
    const student = await this.prisma.user.findUnique({
      where: { id: result.studentId },
      select: { first_name: true, email: true },
    });
    const studentName = student?.first_name ?? "A student";

    // Email to student
    if (student) {
      this.notificationProducer
        .dispatchQuizCompleted({
          studentName: student.first_name,
          studentEmail: student.email,
          courseTitle: result.courseTitle,
          score: result.scorePercent,
          totalQuestions: result.totalQuestions,
          correctAnswers: result.correctAnswers,
          strongTopics: result.strongTopics,
          weakTopics: result.weakTopics,
          aiFeedback: result.aiFeedback,
        })
        .catch((error) =>
          this.logger.error("Failed quiz student email", error),
        );
    }

    // In-app notification + email to teacher
    const teacher = result.teacher;
    if (teacher) {
      const actionUrl = `/teacher/courses/${result.courseUuid}?tab=quiz`;

      await this.inAppNotification.create({
        userId: teacher.id,
        title: "Student Completed Quiz",
        message: `${studentName} scored ${result.scorePercent}% in "${result.courseTitle}"`,
        type: NotificationType.QUIZ_ATTEMPTED,
        actionUrl,
        extra: {
          courseUuid: result.courseUuid,
          attemptUuid: result.attemptUuid,
          score: result.scorePercent,
        },
      });

      this.notificationProducer
        .dispatchQuizAttemptedTeacher({
          teacherName: teacher.first_name,
          teacherEmail: teacher.email,
          studentName,
          courseTitle: result.courseTitle,
          courseUuid: result.courseUuid,
          attemptUuid: result.attemptUuid,
          score: result.scorePercent,
        })
        .catch((error) =>
          this.logger.error("Failed quiz teacher email", error),
        );
    }
  }
}
