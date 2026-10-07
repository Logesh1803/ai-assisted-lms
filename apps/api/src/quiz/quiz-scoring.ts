import { QuestionType } from "./dto/quiz.dto";

/**
 * A topic counts as "strong" once the student earns at least this share of
 * the points available for it. Anything below is reported as a weak topic.
 */
export const STRONG_TOPIC_THRESHOLD = 0.7;

/** One question as it was stored on the quiz attempt. */
export interface ScorableQuestion {
  id: number;
  topic: string;
  type: QuestionType;
  correct_answer?: string;
}

/**
 * A question exactly as it was stored on the attempt. Scoring itself only
 * needs the fields in ScorableQuestion; the extra ones here are what the AI
 * needs in order to grade a written answer.
 */
export interface StoredQuizQuestion extends ScorableQuestion {
  question: string;
  correct_answer: string;
  options?: string[];
  keywords?: string[];
}

/** One answer as the student submitted it. */
export interface SubmittedAnswer {
  questionId: number;
  answer: string;
}

/** The AI's verdict on a single written answer, scored 0..1. */
export interface WrittenAnswerGrade {
  id: number;
  score: number;
}

export interface QuizScore {
  /** Points earned, where a multiple-choice question is worth 1 point. */
  pointsEarned: number;
  /** Points earned rounded to a whole number of questions. */
  correctAnswerCount: number;
  /** Overall score as a whole percentage, 0..100. */
  scorePercent: number;
  /** Topics the student scored at or above STRONG_TOPIC_THRESHOLD on. */
  strongTopics: string[];
  /** Topics the student scored below STRONG_TOPIC_THRESHOLD on. */
  weakTopics: string[];
}

/**
 * Works out a student's quiz score.
 *
 * Kept free of database and AI calls so the marking rules can be read and
 * tested on their own. The caller is responsible for grading written answers
 * with the AI first and passing the results in as `writtenAnswerGrades`.
 *
 * Answers are indexed by question id up front, so finding a question's answer
 * is one hash lookup rather than a fresh scan through every answer. That keeps
 * the work proportional to (questions + answers) instead of
 * (questions x answers).
 */
export function scoreQuizAttempt(
  questions: ScorableQuestion[],
  answers: SubmittedAnswer[],
  writtenAnswerGrades: WrittenAnswerGrade[],
): QuizScore {
  if (questions.length === 0) {
    throw new Error("Cannot score a quiz attempt with no questions");
  }

  const answersByQuestionId = new Map(
    answers.map((answer) => [answer.questionId, answer]),
  );
  const gradesByQuestionId = new Map(
    writtenAnswerGrades.map((grade) => [grade.id, grade]),
  );

  let pointsEarned = 0;
  const scoreByTopic = new Map<
    string,
    { pointsEarned: number; questionCount: number }
  >();

  for (const question of questions) {
    let topicScore = scoreByTopic.get(question.topic);
    if (!topicScore) {
      topicScore = { pointsEarned: 0, questionCount: 0 };
      scoreByTopic.set(question.topic, topicScore);
    }
    topicScore.questionCount += 1;

    let pointsForQuestion = 0;
    if (question.type === QuestionType.SHORT_ANSWER) {
      pointsForQuestion = toGradePoints(
        gradesByQuestionId.get(question.id)?.score,
      );
    } else {
      // Multiple choice — the answer has to match exactly
      const studentAnswer = answersByQuestionId.get(question.id);
      pointsForQuestion =
        studentAnswer?.answer === question.correct_answer ? 1 : 0;
    }

    pointsEarned += pointsForQuestion;
    topicScore.pointsEarned += pointsForQuestion;
  }

  const strongTopics: string[] = [];
  const weakTopics: string[] = [];
  for (const [topic, topicScore] of scoreByTopic) {
    const topicShare = topicScore.pointsEarned / topicScore.questionCount;
    if (topicShare >= STRONG_TOPIC_THRESHOLD) strongTopics.push(topic);
    else weakTopics.push(topic);
  }

  return {
    pointsEarned,
    correctAnswerCount: Math.round(pointsEarned),
    scorePercent: Math.round((pointsEarned / questions.length) * 100),
    strongTopics,
    weakTopics,
  };
}

/**
 * The AI's grade is untrusted JSON: it can come back as a string, out of
 * range, or missing. Turn it into a number from 0 to 1.
 */
function toGradePoints(score: unknown): number {
  const points = Number(score);
  if (!Number.isFinite(points)) return 0;
  return Math.min(1, Math.max(0, points));
}
