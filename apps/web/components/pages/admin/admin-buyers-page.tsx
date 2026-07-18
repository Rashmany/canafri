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
  ShoppingBag,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type BuyerStatus = 'Active' | 'Inactive' | 'Suspended';
type BuyerType = 'Standard' | 'Premium';

interface Buyer {
  id: number;
  name: string;
  handle: string;
  avatarInitials: string;
  orders: number;
  spent: number;         // in CC
  status: BuyerStatus;
  buyerType: BuyerType;
  joinedDate: string;
  email: string;
  location: string;
  disputesFiled: number;
  totalrefunded: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_BUYERS: Buyer[] = [
  { id: 1,  name: 'Marcus Brody',      handle: '@marcusbrody',      avatarInitials: 'MB', orders: 42, spent: 34500, status: 'Active',    buyerType: 'Premium',  joinedDate: 'Jan 2025',  email: 'marcus@example.com',  location: 'Lagos, Nigeria',     disputesFiled: 1, totalrefunded: 250 },
  { id: 2,  name: 'Sarah Jenkins',     handle: '@sarahj',           avatarInitials: 'SJ', orders: 18, spent: 12800, status: 'Active',    buyerType: 'Standard', joinedDate: 'Feb 2025',  email: 'sarah@example.com',   location: 'Accra, Ghana',       disputesFiled: 0, totalrefunded: 0   },
  { id: 3,  name: 'Damilola Ade',      handle: '@damiade',          avatarInitials: 'DA', orders: 5,  spent: 3100,  status: 'Inactive',  buyerType: 'Standard', joinedDate: 'Mar 2025',  email: 'damilola@example.com',location: 'Ibadan, Nigeria',    disputesFiled: 2, totalrefunded: 450 },
  { id: 4,  name: 'Elena Rostova',     handle: '@elena_r',          avatarInitials: 'ER', orders: 89, spent: 94200, status: 'Active',    buyerType: 'Premium',  joinedDate: 'Nov 2024',  email: 'elena@example.com',   location: 'Nairobi, Kenya',     disputesFiled: 0, totalrefunded: 0   },
  { id: 5,  name: 'Kofi Mensah',       handle: '@kofimensah',       avatarInitials: 'KM', orders: 2,  spent: 850,   status: 'Suspended', buyerType: 'Standard', joinedDate: 'Apr 2025',  email: 'kofi@example.com',    location: 'Kumasi, Ghana',      disputesFiled: 3, totalrefunded: 850 },
  { id: 6,  name: 'Zara Williams',     handle: '@zaraw',            avatarInitials: 'ZW', orders: 27, spent: 22100, status: 'Active',    buyerType: 'Premium',  joinedDate: 'Dec 2024',  email: 'zara@example.com',    location: 'Cape Town, SA',      disputesFiled: 1, totalrefunded: 120 },
  { id: 7,  name: 'Obinna Diala',      handle: '@obinna',           avatarInitials: 'OD', orders: 12, spent: 9800,  status: 'Active',    buyerType: 'Standard', joinedDate: 'Mar 2025',  email: 'obinna@example.com',  location: 'Enugu, Nigeria',     disputesFiled: 0, totalrefunded: 0   },
  { id: 8,  name: 'Mariam Cole',       handle: '@mariamc',          avatarInitials: 'MC', orders: 31, spent: 28400, status: 'Active',    buyerType: 'Premium',  joinedDate: 'Jan 2025',  email: 'mariam@example.com',  location: 'Lagos, Nigeria',     disputesFiled: 0, totalrefunded: 0   },
];

// ─── Stats ────────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Total Buyers',    value: 840,   trend: 6.2,  key: 'total'    },
  { label: 'Active Buyers',   value: 692,   trend: 10.4, key: 'active'   },
  { label: 'Premium Buyers',  value: 158,   trend: 14.1, key: 'premium'  },
  { label: 'Total Spent (CC)',value: '201K',trend: 11.8, key: 'spent'    },
];

const PAGE_SIZE = 8;

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusConfig(s: BuyerStatus) {
  if (s === 'Active')    return { color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
  if (s === 'Inactive')  return { color: 'text-[#A0A0A0]',  bg: 'bg-white/5' };
  return                        { color: 'text-amber-400',   bg: 'bg-amber-500/10' };
}

function typeConfig(t: BuyerType) {
  if (t === 'Premium')   return { color: 'text-[#8C5CFF]', bg: 'bg-[#8C5CFF]/10' };
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

function ActionsMenu({ buyer, onView }: { buyer: Buyer; onView: () => void }) {
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
        id={`buyer-actions-${buyer.id}`}
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
            Toggle Premium
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

function BuyerDetailView({ buyer, onBack }: { buyer: Buyer; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Orders' | 'Payments' | 'Disputes' | 'Security' | 'Audit Logs'>('Overview');
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
        Back to Buyers
      </button>

      {/* Header Profile */}
      <div className="flex items-center gap-6">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-[#8C5CFF]/20 text-[24px] font-bold text-[#8C5CFF] border border-border">
          {buyer.avatarInitials}
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[24px] font-bold text-white leading-none">{buyer.name}</h2>
          <p className="text-[14px] text-[#A0A0A0]">{buyer.handle}</p>
          <div className="flex items-center gap-4 text-[13px] text-[#A0A0A0]">
            <span>Joined May 10, 2025 (2 months ago)</span>
            <span>•</span>
            <span>{buyer.email}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-border">
        {(['Overview', 'Orders', 'Payments', 'Disputes', 'Security', 'Audit Logs'] as const).map(tab => {
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
              { label: 'Total Orders',      value: buyer.orders,     trend: 8.5 },
              { label: 'Total Spent (CC)',  value: `${buyer.spent.toLocaleString()} CC`, trend: 15.7 },
              { label: 'Disputes Opened',   value: buyer.disputesFiled, trend: 0 },
              { label: 'Total Refunded',    value: `${buyer.totalrefunded.toLocaleString()} CC`, trend: 1.2 }
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
              <h3 className="text-[18px] font-bold text-white/80">Buyer Details</h3>
              <div className="flex flex-col">
                {[
                  { label: 'Location',          val: buyer.location },
                  { label: 'Account Tier',      val: buyer.buyerType },
                  { label: 'Preferred Method',  val: 'Wallet Staking CC' },
                  { label: 'Kyc Level',         val: 'Level 2 Verified' }
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
              <h3 className="text-[18px] font-bold text-white/80">Security & Limits</h3>
              <div className="flex flex-col">
                {[
                  { label: 'Daily Purchase Limit', val: '5,000 CC' },
                  { label: 'Weekly Limit',         val: '25,000 CC' },
                  { label: 'Wallet Address',       val: '0x3bf9...19ef' },
                  { label: 'Risk Score Status',    val: 'Low Risk (8/100)' }
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
                  onClick={() => triggerToast('Warning issued to buyer')}
                  className="flex w-full items-center gap-3 rounded-[8px] border border-border bg-background p-3 hover:bg-border/30 transition-colors text-left"
                >
                  <AlertTriangle size={16} className="text-emerald-400" />
                  <span className="text-[14px] font-medium text-emerald-400">Issue Warning</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerToast('Buyer account suspended')}
                  className="flex w-full items-center gap-3 rounded-[8px] border border-border bg-background p-3 hover:bg-border/30 transition-colors text-left"
                >
                  <UserMinus size={16} className="text-red-400" />
                  <span className="text-[14px] font-medium text-red-400">Suspend Buyer</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerToast('Buyer forced logout')}
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

      {activeTab === 'Orders' && (
        <div className="rounded-[16px] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-4">
          <h3 className="text-[18px] font-bold text-white/80">Purchase Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border text-[#A0A0A0]">
                  <th className="py-3 px-4 font-semibold">Order ID</th>
                  <th className="py-3 px-4 font-semibold">Seller</th>
                  <th className="py-3 px-4 font-semibold">Service/Content</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'ORD-99120', seller: '@jamesm', service: 'Technical Article', amt: '4,500 CC', status: 'Completed', date: 'Jul 10, 2026' },
                  { id: 'ORD-98425', seller: '@chinweo', service: 'Design Review',     amt: '1,200 CC', status: 'Disputed',  date: 'Jun 28, 2026' },
                  { id: 'ORD-97551', seller: '@amara',   service: 'Tokenomics Consultation', amt: '12,000 CC', status: 'Completed', date: 'Jun 14, 2026' }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-foreground/[0.01] last:border-0">
                    <td className="py-3.5 px-4 font-mono font-medium text-[#8c5cff]">{row.id}</td>
                    <td className="py-3.5 px-4 text-white">{row.seller}</td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.service}</td>
                    <td className="py-3.5 px-4 text-white font-semibold">{row.amt}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium ${row.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
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

      {activeTab === 'Payments' && (
        <div className="rounded-[16px] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-4">
          <h3 className="text-[18px] font-bold text-white/80">Payments History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border text-[#A0A0A0]">
                  <th className="py-3 px-4 font-semibold">Payment Hash</th>
                  <th className="py-3 px-4 font-semibold">Method</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Canton Block</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { hash: '0x8f22...19b4', method: 'Canton Wallet', amt: '4,500 CC', block: '4,289,120', date: 'Jul 10, 2026 - 11:24 AM' },
                  { hash: '0x62cc...f900', method: 'Canton Wallet', amt: '1,200 CC', block: '4,285,301', date: 'Jun 28, 2026 - 04:05 PM' },
                  { hash: '0x91da...66df', method: 'Canton Wallet', amt: '12,000 CC', block: '4,271,882', date: 'Jun 14, 2026 - 09:12 AM' }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-foreground/[0.01] last:border-0">
                    <td className="py-3.5 px-4 font-mono text-[#8c5cff]">{row.hash}</td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.method}</td>
                    <td className="py-3.5 px-4 text-white font-semibold">{row.amt}</td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.block}</td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Disputes' && (
        <div className="rounded-[16px] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-4">
          <h3 className="text-[18px] font-bold text-white/80">Dispute Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border text-[#A0A0A0]">
                  <th className="py-3 px-4 font-semibold">Dispute ID</th>
                  <th className="py-3 px-4 font-semibold">Order</th>
                  <th className="py-3 px-4 font-semibold">Reason</th>
                  <th className="py-3 px-4 font-semibold">Arbiter</th>
                  <th className="py-3 px-4 font-semibold">Decision</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'DSP-8842', order: 'ORD-98425', reason: 'Unsatisfactory Delivery', arbiter: 'David M.', dec: 'Pending Review', status: 'Open' }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-foreground/[0.01] last:border-0">
                    <td className="py-3.5 px-4 font-mono font-medium text-white">{row.id}</td>
                    <td className="py-3.5 px-4 font-mono text-[#8c5cff]">{row.order}</td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.reason}</td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.arbiter}</td>
                    <td className="py-3.5 px-4 text-white">{row.dec}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full text-[12px] font-medium">
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

      {activeTab === 'Security' && (
        <div className="rounded-[16px] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-4">
          <h3 className="text-[18px] font-bold text-white/80">Security Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border text-[#A0A0A0]">
                  <th className="py-3 px-4 font-semibold">IP Address</th>
                  <th className="py-3 px-4 font-semibold">Browser / OS</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Event</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { ip: '102.89.34.120', dev: 'Chrome (macOS)', loc: 'Lagos, NG', event: 'Successful Login', date: 'Jul 16, 2026' },
                  { ip: '197.210.64.44', dev: 'Safari (iOS)',    loc: 'Accra, GH', event: 'Failed Password Attempt', date: 'Jun 22, 2026' }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-foreground/[0.01] last:border-0">
                    <td className="py-3.5 px-4 font-mono text-white">{row.ip}</td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.dev}</td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{row.loc}</td>
                    <td className="py-3.5 px-4 text-white">{row.event}</td>
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
              { detail: 'Account tier upgraded to Premium', admin: 'David M. (@david)', date: 'May 15, 2025' },
              { detail: 'Completed identity verification check', admin: 'System Operator', date: 'May 12, 2025' }
            ].map((row, i) => (
              <div key={i} className="flex flex-col gap-1 border-b border-border pb-4 last:border-0">
                <span className="text-[14px] font-medium text-white">{row.detail}</span>
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

export default function AdminBuyersPage() {
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState<BuyerStatus | 'All'>('All');
  const [tierFilter, setTierFilter] = useState<BuyerType | 'All'>('All');
  const [sortBy, setSortBy]       = useState<'spent-desc' | 'spent-asc' | 'orders-desc' | 'name-asc'>('spent-desc');
  const [page, setPage]           = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);

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
    let list = MOCK_BUYERS;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(q) || b.handle.toLowerCase().includes(q) || b.email.toLowerCase().includes(q));
    }
    if (statusFilter !== 'All') list = list.filter(b => b.status === statusFilter);
    if (tierFilter !== 'All')   list = list.filter(b => b.buyerType === tierFilter);

    list = [...list].sort((a, b) => {
      if (sortBy === 'spent-desc')  return b.spent  - a.spent;
      if (sortBy === 'spent-asc')   return a.spent  - b.spent;
      if (sortBy === 'orders-desc') return b.orders - a.orders;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [search, statusFilter, tierFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handlePageChange(p: number) {
    if (p >= 1 && p <= totalPages) setPage(p);
  }

  useMemo(() => setPage(1), [search, statusFilter, tierFilter, sortBy]);

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

  if (selectedBuyer) {
    return (
      <div className="flex h-full flex-col overflow-y-auto bg-background">
        <BuyerDetailView buyer={selectedBuyer} onBack={() => setSelectedBuyer(null)} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      {/* Page header */}
      <div className="shrink-0 px-6 pt-6 pb-4 flex flex-col gap-1">
        <h1 className="font-sans text-[36px] font-bold leading-[42px] tracking-[-0.18px] text-white">
          Buyers Management
        </h1>
        <p className="font-sans text-[11px] text-[#A0A0A0]">
          Manage registered buyers, audit completed purchase history, and verify payment methods.
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
        <h2 className="font-sans text-[28px] font-bold text-white">Buyers</h2>

        {/* Filters */}
        <div className="flex items-center justify-between gap-4 rounded-[12px] border border-border bg-[#0b0b0b] p-4">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex w-[280px] items-center gap-2.5 rounded-[8px] border border-border bg-background px-3.5 py-2.5">
              <Search size={16} strokeWidth={1.75} className="shrink-0 text-[#8a8a8a]" />
              <input
                type="text"
                placeholder="Search buyers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent font-sans text-[14px] text-foreground placeholder:text-[#8a8a8a] outline-none"
              />
            </div>

            {/* Status dropdown */}
            <div className="relative" ref={statusRef}>
              <button
                type="button"
                id="buyer-status-filter"
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
              id="buyer-advanced-filter"
              onClick={() => setFilterOpen(v => !v)}
              className="flex items-center gap-2 rounded-[8px] border border-border bg-background px-4 py-2.5"
            >
              <Filter size={16} strokeWidth={1.75} className="text-white" />
              <span className="font-sans text-[14px] font-medium text-white">Filters</span>
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-[210px] overflow-hidden rounded-[10px] border border-border bg-card shadow-xl p-3 flex flex-col gap-3">
                <div>
                  <p className="mb-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-[#A0A0A0]">Tier</p>
                  <div className="flex flex-col gap-0.5">
                    {(['All', 'Premium', 'Standard'] as const).map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setTierFilter(opt)}
                        className={`flex items-center justify-between rounded-[6px] px-2.5 py-1.5 font-sans text-[12px] transition-colors hover:bg-foreground/5 text-left ${tierFilter === opt ? 'text-[#8C5CFF]' : 'text-foreground/80'}`}
                      >
                        {opt}
                        {tierFilter === opt && <span className="size-1.5 rounded-full bg-[#8C5CFF]" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-px bg-border" />
                <div>
                  <p className="mb-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-[#A0A0A0]">Sort by</p>
                  <div className="flex flex-col gap-0.5">
                    {[
                      { value: 'spent-desc',  label: 'Spent (high to low)' },
                      { value: 'spent-asc',   label: 'Spent (low to high)' },
                      { value: 'orders-desc', label: 'Orders count' },
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
            {['BUYER', 'ORDERS', 'TOTAL SPENT', 'STATUS', 'TIER', 'ACTIONS'].map((col, i) => (
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
              <p className="font-sans text-[14px] text-[#A0A0A0]">No buyers found.</p>
            </div>
          ) : (
            pageData.map(buyer => {
              const { color: sColor, bg: sBg } = statusConfig(buyer.status);
              const { color: tColor, bg: tBg } = typeConfig(buyer.buyerType);
              return (
                <div
                  key={buyer.id}
                  className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1.5fr_80px] items-center gap-0 border-b border-border/40 px-6 py-4 last:border-b-0 hover:bg-foreground/[0.02] transition-colors cursor-pointer"
                  onClick={() => setSelectedBuyer(buyer)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#8C5CFF]/15 font-sans text-[14px] font-bold text-[#8C5CFF]">
                      {buyer.avatarInitials}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-sans text-[14px] font-semibold text-white">{buyer.name}</p>
                      <p className="font-sans text-[12px] text-[#8a8a8a]">{buyer.handle}</p>
                    </div>
                  </div>

                  <p className="font-sans text-[14px] font-medium text-white">{buyer.orders}</p>

                  <p className="font-sans text-[14px] font-semibold text-white">
                    {buyer.spent.toLocaleString()} CC
                  </p>

                  <div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-sans text-[12px] font-semibold ${sBg} ${sColor}`}>
                      {buyer.status}
                    </span>
                  </div>

                  <div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-[12px] font-semibold ${tBg} ${tColor}`}>
                      {buyer.buyerType}
                    </span>
                  </div>

                  <div className="flex items-center justify-center" onClick={e => e.stopPropagation()}>
                    <ActionsMenu buyer={buyer} onView={() => setSelectedBuyer(buyer)} />
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
