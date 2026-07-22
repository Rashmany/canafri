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

    // 3. Verify Session — Redis fast path first
    const sessionKey    = `session:${sessionId}`;
    const sessionCached = await redis.get(sessionKey);

    if (!sessionCached) {
      // Slow path: hit the database
      const dbSession = await prisma.session.findUnique({
        where:   { id: sessionId },
        include: { user: { select: { id: true, status: true } } },
      });

      if (!dbSession || dbSession.expiresAt < new Date()) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Session has expired or been revoked.' });
      }

      // 4. Verify User exists and is ACTIVE
      if (!dbSession.user || dbSession.user.status !== 'ACTIVE') {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Account is not active.' });
      }

      // Restore session to Redis
      await redis.set(sessionKey, JSON.stringify({ userId, role: payload.role }), {
        EX: 30 * 24 * 60 * 60,
      });
    }

    // 5. Reset TTL on active sessions (rolling window)
    await redis.expire(sessionKey, 30 * 24 * 60 * 60);

    // 6. Normalise — guarantee userId is always a plain string in handlers
    (request.user as any).userId    = userId;
    (request.user as any).sessionId = sessionId;

  } catch {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired authentication token.' });
  }
}

export function roleGuard(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const role = request.user?.role;
    if (!role) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Insufficient permissions.' });
    }
    const isAdminRole = ['ADMIN', 'SUPER_ADMIN', 'CONTENT_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'].includes(role);
    if (roles.includes('ADMIN') && isAdminRole) {
      return;
    }
    if (roles.includes(role)) {
      return;
    }
    return reply.status(403).send({ error: 'Forbidden', message: 'Insufficient permissions.' });
  };
}

export async function creatorGuard(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.isCreator) {
    return reply.status(403).send({ error: 'Forbidden', message: 'Creator access only.' });
  }
}

export async function sellerGuard(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user?.isSeller) {
    return reply.status(403).send({ error: 'Forbidden', message: 'Seller profile required.' });
  }
}
