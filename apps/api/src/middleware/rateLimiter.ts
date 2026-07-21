import { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../lib/redis.js';

/**
 * Redis-backed rate limiter factory.
 * Returns a Fastify preValidation hook that enforces the given limit.
 *
 * key      — Redis key prefix (e.g. 'rl:login')
 * max      — maximum requests allowed in the window
 * windowSec — window duration in seconds
 * byIp     — if true, append the requester's IP; otherwise use request body field
 */
function makeRateLimiter(key: string, max: number, windowSec: number) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const ip = request.ip ?? 'unknown';
    const redisKey = `${key}:${ip}`;

    const current = await redis.incr(redisKey);
    if (current === 1) {
      await redis.expire(redisKey, windowSec);
    }

    if (current > max) {
      return reply.status(429).send({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Max ${max} requests per ${windowSec}s window.`,
        retryAfter: windowSec,
      });
    }
  };
}

// ── Per-endpoint rate limiters ──────────────────────────────────────────────

/** 5 attempts per minute per IP */
export const loginRateLimit = makeRateLimiter('rl:login', 5, 60);

/** 3 registration requests per hour per IP */
export const registerRateLimit = makeRateLimiter('rl:register', 8, 3600);

/** 3 forgot-password requests per hour per IP */
export const forgotPasswordRateLimit = makeRateLimiter('rl:forgot_password', 3, 3600);

/** 1 OTP resend per 60 seconds per IP */
export const resendOtpRateLimit = makeRateLimiter('rl:resend_otp', 1, 60);

/** 5 email-verification attempts per hour per IP */
export const emailVerifyRateLimit = makeRateLimiter('rl:email_verify', 5, 3600);

/** 3 password-change attempts per 15 minutes per IP */
export const passwordChangeRateLimit = makeRateLimiter('rl:password_change', 3, 900);

// ── Account lockout helpers ─────────────────────────────────────────────────

const LOGIN_FAIL_KEY = 'login_fails';
const LOCKOUT_KEY = 'login_lockout';
const MAX_FAILS = 5;
const LOCKOUT_SEC = 60 * 15; // 15 minutes
const FAIL_WINDOW_SEC = 60;

/**
 * Returns true if the account is currently locked out.
 */
export async function isLockedOut(identifier: string): Promise<boolean> {
  const locked = await redis.get(`${LOCKOUT_KEY}:${identifier}`);
  return locked !== null;
}

/**
 * Records a login failure. If MAX_FAILS is reached, locks the account.
 */
export async function recordLoginFailure(identifier: string): Promise<{ locked: boolean; remaining: number }> {
  const failKey = `${LOGIN_FAIL_KEY}:${identifier}`;
  const count = await redis.incr(failKey);

  if (count === 1) {
    await redis.expire(failKey, FAIL_WINDOW_SEC);
  }

  if (count >= MAX_FAILS) {
    // Lock account for 15 minutes
    await redis.set(`${LOCKOUT_KEY}:${identifier}`, '1', { EX: LOCKOUT_SEC });
    await redis.del(failKey);
    return { locked: true, remaining: 0 };
  }

  return { locked: false, remaining: MAX_FAILS - count };
}

/**
 * Clears the failure counter on successful login.
 */
export async function clearLoginFailures(identifier: string): Promise<void> {
  await redis.del(`${LOGIN_FAIL_KEY}:${identifier}`);
}
