'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  Wallet,
  ClipboardList,
  Briefcase,
  PlusSquare,
  MessageSquare,
  BarChart3,
  Settings,
  LifeBuoy,
  Bookmark,
  Heart,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { AvatarOnline } from '@/components/ui/avatar-online';
import { Logo } from '@/components/ui/logo';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItemConfig {
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface SidebarUser {
  name: string;
  /** Display handle e.g. "@joshtrek" */
  handle: string;
  /** URL / path to the avatar image */
  avatarSrc: string;
}

interface SidebarProps {
  user?: SidebarUser;
  /** Called when the user clicks Log Out */
  onLogout?: () => void;
  /** Called when the user clicks View Profile */
  onViewProfile?: () => void;
  /** Called when the user clicks Account Settings */
  onViewSettings?: () => void;
  /** Currently active page label */
  activeItem?: string;
  /** Notify parent of navigation changes */
  onActiveChange?: (page: string) => void;
  /** Whether the mobile drawer is open (controlled externally via TopNav hamburger) */
  mobileOpen?: boolean;
  /** Called when the mobile drawer requests to close */
  onMobileClose?: () => void;
  /** Whether current user is a freelancer — enables dropdown on Bookmarks */
  isFreelancer?: boolean;
  /** Controlled seller mode state */
  sellerMode?: boolean;
  /** Callback triggered when seller mode changes */
  onSellerModeChange?: (v: boolean) => void;
}

// ─── Design tokens (matched to CanaFri spec) ─────────────────────────────────

const TOKEN = {
  sidebar:       'bg-sidebar',           // dark sidebar bg
  sidebarLight:  'light:bg-[#F5F8FB]',     // light sidebar bg (via .dark toggle)
  border:        'bg-border',
  itemActive:    'bg-foreground/10',
  itemHover:     'hover:bg-border/50',
  itemHoverLight:'hover:bg-[#B6B5C4]/30',
  primary:       '#8C5CFF',
  primaryHover:  '#AC8EF3',
} as const;

// ─── Nav configuration ───────────────────────────────────────────────────────

/** Primary navigation — shown on desktop, tablet and in the mobile drawer */
const PRIMARY_NAV: NavItemConfig[] = [
  { label: 'Dashboard',    icon: LayoutDashboard },
  { label: 'Saved',        icon: Bookmark },
  { label: 'Favorites',    icon: Heart },
  { label: 'Wallet',       icon: Wallet },
  { label: 'Jobs',         icon: ClipboardList },
  { label: 'Selling',      icon: Briefcase },
  { label: 'Become a seller', icon: UserPlus },
  { label: 'Messages',     icon: MessageSquare, badge: 5 },
  { label: 'Analysis',     icon: BarChart3 },
];

/**
 * Mobile-drawer-only navigation items.
 * Dashboard, Wallet and Messages are already in the Bottom Navbar on mobile,
 * so they are excluded here to avoid duplication.
 */
const MOBILE_DRAWER_NAV: NavItemConfig[] = [
  { label: 'Saved',        icon: Bookmark },
  { label: 'Favorites',    icon: Heart },
  { label: 'Jobs',         icon: ClipboardList },
  { label: 'Selling',      icon: Briefcase },
  { label: 'Become a seller', icon: UserPlus },
  { label: 'Analysis',     icon: BarChart3 },
];

/** Secondary navigation (settings & support) — bottom of sidebar */
const SECONDARY_NAV: NavItemConfig[] = [
  { label: 'Settings', icon: Settings },
  { label: 'Support',  icon: LifeBuoy },
];

// ─── Divider ─────────────────────────────────────────────────────────────────

interface SidebarDividerProps {
  className?: string;
}

function SidebarDivider({ className = '' }: SidebarDividerProps) {
  return <div className={`h-px w-full shrink-0 bg-border dark:bg-border ${className}`} />;
}

// Logo is imported from '@/components/ui/logo' (shared with TopNav)

// ─── Seller-Mode toggle ───────────────────────────────────────────────────────

interface SellerModeToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

function SellerModeToggle({ enabled, onToggle }: SellerModeToggleProps) {
  return (
    <div className="h-[2.1875rem] w-full shrink-0 rounded-[1.875rem] bg-background">
      <div className="flex size-full items-center justify-between px-[0.6875rem] py-[0.3125rem]">
        <span className="whitespace-nowrap font-sans text-[0.6875rem] font-normal tracking-[0.0044px] text-foreground">
          Seller Mode
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={onToggle}
          className={[
            'relative h-[1.5rem] w-[2.75rem] shrink-0 cursor-pointer rounded-[3.125rem]',
            'border border-border transition-colors duration-300 ease-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5CFF]',
            enabled ? 'bg-[#8C5CFF]' : 'bg-border/50',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-[0.1875rem] size-[1.125rem] rounded-full transition-all duration-300 ease-out',
              enabled ? 'left-[calc(100%-1.3125rem)] bg-white' : 'left-[0.25rem] bg-muted',
            ].join(' ')}
          />
        </button>
      </div>
    </div>
  );
}

/** Compact pill-only toggle used in the collapsed tablet sidebar */
function SellerModeTogglePill({ enabled, onToggle }: SellerModeToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={[
        'relative h-[1.5rem] w-[2.75rem] cursor-pointer rounded-[3.125rem]',
        'border border-border transition-colors duration-300 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5CFF]',
        enabled ? 'bg-[#8C5CFF]' : 'bg-border/50',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-[0.1875rem] size-[1.125rem] rounded-full transition-all duration-300 ease-out',
          enabled ? 'left-[calc(100%-1.3125rem)] bg-white' : 'left-[0.25rem] bg-muted',
        ].join(' ')}
      />
    </button>
  );
}

// BookmarkNavItem removed - replaced by direct Saved NavItem rendering.

// ─── Selling nav item with sub-items dropdown ────────────────────────────────

interface SellingNavItemProps {
  activePage: string;
  setActivePage: (page: string) => void;
  showLabel?: boolean;
  onClose?: () => void;
}

function SellingNavItem({ activePage, setActivePage, showLabel = true, onClose }: SellingNavItemProps) {
  const [open, setOpen] = useState(false);

  const subItems = [
    { label: 'Find a Job', page: 'Find Job' },
    { label: 'Proposals', page: 'Proposals' },
    { label: 'Gigs', page: 'Gigs' },
    { label: 'Buyer Request', page: 'Buyer Request' },
  ];

  const isActive = subItems.some(item => activePage === item.page) || activePage === 'Selling';

  const handleNavigate = (page: string) => {
    setActivePage(page);
    onClose?.();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={!showLabel ? 'Selling' : undefined}
        className={[
          'flex h-[3rem] w-full items-center gap-[0.625rem] rounded-[0.75rem]',
          'cursor-pointer transition-colors duration-300 ease-out text-left',
          showLabel ? 'px-[1.5rem]' : 'justify-center px-0',
          isActive ? 'bg-foreground/10' : 'hover:bg-border/50 dark:hover:bg-border/50',
        ].join(' ')}
      >
        <span className="relative shrink-0 opacity-80">
          <Briefcase size={20} strokeWidth={1.5} className="text-foreground" />
        </span>
        {showLabel && (
          <>
            <span className={[
              'flex-1 whitespace-nowrap font-sans text-[0.8125rem] font-normal leading-[1.125rem] text-foreground transition-opacity duration-300 ease-out',
              isActive ? 'opacity-100' : 'opacity-80',
            ].join(' ')}>
              Selling
            </span>
            <span className={[
              'text-foreground/50 transition-transform duration-200',
              open ? 'rotate-180' : '',
            ].join(' ')}>
              <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && showLabel && (
        <div className="ml-4 mt-1 flex flex-col gap-[2px] rounded-[0.75rem] border border-border bg-card py-[0.375rem] px-[0.25rem]">
          {subItems.map(({ label, page }) => (
            <button
              key={page}
              type="button"
              onClick={() => handleNavigate(page)}
              className={[
                'flex h-[2.5rem] w-full items-center gap-[0.5rem] rounded-[0.625rem] px-[1rem]',
                'cursor-pointer transition-colors duration-200 text-left',
                activePage === page ? 'bg-foreground/10' : 'hover:bg-foreground/5',
              ].join(' ')}
            >
              <span className={[
                'font-sans text-[0.75rem] font-normal leading-[1.125rem]',
                activePage === page ? 'text-foreground opacity-100' : 'text-foreground opacity-70',
              ].join(' ')}>
                {label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Jobs nav item with sub-items dropdown (Buyer Mode) ──────────────────────

interface JobsNavItemProps {
  activePage: string;
  setActivePage: (page: string) => void;
  showLabel?: boolean;
  onClose?: () => void;
}

function JobsNavItem({ activePage, setActivePage, showLabel = true, onClose }: JobsNavItemProps) {
  const [open, setOpen] = useState(false);

  const subItems = [
    { label: 'Post a Job',    page: 'Post a Job' },
    { label: 'My Posted Jobs', page: 'My Posted Jobs' },
  ];

  const isActive = subItems.some(item => activePage === item.page) || activePage === 'Jobs';

  const handleNavigate = (page: string) => {
    setActivePage(page);
    onClose?.();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={!showLabel ? 'Jobs' : undefined}
        className={[
          'flex h-[3rem] w-full items-center gap-[0.625rem] rounded-[0.75rem]',
          'cursor-pointer transition-colors duration-300 ease-out text-left',
          showLabel ? 'px-[1.5rem]' : 'justify-center px-0',
          isActive ? 'bg-foreground/10' : 'hover:bg-border/50 dark:hover:bg-border/50',
        ].join(' ')}
      >
        <span className="relative shrink-0 opacity-80">
          <ClipboardList size={20} strokeWidth={1.5} className="text-foreground" />
        </span>
        {showLabel && (
          <>
            <span className={[
              'flex-1 whitespace-nowrap font-sans text-[0.8125rem] font-normal leading-[1.125rem] text-foreground transition-opacity duration-300 ease-out',
              isActive ? 'opacity-100' : 'opacity-80',
            ].join(' ')}>
              Jobs
            </span>
            <span className={[
              'text-foreground/50 transition-transform duration-200',
              open ? 'rotate-180' : '',
            ].join(' ')}>
              <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && showLabel && (
        <div className="ml-4 mt-1 flex flex-col gap-[2px] rounded-[0.75rem] border border-border bg-card py-[0.375rem] px-[0.25rem]">
          {subItems.map(({ label, page }) => (
            <button
              key={page}
              type="button"
              onClick={() => handleNavigate(page)}
              className={[
                'flex h-[2.5rem] w-full items-center gap-[0.5rem] rounded-[0.625rem] px-[1rem]',
                'cursor-pointer transition-colors duration-200 text-left',
                activePage === page ? 'bg-foreground/10' : 'hover:bg-foreground/5',
              ].join(' ')}
            >
              <span className={[
                'font-sans text-[0.75rem] font-normal leading-[1.125rem]',
                activePage === page ? 'text-foreground opacity-100' : 'text-foreground opacity-70',
              ].join(' ')}>
                {label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface NavItemProps {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
  /** When false (collapsed tablet) render icon-only with a dot badge */
  showLabel?: boolean;
}

function NavItem({
  label,
  icon: Icon,
  active = false,
  badge,
  onClick,
  showLabel = true,
}: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={!showLabel ? label : undefined}
      className={[
        'flex h-[3rem] w-full items-center gap-[0.625rem] rounded-[0.75rem]',
        'cursor-pointer transition-colors duration-300 ease-out text-left',
        showLabel ? 'px-[1.5rem]' : 'justify-center px-0',
        active
          ? 'bg-foreground/10'
          : 'hover:bg-border/50 dark:hover:bg-border/50',
      ].join(' ')}
    >
      {/* Icon wrapper — dot badge shown in collapsed state */}
      <span className="relative shrink-0 opacity-80">
        <Icon size={20} strokeWidth={1.5} className="text-foreground" />
        {!showLabel && badge != null && badge > 0 && (
          <span className="absolute -right-1 -top-1 size-2 rounded-full bg-[#8C5CFF]" />
        )}
      </span>

      {showLabel && (
        <>
          <span
            className={[
              'flex-1 whitespace-nowrap font-sans text-[0.8125rem] font-normal leading-[1.125rem] text-foreground transition-opacity duration-300 ease-out',
              active ? 'opacity-100' : 'opacity-80',
            ].join(' ')}
          >
            {label}
          </span>

          {/* Notification badge */}
          {badge != null && badge > 0 && (
            <span className="flex h-[1.25rem] min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-[#8C5CFF] px-[0.3125rem] font-sans text-[0.625rem] font-medium leading-none text-white">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </button>
  );
}

// ─── Profile row ──────────────────────────────────────────────────────────────

interface ProfileRowProps {
  name: string;
  handle: string;
  avatarSrc: string;
  onLogout?: () => void;
  onViewProfile?: () => void;
  onViewSettings?: () => void;
  /** When false render the avatar only (collapsed tablet) */
  showLabel?: boolean;
}

function ProfileRow({
  name,
  handle,
  avatarSrc,
  onLogout,
  onViewProfile,
  onViewSettings,
  showLabel = true,
}: ProfileRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Collapsed tablet — show avatar only
  if (!showLabel) {
    return (
      <div className="flex w-full justify-center">
        <AvatarOnline
          src={avatarSrc}
          alt={name}
          online
          onClick={() => setMenuOpen((v) => !v)}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full px-[0.5rem] pb-4">
      {/* ── Context menu ── */}
      {menuOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-full min-w-[13rem] overflow-hidden rounded-[0.875rem] border border-border bg-card shadow-xl">
          {/* Header preview in popup */}
          <button
            type="button"
            onClick={() => { setMenuOpen(false); onViewProfile?.(); }}
            className="flex w-full items-center gap-3 border-b border-border px-4 py-[0.875rem] text-left hover:bg-foreground/5 transition-colors rounded-t-[0.875rem]"
          >
            <AvatarOnline src={avatarSrc} alt={name} size="sm" online />
            <div className="min-w-0">
              <p className="font-sans text-[0.8125rem] font-medium text-foreground truncate">{name}</p>
              <p className="font-sans text-[0.6875rem] text-muted truncate">{handle}</p>
            </div>
          </button>

          {/* Actions */}
          <div className="py-[0.375rem]">
            <ProfileMenuButton
              icon={
                <svg className="size-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              }
              label="View Profile"
              onClick={() => { setMenuOpen(false); onViewProfile?.(); }}
            />
            <ProfileMenuButton
              icon={
                <svg className="size-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              }
              label="Account Settings"
              onClick={() => { setMenuOpen(false); onViewSettings?.(); }}
            />

            <div className="mx-3 my-1 h-px bg-border" />

            <ProfileMenuButton
              icon={
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
              }
              label="Log Out"
              onClick={() => { setMenuOpen(false); onLogout?.(); }}
              destructive
            />
          </div>
        </div>
      )}

      {/* ── Profile display row ── */}
      <div className="flex w-full items-center justify-between gap-2 rounded-[0.75rem] px-2 py-1.5 hover:bg-foreground/5 transition-colors">
        {/* Avatar + name — navigates to profile directly */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onViewProfile?.()}
          onKeyDown={(e) => e.key === 'Enter' && onViewProfile?.()}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-[0.6875rem] hover:opacity-80 transition-opacity"
        >
          <AvatarOnline src={avatarSrc} alt={name} online />
          <div className="flex min-w-0 flex-col">
            <p className="whitespace-nowrap font-sans text-[0.8125rem] font-semibold leading-5 text-foreground truncate">{name}</p>
            <p className="whitespace-nowrap font-sans text-[0.6875rem] font-normal leading-4 text-muted truncate">{handle}</p>
          </div>
        </div>

        {/* Chevron — opens context menu dropdown */}
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-label="Open profile menu"
          onClick={() => setMenuOpen((v) => !v)}
          className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity text-foreground flex size-5 items-center justify-center"
        >
          <span
            className={[
              'transition-transform duration-200',
              menuOpen ? 'rotate-180' : '',
            ].join(' ')}
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Profile menu button helper ───────────────────────────────────────────────

function ProfileMenuButton({
  icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center gap-[0.625rem] px-4 py-[0.625rem]',
        'font-sans text-[0.8125rem] transition-colors text-left',
        'hover:bg-foreground/5',
        destructive
          ? 'text-red-400 hover:text-red-300'
          : 'text-foreground/80 hover:text-foreground',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Desktop sidebar (lg+) ────────────────────────────────────────────────────

interface SharedSidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  sellerMode: boolean;
  setSellerMode: (v: boolean) => void;
  user: SidebarUser;
  onLogout?: () => void;
  onViewProfile?: () => void;
  onViewSettings?: () => void;
  isFreelancer?: boolean;
}

function DesktopSidebar({
  activePage,
  setActivePage,
  sellerMode,
  setSellerMode,
  user,
  onLogout,
  onViewProfile,
  onViewSettings,
  isFreelancer = false,
}: SharedSidebarProps) {
  return (
    <aside className="flex h-screen w-[14rem] shrink-0 flex-col overflow-hidden bg-sidebar px-[0.9375rem] py-[2.5rem]">
      {/* Logo — fixed header */}
      <div className="flex w-full shrink-0 flex-col gap-[1.875rem]">
        <Logo />
        <SidebarDivider />
      </div>

      {/* Everything else scrolls */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-[1.875rem] mt-[1.875rem]">
        <nav className="flex w-full flex-col gap-[0.3125rem]">
          {PRIMARY_NAV.map((item) => {
            if (item.label === 'Saved') {
              const label = sellerMode ? 'Saved Jobs' : 'Saved';
              const targetPage = sellerMode ? 'Bookmarks:Jobs' : 'Bookmarks';
              const isActive = sellerMode
                ? activePage === 'Bookmarks:Jobs'
                : (activePage === 'Bookmarks' || activePage === 'Bookmarks:Content');
              return (
                <NavItem
                  key="Saved"
                  label={label}
                  icon={item.icon}
                  active={isActive}
                  onClick={() => setActivePage(targetPage)}
                />
              );
            }
            if (item.label === 'Selling') {
              if (!sellerMode) return null;
              return (
                <SellingNavItem
                  key="Selling"
                  activePage={activePage}
                  setActivePage={setActivePage}
                />
              );
            }
            if (item.label === 'Jobs') {
              if (sellerMode) return null;
              return (
                <JobsNavItem
                  key="Jobs"
                  activePage={activePage}
                  setActivePage={setActivePage}
                />
              );
            }
            // Hide 'Become a seller' once already in seller mode
            if (item.label === 'Become a seller' && sellerMode) return null;
            return (
              <NavItem
                key={item.label}
                label={item.label}
                icon={item.icon}
                badge={item.badge}
                active={activePage === item.label}
                onClick={() => setActivePage(item.label)}
              />
            );
          })}
        </nav>

        <div className="flex-1" />

        <SidebarDivider />
        <nav className="flex w-full flex-col gap-[0.3125rem]">
          {SECONDARY_NAV.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              icon={item.icon}
              active={activePage === item.label}
              onClick={() => setActivePage(item.label)}
            />
          ))}
        </nav>
        <div className="pl-[1.5rem]">
          <SellerModeToggle enabled={sellerMode} onToggle={() => setSellerMode(!sellerMode)} />
        </div>
        <ProfileRow
          name={user.name}
          handle={user.handle}
          avatarSrc={user.avatarSrc}
          onLogout={onLogout}
          onViewProfile={onViewProfile}
          onViewSettings={onViewSettings}
        />
      </div>
    </aside>
  );
}

// ─── Tablet sidebar (md → lg) — collapsed icon-rail, expands on hover ─────────

function TabletSidebar({
  activePage,
  setActivePage,
  sellerMode,
  setSellerMode,
  user,
  onLogout,
  onViewProfile,
  onViewSettings,
  isFreelancer = false,
}: SharedSidebarProps) {
  const [expanded, setExpanded] = useState(false);

  const COLLAPSED_WIDTH = '4.5rem';
  const EXPANDED_WIDTH  = '14rem';

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{ width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      className="flex h-screen shrink-0 flex-col overflow-hidden bg-sidebar py-[2.5rem] transition-[width] duration-300 ease-in-out"
    >
      {/* Logo — fixed header */}
      <div className="mb-[1.875rem] flex shrink-0 items-center justify-center overflow-hidden px-4">
        <Logo collapsed={!expanded} />
      </div>

      <SidebarDivider />

      {/* Everything else scrolls */}
      <div className="flex-1 overflow-y-auto no-scrollbar mt-[1.875rem] flex flex-col">
        <div className="flex w-full shrink-0 flex-col gap-[0.3125rem]">
          {PRIMARY_NAV.map((item) => {
            if (item.label === 'Saved') {
              const label = sellerMode ? 'Saved Jobs' : 'Saved';
              const targetPage = sellerMode ? 'Bookmarks:Jobs' : 'Bookmarks';
              const isActive = sellerMode
                ? activePage === 'Bookmarks:Jobs'
                : (activePage === 'Bookmarks' || activePage === 'Bookmarks:Content');
              return (
                <NavItem
                  key="Saved"
                  label={label}
                  icon={item.icon}
                  active={isActive}
                  showLabel={expanded}
                  onClick={() => setActivePage(targetPage)}
                />
              );
            }
            if (item.label === 'Selling') {
              if (!sellerMode) return null;
              return (
                <SellingNavItem
                  key="Selling"
                  activePage={activePage}
                  setActivePage={setActivePage}
                  showLabel={expanded}
                />
              );
            }
            if (item.label === 'Jobs') {
              if (sellerMode) return null;
              return (
                <JobsNavItem
                  key="Jobs"
                  activePage={activePage}
                  setActivePage={setActivePage}
                  showLabel={expanded}
                />
              );
            }
            // Hide 'Become a seller' once already in seller mode
            if (item.label === 'Become a seller' && sellerMode) return null;
            return (
              <NavItem
                key={item.label}
                label={item.label}
                icon={item.icon}
                badge={item.badge}
                active={activePage === item.label}
                showLabel={expanded}
                onClick={() => setActivePage(item.label)}
              />
            );
          })}
        </div>

        <div className="flex-1" />

        <SidebarDivider className="mt-6" />
        <div className="flex flex-col gap-[0.3125rem]">
          {SECONDARY_NAV.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              icon={item.icon}
              active={activePage === item.label}
              showLabel={expanded}
              onClick={() => setActivePage(item.label)}
            />
          ))}
        </div>

        <div className="flex justify-center px-2 mt-[1.875rem]">
          {expanded ? (
            <SellerModeToggle enabled={sellerMode} onToggle={() => setSellerMode(!sellerMode)} />
          ) : (
            <SellerModeTogglePill enabled={sellerMode} onToggle={() => setSellerMode(!sellerMode)} />
          )}
        </div>

        <div className={`mt-[1.875rem] ${expanded ? '' : 'flex justify-center px-0'}`}>
          <ProfileRow
            name={user.name}
            handle={user.handle}
            avatarSrc={user.avatarSrc}
            onLogout={onLogout}
            onViewProfile={onViewProfile}
            onViewSettings={onViewSettings}
            showLabel={expanded}
          />
        </div>
      </div>
    </aside>
  );
}

// ─── Mobile sidebar drawer (<md) ──────────────────────────────────────────────

interface MobileSidebarProps extends SharedSidebarProps {
  /** Controls whether the drawer is visible */
  open: boolean;
  /** Called when backdrop is tapped or close button pressed */
  onClose: () => void;
}

function MobileSidebar({
  open,
  onClose,
  activePage,
  setActivePage,
  sellerMode,
  setSellerMode,
  user,
  onLogout,
  isFreelancer = false,
}: MobileSidebarProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={[
          'fixed inset-0 z-40 bg-black/60 transition-opacity duration-300',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
      />

      {/* Drawer panel */}
      <aside
        aria-label="Navigation menu"
        className={[
          'fixed left-0 top-0 z-50 flex h-full w-[80vw] max-w-[22rem] flex-col',
          'overflow-hidden bg-sidebar px-[0.9375rem] py-[2rem]',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Profile header + seller toggle */}
        <div className="mb-[1.5rem] flex w-full shrink-0 flex-col gap-4 px-2">
          <div className="flex items-center gap-3">
            <AvatarOnline src={user.avatarSrc} alt={user.name} online />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate font-sans text-[0.875rem] font-medium leading-5 text-foreground">{user.name}</p>
              <p className="truncate font-sans text-[0.6875rem] leading-4 text-muted">{user.handle}</p>
            </div>
            {/* Close button */}
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={onClose}
              className="ml-auto shrink-0 p-1 text-foreground/50 transition-colors hover:text-foreground"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <SellerModeToggle enabled={sellerMode} onToggle={() => setSellerMode(!sellerMode)} />
        </div>

        <SidebarDivider />

        {/* Nav + logout */}
        <div className="mt-[1.5rem] flex flex-1 flex-col gap-6 overflow-y-auto">
          <nav className="flex w-full flex-col gap-[0.3125rem]">
            {MOBILE_DRAWER_NAV.map((item) => {
              if (item.label === 'Saved') {
                const label = sellerMode ? 'Saved Jobs' : 'Saved';
                const targetPage = sellerMode ? 'Bookmarks:Jobs' : 'Bookmarks';
                const isActive = sellerMode
                  ? activePage === 'Bookmarks:Jobs'
                  : (activePage === 'Bookmarks' || activePage === 'Bookmarks:Content');
                return (
                  <NavItem
                    key="Saved"
                    label={label}
                    icon={item.icon}
                    active={isActive}
                    onClick={() => { setActivePage(targetPage); onClose(); }}
                  />
                );
              }
              if (item.label === 'Selling') {
                if (!sellerMode) return null;
                return (
                  <SellingNavItem
                    key="Selling"
                    activePage={activePage}
                    setActivePage={setActivePage}
                    onClose={onClose}
                  />
                );
              }
              if (item.label === 'Jobs') {
                if (sellerMode) return null;
                return (
                  <JobsNavItem
                    key="Jobs"
                    activePage={activePage}
                    setActivePage={setActivePage}
                    onClose={onClose}
                  />
                );
              }
              // Hide 'Become a seller' once already in seller mode
              if (item.label === 'Become a seller' && sellerMode) return null;
              return (
                <NavItem
                  key={item.label}
                  label={item.label}
                  icon={item.icon}
                  badge={item.badge}
                  active={activePage === item.label}
                  onClick={() => { setActivePage(item.label); onClose(); }}
                />
              );
            })}
          </nav>

          <div className="flex-1" />
          <SidebarDivider />

          <nav className="flex w-full flex-col gap-[0.3125rem]">
            {SECONDARY_NAV.map((item) => (
              <NavItem
                key={item.label}
                label={item.label}
                icon={item.icon}
                active={activePage === item.label}
                onClick={() => { setActivePage(item.label); onClose(); }}
              />
            ))}
          </nav>

          {/* Log Out */}
          <button
            type="button"
            onClick={() => { onClose(); onLogout?.(); }}
            className="flex w-full items-center gap-[0.625rem] rounded-[0.75rem] px-[1.5rem] py-[0.625rem] font-sans text-[0.8125rem] text-red-400 transition-colors hover:bg-foreground/5 hover:text-red-300"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

const DEFAULT_USER: SidebarUser = {
  name:      'Josh Trek',
  handle:    '@joshtrek',
  avatarSrc: '/images/default-avatar.png',
};

/**
 * CanaFri responsive sidebar component.
 *
 * - **Mobile  (<md)** — off-canvas drawer, controlled by `mobileOpen` + `onMobileClose`
 * - **Tablet  (md–lg)** — collapsed icon-rail that expands to full sidebar on hover
 * - **Desktop (lg+)** — static full sidebar always visible
 *
 * @example
 * ```tsx
 * <Sidebar
 *   activeItem="Dashboard"
 *   onActiveChange={(page) => router.push(`/${page.toLowerCase()}`)}
 *   mobileOpen={drawerOpen}
 *   onMobileClose={() => setDrawerOpen(false)}
 * />
 * ```
 */
export default function Sidebar({
  user = DEFAULT_USER,
  onLogout,
  onViewProfile,
  onViewSettings,
  activeItem = 'Dashboard',
  onActiveChange,
  mobileOpen = false,
  onMobileClose,
  isFreelancer = false,
  sellerMode: controlledSellerMode,
  onSellerModeChange,
}: SidebarProps) {
  const [activePage, setActivePage] = useState(activeItem);
  const [localSellerMode, setLocalSellerMode] = useState(false);

  const sellerMode = controlledSellerMode !== undefined ? controlledSellerMode : localSellerMode;
  const setSellerMode = onSellerModeChange !== undefined ? onSellerModeChange : setLocalSellerMode;

  const handleSetActivePage = (page: string) => {
    setActivePage(page);
    onActiveChange?.(page);
  };

  const resolvedUser: SidebarUser = {
    name:      user.name,
    handle:    user.handle ?? '@joshtrek',
    avatarSrc: user.avatarSrc ?? DEFAULT_USER.avatarSrc,
  };

  const sharedProps: SharedSidebarProps = {
    activePage,
    setActivePage: handleSetActivePage,
    sellerMode,
    setSellerMode,
    user:          resolvedUser,
    onLogout,
    onViewProfile,
    onViewSettings,
    isFreelancer,
  };

  return (
    <>
      {/* ── Mobile drawer (<md) ── */}
      <div className="md:hidden">
        <MobileSidebar
          open={mobileOpen}
          onClose={onMobileClose ?? (() => {})}
          {...sharedProps}
        />
      </div>

      {/* ── Tablet icon-rail (md–lg) ── */}
      <div className="hidden h-full md:flex lg:hidden">
        <TabletSidebar {...sharedProps} />
      </div>

      {/* ── Desktop full sidebar (lg+) ── */}
      <div className="hidden h-full lg:flex">
        <DesktopSidebar {...sharedProps} />
      </div>
    </>
  );
}
