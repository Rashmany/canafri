'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronUp, ChevronDown, Eye, Clock, FileText } from 'lucide-react';
import { FindJobPageSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Footer from '@/components/layout/footer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Proposal {
  id: number;
  jobTitle: string;
  jobCategory: string;
  clientName: string;
  bidAmount: string;
  status: 'submitted' | 'in_review' | 'accepted' | 'declined';
  date: string;
  coverLetter: string;
  /** true = client has opened the proposal */
  viewed: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 1,
    jobTitle: 'Full Stack Web Developer',
    jobCategory: 'Web Programming & Design',
    clientName: 'John Trek',
    bidAmount: '25 CC/hr',
    status: 'in_review',
    date: '2 days ago',
    viewed: true,
    coverLetter:
      'I have extensive experience building React/Next.js frontends and connecting them to blockchain networks. I would love to build the Canton wallet dashboard for you.',
  },
  {
    id: 2,
    jobTitle: 'Frontend Integration Engineer (Next.js)',
    jobCategory: 'Frontend Dev',
    clientName: 'Sarah Chen',
    bidAmount: '1,500 CC',
    status: 'submitted',
    date: '5 days ago',
    viewed: false,
    coverLetter:
      'I can quickly integrate Tailwind components with Fastify WebSockets for real-time order matching. I am available to start immediately.',
  },
  {
    id: 3,
    jobTitle: 'Senior Daml Smart Contract Developer',
    jobCategory: 'Smart Contracts',
    clientName: 'Alex Rivera',
    bidAmount: '50 CC/hr',
    status: 'accepted',
    date: '1 week ago',
    viewed: true,
    coverLetter:
      'Expert Daml developer ready to write secure multi-party agreements and asset tokenization contracts on the Canton network.',
  },
];

// ─── Status pill helpers ───────────────────────────────────────────────────────

const STATUS_LABEL: Record<Proposal['status'], string> = {
  submitted:  'Submitted',
  in_review:  'In Review',
  accepted:   'Accepted',
  declined:   'Declined',
};

const STATUS_PILL: Record<Proposal['status'], string> = {
  submitted:  'bg-[#EBE5FA] dark:bg-[#291D46] text-primary',
  in_review:  'bg-[#3d3210] text-[#FBBF24]',
  accepted:   'bg-[#304437] text-[#4ADE80]',
  declined:   'bg-[#3d1212] text-[#F87171]',
};

// ─── Client avatar ────────────────────────────────────────────────────────────
// Fixed avatar background colour for all profile placeholders
const AVATAR_BG = 'bg-[#291D46]';

function getAvatarColour(_name: string) {
  return AVATAR_BG;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Proposal Card ────────────────────────────────────────────────────────────

function FreelancerProposalCard({ proposal }: { proposal: Proposal }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border-t border-border flex gap-4 items-start px-4 py-6 w-full last:rounded-b-2xl transition-colors">

      {/* Client Avatar */}
      <div className={cn(
        'flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full text-[14px] font-semibold text-white',
        getAvatarColour(proposal.clientName),
      )}>
        {getInitials(proposal.clientName)}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 min-w-0">

        {/* Row 1 — Job title + status badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-foreground/90 leading-[18px]">
            {proposal.jobTitle}
          </span>
          <span className={cn(
            'flex items-center justify-center px-[8px] py-[3px] rounded-[3px] text-[10px] font-normal whitespace-nowrap',
            STATUS_PILL[proposal.status],
          )}>
            {STATUS_LABEL[proposal.status]}
          </span>
        </div>

        {/* Row 2 — Client name + category */}
        <p className="text-[13px] font-normal leading-[20px] text-foreground/70">
          {proposal.clientName}
        </p>
        <p className="text-[13px] font-medium text-muted leading-[18px]">
          {proposal.jobCategory}
        </p>

        {/* Row 3 — Bid + date */}
        <div className="flex items-center gap-6 text-[13px] font-medium text-muted whitespace-nowrap">
          <span>
            <span className="text-foreground/80 font-semibold">Bid:</span>{' '}
            {proposal.bidAmount}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} className="shrink-0" />
            Submitted {proposal.date}
          </span>
        </div>

        {/* Row 4 — Cover letter (expandable) */}
        {proposal.coverLetter && (
          <>
            <p className={cn(
              'text-[13px] font-normal leading-[20px] text-foreground/80 transition-all duration-200',
              !expanded && 'line-clamp-2',
            )}>
              <span className="font-semibold">Cover Letter: </span>
              {proposal.coverLetter}
            </p>
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-[11px] text-primary cursor-pointer self-start"
            >
              {expanded
                ? <><ChevronUp size={12} /> Less</>
                : <><ChevronDown size={12} /> Read more</>}
            </button>
          </>
        )}

        {/* Divider */}
        <div className="h-px w-full bg-border" />

        {/* Footer — viewed indicator only, no action buttons */}
        <div className="flex items-center justify-end">
          {proposal.viewed ? (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#4ADE80] bg-[#304437] px-3 py-[5px] rounded-full">
              <Eye size={11} />
              Viewed
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted bg-foreground/[0.06] px-3 py-[5px] rounded-full">
              <Clock size={11} />
              Awaiting review
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProposalsPageProps {
  onBack?: () => void;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProposalsPage({ onBack }: ProposalsPageProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'archived'>('all');

  const [proposals] = useState<Proposal[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('canafri_submitted_proposals');
      if (stored) {
        try {
          // Merge stored proposals; add viewed=false and category if missing
          const parsed: Partial<Proposal>[] = JSON.parse(stored);
          return parsed.map((p, i) => ({
            id: p.id ?? i + 100,
            jobTitle: p.jobTitle ?? 'Untitled Job',
            jobCategory: p.jobCategory ?? 'General',
            clientName: p.clientName ?? 'Unknown Client',
            bidAmount: p.bidAmount ?? '—',
            status: (p.status as Proposal['status']) ?? 'submitted',
            date: p.date ?? 'recently',
            coverLetter: p.coverLetter ?? '',
            viewed: p.viewed ?? false,
          }));
        } catch (e) {
          console.error(e);
        }
      }
    }
    return MOCK_PROPOSALS;
  });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <FindJobPageSkeleton />;

  const filteredProposals = proposals.filter(p => {
    if (activeTab === 'active')   return p.status === 'submitted' || p.status === 'in_review';
    if (activeTab === 'archived') return p.status === 'accepted'  || p.status === 'declined';
    return true;
  });

  const TAB_LABELS: { key: 'all' | 'active' | 'archived'; label: string }[] = [
    { key: 'all',      label: 'All' },
    { key: 'active',   label: 'Active' },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-y-auto no-scrollbar">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-background px-6 py-5 shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-foreground transition-colors cursor-pointer"
            title="Back"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        <div>
          <h1 className="text-foreground/80 text-lg font-semibold leading-7">My Proposals</h1>
          <p className="text-muted text-[11px] leading-4">
            Track your submitted bids and see if clients have reviewed them
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 sm:px-6 py-6 flex flex-col gap-6 max-w-[860px] w-full mx-auto">

        {/* Tab bar */}
        <div className="flex border-b border-border gap-6">
          {TAB_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'pb-2 text-[13px] font-semibold capitalize transition-all border-b-2',
                activeTab === key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Card list */}
        {filteredProposals.length > 0 ? (
          <div className="flex flex-col rounded-2xl overflow-hidden border border-card-border">
            {filteredProposals.map(proposal => (
              <FreelancerProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="text-muted/40 mb-3 size-10" />
            <p className="text-[13px] font-medium text-foreground">No proposals found</p>
            <p className="text-[11px] text-muted mt-1">
              You haven&apos;t submitted any proposals in this category yet.
            </p>
          </div>
        )}
      </div>
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
