'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Image as ImageIcon, Eye, ShoppingBag, TrendingUp, MoreHorizontal, Sparkles, X, Check } from 'lucide-react';
import { FindJobPageSkeleton } from '@/components/ui/skeleton';
import Footer from '@/components/layout/footer';
import { apiFetch } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';

export interface Gig {
  id: string | number;
  title: string;
  category: string;
  price: string;
  views: number;
  orders: number;
  ctr: string;
  status: 'active' | 'draft';
  image?: string;
  createdAt?: string;
}

const DEFAULT_GIGS: Gig[] = [
  {
    id: 'gig-1',
    title: 'Custom Daml Smart Contract Development & Formal Verification for Canton Network',
    category: 'Programming & Tech',
    price: '350 CC',
    views: 124,
    orders: 3,
    ctr: '6.2%',
    status: 'active',
  },
  {
    id: 'gig-2',
    title: 'Full-Stack Web3 Next.js & Non-Custodial Canton Wallet Frontend Integration',
    category: 'Programming & Tech',
    price: '200 CC',
    views: 89,
    orders: 2,
    ctr: '5.1%',
    status: 'active',
  },
];

interface GigsPageProps {
  onBack?: () => void;
}

export default function GigsPage({ onBack }: GigsPageProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'draft'>('active');
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Programming & Tech');
  const [newPrice, setNewPrice] = useState('150');
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function loadGigsAndStats() {
      try {
        // Load custom persisted gigs if any
        let localGigs: Gig[] = [];
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('canafri_seller_gigs');
          if (stored) {
            try {
              localGigs = JSON.parse(stored);
            } catch {}
          }
        }

        if (localGigs.length === 0) {
          localGigs = DEFAULT_GIGS;
          if (typeof window !== 'undefined') {
            localStorage.setItem('canafri_seller_gigs', JSON.stringify(DEFAULT_GIGS));
          }
        }

        // Fetch real order metrics from /api/jobs/my-jobs to dynamically adjust order counts
        const jobsRes = await apiFetch('/api/jobs/my-jobs');
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          const completedJobsCount = Array.isArray(jobsData?.jobs)
            ? jobsData.jobs.filter((j: any) => j.status === 'COMPLETED').length
            : 0;

          if (completedJobsCount > 0 && localGigs.length > 0) {
            localGigs[0].orders = Math.max(localGigs[0].orders, completedJobsCount);
          }
        }

        if (isMounted) {
          setGigs(localGigs);
        }
      } catch (err) {
        console.error('Failed to load gigs:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadGigsAndStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateGig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast('Please enter a gig title', 'error');
      return;
    }

    const created: Gig = {
      id: `gig-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      price: `${newPrice.trim()} CC`,
      views: 1,
      orders: 0,
      ctr: '0.0%',
      status: 'active',
      createdAt: new Date().toLocaleDateString(),
    };

    const updated = [created, ...gigs];
    setGigs(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('canafri_seller_gigs', JSON.stringify(updated));
    }

    setNewTitle('');
    setNewPrice('150');
    setShowCreateModal(false);
    toast('New gig published successfully!', 'success');
  };

  const handleToggleStatus = (id: string | number) => {
    const updated = gigs.map((g) => {
      if (g.id === id) {
        const nextStatus = g.status === 'active' ? ('draft' as const) : ('active' as const);
        toast(`Gig marked as ${nextStatus}`, 'info');
        return { ...g, status: nextStatus };
      }
      return g;
    });
    setGigs(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('canafri_seller_gigs', JSON.stringify(updated));
    }
  };

  const handleDeleteGig = (id: string | number) => {
    const updated = gigs.filter((g) => g.id !== id);
    setGigs(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('canafri_seller_gigs', JSON.stringify(updated));
    }
    toast('Gig removed', 'info');
  };

  if (loading) return <FindJobPageSkeleton />;

  const filteredGigs = gigs.filter((g) => g.status === activeTab);

  return (
    <div className="flex min-h-full w-full flex-col bg-background overflow-y-auto no-scrollbar">
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
              My Gigs
            </h1>
            <p className="text-muted text-[11px] leading-4">
              Manage your published services, pricing, and marketplace listings
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 font-sans text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all cursor-pointer shadow-sm"
        >
          <Plus size={16} />
          <span>Create Gig</span>
        </button>
      </div>

      {/* Tabs & Content */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-6 max-w-[900px] w-full mx-auto">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 font-sans text-[13px] font-semibold transition-colors relative cursor-pointer ${
              activeTab === 'active' ? 'text-primary' : 'text-muted hover:text-foreground'
            }`}
          >
            Active ({gigs.filter((g) => g.status === 'active').length})
            {activeTab === 'active' && (
              <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('draft')}
            className={`pb-3 font-sans text-[13px] font-semibold transition-colors relative cursor-pointer ml-4 ${
              activeTab === 'draft' ? 'text-primary' : 'text-muted hover:text-foreground'
            }`}
          >
            Draft ({gigs.filter((g) => g.status === 'draft').length})
            {activeTab === 'draft' && (
              <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary rounded-full" />
            )}
          </button>
        </div>

        {/* Gigs List */}
        <div className="flex flex-col gap-4">
          {filteredGigs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-border/60 rounded-2xl bg-card text-center gap-3">
              <Sparkles size={26} className="text-primary/60" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">No {activeTab} gigs</span>
                <p className="text-xs text-muted max-w-sm">
                  Create a new gig offering to showcase your specialized Canton Network & web3 skills to buyers.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Create Gig Now</span>
              </button>
            </div>
          ) : (
            filteredGigs.map((gig) => (
              <div
                key={gig.id}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all shadow-sm flex-wrap sm:flex-nowrap"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="size-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <ImageIcon size={22} />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-[13.5px] leading-snug line-clamp-1 hover:text-primary transition-colors">
                      {gig.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] text-muted">
                      <span className="text-primary font-semibold">{gig.price}</span>
                      <span>•</span>
                      <span>{gig.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1.5" title="Total Views">
                      <Eye size={13} /> {gig.views}
                    </span>
                    <span className="flex items-center gap-1.5" title="Completed Orders">
                      <ShoppingBag size={13} /> {gig.orders}
                    </span>
                    <span className="flex items-center gap-1.5" title="Click-through rate">
                      <TrendingUp size={13} /> {gig.ctr}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(gig.id)}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-border hover:bg-foreground/5 text-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      {gig.status === 'active' ? 'Draft' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGig(gig.id)}
                      className="p-1.5 rounded-lg text-red-500/70 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete Gig"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Gig Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <h2 className="text-base font-bold text-foreground">Create a New Gig</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGig} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Gig Title</label>
                <input
                  type="text"
                  placeholder="e.g. I will build high-converting Canton dApps..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="Programming & Tech">Programming & Tech</option>
                    <option value="Smart Contracts & Daml">Smart Contracts & Daml</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Security & Auditing">Security & Auditing</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Starting Price (CC)</label>
                  <input
                    type="number"
                    min="10"
                    placeholder="150"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-border bg-background text-xs text-foreground outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/60 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-xs font-semibold text-white hover:bg-primary-hover transition-colors cursor-pointer shadow-sm"
                >
                  Publish Gig
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="hidden md:block w-full mt-auto border-t border-[#D8D8D8] dark:border-[#121212]">
        <Footer />
      </div>
    </div>
  );
}
