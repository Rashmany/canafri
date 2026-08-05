'use client';

import { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  Upload,
  Send,
  ArrowLeft,
  Paperclip,
  RefreshCw,
} from 'lucide-react';

export interface TicketSummary {
  id: string;
  ticketNumber: string;
  category: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  adminRepliedAt?: string;
}

export interface TicketDetail extends TicketSummary {
  message: string;
  attachmentUrl?: string | null;
  adminReply?: string | null;
}

interface MyTicketsPageProps {
  onBack?: () => void;
  onNavigateToCreate?: () => void;
}

export default function MyTicketsPage({ onBack, onNavigateToCreate }: MyTicketsPageProps) {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

  // Follow-up state when WAITING_FOR_USER
  const [followupMessage, setFollowupMessage] = useState<string>('');
  const [followupFile, setFollowupFile] = useState<File | null>(null);
  const [isSubmittingFollowup, setIsSubmittingFollowup] = useState<boolean>(false);
  const [followupError, setFollowupError] = useState<string | null>(null);

  const fetchMyTickets = async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;
      const res = await fetch('/api/support/my-tickets', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchTicketDetail = async (id: string) => {
    setSelectedTicketId(id);
    setIsDetailLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;
      const res = await fetch(`/api/support/tickets/${id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data.ticket);
      }
    } catch (err) {
      console.error('Failed to fetch ticket detail:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleFollowupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId) return;
    setFollowupError(null);

    if (!followupMessage.trim() && !followupFile) {
      setFollowupError('Please enter a message or attach a file.');
      return;
    }

    setIsSubmittingFollowup(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;
      const formData = new FormData();
      if (followupMessage.trim()) formData.append('message', followupMessage.trim());
      if (followupFile) formData.append('file', followupFile);

      const res = await fetch(`/api/support/tickets/${selectedTicketId}/followup`, {
        method: 'PATCH',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit follow-up.');
      }

      setFollowupMessage('');
      setFollowupFile(null);
      fetchTicketDetail(selectedTicketId);
      fetchMyTickets();
    } catch (err: any) {
      setFollowupError(err.message || 'Failed to submit follow-up.');
    } finally {
      setIsSubmittingFollowup(false);
    }
  };

  const getStatusBadge = (status: TicketSummary['status']) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#8C5CFF]/15 text-[#8C5CFF] border border-[#8C5CFF]/30">
            Open
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
            In Progress
          </span>
        );
      case 'WAITING_FOR_USER':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Waiting for Info
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Resolved
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
            Closed
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col font-sans">
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg bg-[#141414] hover:bg-[#1f1f1f] text-neutral-400 hover:text-white transition-colors"
                title="Back"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">My Support Tickets</h1>
              <p className="text-xs text-neutral-400">Track and manage your submitted support requests</p>
            </div>
          </div>
          <button
            onClick={onNavigateToCreate}
            className="px-3.5 py-2 bg-[#8C5CFF] hover:bg-[#AC8EF3] text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-[#8C5CFF]/20 flex items-center gap-1.5"
          >
            <span>New Ticket</span>
          </button>
        </div>

        {/* Content View: Detail Modal/View vs List View */}
        {selectedTicketId ? (
          /* Detail View */
          <div className="space-y-6">
            <button
              onClick={() => {
                setSelectedTicketId(null);
                setSelectedTicket(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft size={14} />
              <span>Back to ticket list</span>
            </button>

            {isDetailLoading || !selectedTicket ? (
              <div className="py-16 text-center text-neutral-500">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 opacity-50" />
                <p className="text-xs">Loading ticket details...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Ticket Overview Card */}
                <div className="border border-neutral-800 bg-[#111111] rounded-xl p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-800 pb-4">
                    <div>
                      <span className="font-mono text-xs font-semibold text-[#8C5CFF]">
                        {selectedTicket.ticketNumber}
                      </span>
                      <h2 className="text-lg font-semibold text-white mt-0.5">{selectedTicket.subject}</h2>
                      <span className="inline-block mt-1 text-xs text-neutral-400 bg-neutral-900 px-2.5 py-0.5 rounded-full border border-neutral-800">
                        {selectedTicket.category}
                      </span>
                    </div>
                    <div>{getStatusBadge(selectedTicket.status)}</div>
                  </div>

                  {/* Original User Message */}
                  <div>
                    <h4 className="text-xs font-medium text-neutral-400 mb-1.5">Your Original Description</h4>
                    <div className="bg-[#161616] border border-neutral-800 rounded-lg p-4 text-xs sm:text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">
                      {selectedTicket.message}
                    </div>
                  </div>

                  {/* Attachment if present */}
                  {selectedTicket.attachmentUrl && (
                    <div className="flex items-center gap-2 pt-1">
                      <Paperclip size={14} className="text-neutral-400" />
                      <a
                        href={selectedTicket.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#8C5CFF] hover:underline flex items-center gap-1"
                      >
                        <span>View Attachment</span>
                      </a>
                    </div>
                  )}

                  <div className="text-[11px] text-neutral-500 pt-2 border-t border-neutral-900">
                    Created: {new Date(selectedTicket.createdAt).toLocaleString()} | Last Updated: {new Date(selectedTicket.updatedAt).toLocaleString()}
                  </div>
                </div>

                {/* Admin Reply Section */}
                {selectedTicket.adminReply ? (
                  <div className="border border-[#8C5CFF]/30 bg-[#121018] rounded-xl p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#8C5CFF]">Official Support Response</span>
                      {selectedTicket.adminRepliedAt && (
                        <span className="text-[11px] text-neutral-500">
                          {new Date(selectedTicket.adminRepliedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap pt-1">
                      {selectedTicket.adminReply}
                    </p>
                  </div>
                ) : (
                  <div className="border border-neutral-800 bg-[#111] rounded-xl p-4 text-center">
                    <p className="text-xs text-neutral-400">Our support team is reviewing your ticket. You will be notified when a response is posted.</p>
                  </div>
                )}

                {/* Follow-up Form when WAITING_FOR_USER */}
                {selectedTicket.status === 'WAITING_FOR_USER' && (
                  <form onSubmit={handleFollowupSubmit} className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-5 space-y-4">
                    <div>
                      <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                        Action Required: Provide Requested Information
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Our support team needs additional details to solve your issue. Provide the requested information or screenshots below.
                      </p>
                    </div>

                    {followupError && (
                      <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                        {followupError}
                      </div>
                    )}

                    <textarea
                      rows={3}
                      value={followupMessage}
                      onChange={(e) => setFollowupMessage(e.target.value)}
                      placeholder="Type your reply or extra details..."
                      className="w-full bg-[#141414] border border-neutral-800 rounded-lg p-3 text-xs sm:text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,application/pdf"
                        onChange={(e) => setFollowupFile(e.target.files?.[0] || null)}
                        className="text-xs text-neutral-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingFollowup}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Send size={14} />
                        <span>{isSubmittingFollowup ? 'Submitting...' : 'Submit Update'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-16 text-center text-neutral-500">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 opacity-50" />
                <p className="text-xs">Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="border border-neutral-900 bg-[#111111] rounded-xl p-10 text-center space-y-3">
                <LifeBuoy size={36} className="text-neutral-500 mx-auto" />
                <h3 className="text-base font-semibold text-white">No Support Tickets Found</h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  You haven't submitted any support requests yet. If you need help, feel free to open a ticket.
                </p>
                <button
                  onClick={onNavigateToCreate}
                  className="mt-2 px-4 py-2 bg-[#8C5CFF] hover:bg-[#AC8EF3] text-white font-semibold rounded-lg text-xs transition-colors inline-block"
                >
                  Create Support Ticket
                </button>
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => fetchTicketDetail(t.id)}
                  className="border border-neutral-800/80 bg-[#111111] hover:border-neutral-700 rounded-xl p-4 sm:p-5 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#8C5CFF]">{t.ticketNumber}</span>
                      <span className="text-xs text-neutral-500">•</span>
                      <span className="text-xs text-neutral-400">{t.category}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-[#8C5CFF] transition-colors">
                      {t.subject}
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Submitted {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    {getStatusBadge(t.status)}
                    <ChevronRight size={16} className="text-neutral-500 group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
