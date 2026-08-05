'use client';

import { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Search,
  ChevronDown,
  Paperclip,
  Send,
  RefreshCw,
  X,
  User,
  Clock,
  Filter,
} from 'lucide-react';

import { apiFetch } from '@/lib/api-client';

export interface AdminTicket {
  id: string;
  ticketNumber: string;
  userId?: string | null;
  email: string;
  category: string;
  subject: string;
  message: string;
  attachmentUrl?: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED';
  adminReply?: string | null;
  adminRepliedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    displayName?: string;
    username?: string;
    email?: string;
  } | null;
}

const STATUSES = ['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Selected Ticket for Reply / View
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [newStatus, setNewStatus] = useState<AdminTicket['status']>('IN_PROGRESS');
  const [isSavingReply, setIsSavingReply] = useState<boolean>(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySuccess, setReplySuccess] = useState<string | null>(null);

  const fetchTickets = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await apiFetch(`/api/admin/support/tickets?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        // Surface the real error so the admin knows what failed
        const msg = data?.message || data?.error || `Request failed (HTTP ${res.status})`;
        setFetchError(`${res.status} — ${msg}`);
        setTickets([]);
        return;
      }

      setTickets(data.tickets || []);
    } catch (err: any) {
      console.error('Failed to fetch admin tickets:', err);
      setFetchError(err?.message || 'Network error — could not reach the API server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleOpenTicket = (t: AdminTicket) => {
    setSelectedTicket(t);
    setReplyText(t.adminReply || '');
    setNewStatus(t.status === 'OPEN' ? 'IN_PROGRESS' : t.status);
    setReplyError(null);
    setReplySuccess(null);
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setReplyError(null);
    setReplySuccess(null);

    if (!replyText.trim()) {
      setReplyError('Please write a reply before saving.');
      return;
    }

    setIsSavingReply(true);
    try {
      const res = await apiFetch(`/api/admin/support/tickets/${selectedTicket.id}/reply`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reply: replyText.trim(),
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save admin reply.');
      }

      setReplySuccess('Reply saved and notification sent to user.');
      setSelectedTicket(data.ticket);
      fetchTickets();
    } catch (err: any) {
      setReplyError(err.message || 'Failed to save reply.');
    } finally {
      setIsSavingReply(false);
    }
  };

  const getStatusBadge = (status: AdminTicket['status']) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#8C5CFF]/15 text-[#8C5CFF] border border-[#8C5CFF]/30">Open</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">In Progress</span>;
      case 'WAITING_FOR_USER':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">Waiting for User</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Resolved</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">Closed</span>;
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Support Tickets Management</h1>
          <p className="text-xs text-muted">Review, reply, and update status for user support complaints</p>
        </div>
        <button
          onClick={fetchTickets}
          className="p-2 rounded-lg bg-card border border-border hover:bg-border/50 text-foreground transition-colors"
          title="Refresh List"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
                selectedStatus === st
                  ? 'bg-[#8C5CFF] text-white shadow-sm shadow-[#8C5CFF]/30'
                  : 'bg-card text-muted hover:text-foreground border border-border'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket # or email..."
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-[#8C5CFF]/60"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-muted pointer-events-none" />
        </form>
      </div>

      {/* Fetch error banner */}
      {fetchError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <span className="mt-0.5 shrink-0">⚠</span>
          <div>
            <p className="font-semibold">Failed to load tickets</p>
            <p className="mt-0.5 text-xs opacity-80">{fetchError}</p>
            <p className="mt-1 text-xs opacity-60">Check the browser console and API server logs for more detail.</p>
          </div>
        </div>
      )}

      {/* Tickets Table / List */}
      <div className="border border-border bg-card rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 opacity-50" />
            <p className="text-xs">Loading support tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-muted space-y-2">
            <LifeBuoy size={32} className="mx-auto text-muted/60" />
            <p className="text-sm font-medium">No tickets match the selected criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-border/20 text-muted uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Ticket Reference</th>
                  <th className="py-3 px-4">User / Email</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-border/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#8C5CFF]">{t.ticketNumber}</td>
                    <td className="py-3.5 px-4 text-foreground">
                      <div className="font-medium">{t.user?.displayName || t.email}</div>
                      <div className="text-[11px] text-muted">{t.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-muted">{t.category}</td>
                    <td className="py-3.5 px-4 text-foreground font-medium max-w-xs truncate">{t.subject}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(t.status)}</td>
                    <td className="py-3.5 px-4 text-muted">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenTicket(t)}
                        className="px-3 py-1.5 bg-[#8C5CFF] hover:bg-[#AC8EF3] text-white font-medium rounded-lg text-[11px] transition-colors"
                      >
                        Manage Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Detail & Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar relative">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>

            <div className="border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-[#8C5CFF]">{selectedTicket.ticketNumber}</span>
                <span className="text-xs text-muted">•</span>
                <span className="text-xs text-muted">{selectedTicket.category}</span>
              </div>
              <h2 className="text-lg font-bold text-foreground mt-1">{selectedTicket.subject}</h2>
              <div className="text-xs text-muted mt-1">Submitted by: <span className="text-foreground">{selectedTicket.email}</span></div>
            </div>

            {/* Original Complaint */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-muted uppercase">User Complaint Description</h4>
              <div className="bg-background border border-border rounded-xl p-4 text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto no-scrollbar">
                {selectedTicket.message}
              </div>
            </div>

            {/* Attachment link */}
            {selectedTicket.attachmentUrl && (
              <div className="flex items-center gap-2">
                <Paperclip size={14} className="text-[#8C5CFF]" />
                <a
                  href={selectedTicket.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#8C5CFF] hover:underline font-medium"
                >
                  View Uploaded Attachment / Screenshot
                </a>
              </div>
            )}

            {/* Admin Reply & Status Form */}
            <form onSubmit={handleSaveReply} className="border-t border-border pt-4 space-y-4">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Support Action & Response
              </h3>

              {replyError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {replyError}
                </div>
              )}

              {replySuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  {replySuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Update Ticket Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AdminTicket['status'])}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-foreground focus:outline-none focus:border-[#8C5CFF]/60"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="WAITING_FOR_USER">Waiting for User</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Admin Response Message</label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write clear response to user..."
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-[#8C5CFF]/60 resize-none no-scrollbar"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-medium text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingReply}
                  className="px-5 py-2 bg-[#8C5CFF] hover:bg-[#AC8EF3] text-white rounded-xl text-xs font-semibold shadow-md shadow-[#8C5CFF]/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{isSavingReply ? 'Saving...' : 'Save Reply & Send Alert'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
