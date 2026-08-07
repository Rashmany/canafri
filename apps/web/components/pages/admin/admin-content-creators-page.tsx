'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronDown } from 'lucide-react';

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

interface CreatorItem {
  id: string;
  displayName: string | null;
  username: string;
  email: string;
  country: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'REVOKED';
  isCreator: boolean;
  trustScore: number;
  riskScore: number;
  needsReview: boolean;
  createdAt: string;
  creatorStake?: { amountCC: number } | null;
  content: Array<{ id: string; title: string; status: string; publishedAt: string | null }>;
}

interface CreatorStats {
  totalCreators: number;
  activeCreators: number;
  publishedContent: number;
  totalStakedCC: number;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'C';
}

function formatDate(dStr: string) {
  try {
    return new Date(dStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dStr;
  }
}

export default function AdminContentCreatorsPage() {
  const [stats, setStats] = useState<CreatorStats>({
    totalCreators: 0,
    activeCreators: 0,
    publishedContent: 0,
    totalStakedCC: 0,
  });

  const [items, setItems] = useState<CreatorItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [statusOpen, setStatusOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [selectedCreator, setSelectedCreator] = useState<CreatorItem | null>(null);
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
      const res = await apiFetch('/admin/creators/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('[AdminCreators] Stats load error:', err);
    }
  }, []);

  const loadCreators = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search ? { search: search.trim() } : {}),
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      });
      const res = await apiFetch(`/admin/creators?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('[AdminCreators] List load error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadCreators(); }, [loadCreators]);

  const handleToggleCreatorFlag = async (creator: CreatorItem) => {
    setActionLoading(true);
    try {
      const nextFlag = !creator.isCreator;
      const res = await apiFetch(`/admin/users/${creator.id}/flags`, {
        method: 'PATCH',
        body: JSON.stringify({ isCreator: nextFlag }),
      });
      if (res.ok) {
        await Promise.all([loadStats(), loadCreators()]);
        setSelectedCreator(prev => (prev?.id === creator.id ? { ...prev, isCreator: nextFlag } : prev));
      }
    } catch (err) {
      console.error('[AdminCreators] Flag update error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuspension = async (creator: CreatorItem) => {
    setActionLoading(true);
    try {
      const nextStatus = creator.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      const res = await apiFetch(`/admin/users/${creator.id}/suspend`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus, reason: `Admin toggled creator status to ${nextStatus}` }),
      });
      if (res.ok) {
        await Promise.all([loadStats(), loadCreators()]);
        setSelectedCreator(prev => (prev?.id === creator.id ? { ...prev, status: nextStatus } : prev));
      }
    } catch (err) {
      console.error('[AdminCreators] Status update error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col gap-8 bg-background p-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-sans text-[32px] font-bold tracking-tight text-foreground">Content Creators</h1>
        <p className="font-sans text-[14px] text-muted">
          Manage platform media creators, staking reserves, content publishing stats, and account status.
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-5 shadow-sm">
          <span className="text-[13px] font-medium text-muted">Total Creators</span>
          <span className="text-[26px] font-bold text-foreground">{stats.totalCreators.toLocaleString()}</span>
        </div>
        <div className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-5 shadow-sm">
          <span className="text-[13px] font-medium text-muted">Active Creators</span>
          <span className="text-[26px] font-bold text-emerald-400">{stats.activeCreators.toLocaleString()}</span>
        </div>
        <div className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-5 shadow-sm">
          <span className="text-[13px] font-medium text-muted">Published Articles/Videos</span>
          <span className="text-[26px] font-bold text-[#8C5CFF]">{stats.publishedContent.toLocaleString()}</span>
        </div>
        <div className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-5 shadow-sm">
          <span className="text-[13px] font-medium text-muted">Staked Reserves (CC)</span>
          <span className="text-[26px] font-bold text-foreground">{stats.totalStakedCC.toLocaleString()} CC</span>
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
            placeholder="Search creator name, email..."
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
              <th className="py-3.5 px-6">CREATOR</th>
              <th className="py-3.5 px-6">STATUS</th>
              <th className="py-3.5 px-6">PUBLISHED CONTENT</th>
              <th className="py-3.5 px-6">STAKE</th>
              <th className="py-3.5 px-6">TRUST / RISK</th>
              <th className="py-3.5 px-6 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-[13px]">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted">Loading creators...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted">No creators found matching filters.</td>
              </tr>
            ) : (
              items.map(c => (
                <tr key={c.id} className="hover:bg-background/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-[#8C5CFF]/15 font-bold text-[#8C5CFF]">
                        {getInitials(c.displayName || c.username)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{c.displayName || c.username}</span>
                        <span className="text-[11px] text-muted">{c.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${c.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-semibold text-foreground">
                    {c.content?.length || 0} items
                  </td>
                  <td className="py-4 px-6 font-medium text-foreground">
                    {c.creatorStake?.amountCC ? `${c.creatorStake.amountCC} CC` : '0 CC'}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="font-semibold text-emerald-400">T: {c.trustScore}</span>
                      <span className="text-muted">/</span>
                      <span className={`font-semibold ${c.riskScore > 50 ? 'text-red-400' : 'text-foreground/80'}`}>R: {c.riskScore}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedCreator(c)}
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
          <span className="text-muted">Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total creators)</span>
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

      {/* Creator Detail Modal */}
      {selectedCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-[#8C5CFF]/15 font-bold text-[#8C5CFF]">
                  {getInitials(selectedCreator.displayName || selectedCreator.username)}
                </div>
                <div className="flex flex-col">
                  <h2 className="text-[16px] font-bold text-foreground">{selectedCreator.displayName || selectedCreator.username}</h2>
                  <span className="text-[12px] text-muted">{selectedCreator.email}</span>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedCreator(null)} className="text-muted hover:text-foreground text-xl">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[13px]">
              <div className="flex flex-col gap-1 p-3 rounded-xl border border-border bg-background">
                <span className="text-muted text-[11px]">Creator Flag</span>
                <span className="font-bold text-foreground">{selectedCreator.isCreator ? 'Creator Enabled' : 'Standard User'}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-xl border border-border bg-background">
                <span className="text-muted text-[11px]">Account Status</span>
                <span className="font-bold text-foreground">{selectedCreator.status}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-border">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleToggleCreatorFlag(selectedCreator)}
                className="w-full py-2.5 text-[13px] font-semibold rounded-xl border border-[#8C5CFF]/40 bg-[#8C5CFF]/10 text-[#8C5CFF] hover:bg-[#8C5CFF]/20"
              >
                {selectedCreator.isCreator ? 'Disable Creator Status' : 'Enable Creator Status'}
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleToggleSuspension(selectedCreator)}
                className={`w-full py-2.5 text-[13px] font-semibold rounded-xl text-white ${selectedCreator.status === 'ACTIVE' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
              >
                {selectedCreator.status === 'ACTIVE' ? 'Suspend Creator Account' : 'Reactivate Creator Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
