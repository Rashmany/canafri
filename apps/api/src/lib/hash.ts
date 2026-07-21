import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * HashService — modular dual-algorithm hash utility.
 *
 * Development:  bcryptjs (cross-platform, no native compile required)
 * Production:   Swap to argon2 when deploying to Linux/Docker.
 *               The verify() method detects hash prefix automatically,
 *               so existing bcrypt hashes keep working after migration.
 *
 * Hash prefix detection:
 *   $2a$ / $2b$  → bcrypt
 *   $argon2id$   → argon2id (future)
 */
const BCRYPT_ROUNDS = 12;

export class HashService {
  // ── Password hashing ──────────────────────────────────────────────────────

  static async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }

  static async verifyPassword(plain: string, hash: string): Promise<boolean> {
    // Future argon2id migration hook — detect prefix
    if (hash.startsWith('$argon2id$')) {
      // TODO: import argon2 and call argon2.verify(hash, plain) once on Linux
      throw new Error('argon2id hashes are not supported in this environment.');
    }
    return bcrypt.compare(plain, hash);
  }

  // ── Refresh token hashing (SHA-256, constant time) ────────────────────────

  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static safeCompareTokens(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  // ── OTP generation ────────────────────────────────────────────────────────

  static generateOTP(digits = 6): string {
    const max = Math.pow(10, digits);
    const raw = crypto.randomInt(0, max);
    return raw.toString().padStart(digits, '0');
  }

  // ── Secure random token ───────────────────────────────────────────────────

  static generateToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }
}
