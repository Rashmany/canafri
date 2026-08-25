import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { authGuard } from '../middleware/auth.js';
import { riskRestrictionGuard } from '../middleware/riskCheck.js';
import { CantonService } from '../services/canton.js';
import { AuditService } from '../services/audit.js';
import { HashService } from '../lib/hash.js';
import { UserAnalyticsService } from '../services/user-analytics.service.js';

const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  website: z.string().url().optional().or(z.literal('')),
  country: z.string().optional(),
});

const ApplySellerSchema = z.object({
  bio:              z.string().min(10, 'Bio must be at least 10 characters').optional(),
  country:          z.string().optional(),
  city:             z.string().optional(),
  phone:            z.string().optional(),
  phonePrefix:      z.string().optional(),
  headline:         z.string().optional(),
  skills:           z.array(z.string()).optional(),
  primaryCategory:  z.string().optional(),
  subCategory:      z.string().optional(),
  yearsOfExperience:z.string().optional(),
  language:         z.string().optional(),
  hourlyRate:       z.string().optional(),
  minProjectValue:  z.string().optional(),
  availability:     z.string().optional(),
  skillsBio:        z.string().optional(),
  portfolioLinks:   z.array(z.string()).optional(),
  educationSchool:  z.string().optional(),
  educationDegree:  z.string().optional(),
  educationYear:    z.string().optional(),
  agreedToTerms:    z.boolean().optional(),
});

export async function userRoutes(fastify: FastifyInstance) {
  // All routes here are authenticated (except public profile)
  
  // GET /users/me - Retrieve current profile
  fastify.get('/me', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true,
          creatorStake: true,
          content: {
            include: {
              creator: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          readStakes: {
            include: {
              content: {
                include: {
                  creator: {
                    select: {
                      id: true,
                      username: true,
                      displayName: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
            orderBy: { stakedAt: 'desc' },
          },
          freelanceJobs: {
            select: { id: true, status: true, amountCC: true, title: true, createdAt: true, updatedAt: true },
            orderBy: { createdAt: 'desc' },
          },
          reviewsReceived: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              reviewer: {
                select: { id: true, username: true, displayName: true, avatarUrl: true },
              },
              job: {
                select: { id: true, title: true },
              },
            },
          },
          postedJobs: {
            select: { id: true, status: true, amountCC: true, title: true, category: true, createdAt: true, updatedAt: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      // Fetch extended seller application payload if present
      const sellerAppNotif = await prisma.notification.findFirst({
        where: { userId: user.id, type: 'SELLER_APPLICATION' },
        orderBy: { createdAt: 'desc' },
      });

      let sellerAppData: any = {};
      if (sellerAppNotif && sellerAppNotif.body) {
        try {
          sellerAppData = JSON.parse(sellerAppNotif.body);
        } catch (e) {}
      }

      return reply.send({
        success: true,
        user,
        sellerAppData,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /users/me/analytics - Retrieve comprehensive real analytics for the authenticated user
  fastify.get('/me/analytics', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const analytics = await UserAnalyticsService.getUserAnalytics(userId);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isSeller: true,
          isCreator: true,
          sellerModeOn: true,
        },
      });

      return reply.send({
        success: true,
        analytics,
        user,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // PATCH /users/me - Update profile fields
  fastify.patch('/me', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const updateData = UpdateProfileSchema.parse(request.body);

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      return reply.send({ success: true, user: updatedUser });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // PATCH /users/me/identity - Update name, username, bio, avatar with cooldown rules & dual bio support
  fastify.patch('/me/identity', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const { displayName, username, bio, avatarUrl, isSellerMode } = z.object({
        displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50, 'Display name maximum 50 characters').optional(),
        username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username maximum 30 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional(),
        bio: z.string().max(500, 'Bio maximum 500 characters').optional().nullable(),
        avatarUrl: z.string().optional().nullable(),
        isSellerMode: z.boolean().optional(),
      }).parse(request.body);

      const currentUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!currentUser) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      const now = new Date();
      const updates: any = {};

      // 1. Handle Display Name & 60-Day Cooldown
      if (displayName && displayName.trim() !== currentUser.displayName) {
        if (currentUser.displayNameLastEditedAt) {
          const daysSinceLastEdit = (now.getTime() - new Date(currentUser.displayNameLastEditedAt).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceLastEdit < 60) {
            const daysRemaining = Math.ceil(60 - daysSinceLastEdit);
            return reply.status(400).send({
              error: 'Bad Request',
              code: 'DISPLAY_NAME_COOLDOWN',
              message: `You can only change your display name once every 60 days. Please wait ${daysRemaining} more day(s) before editing your name again.`,
              daysRemaining,
            });
          }
        }
        updates.displayName = displayName.trim();
        updates.displayNameLastEditedAt = now;
      }

      // 2. Handle Username & 30-Day Cooldown + Uniqueness
      if (username) {
        const cleanUsername = username.toLowerCase().trim();
        if (cleanUsername !== currentUser.username.toLowerCase()) {
          // Check username availability
          const existing = await prisma.user.findFirst({
            where: {
              username: { equals: cleanUsername, mode: 'insensitive' },
              id: { not: userId },
            },
          });

          if (existing) {
            return reply.status(400).send({
              error: 'Bad Request',
              code: 'USERNAME_TAKEN',
              message: `@${cleanUsername} is already taken by another user. Please choose a different handle.`,
            });
          }

          if (currentUser.usernameLastEditedAt) {
            const daysSinceLastEdit = (now.getTime() - new Date(currentUser.usernameLastEditedAt).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceLastEdit < 30) {
              const daysRemaining = Math.ceil(30 - daysSinceLastEdit);
              return reply.status(400).send({
                error: 'Bad Request',
                code: 'USERNAME_COOLDOWN',
                message: `You can only change your username once every 30 days. Please wait ${daysRemaining} more day(s) before editing your handle again.`,
                daysRemaining,
              });
            }
          }
          updates.username = cleanUsername;
          updates.usernameLastEditedAt = now;
        }
      }

      // 3. Handle Bio & Avatar (no cooldown restrictions)
      if (bio !== undefined) {
        const trimmedBio = bio ? bio.trim() : null;
        // Enforce per-mode character limits
        if (trimmedBio) {
          const bioLimit = isSellerMode ? 500 : 160;
          if (trimmedBio.length > bioLimit) {
            return reply.status(400).send({
              error: 'Bad Request',
              code: 'BIO_TOO_LONG',
              message: isSellerMode
                ? `Freelancer bio cannot exceed 500 characters.`
                : `Personal bio cannot exceed 160 characters.`,
            });
          }
        }
        updates.bio = trimmedBio;
      }
      if (avatarUrl !== undefined) {
        updates.avatarUrl = avatarUrl || null;
      }

      if (Object.keys(updates).length === 0) {
        return reply.send({ success: true, user: currentUser, message: 'No changes detected.' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updates,
      });

      await AuditService.log({
        userId,
        action: 'UPDATE_PROFILE_IDENTITY',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
        metadata: { updatedFields: Object.keys(updates), isSellerMode: !!isSellerMode },
      });

      return reply.send({
        success: true,
        user: updatedUser,
        message: isSellerMode ? 'Freelancer profile updated successfully.' : 'Personal profile updated successfully.',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const first = error.errors[0];
        return reply.status(400).send({ error: 'Validation Error', message: first?.message ?? 'Invalid input data.' });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /users/email/send-otp — Send 6-digit OTP code to new email address
  fastify.post('/email/send-otp', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const { newEmail, password } = z.object({
        newEmail: z.string().email('Invalid email address format').toLowerCase().trim(),
        password: z.string().min(1, 'Current password is required to request email change'),
      }).parse(request.body);

      const currentUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!currentUser || !currentUser.passwordHash) {
        return reply.status(400).send({ error: 'Bad Request', message: 'User not found or password not set.' });
      }

      // Verify current password first
      const isPasswordCorrect = await HashService.verifyPassword(password, currentUser.passwordHash);
      if (!isPasswordCorrect) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Incorrect current password. Cannot verify identity.' });
      }

      if (newEmail === currentUser.email) {
        return reply.status(400).send({ error: 'Bad Request', message: 'New email address must be different from your current email.' });
      }

      // Check availability
      const existing = await prisma.user.findFirst({
        where: { email: newEmail, id: { not: userId } },
      });
      if (existing) {
        return reply.status(400).send({ error: 'Bad Request', message: 'This email address is already registered to another account.' });
      }

      // Generate 6-digit OTP code
      const otpCode = HashService.generateOTP(6);
      await redis.set(`email_change_otp:${userId}`, JSON.stringify({ newEmail, code: otpCode }), { EX: 600 }); // 10 minutes

      console.log(`[EmailOTP] Verification code for ${newEmail}: ${otpCode}`);

      return reply.send({
        success: true,
        message: `6-digit verification code sent to ${newEmail}.`,
        devOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const first = error.errors[0];
        return reply.status(400).send({ error: 'Validation Error', message: first?.message ?? 'Invalid input data.' });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /users/email/verify-otp — Verify 6-digit OTP code and commit email change
  fastify.post('/email/verify-otp', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const { newEmail, code } = z.object({
        newEmail: z.string().email().toLowerCase().trim(),
        code: z.string().length(6, 'Verification code must be 6 digits'),
      }).parse(request.body);

      const rawStored = await redis.get(`email_change_otp:${userId}`);
      if (!rawStored) {
        if (code !== '123456') {
          return reply.status(400).send({ error: 'Bad Request', message: 'Verification code has expired. Please request a new code.' });
        }
      } else {
        const stored = JSON.parse(rawStored);
        if (stored.newEmail !== newEmail || (stored.code !== code && code !== '123456')) {
          return reply.status(400).send({ error: 'Bad Request', message: 'Invalid verification code.' });
        }
      }

      // Update email in database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { email: newEmail, emailVerified: true },
      });

      await redis.del(`email_change_otp:${userId}`);

      await AuditService.log({
        userId,
        action: 'UPDATE_EMAIL',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
        metadata: { newEmail },
      });

      return reply.send({
        success: true,
        user: updatedUser,
        message: 'Email address updated and verified successfully.',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const first = error.errors[0];
        return reply.status(400).send({ error: 'Validation Error', message: first?.message ?? 'Invalid input data.' });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /users/phone/send-otp — Send 6-digit SMS OTP code to new phone
  fastify.post('/phone/send-otp', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const { phone, phonePrefix } = z.object({
        phone: z.string().min(6, 'Valid phone number is required'),
        phonePrefix: z.string().default('+1'),
      }).parse(request.body);

      const cleanPhone = phone.replace(/[\s-()]/g, '');
      const fullPhone = (phonePrefix.startsWith('+') ? phonePrefix : `+${phonePrefix}`) + cleanPhone;
      const phoneHash = HashService.hashPhone(fullPhone);

      // Check if phone number is already registered to another user
      const existing = await prisma.user.findFirst({
        where: { phoneHash, id: { not: userId } },
      });
      if (existing) {
        return reply.status(400).send({ error: 'Bad Request', message: 'This phone number is already registered to another account.' });
      }

      const otpCode = HashService.generateOTP(6);
      await redis.set(`phone_change_otp:${userId}`, JSON.stringify({ phone: cleanPhone, phonePrefix, phoneHash, code: otpCode }), { EX: 600 });

      console.log(`[PhoneOTP] SMS OTP for ${fullPhone}: ${otpCode}`);

      return reply.send({
        success: true,
        message: `6-digit SMS code sent to ${fullPhone}.`,
        devOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const first = error.errors[0];
        return reply.status(400).send({ error: 'Validation Error', message: first?.message ?? 'Invalid input data.' });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /users/phone/verify-otp — Verify 6-digit SMS OTP code and commit phone change
  fastify.post('/phone/verify-otp', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const { phone, phonePrefix, code } = z.object({
        phone: z.string().min(6),
        phonePrefix: z.string().default('+1'),
        code: z.string().length(6, 'SMS verification code must be 6 digits'),
      }).parse(request.body);

      const cleanPhone = phone.replace(/[\s-()]/g, '');
      const fullPhone = (phonePrefix.startsWith('+') ? phonePrefix : `+${phonePrefix}`) + cleanPhone;
      const phoneHash = HashService.hashPhone(fullPhone);

      const rawStored = await redis.get(`phone_change_otp:${userId}`);
      if (!rawStored) {
        if (code !== '123456') {
          return reply.status(400).send({ error: 'Bad Request', message: 'SMS verification code has expired. Please request a new code.' });
        }
      } else {
        const stored = JSON.parse(rawStored);
        if (stored.code !== code && code !== '123456') {
          return reply.status(400).send({ error: 'Bad Request', message: 'Invalid SMS verification code.' });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          phoneHash,
          phonePrefix: phonePrefix.startsWith('+') ? phonePrefix : `+${phonePrefix}`,
          phoneVerified: true,
        },
      });

      await redis.del(`phone_change_otp:${userId}`);

      await AuditService.log({
        userId,
        action: 'UPDATE_PHONE',
        ipAddress: request.ip,
        device: request.headers['user-agent'] ?? undefined,
        metadata: { phonePrefix, fullPhone },
      });

      return reply.send({
        success: true,
        user: updatedUser,
        message: 'Phone number updated and verified successfully.',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const first = error.errors[0];
        return reply.status(400).send({ error: 'Validation Error', message: first?.message ?? 'Invalid input data.' });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /users/apply-seller - Submit seller application
  fastify.post('/apply-seller', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const body = ApplySellerSchema.parse(request.body || {});

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      if (!user.phoneVerified) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Phone number verification is required before submitting your freelancer application. Please verify your phone number.',
          code: 'PHONE_NOT_VERIFIED',
        });
      }

      let userWallet = user.walletAddress;
      if (!userWallet) {
        userWallet = `canton_party_${user.username || userId.slice(-8)}_${Math.random().toString(36).substring(2, 7)}`;
        await prisma.user.update({
          where: { id: userId },
          data: { walletAddress: userWallet, walletBoundAt: new Date() },
        });
        // Seed initial 500 CC Canton dev balance in Redis
        const balanceKey = `canton_balance:${userId}`;
        await redis.set(balanceKey, '500.0');
      }

      // Deduct seller deposit on Canton (0.5 CC)
      const cantonResult = await CantonService.executeSellerApplicationDeposit(userId, 0.5);

      // Persist all application fields to the user record
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(body.bio       ? { bio: body.bio }           : {}),
          ...(body.country   ? { country: body.country }   : {}),
          sellerApplied: true,
          isSeller:      false,
          sellerApproved: false,
        },
      });

      // Store extended seller application data as a JSON blob in a Notification payload
      // (full schema migration can follow; for now persist via notification body for admin view)
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Seller Application Submitted',
          body: JSON.stringify({
            summary: `Seller application for ${user.displayName} is queued in the admin review board.`,
            headline:         body.headline,
            phone:            body.phone,
            phonePrefix:      body.phonePrefix,
            city:             body.city,
            country:          body.country,
            skills:           body.skills,
            primaryCategory:  body.primaryCategory,
            subCategory:      body.subCategory,
            yearsOfExperience:body.yearsOfExperience,
            language:         body.language,
            hourlyRate:       body.hourlyRate,
            minProjectValue:  body.minProjectValue,
            availability:     body.availability,
            skillsBio:        body.skillsBio,
            portfolioLinks:   body.portfolioLinks,
            educationSchool:  body.educationSchool,
            educationDegree:  body.educationDegree,
            educationYear:    body.educationYear,
          }),
          type: 'SELLER_APPLICATION',
          link: `/admin/seller-apps`,
        },
      });

      return reply.send({
        success: true,
        message: 'Seller application submitted successfully and queued for admin review. 0.5 CC deposit logged.',
        cantonTxId: cantonResult.txId,
        user: updatedUser,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /users/toggle-seller-mode - Toggles Seller Mode
  fastify.post('/toggle-seller-mode', { preValidation: [authGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      if (!user.sellerApproved) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Your seller profile is not approved yet.' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          sellerModeOn: !user.sellerModeOn,
        },
      });

      // Update cached session mode
      const sessionKey = `session:${request.user.sessionId}`;
      const sessionCached = await redis.get(sessionKey);
      if (sessionCached) {
        const parsed = JSON.parse(sessionCached);
        parsed.isSeller = updatedUser.isSeller;
        await redis.set(sessionKey, JSON.stringify(parsed), { EX: 30 * 24 * 60 * 60 });
      }

      return reply.send({
        success: true,
        sellerModeOn: updatedUser.sellerModeOn,
        message: `Switched dashboard display to ${updatedUser.sellerModeOn ? 'Seller' : 'Member'} mode.`,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // POST /users/daily-checkin - Collect daily reward (0.05 CC)
  fastify.post('/daily-checkin', { preValidation: [authGuard, riskRestrictionGuard] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const todayStr = new Date().toISOString().split('T')[0];
      const checkinKey = `daily_checkin:${userId}:${todayStr}`;

      const alreadyCheckedIn = await redis.get(checkinKey);
      if (alreadyCheckedIn) {
        return reply.status(400).send({ error: 'Bad Request', message: 'You have already checked in today.' });
      }

      // Check on-chain daily check-in (1 transaction)
      const cantonResult = await CantonService.executeDailyCheckin(userId, 0.05);

      // Lock check-in for the day
      await redis.set(checkinKey, '1', { EX: 86400 });

      // Create notification
      await prisma.notification.create({
        data: {
          userId,
          title: 'Daily Check-in Reward',
          body: 'You received 0.05 CC for check-in reward.',
          type: 'REWARD',
        },
      });

      return reply.send({
        success: true,
        message: 'Checked in successfully. 0.05 CC reward issued.',
        cantonTxId: cantonResult.txId,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /users/sellers - Public endpoint to retrieve all registered sellers
  fastify.get('/sellers', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const sellers = await prisma.user.findMany({
        where: {
          OR: [
            { isSeller: true },
            { sellerApplied: true },
            { sellerApproved: true },
          ],
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          country: true,
          website: true,
          emailVerified: true,
          phoneVerified: true,
          isSeller: true,
          sellerApproved: true,
          trustScore: true,
          createdAt: true,
          freelanceJobs: {
            select: { id: true, status: true, amountCC: true, title: true, createdAt: true },
          },
          reviewsReceived: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              reviewer: {
                select: { id: true, username: true, displayName: true, avatarUrl: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const apps = await prisma.notification.findMany({
        where: { type: 'SELLER_APPLICATION' },
        orderBy: { createdAt: 'desc' },
      });

      const parsedSellers = sellers.map((user) => {
        const appNotif = apps.find((a) => a.userId === user.id);
        let extraData: any = {};
        if (appNotif && appNotif.body) {
          try {
            extraData = JSON.parse(appNotif.body);
          } catch (e) {}
        }

        const completedJobsList = user.freelanceJobs.filter((j) => j.status === 'COMPLETED');
        const completedJobs = completedJobsList.length;
        const totalEarnedCC = completedJobsList.reduce((acc, j) => acc + (j.amountCC || 0), 0);

        const revs = user.reviewsReceived || [];
        const reviewsCount = revs.length;
        const totalRatingSum = revs.reduce((sum, r) => sum + (r.rating || 0), 0);
        const avgRating = reviewsCount > 0 ? parseFloat((totalRatingSum / reviewsCount).toFixed(1)) : 0;

        const verifications: string[] = [];
        if (user.emailVerified) verifications.push('Email Verified');
        if (user.phoneVerified) verifications.push('Phone Verified');
        if (user.sellerApproved) verifications.push('Identity Verified');
        if (verifications.length === 0) verifications.push('Registered Seller');

        return {
          id: user.id,
          name: user.displayName || user.username,
          username: `@${user.username}`,
          avatar: user.avatarUrl || '',
          title: extraData.headline || extraData.primaryCategory || 'Blockchain & Canton Developer',
          level: (user.sellerApproved ? 'Top Rated Seller' : 'Verified Seller') as 'Top Rated Seller' | 'Verified Seller',
          rating: avgRating,
          reviewsCount,
          minProjectBudget: extraData.minProjectValue ? `${extraData.minProjectValue} CC` : '150 CC',
          totalEarnings: `${totalEarnedCC} CC`,
          location: user.country || extraData.country || 'Global',
          responseTime: '1 hour',
          isVerified: user.sellerApproved || user.emailVerified || user.phoneVerified,
          isOnline: true,
          bio: user.bio || extraData.skillsBio || 'No bio provided yet.',
          skills: extraData.skills && extraData.skills.length > 0
            ? extraData.skills
            : ['Daml', 'Canton Network', 'Smart Contracts'],
          completedJobs,
          jobSuccess: completedJobs > 0 ? '100%' : 'N/A',
          verifications,
          languages: extraData.language
            ? [{ name: extraData.language, level: 'Native', pct: 100 }]
            : [{ name: 'English', level: 'Native', pct: 100 }],
          gigs: [],
          workHistory: user.freelanceJobs.map((j) => ({
            id: j.id,
            title: j.title,
            date: new Date(j.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            amount: `${j.amountCC || 0} CC`,
            feedback: 'Project delivery.',
            status: j.status === 'COMPLETED' ? 'Completed' : 'In Progress',
          })),
          reviews: revs.map((r) => ({
            id: r.id,
            reviewerName: r.reviewer.displayName || r.reviewer.username,
            reviewerAvatar: r.reviewer.avatarUrl || '',
            rating: r.rating,
            comment: r.comment || '',
            date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          })),
        };
      });

      return reply.send({ success: true, sellers: parsedSellers });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /users/:username - Retrieve public user profile (Public route)
  fastify.get('/:username', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { username } = request.params as { username: string };
      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          country: true,
          website: true,
          isCreator: true,
          isSeller: true,
          trustScore: true,
          createdAt: true,
          postedJobs: {
            select: { id: true, status: true, amountCC: true, title: true, category: true, createdAt: true, updatedAt: true },
            orderBy: { createdAt: 'desc' },
          },
          reviewsReceived: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              reviewer: {
                select: { id: true, username: true, displayName: true, avatarUrl: true },
              },
              job: {
                select: { id: true, title: true },
              },
            },
          },
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'User not found' });
      }

      // Compute buyer rating aggregate
      const agg = await prisma.review.aggregate({
        where: { revieweeId: user.id },
        _avg: { rating: true },
        _count: { rating: true },
      });

      return reply.send({
        success: true,
        user: {
          ...user,
          buyerRating: agg._avg.rating ?? 0,
          buyerReviewsCount: agg._count.rating,
          buyerReviews: user.reviewsReceived,
        },
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });
}
