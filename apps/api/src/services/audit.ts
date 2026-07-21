import { prisma } from '../lib/prisma.js';

export type AuditAction =
  | 'REGISTER'
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'LOGOUT_ALL'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'EMAIL_VERIFIED'
  | 'SESSION_CREATED'
  | 'SESSION_REVOKED'
  | 'REFRESH_ROTATED'
  | 'TOKEN_THEFT_DETECTED'
  | 'ACCOUNT_LOCKED'
  | 'UPDATE_USER_STATUS';

interface AuditParams {
  userId?: string;
  adminId?: string;
  action: AuditAction | string;
  target?: string;
  before?: object;
  after?: object;
  ipAddress?: string;
  device?: string;
}

export class AuditService {
  static async log(params: AuditParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId:    params.userId    ?? undefined,
          adminId:   params.adminId   ?? undefined,
          action:    params.action,
          target:    params.target    ?? undefined,
          before:    params.before    as any ?? undefined,
          after:     params.after     as any ?? undefined,
          ipAddress: params.ipAddress ?? undefined,
          device:    params.device    ?? undefined,
        },
      });
    } catch {
      // Never let audit logging crash the request
      console.error('[AuditService] Failed to persist audit log:', params.action);
    }
  }
}
