import { Injectable } from "@nestjs/common";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

@Injectable()
export class HashingProvider {
  private readonly keyLength = 64;

  hash(password: string): string {
    const salt = randomBytes(32).toString("hex");
    const derivedKey = scryptSync(password, salt, this.keyLength).toString(
      "hex",
    );
    return `${salt}:${derivedKey}`;
  }

  verify(password: string, hashedValue: string): boolean {
    const [salt, storedHash] = hashedValue.split(":");
    const derivedKey = scryptSync(password, salt, this.keyLength).toString(
      "hex",
    );

    return timingSafeEqual(
      Buffer.from(derivedKey, "hex"),
      Buffer.from(storedHash, "hex"),
    );
  }

  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
