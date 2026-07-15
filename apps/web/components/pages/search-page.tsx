'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  SlidersHorizontal,
  Star,
  Clock,
  Eye,
  ShoppingBag,
  TrendingUp,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  MessageCircle,
  Heart,
  Bookmark,
  Share2,
  Search,
  X,
} from 'lucide-react';
import { SearchDropdown } from '@/components/ui/search-dropdown';
import Footer from '@/components/layout/footer';
import {
  mockSearchAll,
  type SearchUser,
  type SearchService,
  type SearchArticle,
  type SearchJob,
  type SearchTag,
  getSearchHistory,
  removeFromSearchHistory,
  clearSearchHistory,
  addToSearchHistory,
} from '@/lib/search-service';

interface SearchPageProps {
  query: string;
  onBack: () => void;
}

type TabType = 'all' | 'people' | 'services' | 'articles' | 'jobs' | 'tags';

export default function SearchPage({ query, onBack }: SearchPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // Interactive search state for mobile/page-level typing
  const [localQuery, setLocalQuery] = useState(query);
  const [activeSearchQuery, setActiveSearchQuery] = useState(query);
  const [focused, setFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with incoming prop query
  useEffect(() => {
    setLocalQuery(query);
    setActiveSearchQuery(query);
  }, [query]);

  // Auto-focus the input on mount — critical for mobile (bottom nav Search tap)
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Load history on mount or query change
  useEffect(() => {
    setHistory(getSearchHistory());
  }, [activeSearchQuery]);

  // Click/touch outside to close suggestion dropdown
  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    if (focused) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('touchstart', handleOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [focused]);

  const handleSearch = useCallback((q: string) => {
    const term = q.trim();
    if (!term) return;
    addToSearchHistory(term);
    setLocalQuery(term);
    setActiveSearchQuery(term);
    setFocused(false);
    inputRef.current?.blur();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(localQuery);
    } else if (e.key === 'Escape') {
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleHistoryRemove = (item: string) => {
    removeFromSearchHistory(item);
    setHistory(getSearchHistory());
  };

  const handleHistoryClear = () => {
    clearSearchHistory();
    setHistory([]);
  };

  // Filters State
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
  const [filterCountry, setFilterCountry] = useState('All');
  const [filterServiceCategory, setFilterServiceCategory] = useState('All');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterMaxDeliveryDays, setFilterMaxDeliveryDays] = useState('Any');
  const [filterJobBudget, setFilterJobBudget] = useState('');
  const [filterRemoteOnly, setFilterRemoteOnly] = useState(false);
  const [filterExperienceLevel, setFilterExperienceLevel] = useState('All');
  const [filterArticleCategory, setFilterArticleCategory] = useState('All');

  // Simulate API Loading
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [activeSearchQuery, activeTab]);

  const rawResults = useMemo(() => {
    return mockSearchAll(activeSearchQuery);
  }, [activeSearchQuery]);

  // Apply filters
  const filteredUsers = useMemo(() => {
    let list = rawResults.users;
    if (filterVerifiedOnly) list = list.filter((u) => u.verified);
    if (filterOnlineOnly) list = list.filter((u) => u.online);
    if (filterCountry !== 'All') list = list.filter((u) => u.country.toLowerCase() === filterCountry.toLowerCase());
    return list;
  }, [rawResults.users, filterVerifiedOnly, filterOnlineOnly, filterCountry]);

  const filteredServices = useMemo(() => {
    let list = rawResults.services;
    if (filterServiceCategory !== 'All') list = list.filter((s) => s.category === filterServiceCategory);
    if (filterMaxPrice) {
      const max = parseFloat(filterMaxPrice);
      if (!isNaN(max)) list = list.filter((s) => s.startingPrice <= max);
    }
    if (filterMaxDeliveryDays !== 'Any') {
      const maxDays = parseInt(filterMaxDeliveryDays);
      if (!isNaN(maxDays)) list = list.filter((s) => s.deliveryDays <= maxDays);
    }
    return list;
  }, [rawResults.services, filterServiceCategory, filterMaxPrice, filterMaxDeliveryDays]);

  const filteredJobs = useMemo(() => {
    let list = rawResults.jobs;
    if (filterRemoteOnly) list = list.filter((j) => j.isRemote);
    if (filterExperienceLevel !== 'All') list = list.filter((j) => j.experienceLevel === filterExperienceLevel);
    if (filterJobBudget) {
      const maxBudget = parseInt(filterJobBudget.replace(/[^0-9]/g, ''));
      if (!isNaN(maxBudget)) {
        list = list.filter((j) => {
          const jobBud = parseInt(j.budget.replace(/[^0-9]/g, ''));
          return isNaN(jobBud) ? true : jobBud <= maxBudget;
        });
      }
    }
    return list;
  }, [rawResults.jobs, filterRemoteOnly, filterExperienceLevel, filterJobBudget]);

  const filteredArticles = useMemo(() => {
    let list = rawResults.articles;
    if (filterArticleCategory !== 'All') list = list.filter((a) => a.category === filterArticleCategory);
    return list;
  }, [rawResults.articles, filterArticleCategory]);

  const filteredTags = rawResults.tags;

  const totalFilteredCount = useMemo(() => {
    return filteredUsers.length + filteredServices.length + filteredArticles.length + filteredJobs.length + filteredTags.length;
  }, [filteredUsers, filteredServices, filteredArticles, filteredJobs, filteredTags]);

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-y-auto pb-16 md:pb-6">
      {/* Search Header — overflow-visible so dropdown renders below */}
      <div className="flex flex-col gap-4 px-4 md:px-6 pt-4 md:pt-6 pb-4 border-b border-border bg-background sticky top-0 z-20" style={{ overflow: 'visible' }}>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center p-2 rounded-full hover:bg-foreground/5 transition-colors cursor-pointer text-foreground/80 hover:text-foreground shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          
          {/* Stateful Search input — full-width, mobile-friendly touch target */}
          <div ref={searchContainerRef} className="flex-1 relative">
            <div className="h-11 md:h-[2.1875rem] rounded-[3.125rem] bg-sidebar border border-border/40 transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 flex items-center px-4 md:px-[1.3125rem] gap-2.5">
              <Search size={16} className="text-foreground/60 shrink-0" />
              <input
                ref={inputRef}
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                placeholder="Search creators, freelancers, services..."
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onKeyDown={handleKeyDown}
                className="flex-1 min-w-0 border-none bg-transparent font-sans text-[0.8125rem] md:text-[0.75rem] font-normal text-foreground/80 outline-none placeholder:text-foreground/45"
              />
              {localQuery ? (
                <button
                  onClick={() => {
                    setLocalQuery('');
                    setActiveSearchQuery('');
                    inputRef.current?.focus();
                  }}
                  className="text-foreground/40 hover:text-foreground/75 cursor-pointer shrink-0 p-1"
                  type="button"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              ) : null}
            </div>
            
            {focused && (
              <SearchDropdown
                query={localQuery}
                onQueryChange={setLocalQuery}
                onSearch={handleSearch}
                onClose={() => setFocused(false)}
              />
            )}
          </div>
        </div>

        {/* Categories Tab Row */}
        <div className="flex items-center justify-between overflow-x-auto gap-2 -mb-4 scrollbar-none pt-2">
          <div className="flex gap-4">
            {(['all', 'people', 'services', 'articles', 'jobs', 'tags'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-[13px] font-semibold tracking-wide border-b-2 transition-all capitalize whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-foreground/60 hover:text-foreground'
                }`}
              >
                {tab === 'articles' ? 'Posts' : tab}
              </button>
            ))}
          </div>

          {activeTab !== 'tags' && activeTab !== 'all' && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-[12px] font-medium cursor-pointer ${
                showFilters ||
                filterVerifiedOnly ||
                filterOnlineOnly ||
                filterCountry !== 'All' ||
                filterServiceCategory !== 'All' ||
                filterMaxPrice !== '' ||
                filterMaxDeliveryDays !== 'Any' ||
                filterRemoteOnly ||
                filterExperienceLevel !== 'All' ||
                filterArticleCategory !== 'All'
                  ? 'border-primary/40 bg-primary/5 text-primary'
                  : 'border-border text-foreground/75 hover:bg-foreground/5'
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="flex flex-col lg:flex-row gap-6 px-6 py-6 w-full max-w-5xl mx-auto items-start">
        {/* Sidebar Filters */}
        {showFilters && activeTab !== 'tags' && activeTab !== 'all' && (
          <aside className="w-full lg:w-64 shrink-0 bg-card border border-border rounded-2xl p-5 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-[13px] font-bold text-foreground">Filters</span>
              <button
                onClick={() => {
                  setFilterVerifiedOnly(false);
                  setFilterOnlineOnly(false);
                  setFilterCountry('All');
                  setFilterServiceCategory('All');
                  setFilterMaxPrice('');
                  setFilterMaxDeliveryDays('Any');
                  setFilterRemoteOnly(false);
                  setFilterExperienceLevel('All');
                  setFilterArticleCategory('All');
                }}
                className="text-[11px] text-primary hover:text-primary-hover font-semibold transition-colors cursor-pointer"
              >
                Reset All
              </button>
            </div>

            {activeTab === 'people' && (
              <div className="flex flex-col gap-4">
                <label className="flex items-center gap-2.5 text-[13px] text-foreground/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterVerifiedOnly}
                    onChange={(e) => setFilterVerifiedOnly(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary size-4"
                  />
                  <span>Verified Only</span>
                </label>
                <label className="flex items-center gap-2.5 text-[13px] text-foreground/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterOnlineOnly}
                    onChange={(e) => setFilterOnlineOnly(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary size-4"
                  />
                  <span>Online Now</span>
                </label>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Country</span>
                  <select
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-[12px] outline-none text-foreground"
                  >
                    <option value="All">All Countries</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Germany">Germany</option>
                    <option value="Spain">Spain</option>
                    <option value="Mexico">Mexico</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Category</span>
                  <select
                    value={filterServiceCategory}
                    onChange={(e) => setFilterServiceCategory(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-[12px] outline-none text-foreground"
                  >
                    <option value="All">All Categories</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Blockchain">Blockchain</option>
                    <option value="Design">Design</option>
                    <option value="Mobile">Mobile</option>
                    <option value="NFT and Art">NFT and Art</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Max Price (CC)</span>
                  <input
                    type="number"
                    placeholder="e.g. 200"
                    value={filterMaxPrice}
                    onChange={(e) => setFilterMaxPrice(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-[12px] outline-none text-foreground"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Max Delivery Time</span>
                  <select
                    value={filterMaxDeliveryDays}
                    onChange={(e) => setFilterMaxDeliveryDays(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-[12px] outline-none text-foreground"
                  >
                    <option value="Any">Any Delivery Time</option>
                    <option value="5">Within 5 days</option>
                    <option value="7">Within 7 days</option>
                    <option value="14">Within 14 days</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="flex flex-col gap-4">
                <label className="flex items-center gap-2.5 text-[13px] text-foreground/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterRemoteOnly}
                    onChange={(e) => setFilterRemoteOnly(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary size-4"
                  />
                  <span>Remote Only</span>
                </label>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Max Budget (CC)</span>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={filterJobBudget}
                    onChange={(e) => setFilterJobBudget(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-[12px] outline-none text-foreground"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Experience Level</span>
                  <select
                    value={filterExperienceLevel}
                    onChange={(e) => setFilterExperienceLevel(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-[12px] outline-none text-foreground"
                  >
                    <option value="All">All Levels</option>
                    <option value="Entry">Entry</option>
                    <option value="Mid">Mid</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'articles' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Category</span>
                  <select
                    value={filterArticleCategory}
                    onChange={(e) => setFilterArticleCategory(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-[12px] outline-none text-foreground"
                  >
                    <option value="All">All Categories</option>
                    <option value="Development">Development</option>
                    <option value="Blockchain">Blockchain</option>
                    <option value="Design">Design</option>
                    <option value="Freelancing">Freelancing</option>
                  </select>
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Results Stream */}
        <section className="flex-1 w-full flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col gap-4 w-full">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-foreground/10" />
                    <div className="flex flex-col gap-2">
                      <div className="h-4 w-32 bg-foreground/10 rounded" />
                      <div className="h-3 w-20 bg-foreground/10 rounded" />
                    </div>
                  </div>
                  <div className="h-3.5 w-full bg-foreground/10 rounded" />
                  <div className="h-3.5 w-[80%] bg-foreground/10 rounded" />
                </div>
              ))}
            </div>
          ) : totalFilteredCount === 0 ? (
            activeSearchQuery.trim().length === 0 ? (
              // Empty search input view — only show recent searches if they exist, else blank placeholder
              <div className="flex flex-col w-full max-w-md mx-auto py-6">
                {history.length > 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-5 flex flex-col">
                    <div className="flex items-center justify-between border-b border-border pb-3 mb-2">
                      <span className="text-[13px] font-bold text-foreground">Recent Searches</span>
                      <button
                        onClick={handleHistoryClear}
                        className="text-[11px] text-primary hover:text-primary-hover font-semibold transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-col divide-y divide-border/40">
                      {history.slice(0, 5).map((item) => (
                        <div key={item} className="flex items-center justify-between py-2.5">
                          <button
                            onClick={() => handleSearch(item)}
                            className="text-[13px] text-foreground/80 hover:text-primary text-left transition-colors cursor-pointer"
                          >
                            {item}
                          </button>
                          <button
                            onClick={() => handleHistoryRemove(item)}
                            className="text-muted hover:text-foreground cursor-pointer text-[12px] px-1"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-[13px] text-muted">Type above to search creators, freelancers, services, articles, and jobs.</p>
                  </div>
                )}
              </div>
            ) : (
              // Standard no results box with NO trending topics list
              <div className="flex flex-col items-center justify-center text-center p-12 bg-card border border-border rounded-2xl w-full">
                <ShoppingBag className="text-muted/40 mb-3 size-12" />
                <h2 className="text-[15px] font-bold text-foreground">No results found</h2>
                <p className="text-[12px] text-muted max-w-[290px] mt-1">
                  We couldn&apos;t find matches for &ldquo;{activeSearchQuery}&rdquo;.
                </p>
              </div>
            )
          ) : (
            <div className="flex flex-col gap-4 w-full">
              {/* --- ALL TAB --- */}
              {activeTab === 'all' && (
                <>
                  {filteredUsers.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted px-1">People</span>
                      {filteredUsers.slice(0, 2).map((user) => (
                        <CandidateReviewRow key={user.id} card={user} />
                      ))}
                    </div>
                  )}

                  {filteredServices.length > 0 && (
                    <div className="flex flex-col gap-3 mt-4">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted px-1">Services / Gigs</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredServices.slice(0, 2).map((service) => (
                          <GigPageCard key={service.id} gig={service} />
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredArticles.length > 0 && (
                    <div className="flex flex-col gap-3 mt-4">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted px-1">Posts</span>
                      {filteredArticles.slice(0, 2).map((article) => (
                        <DashboardPostCard key={article.id} post={article} />
                      ))}
                    </div>
                  )}

                  {filteredJobs.length > 0 && (
                    <div className="flex flex-col gap-3 mt-4">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted px-1">Jobs</span>
                      <div className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                        {filteredJobs.slice(0, 2).map((job) => (
                          <FindJobRow key={job.id} job={job} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* --- INDIVIDUAL TABS --- */}
              {activeTab === 'people' &&
                filteredUsers.map((user) => (
                  <CandidateReviewRow key={user.id} card={user} />
                ))}

              {activeTab === 'services' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredServices.map((service) => (
                    <GigPageCard key={service.id} gig={service} />
                  ))}
                </div>
              )}

              {activeTab === 'articles' &&
                filteredArticles.map((article) => (
                  <DashboardPostCard key={article.id} post={article} />
                ))}

              {activeTab === 'jobs' && (
                <div className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                  {filteredJobs.map((job) => (
                    <FindJobRow key={job.id} job={job} />
                  ))}
                </div>
              )}

              {activeTab === 'tags' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-card border border-border p-6 rounded-2xl w-full">
                  {filteredTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex flex-col gap-1 p-3.5 rounded-xl bg-background border border-border hover:border-primary/20 transition-all cursor-pointer"
                    >
                      <span className="text-[13px] font-bold text-foreground">#{tag.name}</span>
                      <span className="text-[10px] text-muted">{tag.postCount.toLocaleString()} posts</span>
                      {tag.trending && (
                        <span className="text-[9px] font-semibold text-primary uppercase mt-1">Trending</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}

// ─── Child Rows / Cards Components ───────────────────────────────────────────

function CandidateReviewRow({ card }: { card: SearchUser }) {
  const [expanded, setExpanded] = useState(false);
  const initials = card.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const statusPill: Record<string, string> = {
    green: 'bg-[#304437] text-[#4ADE80]',
    purple: 'bg-[#291D46] text-[#8C5CFF]',
    amber: 'bg-[#3d3210] text-[#FBBF24]',
    red: 'bg-[#3d1212] text-[#F87171]',
  };

  return (
    <div className="bg-[#FAFAFD] dark:bg-[#0b0b0b] border-t border-[#E2E2E2] dark:border-[#242424] flex gap-4 items-start px-4 py-6 w-full last:rounded-b-2xl transition-colors">
      <div className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full bg-[#291D46] text-white text-[14px] font-semibold">
        {initials}
      </div>

      <div className="flex flex-1 flex-col gap-3 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium text-muted whitespace-nowrap">{card.name}</span>
          {card.badge && (
            <span className={`flex items-center justify-center px-[8px] py-[3px] rounded-[3px] text-[10px] font-normal whitespace-nowrap ${
              card.badgeColor === 'green' ? 'bg-[#304437] text-[#4ADE80]' : 'bg-[#EBE5FA] dark:bg-[#291D46] text-primary'
            }`}>
              {card.badge}
            </span>
          )}
          {card.status && (
            <span className={`flex items-center justify-center px-[8px] py-[3px] rounded-[3px] text-[10px] font-normal whitespace-nowrap ${
              statusPill[card.statusColor ?? 'purple']
            }`}>
              {card.status}
            </span>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <Star size={11} className="text-[#DAC95A] fill-[#DAC95A]" />
            <span className="text-[11px] font-medium text-foreground/80">{card.rating}</span>
            <span className="text-[10px] text-muted">({card.reviews})</span>
          </div>
        </div>

        <p className="text-[13px] font-normal leading-[20px] text-foreground/80">{card.title}</p>
        <p className="text-[13px] font-medium text-muted leading-[18px]">{card.location}</p>

        <div className="flex items-center gap-8 text-[13px] font-medium text-muted whitespace-nowrap">
          <span>{card.rate}</span>
          <span>{card.earned}</span>
        </div>

        {card.coverLetter ? (
          <>
            <p className={`text-[13px] font-normal leading-[20px] text-foreground/80 transition-all duration-200 ${
              !expanded && 'line-clamp-2'
            }`}>
              <span className="font-semibold">Cover Letter: </span>
              {card.coverLetter}
            </p>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-[11px] text-primary cursor-pointer self-start font-semibold"
            >
              {expanded ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> Read more</>}
            </button>
          </>
        ) : (
          <p className="text-[13px] font-normal leading-[20px] text-foreground/70">{card.bio}</p>
        )}
      </div>
    </div>
  );
}

function GigPageCard({ gig }: { gig: SearchService }) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-[#8C5CFF]/30 transition-all w-full">
      <div className="h-[120px] bg-gradient-to-br from-[#8C5CFF]/20 to-primary/5 flex items-center justify-center border-b border-border/40 relative">
        <span className="absolute top-3 left-3 text-[10px] bg-foreground/10 text-foreground px-2 py-0.5 rounded">
          {gig.category}
        </span>
        <ImageIcon className="text-[#8C5CFF]/40 size-8" />
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 h-[40px] leading-5">{gig.title}</h3>

        <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/40">
          <span className="text-xs text-muted font-sans uppercase">STARTING AT</span>
          <span className="text-sm font-bold text-[#8C5CFF]">{gig.startingPrice} CC</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-2 p-2 rounded-xl bg-background/50 border border-border/40 text-center">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-muted flex items-center gap-1"><Eye size={10} /> Views</span>
            <span className="text-xs font-semibold mt-0.5">{gig.views}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-muted flex items-center gap-1"><ShoppingBag size={10} /> Orders</span>
            <span className="text-xs font-semibold mt-0.5">{gig.orders}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-muted flex items-center gap-1"><TrendingUp size={10} /> CTR</span>
            <span className="text-xs font-semibold mt-0.5">{gig.ctr}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPostCard({ post }: { post: SearchArticle }) {
  return (
    <div
      className="flex flex-col justify-between p-4 gap-4 border-b border-border bg-background hover:bg-card/40 transition-colors w-full"
      style={{ minHeight: 170 }}
    >
      <div className="flex items-start gap-3 flex-1">
        <div className="size-[38px] shrink-0 rounded-full overflow-hidden bg-card border border-border flex items-center justify-center font-sans font-bold text-xs text-foreground bg-[#291D46]">
          {post.name.charAt(0)}
        </div>
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <span className="font-sans text-[13px] font-semibold text-foreground truncate">
                {post.name}
              </span>
              <span className="font-sans text-[11px] text-muted truncate">
                {post.authorHandle}
              </span>
            </div>
            <span className="font-sans text-[11px] text-muted shrink-0 mr-1">
              {post.date}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <span className="px-2 py-[2px] rounded bg-[#291D46] text-[#8C5CFF] text-[9px] font-bold tracking-wide uppercase">
              {post.stakeReward || '5 CC Read-Stake Required'}
            </span>
            {post.topic && (
              <span className="px-2 py-[2px] rounded bg-primary/10 text-primary text-[9px] font-semibold">
                #{post.topic}
              </span>
            )}
          </div>

          <p className="text-[13px] font-normal leading-[20px] text-foreground/80 mt-1">{post.text}</p>
        </div>
      </div>

      <div className="flex items-center justify-between w-full pt-2 px-1 border-t border-border/40 text-muted">
        <button className="flex items-center gap-1.5 hover:text-[#8C5CFF] transition-colors cursor-pointer text-[11px]">
          <MessageCircle size={14} />
          <span>12</span>
        </button>
        <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors cursor-pointer text-[11px]">
          <Heart size={14} />
          <span>45</span>
        </button>
        <button className="flex items-center gap-1.5 hover:text-green-500 transition-colors cursor-pointer text-[11px]">
          <Bookmark size={14} />
          <span>8</span>
        </button>
        <button className="flex items-center gap-1.5 hover:text-[#8C5CFF] transition-colors cursor-pointer text-[11px]">
          <Share2 size={14} />
        </button>
      </div>
    </div>
  );
}

function FindJobRow({ job }: { job: SearchJob }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-4 px-5 py-6 border-b border-[#D8D8D8] dark:border-[#121212] transition-colors w-full">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <span className="text-[#010101] dark:text-white text-[13px] font-medium leading-[18px] flex-1">
            {job.title}
          </span>
          <span className="text-muted text-[10px] leading-[13px] flex-shrink-0">
            {job.timeAgo}
          </span>
        </div>

        <div className="flex flex-col gap-[5px]">
          <div className="flex items-center gap-[7px]">
            <span className="text-muted text-[10px] leading-[13px]">{job.payType}:</span>
            <span className="text-[#010101] dark:text-white font-medium text-[10px] leading-[13px]">{job.pay}</span>
            <span className="text-muted text-[10px] leading-[13px]">{job.payUnit}</span>
          </div>
          <div className="flex items-center gap-[9px]">
            <span className="text-muted text-[10px] leading-[13px]">{job.level}</span>
            <div className="flex items-center gap-[3px] flex-1 min-w-0">
              <Clock size={11} className="text-muted" />
              <span className="text-muted text-[10px] leading-[13px] truncate">{job.estimate}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className={`text-[#010101]/85 dark:text-white/85 text-sm leading-[22px] ${!expanded && 'line-clamp-2'}`}>
          {job.description}
        </p>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-primary text-[11px] font-semibold underline text-left hover:text-primary-hover transition-colors w-fit cursor-pointer"
        >
          {expanded ? 'Read less' : 'Read more'}
        </button>

        <div className="flex flex-wrap gap-1.5 mt-1 overflow-x-auto no-scrollbar py-0.5">
          {job.tags.map((tag) => (
            <span
              key={tag}
              className="flex-shrink-0 px-2.5 py-[5px] rounded-[3px] bg-[#8C5CFF]/10 dark:bg-[rgba(140,92,255,0.15)] text-[#8C5CFF] text-[10px] leading-[13px] whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-1 text-[11px] text-muted">
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-primary shrink-0">
            <path
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-semibold text-[10px] leading-[13px]">Verified Payment</span>
        </div>
        <div className="flex items-center gap-1">
          <span>{job.proposals} Proposals</span>
          {job.proposalsInReview && (
            <span className="text-yellow-600 dark:text-yellow-400 font-medium ml-2">• Proposals in review</span>
          )}
        </div>
      </div>
    </div>
  );
}
