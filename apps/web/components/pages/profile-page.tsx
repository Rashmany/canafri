'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Pencil,
  Share2,
  User,
  MapPin,
  Star,
  Check,
  MoreVertical,
  Grid,
  Smile,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Heart,
  Bookmark,
  ThumbsDown,
  BarChart2,
} from 'lucide-react';
import PersonalInfoModal from '@/components/ui/personal-info-modal';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { Post, PostCard, PostDetail, CommentItem } from './dashboard-page';
import ProfileOverviewCard from './profile-overview-card';
import WorkHistoryCard from './work-history-card';
import Footer from '@/components/layout/footer';

// --- Constants for Buyer Profile ----------------------------------------------

const TABS = ['Published', 'Reads', 'Job & Rating History'] as const;
type Tab = typeof TABS[number];

// --- Helper: map backend content to Post UI model ---------------------------------

function mapContentToPost(c: any): Post {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = new Date(c.publishedAt || c.createdAt || Date.now());
  const dateStr = `${months[d.getMonth()]} ${d.getDate()}`;

  const creatorName = c.creator?.displayName || c.creator?.username || 'Creator';
  const creatorHandle = c.creator?.username
    ? `@${c.creator.username.replace(/^@/, '')}`
    : '@creator';

  const plainText = (c.bodyIpfsHash || c.body || c.title || '').replace(/<[^>]*>/g, '');
  const snippet = plainText.length > 200 ? plainText.slice(0, 200) + '…' : plainText;

  return {
    id: c.id,
    name: creatorName,
    handle: creatorHandle,
    date: dateStr,
    avatarSrc: c.creator?.avatarUrl || '',
    text: snippet || c.title,
    fullText: c.body || c.bodyIpfsHash || c.title || '',
    category: 'premium',
    stakeReward: `${c.priceCC || 5} CC Read-Stake Required`,
    likesCount: c.readCount || 0,
    commentsCount: 0,
    image: c.coverImageUrl || undefined,
    topic: c.topic || undefined,
    publication: c.publication || undefined,
    contentStatus: c.status || undefined,
  };
}

// --- Verified Star Badge ------------------------------------------------------

function VerifiedBadge() {
  return (
    <div className="relative size-[19px] flex items-center justify-center shrink-0">
      <Star size={17} className="text-primary fill-primary/20 absolute" />
      <Check size={9} className="text-primary relative z-10" strokeWidth={3} />
    </div>
  );
}

// --- Profile Page Main ---------------------------------------------------------

interface ProfilePageProps {
  onBack?: () => void;
  sellerMode?: boolean;
  /** Pass false when a buyer is viewing someone else's freelancer profile */
  isOwner?: boolean;
  onOpenChat?: (user: { id: string; name: string; username?: string; avatarUrl?: string }) => void;
  onNavigate?: (page: string) => void;
}

export default function ProfilePage({ onBack, sellerMode = false, isOwner = true, onOpenChat, onNavigate }: ProfilePageProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStickyTitle, setShowStickyTitle] = useState(false);
  const [profile, setProfile] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('canafri_user_profile');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {
      fullName: 'User',
      username: '@user',
      email: '',
      location: 'Global',
      memberSince: 'April 2026',
    };
  });

  const [sellerAppData, setSellerAppData] = useState<any>({});
  const [freelanceJobs, setFreelanceJobs] = useState<any[]>([]);
  const [sellerReviews, setSellerReviews] = useState<any[]>([]);
  const [sellerRating, setSellerRating] = useState<number>(0);
  const [sellerReviewsCount, setSellerReviewsCount] = useState<number>(0);
  const [publishedPosts, setPublishedPosts] = useState<Post[]>([]);
  const [readsPosts, setReadsPosts] = useState<Post[]>([]);
  const [buyerRating, setBuyerRating] = useState<number>(0);
  const [buyerReviewsCount, setBuyerReviewsCount] = useState<number>(0);
  const [buyerReviews, setBuyerReviews] = useState<any[]>([]);
  const [clientPostedJobs, setClientPostedJobs] = useState<any[]>([]);
  const [ratingsOpen, setRatingsOpen] = useState<boolean>(false);
  const [postedJobsOpen, setPostedJobsOpen] = useState<boolean>(false);
  const [showAllRatings, setShowAllRatings] = useState<boolean>(false);
  const [showAllJobs, setShowAllJobs] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('canafri_access_token') || localStorage.getItem('canafri_admin_access_token')
      : null;
    if (!token) return;

    async function loadMe() {
      try {
        let res = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          res = await fetch('/api/users/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        if (res.ok) {
          const data = await res.json();
          if (data?.user && isMounted) {
            const u = data.user;
            const app = data.sellerAppData || {};
            setSellerAppData(app);
            if (Array.isArray(u.freelanceJobs)) {
              setFreelanceJobs(u.freelanceJobs);
            }
            if (Array.isArray(u.reviewsReceived)) {
              const revs = u.reviewsReceived as any[];
              setSellerReviews(revs);
              const count = revs.length;
              setSellerReviewsCount(count);
              const avg = count > 0
                ? parseFloat((revs.reduce((s: number, r: any) => s + (r.rating || 0), 0) / count).toFixed(1))
                : 0;
              setSellerRating(avg);
            }
            if (Array.isArray(u.postedJobs)) {
              setClientPostedJobs(u.postedJobs);
            }
            if (Array.isArray(u.content)) {
              const mappedPub = u.content.map((c: any) => ({
                ...mapContentToPost(c),
                name: u.displayName || u.username || 'User',
                handle: u.username ? (u.username.startsWith('@') ? u.username : `@${u.username}`) : '@user',
              }));
              setPublishedPosts(mappedPub);
            }
            if (Array.isArray(u.readStakes)) {
              const mappedReads = u.readStakes
                .filter((rs: any) => rs.content)
                .map((rs: any) => mapContentToPost(rs.content));
              setReadsPosts(mappedReads);
            }
            const updated = {
              ...u,
              fullName: u.displayName || u.username || 'User',
              username: u.username ? (u.username.startsWith('@') ? u.username : `@${u.username}`) : '@user',
              location: u.country || app.country || 'Global',
              memberSince: u.createdAt
                ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : 'April 2026',
              skills: app.skills || (u.skills ? u.skills : []),
              headline: app.headline || u.bio || '',
              bio: u.bio || app.skillsBio || app.bio || '',
              yearsOfExperience: app.yearsOfExperience || '0',
              minProjectBudget: app.minProjectValue ? `${app.minProjectValue} CC` : '150 CC',
              portfolioLinks: app.portfolioLinks || [],
              educationSchool: app.educationSchool || '',
              educationDegree: app.educationDegree || '',
              educationYear: app.educationYear || '',
              reviews: u.reviews || [],
            };
            setProfile(updated);
            // Fetch buyer reviews from the public profile endpoint
            const rawUsername = u.username?.replace(/^@/, '');
            if (rawUsername) {
              fetch(`/api/users/${rawUsername}`)
                .then(r => r.json())
                .then(pubData => {
                  if (pubData?.user) {
                    setBuyerRating(pubData.user.buyerRating || 0);
                    setBuyerReviewsCount(pubData.user.buyerReviewsCount || 0);
                    setBuyerReviews(pubData.user.buyerReviews || []);
                    if (Array.isArray(pubData.user.postedJobs)) {
                      setClientPostedJobs(pubData.user.postedJobs);
                    }
                  }
                })
                .catch(() => {});
            }
          }
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      }
    }

    loadMe();

    // Re-fetch whenever a new post is published from the dashboard
    const handleContentPublished = () => { loadMe(); };
    window.addEventListener('canafri:content-published', handleContentPublished);

    return () => {
      isMounted = false;
      window.removeEventListener('canafri:content-published', handleContentPublished);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<Tab>('Published');
  const [activeSubTab, setActiveSubTab] = useState<'about' | 'preview' | 'history'>('about');
  const [showMenu, setShowMenu] = useState(false);
  const [portfolioScrolled, setPortfolioScrolled] = useState(false);
  const portfolioRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const userInitials = useMemo(() => {
    const nameStr = profile?.fullName || profile?.displayName || profile?.username || 'U';
    const parts = nameStr.replace('@', '').trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nameStr.slice(0, 2).toUpperCase();
  }, [profile]);

  const completedJobsList = useMemo(() => {
    return freelanceJobs
      .filter((j) => j.status === 'COMPLETED')
      .map((j) => ({
        id: j.id,
        title: j.title,
        startDate: new Date(j.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        endDate: new Date(j.updatedAt || j.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        feedback: 'Canton Escrow Release Completed',
        amount: `${j.amountCC || 0} CC`,
      }));
  }, [freelanceJobs]);

  const inProgressJobsList = useMemo(() => {
    return freelanceJobs
      .filter((j) => j.status !== 'COMPLETED')
      .map((j) => ({
        id: j.id,
        title: j.title,
        startDate: new Date(j.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        endDate: 'Present',
        feedback: 'In progress',
        amount: `${j.amountCC || 0} CC`,
      }));
  }, [freelanceJobs]);

  const totalEarnedCC = useMemo(() => {
    return freelanceJobs
      .filter((j) => j.status === 'COMPLETED')
      .reduce((acc, j) => acc + (j.amountCC || 0), 0);
  }, [freelanceJobs]);

  const overviewData = useMemo(() => {
    return {
      minProjectBudget: profile.minProjectBudget || '150 CC',
      totalEarnings: `${totalEarnedCC} CC`,
      completedJobs: completedJobsList.length,
      cantonStake: profile.creatorStake ? `${profile.creatorStake.amountCC} CC` : '0 CC',
      jobSuccess: completedJobsList.length > 0 ? '100%' : 'N/A',
      rating: sellerRating,
      reviewsCount: sellerReviewsCount,
      level: profile.sellerApproved ? 'Top Rated Seller' : (profile.isSeller ? 'Verified Seller' : 'Registered Seller'),
      verifications: [
        profile.emailVerified ? 'Email Verified' : null,
        profile.phoneVerified ? 'Phone Verified' : null,
        profile.sellerApproved ? 'Identity Verified' : null,
        'Registered Seller',
      ].filter(Boolean),
      languages: sellerAppData.language
        ? [{ name: sellerAppData.language, level: 'Native' }]
        : [{ name: 'English', level: 'Native' }],
      availability: sellerAppData.availability || 'As needed - open to offers',
      responseTime: '< 24 hrs',
    };
  }, [profile, sellerAppData, completedJobsList.length, totalEarnedCC, sellerRating, sellerReviewsCount]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast('Profile link copied to clipboard!', 'success');
    } catch {
      toast('Profile link: ' + window.location.href, 'success');
    }
  };

  const scrollPortfolio = (dir: 'left' | 'right') => {
    if (!portfolioRef.current) return;
    const amount = 280;
    portfolioRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
    setTimeout(() => {
      setPortfolioScrolled((portfolioRef.current?.scrollLeft ?? 0) > 0);
    }, 350);
  };

  // Local state to track interactive states on the shared PostCard component
  const [likedPostIds, setLikedPostIds] = useState<Record<number, boolean>>({});
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Record<number, boolean>>({});
  const [favoriteCreators, setFavoriteCreators] = useState<Record<string, boolean>>({});

  // Full-article reader overlay
  const [selectedArticle, setSelectedArticle] = useState<Post | null>(null);
  const [unlockedArticleIds, setUnlockedArticleIds] = useState<(number | string)[]>([]);
  const [articleComments, setArticleComments] = useState<CommentItem[]>([]);

  const handleOpenArticle = async (post: Post) => {
    setSelectedArticle(post);
    // Fetch real comments for this post
    try {
      const res = await fetch(`/api/content/${post.id}/replies`);
      const data = await res.json();
      if (data.success && Array.isArray(data.replies)) {
        setArticleComments(
          data.replies.map((r: any) => ({
            id: r.id,
            postId: post.id,
            name: r.author?.displayName || r.author?.username || 'Reader',
            handle: r.author?.username ? `@${r.author.username.replace(/^@/, '')}` : '@reader',
            text: r.body,
            time: new Date(r.createdAt).toLocaleDateString(),
          }))
        );
      }
    } catch { /* ignore */ }
  };

  const handleAddArticleComment = async (text: string) => {
    if (!selectedArticle) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('canafri_access_token') : null;
    const optimistic = {
      id: `opt_${Date.now()}`,
      postId: selectedArticle.id,
      name: 'You',
      handle: '@me',
      text,
      time: 'Just now',
    };
    setArticleComments(prev => [optimistic, ...prev]);
    if (token) {
      try {
        await fetch(`/api/content/${selectedArticle.id}/replies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ body: text }),
        });
      } catch { /* ignore */ }
    }
  };

  // --- SELLER MODE (FREELANCER PROFILE) LAYOUT ---
  if (sellerMode) {
    const displayLocation = profile.city ? `${profile.city}, ${profile.country}` : (profile.country || profile.location || 'Global');
    const displayHeadline = profile.headline || 'Blockchain & Canton Developer';
    const displayTags = profile.skills && profile.skills.length > 0 ? profile.skills : [];

    return (
      <div className="flex flex-col overflow-y-auto bg-background min-h-full animate-in fade-in duration-200 px-4 py-6 gap-6 md:px-8">

        {/* Header section (Figma 1118:17514) */}
        <div className="overflow-x-auto no-scrollbar w-full shrink-0">
          <div className="bg-card border border-card-border rounded-[16px] px-[24px] py-[30px] flex flex-row gap-[47px] items-center relative min-w-[850px]">
            {/* Avatar + online dot */}
            <div className="relative shrink-0">
              <div className="size-[90px] rounded-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-md text-primary overflow-hidden font-bold text-[24px]">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.fullName} className="h-full w-full object-cover object-center" />
                ) : (
                  <span>{userInitials}</span>
                )}
              </div>
              <div className="absolute bottom-[3px] right-[3px] size-[14px] rounded-full bg-[#00C37A] border-2 border-card" />
            </div>

            {/* Info */}
            <div className="flex flex-1 min-w-0 items-end justify-between">
              <div className="flex flex-col gap-[16px] items-start">
                <div className="flex flex-col gap-0 items-start">
                  <div className="flex items-center gap-[16px]">
                    <h1 className="font-bold text-[36px] leading-[42px] tracking-[-0.18px] text-foreground">{profile.fullName}</h1>
                    {(profile.sellerApproved || profile.emailVerified) && <VerifiedBadge />}
                    {/* Owner: edit profile name/title */}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => toast('Edit profile info', 'success')}
                        className="size-[28px] rounded-[6px] bg-background border border-border flex items-center justify-center text-muted hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
                        title="Edit profile"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                  </div>
                  <p className="font-normal text-[11px] leading-[16px] text-foreground/80">{displayHeadline}</p>
                </div>
                <div className="flex gap-[31px] items-center">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} className="text-foreground/80" strokeWidth={1.5} />
                    <p className="font-normal text-[11px] leading-[16px] text-foreground/80">{displayLocation}</p>
                  </div>
                  <p className="font-normal text-[11px] leading-[16px] text-muted">member since {profile.memberSince}</p>
                </div>
                <div className="flex flex-wrap gap-[8px] items-center">
                  {displayTags.map((tag: string, i: number) => (
                    <div key={i} className="bg-primary/10 px-[8px] py-[4px] rounded-[3px]">
                      <span className="font-normal text-[9px] text-primary leading-[12px]">{tag}</span>
                    </div>
                  ))}
                  {/* Owner: edit specialty tags */}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => toast('Edit specialty tags', 'success')}
                      className="size-[22px] rounded-[4px] border border-dashed border-border flex items-center justify-center text-muted hover:text-primary hover:border-primary transition-colors cursor-pointer"
                      title="Edit tags"
                    >
                      <Pencil size={10} />
                    </button>
                  )}
                </div>
              </div>

              {/* Buyer-only action buttons — hidden for owner */}
              {!isOwner && (
                <div className="flex flex-wrap gap-[12px] items-center mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenChat) {
                        onOpenChat({
                          id: profile.id || 'seller-1',
                          name: profile.fullName || profile.displayName || 'User',
                          username: profile.username,
                          avatarUrl: profile.avatarSrc,
                        });
                      } else {
                        toast(`Opening message composer for ${profile.fullName}…`, 'success');
                      }
                    }}
                    className="h-[36px] px-[16px] rounded-[12px] border border-primary/50 text-[13px] font-semibold text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
                  >
                    Message
                  </button>
                  <button
                    type="button"
                    onClick={() => toast(`Opening hire contract for ${profile.fullName}…`, 'success')}
                    className="h-[36px] px-[16px] rounded-[12px] bg-primary hover:bg-primary-hover text-[13px] font-semibold text-white transition-colors cursor-pointer"
                  >
                    Hire
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="h-[34px] w-[38px] bg-background border border-card-border rounded-[5px] flex items-center justify-center text-muted hover:text-foreground transition-colors cursor-pointer"
                    title="Share profile"
                  >
                    <Share2 size={14} />
                  </button>
                </div>
              )}

              {/* Owner: share button only */}
              {isOwner && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="h-[34px] w-[38px] bg-background border border-card-border rounded-[5px] flex items-center justify-center text-muted hover:text-foreground transition-colors cursor-pointer mt-2"
                  title="Share your profile"
                >
                  <Share2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="bg-gradient-to-r border border-card-border from-card to-background h-[100px] rounded-[8px] flex items-center justify-center p-3">
          <div className="border border-border rounded-full bg-card p-1 flex w-full max-w-xl relative">
            <div aria-hidden className="absolute bg-card inset-0 pointer-events-none rounded-full" />
            <div className="absolute inset-0 pointer-events-none rounded-full shadow-[inset_0px_2px_6px_0px_rgba(0,0,0,0.5)] dark:shadow-[inset_0px_2px_6px_0px_rgba(0,0,0,0.5)] shadow-black/10" />
            <button
              type="button"
              onClick={() => setActiveSubTab('about')}
              className={`relative z-10 flex-1 py-[10px] rounded-full text-[14px] font-semibold text-center transition-all cursor-pointer ${
                activeSubTab === 'about' ? 'bg-primary text-white' : 'text-muted hover:text-foreground'
              }`}
            >
              About me
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('preview')}
              className={`relative z-10 flex-1 py-[10px] rounded-full text-[14px] font-medium text-center transition-all cursor-pointer ${
                activeSubTab === 'preview' ? 'bg-primary text-white' : 'text-muted hover:text-foreground'
              }`}
            >
              Profile Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('history')}
              className={`relative z-10 flex-1 py-[10px] rounded-full text-[14px] font-medium text-center transition-all cursor-pointer ${
                activeSubTab === 'history' ? 'bg-primary text-white' : 'text-muted hover:text-foreground'
              }`}
            >
              Job history
            </button>
          </div>
        </div>

        {/* ── About me tab ── */}
        {activeSubTab === 'about' && (
          <>
            {/* About Me Card */}
            <div
              className="border border-card-border rounded-[16px] p-[24px] flex flex-col gap-[24px]"
              style={{ background: 'linear-gradient(70deg, var(--bg-card) 70%, var(--bg-sidebar) 121%)' }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-[20px] text-foreground/80 leading-normal">About me</h2>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => toast('Edit bio & about me section', 'success')}
                    className="flex items-center gap-[6px] px-[10px] h-[28px] rounded-[6px] border border-border text-[11px] text-muted hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
                    title="Edit About me"
                  >
                    <Pencil size={11} />
                    Edit
                  </button>
                )}
              </div>
              <div className="font-normal text-[14px] leading-[1.6] text-foreground/80 flex flex-col gap-[20px] whitespace-pre-wrap">
                {profile.bio ? (
                  <p>{profile.bio}</p>
                ) : (
                  <p className="text-muted italic">No about me description provided yet.</p>
                )}
              </div>
              <div className="h-px bg-card-border w-full shrink-0" />
              <div className="overflow-x-auto no-scrollbar w-full shrink-0">
                <div className="flex gap-[24px] items-start min-w-[700px] w-full">
                  {[
                  { icon: <Star size={28} className="text-muted" strokeWidth={1.2} />, value: sellerReviewsCount > 0 ? `${sellerRating}★` : 'N/A', label: 'Average rating' },
                    { icon: <Grid size={28} className="text-muted" strokeWidth={1.2} />, value: `${completedJobsList.length}`, label: 'Projects completed' },
                    { icon: <Smile size={28} className="text-muted" strokeWidth={1.2} />, value: `${sellerReviewsCount}`, label: 'Client reviews' },
                    { icon: <ShieldCheck size={28} className="text-muted" strokeWidth={1.2} />, value: completedJobsList.length > 0 ? '100%' : 'N/A', label: 'Client satisfaction' },
                  ].map((stat, i) => (
                    <div key={i} className="flex flex-1 min-w-0 gap-[12px] items-center">
                      <div className="shrink-0 size-[28px] flex items-center justify-center">{stat.icon}</div>
                      <div className="flex flex-col gap-[2px]">
                        <span className="font-bold text-[22px] text-foreground/80 leading-normal">{stat.value}</span>
                        <span className="font-medium text-[12px] text-muted uppercase leading-normal">{stat.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills Card */}
            <div className="bg-card border border-card-border rounded-[16px] p-[24px] flex flex-col gap-[24px]">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-[20px] text-foreground/80 leading-normal">Skills</h2>
                <div className="flex items-center gap-[10px]">
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => toast('Edit skills & expertise', 'success')}
                      className="flex items-center gap-[6px] px-[10px] h-[28px] rounded-[6px] border border-border text-[11px] text-muted hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
                      title="Edit skills"
                    >
                      <Pencil size={11} />
                      Edit skills
                    </button>
                  )}
                </div>
              </div>
              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-[12px]">
                  {profile.skills.map((skill: string) => (
                    <div key={skill} className="bg-primary/10 px-[16px] py-[8px] rounded-[8px]">
                      <span className="font-normal text-[14px] text-primary">{skill}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-muted text-[13px]">No skills added yet.</div>
              )}
            </div>

            {/* Education Card */}
            {profile.educationSchool && (
              <div className="bg-card border border-card-border rounded-[16px] p-[24px] flex flex-col gap-[16px]">
                <h2 className="font-bold text-[20px] text-foreground/80 leading-normal">Education</h2>
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-[15px] text-foreground/90">{profile.educationSchool}</h3>
                  <p className="text-[12px] text-muted font-medium">
                    {profile.educationDegree} &bull; Graduated {profile.educationYear}
                  </p>
                </div>
              </div>
            )}

            {/* Featured Work Card */}
            <div className="bg-card border border-card-border rounded-[16px] p-[24px] flex flex-col gap-[24px]">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-[20px] text-foreground/80 leading-normal">Featured work</h2>
                <div className="flex items-center gap-[10px]">
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => toast('Add or edit portfolio projects', 'success')}
                      className="flex items-center gap-[6px] px-[10px] h-[28px] rounded-[6px] border border-border text-[11px] text-muted hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
                      title="Edit portfolio"
                    >
                      <Pencil size={11} />
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {profile.portfolioLinks && profile.portfolioLinks.length > 0 ? (
                <div className="flex flex-wrap gap-[16px]">
                  {profile.portfolioLinks.map((link: string, idx: number) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-background border border-card-border p-[14px] rounded-[12px] flex items-center gap-3 hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <Share2 size={16} className="text-primary" />
                      <span className="text-[13px] font-medium text-foreground truncate max-w-[220px]">{link}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted text-[13px]">
                  No featured portfolio projects added yet.
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-card border border-card-border rounded-[16px] flex flex-col gap-[24px] p-[24px] w-full shrink-0">
              <div className="flex font-medium items-center justify-between text-[13px]">
                <div className="flex items-center gap-3">
                  <p className="text-foreground font-bold text-[18px]">Client Reviews ({sellerReviewsCount})</p>
                  {sellerReviewsCount > 0 && (
                    <span className="text-[12px] font-medium text-muted border border-border/50 px-2 py-0.5 rounded-full">
                      {sellerRating.toFixed(1)} avg
                    </span>
                  )}
                </div>
              </div>

              {sellerReviews.length > 0 ? (
                <div className="flex flex-col items-start w-full">
                  {sellerReviews.map((review: any) => (
                    <div key={review.id} className="bg-card border-t border-card-border flex gap-[24px] items-start py-[16px] w-full">
                      {review.reviewer?.avatarUrl && review.reviewer.avatarUrl.trim() ? (
                        <img
                          src={review.reviewer.avatarUrl}
                          alt={review.reviewer.displayName || review.reviewer.username}
                          className="shrink-0 size-[56px] rounded-full object-cover border border-border/30"
                        />
                      ) : (
                        <div className="shrink-0 size-[56px] rounded-full bg-foreground/5 border border-border/40 flex items-center justify-center text-muted text-[16px] font-bold">
                          {(review.reviewer?.displayName || review.reviewer?.username || 'C').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-1 min-w-0 items-start justify-between gap-4">
                        <div className="flex flex-col gap-[8px] items-start min-w-0">
                          <div className="flex flex-col gap-[3px] items-start">
                            <div className="flex gap-[16px] items-center flex-wrap">
                              <p className="font-bold text-[15px] leading-[20px] text-foreground/90">
                                {review.reviewer?.displayName || review.reviewer?.username || 'Client'}
                              </p>
                              <div className="flex gap-[3px] items-center">
                                {[...Array(5)].map((_, idx) => (
                                  <Star
                                    key={idx}
                                    size={13}
                                    className={idx < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-border fill-border'}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.job?.title && (
                              <p className="font-normal text-[11px] text-muted">{review.job.title}</p>
                            )}
                          </div>
                          {review.comment && (
                            <p className="font-normal text-[13px] leading-[20px] text-foreground/80 max-w-[400px]">
                              {review.comment}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-[6px] items-end shrink-0">
                          <p className="font-bold text-[14px] text-foreground">{review.rating}.0</p>
                          <p className="font-normal text-[10px] text-muted whitespace-nowrap">
                            {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted text-[13px] w-full">
                  No client reviews yet.
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Profile Preview tab ── */}
        {activeSubTab === 'preview' && (
          <ProfileOverviewCard profileData={overviewData} />
        )}

        {/* ── Job History tab ── */}
        {activeSubTab === 'history' && (
          <WorkHistoryCard completedJobs={completedJobsList} inProgressJobs={inProgressJobsList} />
        )}
        <div className="hidden md:block mt-auto pt-16">
          <Footer />
        </div>
      </div>
    );
  }

  // --- BUYER MODE (NORMAL PROFILE) LAYOUT ---
  return (
    <div
      onScroll={(e) => {
        const scrollTop = e.currentTarget.scrollTop;
        if (scrollTop > 50) {
          setShowStickyTitle(true);
        } else {
          setShowStickyTitle(false);
        }
      }}
      className="flex flex-col overflow-y-auto no-scrollbar bg-background min-h-full animate-in fade-in duration-200"
    >

      {/* Sticky Header with Back Arrow & Display Name visible on scroll */}
      <div className="sticky top-0 z-30 flex shrink-0 items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={onBack} className="text-foreground opacity-80 hover:opacity-100 transition-opacity p-1 -ml-1 rounded-full hover:bg-card cursor-pointer" aria-label="Go back">
            <ArrowLeft size={20} />
          </button>
          <span className={`font-sans text-[15px] font-bold text-foreground truncate transition-opacity duration-200 ${
            showStickyTitle ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            {profile.fullName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="size-8 flex items-center justify-center rounded-full bg-card border border-border/40 text-foreground opacity-80 hover:opacity-100 transition-all hover:bg-border/30 cursor-pointer"
            title="Share Profile"
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>

      {/* Main Profile Header Section */}
      <div className="flex flex-col px-4 pt-4 pb-5 gap-3 shrink-0">
        {/* Top Info Row: Name & Tag on Left, Right-Aligned Avatar */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col min-w-0 flex-1">
            <h1 className="font-sans text-[26px] font-bold leading-[32px] tracking-tight text-foreground/90 truncate">
              {profile.fullName}
            </h1>
            <p className="font-sans text-[13px] font-semibold text-muted/90 mt-0.5">
              {profile.username}
            </p>
            <p className="font-sans text-[11px] text-muted/70 mt-1">
              member since {profile.memberSince}
            </p>
          </div>

          {/* Profile Picture Aligned to Right */}
          <div className="size-[82px] shrink-0 rounded-full flex items-center justify-center bg-gradient-to-br from-[#291D46] to-[#1D1929] border border-[rgba(140,92,255,0.3)] shadow-lg text-[#AC8EF3] overflow-hidden select-none">
            {profile.avatarUrl && profile.avatarUrl.trim() && !profile.avatarUrl.includes('default-avatar') ? (
              <img src={profile.avatarUrl} alt={profile.fullName} className="h-full w-full object-cover object-center" />
            ) : (
              <span className="font-sans font-bold text-[24px] tracking-wider select-none">{userInitials}</span>
            )}
          </div>
        </div>

        {/* Action Buttons: Edit Profile & Analytics */}
        {isOwner && (
          <div className="flex items-center gap-2.5 mt-1">
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="flex-1 h-[36px] px-4 rounded-xl border border-border bg-card hover:bg-border/40 flex items-center justify-center gap-2 font-sans text-[13px] font-semibold text-foreground transition-colors cursor-pointer shadow-sm"
            >
              <Pencil size={14} />
              <span>Edit Profile</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('Analysis');
                } else {
                  toast('Opening profile analytics...', 'success');
                }
              }}
              className="flex-1 h-[36px] px-4 rounded-xl border border-border bg-card hover:bg-border/40 flex items-center justify-center gap-2 font-sans text-[13px] font-semibold text-foreground transition-colors cursor-pointer shadow-sm"
            >
              <BarChart2 size={14} className="text-[#8C5CFF]" />
              <span>Analytics</span>
            </button>
          </div>
        )}

        {/* Bio Text (Background Removed, Clean Text) */}
        {profile.bio ? (
          <div className="mt-1">
            <p className="font-sans text-[13.5px] font-normal leading-[20px] text-foreground/90 whitespace-pre-wrap break-words">
              {profile.bio}
            </p>
          </div>
        ) : (
          isOwner && (
            <div className="mt-1">
              <p className="font-sans text-[12px] text-muted/60 italic">
                No personal bio added yet. Click "Edit Profile" to add one.
              </p>
            </div>
          )
        )}
      </div>

      {/* Edit Personal Info Modal */}
      {showEditModal && (
        <PersonalInfoModal
          user={{
            name: profile.fullName || profile.displayName || '',
            username: profile.username || '',
            memberSince: profile.memberSince,
          }}
          isSellerMode={false}
          onClose={() => setShowEditModal(false)}
          onSave={(updated) => {
            setProfile((prev: any) => ({
              ...prev,
              fullName: updated.name,
              username: updated.username,
              bio: updated.bio,
            }));
          }}
        />
      )}

      {/* Card body */}
      <div className="flex flex-col bg-card rounded-tl-[10px] rounded-tr-[10px] pt-4">

        {/* Tab bar */}
        <div className="flex justify-center gap-12 sm:gap-16 px-4 border-b border-border shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-[5px] font-sans text-[11px] leading-[16px] text-center whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-primary text-foreground font-medium'
                  : 'border-transparent text-muted hover:text-foreground/70'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="flex flex-col">
          {activeTab === 'Published' ? (
            publishedPosts.length > 0 ? (
              publishedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  showLiveBadge={true}
                  isSelected={false}
                  onClick={() => handleOpenArticle(post)}
                  liked={!!likedPostIds[post.id as any]}
                  bookmarked={!!bookmarkedPostIds[post.id as any]}
                  isFavoriteCreator={!!favoriteCreators[post.handle]}
                  onLikeToggle={() => {
                    setLikedPostIds((prev) => ({ ...prev, [post.id]: !prev[post.id as any] }));
                  }}
                  onBookmarkToggle={() => {
                    setBookmarkedPostIds((prev) => ({ ...prev, [post.id]: !prev[post.id as any] }));
                  }}
                  onFavoriteCreatorToggle={() => {
                    setFavoriteCreators((prev) => ({ ...prev, [post.handle]: !prev[post.handle] }));
                  }}
                  onMuteUser={() => {
                    toast(`Muted ${post.handle}`, 'success');
                  }}
                  onBlockUser={() => {
                    toast(`Blocked ${post.handle}`, 'success');
                  }}
                  onDislikePost={() => {
                    toast('Post disliked', 'success');
                  }}
                  onShareOpen={() => {
                    toast('Share options opened', 'success');
                  }}
                />
              ))
            ) : (
              <div className="py-12 text-center text-muted text-[13px]">
                No published content yet.
              </div>
            )
          ) : activeTab === 'Reads' ? (
            readsPosts.length > 0 ? (
              readsPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isSelected={false}
                  onClick={() => handleOpenArticle(post)}
                  liked={!!likedPostIds[post.id as any]}
                  bookmarked={!!bookmarkedPostIds[post.id as any]}
                  isFavoriteCreator={!!favoriteCreators[post.handle]}
                  onLikeToggle={() => {
                    setLikedPostIds((prev) => ({ ...prev, [post.id]: !prev[post.id as any] }));
                  }}
                  onBookmarkToggle={() => {
                    setBookmarkedPostIds((prev) => ({ ...prev, [post.id]: !prev[post.id as any] }));
                  }}
                  onFavoriteCreatorToggle={() => {
                    setFavoriteCreators((prev) => ({ ...prev, [post.handle]: !prev[post.handle] }));
                  }}
                  onMuteUser={() => {
                    toast(`Muted ${post.handle}`, 'success');
                  }}
                  onBlockUser={() => {
                    toast(`Blocked ${post.handle}`, 'success');
                  }}
                  onDislikePost={() => {
                    toast('Post disliked', 'success');
                  }}
                  onShareOpen={() => {
                    toast('Share options opened', 'success');
                  }}
                />
              ))
            ) : (
              <div className="py-12 text-center text-muted text-[13px]">
                No read history yet.
              </div>
            )
          ) : (
            <div className="flex flex-col gap-6 p-4 animate-in fade-in duration-200">
              
              {/* Section 1: Client Rating History Collapsible */}
              <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card p-4 shadow-sm transition-all duration-200">
                <button
                  type="button"
                  onClick={() => setRatingsOpen(!ratingsOpen)}
                  className="flex items-center justify-between w-full text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center size-8 rounded-xl bg-foreground/5 text-muted border border-border/40">
                      <Star size={16} />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-foreground">Client Rating History</span>
                        {buyerReviewsCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted px-2 py-0.5 rounded-full border border-border/50">
                            {buyerRating.toFixed(1)} avg
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted font-normal">
                        {buyerReviewsCount} {buyerReviewsCount === 1 ? 'review' : 'reviews'} received as a client
                      </span>
                    </div>
                  </div>
                  <ChevronDown size={18} className={cn("text-muted group-hover:text-foreground transition-transform duration-200", ratingsOpen && "rotate-180")} />
                </button>

                {ratingsOpen && (
                  <div className="flex flex-col gap-3 pt-2 border-t border-border/40 animate-in fade-in slide-in-from-top-2 duration-200">
                    {buyerReviews.length > 0 ? (
                      <>
                        <div className="flex flex-col gap-3">
                          {(showAllRatings ? buyerReviews : buyerReviews.slice(0, 6)).map((r: any) => (
                            <div key={r.id} className="flex gap-3 items-start bg-background/80 hover:bg-background rounded-xl border border-border/40 p-3.5 transition-colors shadow-xs">
                              {r.reviewer?.avatarUrl && r.reviewer.avatarUrl.trim() ? (
                                <img src={r.reviewer.avatarUrl} alt={r.reviewer.displayName} className="size-8 rounded-full object-cover shrink-0 border border-border/30" />
                              ) : (
                                <div className="size-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[11px] font-bold shrink-0 border border-primary/20">
                                  {(r.reviewer?.displayName || r.reviewer?.username || 'F').slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[12px] font-semibold text-foreground truncate">
                                    {r.reviewer?.displayName || r.reviewer?.username || 'Freelancer'}
                                  </span>
                                  <div className="flex items-center gap-1 text-[#FF9529] font-bold text-[11px] bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                                    <Star size={10} className="fill-[#FF9529] text-[#FF9529]" />
                                    {r.rating}
                                  </div>
                                </div>
                                {r.job?.title && <span className="text-[10px] font-medium text-muted/70 truncate">{r.job.title}</span>}
                                {r.comment && <p className="text-[11px] text-foreground/80 italic mt-1 bg-card/50 p-2 rounded-lg border border-border/20">"{r.comment}"</p>}
                              </div>
                            </div>
                          ))}
                        </div>

                        {buyerReviews.length > 6 && (
                          <button
                            type="button"
                            onClick={() => setShowAllRatings(!showAllRatings)}
                            className="w-full py-2 text-[12px] font-semibold text-primary hover:text-primary-hover hover:bg-primary/5 rounded-xl border border-primary/20 transition-all cursor-pointer text-center mt-1 flex items-center justify-center gap-1.5"
                          >
                            {showAllRatings ? (
                              <>Show Less <ChevronUp size={14} /></>
                            ) : (
                              <>View More ({buyerReviews.length - 6} remaining) <ChevronDown size={14} /></>
                            )}
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="py-6 text-center text-muted text-[12px]">
                        No client ratings or reviews received yet.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 2: Posted Job History Collapsible */}
              <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card p-4 shadow-sm transition-all duration-200">
                <button
                  type="button"
                  onClick={() => setPostedJobsOpen(!postedJobsOpen)}
                  className="flex items-center justify-between w-full text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center size-8 rounded-xl bg-foreground/5 text-muted border border-border/40">
                      <Briefcase size={16} />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-foreground">Posted Job History</span>
                        <span className="text-[11px] font-medium text-muted px-2 py-0.5 rounded-full border border-border/50">
                          {clientPostedJobs.length} jobs
                        </span>
                      </div>
                      <span className="text-[11px] text-muted font-normal">
                        All jobs posted by this account as a client
                      </span>
                    </div>
                  </div>
                  <ChevronDown size={18} className={cn("text-muted group-hover:text-foreground transition-transform duration-200", postedJobsOpen && "rotate-180")} />
                </button>

                {postedJobsOpen && (
                  <div className="flex flex-col gap-3 pt-2 border-t border-border/40 animate-in fade-in slide-in-from-top-2 duration-200">
                    {clientPostedJobs.length > 0 ? (
                      <>
                        <div className="flex flex-col gap-3">
                          {(showAllJobs ? clientPostedJobs : clientPostedJobs.slice(0, 6)).map((job: any) => {
                            const status = (job.status || 'OPEN').toUpperCase();
                            const getBadgeStyle = (st: string) => {
                              switch (st) {
                                case 'COMPLETED': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                                case 'IN_PROGRESS':
                                case 'WORKING': return 'bg-[#8C5CFF]/15 text-[#8C5CFF] border-[#8C5CFF]/20';
                                case 'DELIVERED': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20';
                                case 'CANCELLED': return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20';
                                default: return 'bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/20';
                              }
                            };
                            return (
                              <div key={job.id} className="flex flex-col gap-2 p-3.5 rounded-xl bg-background/80 hover:bg-background border border-border/40 transition-colors shadow-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[13px] font-semibold text-foreground truncate">{job.title}</span>
                                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border capitalize shrink-0 ${getBadgeStyle(status)}`}>
                                    {status.replace('_', ' ').toLowerCase()}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-muted pt-1">
                                  <span>{job.category || 'General'}</span>
                                  <span className="font-semibold text-primary">{job.amountCC || 0} CC Budget</span>
                                </div>
                                {job.createdAt && (
                                  <span className="text-[10px] text-muted/60">
                                    Posted on {new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {clientPostedJobs.length > 6 && (
                          <button
                            type="button"
                            onClick={() => setShowAllJobs(!showAllJobs)}
                            className="w-full py-2 text-[12px] font-semibold text-primary hover:text-primary-hover hover:bg-primary/5 rounded-xl border border-primary/20 transition-all cursor-pointer text-center mt-1 flex items-center justify-center gap-1.5"
                          >
                            {showAllJobs ? (
                              <>Show Less <ChevronUp size={14} /></>
                            ) : (
                              <>View More ({clientPostedJobs.length - 6} remaining) <ChevronDown size={14} /></>
                            )}
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="py-6 text-center text-muted text-[12px]">
                        No posted job history found for this account.
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
      <div className="hidden md:block mt-auto pt-16">
        <Footer />
      </div>

      {/* Full-article reader overlay */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
          <PostDetail
            post={selectedArticle}
            onBack={() => setSelectedArticle(null)}
            isUnlocked={unlockedArticleIds.includes(selectedArticle.id as any)}
            onUnlock={() => setUnlockedArticleIds(prev => [...prev, selectedArticle.id])}
            liked={!!likedPostIds[selectedArticle.id as any]}
            bookmarked={!!bookmarkedPostIds[selectedArticle.id as any]}
            onLikeToggle={() => setLikedPostIds(prev => ({ ...prev, [selectedArticle.id]: !prev[selectedArticle.id as any] }))}
            onBookmarkToggle={() => setBookmarkedPostIds(prev => ({ ...prev, [selectedArticle.id]: !prev[selectedArticle.id as any] }))}
            onShareOpen={() => toast('Share link copied!', 'success')}
            comments={articleComments}
            onAddComment={handleAddArticleComment}
          />
        </div>
      )}
    </div>
  );
}

