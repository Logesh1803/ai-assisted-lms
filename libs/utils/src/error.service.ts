/**
 * Reads a human-readable message off a caught value.
 *
 * `catch` gives `unknown`, because anything can be thrown. This narrows it
 * safely instead of asserting the value is an Error.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}
