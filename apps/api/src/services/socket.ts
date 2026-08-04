import { Server, Socket } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { redis } from '../lib/redis.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let io: Server | null = null;

export function initSocketServer(fastifyServer: FastifyInstance): Server {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  io = new Server(fastifyServer.server, {
    cors: {
      origin: [frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Socket Authentication Middleware using Fastify's JWT instance
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const decoded = fastifyServer.jwt.verify<{ sub?: string; userId?: string }>(token);
      const userId = (decoded.sub || decoded.userId || '').trim();

      if (!userId) {
        return next(new Error('Authentication error: Invalid user payload'));
      }

      socket.userId = userId;
      next();
    } catch (err: any) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    if (!userId) return;

    // Join personal user room
    socket.join(`user:${userId}`);

    // Update Presence in Redis
    try {
      await redis.set(`presence:${userId}`, 'online');
      await redis.set(`last_seen:${userId}`, new Date().toISOString());

      // Broadcast presence change to all clients
      io?.emit('presence_update', {
        userId,
        status: 'online',
        lastSeen: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Redis presence error on connect:', e);
    }

    // Handle Typing Start
    socket.on('typing_start', ({ receiverId }: { receiverId: string }) => {
      if (!receiverId) return;
      io?.to(`user:${receiverId}`).emit('user_typing', {
        senderId: userId,
        receiverId,
        isTyping: true,
      });
    });

    // Handle Typing Stop
    socket.on('typing_stop', ({ receiverId }: { receiverId: string }) => {
      if (!receiverId) return;
      io?.to(`user:${receiverId}`).emit('user_typing', {
        senderId: userId,
        receiverId,
        isTyping: false,
      });
    });

    // Handle Mark Read
    socket.on('mark_read', ({ conversationId }: { conversationId: string }) => {
      if (!conversationId) return;
      io?.to(`user:${conversationId}`).emit('messages_read', {
        readByUserId: userId,
        senderId: conversationId,
      });
    });

    // Handle Disconnect
    socket.on('disconnect', async () => {
      try {
        const lastSeen = new Date().toISOString();
        await redis.set(`presence:${userId}`, 'offline');
        await redis.set(`last_seen:${userId}`, lastSeen);

        io?.emit('presence_update', {
          userId,
          status: 'offline',
          lastSeen,
        });
      } catch (e) {
        console.error('Redis presence error on disconnect:', e);
      }
    });
  });

  console.log('Socket.IO real-time server initialized');
  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io server has not been initialized yet.');
  }
  return io;
}

export function broadcastNewMessage(message: any) {
  if (!io) return;
  const { senderId, receiverId } = message;

  // Emit to receiver's room and sender's room
  io.to(`user:${receiverId}`).emit('new_message', message);
  io.to(`user:${senderId}`).emit('new_message', message);
}

export function broadcastMessagesRead(readByUserId: string, targetUserId: string) {
  if (!io) return;
  io.to(`user:${targetUserId}`).emit('messages_read', {
    readByUserId,
    senderId: targetUserId,
  });
}
