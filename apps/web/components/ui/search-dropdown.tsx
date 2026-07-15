'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Clock, ChevronRight, Briefcase, FileText, User } from 'lucide-react';
import {
  mockSearchAll,
  getSearchHistory,
  removeFromSearchHistory,
  clearSearchHistory,
  type SearchApiResponse,
} from '@/lib/search-service';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchDropdownProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: (q: string) => void;
  onClose: () => void;
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonSuggestion() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 animate-pulse" aria-hidden="true">
      <div className="h-4 w-4 rounded bg-foreground/10 shrink-0" />
      <div className="h-3 w-32 rounded bg-foreground/10" />
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</span>
      {action}
    </div>
  );
}

// ─── Idle State (Recent Searches Only) ────────────────────────────────────────

function IdleDropdown({
  history,
  onHistorySelect,
  onHistoryRemove,
  onHistoryClear,
}: {
  history: string[];
  onHistorySelect: (q: string) => void;
  onHistoryRemove: (q: string) => void;
  onHistoryClear: () => void;
}) {
  return (
    <div className="flex flex-col">
      <section aria-label="Recent searches">
        <SectionHeader
          label="Recent"
          action={
            <button
              type="button"
              onClick={onHistoryClear}
              className="text-[11px] text-primary hover:text-primary-hover transition-colors cursor-pointer"
            >
              Clear
            </button>
          }
        />
        {history.slice(0, 5).map((item) => (
          <div
            key={item}
            className="group flex items-center gap-3 px-4 py-2 hover:bg-foreground/[0.03] transition-colors"
          >
            <Clock size={14} className="text-muted shrink-0" />
            <button
              type="button"
              className="flex-1 text-left text-[13px] text-foreground/80 cursor-pointer"
              onClick={() => onHistorySelect(item)}
            >
              {item}
            </button>
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={(e) => { e.stopPropagation(); onHistoryRemove(item); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-foreground cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

// ─── Live Results ─────────────────────────────────────────────────────────────

interface SuggestionItem {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  key: string;
}

function LiveDropdown({
  results,
  loading,
  query,
  activeIndex,
  onSelect,
  onViewAll,
}: {
  results: SearchApiResponse | null;
  loading: boolean;
  query: string;
  activeIndex: number;
  onSelect: (q: string) => void;
  onViewAll: () => void;
}) {
  if (loading) {
    return (
      <div className="py-2" aria-live="polite" aria-label="Searching">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonSuggestion key={i} />
        ))}
      </div>
    );
  }

  const items: SuggestionItem[] = [];

  if (results) {
    results.suggestions.forEach((s) =>
      items.push({ icon: <Search size={13} className="text-muted" />, label: s, key: `sug-${s}` })
    );
    results.users.slice(0, 2).forEach((u) =>
      items.push({ icon: <User size={13} className="text-primary/70" />, label: u.name, sub: u.handle, key: u.id })
    );
    results.services.slice(0, 2).forEach((s) =>
      items.push({ icon: <Briefcase size={13} className="text-[#4ADE80]/80" />, label: s.title, sub: 'Service', key: s.id })
    );
    results.articles.slice(0, 1).forEach((a) =>
      items.push({ icon: <FileText size={13} className="text-[#5993F4]/80" />, label: a.title, sub: 'Article', key: a.id })
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-4 py-8 text-center" aria-live="polite">
        <p className="text-[13px] text-muted">
          No results found for <strong className="text-foreground">&ldquo;{query}&rdquo;</strong>
        </p>
      </div>
    );
  }

  return (
    <div aria-live="polite">
      {items.map((item, idx) => (
        <button
          key={item.key}
          type="button"
          role="option"
          aria-selected={idx === activeIndex}
          onClick={() => onSelect(item.label)}
          className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors cursor-pointer ${
            idx === activeIndex ? 'bg-primary/10' : 'hover:bg-foreground/[0.03]'
          }`}
        >
          <span className="shrink-0">{item.icon}</span>
          <span className="flex-1 min-w-0">
            <span className="text-[13px] text-foreground/90 block truncate">{item.label}</span>
            {item.sub && <span className="text-[11px] text-muted">{item.sub}</span>}
          </span>
          <ChevronRight size={12} className="text-muted/50 shrink-0" />
        </button>
      ))}
      {results && results.totalCount > 0 && (
        <div className="border-t border-border px-4 py-2.5">
          <button
            type="button"
            onClick={onViewAll}
            className="w-full text-center text-[12px] text-primary hover:text-primary-hover transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            View all {results.totalCount} results for &ldquo;{query}&rdquo;
            <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function SearchDropdown({ query, onQueryChange, onSearch, onClose }: SearchDropdownProps) {
  const [history, setHistory] = useState<string[]>([]);
  const [results, setResults] = useState<SearchApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  // 300ms debounced search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }
    setLoading(true);
    setActiveIndex(-1);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setResults(mockSearchAll(q));
      setLoading(false);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const handleHistoryRemove = useCallback((item: string) => {
    removeFromSearchHistory(item);
    setHistory(getSearchHistory());
  }, []);

  const handleHistoryClear = useCallback(() => {
    clearSearchHistory();
    setHistory([]);
  }, []);

  const handleSelect = useCallback((q: string) => {
    onSearch(q);
  }, [onSearch]);

  const isIdle = query.trim().length < 2;

  // Don't show dropdown if idle and there is no history to show
  if (isIdle && history.length === 0) {
    return null;
  }

  return (
    <div
      role="listbox"
      aria-label="Search suggestions"
      className="absolute left-0 right-0 top-full mt-2 z-50 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden overflow-y-auto animate-in fade-in duration-200"
      style={{ maxHeight: 'min(480px, 80vh)' }}
    >
      {isIdle ? (
        <IdleDropdown
          history={history}
          onHistorySelect={handleSelect}
          onHistoryRemove={handleHistoryRemove}
          onHistoryClear={handleHistoryClear}
        />
      ) : (
        <LiveDropdown
          results={results}
          loading={loading}
          query={query}
          activeIndex={activeIndex}
          onSelect={handleSelect}
          onViewAll={() => onSearch(query)}
        />
      )}
    </div>
  );
}
