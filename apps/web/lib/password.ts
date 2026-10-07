import { z } from "zod";

/**
 * The password rule for every form that sets a password. It enforces
 * everything the API's StrongPasswordDto (validator.js isStrongPassword)
 * checks, so the API never rejects a password the form accepted.
 */
export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/\d/, "Password must contain a number")
  // Same symbol set as validator.js isStrongPassword.
  .regex(/[-#!$@£%^&*()_+|~=`{}[\]:";'<>?,./\\ ]/, "Password must contain a symbol");

/** Hint shown under every new-password field. */
export const STRONG_PASSWORD_HINT =
  "At least 8 characters with upper and lower case letters, a number and a symbol.";
