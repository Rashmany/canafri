'use client';

import { useState, useEffect } from 'react';
import { LogOut, X } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
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
import ProposalsPage from '@/components/pages/proposals-page';
import GigsPage from '@/components/pages/gigs-page';
import BuyerRequestsPage from '@/components/pages/buyer-requests-page';
import OrdersPage from '@/components/pages/orders-page';
import OrderDetailPage from '@/components/pages/order-detail-page';
import SubmitProjectPage from '@/components/pages/submit-project-page';
import ResolutionPage from '@/components/pages/resolution-page';
import BuyerJobsPage from '@/components/pages/buyer-jobs-page';
import ReviewProposalsPage from '@/components/pages/review-proposals-page';
import MobileSplashPage from '@/components/pages/mobile-splash-page';
// MobileSplashPage2 removed — single splash screen is now used
import RegisterPage from '@/components/pages/register-page';
import LoginPage from '@/components/pages/login-page';
import OtpVerificationPage from '@/components/pages/otp-verification-page';
import ForgotPasswordPage from '@/components/pages/forgot-password-page';
import ResetPasswordPage from '@/components/pages/reset-password-page';
import PasswordUpdatedPage from '@/components/pages/password-updated-page';
import SearchPage from '@/components/pages/search-page';


/**
 * Root Client SPA Controller.
 * Manages active pages, mobile drawer toggles, and coordinates
 * layout updates across sidebar, top nav, and bottom nav.
 */
export default function Home() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState<string>('Login');
  const [isInitialized, setIsInitialized] = useState(false);
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    name: string;
    handle: string;
    avatarSrc: string;
  }>({
    name: '',
    handle: '',
    avatarSrc: '/images/default-avatar.png',
  });
  const [savedJobIds, setSavedJobIds] = useState<Record<number, boolean>>({});
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingOtp, setPendingOtp] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sellerMode, setSellerMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const handleSearchNavigate = (query: string) => {
    setSearchQuery(query);
    handleNavigate('Search');
  };

  // Consolidate mounting logic: restore persisted page or default to Login/Splash depending on device
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSeller = localStorage.getItem('canafri_seller_mode');
      if (savedSeller === 'true') {
        setSellerMode(true);
      }
    }
  }, []);

  const handleSellerModeChange = (enabled: boolean) => {
    setSellerMode(enabled);
    localStorage.setItem('canafri_seller_mode', String(enabled));
    // Always go to Dashboard — in seller mode Dashboard renders OrdersPage
    handleNavigate('Dashboard');
  };

  // Sync user details from local storage on load or whenever page changes (e.g. after login)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('canafri_user_profile');
      if (stored) {
        try {
          const profile = JSON.parse(stored);
          setUserProfile({
            name: profile.fullName || 'User',
            handle: profile.username ? `@${profile.username}` : '@user',
            avatarSrc: profile.avatarSrc || '/images/default-avatar.png',
          });
        } catch (e) {
          console.error('Failed to parse user profile', e);
        }
      }
    }
  }, [activePage]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('canafri_active_page');
      const token = localStorage.getItem('canafri_access_token');
      if (saved && saved !== 'MobileSplash' && saved !== 'MobileSplash2') {
        // Restore previously visited page
        setActivePage(saved);
      } else if (!token) {
        // Unauthenticated first-time visit → show onboarding splash on all screen sizes
        setActivePage('MobileSplash');
      } else {
        // Authenticated user → go to Login
        setActivePage('Login');
      }
      setIsInitialized(true);
    }
  }, []);

  const handleToggleSaveJob = (id: number) => {
    setSavedJobIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('canafri_active_page');
      localStorage.removeItem('canafri_access_token');
      localStorage.removeItem('canafri_user_profile');
    }
    // Reset profile state — real data will reload from localStorage on next login
    setUserProfile({
      name: '',
      handle: '',
      avatarSrc: '/images/default-avatar.png',
    });
    setActivePage('Login');
    toast('Logged out successfully', 'success');
  };

  // Helper helper to wrap active page transitions
  const handleNavigate = (page: string) => {
    setActivePage(page);
    setHideBottomNav(false); // Reset bottom nav state when switching pages
    if (typeof window !== 'undefined') {
      localStorage.setItem('canafri_active_page', page);
    }
  };

  // Render a clean fallback background while resolving localStorage path to prevent login flash
  if (!isInitialized) {
    return <div className="min-h-screen w-full bg-[#080808]" />;
  }

  if (activePage === 'MobileSplash') {
    return (
      <MobileSplashPage
        onRegisterClick={() => handleNavigate('Register')}
        onLoginClick={() => handleNavigate('Login')}
      />
    );
  }


  if (activePage === 'Login') {
    return (
      <LoginPage
        onRegisterClick={() => handleNavigate('Register')}
        onLoginSuccess={() => handleNavigate('Dashboard')}
        onForgotPasswordClick={() => handleNavigate('ForgotPassword')}
        onBackClick={() => handleNavigate('MobileSplash')}
      />
    );
  }

  if (activePage === 'Register') {
    return (
      <RegisterPage
        onLoginClick={() => handleNavigate('Login')}
        onRegisterSuccess={(email?: string) => {
          setPendingEmail(email ?? '');
          handleNavigate('OtpVerification');
        }}
        onBackClick={() => handleNavigate('MobileSplash')}
      />
    );
  }

  if (activePage === 'OtpVerification') {
    return (
      <OtpVerificationPage
        email={pendingEmail || 'your email'}
        onBack={() => handleNavigate('Register')}
        onVerificationSuccess={() => {
          // Email is verified — user must now log in to get a real session token
          handleNavigate('Login');
          toast('Email verified! Please sign in to continue.', 'success');
        }}
      />
    );
  }

  if (activePage === 'ForgotPassword') {
    return (
      <ForgotPasswordPage
        onBack={() => handleNavigate('Login')}
        onEmailSubmit={(email) => {
          setPendingEmail(email);
          handleNavigate('ForgotPasswordOtp');
        }}
      />
    );
  }

  if (activePage === 'ForgotPasswordOtp') {
    return (
      <OtpVerificationPage
        email={pendingEmail || 'your email'}
        length={6}
        isForgotPassword={true}
        onBack={() => handleNavigate('ForgotPassword')}
        onVerificationSuccess={(code) => {
          setPendingOtp(code || '');
          handleNavigate('ResetPassword');
        }}
      />
    );
  }

  if (activePage === 'ResetPassword') {
    return (
      <ResetPasswordPage
        email={pendingEmail}
        otp={pendingOtp}
        onBack={() => handleNavigate('ForgotPasswordOtp')}
        onPasswordResetSuccess={() => handleNavigate('PasswordUpdated')}
      />
    );
  }

  if (activePage === 'PasswordUpdated') {
    return (
      <PasswordUpdatedPage
        onSignInClick={() => handleNavigate('Login')}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* ── Sidebar (Desktop: static, Tablet: rail, Mobile: drawer) ── */}
      <Sidebar
        user={userProfile}
        activeItem={activePage}
        onActiveChange={handleNavigate}
        onLogout={handleLogout}
        onViewProfile={() => handleNavigate('Profile')}
        onViewSettings={() => handleNavigate('Settings')}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        isFreelancer={true}
        sellerMode={sellerMode}
        onSellerModeChange={handleSellerModeChange}
      />

      {/* ── Main Layout Column ── */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        {/* Top Navbar */}
        <TopNav
          user={userProfile}
          notificationCount={3}
          activePage={activePage}
          onMenuOpen={() => setMobileSidebarOpen(true)}
          onSearchNavigate={handleSearchNavigate}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden pb-16 md:pb-0">
          {activePage === 'Analysis' ? (
            <AnalysisPage sellerMode={sellerMode} onBack={() => handleNavigate('Dashboard')} />
          ) : activePage === 'Settings' ? (
            <SettingsPage sellerMode={sellerMode} onBack={() => handleNavigate('Dashboard')} />
          ) : activePage === 'Profile' ? (
            <ProfilePage sellerMode={sellerMode} onBack={() => handleNavigate('Dashboard')} />
          ) : activePage === 'Search' ? (
            <SearchPage query={searchQuery} onBack={() => handleNavigate('Dashboard')} />
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
          ) : activePage === 'Proposals' ? (
            <ProposalsPage onBack={() => handleNavigate('Dashboard')} />
          ) : activePage === 'Gigs' ? (
            <GigsPage onBack={() => handleNavigate('Dashboard')} />
          ) : activePage === 'Buyer Request' ? (
            <BuyerRequestsPage onBack={() => handleNavigate('Dashboard')} />
          ) : activePage === 'OrderDetail' ? (
            <OrderDetailPage
              onBack={() => handleNavigate('Dashboard')}
              onDeliverClick={() => handleNavigate('SubmitProject')}
              onResolveClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('canafri_dispute_back_page', 'OrderDetail');
                }
                handleNavigate('Resolution');
              }}
            />
          ) : activePage === 'SubmitProject' ? (
            <SubmitProjectPage onBack={() => handleNavigate('OrderDetail')} />
          ) : activePage === 'Resolution' ? (
            <ResolutionPage
              onBack={() => {
                const backPage = typeof window !== 'undefined' ? localStorage.getItem('canafri_dispute_back_page') : null;
                handleNavigate(backPage || 'My Posted Jobs');
              }}
              onSubmitSuccess={() => {
                handleNavigate('My Posted Jobs');
              }}
            />
          ) : activePage === 'My Posted Jobs' ? (
            <BuyerJobsPage 
              onBack={() => handleNavigate('Dashboard')} 
              onCreateJobClick={() => handleNavigate('Post a Job')} 
              onJobClick={() => handleNavigate('ReviewProposals')}
              onDisputeClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('canafri_dispute_back_page', 'My Posted Jobs');
                }
                handleNavigate('Resolution');
              }}
            />
          ) : activePage === 'ReviewProposals' ? (
            <ReviewProposalsPage onBack={() => handleNavigate('My Posted Jobs')} />
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
            sellerMode ? (
              // Seller Dashboard = Orders page
              <OrdersPage onOrderClick={() => handleNavigate('OrderDetail')} onDisputeApproveClick={() => handleNavigate('BuyerJobs')} />
            ) : (
              <DashboardPage activePage={activePage} onNavigate={handleNavigate} />
            )
          )}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar ── */}
      {!hideBottomNav && <BottomNav activePage={activePage} onNavigate={handleNavigate} />}

      {/* ── LOG OUT CONFIRMATION MODAL ── */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div 
            className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center gap-5 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button top right */}
            <button
              type="button"
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            {/* Logout Icon with soft red gradient background */}
            <div className="size-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2 shrink-0 animate-bounce">
              <LogOut size={24} />
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="font-sans text-base font-bold text-foreground">Sign Out of CanaFri</h3>
              <p className="font-sans text-[12px] leading-relaxed text-muted max-w-[280px]">
                Are you sure you want to log out? You will need to sign back in to access your dashboard and secure wallet.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-xl border border-border hover:bg-foreground/5 py-2.5 font-sans text-[12px] font-semibold text-foreground transition-all active:scale-98 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 active:scale-98 transition-all py-2.5 font-sans text-[12px] font-semibold text-white cursor-pointer shadow-lg shadow-red-600/15"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
