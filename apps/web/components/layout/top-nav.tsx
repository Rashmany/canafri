'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, Bell, X, Check, Trash2, Inbox, Menu,
  // Freelancing
  Briefcase, FileText, CheckCircle2, XCircle, UserCheck, UploadCloud, ShieldCheck, RefreshCw, ShieldAlert, Star,
  // Messaging
  Mail, MailCheck, MessageCircle, MessageSquare,
  // Community
  Heart, UserPlus,
  // Wallet
  ArrowDownToLine, ArrowUpFromLine, CreditCard, DollarSign, AlertCircle, Lock, Key,
  // Account
  Smartphone, User, BadgeCheck,
  // Platform
  Wrench, Megaphone, AlertTriangle, Info,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { AvatarOnline } from '@/components/ui/avatar-online';
import { SearchDropdown } from '@/components/ui/search-dropdown';
import { addToSearchHistory } from '@/lib/search-service';
import {
  useNotifications,
  formatNotificationTime,
  getNotificationMeta,
  type AppNotification,
} from '@/hooks/use-notifications';

// Centralised Lucide icon lookup — keyed by the icon name string in NOTIFICATION_ICON_MAP
const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
  Briefcase, FileText, CheckCircle2, XCircle, UserCheck, UploadCloud,
  ShieldCheck, RefreshCw, ShieldAlert, Star, Mail, MailCheck, MessageCircle, MessageSquare,
  Heart, UserPlus, ArrowDownToLine, ArrowUpFromLine, CreditCard, DollarSign,
  AlertCircle, Lock, Key, Smartphone, User, BadgeCheck, Wrench, Megaphone, AlertTriangle, Info, Bell,
};

/** Renders the correct Lucide icon for a notification type with badge styling */
function NotificationIcon({ type, size = 15 }: { type: string; size?: number }) {
  const meta = getNotificationMeta(type);
  const IconComponent = LUCIDE_ICON_MAP[meta.icon] ?? Bell;
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${meta.bg}`}>
      <IconComponent size={size} className={meta.color} strokeWidth={1.75} />
    </div>
  );
}

// NOTE: AvatarOnline is defined in '@/components/ui/avatar-online' and shared
// with the Sidebar. It is intentionally NOT re-exported from here.

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopNavUser {
  name: string;
  /** URL / path to the avatar image */
  avatarSrc?: string;
}

interface TopNavProps {
  user?: TopNavUser;
  /** Called when the mobile hamburger (avatar) is tapped to open the drawer */
  onMenuOpen?: () => void;
  /** Active page label — determines centre content on mobile */
  activePage?: string;
  onSearchNavigate?: (query: string) => void;
  /** Called when a notification deep-link is clicked */
  onNavigate?: (page: string) => void;
}

const DEFAULT_AVATAR = '/images/default-avatar.png';

// ─── Search bar ───────────────────────────────────────────────────────────────

function SearchBar({
  className = '',
  onSearchNavigate,
}: {
  className?: string;
  onSearchNavigate?: (query: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    if (focused) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [focused]);

  const handleSearch = (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;
    addToSearchHistory(q);
    setQuery(q);
    setFocused(false);
    inputRef.current?.blur();
    onSearchNavigate?.(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    } else if (e.key === 'Escape') {
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="h-[2.1875rem] rounded-[3.125rem] bg-sidebar border border-border/40 transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
        <div className="flex size-full items-center gap-[0.875rem] px-[1.3125rem]">
          <Search
            size={15}
            strokeWidth={2}
            className="shrink-0 text-foreground/60"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            id="topnav-search"
            type="search"
            placeholder="Search creators, freelancers, services, articles, jobs..."
            aria-label="Search CanaFri"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            className="w-full border-none bg-transparent font-sans text-[0.75rem] font-normal text-foreground/70 outline-none placeholder:text-foreground/50"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="text-foreground/40 hover:text-foreground/75 cursor-pointer shrink-0"
              type="button"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {focused && (
        <SearchDropdown
          query={query}
          onQueryChange={setQuery}
          onSearch={handleSearch}
          onClose={() => setFocused(false)}
        />
      )}
    </div>
  );
}

// ─── Notification bell button ─────────────────────────────────────────────────

function NotificationBell({
  count = 0,
  onClick,
}: {
  count?: number;
  onClick?: () => void;
}) {
  return (
    <button
      id="topnav-notifications-trigger"
      type="button"
      aria-label={`Open notifications${count > 0 ? `, ${count} unread` : ''}`}
      onClick={onClick}
      className="relative flex size-[2.1875rem] cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5CFF]"
    >
      <Bell size={20} strokeWidth={1.5} className="text-foreground" />

      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-0 top-0 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#8C5CFF] px-[0.1875rem] font-sans text-[0.5rem] font-medium leading-none text-white animate-in zoom-in-75 duration-200"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

// ─── Single notification row ───────────────────────────────────────────────────

function NotificationRow({
  notification,
  onRead,
  onDelete,
  onNavigate,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate?: (page: string) => void;
}) {
  const handleClick = useCallback(() => {
    if (!notification.read) onRead(notification.id);
    if (notification.link && onNavigate) {
      const linkMap: Record<string, string> = {
        '/orders': 'Orders',
        '/dashboard': 'Dashboard',
        '/community': 'Community',
        '/wallet': 'Wallet',
        '/become-seller': 'Become a Seller',
        '/find-jobs': 'Find Jobs',
      };
      const page = linkMap[notification.link] ?? 'Dashboard';
      onNavigate(page);
    }
  }, [notification, onRead, onNavigate]);

  return (
    <div
      className={`group relative flex items-start gap-3.5 border-b border-border/50 px-4 py-3.5 transition-colors cursor-pointer hover:bg-foreground/[0.03] ${!notification.read ? 'bg-primary/[0.03] dark:bg-primary/[0.05]' : ''
        }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Dynamic Lucide icon badge */}
      <NotificationIcon type={notification.type} />

      <div className="min-w-0 flex-1 pr-6">
        <div className="flex items-center justify-between gap-2">
          <p className={`font-sans text-[0.8125rem] leading-snug truncate ${!notification.read ? 'font-semibold text-foreground' : 'font-medium text-foreground/85'
            }`}>
            {notification.title}
          </p>
          <span className="shrink-0 font-sans text-[0.6875rem] text-muted-foreground/70">
            {formatNotificationTime(notification.createdAt)}
          </span>
        </div>
        <p className="mt-1 font-sans text-[0.75rem] leading-relaxed text-foreground/65 line-clamp-2">
          {notification.body}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}

      {/* Hover actions */}
      <div
        className="absolute right-3 top-3 hidden gap-1.5 group-hover:flex bg-background/95 backdrop-blur-sm p-0.5 rounded-full border border-border/40 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {!notification.read && (
          <button
            type="button"
            title="Mark as read"
            onClick={(e) => { e.stopPropagation(); onRead(notification.id); }}
            className="flex h-6 w-6 items-center justify-center rounded-full text-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Check size={12} />
          </button>
        )}
        <button
          type="button"
          title="Delete"
          onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
          className="flex h-6 w-6 items-center justify-center rounded-full text-foreground/60 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Notification panel ───────────────────────────────────────────────────────

function NotificationPanel({
  onClose,
  onNavigate,
}: {
  onClose: () => void;
  onNavigate?: (page: string) => void;
}) {
  const { notifications, loading, hasMore, markAsRead, markAllRead, deleteNotification, loadMore, refresh } =
    useNotifications();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Refresh data every time the panel mounts (opens)
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll: load next page when user scrolls near bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 60 && hasMore && !loading) {
        loadMore();
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [hasMore, loading, loadMore]);

  return (
    <div
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-full z-50 mt-2 w-[23rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[0.875rem] border border-border/80 bg-background/95 backdrop-blur-md shadow-2xl shadow-black/10 dark:shadow-black/40 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-muted/20">
        <p className="font-sans text-[0.875rem] font-semibold text-foreground">Notifications</p>
        <button
          type="button"
          onClick={() => { markAllRead(); }}
          className="font-sans text-[0.6875rem] font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
        >
          Mark all read
        </button>
      </div>

      {/* Scrollable list */}
      <div ref={scrollRef} className="max-h-[26rem] overflow-y-auto overscroll-contain divide-y-0">
        {loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-[0.75rem] text-muted-foreground">Loading notifications…</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-12 px-4 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground/5">
              <Inbox size={20} className="text-foreground/40" />
            </div>
            <p className="text-[0.8125rem] font-medium text-foreground/80">All caught up!</p>
            <p className="text-[0.75rem] text-muted-foreground max-w-[15rem]">
              You don't have any notifications right now.
            </p>
          </div>
        ) : (
          <>
            {notifications.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onRead={markAsRead}
                onDelete={deleteNotification}
                onNavigate={(page) => { onNavigate?.(page); onClose(); }}
              />
            ))}
            {loading && (
              <div className="flex items-center justify-center py-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
            {!hasMore && notifications.length > 0 && (
              <p className="py-3 text-center font-sans text-[0.6875rem] text-muted-foreground/60">
                You're all caught up ✓
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * CanaFri top navigation bar.
 */
export default function TopNav({
  user = { name: 'User' },
  onMenuOpen,
  activePage = 'Dashboard',
  onSearchNavigate,
  onNavigate,
}: TopNavProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useNotifications();

  const handleBellToggle = useCallback(() => {
    setNotifOpen((v) => !v);
  }, []);

  // Close notification panel when clicking outside
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [notifOpen]);

  const resolvedAvatar = user.avatarSrc ?? DEFAULT_AVATAR;

  return (
    <header className={`flex h-[4.5rem] w-full shrink-0 items-center bg-background px-[1.5rem] md:px-[2.3125rem] ${activePage === 'Dashboard' ? '' : 'border-b border-border'}`}>

      {/* ── Mobile layout (<md) — avatar+search | logo/page title | bell ── */}
      <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 md:hidden">

        {/* Left: hamburger menu — tapping opens the mobile sidebar drawer */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={onMenuOpen}
            aria-label="Open Navigation Menu"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-foreground/5 hover:bg-foreground/10 active:scale-95 transition-all text-foreground border border-border/50 cursor-pointer"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Centre: logo on Dashboard, page name elsewhere */}
        <div className="flex justify-center">
          {activePage === 'Dashboard' ? (
            <Logo collapsed={true} />
          ) : (
            <p className="truncate font-sans text-base font-medium text-foreground">
              {activePage}
            </p>
          )}
        </div>

        {/* Right: notification bell */}
        <div ref={notifRef} className="relative flex justify-end">
          <NotificationBell
            count={unreadCount}
            onClick={handleBellToggle}
          />
          {notifOpen && (
            <NotificationPanel
              onClose={() => setNotifOpen(false)}
              onNavigate={onNavigate}
            />
          )}
        </div>
      </div>

      {/* ── Tablet / Desktop layout (md+) — search left, bell right ── */}
      <div className="hidden w-full items-center justify-between gap-4 md:flex">
        <SearchBar className="w-56 shrink-0 lg:w-72" onSearchNavigate={onSearchNavigate} />

        <div ref={notifRef} className="relative">
          <NotificationBell
            count={unreadCount}
            onClick={handleBellToggle}
          />
          {notifOpen && (
            <NotificationPanel
              onClose={() => setNotifOpen(false)}
              onNavigate={onNavigate}
            />
          )}
        </div>
      </div>

    </header>
  );
}
