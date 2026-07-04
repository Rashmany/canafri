'use client';

import { useState, useEffect } from 'react';
import { Briefcase, ChevronLeft, Clock, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { FindJobPageSkeleton } from '@/components/ui/skeleton';

interface Proposal {
  id: number;
  jobTitle: string;
  clientName: string;
  bidAmount: string;
  status: 'submitted' | 'in_review' | 'accepted' | 'declined';
  date: string;
  coverLetter: string;
}

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 1,
    jobTitle: 'Full Stack Web Developer',
    clientName: 'John Trek',
    bidAmount: '25 CC/hr',
    status: 'in_review',
    date: '2 days ago',
    coverLetter: 'I have extensive experience building React/Next.js frontends and connecting them to blockchain networks. I would love to build the Canton wallet dashboard for you.'
  },
  {
    id: 2,
    jobTitle: 'Frontend Integration Engineer (Next.js)',
    clientName: 'Sarah Chen',
    bidAmount: '1,500 CC',
    status: 'submitted',
    date: '5 days ago',
    coverLetter: 'I can quickly integrate Tailwind components with Fastify WebSockets for real-time order matching. I am available to start immediately.'
  },
  {
    id: 3,
    jobTitle: 'Senior Daml Smart Contract Developer',
    clientName: 'Alex Rivera',
    bidAmount: '50 CC/hr',
    status: 'accepted',
    date: '1 week ago',
    coverLetter: 'Expert Daml developer ready to write secure multi-party agreements and asset tokenization contracts on the Canton network.'
  }
];

interface ProposalsPageProps {
  onBack?: () => void;
}

export default function ProposalsPage({ onBack }: ProposalsPageProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'archived'>('all');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <FindJobPageSkeleton />;

  const filteredProposals = MOCK_PROPOSALS.filter(p => {
    if (activeTab === 'active') return p.status === 'submitted' || p.status === 'in_review';
    if (activeTab === 'archived') return p.status === 'accepted' || p.status === 'declined';
    return true;
  });

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-background px-6 py-5 shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-foreground transition-colors"
              title="Back"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <div>
            <h1 className="text-[#010101] dark:text-white text-lg font-semibold leading-7">
              My Proposals
            </h1>
            <p className="text-muted text-[11px] leading-4">
              Track and manage your submitted bids and proposals
            </p>
          </div>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-6 max-w-[800px] w-full mx-auto">
        <div className="flex border-b border-border gap-6">
          {(['all', 'active', 'archived'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-semibold capitalize transition-all border-b-2 ${
                activeTab === tab
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {tab} Proposals
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {filteredProposals.length > 0 ? (
            filteredProposals.map((proposal) => (
              <div
                key={proposal.id}
                className="flex flex-col gap-4 p-5 rounded-2xl border border-border bg-card hover:border-[#8C5CFF]/30 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[14px] font-semibold text-foreground">{proposal.jobTitle}</h3>
                    <p className="text-[11px] text-muted">Client: {proposal.clientName} • Bid: {proposal.bidAmount}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${
                      proposal.status === 'accepted'
                        ? 'bg-green-500/10 text-green-500'
                        : proposal.status === 'in_review'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : proposal.status === 'declined'
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {proposal.status === 'accepted'
                      ? 'Accepted'
                      : proposal.status === 'in_review'
                      ? 'In Review'
                      : proposal.status === 'declined'
                      ? 'Declined'
                      : 'Submitted'}
                  </span>
                </div>

                <p className="text-sm text-foreground/80 leading-relaxed font-sans italic bg-background/50 p-3 rounded-lg border border-border/40">
                  "{proposal.coverLetter}"
                </p>

                <div className="flex items-center gap-2 text-[10px] text-muted">
                  <Clock size={12} />
                  <span>Submitted {proposal.date}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="text-muted/40 mb-3 size-12" />
              <p className="text-sm font-medium text-foreground">No proposals found</p>
              <p className="text-xs text-muted">You haven't submitted any proposals in this category yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
