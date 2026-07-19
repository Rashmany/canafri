'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, Eye, Trash2, ArrowLeftRight, Check, X, ShieldAlert, BookOpen, Briefcase } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type DelistedReason = 'Creator unstaked' | 'Reported' | 'Admin Removed';

interface DelistedItem {
  id: number;
  type: 'content' | 'job';
  title: string;
  subInfo: string; // e.g. "Premium · 0.3 CC · 189 reads before delisting"
  authorName: string;
  authorHandle: string;
  reason: DelistedReason;
  dateText: string;
  details: string; // long description for preview modal
}

type FilterTab = 'All' | 'Unstake' | 'Reported' | 'Admin Removed';
type SortOption = 'newest' | 'oldest' | 'reads-high' | 'reads-low';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_DELISTED_ITEMS: DelistedItem[] = [
  {
    id: 1,
    type: 'content',
    title: 'CC Yield Farming Strategies',
    subInfo: 'Premium · 0.3 CC · 189 reads before delisting',
    authorName: 'John Trek',
    authorHandle: '@johntrek',
    reason: 'Creator unstaked',
    dateText: '2 days ago',
    details: 'A comprehensive guide explaining leverage yield farming on the Canton Network. Features advanced pool staking metrics, risks analysis, and reward distribution formulas. Delisted automatically because the creator unstaked their platform registration deposit.'
  },
  {
    id: 2,
    type: 'content',
    title: 'Arbitrage Bot Setup Guide',
    subInfo: 'Premium · 1.5 CC · 42 reads before delisting',
    authorName: 'John Trek',
    authorHandle: '@johntrek',
    reason: 'Creator unstaked',
    dateText: '2 days ago',
    details: 'Step by step setup instructions for running local arbitrage bots. Unstaked event triggered automatically.'
  },
  {
    id: 3,
    type: 'content',
    title: 'CC Yield Farming Strategies',
    subInfo: 'Premium · 0.3 CC · 189 reads before delisting',
    authorName: 'John Trek',
    authorHandle: '@johntrek',
    reason: 'Creator unstaked',
    dateText: '2 days ago',
    details: 'Duplicate publication on yield farming strategies. Auto-delisted due to deposit withdraw.'
  },
  {
    id: 4,
    type: 'job',
    title: 'React developer for Canton wallet',
    subInfo: 'Job Post · Budget: 500 CC · 3 applications',
    authorName: 'John Trek',
    authorHandle: '@johntrek',
    reason: 'Admin Removed',
    dateText: '3 days ago',
    details: 'Job listing soliciting off-platform transactions. Flagged by system and manually delisted by administrative action for policy violations.'
  },
  {
    id: 5,
    type: 'content',
    title: 'Unreleased Canton Protocol Specs',
    subInfo: 'Premium · 5.0 CC · 890 reads before delisting',
    authorName: 'CantonDev',
    authorHandle: '@canton_dev',
    reason: 'Reported',
    dateText: '4 days ago',
    details: 'Leaked architectural blueprints of the upcoming network mainnet version. Reported for intellectual property violation and suspended.'
  }
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  sub: string;
  subColor?: string;
}

function StatCard({ label, value, sub, subColor = '#A0A0A0' }: StatCardProps) {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-border bg-card px-6 py-5 min-h-[100px] justify-center hover:border-[#8C5CFF]/20 transition-all duration-300">
      <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] leading-[16px]">{label}</p>
      <p className="font-sans text-[1.5rem] font-bold text-white leading-[28px] tracking-tight">{value}</p>
      <p className="font-sans text-[0.6875rem] font-normal leading-[15px]" style={{ color: subColor }}>{sub}</p>
    </div>
  );
}

// ─── Detail Preview Modal ─────────────────────────────────────────────────────

function ItemPreviewModal({
  item,
  onClose,
  onRestore,
}: {
  item: DelistedItem;
  onClose: () => void;
  onRestore: (id: number) => void;
}) {
  const isJob = item.type === 'job';
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-lg flex-col rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#8C5CFF]/15 border border-[#8C5CFF]/25">
              {isJob ? <Briefcase size={16} className="text-[#8C5CFF]" /> : <BookOpen size={16} className="text-[#8C5CFF]" />}
            </div>
            <div>
              <h3 className="font-sans text-[0.9375rem] font-bold text-white leading-[20px]">{item.title}</h3>
              <p className="font-sans text-[0.75rem] text-[#A0A0A0] mt-0.5">{item.subInfo}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-[#A0A0A0] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content details */}
        <div className="flex flex-col gap-4 mt-5">
          <div>
            <p className="font-sans text-[0.6875rem] text-[#A0A0A0] uppercase tracking-wider font-semibold">Author</p>
            <p className="font-sans text-[0.8125rem] text-white/80 mt-1">{item.authorName} ({item.authorHandle})</p>
          </div>
          <div>
            <p className="font-sans text-[0.6875rem] text-[#A0A0A0] uppercase tracking-wider font-semibold">Delisting Reason</p>
            <span className="inline-block rounded-md bg-[#F87171]/10 border border-[#F87171]/20 px-2 py-0.5 font-sans text-[0.6875rem] font-medium text-[#F87171] mt-1.5">
              {item.reason}
            </span>
          </div>
          <div>
            <p className="font-sans text-[0.6875rem] text-[#A0A0A0] uppercase tracking-wider font-semibold">Listing Metadata &amp; Log</p>
            <p className="font-sans text-[0.8125rem] text-foreground/70 leading-[1.6] mt-2 bg-[#080808] p-3 rounded-lg border border-border/40">
              {item.details}
            </p>
          </div>
        </div>

        {/* Action buttons inside preview */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-card hover:bg-foreground/5 py-2.5 font-sans text-[0.8125rem] font-semibold text-foreground/80 transition-colors"
          >
            Close Details
          </button>
          <button
            type="button"
            onClick={() => { onRestore(item.id); onClose(); }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#8C5CFF] hover:bg-[#AC8EF3] py-2.5 font-sans text-[0.8125rem] font-semibold text-white transition-colors"
          >
            <Check size={14} strokeWidth={2.5} />
            Restore Listing
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteConfirmModal({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-sm flex-col rounded-2xl border border-border bg-card p-6 shadow-2xl text-center items-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-[#F87171]/15 border border-[#F87171]/25 mb-4">
          <ShieldAlert size={22} className="text-[#F87171]" />
        </div>
        <h3 className="font-sans text-[1rem] font-bold text-white">Permanently Delete Listing?</h3>
        <p className="font-sans text-[0.8125rem] text-[#A0A0A0] leading-relaxed mt-2">
          This will permanently purge this listing and all related assets. This action is irreversible.
        </p>
        <div className="flex gap-3 mt-5 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-card hover:bg-foreground/5 py-2.5 font-sans text-[0.8125rem] font-semibold text-foreground/80 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-[#F87171] hover:bg-[#F87171]/90 py-2.5 font-sans text-[0.8125rem] font-semibold text-white transition-colors shadow-lg shadow-[#F87171]/15"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────

const TABS: FilterTab[] = ['All', 'Unstake', 'Reported', 'Admin Removed'];

// ─── Sort Dropdown ────────────────────────────────────────────────────────────

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'newest',     label: 'Newest first' },
  { key: 'oldest',     label: 'Oldest first' },
  { key: 'reads-high', label: 'Reads: High → Low' },
  { key: 'reads-low',  label: 'Reads: Low → High' }
];

function SortSelect({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) {
  const [open, setOpen] = useState(false);
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDelistedPage() {
  const [items, setItems]               = useState<DelistedItem[]>(INITIAL_DELISTED_ITEMS);
  const [activeTab, setActiveTab]       = useState<FilterTab>('All');
  const [sortKey, setSortKey]           = useState<SortOption>('newest');
  
  // Modals state
  const [previewItem, setPreviewItem]   = useState<DelistedItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [lastAction, setLastAction]     = useState<{ type: 'delete' | 'restore'; item: DelistedItem } | null>(null);

  // Statistics counters
  const totalDelisted = items.length;
  const autoDelisted  = items.filter(i => i.reason === 'Creator unstaked').length;
  const adminRemoved  = items.filter(i => i.reason === 'Admin Removed').length;

  const countByTab = (tab: FilterTab) => {
    if (tab === 'All') return items.length;
    if (tab === 'Unstake') return items.filter(i => i.reason === 'Creator unstaked').length;
    if (tab === 'Reported') return items.filter(i => i.reason === 'Reported').length;
    return items.filter(i => i.reason === 'Admin Removed').length;
  };

  const filteredItems = useMemo(() => {
    let list = items;
    
    // Filter
    if (activeTab === 'Unstake') {
      list = list.filter(i => i.reason === 'Creator unstaked');
    } else if (activeTab === 'Reported') {
      list = list.filter(i => i.reason === 'Reported');
    } else if (activeTab === 'Admin Removed') {
      list = list.filter(i => i.reason === 'Admin Removed');
    }

    // Sort
    switch (sortKey) {
      case 'oldest':
        return [...list].reverse();
      case 'reads-high':
        return [...list].sort((a, b) => {
          const readsA = parseInt(a.subInfo.match(/(\d+)\s+reads/)?.[1] ?? '0');
          const readsB = parseInt(b.subInfo.match(/(\d+)\s+reads/)?.[1] ?? '0');
          return readsB - readsA;
        });
      case 'reads-low':
        return [...list].sort((a, b) => {
          const readsA = parseInt(a.subInfo.match(/(\d+)\s+reads/)?.[1] ?? '0');
          const readsB = parseInt(b.subInfo.match(/(\d+)\s+reads/)?.[1] ?? '0');
          return readsA - readsB;
        });
      default:
        return list; // newest
    }
  }, [items, activeTab, sortKey]);

  // Actions handlers
  const handleDelete = (id: number) => {
    const targetItem = items.find(i => i.id === id);
    if (!targetItem) return;
    setItems(prev => prev.filter(i => i.id !== id));
    setLastAction({ type: 'delete', item: targetItem });
    setSuccessBanner(`Listing "${targetItem.title}" deleted permanently.`);
    setConfirmDeleteId(null);
  };

  const handleRestore = (id: number) => {
    const targetItem = items.find(i => i.id === id);
    if (!targetItem) return;
    setItems(prev => prev.filter(i => i.id !== id));
    setLastAction({ type: 'restore', item: targetItem });
    setSuccessBanner(`Listing "${targetItem.title}" has been restored to production.`);
  };

  const handleUndo = () => {
    if (!lastAction) return;
    setItems(prev => [...prev, lastAction.item]);
    setLastAction(null);
    setSuccessBanner(null);
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto px-6 py-6">

        {/* Preview and delete modals */}
        {previewItem && (
          <ItemPreviewModal
            item={previewItem}
            onClose={() => setPreviewItem(null)}
            onRestore={handleRestore}
          />
        )}
        {confirmDeleteId !== null && (
          <DeleteConfirmModal
            onClose={() => setConfirmDeleteId(null)}
            onConfirm={() => handleDelete(confirmDeleteId)}
          />
        )}

        {/* Heading */}
        <h1 className="font-sans text-[1.875rem] font-bold leading-[34px] tracking-tight text-white/80">
          Delisted
        </h1>

        {/* Stat KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Total Delisted" value={totalDelisted} sub="All time" />
          <StatCard label="Auto delisted" value={autoDelisted} sub="Creator unstaked" subColor="#4ADE80" />
          <StatCard label="Admin removed" value={adminRemoved} sub="Policy violation or report" />
        </div>

        {/* Success Banner */}
        {successBanner && (
          <div className="flex items-center gap-3 rounded-xl border border-[#8C5CFF]/30 bg-[#8C5CFF]/10 px-5 py-3 font-sans text-[0.8125rem] text-white">
            <Check size={16} className="text-[#8C5CFF]" />
            <span>{successBanner}</span>
            <button
              type="button"
              onClick={handleUndo}
              className="ml-auto font-bold text-[#8C5CFF] hover:underline"
            >
              Undo Action
            </button>
            <button type="button" onClick={() => setSuccessBanner(null)} className="ml-3 text-white/40 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Filtering & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-[#080808] border border-border p-1 rounded-xl shadow-inner flex-wrap">
            {TABS.map(tab => (
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
                {countByTab(tab) > 0 && tab !== 'All' && (
                  <span className={`flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 font-sans text-[9px] font-bold ${
                    activeTab === tab ? 'bg-white/20 text-white' : 'bg-border text-[#A0A0A0]'
                  }`}>
                    {countByTab(tab)}
                  </span>
                )}
              </button>
            ))}
          </div>
          <SortSelect value={sortKey} onChange={setSortKey} />
        </div>

        {/* Grid / Table container */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-[2.5fr_1.5fr_1.5fr_1.5fr_1.5fr] gap-4 items-center px-6 py-3 border-b border-border bg-foreground/[0.015]">
            <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] uppercase tracking-wider">Content</p>
            <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] uppercase tracking-wider">Author</p>
            <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] uppercase tracking-wider">Reason</p>
            <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] uppercase tracking-wider">Date</p>
            <p className="font-sans text-[0.75rem] font-medium text-[#A0A0A0] uppercase tracking-wider text-right">Actions</p>
          </div>

          {/* Rows */}
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <p className="font-sans text-[0.8125rem] text-[#A0A0A0]">No delisted listings found</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                className="flex flex-col md:grid md:grid-cols-[2.5fr_1.5fr_1.5fr_1.5fr_1.5fr] gap-3 md:gap-4 items-start md:items-center px-6 py-4 border-b border-border hover:bg-foreground/[0.01] transition-colors"
              >
                {/* Content Column */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="font-sans text-[0.9375rem] font-semibold text-foreground truncate">{item.title}</p>
                  <p className="font-sans text-[0.75rem] text-[#A0A0A0] leading-[16px]">{item.subInfo}</p>
                </div>

                {/* Author Column */}
                <p className="font-sans text-[0.8125rem] text-[#8C5CFF] font-medium leading-[18px] truncate">
                  {item.authorHandle}
                </p>

                {/* Reason Column */}
                <div>
                  <span className="inline-block rounded-md bg-[#F87171]/10 border border-[#F87171]/20 px-2.5 py-0.5 font-sans text-[0.6875rem] font-medium text-[#F87171]">
                    {item.reason}
                  </span>
                </div>

                {/* Date Column */}
                <p className="font-sans text-[0.8125rem] text-[#A0A0A0] font-normal leading-[18px]">{item.dateText}</p>

                {/* Actions Column */}
                <div className="flex gap-2 w-full md:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1 rounded-xl border border-border hover:border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/5 text-white/95 hover:text-white px-3.5 py-2 font-sans text-[0.75rem] font-semibold transition-all active:scale-[0.98]"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(item.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1 rounded-xl bg-[#F87171] hover:bg-[#F87171]/90 text-white px-4 py-2 font-sans text-[0.75rem] font-semibold transition-all active:scale-[0.98] shadow-lg shadow-[#F87171]/15"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
