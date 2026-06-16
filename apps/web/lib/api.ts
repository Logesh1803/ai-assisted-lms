import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005/api/v1";

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
    return Promise.reject(new Error(Array.isArray(message) ? message[0] : message));
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { firstName: string; lastName?: string; email: string; password: string; role: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post<any, any>("/auth/login", data),
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, data: { email: string; password: string }) =>
    api.post(`/auth/reset-password/${token}`, data),
};

// ─── Courses ───────────────────────────────────────────────────────────────
export const coursesApi = {
  getAll: (params?: any) => api.get("/courses", { params }),
  getMine: (params?: any) => api.get("/courses/mine", { params }),
  getOne: (uuid: string) => api.get(`/courses/${uuid}`),
  create: (data: any) => api.post("/courses", data),
  generateFromPrompt: (prompt: string, syllabus?: string[]) =>
    api.post("/courses/generate-from-prompt", { prompt, syllabus }),
  update: (uuid: string, data: any) => api.put(`/courses/${uuid}`, data),
  changeStatus: (uuid: string, status: string) =>
    api.patch(`/courses/${uuid}/status`, { status }),
  delete: (uuid: string) => api.delete(`/courses/${uuid}`),
  getStudentPerformance: (uuid: string) =>
    api.get(`/courses/${uuid}/performance`),
};

// ─── Lessons ───────────────────────────────────────────────────────────────
export const lessonsApi = {
  getByCourse: (courseId: number) => api.get(`/lessons/course/${courseId}`),
  getOne: (id: number) => api.get(`/lessons/${id}`),
  create: (data: any) => api.post("/lessons", data),
  update: (id: number, data: any) => api.patch(`/lessons/${id}`, data),
  delete: (id: number) => api.delete(`/lessons/${id}`),
  uploadVideo: (id: number, file: File) => {
    const form = new FormData();
    form.append("video", file);
    return api.post(`/lessons/${id}/video`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteVideo: (id: number) => api.delete(`/lessons/${id}/video`),
  streamUrl: (id: number) => `${API_BASE}/lessons/${id}/stream`,
  generateNotes: (id: number) => api.post(`/lessons/${id}/notes/generate`),
  getNotes: (id: number) => api.get(`/lessons/${id}/notes`),
};

// ─── Enrollments ──────────────────────────────────────────────────────────
export const enrollmentsApi = {
  enroll: (courseUuid: string) => api.post(`/enrollments/${courseUuid}`),
  getMyEnrollments: (params?: any) => api.get("/enrollments/me", { params }),
  getCourseEnrollments: (courseUuid: string, params?: any) =>
    api.get(`/enrollments/course/${courseUuid}`, { params }),
  getOne: (uuid: string) => api.get(`/enrollments/${uuid}`),
  drop: (uuid: string) => api.delete(`/enrollments/${uuid}/drop`),
};

// ─── Lesson Progress ──────────────────────────────────────────────────────
export const progressApi = {
  markComplete: (lessonId: number) =>
    api.post(`/lesson-progress/${lessonId}/complete`),
  updateWatchTime: (lessonId: number, watchTime: number) =>
    api.patch(`/lesson-progress/${lessonId}/watch-time`, { watchTime }),
  getByEnrollment: (enrollmentUuid: string) =>
    api.get(`/lesson-progress/enrollment/${enrollmentUuid}`),
  getOne: (lessonId: number) => api.get(`/lesson-progress/${lessonId}`),
};

// ─── Quiz ─────────────────────────────────────────────────────────────────
export const quizApi = {
  generateQuestions: (courseUuid: string, data: any) =>
    api.post(`/quiz/${courseUuid}/generate-questions`, data),
  start: (courseUuid: string, data: any) =>
    api.post(`/quiz/${courseUuid}/start`, data),
  submit: (attemptUuid: string, data: any) =>
    api.post(`/quiz/attempt/${attemptUuid}/submit`, data),
  getMyAttempts: (courseUuid: string) =>
    api.get(`/quiz/${courseUuid}/my-attempts`),
  getAttempt: (attemptUuid: string) =>
    api.get(`/quiz/attempt/${attemptUuid}`),
  getAllAttempts: (courseUuid: string, params?: any) =>
    api.get(`/quiz/${courseUuid}/all-attempts`, { params }),
};

// ─── Video Analysis ───────────────────────────────────────────────────────
export const videoAnalysisApi = {
  analyze: (file: File) => {
    const form = new FormData();
    form.append("video", file);
    return api.post("/upload/analyze-video", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ─── AI Summary ──────────────────────────────────────────────────────────
export const summaryApi = {
  generate: (courseUuid: string) =>
    api.post(`/ai-summary/${courseUuid}/generate`),
  get: (courseUuid: string) => api.get(`/ai-summary/${courseUuid}`),
  generateStudentNotes: (courseUuid: string) =>
    api.post(`/ai-summary/${courseUuid}/my-notes`),
};

// ─── Discussion ───────────────────────────────────────────────────────────
export const discussionApi = {
  getThreads: (courseUuid: string, params?: any) =>
    api.get(`/discussion/courses/${courseUuid}/threads`, { params }),
  getThread: (threadUuid: string) =>
    api.get(`/discussion/threads/${threadUuid}`),
  createThread: (courseUuid: string, data: { title: string; content: string }) =>
    api.post(`/discussion/courses/${courseUuid}/threads`, data),
  deleteThread: (threadUuid: string) =>
    api.delete(`/discussion/threads/${threadUuid}`),
  pinThread: (threadUuid: string) =>
    api.patch(`/discussion/threads/${threadUuid}/pin`),
  createReply: (threadUuid: string, data: { content: string }) =>
    api.post(`/discussion/threads/${threadUuid}/replies`, data),
  deleteReply: (replyUuid: string) =>
    api.delete(`/discussion/replies/${replyUuid}`),
};

// ─── Course Notes ─────────────────────────────────────────────────────────
export const courseNotesApi = {
  upload: (courseUuid: string, data: { title: string; description?: string }, file?: File) => {
    const form = new FormData();
    form.append("title", data.title);
    if (data.description) form.append("description", data.description);
    if (file) form.append("file", file);
    return api.post(`/course-notes/${courseUuid}/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getByCourse: (courseUuid: string) => api.get(`/course-notes/${courseUuid}`),
  remove: (noteUuid: string) => api.delete(`/course-notes/${noteUuid}`),
};

// ─── Notifications ────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: () => api.get("/notifications"),
  markRead: (uuid: string) => api.patch(`/notifications/${uuid}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
};

// ─── Chatbot ──────────────────────────────────────────────────────────────
export const chatbotApi = {
  sendMessage: (data: { message: string; sessionUuid?: string; courseId?: number; courseContext?: string }) =>
    api.post("/chatbot/message", data),
  getSessions: () => api.get("/chatbot/sessions"),
  getSession: (uuid: string) => api.get(`/chatbot/sessions/${uuid}`),
  deleteSession: (uuid: string) => api.delete(`/chatbot/sessions/${uuid}`),
  explainConcept: (term: string, subjects: string[]) =>
    api.post("/chatbot/explain-concept", { term, subjects }),
};
