/**
 * Converts API/technical error messages into plain, user-friendly language.
 * Add new entries below whenever you encounter a new backend error.
 */

// Map of keywords → user-friendly message
const ERROR_MAP: Array<{ match: string; message: string }> = [
  // Auth errors
  { match: "invalid credentials",         message: "Wrong email or password. Please check and try again." },
  { match: "email already exists",         message: "This email is already registered. Try signing in instead." },
  { match: "user not found",               message: "We couldn't find an account with that email." },
  { match: "invalid or expired",           message: "This link has expired. Please request a new one." },
  { match: "token",                        message: "Your session has expired. Please sign in again." },

  // Permission errors
  { match: "unauthorized",                 message: "You need to sign in to access this." },
  { match: "forbidden",                    message: "You don't have permission to do this." },
  { match: "not your course",              message: "You can only manage your own courses." },

  // Course errors
  { match: "course not found",             message: "This course doesn't exist or has been removed." },
  { match: "already enrolled",             message: "You are already enrolled in this course." },
  { match: "not enrolled",                 message: "You need to enroll in this course first." },
  { match: "course is not published",      message: "This course is not available for enrollment yet." },

  // Lesson errors
  { match: "lesson not found",             message: "This lesson doesn't exist or has been removed." },

  // File upload errors
  { match: "file too large",               message: "The file is too large. Please choose a file under the size limit." },
  { match: "invalid file type",            message: "This file type isn't supported. Please upload a video file." },
  { match: "no file",                      message: "Please select a file before uploading." },
  { match: "multer",                       message: "There was a problem with your file upload. Please try again." },

  // Network / server errors
  { match: "network error",                message: "Can't connect to the server. Please check your internet and try again." },
  { match: "econnrefused",                 message: "The server is not responding. Please try again in a moment." },
  { match: "internal server error",        message: "Something went wrong on our end. Please try again in a moment." },
  { match: "service unavailable",          message: "The service is temporarily down. Please try again shortly." },

  // AI / Gemini errors
  { match: "ai",                           message: "The AI feature is temporarily unavailable. Please try again later." },
  { match: "gemini",                       message: "The AI service is temporarily unavailable. Please try again later." },
  { match: "quota",                        message: "The AI service is busy. Please wait a moment and try again." },

  // Quiz errors
  { match: "quiz attempt not found",       message: "This quiz attempt doesn't exist." },
  { match: "already submitted",            message: "You have already submitted this quiz." },
];

/**
 * Returns a user-friendly error message.
 * Falls back to the original message if no match is found.
 */
export function getFriendlyError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "Something went wrong.";

  const lower = raw.toLowerCase();

  for (const { match, message } of ERROR_MAP) {
    if (lower.includes(match)) return message;
  }

  // If the message looks like a technical error (has stack traces, IDs, etc.),
  // return a generic message instead of showing it raw.
  if (lower.includes("prisma") || lower.includes("sql") || lower.includes("exception")) {
    return "Something went wrong. Please try again.";
  }

  return raw || "Something went wrong. Please try again.";
}
