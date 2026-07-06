'use client';
import { useState, useRef, useCallback } from "react";
import { FileText, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const getStatusStyles = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/20';
    case 'working':
      return 'bg-[#8C5CFF]/15 text-[#8C5CFF] border border-[#8C5CFF]/20';
    case 'completed':
      return 'bg-emerald-500/15 text-emerald-600/80 dark:text-emerald-400/80 border border-emerald-500/20';
    case 'draft':
      return 'bg-foreground/10 text-muted/80 border border-border/20';
    case 'cancelled':
      return 'bg-rose-500/15 text-rose-600/80 dark:text-rose-400/80 border border-rose-500/20';
    default:
      return 'bg-foreground/10 text-muted/80';
  }
};

interface StatCard {
  label: string;
  value: string;
  sub: string;
  subClassName: string;
}

const stats: StatCard[] = [
  { label: "Active Contracts", value: "1", sub: "Working underway", subClassName: "text-muted/80" },
  { label: "Locked Escrow",    value: "400 CC", sub: "Locked in contracts", subClassName: "text-[#4ADE80]/80" },
  { label: "Open Postings",    value: "1", sub: "Accepting proposals", subClassName: "text-primary/80" },
  { label: "Total Posted",     value: "4", sub: "All time postings", subClassName: "text-muted/80" },
];

const tabs = [
  { label: "All", count: 4 },
  { label: "Open", count: 1 },
  { label: "Working", count: 1 },
  { label: "Drafts", count: 1 },
  { label: "Completed", count: 1 },
];

interface Job {
  id: number;
  title: string;
  category: string;
  proposals: number;
  date: string;
  budget: string;
  status: "open" | "working" | "completed" | "draft";
  freelancerName: string;
  freelancerHandle: string;
  avatarClassName: string;
  initials: string;
}

const mockJobs: Job[] = [
  { id: 1, title: "Create a landing page for my web3 blog", category: "Web Programming & Design", proposals: 8, date: "Mar. 24", budget: "150 CC", status: "open", freelancerName: "No Selection Yet", freelancerHandle: "Accepting proposals", avatarClassName: "bg-muted text-muted-foreground border border-border", initials: "?" },
  { id: 2, title: "Daml Smart Contract Escrow System", category: "Smart Contracts", proposals: 15, date: "Mar. 20", budget: "400 CC", status: "working", freelancerName: "Alex Daml", freelancerHandle: "@alexdaml", avatarClassName: "bg-purple-600", initials: "AD" },
  { id: 3, title: "Next.js frontend theme refactor", category: "Frontend Dev", proposals: 12, date: "Mar. 15", budget: "250 CC", status: "completed", freelancerName: "Sina Front", freelancerHandle: "@sinafront", avatarClassName: "bg-emerald-600", initials: "SF" },
  { id: 4, title: "Tailwind layout alignment tweaks", category: "UI CSS Tweak", proposals: 0, date: "Mar. 28", budget: "50 CC", status: "draft", freelancerName: "Draft Status", freelancerHandle: "Not published", avatarClassName: "bg-gray-400", initials: "DS" },
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

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex h-full w-full overflow-x-auto no-scrollbar"
      >
        <div className="flex h-full min-w-max lg:min-w-0 lg:w-full">
          {children}
        </div>
      </div>

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
function SearchToolbar({ 
  onSearchChange, 
  filter, 
  setFilter, 
  sort, 
  setSort 
}: {
  onSearchChange: (val: string) => void;
  filter: string;
  setFilter: (val: string) => void;
  sort: string;
  setSort: (val: string) => void;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen]     = useState(false);

  const filters = ['All', 'Open', 'Working', 'Completed', 'Drafts'];
  const sorts   = ['Newest', 'Oldest', 'Budget: Low to High', 'Budget: High to Low'];

  const baseDropdown = "absolute right-0 top-[calc(100%+6px)] z-50 min-w-[10rem] rounded-xl border border-[#D8D8D8] dark:border-[#1e1e1e] bg-[#FAFAFD] dark:bg-[#0B0B0B] shadow-lg overflow-hidden";
  const dropItem     = "w-full px-3.5 py-2 text-left text-[0.8125rem] text-foreground/80 hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors duration-150 cursor-pointer";
  const dropActive   = "bg-[#8C5CFF]/10 dark:bg-[#8C5CFF]/15 text-[#8C5CFF]/80 font-semibold";
  const pill         = "flex items-center gap-1.5 px-4 py-[0.5625rem] rounded-[3.125rem] bg-[#F5F8FB] dark:bg-[#161616] border border-[#D8D8D8] dark:border-[#1e1e1e] text-[0.8125rem] font-medium text-foreground/80 cursor-pointer select-none hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors duration-150 whitespace-nowrap";

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex items-center gap-3 px-4 py-[0.5625rem] rounded-[3.125rem] bg-[#F5F8FB] dark:bg-[#161616] border border-[#D8D8D8] dark:border-[#1e1e1e] flex-1 min-w-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="shrink-0 text-foreground/40">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          type="text"
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search posted jobs..."
          className="w-full bg-transparent text-[#010101]/80 dark:text-[rgba(255,255,255,0.8)] text-[0.8125rem] leading-[1.125rem] placeholder:text-muted/80 outline-none"
        />
      </div>

      {/* Filter dropdown */}
      <div className="relative shrink-0">
        <button
          onClick={() => { setFilterOpen(v => !v); setSortOpen(false); }}
          className={pill}
        >
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

      {/* Sort dropdown */}
      <div className="relative shrink-0">
        <button
          onClick={() => { setSortOpen(v => !v); setFilterOpen(false); }}
          className={pill}
        >
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

/* ─── Main Component ──────────────────────────────────────────────────────── */
interface BuyerJobsPageProps {
  onBack?: () => void;
  onJobClick?: () => void;
  onCreateJobClick?: () => void;
}

export default function BuyerJobsPage({ onBack, onJobClick, onCreateJobClick }: BuyerJobsPageProps) {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Newest");

  // Filter and Search logic
  const filteredJobs = mockJobs.filter(job => {
    // Tab filter
    if (activeTab === "Open" && job.status !== "open") return false;
    if (activeTab === "Working" && job.status !== "working") return false;
    if (activeTab === "Drafts" && job.status !== "draft") return false;
    if (activeTab === "Completed" && job.status !== "completed") return false;

    // Search input
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = job.title.toLowerCase().includes(q);
      const matchFreelancer = job.freelancerName.toLowerCase().includes(q);
      if (!matchTitle && !matchFreelancer) return false;
    }

    // Filter Dropdown
    if (filter === "Open" && job.status !== "open") return false;
    if (filter === "Working" && job.status !== "working") return false;
    if (filter === "Completed" && job.status !== "completed") return false;
    if (filter === "Drafts" && job.status !== "draft") return false;

    return true;
  });

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-y-auto no-scrollbar">
      <div className="mx-auto flex max-w-6xl flex-col gap-9 px-4 py-10 sm:px-6 lg:px-8 w-full">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8D8D8] dark:border-[#121212] bg-[#FAFAFD] dark:bg-[#0B0B0B] text-muted hover:text-foreground transition-colors cursor-pointer"
                title="Back"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground/80 sm:text-[2rem]">
              Manage posted jobs
            </h1>
          </div>

          <button 
            onClick={onCreateJobClick}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 font-sans text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-[#8C5CFF]/10"
          >
            <Plus size={16} />
            Post a Job
          </button>
        </div>

        {/* Stats Grid */}
        <div>
          {/* Desktop */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="h-[7.5rem] rounded-2xl border border-[#D8D8D8] dark:border-[#121212] bg-[#FAFAFD] dark:bg-[#0B0B0B] px-6 flex flex-col justify-center gap-1.5 shadow-sm">
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

        {/* Tabs + Table */}
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col gap-[5px]">
            <SearchToolbar 
              onSearchChange={setSearchQuery} 
              filter={filter} 
              setFilter={setFilter} 
              sort={sort} 
              setSort={setSort} 
            />

            {/* Tab scrollable container */}
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

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-[#D8D8D8] dark:border-[#121212] bg-[#FAFAFD] dark:bg-[#0B0B0B]">
            
            {/* Header info */}
            <div className="px-6 py-4 border-b border-[#D8D8D8] dark:border-[#121212] bg-foreground/[0.01] dark:bg-white/[0.01] flex items-center justify-between">
              <h2 className="text-[0.9375rem] font-semibold text-foreground/80">{activeTab} Postings</h2>
              <span className="text-[0.6875rem] font-medium text-muted/80">Showing {filteredJobs.length} active job listings</span>
            </div>

            {/* Horizontally scrollable list */}
            <div className="overflow-x-auto no-scrollbar">
              <div className="grid grid-cols-[minmax(9rem,2fr)_minmax(12rem,3fr)_minmax(5rem,1fr)_minmax(5rem,1fr)_minmax(3rem,0.6fr)_minmax(6rem,1.2fr)] items-center gap-4 border-b border-[#D8D8D8] dark:border-[#121212] px-6 py-3 min-w-[42rem]">
                <span className="text-[0.75rem] font-medium text-foreground/80">Freelancer</span>
                <span className="text-[0.75rem] font-medium text-foreground/80">Job Title</span>
                <span className="text-[0.75rem] font-medium text-foreground/80">Posted</span>
                <span className="text-[0.75rem] font-medium text-foreground/80">Budget</span>
                <span className="text-[0.75rem] font-medium text-foreground/80 text-center">Proposals</span>
                <span className="text-[0.75rem] font-medium text-foreground/80 text-right">Status</span>
              </div>

              <div className="divide-y divide-[#D8D8D8] dark:divide-[#121212]">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={onJobClick}
                      className="grid grid-cols-[minmax(9rem,2fr)_minmax(12rem,3fr)_minmax(5rem,1fr)_minmax(5rem,1fr)_minmax(3rem,0.6fr)_minmax(6rem,1.2fr)] items-center gap-4 px-6 py-4 min-w-[42rem] cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] active:bg-black/[0.04] dark:active:bg-white/[0.04] transition-colors duration-200"
                    >
                      {/* Candidate info / avatar */}
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "flex h-[2.25rem] w-[2.25rem] md:h-[2.8125rem] md:w-[2.8125rem] shrink-0 items-center justify-center rounded-full text-[0.75rem] md:text-[0.875rem] font-semibold text-white",
                          job.avatarClassName,
                        )}>
                          {job.initials}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[0.75rem] md:text-[0.875rem] font-medium text-foreground/80 leading-5 truncate">{job.freelancerName}</span>
                          <span className="text-[0.625rem] md:text-[0.6875rem] font-medium text-muted/80 truncate">{job.freelancerHandle}</span>
                        </div>
                      </div>

                      {/* Job Title / category */}
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[0.75rem] md:text-[0.875rem] font-medium text-foreground/80 leading-5 truncate">{job.title}</span>
                        <span className="text-[0.625rem] md:text-[0.8125rem] font-medium text-muted/80 truncate">{job.category}</span>
                      </div>

                      {/* Date */}
                      <span className="text-[0.75rem] md:text-[0.8125rem] font-medium text-muted/80">{job.date}</span>

                      {/* Budget */}
                      <span className="text-[0.75rem] md:text-[0.8125rem] font-medium text-muted/80">{job.budget}</span>

                      {/* Proposals count */}
                      <div className="text-[0.75rem] md:text-[0.8125rem] font-semibold text-foreground/80 text-center">
                        {job.proposals}
                      </div>

                      {/* Status */}
                      <div className="flex justify-end">
                        <span className={cn(
                          "inline-flex items-center justify-center rounded-full px-2.5 md:px-3 py-1 text-[0.5625rem] md:text-[0.625rem] font-medium capitalize whitespace-nowrap",
                          getStatusStyles(job.status)
                        )}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-12 text-center text-muted/80 text-[0.8125rem]">
                    No job postings found matching the selected filters.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
