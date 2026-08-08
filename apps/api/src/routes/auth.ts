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
import { RiskEngine } from '../services/risk-engine.js';
import { authGuard } from '../middleware/auth.js';
import { canAccessAdminPortal } from '../lib/roles.js';
import {
  sanitizeInput,
  isValidEmailSyntax,
  isDisposableEmail,
  detectDomainTypo,
  validateGmailStandardFormat,
  validateEmailAddress,
} from '../lib/emailValidator.js';
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
  totpCode: z.string().optional(),
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
  password: z.string()
    .min(12, 'Password must be at least 12 characters long.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (!@#$%^&*).'),
  role: z.enum(['ADMIN', 'CONTENT_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN']),
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
  // POST /auth/check-availability  (Live debounced check)
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/check-availability', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = (request.body as any) || {};
      const rawUsername = sanitizeInput(body.username || '');
      const rawEmail = sanitizeInput(body.email || '').toLowerCase();

      let usernameResult = { available: true, message: undefined as string | undefined };
      let emailResult = {
        available: true,
        message: undefined as string | undefined,
        suggestion: undefined as string | undefined,
        isDisposable: false,
      };
      let isValid = true;

      // Validate Username
      if (rawUsername) {
        if (!/^[a-zA-Z0-9_-]{3,20}$/.test(rawUsername)) {
          usernameResult = { available: false, message: 'Username must be 3–20 characters (letters, numbers, _ or -).' };
          isValid = false;
        } else {
          const [dbUser, lock] = await Promise.all([
            prisma.user.findUnique({ where: { username: rawUsername } }),
            redis.get(`auth:lock:username:${rawUsername}`),
          ]);
          if (dbUser || lock) {
            usernameResult = { available: false, message: 'Username already taken.' };
            isValid = false;
          }
        }
      }

      // Validate Email
      if (rawEmail) {
        if (!isValidEmailSyntax(rawEmail)) {
          emailResult.available = false;
          emailResult.message = 'Please enter a valid email address.';
          isValid = false;
        } else {
          // 1. Gmail Standardization check (only runs AFTER valid syntax passes)
          const gmailValidation = validateGmailStandardFormat(rawEmail);
          if (!gmailValidation.valid) {
            emailResult.available = false;
            emailResult.message = gmailValidation.message;
            isValid = false;
          }

          // 2. Disposable Email check
          if (isDisposableEmail(rawEmail)) {
            emailResult.available = false;
            emailResult.isDisposable = true;
            emailResult.message = 'Disposable email addresses are not allowed.';
            isValid = false;
          }

          // 3. Domain Typo check
          const typoSuggestion = detectDomainTypo(rawEmail);
          if (typoSuggestion) {
            emailResult.suggestion = typoSuggestion;
          }

          // 4. DB + Redis lock check (if syntax valid)
          if (isValid || (!emailResult.isDisposable && emailResult.available)) {
            const [dbUser, lock] = await Promise.all([
              prisma.user.findUnique({ where: { email: rawEmail } }),
              redis.get(`auth:lock:email:${rawEmail}`),
            ]);
            if (dbUser || lock) {
              emailResult.available = false;
              emailResult.message = 'Email address already registered.';
              isValid = false;
            }
          }
        }
      }

      return reply.send({
        valid: isValid,
        username: usernameResult,
        email: emailResult,
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Availability check failed.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/register  (Email + Password) - Atomic Redis Pending Registration
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/register', { preValidation: [registerRateLimit] }, async (request: FastifyRequest, reply: FastifyReply) => {
    let acquiredUsernameLock: string | null = null;
    let acquiredEmailLock: string | null = null;

    try {
      const { fullName, username, email, password } = RegisterSchema.parse(request.body);

      const sanitizedFullName = sanitizeInput(fullName);
      const sanitizedUsername = sanitizeInput(username);
      const sanitizedEmail = sanitizeInput(email).toLowerCase();

      // 1. Syntax Validation FIRST (rejects malformed emails before any Gmail policy runs)
      if (!isValidEmailSyntax(sanitizedEmail)) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Please enter a valid email address.' });
      }

      // 2. Gmail Standard Format Check (only after valid syntax passes)
      const gmailCheck = validateGmailStandardFormat(sanitizedEmail);
      if (!gmailCheck.valid) {
        return reply.status(400).send({ error: 'Bad Request', message: gmailCheck.message });
      }

      // 3. Disposable Email Check
      if (isDisposableEmail(sanitizedEmail)) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Disposable email addresses are not allowed.' });
      }

      // 3. Domain Typo Check
      const typoSuggestion = detectDomainTypo(sanitizedEmail);
      if (typoSuggestion) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: `Did you mean ${typoSuggestion}? Please check your email address domain.`,
          suggestion: typoSuggestion,
        });
      }

      // 4. Acquire Username Lock (15 mins)
      const usernameLockKey = `auth:lock:username:${sanitizedUsername}`;
      const usernameLockAcquired = await redis.set(usernameLockKey, 'locked', { NX: true, EX: 900 });
      if (!usernameLockAcquired) {
        return reply.status(409).send({ error: 'Conflict', message: 'Username is currently being registered or already taken.' });
      }
      acquiredUsernameLock = usernameLockKey;

      // 5. Acquire Email Lock (15 mins)
      const emailLockKey = `auth:lock:email:${sanitizedEmail}`;
      const emailLockAcquired = await redis.set(emailLockKey, 'locked', { NX: true, EX: 900 });
      if (!emailLockAcquired) {
        await redis.del(usernameLockKey);
        acquiredUsernameLock = null;
        return reply.status(409).send({ error: 'Conflict', message: 'Email address is currently being registered or already registered.' });
      }
      acquiredEmailLock = emailLockKey;

      // 6. Check PostgreSQL Uniqueness
      const [existingEmail, existingUsername] = await Promise.all([
        prisma.user.findUnique({ where: { email: sanitizedEmail } }),
        prisma.user.findUnique({ where: { username: sanitizedUsername } }),
      ]);
      if (existingEmail || existingUsername) {
        await Promise.all([
          redis.del(usernameLockKey),
          redis.del(emailLockKey),
        ]);
        acquiredUsernameLock = null;
        acquiredEmailLock = null;
        return reply.status(409).send({ error: 'Conflict', message: 'An account with those credentials already exists.' });
      }

      // 7. Hash Password AFTER locks are secured
      const passwordHash = await HashService.hashPassword(password);

      // 8. Generate 6-digit OTP & Hash OTP
      const otp = HashService.generateOTP(6);
      const otpHash = HashService.hashToken(otp);

      // 9. Store Pending Registration in Redis (15m TTL) - ZERO PostgreSQL record created yet!
      const pendingKey = `auth:pending:${sanitizedEmail}`;
      const pendingPayload = {
        fullName: sanitizedFullName,
        username: sanitizedUsername,
        email: sanitizedEmail,
        passwordHash,
        otpHash,
        createdAt: Date.now(),
      };

      await redis.set(pendingKey, JSON.stringify(pendingPayload), { EX: 900 });

      // Mock or send email OTP
      console.log(`[MOCK EMAIL] Verification OTP for ${sanitizedEmail}: ${otp}`);

      return reply.status(201).send({
        success: true,
        message: 'Registration initiated. Please verify your email address.',
        email: sanitizedEmail,
        devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      });
    } catch (err: any) {
      if (acquiredUsernameLock) await redis.del(acquiredUsernameLock);
      if (acquiredEmailLock) await redis.del(acquiredEmailLock);

      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Registration failed.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/verify-email  (Atomic Verification & Auto-Login)
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/verify-email', { preValidation: [emailVerifyRateLimit] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, otp } = VerifyEmailOtpSchema.parse(request.body);
      const sanitizedEmail = sanitizeInput(email).toLowerCase();

      const pendingKey = `auth:pending:${sanitizedEmail}`;
      const failKey = `auth:otp_fails:${sanitizedEmail}`;
      const emailLockKey = `auth:lock:email:${sanitizedEmail}`;

      // 1. Retrieve pending registration from Redis
      const pendingRaw = await redis.get(pendingKey);
      if (!pendingRaw) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Registration session has expired or is invalid. Please register again.',
        });
      }

      const pendingData = JSON.parse(pendingRaw);
      const usernameLockKey = `auth:lock:username:${pendingData.username}`;

      // 2. Check failed OTP attempts
      const failCount = parseInt((await redis.get(failKey)) ?? '0', 10);
      if (failCount >= 3) {
        await AuditService.log({
          action: 'OTP_ATTEMPTS_EXCEEDED',
          target: sanitizedEmail,
          ipAddress: request.ip,
          device: request.headers['user-agent'] ?? undefined,
        });

        await Promise.all([
          redis.del(pendingKey),
          redis.del(failKey),
          redis.del(usernameLockKey),
          redis.del(emailLockKey),
        ]);

        return reply.status(429).send({
          error: 'Too Many Requests',
          message: 'Too many incorrect attempts. Please start the registration process again.',
        });
      }

      // 3. Verify OTP hash
      const incomingHash = HashService.hashToken(otp);
      if (!HashService.safeCompareTokens(incomingHash, pendingData.otpHash)) {
        await redis.incr(failKey);
        await redis.expire(failKey, 900);
        return reply.status(400).send({ error: 'Bad Request', message: 'Invalid verification code.' });
      }

      // 4. OTP is correct -> Execute atomic Prisma transaction ONLY for DB operations
      const [user] = await prisma.$transaction([
        prisma.user.create({
          data: {
            displayName: pendingData.fullName,
            username: pendingData.username,
            email: pendingData.email,
            passwordHash: pendingData.passwordHash,
            emailVerified: true,
            trustScore: 50,
            riskScore: 0,
            status: 'ACTIVE',
            role: 'MEMBER',
          },
        }),
      ]);

      await AuditService.log({
        userId: user.id,
        action: 'REGISTER_VERIFIED',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      // 5. Delete Redis pending registration & locks
      await Promise.all([
        redis.del(pendingKey),
        redis.del(failKey),
        redis.del(usernameLockKey),
        redis.del(emailLockKey),
      ]);

      // 6. Create Session AFTER transaction commits successfully
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

      // 7. Issue Refresh Token (HttpOnly cookie) + Access Token
      const { accessToken, refreshToken } = await issueTokens(fastify, user, session.id);
      await storeHashedRefreshToken(session.id, refreshToken);
      reply.setCookie('refresh_token', refreshToken, COOKIE_OPTIONS);

      // 8. Return Auto-Login payload
      return reply.send({
        success: true,
        message: 'Registration complete and email verified.',
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
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Email verification failed.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/resend-otp
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/resend-otp', { preValidation: [resendOtpRateLimit] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email } = ResendOtpSchema.parse(request.body);
      const sanitizedEmail = sanitizeInput(email).toLowerCase();

      const pendingKey = `auth:pending:${sanitizedEmail}`;
      const cooldownKey = `auth:resend:${sanitizedEmail}`;

      // 1. Check 60-second cooldown
      const inCooldown = await redis.get(cooldownKey);
      if (inCooldown) {
        return reply.status(429).send({
          error: 'Too Many Requests',
          message: 'Please wait 60 seconds before requesting a new verification code.',
        });
      }

      // 2. Retrieve pending registration from Redis
      const pendingRaw = await redis.get(pendingKey);
      if (!pendingRaw) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Registration session expired or invalid. Please register again.',
        });
      }

      const pendingData = JSON.parse(pendingRaw);

      // 3. Generate new 6-digit OTP & Hash
      const newOtp = HashService.generateOTP(6);
      const newOtpHash = HashService.hashToken(newOtp);

      // 4. Update pending registration (refresh 15m TTL & update otpHash)
      pendingData.otpHash = newOtpHash;
      await redis.set(pendingKey, JSON.stringify(pendingData), { EX: 900 });

      // Reset failure counter
      await redis.del(`auth:otp_fails:${sanitizedEmail}`);

      // 5. Set 60-second cooldown
      await redis.set(cooldownKey, '1', { EX: 60 });

      // Mock/Log email OTP
      console.log(`[MOCK EMAIL] Resent Verification OTP for ${sanitizedEmail}: ${newOtp}`);

      return reply.send({
        success: true,
        message: 'A new verification code has been sent to your email.',
        devOtp: process.env.NODE_ENV !== 'production' ? newOtp : undefined,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to resend verification code.' });
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
        return reply.status(429).send({ error: 'Too Many Requests', message: 'Your account has been temporarily locked due to multiple failed attempts. Please try again in 15 minutes.' });
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

      if (user.status === 'PENDING_DELETION') {
        return reply.status(403).send({
          error: 'Account Deletion Pending',
          code: 'ACCOUNT_PENDING_DELETION',
          message: `Your account is currently scheduled for permanent deletion on ${user.deletionScheduledFor ? new Date(user.deletionScheduledFor).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'soon'}. Click below if you wish to restore your account.`,
          deletionScheduledFor: user.deletionScheduledFor,
        });
      }

      if (user.status !== 'ACTIVE') {
        return reply.status(403).send({ error: 'Forbidden', message: 'Account is suspended, banned, or deleted.' });
      }

      // Block login until email has been verified
      if (!user.emailVerified) {
        return reply.status(403).send({
          error: 'Email Not Verified',
          message: 'Please verify your email address before logging in. Check your inbox for the verification code.',
          code: 'EMAIL_NOT_VERIFIED',
        });
      }

      // ── Portal Access Enforcement ────────────────────────────────────────────
      // Admin accounts must authenticate through the Admin Portal only.
      // This is a portal access check — not a feature permission check.
      // Feature permissions remain enforced by roleGuard() on individual API routes.
      if (canAccessAdminPortal(user.role)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'This account cannot sign in through the user portal. Please use the Admin Login.',
          code: 'ADMIN_PORTAL_REQUIRED',
        });
      }

      // Enforce 2FA check if enabled for this user account
      if (user.totpEnabled) {
        const { totpCode } = LoginSchema.parse(request.body);
        if (!totpCode || totpCode.trim().length === 0) {
          return reply.status(401).send({
            error: '2FA Required',
            message: 'Two-factor authentication code is required.',
            code: 'TOTP_REQUIRED',
          });
        }

        const normalizedCode = totpCode.trim().replace('-', '');
        let isVerified = false;

        if (normalizedCode.length === 6 && user.totpSecret) {
          const { valid } = await verify({ token: normalizedCode, secret: user.totpSecret, epochTolerance: 120 });
          isVerified = valid;
        }

        if (!isVerified) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Invalid 2FA verification code. Please check your authenticator app and try again.',
            code: 'INVALID_2FA',
          });
        }
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

      // Passively decay risk for 30-day clean period (non-blocking)
      if (user.riskScore > 0) {
        RiskEngine.decayRisk(user.id).catch(() => {});
      }

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
  // POST /auth/change-password  — Authenticated user changes their own password
  //   Requires: current password (to verify identity) + new password
  //   User-only route — admin password changes use a separate admin flow
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/change-password', { preValidation: [authGuard, passwordChangeRateLimit] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as any;

      const ChangePasswordSchema = z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
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
        message: 'Password must contain at least one special character.',
        path: ['newPassword'],
      });

      const { currentPassword, newPassword } = ChangePasswordSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.passwordHash) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Cannot change password for this account.' });
      }

      // Verify the current password is correct
      const isCurrentCorrect = await HashService.verifyPassword(currentPassword, user.passwordHash);
      if (!isCurrentCorrect) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Current password is incorrect.' });
      }

      // ── Zero-tolerance password reuse check ──────────────────────────────
      // Check new password against current hash AND every previously used hash
      const allHashes = [user.passwordHash, ...(user.passwordHistory ?? [])];
      for (const oldHash of allHashes) {
        const isReused = await HashService.verifyPassword(newPassword, oldHash);
        if (isReused) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'You have used this password before. Please choose a password you have never used on this account.',
          });
        }
      }

      // Hash new password and push current hash into history
      const passwordHash = await HashService.hashPassword(newPassword);
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          passwordHistory: { set: [user.passwordHash, ...(user.passwordHistory ?? [])] },
        },
      });

      // Automatically revoke all OTHER active sessions when password is changed
      const currentSessionId = (request.user as any).sessionId;
      const otherSessions = await prisma.session.findMany({
        where: {
          userId,
          ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
        },
      });
      for (const s of otherSessions) {
        await redis.del(`session:${s.id}`);
      }
      await prisma.session.deleteMany({
        where: {
          userId,
          ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
        },
      });

      await AuditService.log({
        userId,
        action: 'PASSWORD_CHANGED',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, message: 'Password changed successfully.' });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const first = err.errors[0];
        return reply.status(400).send({ error: 'Validation Error', message: first?.message ?? 'Invalid input.' });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Password change failed.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // USER 2FA / TOTP PREFERENCES (User-only — isolated from Admin)
  // ────────────────────────────────────────────────────────────────────────────

  // GET /auth/2fa/status — Check if 2FA is currently enabled for logged-in user
  fastify.get('/2fa/status', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId ?? request.user.sub;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totpEnabled: true },
      });
      return reply.send({ success: true, totpEnabled: !!user?.totpEnabled });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to fetch 2FA status.' });
    }
  });

  // POST /auth/2fa/setup — Initiate 2FA setup (returns secret & real QR code Data URL)
  fastify.post('/2fa/setup', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId ?? request.user.sub;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, username: true, totpEnabled: true },
      });

      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found.' });
      }

      if (user.totpEnabled) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Two-factor authentication is already active on your account.' });
      }

      // Generate a fresh TOTP secret
      const secret = generateSecret();
      const accountLabel = user.email || user.username;
      const otpauthUrl = generateURI({ label: accountLabel, issuer: 'CanaFri', secret });
      const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

      // Store temporary pending secret in Redis for 10 minutes
      const setupKey = `user_totp_setup:${userId}`;
      await redis.set(setupKey, JSON.stringify({ secret }), { EX: 600 });

      return reply.send({ success: true, secret, qrCodeUrl });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: '2FA setup failed.' });
    }
  });

  // POST /auth/2fa/verify — Verify 6-digit code & activate 2FA
  fastify.post('/2fa/verify', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId ?? request.user.sub;
      const { code } = z.object({ code: z.string().length(6).regex(/^\d{6}$/) }).parse(request.body);

      const setupKey = `user_totp_setup:${userId}`;
      const raw = await redis.get(setupKey);
      if (!raw) {
        return reply.status(400).send({ error: 'Bad Request', message: '2FA setup session expired. Please start setup again.' });
      }
      const { secret } = JSON.parse(raw);

      const { valid } = await verify({ token: code, secret, epochTolerance: 120 });
      if (!valid) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Invalid 6-digit code. Please check your authenticator app and try again.' });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          totpSecret: secret,
          totpEnabled: true,
        },
      });

      await redis.del(setupKey);

      await AuditService.log({
        userId,
        action: 'USER_2FA_ENABLED',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({
        success: true,
        message: 'Two-factor authentication enabled successfully.',
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', message: 'Code must be a 6-digit number.' });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: '2FA verification failed.' });
    }
  });

  // POST /auth/2fa/disable — Disable 2FA for logged-in user
  fastify.post('/2fa/disable', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId ?? request.user.sub;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found.' });
      }

      if (!user.totpEnabled) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Two-factor authentication is not currently enabled.' });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          totpSecret: null,
          totpEnabled: false,
          totpRecoveryHashes: [],
        },
      });

      await AuditService.log({
        userId,
        action: 'USER_2FA_DISABLED',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, message: 'Two-factor authentication disabled successfully.' });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to disable 2FA.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // USER ACTIVE SESSIONS MANAGEMENT (User-only — isolated from Admin)
  // ────────────────────────────────────────────────────────────────────────────

  // UserAgent Helper to build human-readable device names
  function parseUserAgent(ua: string | null): string {
    if (!ua) return 'Unknown Device';
    let os = 'Desktop / Mobile';
    if (ua.includes('Windows')) os = 'Windows PC';
    else if (ua.includes('Mac OS') || ua.includes('Macintosh')) os = 'Mac';
    else if (ua.includes('iPhone')) os = 'iPhone';
    else if (ua.includes('iPad')) os = 'iPad';
    else if (ua.includes('Android')) os = 'Android Device';
    else if (ua.includes('Linux')) os = 'Linux';

    let browser = 'Browser';
    if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Brave')) browser = 'Brave';
    else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'Opera';

    return `${os} • ${browser}`;
  }

  // Helper to format IP and Location cleanly (handles localhost ::1 vs production GeoIP)
  function parseLocationAndIp(rawIp: string | null, rawCountry: string | null) {
    const ip = rawIp || '127.0.0.1';
    const isLocal = ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '::ffff:127.0.0.1';

    let location = rawCountry;
    if (!location) {
      location = isLocal ? 'Localhost' : 'Online';
    }

    const cleanIp = isLocal ? '127.0.0.1' : ip;

    return { location, ip: cleanIp };
  }

  // GET /auth/sessions — Retrieve active sessions for current user
  fastify.get('/sessions', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId ?? request.user.sub;
      const currentSessionId = (request.user as any).sessionId;

      const sessions = await prisma.session.findMany({
        where: {
          userId,
          expiresAt: { gt: new Date() },
        },
        orderBy: { updatedAt: 'desc' },
      });

      const formattedSessions = sessions.map((s) => {
        const isCurrent = s.id === currentSessionId;
        const deviceName = s.deviceName || parseUserAgent(s.userAgent);
        const { location, ip } = parseLocationAndIp(s.ipAddress || s.lastIp, s.lastCountry);

        return {
          id: s.id,
          device: deviceName,
          location,
          ip,
          isCurrent,
          lastActiveAt: s.updatedAt || s.createdAt,
          createdAt: s.createdAt,
        };
      });

      const currentSession = formattedSessions.find((s) => s.isCurrent) || formattedSessions[0] || null;
      const otherSessions = formattedSessions.filter((s) => s.id !== currentSession?.id);

      return reply.send({
        success: true,
        currentSession,
        otherSessions,
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to fetch active sessions.' });
    }
  });

  // DELETE /auth/sessions/:id — Revoke a specific session
  fastify.delete('/sessions/:id', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId ?? request.user.sub;
      const currentSessionId = (request.user as any).sessionId;
      const { id } = request.params as { id: string };

      if (id === currentSessionId) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'To sign out of your current active session, please use the Logout button.',
        });
      }

      const targetSession = await prisma.session.findFirst({
        where: { id, userId },
      });

      if (!targetSession) {
        return reply.status(404).send({ error: 'Not Found', message: 'Session not found or already revoked.' });
      }

      await redis.del(`session:${id}`);
      await prisma.session.delete({ where: { id } });

      await AuditService.log({
        userId,
        action: 'SESSION_REVOKED',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, message: 'Session revoked successfully.' });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to revoke session.' });
    }
  });

  // POST /auth/sessions/revoke-others — Revoke all sessions except current
  fastify.post('/sessions/revoke-others', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId ?? request.user.sub;
      const currentSessionId = (request.user as any).sessionId;

      const otherSessions = await prisma.session.findMany({
        where: {
          userId,
          ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
        },
      });

      for (const s of otherSessions) {
        await redis.del(`session:${s.id}`);
      }

      await prisma.session.deleteMany({
        where: {
          userId,
          ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
        },
      });

      await AuditService.log({
        userId,
        action: 'LOGOUT_ALL_OTHER_SESSIONS',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({ success: true, message: 'All other active sessions have been revoked successfully.' });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to revoke other sessions.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // ACCOUNT DELETION MANAGEMENT (GDPR / App Store / Compliance Standard)
  // ────────────────────────────────────────────────────────────────────────────

  // POST /auth/account-deletion/request — Initiate 7-day deletion grace period
  fastify.post('/account-deletion/request', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId ?? request.user.sub;
      const { password, totpCode, reason } = z.object({
        password: z.string().min(1, 'Current password is required to request account deletion'),
        totpCode: z.string().optional(),
        reason: z.string().max(500).optional(),
      }).parse(request.body);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.passwordHash) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Account deletion is not supported for this account.' });
      }

      // 1. Verify Current Password
      const isPasswordCorrect = await HashService.verifyPassword(password, user.passwordHash);
      if (!isPasswordCorrect) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Incorrect current password. Cannot confirm account deletion.' });
      }

      // 2. Verify 2FA if enabled
      if (user.totpEnabled) {
        if (!totpCode || totpCode.trim().length !== 6) {
          return reply.status(401).send({ error: 'Unauthorized', message: '6-digit 2FA authenticator code is required.' });
        }
        const normalizedCode = totpCode.trim();
        const { valid } = await verify({ token: normalizedCode, secret: user.totpSecret!, epochTolerance: 120 });
        if (!valid) {
          return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid 2FA code. Account deletion request denied.' });
        }
      }

      // 3. Check Unresolved Financial / Platform Obligations
      const obligations: string[] = [];

      // Check active jobs
      const activeJobs = await prisma.job.findMany({
        where: {
          OR: [{ clientId: userId }, { freelancerId: userId }],
          status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'DELIVERED', 'DISPUTED'] },
        },
        select: { id: true, title: true, status: true },
      });
      if (activeJobs.length > 0) {
        obligations.push(`${activeJobs.length} active job(s) in progress or escrow.`);
      }

      // Check active disputes
      const activeDisputes = await prisma.dispute.findMany({
        where: {
          OR: [{ raisedById: userId }, { respondentId: userId }],
          status: { in: ['OPEN', 'UNDER_REVIEW'] },
        },
      });
      if (activeDisputes.length > 0) {
        obligations.push(`${activeDisputes.length} active open dispute(s) under review.`);
      }

      // Check locked creator stake
      const lockedStake = await prisma.creatorStake.findFirst({
        where: { userId, status: 'LOCKED' },
      });
      if (lockedStake) {
        obligations.push(`Locked Creator Stake of ${lockedStake.amountCC} CC.`);
      }

      // Check active article read stake
      const activeReadStake = await prisma.readStake.findFirst({
        where: { userId, status: 'STAKED' },
      });
      if (activeReadStake) {
        obligations.push(`Active Read Stake timer in progress.`);
      }

      // Check active subscription
      const activeSub = await prisma.subscription.findFirst({
        where: { userId, status: 'ACTIVE' },
      });
      if (activeSub) {
        obligations.push(`Active Creator Pro subscription (please cancel subscription first).`);
      }

      if (obligations.length > 0) {
        await AuditService.log({
          userId,
          action: 'ACCOUNT_DELETION_BLOCKED',
          ipAddress: request.ip,
          device: request.headers['user-agent'] ?? undefined,
          metadata: { obligations },
        });

        return reply.status(400).send({
          error: 'Bad Request',
          code: 'DELETION_BLOCKED_OBLIGATIONS',
          message: 'Cannot delete account while unresolved obligations exist.',
          obligations,
        });
      }

      // 4. Initiate 7-day Deletion Grace Period
      const now = new Date();
      const scheduledFor = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days grace period

      await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'PENDING_DELETION',
          deletionRequestedAt: now,
          deletionScheduledFor: scheduledFor,
          deletionReason: reason ? reason.trim() : null,
        },
      });

      // 5. Revoke ALL active sessions for this account across DB & Redis
      const allSessions = await prisma.session.findMany({ where: { userId } });
      for (const s of allSessions) {
        await redis.del(`session:${s.id}`);
      }
      await prisma.session.deleteMany({ where: { userId } });
      reply.clearCookie('refresh_token', { path: '/' });

      await AuditService.log({
        userId,
        action: 'ACCOUNT_DELETION_REQUESTED',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
        metadata: { deletionScheduledFor: scheduledFor.toISOString(), reason: reason || null },
      });

      return reply.send({
        success: true,
        message: `Account deletion requested successfully. Your account is scheduled for permanent deletion on ${scheduledFor.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. All active sessions have been logged out.`,
        deletionScheduledFor: scheduledFor,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const first = err.errors[0];
        return reply.status(400).send({ error: 'Validation Error', message: first?.message ?? 'Invalid input.' });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to initiate account deletion.' });
    }
  });

  // POST /auth/account-deletion/cancel — Cancel pending deletion during 7-day grace period
  fastify.post('/account-deletion/cancel', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, password, totpCode } = z.object({
        email: z.string().email().toLowerCase().trim(),
        password: z.string().min(1, 'Password is required to restore account'),
        totpCode: z.string().optional(),
      }).parse(request.body);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || user.status !== 'PENDING_DELETION' || !user.passwordHash) {
        return reply.status(400).send({ error: 'Bad Request', message: 'No pending account deletion found for this email address.' });
      }

      // Verify Password
      const isPasswordCorrect = await HashService.verifyPassword(password, user.passwordHash);
      if (!isPasswordCorrect) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Incorrect password. Cannot restore account.' });
      }

      // Verify 2FA if enabled
      if (user.totpEnabled) {
        if (!totpCode || totpCode.trim().length !== 6) {
          return reply.status(401).send({ error: 'Unauthorized', message: '6-digit 2FA code is required to restore account.' });
        }
        const { valid } = await verify({ token: totpCode.trim(), secret: user.totpSecret!, epochTolerance: 120 });
        if (!valid) {
          return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid 2FA code.' });
        }
      }

      // Restore Account to ACTIVE status
      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'ACTIVE',
          deletionRequestedAt: null,
          deletionScheduledFor: null,
          deletionReason: null,
        },
      });

      await AuditService.log({
        userId: user.id,
        action: 'ACCOUNT_DELETION_CANCELLED',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({
        success: true,
        message: 'Account deletion request cancelled successfully. Your account has been restored to active status. You may now log in.',
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const first = err.errors[0];
        return reply.status(400).send({ error: 'Validation Error', message: first?.message ?? 'Invalid input.' });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to cancel account deletion.' });
    }
  });

  // GET /auth/account-deletion/status — Check account deletion status
  fastify.get('/account-deletion/status', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId ?? request.user.sub;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { status: true, deletionRequestedAt: true, deletionScheduledFor: true },
      });

      return reply.send({
        success: true,
        isPendingDeletion: user?.status === 'PENDING_DELETION',
        deletionRequestedAt: user?.deletionRequestedAt,
        deletionScheduledFor: user?.deletionScheduledFor,
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to fetch deletion status.' });
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
        return reply.status(429).send({ error: 'Too Many Requests', message: 'Too many incorrect attempts. Please request a new verification code.' });
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
        return reply.status(429).send({ error: 'Too Many Requests', message: 'Too many incorrect attempts. Please request a new verification code.' });
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

      // ── Zero-tolerance password reuse check ──────────────────────────────
      // Check new password against current hash AND every previously used hash
      if (user.passwordHash) {
        const allHashes = [user.passwordHash, ...(user.passwordHistory ?? [])];
        for (const oldHash of allHashes) {
          const isReused = await HashService.verifyPassword(newPassword, oldHash);
          if (isReused) {
            return reply.status(400).send({
              error: 'Bad Request',
              message: 'You have used this password before. Please choose a password you have never used on this account.',
            });
          }
        }
      }

      // Hash new password and push current hash into history
      const passwordHash = await HashService.hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordHistory: user.passwordHash
            ? { set: [user.passwordHash, ...(user.passwordHistory ?? [])] }
            : undefined,
        },
      });

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
        return reply.status(429).send({ error: 'Too Many Requests', message: 'We are unable to process your request at this time. Please try again later.' });
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

      // ── Portal Access Enforcement ────────────────────────────────────────────
      // Only admin roles may sign into the Admin Portal.
      // Feature permissions for individual admin endpoints remain enforced by roleGuard().
      if (!canAccessAdminPortal(user.role)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You are not authorized to access the Admin Portal.',
          code: 'USER_PORTAL_REQUIRED',
        });
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

      // Generate 10 one-time recovery codes (formatted as XXXX-XXXX)
      const plainRecoveryCodes: string[] = [];
      const recoveryHashes: string[] = [];
      for (let i = 0; i < 10; i++) {
        const code = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
        plainRecoveryCodes.push(code);
        const hash = await HashService.hashPassword(code.replace('-', '').trim());
        recoveryHashes.push(hash);
      }

      // Update User record in database
      const user = await prisma.user.update({
        where: { id: sessionData.userId },
        data: {
          totpSecret: tempSecret,
          totpEnabled: true,
          totpRecoveryHashes: recoveryHashes,
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
        recoveryCodes: plainRecoveryCodes,
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
  // POST /auth/admin/mfa-login (Supports 6-digit TOTP OR 8-digit Recovery Code)
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/admin/mfa-login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = (request.body as any) || {};
      const preAuthId = String(body.preAuthId || '');
      const codeRaw = String(body.code || '').trim();
      const normalizedCode = codeRaw.replace('-', '').trim();

      if (!preAuthId || !codeRaw) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Pre-authentication ID and verification code are required.' });
      }

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

      let isVerified = false;
      let usedRecoveryCode = false;

      // 1. First try TOTP verification (if code is 6 digits)
      if (normalizedCode.length === 6 && /^\d{6}$/.test(normalizedCode)) {
        const { valid } = await verify({ token: normalizedCode, secret: user.totpSecret, epochTolerance: 120 });
        isVerified = valid;
      }

      // 2. If TOTP failed or code is an 8-character recovery code, test against stored bcrypt recovery hashes
      if (!isVerified && user.totpRecoveryHashes && user.totpRecoveryHashes.length > 0) {
        let matchedIndex = -1;
        for (let i = 0; i < user.totpRecoveryHashes.length; i++) {
          const match = await HashService.verifyPassword(normalizedCode, user.totpRecoveryHashes[i]);
          if (match) {
            matchedIndex = i;
            break;
          }
        }

        if (matchedIndex !== -1) {
          isVerified = true;
          usedRecoveryCode = true;

          // Burn the used recovery code (remove from array)
          const updatedHashes = [...user.totpRecoveryHashes];
          updatedHashes.splice(matchedIndex, 1);
          await prisma.user.update({
            where: { id: user.id },
            data: { totpRecoveryHashes: updatedHashes },
          });

          await AuditService.log({
            userId: user.id,
            action: 'ADMIN_MFA_RECOVERY_CODE_USED',
            ipAddress: request.ip,
            device: request.headers['user-agent'] ?? undefined,
          });
        }
      }

      if (!isVerified) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Invalid verification code or recovery code.' });
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
        usedRecoveryCode,
        remainingRecoveryCodes: usedRecoveryCode ? (user.totpRecoveryHashes.length - 1) : user.totpRecoveryHashes.length,
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
  // POST /auth/admin/forgot-password (Dedicated Admin Password Reset Request)
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/admin/forgot-password', { preValidation: [forgotPasswordRateLimit] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email } = ForgotPasswordSchema.parse(request.body);
      const normalizedEmail = email.toLowerCase().trim();

      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (user && canAccessAdminPortal(user.role) && user.status === 'ACTIVE') {
        const otp = HashService.generateOTP(6);
        const otpKey = `admin_pwd_reset_otp:${normalizedEmail}`;

        // Cache hashed OTP in Redis with 15 minute TTL
        await redis.set(otpKey, HashService.hashToken(otp), { EX: 900 });

        await AuditService.log({
          userId: user.id,
          action: 'ADMIN_FORGOT_PASSWORD_REQUESTED',
          ipAddress: request.ip,
          device: request.headers['user-agent'] ?? undefined,
        });

        console.log(`\n=============================================================`);
        console.log(`🔑 [ADMIN SECURITY RESET OTP]`);
        console.log(`   Email: ${normalizedEmail}`);
        console.log(`   OTP Code: ${otp}`);
        console.log(`   Expires in: 15 minutes`);
        console.log(`=============================================================\n`);
      } else {
        console.log(`\n=============================================================`);
        console.log(`⚠️  [ADMIN SECURITY RESET REQUEST FAILED - ACCOUNT MISMATCH]`);
        console.log(`   Requested Email: "${normalizedEmail}"`);
        if (!user) {
          console.log(`   Reason: No user found with this email address.`);
        } else if (!canAccessAdminPortal(user.role)) {
          console.log(`   Reason: User role "${user.role}" is not an admin role.`);
        } else if (user.status !== 'ACTIVE') {
          console.log(`   Reason: Admin user status is "${user.status}" (must be ACTIVE).`);
        }
        console.log(`=============================================================\n`);
      }

      // Always return generic response to prevent email enumeration
      return reply.send({
        success: true,
        message: 'If an active administrator account exists for this email address, password reset instructions have been sent.',
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: err.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to process forgot password request.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/admin/reset-password (Dedicated Admin Password Reset Verification)
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/admin/reset-password', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = (request.body as any) || {};
      const email = String(body.email || '').toLowerCase().trim();
      const otp = String(body.otp || '').trim();
      const newPassword = String(body.newPassword || '');
      const confirmPassword = String(body.confirmPassword || '');

      if (!email || !otp || !newPassword || !confirmPassword) {
        return reply.status(400).send({ error: 'Bad Request', message: 'All fields are required.' });
      }

      if (newPassword !== confirmPassword) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Passwords do not match.' });
      }

      if (newPassword.length < 12 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Password must be at least 12 characters and contain uppercase, number, and special character.',
        });
      }

      const otpKey = `admin_pwd_reset_otp:${email}`;
      const hashedOtpInRedis = await redis.get(otpKey);
      if (!hashedOtpInRedis) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Invalid or expired OTP code.' });
      }

      const match = HashService.safeCompareTokens(HashService.hashToken(otp), hashedOtpInRedis);
      if (!match) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Invalid OTP code.' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !canAccessAdminPortal(user.role)) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Invalid admin account.' });
      }

      // Check password reuse
      if (user.passwordHash) {
        const isReuse = await HashService.verifyPassword(newPassword, user.passwordHash);
        if (isReuse) {
          return reply.status(400).send({ error: 'Bad Request', message: 'New password cannot be the same as your current password.' });
        }
      }

      // Update password (KEEP TOTP SECRET AND RECOVERY HASHES INTACT!)
      const newHash = await HashService.hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });

      // Revoke all active sessions for this user across DB & Redis
      await prisma.session.deleteMany({ where: { userId: user.id } });
      try {
        await redis.del(`session:${user.id}`);
      } catch {
        /* non-fatal */
      }

      // Clear OTP
      await redis.del(otpKey);

      await AuditService.log({
        userId: user.id,
        action: 'ADMIN_PASSWORD_RESET_COMPLETED',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
      });

      return reply.send({
        success: true,
        message: 'Administrator password reset successfully. All active sessions have been terminated. MFA remains active.',
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to reset password.' });
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

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/phone/send-otp  — Send phone verification OTP
  //
  // STATUS: Development stub.
  // When SMS API (e.g. Twilio, Termii) is connected, replace the console.log
  // block below with the real SMS send call. The route contract stays the same.
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/phone/send-otp', { preHandler: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { phone, prefix } = request.body as { phone?: string; prefix?: string };

      if (!phone || !prefix) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Phone number and country prefix are required.' });
      }

      const cleanPhone = phone.replace(/[\s\-()]/g, '');
      if (cleanPhone.length < 7 || cleanPhone.length > 15) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Please enter a valid phone number.' });
      }

      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const fullPhone = `${prefix}${cleanPhone}`;
      const otpKey = `phone:otp:${fullPhone}`;

      // Store OTP in Redis with 10-minute TTL
      await redis.set(otpKey, otp, { EX: 600 });

      // ── DEV FALLBACK ──────────────────────────────────────────────────────
      // SMS API not connected yet. OTP is printed to the terminal for testing.
      // To go live: replace this block with your SMS provider call (Twilio, Termii, etc.)
      // and remove the console.log line below.
      // ─────────────────────────────────────────────────────────────────────
      console.log(`\n📱 [DEV] Phone OTP for ${fullPhone}: ${otp}\n`);
      // ─────────────────────────────────────────────────────────────────────

      return reply.send({
        success: true,
        message: 'Verification code sent to your phone.',
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to send verification code. Please try again.' });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /auth/phone/verify-otp  — Verify phone OTP
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/phone/verify-otp', { preHandler: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as { phone?: string; prefix?: string; otp?: string; code?: string };
      const phone = body.phone;
      const prefix = body.prefix;
      const otp = (body.otp || body.code)?.trim();

      if (!phone || !prefix || !otp) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Phone number, prefix, and verification code are required.' });
      }

      const cleanPhone = phone.replace(/[\s\-()]/g, '');
      const fullPhone = `${prefix}${cleanPhone}`;
      const otpKey = `phone:otp:${fullPhone}`;

      const storedOtp = await redis.get(otpKey);

      if (!storedOtp) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Verification code has expired. Please request a new one.' });
      }

      if (storedOtp !== otp) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Invalid verification code. Please check and try again.' });
      }

      // OTP is correct — delete it immediately (single-use)
      await redis.del(otpKey);

      // Update user record to mark phone as verified
      const userId = (request.user as any)?.userId || (request.user as any)?.sub || (request.user as any)?.id;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            phoneVerified: true,
            phonePrefix: prefix,
          },
        });
      }

      return reply.send({
        success: true,
        message: 'Phone number verified successfully.',
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Verification failed. Please try again.' });
    }
  });
}
