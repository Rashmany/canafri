'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, Eye, ShieldAlert, Check, X, ShieldCheck, Mail, ShieldAlert as AlertIcon, MapPin, Calendar, Wallet } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = 'Creator' | 'Seller' | 'Member';
type UserStatus = 'Active' | 'Suspended' | 'Banned';

interface UserItem {
  id: number;
  name: string;
  handle: string;
  email: string;
  avatarUrl?: string;
  initials: string;
  roles: UserRole[];
  trustScore: number;
  riskScore: number; // 0-100
  status: UserStatus;
  
  // Detail details
  bio: string;
  location: string;
  joinedDate: string;
  walletAddress: string;
  stakedAmount: string; // e.g. "250 CC"
  suspensionReason?: string;
  warned?: boolean;  // true after admin issues a warning
}

type FilterTab = 'All' | 'Members' | 'Creators' | 'Sellers' | 'Suspended' | 'Banned' | 'Warned' | 'High Risk';
type SortOption = 'newest' | 'trust-high' | 'risk-high' | 'name-asc';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_USERS: UserItem[] = [
  {
    id: 1,
    name: 'John Trek',
    handle: '@johntrek',
    email: 'johntrek@gmail.com',
    initials: 'JT',
    roles: ['Creator', 'Seller'],
    trustScore: 94,
    riskScore: 12,
    status: 'Active',
    bio: 'Product designer with 4 years of experience working with Web3 startups across Africa. I specialise in dashboard interfaces and have shipped products for two DeFi platforms.',
    location: 'Lagos, Nigeria',
    joinedDate: 'Joined Oct 2025',
    walletAddress: '0x71C...845f',
    stakedAmount: '250 CC'
  },
  {
    id: 2,
    name: 'John Trek',
    handle: '@johntrek',
    email: 'johntrek@gmail.com',
    initials: 'JT',
    roles: ['Creator', 'Seller'],
    trustScore: 94,
    riskScore: 12,
    status: 'Active',
    bio: 'Product designer with 4 years of experience working with Web3 startups across Africa. I specialise in dashboard interfaces and have shipped products for two DeFi platforms.',
    location: 'Lagos, Nigeria',
    joinedDate: 'Joined Oct 2025',
    walletAddress: '0x71C...845f',
    stakedAmount: '250 CC'
  },
  {
    id: 3,
    name: 'John Trek',
    handle: '@johntrek',
    email: 'johntrek@gmail.com',
    initials: 'JT',
    roles: ['Creator', 'Seller'],
    trustScore: 94,
    riskScore: 12,
    status: 'Active',
    bio: 'Product designer with 4 years of experience working with Web3 startups across Africa. I specialise in dashboard interfaces and have shipped products for two DeFi platforms.',
    location: 'Lagos, Nigeria',
    joinedDate: 'Joined Oct 2025',
    walletAddress: '0x71C...845f',
    stakedAmount: '250 CC'
  },
  {
    id: 4,
    name: 'John Trek',
    handle: '@johntrek',
    email: 'johntrek@gmail.com',
    initials: 'JT',
    roles: ['Creator', 'Seller'],
    trustScore: 94,
    riskScore: 82,
    status: 'Active',
    bio: 'Product designer with 4 years of experience working with Web3 startups across Africa. I specialise in dashboard interfaces and have shipped products for two DeFi platforms.',
    location: 'Lagos, Nigeria',
    joinedDate: 'Joined Oct 2025',
    walletAddress: '0x71C...845f',
    stakedAmount: '250 CC'
  },
  {
    id: 5,
    name: 'John Trek',
    handle: '@johntrek',
    email: 'johntrek@gmail.com',
    initials: 'JT',
    roles: ['Creator', 'Seller'],
    trustScore: 94,
    riskScore: 12,
    status: 'Suspended',
    bio: 'Product designer with 4 years of experience working with Web3 startups across Africa. I specialise in dashboard interfaces and have shipped products for two DeFi platforms.',
    location: 'Lagos, Nigeria',
    joinedDate: 'Joined Oct 2025',
    walletAddress: '0x71C...845f',
    stakedAmount: '0 CC',
    suspensionReason: 'Violated Terms of Service: Multiple complaints of non-delivery of milestones.'
  },
  {
    id: 6,
    name: 'John Trek',
    handle: '@johntrek',
    email: 'johntrek@gmail.com',
    initials: 'JT',
    roles: ['Member'],
    trustScore: 94,
    riskScore: 12,
    status: 'Active',
    bio: 'Product designer with 4 years of experience working with Web3 startups across Africa. I specialise in dashboard interfaces and have shipped products for two DeFi platforms.',
    location: 'Lagos, Nigeria',
    joinedDate: 'Joined Oct 2025',
    walletAddress: '0x71C...845f',
    stakedAmount: '0 CC'
  },
  {
    id: 7,
    name: 'John Trek',
    handle: '@johntrek',
    email: 'johntrek@gmail.com',
    initials: 'JT',
    roles: ['Creator', 'Seller'],
    trustScore: 94,
    riskScore: 12,
    status: 'Active',
    bio: 'Product designer with 4 years of experience working with Web3 startups across Africa. I specialise in dashboard interfaces and have shipped products for two DeFi platforms.',
    location: 'Lagos, Nigeria',
    joinedDate: 'Joined Oct 2025',
    walletAddress: '0x71C...845f',
    stakedAmount: '250 CC'
  }
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  sub: string;
  subColor?: string;
}

function StatCard({ label, value, sub, subColor = '#A0A0A0' }: StatCardProps) {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-border bg-card px-6 py-5 min-h-[100px] justify-center hover:border-[#8C5CFF]/20 transition-all duration-300">
      <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] leading-[16px]">{label}</p>
      <p className="font-sans text-[1.5rem] font-bold text-white leading-[28px] tracking-tight">{value}</p>
      <p className="font-sans text-[0.6875rem] font-normal leading-[15px]" style={{ color: subColor }}>{sub}</p>
    </div>
  );
}

// ─── User Profile View Modal ──────────────────────────────────────────────────

function UserPreviewModal({
  user,
  onClose,
  onRoleToggle,
  onScoreUpdate,
}: {
  user: UserItem;
  onClose: () => void;
  onRoleToggle: (id: number, role: UserRole) => void;
  onScoreUpdate: (id: number, field: 'trust' | 'risk', value: number) => void;
}) {
  const isCreator = user.roles.includes('Creator');
  const isSeller = user.roles.includes('Seller');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-lg flex-col rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-[#8C5CFF]/25 border border-[#8C5CFF]/30 flex items-center justify-center font-sans font-semibold text-[#8C5CFF] text-[0.875rem]">
              {user.initials}
            </div>
            <div>
              <h3 className="font-sans text-[0.9375rem] font-bold text-white leading-[20px]">{user.name}</h3>
              <p className="font-sans text-[0.75rem] text-[#A0A0A0] mt-0.5">{user.handle}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-[#A0A0A0] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Details list */}
        <div className="flex flex-col gap-4 mt-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-[0.8125rem] text-[#A0A0A0]">
              <Mail size={14} />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-[0.8125rem] text-[#A0A0A0]">
              <MapPin size={14} />
              <span>{user.location}</span>
            </div>
            <div className="flex items-center gap-2 text-[0.8125rem] text-[#A0A0A0]">
              <Calendar size={14} />
              <span>{user.joinedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-[0.8125rem] text-[#A0A0A0]">
              <Wallet size={14} />
              <span>{user.walletAddress}</span>
            </div>
          </div>

          <div className="h-px w-full bg-border/40" />

          {/* User Bio */}
          <div>
            <p className="font-sans text-[0.6875rem] text-[#A0A0A0] uppercase tracking-wider font-semibold">Bio</p>
            <p className="font-sans text-[0.8125rem] text-foreground/80 mt-1.5 leading-relaxed">{user.bio}</p>
          </div>

          <div className="h-px w-full bg-border/40" />

          {/* Dynamic Admin Settings controls */}
          <div className="grid grid-cols-2 gap-5">
            {/* Role Config */}
            <div className="flex flex-col gap-2">
              <p className="font-sans text-[0.6875rem] text-[#A0A0A0] uppercase tracking-wider font-semibold">Roles Config</p>
              <div className="flex gap-2.5 mt-1">
                <label className="flex items-center gap-2 cursor-pointer font-sans text-[0.8125rem] text-white">
                  <input
                    type="checkbox"
                    checked={isCreator}
                    onChange={() => onRoleToggle(user.id, 'Creator')}
                    className="rounded border-border text-[#8C5CFF] focus:ring-[#8C5CFF]"
                  />
                  Creator
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-sans text-[0.8125rem] text-white">
                  <input
                    type="checkbox"
                    checked={isSeller}
                    onChange={() => onRoleToggle(user.id, 'Seller')}
                    className="rounded border-border text-[#8C5CFF] focus:ring-[#8C5CFF]"
                  />
                  Seller
                </label>
              </div>
            </div>

            {/* Score Adjustments */}
            <div className="flex flex-col gap-2">
              <p className="font-sans text-[0.6875rem] text-[#A0A0A0] uppercase tracking-wider font-semibold font-sans">Scores</p>
              <div className="flex gap-4 items-center mt-1">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[0.625rem] text-[#A0A0A0]">Trust</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={user.trustScore}
                    onChange={(e) => onScoreUpdate(user.id, 'trust', parseInt(e.target.value) || 0)}
                    className="w-14 rounded-lg border border-border bg-[#080808] px-2 py-1 font-sans text-[0.8125rem] text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[0.625rem] text-[#A0A0A0]">Risk</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={user.riskScore}
                    onChange={(e) => onScoreUpdate(user.id, 'risk', parseInt(e.target.value) || 0)}
                    className="w-14 rounded-lg border border-border bg-[#080808] px-2 py-1 font-sans text-[0.8125rem] text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#8C5CFF] hover:bg-[#AC8EF3] py-2.5 font-sans text-[0.8125rem] font-semibold text-white transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Warn User Dialog Modal ──────────────────────────────────────────────────

function WarnUserModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (warning: string) => void;
  onClose: () => void;
}) {
  const [warning, setWarning] = useState('');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-md flex-col rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="font-sans text-[1rem] font-bold text-white flex items-center gap-2">
            <ShieldAlert size={18} className="text-[#DAC95A]" />
            Issue Warning
          </h3>
          <button type="button" onClick={onClose} className="text-[#A0A0A0] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3 mt-4">
          <p className="font-sans text-[0.8125rem] text-[#A0A0A0] leading-relaxed">
            Please input the warning message for this user. They will see this notification in their profile dashboard.
          </p>
          <textarea
            value={warning}
            onChange={e => setWarning(e.target.value)}
            placeholder="e.g. Please refrain from submitting low-quality placeholder milestone deliveries..."
            className="w-full h-32 rounded-xl bg-[#080808] border border-border p-3.5 font-sans text-[0.8125rem] text-white focus:border-[#8C5CFF] focus:outline-none placeholder-foreground/30 resize-none"
          />
        </div>
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-card hover:bg-foreground/5 py-2.5 font-sans text-[0.8125rem] font-semibold text-foreground/80 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!warning.trim()}
            onClick={() => onConfirm(warning)}
            className="flex-1 rounded-xl bg-[#DAC95A] hover:bg-[#DAC95A]/90 py-2.5 font-sans text-[0.8125rem] font-semibold text-[#0b0b0b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send Warning
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Suspend Reason Dialog Modal ──────────────────────────────────────────────

function SuspendReasonModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-md flex-col rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="font-sans text-[1rem] font-bold text-white flex items-center gap-2">
            <ShieldAlert size={18} className="text-[#F87171]" />
            Suspend User
          </h3>
          <button type="button" onClick={onClose} className="text-[#A0A0A0] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3 mt-4">
          <p className="font-sans text-[0.8125rem] text-[#A0A0A0] leading-relaxed">
            Please input the suspension reason details. This log will be updated in user alerts.
          </p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Account suspended for spamming multiple system milestones..."
            className="w-full h-32 rounded-xl bg-[#080808] border border-border p-3.5 font-sans text-[0.8125rem] text-white focus:border-[#8C5CFF] focus:outline-none placeholder-foreground/30 resize-none"
          />
        </div>
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-card hover:bg-foreground/5 py-2.5 font-sans text-[0.8125rem] font-semibold text-foreground/80 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason)}
            className="flex-1 rounded-xl bg-[#F87171] hover:bg-[#F87171]/90 py-2.5 font-sans text-[0.8125rem] font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirm Suspension
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Ban User Confirm Modal ────────────────────────────────────────────────────

function BanUserModal({
  userName,
  onConfirm,
  onClose,
}: {
  userName: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-md flex-col rounded-2xl border border-[#F87171]/20 bg-card p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="font-sans text-[1rem] font-bold text-white flex items-center gap-2">
            <ShieldAlert size={18} className="text-[#F87171]" />
            Permanently Ban User
          </h3>
          <button type="button" onClick={onClose} className="text-[#A0A0A0] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3 mt-4">
          <p className="font-sans text-[0.8125rem] text-[#A0A0A0] leading-relaxed">
            You are about to <span className="text-[#F87171] font-semibold">permanently ban</span> <span className="text-white font-semibold">{userName}</span>. This action will block all platform access. Please state the reason.
          </p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Repeated platform abuse after multiple warnings and suspensions..."
            className="w-full h-28 rounded-xl bg-[#080808] border border-[#F87171]/20 p-3.5 font-sans text-[0.8125rem] text-white focus:border-[#F87171]/50 focus:outline-none placeholder-foreground/30 resize-none"
          />
        </div>
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-card hover:bg-foreground/5 py-2.5 font-sans text-[0.8125rem] font-semibold text-foreground/80 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason)}
            className="flex-1 rounded-xl bg-[#F87171] hover:bg-[#F87171]/80 py-2.5 font-sans text-[0.8125rem] font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirm Ban
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Tabs & Sort options ───────────────────────────────────────────────

const TABS: FilterTab[] = ['All', 'Members', 'Creators', 'Sellers', 'Suspended', 'Banned', 'Warned', 'High Risk'];

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'newest',     label: 'Newest first' },
  { key: 'trust-high', label: 'Trust: High → Low' },
  { key: 'risk-high',  label: 'Risk: High → Low' },
  { key: 'name-asc',   label: 'Name: A-Z' },
];

function SortSelect({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-2 font-sans text-[0.8125rem] font-semibold text-white transition-colors hover:border-[#8C5CFF]/40"
      >
        Sort By
        <ChevronDown size={14} className={`text-white/50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1.5 min-w-[180px] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => { onChange(opt.key); setOpen(false); }}
              className={[
                'flex w-full items-center px-4 py-2.5 font-sans text-[0.8125rem] transition-colors text-left',
                opt.key === value
                  ? 'bg-[#8C5CFF]/10 text-[#8C5CFF]'
                  : 'text-foreground/80 hover:bg-foreground/5',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers]               = useState<UserItem[]>(INITIAL_USERS);
  const [activeTab, setActiveTab]       = useState<FilterTab>('All');
  const [sortKey, setSortKey]           = useState<SortOption>('newest');
  
  // Modals state
  const [previewUser, setPreviewUser]   = useState<UserItem | null>(null);
  const [suspendUserId, setSuspendUserId] = useState<number | null>(null);
  const [warnUserId, setWarnUserId]       = useState<number | null>(null);
  const [banUserId, setBanUserId]         = useState<number | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [lastAction, setLastAction]     = useState<{ type: 'suspend' | 'unsuspend' | 'warn' | 'ban'; user: UserItem } | null>(null);

  // Statistics counters
  const totalUsers  = users.length;
  const creators    = users.filter(u => u.roles.includes('Creator')).length;
  const sellers     = users.filter(u => u.roles.includes('Seller')).length;
  const suspended   = users.filter(u => u.status === 'Suspended').length;

  const countByTab = (tab: FilterTab) => {
    if (tab === 'All') return users.length;
    if (tab === 'Members') return users.filter(u => u.roles.includes('Member')).length;
    if (tab === 'Creators') return users.filter(u => u.roles.includes('Creator')).length;
    if (tab === 'Sellers') return users.filter(u => u.roles.includes('Seller')).length;
    if (tab === 'Suspended') return users.filter(u => u.status === 'Suspended').length;
    if (tab === 'Banned') return users.filter(u => u.status === 'Banned').length;
    if (tab === 'Warned') return users.filter(u => u.warned === true).length;
    return users.filter(u => u.riskScore >= 70).length; // High risk
  };

  const filteredUsers = useMemo(() => {
    let list = users;
    
    // Filter Tab
    if (activeTab === 'Members') {
      list = list.filter(u => u.roles.includes('Member'));
    } else if (activeTab === 'Creators') {
      list = list.filter(u => u.roles.includes('Creator'));
    } else if (activeTab === 'Sellers') {
      list = list.filter(u => u.roles.includes('Seller'));
    } else if (activeTab === 'Suspended') {
      list = list.filter(u => u.status === 'Suspended');
    } else if (activeTab === 'Banned') {
      list = list.filter(u => u.status === 'Banned');
    } else if (activeTab === 'Warned') {
      list = list.filter(u => u.warned === true);
    } else if (activeTab === 'High Risk') {
      list = list.filter(u => u.riskScore >= 70);
    }

    // Sorting
    switch (sortKey) {
      case 'trust-high':
        return [...list].sort((a, b) => b.trustScore - a.trustScore);
      case 'risk-high':
        return [...list].sort((a, b) => b.riskScore - a.riskScore);
      case 'name-asc':
        return [...list].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list; // newest/default
    }
  }, [users, activeTab, sortKey]);

  // Admin Config updates
  const handleRoleToggle = (id: number, role: UserRole) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== id) return u;
      const roles = u.roles.includes(role)
        ? u.roles.filter(r => r !== role)
        : [...u.roles, role];
      const updated = { ...u, roles };
      if (previewUser?.id === id) setPreviewUser(updated);
      return updated;
    }));
  };

  const handleScoreUpdate = (id: number, field: 'trust' | 'risk', value: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== id) return u;
      const updated = field === 'trust'
        ? { ...u, trustScore: value }
        : { ...u, riskScore: value };
      if (previewUser?.id === id) setPreviewUser(updated);
      return updated;
    }));
  };

  const executeWarning = (warning: string) => {
    if (warnUserId === null) return;
    const targetUser = users.find(u => u.id === warnUserId);
    if (!targetUser) return;

    setUsers(prev => prev.map(u => {
      if (u.id !== warnUserId) return u;
      // Increment risk score slightly + flag as warned
      return { ...u, riskScore: Math.min(100, u.riskScore + 10), warned: true };
    }));
    setLastAction({ type: 'warn', user: targetUser });
    setSuccessBanner(`Warning sent to "${targetUser.name}": "${warning}"`);
    setWarnUserId(null);
  };

  const executeSuspension = (reason: string) => {
    if (suspendUserId === null) return;
    const targetUser = users.find(u => u.id === suspendUserId);
    if (!targetUser) return;

    setUsers(prev => prev.map(u => {
      if (u.id !== suspendUserId) return u;
      return { ...u, status: 'Suspended', suspensionReason: reason };
    }));
    setLastAction({ type: 'suspend', user: targetUser });
    setSuccessBanner(`User "${targetUser.name}" has been suspended.`);
    setSuspendUserId(null);
  };

  const executeUnsuspend = (id: number) => {
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return;

    setUsers(prev => prev.map(u => {
      if (u.id !== id) return u;
      return { ...u, status: 'Active', suspensionReason: undefined };
    }));
    setLastAction({ type: 'unsuspend', user: targetUser });
    setSuccessBanner(`User "${targetUser.name}" has been unsuspended.`);
  };

  const executeBan = (reason: string) => {
    if (banUserId === null) return;
    const targetUser = users.find(u => u.id === banUserId);
    if (!targetUser) return;

    setUsers(prev => prev.map(u => {
      if (u.id !== banUserId) return u;
      return { ...u, status: 'Banned', suspensionReason: reason };
    }));
    setLastAction({ type: 'ban', user: targetUser });
    setSuccessBanner(`User "${targetUser.name}" has been permanently banned.`);
    setBanUserId(null);
  };

  const handleUndo = () => {
    if (!lastAction) return;
    setUsers(prev => prev.map(u => {
      if (u.id !== lastAction.user.id) return u;
      return lastAction.user;
    }));
    setLastAction(null);
    setSuccessBanner(null);
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto px-6 py-6">

        {/* Modal views */}
        {previewUser && (
          <UserPreviewModal
            user={previewUser}
            onClose={() => setPreviewUser(null)}
            onRoleToggle={handleRoleToggle}
            onScoreUpdate={handleScoreUpdate}
          />
        )}
        {suspendUserId !== null && (
          <SuspendReasonModal
            onClose={() => setSuspendUserId(null)}
            onConfirm={executeSuspension}
          />
        )}
        {banUserId !== null && (
          <BanUserModal
            userName={users.find(u => u.id === banUserId)?.name ?? 'this user'}
            onClose={() => setBanUserId(null)}
            onConfirm={executeBan}
          />
        )}
        {warnUserId !== null && (
          <WarnUserModal
            onClose={() => setWarnUserId(null)}
            onConfirm={executeWarning}
          />
        )}

        {/* Title */}
        <h1 className="font-sans text-[1.875rem] font-bold leading-[34px] tracking-tight text-white/80">
          All Users
        </h1>

        {/* Stat KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={totalUsers} sub="+124 this week" />
          <StatCard label="Creators" value={creators} sub="Staked and active" subColor="#4ADE80" />
          <StatCard label="Sellers" value={sellers} sub="Approved sellers" />
          <StatCard label="Suspended" value={suspended} sub="3 pending review" />
        </div>

        {/* Success Alert Banner */}
        {successBanner && (
          <div className="flex items-center gap-3 rounded-xl border border-[#8C5CFF]/30 bg-[#8C5CFF]/10 px-5 py-3 font-sans text-[0.8125rem] text-white">
            <Check size={16} className="text-[#8C5CFF]" />
            <span>{successBanner}</span>
            <button
              type="button"
              onClick={handleUndo}
              className="ml-auto font-bold text-[#8C5CFF] hover:underline"
            >
              Undo Action
            </button>
            <button type="button" onClick={() => setSuccessBanner(null)} className="ml-3 text-white/40 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Filtering & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-[#080808] border border-border p-1 rounded-xl shadow-inner flex-wrap">
            {TABS.map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-sans text-[0.6875rem] font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-[#8C5CFF] text-white shadow'
                    : 'text-[#A0A0A0] hover:text-white'
                }`}
              >
                {tab}
                {countByTab(tab) > 0 && tab !== 'All' && (
                  <span className={`flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 font-sans text-[9px] font-bold ${
                    activeTab === tab ? 'bg-white/20 text-white' : 'bg-border text-[#A0A0A0]'
                  }`}>
                    {countByTab(tab)}
                  </span>
                )}
              </button>
            ))}
          </div>
          <SortSelect value={sortKey} onChange={setSortKey} />
        </div>

        {/* Table container */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-[2.5fr_1.5fr_1fr_1.2fr_1.2fr_2.5fr] gap-4 items-center px-6 py-3 border-b border-border bg-foreground/[0.015]">
            <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] uppercase tracking-wider">User</p>
            <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] uppercase tracking-wider">Role</p>
            <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] uppercase tracking-wider">Trust</p>
            <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] uppercase tracking-wider">Risk</p>
            <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] uppercase tracking-wider">Status</p>
            <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] uppercase tracking-wider text-right">Actions</p>
          </div>

          {/* Rows */}
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <p className="font-sans text-[0.8125rem] text-[#A0A0A0]">No users found matching filters</p>
            </div>
          ) : (
            filteredUsers.map(user => {
              const hasHighRisk = user.riskScore >= 70;
              return (
                <div
                  key={user.id}
                  className="flex flex-col md:grid md:grid-cols-[2.5fr_1.5fr_1fr_1.2fr_1.2fr_2.5fr] gap-3 md:gap-4 items-start md:items-center px-6 py-4 border-b border-border hover:bg-foreground/[0.01] transition-colors"
                >
                  {/* User Profile */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-full bg-[#8C5CFF]/15 border border-[#8C5CFF]/20 flex items-center justify-center font-sans font-semibold text-[#8C5CFF] text-[0.75rem]">
                      {user.initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="font-sans text-[0.875rem] font-semibold text-foreground truncate">{user.name}</p>
                      <p className="font-sans text-[0.6875rem] text-[#A0A0A0] leading-[14px] mt-0.5 truncate">
                        {user.handle} &middot; {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Role badges */}
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map(r => (
                      <span
                        key={r}
                        className={`rounded px-2 py-0.5 font-sans text-[0.625rem] font-medium ${r === 'Creator' ? 'bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80]' : r === 'Seller' ? 'bg-[#8C5CFF]/10 border border-[#8C5CFF]/20 text-[#8C5CFF]' : 'bg-border text-[#A0A0A0]'}`}
                      >
                        {r}
                      </span>
                    ))}
                  </div>

                  {/* Trust Score */}
                  <p className="font-sans text-[0.8125rem] text-foreground font-semibold leading-[18px]">{user.trustScore}</p>

                  {/* Risk Score */}
                  <div>
                    <span className={`inline-block rounded px-2 py-0.5 font-sans text-[0.6875rem] font-semibold ${hasHighRisk ? 'bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171]' : 'bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80]'}`}>
                      {hasHighRisk ? 'High' : 'Low'} {user.riskScore}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    <span className={`inline-block rounded px-2 py-0.5 font-sans text-[0.6875rem] font-semibold ${
                      user.status === 'Active'
                        ? 'bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80]'
                        : user.status === 'Banned'
                          ? 'bg-[#7f1d1d]/40 border border-[#F87171]/30 text-[#F87171]'
                          : 'bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171]'
                    }`}>
                      {user.status}
                    </span>
                  </div>

                  {/* Actions Column */}
                  <div className="flex gap-2 w-full md:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setPreviewUser(user)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1 rounded-xl border border-border hover:border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/5 text-white/95 hover:text-white px-3.5 py-2 font-sans text-[0.75rem] font-semibold transition-all active:scale-[0.98]"
                    >
                      View
                    </button>
                    {user.status === 'Active' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setWarnUserId(user.id)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-1 rounded-xl border border-[#DAC95A]/30 hover:bg-[#DAC95A]/5 text-[#DAC95A] px-3.5 py-2 font-sans text-[0.75rem] font-semibold transition-all active:scale-[0.98]"
                        >
                          Warn
                        </button>
                        <button
                          type="button"
                          onClick={() => setSuspendUserId(user.id)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-1 rounded-xl bg-[#8C5CFF] hover:bg-[#AC8EF3] text-white px-3.5 py-2 font-sans text-[0.75rem] font-semibold transition-all active:scale-[0.98] shadow-lg shadow-[#8C5CFF]/15"
                        >
                          Suspend
                        </button>
                      </>
                    ) : user.status === 'Suspended' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => executeUnsuspend(user.id)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-1 rounded-xl border border-[#4ADE80]/30 hover:bg-[#4ADE80]/5 text-[#4ADE80] px-3.5 py-2 font-sans text-[0.75rem] font-semibold transition-all active:scale-[0.98]"
                        >
                          Unsuspend
                        </button>
                        <button
                          type="button"
                          onClick={() => setBanUserId(user.id)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-1 rounded-xl bg-[#F87171] hover:bg-[#F87171]/80 text-white px-3.5 py-2 font-sans text-[0.75rem] font-semibold transition-all active:scale-[0.98]"
                        >
                          Ban
                        </button>
                      </>
                    ) : (
                      /* Banned — no further actions */
                      <span className="flex-1 md:flex-none flex items-center justify-center px-3.5 py-2 font-sans text-[0.75rem] font-semibold text-[#F87171]/50 cursor-not-allowed select-none">
                        Banned
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
