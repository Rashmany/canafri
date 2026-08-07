'use client';

import { useState, useEffect, useCallback } from 'react';
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
import AdminAcceptInvitePage from '@/components/pages/admin/admin-accept-invite-page';
import AdminSupportPage from '@/components/pages/admin/admin-support-page';

// ─── Admin pages map ──────────────────────────────────────────────────────────

const PAGE_LABELS = [
  'Dashboard',
  'Support Tickets',
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

// Roles allowed to access Treasury and Canton Activity
const TREASURY_ROLES = ['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN'];

// Shown when a role tries to access a restricted page
function AccessDeniedBlock({ page }: { page: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center h-full gap-4 text-center px-6">
      <div className="flex size-14 items-center justify-center rounded-full bg-red-500/10">
        <svg className="size-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.955 11.955 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      </div>
      <div>
        <p className="font-sans text-[0.9375rem] font-semibold text-foreground">Access Restricted</p>
        <p className="mt-1 font-sans text-[0.8125rem] text-muted-foreground max-w-xs">
          The <strong>{page}</strong> page is only accessible to Finance Admin, General Admin, and Super Admin.
        </p>
      </div>
    </div>
  );
}

function renderAdminPage(page: AdminPage, onNavigate: (page: AdminPage) => void, role: string) {
  // Treasury & Canton Activity — restricted to FINANCE_ADMIN, ADMIN, SUPER_ADMIN
  if (page === 'Treasury') {
    if (!TREASURY_ROLES.includes(role)) return <AccessDeniedBlock page="Treasury" />;
    return <AdminTreasuryPage />;
  }
  if (page === 'Canton Activity') {
    if (!TREASURY_ROLES.includes(role)) return <AccessDeniedBlock page="Canton Activity" />;
    return <AdminCantonActivityPage />;
  }

  if (page === 'Dashboard')       return <AdminDashboardPage onNavigate={onNavigate} />;
  if (page === 'Support Tickets') return <AdminSupportPage />;
  if (page === 'Analytics')       return <AdminAnalyticsPage />;
  if (page === 'Active Jobs')     return <AdminActiveJobsPage />;
  if (page === 'Seller Apps')     return <AdminSellerAppsPage />;
  if (page === 'Disputes')        return <AdminDisputesPage />;
  if (page === 'Delisted')        return <AdminDelistedPage />;
  if (page === 'Review Queue')    return <AdminReviewQueuePage />;
  if (page === 'All Users')       return <AdminUsersPage />;
  if (page === 'Platform Config')     return <AdminPlatformConfigPage />;
  if (page === 'Content Creators')    return <AdminContentCreatorsPage />;
  if (page === 'Buyers')              return <AdminBuyersPage />;
  if (page === 'Sellers')             return <AdminSellersPage />;
  if (page === 'Risk Scores')         return <AdminRiskScoresPage />;
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
  const [inviteToken, setInviteToken]     = useState<string | null>(null);
  const [adminUser, setAdminUser]         = useState<{ name: string; handle: string; role: string; avatarSrc: string }>({
    name: 'Admin',
    handle: '@admin',
    role: '',
    avatarSrc: '/images/default-avatar.png',
  });

  // Restore session from localStorage on mount + detect invite token in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Detect invite token in URL query params
      const params = new URLSearchParams(window.location.search);
      const tok = params.get('inviteToken');
      if (tok) {
        setInviteToken(tok);
        setAuthChecked(true);
        return; // don't restore session while handling invite
      }

      const savedPage = localStorage.getItem('canafri_admin_active_page');
      if (savedPage) {
        setActivePage(savedPage as AdminPage);
      }

      const token = localStorage.getItem('canafri_admin_access_token');
      if (token) {
        try {
          // JWT uses base64url — replace URL-safe chars before passing to atob
          const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(b64));
          // Clear immediately if the stored token has already expired
          const isExpired = payload.exp && payload.exp * 1000 < Date.now();
          if (isExpired) {
            localStorage.removeItem('canafri_admin_access_token');
            localStorage.removeItem('canafri_admin_active_page');
          } else {
            setAdminUser({
              name: payload.displayName || payload.username || 'Admin',
              handle: `@${payload.username || 'admin'}`,
              role: payload.role || '',
              avatarSrc: '/images/default-avatar.png',
            });
            setAuthed(true);
          }
        } catch {
          localStorage.removeItem('canafri_admin_access_token');
          localStorage.removeItem('canafri_admin_active_page');
        }
      }
    }
    setAuthChecked(true);
  }, []);

  const handleLoginSuccess = (token: string, user: { id: string; username: string; displayName: string; role: string }) => {
    setAdminUser({
      name: user.displayName || user.username,
      handle: `@${user.username}`,
      role: user.role,
      avatarSrc: '/images/default-avatar.png',
    });
    setAuthed(true);
  };

  const handleLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('canafri_admin_access_token');
      localStorage.removeItem('canafri_admin_active_page');
    }
    setAuthed(false);
    setActivePage('Dashboard');
  }, []);

  // ── Session heartbeat — detects if this admin was revoked by a SUPER_ADMIN ──
  // Pings GET /admin/me every 60 s, but ONLY when the tab is active/visible.
  // If the backend returns 401 or 403 (session purged), force-logout immediately.
  useEffect(() => {
    if (!authed) return;

    const API_BASE = '/api';
    let intervalId: NodeJS.Timeout | null = null;

    const checkSession = async () => {
      // Only check if visible
      if (document.visibilityState !== 'visible') return;

      const tok = typeof window !== 'undefined'
        ? localStorage.getItem('canafri_admin_access_token')
        : null;
      if (!tok) { handleLogout(); return; }
      try {
        const res = await fetch(`${API_BASE}/admin/me`, {
          headers: { Authorization: `Bearer ${tok}` },
        });
        if (res.status === 401 || res.status === 403) {
          handleLogout();
        }
      } catch {
        // network error — silently ignore
      }
    };

    const startHeartbeat = () => {
      stopHeartbeat();
      checkSession(); // Check immediately on focus
      intervalId = setInterval(checkSession, 3_600_000); // Check every 1 hour
    };

    const stopHeartbeat = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Start heartbeat if tab is active on mount
    if (document.visibilityState === 'visible') {
      startHeartbeat();
    }

    // Toggle heartbeat dynamically when user switches tabs/minimizes window
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startHeartbeat();
      } else {
        stopHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopHeartbeat();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [authed, handleLogout]);

  // — Avoid flash during init
  if (!authChecked) return null;

  // — Invite token flow
  if (inviteToken) {
    return (
      <AdminAcceptInvitePage
        token={inviteToken}
        onComplete={() => {
          setInviteToken(null);
          // Clear the query param from the URL without reloading
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/admin');
          }
        }}
      />
    );
  }

  // — Unauthenticated → show login
  if (!authed) {
    return <AdminLoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // ── Authenticated → admin shell ────────────────────────────────────────────
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <AdminSidebar
        activeItem={activePage}
        onActiveChange={(page) => {
          setActivePage(page as AdminPage);
          if (typeof window !== 'undefined') {
            localStorage.setItem('canafri_admin_active_page', page);
          }
        }}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        user={{
          name:      adminUser.name,
          handle:    adminUser.handle,
          avatarSrc: adminUser.avatarSrc,
          role:      adminUser.role,
        }}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <AdminTopBar activePage={activePage} onMenuOpen={() => setMobileOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {renderAdminPage(activePage, (page) => {
            setActivePage(page);
            if (typeof window !== 'undefined') {
              localStorage.setItem('canafri_admin_active_page', page);
            }
          }, adminUser.role)}
        </main>
      </div>
    </div>
  );
}
