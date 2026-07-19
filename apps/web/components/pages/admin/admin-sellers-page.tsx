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
  Wrench,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SellerStatus = 'Active' | 'Inactive' | 'Suspended';
type SellerType = 'Freelancer' | 'Agency';

interface Seller {
  id: number;
  name: string;
  handle: string;
  avatarInitials: string;
  gigs: number;
  earnings: number;      // in CC
  status: SellerStatus;
  sellerType: SellerType;
  joinedDate: string;
  email: string;
  location: string;
  rating: number;
  trustScore: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SELLERS: Seller[] = [
  { id: 1,  name: 'David Nwosu',       handle: '@davidn',           avatarInitials: 'DN', gigs: 14, earnings: 48900, status: 'Active',    sellerType: 'Freelancer', joinedDate: 'Jan 2025',  email: 'david@example.com',   location: 'Lagos, Nigeria',     rating: 4.9, trustScore: 98 },
  { id: 2,  name: 'Amina Yusuf',       handle: '@amina_y',          avatarInitials: 'AY', gigs: 8,  earnings: 23100, status: 'Active',    sellerType: 'Freelancer', joinedDate: 'Feb 2025',  email: 'amina@example.com',   location: 'Kano, Nigeria',      rating: 4.8, trustScore: 95 },
  { id: 3,  name: 'TechFlow Agency',   handle: '@techflow',         avatarInitials: 'TF', gigs: 35, earnings: 184500,status: 'Active',    sellerType: 'Agency',     joinedDate: 'Nov 2024',  email: 'hello@techflow.io',   location: 'Accra, Ghana',       rating: 4.7, trustScore: 92 },
  { id: 4,  name: 'Kofi Boateng',      handle: '@kofib',            avatarInitials: 'KB', gigs: 3,  earnings: 4200,  status: 'Inactive',  sellerType: 'Freelancer', joinedDate: 'Mar 2025',  email: 'kofi@example.com',    location: 'Kumasi, Ghana',      rating: 4.5, trustScore: 88 },
  { id: 5,  name: 'Chidi Okeke',       handle: '@chidi_o',          avatarInitials: 'CO', gigs: 6,  earnings: 12400, status: 'Suspended', sellerType: 'Freelancer', joinedDate: 'Jan 2025',  email: 'chidi@example.com',   location: 'Enugu, Nigeria',     rating: 4.2, trustScore: 71 },
  { id: 6,  name: 'Creative Studio',   handle: '@creatives',        avatarInitials: 'CS', gigs: 22, earnings: 92300, status: 'Active',    sellerType: 'Agency',     joinedDate: 'Dec 2024',  email: 'contact@creative.io', location: 'Cape Town, SA',      rating: 4.9, trustScore: 97 },
];

// ─── Stats ────────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Total Sellers',   value: 412,   trend: 5.4,  key: 'total'    },
  { label: 'Active Sellers',  value: 348,   trend: 9.2,  key: 'active'   },
  { label: 'Verified Sellers',value: 294,   trend: 11.5, key: 'verified' },
  { label: 'Total Sales (CC)',value: '366K',trend: 13.8, key: 'sales'    },
];

const PAGE_SIZE = 8;

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusConfig(s: SellerStatus) {
  if (s === 'Active')    return { color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
  if (s === 'Inactive')  return { color: 'text-[#A0A0A0]',  bg: 'bg-white/5' };
  return                        { color: 'text-amber-400',   bg: 'bg-amber-500/10' };
}

function typeConfig(t: SellerType) {
  if (t === 'Agency')     return { color: 'text-[#8C5CFF]', bg: 'bg-[#8C5CFF]/10' };
  return                         { color: 'text-white',     bg: 'bg-white/10' };
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

function ActionsMenu({ seller, onView }: { seller: Seller; onView: () => void }) {
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
        id={`seller-actions-${seller.id}`}
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
            Verify Badge
          </button>
          <div className="mx-3 h-px bg-border" />
          <button
            type="button"
            onClick={() => { setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 font-sans text-[13px] text-amber-400 transition-colors hover:bg-amber-500/5 text-left"
          >
            <ShieldAlert size={14} strokeWidth={1.75} className="shrink-0" />
            Suspend
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Detail View Component ────────────────────────────────────────────────────

function SellerDetailView({ seller, onBack }: { seller: Seller; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Gigs' | 'Sales' | 'Staking' | 'Security' | 'Audit Logs'>('Overview');
  const [showToast, setShowToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  return (
    <div className="flex flex-col gap-6 px-6 py-6 font-sans">
      {showToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg border border-border bg-[#0b0b0b] px-4 py-3 text-[13px] text-white shadow-xl">
          <CheckCircle2 size={16} className="text-[#8C5CFF]" />
          <span>{showToast}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 self-start text-[13px] text-[#A0A0A0] transition-colors hover:text-foreground"
      >
        <ArrowLeft size={15} strokeWidth={2} />
        Back to Sellers
      </button>

      {/* Header Profile */}
      <div className="flex items-center gap-6">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-[#8C5CFF]/20 text-[24px] font-bold text-[#8C5CFF] border border-border">
          {seller.avatarInitials}
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[24px] font-bold text-white leading-none">{seller.name}</h2>
          <p className="text-[14px] text-[#A0A0A0]">{seller.handle}</p>
          <div className="flex items-center gap-4 text-[13px] text-[#A0A0A0]">
            <span>Joined May 10, 2025 (2 months ago)</span>
            <span>•</span>
            <span>{seller.email}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-border">
        {(['Overview', 'Gigs', 'Sales', 'Staking', 'Security', 'Audit Logs'] as const).map(tab => {
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
              {isActive && <div className="absolute bottom-0 left-0 h-[2px] w-full bg-[#8c5cff]" />}
            </button>
          );
        })}
      </div>

      {activeTab === 'Overview' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { label: 'Gigs / Services',   value: seller.gigs,      trend: 8.5 },
              { label: 'Total Earned (CC)', value: `${seller.earnings.toLocaleString()} CC`, trend: 13.8 },
              { label: 'Seller Rating',     value: `${seller.rating} / 5.0`, trend: 1.2 },
              { label: 'Trust Rating',      value: `${seller.trustScore}%`, trend: 2.5 }
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Details */}
            <div className="flex flex-col gap-4 rounded-[16px] border border-border bg-[#0b0b0b] p-6">
              <h3 className="text-[18px] font-bold text-white/80">Seller Details</h3>
              <div className="flex flex-col">
                {[
                  { label: 'Location',          val: seller.location },
                  { label: 'Provider Type',     val: seller.sellerType },
                  { label: 'Verification Check',val: 'Pass' },
                  { label: 'Staked Reserve',    val: '1,000 CC' }
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border py-3 last:border-0">
                    <span className="text-[14px] text-[#A0A0A0]">{row.label}</span>
                    <span className="text-[14px] font-semibold text-white">{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Status */}
            <div className="flex flex-col gap-4 rounded-[16px] border border-border bg-[#0b0b0b] p-6">
              <h3 className="text-[18px] font-bold text-white/80">Security & Logs</h3>
              <div className="flex flex-col">
                {[
                  { label: 'KYC Level Check',   val: 'Verified Level 2' },
                  { label: 'Disputes Involved', val: '0 Open (1 Resolved)' },
                  { label: 'Wallet Node ID',    val: '0x62cc...f900' },
                  { label: 'Warning Counts',    val: '0 Warnings' }
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border py-3 last:border-0">
                    <span className="text-[14px] text-[#A0A0A0]">{row.label}</span>
                    <span className="text-[14px] font-semibold text-white">{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-4 rounded-[16px] border border-border bg-[#0b0b0b] p-6">
              <h3 className="text-[18px] font-bold text-white/80">Quick Actions</h3>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => triggerToast('Message Sent')}
                  className="flex w-full items-center gap-3 rounded-[8px] border border-border bg-background p-3 hover:bg-border/30 transition-colors text-left"
                >
                  <MessageSquare size={16} className="text-foreground opacity-80" />
                  <span className="text-[14px] font-medium text-white/80">Send Message</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerToast('Warning issued to seller')}
                  className="flex w-full items-center gap-3 rounded-[8px] border border-border bg-background p-3 hover:bg-border/30 transition-colors text-left"
                >
                  <AlertTriangle size={16} className="text-emerald-400" />
                  <span className="text-[14px] font-medium text-emerald-400">Issue Warning</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerToast('Seller account suspended')}
                  className="flex w-full items-center gap-3 rounded-[8px] border border-border bg-background p-3 hover:bg-border/30 transition-colors text-left"
                >
                  <UserMinus size={16} className="text-red-400" />
                  <span className="text-[14px] font-medium text-red-400">Suspend Seller</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerToast('Seller forced logout')}
                  className="flex w-full items-center gap-3 rounded-[8px] border border-border bg-background p-3 hover:bg-border/30 transition-colors text-left"
                >
                  <LogOut size={16} className="text-[#8c5cff]" />
                  <span className="text-[14px] font-medium text-[#8c5cff]">Force Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'Gigs' && (
        <div className="rounded-[16px] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-4">
          <h3 className="text-[18px] font-bold text-white/80">Active Gigs & Services</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border text-[#A0A0A0]">
                  <th className="py-3 px-4 font-semibold">Gig ID</th>
                  <th className="py-3 px-4 font-semibold">Title</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Price</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'GIG-502', title: 'Technical Smart Contract Audit', cat: 'Development', price: '4,500 CC', status: 'Active' },
                  { id: 'GIG-508', title: 'Web3 Landing Page Design',       cat: 'Design',      price: '1,200 CC', status: 'Active' },
                  { id: 'GIG-610', title: 'Tokenomics Advisory Session',     cat: 'Advisory',    price: '6,000 CC', status: 'Reviewing' }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-foreground/[0.01] last:border-0">
                    <td className="py-3.5 px-4 font-mono font-medium text-[#8c5cff]">{row.id}</td>
                    <td className="py-3.5 px-4 text-white font-medium">{row.title}</td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.cat}</td>
                    <td className="py-3.5 px-4 text-white font-semibold">{row.price}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium ${row.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Sales' && (
        <div className="rounded-[16px] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-4">
          <h3 className="text-[18px] font-bold text-white/80">Sales Order History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border text-[#A0A0A0]">
                  <th className="py-3 px-4 font-semibold">Order ID</th>
                  <th className="py-3 px-4 font-semibold">Client</th>
                  <th className="py-3 px-4 font-semibold">Total Price</th>
                  <th className="py-3 px-4 font-semibold">Canton Hash</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'ORD-99120', client: '@marcusbrody', amt: '4,500 CC', hash: '0x8f22...19b4', status: 'Completed' },
                  { id: 'ORD-98425', client: '@zaraw',       amt: '1,200 CC', hash: '0x62cc...f900', status: 'Completed' }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-foreground/[0.01] last:border-0">
                    <td className="py-3.5 px-4 font-mono font-medium text-[#8c5cff]">{row.id}</td>
                    <td className="py-3.5 px-4 text-white font-medium">{row.client}</td>
                    <td className="py-3.5 px-4 text-white font-semibold">{row.amt}</td>
                    <td className="py-3.5 px-4 font-mono text-[12px] text-[#A0A0A0]">{row.hash}</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-semibold">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Staking' && (
        <div className="rounded-[16px] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-4">
          <h3 className="text-[18px] font-bold text-white/80">Seller Escrow Stake Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border text-[#A0A0A0]">
                  <th className="py-3 px-4 font-semibold">Event</th>
                  <th className="py-3 px-4 font-semibold">Staked Amount</th>
                  <th className="py-3 px-4 font-semibold">Validator ID</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { event: 'Dispute Collateral Lock', amt: '1,000 CC', val: 'Node-Canton-A', status: 'Locked', time: 'May 15, 2025' }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-foreground/[0.01] last:border-0">
                    <td className="py-3.5 px-4 font-medium text-white">{row.event}</td>
                    <td className="py-3.5 px-4 text-white font-semibold">{row.amt}</td>
                    <td className="py-3.5 px-4 font-mono text-[#A0A0A0]">{row.val}</td>
                    <td className="py-3.5 px-4 text-[#8c5cff] font-semibold">{row.status}</td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Security' && (
        <div className="rounded-[16px] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-4">
          <h3 className="text-[18px] font-bold text-white/80">Security Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border text-[#A0A0A0]">
                  <th className="py-3 px-4 font-semibold">IP Address</th>
                  <th className="py-3 px-4 font-semibold">Browser / Device</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { ip: '102.89.34.120', dev: 'Chrome (macOS)', loc: 'Lagos, NG', action: 'Successful Login', date: 'Jul 16, 2026' }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-foreground/[0.01] last:border-0">
                    <td className="py-3.5 px-4 font-mono text-white">{row.ip}</td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.dev}</td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.loc}</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-semibold">{row.action}</td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Audit Logs' && (
        <div className="rounded-[16px] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-4">
          <h3 className="text-[18px] font-bold text-white/80">Audit History</h3>
          <div className="flex flex-col gap-4">
            {[
              { op: 'Authorized Smart Contract validator profile', admin: 'David M. (@david)', date: 'May 12, 2025' }
            ].map((row, i) => (
              <div key={i} className="flex flex-col gap-1 border-b border-border pb-4 last:border-0">
                <span className="text-[14px] font-medium text-white">{row.op}</span>
                <span className="text-[12px] text-[#A0A0A0]">{row.admin} · {row.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminSellersPage() {
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState<SellerStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<SellerType | 'All'>('All');
  const [sortBy, setSortBy]       = useState<'earnings-desc' | 'earnings-asc' | 'gigs-desc' | 'name-asc'>('earnings-desc');
  const [page, setPage]           = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

  const statusRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    let list = MOCK_SELLERS;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.handle.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    }
    if (statusFilter !== 'All') list = list.filter(s => s.status === statusFilter);
    if (typeFilter !== 'All')   list = list.filter(s => s.sellerType === typeFilter);

    list = [...list].sort((a, b) => {
      if (sortBy === 'earnings-desc') return b.earnings - a.earnings;
      if (sortBy === 'earnings-asc')  return a.earnings - b.earnings;
      if (sortBy === 'gigs-desc')     return b.gigs - a.gigs;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [search, statusFilter, typeFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handlePageChange(p: number) {
    if (p >= 1 && p <= totalPages) setPage(p);
  }

  useMemo(() => setPage(1), [search, statusFilter, typeFilter, sortBy]);

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

  if (selectedSeller) {
    return (
      <div className="flex h-full flex-col overflow-y-auto bg-background">
        <SellerDetailView seller={selectedSeller} onBack={() => setSelectedSeller(null)} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      {/* Page header */}
      <div className="shrink-0 px-6 pt-6 pb-4 flex flex-col gap-1">
        <h1 className="font-sans text-[36px] font-bold leading-[42px] tracking-[-0.18px] text-white">
          Sellers Management
        </h1>
        <p className="font-sans text-[11px] text-[#A0A0A0]">
          Manage registered freelancers and digital agency sellers, audit listed smart contract services, and verify credentials.
        </p>
      </div>

      {/* Stats */}
      <div className="shrink-0 flex gap-5 px-6 pb-6">
        {STATS.map(s => (
          <StatCard key={s.key} label={s.label} value={s.value} trend={s.trend} />
        ))}
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-6 px-6 pb-8">
        <h2 className="font-sans text-[28px] font-bold text-white">Sellers</h2>

        {/* Filters */}
        <div className="flex items-center justify-between gap-4 rounded-[12px] border border-border bg-[#0b0b0b] p-4">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex w-[280px] items-center gap-2.5 rounded-[8px] border border-border bg-background px-3.5 py-2.5">
              <Search size={16} strokeWidth={1.75} className="shrink-0 text-[#8a8a8a]" />
              <input
                type="text"
                placeholder="Search sellers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent font-sans text-[14px] text-foreground placeholder:text-[#8a8a8a] outline-none"
              />
            </div>

            {/* Status dropdown */}
            <div className="relative" ref={statusRef}>
              <button
                type="button"
                id="seller-status-filter"
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

          {/* Advanced Filters */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              id="seller-advanced-filter"
              onClick={() => setFilterOpen(v => !v)}
              className="flex items-center gap-2 rounded-[8px] border border-border bg-background px-4 py-2.5"
            >
              <Filter size={16} strokeWidth={1.75} className="text-white" />
              <span className="font-sans text-[14px] font-medium text-white">Filters</span>
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-[210px] overflow-hidden rounded-[10px] border border-border bg-card shadow-xl p-3 flex flex-col gap-3">
                <div>
                  <p className="mb-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-[#A0A0A0]">Type</p>
                  <div className="flex flex-col gap-0.5">
                    {(['All', 'Freelancer', 'Agency'] as const).map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setTypeFilter(opt)}
                        className={`flex items-center justify-between rounded-[6px] px-2.5 py-1.5 font-sans text-[12px] transition-colors hover:bg-foreground/5 text-left ${typeFilter === opt ? 'text-[#8C5CFF]' : 'text-foreground/80'}`}
                      >
                        {opt}
                        {typeFilter === opt && <span className="size-1.5 rounded-full bg-[#8C5CFF]" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-px bg-border" />
                <div>
                  <p className="mb-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-[#A0A0A0]">Sort by</p>
                  <div className="flex flex-col gap-0.5">
                    {[
                      { value: 'earnings-desc', label: 'Earnings (high to low)' },
                      { value: 'earnings-asc',  label: 'Earnings (low to high)' },
                      { value: 'gigs-desc',     label: 'Gigs count' },
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
          <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1.5fr_80px] gap-0 border-b border-border bg-[#101010] px-6 py-4">
            {['SELLER', 'SERVICES', 'TOTAL EARNED', 'STATUS', 'TYPE', 'ACTIONS'].map((col, i) => (
              <p
                key={col}
                className={`font-sans text-[12px] font-semibold text-[#8a8a8a] ${i === 5 ? 'text-center' : ''}`}
              >
                {col}
              </p>
            ))}
          </div>

          {pageData.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="font-sans text-[14px] text-[#A0A0A0]">No sellers found.</p>
            </div>
          ) : (
            pageData.map(seller => {
              const { color: sColor, bg: sBg } = statusConfig(seller.status);
              const { color: tColor, bg: tBg } = typeConfig(seller.sellerType);
              return (
                <div
                  key={seller.id}
                  className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1.5fr_80px] items-center gap-0 border-b border-border/40 px-6 py-4 last:border-b-0 hover:bg-foreground/[0.02] transition-colors cursor-pointer"
                  onClick={() => setSelectedSeller(seller)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#8C5CFF]/15 font-sans text-[14px] font-bold text-[#8C5CFF]">
                      {seller.avatarInitials}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-sans text-[14px] font-semibold text-white">{seller.name}</p>
                      <p className="font-sans text-[12px] text-[#8a8a8a]">{seller.handle}</p>
                    </div>
                  </div>

                  <p className="font-sans text-[14px] font-medium text-white">{seller.gigs}</p>

                  <p className="font-sans text-[14px] font-semibold text-white">
                    {seller.earnings.toLocaleString()} CC
                  </p>

                  <div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-sans text-[12px] font-semibold ${sBg} ${sColor}`}>
                      {seller.status}
                    </span>
                  </div>

                  <div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-[12px] font-semibold ${tBg} ${tColor}`}>
                      {seller.sellerType}
                    </span>
                  </div>

                  <div className="flex items-center justify-center" onClick={e => e.stopPropagation()}>
                    <ActionsMenu seller={seller} onView={() => setSelectedSeller(seller)} />
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
