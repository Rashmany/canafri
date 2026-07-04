'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Search, Calendar, Landmark, Check } from 'lucide-react';
import { FindJobPageSkeleton } from '@/components/ui/skeleton';

interface BuyerRequest {
  id: number;
  title: string;
  buyer: string;
  budget: string;
  duration: string;
  description: string;
  tags: string[];
  applied: boolean;
}

const MOCK_REQUESTS: BuyerRequest[] = [
  {
    id: 1,
    title: 'Need Daml Expert to review multi-party smart contract setup',
    buyer: 'Amara C.',
    budget: '500 CC',
    duration: '3 days',
    description: 'We are deploying a small Daml ledger system and want an expert to review the authorization models and templates to prevent leaks of confidential transactions.',
    tags: ['Daml', 'Smart Contract', 'Audit'],
    applied: false
  },
  {
    id: 2,
    title: 'Vite / React expert to optimize loading states and layout shifts',
    buyer: 'Michael D.',
    budget: '150 CC',
    duration: '1 day',
    description: 'Optimize our dashboard layout shifts and ensure we are using rich skeleton screens for our async modules.',
    tags: ['React', 'CSS Shimmer', 'Performance'],
    applied: true
  },
  {
    id: 3,
    title: 'Build a Next.js prototype connecting to Canton Network nodes',
    buyer: 'Sarah C.',
    budget: '1,200 CC',
    duration: '2 weeks',
    description: 'Need a small prototype with landing page + dashboard that reads CC balances using the ledger API client.',
    tags: ['Next.js', 'Canton Ledger', 'Node API'],
    applied: false
  }
];

interface BuyerRequestsPageProps {
  onBack?: () => void;
}

export default function BuyerRequestsPage({ onBack }: BuyerRequestsPageProps) {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<BuyerRequest[]>(MOCK_REQUESTS);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <FindJobPageSkeleton />;

  const handleApply = (id: number) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, applied: true } : r));
  };

  const filteredRequests = requests.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-background px-6 py-5 shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-foreground transition-colors"
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
              Browse and send offers directly to buyers seeking custom services
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Content */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-6 max-w-[800px] w-full mx-auto">
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-[10px] rounded-full bg-[#F5F8FB] dark:bg-[#161616] border border-[#D8D8D8] dark:border-[#1e1e1e]">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Search buyer requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-[#010101] dark:text-[rgba(255,255,255,0.8)] text-[13px] leading-[18px] placeholder-muted outline-none"
          />
        </div>

        <div className="flex flex-col gap-4">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col gap-4 p-5 rounded-2xl border border-border bg-card hover:border-[#8C5CFF]/30 transition-all"
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-sm font-semibold text-foreground flex-1 leading-5">{req.title}</h3>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#8C5CFF]">{req.budget}</p>
                    <p className="text-[10px] text-muted">Budget</p>
                  </div>
                </div>

                <p className="text-sm text-foreground/80 leading-relaxed font-sans">{req.description}</p>

                <div className="flex items-center gap-3 flex-wrap">
                  {req.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded bg-[#8C5CFF]/10 text-[#8C5CFF] text-[10px] font-medium">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="h-px bg-border/40 w-full mt-1" />

                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-3 text-[10px] text-muted">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {req.duration}</span>
                    <span>Buyer: <strong className="text-foreground">{req.buyer}</strong></span>
                  </div>

                  <button
                    onClick={() => !req.applied && handleApply(req.id)}
                    disabled={req.applied}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all ${
                      req.applied
                        ? 'bg-green-500/10 text-green-500 cursor-default'
                        : 'bg-primary text-white hover:bg-primary-hover active:scale-[0.98]'
                    }`}
                  >
                    {req.applied ? (
                      <>
                        <Check size={14} /> Offer Sent
                      </>
                    ) : (
                      'Send Offer'
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="text-muted/40 mb-3 size-12" />
              <p className="text-sm font-medium text-foreground">No matching buyer requests</p>
              <p className="text-xs text-muted">Try adjusting your keywords.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
