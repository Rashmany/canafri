'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Bell, X } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { AvatarOnline } from '@/components/ui/avatar-online';
import { SearchDropdown } from '@/components/ui/search-dropdown';
import { addToSearchHistory } from '@/lib/search-service';

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
  onSearchNavigate?: (query: string) => void;
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
 * Pill-shaped search input with interactive search history and live suggestions.
 */
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

  // Close dropdown on click outside
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
  onSearchNavigate,
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

      {/* ── Mobile layout (<md) — avatar+search | logo/page title | bell ── */}
      <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 md:hidden">

        {/* Left: avatar — tapping opens the mobile sidebar drawer */}
        <div className="flex items-center gap-2">
          <AvatarOnline
            src={resolvedAvatar}
            alt={user.name}
            online
            onClick={onMenuOpen}
          />
          {/* Search icon: only on Dashboard (other pages have content-specific actions) */}
          {activePage === 'Dashboard' && (
            <button
              type="button"
              onClick={() => onSearchNavigate?.('')}
              aria-label="Search"
              className="flex items-center justify-center w-8 h-8 rounded-full text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
            >
              <Search size={19} strokeWidth={1.75} />
            </button>
          )}
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
        <SearchBar className="w-56 shrink-0 lg:w-72" onSearchNavigate={onSearchNavigate} />

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
