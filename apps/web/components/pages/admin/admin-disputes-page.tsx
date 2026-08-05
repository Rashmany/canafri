'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, Clock, ChevronLeft, Eye, X, FileText, Link2, ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

// --- Types ---

type DisputeStatus = 'Open' | 'Resolved';

interface DisputeEvidenceItem {
  id: string;
  name: string;
  type: 'pdf' | 'link';
  url: string;
}

interface DisputeInfo {
  id: string;
  jobId: string;
  jobRef: string;
  title: string;
  jobTitle: string;
  escrowAmount: number;
  milestoneText: string;
  raisedAgo: string;

  clientId: string;
  clientName: string;
  clientHandle: string;
  clientTrustScore: number;
  clientStatement: string;

  freelancerId: string;
  freelancerName: string;
  freelancerHandle: string;
  freelancerTrustScore: number;
  freelancerStatement: string;

  evidence: DisputeEvidenceItem[];
  status: DisputeStatus;
  clientPct: number;
  freelancerPct: number;
  resolution: string | null;
  resolvedAt: string | null;
}

// --- API ---

const API = '/api';

function getToken() {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('canafri_admin_access_token') ||
    localStorage.getItem('canafri_access_token') ||
    ''
  );
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  return fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(opts.headers ?? {}),
    },
  });
}

// --- Document Preview Modal ---

function DocumentPreviewModal({
  file,
  onClose,
}: {
  file: DisputeEvidenceItem;
  onClose: () => void;
}) {
  const isPdf = file.type === 'pdf';
  const isAbsoluteUrl = file.url?.startsWith('http');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 md:p-8"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#8C5CFF]/10">
              {isPdf ? (
                <FileText size={15} className="text-[#8C5CFF]" strokeWidth={1.5} />
              ) : (
                <ExternalLink size={15} className="text-[#8C5CFF]" strokeWidth={1.5} />
              )}
            </div>
            <p className="font-sans text-[0.875rem] font-semibold text-foreground truncate">
              {file.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 flex size-8 shrink-0 items-center justify-center rounded-lg text-[#A0A0A0] transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar p-8 items-center justify-center">
          {isPdf ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative w-40">
                <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-xl border border-border bg-foreground/5" />
                <div className="relative flex flex-col rounded-xl border border-border bg-card p-4 shadow-lg">
                  <div className="flex h-3 w-16 items-center justify-center rounded bg-[#8C5CFF]/25 mb-3" />
                  {[70, 85, 60, 40].map((w, i) => (
                    <div
                      key={i}
                      className="mb-2 h-1 rounded-full bg-foreground/8"
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
              </div>
              <p className="font-sans text-[0.875rem] font-medium text-foreground">{file.name}</p>
              <p className="font-sans text-[0.75rem] text-[#A0A0A0]">
                Dispute evidence document.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#8C5CFF]/15 border border-[#8C5CFF]/20">
                <Link2 size={20} className="text-[#8C5CFF]" />
              </div>
              <p className="font-sans text-[0.875rem] font-medium text-foreground">{file.name}</p>
              <p className="font-sans text-[0.75rem] text-[#A0A0A0]">Submitted external link reference.</p>
            </div>
          )}
          <a
            href={isAbsoluteUrl ? file.url : '#'}
            target={isAbsoluteUrl ? '_blank' : undefined}
            rel="noopener noreferrer"
            onClick={!isAbsoluteUrl ? (e) => e.preventDefault() : undefined}
            className="mt-6 flex items-center gap-2 rounded-xl bg-[#8C5CFF] px-5 py-2.5 font-sans text-[0.8125rem] font-semibold text-white transition-all hover:bg-[#AC8EF3]"
          >
            <ExternalLink size={14} />
            Open Source Document
          </a>
        </div>
      </div>
    </div>
  );
}

// --- Evidence Row ---

function EvidenceRow({
  file,
  onPreview,
}: {
  file: DisputeEvidenceItem;
  onPreview: (file: DisputeEvidenceItem) => void;
}) {
  const Icon = file.type === 'pdf' ? FileText : Link2;
  return (
    <div className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-[#8C5CFF]/25 hover:bg-[#8C5CFF]/[0.02]">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#8C5CFF]/10">
        <Icon size={16} className="text-[#8C5CFF]" strokeWidth={1.5} />
      </div>
      <span className="font-sans text-[0.8125rem] text-foreground/80 truncate flex-1">
        {file.name}
      </span>
      <button
        type="button"
        onClick={() => onPreview(file)}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/5 text-[#8C5CFF] px-3 py-1.5 font-sans text-[0.6875rem] font-semibold transition-all active:scale-[0.98]"
      >
        <Eye size={12} strokeWidth={2} />
        Preview
      </button>
    </div>
  );
}

// --- Request Evidence Modal ---

function RequestEvidenceModal({
  onClose,
  onSubmit,
  loading,
}: {
  onClose: () => void;
  onSubmit: (msg: string) => void;
  loading: boolean;
}) {
  const [msg, setMsg] = useState('');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-md flex-col rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="font-sans text-[1rem] font-bold text-foreground">
            Request More Evidence
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#A0A0A0] hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3 mt-4">
          <p className="font-sans text-[0.8125rem] text-[#A0A0A0] leading-relaxed">
            Specify the type of document, logs, or screenshots you require both parties to upload.
            Both parties will be notified instantly.
          </p>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="e.g. Please provide screen recordings of the deployment workflow or full compilation logs..."
            className="w-full h-32 rounded-xl bg-[#080808] border border-border p-3.5 font-sans text-[0.8125rem] text-foreground focus:border-[#8C5CFF] focus:outline-none placeholder-foreground/30 resize-none"
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
            disabled={!msg.trim() || loading}
            onClick={() => onSubmit(msg)}
            className="flex-1 rounded-xl bg-[#8C5CFF] hover:bg-[#AC8EF3] py-2.5 font-sans text-[0.8125rem] font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Detail Resolution View ---

interface DetailViewProps {
  dispute: DisputeInfo;
  onBack?: () => void;
  onResolve: (id: string, clientPct: number) => Promise<void>;
  onRequestEvidence: (id: string, message: string) => Promise<void>;
  actionLoading: boolean;
}

function DetailView({
  dispute,
  onBack,
  onResolve,
  onRequestEvidence,
  actionLoading,
}: DetailViewProps) {
  const [previewFile, setPreviewFile] = useState<DisputeEvidenceItem | null>(null);
  const [splitClient, setSplitClient] = useState<number>(Math.round((dispute.clientPct ?? 0.5) * 100));
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [localResolved, setLocalResolved] = useState<boolean>(
    dispute.status === 'Resolved'
  );

  useEffect(() => {
    setSplitClient(Math.round((dispute.clientPct ?? 0.5) * 100));
    setLocalResolved(dispute.status === 'Resolved');
  }, [dispute.id, dispute.status, dispute.clientPct]);

  const clientCC = ((splitClient / 100) * dispute.escrowAmount).toFixed(1);
  const freelancerCC = (((100 - splitClient) / 100) * dispute.escrowAmount).toFixed(1);

  const handleExecute = async () => {
    await onResolve(dispute.id, splitClient);
    setLocalResolved(true);
  };

  const handleEvidenceSubmit = async (msg: string) => {
    await onRequestEvidence(dispute.id, msg);
    setShowEvidenceModal(false);
  };

  const isResolved = localResolved || dispute.status === 'Resolved';

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      {previewFile && (
        <DocumentPreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
      {showEvidenceModal && (
        <RequestEvidenceModal
          onClose={() => setShowEvidenceModal(false)}
          onSubmit={handleEvidenceSubmit}
          loading={actionLoading}
        />
      )}

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-5 pt-4 pb-2 font-sans text-[0.8125rem] text-[#8C5CFF] hover:text-[#AC8EF3] transition-colors md:hidden"
        >
          <ChevronLeft size={16} />
          Back to disputes
        </button>
      )}

      <div className="flex flex-col gap-6 px-6 py-5">

        {/* Summary block */}
        <div className="rounded-xl border border-border bg-[#0b0b0b] p-5 flex flex-col gap-3">
          <h3 className="font-sans text-[0.9375rem] font-semibold text-foreground">
            {dispute.jobTitle}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
            <div>
              <p className="font-sans text-[0.625rem] text-[#A0A0A0] uppercase tracking-wider">
                Job Ref
              </p>
              <p className="font-sans text-[0.8125rem] font-medium text-foreground/80 mt-1">
                {dispute.jobRef}
              </p>
            </div>
            <div>
              <p className="font-sans text-[0.625rem] text-[#A0A0A0] uppercase tracking-wider">
                Escrow
              </p>
              <p className="font-sans text-[0.8125rem] font-semibold text-[#8C5CFF] mt-1">
                {dispute.escrowAmount} CC
              </p>
            </div>
            <div>
              <p className="font-sans text-[0.625rem] text-[#A0A0A0] uppercase tracking-wider">
                Milestone
              </p>
              <p className="font-sans text-[0.8125rem] font-medium text-foreground/80 mt-1">
                {dispute.milestoneText}
              </p>
            </div>
            <div>
              <p className="font-sans text-[0.625rem] text-[#A0A0A0] uppercase tracking-wider">
                Raised
              </p>
              <p className="font-sans text-[0.8125rem] font-medium text-foreground/80 mt-1">
                {dispute.raisedAgo}
              </p>
            </div>
          </div>
        </div>

        {/* Party statements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[0.75rem] font-semibold text-[#A0A0A0] uppercase tracking-wider">
                Client
              </span>
              <span className="font-sans text-[0.6875rem] text-[#A0A0A0]">
                Trust score {dispute.clientTrustScore}
              </span>
            </div>
            <div className="flex items-center gap-2.5 mt-1">
              <div className="size-6 rounded-full bg-[#8C5CFF]/20 flex items-center justify-center font-sans text-[0.625rem] font-bold text-[#8C5CFF]">
                {dispute.clientName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="font-sans text-[0.8125rem] font-semibold text-foreground">
                  {dispute.clientName}
                </span>
                <span className="font-sans text-[0.6875rem] text-[#A0A0A0] ml-2">
                  {dispute.clientHandle}
                </span>
              </div>
            </div>
            <p className="font-sans text-[0.8125rem] text-foreground/70 leading-[1.6] mt-2 bg-[#080808] p-3 rounded-lg border border-border/40">
              &ldquo;{dispute.clientStatement}&rdquo;
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[0.75rem] font-semibold text-[#A0A0A0] uppercase tracking-wider">
                Freelancer
              </span>
              <span className="font-sans text-[0.6875rem] text-[#A0A0A0]">
                Trust score {dispute.freelancerTrustScore}
              </span>
            </div>
            <div className="flex items-center gap-2.5 mt-1">
              <div className="size-6 rounded-full bg-[#4ADE80]/20 flex items-center justify-center font-sans text-[0.625rem] font-bold text-[#4ADE80]">
                {dispute.freelancerName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="font-sans text-[0.8125rem] font-semibold text-foreground">
                  {dispute.freelancerName}
                </span>
                <span className="font-sans text-[0.6875rem] text-[#A0A0A0] ml-2">
                  {dispute.freelancerHandle}
                </span>
              </div>
            </div>
            <p className="font-sans text-[0.8125rem] text-foreground/70 leading-[1.6] mt-2 bg-[#080808] p-3 rounded-lg border border-border/40">
              &ldquo;{dispute.freelancerStatement}&rdquo;
            </p>
          </div>
        </div>

        {/* Evidence */}
        <div className="flex flex-col gap-3">
          <h3 className="font-sans text-[0.875rem] font-semibold text-foreground">
            Evidence Submitted
          </h3>
          {dispute.evidence.length === 0 ? (
            <p className="font-sans text-[0.8125rem] text-[#A0A0A0] rounded-xl border border-border bg-card p-4">
              No dispute evidence files submitted.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {dispute.evidence.map((f) => (
                <EvidenceRow key={f.id} file={f} onPreview={setPreviewFile} />
              ))}
            </div>
          )}
        </div>

        {/* Resolution Control */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
          <h3 className="font-sans text-[0.875rem] font-semibold text-foreground">Resolution</h3>
          <p className="font-sans text-[0.75rem] text-[#A0A0A0]">
            Set CC split for {dispute.milestoneText} ({dispute.escrowAmount} CC total)
          </p>
          <div className="flex flex-col gap-5 mt-2">
            <div className="flex gap-4">
              <div className="flex-1 rounded-xl bg-foreground/[0.02] border border-border p-4 flex flex-col gap-1 items-center">
                <span className="font-sans text-[0.6875rem] text-[#A0A0A0] uppercase font-medium">
                  Client Refund
                </span>
                <span className="font-sans text-[1.25rem] font-bold text-foreground mt-1">
                  {splitClient}%
                </span>
                <span className="font-sans text-[0.6875rem] text-[#8C5CFF] font-medium">
                  {clientCC} CC
                </span>
              </div>
              <div className="flex-1 rounded-xl bg-foreground/[0.02] border border-border p-4 flex flex-col gap-1 items-center">
                <span className="font-sans text-[0.6875rem] text-[#A0A0A0] uppercase font-medium">
                  Freelancer Payout
                </span>
                <span className="font-sans text-[1.25rem] font-bold text-foreground mt-1">
                  {100 - splitClient}%
                </span>
                <span className="font-sans text-[0.6875rem] text-[#4ADE80] font-medium">
                  {freelancerCC} CC
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 py-1">
              <input
                type="range"
                min="0"
                max="100"
                value={splitClient}
                onChange={(e) => setSplitClient(parseInt(e.target.value))}
                disabled={isResolved}
                className="w-full accent-[#8C5CFF] bg-[#1a1a1a] rounded-lg appearance-none h-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-[0.625rem] font-medium text-[#A0A0A0] px-0.5">
                <span>0% Client / 100% Freelancer</span>
                <span>50/50 Split</span>
                <span>100% Client / 0% Freelancer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {!isResolved ? (
          <div className="flex gap-3 pt-2 pb-4">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setShowEvidenceModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/5 text-[#8C5CFF] px-4 py-3 font-sans text-[0.875rem] font-semibold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40"
            >
              <Clock size={15} />
              Request More Evidence
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleExecute}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#8C5CFF] px-5 py-3 font-sans text-[0.875rem] font-semibold text-white transition-all hover:bg-[#AC8EF3] active:scale-[0.98] shadow-lg shadow-[#8C5CFF]/25 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Check size={16} strokeWidth={2.5} />
              )}
              Execute Resolution
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center gap-2.5 rounded-xl border border-[#4ADE80]/30 bg-[#4ADE80]/8 text-[#4ADE80] px-5 py-3.5 font-sans text-[0.8125rem] font-medium">
              <Check size={16} strokeWidth={2.5} />
              <span>
                Resolution executed:{' '}
                <strong>
                  {Math.round(dispute.clientPct * 100)}% Client / {Math.round(dispute.freelancerPct * 100)}% Freelancer
                </strong>{' '}
                split applied.
                {dispute.resolvedAt && (
                  <span className="text-[#4ADE80]/60 ml-2 text-[0.6875rem]">
                    {new Date(dispute.resolvedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </span>
            </div>
            {dispute.resolution && (
              <p className="font-sans text-[0.75rem] text-[#A0A0A0] px-1">
                {dispute.resolution}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Dispute List Item ---

function DisputeListItem({
  dispute,
  selected,
  onClick,
}: {
  dispute: DisputeInfo;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition-colors',
        selected
          ? 'bg-[#8C5CFF]/8 border-l-2 border-l-[#8C5CFF]'
          : 'hover:bg-foreground/[0.02]',
      ].join(' ')}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <p
          className={`font-sans text-[0.8125rem] font-semibold leading-[18px] truncate ${
            selected ? 'text-foreground' : 'text-foreground/80'
          }`}
        >
          {dispute.jobTitle}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-sans text-[0.6875rem] text-[#8C5CFF] font-medium leading-[14px]">
            {dispute.escrowAmount} CC
          </span>
          <span className="text-[#A0A0A0]/40 text-[0.5rem] select-none">&#9679;</span>
          <span className="font-sans text-[0.6875rem] text-[#A0A0A0] leading-[14px] truncate">
            {dispute.jobRef}
          </span>
        </div>
      </div>
      <span className="shrink-0 font-sans text-[0.625rem] text-[#A0A0A0] whitespace-nowrap mt-0.5">
        {dispute.raisedAgo.replace('Raised ', '')}
      </span>
    </button>
  );
}

// --- Main Page ---

export default function AdminDisputesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<DisputeStatus>('Open');
  const [disputes, setDisputes] = useState<DisputeInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/admin/disputes');
      if (!res.ok) {
        toast('Failed to load disputes.', 'error');
        return;
      }
      const data = await res.json();
      if (Array.isArray(data.disputes)) {
        setDisputes(data.disputes);
        setSelectedId((prev) => {
          if (!prev && data.disputes.length > 0) {
            const firstOpen =
              data.disputes.find((d: DisputeInfo) => d.status === 'Open') ??
              data.disputes[0];
            return firstOpen.id;
          }
          return prev;
        });
      }
    } catch {
      toast('Network error loading disputes.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const handleResolve = async (id: string, clientPct: number) => {
    setActionLoading(true);
    try {
      // Backend expects decimals (0.0–1.0) and requires freelancerPct + resolution string
      const clientDec     = parseFloat((clientPct / 100).toFixed(4));
      const freelancerDec = parseFloat(((100 - clientPct) / 100).toFixed(4));
      const resolutionNote = `Admin resolved: ${clientPct}% to client, ${100 - clientPct}% to freelancer.`;

      const res = await apiFetch(`/admin/disputes/${id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({
          clientPct:     clientDec,
          freelancerPct: freelancerDec,
          resolution:    resolutionNote,
        }),
      });
      if (res.ok) {
        toast(
          `Dispute resolved — ${clientPct}% Client / ${100 - clientPct}% Freelancer split executed.`,
          'success'
        );
        await loadDisputes();
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.message || 'Failed to resolve dispute.', 'error');
      }
    } catch {
      toast('Network error resolving dispute.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestEvidence = async (id: string, message: string) => {
    setActionLoading(true);
    try {
      const res = await apiFetch(`/admin/disputes/${id}/request-evidence`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      if (res.ok) {
        toast('Evidence request sent to both parties.', 'success');
        await loadDisputes();
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.message || 'Failed to send evidence request.', 'error');
      }
    } catch {
      toast('Network error sending evidence request.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const visibleDisputes = disputes.filter((d) => d.status === activeTab);
  const openCount = disputes.filter((d) => d.status === 'Open').length;
  const selected = disputes.find((d) => d.id === selectedId) ?? disputes[0];

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileView('detail');
  };

  return (
    <div className="flex h-full w-full overflow-hidden">

      {/* Sidebar */}
      <aside
        className={[
          'flex h-full w-full flex-col border-r border-border bg-card shrink-0',
          'md:w-[300px] lg:w-[320px]',
          mobileView === 'detail' ? 'hidden md:flex' : 'flex',
        ].join(' ')}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h1 className="font-sans text-[1.125rem] font-bold text-foreground">Disputes</h1>
          <button
            type="button"
            onClick={loadDisputes}
            disabled={loading}
            className="flex size-7 items-center justify-center rounded-lg text-[#A0A0A0] hover:bg-foreground/5 hover:text-foreground transition-colors disabled:opacity-40"
            aria-label="Refresh disputes"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1 px-4 py-2.5 border-b border-border bg-[#080808]/30">
          <div className="flex items-center gap-1 bg-[#080808] border border-border p-1 rounded-xl shadow-inner w-full">
            {(['Open', 'Resolved'] as DisputeStatus[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  const first = disputes.find((d) => d.status === tab);
                  if (first) setSelectedId(first.id);
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-1 rounded-lg font-sans text-[0.6875rem] font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-[#8C5CFF] text-white shadow'
                    : 'text-[#A0A0A0] hover:text-white'
                }`}
              >
                {tab}
                {tab === 'Open' && (
                  <span
                    className={`flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 font-sans text-[9px] font-bold ${
                      activeTab === 'Open'
                        ? 'bg-white/20 text-white'
                        : 'bg-border text-[#A0A0A0]'
                    }`}
                  >
                    {openCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="flex flex-col gap-2 p-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-foreground/5 animate-pulse" />
              ))}
            </div>
          ) : visibleDisputes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
              <AlertTriangle size={24} className="text-[#A0A0A0]/40" />
              <p className="font-sans text-[0.8125rem] text-[#A0A0A0]">
                No {activeTab.toLowerCase()} disputes
              </p>
            </div>
          ) : (
            visibleDisputes.map((dispute) => (
              <DisputeListItem
                key={dispute.id}
                dispute={dispute}
                selected={selectedId === dispute.id}
                onClick={() => handleSelect(dispute.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Detail Panel */}
      <main
        className={[
          'flex h-full min-w-0 flex-1 flex-col bg-background',
          mobileView === 'list' ? 'hidden md:flex' : 'flex',
        ].join(' ')}
      >
        <div className="flex shrink-0 items-center border-b border-border px-6 py-4 gap-3">
          <h2 className="font-sans text-[1.125rem] font-bold text-foreground">
            Dispute Resolution
          </h2>
          <span
            className={`rounded-full px-2.5 py-0.5 font-sans text-[0.6875rem] font-semibold ${
              selected?.status === 'Open'
                ? 'bg-[#8C5CFF]/10 border border-[#8C5CFF]/20 text-[#8C5CFF]'
                : 'bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80]'
            }`}
          >
            {selected?.status ?? 'No selection'}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-1 flex-col gap-5 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-foreground/5 animate-pulse" />
            ))}
          </div>
        ) : selected ? (
          <DetailView
            key={selected.id}
            dispute={selected}
            onBack={() => setMobileView('list')}
            onResolve={handleResolve}
            onRequestEvidence={handleRequestEvidence}
            actionLoading={actionLoading}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center flex-col gap-3">
            <AlertTriangle size={32} className="text-[#A0A0A0]/30" />
            <p className="font-sans text-[0.875rem] text-[#A0A0A0]">
              Select a dispute from the sidebar
            </p>
          </div>
        )}
      </main>

    </div>
  );
}
