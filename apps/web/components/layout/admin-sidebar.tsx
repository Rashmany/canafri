'use client';

import { useState, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  UserX,
  AlertTriangle,
  ClipboardCheck,
  Video,
  Trash2,
  Briefcase,
  UserCheck,
  Scale,
  Landmark,
  BarChart3,
  Settings2,
  Activity,
  ChevronDown,
  UsersRound,
  ShoppingBag,
  Wrench,
  ShieldHalf,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import { AvatarOnline } from '@/components/ui/avatar-online';
import { Logo } from '@/components/ui/logo';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminNavItemConfig {
  label: string;
  icon: LucideIcon;
  page: string;
  badge?: number;
}

interface AdminSidebarUser {
  name: string;
  handle: string;
  avatarSrc: string;
  role: string;
}

export interface AdminSidebarProps {
  user?: AdminSidebarUser;
  onLogout?: () => void;
  activeItem?: string;
  onActiveChange?: (page: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

// ─── Role label helper ───────────────────────────────────────────────────────

function getRoleLabel(role: string): string {
  if (role === 'SUPER_ADMIN') return 'Super Admin';
  if (role === 'CONTENT_ADMIN') return 'Content Admin';
  if (role === 'FINANCE_ADMIN') return 'Finance Admin';
  if (role === 'SUPPORT_ADMIN') return 'Support Admin';
  if (role === 'ADMIN') return 'Admin';
  return role || 'Admin';
}

function getRolePermissions(role: string): string[] {
  if (role === 'SUPER_ADMIN') return [
    '\u2714 Full platform control',
    '\u2714 Invite & remove admins',
    '\u2714 User management & bans',
    '\u2714 Content review & approvals',
    '\u2714 Dispute resolution',
    '\u2714 Treasury & withdrawals',
    '\u2714 Platform configuration',
    '\u2714 Analytics & audit logs',
  ];
  if (role === 'CONTENT_ADMIN') return [
    '\u2714 Content review & queue',
    '\u2714 Creator approvals',
    '\u2718 Cannot manage disputes',
    '\u2718 Cannot access Treasury',
    '\u2718 Cannot invite/remove admins',
  ];
  if (role === 'FINANCE_ADMIN') return [
    '\u2714 Treasury & withdrawals',
    '\u2714 Analytics & reports',
    '\u2718 Cannot review content',
    '\u2718 Cannot manage disputes',
    '\u2718 Cannot invite/remove admins',
  ];
  if (role === 'SUPPORT_ADMIN') return [
    '\u2714 User management & bans',
    '\u2714 Dispute resolution',
    '\u2718 Cannot access Treasury',
    '\u2718 Cannot review content',
    '\u2718 Cannot invite/remove admins',
  ];
  return [
    '\u2714 User management & bans',
    '\u2714 Content review & approvals',
    '\u2714 Dispute resolution',
    '\u2718 Cannot invite/remove admins',
  ];
}

// ─── Role Permission Tooltip ────────────────────────────────────────────────

function RolePermissionTooltip({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const perms = getRolePermissions(role);
  const label = getRoleLabel(role);

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* ? icon */}
      <button
        type="button"
        aria-label={`${label} permissions`}
        className="flex size-4 items-center justify-center rounded-full bg-foreground/10 text-[0.5625rem] font-bold text-muted hover:bg-[#8C5CFF]/20 hover:text-[#8C5CFF] transition-colors leading-none"
      >
        ?
      </button>

      {/* Tooltip popover */}
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[200] w-[13.5rem] rounded-[0.875rem] border border-border bg-card shadow-2xl p-3">
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[-5px] size-2.5 rotate-45 border-r border-b border-border bg-card" />

          <p className="font-sans text-[0.6875rem] font-bold text-foreground mb-2 uppercase tracking-wider">
            {label} Access
          </p>
          <ul className="flex flex-col gap-[3px]">
            {perms.map(p => (
              <li
                key={p}
                className={[
                  'font-sans text-[0.6875rem] leading-4',
                  p.startsWith('\u2718') ? 'text-muted' : 'text-foreground/80',
                ].join(' ')}
              >
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Nav configuration ───────────────────────────────────────────────────────

const ADMIN_NAV: AdminNavItemConfig[] = [
  { label: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { label: 'All Users', icon: Users, page: 'All Users' },
  { label: 'Risk Scores', icon: AlertTriangle, page: 'Risk Scores' },
  { label: 'Review Queue', icon: ClipboardCheck, page: 'Review Queue' },
  { label: 'Delisted', icon: Trash2, page: 'Delisted' },
  { label: 'Active Jobs', icon: Briefcase, page: 'Active Jobs' },
  { label: 'Seller Apps', icon: UserCheck, page: 'Seller Apps' },
  { label: 'Disputes', icon: Scale, page: 'Disputes' },
  { label: 'Treasury', icon: Landmark, page: 'Treasury' },
  { label: 'Analytics', icon: BarChart3, page: 'Analytics' },
  { label: 'Platform Config', icon: Settings2, page: 'Platform Config' },
  { label: 'Canton Activity', icon: Activity, page: 'Canton Activity' },
  { label: 'Admin Team', icon: ShieldHalf, page: 'Admin Team' },
  { label: 'Security', icon: Lock, page: 'Security' },
];

const MANAGE_CREATORS_ITEMS: AdminNavItemConfig[] = [
  { label: 'Content Creators', icon: Video, page: 'Content Creators' },
  { label: 'Buyers', icon: ShoppingBag, page: 'Buyers' },
  { label: 'Sellers', icon: Wrench, page: 'Sellers' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SidebarDivider({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full shrink-0 bg-border ${className}`} />;
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

interface NavItemProps {
  config: AdminNavItemConfig;
  active: boolean;
  onClick: () => void;
  showLabel?: boolean;
}

function AdminNavItem({ config, active, onClick, showLabel = true }: NavItemProps) {
  const Icon = config.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      title={!showLabel ? config.label : undefined}
      className={[
        'flex h-[3rem] w-full items-center gap-[0.625rem] rounded-[0.75rem]',
        'cursor-pointer transition-colors duration-300 ease-out text-left',
        showLabel ? 'px-[1.5rem]' : 'justify-center px-0',
        active ? 'bg-foreground/10' : 'hover:bg-border/50 dark:hover:bg-border/50',
      ].join(' ')}
    >
      <span className="relative shrink-0 opacity-80">
        <Icon size={20} strokeWidth={1.5} className="text-foreground" />
        {!showLabel && config.badge != null && config.badge > 0 && (
          <span className="absolute -right-1 -top-1 size-2 rounded-full bg-[#8C5CFF]" />
        )}
      </span>
      {showLabel && (
        <>
          <span className={[
            'flex-1 whitespace-nowrap font-sans text-[0.8125rem] font-normal leading-[1.125rem] text-foreground transition-opacity duration-300 ease-out',
            active ? 'opacity-100' : 'opacity-80',
          ].join(' ')}>
            {config.label}
          </span>
          {config.badge != null && config.badge > 0 && (
            <span className="flex h-[1.25rem] min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-[#8C5CFF] px-[0.3125rem] font-sans text-[0.625rem] font-medium leading-none text-white">
              {config.badge > 99 ? '99+' : config.badge}
            </span>
          )}
        </>
      )}
    </button>
  );
}

// ─── Manage Creators Dropdown ─────────────────────────────────────────────────

interface ManageCreatorsDropdownProps {
  activePage: string;
  setActivePage: (page: string) => void;
  showLabel?: boolean;
  onItemClick?: () => void;
}

function ManageCreatorsDropdown({
  activePage,
  setActivePage,
  showLabel = true,
  onItemClick,
}: ManageCreatorsDropdownProps) {
  const isChildActive = MANAGE_CREATORS_ITEMS.some(i => i.page === activePage);
  const [open, setOpen] = useState(isChildActive);

  if (!showLabel) {
    // Collapsed (icon-rail / tablet): show each sub-item icon directly
    return (
      <>
        {MANAGE_CREATORS_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              type="button"
              title={item.label}
              onClick={() => { setActivePage(item.page); onItemClick?.(); }}
              className={[
                'flex h-[3rem] w-full items-center justify-center rounded-[0.75rem]',
                'cursor-pointer transition-colors duration-300 ease-out',
                activePage === item.page ? 'bg-foreground/10' : 'hover:bg-border/50',
              ].join(' ')}
            >
              <Icon size={18} strokeWidth={1.5} className={activePage === item.page ? 'text-[#8C5CFF]' : 'text-foreground opacity-80'} />
            </button>
          );
        })}
      </>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={[
          'flex h-[3rem] w-full items-center gap-[0.625rem] rounded-[0.75rem] px-[1.5rem]',
          'cursor-pointer transition-colors duration-300 ease-out text-left',
          isChildActive ? 'bg-foreground/10' : 'hover:bg-border/50',
        ].join(' ')}
      >
        {/* Gradient icon container */}
        <span className="relative shrink-0 flex size-5 items-center justify-center">
          <UsersRound
            size={19}
            strokeWidth={1.5}
            className={isChildActive ? 'text-[#8C5CFF]' : 'text-foreground opacity-80'}
          />
        </span>

        <span className={[
          'flex-1 whitespace-nowrap font-sans text-[0.8125rem] font-normal leading-[1.125rem] text-foreground transition-opacity',
          isChildActive ? 'opacity-100' : 'opacity-80',
        ].join(' ')}>
          Manage Creators
        </span>

        {/* Animated chevron */}
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={[
            'shrink-0 text-foreground/50 transition-transform duration-300',
            open ? 'rotate-180' : 'rotate-0',
          ].join(' ')}
        />
      </button>

      {/* Animated sub-menu */}
      <div
        className={[
          'overflow-hidden transition-all duration-300 ease-in-out',
          open ? 'max-h-[16rem] opacity-100' : 'max-h-0 opacity-0',
        ].join(' ')}
      >
        {/* Connector line + items */}
        <div className="relative ml-[2.625rem] mt-0.5 flex flex-col gap-[0.1875rem] border-l border-border/60 pl-3 pb-1">
          {MANAGE_CREATORS_ITEMS.map(item => {
            const Icon = item.icon;
            const active = activePage === item.page;
            return (
              <button
                key={item.page}
                type="button"
                onClick={() => { setActivePage(item.page); onItemClick?.(); }}
                className={[
                  'flex h-[2.5rem] w-full items-center gap-2.5 rounded-[0.625rem] px-3',
                  'cursor-pointer transition-colors duration-200 text-left',
                  active
                    ? 'bg-[#8C5CFF]/10 text-[#8C5CFF]'
                    : 'text-foreground/70 hover:bg-border/40 hover:text-foreground',
                ].join(' ')}
              >
                <Icon size={15} strokeWidth={1.75} className="shrink-0" />
                <span className="font-sans text-[0.75rem] font-medium leading-[1.125rem] whitespace-nowrap">
                  {item.label}
                </span>
                {active && (
                  <span className="ml-auto size-1.5 rounded-full bg-[#8C5CFF] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Profile Row ─────────────────────────────────────────────────────────────

interface ProfileRowProps {
  name: string;
  handle: string;
  avatarSrc: string;
  role: string;
  onLogout?: () => void;
  showLabel?: boolean;
}

function AdminProfileRow({ name, handle, avatarSrc, role, onLogout, showLabel = true }: ProfileRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!showLabel) {
    return (
      <div className="flex w-full justify-center">
        <AvatarOnline src={avatarSrc} alt={name} online onClick={() => setMenuOpen(v => !v)} />
      </div>
    );
  }

  return (
    <div className="relative w-full px-[0.5rem] pb-4">
      {menuOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-full min-w-[13rem] overflow-hidden rounded-[0.875rem] border border-border bg-card shadow-xl">
          {/* Admin badge header */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-[0.875rem]">
            <AvatarOnline src={avatarSrc} alt={name} size="sm" online />
            <div className="min-w-0 flex-1">
              <p className="font-sans text-[0.8125rem] font-medium text-foreground truncate">{name}</p>
              <p className="font-sans text-[0.6875rem] text-muted truncate">{handle}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#8C5CFF]/10 px-2 py-0.5 font-sans text-[0.625rem] font-semibold text-[#8C5CFF]">
              {getRoleLabel(role)}
            </span>
          </div>
          <div className="py-[0.375rem]">
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onLogout?.(); }}
              className="flex w-full items-center gap-[0.625rem] px-4 py-[0.625rem] font-sans text-[0.8125rem] text-red-400 transition-colors hover:bg-foreground/5 hover:text-red-300 text-left"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
              Log Out
            </button>
          </div>
        </div>
      )}

      <div className="flex w-full items-center justify-between gap-2 rounded-[0.75rem] px-2 py-1.5 hover:bg-foreground/5 transition-colors">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setMenuOpen(v => !v)}
          onKeyDown={e => e.key === 'Enter' && setMenuOpen(v => !v)}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-[0.6875rem] hover:opacity-80 transition-opacity"
        >
          <AvatarOnline src={avatarSrc} alt={name} online />
          <div className="flex min-w-0 flex-col">
            <p className="whitespace-nowrap font-sans text-[0.8125rem] font-semibold leading-5 text-foreground truncate">{name}</p>
            <div className="flex items-center gap-1.5">
              <p className="whitespace-nowrap font-sans text-[0.6875rem] font-normal leading-4 text-muted truncate">{handle}</p>
              <span className="shrink-0 rounded-full bg-[#8C5CFF]/10 px-1.5 py-0.5 font-sans text-[0.5625rem] font-semibold text-[#8C5CFF]">
                {getRoleLabel(role)}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-label="Open admin menu"
          onClick={() => setMenuOpen(v => !v)}
          className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity text-foreground flex size-5 items-center justify-center"
        >
          <span className={['transition-transform duration-200', menuOpen ? 'rotate-180' : ''].join(' ')}>
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Shared props ────────────────────────────────────────────────────────────

interface SharedAdminSidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  user: AdminSidebarUser;
  onLogout?: () => void;
}

// ─── Desktop sidebar ─────────────────────────────────────────────────────────

function AdminDesktopSidebar({ activePage, setActivePage, user, onLogout }: SharedAdminSidebarProps) {
  return (
    <aside className="flex h-screen w-[14rem] shrink-0 flex-col overflow-hidden bg-sidebar px-[0.9375rem] py-[2.5rem]">
      {/* Logo */}
      <div className="flex w-full shrink-0 flex-col gap-[1.875rem]">
        <Logo />
        <SidebarDivider />
      </div>

      {/* Admin badge — shows the signed-in admin's actual role */}
      <div className="mt-3 mb-1 flex items-center gap-2 px-[1.5rem]">
        <span className="rounded-full bg-[#8C5CFF]/10 px-2.5 py-1 font-sans text-[0.625rem] font-bold uppercase tracking-wider text-[#8C5CFF]">
          {getRoleLabel(user.role)} Console
        </span>
        <RolePermissionTooltip role={user.role} />
      </div>

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-[1.875rem] mt-[0.875rem]">
        <nav className="flex w-full flex-col gap-[0.3125rem]">
          {ADMIN_NAV.map(item => (
            <AdminNavItem
              key={item.page}
              config={item}
              active={activePage === item.page}
              onClick={() => setActivePage(item.page)}
            />
          ))}

          {/* Manage Creators dropdown */}
          <ManageCreatorsDropdown
            activePage={activePage}
            setActivePage={setActivePage}
          />
        </nav>

        <div className="flex-1" />

        <SidebarDivider />
        <AdminProfileRow
          name={user.name}
          handle={user.handle}
          avatarSrc={user.avatarSrc}
          role={user.role}
          onLogout={onLogout}
        />
      </div>
    </aside>
  );
}

// ─── Tablet sidebar ───────────────────────────────────────────────────────────

function AdminTabletSidebar({ activePage, setActivePage, user, onLogout }: SharedAdminSidebarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{ width: expanded ? '14rem' : '4.5rem' }}
      className="flex h-screen shrink-0 flex-col overflow-hidden bg-sidebar py-[2.5rem] transition-[width] duration-300 ease-in-out"
    >
      {/* Logo */}
      <div className="mb-[1.875rem] flex shrink-0 items-center justify-center overflow-hidden px-4">
        <Logo collapsed={!expanded} />
      </div>
      <SidebarDivider />

      {/* Role label when expanded */}
      {expanded && (
        <div className="mt-3 mb-1 flex items-center gap-2 px-[1.5rem]">
          <span className="rounded-full bg-[#8C5CFF]/10 px-2.5 py-1 font-sans text-[0.625rem] font-bold uppercase tracking-wider text-[#8C5CFF]">
            {getRoleLabel(user.role)} Console
          </span>
          <RolePermissionTooltip role={user.role} />
        </div>
      )}

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto no-scrollbar mt-[1.875rem] flex flex-col">
        <div className="flex w-full shrink-0 flex-col gap-[0.3125rem]">
          {ADMIN_NAV.map(item => (
            <AdminNavItem
              key={item.page}
              config={item}
              active={activePage === item.page}
              onClick={() => setActivePage(item.page)}
              showLabel={expanded}
            />
          ))}

          {/* Manage Creators dropdown */}
          <ManageCreatorsDropdown
            activePage={activePage}
            setActivePage={setActivePage}
            showLabel={expanded}
          />
        </div>

        <div className="flex-1" />
        <SidebarDivider className="mt-6" />

        <div className={`mt-[1.875rem] ${expanded ? '' : 'flex justify-center px-0'}`}>
          <AdminProfileRow
            name={user.name}
            handle={user.handle}
            avatarSrc={user.avatarSrc}
            role={user.role}
            onLogout={onLogout}
            showLabel={expanded}
          />
        </div>
      </div>
    </aside>
  );
}

// ─── Mobile drawer ────────────────────────────────────────────────────────────

function AdminMobileSidebar({
  open,
  onClose,
  activePage,
  setActivePage,
  user,
  onLogout,
}: SharedAdminSidebarProps & { open: boolean; onClose: () => void }) {
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

      {/* Drawer */}
      <aside
        aria-label="Admin navigation menu"
        className={[
          'fixed left-0 top-0 z-50 flex h-full w-[80vw] max-w-[22rem] flex-col',
          'overflow-hidden bg-sidebar px-[0.9375rem] py-[2rem]',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="mb-[1.5rem] flex w-full shrink-0 flex-col gap-4 px-2">
          <div className="flex items-center gap-3">
            <AvatarOnline src={user.avatarSrc} alt={user.name} online />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate font-sans text-[0.875rem] font-medium leading-5 text-foreground">{user.name}</p>
              <p className="truncate font-sans text-[0.6875rem] leading-4 text-muted">{user.handle}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#8C5CFF]/10 px-2 py-0.5 font-sans text-[0.625rem] font-semibold text-[#8C5CFF]">
              {getRoleLabel(user.role)}
            </span>
            <RolePermissionTooltip role={user.role} />
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={onClose}
              className="ml-1 shrink-0 p-1 text-foreground/50 transition-colors hover:text-foreground"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <SidebarDivider />

        <div className="mt-[1.5rem] flex flex-1 flex-col gap-6 overflow-y-auto no-scrollbar">
          <nav className="flex w-full flex-col gap-[0.3125rem]">
            {ADMIN_NAV.map(item => (
              <AdminNavItem
                key={item.page}
                config={item}
                active={activePage === item.page}
                onClick={() => { setActivePage(item.page); onClose(); }}
              />
            ))}

            {/* Manage Creators dropdown */}
            <ManageCreatorsDropdown
              activePage={activePage}
              setActivePage={setActivePage}
              onItemClick={onClose}
            />
          </nav>

          <div className="flex-1" />
          <SidebarDivider />

          <AdminProfileRow
            name={user.name}
            handle={user.handle}
            avatarSrc={user.avatarSrc}
            role={user.role}
            onLogout={onLogout}
          />
        </div>
      </aside>
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

const DEFAULT_ADMIN_USER: AdminSidebarUser = {
  name: 'Admin User',
  handle: '@admin',
  avatarSrc: '/images/default-avatar.png',
  role: 'ADMIN',
};

export default function AdminSidebar({
  user = DEFAULT_ADMIN_USER,
  onLogout,
  activeItem = 'Dashboard',
  onActiveChange,
  mobileOpen = false,
  onMobileClose,
}: AdminSidebarProps) {
  const [activePage, setActivePage] = useState(activeItem);

  const handleSetActivePage = (page: string) => {
    setActivePage(page);
    onActiveChange?.(page);
  };

  const resolvedUser: AdminSidebarUser = {
    name: user.name,
    handle: user.handle ?? '@admin',
    avatarSrc: user.avatarSrc ?? DEFAULT_ADMIN_USER.avatarSrc,
    role: user.role ?? 'ADMIN',
  };

  const sharedProps: SharedAdminSidebarProps = {
    activePage,
    setActivePage: handleSetActivePage,
    user: resolvedUser,
    onLogout,
  };

  return (
    <>
      {/* Mobile drawer (<md) */}
      <div className="md:hidden">
        <AdminMobileSidebar
          open={mobileOpen}
          onClose={onMobileClose ?? (() => { })}
          {...sharedProps}
        />
      </div>

      {/* Tablet icon-rail (md–lg) */}
      <div className="hidden h-full md:flex lg:hidden">
        <AdminTabletSidebar {...sharedProps} />
      </div>

      {/* Desktop full sidebar (lg+) */}
      <div className="hidden h-full lg:flex">
        <AdminDesktopSidebar {...sharedProps} />
      </div>
    </>
  );
}
