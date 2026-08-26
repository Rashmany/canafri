'use client';

import { useState, useEffect } from 'react';
import { LogOut, X } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { initSocket, getSocket, disconnectSocket } from '@/lib/socket';
import { apiFetch, verifyStartupSession, performLogout, GUEST_PAGES } from '@/lib/api-client';
import { NavProvider } from '@/lib/nav-context';
import { usePlatformConfig } from '@/lib/platform-config-context';
import { FeatureGate } from '@/components/ui/feature-gate';
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
import FindSellerPage from '@/components/pages/find-seller-page';
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
import AlreadySellerPage from '@/components/pages/already-seller-page';
import SupportPage from '@/components/pages/support-page';
import MyTicketsPage from '@/components/pages/my-tickets-page';
import PrivacyPolicyPage from '@/components/pages/privacy-policy-page';
import TermsPage from '@/components/pages/terms-page';

/**
 * Root Client SPA Controller.
 * Manages active pages, mobile drawer toggles, and coordinates
 * layout updates across sidebar, top nav, and bottom nav.
 */
export default function Home() {
  const { config } = usePlatformConfig();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState<string>('Login');
  const [previousPage, setPreviousPage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    name: string;
    handle: string;
    avatarSrc: string;
    isSeller: boolean;
  }>({
    name: '',
    handle: '',
    avatarSrc: '/images/default-avatar.png',
    isSeller: false,
  });
  const [savedJobIds, setSavedJobIds] = useState<Record<number, boolean>>({});
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingOtp, setPendingOtp] = useState('');
  const [pendingDevOtp, setPendingDevOtp] = useState<string | undefined>(undefined);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sellerMode, setSellerMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageTargetUser, setMessageTargetUser] = useState<{ id: string; name: string; username?: string; avatarUrl?: string } | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleOpenChatWithUser = (user: { id: string; name: string; username?: string; avatarUrl?: string }) => {
    setMessageTargetUser(user);
    handleNavigate('Messages');
  };

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

  // Sync user details from local storage and live API on load or whenever page changes
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
            isSeller: !!(profile.isSeller && profile.sellerApproved),
          });
        } catch (e) {
          console.error('Failed to parse user profile', e);
        }
      }

      // Fetch live authoritative profile from backend /users/me using centralized apiFetch
      const token = localStorage.getItem('canafri_access_token');
      if (token && !GUEST_PAGES.includes(activePage)) {
        apiFetch('/api/users/me')
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.user) {
              const u = data.user;
              const isSellerApproved = !!(u.isSeller && u.sellerApproved);
              setUserProfile({
                name: u.displayName || u.username || 'User',
                handle: u.username ? `@${u.username}` : '@user',
                avatarSrc: u.avatarUrl || '/images/default-avatar.png',
                isSeller: isSellerApproved,
              });
              // Sync back to local storage
              try {
                const existing = stored ? JSON.parse(stored) : {};
                localStorage.setItem('canafri_user_profile', JSON.stringify({
                  ...existing,
                  fullName: u.displayName || existing.fullName || '',
                  username: u.username || existing.username || '',
                  email: u.email || existing.email || '',
                  isSeller: u.isSeller,
                  sellerApproved: u.sellerApproved,
                  sellerApplied: u.sellerApplied,
                }));
              } catch {}
            }
          })
          .catch(() => {});
      }
    }
  }, [activePage]);

  // Global Socket.IO real-time listener for instant unread message badge updates across all pages
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('canafri_access_token');
    if (!token) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await apiFetch('/api/messages/unread-count');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.unreadCount === 'number') {
            setUnreadMessageCount(data.unreadCount);
          }
        }
      } catch (e) {
        console.error('Failed to fetch unread message count:', e);
      }
    };

    fetchUnreadCount();

    const socket = getSocket();
    if (!socket) return;

    const getMyUserId = () => {
      const stored = localStorage.getItem('canafri_user_profile');
      if (stored) {
        try { return JSON.parse(stored).id || null; } catch {}
      }
      return null;
    };

    const handleGlobalNewMessage = (msg: any) => {
      const myId = getMyUserId();
      if (myId && msg.receiverId === myId) {
        const activeChatUserId = (window as any).__canafri_active_chat_user_id;
        if (!activeChatUserId || activeChatUserId !== msg.senderId) {
          setUnreadMessageCount(prev => prev + 1);
        }
      }
    };

    const handleGlobalMessagesRead = (data: { readByUserId: string; senderId: string }) => {
      const myId = getMyUserId();
      if (myId && data.readByUserId === myId) {
        fetchUnreadCount();
      }
    };

    socket.on('connect', fetchUnreadCount);
    socket.on('new_message', handleGlobalNewMessage);
    socket.on('messages_read', handleGlobalMessagesRead);

    return () => {
      socket.off('connect', fetchUnreadCount);
      socket.off('new_message', handleGlobalNewMessage);
      socket.off('messages_read', handleGlobalMessagesRead);
    };
  }, []);

  // Listen for global session expiration custom event
  useEffect(() => {
    const handleExpired = () => {
      disconnectSocket();
      setUserProfile({
        name: '',
        handle: '',
        avatarSrc: '/images/default-avatar.png',
        isSeller: false,
      });
      const currentPage = typeof window !== 'undefined' ? localStorage.getItem('canafri_active_page') : activePage;
      const isGuest = GUEST_PAGES.includes(currentPage || activePage);
      if (!isGuest) {
        setActivePage('Login');
        toast('Session expired. Please log in again.', 'error');
      }
    };

    window.addEventListener('canafri:session-expired', handleExpired);
    return () => {
      window.removeEventListener('canafri:session-expired', handleExpired);
    };
  }, [activePage, toast]);

  // App Startup authentication verification
  useEffect(() => {
    async function initAuth() {
      if (typeof window === 'undefined') return;

      // Handle Google OAuth callback redirect parameters
      const urlParams = new URLSearchParams(window.location.search);
      const googleToken = urlParams.get('google_access_token');
      const authError = urlParams.get('auth_error');

      if (authError) {
        toast(decodeURIComponent(authError), 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (googleToken) {
        localStorage.setItem('canafri_access_token', googleToken);
        localStorage.setItem('canafri_active_page', 'Dashboard');
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const saved = localStorage.getItem('canafri_active_page') || 'MobileSplash';
      const token = localStorage.getItem('canafri_access_token');
      const isSavedGuest = GUEST_PAGES.includes(saved);

      if (!token && isSavedGuest) {
        setActivePage(saved);
        setIsInitialized(true);
        return;
      }

      // Validate session via centralized verifyStartupSession (handles silent refresh if needed)
      const sessionData = await verifyStartupSession();

      if (sessionData?.user) {
        const u = sessionData.user;
        setUserProfile({
          name: u.displayName || u.username || 'User',
          handle: u.username ? `@${u.username}` : '@user',
          avatarSrc: u.avatarUrl || '/images/default-avatar.png',
          isSeller: !!(u.isSeller && u.sellerApproved),
        });

        // Initialize Socket.IO connection ONLY AFTER startup verification completes with a valid token
        initSocket();

        if (googleToken || isSavedGuest) {
          setActivePage('Dashboard');
        } else {
          setActivePage(saved);
        }
      } else {
        // Token invalid or expired and could not be refreshed
        disconnectSocket();
        if (isSavedGuest) {
          setActivePage(saved);
        } else {
          setActivePage('Login');
        }
      }

      setIsInitialized(true);
    }

    initAuth();
  }, []);

  const handleToggleSaveJob = (id: number) => {
    setSavedJobIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await performLogout();
    // Reset profile state
    setUserProfile({
      name: '',
      handle: '',
      avatarSrc: '/images/default-avatar.png',
      isSeller: false,
    });
    setActivePage('Login');
    toast('Logged out successfully', 'success');
  };

  // Helper to wrap active page transitions with authentication guard for guests
  const handleNavigate = (page: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;
    const isPublicPage = GUEST_PAGES.includes(page) || page === 'Support';

    if (!token && !isPublicPage) {
      toast('Please sign in to access this feature', 'info');
      setActivePage('Login');
      setHideBottomNav(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('canafri_active_page', 'Login');
      }
      return;
    }

    setPreviousPage(activePage);
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
        onRegisterSuccess={(email?: string, devOtp?: string) => {
          setPendingEmail(email ?? '');
          setPendingDevOtp(devOtp);
          handleNavigate('OtpVerification');
        }}
        onBackClick={() => handleNavigate('MobileSplash')}
        onNavigate={handleNavigate}
      />
    );
  }


  if (activePage === 'OtpVerification') {
    return (
      <OtpVerificationPage
        email={pendingEmail || 'your email'}
        devOtp={pendingDevOtp}
        onBack={() => handleNavigate('Register')}
        onVerificationSuccess={() => {
          setPendingDevOtp(undefined);
          handleNavigate('Dashboard');
          toast('Email verified! Welcome to CanaFri.', 'success');
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

  if (activePage === 'Privacy Policy') {
    return (
      <NavProvider value={handleNavigate}>
        <PrivacyPolicyPage
          onBack={() => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;
            if (previousPage && previousPage !== 'Privacy Policy' && previousPage !== 'Terms of Service') {
              handleNavigate(previousPage);
            } else if (token) {
              handleNavigate('Dashboard');
            } else {
              handleNavigate('Register');
            }
          }}
          onNavigate={handleNavigate}
        />
      </NavProvider>
    );
  }

  if (activePage === 'Terms of Service') {
    return (
      <NavProvider value={handleNavigate}>
        <TermsPage
          onBack={() => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;
            if (previousPage && previousPage !== 'Privacy Policy' && previousPage !== 'Terms of Service') {
              handleNavigate(previousPage);
            } else if (token) {
              handleNavigate('Dashboard');
            } else {
              handleNavigate('Register');
            }
          }}
          onNavigate={handleNavigate}
        />
      </NavProvider>
    );
  }

  return (
    <NavProvider value={handleNavigate}>
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* ── Sidebar (Desktop: static, Tablet: rail, Mobile: drawer) ── */}
      <Sidebar
        user={userProfile}
        activeItem={activePage}
        onActiveChange={(page) => {
          // If an approved seller clicks "Become a seller" in buyer mode,
          // redirect them to the "already a seller" info page instead.
          if (page === 'Become a seller' && userProfile.isSeller) {
            handleNavigate('Already a Seller');
          } else {
            handleNavigate(page);
          }
        }}
        onLogout={handleLogout}
        onViewProfile={() => handleNavigate('Profile')}
        onViewSettings={() => handleNavigate('Settings')}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        isFreelancer={true}
        isSeller={userProfile.isSeller}
        sellerMode={sellerMode}
        onSellerModeChange={handleSellerModeChange}
        unreadMessageCount={unreadMessageCount}
      />

      {/* ── Main Layout Column ── */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        {/* Top Navbar - hidden on Profile, and on mobile for Search and active Messages chat */}
        {activePage !== 'Profile' && (
          <div
            className={
              activePage === 'Search' || (activePage === 'Messages' && hideBottomNav)
                ? 'hidden md:block'
                : ''
            }
          >
            <TopNav
              user={userProfile}
              activePage={activePage}
              onMenuOpen={() => setMobileSidebarOpen(true)}
              onSearchNavigate={handleSearchNavigate}
              onNavigate={handleNavigate}
            />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-h-0 overflow-y-auto pb-16 md:pb-0 flex flex-col">
          {activePage === 'Analysis' ? (
            <AnalysisPage
              sellerMode={sellerMode}
              onBack={() => handleNavigate('Dashboard')}
              onNavigate={handleNavigate}
              user={userProfile}
            />
          ) : activePage === 'Settings' ? (
            <SettingsPage sellerMode={sellerMode} onBack={() => handleNavigate('Dashboard')} onNavigate={handleNavigate} />
          ) : activePage === 'Profile' ? (
            <ProfilePage sellerMode={sellerMode} onBack={() => handleNavigate('Dashboard')} onOpenChat={handleOpenChatWithUser} onNavigate={handleNavigate} />
          ) : activePage === 'Search' ? (
            <SearchPage query={searchQuery} onBack={() => handleNavigate('Dashboard')} />
          ) : activePage === 'Wallet' ? (
            <WalletPage
              onBack={() => handleNavigate('Dashboard')}
              onNavigate={handleNavigate}
              user={userProfile}
            />
          ) : activePage === 'Messages' ? (
            <FeatureGate active={config.messagingMaintenance} featureName="Messaging" reason={config.messagingMaintenanceReason}>
              <div className="h-full min-h-0 overflow-hidden -mb-16 md:mb-0 flex flex-col">
                <MessagesPage
                  onBack={() => handleNavigate('Dashboard')}
                  onMobileViewChange={(view) => setHideBottomNav(view === 'chat')}
                  initialTargetUser={messageTargetUser}
                  onUnreadCountChange={setUnreadMessageCount}
                />
              </div>
            </FeatureGate>
          ) : activePage === 'Find Job' ? (
            <FeatureGate active={config.freelancingMaintenance} featureName="Freelancing" reason={config.freelancingMaintenanceReason}>
              <div className="h-full overflow-y-auto no-scrollbar -mb-16 md:mb-0 flex flex-col">
                <FindJobPage
                  onBack={() => handleNavigate('Dashboard')}
                  onMobileViewChange={(view) => setHideBottomNav(view === 'detail')}
                  savedJobIds={savedJobIds}
                  onToggleSaveJob={handleToggleSaveJob}
                />
              </div>
            </FeatureGate>
          ) : activePage === 'Find Sellers' ? (
            <FeatureGate active={config.freelancingMaintenance} featureName="Freelancing" reason={config.freelancingMaintenanceReason}>
              <div className="h-full overflow-y-auto no-scrollbar -mb-16 md:mb-0 flex flex-col">
                <FindSellerPage
                  onBack={() => handleNavigate('Dashboard')}
                  onMobileViewChange={(view) => setHideBottomNav(view === 'detail')}
                  onOpenChat={handleOpenChatWithUser}
                />
              </div>
            </FeatureGate>
          ) : activePage === 'Proposals' ? (
            <FeatureGate active={config.freelancingMaintenance} featureName="Freelancing" reason={config.freelancingMaintenanceReason}>
              <ProposalsPage onBack={() => handleNavigate('Dashboard')} />
            </FeatureGate>
          ) : activePage === 'Gigs' ? (
            <FeatureGate active={config.freelancingMaintenance} featureName="Freelancing" reason={config.freelancingMaintenanceReason}>
              <GigsPage onBack={() => handleNavigate('Dashboard')} />
            </FeatureGate>
          ) : activePage === 'Buyer Request' ? (
            <FeatureGate active={config.freelancingMaintenance} featureName="Freelancing" reason={config.freelancingMaintenanceReason}>
              <BuyerRequestsPage onBack={() => handleNavigate('Dashboard')} />
            </FeatureGate>
          ) : activePage === 'OrderDetail' ? (
            <OrderDetailPage
              jobId={selectedJobId || undefined}
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
            <SubmitProjectPage jobId={selectedJobId || undefined} onBack={() => handleNavigate('OrderDetail')} />
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
            <ReviewProposalsPage
              onBack={() => handleNavigate('My Posted Jobs')}
              onNavigateToMessages={() => handleNavigate('Messages')}
            />
          ) : activePage === 'Bookmarks:Jobs' ? (
            <JobBookmarkedPage
              onBack={() => handleNavigate('Bookmarks')}
              onBrowseJobs={() => handleNavigate('Find Job')}
              savedJobIds={savedJobIds}
              onToggleSaveJob={handleToggleSaveJob}
            />
          ) : activePage === 'Post a Job' ? (
            <FeatureGate active={config.freelancingMaintenance} featureName="Freelancing" reason={config.freelancingMaintenanceReason}>
              <PostJobPage onBack={() => handleNavigate('Dashboard')} onJobPosted={() => handleNavigate('Dashboard')} />
            </FeatureGate>
          ) : activePage === 'Become a seller' ? (
            <FeatureGate active={config.creatorPaused} featureName="Seller Applications" reason={config.creatorPausedReason}>
              {userProfile.isSeller ? (
                // Already approved seller accidentally navigated here — redirect inline
                <AlreadySellerPage onEnableSellerMode={() => { handleSellerModeChange(true); }} onBack={() => handleNavigate('Dashboard')} />
              ) : (
                <BecomeSellerPage onBack={() => handleNavigate('Dashboard')} onNavigateToSettings={() => handleNavigate('Settings')} />
              )}
            </FeatureGate>
          ) : activePage === 'Already a Seller' ? (
            <AlreadySellerPage onEnableSellerMode={() => { handleSellerModeChange(true); }} onBack={() => handleNavigate('Dashboard')} />
          ) : activePage === 'Support' ? (
            <SupportPage onBack={() => handleNavigate('Dashboard')} />
          ) : activePage === 'My Tickets' ? (
            <MyTicketsPage onBack={() => handleNavigate('Dashboard')} onNavigateToCreate={() => handleNavigate('Support')} />
          ) : (
            sellerMode ? (
              // Seller Dashboard = Orders page
              <OrdersPage
                onOrderClick={(orderId) => {
                  if (orderId) setSelectedJobId(String(orderId));
                  handleNavigate('OrderDetail');
                }}
                onDisputeApproveClick={() => handleNavigate('BuyerJobs')}
              />
            ) : (
              <div className="h-full overflow-y-auto no-scrollbar -mb-16 md:mb-0 flex flex-col">
                <DashboardPage activePage={activePage} onNavigate={handleNavigate} />
              </div>
            )
          )}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar ── */}
      {!hideBottomNav && <BottomNav activePage={activePage} onNavigate={handleNavigate} unreadMessageCount={unreadMessageCount} />}

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
    </NavProvider>
  );
}
