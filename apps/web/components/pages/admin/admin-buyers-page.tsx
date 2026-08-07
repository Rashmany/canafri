'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  TrendingUp,
  Eye,
  Ban,
  ShieldAlert,
  UserCheck,
  ArrowLeft,
  ShoppingBag,
} from 'lucide-react';

const API = '/api';

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('canafri_admin_access_token') || localStorage.getItem('canafri_access_token') || '';
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getToken()}`,
    ...(opts.headers as Record<string, string> ?? {}),
  };
  if (opts.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(`${API}${path}`, { ...opts, headers });
}

interface BuyerItem {
  id: string;
  displayName: string | null;
  username: string;
  email: string;
  country: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'REVOKED';
  trustScore: number;
  riskScore: number;
  needsReview: boolean;
  createdAt: string;
  _count: {
    postedJobs: number;
    freelanceJobs: number;
  };
  postedJobs: Array<{ id: string; status: string; amountCC: number }>;
  riskFlags: Array<{ id: string; flagType: string; severity: string; reason: string }>;
}

interface BuyerStats {
  totalBuyers: number;
  activeBuyers: number;
  totalJobsPosted: number;
  totalEscrowCC: number;
  totalSpentCC: number;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
}

function formatDate(dStr: string) {
  try {
    return new Date(dStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dStr;
  }
}

export default function AdminBuyersPage() {
  const [stats, setStats] = useState<BuyerStats>({
    totalBuyers: 0,
    activeBuyers: 0,
    totalJobsPosted: 0,
    totalEscrowCC: 0,
    totalSpentCC: 0,
  });

  const [items, setItems] = useState<BuyerItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [statusOpen, setStatusOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch summary stats (60s Redis cached)
  const loadStats = useCallback(async () => {
    try {
      const res = await apiFetch('/admin/buyers/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('[AdminBuyers] Stats load error:', err);
    }
  }, []);

  // Fetch paginated buyers
  const loadBuyers = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search ? { search: search.trim() } : {}),
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      });
      const res = await apiFetch(`/admin/buyers?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('[AdminBuyers] List load error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadBuyers(); }, [loadBuyers]);

  // Suspend/Reactivate user action
  const handleUpdateStatus = async (user: BuyerItem, targetStatus: 'ACTIVE' | 'SUSPENDED') => {
    setActionLoading(true);
    try {
      const res = await apiFetch(`/admin/users/${user.id}/suspend`, {
        method: 'PATCH',
        body: JSON.stringify({ status: targetStatus, reason: `Admin toggled status to ${targetStatus}` }),
      });
      if (res.ok) {
        await Promise.all([loadStats(), loadBuyers()]);
        setSelectedBuyer(prev => (prev?.id === user.id ? { ...prev, status: targetStatus } : prev));
      }
    } catch (err) {
      console.error('[AdminBuyers] Status update error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col gap-8 bg-background p-8">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="font-sans text-[32px] font-bold tracking-tight text-foreground">Buyer Management</h1>
        <p className="font-sans text-[14px] text-muted">
          Monitor platform buyers, escrow allocations, dispute ratios, and account status.
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-5 shadow-sm">
          <span className="text-[13px] font-medium text-muted">Total Buyers</span>
          <span className="text-[26px] font-bold text-foreground">{stats.totalBuyers.toLocaleString()}</span>
        </div>
        <div className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-5 shadow-sm">
          <span className="text-[13px] font-medium text-muted">Active Buyers</span>
          <span className="text-[26px] font-bold text-emerald-400">{stats.activeBuyers.toLocaleString()}</span>
        </div>
        <div className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-5 shadow-sm">
          <span className="text-[13px] font-medium text-muted">Total Escrow (CC)</span>
          <span className="text-[26px] font-bold text-[#8C5CFF]">{stats.totalEscrowCC.toLocaleString()} CC</span>
        </div>
        <div className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-5 shadow-sm">
          <span className="text-[13px] font-medium text-muted">Completed Volume (CC)</span>
          <span className="text-[26px] font-bold text-foreground">{stats.totalSpentCC.toLocaleString()} CC</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-[14px] border border-border bg-card p-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search username, name, email..."
            className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-[13px] text-foreground outline-none focus:border-[#8C5CFF]"
          />
        </div>

        {/* Status Filter */}
        <div className="relative" ref={statusRef}>
          <button
            type="button"
            onClick={() => setStatusOpen(v => !v)}
            className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-[13px] text-foreground"
          >
            <span>Status: <strong>{statusFilter}</strong></span>
            <ChevronDown size={14} className={statusOpen ? 'rotate-180' : ''} />
          </button>

          {statusOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-border bg-card p-1 shadow-xl">
              {['ALL', 'ACTIVE', 'SUSPENDED', 'BANNED'].map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => { setStatusFilter(st); setPage(1); setStatusOpen(false); }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-[12px] font-medium transition-colors ${statusFilter === st ? 'bg-[#8C5CFF]/15 text-[#8C5CFF]' : 'hover:bg-background text-foreground/80'}`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Buyers Table */}
      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-background/50 text-[12px] font-semibold text-muted">
              <th className="py-3.5 px-6">BUYER</th>
              <th className="py-3.5 px-6">STATUS</th>
              <th className="py-3.5 px-6">JOBS POSTED</th>
              <th className="py-3.5 px-6">TRUST / RISK</th>
              <th className="py-3.5 px-6">JOINED</th>
              <th className="py-3.5 px-6 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-[13px]">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted">Loading buyers...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted">No buyers found matching filters.</td>
              </tr>
            ) : (
              items.map(b => (
                <tr key={b.id} className="hover:bg-background/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-[#8C5CFF]/15 font-bold text-[#8C5CFF]">
                        {getInitials(b.displayName || b.username)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{b.displayName || b.username}</span>
                        <span className="text-[11px] text-muted">{b.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${b.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-semibold text-foreground">{b._count?.postedJobs || 0} jobs</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="font-semibold text-emerald-400">T: {b.trustScore}</span>
                      <span className="text-muted">/</span>
                      <span className={`font-semibold ${b.riskScore > 50 ? 'text-red-400' : 'text-foreground/80'}`}>R: {b.riskScore}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-muted">{formatDate(b.createdAt)}</td>
                  <td className="py-4 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedBuyer(b)}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-border/40 transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3 text-[13px]">
          <span className="text-muted">Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total buyers)</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="rounded-lg border border-border bg-background px-3 py-1 text-foreground disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="rounded-lg border border-border bg-background px-3 py-1 text-foreground disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Buyer Detail Modal */}
      {selectedBuyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-[#8C5CFF]/15 font-bold text-[#8C5CFF]">
                  {getInitials(selectedBuyer.displayName || selectedBuyer.username)}
                </div>
                <div className="flex flex-col">
                  <h2 className="text-[16px] font-bold text-foreground">{selectedBuyer.displayName || selectedBuyer.username}</h2>
                  <span className="text-[12px] text-muted">{selectedBuyer.email}</span>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedBuyer(null)} className="text-muted hover:text-foreground text-xl">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[13px]">
              <div className="flex flex-col gap-1 p-3 rounded-xl border border-border bg-background">
                <span className="text-muted text-[11px]">Account Status</span>
                <span className="font-bold text-foreground">{selectedBuyer.status}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-xl border border-border bg-background">
                <span className="text-muted text-[11px]">Jobs Posted</span>
                <span className="font-bold text-foreground">{selectedBuyer._count?.postedJobs || 0}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-xl border border-border bg-background">
                <span className="text-muted text-[11px]">Trust Score</span>
                <span className="font-bold text-emerald-400">{selectedBuyer.trustScore} / 100</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-xl border border-border bg-background">
                <span className="text-muted text-[11px]">Risk Score</span>
                <span className="font-bold text-amber-400">{selectedBuyer.riskScore} / 100</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedBuyer(null)}
                className="px-4 py-2 text-[13px] font-medium rounded-xl border border-border text-foreground hover:bg-background"
              >
                Close
              </button>
              {selectedBuyer.status === 'ACTIVE' ? (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedBuyer, 'SUSPENDED')}
                  className="px-4 py-2 text-[13px] font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                >
                  Suspend Buyer Access
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedBuyer, 'ACTIVE')}
                  className="px-4 py-2 text-[13px] font-semibold rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  Reactivate Buyer Access
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
