'use client';
import { useState } from 'react';
import {
  ChevronLeft, ChevronUp, ChevronDown,
  Archive, Star, Bookmark, UserPlus, CheckCircle2, Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewProposalsPageProps {
  onBack?: () => void;
}

// ─── Data types ───────────────────────────────────────────────────────────────

interface FreelancerCard {
  id: number;
  name: string;
  title: string;
  location: string;
  rate: string;
  earned: string;
  rating: number;
  reviews: number;
  badge?: string;
  badgeColor?: 'green' | 'blue';
  coverLetter?: string;
  skills: string[];
  status?: string;
  statusColor?: 'green' | 'purple' | 'amber' | 'red';
  hiredDate?: string;
  inviteSentDate?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const initialProposals: FreelancerCard[] = [
  {
    id: 1,
    name: 'John Trek',
    title: 'Dedicated web3 developer',
    location: 'United Kingdom',
    rate: '$25.00/hr',
    earned: '$25k Earned',
    rating: 4.9,
    reviews: 32,
    badge: 'Best Match',
    badgeColor: 'green',
    coverLetter: 'Dear client, I am very excited about the opportunity you are offering. I have extensive experience in smart contract development and web3 technologies. I will contribute my best effort to deliver an outstanding job.',
    skills: ['Smart Contract', 'Daml Developer', 'Solidity', 'Web3'],
  },
  {
    id: 2,
    name: 'Alex Daml',
    title: 'Full-stack blockchain engineer',
    location: 'Germany',
    rate: '$35.00/hr',
    earned: '$42k Earned',
    rating: 4.7,
    reviews: 18,
    badge: 'Good Match',
    badgeColor: 'blue',
    coverLetter: 'Hello, I specialize in payment gateway integrations and blockchain solutions. I have shipped 10+ successful DeFi projects and can deliver a robust smart contract for your gateway upgrade.',
    skills: ['DeFi', 'Ethereum', 'Hardhat', 'TypeScript'],
  },
  {
    id: 3,
    name: 'Maria Solano',
    title: 'Smart contract auditor',
    location: 'Spain',
    rate: '$45.00/hr',
    earned: '$78k Earned',
    rating: 5.0,
    reviews: 47,
    badge: 'Top Rated',
    badgeColor: 'green',
    coverLetter: 'Hi! My background is in auditing and writing production-grade Solidity contracts. I have a track record of catching critical vulnerabilities before deployment.',
    skills: ['Solidity', 'Audit', 'EVM', 'Security'],
  },
];

const initialInvites: FreelancerCard[] = [
  {
    id: 4,
    name: 'Sam Kwon',
    title: 'Blockchain protocol engineer',
    location: 'South Korea',
    rate: '$50.00/hr',
    earned: '$110k Earned',
    rating: 4.8,
    reviews: 61,
    skills: ['Rust', 'Layer 2', 'ZK Proofs'],
    inviteSentDate: '2 days ago',
    status: 'Pending',
    statusColor: 'amber',
  },
  {
    id: 5,
    name: 'Lena Koch',
    title: 'DeFi liquidity specialist',
    location: 'Netherlands',
    rate: '$40.00/hr',
    earned: '$55k Earned',
    rating: 4.6,
    reviews: 29,
    skills: ['Uniswap', 'AMM', 'Solidity'],
    inviteSentDate: '5 days ago',
    status: 'Declined',
    statusColor: 'red',
  },
];

const initialHired: FreelancerCard[] = [
  {
    id: 6,
    name: 'Carlos Vega',
    title: 'Web3 full-stack developer',
    location: 'Mexico',
    rate: '$30.00/hr',
    earned: '$31k Earned',
    rating: 4.9,
    reviews: 40,
    skills: ['Next.js', 'Solidity', 'GraphQL'],
    hiredDate: 'Hired on Jun 12, 2025',
    status: 'Working',
    statusColor: 'green',
  },
];

// ─── ProposalCard ─────────────────────────────────────────────────────────────

function ProposalCard({
  card,
  mode,
  isSaved,
  isArchived,
  onToggleSave,
  onToggleArchive,
  onCancelInvite,
}: {
  card: FreelancerCard;
  mode: 'proposals' | 'invite' | 'hired';
  isSaved: boolean;
  isArchived: boolean;
  onToggleSave: (id: number) => void;
  onToggleArchive: (id: number) => void;
  onCancelInvite?: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusPill: Record<string, string> = {
    green: 'bg-[#304437] text-[#4ADE80]',
    purple: 'bg-[#291D46] text-[#8C5CFF]',
    amber: 'bg-[#3d3210] text-[#FBBF24]',
    red: 'bg-[#3d1212] text-[#F87171]',
  };

  return (
    <div className="bg-[#FAFAFD] dark:bg-[#0b0b0b] border-t border-[#E2E2E2] dark:border-[#242424] flex gap-4 items-start px-4 py-6 min-w-[700px] md:min-w-0 w-full last:rounded-b-2xl transition-colors">
      {/* Avatar */}
      <div className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full bg-[#291D46] text-white text-[14px] font-semibold">
        {card.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 min-w-0">
        {/* Name + badge + rating */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium text-muted whitespace-nowrap">{card.name}</span>
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
            <span className="text-[10px] text-muted">({card.reviews})</span>
          </div>
        </div>

        {/* Title & location */}
        <p className="text-[13px] font-normal leading-[20px] text-foreground/80">{card.title}</p>
        <p className="text-[13px] font-medium text-muted leading-[18px]">{card.location}</p>

        {/* Rate + earned */}
        <div className="flex items-center gap-8 text-[13px] font-medium text-muted whitespace-nowrap">
          <span>{card.rate}</span>
          <span>{card.earned}</span>
          {card.hiredDate && <span className="text-primary/80 text-[11px]">{card.hiredDate}</span>}
          {card.inviteSentDate && <span className="text-muted text-[11px]">Sent {card.inviteSentDate}</span>}
        </div>

        {/* Cover letter (proposals only) */}
        {card.coverLetter && (
          <>
            <p className={cn(
              'text-[13px] font-normal leading-[20px] text-foreground/80 transition-all duration-200',
              !expanded && 'line-clamp-2',
            )}>
              <span className="font-semibold">Cover Letter: </span>
              {card.coverLetter}
            </p>
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-[11px] text-primary cursor-pointer self-start"
            >
              {expanded ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> Read more</>}
            </button>
          </>
        )}

        {/* Skills */}
        <div className="flex flex-wrap gap-2">
          {card.skills.map(skill => (
            <span key={skill} className="bg-[#EBE5FA] dark:bg-[#291D46] text-primary text-[10px] font-normal px-[10px] py-[5px] rounded-[3px] whitespace-nowrap">
              {skill}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-[#E2E2E2] dark:bg-[#121212]" />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 flex-wrap">
          {/* Saved / Pinned Toggle */}
          <button
            onClick={() => onToggleSave(card.id)}
            className={cn(
              'flex h-[35px] w-[35px] items-center justify-center rounded-full border-[0.5px] transition-colors cursor-pointer shrink-0',
              isSaved ? 'border-primary bg-primary/10 text-primary' : 'border-primary/40 text-muted hover:text-primary hover:border-primary',
            )}
          >
            <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
          {/* Functional Archive button */}
          <button
            onClick={() => onToggleArchive(card.id)}
            className={cn(
              'flex h-[35px] w-[35px] items-center justify-center rounded-full border-[0.5px] transition-colors cursor-pointer shrink-0',
              isArchived ? 'border-primary bg-primary/10 text-primary' : 'border-primary/40 text-muted hover:text-primary hover:border-primary',
            )}
          >
            <Archive size={14} />
          </button>
          <div className="flex items-center gap-2">
            <button className="border border-primary/50 text-foreground/80 text-[13px] font-semibold h-[38px] px-4 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer whitespace-nowrap">
              Message
            </button>
            {mode === 'proposals' && (
              <button className="bg-primary text-white text-[13px] font-semibold h-[38px] px-5 rounded-xl hover:bg-primary/90 transition-colors cursor-pointer whitespace-nowrap">
                Hire
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
                <CheckCircle2 size={13} /> Working
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

// ─── Invite placeholder card (for "Search & Invite" UX) ──────────────────────

function InviteSearchBox() {
  return (
    <div className="bg-[#FAFAFD] dark:bg-[#0b0b0b] border-t border-[#E2E2E2] dark:border-[#242424] flex flex-col items-center gap-4 px-6 py-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <UserPlus size={22} className="text-primary" />
      </div>
      <div className="text-center">
        <p className="text-[14px] font-semibold text-foreground/80">Invite a freelancer</p>
        <p className="text-[12px] text-muted mt-1">Search CanaFri's talent pool and send direct invitations to freelancers you think are a good fit.</p>
      </div>
      <button className="bg-primary text-white text-[13px] font-semibold h-[40px] px-6 rounded-xl hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-2">
        <UserPlus size={14} /> Search & Invite
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReviewProposalsPage({ onBack }: ReviewProposalsPageProps) {
  const [activeAction, setActiveAction] = useState('proposals');
  const [activeFilter, setActiveFilter] = useState('All');

  // Load the job that was clicked in the Proposals tab of buyer-jobs-page
  const selectedJob = (() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('canafri_selected_job_for_proposals');
      if (stored) {
        try { return JSON.parse(stored); } catch { /* ignore */ }
      }
    }
    return null;
  })();

  const jobTitle    = selectedJob?.title    ?? 'Web3 Specialist, and solidity smart contract expert to upgrade my payment gateway';
  const jobCategory = selectedJob?.category ?? 'Smart Contracts';
  const jobBudget   = selectedJob?.budget   ?? '400 CC';
  const jobProposalCount = selectedJob?.proposals ?? 0;

  // Dynamic state arrays
  const [proposals, setProposals] = useState<FreelancerCard[]>(() => {
    let list = [...initialProposals];
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("canafri_submitted_proposals");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const mapped = parsed.map((p: any) => ({
            id: p.id,
            name: p.freelancerName || "Josh Trek",
            title: "Blockchain developer",
            location: "Turkey",
            rate: p.bidAmount || "$25.00/hr",
            earned: "$0 Earned",
            rating: 5.0,
            reviews: 0,
            badge: "New Proposal",
            badgeColor: "green",
            coverLetter: p.coverLetter,
            skills: ["Next.js", "Daml", "React"],
          }));
          list = [...mapped, ...list];
        } catch (e) {
          console.error(e);
        }
      }
    }
    return list;
  });
  const [invites, setInvites] = useState<FreelancerCard[]>(initialInvites);
  const [hired, setHired] = useState<FreelancerCard[]>(initialHired);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [archivedIds, setArchivedIds] = useState<Set<number>>(new Set());

  const handleToggleSave = (id: number) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleArchive = (id: number) => {
    setArchivedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCancelInvite = (id: number) => {
    setInvites(prev => prev.filter(item => item.id !== id));
  };

  // Saved / Bookmarked = Pinned (excluding archived ones from active views)
  const activeProposals = proposals.filter(p => !archivedIds.has(p.id));
  const proposalPinnedCount = proposals.filter(p => savedIds.has(p.id) && !archivedIds.has(p.id)).length;
  const proposalArchivedCount = proposals.filter(p => archivedIds.has(p.id)).length;

  const actionTabs = [
    {
      key: 'proposals',
      label: 'Review Proposals',
      stat1: `${activeProposals.length} proposals`,
      stat2: `${proposalPinnedCount} pinned`,
      icon: CheckCircle2,
    },
    {
      key: 'invite',
      label: 'Invite Freelancers',
      stat1: `${invites.filter(i => i.status === 'Pending').length} unanswered`,
      stat2: `${invites.length} total sent`,
      icon: Send,
    },
    {
      key: 'hired',
      label: 'Hired',
      stat1: `${hired.length} active hire`,
      stat2: 'On-contract',
      icon: CheckCircle2,
    },
  ];

  // Filters computed based on state
  const proposalFilterTabs = [
    { label: 'All', count: activeProposals.length },
    { label: 'Pinned', count: proposalPinnedCount },
    { label: 'Archived', count: proposalArchivedCount },
    { label: 'Messaged', count: 2 },
    { label: 'Cancelled', count: 1 },
  ];

  const inviteFilterTabs = [
    { label: 'All', count: invites.length },
    { label: 'Pending', count: invites.filter(i => i.status === 'Pending').length },
    { label: 'Declined', count: invites.filter(i => i.status === 'Declined').length },
  ];

  const hiredFilterTabs = [
    { label: 'All', count: hired.length },
    { label: 'Working', count: hired.filter(h => h.status === 'Working').length },
    { label: 'Completed', count: 0 },
  ];

  const filterTabs =
    activeAction === 'proposals' ? proposalFilterTabs :
    activeAction === 'invite' ? inviteFilterTabs :
    hiredFilterTabs;

  const getFilteredCards = () => {
    let currentSet =
      activeAction === 'proposals' ? proposals :
      activeAction === 'invite' ? invites :
      hired;

    if (activeAction === 'proposals') {
      if (activeFilter === 'Archived') {
        return currentSet.filter(card => archivedIds.has(card.id));
      }
      // Hide archived from all other views
      currentSet = currentSet.filter(card => !archivedIds.has(card.id));
    }

    if (activeFilter === 'Pinned') {
      return currentSet.filter(card => savedIds.has(card.id));
    }
    if (activeFilter === 'Pending') {
      return currentSet.filter(card => card.status === 'Pending');
    }
    if (activeFilter === 'Declined') {
      return currentSet.filter(card => card.status === 'Declined');
    }
    if (activeFilter === 'Working') {
      return currentSet.filter(card => card.status === 'Working');
    }
    return currentSet;
  };

  const cards = getFilteredCards();

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#D8D8D8]/40 dark:border-[#121212] bg-background px-6 py-5 shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8D8D8] dark:border-[#242424] bg-[#FAFAFD] dark:bg-[#0B0B0B] text-muted hover:text-foreground transition-colors cursor-pointer"
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
            {selectedJob && (
              <>
                <span className="w-1 h-1 rounded-full bg-muted/60" />
                <span className="text-[13px] text-muted font-normal">{jobProposalCount} proposal{jobProposalCount !== 1 ? 's' : ''} received</span>
              </>
            )}
          </div>
        </div>

        {/* ── Action Tabs Card ── */}
        <div className="w-full overflow-x-auto no-scrollbar rounded-xl border border-[#D8D8D8] dark:border-[#242424] bg-[#FAFAFD] dark:bg-[#0b0b0b] flex items-stretch">
          {actionTabs.map((tab, idx) => {
            const isActive = activeAction === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveAction(tab.key); setActiveFilter('All'); }}
                className={cn(
                  'flex flex-1 min-w-[10rem] sm:min-w-0 flex-col items-center justify-center gap-[2px] px-4 py-4 transition-all duration-200 cursor-pointer',
                  idx !== 0 && 'border-l border-[#D8D8D8] dark:border-[#242424]',
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
        <div className="w-full flex flex-col rounded-2xl overflow-hidden border border-[#D8D8D8] dark:border-[#242424]">

          {/* Filter tabs */}
          <FilterTabs
            tabs={filterTabs}
            active={activeFilter}
            onSelect={setActiveFilter}
          />

          {/* Cards */}
          <div className="flex flex-col overflow-x-auto no-scrollbar">
            {activeAction === 'invite' && <InviteSearchBox />}
            {cards.map(card => (
              <ProposalCard
                key={card.id}
                card={card}
                mode={activeAction as 'proposals' | 'invite' | 'hired'}
                isSaved={savedIds.has(card.id)}
                isArchived={archivedIds.has(card.id)}
                onToggleSave={handleToggleSave}
                onToggleArchive={handleToggleArchive}
                onCancelInvite={handleCancelInvite}
              />
            ))}
            {cards.length === 0 && activeAction !== 'invite' && (
              <div className="flex flex-col items-center gap-3 py-16 text-center text-muted">
                <CheckCircle2 size={36} className="text-muted/40" />
                <p className="text-[13px]">Nothing here yet.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
