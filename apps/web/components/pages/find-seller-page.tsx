'use client';

import { useState, useEffect, useMemo } from 'react';
import Footer from '@/components/layout/footer';
import { FindJobPageSkeleton } from '@/components/ui/skeleton';
import { CheckCircle2, ShieldCheck, Globe, MapPin, Briefcase, Clock, DollarSign, Wallet, Check } from 'lucide-react';

// ─── Unified Types ────────────────────────────────────────────────────────────

export interface SellerGig {
  id: string;
  title: string;
  price: string;
  image: string;
  rating: number;
  reviews: number;
}

export interface SellerReview {
  id: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface SellerWorkHistory {
  id: string;
  title: string;
  date: string;
  amount: string;
  feedback: string;
  status: 'Completed' | 'In Progress';
}

export interface SellerLanguage {
  name: string;
  level: string;
  pct: number;
}

export interface Seller {
  id: number | string;
  name: string;
  username: string;
  avatar: string;
  title: string;
  level: 'Top Rated Seller' | 'Verified Seller';
  rating: number;
  reviewsCount: number;
  minProjectBudget: string;
  totalEarnings: string;
  location: string;
  responseTime: string;
  isVerified: boolean;
  isOnline: boolean;
  bio: string;
  skills: string[];
  completedJobs: number;
  jobSuccess: string;
  verifications: string[];
  languages: SellerLanguage[];
  gigs: SellerGig[];
  workHistory: SellerWorkHistory[];
  reviews: SellerReview[];
}

// ─── Mock Sellers Data ────────────────────────────────────────────────────────

export const SELLERS: Seller[] = [
  {
    id: 20001,
    name: 'Elena Rostova',
    username: '@elena_canton',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    title: 'Senior Daml & Canton Smart Contract Architect',
    level: 'Top Rated Seller',
    rating: 5.0,
    reviewsCount: 64,
    minProjectBudget: '150 CC ($200)',
    totalEarnings: '$45k+ (85,000 CC)',
    location: 'United Kingdom',
    responseTime: '1 hour',
    isVerified: true,
    isOnline: true,
    bio: 'Daml certified smart contract developer with 6+ years of experience in enterprise distributed ledgers. Specialized in Canton multi-party workflows, private sub-networks, tokenization protocols, and financial asset settlement systems.',
    skills: ['Daml', 'Canton Network', 'Smart Contracts', 'Ledger API', 'TypeScript', 'Java'],
    completedJobs: 58,
    jobSuccess: '99%',
    verifications: ['Email Verified', 'ID Verified', 'Phone Verified', 'Payment Verified', 'Canton Node Verified'],
    languages: [
      { name: 'English', level: 'Native', pct: 100 },
      { name: 'German', level: 'Fluent', pct: 85 },
    ],
    gigs: [
      {
        id: 'g-1',
        title: 'I will write production-ready Daml smart contracts for Canton network',
        price: '180 CC',
        image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=600&q=80',
        rating: 5.0,
        reviews: 42,
      },
      {
        id: 'g-2',
        title: 'I will audit & optimize your Canton participant node contracts',
        price: '250 CC',
        image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
        rating: 4.9,
        reviews: 22,
      },
    ],
    workHistory: [
      {
        id: 'w-1',
        title: 'Canton ledger multi-party sub-network agreement templates audit & implementation.',
        date: 'Jan 2026',
        amount: '850 CC',
        feedback: 'World-class Daml expertise. Solved complex privacy routing rules effortlessly.',
        status: 'Completed',
      },
      {
        id: 'w-2',
        title: 'Institutional digital asset tokenization contracts on Daml.',
        date: 'Dec 2025',
        amount: '1,200 CC',
        feedback: 'Delivered robust ledger contracts with 100% test coverage.',
        status: 'Completed',
      },
    ],
    reviews: [
      {
        id: 'r-1',
        reviewerName: 'Marcus Vance',
        reviewerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
        rating: 5,
        comment: 'Elena delivered exceptional Daml contracts ahead of schedule. Her understanding of Canton privacy rules saved our protocol from a major design flaw.',
        date: '2 days ago',
      },
      {
        id: 'r-2',
        reviewerName: 'Devon Tech Labs',
        reviewerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80',
        rating: 5,
        comment: 'Brilliant communication and deep expertise in Ledger API integrations. Highly recommended for any complex Canton project.',
        date: '1 week ago',
      },
    ],
  },
  {
    id: 20002,
    name: 'Alexander Chen',
    username: '@alex_dev',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    title: 'Full-Stack Web3 & Canton Wallet Integration Engineer',
    level: 'Top Rated Seller',
    rating: 4.9,
    reviewsCount: 42,
    minProjectBudget: '120 CC ($160)',
    totalEarnings: '$32k+ (60,000 CC)',
    location: 'Singapore',
    responseTime: '2 hours',
    isVerified: true,
    isOnline: true,
    bio: 'Frontend expert specializing in Next.js, React, and Canton Node RPC/REST API integrations. Built over 15 dApps, staking dashboards, and non-custodial crypto wallet interfaces with zero security incidents.',
    skills: ['React', 'Next.js', 'Tailwind CSS', 'Canton Wallet', 'Ethers.js', 'Fastify'],
    completedJobs: 39,
    jobSuccess: '96%',
    verifications: ['Email Verified', 'ID Verified', 'Phone Verified', 'Payment Verified'],
    languages: [
      { name: 'English', level: 'Native', pct: 100 },
      { name: 'Mandarin', level: 'Native', pct: 100 },
    ],
    gigs: [
      {
        id: 'g-3',
        title: 'I will build a custom Next.js wallet dashboard for Canton network',
        price: '150 CC',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
        rating: 5.0,
        reviews: 28,
      },
      {
        id: 'g-4',
        title: 'I will integrate Fastify WebSockets for real-time transaction feeds',
        price: '100 CC',
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
        rating: 4.8,
        reviews: 14,
      },
    ],
    workHistory: [
      {
        id: 'w-3',
        title: 'Canton DeFi staking dashboard frontend integration.',
        date: 'Nov 2025',
        amount: '600 CC',
        feedback: 'Extremely clean React code and responsive UI.',
        status: 'Completed',
      },
    ],
    reviews: [
      {
        id: 'r-3',
        reviewerName: 'Sarah Jenkins',
        reviewerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80',
        rating: 5,
        comment: 'Alexander turned our Figma mocks into a buttery smooth Next.js wallet interface in under 4 days. Incredible craftsmanship.',
        date: '5 days ago',
      },
    ],
  },
  {
    id: 20003,
    name: 'Tunde Afolabi',
    username: '@tunde_security',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80',
    title: 'Blockchain Security Auditor & Canton Privacy Consultant',
    level: 'Verified Seller',
    rating: 4.8,
    reviewsCount: 29,
    minProjectBudget: '200 CC ($260)',
    totalEarnings: '$28k+ (50,000 CC)',
    location: 'Nigeria',
    responseTime: '1 hour',
    isVerified: true,
    isOnline: false,
    bio: 'Cybersecurity researcher focused on smart contract formal verification, consensus vulnerabilities, and privacy-preserving zero-knowledge proofs on Canton network.',
    skills: ['Security Auditing', 'Daml', 'Zero Knowledge', 'Penetration Testing', 'Canton'],
    completedJobs: 27,
    jobSuccess: '94%',
    verifications: ['Email Verified', 'ID Verified', 'Phone Verified', 'Payment Verified'],
    languages: [
      { name: 'English', level: 'Fluent', pct: 90 },
    ],
    gigs: [
      {
        id: 'g-5',
        title: 'I will perform a comprehensive security audit of your Daml contract',
        price: '300 CC',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
        rating: 4.9,
        reviews: 21,
      },
    ],
    workHistory: [
      {
        id: 'w-4',
        title: 'Formal verification audit of multi-party Daml escrow templates.',
        date: 'Oct 2025',
        amount: '950 CC',
        feedback: 'In-depth security report with actionable mitigation code.',
        status: 'Completed',
      },
    ],
    reviews: [
      {
        id: 'r-4',
        reviewerName: 'Canton Treasury Org',
        reviewerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=128&q=80',
        rating: 5,
        comment: 'Tunde found 2 critical authorization flaws during his audit. His report was clear and provided step-by-step resolution code.',
        date: '2 weeks ago',
      },
    ],
  },
  {
    id: 20004,
    name: 'Sophia Lindqvist',
    username: '@sophia_design',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
    title: 'Senior Web3 UI/UX & Product Designer',
    level: 'Verified Seller',
    rating: 5.0,
    reviewsCount: 38,
    minProjectBudget: '100 CC ($130)',
    totalEarnings: '$22k+ (40,000 CC)',
    location: 'Sweden',
    responseTime: '3 hours',
    isVerified: true,
    isOnline: true,
    bio: 'Designing sleek, dark-mode first crypto trading platforms, NFT marketplaces, and Canton DeFi web apps. Focused on conversion-centered design and micro-interactions.',
    skills: ['Figma', 'UI/UX Design', 'Design Systems', 'Web3', 'Prototyping'],
    completedJobs: 35,
    jobSuccess: '100%',
    verifications: ['Email Verified', 'ID Verified', 'Payment Verified'],
    languages: [
      { name: 'English', level: 'Fluent', pct: 90 },
      { name: 'Swedish', level: 'Native', pct: 100 },
    ],
    gigs: [
      {
        id: 'g-6',
        title: 'I will design a high-converting Web3 SaaS or Canton dApp interface',
        price: '140 CC',
        image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80',
        rating: 5.0,
        reviews: 35,
      },
    ],
    workHistory: [
      {
        id: 'w-5',
        title: 'Complete UI/UX design system for Canton NFT marketplace.',
        date: 'Dec 2025',
        amount: '550 CC',
        feedback: 'Stunning Figma design files with fully interactive prototypes.',
        status: 'Completed',
      },
    ],
    reviews: [
      {
        id: 'r-5',
        reviewerName: 'Fintech Spark',
        reviewerAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=128&q=80',
        rating: 5,
        comment: 'Sophia is hands down the best Web3 UI designer we have worked with. World-class aesthetics and perfect Figma design tokens.',
        date: '3 days ago',
      },
    ],
  },
];

// ─── Utility Components ───────────────────────────────────────────────────────

function StarRating({ filled, total = 5 }: { filled: number; total?: number }) {
  return (
    <div className="flex items-center gap-[3px]">
      {Array.from({ length: total }, (_, i) => {
        const fill = Math.min(1, Math.max(0, filled - i));
        const clipId = `star-clip-${i}-${Math.round(filled * 10)}`;
        return (
          <svg key={i} width="14" height="14" viewBox="0 0 16 16" fill="none">
            <defs>
              <clipPath id={clipId}>
                <rect x="0" y="0" width={`${fill * 100}%`} height="100%" />
              </clipPath>
            </defs>
            {/* Grey background star */}
            <path
              d="M8 0L9.79611 5.52786H15.6085L10.9062 8.94427L12.7023 14.4721L8 11.0557L3.29772 14.4721L5.09383 8.94427L0.391548 5.52786H6.20389L8 0Z"
              fill="#A0A0A0"
            />
            {/* Filled portion clipped to fractional width */}
            <path
              d="M8 0L9.79611 5.52786H15.6085L10.9062 8.94427L12.7023 14.4721L8 11.0557L3.29772 14.4721L5.09383 8.94427L0.391548 5.52786H6.20389L8 0Z"
              fill="#FF9529"
              clipPath={`url(#${clipId})`}
            />
          </svg>
        );
      })}
    </div>
  );
}

function SellerAvatar({
  src,
  name,
  className = "w-11 h-11",
  textClassName = "text-[14px]",
}: {
  src?: string;
  name: string;
  className?: string;
  textClassName?: string;
}) {
  const [imgError, setImgError] = useState(false);

  const initials = useMemo(() => {
    if (!name) return "S";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [name]);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        className={`${className} rounded-full object-cover border border-border/40 shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${className} rounded-full bg-[#291D46] dark:bg-[#8C5CFF]/20 text-[#8C5CFF] dark:text-white flex items-center justify-center font-bold ${textClassName} shrink-0 border border-[#8C5CFF]/30 shadow-sm`}
    >
      {initials}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative w-[18px] h-[18px] flex items-center justify-center shrink-0">
        <svg width="18" height="18" viewBox="0 0 19 19" fill="none">
          <path
            d="M9.11405 0.468617C9.31405 0.225776 9.68595 0.225776 9.88595 0.468617L11.5108 2.44146C11.6344 2.59158 11.8339 2.65639 12.0221 2.60761L14.4963 1.9666C14.8008 1.8877 15.1017 2.10629 15.1208 2.42031L15.2757 4.97144C15.2875 5.16555 15.4107 5.33523 15.5917 5.40642L17.9701 6.34209C18.2628 6.45726 18.3778 6.81096 18.2086 7.07621L16.8344 9.23116C16.7299 9.39514 16.7299 9.60486 16.8344 9.76884L18.2086 11.9238C18.3778 12.189 18.2629 12.5427 17.9701 12.6579L15.5917 13.5936C15.4107 13.6648 15.2875 13.8344 15.2757 14.0286L15.1208 16.5797C15.1017 16.8937 14.8008 17.1123 14.4963 17.0334L12.0221 16.3924C11.8339 16.3436 11.6344 16.4084 11.5108 16.5585L9.88595 18.5314C9.68595 18.7742 9.31405 18.7742 9.88595 18.5314L7.48921 16.5585C7.36558 16.4084 7.16612 16.3436 6.97786 16.3924L4.50373 17.0334C4.19918 17.1123 3.89831 16.8937 3.87924 16.5797L3.72434 14.0286C3.71255 13.8344 3.58928 13.6648 3.4083 13.5936L1.02991 12.6579C0.73715 12.5427 0.622227 12.189 0.791378 11.9238L2.16557 9.76884C2.27013 9.60486 2.27013 9.39514 2.16557 9.23116L0.791378 7.07621C0.622227 6.81096 0.73715 6.45726 1.02991 6.34209L3.4083 5.40642C3.58928 5.33523 3.71255 5.16555 3.72434 4.97144L3.87924 2.42031C3.89831 2.10629 4.19918 1.8877 4.50373 1.9666L6.97786 2.60761C7.16612 2.65639 7.36558 2.59158 7.48921 2.44146L9.11405 0.468617Z"
            fill="#8C5CFF"
          />
        </svg>
        <svg
          className="absolute"
          width="9"
          height="9"
          viewBox="0 0 10 10"
          fill="none"
        >
          <path
            d="M8.96973 2.7207L3.75 7.94531L1.03027 5.2207L1.46973 4.78125L3.75 7.05664L8.53027 2.28125L8.96973 2.7207Z"
            fill="white"
          />
        </svg>
      </div>
      <span className="text-muted text-[11px] leading-4">Verified Seller</span>
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-[#D8D8D8] dark:bg-[#121212]" />;
}

function StatRow({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex gap-3 items-center shrink-0 w-full p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-border/30">
      <div className="bg-background flex items-center justify-center rounded-lg shrink-0 size-9 text-muted">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <p className="font-semibold text-[13px] text-foreground leading-snug">{value}</p>
        <p className="font-medium text-[11px] text-muted leading-tight">{label}</p>
      </div>
    </div>
  );
}

// ─── Sub-Panels ──────────────────────────────────────────────────────────────

interface SellerListPanelProps {
  onBack?: () => void;
  selectedSellerId: number | string;
  onSelectSeller: (seller: Seller) => void;
  savedSellerIds: Record<number | string, boolean>;
  onToggleSaveSeller: (id: number | string) => void;
  sellersList: Seller[];
}

function SellerListPanel({
  selectedSellerId,
  onSelectSeller,
  savedSellerIds,
  onToggleSaveSeller,
  sellersList,
}: SellerListPanelProps) {
  const [activeTab, setActiveTab] = useState<'All Sellers' | 'Top Rated' | 'Available Now' | 'Saved Sellers'>('All Sellers');

  const filteredSellers = useMemo(() => {
    if (activeTab === 'Saved Sellers') {
      return sellersList.filter(s => savedSellerIds[s.id]);
    }
    if (activeTab === 'Top Rated') {
      return sellersList.filter(s => s.rating >= 4.9);
    }
    if (activeTab === 'Available Now') {
      return sellersList.filter(s => s.isOnline);
    }
    return sellersList;
  }, [sellersList, activeTab, savedSellerIds]);

  return (
    <div className="flex flex-col h-full bg-[#FAFAFD] dark:bg-[#0B0B0B]">
      {/* Page header */}
      <div className="px-5 pt-6 pb-4 border-b border-[#D8D8D8] dark:border-[#121212]">
        <div className="flex items-center gap-[7px] mb-1">
          <h1 className="text-[#010101] dark:text-white text-lg font-semibold leading-7">
            Find Sellers
          </h1>
        </div>
        <p className="text-muted text-sm leading-5">
          Find the right talent for your next project.
        </p>
      </div>

      {/* Quick Navigation Link Buttons */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#D8D8D8] dark:border-[#121212] overflow-x-auto no-scrollbar bg-background/50">
        {(['All Sellers', 'Top Rated', 'Available Now', 'Saved Sellers'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const count = tab === 'Saved Sellers'
            ? sellersList.filter(s => savedSellerIds[s.id]).length
            : tab === 'Available Now'
            ? sellersList.filter(s => s.isOnline).length
            : null;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#8C5CFF] text-white shadow-sm font-semibold'
                  : 'bg-black/5 dark:bg-white/5 text-muted hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              <span>{tab}</span>
              {count !== null && count > 0 && (
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-[#8C5CFF]/15 text-[#8C5CFF]'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Seller list */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filteredSellers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center gap-2">
            <span className="text-muted text-xs font-medium">
              {activeTab === 'Saved Sellers' ? 'No saved sellers yet.' : 'No sellers found for this filter.'}
            </span>
          </div>
        ) : (
          filteredSellers.map((seller, index) => {
            const isSelected = selectedSellerId === seller.id;
            const isSaved = savedSellerIds[seller.id];

            return (
              <div
                key={`${seller.id}-${index}`}
                onClick={() => onSelectSeller(seller)}
                className={`flex flex-col gap-4 px-5 py-5 cursor-pointer border-b border-[#D8D8D8] dark:border-[#121212] transition-colors ${
                  isSelected
                    ? "bg-[#F0EDFC] dark:bg-[#161626]"
                    : "bg-transparent hover:bg-black/[0.02] dark:hover:bg-[#111]"
                }`}
              >
                {/* Header row: Avatar + Name + Fixed Min Budget */}
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <SellerAvatar src={seller.avatar} name={seller.name} className="w-11 h-11" />
                    {seller.isOnline && (
                      <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-background" />
                    )}
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[#010101] dark:text-white text-[14px] font-semibold truncate">
                        {seller.name}
                      </span>
                      <span className="text-[#8C5CFF] text-[11px] font-semibold shrink-0">
                        Min. {seller.minProjectBudget}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-muted text-[11px] truncate">{seller.username}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#8C5CFF]/10 text-[#8C5CFF] shrink-0">
                        {seller.level}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Title / Headline */}
                <p className="text-[#010101]/85 dark:text-white/85 text-[13px] font-medium leading-[18px] line-clamp-2">
                  {seller.title}
                </p>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1.5">
                  {seller.skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-[3px] bg-[#8C5CFF]/10 text-[#8C5CFF] text-[10px] font-normal"
                    >
                      {skill}
                    </span>
                  ))}
                  {seller.skills.length > 4 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] text-muted">
                      +{seller.skills.length - 4}
                    </span>
                  )}
                </div>

                {/* Footer metrics: Rating, Jobs, Location, Bookmark */}
                <div className="flex items-center justify-between pt-1 border-t border-[#D8D8D8]/50 dark:border-[#121212]/50">
                  <div className="flex items-center gap-3">
                    {seller.rating > 0 ? (
                      <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
                        <StarRating filled={seller.rating} />
                        <span className="text-[10px] font-semibold text-[#FF9529] pl-0.5">
                          {seller.rating.toFixed(1)}
                        </span>
                        {seller.reviewsCount > 0 && (
                          <span className="text-muted text-[10px]">({seller.reviewsCount})</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
                        <span className="text-[10px] font-medium text-muted">No rating yet</span>
                      </div>
                    )}

                    <span className="text-muted text-[11px]">
                      {seller.completedJobs} jobs
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-muted text-[11px] hidden sm:inline">
                      {seller.location}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSaveSeller(seller.id);
                      }}
                      className={`flex items-center transition-colors cursor-pointer ${
                        isSaved ? 'text-primary' : 'text-muted hover:text-primary'
                      }`}
                    >
                      <svg
                        width="14"
                        height="18"
                        viewBox="0 0 24 24"
                        fill={isSaved ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Complete Unified Seller Detail Panel ─────────────────────────────────────

interface SellerDetailPanelProps {
  seller: Seller | null;
  onClose: () => void;
  onOpenChat?: (user: { id: string; name: string; username?: string; avatarUrl?: string }) => void;
}

function SellerDetailPanel({ seller, onClose, onOpenChat }: SellerDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'gigs' | 'workHistory' | 'reviews'>('overview');

  if (!seller) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-[#FDFDFD] dark:bg-[#080808] px-4 py-6">
        <span className="text-muted text-[13px]">Select a seller profile to view full details</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 bg-[#FDFDFD] dark:bg-[#080808] px-6 py-6 overflow-y-auto no-scrollbar">
      {/* Back button (Mobile view) */}
      <button onClick={onClose} className="flex items-center gap-2 text-muted hover:text-foreground transition-colors self-start lg:hidden">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M6.921 12.5L12.714 18.292L12 19L5 12L12 5L12.714 5.708L6.92 11.5H19V12.5H6.921Z" fill="currentColor"/>
        </svg>
        <span className="text-[13px] font-medium">Back to seller list</span>
      </button>

      {/* Top Banner Profile Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <SellerAvatar src={seller.avatar} name={seller.name} className="w-16 h-16" textClassName="text-[18px]" />
              {seller.isOnline && (
                <span className="absolute bottom-0 right-0 size-4 rounded-full bg-emerald-500 border-2 border-background" />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-bold text-foreground">{seller.name}</h2>
                <VerifiedBadge />
              </div>
              <p className="text-[12px] text-muted">{seller.username} • {seller.location}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-[#8C5CFF] text-white">
                  {seller.level}
                </span>
                <span className="text-[11px] text-[#FF9529] font-semibold flex items-center gap-1">
                  {seller.rating > 0 ? (
                    <><StarRating filled={seller.rating} /> {seller.rating.toFixed(1)} ({seller.reviewsCount} {seller.reviewsCount === 1 ? 'review' : 'reviews'})</>
                  ) : (
                    <span className="text-muted font-medium">No reviews yet</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end bg-[#8C5CFF]/10 p-3 rounded-xl border border-[#8C5CFF]/20">
            <span className="text-[11px] font-medium text-muted">Min. Project Budget</span>
            <span className="text-[18px] font-extrabold text-[#8C5CFF]">{seller.minProjectBudget}</span>
            <span className="text-[10px] text-muted font-normal mt-0.5">Fixed Project Contracts Only</span>
          </div>
        </div>

        <p className="text-[14px] font-semibold text-foreground/90 leading-6 mt-1">
          {seller.title}
        </p>
      </div>

      <Divider />

      {/* Navigation Tabs across profile overview */}
      <div className="flex items-center gap-6 border-b border-border/50">
        {(['overview', 'gigs', 'workHistory', 'reviews'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-[13px] font-medium capitalize transition-colors relative cursor-pointer ${
              activeTab === tab ? 'text-[#8C5CFF] font-semibold' : 'text-muted hover:text-foreground'
            }`}
          >
            {tab === 'workHistory' ? 'Work History' : tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#8C5CFF] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          {/* Key Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <StatRow icon={<DollarSign size={18} />} value={seller.minProjectBudget} label="Min. Project Budget" />
            <StatRow icon={<Wallet size={18} />} value={seller.totalEarnings} label="Total Earnings" />
            <StatRow icon={<Briefcase size={18} />} value={`${seller.completedJobs}`} label="Completed Jobs" />
            <StatRow icon={<CheckCircle2 size={18} className="text-emerald-500" />} value={seller.jobSuccess} label="Job Success Rate" />
          </div>

          <Divider />

          {/* Verifications & Languages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-card border border-border/40">
              <h4 className="text-[13px] font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#8C5CFF]" /> Verifications
              </h4>
              <div className="flex flex-col gap-2">
                {seller.verifications.map((v) => (
                  <div key={v} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 p-4 rounded-xl bg-card border border-border/40">
              <h4 className="text-[13px] font-semibold text-foreground flex items-center gap-2">
                <Globe size={16} className="text-[#8C5CFF]" /> Languages & Proficiency
              </h4>
              <div className="flex flex-col gap-3">
                {seller.languages.map((lang) => (
                  <div key={lang.name} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="font-medium text-foreground">{lang.name}</span>
                      <span className="text-muted text-[11px]">{lang.level}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                      <div className="h-full bg-[#8C5CFF] rounded-full" style={{ width: `${lang.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Divider />

          {/* About Seller Bio */}
          <div className="flex flex-col gap-2">
            <h3 className="text-[14px] font-semibold text-foreground">About the Seller</h3>
            <p className="text-[13px] text-muted-foreground leading-6 whitespace-pre-line">
              {seller.bio}
            </p>
          </div>

          <Divider />

          {/* Skills & Expertise */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[14px] font-semibold text-foreground">Skills & Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {seller.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-lg bg-[#8C5CFF]/10 text-[#8C5CFF] text-[12px] font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gigs' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-[14px] font-semibold text-foreground">Active Services & Gigs ({seller.gigs.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {seller.gigs.map((gig) => (
              <div
                key={gig.id}
                className="flex flex-col rounded-xl border border-border/50 overflow-hidden bg-card hover:border-[#8C5CFF]/50 transition-colors"
              >
                <img src={gig.image} alt={gig.title} className="w-full h-36 object-cover" />
                <div className="p-3.5 flex flex-col gap-2 flex-1">
                  <p className="text-[12px] font-medium text-foreground line-clamp-2 leading-5">
                    {gig.title}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-auto">
                    <span className="text-[12px] font-bold text-[#8C5CFF]">{gig.price}</span>
                    <span className="text-[10px] text-muted flex items-center gap-1">
                      <StarRating filled={gig.rating} /> {gig.rating} ({gig.reviews})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'workHistory' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-[14px] font-semibold text-foreground">Work History ({seller.workHistory.length})</h3>
          <div className="flex flex-col gap-3">
            {seller.workHistory.map((wh) => (
              <div key={wh.id} className="flex flex-col gap-2 p-4 rounded-xl bg-card border border-border/40">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[13px] font-semibold text-foreground leading-snug">{wh.title}</span>
                  <span className="text-[12px] font-bold text-[#8C5CFF] shrink-0">{wh.amount}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted pt-1">
                  <span>{wh.date} • Fixed-Price Contract</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium">
                    Escrow Released
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground italic mt-1 bg-background/50 p-2 rounded-lg border border-border/30">
                  "{wh.feedback}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-[14px] font-semibold text-foreground">Client Reviews ({seller.reviews.length})</h3>
          <div className="flex flex-col gap-4">
            {seller.reviews.map((rev) => (
              <div key={rev.id} className="flex flex-col gap-2 p-4 rounded-xl bg-card border border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <SellerAvatar src={rev.reviewerAvatar} name={rev.reviewerName} className="w-8 h-8" textClassName="text-[11px]" />
                    <span className="text-[13px] font-semibold text-foreground">{rev.reviewerName}</span>
                  </div>
                  <span className="text-[10px] text-muted">{rev.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <StarRating filled={rev.rating} />
                </div>
                <p className="text-[12px] text-muted-foreground leading-5 mt-1">{rev.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Divider />

      {/* Primary Action Buttons */}
      <div className="flex items-center gap-3 pt-2 pb-6">
        <button
          type="button"
          onClick={() => alert(`Direct hire offer sent to ${seller.name}`)}
          className="flex-1 py-3 px-4 rounded-xl bg-[#8C5CFF] hover:bg-[#8C5CFF]/90 text-white font-semibold text-[13px] transition-all shadow-md text-center cursor-pointer"
        >
          Hire Seller
        </button>
        <button
          type="button"
          onClick={() => alert(`Opening chat with ${seller.name}`)}
          className="py-3 px-5 rounded-xl border border-[#8C5CFF]/40 text-[#8C5CFF] hover:bg-[#8C5CFF]/10 font-semibold text-[13px] transition-all text-center cursor-pointer"
        >
          Contact Seller
        </button>
      </div>

    </div>
  );
}

// ─── Main Find Seller Page Component ──────────────────────────────────────────

interface FindSellerPageProps {
  onBack?: () => void;
  onMobileViewChange?: (view: "list" | "detail") => void;
  onOpenChat?: (user: { id: string; name: string; username?: string; avatarUrl?: string }) => void;
}

export default function FindSellerPage({ onBack, onMobileViewChange, onOpenChat }: FindSellerPageProps) {
  const [sellersList, setSellersList] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [savedSellerIds, setSavedSellerIds] = useState<Record<number | string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    async function fetchRealSellers() {
      try {
        let res = await fetch('/api/users/sellers');
        if (!res.ok) {
          res = await fetch('/api/users/sellers');
        }
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.sellers) && data.sellers.length > 0) {
            if (isMounted) {
              const realSellers: Seller[] = data.sellers;
              setSellersList(realSellers);
              setSelectedSeller(realSellers[0] || null);
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch registered sellers:', e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchRealSellers();
    return () => { isMounted = false; };
  }, []);

  const handleToggleSaveSeller = (id: number | string) => {
    setSavedSellerIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectSeller = (seller: Seller) => {
    setSelectedSeller(seller);
    setMobileView("detail");
    if (onMobileViewChange) {
      onMobileViewChange("detail");
    }
  };

  const handleCloseDetail = () => {
    setMobileView("list");
    if (onMobileViewChange) {
      onMobileViewChange("list");
    }
  };

  if (loading) return <FindJobPageSkeleton />;

  return (
    <div className="min-h-full w-full bg-background flex flex-col">
      {/* 100% Viewport Split Pane */}
      <div className="flex flex-1 min-h-[calc(100vh-70px)] w-full max-w-[1400px] mx-auto">
        {/* Left: Seller List */}
        <div
          className={`flex-col w-full lg:w-[380px] lg:flex-shrink-0 h-auto overflow-y-auto no-scrollbar border-r border-[#D8D8D8] dark:border-[#121212] ${
            mobileView === "detail" ? "hidden lg:flex" : "flex"
          }`}
        >
          <SellerListPanel
            onBack={onBack}
            selectedSellerId={selectedSeller?.id || 0}
            onSelectSeller={handleSelectSeller}
            savedSellerIds={savedSellerIds}
            onToggleSaveSeller={handleToggleSaveSeller}
            sellersList={sellersList}
          />
        </div>

        {/* Right: Seller Details */}
        <div
          className={`flex-col flex-1 min-w-0 h-auto overflow-y-auto no-scrollbar ${
            mobileView === "list" ? "hidden lg:flex" : "flex"
          }`}
        >
          <SellerDetailPanel seller={selectedSeller} onClose={handleCloseDetail} onOpenChat={onOpenChat} />
        </div>
      </div>

      {/* Single Full-Width Footer */}
      <div className="hidden md:block w-full mt-[24px] shrink-0 border-t border-[#D8D8D8] dark:border-[#121212]">
        <Footer />
      </div>
    </div>
  );
}
