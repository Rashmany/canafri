'use client';

import { useState, useMemo } from 'react';
import { Check, Clock, Globe, Link2, ChevronLeft, Eye, X, FileText, ExternalLink, AlertTriangle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type DisputeStatus = 'Open' | 'Resolved';

interface DisputeEvidence {
  id: string;
  name: string;
  type: 'pdf' | 'link';
}

interface DisputeInfo {
  id: number;
  jobId: string;
  title: string;
  jobTitle: string;
  escrowAmount: number; // in CC
  milestoneText: string;
  raisedAgo: string;
  
  // Client details
  clientName: string;
  clientHandle: string;
  clientTrustScore: number;
  clientStatement: string;
  
  // Freelancer details
  freelancerName: string;
  freelancerHandle: string;
  freelancerTrustScore: number;
  freelancerStatement: string;

  evidence: DisputeEvidence[];
  status: DisputeStatus;
  initialSplitClient: number; // percentage (0 - 100)
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_DISPUTES: DisputeInfo[] = [
  {
    id: 1,
    jobId: '#CF-3421',
    title: 'DeFi logo — Emeka vs Jane',
    jobTitle: 'Design a logo for a Canton DeFi project',
    escrowAmount: 200,
    milestoneText: 'Milestone 2 of 3',
    raisedAgo: 'Raised 2 days ago',
    
    clientName: 'Emeka Okoye',
    clientHandle: '@emeka_ok',
    clientTrustScore: 91,
    clientStatement: 'The delivered logo does not match the brief. I asked for a minimalist design and received something overly complex with colours I did not approve.',
    
    freelancerName: 'Jane Doe',
    freelancerHandle: '@janedoe_design',
    freelancerTrustScore: 94,
    freelancerStatement: 'I delivered exactly what was requested across 3 revision rounds. All feedback was incorporated. Client approved milestone 1 with the same style direction.',
    
    evidence: [
      { id: 'ev1', name: 'logo-brief-minimalist.pdf', type: 'pdf' },
      { id: 'ev2', name: 'revision-rounds-screenshots.pdf', type: 'pdf' },
      { id: 'ev3', name: 'figma-design-workspace-link', type: 'link' },
    ],
    status: 'Open',
    initialSplitClient: 40,
  },
  {
    id: 2,
    jobId: '#CF-8842',
    title: 'Smart Contract — DevPro vs Alice',
    jobTitle: 'Audit and deploy Canton ERC20 Bridge',
    escrowAmount: 500,
    milestoneText: 'Final Milestone',
    raisedAgo: 'Raised 5 hours ago',
    
    clientName: 'Alice Vance',
    clientHandle: '@alice_v',
    clientTrustScore: 88,
    clientStatement: 'The smart contract deployment failed on testnet and has a critical vulnerability in the lock-and-unlock logic. The developer is refusing to fix it without extra payment.',
    
    freelancerName: 'DevPro Labs',
    freelancerHandle: '@devpro_labs',
    freelancerTrustScore: 97,
    freelancerStatement: 'The contract was compiled and passed local hardhat suite. The issue Alice is facing is due to incorrect gas limits set on her client node config, not contract code.',
    
    evidence: [
      { id: 'ev4', name: 'hardhat-test-results.pdf', type: 'pdf' },
      { id: 'ev5', name: 'bridge-contract-code.pdf', type: 'pdf' },
    ],
    status: 'Open',
    initialSplitClient: 50,
  },
  {
    id: 3,
    jobId: '#CF-1209',
    title: 'DApp UI — DesignPro vs Bob',
    jobTitle: 'UI Design for Canton DEX dashboard',
    escrowAmount: 1000,
    milestoneText: 'Milestone 1 of 2',
    raisedAgo: 'Resolved 3 days ago',
    
    clientName: 'Bob Builder',
    clientHandle: '@bob_builds',
    clientTrustScore: 95,
    clientStatement: 'Design was generic and copied templates.',
    
    freelancerName: 'DesignPro',
    freelancerHandle: '@designpro_agency',
    freelancerTrustScore: 92,
    freelancerStatement: 'Design was bespoke. Completed revisions.',
    
    evidence: [],
    status: 'Resolved',
    initialSplitClient: 20,
  }
];

// ─── Document Preview Modal ──────────────────────────────────────────────────

function DocumentPreviewModal({
  file,
  onClose,
}: {
  file: DisputeEvidence;
  onClose: () => void;
}) {
  const isPdf = file.type === 'pdf';
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 md:p-8"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#8C5CFF]/10">
              {isPdf
                ? <FileText size={15} className="text-[#8C5CFF]" strokeWidth={1.5} />
                : <ExternalLink size={15} className="text-[#8C5CFF]" strokeWidth={1.5} />
              }
            </div>
            <p className="font-sans text-[0.875rem] font-semibold text-foreground truncate">{file.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 flex size-8 shrink-0 items-center justify-center rounded-lg text-[#A0A0A0] transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar p-8 items-center justify-center">
          {isPdf ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative w-40">
                <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-xl border border-border bg-foreground/5" />
                <div className="relative flex flex-col rounded-xl border border-border bg-card p-4 shadow-lg">
                  <div className="flex h-3 w-16 items-center justify-center rounded bg-[#8C5CFF]/25 mb-3" />
                  {[70, 85, 60, 40].map((w, i) => (
                    <div key={i} className="mb-2 h-1 rounded-full bg-foreground/8" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>
              <p className="font-sans text-[0.875rem] font-medium text-white">{file.name}</p>
              <p className="font-sans text-[0.75rem] text-[#A0A0A0]">
                Dispute evidence document preview.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#8C5CFF]/15 border border-[#8C5CFF]/20">
                <Link2 size={20} className="text-[#8C5CFF]" />
              </div>
              <p className="font-sans text-[0.875rem] font-medium text-white">{file.name}</p>
              <p className="font-sans text-[0.75rem] text-[#A0A0A0]">Submitted external link reference.</p>
            </div>
          )}
          <a
            href="#"
            onClick={e => e.preventDefault()}
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

// ─── Evidence Row ────────────────────────────────────────────────────────────

function EvidenceRow({
  file,
  onPreview,
}: {
  file: DisputeEvidence;
  onPreview: (file: DisputeEvidence) => void;
}) {
  const Icon = file.type === 'pdf' ? Globe : Link2;
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

// ─── Request Evidence Modal ──────────────────────────────────────────────────

function RequestEvidenceModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (msg: string) => void;
}) {
  const [msg, setMsg] = useState('');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-md flex-col rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="font-sans text-[1rem] font-bold text-white">Request More Evidence</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#A0A0A0] hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3 mt-4">
          <p className="font-sans text-[0.8125rem] text-[#A0A0A0] leading-relaxed">
            Specify the type of document, logs, or screenshots you require both parties to upload next.
          </p>
          <textarea
            value={msg}
            onChange={e => setMsg(e.target.value)}
            placeholder="e.g. Please provide high-resolution screen recordings of the deployment workflow or full compilation logs..."
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
            disabled={!msg.trim()}
            onClick={() => onSubmit(msg)}
            className="flex-1 rounded-xl bg-[#8C5CFF] hover:bg-[#AC8EF3] py-2.5 font-sans text-[0.8125rem] font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Resolution View ──────────────────────────────────────────────────

interface DetailViewProps {
  dispute: DisputeInfo;
  onBack?: () => void;
}

function DetailView({ dispute, onBack }: DetailViewProps) {
  const [previewFile, setPreviewFile] = useState<DisputeEvidence | null>(null);
  const [splitClient, setSplitClient] = useState<number>(dispute.initialSplitClient);
  const [resolved, setResolved]       = useState<'executed' | 'requested' | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceMsg, setEvidenceMsg] = useState('');

  // Escrow value calculations based on dynamic split
  const clientCC = ((splitClient / 100) * dispute.escrowAmount).toFixed(1);
  const freelancerCC = (((100 - splitClient) / 100) * dispute.escrowAmount).toFixed(1);

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      {previewFile && (
        <DocumentPreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
      {showEvidenceModal && (
        <RequestEvidenceModal
          onClose={() => setShowEvidenceModal(false)}
          onSubmit={(msg) => {
            setEvidenceMsg(msg);
            setResolved('requested');
            setShowEvidenceModal(false);
          }}
        />
      )}

      {/* Mobile back link */}
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

        {/* Header summary block */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-[#0b0b0b] p-5 flex flex-col gap-3">
            <h3 className="font-sans text-[0.9375rem] font-semibold text-white">
              {dispute.jobTitle}
            </h3>
            <div className="grid grid-cols-4 gap-4 pt-1">
              <div>
                <p className="font-sans text-[0.625rem] text-[#A0A0A0] uppercase tracking-wider">Job ID</p>
                <p className="font-sans text-[0.8125rem] font-medium text-white/80 mt-1">{dispute.jobId}</p>
              </div>
              <div>
                <p className="font-sans text-[0.625rem] text-[#A0A0A0] uppercase tracking-wider">Escrow</p>
                <p className="font-sans text-[0.8125rem] font-semibold text-[#8C5CFF] mt-1">{dispute.escrowAmount} CC</p>
              </div>
              <div>
                <p className="font-sans text-[0.625rem] text-[#A0A0A0] uppercase tracking-wider">Milestone</p>
                <p className="font-sans text-[0.8125rem] font-medium text-white/80 mt-1">{dispute.milestoneText}</p>
              </div>
              <div>
                <p className="font-sans text-[0.625rem] text-[#A0A0A0] uppercase tracking-wider">Raised</p>
                <p className="font-sans text-[0.8125rem] font-medium text-white/80 mt-1">{dispute.raisedAgo}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Parties claims */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Client Statement */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[0.75rem] font-semibold text-[#A0A0A0] uppercase tracking-wider">Client</span>
              <span className="font-sans text-[0.6875rem] text-[#A0A0A0]">Trust score {dispute.clientTrustScore}</span>
            </div>
            <div className="flex items-center gap-2.5 mt-1">
              <div className="size-6 rounded-full bg-[#8C5CFF]/20 flex items-center justify-center font-sans text-[0.625rem] font-bold text-[#8C5CFF]">
                {dispute.clientName.charAt(0)}
              </div>
              <span className="font-sans text-[0.8125rem] font-semibold text-white">{dispute.clientName}</span>
            </div>
            <p className="font-sans text-[0.8125rem] text-foreground/70 leading-[1.6] mt-2 bg-[#080808] p-3 rounded-lg border border-border/40">
              &ldquo;{dispute.clientStatement}&rdquo;
            </p>
          </div>

          {/* Freelancer Statement */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[0.75rem] font-semibold text-[#A0A0A0] uppercase tracking-wider">Freelancer</span>
              <span className="font-sans text-[0.6875rem] text-[#A0A0A0]">Trust score {dispute.freelancerTrustScore}</span>
            </div>
            <div className="flex items-center gap-2.5 mt-1">
              <div className="size-6 rounded-full bg-[#4ADE80]/20 flex items-center justify-center font-sans text-[0.625rem] font-bold text-[#4ADE80]">
                {dispute.freelancerName.charAt(0)}
              </div>
              <span className="font-sans text-[0.8125rem] font-semibold text-white">{dispute.freelancerName}</span>
            </div>
            <p className="font-sans text-[0.8125rem] text-foreground/70 leading-[1.6] mt-2 bg-[#080808] p-3 rounded-lg border border-border/40">
              &ldquo;{dispute.freelancerStatement}&rdquo;
            </p>
          </div>
        </div>

        {/* Evidence list */}
        <div className="flex flex-col gap-3">
          <h3 className="font-sans text-[0.875rem] font-semibold text-foreground">Evidence Submitted</h3>
          {dispute.evidence.length === 0 ? (
            <p className="font-sans text-[0.8125rem] text-[#A0A0A0] rounded-xl border border-border bg-card p-4">
              No dispute evidence files submitted.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {dispute.evidence.map(f => (
                <EvidenceRow key={f.id} file={f} onPreview={setPreviewFile} />
              ))}
            </div>
          )}
        </div>

        {/* Interactive Split Resolution Control */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
          <h3 className="font-sans text-[0.875rem] font-semibold text-foreground">Resolution</h3>
          <p className="font-sans text-[0.75rem] text-[#A0A0A0]">
            Set CC split for milestone {dispute.milestoneText.split(' ')[1]} ({dispute.escrowAmount} CC)
          </p>

          <div className="flex flex-col gap-5 mt-2">
            {/* Value Indicators */}
            <div className="flex gap-4">
              <div className="flex-1 rounded-xl bg-foreground/[0.02] border border-border p-4 flex flex-col gap-1 items-center">
                <span className="font-sans text-[0.6875rem] text-[#A0A0A0] uppercase font-medium">Client Refund</span>
                <span className="font-sans text-[1.25rem] font-bold text-white mt-1">{splitClient}%</span>
                <span className="font-sans text-[0.6875rem] text-[#8C5CFF] font-medium">{clientCC} CC</span>
              </div>
              <div className="flex-1 rounded-xl bg-foreground/[0.02] border border-border p-4 flex flex-col gap-1 items-center">
                <span className="font-sans text-[0.6875rem] text-[#A0A0A0] uppercase font-medium">Freelancer Payout</span>
                <span className="font-sans text-[1.25rem] font-bold text-white mt-1">{100 - splitClient}%</span>
                <span className="font-sans text-[0.6875rem] text-[#4ADE80] font-medium">{freelancerCC} CC</span>
              </div>
            </div>

            {/* Range Slider Control */}
            <div className="flex flex-col gap-3 py-1">
              <input
                type="range"
                min="0"
                max="100"
                value={splitClient}
                onChange={e => setSplitClient(parseInt(e.target.value))}
                disabled={resolved !== null || dispute.status === 'Resolved'}
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
        {resolved === null && dispute.status === 'Open' ? (
          <div className="flex gap-3 pt-2 pb-4">
            <button
              type="button"
              onClick={() => setShowEvidenceModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/5 text-[#8C5CFF] px-4 py-3 font-sans text-[0.875rem] font-semibold transition-all active:scale-[0.98] cursor-pointer"
            >
              Request More Evidence
            </button>
            <button
              type="button"
              onClick={() => setResolved('executed')}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#8C5CFF] px-5 py-3 font-sans text-[0.875rem] font-semibold text-white transition-all hover:bg-[#AC8EF3] active:scale-[0.98] shadow-lg shadow-[#8C5CFF]/25 cursor-pointer"
            >
              <Check size={16} strokeWidth={2.5} />
              Execute Resolution
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-4">
            <div className={`flex items-center gap-2.5 rounded-xl border px-5 py-3.5 font-sans text-[0.8125rem] font-medium ${resolved === 'executed' || dispute.status === 'Resolved' ? 'border-[#4ADE80]/30 bg-[#4ADE80]/8 text-[#4ADE80]' : 'border-[#8C5CFF]/30 bg-[#8C5CFF]/8 text-[#8C5CFF]'}`}>
              {resolved === 'executed' || dispute.status === 'Resolved' ? (
                <>
                  <Check size={16} strokeWidth={2.5} />
                  <span>Resolution executed: <strong>{splitClient}% Client / {100 - splitClient}% Freelancer</strong> split applied successfully.</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>Request for more evidence (&ldquo;<strong className="text-white">{evidenceMsg}</strong>&rdquo;) sent to both parties. Active timer holds payout.</span>
                </>
              )}
              {dispute.status === 'Open' && (
                <button
                  type="button"
                  onClick={() => { setResolved(null); setEvidenceMsg(''); }}
                  className="ml-auto font-sans text-[0.6875rem] underline opacity-70 hover:opacity-100 transition-opacity cursor-pointer whitespace-nowrap"
                >
                  Undo Action
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Dispute Sidebar List Item ───────────────────────────────────────────────

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
        <p className={`font-sans text-[0.8125rem] font-semibold leading-[18px] truncate ${selected ? 'text-foreground' : 'text-foreground/80'}`}>
          {dispute.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-sans text-[0.6875rem] text-[#8C5CFF] font-medium leading-[14px]">
            {dispute.escrowAmount} CC
          </span>
          <span className="text-[#A0A0A0]/40 text-[0.5rem] select-none">&#9679;</span>
          <span className="font-sans text-[0.6875rem] text-[#A0A0A0] leading-[14px] truncate">
            {dispute.jobId}
          </span>
        </div>
      </div>
      <span className="shrink-0 font-sans text-[0.625rem] text-[#A0A0A0] whitespace-nowrap align-self-start mt-0.5">
        {dispute.raisedAgo.replace('Raised ', '')}
      </span>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDisputesPage() {
  const [activeTab, setActiveTab]   = useState<DisputeStatus>('Open');
  const [selectedId, setSelectedId] = useState<number>(1);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  const visibleDisputes = MOCK_DISPUTES.filter(d => d.status === activeTab);
  const openCount = MOCK_DISPUTES.filter(d => d.status === 'Open').length;
  const selected = MOCK_DISPUTES.find(d => d.id === selectedId) ?? MOCK_DISPUTES[0];

  const handleSelect = (id: number) => {
    setSelectedId(id);
    setMobileView('detail');
  };

  return (
    <div className="flex h-full w-full overflow-hidden">

      {/* ── Sidebar list panel ── */}
      <aside className={[
        'flex h-full w-full flex-col border-r border-border bg-card shrink-0',
        'md:w-[300px] lg:w-[320px]',
        mobileView === 'detail' ? 'hidden md:flex' : 'flex',
      ].join(' ')}>

        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h1 className="font-sans text-[1.125rem] font-bold text-foreground">Disputes</h1>
        </div>

        {/* Sidebar tabs */}
        <div className="flex shrink-0 items-center gap-1 px-4 py-2.5 border-b border-border bg-[#080808]/30">
          <div className="flex items-center gap-1 bg-[#080808] border border-border p-1 rounded-xl shadow-inner w-full">
            {(['Open', 'Resolved'] as DisputeStatus[]).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); setSelectedId(MOCK_DISPUTES.find(d => d.status === tab)?.id ?? selectedId); }}
                className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-1 rounded-lg font-sans text-[0.6875rem] font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-[#8C5CFF] text-white shadow'
                    : 'text-[#A0A0A0] hover:text-white'
                }`}
              >
                {tab === 'Open' ? 'Open' : 'Resolved'}
                {tab === 'Open' && (
                  <span className={`flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 font-sans text-[9px] font-bold ${
                    activeTab === 'Open' ? 'bg-white/20 text-white' : 'bg-border text-[#A0A0A0]'
                  }`}>
                    {openCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar list items */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {visibleDisputes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
              <p className="font-sans text-[0.8125rem] text-[#A0A0A0]">No {activeTab.toLowerCase()} disputes</p>
            </div>
          ) : (
            visibleDisputes.map(dispute => (
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

      {/* ── Detail Panel ── */}
      <main className={[
        'flex h-full min-w-0 flex-1 flex-col bg-background',
        mobileView === 'list' ? 'hidden md:flex' : 'flex',
      ].join(' ')}>

        {/* Header title */}
        <div className="flex shrink-0 items-center border-b border-border px-6 py-4 gap-3">
          <h2 className="font-sans text-[1.125rem] font-bold text-foreground">Dispute Resolution</h2>
          <span className={`rounded-full px-2.5 py-0.5 font-sans text-[0.6875rem] font-semibold ${selected?.status === 'Open' ? 'bg-[#8C5CFF]/10 border border-[#8C5CFF]/20 text-[#8C5CFF]' : 'bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80]'}`}>
            {selected?.status}
          </span>
        </div>

        {selected ? (
          <DetailView
            dispute={selected}
            onBack={() => setMobileView('list')}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="font-sans text-[0.875rem] text-[#A0A0A0]">Select a dispute from the sidebar</p>
          </div>
        )}
      </main>

    </div>
  );
}
