'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  MoreHorizontal,
  TrendingUp,
  Eye,
  Ban,
  ShieldAlert,
  UserCheck,
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  UserMinus,
  LogOut,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type CreatorStatus = 'Active' | 'Inactive' | 'Suspended';
type VerificationStatus = 'Verified' | 'Pending' | 'Unverified';

interface Creator {
  id: number;
  name: string;
  handle: string;
  avatarInitials: string;
  articles: number;
  revenue: number;       // in CC
  status: CreatorStatus;
  verification: VerificationStatus;
  joinedDate: string;
  email: string;
  location: string;
  followers: number;
  totalViews: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CREATORS: Creator[] = [
  { id: 1,  name: 'James McAllister', handle: '@jamesmcallister', avatarInitials: 'JM', articles: 28, revenue: 25430, status: 'Active',    verification: 'Verified',   joinedDate: 'Jan 2025',  email: 'james@canafri.io',    location: 'Lagos, Nigeria',     followers: 12400, totalViews: 248000 },
  { id: 2,  name: 'Amara Diallo',      handle: '@amaradiallo',      avatarInitials: 'AD', articles: 14, revenue: 11200, status: 'Active',    verification: 'Verified',   joinedDate: 'Feb 2025',  email: 'amara@canafri.io',    location: 'Abuja, Nigeria',     followers: 8200,  totalViews: 134000 },
  { id: 3,  name: 'Kweku Mensah',      handle: '@kwekumensah',      avatarInitials: 'KM', articles: 7,  revenue: 4870,  status: 'Inactive',  verification: 'Pending',    joinedDate: 'Mar 2025',  email: 'kweku@canafri.io',    location: 'Accra, Ghana',       followers: 3100,  totalViews: 47000  },
  { id: 4,  name: 'Fatima Bello',      handle: '@fatimabello',      avatarInitials: 'FB', articles: 32, revenue: 38900, status: 'Active',    verification: 'Verified',   joinedDate: 'Nov 2024',  email: 'fatima@canafri.io',   location: 'Kano, Nigeria',      followers: 19600, totalViews: 412000 },
  { id: 5,  name: 'Seun Adeyinka',     handle: '@seunadeyinka',     avatarInitials: 'SA', articles: 5,  revenue: 1240,  status: 'Suspended', verification: 'Unverified', joinedDate: 'Apr 2025',  email: 'seun@canafri.io',     location: 'Ibadan, Nigeria',    followers: 740,   totalViews: 9800   },
  { id: 6,  name: 'Chinwe Okafor',     handle: '@chinweokafor',     avatarInitials: 'CO', articles: 19, revenue: 18750, status: 'Active',    verification: 'Verified',   joinedDate: 'Dec 2024',  email: 'chinwe@canafri.io',   location: 'Enugu, Nigeria',     followers: 9300,  totalViews: 185000 },
  { id: 7,  name: 'Emeka Nwosu',       handle: '@emekanwosu',       avatarInitials: 'EN', articles: 11, revenue: 7320,  status: 'Active',    verification: 'Pending',    joinedDate: 'Mar 2025',  email: 'emeka@canafri.io',    location: 'Port Harcourt, NG',  followers: 4500,  totalViews: 63000  },
  { id: 8,  name: 'Aisha Kamara',      handle: '@aishakamara',      avatarInitials: 'AK', articles: 23, revenue: 21100, status: 'Active',    verification: 'Verified',   joinedDate: 'Jan 2025',  email: 'aisha@canafri.io',    location: 'Freetown, SL',       followers: 11200, totalViews: 198000 },
  { id: 9,  name: 'Tunde Fashola',     handle: '@tundefashola',     avatarInitials: 'TF', articles: 3,  revenue: 890,   status: 'Inactive',  verification: 'Unverified', joinedDate: 'May 2025',  email: 'tunde@canafri.io',    location: 'Lagos, Nigeria',     followers: 210,   totalViews: 3200   },
  { id: 10, name: 'Ngozi Eze',         handle: '@ngozieze',         avatarInitials: 'NE', articles: 41, revenue: 52400, status: 'Active',    verification: 'Verified',   joinedDate: 'Oct 2024',  email: 'ngozi@canafri.io',    location: 'Owerri, Nigeria',    followers: 28700, totalViews: 631000 },
  { id: 11, name: 'Kojo Asante',       handle: '@kojoasante',       avatarInitials: 'KA', articles: 9,  revenue: 5600,  status: 'Active',    verification: 'Verified',   joinedDate: 'Feb 2025',  email: 'kojo@canafri.io',     location: 'Kumasi, Ghana',      followers: 3800,  totalViews: 58000  },
  { id: 12, name: 'Ifeoma Chukwu',     handle: '@ifeomachukwu',     avatarInitials: 'IC', articles: 17, revenue: 13400, status: 'Suspended', verification: 'Pending',    joinedDate: 'Jan 2025',  email: 'ifeoma@canafri.io',   location: 'Onitsha, Nigeria',   followers: 6100,  totalViews: 89000  },
  { id: 13, name: 'Bode Adeleke',      handle: '@bodeadeleke',      avatarInitials: 'BA', articles: 36, revenue: 44200, status: 'Active',    verification: 'Verified',   joinedDate: 'Sep 2024',  email: 'bode@canafri.io',     location: 'Abeokuta, Nigeria',  followers: 22400, totalViews: 489000 },
  { id: 14, name: 'Mariama Jalloh',    handle: '@mariamajalloh',    avatarInitials: 'MJ', articles: 6,  revenue: 2190,  status: 'Inactive',  verification: 'Unverified', joinedDate: 'Apr 2025',  email: 'mariama@canafri.io',  location: 'Conakry, Guinea',    followers: 920,   totalViews: 12000  },
  { id: 15, name: 'Chidi Okonkwo',     handle: '@chidiokonkwo',     avatarInitials: 'CO', articles: 22, revenue: 19800, status: 'Active',    verification: 'Verified',   joinedDate: 'Dec 2024',  email: 'chidi@canafri.io',    location: 'Benin City, NG',     followers: 10800, totalViews: 173000 },
  { id: 16, name: 'Adaeze Obiora',     handle: '@adaezeobjora',     avatarInitials: 'AO', articles: 13, revenue: 9650,  status: 'Active',    verification: 'Pending',    joinedDate: 'Mar 2025',  email: 'adaeze@canafri.io',   location: 'Asaba, Nigeria',     followers: 5400,  totalViews: 76000  },
];

// ─── Stats ────────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Total Creators',    value: 1248,  trend: 8.5,  key: 'total'    },
  { label: 'Active Creators',   value: 987,   trend: 12.3, key: 'active'   },
  { label: 'Verified Creators', value: 742,   trend: 15.7, key: 'verified' },
  { label: 'Total Revenue',     value: '284K',trend: 10.2, key: 'revenue'  },
];

const PAGE_SIZE = 9;

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusConfig(s: CreatorStatus) {
  if (s === 'Active')    return { color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
  if (s === 'Inactive')  return { color: 'text-[#A0A0A0]',  bg: 'bg-white/5' };
  return                        { color: 'text-amber-400',   bg: 'bg-amber-500/10' };
}

function verificationConfig(v: VerificationStatus) {
  if (v === 'Verified')   return { color: 'text-white',      icon: <CheckCircle2 size={14} strokeWidth={2} className="text-emerald-400 shrink-0" /> };
  if (v === 'Pending')    return { color: 'text-amber-400',  icon: <Clock        size={14} strokeWidth={2} className="text-amber-400 shrink-0"  /> };
  return                         { color: 'text-[#A0A0A0]', icon: <XCircle      size={14} strokeWidth={2} className="text-[#A0A0A0] shrink-0"  /> };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, trend }: { label: string; value: number | string; trend: number }) {
  return (
    <div className="flex flex-1 min-w-0 flex-col gap-3 rounded-[12px] border border-border bg-[#0b0b0b] p-5">
      <p className="font-sans text-[13px] font-medium text-[#A0A0A0]">{label}</p>
      <div className="flex flex-col gap-1">
        <p className="font-sans text-[24px] font-bold text-white/80">{value}</p>
        <div className="flex items-center gap-1">
          <TrendingUp size={12} strokeWidth={2.5} className="text-emerald-400 shrink-0" />
          <span className="font-sans text-[12px] font-semibold text-emerald-400">{trend}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Actions Dropdown ─────────────────────────────────────────────────────────

function ActionsMenu({ creator, onView }: { creator: Creator; onView: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        id={`creator-actions-${creator.id}`}
        onClick={() => setOpen(v => !v)}
        className="flex size-[30px] items-center justify-center rounded-[8px] border border-border bg-background transition-colors hover:bg-border/40"
      >
        <MoreHorizontal size={16} strokeWidth={1.75} className="text-foreground/70" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[170px] overflow-hidden rounded-[10px] border border-border bg-card shadow-xl">
          <button
            type="button"
            onClick={() => { setOpen(false); onView(); }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 font-sans text-[13px] text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground text-left"
          >
            <Eye size={14} strokeWidth={1.75} className="shrink-0" />
            View Profile
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 font-sans text-[13px] text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground text-left"
          >
            <UserCheck size={14} strokeWidth={1.75} className="shrink-0" />
            {creator.verification === 'Verified' ? 'Revoke Verification' : 'Verify Creator'}
          </button>
          <div className="mx-3 h-px bg-border" />
          <button
            type="button"
            onClick={() => { setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 font-sans text-[13px] text-amber-400 transition-colors hover:bg-amber-500/5 text-left"
          >
            <ShieldAlert size={14} strokeWidth={1.75} className="shrink-0" />
            {creator.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 font-sans text-[13px] text-red-400 transition-colors hover:bg-red-500/5 text-left"
          >
            <Ban size={14} strokeWidth={1.75} className="shrink-0" />
            Ban Creator
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Creator Detail Component (Figma Design 1242:17169) ───────────────────────

function CreatorDetailStub({ creator, onBack }: { creator: Creator; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Content' | 'Earnings' | 'Staking' | 'Reports' | 'Security' | 'Audit Logs'>('Overview');
  const [showToast, setShowToast] = useState<string | null>(null);
  
  // Local simulated states
  const [verification] = useState({
    email: 'Verified',
    identity: 'Verified',
    phone: 'Verified',
    badge: 'Verified'
  });
  
  const [staking] = useState({
    current: 1000,
    locked: 1000,
    unlockDate: 'May 26, 2025',
    status: 'Locked'
  });

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleAction = (actionName: string) => {
    triggerToast(`Action "${actionName}" executed successfully.`);
  };

  return (
    <div className="flex flex-col gap-6 px-6 py-6 font-sans">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg border border-border bg-[#0b0b0b] px-4 py-3 text-[13px] text-white shadow-xl animate-fade-in">
          <CheckCircle2 size={16} className="text-[#8C5CFF]" />
          <span>{showToast}</span>
        </div>
      )}

      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 self-start text-[13px] text-[#A0A0A0] transition-colors hover:text-foreground"
      >
        <ArrowLeft size={15} strokeWidth={2} />
        Back to Creators
      </button>

      {/* Header Profile */}
      <div className="flex items-center gap-6">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-[#8C5CFF]/20 text-[24px] font-bold text-[#8C5CFF] border border-border">
          {creator.avatarInitials}
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[24px] font-bold text-white leading-none">{creator.name}</h2>
          <p className="text-[14px] text-[#A0A0A0]">{creator.handle}</p>
          <div className="flex items-center gap-4 text-[13px] text-[#A0A0A0]">
            <span>Joined May 10, 2025 (2 months ago)</span>
            <span>•</span>
            <span>{creator.email}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-border">
        {(['Overview', 'Content', 'Earnings', 'Staking', 'Reports', 'Security', 'Audit Logs'] as const).map(tab => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative pb-3 text-[15px] font-medium transition-colors ${
                isActive ? 'text-[#8c5cff]' : 'text-[#A0A0A0] hover:text-white'
              }`}
            >
              {tab}
              {isActive && (
                <div className="absolute bottom-0 left-0 h-[2px] w-full bg-[#8c5cff]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'Overview' && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { label: 'Total Subscribers', value: '2,340', trend: 8.5 },
              { label: 'Total Articles',    value: creator.articles, trend: 12.3 },
              { label: 'Total Revenue',     value: `${creator.revenue.toLocaleString()} CC`, trend: 15.7 },
              { label: 'Total Views',        value: '45,678', trend: 10.2 }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-[12px] border border-border bg-[#0b0b0b] p-5">
                <p className="text-[13px] font-medium text-[#A0A0A0]">{stat.label}</p>
                <div className="flex flex-col gap-1">
                  <p className="text-[18px] font-semibold text-white/80">{stat.value}</p>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={12} strokeWidth={2.5} className="text-emerald-400 shrink-0" />
                    <span className="text-[12px] font-semibold text-emerald-400">{stat.trend}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Middle Section: Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Verification Status Card */}
            <div className="flex flex-col gap-4 rounded-[16px] border border-border bg-[#0b0b0b] p-6">
              <h3 className="text-[18px] font-bold text-white/80">Verification Status</h3>
              <div className="flex flex-col">
                {[
                  { label: 'Email Verification',     val: verification.email },
                  { label: 'Identity Verification',  val: verification.identity },
                  { label: 'Phone Verification',     val: verification.phone },
                  { label: 'Creator Badge',          val: verification.badge }
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border py-3 last:border-0">
                    <span className="text-[14px] text-[#A0A0A0]">{row.label}</span>
                    <span className="text-[14px] font-semibold text-emerald-400">{row.val}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 text-[12px] text-[#A0A0A0]">
                Verified on May 12, 2025
              </div>
            </div>

            {/* Staking Information Card */}
            <div className="flex flex-col gap-4 rounded-[16px] border border-border bg-[#0b0b0b] p-6">
              <h3 className="text-[18px] font-bold text-white/80">Staking Information</h3>
              <div className="flex flex-col">
                {[
                  { label: 'Current Stake',  val: `${staking.current.toLocaleString()} CC` },
                  { label: 'Locked Amount',  val: `${staking.locked.toLocaleString()} CC` },
                  { label: 'Unlock Date',    val: staking.unlockDate },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border py-3 last:border-0">
                    <span className="text-[14px] text-[#A0A0A0]">{row.label}</span>
                    <span className="text-[14px] font-semibold text-white/80">{row.val}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-3">
                  <span className="text-[14px] text-[#A0A0A0]">Staking Status</span>
                  <span className="rounded bg-[#8c5cff] px-2.5 py-1 text-[12px] font-semibold text-white">
                    {staking.status}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('Staking')}
                className="mt-auto self-start text-[14px] font-semibold text-[#8c5cff] hover:underline text-left"
              >
                View Staking History →
              </button>
            </div>

            {/* Quick Actions Card */}
            <div className="flex flex-col gap-4 rounded-[16px] border border-border bg-[#0b0b0b] p-6">
              <h3 className="text-[18px] font-bold text-white/80">Quick Actions</h3>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => handleAction('Send Message')}
                  className="flex w-full items-center gap-3 rounded-[8px] border border-border bg-background p-3 hover:bg-border/30 transition-colors text-left"
                >
                  <MessageSquare size={16} className="text-foreground opacity-80" />
                  <span className="text-[14px] font-medium text-white/80">Send Message</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('Issue Warning')}
                  className="flex w-full items-center gap-3 rounded-[8px] border border-border bg-background p-3 hover:bg-border/30 transition-colors text-left"
                >
                  <AlertTriangle size={16} className="text-emerald-400" />
                  <span className="text-[14px] font-medium text-emerald-400">Issue Warning</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('Suspend Creator')}
                  className="flex w-full items-center gap-3 rounded-[8px] border border-border bg-background p-3 hover:bg-border/30 transition-colors text-left"
                >
                  <UserMinus size={16} className="text-red-400" />
                  <span className="text-[14px] font-medium text-red-400">Suspend Creator</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('Force Logout')}
                  className="flex w-full items-center gap-3 rounded-[8px] border border-border bg-background p-3 hover:bg-border/30 transition-colors text-left"
                >
                  <LogOut size={16} className="text-[#8c5cff]" />
                  <span className="text-[14px] font-medium text-[#8c5cff]">Force Logout</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('View Profile')}
                  className="flex w-full items-center gap-3 rounded-[8px] border border-border bg-background p-3 hover:bg-border/30 transition-colors text-left"
                >
                  <Eye size={16} className="text-[#8c5cff]" />
                  <span className="text-[14px] font-medium text-[#8c5cff]">View Profile</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="flex flex-col gap-4 rounded-[16px] border border-border bg-[#0b0b0b] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-white/80">Recent Activity</h3>
              <button
                type="button"
                onClick={() => setActiveTab('Audit Logs')}
                className="text-[14px] font-semibold text-[#8c5cff] hover:underline"
              >
                View All Activity →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="flex flex-col gap-2 rounded-[8px] border border-border bg-background p-4">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-[#8c5cff]" />
                    <span className="text-[12px] text-[#A0A0A0]">May 15, 2025 - 10:30 AM</span>
                  </div>
                  <p className="text-[14px] text-white/80 leading-normal">
                    James published a new article: &apos;The Future of Web3 Governance Models and Token Economics&apos;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'Content' && (
        <div className="rounded-[16px] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-4">
          <h3 className="text-[18px] font-bold text-white/80">Published Content</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border text-[#A0A0A0]">
                  <th className="py-3 px-4 font-semibold">Title</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Views</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { title: 'The Future of Web3 Governance Models', cat: 'Governance', views: '14,205', status: 'Published', date: 'May 15, 2025' },
                  { title: 'Understanding CC Staking Economics',   cat: 'Tokenomics', views: '8,410',  status: 'Published', date: 'May 02, 2025' },
                  { title: 'A Guide to Canafri Admin Controls',     cat: 'Tutorials',  views: '22,890', status: 'Published', date: 'Apr 24, 2025' },
                  { title: 'Decentralized Marketplaces in 2026',    cat: 'Analysis',   views: '540',    status: 'Draft',     date: 'Draft' }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-foreground/[0.01] last:border-0">
                    <td className="py-3.5 px-4 font-medium text-white">{row.title}</td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.cat}</td>
                    <td className="py-3.5 px-4 text-white">{row.views}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium ${row.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-[#A0A0A0]'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Earnings' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-[16px] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-2">
            <span className="text-[13px] text-[#A0A0A0]">Total Earned Balance</span>
            <span className="text-[28px] font-bold text-white">45,900 CC</span>
            <span className="text-[12px] text-emerald-400 mt-2">12% growth this month</span>
          </div>
          <div className="rounded-[16px] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-2">
            <span className="text-[13px] text-[#A0A0A0]">Pending Payouts</span>
            <span className="text-[28px] font-bold text-white">2,430 CC</span>
            <span className="text-[12px] text-[#A0A0A0] mt-2">Next distribution: Jul 30</span>
          </div>
          <div className="rounded-[16px] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-2">
            <span className="text-[13px] text-[#A0A0A0]">Net Admin Adjustments</span>
            <span className="text-[28px] font-bold text-white">0 CC</span>
            <button type="button" className="text-[13px] text-[#8c5cff] font-semibold hover:underline self-start mt-2">
              Apply Adjustment
            </button>
          </div>
        </div>
      )}

      {activeTab === 'Staking' && (
        <div className="rounded-[16px] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-4">
          <h3 className="text-[18px] font-bold text-white/80">Staking & Slashing Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border text-[#A0A0A0]">
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Canton Network Hash</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { action: 'Initial Stake Locked', amt: '1,000 CC', hash: '0x3bf92a...19ef', status: 'Completed', time: 'May 10, 2025 - 08:14 AM' },
                  { action: 'Validator Registration', amt: '0 CC',     hash: '0x99aef3...bb1c', status: 'Completed', time: 'May 10, 2025 - 08:20 AM' },
                  { action: 'Staking Reward Earned', amt: '25 CC',    hash: '0xea3c88...66df', status: 'Completed', time: 'Jun 10, 2025 - 12:00 AM' }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-foreground/[0.01] last:border-0">
                    <td className="py-3.5 px-4 font-medium text-white">{row.action}</td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.amt}</td>
                    <td className="py-3.5 px-4 font-mono text-[12px] text-[#A0A0A0]">{row.hash}</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-semibold">{row.status}</td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Reports' && (
        <div className="rounded-[16px] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-4">
          <h3 className="text-[18px] font-bold text-white/80">User Complaints & Flagged Content</h3>
          <div className="flex items-center justify-center py-8 border border-dashed border-border rounded-xl">
            <p className="text-[13px] text-[#A0A0A0]">No reports or flags filed against this creator.</p>
          </div>
        </div>
      )}

      {activeTab === 'Security' && (
        <div className="rounded-[16px] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-4">
          <h3 className="text-[18px] font-bold text-white/80">Recent Login Session Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border text-[#A0A0A0]">
                  <th className="py-3 px-4 font-semibold">IP Address</th>
                  <th className="py-3 px-4 font-semibold">Device / Browser</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { ip: '102.89.34.120', dev: 'Chrome (macOS)', loc: 'Lagos, NG', act: 'Login Successful', time: 'Jul 16, 2026 - 11:24 AM' },
                  { ip: '102.89.34.120', dev: 'Safari (iPhone)', loc: 'Lagos, NG', act: 'Login Successful', time: 'Jul 15, 2026 - 09:12 PM' },
                  { ip: '198.51.100.42', dev: 'Firefox (Windows)', loc: 'Dublin, IE', act: 'Login Blocked (VPN)', time: 'Jun 28, 2026 - 04:05 PM' }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-foreground/[0.01] last:border-0">
                    <td className="py-3.5 px-4 font-mono text-white">{row.ip}</td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.dev}</td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.loc}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium ${row.act.includes('Blocked') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {row.act}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Audit Logs' && (
        <div className="rounded-[16px] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-4">
          <h3 className="text-[18px] font-bold text-white/80">Admin Operations History</h3>
          <div className="flex flex-col">
            {[
              { op: 'Authorized Creator Verification Badge', admin: 'David M. (@david)', time: 'May 12, 2025 - 04:30 PM' },
              { op: 'Approved Staking Ledger Node Setup',  admin: 'System Account',      time: 'May 10, 2025 - 08:20 AM' },
              { op: 'Created Creator profile account',      admin: 'Onboarding Router',   time: 'May 10, 2025 - 08:14 AM' }
            ].map((row, i) => (
              <div key={i} className="flex flex-col gap-1.5 border-b border-border py-4.5 last:border-0 last:pb-0">
                <span className="text-[14px] font-medium text-white">{row.op}</span>
                <div className="flex items-center gap-3 text-[12px] text-[#A0A0A0]">
                  <span>Operator: {row.admin}</span>
                  <span>•</span>
                  <span>{row.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminContentCreatorsPage() {
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState<CreatorStatus | 'All'>('All');
  const [verFilter, setVerFilter] = useState<VerificationStatus | 'All'>('All');
  const [sortBy, setSortBy]       = useState<'revenue-desc' | 'revenue-asc' | 'articles-desc' | 'name-asc'>('revenue-desc');
  const [page, setPage]           = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);

  const statusRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    let list = MOCK_CREATORS;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }
    if (statusFilter !== 'All') list = list.filter(c => c.status === statusFilter);
    if (verFilter !== 'All')    list = list.filter(c => c.verification === verFilter);

    list = [...list].sort((a, b) => {
      if (sortBy === 'revenue-desc')  return b.revenue  - a.revenue;
      if (sortBy === 'revenue-asc')   return a.revenue  - b.revenue;
      if (sortBy === 'articles-desc') return b.articles - a.articles;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [search, statusFilter, verFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handlePageChange(p: number) {
    if (p >= 1 && p <= totalPages) setPage(p);
  }

  // Reset to page 1 when filter changes
  useMemo(() => setPage(1), [search, statusFilter, verFilter, sortBy]);

  // ── Pagination helpers ──────────────────────────────────────────────────────
  function pageNumbers() {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3)            pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (selectedCreator) {
    return (
      <div className="flex h-full flex-col overflow-y-auto bg-background">
        <CreatorDetailStub creator={selectedCreator} onBack={() => setSelectedCreator(null)} />
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      {/* Page header */}
      <div className="shrink-0 px-6 pt-6 pb-4 flex flex-col gap-1">
        <h1 className="font-sans text-[36px] font-bold leading-[42px] tracking-[-0.18px] text-white">
          Creators Management
        </h1>
        <p className="font-sans text-[11px] text-[#A0A0A0]">
          View and manage all content creator accounts, activity, and verification status.
        </p>
      </div>

      {/* Stats row */}
      <div className="shrink-0 flex gap-5 px-6 pb-6">
        {STATS.map(s => (
          <StatCard key={s.key} label={s.label} value={s.value} trend={s.trend} />
        ))}
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-6 px-6 pb-8">
        {/* Section title */}
        <h2 className="font-sans text-[28px] font-bold text-white">Creators</h2>

        {/* Filters container */}
        <div className="flex items-center justify-between gap-4 rounded-[12px] border border-border bg-[#0b0b0b] p-4">
          {/* Left filters */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex w-[280px] items-center gap-2.5 rounded-[8px] border border-border bg-background px-3.5 py-2.5">
              <Search size={16} strokeWidth={1.75} className="shrink-0 text-[#8a8a8a]" />
              <input
                type="text"
                placeholder="Search creators..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent font-sans text-[14px] text-foreground placeholder:text-[#8a8a8a] outline-none"
              />
            </div>

            {/* Status dropdown */}
            <div className="relative" ref={statusRef}>
              <button
                type="button"
                id="creator-status-filter"
                onClick={() => setStatusOpen(v => !v)}
                className="flex items-center gap-2 rounded-[8px] border border-border bg-background px-3.5 py-2.5"
              >
                <span className="font-sans text-[14px] text-white whitespace-nowrap">
                  {statusFilter === 'All' ? 'All Status' : statusFilter}
                </span>
                <ChevronDown size={14} strokeWidth={2} className={`text-[#8a8a8a] transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
              </button>
              {statusOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-[160px] overflow-hidden rounded-[10px] border border-border bg-card shadow-xl">
                  {(['All', 'Active', 'Inactive', 'Suspended'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => { setStatus(opt); setStatusOpen(false); }}
                      className={`flex w-full items-center justify-between px-3.5 py-2.5 font-sans text-[13px] transition-colors hover:bg-foreground/5 text-left ${statusFilter === opt ? 'text-[#8C5CFF]' : 'text-foreground/80'}`}
                    >
                      {opt === 'All' ? 'All Status' : opt}
                      {statusFilter === opt && <span className="size-1.5 rounded-full bg-[#8C5CFF]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: filter advanced */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              id="creator-advanced-filter"
              onClick={() => setFilterOpen(v => !v)}
              className="flex items-center gap-2 rounded-[8px] border border-border bg-background px-4 py-2.5"
            >
              <Filter size={16} strokeWidth={1.75} className="text-white" />
              <span className="font-sans text-[14px] font-medium text-white">Filters</span>
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-[210px] overflow-hidden rounded-[10px] border border-border bg-card shadow-xl p-3 flex flex-col gap-3">
                {/* Verification filter */}
                <div>
                  <p className="mb-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-[#A0A0A0]">Verification</p>
                  <div className="flex flex-col gap-0.5">
                    {(['All', 'Verified', 'Pending', 'Unverified'] as const).map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setVerFilter(opt)}
                        className={`flex items-center justify-between rounded-[6px] px-2.5 py-1.5 font-sans text-[12px] transition-colors hover:bg-foreground/5 text-left ${verFilter === opt ? 'text-[#8C5CFF]' : 'text-foreground/80'}`}
                      >
                        {opt === 'All' ? 'All' : opt}
                        {verFilter === opt && <span className="size-1.5 rounded-full bg-[#8C5CFF]" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-px bg-border" />
                {/* Sort */}
                <div>
                  <p className="mb-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-[#A0A0A0]">Sort by</p>
                  <div className="flex flex-col gap-0.5">
                    {[
                      { value: 'revenue-desc',  label: 'Revenue (high to low)' },
                      { value: 'revenue-asc',   label: 'Revenue (low to high)' },
                      { value: 'articles-desc', label: 'Most articles' },
                      { value: 'name-asc',      label: 'Name (A–Z)' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSortBy(opt.value as typeof sortBy)}
                        className={`flex items-center justify-between rounded-[6px] px-2.5 py-1.5 font-sans text-[12px] transition-colors hover:bg-foreground/5 text-left ${sortBy === opt.value ? 'text-[#8C5CFF]' : 'text-foreground/80'}`}
                      >
                        {opt.label}
                        {sortBy === opt.value && <span className="size-1.5 rounded-full bg-[#8C5CFF]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-[12px] border border-border bg-[#0b0b0b]">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1.5fr_80px] gap-0 border-b border-border bg-[#101010] px-6 py-4">
            {['CREATOR', 'ARTICLES', 'REVENUE (CC)', 'STATUS', 'VERIFICATION', 'ACTIONS'].map((col, i) => (
              <p
                key={col}
                className={`font-sans text-[12px] font-semibold text-[#8a8a8a] ${i === 5 ? 'text-center' : ''}`}
              >
                {col}
              </p>
            ))}
          </div>

          {/* Rows */}
          {pageData.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="font-sans text-[14px] text-[#A0A0A0]">No creators match your search.</p>
            </div>
          ) : (
            pageData.map(creator => {
              const { color: sColor, bg: sBg }  = statusConfig(creator.status);
              const { icon: vIcon, color: vColor } = verificationConfig(creator.verification);
              return (
                <div
                  key={creator.id}
                  className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1.5fr_80px] items-center gap-0 border-b border-border/40 px-6 py-4 last:border-b-0 hover:bg-foreground/[0.02] transition-colors cursor-pointer"
                  onClick={() => setSelectedCreator(creator)}
                >
                  {/* Identity */}
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#8C5CFF]/15 font-sans text-[14px] font-bold text-[#8C5CFF]">
                      {creator.avatarInitials}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-sans text-[14px] font-semibold text-white">{creator.name}</p>
                      <p className="font-sans text-[12px] text-[#8a8a8a]">{creator.handle}</p>
                    </div>
                  </div>

                  {/* Articles */}
                  <p className="font-sans text-[14px] font-medium text-white">{creator.articles}</p>

                  {/* Revenue */}
                  <p className="font-sans text-[14px] font-semibold text-white">
                    {creator.revenue.toLocaleString()} CC
                  </p>

                  {/* Status */}
                  <div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-sans text-[12px] font-semibold ${sBg} ${sColor}`}>
                      {creator.status}
                    </span>
                  </div>

                  {/* Verification */}
                  <div className={`flex items-center gap-1.5 font-sans text-[13px] font-medium ${vColor}`}>
                    {vIcon}
                    {creator.verification}
                  </div>

                  {/* Actions — stop propagation so row click doesn't fire */}
                  <div className="flex items-center justify-center" onClick={e => e.stopPropagation()}>
                    <ActionsMenu creator={creator} onView={() => setSelectedCreator(creator)} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between py-3">
          <p className="font-sans text-[14px] text-[#8a8a8a]">
            Showing{' '}
            <span className="font-semibold text-white">{Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}</span>
            {' '}to{' '}
            <span className="font-semibold text-white">{Math.min(page * PAGE_SIZE, filtered.length)}</span>
            {' '}of{' '}
            <span className="font-semibold text-white">{filtered.length}</span>
            {' '}results
          </p>

          <div className="flex items-center gap-1.5">
            {/* Prev */}
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="flex items-center justify-center rounded-[8px] border border-border bg-[#0b0b0b] px-3 py-2 transition-colors hover:bg-border/30 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} strokeWidth={2} className="text-white" />
            </button>

            {pageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="font-sans text-[14px] text-[#4b4b4b] px-1">...</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePageChange(p as number)}
                  className={`flex items-center justify-center rounded-[8px] px-3.5 py-2 font-sans text-[14px] transition-colors ${
                    page === p
                      ? 'bg-[#8C5CFF] font-semibold text-white'
                      : 'border border-border bg-[#0b0b0b] text-[#8a8a8a] hover:bg-border/30'
                  }`}
                >
                  {p}
                </button>
              )
            )}

            {/* Next */}
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="flex items-center justify-center rounded-[8px] border border-border bg-[#0b0b0b] px-3 py-2 transition-colors hover:bg-border/30 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} strokeWidth={2} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
