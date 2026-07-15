'use client';

import { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  Lock,
  CheckCircle,
  PenTool,
  UserCheck,
  Briefcase,
  UserPlus,
  Coins,
  ArrowUpRight,
  ChevronLeft,
  Star,
  BookOpen,
  History,
  Info,
  DollarSign,
  Heart,
  Calendar,
  AlertTriangle,
  Clock,
  Shield,
  Eye,
  FileText
} from 'lucide-react';
import { AnalysisPageSkeleton } from '@/components/ui/skeleton';
import StakeModal from '@/components/ui/stake-modal';
import Footer from '@/components/layout/footer';
import SubscribeModal from '@/components/ui/subscribe-modal';
import { cn } from '@/lib/utils';

// ─── Data Interface (GET /analytics/me schema representation) ──────────────────
// Note: This matches the structure that will be fetched from the API.

interface AnalyticsData {
  buyer: {
    overview: {
      totalCcSpent: string;
      activeSubscriptions: string;
      contentRead: string;
      jobsPosted: string;
    };
    reader: {
      readThisMonth: number;
      stakedTotal: string;
      returnedCc: string;
      stakesForfeited: number;
      favouriteCategory: string;
      readingStreak: string;
      avgReadTime: string;
    };
    creator: {
      totalPublished: number;
      publishedThisMonth: number;
      totalReaders: number;
      earnedThisMonth: string;
      earnedAllTime: string;
      topContent: string;
      avgAiScore: string;
      rejectedSubmissions: number;
      pendingReview: number;
      avgRating: string;
    };
    buyerStats: {
      jobsPostedAllTime: number;
      activeOrders: number;
      completedJobs: number;
      spentOnJobs: string;
      escrowCc: string;
      disputesRaised: number;
      disputesWon: number;
      topFreelancer: string;
      avgCompletionTime: string;
    };
    subscription: {
      planStatus: string;
      memberSince: string;
      nextRenewalDate: string;
      totalPaidInSubs: string;
      contentUnlocked: number;
    };
    ccSummary: {
      totalReceived: string;
      totalSpent: string;
      walletBalance: string;
      pendingEarnings: string;
    };
  };
  seller: {
    overview: {
      totalCcEarned: string;
      activeJobs: string;
      jobsCompleted: string;
      avgRating: string;
    };
    earnings: {
      earnedThisMonth: string;
      earnedLastMonth: string;
      earnedAllTime: string;
      pendingEarnings: string;
      feesPaid: string;
      largestJob: string;
      avgEarnedPerJob: string;
      chartData: { month: string; value: number }[];
    };
    jobPerformance: {
      applicationsSent: number;
      successRate: string;
      activeJobs: number;
      completedAllTime: number;
      cancelledAllTime: number;
      overdueMilestones: number;
      avgDeliveryTime: string;
      onTimeRate: string;
    };
    satisfaction: {
      overallRating: string;
      reviewsReceived: number;
      fiveStarCount: number;
      repeatClients: number;
      disputesAgainstMe: number;
      disputesLost: number;
      responseRate: string;
      avgResponseTime: string;
    };
    profile: {
      viewsThisMonth: number;
      viewsAllTime: number;
      searchAppearances: number;
      proposalViews: number;
      conversionRate: string;
    };
    deposits: {
      totalDepositsPaid: string;
      totalDepositsRefunded: string;
      depositsPendingRefund: string;
      netDepositCost: string;
    };
  };
}

// ─── Live Mock Data matching the Schema ─────────────────────────────────────────
const MOCK_ANALYTICS_DATA: AnalyticsData = {
  buyer: {
    overview: {
      totalCcSpent: '580 CC',
      activeSubscriptions: '2',
      contentRead: '48 articles',
      jobsPosted: '4 posts',
    },
    reader: {
      readThisMonth: 15,
      stakedTotal: '150 CC',
      returnedCc: '100 CC',
      stakesForfeited: 1,
      favouriteCategory: 'Smart Contracts',
      readingStreak: '6 days',
      avgReadTime: '8.5 min',
    },
    creator: {
      totalPublished: 12,
      publishedThisMonth: 3,
      totalReaders: 340,
      earnedThisMonth: '85 CC',
      earnedAllTime: '420 CC',
      topContent: 'Introduction to Daml Language',
      avgAiScore: '94%',
      rejectedSubmissions: 0,
      pendingReview: 1,
      avgRating: '4.8 stars',
    },
    buyerStats: {
      jobsPostedAllTime: 4,
      activeOrders: 1,
      completedJobs: 3,
      spentOnJobs: '800 CC',
      escrowCc: '400 CC',
      disputesRaised: 1,
      disputesWon: 1,
      topFreelancer: 'John Trek',
      avgCompletionTime: '5 days',
    },
    subscription: {
      planStatus: 'Active',
      memberSince: 'March 10, 2026',
      nextRenewalDate: 'August 10, 2026',
      totalPaidInSubs: '80 CC',
      contentUnlocked: 12,
    },
    ccSummary: {
      totalReceived: '2,500 CC',
      totalSpent: '1,380 CC',
      walletBalance: '5,250 CC',
      pendingEarnings: '125 CC',
    },
  },
  seller: {
    overview: {
      totalCcEarned: '1,250 CC',
      activeJobs: '3 active',
      jobsCompleted: '12 done',
      avgRating: '4.9 stars',
    },
    earnings: {
      earnedThisMonth: '450 CC',
      earnedLastMonth: '380 CC',
      earnedAllTime: '1,250 CC',
      pendingEarnings: '200 CC',
      feesPaid: '62.5 CC',
      largestJob: '400 CC',
      avgEarnedPerJob: '104 CC',
      chartData: [
        { month: 'Feb', value: 120 },
        { month: 'Mar', value: 210 },
        { month: 'Apr', value: 180 },
        { month: 'May', value: 290 },
        { month: 'Jun', value: 380 },
        { month: 'Jul', value: 450 },
      ],
    },
    jobPerformance: {
      applicationsSent: 24,
      successRate: '58%',
      activeJobs: 3,
      completedAllTime: 12,
      cancelledAllTime: 1,
      overdueMilestones: 0,
      avgDeliveryTime: '3.2 days',
      onTimeRate: '96%',
    },
    satisfaction: {
      overallRating: '4.9 stars',
      reviewsReceived: 10,
      fiveStarCount: 9,
      repeatClients: 2,
      disputesAgainstMe: 0,
      disputesLost: 0,
      responseRate: '98%',
      avgResponseTime: '1.5 hours',
    },
    profile: {
      viewsThisMonth: 142,
      viewsAllTime: 840,
      searchAppearances: 1250,
      proposalViews: 18,
      conversionRate: '66%',
    },
    deposits: {
      totalDepositsPaid: '12.0 CC',
      totalDepositsRefunded: '10.0 CC',
      depositsPendingRefund: '1.5 CC',
      netDepositCost: '0.5 CC',
    },
  },
};

// ─── Shared Components ────────────────────────────────────────────────────────

function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative rounded-2xl border border-border bg-card transition-all duration-300",
        onClick && "hover:border-primary/30 hover:bg-[#8C5CFF]/5 cursor-pointer active:scale-[0.99]",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Sub-page parameter row ───────────────────────────────────────────────────

function DetailRow({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border/40 last:border-b-0 w-full min-w-0 gap-4">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-sans text-[13px] font-medium text-foreground/80 truncate">{label}</span>
        {sub && <span className="font-sans text-[11px] text-muted truncate">{sub}</span>}
      </div>
      <span className="font-sans text-[14px] font-semibold text-foreground/90 shrink-0">{value}</span>
    </div>
  );
}

// ─── Detail View Header ──────────────────────────────────────────────────────

function SectionHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-border pb-5 mb-6">
      <button
        onClick={onBack}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-foreground transition-colors cursor-pointer"
        title="Back to Overview"
      >
        <ChevronLeft size={16} />
      </button>
      <h2 className="text-[20px] font-bold text-foreground/85">{title}</h2>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

interface AnalysisPageProps {
  sellerMode?: boolean;
  onBack?: () => void;
}

export default function AnalysisPage({ sellerMode = false, onBack }: AnalysisPageProps) {
  const [loading, setLoading] = useState(true);
  const [activeDetailView, setActiveDetailView] = useState<string | null>(null);
  const [isCreatorView, setIsCreatorView] = useState(true);

  // Modal controls
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);

  // Simulate loading state (TanStack Query simulation)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <AnalysisPageSkeleton />;

  const buyerData = MOCK_ANALYTICS_DATA.buyer;
  const sellerData = MOCK_ANALYTICS_DATA.seller;

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-y-auto no-scrollbar">
      <div className="flex flex-1 flex-col p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full gap-8">
        
        {/* Developer comment concerning future API integration (Option A comment) */}
        {/* TODO: Integrate this page with TanStack Query.
            Example fetch pattern:
            const { data, isLoading } = useQuery({
              queryKey: ['analytics', user.id],
              queryFn: () => fetch('/api/analytics/me').then(res => res.json())
            });
            We will bind this when real backend integration becomes available. */}

        {activeDetailView === null ? (
          // ─── Main Dashboard Overview ───
          <>
            {/* Dashboard Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-foreground transition-colors md:hidden cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                )}
                <div>
                  <h1 className="font-sans text-[28px] sm:text-[36px] font-bold tracking-tight text-foreground/85">
                    Analysis
                  </h1>
                  <p className="font-sans text-[13px] text-muted mt-1">
                    Hello! @Joshtrek 
                    <span className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
                      {sellerMode ? 'Freelancer Mode' : 'Buyer Mode'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Creator Mode Toggle (Buyer side only) */}
              {!sellerMode && (
                <div className="flex items-center gap-2 self-start sm:self-auto bg-card border border-border rounded-xl p-1.5 px-3">
                  <span className="font-sans text-[12px] font-medium text-foreground/80">Creator View</span>
                  <button
                    onClick={() => setIsCreatorView(prev => !prev)}
                    className={cn(
                      "w-9 h-5 rounded-full transition-colors relative cursor-pointer",
                      isCreatorView ? "bg-primary" : "bg-border/60"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform",
                      isCreatorView ? "translate-x-4" : "translate-x-0"
                    )} />
                  </button>
                </div>
              )}
            </div>

            {/* Overview Stats (4 Cards) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {!sellerMode ? (
                <>
                  <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2 shadow-sm">
                    <span className="text-[12px] font-medium text-muted">Total CC Spent</span>
                    <span className="text-[20px] font-bold text-foreground">{buyerData.overview.totalCcSpent}</span>
                    <span className="text-[11px] text-[#F87171] font-medium">All activities</span>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2 shadow-sm">
                    <span className="text-[12px] font-medium text-muted">Active Subscriptions</span>
                    <span className="text-[20px] font-bold text-foreground">{buyerData.overview.activeSubscriptions}</span>
                    <span className="text-[11px] text-primary font-medium">Unlocked tiers</span>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2 shadow-sm">
                    <span className="text-[12px] font-medium text-muted">Content Read</span>
                    <span className="text-[20px] font-bold text-foreground">{buyerData.overview.contentRead}</span>
                    <span className="text-[11px] text-muted">This month</span>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2 shadow-sm">
                    <span className="text-[12px] font-medium text-muted">Jobs Posted</span>
                    <span className="text-[20px] font-bold text-foreground">{buyerData.overview.jobsPosted}</span>
                    <span className="text-[11px] text-[#4ADE80] font-medium">Active hirings</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2 shadow-sm">
                    <span className="text-[12px] font-medium text-muted">Total CC Earned</span>
                    <span className="text-[20px] font-bold text-foreground">{sellerData.overview.totalCcEarned}</span>
                    <span className="text-[11px] text-[#4ADE80] font-medium">+12% this month</span>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2 shadow-sm">
                    <span className="text-[12px] font-medium text-muted">Active Jobs</span>
                    <span className="text-[20px] font-bold text-foreground">{sellerData.overview.activeJobs}</span>
                    <span className="text-[11px] text-primary font-medium">Contracts in play</span>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2 shadow-sm">
                    <span className="text-[12px] font-medium text-muted">Jobs Completed</span>
                    <span className="text-[20px] font-bold text-foreground">{sellerData.overview.jobsCompleted}</span>
                    <span className="text-[11px] text-muted">All time</span>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2 shadow-sm">
                    <span className="text-[12px] font-medium text-muted">Avg Rating</span>
                    <span className="text-[20px] font-bold text-foreground">{sellerData.overview.avgRating}</span>
                    <span className="text-[11px] text-[#DAC95A] font-medium">Customer satisfaction</span>
                  </div>
                </>
              )}
            </div>

            {/* Main Interactive Category Grid */}
            <div className="flex flex-col gap-4">
              <h2 className="text-[16px] font-semibold text-foreground/80 leading-7">Analysis Categories</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!sellerMode ? (
                  <>
                    <Card onClick={() => setActiveDetailView('reader')} className="p-6 flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><BookOpen size={20} /></div>
                        <div>
                          <h3 className="text-[15px] font-bold text-foreground/85">As a Reader</h3>
                          <p className="text-[11px] text-muted">Track reading streaks, categories, and staked CC</p>
                        </div>
                      </div>
                      <div className="text-[13px] text-muted border-t border-border/40 pt-3 flex justify-between">
                        <span>Read this month: {buyerData.reader.readThisMonth} articles</span>
                        <span className="text-primary hover:underline">View details →</span>
                      </div>
                    </Card>

                    {isCreatorView && (
                      <Card onClick={() => setActiveDetailView('creator')} className="p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><PenTool size={20} /></div>
                          <div>
                            <h3 className="text-[15px] font-bold text-foreground/85">As a Creator</h3>
                            <p className="text-[11px] text-muted">Publishing metrics, reader counts, and distribute pool earnings</p>
                          </div>
                        </div>
                        <div className="text-[13px] text-muted border-t border-border/40 pt-3 flex justify-between">
                          <span>Total published: {buyerData.creator.totalPublished} posts</span>
                          <span className="text-primary hover:underline">View details →</span>
                        </div>
                      </Card>
                    )}

                    <Card onClick={() => setActiveDetailView('buyer')} className="p-6 flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Briefcase size={20} /></div>
                        <div>
                          <h3 className="text-[15px] font-bold text-foreground/85">As a Buyer</h3>
                          <p className="text-[11px] text-muted">Escrow locking, completions, disputes, and top hires</p>
                        </div>
                      </div>
                      <div className="text-[13px] text-muted border-t border-border/40 pt-3 flex justify-between">
                        <span>Jobs posted: {buyerData.buyerStats.jobsPostedAllTime} posts</span>
                        <span className="text-primary hover:underline">View details →</span>
                      </div>
                    </Card>

                    <Card onClick={() => setActiveDetailView('subscription')} className="p-6 flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><History size={20} /></div>
                        <div>
                          <h3 className="text-[15px] font-bold text-foreground/85">Subscription History</h3>
                          <p className="text-[11px] text-muted">Premium plan, member dates, next billing milestones</p>
                        </div>
                      </div>
                      <div className="text-[13px] text-muted border-t border-border/40 pt-3 flex justify-between">
                        <span>Plan status: {buyerData.subscription.planStatus}</span>
                        <span className="text-primary hover:underline">View details →</span>
                      </div>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card onClick={() => setActiveDetailView('earnings')} className="p-6 flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Coins size={20} /></div>
                        <div>
                          <h3 className="text-[15px] font-bold text-foreground/85">Earnings Breakdown</h3>
                          <p className="text-[11px] text-muted">Pending milestones, average per-job income, and monthly charts</p>
                        </div>
                      </div>
                      <div className="text-[13px] text-muted border-t border-border/40 pt-3 flex justify-between">
                        <span>This month: {sellerData.earnings.earnedThisMonth}</span>
                        <span className="text-primary hover:underline">View details →</span>
                      </div>
                    </Card>

                    <Card onClick={() => setActiveDetailView('performance')} className="p-6 flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><TrendingUp size={20} /></div>
                        <div>
                          <h3 className="text-[15px] font-bold text-foreground/85">Job Performance</h3>
                          <p className="text-[11px] text-muted">Proposal success rates, delivery speed, and overdue counts</p>
                        </div>
                      </div>
                      <div className="text-[13px] text-muted border-t border-border/40 pt-3 flex justify-between">
                        <span>On-time delivery: {sellerData.jobPerformance.onTimeRate}</span>
                        <span className="text-primary hover:underline">View details →</span>
                      </div>
                    </Card>

                    <Card onClick={() => setActiveDetailView('satisfaction')} className="p-6 flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Star size={20} /></div>
                        <div>
                          <h3 className="text-[15px] font-bold text-foreground/85">Client Satisfaction</h3>
                          <p className="text-[11px] text-muted">Overall rating stars, reviews, response times, and dispute counts</p>
                        </div>
                      </div>
                      <div className="text-[13px] text-muted border-t border-border/40 pt-3 flex justify-between">
                        <span>Response rate: {sellerData.satisfaction.responseRate}</span>
                        <span className="text-primary hover:underline">View details →</span>
                      </div>
                    </Card>

                    <Card onClick={() => setActiveDetailView('profile')} className="p-6 flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><UserCheck size={20} /></div>
                        <div>
                          <h3 className="text-[15px] font-bold text-foreground/85">Profile Performance</h3>
                          <p className="text-[11px] text-muted">Profile traffic views, search placements, and application conversion</p>
                        </div>
                      </div>
                      <div className="text-[13px] text-muted border-t border-border/40 pt-3 flex justify-between">
                        <span>Views this month: {sellerData.profile.viewsThisMonth}</span>
                        <span className="text-primary hover:underline">View details →</span>
                      </div>
                    </Card>

                    <Card onClick={() => setActiveDetailView('deposits')} className="p-6 flex flex-col gap-4 md:col-span-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Shield size={20} /></div>
                        <div>
                          <h3 className="text-[15px] font-bold text-foreground/85">Application Deposits</h3>
                          <p className="text-[11px] text-muted">Deposit refund history logs (0.5 CC / open proposal deposits)</p>
                        </div>
                      </div>
                      <div className="text-[13px] text-muted border-t border-border/40 pt-3 flex justify-between">
                        <span>Net deposit cost: {sellerData.deposits.netDepositCost}</span>
                        <span className="text-primary hover:underline">View details →</span>
                      </div>
                    </Card>
                  </>
                )}
              </div>
            </div>

            {/* CC Summary Card (Always Visible) */}
            {!sellerMode && (
              <div className="flex flex-col gap-4">
                <h2 className="text-[16px] font-semibold text-foreground/80 leading-7">CC Summary</h2>
                <div className="rounded-2xl border border-border bg-[#FAFAFD] dark:bg-[#0B0B0B] p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[11px] font-medium text-muted">Total CC Received</span>
                    <span className="text-[18px] font-bold text-foreground">{buyerData.ccSummary.totalReceived}</span>
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[11px] font-medium text-muted">Total CC Spent</span>
                    <span className="text-[18px] font-bold text-foreground">{buyerData.ccSummary.totalSpent}</span>
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[11px] font-medium text-muted">Current Wallet Balance</span>
                    <span className="text-[18px] font-bold text-primary">{buyerData.ccSummary.walletBalance}</span>
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[11px] font-medium text-muted">Pending Earnings</span>
                    <span className="text-[18px] font-bold text-foreground">{buyerData.ccSummary.pendingEarnings}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          // ─── Sub-page Details Panel ───
          <div className="flex flex-col gap-6">
            
            {/* Render dynamically depending on activeDetailView */}

            {activeDetailView === 'reader' && (
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-2">
                <SectionHeader title="Reader Analytics" onBack={() => setActiveDetailView(null)} />
                <div className="flex flex-col">
                  <DetailRow label="Content read this month" value={buyerData.reader.readThisMonth} sub="Pieces of content opened" />
                  <DetailRow label="CC staked total" value={buyerData.reader.stakedTotal} sub="Total staked across subscriptions" />
                  <DetailRow label="CC returned" value={buyerData.reader.returnedCc} sub="CC successfully unstaked" />
                  <DetailRow label="Stakes forfeited" value={buyerData.reader.stakesForfeited} sub="Left stakes before 10 minute mark" />
                  <DetailRow label="Favourite category" value={buyerData.reader.favouriteCategory} sub="Most frequently read topic" />
                  <DetailRow label="Reading streak" value={buyerData.reader.readingStreak} sub="Consecutive days reading content" />
                  <DetailRow label="Avg read time" value={buyerData.reader.avgReadTime} sub="Minutes per reading session" />
                </div>
              </div>
            )}

            {activeDetailView === 'creator' && (
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-2">
                <SectionHeader title="Creator Analytics" onBack={() => setActiveDetailView(null)} />
                <div className="flex flex-col">
                  <DetailRow label="Total published" value={buyerData.creator.totalPublished} sub="All time published posts" />
                  <DetailRow label="Published this month" value={buyerData.creator.publishedThisMonth} sub="Current calendar month uploads" />
                  <DetailRow label="Total readers" value={buyerData.creator.totalReaders} sub="Unique readers all time" />
                  <DetailRow label="CC earned this month" value={buyerData.creator.earnedThisMonth} sub="Distributed pool earnings" />
                  <DetailRow label="CC earned all time" value={buyerData.creator.earnedAllTime} sub="Lifetime creator earnings" />
                  <DetailRow label="Top performing content" value={buyerData.creator.topContent} sub="Most read piece of content" />
                  <DetailRow label="Avg AI score" value={buyerData.creator.avgAiScore} sub="Quality score across all submissions" />
                  <DetailRow label="Rejected submissions" value={buyerData.creator.rejectedSubmissions} sub="All time rejected by compliance" />
                  <DetailRow label="Pending in review queue" value={buyerData.creator.pendingReview} sub="Awaiting administrator moderation" />
                  <DetailRow label="Avg reader rating" value={buyerData.creator.avgRating} sub="Average rating stars across content" />
                </div>
              </div>
            )}

            {activeDetailView === 'buyer' && (
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-2">
                <SectionHeader title="Buyer Analytics" onBack={() => setActiveDetailView(null)} />
                <div className="flex flex-col">
                  <DetailRow label="Jobs posted all time" value={buyerData.buyerStats.jobsPostedAllTime} sub="Total jobs created" />
                  <DetailRow label="Active orders" value={buyerData.buyerStats.activeOrders} sub="Orders currently in progress" />
                  <DetailRow label="Completed jobs" value={buyerData.buyerStats.completedJobs} sub="Delivered and payment-released jobs" />
                  <DetailRow label="CC spent on jobs" value={buyerData.buyerStats.spentOnJobs} sub="All time CC paid to freelancers" />
                  <DetailRow label="CC currently in escrow" value={buyerData.buyerStats.escrowCc} sub="Locked funds awaiting milestone deliveries" />
                  <DetailRow label="Disputes raised" value={buyerData.buyerStats.disputesRaised} sub="Total raised disputes" />
                  <DetailRow label="Disputes won" value={buyerData.buyerStats.disputesWon} sub="Disputes resolved in buyer favour" />
                  <DetailRow label="Top freelancer" value={buyerData.buyerStats.topFreelancer} sub="Most hired freelancer on your jobs" />
                  <DetailRow label="Avg job completion time" value={buyerData.buyerStats.avgCompletionTime} sub="From post date to delivery release" />
                </div>
              </div>
            )}

            {activeDetailView === 'subscription' && (
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-2">
                <SectionHeader title="Subscription History" onBack={() => setActiveDetailView(null)} />
                <div className="flex flex-col">
                  <DetailRow label="Current plan status" value={buyerData.subscription.planStatus} sub="Active / cancelled tier indicator" />
                  <DetailRow label="Member since" value={buyerData.subscription.memberSince} sub="Join date of premium subscription" />
                  <DetailRow label="Next renewal date" value={buyerData.subscription.nextRenewalDate} sub="Next 20 CC deduction date" />
                  <DetailRow label="Total CC paid in subs" value={buyerData.subscription.totalPaidInSubs} sub="All-time plan billing cost" />
                  <DetailRow label="Total content unlocked" value={buyerData.subscription.contentUnlocked} sub="Premium articles unlocked via stake balance" />
                </div>
              </div>
            )}

            {activeDetailView === 'earnings' && (
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-2">
                <SectionHeader title="Earnings Breakdown" onBack={() => setActiveDetailView(null)} />
                
                {/* SVG/CSS Mock Bar Chart representing 6 months */}
                <div className="mt-2 mb-6 bg-[#FAFAFD] dark:bg-[#0B0B0B] border border-border rounded-xl p-4 flex flex-col gap-3">
                  <span className="font-sans text-[12px] font-semibold text-foreground/80">Monthly Income Trend (Last 6 Months)</span>
                  <div className="h-40 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-border/60">
                    {sellerData.earnings.chartData.map((d, i) => {
                      const maxVal = 500;
                      const heightPercent = `${(d.value / maxVal) * 100}%`;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-white text-[10px] font-bold py-0.5 px-1.5 rounded mb-1">
                            {d.value} CC
                          </span>
                          <div 
                            style={{ height: heightPercent }} 
                            className="w-full bg-primary/70 hover:bg-primary rounded-t transition-colors duration-200" 
                          />
                          <span className="font-sans text-[10px] text-muted font-medium mt-2">{d.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col">
                  <DetailRow label="Earnings this month" value={sellerData.earnings.earnedThisMonth} sub="Monthly CC income" />
                  <DetailRow label="Earnings last month" value={sellerData.earnings.earnedLastMonth} sub="Last month comparison value" />
                  <DetailRow label="Earnings all time" value={sellerData.earnings.earnedAllTime} sub="Lifetime earnings total" />
                  <DetailRow label="Pending earnings" value={sellerData.earnings.pendingEarnings} sub="Milestones approved but not yet released" />
                  <DetailRow label="Platform fees paid" value={sellerData.earnings.feesPaid} sub="5% platform commission deducted all time" />
                  <DetailRow label="Largest single job" value={sellerData.earnings.largestJob} sub="Highest value contract successfully completed" />
                  <DetailRow label="Avg earnings per job" value={sellerData.earnings.avgEarnedPerJob} sub="Lifetime order average value" />
                </div>
              </div>
            )}

            {activeDetailView === 'performance' && (
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-2">
                <SectionHeader title="Job Performance" onBack={() => setActiveDetailView(null)} />
                <div className="flex flex-col">
                  <DetailRow label="Total applications sent" value={sellerData.jobPerformance.applicationsSent} sub="All-time submitted proposals" />
                  <DetailRow label="Application success rate" value={sellerData.jobPerformance.successRate} sub="Accepted bids / total sent" />
                  <DetailRow label="Active jobs" value={sellerData.jobPerformance.activeJobs} sub="Contracts currently in development" />
                  <DetailRow label="Jobs completed" value={sellerData.jobPerformance.completedAllTime} sub="Completions in lifetime" />
                  <DetailRow label="Jobs cancelled" value={sellerData.jobPerformance.cancelledAllTime} sub="Cancelled by client or seller" />
                  <DetailRow label="Overdue milestones" value={sellerData.jobPerformance.overdueMilestones} sub="Contracts behind delivery timeline" />
                  <DetailRow label="Avg delivery time" value={sellerData.jobPerformance.avgDeliveryTime} sub="Average days from assign to complete" />
                  <DetailRow label="On time delivery rate" value={sellerData.jobPerformance.onTimeRate} sub="Percentage of on-time milestone submissions" />
                </div>
              </div>
            )}

            {activeDetailView === 'satisfaction' && (
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-2">
                <SectionHeader title="Client Satisfaction" onBack={() => setActiveDetailView(null)} />
                <div className="flex flex-col">
                  <DetailRow label="Overall rating" value={sellerData.satisfaction.overallRating} sub="Average stars count out of 5" />
                  <DetailRow label="Total reviews received" value={sellerData.satisfaction.reviewsReceived} sub="All time client comments" />
                  <DetailRow label="5 star reviews" value={sellerData.satisfaction.fiveStarCount} sub="Count of perfect feedback scores" />
                  <DetailRow label="Repeat clients" value={sellerData.satisfaction.repeatClients} sub="Clients who hired you again" />
                  <DetailRow label="Disputes raised against me" value={sellerData.satisfaction.disputesAgainstMe} sub="Disputes opened by buyers" />
                  <DetailRow label="Disputes lost" value={sellerData.satisfaction.disputesLost} sub="Disputes resolved in buyer favour" />
                  <DetailRow label="Response rate" value={sellerData.satisfaction.responseRate} sub="First-incoming messages replied to" />
                  <DetailRow label="Avg response time" value={sellerData.satisfaction.avgResponseTime} sub="Average time to reply to buyers" />
                </div>
              </div>
            )}

            {activeDetailView === 'profile' && (
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-2">
                <SectionHeader title="Profile Performance" onBack={() => setActiveDetailView(null)} />
                <div className="flex flex-col">
                  <DetailRow label="Profile views this month" value={sellerData.profile.viewsThisMonth} sub="Unique buyers who opened profile page" />
                  <DetailRow label="Profile views all time" value={sellerData.profile.viewsAllTime} sub="Total views lifetime" />
                  <DetailRow label="Search appearances" value={sellerData.profile.searchAppearances} sub="How often profile ranks in search indexes" />
                  <DetailRow label="Proposal views" value={sellerData.profile.proposalViews} sub="Bids opened and read by posting clients" />
                  <DetailRow label="Conversion rate" value={sellerData.profile.conversionRate} sub="Proposals viewed vs jobs successfully won" />
                </div>
              </div>
            )}

            {activeDetailView === 'deposits' && (
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-2">
                <SectionHeader title="Application Deposits" onBack={() => setActiveDetailView(null)} />
                <div className="flex flex-col">
                  <DetailRow label="Total deposits paid" value={sellerData.deposits.totalDepositsPaid} sub="0.5 CC paid per application proposal" />
                  <DetailRow label="Total deposits refunded" value={sellerData.deposits.totalDepositsRefunded} sub="Returned deposits on posting closure" />
                  <DetailRow label="Deposits pending refund" value={sellerData.deposits.depositsPendingRefund} sub="Locked deposits in open job bids" />
                  <DetailRow label="Net deposit cost" value={sellerData.deposits.netDepositCost} sub="Total paid deposits minus refunds" />
                </div>
              </div>
            )}

          </div>
        )}

      </div>
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
