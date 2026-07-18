'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/layout/admin-sidebar';
import AdminLoginPage from '@/components/pages/admin/admin-login-page';
import AdminDashboardPage from '@/components/pages/admin/admin-dashboard-page';
import AdminPlaceholderPage from '@/components/pages/admin/admin-placeholder-page';
import AdminAnalyticsPage from '@/components/pages/admin/admin-analytics-page';
import AdminActiveJobsPage from '@/components/pages/admin/admin-active-jobs-page';
import AdminSellerAppsPage from '@/components/pages/admin/admin-seller-apps-page';
import AdminDisputesPage from '@/components/pages/admin/admin-disputes-page';
import AdminDelistedPage from '@/components/pages/admin/admin-delisted-page';
import AdminReviewQueuePage from '@/components/pages/admin/admin-review-queue-page';
import AdminUsersPage from '@/components/pages/admin/admin-users-page';
import AdminTreasuryPage from '@/components/pages/admin/admin-treasury-page';
import AdminPlatformConfigPage from '@/components/pages/admin/admin-platform-config-page';
import AdminContentCreatorsPage from '@/components/pages/admin/admin-content-creators-page';
import AdminBuyersPage from '@/components/pages/admin/admin-buyers-page';
import AdminSellersPage from '@/components/pages/admin/admin-sellers-page';
import AdminRiskScoresPage from '@/components/pages/admin/admin-risk-scores-page';
import AdminCantonActivityPage from '@/components/pages/admin/admin-canton-activity-page';
import AdminTeamPage from '@/components/pages/admin/admin-team-page';
import AdminSecurityPage from '@/components/pages/admin/admin-security-page';

// ─── Admin pages map ──────────────────────────────────────────────────────────

const PAGE_LABELS = [
  'Dashboard',
  'All Users',
  'Suspended',
  'Risk Scores',
  'Review Queue',
  'Creators',
  'Delisted',
  'Active Jobs',
  'Seller Apps',
  'Disputes',
  'Treasury',
  'Analytics',
  'Platform Config',
  'Canton Activity',
  'Admin Team',
  'Security',
  'Content Creators',
  'Buyers',
  'Sellers',
] as const;

type AdminPage = typeof PAGE_LABELS[number];

function renderAdminPage(page: AdminPage, onNavigate: (page: AdminPage) => void) {
  if (page === 'Dashboard')       return <AdminDashboardPage onNavigate={onNavigate} />;
  if (page === 'Analytics')       return <AdminAnalyticsPage />;
  if (page === 'Active Jobs')     return <AdminActiveJobsPage />;
  if (page === 'Seller Apps')     return <AdminSellerAppsPage />;
  if (page === 'Disputes')        return <AdminDisputesPage />;
  if (page === 'Delisted')        return <AdminDelistedPage />;
  if (page === 'Review Queue')    return <AdminReviewQueuePage />;
  if (page === 'All Users')       return <AdminUsersPage />;
  if (page === 'Treasury')            return <AdminTreasuryPage />;
  if (page === 'Platform Config')     return <AdminPlatformConfigPage />;
  if (page === 'Content Creators')    return <AdminContentCreatorsPage />;
  if (page === 'Buyers')              return <AdminBuyersPage />;
  if (page === 'Sellers')             return <AdminSellersPage />;
  if (page === 'Risk Scores')         return <AdminRiskScoresPage />;
  if (page === 'Canton Activity')     return <AdminCantonActivityPage />;
  if (page === 'Admin Team')          return <AdminTeamPage />;
  if (page === 'Security')            return <AdminSecurityPage />;
  return <AdminPlaceholderPage pageName={page} />;
}

// ─── Top bar ─────────────────────────────────────────────────────────────────

function AdminTopBar({
  activePage,
  onMenuOpen,
}: {
  activePage: string;
  onMenuOpen: () => void;
}) {
  return (
    <header className="flex h-[3.5rem] shrink-0 items-center border-b border-border bg-card px-4 gap-4 md:hidden">
      <button
        type="button"
        onClick={onMenuOpen}
        aria-label="Open admin menu"
        className="flex size-8 items-center justify-center rounded-lg text-foreground/60 hover:bg-foreground/5 hover:text-foreground transition-colors"
      >
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
      <span className="font-sans text-[0.9375rem] font-semibold text-foreground">{activePage}</span>
    </header>
  );
}

// ─── Main admin shell ─────────────────────────────────────────────────────────

export default function AdminApp() {
  const [authed, setAuthed]               = useState(false);
  const [activePage, setActivePage]       = useState<AdminPage>('Dashboard');
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [authChecked, setAuthChecked]     = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('canafri_admin_authed');
      if (stored === '1') setAuthed(true);
    }
    setAuthChecked(true);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('canafri_admin_authed');
    }
    setAuthed(false);
    setActivePage('Dashboard');
  };

  // Avoid flash of login page on refresh when already authed
  if (!authChecked) return null;

  // ── Unauthenticated → show login ───────────────────────────────────────────
  if (!authed) {
    return <AdminLoginPage onLoginSuccess={() => setAuthed(true)} />;
  }

  // ── Authenticated → admin shell ────────────────────────────────────────────
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <AdminSidebar
        activeItem={activePage}
        onActiveChange={(page) => setActivePage(page as AdminPage)}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        user={{
          name:      'Admin User',
          handle:    '@admin',
          avatarSrc: '/images/default-avatar.png',
        }}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <AdminTopBar activePage={activePage} onMenuOpen={() => setMobileOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {renderAdminPage(activePage, setActivePage)}
        </main>
      </div>
    </div>
  );
}
