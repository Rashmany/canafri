'use client';

import {
  LayoutDashboard,
  Search,
  MessageSquare,
  Wallet,
  User,
  type LucideIcon,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BottomNavItem {
  label: string;
  page: string;
  icon: LucideIcon;
}

interface BottomNavProps {
  /** The key/label of the currently active page */
  activePage: string;
  /** Navigation callback to the parent component */
  onNavigate: (page: string) => void;
}

// ─── Navigation Items ─────────────────────────────────────────────────────────

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  {
    label: 'Dashboard',
    page: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Search',
    page: 'Search',
    icon: Search,
  },
  {
    label: 'Message',
    page: 'Messages',
    icon: MessageSquare,
  },
  {
    label: 'Wallet',
    page: 'Wallet',
    icon: Wallet,
  },
  {
    label: 'Profile',
    page: 'Profile',
    icon: User,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Mobile Bottom Navigation Bar (<md only).
 * Provides quick access to main sections with active state indicator pills.
 *
 * Import path: `@/components/layout/bottom-nav`
 */
export default function BottomNav({ activePage, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between bg-background px-[0.625rem] py-[1rem] md:hidden">
      {BOTTOM_NAV_ITEMS.map((item) => {
        const isActive = activePage === item.page;
        const Icon = item.icon;

        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onNavigate(item.page)}
            className="relative flex flex-1 flex-col items-center gap-[0.1875rem] min-w-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5CFF]/50"
            aria-label={item.label}
          >
            {/* Active background pill */}
            {isActive && (
              <span 
                className="absolute top-[-2px] h-[1.5625rem] w-[2.625rem] rounded-[3.125rem] opacity-35"
                style={{ backgroundColor: 'var(--reflect-1, #291d46)' }}
              />
            )}

            {/* Icon */}
            <span className={`relative z-10 transition-colors duration-300 ease-out ${isActive ? 'text-[#8C5CFF]' : 'text-foreground/60'}`}>
              <Icon
                size={24}
                strokeWidth={isActive ? 2 : 1.5}
              />
            </span>

            {/* Label */}
            <span
              className={`z-10 font-sans text-[0.625rem] font-semibold leading-[0.8125rem] whitespace-nowrap transition-colors duration-300 ease-out ${
                isActive ? 'text-[#8C5CFF]' : 'text-foreground/75'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
