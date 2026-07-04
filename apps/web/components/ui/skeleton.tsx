'use client';

// ─── CanaFri Skeleton Loading System ─────────────────────────────────────────
//
// Usage:
//   import { DashboardPageSkeleton } from '@/components/ui/skeleton';
//   if (loading) return <DashboardPageSkeleton />;
//
// All skeleton components mirror the exact dimensions, spacing, and
// border-radius of their real counterparts to prevent layout shift.
// The shimmer animation is defined in globals.css (.skeleton class).
// ─────────────────────────────────────────────────────────────────────────────

// ── Primitive ─────────────────────────────────────────────────────────────────

interface SkeletonBlockProps {
  className?: string;
  style?: React.CSSProperties;
}

export function SkeletonBlock({ className = '', style }: SkeletonBlockProps) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

// ── Post Card Skeleton (Dashboard feed — mirrors PostCard) ────────────────────

export function PostCardSkeleton() {
  return (
    <div
      className="flex flex-col justify-between p-4 gap-4 border-b border-border bg-background"
      style={{ minHeight: 170 }}
      aria-hidden="true"
    >
      {/* Avatar + header row */}
      <div className="flex items-start gap-3 flex-1">
        <SkeletonBlock className="skeleton-avatar size-[38px] shrink-0" />
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {/* Name + handle row */}
          <div className="flex items-center gap-2">
            <SkeletonBlock className="skeleton-text w-24" />
            <SkeletonBlock className="skeleton-text w-16" />
          </div>
          {/* Text lines */}
          <SkeletonBlock className="skeleton-text w-full" />
          <SkeletonBlock className="skeleton-text w-[90%]" />
          <SkeletonBlock className="skeleton-text w-[75%]" />
        </div>
      </div>
      {/* Action bar */}
      <div className="flex items-center justify-between w-full pt-2 px-1">
        {[...Array(5)].map((_, i) => (
          <SkeletonBlock key={i} className="skeleton-avatar size-4" />
        ))}
      </div>
    </div>
  );
}

// ── Post Detail Skeleton (Dashboard right panel) ──────────────────────────────

export function PostDetailSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-4 lg:p-6 h-full" aria-hidden="true">
      {/* Author row */}
      <div className="flex items-start gap-3">
        <SkeletonBlock className="skeleton-avatar size-10 shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <SkeletonBlock className="skeleton-text w-28" />
          <SkeletonBlock className="skeleton-text w-20" />
        </div>
      </div>
      {/* Body text */}
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="skeleton-text w-full" />
        <SkeletonBlock className="skeleton-text w-full" />
        <SkeletonBlock className="skeleton-text w-[95%]" />
        <SkeletonBlock className="skeleton-text w-[88%]" />
        <SkeletonBlock className="skeleton-text w-[70%]" />
      </div>
      {/* Action bar */}
      <div className="flex items-center justify-between w-full px-1">
        {[...Array(4)].map((_, i) => (
          <SkeletonBlock key={i} className="skeleton-avatar size-4" />
        ))}
      </div>
      {/* Divider */}
      <div className="h-px w-full bg-border" />
      {/* Comment heading */}
      <SkeletonBlock className="skeleton-text w-20" />
      {/* Comment rows */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-0">
          <SkeletonBlock className="skeleton-avatar size-8 shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <SkeletonBlock className="skeleton-text w-24" />
            <SkeletonBlock className="skeleton-text w-full" />
            <SkeletonBlock className="skeleton-text w-[80%]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Job Card Skeleton (Find Job left list) ────────────────────────────────────

export function JobCardSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 px-4 py-5 border-b border-[#D8D8D8] dark:border-[#121212] bg-card"
      aria-hidden="true"
    >
      {/* Title + date */}
      <div className="flex justify-between items-start gap-2">
        <SkeletonBlock className="skeleton-text flex-1" style={{ height: '1rem' }} />
        <SkeletonBlock className="skeleton-text w-14 shrink-0" />
      </div>
      {/* Pay row */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <SkeletonBlock className="skeleton-text w-16" />
          <SkeletonBlock className="skeleton-text w-12" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBlock className="skeleton-text w-20" />
          <SkeletonBlock className="skeleton-text w-32" />
        </div>
      </div>
      {/* Description */}
      <SkeletonBlock className="skeleton-text w-full" />
      <SkeletonBlock className="skeleton-text w-[85%]" />
      {/* Tags */}
      <div className="flex items-center gap-2">
        {[48, 56, 44, 60].map((w, i) => (
          <SkeletonBlock key={i} className="skeleton" style={{ width: w, height: 22, borderRadius: 3 }} />
        ))}
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between">
        <SkeletonBlock className="skeleton-text w-24" />
        <SkeletonBlock className="skeleton-text w-16" />
      </div>
    </div>
  );
}

// ── Job Detail Skeleton (Find Job right panel) ────────────────────────────────

export function JobDetailSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-5 overflow-y-auto h-full" aria-hidden="true">
      {/* Header */}
      <SkeletonBlock className="skeleton-text w-[60%]" style={{ height: '1.1rem' }} />
      <div className="flex items-center gap-3">
        <SkeletonBlock className="skeleton-text w-20" />
        <SkeletonBlock className="skeleton-text w-16" />
      </div>
      <div className="h-px w-full bg-border" />
      {/* Body sections */}
      {[...Array(3)].map((_, s) => (
        <div key={s} className="flex flex-col gap-2">
          <SkeletonBlock className="skeleton-text w-28" style={{ height: '0.8rem' }} />
          <SkeletonBlock className="skeleton-text w-full" />
          <SkeletonBlock className="skeleton-text w-[90%]" />
          <SkeletonBlock className="skeleton-text w-[75%]" />
          <div className="h-px w-full bg-border mt-2" />
        </div>
      ))}
      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {[56, 72, 48, 64, 52].map((w, i) => (
          <SkeletonBlock key={i} className="skeleton" style={{ width: w, height: 26, borderRadius: 3 }} />
        ))}
      </div>
      {/* Action buttons */}
      <div className="flex flex-col gap-3 mt-auto pt-4">
        <SkeletonBlock className="skeleton-btn w-full" />
        <SkeletonBlock className="skeleton-btn w-full" />
      </div>
    </div>
  );
}

// ── Conversation Row Skeleton (Messages left list) ────────────────────────────

export function ConversationRowSkeleton() {
  return (
    <div
      className="flex items-center gap-3 px-5 py-4 border-b border-[#D8D8D8] dark:border-[#121212]"
      aria-hidden="true"
    >
      <SkeletonBlock className="skeleton-avatar size-[46px] shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <SkeletonBlock className="skeleton-text w-28" />
          <SkeletonBlock className="skeleton-text w-10" />
        </div>
        <SkeletonBlock className="skeleton-text w-[80%]" />
        <SkeletonBlock className="skeleton-text w-[60%]" />
      </div>
    </div>
  );
}

// ── Chat Panel Skeleton (Messages right panel) ────────────────────────────────

export function ChatPanelSkeleton() {
  return (
    <div className="flex flex-col h-full bg-background" aria-hidden="true">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#D8D8D8] dark:border-[#121212]">
        <SkeletonBlock className="skeleton-avatar size-9 shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <SkeletonBlock className="skeleton-text w-32" />
          <SkeletonBlock className="skeleton-text w-20" />
        </div>
      </div>
      {/* Messages area */}
      <div className="flex-1 px-4 py-5 flex flex-col gap-4">
        <div className="flex justify-start">
          <SkeletonBlock className="skeleton" style={{ width: '55%', height: 60, borderRadius: '1rem 1rem 1rem 2px' }} />
        </div>
        <div className="flex justify-end">
          <SkeletonBlock className="skeleton" style={{ width: '45%', height: 60, borderRadius: '1rem 1rem 2px 1rem' }} />
        </div>
        <div className="flex justify-start">
          <SkeletonBlock className="skeleton" style={{ width: '60%', height: 48, borderRadius: '1rem 1rem 1rem 2px' }} />
        </div>
        <div className="flex justify-end">
          <SkeletonBlock className="skeleton" style={{ width: '40%', height: 48, borderRadius: '1rem 1rem 2px 1rem' }} />
        </div>
      </div>
      {/* Input bar */}
      <div className="flex items-center gap-3 px-4 py-4 border-t border-[#D8D8D8] dark:border-[#121212]">
        <SkeletonBlock className="skeleton flex-1" style={{ height: 40, borderRadius: 9999 }} />
        <SkeletonBlock className="skeleton-avatar size-8" />
        <SkeletonBlock className="skeleton-avatar size-8" />
      </div>
    </div>
  );
}

// ── Transaction Row Skeleton (Wallet) ─────────────────────────────────────────

export function TransactionRowSkeleton({ isFirst = false }: { isFirst?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-4 bg-card rounded-[10px] ${
        isFirst
          ? 'border border-[#D8D8D8] dark:border-[#121212]'
          : 'border-r border-b border-l border-[#D8D8D8] dark:border-[#121212]'
      }`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2.5">
        <SkeletonBlock className="skeleton-avatar size-6 shrink-0" />
        <div className="flex flex-col gap-1">
          <SkeletonBlock className="skeleton-text w-16" />
          <SkeletonBlock className="skeleton-text w-24" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <SkeletonBlock className="skeleton-text w-20" />
        <SkeletonBlock className="skeleton-text w-10" />
      </div>
    </div>
  );
}

// ── Wallet Balance Skeleton ───────────────────────────────────────────────────

export function WalletBalanceSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-[#D8D8D8] dark:border-[#121212] bg-[#FDFDFD] dark:bg-[#080808] px-5 pt-0 pb-6" aria-hidden="true">
      {/* Account row */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <SkeletonBlock className="skeleton-avatar size-[26px]" />
          <SkeletonBlock className="skeleton-text w-28" />
        </div>
        <SkeletonBlock className="skeleton-text w-20" />
      </div>
      {/* Balance card */}
      <div className="flex flex-col gap-[35px] rounded-3xl border border-[#D8D8D8] dark:border-[#121212] bg-[#F5F8FB] dark:bg-[#0B0B0B] p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1.5">
              <SkeletonBlock className="skeleton-text w-20" />
              <SkeletonBlock className="skeleton-text w-32" style={{ height: '1.5rem' }} />
              <SkeletonBlock className="skeleton-text w-16" />
            </div>
            <SkeletonBlock className="skeleton-avatar size-6" />
          </div>
          <SkeletonBlock className="skeleton" style={{ width: 80, height: 20, borderRadius: 4 }} />
          <SkeletonBlock className="skeleton-text w-48" />
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {[...Array(4)].map((_, i) => (
            <SkeletonBlock key={i} className="skeleton-btn flex-1" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Stat Card Skeleton (Analysis) ─────────────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <div className="relative rounded-2xl border border-border bg-card flex items-start justify-between gap-3 p-6 min-w-0 flex-1" aria-hidden="true">
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <SkeletonBlock className="skeleton-text w-24" />
        <SkeletonBlock className="skeleton-text w-20" style={{ height: '1.5rem' }} />
        <SkeletonBlock className="skeleton-text w-16" />
      </div>
      <SkeletonBlock className="skeleton-avatar size-5 mt-1 shrink-0" />
    </div>
  );
}

// ── Feed Row Skeleton (Analysis activity feed) ────────────────────────────────

export function FeedRowSkeleton() {
  return (
    <div className="flex items-start justify-between gap-3 w-full min-w-0" aria-hidden="true">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <SkeletonBlock className="skeleton" style={{ width: 45, height: 45, borderRadius: '0.75rem', flexShrink: 0 }} />
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <SkeletonBlock className="skeleton-text w-36" />
          <SkeletonBlock className="skeleton-text w-24" />
        </div>
      </div>
      <SkeletonBlock className="skeleton-text w-10 shrink-0" />
    </div>
  );
}

// ── Quick Action Card Skeleton (Analysis) ─────────────────────────────────────

export function QuickActionCardSkeleton() {
  return (
    <div className="relative rounded-2xl border border-border bg-card flex h-[100px] items-center gap-4 p-5 min-w-0 flex-1" aria-hidden="true">
      <SkeletonBlock className="skeleton" style={{ width: 45, height: 45, borderRadius: '0.75rem', flexShrink: 0 }} />
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <SkeletonBlock className="skeleton-text w-32" />
        <SkeletonBlock className="skeleton-text w-20" />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Full-Page Skeleton Wrappers
// ═════════════════════════════════════════════════════════════════════════════

// ── Dashboard Page Skeleton ───────────────────────────────────────────────────

export function DashboardPageSkeleton() {
  return (
    <div className="h-full w-full bg-background flex overflow-hidden" aria-label="Loading dashboard" aria-busy="true">
      <div className="flex flex-1 gap-6 px-0 py-0 h-full max-w-[1400px] mx-auto">

        {/* Left Panel: Feed skeleton */}
        <div className="flex flex-col flex-1 bg-background overflow-hidden h-full">
          {/* Tab bar */}
          <div className="border-b border-border bg-background shrink-0 h-14 flex items-end justify-center gap-12 px-4">
            <div className="pb-2"><SkeletonBlock className="skeleton-text w-24" /></div>
            <div className="pb-2"><SkeletonBlock className="skeleton-text w-28" /></div>
          </div>
          {/* Post cards */}
          <div className="flex flex-col overflow-y-auto no-scrollbar flex-1">
            {[...Array(4)].map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        </div>

        {/* Right Panel: Detail skeleton — desktop only */}
        <div className="hidden md:flex flex-col flex-1 border-l border-border h-full">
          <PostDetailSkeleton />
        </div>

      </div>
    </div>
  );
}

// ── Find Job Page Skeleton ────────────────────────────────────────────────────

export function FindJobPageSkeleton() {
  return (
    <div className="h-full w-full flex overflow-hidden" aria-label="Loading jobs" aria-busy="true">
      <div className="flex flex-1 h-full">
        {/* Left: Job list */}
        <div className="flex flex-col w-full lg:w-[380px] lg:flex-shrink-0 h-full border-r border-[#D8D8D8] dark:border-[#121212]">
          <div className="flex items-center gap-3 px-4 py-4 border-b border-[#D8D8D8] dark:border-[#121212]">
            <SkeletonBlock className="skeleton flex-1" style={{ height: 36, borderRadius: 9999 }} />
          </div>
          <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
            {[...Array(4)].map((_, i) => <JobCardSkeleton key={i} />)}
          </div>
        </div>
        {/* Right: Detail — desktop only */}
        <div className="hidden lg:flex flex-col flex-1 min-w-0 h-full">
          <JobDetailSkeleton />
        </div>
      </div>
    </div>
  );
}

// ── Messages Page Skeleton ────────────────────────────────────────────────────

export function MessagesPageSkeleton() {
  return (
    <div className="h-full w-full flex overflow-hidden" aria-label="Loading messages" aria-busy="true">
      <div className="flex flex-1 h-full">
        {/* Left: Conversation list */}
        <div className="flex flex-col w-full lg:w-[380px] lg:flex-shrink-0 h-full border-r border-[#D8D8D8] dark:border-[#121212] bg-[#FAFAFD] dark:bg-[#0B0B0B]">
          <div className="px-5 pt-6 pb-4">
            <SkeletonBlock className="skeleton-text w-28" style={{ height: '1.125rem', marginBottom: '1rem' }} />
            <SkeletonBlock className="skeleton flex-1" style={{ height: 40, borderRadius: 9999 }} />
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {[...Array(6)].map((_, i) => <ConversationRowSkeleton key={i} />)}
          </div>
        </div>
        {/* Right: Chat — desktop only */}
        <div className="hidden lg:flex flex-col flex-1 min-w-0 h-full">
          <ChatPanelSkeleton />
        </div>
      </div>
    </div>
  );
}

// ── Wallet Page Skeleton ──────────────────────────────────────────────────────

export function WalletPageSkeleton() {
  return (
    <div className="h-full w-full flex overflow-hidden" aria-label="Loading wallet" aria-busy="true">
      <div className="flex flex-1 gap-6 px-4 sm:px-8 h-full">
        {/* Left: Wallet panel */}
        <div className="flex flex-col flex-1 min-w-0 h-full">
          <div className="flex flex-col gap-6 flex-1 px-0 py-6 overflow-y-auto no-scrollbar">
            <SkeletonBlock className="skeleton-text w-28" style={{ height: '1rem' }} />
            <WalletBalanceSkeleton />
            <SkeletonBlock className="skeleton-text w-40" style={{ height: '0.875rem' }} />
            <div className="flex flex-col">
              {[...Array(5)].map((_, i) => <TransactionRowSkeleton key={i} isFirst={i === 0} />)}
            </div>
          </div>
        </div>
        {/* Right: Transaction detail — desktop only */}
        <div className="hidden lg:flex flex-col flex-1 min-w-0 h-full py-6">
          <div className="flex flex-col gap-4">
            <SkeletonBlock className="skeleton-text w-32" style={{ height: '1rem' }} />
            <div className="flex flex-col items-center gap-2 py-4">
              <SkeletonBlock className="skeleton-avatar size-12" />
              <SkeletonBlock className="skeleton-text w-40" style={{ height: '1.5rem' }} />
              <SkeletonBlock className="skeleton-text w-16" />
            </div>
            <div className="flex flex-col gap-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <SkeletonBlock className="skeleton-text w-24" />
                    <SkeletonBlock className="skeleton-text w-32" />
                  </div>
                  <div className="h-px w-full bg-[#D8D8D8] dark:bg-[#121212]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Analysis Page Skeleton ────────────────────────────────────────────────────

export function AnalysisPageSkeleton() {
  return (
    <div className="flex h-full w-full flex-col bg-background overflow-y-auto no-scrollbar" aria-label="Loading analysis" aria-busy="true">
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <div className="flex flex-col gap-3">
          <SkeletonBlock className="skeleton-text w-32" style={{ height: '2.25rem' }} />
          <SkeletonBlock className="skeleton-text w-40" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>

        {/* Quick action cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
          {[...Array(3)].map((_, i) => <QuickActionCardSkeleton key={i} />)}
        </div>

        {/* CTA cards */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="relative rounded-2xl border border-border bg-card flex h-[100px] items-center justify-between gap-4 px-4 py-5 min-w-0 flex-1" aria-hidden="true">
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <SkeletonBlock className="skeleton-text w-36" style={{ height: '1.5rem' }} />
                <SkeletonBlock className="skeleton-text w-48" />
              </div>
              <SkeletonBlock className="skeleton-btn w-24 shrink-0" />
            </div>
          ))}
        </div>

        {/* Feed cards */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          {[...Array(2)].map((_, col) => (
            <div key={col} className="relative rounded-2xl border border-border bg-card p-5 flex flex-col gap-4" aria-hidden="true">
              <SkeletonBlock className="skeleton-text w-40" style={{ height: '0.875rem' }} />
              <div className="flex flex-col gap-4">
                {[...Array(4)].map((_, i) => <FeedRowSkeleton key={i} />)}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
