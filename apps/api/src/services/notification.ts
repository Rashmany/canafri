import { prisma } from '../lib/prisma.js';
import { getIO } from './socket.js';

export interface SendNotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: string;
  category?: 'FREELANCE' | 'COMMUNITY' | 'ACCOUNT' | 'WALLET' | 'ADMIN' | string;
  link?: string;
  actorId?: string;
  targetId?: string;
}

export class NotificationService {
  static async send(payload: SendNotificationPayload) {
    try {
      const { userId, title, body, type, category = 'FREELANCE', link, actorId, targetId } = payload;

      if (!userId) return null;

      // Deduplication check: prevent duplicate notification within 5 seconds for same event
      const fiveSecsAgo = new Date(Date.now() - 5000);
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          type,
          title,
          createdAt: { gte: fiveSecsAgo },
        },
      });

      if (existing) {
        return existing;
      }

      // 1. Create in PostgreSQL
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          body,
          type,
          link,
        },
      });

      // 2. Count current unread notifications for recipient
      const unreadCount = await prisma.notification.count({
        where: { userId, read: false },
      });

      // 3. Emit real-time Socket.IO event to user's room
      try {
        const io = getIO();
        if (io) {
          io.to(`user:${userId}`).emit('new_notification', {
            notification,
            unreadCount,
          });
        }
      } catch (e) {
        // Socket.io not initialized yet or in offline test context
      }

      return notification;
    } catch (error) {
      console.error('NotificationService.send error:', error);
      return null;
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  }
}
