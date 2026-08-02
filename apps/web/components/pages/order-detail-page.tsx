'use client';
import { useState, useEffect } from "react";
import { ChevronLeft, Clock, ShieldCheck, User, CheckCircle2, Paperclip, Check, Star } from "lucide-react";

interface OrderDetailPageProps {
  jobId?: string;
  onBack?: () => void;
  onDeliverClick?: () => void;
  onResolveClick?: () => void;
}

const RootContainer = ({ jobId, onBack, onDeliverClick, onResolveClick }: OrderDetailPageProps) => {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ days: string; hours: string; mins: string; secs: string; isOverdue: boolean }>({
    days: '00',
    hours: '00',
    mins: '00',
    secs: '00',
    isOverdue: false,
  });
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [existingUserReview, setExistingUserReview] = useState<any>(null);

  useEffect(() => {
    if (!job) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const myId = payload.sub || payload.userId;
        if (Array.isArray(job.reviews)) {
          const myRev = job.reviews.find((r: any) => r.reviewerId === myId || r.reviewer?.id === myId);
          if (myRev) setExistingUserReview(myRev);
        }
      } catch (_) {}
    }
  }, [job]);

  const handleSubmitReview = async () => {
    if (!job?.id) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;
    if (!token) return;

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });
      const data = await res.json();
      if (data.success && data.review) {
        setExistingUserReview(data.review);
      }
    } catch (e) {
      console.error('Failed to submit review:', e);
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const token = typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;

    async function loadJob() {
      try {
        let targetId = jobId;
        // If no explicit jobId passed, fetch assigned orders and pick the first
        if (!targetId && token) {
          const res = await fetch('/api/jobs/seller/my-orders', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success && Array.isArray(data.jobs) && data.jobs.length > 0) {
            targetId = data.jobs[0].id;
          }
        }

        if (targetId) {
          const res = await fetch(`/api/jobs/${targetId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const data = await res.json();
          if (data.success && data.job && isMounted) {
            setJob(data.job);
          }
        }
      } catch (err) {
        console.error('Failed to fetch job detail:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadJob();
    return () => { isMounted = false; };
  }, [jobId]);

  // Live real-time countdown timer calculation
  useEffect(() => {
    if (!job) return;

    const calcTime = () => {
      const createdAt = new Date(job.createdAt || Date.now()).getTime();
      const deadlineMs = (job.deadlineDays || 7) * 24 * 60 * 60 * 1000;
      const dueTime = createdAt + deadlineMs;
      const now = Date.now();
      const diff = dueTime - now;

      if (diff <= 0) {
        setTimeLeft({ days: '00', hours: '00', mins: '00', secs: '00', isOverdue: true });
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      const formatDigit = (num: number) => num.toString().padStart(2, '0');

      setTimeLeft({
        days: formatDigit(d),
        hours: formatDigit(h),
        mins: formatDigit(m),
        secs: formatDigit(s),
        isOverdue: false,
      });
    };

    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, [job]);

  const handleApproveDelivery = async () => {
    if (!job?.id) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;
    if (!token) {
      alert("Please sign in to approve project delivery.");
      return;
    }
    setApproving(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to approve delivery.');
      setJob((prev: any) => ({ ...prev, status: 'COMPLETED' }));
      alert("Delivery approved successfully! Canton Escrow CC funds released to freelancer.");
    } catch (e: any) {
      alert(e.message || "Failed to approve delivery.");
    } finally {
      setApproving(false);
    }
  };

  const formattedDate = job?.createdAt
    ? new Date(job.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'March 20, 2026';

  const orderNumber = job?.id ? `Order#${job.id.slice(-8).toUpperCase()}` : 'Order#FO4564554';
  const clientName = job?.client?.displayName || job?.client?.username || 'keneweight';
  const clientHandle = job?.client?.username ? `@${job.client.username.replace(/^@/, '')}` : '@keneweight';
  const amountDisplay = job?.amountCC ? `${job.amountCC} CC` : '50 CC';
  const jobTitle = job?.title || 'Create a landing page for my web3 blog';
  const jobCategory = job?.category || 'Web Landing Page';
  const deadlineDisplay = `${job?.deadlineDays || 7} Days`;

  const milestones = Array.isArray(job?.milestones) && job.milestones.length > 0
    ? job.milestones
    : [
        { id: '1', title: 'Buyer Submitted Details', status: 'APPROVED' },
        { id: '2', title: 'Work Underway Delivery Soon', status: job?.status === 'DELIVERED' || job?.status === 'COMPLETED' ? 'DELIVERED' : 'IN_PROGRESS' },
      ];

  const deliveredMilestone = job?.milestones?.find((m: any) => m.status === 'DELIVERED' || m.status === 'APPROVED' || m.deliveryNotes) || (
    job?.status === 'DELIVERED' || job?.status === 'COMPLETED' ? {
      deliveredAt: job.updatedAt || job.createdAt,
      deliveryNotes: "Project deliverables completed as per specifications.",
      status: job.status,
    } : null
  );

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-y-auto no-scrollbar">
      {/* Header with back button and page name */}
      <div className="flex items-center gap-3 border-b border-[#D8D8D8]/30 dark:border-[#121212]/30 bg-background px-6 py-5 shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8D8D8] dark:border-[#121212] bg-[#FAFAFD] dark:bg-[#0B0B0B] text-muted hover:text-foreground transition-colors cursor-pointer"
            title="Back"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        <div>
          <h1 className="text-foreground/80 text-lg font-semibold leading-7">
            Order Details
          </h1>
        </div>
      </div>

      {/* Main content layout: column on mobile, row on desktop */}
      <div className="w-full flex-1 p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row items-start gap-6 max-w-6xl mx-auto">
        
        {/* Left Column: main order card details */}
        <section className="bg-[#FAFAFD] dark:bg-[#0B0B0B] border border-[#D8D8D8] dark:border-[#121212] rounded-2xl flex flex-col items-start p-5 sm:p-6 gap-6 w-full lg:flex-1">
          
          <div className="flex flex-col items-start gap-2 w-full">
            <div className="flex items-center justify-between w-full gap-4">
              <div className="flex items-baseline gap-3">
                <h1 className="m-0 text-xl sm:text-2xl font-bold text-foreground/85 whitespace-nowrap">
                  {orderNumber}
                </h1>
                <div className="relative text-[0.625rem] text-primary/80 cursor-pointer whitespace-nowrap font-medium hover:underline">
                  View Gig
                </div>
              </div>
              <h2 className="m-0 text-xl sm:text-2xl font-bold text-muted/80 whitespace-nowrap">
                {amountDisplay}
              </h2>
            </div>
            <div className="flex items-center gap-2.5 text-[0.625rem] text-muted/80">
              <div className="relative whitespace-nowrap">Buyer: {clientName} ({clientHandle})</div>
              <div className="h-[0.625rem] w-[0.063rem] relative bg-[#DADADA] dark:bg-[#242424]" />
              <div className="relative whitespace-nowrap">{formattedDate}</div>
              {job?.buyerRating > 0 && (
                <>
                  <div className="h-[0.625rem] w-[0.063rem] relative bg-[#DADADA] dark:bg-[#242424]" />
                  <div className="relative whitespace-nowrap text-[#FF9529] font-medium">★ {job.buyerRating.toFixed(1)} ({job.buyerReviewsCount})</div>
                </>
              )}
            </div>
          </div>

          {/* Table container — horizontally scrollable on mobile */}
          <div className="w-full overflow-x-auto no-scrollbar">
            <div className="min-w-[32rem] flex flex-col items-start text-[0.813rem] w-full">
              <div className="self-stretch bg-[#F5F8FB] dark:bg-[#080808] border border-[#DADADA] dark:border-[#242424] flex items-center justify-between py-[0.625rem] px-[1rem] gap-4">
                <div className="flex-1 relative font-medium min-w-[1.25rem] whitespace-nowrap text-foreground/90">
                  Item
                </div>
                <nav className="m-0 w-[15.688rem] flex items-center justify-between gap-4 text-left text-[0.813rem] text-foreground/80 font---font-inter shrink-0">
                  <div className="relative font-medium whitespace-nowrap">Quantity</div>
                  <div className="relative font-medium whitespace-nowrap">Duration</div>
                  <div className="relative font-medium whitespace-nowrap">Amount</div>
                </nav>
              </div>
              
              <div className="self-stretch bg-[#FAFAFD] dark:bg-[#0B0B0B] flex flex-col items-end p-[1rem] gap-[0.5rem] text-[0.625rem] text-muted/80 border-x border-b border-[#DADADA] dark:border-[#242424] rounded-b-xl">
                <div className="self-stretch flex items-start justify-between gap-4">
                  <div className="flex-1 flex flex-col items-start gap-[0.187rem] min-w-0">
                    <div className="self-stretch relative text-foreground/80 truncate font-medium">
                      {jobTitle}
                    </div>
                    <div className="self-stretch relative truncate">{jobCategory}</div>
                    <div className="self-stretch relative truncate">Fixed-Price Canton Escrow</div>
                  </div>
                  <div className="w-[15.688rem] flex items-center justify-between gap-4 shrink-0 pr-[0.8rem] text-foreground/70">
                    <div className="relative pr-[1.2rem]">1</div>
                    <div className="relative pr-[0.8rem]">{deadlineDisplay}</div>
                    <div className="relative font-medium">{amountDisplay}</div>
                  </div>
                </div>
                <div className="self-stretch h-[0.063rem] relative bg-[#DADADA] dark:bg-[#242424]" />
                <div className="flex items-center gap-[1rem] text-[0.813rem] text-foreground/80">
                  <div className="relative font-medium">Total</div>
                  <div className="relative font-semibold">{amountDisplay}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Details & Approval Card (if job delivered or completed) */}
          {deliveredMilestone && (
            <div className="w-full flex flex-col gap-3 p-4 rounded-xl border border-[#8C5CFF]/30 bg-[#8C5CFF]/5 dark:bg-[#8C5CFF]/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#8C5CFF] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  Project Delivery Submitted
                </span>
                {deliveredMilestone.deliveredAt && (
                  <span className="text-[10px] text-muted font-medium">
                    Submitted: {new Date(deliveredMilestone.deliveredAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                )}
              </div>

              {deliveredMilestone.deliveryNotes && (
                <div className="text-xs text-foreground/80 leading-relaxed bg-background/60 p-3 rounded-lg border border-border/40">
                  <p className="font-medium text-foreground text-[11px] mb-1">Freelancer Delivery Notes:</p>
                  {deliveredMilestone.deliveryNotes}
                </div>
              )}

              {Array.isArray(deliveredMilestone.deliveryFiles) && deliveredMilestone.deliveryFiles.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold text-muted uppercase">Attached Files:</span>
                  <div className="flex flex-wrap gap-2">
                    {deliveredMilestone.deliveryFiles.map((f: any, i: number) => (
                      <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background border border-border text-[11px] text-foreground/80">
                        <Paperclip size={12} className="text-muted" />
                        <span className="font-medium">{f.name || `Attachment #${i+1}`}</span>
                        {f.size && <span className="text-muted text-[10px]">({f.size})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status / Approval Action */}
              {job?.status === 'DELIVERED' ? (
                (() => {
                  const token = typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;
                  let currentUserId: string | null = null;
                  if (token) {
                    try {
                      const payload = JSON.parse(atob(token.split('.')[1]));
                      currentUserId = payload.sub || payload.userId;
                    } catch (_) {}
                  }
                  const isClient = currentUserId && job.clientId === currentUserId;

                  if (isClient) {
                    return (
                      <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-2 pt-2 border-t border-border/40">
                        <button
                          onClick={handleApproveDelivery}
                          disabled={approving}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#8C5CFF] hover:bg-[#8C5CFF]/90 text-white font-semibold text-xs transition-all cursor-pointer shadow-md disabled:opacity-50 active:scale-[0.98]"
                        >
                          {approving ? "Approving & Releasing Escrow..." : "✓ Approve Delivery & Release Funds"}
                        </button>
                        <button
                          onClick={onResolveClick}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border text-foreground/80 hover:bg-foreground/5 font-medium text-xs transition-all cursor-pointer"
                        >
                          Request Revision / Issue
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                      <Clock size={14} />
                      <span>Work Delivered — Pending Client Review</span>
                    </div>
                  );
                })()
              ) : job?.status === 'COMPLETED' ? (
                <div className="flex items-center gap-2 mt-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <Check size={14} />
                  <span>Approved & Escrow Funds Released to Freelancer</span>
                  {deliveredMilestone.approvedAt && (
                    <span className="text-[10px] text-muted font-normal">
                      ({new Date(deliveredMilestone.approvedAt).toLocaleDateString()})
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Rating & Review Section (if job is DELIVERED or COMPLETED) */}
          {['DELIVERED', 'COMPLETED'].includes(job?.status) && (
            <div className="w-full flex flex-col gap-4 p-5 rounded-xl border border-border/80 bg-card shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Star size={15} className="text-amber-400 fill-amber-400" />
                  {existingUserReview ? "Your Review & Rating" : "Leave Feedback & Rating"}
                </span>
                {existingUserReview && (
                  <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                    <Check size={13} /> Review Submitted
                  </span>
                )}
              </div>

              {existingUserReview ? (
                <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-background border border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={15}
                          className={star <= existingUserReview.rating ? "fill-amber-400 text-amber-400" : "text-muted/30"}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-foreground">{existingUserReview.rating}/5 stars</span>
                  </div>
                  {existingUserReview.comment && (
                    <p className="text-xs text-foreground/80 leading-relaxed italic">
                      "{existingUserReview.comment}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted">Overall Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                        >
                          <Star
                            size={20}
                            className={
                              star <= (hoverRating || reviewRating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-foreground/20 fill-none"
                            }
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-foreground/80">
                      {hoverRating || reviewRating} / 5 stars
                    </span>
                  </div>

                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your feedback about the collaboration, communication, and work quality..."
                    rows={3}
                    className="w-full bg-background border border-border rounded-lg p-3 text-xs font-normal text-foreground placeholder:text-muted resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />

                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="self-end px-4 py-2.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {submittingReview ? "Submitting Review..." : "Submit Review"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Countdown timer with square dots */}
          {timeLeft.isOverdue ? (
            <div className="self-stretch flex items-center justify-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold">
              <Clock className="size-4 mr-2" />
              Contract Deadline Passed (Overdue)
            </div>
          ) : (
            <div className="self-stretch flex items-center justify-center gap-1.5 sm:gap-3 w-full">
              {/* Days */}
              <div className="flex items-center gap-1">
                <div className="w-8 sm:w-[2.813rem] rounded-md bg-[#F5F8FB] dark:bg-[#121212] border border-[#DADADA] dark:border-[#121212] box-border flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-1 shrink-0">
                  <h2 className="m-0 text-sm sm:text-lg font-bold text-foreground/80">{timeLeft.days[0]}</h2>
                </div>
                <div className="w-8 sm:w-[2.813rem] rounded-md bg-[#F5F8FB] dark:bg-[#121212] border border-[#DADADA] dark:border-[#121212] box-border flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-1 shrink-0">
                  <h2 className="m-0 text-sm sm:text-lg font-bold text-foreground/80">{timeLeft.days[1]}</h2>
                </div>
              </div>
              
              <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-sm bg-[#DADADA] dark:bg-[#242424] shrink-0" />
              
              {/* Hours */}
              <div className="flex items-center gap-1">
                <div className="w-8 sm:w-[2.813rem] rounded-md bg-[#F5F8FB] dark:bg-[#121212] border border-[#DADADA] dark:border-[#121212] box-border flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-1 shrink-0">
                  <h2 className="m-0 text-sm sm:text-lg font-bold text-foreground/80">{timeLeft.hours[0]}</h2>
                </div>
                <div className="w-8 sm:w-[2.813rem] rounded-md bg-[#F5F8FB] dark:bg-[#121212] border border-[#DADADA] dark:border-[#121212] box-border flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-1 shrink-0">
                  <h2 className="m-0 text-sm sm:text-lg font-bold text-foreground/80">{timeLeft.hours[1]}</h2>
                </div>
              </div>
              
              <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-sm bg-[#DADADA] dark:bg-[#242424] shrink-0" />
              
              {/* Minutes */}
              <div className="flex items-center gap-1">
                <div className="w-8 sm:w-[2.813rem] rounded-md bg-[#F5F8FB] dark:bg-[#121212] border border-[#DADADA] dark:border-[#121212] box-border flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-1 shrink-0">
                  <h2 className="m-0 text-sm sm:text-lg font-bold text-foreground/80">{timeLeft.mins[0]}</h2>
                </div>
                <div className="w-8 sm:w-[2.813rem] rounded-md bg-[#F5F8FB] dark:bg-[#121212] border border-[#DADADA] dark:border-[#121212] box-border flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-1 shrink-0">
                  <h2 className="m-0 text-sm sm:text-lg font-bold text-foreground/80">{timeLeft.mins[1]}</h2>
                </div>
              </div>
              
              <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-sm bg-[#DADADA] dark:bg-[#242424] shrink-0" />
              
              {/* Seconds */}
              <div className="flex items-center gap-1">
                <div className="w-8 sm:w-[2.813rem] rounded-md bg-[#F5F8FB] dark:bg-[#121212] border border-[#DADADA] dark:border-[#121212] box-border flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-1 shrink-0">
                  <h2 className="m-0 text-sm sm:text-lg font-bold text-foreground/80">{timeLeft.secs[0]}</h2>
                </div>
                <div className="w-8 sm:w-[2.813rem] rounded-md bg-[#F5F8FB] dark:bg-[#121212] border border-[#DADADA] dark:border-[#121212] box-border flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-1 shrink-0">
                  <h2 className="m-0 text-sm sm:text-lg font-bold text-foreground/80">{timeLeft.secs[1]}</h2>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Tips & Checklist Cards */}
        <section className="w-full lg:w-[22rem] shrink-0 flex flex-col items-start gap-6 text-[0.813rem]">
          
          {/* Issue/Tips card */}
          <div className="self-stretch rounded-2xl bg-[#FAFAFD] dark:bg-[#0B0B0B] border border-[#D8D8D8] dark:border-[#121212] flex flex-col items-start p-[1.5rem] gap-[1.5rem]">
            <div className="self-stretch rounded-2xl bg-[#EBE5FA] dark:bg-[#291D46] flex flex-col items-start p-[1.5rem]">
              <div className="self-stretch relative font-medium text-[#8C5CFF] dark:text-[#8C5CFF]/80">
                Need to modify, cancel, or report an issue with your order?
              </div>
            </div>
            <div className="self-stretch flex flex-col items-start">
              <button 
                onClick={onResolveClick}
                className="cursor-pointer py-[0.5rem] px-[1rem] bg-transparent self-stretch rounded-xl flex items-center justify-center gap-[0.625rem] border border-[#8C5CFF]/30 text-[#8C5CFF] text-[0.813rem] font-semibold hover:bg-[#8C5CFF]/5 dark:hover:bg-[#8C5CFF]/10 transition-colors"
              >
                Resolve Order Issue
              </button>
            </div>
          </div>
          
          {/* Checklist stepper card */}
          <div className="self-stretch rounded-2xl bg-[#FAFAFD] dark:bg-[#0B0B0B] border border-[#D8D8D8] dark:border-[#121212] flex flex-col items-start p-[1.5rem] gap-[1.5rem] text-left">
            <div className="self-stretch relative font-medium text-foreground/80">Checklist</div>
            <div className="flex flex-col w-full gap-2">
              {milestones.map((m: any, idx: number) => {
                const isCompleted = m.status === 'APPROVED' || m.status === 'COMPLETED' || m.status === 'DELIVERED';
                return (
                  <div key={m.id || idx}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        isCompleted ? 'bg-[#8C5CFF] text-white' : 'bg-[#DADADA] dark:bg-[#33353A] text-muted dark:text-white'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className={`text-[11px] leading-[16px] font-semibold ${
                        isCompleted ? 'text-[#4ADE80]' : 'text-[#DAC95A]'
                      }`}>
                        {m.title}
                      </span>
                    </div>
                    {idx < milestones.length - 1 && (
                      <div className="ml-[11px] h-6 w-0.5 bg-[#DADADA] dark:bg-[#242424]" />
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="self-stretch flex flex-col items-start">
              <button 
                onClick={onDeliverClick}
                className="cursor-pointer [border:none] py-[0.5rem] px-[1rem] bg-[#8C5CFF] text-white hover:opacity-90 transition-opacity self-stretch rounded-xl flex items-center justify-center gap-[0.625rem]"
              >
                <div className="relative text-[0.813rem] font-semibold font---font-inter text-white text-left">
                  Deliver Project
                </div>
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default RootContainer;
