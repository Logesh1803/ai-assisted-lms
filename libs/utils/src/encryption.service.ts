// encryption.ts
import * as crypto from "crypto";

export function createEncryptor(secret: string) {
  const key = crypto.createHash("sha256").update(secret).digest();

  return {
    encrypt(text: string): string {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");

      const tag = cipher.getAuthTag();

      return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
    },

    decrypt(payload: string): string {
      const [ivHex, tagHex, encrypted] = payload.split(":");

      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        key,
        Buffer.from(ivHex, "hex"),
      );
      decipher.setAuthTag(Buffer.from(tagHex, "hex"));

      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    },
  };
}
