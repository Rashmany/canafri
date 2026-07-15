'use client';
import { useState, useRef, useCallback } from "react";
import { FileText, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import Footer from '@/components/layout/footer';

const getStatusStyles = (status: string) => {
  switch (status.toLowerCase()) {
    case 'in progress':
      return 'bg-[#8C5CFF]/15 text-[#8C5CFF]/80';
    case 'pending':
      return 'bg-amber-500/15 text-amber-600/80 dark:text-amber-400/80';
    case 'completed':
      return 'bg-emerald-500/15 text-emerald-600/80 dark:text-emerald-400/80';
    case 'late':
      return 'bg-rose-500/15 text-rose-600/80 dark:text-rose-400/80';
    case 'cancelled':
    case 'cancel':
      return 'bg-foreground/10 text-muted/80';
    default:
      return 'bg-[#8C5CFF]/15 text-[#8C5CFF]/80';
  }
};

interface StatCard {
  label: string;
  value: string;
  sub: string;
  subClassName: string;
}

const stats: StatCard[] = [
  { label: "Active Orders",   value: "0", sub: "In progress",         subClassName: "text-muted/80" },
  { label: "CC in Escrow",    value: "0", sub: "Locked across orders", subClassName: "text-[#4ADE80]/80" },
  { label: "Awaiting Review", value: "0", sub: "Action needed",        subClassName: "text-muted/80" },
  { label: "Completed",       value: "0", sub: "All time",             subClassName: "text-muted/80" },
];

const tabs = [
  { label: "New",              count: 1 },
  { label: "Active",           count: 1 },
  { label: "Late",             count: 1 },
  { label: "Delivered",        count: 1 },
  { label: "Completed",        count: 1 },
  { label: "Cancel",           count: 1 },
  { label: "Starred",          count: 1 },
  { label: "Dispute/Approve",  count: 1 },
];

interface Order {
  name: string;
  handle: string;
  title: string;
  subtitle: string;
  date: string;
  price: string;
  status: "in progress" | "pending" | "delivered";
  avatarClassName: string;
  initials: string;
}

const orders: Order[] = [
  { name: "John Trek", handle: "@johntrek", title: "Create landing page,", subtitle: "Web development", date: "Mar. 26", price: "$26", status: "in progress", avatarClassName: "bg-[#291D46]", initials: "JT" },
  { name: "John Trek", handle: "@johntrek", title: "Create landing page,", subtitle: "Web development", date: "Mar. 26", price: "$26", status: "delivered",    avatarClassName: "bg-[#291D46]", initials: "JT" },
  { name: "John Trek", handle: "@johntrek", title: "Create landing page,", subtitle: "Web development", date: "Mar. 26", price: "$26", status: "pending",     avatarClassName: "bg-[#291D46]", initials: "JT" },
];

/* ─── Tab Button ─────────────────────────────────────────────────────────────*/
function TabButton({ label, count, isActive, onClick }: {
  label: string; count: number; isActive: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const stroke = "inset 0 0.5px 0 0 #8C5CFF, inset 0.5px 0 0 0 #8C5CFF, inset -0.5px 0 0 0 #8C5CFF, inset 0 -2px 0 0 #8C5CFF";
  const shadow = isActive ? stroke : (hovered ? stroke : "none");

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ boxShadow: shadow }}
      className={cn(
        "flex-1 flex items-center justify-center gap-[0.375rem] h-full relative px-4",
        "font-sans text-[0.8125rem] leading-[1.125rem] select-none cursor-pointer whitespace-nowrap",
        "transition-all duration-200 ease-out transform",
        isActive
          ? "font-semibold text-foreground/80 bg-[#8C5CFF]/10 dark:bg-[#8C5CFF]/15 scale-[1.02] z-10"
          : "font-normal text-muted/80 bg-transparent hover:text-foreground/80 hover:scale-[1.01] hover:z-10"
      )}
    >
      <span>{label}</span>
      <span className={cn(
        "flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full px-[0.25rem]",
        "text-[0.6875rem] font-medium transition-colors duration-200",
        isActive ? "bg-[#8C5CFF] text-white opacity-80" : "bg-foreground/10 text-muted/80",
      )}>
        {count}
      </span>
    </button>
  );
}

/* ─── Tab Scroll Container with arrow buttons ─────────────────────────────── */
function TabScrollContainer({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 2);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -160 : 160, behavior: 'smooth' });
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Left scroll arrow — mobile only */}
      <button
        onClick={() => scroll('left')}
        aria-label="Scroll tabs left"
        className={cn(
          "absolute left-0 top-0 h-full z-20 flex items-center justify-center w-14 lg:hidden cursor-pointer",
          "bg-gradient-to-r from-[#FAFAFD] dark:from-[#0B0B0B] via-[#FAFAFD]/90 dark:via-[#0B0B0B]/90 to-transparent",
          "transition-opacity duration-200",
          showLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <ChevronLeft size={28} strokeWidth={2} className="text-muted/80" />
      </button>

      {/* Scrollable tab strip */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex h-full w-full overflow-x-auto no-scrollbar"
      >
        <div className="flex h-full min-w-max lg:min-w-0 lg:w-full">
          {children}
        </div>
      </div>

      {/* Right scroll arrow — mobile only */}
      <button
        onClick={() => scroll('right')}
        aria-label="Scroll tabs right"
        className={cn(
          "absolute right-0 top-0 h-full z-20 flex items-center justify-center w-14 lg:hidden cursor-pointer",
          "bg-gradient-to-l from-[#FAFAFD] dark:from-[#0B0B0B] via-[#FAFAFD]/90 dark:via-[#0B0B0B]/90 to-transparent",
          "transition-opacity duration-200",
          showRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <ChevronRight size={28} strokeWidth={2} className="text-muted/80" />
      </button>
    </div>
  );
}

/* ─── Search Toolbar: Search + Filter + Sort ─────────────────────────────── */
function SearchToolbar() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen]     = useState(false);
  const [filter, setFilter]         = useState('All');
  const [sort, setSort]             = useState('Newest');

  const filters = ['All', 'In Progress', 'Pending', 'Completed', 'Late', 'Starred'];
  const sorts   = ['Newest', 'Oldest', 'Price: Low to High', 'Price: High to Low', 'Name A–Z'];

  const baseDropdown = "absolute right-0 top-[calc(100%+6px)] z-50 min-w-[10rem] rounded-xl border border-[#D8D8D8] dark:border-[#1e1e1e] bg-[#FAFAFD] dark:bg-[#0B0B0B] shadow-lg overflow-hidden";
  const dropItem     = "w-full px-3.5 py-2 text-left text-[0.8125rem] text-foreground/80 hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors duration-150 cursor-pointer";
  const dropActive   = "bg-[#8C5CFF]/10 dark:bg-[#8C5CFF]/15 text-[#8C5CFF]/80 font-semibold";
  const pill         = "flex items-center gap-1.5 px-4 py-[0.5625rem] rounded-[3.125rem] bg-[#F5F8FB] dark:bg-[#161616] border border-[#D8D8D8] dark:border-[#1e1e1e] text-[0.8125rem] font-medium text-foreground/80 cursor-pointer select-none hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors duration-150 whitespace-nowrap";

  return (
    <div className="flex items-center gap-2 w-full">

      {/* ── Search (flex-grow) ── */}
      <div className="flex items-center gap-3 px-4 py-[0.5625rem] rounded-[3.125rem] bg-[#F5F8FB] dark:bg-[#161616] border border-[#D8D8D8] dark:border-[#1e1e1e] flex-1 min-w-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="shrink-0 text-foreground/40">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          type="text"
          placeholder="Search orders..."
          className="w-full bg-transparent text-[#010101]/80 dark:text-[rgba(255,255,255,0.8)] text-[0.8125rem] leading-[1.125rem] placeholder:text-muted/80 outline-none"
        />
      </div>

      {/* ── Filter dropdown ── */}
      <div className="relative shrink-0">
        <button
          id="orders-filter-trigger"
          onClick={() => { setFilterOpen(v => !v); setSortOpen(false); }}
          className={pill}
        >
          {/* Filter icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="text-foreground/50">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <span className="hidden sm:inline">Filter:</span>
          <span className="text-[#8C5CFF]/80 font-semibold">{filter}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={cn("text-foreground/40 transition-transform duration-200", filterOpen && "rotate-180")}>
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        {filterOpen && (
          <div className={baseDropdown}>
            {filters.map(f => (
              <button key={f} onClick={() => { setFilter(f); setFilterOpen(false); }}
                className={cn(dropItem, filter === f && dropActive)}>
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Sort by dropdown ── */}
      <div className="relative shrink-0">
        <button
          id="orders-sort-trigger"
          onClick={() => { setSortOpen(v => !v); setFilterOpen(false); }}
          className={pill}
        >
          {/* Sort icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="text-foreground/50">
            <path d="M3 6h18M7 12h10M11 18h2"/>
          </svg>
          <span className="hidden sm:inline">Sort:</span>
          <span className="text-[#8C5CFF]/80 font-semibold truncate max-w-[5rem]">{sort}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={cn("text-foreground/40 transition-transform duration-200", sortOpen && "rotate-180")}>
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        {sortOpen && (
          <div className={baseDropdown}>
            {sorts.map(s => (
              <button key={s} onClick={() => { setSort(s); setSortOpen(false); }}
                className={cn(dropItem, sort === s && dropActive)}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────────────────────────── */
export default function OrdersPage({ onOrderClick, onDisputeApproveClick }: { onOrderClick?: () => void; onDisputeApproveClick?: () => void }) {
  const [activeTab, setActiveTab] = useState("New");

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-y-auto no-scrollbar">
      <div className="mx-auto flex max-w-6xl flex-col gap-9 px-4 py-10 sm:px-6 lg:px-8 w-full">

        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground/80 sm:text-[2rem]">
          Manage sales
        </h1>

        {/* ── Stat Cards ──
            Desktop (lg+): 4 separate cards
            Mobile & Tablet (<lg): 1 card with 2×2 internal grid
        */}
        <div>
          {/* Desktop */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="h-[7.5rem] rounded-2xl border border-[#D8D8D8] dark:border-[#121212] bg-[#FAFAFD] dark:bg-[#0B0B0B] px-6 flex flex-col justify-center gap-1.5">
                <span className="text-[0.8125rem] font-medium text-muted/80">{stat.label}</span>
                <span className="text-[1.375rem] font-medium tracking-[-0.066px] text-foreground/80">{stat.value}</span>
                <span className={cn("text-[0.6875rem]", stat.subClassName)}>{stat.sub}</span>
              </div>
            ))}
          </div>

          {/* Mobile & Tablet — single wrapper card, 2×2 grid */}
          <div className="lg:hidden rounded-2xl border border-[#D8D8D8] dark:border-[#121212] bg-[#FAFAFD] dark:bg-[#0B0B0B] overflow-hidden">
            <div className="grid grid-cols-2">
              {stats.map((stat, idx) => (
                <div
                  key={stat.label}
                  className={cn(
                    "h-[7.5rem] px-5 sm:px-6 flex flex-col justify-center gap-1.5",
                    idx === 0 && "border-r border-b border-[#D8D8D8]/50 dark:border-[#121212]/50",
                    idx === 1 && "border-b border-[#D8D8D8]/50 dark:border-[#121212]/50",
                    idx === 2 && "border-r border-[#D8D8D8]/50 dark:border-[#121212]/50",
                  )}
                >
                  <span className="text-[0.8125rem] font-medium text-muted/80">{stat.label}</span>
                  <span className="text-[1.375rem] font-medium tracking-[-0.066px] text-foreground/80">{stat.value}</span>
                  <span className={cn("text-[0.6875rem]", stat.subClassName)}>{stat.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs + Table ── */}
        <div className="flex flex-col gap-4 md:gap-6">

          <div className="flex flex-col gap-[5px]">
            {/* Search toolbar — fills full width */}
            <SearchToolbar />

            {/* Tab buttons with scroll arrows on mobile */}
            <div className="w-full h-[3.75rem] border border-[#D8D8D8] dark:border-[#121212] bg-[#FAFAFD] dark:bg-[#0B0B0B]">
              <TabScrollContainer>
                {tabs.map((tab) => (
                  <TabButton
                    key={tab.label}
                    label={tab.label}
                    count={tab.count}
                    isActive={tab.label === activeTab}
                    onClick={() => setActiveTab(tab.label)}
                  />
                ))}
              </TabScrollContainer>
            </div>
          </div>

          {/* Orders table card */}
          <div className="overflow-hidden rounded-2xl border border-[#D8D8D8] dark:border-[#121212] bg-[#FAFAFD] dark:bg-[#0B0B0B]">

            {/* Active tab header */}
            <div className="px-6 py-4 border-b border-[#D8D8D8] dark:border-[#121212] bg-foreground/[0.01] dark:bg-white/[0.01] flex items-center justify-between">
              <h2 className="text-[0.9375rem] font-semibold text-foreground/80">{activeTab} Sales</h2>
              <span className="text-[0.6875rem] font-medium text-muted/80">Showing your {activeTab.toLowerCase()} orders</span>
            </div>

            {/* Horizontally scrollable table wrapper (handles mobile overflow) */}
            <div className="overflow-x-auto no-scrollbar">
              {/* Column headers — visible on all sizes */}
              <div className="grid grid-cols-[minmax(9rem,2fr)_minmax(8rem,2fr)_minmax(5rem,1fr)_minmax(5rem,1fr)_minmax(3rem,0.6fr)_minmax(8rem,1.6fr)] items-center gap-4 border-b border-[#D8D8D8] dark:border-[#121212] px-6 py-3 min-w-[38rem]">
                <span className="text-[0.75rem] font-medium text-foreground/80">Buyer</span>
                <span className="text-[0.75rem] font-medium text-foreground/80">Role</span>
                <span className="text-[0.75rem] font-medium text-foreground/80">Date</span>
                <span className="text-[0.75rem] font-medium text-foreground/80">Budget</span>
                <span className="text-[0.75rem] font-medium text-foreground/80 text-center">Note</span>
                <span className="text-[0.75rem] font-medium text-foreground/80 text-right">Status / Action</span>
              </div>

              {/* Table rows — same column layout on all screen sizes, scaled down text on mobile */}
              <div className="divide-y divide-[#D8D8D8] dark:divide-[#121212]">
                {orders.map((order, index) => (
                  <div
                    key={index}
                    onClick={order.status !== 'delivered' ? onOrderClick : undefined}
                    className={cn(
                      "grid grid-cols-[minmax(9rem,2fr)_minmax(8rem,2fr)_minmax(5rem,1fr)_minmax(5rem,1fr)_minmax(3rem,0.6fr)_minmax(8rem,1.6fr)] items-center gap-4 px-6 py-4 min-w-[38rem] transition-colors duration-200",
                      order.status !== 'delivered' && "cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] active:bg-black/[0.04] dark:active:bg-white/[0.04]"
                    )}
                  >
                    {/* Buyer Info */}
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "flex h-[2.25rem] w-[2.25rem] md:h-[2.8125rem] md:w-[2.8125rem] shrink-0 items-center justify-center rounded-full text-[0.75rem] md:text-[0.875rem] font-semibold text-white",
                        order.avatarClassName,
                      )}>
                        {order.initials}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[0.75rem] md:text-[0.875rem] font-medium text-foreground/80 leading-5 truncate">{order.name}</span>
                        <span className="text-[0.625rem] md:text-[0.6875rem] font-medium text-muted/80 truncate">{order.handle}</span>
                      </div>
                    </div>

                    {/* Service / Title */}
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[0.75rem] md:text-[0.875rem] font-medium text-foreground/80 leading-5 truncate">{order.title}</span>
                      <span className="text-[0.625rem] md:text-[0.8125rem] font-medium text-muted/80 truncate">{order.subtitle}</span>
                    </div>

                    {/* Date */}
                    <span className="text-[0.75rem] md:text-[0.8125rem] font-medium text-muted/80">{order.date}</span>

                    {/* Budget */}
                    <span className="text-[0.75rem] md:text-[0.8125rem] font-medium text-muted/80">{order.price}</span>

                    {/* Note icon */}
                    <div className="flex justify-center">
                      <FileText className="h-[1.125rem] w-[1.125rem] md:h-[1.3125rem] md:w-[1.3125rem] text-muted/80" />
                    </div>

                    {/* Status / Action */}
                    <div className="flex justify-end">
                      {order.status === 'delivered' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDisputeApproveClick) onDisputeApproveClick();
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.5625rem] md:text-[0.625rem] font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <ShieldCheck className="size-3" />
                          Dispute/Approve
                        </button>
                      ) : (
                        <span className={cn(
                          "inline-flex items-center justify-center rounded-full px-2.5 md:px-3 py-1 text-[0.5625rem] md:text-[0.625rem] font-medium capitalize whitespace-nowrap",
                          getStatusStyles(order.status)
                        )}>
                          {order.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

      </div>
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
    </div>
  );
}
