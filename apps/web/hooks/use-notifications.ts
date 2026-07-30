'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  category: string;
  actorId?: string | null;
  targetId?: string | null;
  read: boolean;
  link?: string | null;
  deletedAt?: string | null;
  createdAt: string;
}

interface UseNotificationsReturn {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const PAGE_SIZE = 20;

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;

  const authHeaders = (): Record<string, string> => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchPage = useCallback(async (pageNum: number, replace = false) => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/notifications?page=${pageNum}&limit=${PAGE_SIZE}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const data = await res.json();
      const fetched: AppNotification[] = data.notifications ?? [];
      setUnreadCount(data.unreadCount ?? 0);
      setHasMore(pageNum < (data.pages ?? 1));
      setNotifications(prev => replace ? fetched : [...prev, ...fetched]);
    } catch (e) {
      console.error('useNotifications fetchPage error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setPage(1);
    return fetchPage(1, true);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    setPage(next);
    await fetchPage(next, false);
  }, [hasMore, loading, page, fetchPage]);

  // Initial load
  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  // Socket.IO real-time subscription
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socketRef.current = socket;

    const handleNewNotification = ({ notification, unreadCount: count }: { notification: AppNotification; unreadCount: number }) => {
      setNotifications(prev => {
        // Prevent duplicates
        if (prev.some(n => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
      setUnreadCount(count);
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
      socketRef.current = null;
    };
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch (e) {
      console.error('markAsRead error:', e);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: authHeaders(),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error('markAllRead error:', e);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(prev => prev.filter(n => n.id !== id));
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch (e) {
      console.error('deleteNotification error:', e);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    markAsRead,
    markAllRead,
    deleteNotification,
    loadMore,
    refresh,
  };
}

/** Format a timestamp cleanly as "2m ago", "Yesterday", or "Jul 28, 2026" */
export function formatNotificationTime(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Centralized notification icon metadata.
 * Keys match the `type` field stored in the Notification DB record.
 * `icon` values are Lucide React icon component names (imported in top-nav.tsx).
 */
export type NotificationIconMeta = {
  /** Lucide icon component name string – resolved to the component in the render layer */
  icon: string;
  /** Subtle background container style */
  bg: string;
  /** Subtle icon stroke color style */
  color: string;
};

export const NOTIFICATION_ICON_MAP: Record<string, NotificationIconMeta> = {
  // ── Freelancing ──────────────────────────────────────────────────────────
  JOB_POSTED:           { icon: 'Briefcase',      bg: 'bg-indigo-500/10 dark:bg-indigo-400/15',   color: 'text-indigo-600 dark:text-indigo-400' },
  PROPOSAL_SUBMITTED:   { icon: 'FileText',       bg: 'bg-blue-500/10 dark:bg-blue-400/15',       color: 'text-blue-600 dark:text-blue-400' },
  PROPOSAL_ACCEPTED:    { icon: 'CheckCircle2',   bg: 'bg-emerald-500/10 dark:bg-emerald-400/15', color: 'text-emerald-600 dark:text-emerald-400' },
  PROPOSAL_REJECTED:    { icon: 'XCircle',        bg: 'bg-rose-500/10 dark:bg-rose-400/15',       color: 'text-rose-600 dark:text-rose-400' },
  FREELANCER_HIRED:     { icon: 'UserCheck',      bg: 'bg-emerald-500/10 dark:bg-emerald-400/15', color: 'text-emerald-600 dark:text-emerald-400' },
  PROJECT_DELIVERY:     { icon: 'UploadCloud',    bg: 'bg-amber-500/10 dark:bg-amber-400/15',     color: 'text-amber-600 dark:text-amber-400' },
  MILESTONE_APPROVED:   { icon: 'CheckCircle2',   bg: 'bg-emerald-500/10 dark:bg-emerald-400/15', color: 'text-emerald-600 dark:text-emerald-400' },
  CONTRACT_COMPLETED:   { icon: 'ShieldCheck',    bg: 'bg-emerald-500/10 dark:bg-emerald-400/15', color: 'text-emerald-600 dark:text-emerald-400' },
  REVISION_REQUESTED:   { icon: 'RefreshCw',      bg: 'bg-amber-500/10 dark:bg-amber-400/15',     color: 'text-amber-600 dark:text-amber-400' },
  DISPUTE_OPENED:       { icon: 'ShieldAlert',    bg: 'bg-rose-500/10 dark:bg-rose-400/15',       color: 'text-rose-600 dark:text-rose-400' },
  REVIEW_RECEIVED:      { icon: 'Star',           bg: 'bg-amber-500/10 dark:bg-amber-400/15',     color: 'text-amber-500 dark:text-amber-400' },
  ESCROW_RELEASE:       { icon: 'ArrowDownToLine',bg: 'bg-emerald-500/10 dark:bg-emerald-400/15', color: 'text-emerald-600 dark:text-emerald-400' },

  // ── Messaging ────────────────────────────────────────────────────────────
  NEW_MESSAGE:          { icon: 'MessageCircle',  bg: 'bg-blue-500/10 dark:bg-blue-400/15',       color: 'text-blue-600 dark:text-blue-400' },
  MESSAGE_REPLY:        { icon: 'MessageSquare',  bg: 'bg-blue-500/10 dark:bg-blue-400/15',       color: 'text-blue-600 dark:text-blue-400' },

  // ── Community / Creator ──────────────────────────────────────────────────
  CONTENT_REPLY:        { icon: 'MessageSquare',  bg: 'bg-violet-500/10 dark:bg-violet-400/15',   color: 'text-violet-600 dark:text-violet-400' },
  CONTENT_LIKE:         { icon: 'Heart',          bg: 'bg-rose-500/10 dark:bg-rose-400/15',       color: 'text-rose-600 dark:text-rose-400' },
  CONTENT_FEATURED:     { icon: 'Star',           bg: 'bg-amber-500/10 dark:bg-amber-400/15',     color: 'text-amber-500 dark:text-amber-400' },
  CONTENT_COMMENT:      { icon: 'MessageSquare',  bg: 'bg-violet-500/10 dark:bg-violet-400/15',   color: 'text-violet-600 dark:text-violet-400' },
  NEW_POST:             { icon: 'FileText',       bg: 'bg-violet-500/10 dark:bg-violet-400/15',   color: 'text-violet-600 dark:text-violet-400' },
  NEW_FOLLOWER:         { icon: 'UserPlus',       bg: 'bg-blue-500/10 dark:bg-blue-400/15',       color: 'text-blue-600 dark:text-blue-400' },

  // ── Wallet & Payments ────────────────────────────────────────────────────
  DEPOSIT:              { icon: 'ArrowDownToLine',bg: 'bg-emerald-500/10 dark:bg-emerald-400/15', color: 'text-emerald-600 dark:text-emerald-400' },
  WITHDRAWAL:           { icon: 'ArrowUpFromLine',bg: 'bg-amber-500/10 dark:bg-amber-400/15',     color: 'text-amber-600 dark:text-amber-400' },
  PAYMENT_RECEIVED:     { icon: 'CreditCard',     bg: 'bg-emerald-500/10 dark:bg-emerald-400/15', color: 'text-emerald-600 dark:text-emerald-400' },
  PAYMENT_FAILED:       { icon: 'AlertCircle',    bg: 'bg-rose-500/10 dark:bg-rose-400/15',       color: 'text-rose-600 dark:text-rose-400' },
  ESCROW_FUNDED:        { icon: 'Lock',           bg: 'bg-violet-500/10 dark:bg-violet-400/15',   color: 'text-violet-600 dark:text-violet-400' },
  REFUND:               { icon: 'RefreshCw',      bg: 'bg-blue-500/10 dark:bg-blue-400/15',       color: 'text-blue-600 dark:text-blue-400' },

  // ── Account & Security ───────────────────────────────────────────────────
  SELLER_APPROVED:      { icon: 'BadgeCheck',    bg: 'bg-emerald-500/10 dark:bg-emerald-400/15', color: 'text-emerald-600 dark:text-emerald-400' },
  SELLER_REJECTED:      { icon: 'XCircle',        bg: 'bg-rose-500/10 dark:bg-rose-400/15',       color: 'text-rose-600 dark:text-rose-400' },
  EMAIL_VERIFIED:       { icon: 'MailCheck',      bg: 'bg-emerald-500/10 dark:bg-emerald-400/15', color: 'text-emerald-600 dark:text-emerald-400' },
  PHONE_VERIFIED:       { icon: 'Smartphone',     bg: 'bg-emerald-500/10 dark:bg-emerald-400/15', color: 'text-emerald-600 dark:text-emerald-400' },
  PASSWORD_CHANGED:     { icon: 'Key',             bg: 'bg-amber-500/10 dark:bg-amber-400/15',     color: 'text-amber-600 dark:text-amber-400' },
  LOGIN_ALERT:          { icon: 'ShieldAlert',    bg: 'bg-amber-500/10 dark:bg-amber-400/15',     color: 'text-amber-600 dark:text-amber-400' },
  PROFILE_UPDATED:      { icon: 'User',           bg: 'bg-blue-500/10 dark:bg-blue-400/15',       color: 'text-blue-600 dark:text-blue-400' },

  // ── Platform ─────────────────────────────────────────────────────────────
  MAINTENANCE:          { icon: 'Wrench',         bg: 'bg-foreground/10 dark:bg-foreground/15',    color: 'text-foreground/70' },
  ANNOUNCEMENT:         { icon: 'Megaphone',      bg: 'bg-blue-500/10 dark:bg-blue-400/15',       color: 'text-blue-600 dark:text-blue-400' },
  WARNING:              { icon: 'AlertTriangle',  bg: 'bg-amber-500/10 dark:bg-amber-400/15',     color: 'text-amber-600 dark:text-amber-400' },
  SUCCESS:              { icon: 'CheckCircle2',   bg: 'bg-emerald-500/10 dark:bg-emerald-400/15', color: 'text-emerald-600 dark:text-emerald-400' },
  SYSTEM:               { icon: 'Info',           bg: 'bg-foreground/10 dark:bg-foreground/15',    color: 'text-foreground/60' },
};

/** Fallback when the type is not in the map */
export const DEFAULT_NOTIF_ICON_META: NotificationIconMeta = {
  icon: 'Bell',
  bg: 'bg-foreground/10 dark:bg-foreground/15',
  color: 'text-foreground/60',
};

/** Resolve icon metadata for a notification type, with fallback */
export function getNotificationMeta(type: string): NotificationIconMeta {
  return NOTIFICATION_ICON_MAP[type] ?? DEFAULT_NOTIF_ICON_META;
}
