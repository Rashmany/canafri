'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  X,
  Check,
  User,
  Activity,
  FileText,
  Eye,
  Info,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskTier = 'Clean' | 'Watch' | 'Restricted' | 'Blocked';

interface RiskUser {
  id: number;
  name: string;
  handle: string;
  email: string;
  avatarInitials: string;
  score: number;
  primarySignal: string;
  trend: 'up' | 'down';
  evidence: {
    ipMatches?: string[];
    phoneMatched?: string;
    speedApps?: number;
    aiPercentage?: number;
    timerDiff?: string;
    subscriptionPattern?: string;
  };
  explanation?: string;
}

interface RiskPattern {
  id: string;
  name: string;
  count: number;
  percent: number;
  icon: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_RISK_USERS: RiskUser[] = [
  {
    id: 1,
    name: 'John Trek',
    handle: '@johntrek',
    email: 'johntrek@gmail.com',
    avatarInitials: 'JT',
    score: 91,
    primarySignal: 'Fake deliverables reported',
    trend: 'up',
    evidence: {
      speedApps: 18,
      aiPercentage: 88,
    },
    explanation: 'I used an AI assistant to edit my grammatical mistakes, but the core work is mine.'
  },
  {
    id: 2,
    name: 'Sarah Connor',
    handle: '@sconnor',
    email: 'sconnor@cyberdyne.com',
    avatarInitials: 'SC',
    score: 82,
    primarySignal: 'Plagiarised content detected',
    trend: 'down',
    evidence: {
      aiPercentage: 92,
    },
    explanation: 'The code is boilerplate code. It was not intended to copy any proprietary source.'
  },
  {
    id: 3,
    name: 'David Miller',
    handle: '@davidm',
    email: 'davidm@canafri.io',
    avatarInitials: 'DM',
    score: 82,
    primarySignal: 'Plagiarised content detected',
    trend: 'down',
    evidence: {
      aiPercentage: 91,
    },
    explanation: 'Shared common repository files.'
  },
  {
    id: 4,
    name: 'Alice Johnson',
    handle: '@alicej',
    email: 'alicej@example.com',
    avatarInitials: 'AJ',
    score: 91,
    primarySignal: 'Fake deliverables reported',
    trend: 'up',
    evidence: {
      ipMatches: ['192.168.1.102', '192.168.1.105'],
    },
    explanation: 'My brother also has an account from the same house.'
  },
  {
    id: 5,
    name: 'Robert Patrick',
    handle: '@t1000',
    email: 't1000@cyberdyne.com',
    avatarInitials: 'RP',
    score: 82,
    primarySignal: 'Plagiarised content detected',
    trend: 'down',
    evidence: {
      timerDiff: '2 mins',
    },
    explanation: 'Accidentally triggered unstake instead of deposit.'
  },
  {
    id: 6,
    name: 'Michael Biehn',
    handle: '@kyle_reese',
    email: 'reese@cyberdyne.com',
    avatarInitials: 'MB',
    score: 82,
    primarySignal: 'Plagiarised content detected',
    trend: 'down',
    evidence: {
      subscriptionPattern: 'High volume signup sequence',
    },
    explanation: 'Multiple team members subscribed at once.'
  }
];

const MOCK_PATTERNS: RiskPattern[] = [
  { id: 'ip',        name: 'Multiple registrations same IP',     count: 31, percent: 80, icon: 'language' },
  { id: 'phone',     name: 'Phone reuse attempt',                count: 25, percent: 65, icon: 'phone' },
  { id: 'velocity',  name: 'Rapid job application velocity',     count: 15, percent: 40, icon: 'work' },
  { id: 'ai',        name: 'AI content detection over 85%',      count: 25, percent: 65, icon: 'verified' },
  { id: 'timer',     name: 'Stake-unstake before 10 min timer',  count: 6,  percent: 15, icon: 'time' },
  { id: 'anomaly',   name: 'Subscription pattern anomaly',       count: 8,  percent: 20, icon: 'chart' },
];

const PAGE_SIZE = 6;

// ─── Tiers helper ─────────────────────────────────────────────────────────────

function tierConfig(score: number): { label: RiskTier; color: string; bg: string; action: string } {
  if (score <= 30) return { label: 'Clean',      color: 'text-emerald-400', bg: 'bg-emerald-500/10', action: 'Full platform access' };
  if (score <= 60) return { label: 'Watch',      color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  action: 'Rate limited' };
  if (score <= 80) return { label: 'Restricted', color: 'text-orange-400',  bg: 'bg-orange-500/10',  action: 'Earning suspended' };
  return                  { label: 'Blocked',    color: 'text-red-400',     bg: 'bg-red-500/10',     action: 'Account suspended' };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminRiskScoresPage() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<RiskTier | 'All'>('All');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<RiskUser | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Stats summary counts
  const stats = useMemo(() => {
    let clean = 0, watch = 0, restricted = 0, blocked = 0;
    MOCK_RISK_USERS.forEach(u => {
      const cfg = tierConfig(u.score);
      if (cfg.label === 'Clean')      clean++;
      else if (cfg.label === 'Watch') watch++;
      else if (cfg.label === 'Restricted') restricted++;
      else if (cfg.label === 'Blocked') blocked++;
    });
    return { clean, watch, restricted, blocked };
  }, []);

  const filtered = useMemo(() => {
    let list = MOCK_RISK_USERS;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q) || u.primarySignal.toLowerCase().includes(q));
    }
    if (tierFilter !== 'All') {
      list = list.filter(u => tierConfig(u.score).label === tierFilter);
    }
    return list;
  }, [search, tierFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleResolveRisk = (userId: number, decision: string) => {
    setSelectedUser(null);
    triggerToast(`Resolution applied: User account set to ${decision}.`);
  };

  const pageNumbers = () => {
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
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg border border-border bg-[#0b0b0b] px-4 py-3 text-[13px] text-white shadow-xl">
          <ShieldCheck size={16} className="text-[#8C5CFF]" />
          <span>{showToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-4 flex flex-col gap-1">
        <h1 className="font-sans text-[36px] font-bold leading-[42px] tracking-[-0.18px] text-white">
          Risk Scores
        </h1>
        <p className="font-sans text-[11px] text-[#A0A0A0]">
          Monitor automated risk detection, view violation reasons, and resolve pending account restrictions.
        </p>
      </div>

      {/* Stats row */}
      <div className="shrink-0 grid grid-cols-1 md:grid-cols-4 gap-4 px-6 pb-6">
        {[
          { title: 'Clean — 0 to 30',      val: stats.clean,      sub: 'Full platform access', color: 'text-emerald-400' },
          { title: 'Watch — 31 to 60',      val: stats.watch,      sub: 'Rate limited',         color: 'text-yellow-400' },
          { title: 'Restricted — 61 to 80', val: stats.restricted, sub: 'Earning suspended',     color: 'text-orange-400' },
          { title: 'Blocked — 81 to 100',   val: stats.blocked,    sub: 'Account suspended',    color: 'text-red-400' },
        ].map((card, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-[16px] border border-border bg-[#0b0b0b] p-5">
            <p className="font-sans text-[13px] font-medium text-[#A0A0A0]">{card.title}</p>
            <div className="flex flex-col gap-1">
              <p className="font-sans text-[24px] font-bold text-white/80">{card.val}</p>
              <p className={`font-sans text-[11px] font-medium ${card.color}`}>{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Patterns on Left, Table on Bottom */}
      <div className="flex flex-col gap-6 px-6 pb-8">
        
        {/* Risk Patterns List */}
        <div className="rounded-[16px] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-4">
          <h3 className="text-[16px] font-bold text-white/80">Automated Risk Signals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_PATTERNS.map(pat => (
              <div key={pat.id} className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <Activity size={16} className="text-[#8C5CFF] shrink-0" />
                  <span className="font-sans text-[14px] text-white/80">{pat.name}</span>
                </div>
                <div className="flex items-center gap-4 w-[200px]">
                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${pat.percent}%` }}
                    />
                  </div>
                  <span className="font-sans text-[13px] font-semibold text-white/70 w-8 text-right">
                    {pat.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Filter Controls */}
        <div className="flex items-center justify-between gap-4 rounded-[12px] border border-border bg-[#0b0b0b] p-4">
          <div className="flex items-center gap-3">
            <div className="flex w-[280px] items-center gap-2.5 rounded-[8px] border border-border bg-background px-3.5 py-2.5">
              <Search size={16} strokeWidth={1.75} className="shrink-0 text-[#8a8a8a]" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent font-sans text-[14px] text-foreground placeholder:text-[#8a8a8a] outline-none"
              />
            </div>
            
            <div className="flex items-center gap-1.5 bg-[#080808] border border-border p-1 rounded-xl shadow-inner">
              {(['All', 'Watch', 'Restricted', 'Blocked'] as const).map(tier => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setTierFilter(tier)}
                  className={`px-3 py-1 rounded-lg font-sans text-[11px] font-semibold transition-all ${
                    tierFilter === tier
                      ? 'bg-[#8C5CFF] text-white shadow'
                      : 'text-[#A0A0A0] hover:text-white'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-[12px] border border-border bg-[#0b0b0b]">
          <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_120px] gap-0 border-b border-border bg-[#101010] px-6 py-4">
            {['USER', 'SCORE', 'PRIMARY SIGNAL', 'TREND', 'ACTIONS'].map((col, i) => (
              <p
                key={col}
                className={`font-sans text-[12px] font-semibold text-[#8a8a8a] ${i === 4 ? 'text-center' : ''}`}
              >
                {col}
              </p>
            ))}
          </div>

          {pageData.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="font-sans text-[14px] text-[#A0A0A0]">No high risk users found.</p>
            </div>
          ) : (
            pageData.map(user => {
              const tier = tierConfig(user.score);
              return (
                <div
                  key={user.id}
                  className="grid grid-cols-[2fr_1fr_1.5fr_1fr_120px] items-center gap-0 border-b border-border/40 px-6 py-4 last:border-b-0 hover:bg-foreground/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#8C5CFF]/15 font-sans text-[14px] font-bold text-[#8C5CFF]">
                      {user.avatarInitials}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-sans text-[14px] font-semibold text-white">{user.name}</p>
                      <p className="font-sans text-[12px] text-[#8a8a8a]">{user.handle}</p>
                    </div>
                  </div>

                  <div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-[12px] font-semibold ${tier.bg} ${tier.color}`}>
                      {user.score}
                    </span>
                  </div>

                  <div>
                    <span className="inline-flex rounded-full bg-white/5 border border-border px-3 py-1 font-sans text-[12px] text-white/80">
                      {user.primarySignal}
                    </span>
                  </div>

                  <div>
                    {user.trend === 'up' ? (
                      <TrendingUp size={16} className="text-red-400" />
                    ) : (
                      <TrendingDown size={16} className="text-emerald-400" />
                    )}
                  </div>

                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setSelectedUser(user)}
                      className="rounded-lg bg-[#8C5CFF] hover:bg-[#7b4eed] text-white px-4 py-1.5 font-sans text-[13px] font-semibold transition-colors"
                    >
                      Review
                    </button>
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
              onClick={() => setPage(page - 1)}
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
                  onClick={() => setPage(p as number)}
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
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="flex items-center justify-center rounded-[8px] border border-border bg-[#0b0b0b] px-3 py-2 transition-colors hover:bg-border/30 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} strokeWidth={2} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="relative flex w-full max-w-lg flex-col rounded-2xl border border-border bg-card p-6 shadow-2xl animate-modal-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-[#8C5CFF]/25 border border-[#8C5CFF]/30 flex items-center justify-center font-sans font-semibold text-[#8C5CFF] text-[0.875rem]">
                  {selectedUser.avatarInitials}
                </div>
                <div>
                  <h3 className="font-sans text-[0.9375rem] font-bold text-white leading-[20px]">{selectedUser.name}</h3>
                  <p className="font-sans text-[0.75rem] text-[#A0A0A0] mt-0.5">{selectedUser.handle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-[#A0A0A0] hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Evidence details */}
            <div className="flex flex-col gap-4 mt-5">
              <div className="bg-[#080808]/40 border border-border/60 rounded-xl p-4 flex flex-col gap-2">
                <h4 className="text-[13px] font-bold text-white flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-400" />
                  Primary Risk Signal: {selectedUser.primarySignal}
                </h4>
                <p className="text-[12px] text-[#A0A0A0]">
                  User Risk Score: <span className="text-white font-semibold">{selectedUser.score}</span>
                </p>
              </div>

              {/* Specific violation details */}
              <div className="flex flex-col gap-2">
                <p className="text-[13px] font-bold text-white/80">Automated Evidence Logs</p>
                <div className="rounded-xl border border-border bg-[#080808]/20 p-3.5 text-[12px] flex flex-col gap-1.5 font-mono text-[#A0A0A0]">
                  {selectedUser.evidence.ipMatches && (
                    <p>IP Address Match: Matches with active accounts {selectedUser.evidence.ipMatches.join(', ')}</p>
                  )}
                  {selectedUser.evidence.speedApps && (
                    <p>Trigger Velocity: {selectedUser.evidence.speedApps} applications within 60 seconds</p>
                  )}
                  {selectedUser.evidence.aiPercentage && (
                    <p>AI Similarity Match: {selectedUser.evidence.aiPercentage}% similarity verified by parser</p>
                  )}
                  {selectedUser.evidence.timerDiff && (
                    <p>Time Anomaly: Stake-unstake duration was {selectedUser.evidence.timerDiff}</p>
                  )}
                  {selectedUser.evidence.subscriptionPattern && (
                    <p>Pattern Flag: {selectedUser.evidence.subscriptionPattern}</p>
                  )}
                </div>
              </div>

              {/* Explanations */}
              {selectedUser.explanation && (
                <div className="flex flex-col gap-2">
                  <p className="text-[13px] font-bold text-white/80">User Appeal Statement</p>
                  <p className="rounded-xl border border-border bg-[#080808]/20 p-3.5 text-[12px] text-[#A0A0A0] leading-relaxed">
                    &quot;{selectedUser.explanation}&quot;
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 mt-6 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => handleResolveRisk(selectedUser.id, 'Clean')}
                className="flex-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-2.5 font-sans text-[13px] font-semibold transition-colors text-center"
              >
                Dismiss Risk
              </button>
              <button
                type="button"
                onClick={() => handleResolveRisk(selectedUser.id, 'Watch')}
                className="flex-1 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 py-2.5 font-sans text-[13px] font-semibold transition-colors text-center"
              >
                Keep On Watch
              </button>
              <button
                type="button"
                onClick={() => handleResolveRisk(selectedUser.id, 'Blocked')}
                className="flex-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 font-sans text-[13px] font-semibold transition-colors text-center"
              >
                Block Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
