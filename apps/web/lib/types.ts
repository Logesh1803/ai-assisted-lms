/**
 * Shapes returned by the API.
 *
 * Two things to know about how the backend serialises data:
 *
 * 1. Field names stay exactly as they are in the database — `created_at`, not
 *    `createdAt`. Nothing converts them. A few endpoints deliberately reshape
 *    their output into camelCase; those have their own types below and say so.
 *
 * 2. Every timestamp is a `BigInt` in the database, and `BigInt.prototype
 *    .toJSON` in the API turns it into a **string**. So timestamps arrive as
 *    strings of milliseconds, e.g. "1757030400000", never as numbers.
 */

/** Milliseconds since the epoch, as the string the API sends. */
export type Timestamp = string;

export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";
export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "DROPPED";
export type NotificationType = "QUIZ_ATTEMPTED" | "COURSE_NOTE_UPLOADED";

/** The trimmed user shape most endpoints embed alongside their own data. */
export interface UserSummary {
  uuid: string;
  first_name: string;
  last_name?: string | null;
  email?: string;
  role?: UserRole;
}

export interface RelationCounts {
  lessons?: number;
  enrollments?: number;
}

export interface Course {
  id?: number;
  uuid: string;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  status: CourseStatus;
  tags: string[];
  teacher_id?: number;
  created_at: Timestamp;
  updated_at?: Timestamp | null;
  teacher?: UserSummary;
  _count?: RelationCounts;
  /** Present only on the teacher's own course list. */
  quizAttemptCount?: number;
}

export interface Lesson {
  id: number;
  uuid: string;
  course_id?: number;
  title: string;
  description?: string | null;
  content?: string | null;
  video_url?: string | null;
  order: number;
  duration?: number | null;
  created_at?: Timestamp;
}

/**
 * `GET /lessons/:id` — a lesson plus its course and, for a signed-in student,
 * their progress rows. `progress` is a list (Prisma relation), so the current
 * student's row is `progress[0]`, not `progress` itself.
 */
export interface LessonDetail extends Lesson {
  course?: Course & { teacher?: UserSummary };
  progress?: LessonProgress[];
}

/** `GET/POST /lessons/:id/notes` — AI study notes saved against a lesson. */
export interface LessonNote {
  uuid: string;
  lesson_id: number;
  content: string;
  created_at: Timestamp;
  updated_at?: Timestamp | null;
}

export interface AiSummary {
  summary: string;
  key_points: string[];
  updated_at?: Timestamp | null;
}

/** `GET /courses/:uuid` — a course with its lessons and the viewer's context. */
export interface CourseDetail extends Course {
  /** `findOne` returns the whole row, so the numeric id is always present. */
  id: number;
  lessons: Lesson[];
  summaries?: AiSummary[];
  isEnrolled: boolean;
  enrollmentUuid: string | null;
  enrollmentProgress: number;
}

export interface QuizAttempt {
  uuid: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  strong_topics: string[];
  weak_topics: string[];
  ai_feedback?: string | null;
  /** Present on the teacher's attempt list, which returns the whole row. */
  questions?: QuizQuestion[];
  answers?: QuizAnswer[];
  started_at: Timestamp;
  submitted_at?: Timestamp | null;
  created_at?: Timestamp;
  student?: UserSummary;
}

export interface Enrollment {
  id?: number;
  uuid: string;
  student_id?: number;
  course_id?: number;
  status: EnrollmentStatus;
  progress: number;
  enrolled_at: Timestamp;
  completed_at?: Timestamp | null;
  created_at: Timestamp;
  course?: Course;
  student?: UserSummary;
  quiz_attempts?: QuizAttempt[];
  lesson_progress?: LessonProgress[];
}

export interface LessonProgress {
  lesson_id: number;
  is_completed: boolean;
  watch_time: number;
  completed_at?: Timestamp | null;
  lesson?: Pick<Lesson, "id" | "title" | "order" | "duration">;
}

/**
 * `GET /courses/:uuid/performance` — one of the few endpoints that reshapes
 * its output, so these keys really are camelCase.
 */
export interface StudentPerformance {
  student: UserSummary;
  status: EnrollmentStatus;
  progress: number;
  enrolledAt: Timestamp;
  completedAt?: Timestamp | null;
  latestQuizScore: number | null;
  lessonsCompleted: number;
}

export type QuestionType = "MCQ" | "SHORT_ANSWER";

export interface QuizQuestion {
  id: number;
  question: string;
  type: QuestionType;
  topic: string;
  options?: string[];
  correct_answer?: string;
  keywords?: string[];
}

export interface QuizAnswer {
  questionId: number;
  answer: string;
}

export interface DiscussionUser {
  first_name?: string;
  last_name?: string;
  role?: UserRole;
}

export interface DiscussionReply {
  uuid: string;
  content: string;
  created_at: Timestamp;
  user?: DiscussionUser;
}

export interface DiscussionThread {
  uuid: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: Timestamp;
  user?: DiscussionUser;
  _count?: { replies: number };
  replies?: DiscussionReply[];
}

export interface CourseNote {
  uuid: string;
  title: string;
  description?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: string | null;
  file_type?: string | null;
  created_at: Timestamp;
}

export interface AppNotification {
  uuid: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: Timestamp;
  data?: { actionUrl?: string; courseUuid?: string; [key: string]: unknown };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: Timestamp;
}

export interface ChatSession {
  uuid: string;
  title?: string | null;
  course_id?: number | null;
  created_at: Timestamp;
  updated_at?: Timestamp | null;
  messages?: ChatMessage[];
  _count?: { messages: number };
}

/** `POST /chatbot/message` — note the field is `message`, not `reply`. */
export interface ChatReply {
  sessionUuid: string;
  message: string;
}

/** One subject's take on a term, from `POST /chatbot/explain-concept`. */
export interface ConceptExplanation {
  subject: string;
  explanation: string;
  analogy: string;
  example: string;
  visual: string;
  steps: string[];
}

export interface AuthUser {
  uuid: string;
  firstName: string;
  lastName?: string;
  email: string;
  role: UserRole;
}

/** `POST /auth/login` — this endpoint returns camelCase. */
export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

/** Envelope shared by every paginated list endpoint. */
export interface PageInfo {
  page: number;
  limit: number;
  total: number;
}

export type CourseListResponse = PageInfo & { courses: Course[] };
export type EnrollmentListResponse = PageInfo & { enrollments: Enrollment[] };
export type QuizAttemptListResponse = PageInfo & { attempts: QuizAttempt[] };
export type ThreadListResponse = PageInfo & {
  threads: DiscussionThread[];
};

export interface NotificationListResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

/** Query parameters accepted by the paginated list endpoints. */
export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  tags?: string | string[];
}
