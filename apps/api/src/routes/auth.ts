import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { OTPService } from '../services/otp.js';
import { RiskService } from '../middleware/riskCheck.js';
import { authGuard } from '../middleware/auth.js';

// Schemas for input validation
const RegisterSchema = z.object({
  phoneNumber: z.string().min(8),
  phonePrefix: z.string().optional(),
});

const VerifyOtpSchema = z.object({
  phoneNumber: z.string().min(8),
  code: z.string().length(6),
  displayName: z.string().min(2),
  username: z.string().min(3),
});

const BindWalletSchema = z.object({
  walletAddress: z.string().min(10),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Rate limits on auth routes (10 requests per minute per IP globally)
  // Using Fastify rate limiter if available or manual cache check
  
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const ip = request.ip;
    const rateLimitKey = `rate_limit:auth:${ip}`;
    const current = await redis.incr(rateLimitKey);
    if (current === 1) {
      await redis.expire(rateLimitKey, 60);
    }
    if (current > 10) {
      return reply.status(429).send({ error: 'Too Many Requests', message: 'Auth rate limit exceeded. Try again in a minute.' });
    }
  });

  // POST /auth/register - Initiates OTP sending
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { phoneNumber, phonePrefix } = RegisterSchema.parse(request.body);
      const phoneHashSecret = process.env.PHONE_HASH_SECRET || 'phone_hash_secret_key_default';
      const phoneHash = crypto.createHmac('sha256', phoneHashSecret).update(phoneNumber).digest('hex');

      // Check if phone hash is already verified and bound
      const existingUser = await prisma.user.findUnique({
        where: { phoneHash },
      });

      if (existingUser && existingUser.phoneVerified) {
        // Enforce Layer 2 anti-sybil flag: Phone reuse attempt (+40 risk)
        await RiskService.addRiskSignal(existingUser.id, 'Phone reuse attempt', 40, { ip: request.ip });
        return reply.status(400).send({ error: 'Bad Request', message: 'Phone number already registered.' });
      }

      // Enforce 5 registrations per hour per IP
      const regIpKey = `reg_count:${request.ip}`;
      const regCount = await redis.incr(regIpKey);
      if (regCount === 1) {
        await redis.expire(regIpKey, 3600);
      }
      if (regCount > 5) {
        // Add a global risk warning for multiple IP registrations
        console.warn(`[SECURITY WARNING] Multiple registration attempts from same IP: ${request.ip}`);
        return reply.status(429).send({ error: 'Too Many Requests', message: 'Registration limit exceeded for this IP. Try again in an hour.' });
      }

      // Send OTP
      const otpResult = await OTPService.sendOTP(phoneHash);
      if (!otpResult.success) {
        return reply.status(400).send({ error: 'Bad Request', message: otpResult.message });
      }

      return reply.send({ success: true, message: otpResult.message });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /auth/verify-otp - OTP validation + session allocation
  fastify.post('/verify-otp', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { phoneNumber, code, displayName, username } = VerifyOtpSchema.parse(request.body);
      const phoneHashSecret = process.env.PHONE_HASH_SECRET || 'phone_hash_secret_key_default';
      const phoneHash = crypto.createHmac('sha256', phoneHashSecret).update(phoneNumber).digest('hex');

      // Verify OTP in Redis
      const otpResult = await OTPService.verifyOTP(phoneHash, code);
      if (!otpResult.success) {
        return reply.status(400).send({ error: 'Bad Request', message: otpResult.message });
      }

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { phoneHash },
      });

      if (!user) {
        // Ensure username is unique
        const checkUsername = await prisma.user.findUnique({
          where: { username },
        });
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

      // Create session in Database
      const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          token: sessionToken,
          deviceInfo: request.headers['user-agent'] || 'unknown',
          ipAddress: request.ip,
          expiresAt: sessionExpiry,
        },
      });

      // Cache session in Redis (expires in 30 days)
      const sessionData = {
        userId: user.id,
        role: user.role,
        isCreator: user.isCreator,
        isSeller: user.isSeller,
      };
      await redis.set(`session:${session.id}`, JSON.stringify(sessionData), { EX: 30 * 24 * 60 * 60 });

      // Generate JWT Access Token (15 mins)
      const accessToken = fastify.jwt.sign(
        {
          userId: user.id,
          role: user.role,
          isCreator: user.isCreator,
          isSeller: user.isSeller,
          sessionId: session.id,
        },
        { expiresIn: '15m' }
      );

      // Generate JWT Refresh Token (30 days)
      const refreshToken = fastify.jwt.sign(
        {
          userId: user.id,
          role: user.role,
          isCreator: user.isCreator,
          isSeller: user.isSeller,
          sessionId: session.id,
        },
        { expiresIn: '30d' }
      );

      // Set refresh token in HttpOnly cookie
      reply.setCookie('refresh_token', refreshToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      return reply.send({
        success: true,
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          isCreator: user.isCreator,
          isSeller: user.isSeller,
          trustScore: user.trustScore,
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /auth/refresh - Refresh Access Token
  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const refreshToken = request.cookies.refresh_token;
      if (!refreshToken) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Refresh token cookie is missing' });
      }

      // Verify token
      const decoded = fastify.jwt.verify(refreshToken) as { userId: string; sessionId: string };
      if (!decoded || !decoded.sessionId) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid refresh token' });
      }

      // Check session in Redis / DB
      const sessionKey = `session:${decoded.sessionId}`;
      const sessionCached = await redis.get(sessionKey);
      let userData = sessionCached ? JSON.parse(sessionCached) : null;

      if (!userData) {
        const dbSession = await prisma.session.findUnique({
          where: { token: decoded.sessionId },
          include: { user: true },
        });

        if (!dbSession || dbSession.expiresAt < new Date()) {
          return reply.status(401).send({ error: 'Unauthorized', message: 'Session expired or revoked' });
        }

        userData = {
          userId: dbSession.user.id,
          role: dbSession.user.role,
          isCreator: dbSession.user.isCreator,
          isSeller: dbSession.user.isSeller,
        };

        // Cache back to Redis
        await redis.set(sessionKey, JSON.stringify(userData), { EX: 30 * 24 * 60 * 60 });
      }

      // Issue new access token
      const accessToken = fastify.jwt.sign(
        {
          userId: userData.userId,
          role: userData.role,
          isCreator: userData.isCreator,
          isSeller: userData.isSeller,
          sessionId: decoded.sessionId,
        },
        { expiresIn: '15m' }
      );

      return reply.send({ success: true, accessToken });
    } catch (error: any) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid token signature or expired' });
    }
  });

  // POST /auth/logout - Revokes session
  fastify.post('/logout', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sessionId } = request.user;
      
      // Revoke in Redis
      await redis.del(`session:${sessionId}`);

      // Delete in DB
      await prisma.session.deleteMany({
        where: { id: sessionId },
      });

      reply.clearCookie('refresh_token');
      return reply.send({ success: true, message: 'Logged out successfully.' });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /auth/bind-wallet - Binds Canton Wallet Address
  fastify.post('/bind-wallet', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const { walletAddress } = BindWalletSchema.parse(request.body);

      // Verify wallet address is unique (anti-sybil Layer 2)
      const existingWallet = await prisma.user.findUnique({
        where: { walletAddress },
      });

      if (existingWallet) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Wallet address already bound to another account.' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          walletAddress,
          walletBoundAt: new Date(),
        },
      });

      return reply.send({
        success: true,
        walletAddress: updatedUser.walletAddress,
        walletBoundAt: updatedUser.walletBoundAt,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });
}
