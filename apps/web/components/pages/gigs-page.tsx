'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Image as ImageIcon, Eye, ShoppingBag, TrendingUp, MoreHorizontal } from 'lucide-react';
import { FindJobPageSkeleton } from '@/components/ui/skeleton';

interface Gig {
  id: number;
  title: string;
  category: string;
  price: string;
  views: number;
  orders: number;
  ctr: string;
  status: 'active' | 'draft';
}

const MOCK_GIGS: Gig[] = [
  {
    id: 1,
    title: 'I will write secure Daml smart contracts for your Canton network dApp',
    category: 'Programming & Tech',
    price: '350 CC',
    views: 482,
    orders: 14,
    ctr: '5.2%',
    status: 'active'
  },
  {
    id: 2,
    title: 'I will design and build responsive Next.js and Tailwind interfaces',
    category: 'Programming & Tech',
    price: '150 CC',
    views: 290,
    orders: 8,
    ctr: '4.8%',
    status: 'active'
  },
  {
    id: 3,
    title: 'I will set up Fastify WebSocket backend servers for real-time logic',
    category: 'Programming & Tech',
    price: '200 CC',
    views: 120,
    orders: 0,
    ctr: '3.1%',
    status: 'draft'
  }
];

interface GigsPageProps {
  onBack?: () => void;
}

export default function GigsPage({ onBack }: GigsPageProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'draft'>('active');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <FindJobPageSkeleton />;

  const filteredGigs = MOCK_GIGS.filter(g => g.status === activeTab);

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
              My Gigs
            </h1>
            <p className="text-muted text-[11px] leading-4">
              Manage your services and offers on the marketplace
            </p>
          </div>
        </div>

        <button className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 font-sans text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all">
          <Plus size={16} />
          Create Gig
        </button>
      </div>

      {/* Tabs & Content */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-6 max-w-[900px] w-full mx-auto">
        <div className="flex border-b border-border gap-6">
          {(['active', 'draft'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-semibold capitalize transition-all border-b-2 ${
                activeTab === tab
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {tab} Gigs
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredGigs.length > 0 ? (
            filteredGigs.map((gig) => (
              <div
                key={gig.id}
                className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-[#8C5CFF]/30 transition-all"
              >
                {/* Visual Card Image placeholder */}
                <div className="h-[120px] bg-gradient-to-br from-[#8C5CFF]/20 to-primary/5 flex items-center justify-center border-b border-border/40 relative">
                  <span className="absolute top-3 left-3 text-[10px] bg-foreground/10 text-foreground px-2 py-0.5 rounded">
                    {gig.category}
                  </span>
                  <ImageIcon className="text-[#8C5CFF]/40 size-8" />
                </div>

                <div className="p-4 flex flex-col gap-3 flex-1">
                  <h3 className="text-sm font-medium text-foreground line-clamp-2 h-[40px] leading-5">{gig.title}</h3>

                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/40">
                    <span className="text-xs text-muted">STARTING AT</span>
                    <span className="text-sm font-bold text-[#8C5CFF]">{gig.price}</span>
                  </div>

                  {gig.status === 'active' && (
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
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag className="text-muted/40 mb-3 size-12" />
              <p className="text-sm font-medium text-foreground">No gigs found</p>
              <p className="text-xs text-muted">Draft gigs or inactive services will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
