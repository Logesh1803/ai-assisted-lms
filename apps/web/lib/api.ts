import axios, { AxiosRequestConfig } from "axios";
import type {
  AiSummary,
  AppNotification,
  ChatReply,
  ChatSession,
  ConceptExplanation,
  Course,
  CourseDetail,
  CourseListResponse,
  CourseNote,
  DiscussionThread,
  Enrollment,
  EnrollmentListResponse,
  Lesson,
  LessonDetail,
  LessonNote,
  LessonProgress,
  ListQuery,
  LoginResponse,
  NotificationListResponse,
  QuizAttempt,
  QuizAttemptListResponse,
  QuizAnswer,
  QuizQuestion,
  StudentPerformance,
  ThreadListResponse,
  UserRole,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request — read from sessionStorage (tab-isolated)
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res.data?.data ?? res.data,
  (err) => {
    const message =
      err.response?.data?.message || err.message || "Something went wrong";
    if (err.response?.status === 401 && typeof window !== "undefined") {
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("auth-storage");
      window.location.href = "/auth/login";
    }
    return Promise.reject(
      new Error(Array.isArray(message) ? message[0] : message),
    );
  },
);

/**
 * The response interceptor above unwraps the envelope and hands back the
 * payload itself, not an AxiosResponse. These helpers state that, so callers
 * get the response type they actually receive instead of having to cast.
 */
const request = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    api.get(url, config) as unknown as Promise<T>,
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.post(url, data, config) as unknown as Promise<T>,
  put: <T>(url: string, data?: unknown) =>
    api.put(url, data) as unknown as Promise<T>,
  patch: <T>(url: string, data?: unknown) =>
    api.patch(url, data) as unknown as Promise<T>,
  delete: <T>(url: string) => api.delete(url) as unknown as Promise<T>,
};

const asFormData = (parts: Record<string, string | Blob | undefined>) => {
  const form = new FormData();
  for (const [key, value] of Object.entries(parts)) {
    if (value !== undefined) form.append(key, value);
  }
  return form;
};

const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: {
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
    role: UserRole | string;
  }) => request.post<{ uuid: string }>("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    request.post<LoginResponse>("/auth/login", data),
  forgotPassword: (email: string) =>
    request.post<{ success: boolean }>("/auth/forgot-password", { email }),
  resetPassword: (token: string, data: { email: string; password: string }) =>
    request.post<{ success: boolean }>(
      `/auth/reset-password/${encodeURIComponent(token)}`,
      // The API's SetNewPasswordDto also requires the token and its type in the body.
      { ...data, token, type: "PASSWORD_RESET" },
    ),
};

// ─── Courses ───────────────────────────────────────────────────────────────
export const coursesApi = {
  getAll: (params?: ListQuery) =>
    request.get<CourseListResponse>("/courses", { params }),
  getMine: (params?: ListQuery) =>
    request.get<CourseListResponse>("/courses/mine", { params }),
  getOne: (uuid: string) => request.get<CourseDetail>(`/courses/${uuid}`),
  create: (data: {
    title: string;
    description?: string;
    thumbnail?: string;
    tags?: string[];
  }) => request.post<Course>("/courses", data),
  generateFromPrompt: (prompt: string, syllabus?: string[]) =>
    request.post<CourseDetail>("/courses/generate-from-prompt", {
      prompt,
      syllabus,
    }),
  update: (
    uuid: string,
    data: Partial<Pick<Course, "title" | "description" | "thumbnail" | "tags">>,
  ) => request.put<Course>(`/courses/${uuid}`, data),
  changeStatus: (uuid: string, status: string) =>
    request.patch<Course>(`/courses/${uuid}/status`, { status }),
  delete: (uuid: string) => request.delete<Course>(`/courses/${uuid}`),
  getStudentPerformance: (uuid: string) =>
    request.get<StudentPerformance[]>(`/courses/${uuid}/performance`),
};

// ─── Lessons ───────────────────────────────────────────────────────────────
export const lessonsApi = {
  getByCourse: (courseId: number) =>
    request.get<Lesson[]>(`/lessons/course/${courseId}`),
  getOne: (id: number) => request.get<LessonDetail>(`/lessons/${id}`),
  // The API's CreateLessonDto uses snake_case for course_id and video_url.
  create: (data: {
    course_id: number;
    title: string;
    description?: string;
    content?: string;
    video_url?: string;
    order?: number;
    duration?: number;
  }) => request.post<Lesson>("/lessons", data),
  update: (
    id: number,
    data: Partial<
      Pick<Lesson, "title" | "description" | "content" | "order" | "duration">
    >,
  ) => request.patch<Lesson>(`/lessons/${id}`, data),
  delete: (id: number) => request.delete<Lesson>(`/lessons/${id}`),
  uploadVideo: (id: number, file: File) =>
    request.post<Lesson>(
      `/lessons/${id}/video`,
      asFormData({ video: file }),
      MULTIPART,
    ),
  deleteVideo: (id: number) =>
    request.delete<{ message: string }>(`/lessons/${id}/video`),
  streamUrl: (id: number) => `${API_BASE}/lessons/${id}/stream`,
  generateNotes: (id: number) =>
    request.post<LessonNote>(`/lessons/${id}/notes/generate`),
  getNotes: (id: number) => request.get<LessonNote>(`/lessons/${id}/notes`),
};

// ─── Enrollments ──────────────────────────────────────────────────────────
export const enrollmentsApi = {
  enroll: (courseUuid: string) =>
    request.post<Enrollment>(`/enrollments/${courseUuid}`),
  getMyEnrollments: (params?: ListQuery) =>
    request.get<EnrollmentListResponse>("/enrollments/me", { params }),
  getCourseEnrollments: (courseUuid: string, params?: ListQuery) =>
    request.get<EnrollmentListResponse>(`/enrollments/course/${courseUuid}`, {
      params,
    }),
  getOne: (uuid: string) => request.get<Enrollment>(`/enrollments/${uuid}`),
  drop: (uuid: string) => request.delete<Enrollment>(`/enrollments/${uuid}/drop`),
};

// ─── Lesson Progress ──────────────────────────────────────────────────────
export const progressApi = {
  markComplete: (lessonId: number) =>
    request.post<LessonProgress>(`/lesson-progress/${lessonId}/complete`),
  updateWatchTime: (lessonId: number, watchTime: number) =>
    request.patch<LessonProgress>(`/lesson-progress/${lessonId}/watch-time`, {
      watchTime,
    }),
  getByEnrollment: (enrollmentUuid: string) =>
    request.get<LessonProgress[]>(
      `/lesson-progress/enrollment/${enrollmentUuid}`,
    ),
  getOne: (lessonId: number) =>
    request.get<LessonProgress>(`/lesson-progress/${lessonId}`),
};

// ─── Quiz ─────────────────────────────────────────────────────────────────
export const quizApi = {
  generateQuestions: (
    courseUuid: string,
    data: { mcqCount?: number; shortAnswerCount?: number },
  ) =>
    request.post<{
      questions: QuizQuestion[];
      mcqCount: number;
      shortAnswerCount: number;
    }>(`/quiz/${courseUuid}/generate-questions`, data),
  start: (courseUuid: string, data: { questions: QuizQuestion[] }) =>
    request.post<QuizAttempt>(`/quiz/${courseUuid}/start`, data),
  submit: (attemptUuid: string, data: { answers: QuizAnswer[] }) =>
    request.post<QuizAttempt>(`/quiz/attempt/${attemptUuid}/submit`, data),
  getMyAttempts: (courseUuid: string) =>
    request.get<QuizAttempt[]>(`/quiz/${courseUuid}/my-attempts`),
  getAttempt: (attemptUuid: string) =>
    request.get<QuizAttempt & { questions: QuizQuestion[] }>(
      `/quiz/attempt/${attemptUuid}`,
    ),
  getAllAttempts: (courseUuid: string, params?: ListQuery) =>
    request.get<QuizAttemptListResponse>(`/quiz/${courseUuid}/all-attempts`, {
      params,
    }),
};

// ─── Video Analysis ───────────────────────────────────────────────────────
export const videoAnalysisApi = {
  analyze: (file: File) =>
    request.post<{ summary: string; key_points: string[] }>(
      "/upload/analyze-video",
      asFormData({ video: file }),
      MULTIPART,
    ),
};

// ─── AI Summary ──────────────────────────────────────────────────────────
export const summaryApi = {
  generate: (courseUuid: string) =>
    request.post<AiSummary>(`/ai-summary/${courseUuid}/generate`),
  get: (courseUuid: string) => request.get<AiSummary>(`/ai-summary/${courseUuid}`),
  // Returns freshly written notes, not a stored AiSummary row.
  generateStudentNotes: (courseUuid: string) =>
    request.post<{ notes: string }>(`/ai-summary/${courseUuid}/my-notes`),
};

// ─── Discussion ───────────────────────────────────────────────────────────
export const discussionApi = {
  getThreads: (courseUuid: string, params?: ListQuery) =>
    request.get<ThreadListResponse>(
      `/discussion/courses/${courseUuid}/threads`,
      { params },
    ),
  getThread: (threadUuid: string) =>
    request.get<DiscussionThread>(`/discussion/threads/${threadUuid}`),
  createThread: (courseUuid: string, data: { title: string; content: string }) =>
    request.post<DiscussionThread>(
      `/discussion/courses/${courseUuid}/threads`,
      data,
    ),
  deleteThread: (threadUuid: string) =>
    request.delete<{ deleted: boolean }>(`/discussion/threads/${threadUuid}`),
  pinThread: (threadUuid: string) =>
    request.patch<DiscussionThread>(`/discussion/threads/${threadUuid}/pin`),
  createReply: (threadUuid: string, data: { content: string }) =>
    request.post<DiscussionThread>(
      `/discussion/threads/${threadUuid}/replies`,
      data,
    ),
  deleteReply: (replyUuid: string) =>
    request.delete<{ deleted: boolean }>(`/discussion/replies/${replyUuid}`),
};

// ─── Course Notes ─────────────────────────────────────────────────────────
export const courseNotesApi = {
  upload: (
    courseUuid: string,
    data: { title: string; description?: string },
    file?: File,
  ) =>
    request.post<CourseNote>(
      `/course-notes/${courseUuid}/upload`,
      asFormData({
        title: data.title,
        description: data.description,
        file,
      }),
      MULTIPART,
    ),
  getByCourse: (courseUuid: string) =>
    request.get<CourseNote[]>(`/course-notes/${courseUuid}`),
  remove: (noteUuid: string) =>
    request.delete<CourseNote>(`/course-notes/${noteUuid}`),
};

// ─── Notifications ────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: () => request.get<NotificationListResponse>("/notifications"),
  markRead: (uuid: string) =>
    request.patch<AppNotification>(`/notifications/${uuid}/read`),
  markAllRead: () => request.patch<{ updated: number }>("/notifications/read-all"),
};

// ─── Chatbot ──────────────────────────────────────────────────────────────
export const chatbotApi = {
  sendMessage: (data: {
    message: string;
    sessionUuid?: string;
    courseId?: number;
    courseContext?: string;
  }) =>
    request.post<ChatReply>("/chatbot/message", data),
  getSessions: () => request.get<ChatSession[]>("/chatbot/sessions"),
  getSession: (uuid: string) =>
    request.get<ChatSession>(`/chatbot/sessions/${uuid}`),
  deleteSession: (uuid: string) =>
    request.delete<{ message: string }>(`/chatbot/sessions/${uuid}`),
  explainConcept: (term: string, subjects: string[]) =>
    request.post<ConceptExplanation[]>("/chatbot/explain-concept", {
      term,
      subjects,
    }),
};
