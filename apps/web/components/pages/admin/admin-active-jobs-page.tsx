'use client';

import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type JobStatus = 'In Progress' | 'Awaiting Review' | 'Overdue';

interface ActiveJob {
  id: number;
  title: string;
  postedAgo: string;
  client: string;
  freelancer: string;
  milestoneLabel: string;
  milestoneProgress: number; // 0–100
  milestoneColor: string;
  escrowCC: string;
  status: JobStatus;
}

type FilterTab = 'All' | 'In Progress' | 'Awaiting Review' | 'Overdue';
type SortKey  = 'newest' | 'oldest' | 'escrow-high' | 'escrow-low';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_JOBS: ActiveJob[] = [
  {
    id: 1,
    title: 'React frontend for Canton wallet',
    postedAgo: 'Posted 5 days ago',
    client: '@johntrek',
    freelancer: '@allanbreak',
    milestoneLabel: 'Milestone 2 of 5',
    milestoneProgress: 58,
    milestoneColor: '#8C5CFF',
    escrowCC: '0.00 CC',
    status: 'In Progress',
  },
  {
    id: 2,
    title: 'React frontend for Canton wallet',
    postedAgo: 'Posted 5 days ago',
    client: '@johntrek',
    freelancer: '@allanbreak',
    milestoneLabel: 'Milestone 2 of 5',
    milestoneProgress: 58,
    milestoneColor: '#8C5CFF',
    escrowCC: '0.00 CC',
    status: 'In Progress',
  },
  {
    id: 3,
    title: 'React frontend for Canton wallet',
    postedAgo: 'Posted 5 days ago',
    client: '@johntrek',
    freelancer: '@allanbreak',
    milestoneLabel: 'Final milestone',
    milestoneProgress: 85,
    milestoneColor: '#DAC95A',
    escrowCC: '0.00 CC',
    status: 'Awaiting Review',
  },
  {
    id: 4,
    title: 'React frontend for Canton wallet',
    postedAgo: 'Posted 5 days ago',
    client: '@johntrek',
    freelancer: '@allanbreak',
    milestoneLabel: 'Milestone 2 of 5',
    milestoneProgress: 40,
    milestoneColor: '#5993F4',
    escrowCC: '0.00 CC',
    status: 'In Progress',
  },
  {
    id: 5,
    title: 'Smart contract audit & review',
    postedAgo: 'Posted 8 days ago',
    client: '@mariamb',
    freelancer: '@devpro_ng',
    milestoneLabel: 'Milestone 1 of 3',
    milestoneProgress: 25,
    milestoneColor: '#F87171',
    escrowCC: '120.00 CC',
    status: 'Overdue',
  },
  {
    id: 6,
    title: 'Canton DApp UI design system',
    postedAgo: 'Posted 2 days ago',
    client: '@kwekua',
    freelancer: '@designpro',
    milestoneLabel: 'Milestone 3 of 4',
    milestoneProgress: 72,
    milestoneColor: '#4ADE80',
    escrowCC: '45.00 CC',
    status: 'Awaiting Review',
  },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  subColor?: string;
}

function StatCard({ label, value, sub, subColor = '#A0A0A0' }: StatCardProps) {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-border bg-card px-6 py-5 min-h-[100px] justify-center hover:border-[#8C5CFF]/20 transition-colors duration-300">
      <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] leading-[16px]">{label}</p>
      <p className="font-sans text-[1.375rem] font-bold text-white leading-[26px] tracking-tight">{value}</p>
      <p className="font-sans text-[0.6875rem] font-normal leading-[15px]" style={{ color: subColor }}>{sub}</p>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function MilestoneBar({ progress, color, label }: { progress: number; color: string; label: string }) {
  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      <div className="h-[6px] w-full rounded-full bg-[#1a1a1a] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${color} 0%, ${color}88 100%)`,
            boxShadow: `0 0 6px ${color}55`,
          }}
        />
      </div>
      <p className="font-sans text-[0.6875rem] text-[#A0A0A0] leading-[14px] whitespace-nowrap">{label}</p>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<JobStatus, string> = {
  'In Progress':      'bg-[#8C5CFF]/10 text-[#8C5CFF] border border-[#8C5CFF]/20',
  'Awaiting Review':  'bg-[#DAC95A]/10 text-[#DAC95A] border border-[#DAC95A]/20',
  'Overdue':          'bg-[#F87171]/10 text-[#F87171] border border-[#F87171]/20',
};

function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 font-sans text-[0.6875rem] font-semibold whitespace-nowrap ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

// ─── Sort Dropdown ────────────────────────────────────────────────────────────

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest',      label: 'Newest first' },
  { key: 'oldest',      label: 'Oldest first' },
  { key: 'escrow-high', label: 'Escrow: High → Low' },
  { key: 'escrow-low',  label: 'Escrow: Low → High' },
];

function SortDropdown({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const label = SORT_OPTIONS.find(o => o.key === value)?.label ?? 'Sort By';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-2 font-sans text-[0.8125rem] font-semibold text-white transition-colors hover:border-[#8C5CFF]/40"
      >
        Sort By
        <ChevronDown size={14} className={`text-white/50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1.5 min-w-[180px] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => { onChange(opt.key); setOpen(false); }}
              className={[
                'flex w-full items-center px-4 py-2.5 font-sans text-[0.8125rem] transition-colors text-left',
                opt.key === value
                  ? 'bg-[#8C5CFF]/10 text-[#8C5CFF]'
                  : 'text-foreground/80 hover:bg-foreground/5',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Job Row (table row for desktop, card for mobile) ─────────────────────────

function JobRow({ job }: { job: ActiveJob }) {
  return (
    <>
      {/* Desktop row */}
      <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_2fr_1fr_1fr] gap-4 items-center px-6 py-4 border-b border-border hover:bg-foreground/[0.02] transition-colors group cursor-pointer">
        {/* Job */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="font-sans text-[0.9375rem] font-semibold text-foreground leading-[22px] truncate group-hover:text-[#8C5CFF] transition-colors">
            {job.title}
          </p>
          <p className="font-sans text-[0.75rem] text-[#A0A0A0] leading-[16px]">{job.postedAgo}</p>
        </div>
        {/* Client */}
        <p className="font-sans text-[0.8125rem] text-[#8C5CFF] font-medium leading-[18px] truncate">{job.client}</p>
        {/* Freelancer */}
        <p className="font-sans text-[0.8125rem] text-[#8C5CFF] font-medium leading-[18px] truncate">{job.freelancer}</p>
        {/* Progress */}
        <MilestoneBar progress={job.milestoneProgress} color={job.milestoneColor} label={job.milestoneLabel} />
        {/* Escrow */}
        <p className="font-sans text-[0.8125rem] font-medium text-foreground leading-[18px] whitespace-nowrap">{job.escrowCC}</p>
        {/* Status */}
        <div className="flex justify-end">
          <StatusBadge status={job.status} />
        </div>
      </div>

      {/* Mobile card */}
      <div className="flex md:hidden flex-col gap-3 border-b border-border px-4 py-4 hover:bg-foreground/[0.02] transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-sans text-[0.875rem] font-semibold text-foreground leading-[20px]">{job.title}</p>
            <p className="font-sans text-[0.75rem] text-[#A0A0A0] mt-0.5">{job.postedAgo}</p>
          </div>
          <StatusBadge status={job.status} />
        </div>
        <div className="flex items-center gap-4 text-[0.75rem]">
          <span className="text-[#A0A0A0]">Client: <span className="text-[#8C5CFF] font-medium">{job.client}</span></span>
          <span className="text-[#A0A0A0]">Freelancer: <span className="text-[#8C5CFF] font-medium">{job.freelancer}</span></span>
        </div>
        <MilestoneBar progress={job.milestoneProgress} color={job.milestoneColor} label={job.milestoneLabel} />
        <p className="font-sans text-[0.75rem] text-[#A0A0A0]">Escrow: <span className="text-foreground font-medium">{job.escrowCC}</span></p>
      </div>
    </>
  );
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────

const FILTER_TABS: FilterTab[] = ['All', 'In Progress', 'Awaiting Review', 'Overdue'];

// FilterTab component removed — tabs now rendered inline with the segmented pill style


// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminActiveJobsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [sortKey,   setSortKey]   = useState<SortKey>('newest');

  const filteredJobs = useMemo(() => {
    let jobs = activeTab === 'All'
      ? MOCK_JOBS
      : MOCK_JOBS.filter(j => j.status === activeTab);

    switch (sortKey) {
      case 'oldest':
        return [...jobs].reverse();
      case 'escrow-high':
        return [...jobs].sort((a, b) => parseFloat(b.escrowCC) - parseFloat(a.escrowCC));
      case 'escrow-low':
        return [...jobs].sort((a, b) => parseFloat(a.escrowCC) - parseFloat(b.escrowCC));
      default:
        return jobs;
    }
  }, [activeTab, sortKey]);

  const countByStatus = (status: FilterTab) =>
    status === 'All' ? MOCK_JOBS.length : MOCK_JOBS.filter(j => j.status === status).length;

  const STAT_CARDS: StatCardProps[] = [
    { label: 'Active Jobs',         value: 0, sub: '+18 this week',         subColor: '#A0A0A0' },
    { label: 'Total CC in Escrow',  value: 0, sub: 'Locked across all jobs', subColor: '#4ADE80' },
    { label: 'Overdue Milestones',  value: 0, sub: 'Past deadline',          subColor: '#A0A0A0' },
    { label: 'Completing This Week',value: 0, sub: 'Final milestone due',     subColor: '#A0A0A0' },
  ];

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto px-6 py-6">

        {/* Heading */}
        <h1 className="font-sans text-[1.875rem] font-bold leading-[34px] tracking-tight text-foreground">
          Active Jobs &amp; Escrow Monitor
        </h1>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STAT_CARDS.map(c => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>

        {/* Filter + Sort Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-[#080808] border border-border p-1 rounded-xl shadow-inner">
            {FILTER_TABS.map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-sans text-[0.6875rem] font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-[#8C5CFF] text-white shadow'
                    : 'text-[#A0A0A0] hover:text-white'
                }`}
              >
                {tab}
                {countByStatus(tab) > 0 && tab !== 'All' && (
                  <span className={`flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 font-sans text-[9px] font-bold ${
                    activeTab === tab ? 'bg-white/20 text-white' : 'bg-border text-[#A0A0A0]'
                  }`}>
                    {countByStatus(tab)}
                  </span>
                )}
              </button>
            ))}
          </div>
          <SortDropdown value={sortKey} onChange={setSortKey} />
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_2fr_1fr_1fr] gap-4 items-center px-6 py-3 border-b border-border bg-foreground/[0.015]">
            <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] uppercase tracking-wider">Job</p>
            <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] uppercase tracking-wider">Client</p>
            <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] uppercase tracking-wider">Freelancer</p>
            <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] uppercase tracking-wider">Progress</p>
            <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] uppercase tracking-wider">Escrow</p>
            <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] uppercase tracking-wider text-right">Status</p>
          </div>

          {/* Rows */}
          {filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-card">
                <svg className="size-6 text-[#A0A0A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </div>
              <p className="font-sans text-[0.875rem] text-[#A0A0A0]">No jobs found for this filter</p>
            </div>
          ) : (
            filteredJobs.map(job => <JobRow key={job.id} job={job} />)
          )}
        </div>

      </div>
    </div>
  );
}
