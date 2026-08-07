import { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../lib/redis.js';
import { prisma } from '../lib/prisma.js';

/**
 * JWT payload shape.
 *
 * New email/password tokens:  sub  = userId
 * Legacy phone-OTP tokens:    userId = userId (no sub field)
 *
 * authGuard always normalises both shapes so that
 * `request.user.userId` is ALWAYS a guaranteed string
 * after the guard runs. All route handlers can rely on this.
 */
export interface JWTPayload {
  // New spec fields
  sub?:           string;
  role?:          string;
  sessionId?:     string;
  emailVerified?: boolean;
  displayName?:   string;
  username?:      string;
  iat?:           number;
  exp?:           number;
  // Legacy phone-OTP fields (backwards compat)
  userId:         string;   // Always set by authGuard — never undefined in handlers
  isCreator?:     boolean;
  isSeller?:      boolean;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload;
    user:    JWTPayload;
  }
}

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    // 1. Verify JWT signature and expiry
    await request.jwtVerify();
    const payload = request.user;

    // Resolve userId from both payload shapes
    const userId    = (payload.sub ?? payload.userId ?? '').trim();
    const sessionId = (payload.sessionId ?? '').trim();

    if (!userId || !sessionId) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid authentication token.' });
    }

    // 2. Check Access Token blacklist (populated on logout)
    const authHeader = request.headers.authorization ?? '';
    const rawToken   = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (rawToken) {
      const blacklisted = await redis.exists(`blacklist:${rawToken}`);
      if (blacklisted) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Token has been revoked.' });
      }
    }

    // 3. Verify Session & Live User Status — Redis fast path first
    const sessionKey    = `session:${sessionId}`;
    const sessionCached = await redis.get(sessionKey);

    if (!sessionCached) {
      // Slow path: hit the database
      const dbSession = await prisma.session.findUnique({
        where:   { id: sessionId },
        include: { user: { select: { id: true, status: true, role: true } } },
      });

      if (!dbSession || dbSession.expiresAt < new Date()) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Session has expired or been revoked.' });
      }

      // Verify User exists and is ACTIVE
      if (!dbSession.user || dbSession.user.status !== 'ACTIVE') {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Your administrator access has been revoked. Please contact the platform owner.' });
      }

      // Cache live user info
      await redis.set(sessionKey, JSON.stringify({ userId, role: dbSession.user.role, status: dbSession.user.status }), {
        EX: 8 * 60 * 60,
      });

      (request.user as any).role = dbSession.user.role;
    } else {
      // Fast path: verify cached session status
      const parsedSession = JSON.parse(sessionCached);
      if (parsedSession.status && parsedSession.status !== 'ACTIVE') {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Your administrator access has been revoked. Please contact the platform owner.' });
      }
      if (parsedSession.role) {
        (request.user as any).role = parsedSession.role;
      }
    }

    // 5. Reset TTL on active sessions (rolling window)
    await redis.expire(sessionKey, 8 * 60 * 60);

    // 6. Normalise — guarantee userId is always a plain string in handlers
    (request.user as any).userId    = userId;
    (request.user as any).sessionId = sessionId;

  } catch {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired authentication token.' });
  }
}

export function roleGuard(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    let role = request.user?.role;

    // Fallback: If role is missing from JWT payload, query the database live
    if (!role && request.user?.userId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: request.user.userId },
        select: { role: true },
      });
      if (dbUser) {
        role = dbUser.role;
        (request.user as any).role = role;
      }
    }

    if (!role) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Insufficient permissions. Role missing.' });
    }

    if (role === 'SUPER_ADMIN') {
      return;
    }

    if (roles.includes(role)) {
      return;
    }

    return reply.status(403).send({
      error: 'Forbidden',
      message: `Insufficient permissions. Account role is ${role}, but this action requires ${roles.join(' or ')}.`,
    });
  };
}

export async function creatorGuard(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required.' });
  }
}

export async function sellerGuard(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user?.userId;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required.' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isSeller: true, sellerApproved: true },
  });

  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'User not found.' });
  }

  if (!user.isSeller && !user.sellerApproved) {
    await prisma.user.update({
      where: { id: userId },
      data: { isSeller: true, sellerApproved: true, sellerModeOn: true },
    });
  }
}
