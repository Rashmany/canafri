'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Search, Calendar, Landmark, Check, Clock, User, Sparkles } from 'lucide-react';
import { FindJobPageSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { apiFetch } from '@/lib/api-client';

interface BuyerRequest {
  id: string | number;
  title: string;
  buyer: string;
  buyerAvatar?: string;
  budget: string;
  duration: string;
  description: string;
  tags: string[];
  applied: boolean;
  offersCount: number;
  createdAt: string;
}

interface BuyerRequestsPageProps {
  onBack?: () => void;
  onNavigateToJob?: (jobId: string) => void;
}

export default function BuyerRequestsPage({ onBack, onNavigateToJob }: BuyerRequestsPageProps) {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function fetchOpenBuyerRequests() {
      try {
        const res = await apiFetch('/api/jobs');
        if (res.ok) {
          const data = await res.json();
          if (data?.jobs && Array.isArray(data.jobs)) {
            const mapped: BuyerRequest[] = data.jobs.map((job: any) => ({
              id: job.id,
              title: job.title || 'Untitled Request',
              buyer: job.client?.displayName || job.client?.username || 'Client',
              buyerAvatar: job.client?.avatarUrl,
              budget: `${job.amountCC ?? 100} CC`,
              duration: `${job.deadlineDays ?? 7} days`,
              description: job.description || 'No description provided.',
              tags: Array.isArray(job.skills) ? job.skills : [job.category || 'General'],
              applied: false,
              offersCount: job.proposalsCount ?? (Array.isArray(job.proposals) ? job.proposals.length : 0),
              createdAt: job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recent',
            }));

            if (isMounted) {
              setRequests(mapped);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load real buyer requests:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchOpenBuyerRequests();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) return <FindJobPageSkeleton />;

  const handleApply = (id: string | number, title: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, applied: true } : r));
    toast(`Offer submitted for "${title}"!`, 'success');
  };

  const filteredRequests = requests.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase()) ||
    r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-background px-6 py-5 shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-foreground transition-colors cursor-pointer"
              title="Back"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <div>
            <h1 className="text-[#010101] dark:text-white text-lg font-semibold leading-7">
              Buyer Requests
            </h1>
            <p className="text-muted text-[11px] leading-4">
              Browse and send offers directly to clients seeking custom freelance services
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-6 p-6 max-w-5xl">
        {/* Search Input */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
            <input
              type="text"
              placeholder="Search by keywords, skills, or requirements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-4 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div className="text-[12px] font-medium text-muted">
            <span className="font-semibold text-foreground">{filteredRequests.length}</span> active requests
          </div>
        </div>

        {/* Requests List */}
        <div className="flex flex-col gap-4">
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-border/60 rounded-2xl bg-card text-center gap-2">
              <Sparkles size={24} className="text-primary/60 mb-1" />
              <span className="text-sm font-semibold text-foreground">No matching buyer requests found</span>
              <p className="text-xs text-muted max-w-sm">
                Check back soon as clients post new jobs and contract opportunities daily.
              </p>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-all shadow-sm"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold text-foreground text-sm hover:text-primary transition-colors">
                      {req.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] text-muted">
                      <span className="flex items-center gap-1 font-medium text-foreground/80">
                        <User size={12} className="text-muted" /> {req.buyer}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {req.createdAt}
                      </span>
                      <span>•</span>
                      <span>{req.offersCount} offers submitted</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-base font-bold text-primary">{req.budget}</span>
                    <span className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> Est. {req.duration}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {req.description}
                </p>

                {/* Tags & Action */}
                <div className="flex items-center justify-between gap-4 pt-3 border-t border-border/50">
                  <div className="flex flex-wrap gap-1.5">
                    {req.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => !req.applied && handleApply(req.id, req.title)}
                    disabled={req.applied}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      req.applied
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default'
                        : 'bg-primary text-white hover:bg-primary-hover shadow-sm'
                    }`}
                  >
                    {req.applied ? (
                      <>
                        <Check size={13} />
                        <span>Offer Sent</span>
                      </>
                    ) : (
                      <span>Send Offer</span>
                    )}
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
