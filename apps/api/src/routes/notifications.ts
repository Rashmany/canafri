import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authGuard } from '../middleware/auth.js';
import { NotificationService } from '../services/notification.js';

export async function notificationRoutes(fastify: FastifyInstance) {
  // All notification endpoints are authenticated
  fastify.addHook('preValidation', authGuard);

  // GET /notifications - List user's notifications (paginated, with unread count)
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const query = request.query as {
        page?: string;
        limit?: string;
        unreadOnly?: string;
      };

      const page = Math.max(1, parseInt(query.page || '1', 10));
      const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10)));
      const skip = (page - 1) * limit;

      const where: any = { userId };

      if (query.unreadOnly === 'true') {
        where.read = false;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where }),
        NotificationService.getUnreadCount(userId),
      ]);

      return reply.send({
        success: true,
        notifications,
        total,
        unreadCount,
        page,
        pages: Math.ceil(total / limit) || 1,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // GET /notifications/unread-count
  fastify.get('/unread-count', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const unreadCount = await NotificationService.getUnreadCount(userId);
      return reply.send({ success: true, unreadCount });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // PATCH /notifications/:id/read - Mark single notification as read
  fastify.patch('/:id/read', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const { id } = request.params as { id: string };

      const notif = await prisma.notification.findUnique({ where: { id } });

      if (!notif || notif.userId !== userId) {
        return reply.status(404).send({ error: 'Not Found', message: 'Notification not found' });
      }

      await prisma.notification.update({ where: { id }, data: { read: true } });

      const unreadCount = await NotificationService.getUnreadCount(userId);
      return reply.send({ success: true, message: 'Notification marked as read.', unreadCount });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // PATCH /notifications/mark-all-read
  fastify.patch('/mark-all-read', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;

      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });

      return reply.send({ success: true, message: 'All notifications marked as read.', unreadCount: 0 });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });

  // DELETE /notifications/:id
  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;
      const { id } = request.params as { id: string };

      const notif = await prisma.notification.findUnique({ where: { id } });

      if (!notif || notif.userId !== userId) {
        return reply.status(404).send({ error: 'Not Found', message: 'Notification not found' });
      }

      await prisma.notification.delete({ where: { id } });

      const unreadCount = await NotificationService.getUnreadCount(userId);
      return reply.send({ success: true, message: 'Notification deleted.', unreadCount });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  });
}
