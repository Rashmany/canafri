'use client';

import { useState, useRef } from 'react';
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
  Heart,
  Bookmark,
  ThumbsDown,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Post, PostCard } from './dashboard-page';
import ProfileOverviewCard from './profile-overview-card';
import WorkHistoryCard from './work-history-card';
import Footer from '@/components/layout/footer';

// --- Constants for Buyer Profile ----------------------------------------------

const TABS = ['Published', 'Reads'] as const;
type Tab = typeof TABS[number];

const PUBLISHED_POSTS: Post[] = [
  {
    id: 101,
    name: 'John Trek',
    handle: '@johntrek',
    date: 'May 10',
    avatarSrc: '/images/default-avatar.png',
    text: 'EXCLUSIVE: Alpha report on Canton Network node staking yields and institutional Liquidity Pool migration patterns for Q3 2026. Staking yields remain highly lucrative.',
    fullText: 'EXCLUSIVE: Alpha report on Canton Network node staking yields and institutional Liquidity Pool migration patterns for Q3 2026. Staking yields remain highly lucrative.',
    category: 'premium',
    likesCount: 24,
    commentsCount: 3,
    stakeReward: '5 CC Read-Stake Required',
  },
  {
    id: 102,
    name: 'John Trek',
    handle: '@johntrek',
    date: 'May 8',
    avatarSrc: '/images/default-avatar.png',
    text: 'Deep-dive analysis on institutional Daml ledgers and validator security configurations. Recommended node operational policies are detailed in full document.',
    fullText: 'Deep-dive analysis on institutional Daml ledgers and validator security configurations. Recommended node operational policies are detailed in full document.',
    category: 'premium',
    likesCount: 15,
    commentsCount: 1,
    stakeReward: '5 CC Read-Stake Required',
  },
];

const READS_POSTS: Post[] = [
  {
    id: 103,
    name: 'Sarah Dev',
    handle: '@sarahdev',
    date: 'May 9',
    avatarSrc: '/images/default-avatar.png',
    text: 'Analyzing Canton network gas dynamics under high transaction volumes: A comprehensive review of performance characteristics.',
    fullText: 'Analyzing Canton network gas dynamics under high transaction volumes: A comprehensive review of performance characteristics.',
    category: 'premium',
    likesCount: 42,
    commentsCount: 8,
    stakeReward: '5 CC Read-Stake Required',
  },
  {
    id: 104,
    name: 'Alex Daml',
    handle: '@alexdaml',
    date: 'May 5',
    avatarSrc: '/images/default-avatar.png',
    text: 'Best practices for writing secure Daml templates and preventing execution logic recursion vulnerabilities.',
    fullText: 'Best practices for writing secure Daml templates and preventing execution logic recursion vulnerabilities.',
    category: 'premium',
    likesCount: 18,
    commentsCount: 2,
    stakeReward: '5 CC Read-Stake Required',
  },
];

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
}

export default function ProfilePage({ onBack, sellerMode = false, isOwner = true }: ProfilePageProps) {
  const [profile] = useState(() => {
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
      fullName: 'John Trek',
      username: '@joshtrek',
      email: 'josh@trek.io',
      location: 'Turkey',
      memberSince: 'April 2026',
    };
  });

  const [activeTab, setActiveTab] = useState<Tab>('Published');
  const [activeSubTab, setActiveSubTab] = useState<'about' | 'preview' | 'history'>('about');
  const [showMenu, setShowMenu] = useState(false);
  const [portfolioScrolled, setPortfolioScrolled] = useState(false);
  const portfolioRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  // --- SELLER MODE (FREELANCER PROFILE) LAYOUT ---
  if (sellerMode) {
    const displayLocation = profile.city ? `${profile.city}, ${profile.country}` : (profile.country || profile.location);
    const displayHeadline = profile.headline || 'Full Stack Developer';
    const displayTags = profile.skills?.slice(0, 4) || ['smart contract', 'Daml developer', 'Web3 Expert'];

    return (
      <div className="flex flex-col overflow-y-auto bg-background h-full animate-in fade-in duration-200 px-4 py-6 gap-6 md:px-8">

        {/* Header section (Figma 1118:17514) */}
        <div className="overflow-x-auto no-scrollbar w-full shrink-0">
          <div className="bg-card border border-card-border rounded-[16px] px-[24px] py-[30px] flex flex-row gap-[47px] items-center relative min-w-[850px]">
            {/* Avatar + online dot */}
            <div className="relative shrink-0">
              <div className="size-[90px] rounded-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-md text-primary overflow-hidden">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.fullName} className="h-full w-full object-cover" />
                ) : (
                  <User size={40} strokeWidth={1.2} />
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
                    {profile.isVerified && <VerifiedBadge />}
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
                    onClick={() => toast('Opening message composer for John Trek…', 'success')}
                    className="h-[36px] px-[16px] rounded-[12px] border border-primary/50 text-[13px] font-semibold text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
                  >
                    Message
                  </button>
                  <button
                    type="button"
                    onClick={() => toast('Opening hire contract for John Trek…', 'success')}
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
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMenu((v) => !v)}
                      className="h-[34px] w-[38px] flex items-center justify-center text-muted hover:text-foreground transition-colors cursor-pointer"
                      title="More options"
                    >
                      <MoreVertical size={15} />
                    </button>
                    {showMenu && (
                      <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-[10px] shadow-xl z-50 min-w-[160px] py-1 flex flex-col">
                        {[
                          { label: 'Report freelancer', action: () => toast('Report submitted', 'success') },
                          { label: 'Block user', action: () => toast('User blocked', 'success') },
                          { label: 'Save to list', action: () => toast('Saved to favourites', 'success') },
                        ].map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => { item.action(); setShowMenu(false); }}
                            className="px-[14px] py-[8px] text-[13px] text-left text-foreground/75 hover:bg-foreground/5 hover:text-foreground transition-colors cursor-pointer"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Owner: share button only (no message/hire/dots) */}
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

        {/* Tab switcher (Figma 1118:18132) — h-[100px] */}
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
            {/* About Me Card — gradient bg (Figma 1127:19290) */}
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
                  <>
                    <p>
                      I&apos;m a passionate Full Stack Developer with 6+ years of experience building secure, scalable, and high-performance web applications. I specialize in JavaScript/TypeScript ecosystems and have a strong focus on clean code, performance, and exceptional user experience.
                    </p>
                    <p>I help startups and businesses turn ideas into reliable products that users love.</p>
                  </>
                )}
              </div>
              <div className="h-px bg-card-border w-full shrink-0" />
              <div className="overflow-x-auto no-scrollbar w-full shrink-0">
                <div className="flex gap-[24px] items-start min-w-[700px] w-full">
                  {[
                    { icon: <User size={28} className="text-muted" strokeWidth={1.2} />, value: profile.yearsOfExperience || '6+', label: 'Years experience' },
                    { icon: <Grid size={28} className="text-muted" strokeWidth={1.2} />, value: '80+', label: 'Projects completed' },
                    { icon: <Smile size={28} className="text-muted" strokeWidth={1.2} />, value: '30+', label: 'Happy clients' },
                    { icon: <ShieldCheck size={28} className="text-muted" strokeWidth={1.2} />, value: '100%', label: 'Client satisfaction' },
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

            {/* Skills Card (Figma 1118:17681) */}
            <div className="bg-card border border-card-border rounded-[16px] p-[24px] flex flex-col gap-[24px]">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-[20px] text-foreground/80 leading-normal">Skills</h2>
                <div className="flex items-center gap-[10px]">
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={() => toast('Edit skills & expertise', 'success')}
                      className="flex items-center gap-[6px] px-[10px] h-[28px] rounded-[6px] border border-border text-[11px] text-muted hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
                      title="Edit skills"
                    >
                      <Pencil size={11} />
                      Edit skills
                    </button>
                  ) : (
                    <button type="button" onClick={() => toast('Viewing full skills list for John Trek', 'success')} className="text-[12px] font-medium text-primary hover:underline cursor-pointer">
                      View all skills
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-[12px]">
                {(profile.skills || ['JavaScript','TypeScript','React','Next.js','Node.js','NestJS','Express.js','Prisma','Docker','Tailwind CSS']).map((skill: string) => (
                  <div key={skill} className="bg-primary/10 px-[16px] py-[8px] rounded-[8px]">
                    <span className="font-normal text-[14px] text-primary">{skill}</span>
                  </div>
                ))}
              </div>
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

            {/* Featured Work Card (Figma 1118:17714) */}
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
                  <button type="button" onClick={() => toast('Opening full portfolio for John Trek', 'success')} className="text-[12px] font-medium text-primary hover:underline cursor-pointer">
                    View portfolio
                  </button>
                </div>
              </div>
              {/* Scrollable portfolio row */}
              <div className="relative">
                {/* Left scroll arrow — only visible when scrolled right */}
                {portfolioScrolled && (
                  <button
                    type="button"
                    onClick={() => scrollPortfolio('left')}
                    className="-translate-y-1/2 absolute bg-sidebar border border-card-border hover:bg-card drop-shadow-xl flex items-center justify-center left-[-20px] rounded-full size-[48px] top-1/2 cursor-pointer transition-all z-10 active:scale-90"
                    title="Scroll left"
                  >
                    <ChevronLeft size={22} className="text-foreground" />
                  </button>
                )}
                {/* Cards row */}
                <div
                  ref={portfolioRef}
                  className="flex gap-[24px] items-start overflow-x-auto no-scrollbar scroll-smooth"
                >
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-background border border-card-border flex shrink-0 w-[220px] flex-col gap-[12px] items-start p-[10px] rounded-[16px] cursor-pointer hover:ring-1 hover:ring-primary/40 transition-all">
                      <div className="aspect-[16/10] rounded-[12px] w-full bg-[#14111d] flex items-center justify-center text-muted overflow-hidden">
                        <User size={28} className="opacity-30" />
                      </div>
                      <div className="flex flex-col gap-[4px] w-full">
                        <p className="font-medium text-[13px] leading-[18px] text-foreground/80">Fintrack - Financial Dashboard</p>
                        <p className="font-medium text-[12px] leading-normal text-muted">Web Application</p>
                      </div>
                      <div className="flex flex-wrap gap-[8px]">
                        {['Next.js','TypeScript'].map((tag) => (
                          <div key={tag} className="bg-primary/10 px-[8px] py-[4px] rounded-[4px]">
                            <span className="font-medium text-[12px] text-primary">{tag}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Right scroll arrow */}
                <button
                  type="button"
                  onClick={() => scrollPortfolio('right')}
                  className="-translate-y-1/2 absolute bg-sidebar border border-card-border hover:bg-card drop-shadow-xl flex items-center justify-center right-[-20px] rounded-full size-[48px] top-1/2 cursor-pointer transition-all z-10 active:scale-90"
                  title="Scroll right"
                >
                  <ChevronRight size={22} className="text-foreground" />
                </button>
              </div>
            </div>

            {/* Reviews (Figma 1118:17770) */}
            <div className="bg-card border border-card-border rounded-tl-[16px] rounded-tr-[16px] flex flex-col gap-[24px] pt-[24px] overflow-x-auto no-scrollbar w-full shrink-0">
              <div className="flex font-medium items-center justify-between leading-[18px] px-[24px] text-[13px] min-w-[800px] w-full">
                <p className="text-foreground">Client Review</p>
                <button type="button" onClick={() => toast('Viewing all reviews for John Trek', 'success')} className="text-primary hover:underline cursor-pointer">View all reviews</button>
              </div>
              <div className="flex flex-col items-start min-w-[800px] w-full">
                {[
                  { name: 'Alinson brave', company: 'CEO Technova inc.', comment: 'John Trek is exemptional, he deliver high quality application, i recommend him for the next person to hire him, i have no doubt in him.', score: '5.00', date: 'April 12, 2026', rating: 5 },
                  { name: 'Alinson brave', company: 'CEO Technova inc.', comment: 'John Trek is exemptional, he deliver high quality application, i recommend him for the next person to hire him, i have no doubt in him.', score: '5.00', date: 'April 12, 2026', rating: 5 },
                ].map((review, i) => (
                  <div key={i} className="bg-card border-t border-card-border flex gap-[24px] items-start py-[12px] px-[24px] w-full">
                    <div className="shrink-0 size-[85px] rounded-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-primary">
                      <User size={40} strokeWidth={1.2} />
                    </div>
                    <div className="flex flex-1 min-w-0 items-start justify-between">
                      <div className="flex flex-col gap-[10px] items-start">
                        <div className="flex flex-col gap-[5px] items-start">
                          <div className="flex gap-[24px] items-center">
                            <p className="font-bold text-[18px] leading-[24px] tracking-[-0.18px] text-foreground/80">{review.name}</p>
                            <div className="flex gap-[3px] items-center">
                              {[...Array(review.rating)].map((_, idx) => (
                                <Star key={idx} size={16} className="text-yellow-400 fill-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <p className="font-normal text-[11px] leading-[16px] text-foreground/80">{review.company}</p>
                        </div>
                        <p className="font-normal text-[13px] leading-[20px] text-foreground/80 max-w-[358px]">{review.comment}</p>
                      </div>
                      <div className="flex flex-col gap-[10px] items-start shrink-0 w-[66px]">
                        <p className="font-medium text-[13px] leading-[18px] text-foreground">{review.score}</p>
                        <p className="font-normal text-[10px] leading-[13px] text-muted">{review.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Profile Preview tab ── */}
        {activeSubTab === 'preview' && (
          <ProfileOverviewCard />
        )}

        {/* ── Job History tab ── */}
        {activeSubTab === 'history' && (
          <WorkHistoryCard />
        )}
        <div className="hidden md:block">
          <Footer />
        </div>
      </div>
    );
  }

  // --- BUYER MODE (NORMAL PROFILE) LAYOUT ---
  return (
    <div className="flex flex-col overflow-y-auto no-scrollbar bg-background h-full animate-in fade-in duration-200">

      {/* Top Bar */}
      <div className="flex shrink-0 items-center justify-between px-4 py-4">
        <button type="button" onClick={onBack} className="text-foreground opacity-80 hover:opacity-100 transition-opacity" aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <div className="flex items-center gap-[15px]">
          <button type="button" className="text-foreground opacity-80 hover:opacity-100 transition-opacity" aria-label="Edit profile">
            <Pencil size={18} />
          </button>
          <div className="size-6 flex items-center justify-center rounded-full bg-card border border-border/20">
            <Share2 size={13} className="text-foreground opacity-80" />
          </div>
        </div>
      </div>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center pt-2 pb-6 shrink-0 gap-4">
        <div className="size-[130px] rounded-full flex items-center justify-center bg-gradient-to-br from-[#291D46] to-[#1D1929] border border-[rgba(140,92,255,0.3)] shadow-xl text-[#AC8EF3]">
          <User size={56} strokeWidth={1.2} />
        </div>
        <div className="flex flex-col items-center gap-[5px] w-[270px]">
          <h1 className="font-sans text-[36px] font-bold leading-[42px] tracking-[-0.18px] text-foreground/80 text-center w-full">
            {profile.fullName}
          </h1>
          <p className="font-sans text-[11px] text-muted leading-[16px] text-center">{profile.username}</p>
          <p className="font-sans text-[11px] text-muted leading-[16px] text-center">member since {profile.memberSince}</p>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col bg-card rounded-tl-[10px] rounded-tr-[10px] pt-4">

        {/* Tab bar */}
        <div className="flex justify-center gap-16 px-4 border-b border-border shrink-0">
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
          {(activeTab === 'Published' ? PUBLISHED_POSTS : READS_POSTS).map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isSelected={false}
              onClick={() => {}}
              liked={!!likedPostIds[post.id]}
              bookmarked={!!bookmarkedPostIds[post.id]}
              isFavoriteCreator={!!favoriteCreators[post.handle]}
              onLikeToggle={() => {
                setLikedPostIds((prev) => ({ ...prev, [post.id]: !prev[post.id] }));
              }}
              onBookmarkToggle={() => {
                setBookmarkedPostIds((prev) => ({ ...prev, [post.id]: !prev[post.id] }));
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
          ))}
        </div>
      </div>
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}

