import { Injectable } from "@nestjs/common";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const deriveKey = promisify(scrypt) as (
  password: string,
  salt: string,
  keyLength: number,
) => Promise<Buffer>;

@Injectable()
export class HashingProvider {
  private readonly keyLength = 64;

  /**
   * Hashes a password for storage, returning "salt:derivedKey".
   *
   * scrypt is deliberately slow, which is what makes it a good password hash.
   * The async form is used on purpose: the synchronous one would block Node's
   * event loop for the whole derivation, so every other request in flight
   * would stall behind each login and registration.
   */
  async hash(password: string): Promise<string> {
    const salt = randomBytes(32).toString("hex");
    const derivedKey = await deriveKey(password, salt, this.keyLength);
    return `${salt}:${derivedKey.toString("hex")}`;
  }

  /** Checks a password against a stored "salt:derivedKey" value. */
  async verify(password: string, hashedValue: string): Promise<boolean> {
    const [salt, storedHash] = hashedValue.split(":");
    // A value not in "salt:hash" form (e.g. a bcrypt hash or plain text from an
    // import) can never match — treat it as a wrong password, not a server error.
    if (!salt || !storedHash) return false;

    const derivedKey = await deriveKey(password, salt, this.keyLength);
    const storedKey = Buffer.from(storedHash, "hex");

    // timingSafeEqual throws if the two buffers differ in length, which would
    // happen on a malformed stored value rather than a wrong password.
    if (derivedKey.length !== storedKey.length) return false;

    return timingSafeEqual(derivedKey, storedKey);
  }

  /**
   * Hashes a one-time token for storage. Plain SHA-256 is right here: the
   * token is already long and random, so there is nothing to brute-force and
   * no reason to spend the cost of a slow KDF. Synchronous by design — it
   * takes microseconds.
   */
  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
