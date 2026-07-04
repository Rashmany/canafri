'use client';
import { useState, useRef, useCallback } from "react";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
  { label: "New",       count: 1 },
  { label: "Active",    count: 1 },
  { label: "Late",      count: 1 },
  { label: "Delivered", count: 1 },
  { label: "Completed", count: 1 },
  { label: "Cancel",    count: 1 },
  { label: "Starred",   count: 1 },
  { label: "Priority",  count: 1 },
];

interface Order {
  name: string;
  handle: string;
  title: string;
  subtitle: string;
  date: string;
  price: string;
  status: "in progress" | "pending";
  avatarClassName: string;
  initials: string;
}

const orders: Order[] = [
  { name: "John Trek", handle: "@johntrek", title: "Create landing page,", subtitle: "Web development", date: "Mar. 26", price: "$26", status: "in progress", avatarClassName: "bg-emerald-600", initials: "JT" },
  { name: "John Trek", handle: "@johntrek", title: "Create landing page,", subtitle: "Web development", date: "Mar. 26", price: "$26", status: "in progress", avatarClassName: "bg-sky-600",    initials: "JT" },
  { name: "John Trek", handle: "@johntrek", title: "Create landing page,", subtitle: "Web development", date: "Mar. 26", price: "$26", status: "pending",     avatarClassName: "bg-orange-500",  initials: "JT" },
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

/* ─── Search Input ────────────────────────────────────────────────────────── */
function SearchInput() {
  return (
    <div className="flex items-center gap-3 px-4 py-[0.5625rem] rounded-[3.125rem] bg-[#F5F8FB] dark:bg-[#161616] border border-[#D8D8D8] dark:border-[#1e1e1e] w-full sm:w-auto shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="shrink-0 text-foreground/40">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
      </svg>
      <input
        type="text"
        placeholder="Search..."
        className="w-full sm:w-[8rem] bg-transparent text-[#010101]/80 dark:text-[rgba(255,255,255,0.8)] text-[0.8125rem] leading-[1.125rem] placeholder:text-muted/80 outline-none"
      />
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function OrdersPage() {
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
            {/* Search — right-aligned */}
            <div className="flex justify-end w-full">
              <SearchInput />
            </div>

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
              <div className="grid grid-cols-[minmax(9rem,2fr)_minmax(8rem,2fr)_minmax(5rem,1fr)_minmax(5rem,1fr)_minmax(3rem,0.6fr)_minmax(6rem,1.2fr)] items-center gap-4 border-b border-[#D8D8D8] dark:border-[#121212] px-6 py-3 min-w-[36rem]">
                <span className="text-[0.75rem] font-medium text-foreground/80">Buyer</span>
                <span className="text-[0.75rem] font-medium text-foreground/80">Role</span>
                <span className="text-[0.75rem] font-medium text-foreground/80">Date</span>
                <span className="text-[0.75rem] font-medium text-foreground/80">Budget</span>
                <span className="text-[0.75rem] font-medium text-foreground/80 text-center">Note</span>
                <span className="text-[0.75rem] font-medium text-foreground/80 text-right">Status</span>
              </div>

              {/* Table rows — same column layout on all screen sizes, scaled down text on mobile */}
              <div className="divide-y divide-[#D8D8D8] dark:divide-[#121212]">
                {orders.map((order, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[minmax(9rem,2fr)_minmax(8rem,2fr)_minmax(5rem,1fr)_minmax(5rem,1fr)_minmax(3rem,0.6fr)_minmax(6rem,1.2fr)] items-center gap-4 px-6 py-4 min-w-[36rem] cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] active:bg-black/[0.04] dark:active:bg-white/[0.04] transition-colors duration-200"
                  >
                    {/* Buyer Info: avatar + name + @handle */}
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

                    {/* Status badge */}
                    <div className="flex justify-end">
                      <span className={cn(
                        "inline-flex items-center justify-center rounded-full px-2.5 md:px-3 py-1 text-[0.5625rem] md:text-[0.625rem] font-medium capitalize whitespace-nowrap",
                        getStatusStyles(order.status)
                      )}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
