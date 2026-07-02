import { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../lib/redis.js';

export interface JWTPayload {
  userId: string;
  role: string;
  isCreator: boolean;
  isSeller: boolean;
  sessionId: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    // 1. Verify access token using fastify-jwt
    await request.jwtVerify();
    const payload = request.user as JWTPayload;

    if (!payload || !payload.userId || !payload.sessionId) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid token payload' });
    }

    // 2. Check Redis for session status
    const sessionKey = `session:${payload.sessionId}`;
    const sessionExists = await redis.exists(sessionKey);
    if (!sessionExists) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Session has expired or was revoked' });
    }

    // Update last seen in background
    await redis.expire(sessionKey, 86400 * 30); // reset 30 day TTL
  } catch (err: any) {
    return reply.status(401).send({ error: 'Unauthorized', message: err.message || 'Token verification failed' });
  }
}

export function roleGuard(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    if (!user || !roles.includes(user.role)) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Insufficient permissions' });
    }
  };
}

export async function creatorGuard(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user || !user.isCreator) {
    return reply.status(403).send({ error: 'Forbidden', message: 'Creator mode access only' });
  }
}

export async function sellerGuard(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user || !user.isSeller) {
    return reply.status(403).send({ error: 'Forbidden', message: 'Seller profile required' });
  }
}
