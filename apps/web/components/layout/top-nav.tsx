'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Bell } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { AvatarOnline } from '@/components/ui/avatar-online';

// NOTE: AvatarOnline is defined in '@/components/ui/avatar-online' and shared
// with the Sidebar. It is intentionally NOT re-exported from here.

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopNavUser {
  name: string;
  /** URL / path to the avatar image */
  avatarSrc?: string;
}

interface Notification {
  id: number;
  text: string;
  time: string;
  read: boolean;
}

interface TopNavProps {
  /** Number shown on the notification badge */
  notificationCount?: number;
  user?: TopNavUser;
  /** Called when the mobile hamburger (avatar) is tapped to open the drawer */
  onMenuOpen?: () => void;
  /** Active page label — determines centre content on mobile */
  activePage?: string;
}

// ─── Mock notification data ───────────────────────────────────────────────────
// TODO: Replace with real data from useQuery (TanStack Query) when the
//       notifications API endpoint is ready.

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1, text: 'Josh Trek sent you a message', time: '2m ago',  read: false },
  { id: 2, text: 'Your order #4821 was confirmed', time: '15m ago', read: false },
  { id: 3, text: 'New job match: Senior Designer', time: '1h ago', read: true },
];

const DEFAULT_AVATAR = '/images/default-avatar.png';

// ─── Search bar ───────────────────────────────────────────────────────────────

/**
 * Pill-shaped search input used on the desktop/tablet top nav.
 */
function SearchBar({ className = '' }: { className?: string }) {
  return (
    <div className={`h-[2.1875rem] rounded-[3.125rem] bg-sidebar border border-border/40 ${className}`}>
      <div className="flex size-full items-center gap-[0.875rem] px-[1.3125rem]">
        <Search
          size={15}
          strokeWidth={2}
          className="shrink-0 text-foreground/60"
          aria-hidden="true"
        />
        <input
          id="topnav-search"
          type="search"
          placeholder="Search..."
          aria-label="Search CanaFri"
          className="w-full border-none bg-transparent font-sans text-[0.75rem] font-normal text-foreground/70 outline-none placeholder:text-foreground/50"
        />
      </div>
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
          className="absolute right-0 top-0 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#8C5CFF] px-[0.1875rem] font-sans text-[0.5rem] font-medium leading-none text-white"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

// ─── Notification panel ───────────────────────────────────────────────────────

/**
 * Dropdown panel that lists recent notifications.
 * Rendered inside a `position: relative` ancestor so it anchors correctly.
 */
function NotificationPanel({
  notifications,
  onClose,
}: {
  notifications: Notification[];
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-full z-50 mt-2 w-[20rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[0.75rem] border border-border bg-background shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-[0.875rem]">
        <p className="font-sans text-[0.875rem] font-medium text-foreground">Notifications</p>
        <button
          type="button"
          onClick={onClose}
          className="font-sans text-[0.6875rem] text-[#8C5CFF] transition-colors hover:text-[#AC8EF3]"
        >
          Mark all read
        </button>
      </div>

      {/* Notification list */}
      <ul>
        {notifications.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              className="flex w-full cursor-pointer items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-foreground/5"
            >
              {/* Unread dot indicator */}
              <span
                aria-label={n.read ? undefined : 'Unread'}
                className={`mt-[0.375rem] size-[0.4375rem] shrink-0 rounded-full ${
                  n.read ? 'bg-transparent' : 'bg-[#8C5CFF]'
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="font-sans text-[0.8125rem] leading-5 text-foreground/90">{n.text}</p>
                <p className="mt-0.5 font-sans text-[0.6875rem] text-[#A0A0A0]">{n.time}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="px-4 py-[0.625rem]">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-1 text-center font-sans text-[0.75rem] text-[#8C5CFF] transition-colors hover:text-[#AC8EF3]"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * CanaFri top navigation bar.
 *
 * **Layouts**
 * - **Mobile (<md):** 3-column grid — avatar (opens drawer) | logo or page name | bell
 * - **Tablet / Desktop (md+):** search bar on the left, notification bell on the right
 *
 * @example
 * ```tsx
 * <TopNav
 *   activePage="Dashboard"
 *   notificationCount={3}
 *   onMenuOpen={() => setDrawerOpen(true)}
 * />
 * ```
 */
export default function TopNav({
  notificationCount = 0,
  user = { name: 'Josh Trek' },
  onMenuOpen,
  activePage = 'Dashboard',
}: TopNavProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

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

      {/* ── Mobile layout (<md) — avatar | logo/page title | bell ── */}
      <div className="grid w-full grid-cols-3 items-center md:hidden">

        {/* Left: avatar — tapping opens the mobile sidebar drawer */}
        <div className="flex justify-start">
          <AvatarOnline
            src={resolvedAvatar}
            alt={user.name}
            online
            onClick={onMenuOpen}
          />
        </div>

        {/* Centre: logo on Dashboard, page name elsewhere */}
        <div className="flex justify-center">
          {activePage === 'Dashboard' ? (
            <Logo />
          ) : (
            <p className="truncate font-sans text-base font-medium text-foreground">
              {activePage}
            </p>
          )}
        </div>

        {/* Right: notification bell */}
        <div ref={notifRef} className="relative flex justify-end">
          <NotificationBell
            count={notificationCount}
            onClick={() => setNotifOpen((v) => !v)}
          />
          {notifOpen && (
            <NotificationPanel
              notifications={MOCK_NOTIFICATIONS}
              onClose={() => setNotifOpen(false)}
            />
          )}
        </div>
      </div>

      {/* ── Tablet / Desktop layout (md+) — search left, bell right ── */}
      <div className="hidden w-full items-center justify-between gap-4 md:flex">
        <SearchBar className="w-56 shrink-0 lg:w-72" />

        <div ref={notifRef} className="relative">
          <NotificationBell
            count={notificationCount}
            onClick={() => setNotifOpen((v) => !v)}
          />
          {notifOpen && (
            <NotificationPanel
              notifications={MOCK_NOTIFICATIONS}
              onClose={() => setNotifOpen(false)}
            />
          )}
        </div>
      </div>

    </header>
  );
}
