'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronUp, ChevronDown,
  Archive, Star, Bookmark, UserPlus, CheckCircle2, Send, MessageSquare, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Footer from '@/components/layout/footer';

interface ReviewProposalsPageProps {
  onBack?: () => void;
  onNavigateToMessages?: (recipientId?: string) => void;
}

// ─── Data types ───────────────────────────────────────────────────────────────

interface FreelancerCard {
  id: string | number;
  freelancerId: string;
  name: string;
  username: string;
  title: string;
  location: string;
  rate: string;
  rateCCNum: number;
  deliveryDays: number;
  earned: string;
  rating: number;
  reviews: number;
  badge?: string;
  badgeColor?: 'green' | 'blue';
  coverLetter?: string;
  approach?: string;
  answers?: string[];
  skills: string[];
  status?: string;
  statusColor?: 'green' | 'purple' | 'amber' | 'red';
  hiredDate?: string;
  inviteSentDate?: string;
}

// ─── ProposalCard ─────────────────────────────────────────────────────────────

function ProposalCard({
  card,
  mode,
  isSaved,
  isArchived,
  onToggleSave,
  onToggleArchive,
  onCancelInvite,
  onMessage,
  onHire,
  hiring,
}: {
  card: FreelancerCard;
  mode: 'proposals' | 'invite' | 'hired';
  isSaved: boolean;
  isArchived: boolean;
  onToggleSave: (id: string | number) => void;
  onToggleArchive: (id: string | number) => void;
  onCancelInvite?: (id: string | number) => void;
  onMessage?: (card: FreelancerCard) => void;
  onHire?: (card: FreelancerCard) => void;
  hiring?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showApproach, setShowApproach] = useState(false);

  const statusPill: Record<string, string> = {
    green: 'bg-[#304437] text-[#4ADE80]',
    purple: 'bg-[#291D46] text-[#8C5CFF]',
    amber: 'bg-[#3d3210] text-[#FBBF24]',
    red: 'bg-[#3d1212] text-[#F87171]',
  };

  const initials = card.name
    .trim()
    .split(/\s+/)
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-[#FAFAFD] dark:bg-[#0b0b0b] border-t border-[#E2E2E2] dark:border-[#242424] flex gap-4 items-start px-4 py-6 min-w-[700px] md:min-w-0 w-full last:rounded-b-2xl transition-colors">
      {/* Avatar */}
      <div className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full bg-[#291D46] text-white text-[14px] font-semibold select-none">
        {initials}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 min-w-0">
        {/* Name + badge + rating */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-semibold text-foreground/90 whitespace-nowrap">{card.name}</span>
          <span className="text-[12px] text-muted">(@{card.username})</span>

          {card.badge && (
            <span className={cn(
              'flex items-center justify-center px-[8px] py-[3px] rounded-[3px] text-[10px] font-normal whitespace-nowrap',
              card.badgeColor === 'green' ? 'bg-[#304437] text-[#4ADE80]' : 'bg-[#EBE5FA] dark:bg-[#291D46] text-primary',
            )}>
              {card.badge}
            </span>
          )}

          {card.status && (
            <span className={cn(
              'flex items-center justify-center px-[8px] py-[3px] rounded-[3px] text-[10px] font-normal whitespace-nowrap',
              statusPill[card.statusColor ?? 'purple'],
            )}>
              {card.status}
            </span>
          )}

          <div className="flex items-center gap-1 ml-auto">
            <Star size={11} className="text-[#DAC95A] fill-[#DAC95A]" />
            <span className="text-[11px] font-medium text-foreground/80">{card.rating}</span>
            <span className="text-[10px] text-muted">Trust Score</span>
          </div>
        </div>

        {/* Title & location */}
        <p className="text-[13px] font-normal leading-[20px] text-foreground/80">{card.title}</p>
        <p className="text-[13px] font-medium text-muted leading-[18px]">{card.location}</p>

        {/* Rate + delivery timeline */}
        <div className="flex items-center gap-6 text-[13px] font-medium text-muted whitespace-nowrap">
          <span><strong className="text-foreground/90 font-semibold">Bid:</strong> {card.rate}</span>
          <span><strong className="text-foreground/90 font-semibold">Delivery:</strong> {card.deliveryDays} days</span>
          {card.hiredDate && <span className="text-primary/80 text-[11px]">{card.hiredDate}</span>}
          {card.inviteSentDate && <span className="text-muted text-[11px]">Sent {card.inviteSentDate}</span>}
        </div>

        {/* Cover letter */}
        {card.coverLetter && (
          <>
            <p className={cn(
              'text-[13px] font-normal leading-[20px] text-foreground/80 transition-all duration-200',
              !expanded && 'line-clamp-2',
            )}>
              <span className="font-semibold text-foreground/90">Cover Letter: </span>
              {card.coverLetter}
            </p>
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-[11px] text-primary cursor-pointer self-start font-medium"
            >
              {expanded ? <><ChevronUp size={12} /> Hide full cover letter</> : <><ChevronDown size={12} /> Read full cover letter</>}
            </button>
          </>
        )}

        {/* Approach */}
        {card.approach && (
          <div className="flex flex-col gap-1 mt-1">
            <button
              onClick={() => setShowApproach(v => !v)}
              className="flex items-center gap-1 text-[11px] text-primary/90 cursor-pointer self-start font-medium"
            >
              {showApproach ? <><ChevronUp size={12} /> Hide Technical Approach</> : <><ChevronDown size={12} /> View Technical Approach</>}
            </button>
            {showApproach && (
              <div className="p-3.5 rounded-xl border border-border bg-card text-[12px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
                <strong className="text-foreground font-semibold block mb-1">Proposed Technical Approach:</strong>
                {card.approach}
              </div>
            )}
          </div>
        )}

        {/* Screening Answers */}
        {Array.isArray(card.answers) && card.answers.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="text-[11px] font-semibold text-foreground/80">Screening Answers:</span>
            {card.answers.map((ans, idx) => (
              <div key={idx} className="p-2.5 rounded-lg border border-border bg-card/60 text-[11px] text-foreground/75">
                <span className="font-medium text-foreground">{idx + 1}.</span> {ans}
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        <div className="flex flex-wrap gap-2 mt-1">
          {card.skills.map(skill => (
            <span key={skill} className="bg-[#EBE5FA] dark:bg-[#291D46] text-primary text-[10px] font-normal px-[10px] py-[4px] rounded-[4px] whitespace-nowrap">
              {skill}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-[#E2E2E2] dark:bg-[#121212] my-1" />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 flex-wrap">
          {/* Bookmark / Pin */}
          <button
            onClick={() => onToggleSave(card.id)}
            title={isSaved ? 'Unpin proposal' : 'Pin proposal'}
            className={cn(
              'flex h-[35px] w-[35px] items-center justify-center rounded-full border-[0.5px] transition-colors cursor-pointer shrink-0',
              isSaved ? 'border-primary bg-primary/10 text-primary' : 'border-primary/40 text-muted hover:text-primary hover:border-primary',
            )}
          >
            <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
          {/* Archive */}
          <button
            onClick={() => onToggleArchive(card.id)}
            title={isArchived ? 'Unarchive proposal' : 'Archive proposal'}
            className={cn(
              'flex h-[35px] w-[35px] items-center justify-center rounded-full border-[0.5px] transition-colors cursor-pointer shrink-0',
              isArchived ? 'border-primary bg-primary/10 text-primary' : 'border-primary/40 text-muted hover:text-primary hover:border-primary',
            )}
          >
            <Archive size={14} />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onMessage?.(card)}
              className="flex items-center gap-1.5 border border-primary/50 text-foreground/80 hover:text-primary text-[13px] font-semibold h-[38px] px-4 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <MessageSquare size={14} /> Message
            </button>

            {mode === 'proposals' && (
              <button
                disabled={hiring || card.status === 'ACCEPTED' || card.status === 'Working'}
                onClick={() => onHire?.(card)}
                className="bg-primary text-white text-[13px] font-semibold h-[38px] px-5 rounded-xl hover:bg-primary/90 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5"
              >
                {hiring ? <Loader2 size={14} className="animate-spin" /> : null}
                {card.status === 'ACCEPTED' || card.status === 'Working' ? 'Hired' : 'Hire Freelancer'}
              </button>
            )}

            {mode === 'invite' && (
              <>
                <button
                  onClick={() => onCancelInvite?.(card.id)}
                  className="border border-red-500/50 hover:bg-red-500/10 text-red-500 text-[13px] font-semibold h-[38px] px-4 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  Cancel invite
                </button>
                <button className="bg-primary text-white text-[13px] font-semibold h-[38px] px-5 rounded-xl hover:bg-primary/90 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1">
                  <UserPlus size={13} /> Re-invite
                </button>
              </>
            )}

            {mode === 'hired' && (
              <button className="bg-[#304437] text-[#4ADE80] text-[13px] font-semibold h-[38px] px-5 rounded-xl hover:bg-[#304437]/80 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1">
                <CheckCircle2 size={13} /> Active Contract
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Filter tabs bar ──────────────────────────────────────────────────────────

function FilterTabs({
  tabs,
  active,
  onSelect,
}: {
  tabs: { label: string; count: number }[];
  active: string;
  onSelect: (label: string) => void;
}) {
  return (
    <div className="bg-[#FAFAFD] dark:bg-[#0b0b0b] flex items-stretch h-[60px] overflow-x-auto no-scrollbar">
      {tabs.map((tab, idx) => (
        <button
          key={tab.label}
          onClick={() => onSelect(tab.label)}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 px-4 py-2 text-[13px] font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap',
            idx !== 0 && 'border-l border-[#E2E2E2] dark:border-[#242424]',
            active === tab.label
              ? 'text-foreground/80 bg-primary/10 shadow-[inset_0_-2px_0_0_#8C5CFF]'
              : 'text-muted hover:text-foreground/80',
          )}
        >
          <span>{tab.label}</span>
          <span className={cn(
            'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium',
            active === tab.label ? 'bg-primary text-white' : 'bg-foreground/10 text-muted',
          )}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReviewProposalsPage({ onBack, onNavigateToMessages }: ReviewProposalsPageProps) {
  const [activeAction, setActiveAction] = useState('proposals');
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [hiringId, setHiringId] = useState<string | number | null>(null);

  // Selected job from localStorage
  const [selectedJob, setSelectedJob] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('canafri_selected_job_for_proposals');
      if (stored) {
        try { return JSON.parse(stored); } catch { /* ignore */ }
      }
    }
    return null;
  });

  const [proposals, setProposals] = useState<FreelancerCard[]>([]);
  const [hired, setHired] = useState<FreelancerCard[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string | number>>(new Set());
  const [archivedIds, setArchivedIds] = useState<Set<string | number>>(new Set());

  // Fetch real job details and proposals from API
  const fetchJobProposals = useCallback(async () => {
    if (!selectedJob?.id) {
      setLoading(false);
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;
    try {
      setLoading(true);
      const res = await fetch(`/api/jobs/${selectedJob.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.job) {
          const j = data.job;
          setSelectedJob((prev: any) => ({
            ...prev,
            ...j,
            budget: `${j.amountCC || 0} CC`,
          }));

          if (Array.isArray(j.proposals)) {
            const mapped: FreelancerCard[] = j.proposals.map((p: any) => {
              const fl = p.freelancer || {};
              const name = fl.displayName || fl.username || 'Freelance Seller';
              const username = fl.username ? fl.username.replace(/^@/, '') : 'freelancer';
              const rating = fl.trustScore ? parseFloat((fl.trustScore / 20).toFixed(1)) : 5.0;
              const isAccepted = p.status === 'ACCEPTED' || j.freelancerId === fl.id;

              return {
                id: p.id,
                freelancerId: fl.id || p.freelancerId,
                name,
                username,
                title: fl.bio || 'Verified Canton Network Seller',
                location: fl.country || 'Global',
                rate: `${p.rateCC || 0} CC`,
                rateCCNum: p.rateCC || 0,
                deliveryDays: p.deliveryDays || 30,
                earned: '$0 Earned',
                rating,
                reviews: 12,
                badge: p.status === 'ACCEPTED' ? 'Hired' : 'Submitted Proposal',
                badgeColor: p.status === 'ACCEPTED' ? 'green' : 'blue',
                coverLetter: p.coverLetter || '',
                approach: p.approach || '',
                answers: p.answers || [],
                skills: ['Smart Contracts', 'Web3', 'Canton Network'],
                status: isAccepted ? 'Working' : 'Pending',
                statusColor: isAccepted ? 'green' : 'purple',
              };
            });

            setProposals(mapped.filter(p => p.status !== 'Working'));
            setHired(mapped.filter(p => p.status === 'Working'));
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch job proposals:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedJob?.id]);

  useEffect(() => {
    fetchJobProposals();
  }, [fetchJobProposals]);

  const handleToggleSave = (id: string | number) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleArchive = (id: string | number) => {
    setArchivedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Real Message Seller Hookup — navigate to chat thread with recipient pre-selected
  const handleMessageSeller = (card: FreelancerCard) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('canafri_active_chat_recipient', JSON.stringify({
        userId: card.freelancerId,
        name: card.name,
        username: card.username,
      }));
    }

    if (onNavigateToMessages) {
      onNavigateToMessages(card.freelancerId);
    } else if (onBack) {
      onBack();
    }
  };

  // Real Hire Seller Hookup
  const handleHireSeller = async (card: FreelancerCard) => {
    if (!selectedJob?.id || !card.freelancerId) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;
    if (!token) return;

    setHiringId(card.id);
    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          freelancerId: card.freelancerId,
          milestones: [
            {
              title: 'Project Delivery & Final Review',
              description: card.approach || card.coverLetter || 'Complete project deliverables as specified in job requirements.',
              amountCC: selectedJob?.amountCC || card.rateCCNum || 100,
              order: 1,
            },
          ],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Successfully hired ${card.name}! Locked ${selectedJob?.amountCC || card.rateCCNum || 100} CC in milestone escrow.`);
        await fetchJobProposals();
      } else {
        alert(data.message || data.error || 'Failed to hire freelancer.');
      }
    } catch (err) {
      console.error('Hiring error:', err);
      alert('Network error while assigning freelancer.');
    } finally {
      setHiringId(null);
    }
  };

  const jobTitle = selectedJob?.title ?? 'Job Proposals Review';
  const jobCategory = selectedJob?.category ?? 'Development & IT';
  const jobBudget = selectedJob?.budget ?? '0 CC';
  const jobProposalCount = proposals.length + hired.length;

  const activeProposals = proposals.filter(p => !archivedIds.has(p.id));
  const proposalPinnedCount = proposals.filter(p => savedIds.has(p.id) && !archivedIds.has(p.id)).length;
  const proposalArchivedCount = proposals.filter(p => archivedIds.has(p.id)).length;

  const actionTabs = [
    {
      key: 'proposals',
      label: 'Review Proposals',
      stat1: `${activeProposals.length} proposal${activeProposals.length !== 1 ? 's' : ''}`,
      stat2: `${proposalPinnedCount} pinned`,
      icon: CheckCircle2,
    },
    {
      key: 'hired',
      label: 'Hired',
      stat1: `${hired.length} active hire${hired.length !== 1 ? 's' : ''}`,
      stat2: 'On-contract',
      icon: CheckCircle2,
    },
  ];

  const proposalFilterTabs = [
    { label: 'All', count: activeProposals.length },
    { label: 'Pinned', count: proposalPinnedCount },
    { label: 'Archived', count: proposalArchivedCount },
  ];

  const hiredFilterTabs = [
    { label: 'All', count: hired.length },
    { label: 'Working', count: hired.length },
  ];

  const filterTabs = activeAction === 'proposals' ? proposalFilterTabs : hiredFilterTabs;

  const getFilteredCards = () => {
    let currentSet = activeAction === 'proposals' ? proposals : hired;

    if (activeAction === 'proposals') {
      if (activeFilter === 'Archived') {
        return currentSet.filter(card => archivedIds.has(card.id));
      }
      currentSet = currentSet.filter(card => !archivedIds.has(card.id));
    }

    if (activeFilter === 'Pinned') {
      return currentSet.filter(card => savedIds.has(card.id));
    }

    return currentSet;
  };

  const cards = getFilteredCards();

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-background px-6 py-5 shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        <h1 className="text-foreground/80 text-lg font-semibold leading-7">Manage Proposals</h1>
      </div>

      {/* Body */}
      <div className="w-full flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-8 max-w-5xl mx-auto">

        {/* Job title + meta */}
        <div className="flex flex-col gap-1">
          <h2 className="text-[22px] sm:text-[28px] font-bold text-foreground/80 leading-tight tracking-tight">
            {jobTitle}
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[13px] text-primary/85 font-normal">{jobCategory}</span>
            <span className="w-1 h-1 rounded-full bg-muted/60" />
            <span className="text-[13px] text-muted font-normal">Budget: {jobBudget}</span>
            <span className="w-1 h-1 rounded-full bg-muted/60" />
            <span className="text-[13px] text-muted font-normal">{jobProposalCount} proposal{jobProposalCount !== 1 ? 's' : ''} received</span>
          </div>
        </div>

        {/* ── Action Tabs Card ── */}
        <div className="w-full overflow-x-auto no-scrollbar rounded-xl border border-border bg-card flex items-stretch">
          {actionTabs.map((tab, idx) => {
            const isActive = activeAction === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveAction(tab.key); setActiveFilter('All'); }}
                className={cn(
                  'flex flex-1 min-w-[10rem] sm:min-w-0 flex-col items-center justify-center gap-[2px] px-4 py-4 transition-all duration-200 cursor-pointer',
                  idx !== 0 && 'border-l border-border',
                  isActive ? 'bg-primary text-white' : 'text-foreground/80 hover:bg-primary/5',
                )}
              >
                <span className={cn(
                  'text-[13px] font-semibold leading-[18px] whitespace-nowrap',
                  isActive ? 'text-white' : 'text-foreground/80',
                )}>
                  {tab.label}
                </span>
                <span className={cn(
                  'text-[11px] leading-[15px] whitespace-nowrap',
                  isActive ? 'text-white/60' : 'text-muted',
                )}>
                  {tab.stat1}
                </span>
                <span className={cn(
                  'text-[10px] leading-[13px] whitespace-nowrap',
                  isActive ? 'text-white/50' : 'text-muted/70',
                )}>
                  {tab.stat2}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Content Card ── */}
        <div className="w-full flex flex-col rounded-2xl overflow-hidden border border-border">

          {/* Filter tabs */}
          <FilterTabs
            tabs={filterTabs}
            active={activeFilter}
            onSelect={setActiveFilter}
          />

          {/* Cards */}
          <div className="flex flex-col overflow-x-auto no-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted">
                <Loader2 size={24} className="animate-spin text-primary" />
                <p className="text-[13px]">Loading real submitted proposals...</p>
              </div>
            ) : cards.length > 0 ? (
              cards.map(card => (
                <ProposalCard
                  key={card.id}
                  card={card}
                  mode={activeAction as 'proposals' | 'invite' | 'hired'}
                  isSaved={savedIds.has(card.id)}
                  isArchived={archivedIds.has(card.id)}
                  onToggleSave={handleToggleSave}
                  onToggleArchive={handleToggleArchive}
                  onMessage={handleMessageSeller}
                  onHire={handleHireSeller}
                  hiring={hiringId === card.id}
                />
              ))
            ) : (
              <div className="flex flex-col items-center gap-3 py-16 text-center text-muted">
                <CheckCircle2 size={36} className="text-muted/40" />
                <p className="text-[13px] font-medium text-foreground">No proposals found</p>
                <p className="text-[11px] text-muted">No seller proposals submitted in this view yet.</p>
              </div>
            )}
          </div>

        </div>
      </div>
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
