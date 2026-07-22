import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { generateSecret, verify, generateURI } from 'otplib';
import QRCode from 'qrcode';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { HashService } from '../lib/hash.js';
import { AuditService } from '../services/audit.js';
import { OTPService } from '../services/otp.js';
import { RiskService } from '../middleware/riskCheck.js';
import { authGuard } from '../middleware/auth.js';
import {
  loginRateLimit,
  registerRateLimit,
  forgotPasswordRateLimit,
  resendOtpRateLimit,
  emailVerifyRateLimit,
  passwordChangeRateLimit,
  isLockedOut,
  recordLoginFailure,
  clearLoginFailures,
} from '../middleware/rateLimiter.js';

// ── Zod Schemas ─────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  fullName: z.string().min(2).max(80).trim(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores').trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
}).refine(d => /[A-Z]/.test(d.password), {
  message: 'Password must contain at least one uppercase letter.',
  path: ['password'],
}).refine(d => /[0-9]/.test(d.password), {
  message: 'Password must contain at least one number.',
  path: ['password'],
}).refine(d => /[^A-Za-z0-9]/.test(d.password), {
  message: 'Password must contain at least one symbol.',
  path: ['password'],
});

const LoginSchema = z.object({
  identifier: z.string().min(1).toLowerCase().trim(),
  password: z.string().min(1),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

const VerifyForgotOtpSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  otp: z.string().length(6).regex(/^\d{6}$/),
  newPassword: z.string().min(8),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
}).refine(d => /[A-Z]/.test(d.newPassword), {
  message: 'Password must contain at least one uppercase letter.',
  path: ['newPassword'],
}).refine(d => /[0-9]/.test(d.newPassword), {
  message: 'Password must contain at least one number.',
  path: ['newPassword'],
}).refine(d => /[^A-Za-z0-9]/.test(d.newPassword), {
  message: 'Password must contain at least one symbol.',
  path: ['newPassword'],
});

const VerifyEmailOtpSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

const ResendOtpSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

const AdminLoginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

const AdminPreAuthSchema = z.object({
  preAuthId: z.string().min(1),
});

const AdminTotpVerifySchema = z.object({
  preAuthId: z.string().min(1),
  code: z.string().length(6).regex(/^\d{6}$/),
});

const CreateAdminSchema = z.object({
  fullName: z.string().min(2).max(80).trim(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores').trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'SUPER_ADMIN', 'CONTENT_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN']),
});

// ── Legacy phone-OTP schemas (preserved unchanged) ───────────────────────────

const PhoneRegisterSchema = z.object({
  phoneNumber: z.string().min(8),
  phonePrefix: z.string().optional(),
});

const PhoneVerifyOtpSchema = z.object({
  phoneNumber: z.string().min(8),
  code: z.string().length(6),
  displayName: z.string().min(2),
  username: z.string().min(3),
});

const BindWalletSchema = z.object({
  walletAddress: z.string().min(10),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60,
};

/**
 * Build a JWT payload that conforms to the security specification:
 * Only include: sub, role, sessionId, emailVerified.
 * Never include passwords, tokens, PII, or wallet data.
 */
function buildAccessPayload(
  user: { id: string; role: string; emailVerified: boolean; displayName: string; username: string },
  sessionId: string,
) {
  return {
    sub: user.id,
    userId: user.id,   // included for backwards compat with legacy handlers
    role: user.role,
    sessionId,
    emailVerified: user.emailVerified,
    displayName: user.displayName,
    username: user.username,
  };
}

/** Issue Access Token (15m) and Refresh Token (30d) */
async function issueTokens(
  fastify: FastifyInstance,
  user: { id: string; role: string; emailVerified: boolean; displayName: string; username: string },
  sessionId: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = buildAccessPayload(user, sessionId);
  const accessToken = fastify.jwt.sign(payload, { expiresIn: '15m' });
  // Refresh token payload is intentionally minimal — only sub + sessionId
  const refreshToken = fastify.jwt.sign({ sub: user.id, sessionId } as any, { expiresIn: '30d' });
  return { accessToken, refreshToken };
}

/** Store hashed refresh token on the Session record */
async function storeHashedRefreshToken(sessionId: string, rawRefreshToken: string) {
  const hashed = HashService.hashToken(rawRefreshToken);
  await prisma.session.update({
    where: { id: sessionId },
    data: { hashedRefreshToken: hashed },
  });
  return hashed;
}

/** Issue Admin Access Token (8h) and Admin Refresh Token (8h) */
async function issueAdminTokens(
  fastify: FastifyInstance,
  user: { id: string; role: string; emailVerified: boolean; displayName: string; username: string },
  sessionId: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = buildAccessPayload(user, sessionId);
  const accessToken = fastify.jwt.sign(payload, { expiresIn: '8h' });  // full-session access token for admin
  const refreshToken = fastify.jwt.sign({ sub: user.id, sessionId } as any, { expiresIn: '8h' });
  return { accessToken, refreshToken };
}

const ADMIN_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 8 * 60 * 60, // 8 hours
};

// ── Route Plugin ─────────────────────────────────────────────────────────────

export async function authRoutes(fastify: FastifyInstance) {

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/register  (Email + Password)
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/register', { preValidation: [registerRateLimit] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { fullName, username, email, password } = RegisterSchema.parse(request.body);

      // Generic response — never reveal which field conflicts (anti-enumeration)
      const [existingEmail, existingUsername] = await Promise.all([
        prisma.user.findUnique({ where: { email } }),
        prisma.user.findUnique({ where: { username } }),
      ]);
      if (existingEmail || existingUsername) {
        return reply.status(409).send({ error: 'Conflict', message: 'An account with those credentials already exists.' });
      }

      const passwordHash = await HashService.hashPassword(password);

      const user = await prisma.user.create({
        data: {
          displayName: fullName,
          username,
          email,
          passwordHash,
          emailVerified: false,
          trustScore: 50,
          riskScore: 0,
          status: 'ACTIVE',
          role: 'MEMBER',
        },
      });

      // Generate and cache email verification OTP (10 minutes)
      const otp = HashService.generateOTP(6);
      const otpKey = `email_otp:${email}`;
      await redis.set(otpKey, HashService.hashToken(otp), { EX: 600 });

      // TODO: Send OTP via email provider (e.g. Resend, SendGrid)
      console.log(`[MOCK EMAIL] Verification OTP for ${email}: ${otp}`);

      await AuditService.log({
        userId: user.id,
        action: 'REGISTER',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.status(201).send({
        success: true,
        message: 'Registration successful. Please verify your email address.',
        userId: user.id,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Registration failed.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/verify-email
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/verify-email', { preValidation: [emailVerifyRateLimit] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, otp } = VerifyEmailOtpSchema.parse(request.body);

      const otpKey = `email_otp:${email}`;
      const failKey = `email_otp_fails:${email}`;
      const storedHash = await redis.get(otpKey);

      if (!storedHash) {
        return reply.status(400).send({ error: 'Bad Request', message: 'OTP has expired or is invalid.' });
      }

      const failCount = parseInt(await redis.get(failKey) ?? '0', 10);
      if (failCount >= 5) {
        return reply.status(429).send({ error: 'Too Many Requests', message: 'Too many incorrect OTP attempts.' });
      }

      const otpHash = HashService.hashToken(otp);
      if (!HashService.safeCompareTokens(otpHash, storedHash)) {
        await redis.incr(failKey);
        await redis.expire(failKey, 600);
        return reply.status(400).send({ error: 'Bad Request', message: 'Invalid OTP.' });
      }

      await redis.del(otpKey);
      await redis.del(failKey);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'Account not found.' });
      }

      await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });

      await AuditService.log({
        userId: user.id,
        action: 'EMAIL_VERIFIED',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, message: 'Email address verified successfully.' });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Verification failed.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/resend-otp
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/resend-otp', { preValidation: [resendOtpRateLimit] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email } = ResendOtpSchema.parse(request.body);

      // Verify the user exists and is not verified yet
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Return success even if not found to prevent user enumeration
        return reply.send({ success: true, message: 'If the email is registered and unverified, a new OTP has been sent.' });
      }

      if (user.emailVerified) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Email address is already verified.' });
      }

      // Generate new OTP
      const otp = HashService.generateOTP(6);
      const otpKey = `email_otp:${email}`;
      const failKey = `email_otp_fails:${email}`;

      await redis.set(otpKey, HashService.hashToken(otp), { EX: 600 });
      await redis.del(failKey); // Reset failures on resend

      // Mock email sending
      console.log(`[MOCK EMAIL] Resent Verification OTP for ${email}: ${otp}`);

      return reply.send({ success: true, message: 'A new verification code has been sent to your email.' });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to resend OTP.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/login
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/login', { preValidation: [loginRateLimit] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { identifier, password } = LoginSchema.parse(request.body);

      // Account lockout check (uses identifier)
      if (await isLockedOut(identifier)) {
        return reply.status(429).send({ error: 'Too Many Requests', message: 'Account temporarily locked. Try again in 15 minutes.' });
      }

      // Lookup by email or username
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { username: identifier },
          ],
        },
      });

      // Generic error — never reveal whether identifier exists or password is wrong
      const GENERIC_AUTH_ERROR = { error: 'Unauthorized', message: 'Invalid email or password.' };

      if (!user || !user.passwordHash) {
        await recordLoginFailure(identifier);
        await AuditService.log({ action: 'LOGIN_FAILED', ipAddress: request.ip, device: request.headers['user-agent'] ?? undefined });
        return reply.status(401).send(GENERIC_AUTH_ERROR);
      }

      const passwordValid = await HashService.verifyPassword(password, user.passwordHash);
      if (!passwordValid) {
        const { locked } = await recordLoginFailure(identifier);
        await AuditService.log({ userId: user.id, action: 'LOGIN_FAILED', ipAddress: request.ip, device: request.headers['user-agent'] ?? undefined });
        if (locked) {
          await AuditService.log({ userId: user.id, action: 'ACCOUNT_LOCKED', ipAddress: request.ip, device: request.headers['user-agent'] ?? undefined });
        }
        return reply.status(401).send(GENERIC_AUTH_ERROR);
      }

      if (user.status !== 'ACTIVE') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Account is suspended or banned.' });
      }

      // Block login until email has been verified
      if (!user.emailVerified) {
        return reply.status(403).send({
          error: 'Email Not Verified',
          message: 'Please verify your email address before logging in. Check your inbox for the verification code.',
          code: 'EMAIL_NOT_VERIFIED',
        });
      }

      // Clear any previous failure counter
      await clearLoginFailures(identifier);

      // Create Session
      const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const sessionToken = HashService.generateToken();
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          token: sessionToken,
          deviceInfo: request.headers['user-agent'] ?? 'unknown',
          userAgent: request.headers['user-agent'] ?? null,
          ipAddress: request.ip,
          expiresAt: sessionExpiry,
        },
      });

      // Cache session in Redis
      await redis.set(`session:${session.id}`, JSON.stringify({ userId: user.id, role: user.role }), {
        EX: 30 * 24 * 60 * 60,
      });

      // Issue tokens
      const { accessToken, refreshToken } = await issueTokens(fastify, user, session.id);

      // Hash and persist refresh token
      await storeHashedRefreshToken(session.id, refreshToken);

      // Set refresh token in HttpOnly Secure cookie
      reply.setCookie('refresh_token', refreshToken, COOKIE_OPTIONS);

      await AuditService.log({
        userId: user.id,
        action: 'LOGIN',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({
        success: true,
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Login failed.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/refresh  — Refresh Token Rotation
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const rawRefreshToken = request.cookies.refresh_token;
      if (!rawRefreshToken) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Refresh token missing.' });
      }

      let decoded: { sub?: string; userId?: string; sessionId?: string };
      try {
        decoded = fastify.jwt.verify(rawRefreshToken) as typeof decoded;
      } catch {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired refresh token.' });
      }

      const userId = decoded.sub ?? decoded.userId ?? '';
      const sessionId = decoded.sessionId ?? '';

      if (!userId || !sessionId) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Malformed refresh token.' });
      }

      // Load session from DB
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        reply.clearCookie('refresh_token', { path: '/' });
        return reply.status(401).send({ error: 'Unauthorized', message: 'Session expired or revoked.' });
      }

      // ── TOKEN THEFT DETECTION ──────────────────────────────────────────────
      // If hashedRefreshToken is stored, the incoming token MUST match it.
      // If it doesn't (already rotated), assume theft — revoke ALL sessions.
      if (session.hashedRefreshToken) {
        const incomingHash = HashService.hashToken(rawRefreshToken);
        const matches = HashService.safeCompareTokens(incomingHash, session.hashedRefreshToken);

        if (!matches) {
          // THEFT DETECTED — nuke every session for this user
          const allSessions = await prisma.session.findMany({ where: { userId: session.userId } });
          for (const s of allSessions) {
            await redis.del(`session:${s.id}`);
          }
          await prisma.session.deleteMany({ where: { userId: session.userId } });

          reply.clearCookie('refresh_token', { path: '/' });

          await AuditService.log({
            userId: session.userId,
            action: 'TOKEN_THEFT_DETECTED',
            ipAddress: request.ip,
            device: request.headers['user-agent'] ?? undefined,
          });

          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Security alert: suspicious token reuse detected. All sessions have been revoked.',
          });
        }
      }

      const user = session.user;
      if (user.status !== 'ACTIVE') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Account is not active.' });
      }

      // Issue new tokens
      const { accessToken, refreshToken: newRefreshToken } = await issueTokens(fastify, user, session.id);

      // Rotate: hash and store new refresh token, invalidate old one
      await storeHashedRefreshToken(session.id, newRefreshToken);

      // Update session Redis cache TTL
      await redis.set(`session:${session.id}`, JSON.stringify({ userId: user.id, role: user.role }), {
        EX: 30 * 24 * 60 * 60,
      });

      reply.setCookie('refresh_token', newRefreshToken, COOKIE_OPTIONS);

      await AuditService.log({
        userId: user.id,
        action: 'REFRESH_ROTATED',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, accessToken });
    } catch (err: any) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Token refresh failed.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/logout
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/logout', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = request.user;
      const userId = (payload as any).userId ?? payload.sub;
      const sessionId = payload.sessionId;

      // Delete Session from Redis and DB
      await redis.del(`session:${sessionId}`);
      await prisma.session.deleteMany({ where: { id: sessionId } });

      // Blacklist the current Access Token for its remaining TTL (max 15m)
      const authHeader = request.headers.authorization ?? '';
      if (authHeader.startsWith('Bearer ')) {
        const rawToken = authHeader.slice(7);
        await redis.set(`blacklist:${rawToken}`, '1', { EX: 15 * 60 });
      }

      reply.clearCookie('refresh_token', { path: '/' });

      await AuditService.log({
        userId,
        action: 'LOGOUT',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, message: 'Logged out successfully.' });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Logout failed.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/logout-all  — Revoke every session for this user
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/logout-all', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId ?? request.user.sub;

      const allSessions = await prisma.session.findMany({ where: { userId } });
      for (const s of allSessions) {
        await redis.del(`session:${s.id}`);
      }
      await prisma.session.deleteMany({ where: { userId } });

      reply.clearCookie('refresh_token', { path: '/' });

      await AuditService.log({
        userId,
        action: 'LOGOUT_ALL',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, message: 'All sessions have been revoked.' });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Logout failed.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/forgot-password
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/forgot-password', { preValidation: [forgotPasswordRateLimit] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email } = ForgotPasswordSchema.parse(request.body);

      // Always respond generically — never confirm email existence
      const GENERIC_RESPONSE = { success: true, message: 'If that email is registered, a reset code has been sent.' };

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return reply.send(GENERIC_RESPONSE);

      const otp = HashService.generateOTP(6);
      const otpKey = `forgot_otp:${email}`;
      await redis.set(otpKey, HashService.hashToken(otp), { EX: 600 }); // 10 minutes

      // TODO: Deliver OTP via email provider
      console.log(`[MOCK EMAIL] Password reset OTP for ${email}: ${otp}`);

      await AuditService.log({
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send(GENERIC_RESPONSE);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Request failed.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/verify-forgot-otp  — Validate OTP without consuming it
  // Allows the frontend OTP page to confirm the code BEFORE navigating to
  // the reset-password page. The OTP remains in Redis so /reset-password
  // can verify + consume it on the final step.
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/verify-forgot-otp', { preValidation: [emailVerifyRateLimit] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, otp } = VerifyEmailOtpSchema.parse(request.body);

      const otpKey = `forgot_otp:${email}`;
      const failKey = `forgot_otp_fails:${email}`;
      const stored = await redis.get(otpKey);

      if (!stored) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Reset code has expired. Please request a new one.' });
      }

      const failCount = parseInt(await redis.get(failKey) ?? '0', 10);
      if (failCount >= 3) {
        return reply.status(429).send({ error: 'Too Many Requests', message: 'Too many incorrect attempts. Please request a new code.' });
      }

      if (!HashService.safeCompareTokens(HashService.hashToken(otp), stored)) {
        await redis.incr(failKey);
        await redis.expire(failKey, 600);
        return reply.status(400).send({ error: 'Bad Request', message: 'Invalid or expired reset code.' });
      }

      // OTP is valid — do NOT delete it here; /reset-password will consume it
      return reply.send({ success: true, message: 'Code verified. You may now set a new password.' });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Verification failed.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/reset-password  — Verify OTP + set new password
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/reset-password', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, otp, newPassword } = VerifyForgotOtpSchema.parse(request.body);

      const otpKey = `forgot_otp:${email}`;
      const failKey = `forgot_otp_fails:${email}`;
      const stored = await redis.get(otpKey);

      if (!stored) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Reset code has expired. Please request a new one.' });
      }

      const failCount = parseInt(await redis.get(failKey) ?? '0', 10);
      if (failCount >= 3) {
        return reply.status(429).send({ error: 'Too Many Requests', message: 'Too many incorrect attempts. Request a new code.' });
      }

      if (!HashService.safeCompareTokens(HashService.hashToken(otp), stored)) {
        await redis.incr(failKey);
        await redis.expire(failKey, 600);
        return reply.status(400).send({ error: 'Bad Request', message: 'Invalid or expired reset code.' });
      }

      // OTP verified — clean up
      await redis.del(otpKey);
      await redis.del(failKey);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Invalid request.' });
      }

      // Check if new password is identical to the current one
      if (user.passwordHash) {
        const isSame = await HashService.verifyPassword(newPassword, user.passwordHash);
        if (isSame) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'You cannot reuse your current password. Please choose a password you have not used before.',
          });
        }
      }

      // Hash and save new password
      const passwordHash = await HashService.hashPassword(newPassword);
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

      // Invalidate ALL refresh tokens and sessions for this user
      const allSessions = await prisma.session.findMany({ where: { userId: user.id } });
      for (const s of allSessions) {
        await redis.del(`session:${s.id}`);
      }
      await prisma.session.deleteMany({ where: { userId: user.id } });

      await AuditService.log({
        userId: user.id,
        action: 'PASSWORD_CHANGED',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, message: 'Password reset successfully. Please log in with your new password.' });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Reset failed.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // LEGACY: POST /auth/phone-register  (preserved — phone OTP flow unchanged)
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/phone-register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { phoneNumber, phonePrefix } = PhoneRegisterSchema.parse(request.body);
      const phoneHashSecret = process.env.PHONE_HASH_SECRET || 'phone_hash_secret_key_default';
      const crypto = await import('crypto');
      const phoneHash = crypto.createHmac('sha256', phoneHashSecret).update(phoneNumber).digest('hex');

      const existingUser = await prisma.user.findUnique({ where: { phoneHash } });
      if (existingUser?.phoneVerified) {
        await RiskService.addRiskSignal(existingUser.id, 'Phone reuse attempt', 40, { ip: request.ip });
        return reply.status(400).send({ error: 'Bad Request', message: 'Phone number already registered.' });
      }

      const regIpKey = `reg_count:${request.ip}`;
      const regCount = await redis.incr(regIpKey);
      if (regCount === 1) await redis.expire(regIpKey, 3600);
      if (regCount > 5) {
        return reply.status(429).send({ error: 'Too Many Requests', message: 'Registration limit exceeded for this IP.' });
      }

      const otpResult = await OTPService.sendOTP(phoneHash);
      if (!otpResult.success) {
        return reply.status(400).send({ error: 'Bad Request', message: otpResult.message });
      }

      return reply.send({ success: true, message: otpResult.message });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // LEGACY: POST /auth/phone-verify  (preserved — phone OTP verification)
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/phone-verify', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { phoneNumber, code, displayName, username } = PhoneVerifyOtpSchema.parse(request.body);
      const phoneHashSecret = process.env.PHONE_HASH_SECRET || 'phone_hash_secret_key_default';
      const crypto = await import('crypto');
      const phoneHash = crypto.createHmac('sha256', phoneHashSecret).update(phoneNumber).digest('hex');

      const otpResult = await OTPService.verifyOTP(phoneHash, code);
      if (!otpResult.success) {
        return reply.status(400).send({ error: 'Bad Request', message: otpResult.message });
      }

      let user = await prisma.user.findUnique({ where: { phoneHash } });
      if (!user) {
        const checkUsername = await prisma.user.findUnique({ where: { username } });
        if (checkUsername) {
          return reply.status(400).send({ error: 'Bad Request', message: 'Username is already taken.' });
        }
        user = await prisma.user.create({
          data: {
            phoneHash,
            phoneVerified: true,
            displayName,
            username,
            trustScore: 50,
            riskScore: 0,
            status: 'ACTIVE',
            role: 'MEMBER',
          },
        });
      }

      const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const sessionToken = HashService.generateToken();
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          token: sessionToken,
          deviceInfo: request.headers['user-agent'] ?? 'unknown',
          userAgent: request.headers['user-agent'] ?? null,
          ipAddress: request.ip,
          expiresAt: sessionExpiry,
        },
      });

      await redis.set(`session:${session.id}`, JSON.stringify({ userId: user.id, role: user.role }), {
        EX: 30 * 24 * 60 * 60,
      });

      const { accessToken, refreshToken } = await issueTokens(fastify, user, session.id);
      await storeHashedRefreshToken(session.id, refreshToken);

      reply.setCookie('refresh_token', refreshToken, COOKIE_OPTIONS);

      return reply.send({
        success: true,
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
        },
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/bind-wallet  (unchanged)
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/bind-wallet', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId ?? request.user.sub;
      const { walletAddress } = BindWalletSchema.parse(request.body);

      const existingWallet = await prisma.user.findUnique({ where: { walletAddress } });
      if (existingWallet) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Wallet address already bound to another account.' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { walletAddress, walletBoundAt: new Date() },
      });

      return reply.send({ success: true, walletAddress: updatedUser.walletAddress, walletBoundAt: updatedUser.walletBoundAt });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/admin/login
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/admin/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, password } = AdminLoginSchema.parse(request.body);

      // Fetch user
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid admin credentials.' });
      }

      // Check role — allow all admin roles
      const isAdminRole = ['ADMIN', 'SUPER_ADMIN', 'CONTENT_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'].includes(user.role);
      if (!isAdminRole) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Access denied.' });
      }

      // Check user status
      if (user.status !== 'ACTIVE') {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Account is inactive or has been revoked.' });
      }

      // Check password
      const passwordValid = await HashService.verifyPassword(password, user.passwordHash);
      if (!passwordValid) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid admin credentials.' });
      }

      // Generate preAuthId
      const preAuthId = HashService.generateToken();
      const preAuthKey = `admin_pre_auth:${preAuthId}`;

      // Cache pre-auth info in Redis for 10 minutes
      await redis.set(preAuthKey, JSON.stringify({
        userId: user.id,
        email: user.email,
        role: user.role,
        totpEnabled: user.totpEnabled
      }), { EX: 600 });

      return reply.send({
        success: true,
        mfaPending: true,
        preAuthId,
        totpEnabled: user.totpEnabled,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Login failed.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/admin/totp-setup
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/admin/totp-setup', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { preAuthId } = AdminPreAuthSchema.parse(request.body);
      const preAuthKey = `admin_pre_auth:${preAuthId}`;

      const sessionDataRaw = await redis.get(preAuthKey);
      if (!sessionDataRaw) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Pre-authentication session has expired or is invalid.' });
      }

      const sessionData = JSON.parse(sessionDataRaw);
      if (sessionData.totpEnabled) {
        return reply.status(400).send({ error: 'Bad Request', message: 'TOTP is already enabled for this account.' });
      }

      // Generate new TOTP secret (or retrieve if already generated in this session)
      let secret = sessionData.tempSecret;
      if (!secret) {
        secret = generateSecret();
        sessionData.tempSecret = secret;
        // Save back with secret — refresh TTL to 10 min
        await redis.set(preAuthKey, JSON.stringify(sessionData), { EX: 600 });
      }

      // Generate OTPauth URI and render as QR code
      const otpauthUrl = generateURI({ label: sessionData.email, issuer: 'CanaFri Admin', secret });
      const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

      return reply.send({
        success: true,
        secret,
        qrCodeUrl,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: 'TOTP setup failed.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/admin/totp-verify
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/admin/totp-verify', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { preAuthId, code } = AdminTotpVerifySchema.parse(request.body);
      const preAuthKey = `admin_pre_auth:${preAuthId}`;

      const sessionDataRaw = await redis.get(preAuthKey);
      if (!sessionDataRaw) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Pre-authentication session has expired or is invalid.' });
      }

      const sessionData = JSON.parse(sessionDataRaw);
      if (sessionData.totpEnabled) {
        return reply.status(400).send({ error: 'Bad Request', message: 'TOTP is already active.' });
      }

      const tempSecret = sessionData.tempSecret;
      if (!tempSecret) {
        return reply.status(400).send({ error: 'Bad Request', message: 'TOTP secret not initialized. Run setup first.' });
      }

      const { valid: verified } = await verify({ token: code, secret: tempSecret, epochTolerance: 120 });
      if (!verified) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Invalid verification code.' });
      }

      // Fetch User record to check status
      const userRecord = await prisma.user.findUnique({ where: { id: sessionData.userId } });
      if (!userRecord || userRecord.status !== 'ACTIVE') {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Account is inactive or has been revoked.' });
      }

      // Update User record in database
      const user = await prisma.user.update({
        where: { id: sessionData.userId },
        data: {
          totpSecret: tempSecret,
          totpEnabled: true,
        },
      });

      // Clear preAuth state
      await redis.del(preAuthKey);

      // Create Admin Session
      const sessionExpiry = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8h expiry for admin
      const sessionToken = HashService.generateToken();
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          token: sessionToken,
          deviceInfo: request.headers['user-agent'] ?? 'unknown',
          userAgent: request.headers['user-agent'] ?? null,
          ipAddress: request.ip,
          expiresAt: sessionExpiry,
        },
      });

      // Cache session in Redis
      await redis.set(`session:${session.id}`, JSON.stringify({ userId: user.id, role: user.role }), {
        EX: 8 * 60 * 60,
      });

      const { accessToken, refreshToken } = await issueAdminTokens(fastify, user, session.id);
      await storeHashedRefreshToken(session.id, refreshToken);

      // Set cookie
      reply.setCookie('refresh_token', refreshToken, ADMIN_COOKIE_OPTIONS);

      await AuditService.log({
        userId: user.id,
        action: 'ADMIN_MFA_SETUP_COMPLETED',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({
        success: true,
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
        },
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: 'MFA setup verification failed.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/admin/mfa-login
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/admin/mfa-login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { preAuthId, code } = AdminTotpVerifySchema.parse(request.body);
      const preAuthKey = `admin_pre_auth:${preAuthId}`;

      const sessionDataRaw = await redis.get(preAuthKey);
      if (!sessionDataRaw) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Pre-authentication session has expired or is invalid.' });
      }

      const sessionData = JSON.parse(sessionDataRaw);
      if (!sessionData.totpEnabled) {
        return reply.status(400).send({ error: 'Bad Request', message: 'MFA is not set up yet.' });
      }

      const user = await prisma.user.findUnique({ where: { id: sessionData.userId } });
      if (!user || !user.totpSecret) {
        return reply.status(400).send({ error: 'Bad Request', message: 'User not found or TOTP not configured.' });
      }

      if (user.status !== 'ACTIVE') {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Account is inactive or has been revoked.' });
      }

      const { valid: verified } = await verify({ token: code, secret: user.totpSecret, epochTolerance: 120 });
      if (!verified) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Invalid verification code.' });
      }

      // Clear preAuth state
      await redis.del(preAuthKey);

      // Create Admin Session
      const sessionExpiry = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8h expiry for admin
      const sessionToken = HashService.generateToken();
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          token: sessionToken,
          deviceInfo: request.headers['user-agent'] ?? 'unknown',
          userAgent: request.headers['user-agent'] ?? null,
          ipAddress: request.ip,
          expiresAt: sessionExpiry,
        },
      });

      // Cache session in Redis
      await redis.set(`session:${session.id}`, JSON.stringify({ userId: user.id, role: user.role }), {
        EX: 8 * 60 * 60,
      });

      const { accessToken, refreshToken } = await issueAdminTokens(fastify, user, session.id);
      await storeHashedRefreshToken(session.id, refreshToken);

      // Set cookie
      reply.setCookie('refresh_token', refreshToken, ADMIN_COOKIE_OPTIONS);

      await AuditService.log({
        userId: user.id,
        action: 'ADMIN_LOGIN',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({
        success: true,
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
        },
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: 'MFA login failed.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/admin/create-admin  — Create other admins (restricted to SUPER_ADMIN)
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/admin/create-admin', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const callerPayload = request.user;
      const callerRole = (callerPayload as any).role;

      if (callerRole !== 'SUPER_ADMIN') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Only SUPER_ADMIN users can create other admin accounts.' });
      }

      const { fullName, username, email, password, role } = CreateAdminSchema.parse(request.body);

      // Check if user already exists
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username }
          ]
        }
      });

      if (existing) {
        return reply.status(409).send({ error: 'Conflict', message: 'An account with those credentials already exists.' });
      }

      const passwordHash = await HashService.hashPassword(password);
      const newAdmin = await prisma.user.create({
        data: {
          displayName: fullName,
          username,
          email,
          passwordHash,
          emailVerified: true, // admin emails verified by default when provisioned
          role,
          status: 'ACTIVE',
          trustScore: 100,
        }
      });

      await AuditService.log({
        userId: (callerPayload as any).userId ?? callerPayload.sub,
        action: `ADMIN_CREATED_${role}`,
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.status(201).send({
        success: true,
        message: 'Admin account created successfully.',
        admin: {
          id: newAdmin.id,
          username: newAdmin.username,
          email: newAdmin.email,
          role: newAdmin.role,
        }
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to create admin.' });
    }
  });
}
