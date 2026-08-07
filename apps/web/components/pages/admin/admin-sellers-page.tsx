'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronDown, CheckCircle2, ShieldAlert } from 'lucide-react';

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

interface SellerItem {
  id: string;
  displayName: string | null;
  username: string;
  email: string;
  country: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'REVOKED';
  isSeller: boolean;
  sellerApproved: boolean;
  sellerApplied: boolean;
  trustScore: number;
  riskScore: number;
  needsReview: boolean;
  createdAt: string;
  creatorStake?: { amountCC: number } | null;
  freelanceJobs: Array<{ id: string; status: string; amountCC: number }>;
}

interface SellerStats {
  totalSellers: number;
  activeSellers: number;
  verifiedSellers: number;
  totalSalesCC: number;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S';
}

function formatDate(dStr: string) {
  try {
    return new Date(dStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dStr;
  }
}

export default function AdminSellersPage() {
  const [stats, setStats] = useState<SellerStats>({
    totalSellers: 0,
    activeSellers: 0,
    verifiedSellers: 0,
    totalSalesCC: 0,
  });

  const [items, setItems] = useState<SellerItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [statusOpen, setStatusOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<SellerItem | null>(null);
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

  const loadStats = useCallback(async () => {
    try {
      const res = await apiFetch('/admin/sellers/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('[AdminSellers] Stats load error:', err);
    }
  }, []);

  const loadSellers = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search ? { search: search.trim() } : {}),
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      });
      const res = await apiFetch(`/admin/sellers?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('[AdminSellers] List load error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadSellers(); }, [loadSellers]);

  const handleToggleVerification = async (seller: SellerItem) => {
    setActionLoading(true);
    try {
      const nextApproved = !seller.sellerApproved;
      const res = await apiFetch(`/admin/sellers/${seller.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ sellerApproved: nextApproved }),
      });
      if (res.ok) {
        await Promise.all([loadStats(), loadSellers()]);
        setSelectedSeller(prev => (prev?.id === seller.id ? { ...prev, sellerApproved: nextApproved } : prev));
      }
    } catch (err) {
      console.error('[AdminSellers] Verification update error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuspension = async (seller: SellerItem) => {
    setActionLoading(true);
    try {
      const nextStatus = seller.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      const res = await apiFetch(`/admin/sellers/${seller.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await Promise.all([loadStats(), loadSellers()]);
        setSelectedSeller(prev => (prev?.id === seller.id ? { ...prev, status: nextStatus } : prev));
      }
    } catch (err) {
      console.error('[AdminSellers] Status update error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col gap-8 bg-background p-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-sans text-[32px] font-bold tracking-tight text-foreground">Seller Directory</h1>
        <p className="font-sans text-[14px] text-muted">
          Manage verified service providers, verify identity signals, inspect staking reserves, and enforce seller policies.
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-5 shadow-sm">
          <span className="text-[13px] font-medium text-muted">Total Sellers</span>
          <span className="text-[26px] font-bold text-foreground">{stats.totalSellers.toLocaleString()}</span>
        </div>
        <div className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-5 shadow-sm">
          <span className="text-[13px] font-medium text-muted">Active Sellers</span>
          <span className="text-[26px] font-bold text-emerald-400">{stats.activeSellers.toLocaleString()}</span>
        </div>
        <div className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-5 shadow-sm">
          <span className="text-[13px] font-medium text-muted">Verified Sellers</span>
          <span className="text-[26px] font-bold text-[#8C5CFF]">{stats.verifiedSellers.toLocaleString()}</span>
        </div>
        <div className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-5 shadow-sm">
          <span className="text-[13px] font-medium text-muted">Total Earned (CC)</span>
          <span className="text-[26px] font-bold text-foreground">{stats.totalSalesCC.toLocaleString()} CC</span>
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
            placeholder="Search seller username, name..."
            className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-[13px] text-foreground outline-none focus:border-[#8C5CFF]"
          />
        </div>

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
              {['ALL', 'ACTIVE', 'SUSPENDED'].map(st => (
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

      {/* Table */}
      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-background/50 text-[12px] font-semibold text-muted">
              <th className="py-3.5 px-6">SELLER</th>
              <th className="py-3.5 px-6">VERIFICATION</th>
              <th className="py-3.5 px-6">STATUS</th>
              <th className="py-3.5 px-6">TRUST / RISK</th>
              <th className="py-3.5 px-6">STAKE</th>
              <th className="py-3.5 px-6 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-[13px]">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted">Loading sellers...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted">No sellers found matching filters.</td>
              </tr>
            ) : (
              items.map(s => (
                <tr key={s.id} className="hover:bg-background/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-[#8C5CFF]/15 font-bold text-[#8C5CFF]">
                        {getInitials(s.displayName || s.username)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{s.displayName || s.username}</span>
                        <span className="text-[11px] text-muted">{s.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {s.sellerApproved ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[12px]">
                        <CheckCircle2 size={14} /> Verified
                      </span>
                    ) : (
                      <span className="text-muted text-[12px]">Unverified</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="font-semibold text-emerald-400">T: {s.trustScore}</span>
                      <span className="text-muted">/</span>
                      <span className={`font-semibold ${s.riskScore > 50 ? 'text-red-400' : 'text-foreground/80'}`}>R: {s.riskScore}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-foreground font-medium">
                    {s.creatorStake?.amountCC ? `${s.creatorStake.amountCC} CC` : '0 CC'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedSeller(s)}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-border/40 transition-colors"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-border px-6 py-3 text-[13px]">
          <span className="text-muted">Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total sellers)</span>
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

      {/* Seller Detail Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-[#8C5CFF]/15 font-bold text-[#8C5CFF]">
                  {getInitials(selectedSeller.displayName || selectedSeller.username)}
                </div>
                <div className="flex flex-col">
                  <h2 className="text-[16px] font-bold text-foreground">{selectedSeller.displayName || selectedSeller.username}</h2>
                  <span className="text-[12px] text-muted">{selectedSeller.email}</span>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedSeller(null)} className="text-muted hover:text-foreground text-xl">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[13px]">
              <div className="flex flex-col gap-1 p-3 rounded-xl border border-border bg-background">
                <span className="text-muted text-[11px]">Seller Verification</span>
                <span className="font-bold text-foreground">{selectedSeller.sellerApproved ? 'Verified Seller' : 'Unverified'}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-xl border border-border bg-background">
                <span className="text-muted text-[11px]">Account Status</span>
                <span className="font-bold text-foreground">{selectedSeller.status}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-border">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleToggleVerification(selectedSeller)}
                className="w-full py-2.5 text-[13px] font-semibold rounded-xl border border-[#8C5CFF]/40 bg-[#8C5CFF]/10 text-[#8C5CFF] hover:bg-[#8C5CFF]/20"
              >
                {selectedSeller.sellerApproved ? 'Revoke Seller Verification Badge' : 'Grant Verified Seller Badge'}
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleToggleSuspension(selectedSeller)}
                className={`w-full py-2.5 text-[13px] font-semibold rounded-xl text-white ${selectedSeller.status === 'ACTIVE' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
              >
                {selectedSeller.status === 'ACTIVE' ? 'Suspend Seller Account' : 'Reactivate Seller Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
