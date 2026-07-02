'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import TopNav from '@/components/layout/top-nav';
import BottomNav from '@/components/layout/bottom-nav';
import AnalysisPage from '@/components/pages/analysis-page';
import SettingsPage from '@/components/pages/settings-page';
import ProfilePage from '@/components/pages/profile-page';
import DashboardPage from '@/components/pages/dashboard-page';
import WalletPage from '@/components/pages/wallet-page';
import MessagesPage from '@/components/pages/messages-page';
import FindJobPage from '@/components/pages/find-job-page';
import PostJobPage from '@/components/pages/post-job-page';
import BecomeSellerPage from '@/components/pages/become-seller-page';
import JobBookmarkedPage from '@/components/pages/job-bookmarked-page';


/**
 * Root Client SPA Controller.
 * Manages active pages, mobile drawer toggles, and coordinates
 * layout updates across sidebar, top nav, and bottom nav.
 */
export default function Home() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState('Dashboard');
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<Record<number, boolean>>({});

  const handleToggleSaveJob = (id: number) => {
    setSavedJobIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Sample user profile info — should be wired up to auth session hooks later.
  const sampleUser = {
    name: 'Josh Trek',
    handle: '@joshtrek',
    avatarSrc: '/images/default-avatar.png',
  };

  const handleLogout = () => {
    alert('Logged out');
  };

  // Helper helper to wrap active page transitions
  const handleNavigate = (page: string) => {
    setActivePage(page);
    setHideBottomNav(false); // Reset bottom nav state when switching pages
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* ── Sidebar (Desktop: static, Tablet: rail, Mobile: drawer) ── */}
      <Sidebar
        user={sampleUser}
        activeItem={activePage}
        onActiveChange={handleNavigate}
        onLogout={handleLogout}
        onViewProfile={() => handleNavigate('Profile')}
        onViewSettings={() => handleNavigate('Settings')}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        isFreelancer={true}
      />

      {/* ── Main Layout Column ── */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        {/* Top Navbar */}
        <TopNav
          user={sampleUser}
          notificationCount={3}
          activePage={activePage}
          onMenuOpen={() => setMobileSidebarOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden pb-16 md:pb-0">
          {activePage === 'Analysis' ? (
            <AnalysisPage onBack={() => handleNavigate('Dashboard')} />
          ) : activePage === 'Settings' ? (
            <SettingsPage onBack={() => handleNavigate('Dashboard')} />
          ) : activePage === 'Profile' ? (
            <ProfilePage onBack={() => handleNavigate('Dashboard')} />
          ) : activePage === 'Wallet' ? (
            <WalletPage onBack={() => handleNavigate('Dashboard')} />
          ) : activePage === 'Messages' ? (
            <MessagesPage onBack={() => handleNavigate('Dashboard')} onMobileViewChange={(view) => setHideBottomNav(view === 'chat')} />
          ) : activePage === 'Find Job' ? (
            <FindJobPage
              onBack={() => handleNavigate('Dashboard')}
              onMobileViewChange={(view) => setHideBottomNav(view === 'detail')}
              savedJobIds={savedJobIds}
              onToggleSaveJob={handleToggleSaveJob}
            />
          ) : activePage === 'Bookmarks:Jobs' ? (
            <JobBookmarkedPage
              onBack={() => handleNavigate('Bookmarks')}
              onBrowseJobs={() => handleNavigate('Find Job')}
              savedJobIds={savedJobIds}
              onToggleSaveJob={handleToggleSaveJob}
            />
          ) : activePage === 'Post a Job' ? (
            <PostJobPage onBack={() => handleNavigate('Dashboard')} />
          ) : activePage === 'Become a seller' ? (
            <BecomeSellerPage onBack={() => handleNavigate('Dashboard')} />
          ) : (
            <DashboardPage activePage={activePage} onNavigate={handleNavigate} />
          )}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar ── */}
      {!hideBottomNav && <BottomNav activePage={activePage} onNavigate={handleNavigate} />}
    </div>
  );
}
