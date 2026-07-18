'use client';

import { useState } from 'react';
import { ChevronLeft, Check, X, FileText, Edit3, Trash2, CheckCircle2, User } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SubmissionTab = 'Pending' | 'Flagged' | 'Recent';
type PublishStatus = 'Pending' | 'Approved' | 'Rejected' | 'Revision Requested';

interface ReviewSubmission {
  id: number;
  title: string;
  creatorName: string;
  creatorHandle: string;
  creatorTrustScore: number;
  type: string;
  submittedAgo: string;
  wordCount: string;
  readTime: string;
  category: string;
  plagiarismStatus: 'Passed' | 'Failed';
  imageCount: number;
  linksText: string;
  creatorPublishedCount: number;
  creatorRejectedCount: number;
  creatorAvgRating: string;
  contentBody: string;
  tab: SubmissionTab;
  status: PublishStatus;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SUBMISSIONS: ReviewSubmission[] = [
  {
    id: 1,
    title: 'Understanding CC Staking Rewards',
    creatorName: 'John Trek',
    creatorHandle: '@johntrek',
    creatorTrustScore: 94,
    type: 'Premium',
    submittedAgo: '2 hours ago',
    wordCount: '1,240',
    readTime: '6 min',
    category: 'Education',
    plagiarismStatus: 'Passed',
    imageCount: 2,
    linksText: '3 external',
    creatorPublishedCount: 24,
    creatorRejectedCount: 1,
    creatorAvgRating: '4.8 stars',
    contentBody: `Canton Coin staking is one of the most misunderstood mechanics on the network. In this guide, we break down exactly how staking rewards are calculated, why they exist, and how everyday users can participate without running their own infrastructure.

When a subscriber stakes CC to continue reading premium content, that action itself becomes a transaction recorded on Canton's ledger. The more genuine engagement an app generates, the larger its share of network rewards becomes...`,
    tab: 'Pending',
    status: 'Pending',
  },
  {
    id: 2,
    title: 'Advanced Canton Smart Contracts',
    creatorName: 'John Trek',
    creatorHandle: '@johntrek',
    creatorTrustScore: 94,
    type: 'Premium',
    submittedAgo: '3 hours ago',
    wordCount: '2,150',
    readTime: '11 min',
    category: 'Development',
    plagiarismStatus: 'Passed',
    imageCount: 4,
    linksText: '5 external',
    creatorPublishedCount: 24,
    creatorRejectedCount: 1,
    creatorAvgRating: '4.8 stars',
    contentBody: `Exploring state synchronization mechanisms, cross-shard call latency, and formal verification frameworks on Canton ledger. This guide provides deep-dive examples of contract optimization and gas safety rules.`,
    tab: 'Pending',
    status: 'Pending',
  },
  {
    id: 3,
    title: 'Introduction to Tokenomics',
    creatorName: 'John Trek',
    creatorHandle: '@johntrek',
    creatorTrustScore: 94,
    type: 'Free',
    submittedAgo: '5 hours ago',
    wordCount: '850',
    readTime: '4 min',
    category: 'Economics',
    plagiarismStatus: 'Passed',
    imageCount: 1,
    linksText: '1 external',
    creatorPublishedCount: 24,
    creatorRejectedCount: 1,
    creatorAvgRating: '4.8 stars',
    contentBody: `A beginner-friendly guide covering token supply curves, inflation mechanisms, and community reward incentives. Learn how CC maintains value stability under network operations.`,
    tab: 'Pending',
    status: 'Pending',
  },
  {
    id: 4,
    title: 'CC Yield Farming Strategies',
    creatorName: 'John Trek',
    creatorHandle: '@johntrek',
    creatorTrustScore: 94,
    type: 'Premium',
    submittedAgo: '1 day ago',
    wordCount: '1,650',
    readTime: '8 min',
    category: 'Finance',
    plagiarismStatus: 'Failed',
    imageCount: 3,
    linksText: '6 external',
    creatorPublishedCount: 24,
    creatorRejectedCount: 1,
    creatorAvgRating: '4.8 stars',
    contentBody: `High yield farming tutorial containing references to suspicious external smart contracts. The submission was automatically flagged by security scanning for auditing.`,
    tab: 'Flagged',
    status: 'Pending',
  },
  {
    id: 5,
    title: 'Canton Mainnet Roadmap 2026',
    creatorName: 'John Trek',
    creatorHandle: '@johntrek',
    creatorTrustScore: 94,
    type: 'Premium',
    submittedAgo: '2 days ago',
    wordCount: '980',
    readTime: '5 min',
    category: 'News',
    plagiarismStatus: 'Passed',
    imageCount: 2,
    linksText: '2 external',
    creatorPublishedCount: 25,
    creatorRejectedCount: 1,
    creatorAvgRating: '4.8 stars',
    contentBody: `Official release schedule outlining the migration roadmap, mainnet rewards launch, and technical prerequisites for Canton validation nodes. Already approved and visible.`,
    tab: 'Recent',
    status: 'Approved',
  }
];

// ─── Modal Components ─────────────────────────────────────────────────────────

function ActionFeedbackModal({
  title,
  subtitle,
  placeholder,
  actionLabel,
  onClose,
  onSubmit,
}: {
  title: string;
  subtitle: string;
  placeholder: string;
  actionLabel: string;
  onClose: () => void;
  onSubmit: (msg: string) => void;
}) {
  const [feedback, setFeedback] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative flex w-full max-w-md flex-col rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="font-sans text-[1rem] font-bold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="text-[#A0A0A0] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3 mt-4">
          <p className="font-sans text-[0.8125rem] text-[#A0A0A0] leading-relaxed">{subtitle}</p>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder={placeholder}
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
            disabled={!feedback.trim()}
            onClick={() => onSubmit(feedback)}
            className="flex-1 rounded-xl bg-[#8C5CFF] hover:bg-[#AC8EF3] py-2.5 font-sans text-[0.8125rem] font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Review Panel ──────────────────────────────────────────────────────

interface DetailViewProps {
  submission: ReviewSubmission;
  onBack?: () => void;
  onStatusChange: (id: number, status: PublishStatus, note?: string) => void;
}

function DetailView({ submission, onBack, onStatusChange }: DetailViewProps) {
  const [modalType, setModalType] = useState<'reject' | 'revision' | null>(null);

  const handleAction = (status: PublishStatus, note?: string) => {
    onStatusChange(submission.id, status, note);
    setModalType(null);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      {/* Mobile back link */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-5 pt-4 pb-2 font-sans text-[0.8125rem] text-[#8C5CFF] hover:text-[#AC8EF3] transition-colors md:hidden"
        >
          <ChevronLeft size={16} />
          Back to list
        </button>
      )}

      {/* Action Modals */}
      {modalType === 'reject' && (
        <ActionFeedbackModal
          title="Reject Submission"
          subtitle="Describe the policy violations or quality issues so the creator knows why this was rejected."
          placeholder="e.g. This article contains plagiarism or inappropriate marketing links..."
          actionLabel="Reject Submission"
          onClose={() => setModalType(null)}
          onSubmit={(note) => handleAction('Rejected', note)}
        />
      )}
      {modalType === 'revision' && (
        <ActionFeedbackModal
          title="Request Revision"
          subtitle="List the specific edits or additions needed before publishing."
          placeholder="e.g. Please clarify milestone staking rewards and fix typo in paragraph 2..."
          actionLabel="Request Revision"
          onClose={() => setModalType(null)}
          onSubmit={(note) => handleAction('Revision Requested', note)}
        />
      )}

      <div className="flex flex-col gap-6 px-6 py-5">
        {/* Actions bar at top of detail */}
        {submission.status === 'Pending' ? (
          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={() => setModalType('reject')}
              className="flex-1 min-w-[120px] rounded-xl border border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/5 text-[#8C5CFF] px-4 py-2.5 font-sans text-[0.8125rem] font-semibold transition-all active:scale-[0.98]"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => setModalType('revision')}
              className="flex-1 min-w-[120px] rounded-xl border border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/5 text-[#8C5CFF] px-4 py-2.5 font-sans text-[0.8125rem] font-semibold transition-all active:scale-[0.98]"
            >
              Request Edit
            </button>
            <button
              type="button"
              onClick={() => handleAction('Approved')}
              className="flex-1 min-w-[150px] rounded-xl bg-[#8C5CFF] hover:bg-[#AC8EF3] px-5 py-2.5 font-sans text-[0.8125rem] font-semibold text-white transition-all active:scale-[0.98] shadow-lg shadow-[#8C5CFF]/25"
            >
              Approve and Publish
            </button>
          </div>
        ) : (
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 font-sans text-[0.8125rem] font-medium ${submission.status === 'Approved' ? 'border-[#4ADE80]/30 bg-[#4ADE80]/10 text-[#4ADE80]' : 'border-border bg-foreground/5 text-foreground/70'}`}>
            {submission.status === 'Approved' ? (
              <><CheckCircle2 size={16} /> Content Published successfully.</>
            ) : (
              <><X size={16} /> Submission processed as: <strong>{submission.status}</strong></>
            )}
            <button
              type="button"
              onClick={() => handleAction('Pending')}
              className="ml-auto font-sans text-[0.6875rem] underline opacity-70 hover:opacity-100 transition-opacity"
            >
              Undo Action
            </button>
          </div>
        )}

        {/* Creator metadata */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-4 py-4 border-y border-border">
            <div className="text-center">
              <p className="font-sans text-[0.625rem] text-[#A0A0A0] uppercase tracking-wider">Creator</p>
              <p className="font-sans text-[0.8125rem] font-semibold text-white mt-1">{submission.creatorName}</p>
            </div>
            <div className="text-center">
              <p className="font-sans text-[0.625rem] text-[#A0A0A0] uppercase tracking-wider">Trust Score</p>
              <p className="font-sans text-[0.8125rem] font-semibold text-white mt-1">{submission.creatorTrustScore}</p>
            </div>
            <div className="text-center">
              <p className="font-sans text-[0.625rem] text-[#A0A0A0] uppercase tracking-wider">Type</p>
              <p className="font-sans text-[0.8125rem] font-semibold text-white mt-1">{submission.type}</p>
            </div>
            <div className="text-center">
              <p className="font-sans text-[0.625rem] text-[#A0A0A0] uppercase tracking-wider">Submitted</p>
              <p className="font-sans text-[0.8125rem] font-semibold text-[#8C5CFF] mt-1">{submission.submittedAgo}</p>
            </div>
          </div>
        </div>

        {/* Article title & Body content */}
        <div className="flex flex-col gap-4 bg-card rounded-xl border border-border p-5">
          <h2 className="font-sans text-[1.125rem] font-bold text-white leading-snug">
            {submission.title}
          </h2>
          <div className="font-sans text-[0.875rem] text-foreground/80 leading-[1.65] whitespace-pre-wrap pt-2">
            {submission.contentBody}
          </div>
        </div>

        {/* Professional Information 1 */}
        <div className="flex flex-col gap-3">
          <h3 className="font-sans text-[0.875rem] font-semibold text-foreground">Professional Information</h3>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {[
              { label: 'Word count', value: submission.wordCount },
              { label: 'Read time', value: submission.readTime },
              { label: 'Category', value: submission.category },
              { label: 'Image count', value: submission.imageCount },
              { label: 'Links', value: submission.linksText }
            ].map((row, i) => (
              <div key={row.label} className={`flex justify-between items-center px-5 py-3 text-[0.8125rem] ${i > 0 ? 'border-t border-border/40' : ''}`}>
                <span className="text-[#A0A0A0]">{row.label}</span>
                <span className="text-white font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Professional Information 2 (History stats) */}
        <div className="flex flex-col gap-3">
          <h3 className="font-sans text-[0.875rem] font-semibold text-foreground">Creator Performance Profile</h3>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {[
              { label: 'Published pieces', value: `${submission.creatorPublishedCount} pieces` },
              { label: 'Rejected pieces', value: `${submission.creatorRejectedCount} piece` },
              { label: 'Avg rating', value: submission.creatorAvgRating }
            ].map((row, i) => (
              <div key={row.label} className={`flex justify-between items-center px-5 py-3 text-[0.8125rem] ${i > 0 ? 'border-t border-border/40' : ''}`}>
                <span className="text-[#A0A0A0]">{row.label}</span>
                <span className="text-white font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Main Review Queue Component ──────────────────────────────────────────────

export default function AdminReviewQueuePage() {
  const [submissions, setSubmissions] = useState<ReviewSubmission[]>(MOCK_SUBMISSIONS);
  const [activeTab, setActiveTab]     = useState<SubmissionTab>('Pending');
  const [selectedId, setSelectedId]   = useState<number>(1);
  const [mobileView, setMobileView]   = useState<'list' | 'detail'>('list');

  const visibleList = submissions.filter(s => s.tab === activeTab);
  const pendingCount = submissions.filter(s => s.tab === 'Pending').length;
  const selected = submissions.find(s => s.id === selectedId) ?? submissions[0];

  const handleSelect = (id: number) => {
    setSelectedId(id);
    setMobileView('detail');
  };

  const handleStatusChange = (id: number, status: PublishStatus, note?: string) => {
    setSubmissions(prev => prev.map(s => {
      if (s.id !== id) return s;
      return {
        ...s,
        status,
        tab: status === 'Pending' ? s.tab : 'Recent' // Approved/Rejected goes to Recent or tab updates
      };
    }));
  };

  return (
    <div className="flex h-full w-full overflow-hidden">

      {/* ── Left Sidebar list ── */}
      <aside className={[
        'flex h-full w-full flex-col border-r border-border bg-card shrink-0',
        'md:w-[300px] lg:w-[320px]',
        mobileView === 'detail' ? 'hidden md:flex' : 'flex',
      ].join(' ')}>

        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h1 className="font-sans text-[1.125rem] font-bold text-foreground">Review Queue</h1>
        </div>

        {/* Sidebar tabs */}
        <div className="flex shrink-0 items-center gap-1 px-4 py-2.5 border-b border-border bg-[#080808]/30">
          <div className="flex items-center gap-1 bg-[#080808] border border-border p-1 rounded-xl shadow-inner w-full">
            {(['Pending', 'Flagged', 'Recent'] as SubmissionTab[]).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); setSelectedId(submissions.find(s => s.tab === tab)?.id ?? selectedId); }}
                className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-1 rounded-lg font-sans text-[0.6875rem] font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-[#8C5CFF] text-white shadow'
                    : 'text-[#A0A0A0] hover:text-white'
                }`}
              >
                {tab}
                {tab === 'Pending' && (
                  <span className={`flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 font-sans text-[9px] font-bold ${
                    activeTab === 'Pending' ? 'bg-white/20 text-white' : 'bg-border text-[#A0A0A0]'
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions List */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {visibleList.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
              <p className="font-sans text-[0.8125rem] text-[#A0A0A0]">No {activeTab.toLowerCase()} submissions</p>
            </div>
          ) : (
            visibleList.map(sub => (
              <button
                key={sub.id}
                type="button"
                onClick={() => handleSelect(sub.id)}
                className={[
                  'flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition-colors',
                  selectedId === sub.id
                    ? 'bg-[#8C5CFF]/8 border-l-2 border-l-[#8C5CFF]'
                    : 'hover:bg-foreground/[0.02]',
                ].join(' ')}
              >
                <div className="size-8 shrink-0 flex items-center justify-center rounded-full bg-[#8C5CFF]/10 text-[#8C5CFF] font-sans text-[0.6875rem] font-semibold">
                  <User size={12} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className={`font-sans text-[0.8125rem] font-semibold leading-[18px] truncate ${selectedId === sub.id ? 'text-foreground' : 'text-foreground/80'}`}>
                    {sub.title}
                  </p>
                  <p className="font-sans text-[0.6875rem] text-[#A0A0A0] leading-[14px] mt-0.5 truncate">
                    {sub.creatorName}
                  </p>
                </div>
                <span className="shrink-0 font-sans text-[0.625rem] text-[#A0A0A0] whitespace-nowrap align-self-start mt-0.5">
                  {sub.submittedAgo.replace(' ago', '')}
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── Right details Panel ── */}
      <main className={[
        'flex h-full min-w-0 flex-1 flex-col bg-background',
        mobileView === 'list' ? 'hidden md:flex' : 'flex',
      ].join(' ')}>

        <div className="flex shrink-0 items-center border-b border-border px-6 py-4 gap-3">
          <h2 className="font-sans text-[1.125rem] font-bold text-foreground">Editorial Review</h2>
          <span className="rounded-full bg-[#8C5CFF]/10 border border-[#8C5CFF]/20 px-2.5 py-0.5 font-sans text-[0.6875rem] font-semibold text-[#8C5CFF]">
            Review Queue
          </span>
        </div>

        {selected ? (
          <DetailView
            submission={selected}
            onBack={() => setMobileView('list')}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="font-sans text-[0.875rem] text-[#A0A0A0]">Select a submission to review</p>
          </div>
        )}
      </main>

    </div>
  );
}
