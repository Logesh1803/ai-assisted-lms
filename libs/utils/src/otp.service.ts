import {
  pbkdf2Sync,
  randomBytes,
} from "crypto";

export function verifyOtp(otp: string, stored: string) {
  otp = otp.trim();
  const [salt, hash] = stored.split(":");
  console.log(salt, hash);
  const verifyHash = pbkdf2Sync(otp, salt, 100_000, 32, "sha256").toString(
    "hex",
  );
  return hash === verifyHash;
}

export function hashOtp(otp: string) {
  otp = otp.trim();
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(otp, salt, 100_000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
