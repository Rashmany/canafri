'use client';

import React, { useState, useEffect, useRef, useCallback, JSX } from "react";
import {
  Sparkle,
  MessageSquare,
  Heart,
  Bookmark,
  Share2,
  MoreHorizontal,
  Check,
  Copy,
  ThumbsDown,
  VolumeX,
  Ban,
} from "lucide-react";
import { Post, PostCard } from "@/components/post-card";

/* ─── useInView hook ───────────────────────────────────────────── */
function useInView(options: IntersectionObserverInit = {}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const cb: IntersectionObserverCallback = useCallback(([entry]) => {
    if (entry.isIntersecting) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(cb, { threshold: 0.08, rootMargin: '0px 0px -50px 0px', ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, [cb]);

  return { ref, isVisible };
}

/* ─── Reveal wrapper component ─────────────────────────────────── */
interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  fade?: boolean;
}
function Reveal({ children, className = '', delay = 0, fade = false }: RevealProps) {
  const { ref, isVisible } = useInView();
  const base = fade ? 'reveal-fade' : 'reveal';
  const delayClass = [0, 75, 150, 225, 300, 375].includes(delay) ? `delay-${delay}` : '';
  const inlineStyle = delay && !delayClass ? { animationDelay: `${delay}ms` } : undefined;
  return (
    <div
      ref={ref}
      style={inlineStyle}
      className={`${base} ${delayClass}${isVisible ? ' is-visible' : ''}${className ? ' ' + className : ''}`}
    >
      {children}
    </div>
  );
}

const navigationItems = [
  { label: "Features", href: "#what-we-offer" },
  { label: "Articles", href: "#articles" },
  { label: "Find Talent", href: "#freelancers" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "About", href: "/about" },
];

const handleAction = (action: string) => {
  if (typeof window !== "undefined") {
    const slug = action.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const target = document.getElementById(slug);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  }
};

interface Creator {
  id: number;
  name: string;
  role: string;
  image: string;
  alt: string;
  smallPosition: string;
}

const creators: Creator[] = [
  {
    id: 1,
    name: "Slide 1",
    role: "Freelance UI/UX & Content Creator",
    image: "/hero-illustrator.png",
    alt: "Freelancer using a smartphone",
    smallPosition: "object-[center_18%]",
  },
  {
    id: 2,
    name: "Slide 2",
    role: "Web3 Consultant & Developer",
    image: "/hero-illustrator4.png",
    alt: "Web3 consultant and developer",
    smallPosition: "object-[center_12%]",
  },
  {
    id: 3,
    name: "Slide 3",
    role: "Smart Contract Auditor & Strategist",
    image: "/hero-illustrator.png",
    alt: "Smart contract auditor and creator",
    smallPosition: "object-[center_15%]",
  },
];

const walletPartners = [
  {
    name: "Loop Wallet.",
    image: "/feature-logo/loop.png",
    alt: "Download",
  },
  {
    name: "Zoro Wallet",
    image: "/feature-logo/zoro.png",
    alt: "Images",
  },
  {
    name: "Canton Wallet",
    image: "/feature-logo/canton.png",
    alt: "Download",
  },
  {
    name: "Send Wallet",
    image: "/feature-logo/send.png",
    alt: "Images",
  },
  {
    name: "Cantor8",
    image: "/feature-logo/cantor8.png",
    alt: "Images",
  },
  {
    name: "Cantex Wallet",
    image: "/feature-logo/cantex.png",
    alt: "Images",
  },
];

type IntegrationItem = {
  name: string;
  image: string;
  imageClassName: string;
  alt: string;
};

const integrationColumns: IntegrationItem[][] = [
  [
    {
      name: "Canton",
      image: "/feature-logo/canton.png",
      imageClassName: "relative w-[43px] h-[43px] aspect-square object-contain",
      alt: "Canton",
    },
    {
      name: "Cantor8",
      image: "/feature-logo/cantor8.png",
      imageClassName: "relative w-[53px] h-[53px] aspect-square object-contain",
      alt: "Cantor8",
    },
  ],
  [
    {
      name: "usdcx",
      image: "/feature-logo/send.png",
      imageClassName: "relative w-12 h-12 aspect-square object-contain",
      alt: "usdcx",
    },
    {
      name: "Zoro",
      image: "/feature-logo/zoro.png",
      imageClassName: "relative w-[43px] h-[43px] aspect-square object-contain",
      alt: "Zoro",
    },
    {
      name: "LOOP",
      image: "/feature-logo/loop.png",
      imageClassName: "relative w-[60px] h-[53px] aspect-[1.13] object-contain",
      alt: "LOOP",
    },
  ],
  [
    {
      name: "Console",
      image: "/feature-logo/console.png",
      imageClassName: "relative w-10 h-10 aspect-square object-contain",
      alt: "Console",
    },
    {
      name: "Cantex",
      image: "/feature-logo/cantex.png",
      imageClassName: "relative w-[63px] h-[63px] aspect-square object-contain",
      alt: "Cantex",
    },
  ],
];

const creatorBenefits = [
  {
    text: "Stake 300 CC to become a verified creator",
  },
  {
    text: "Earn recurring revenue share from the reader pool",
  },
  {
    text: "Gain full publishing rights and custom article paywalls",
  },
  {
    text: "Withdraw your earnings directly to your wallet anytime",
  },
];



const freelancerCategories = [
  "All",
  "IT & tech",
  "Video & Animation",
  "Music & Audio",
  "Bussiness",
  "Writing & Translation",
  "AI Services",
  "Graphics & Design",
  "Digital Marketing",
  "Youtube Automation",
];

// Deterministic avatar colour — hashes the freelancer's name so the same
// person always gets the same colour, and any new user from the API gets
// one automatically with no manual configuration needed.
const AVATAR_PALETTE: { bg: string; ring: string; text: string }[] = [
  { bg: "#320053", ring: "rgba(126,64,255,0.25)", text: "#fff" },
  { bg: "#0d4a6d", ring: "rgba(56,189,248,0.25)", text: "#fff" },
  { bg: "#1a3d2e", ring: "rgba(16,185,129,0.25)", text: "#fff" },
  { bg: "#5a2200", ring: "rgba(249,115,22,0.25)", text: "#fff" },
  { bg: "#3b1a6e", ring: "rgba(167,139,250,0.25)", text: "#fff" },
  { bg: "#1a1a4a", ring: "rgba(99,102,241,0.25)", text: "#fff" },
  { bg: "#4a1942", ring: "rgba(236,72,153,0.25)", text: "#fff" },
  { bg: "#1f3a1f", ring: "rgba(34,197,94,0.25)", text: "#fff" },
];

function getAvatarStyle(seed: string) {
  // Simple djb2-style hash — fast, consistent, no deps
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

const experts = [
  { id: 1, rating: "4.9", reviews: 11, role: "Full-Stack Web3 & dApp Frontend Lead", name: "John Trek", rate: "250 CC/Min", bio: "Former financial ledger auditor with 6+ years designing privacy-compliant multi-party smart contract templates on Canton Network." },
  { id: 2, rating: "4.9", reviews: 14, role: "Smart Contract & Escrow Architect", name: "Sarah Lin", rate: "300 CC/Min", bio: "Protocol engineer specializing in milestone-based CC escrow flows and cross-chain settlement integrations." },
  { id: 3, rating: "5.0", reviews: 19, role: "UI/UX & Design Systems Lead", name: "Alex Rivera", rate: "200 CC/Min", bio: "Crafting modern dApp user experiences with high-converting web3 workflows and crisp motion architecture." },
  { id: 4, rating: "4.8", reviews: 8, role: "Tokenomics & Protocol Strategist", name: "David Kim", rate: "280 CC/Min", bio: "Advising creators and DAOs on sustainable Canton token staking, reader pool dynamics, and governance." },
];

/* ─────────────────────────────────────────────
   ECOSYSTEM TRUST METRICS BAR
───────────────────────────────────────────── */
export const EcosystemMetricsBar = () => {
  return (
    <section className="relative z-10 w-full bg-[#0d091a] border-y border-white/[0.08] py-8 sm:py-10">
      <div className="mx-auto max-w-[117.25rem] px-6 sm:px-10 lg:px-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
          <div className="flex flex-col items-center text-center p-2">
            <span className="font-outfit text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              $0
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#8C5CFF] uppercase tracking-wider mt-1">
              Upfront Cost
            </span>
            <p className="text-xs text-[#8f9bb3] mt-1 max-w-[200px]">
              Free to register, explore, publish, and post projects
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-2 pt-6 md:pt-2">
            <span className="font-outfit text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              100%
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#8C5CFF] uppercase tracking-wider mt-1">
              Smart Contract Escrow
            </span>
            <p className="text-xs text-[#8f9bb3] mt-1 max-w-[200px]">
              Funds locked in Canton escrow before work begins
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-2 pt-6 md:pt-2">
            <span className="font-outfit text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              &lt; 1s
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#8C5CFF] uppercase tracking-wider mt-1">
              Settlement Finality
            </span>
            <p className="text-xs text-[#8f9bb3] mt-1 max-w-[200px]">
              Sub-second payout directly to your Canton wallet
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-2 pt-6 md:pt-2">
            <span className="font-outfit text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              0%
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#8C5CFF] uppercase tracking-wider mt-1">
              Dispute Loss Risk
            </span>
            <p className="text-xs text-[#8f9bb3] mt-1 max-w-[200px]">
              Protected by on-chain milestone approval &amp; resolution
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────
   CANAFRI CONTENT CARDS (EXACT COPY FROM CONTENT PAGE)
───────────────────────────────────────────── */

// Post and PostCard are imported from @/components/post-card

const contentFeedPosts: Post[] = [
  {
    id: "post-1",
    name: "John Trek",
    handle: "@johntrek",
    avatarSrc: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80",
    date: "May 10",
    topic: "CantonNetwork",
    text: "Traditional freelancing platforms hold your earnings for up to 14 days and charge hidden conversion fees. On Canton Network, smart contracts lock client funds upfront. The instant a milestone is marked approved, finality occurs in under one second.",
    likesCount: 142,
    commentsCount: 28,
  },
  {
    id: "post-2",
    name: "Sarah Lin",
    handle: "@sarahlin",
    avatarSrc: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80",
    date: "3h ago",
    topic: "SmartContracts",
    text: "Daml contracts allow us to write multi-party agreements where neither the client nor the freelancer can alter terms unilaterally. Here is how CanaFri ensures zero unauthorized clawbacks while maintaining sub-transaction privacy.",
    likesCount: 98,
    commentsCount: 14,
  },
  {
    id: "post-3",
    name: "Alex Rivera",
    handle: "@alexrivera",
    avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80",
    date: "Yesterday",
    topic: "CreatorEconomy",
    text: "Why We Replaced Paywalls with Token Staking for Technical Content. Staking allows loyal readers to lock Canton Coin in a creator pool—earning yield while gaining full access to tutorials and advisory sessions. True win-win monetization.",
    likesCount: 236,
    commentsCount: 45,
  },
];

// ─── Interactive Card Container for Landing Page ──────────────────────────────────

function InteractivePostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <div className="w-full max-w-[420px]">
      <PostCard
        post={post}
        liked={liked}
        bookmarked={bookmarked}
        onLikeToggle={() => setLiked((prev) => !prev)}
        onBookmarkToggle={() => setBookmarked((prev) => !prev)}
        onClick={() => handleAction("Sign Up")}
      />
    </div>
  );
}

export const TrendingArticlesSection = () => {
  return (
    <section
      id="articles"
      className="w-full bg-[#09090b] py-14 sm:py-16 lg:py-20 scroll-mt-20 border-t border-white/5 relative overflow-hidden"
      aria-labelledby="articles-heading"
    >
      <div className="mx-auto flex w-full max-w-[117.25rem] flex-col items-center gap-8 sm:gap-10 lg:gap-12 px-6 sm:px-10 lg:px-16">
        <Reveal>
          <header className="flex flex-col items-center text-center max-w-[800px] mx-auto">
            <h2
              id="articles-heading"
              className="font-outfit font-extrabold text-white text-3xl sm:text-4xl lg:text-[44px] tracking-tight leading-tight"
            >
              Explore Trending Creator Content
            </h2>
          </header>
        </Reveal>

        {/* Exact CanaFri Content Feed Cards Grid (Verbatim from Content Page) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 w-full max-w-[1440px] justify-items-center">
          {contentFeedPosts.map((post, idx) => (
            <Reveal key={post.id} delay={idx * 100} className="w-full flex justify-center">
              <InteractivePostCard post={post} />
            </Reveal>
          ))}
        </div>

        {/* Bottom CTA Row */}
        <Reveal delay={150}>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => handleAction("Sign Up")}
              className="all-unset box-border flex items-center justify-center gap-2 px-7 py-3.5 bg-[var(--primary)] rounded-lg shadow-[0_0.25rem_1rem_var(--primary-glow)] cursor-pointer hover:bg-[var(--primary-hover)] transition-all text-white font-sans font-semibold text-sm group"
            >
              <span>Start Publishing &amp; Earn</span>
              <svg
                className="w-4 h-4 text-white transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleAction("Find Talent")}
              className="all-unset box-border flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border border-[#8C5CFF]/35 hover:border-[#8C5CFF]/70 bg-[#8C5CFF]/[0.06] hover:bg-[#8C5CFF]/[0.12] text-white/90 hover:text-white transition-all cursor-pointer text-sm font-semibold font-sans shadow-[0_2px_12px_rgba(140,92,255,0.08)]"
            >
              Browse Marketplace
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────
   WHY CHOOSE CANAFRI? — data & sub-components
   (original design component preserved verbatim;
   asset paths point to /public — replace with
   real exports when available)
───────────────────────────────────────────── */


function WhyCanafriSection() {
  const [activeTab, setActiveTab] = useState<"canafri" | "canton">("canafri");

  const canafriCards = [
    {
      id: "canafri-0",
      title: "100% Escrow Protection",
      description:
        "Smart contracts lock client funds before work begins. Milestones release only upon your verified approval.",
      badgeBg: "bg-[#edf5ff]",
      icon: "/icons/canafri-escrow-protection.png",
    },
    {
      id: "canafri-1",
      title: "Creator Economy 2.0",
      description:
        "Publish premium knowledge and earn recurring Canton Coin from every reader directly into your wallet.",
      badgeBg: "bg-[#f5efff]",
      icon: "/icons/canafri-creator-economy.png",
    },
    {
      id: "canafri-2",
      title: "Low Fee, High Speed",
      description:
        "Sub-second transaction finality with near-zero gas overhead. Say goodbye to international wire fees.",
      badgeBg: "bg-[#fff8ed]",
      icon: "/icons/canafri-low-fee-speed.png",
    },
    {
      id: "canafri-3",
      title: "Built on Canton Network",
      description:
        "Enterprise-grade privacy, horizontal scalability, and regulatory compliance built at the protocol level.",
      badgeBg: "bg-[#f0fdf4]",
      icon: "/icons/canafri-canton-network.png",
    },
  ];

  const cantonCards = [
    {
      id: "canton-0",
      title: "Private by Design",
      description:
        "Transaction details are shared strictly between transacting parties. Zero public ledger data leaks.",
      badgeBg: "bg-[#edf5ff]",
      icon: "/icons/canton-private-design.png",
    },
    {
      id: "canton-1",
      title: "Fast & Atomic Settlement",
      description:
        "Payment and contract actions settle together with deterministic finality, eliminating counterparty risk.",
      badgeBg: "bg-[#f5efff]",
      icon: "/icons/canton-atomic-settlement.png",
    },
    {
      id: "canton-2",
      title: "Secure Daml Workflows",
      description:
        "CanaFri uses Daml smart contracts to encode authorization, privacy, and business rules at the protocol level.",
      badgeBg: "bg-[#fff8ed]",
      icon: "/icons/canton-daml-workflows.png",
    },
    {
      id: "canton-3",
      title: "Powered by Canton",
      description:
        "A composable, privacy-enabled network engineered specifically for enterprise financial workflows and institutional trust.",
      badgeBg: "bg-[#f0fdf4]",
      icon: "/icons/canton-powered-canton.png",
    },
  ];

  const currentCards = activeTab === "canafri" ? canafriCards : cantonCards;

  return (
    <section className="w-full bg-[#f6f6f8] py-10 sm:py-12 lg:py-16" aria-labelledby="why-canafri-heading">
      <div className="mx-auto flex w-full max-w-[117.25rem] flex-col items-center gap-8 sm:gap-10 lg:gap-12 px-6 sm:px-10 lg:px-16">
        
        {/* Section Header & Interactive Pill Switcher */}
        <div className="flex flex-col items-center gap-6 w-full">
          <Reveal className="flex flex-col items-center gap-3 text-center max-w-[840px]">
            <h2
              id="why-canafri-heading"
              className="font-outfit font-extrabold text-[#292828] text-2xl sm:text-3xl lg:text-4xl text-center tracking-tight"
            >
              {activeTab === "canafri"
                ? "Built for the Future of Work and Knowledge"
                : "Built for private, reliable transactions."}
            </h2>
            <p className="text-[#5D5D7F] text-sm sm:text-base leading-relaxed text-center max-w-[620px]">
              {activeTab === "canafri"
                ? "Earn from your skills, collaborate with enterprise-grade escrow, and withdraw directly to your wallet."
                : "CanaFri uses Canton to deliver private, secure, and reliable settlement for every transaction across creators, freelancers, and clients."}
            </p>
          </Reveal>

          {/* Sleek Pill Toggle */}
          <Reveal delay={75}>
            <div
              role="tablist"
              aria-label="Why Canafri features toggle"
              className="inline-flex p-1.5 rounded-full bg-[#291d46]/10 border border-black/5 backdrop-blur-sm"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "canafri"}
                onClick={() => setActiveTab("canafri")}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === "canafri"
                    ? "bg-[#320053] text-white shadow-md shadow-[#320053]/25"
                    : "text-[#5D5D7F] hover:text-[#030303]"
                }`}
              >
                Why Choose CanaFri
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "canton"}
                onClick={() => setActiveTab("canton")}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === "canton"
                    ? "bg-[#320053] text-white shadow-md shadow-[#320053]/25"
                    : "text-[#5D5D7F] hover:text-[#030303]"
                }`}
              >
                Why Canton Network
              </button>
            </div>
          </Reveal>
        </div>

        {/* Reference Cards Row (Matching Screenshot Layout) */}
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 w-full">
            {currentCards.map((card) => (
              <article
                key={card.id}
                className="group relative flex flex-col items-center justify-start py-5 px-4 sm:py-6 sm:px-5 rounded-2xl sm:rounded-3xl bg-white border border-black/8 hover:border-[#320053] shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(50,0,83,0.3)] hover:-translate-y-1.5 transition-all duration-300 text-center select-none cursor-pointer overflow-hidden"
              >
                {/* Gentle bottom-to-top primary fill on hover */}
                <div
                  className="absolute inset-0 bg-[#320053] translate-y-[calc(100%+8px)] group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none rounded-[inherit]"
                  aria-hidden="true"
                />

                {/* Centered Circular Icon Image */}
                <div
                  className={`relative z-10 flex items-center justify-center size-16 sm:size-18 rounded-full ${card.badgeBg} group-hover:bg-white group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] transition-all duration-300 group-hover:scale-105 mb-2 shrink-0 shadow-inner`}
                >
                  <img
                    src={card.icon}
                    alt={card.title}
                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                  />
                </div>

                {/* Title */}
                <h3 className="relative z-10 font-outfit font-bold text-[#030303] group-hover:text-white text-base sm:text-lg leading-snug mt-1.5 transition-colors duration-300">
                  {card.title}
                </h3>

                {/* Description */}
                <p className="relative z-10 font-sans text-xs sm:text-[13px] text-[#5D5D7F] group-hover:text-white/90 leading-relaxed mt-1.5 max-w-[260px] transition-colors duration-300">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   WHAT PEOPLE SAY (Testimonials Section)
   Glassmorphism 3-card layout with ambient gradient,
   background grid lines, and featured highlight card.
───────────────────────────────────────────── */
const horizontalLines = Array.from({ length: 6 });
const verticalLines = Array.from({ length: 12 });

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Freelance Smart Contract Developer",
    quote:
      "Milestone escrow gives me total peace of mind. The moment a client approves my deliverables, payment lands immediately in my Canton wallet with zero clearance delays.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    featured: false,
  },
  {
    name: "David Patel",
    role: "Web3 Technical Writer & Creator",
    quote:
      "Publishing on CanaFri replaced traditional paywalls. Creator staking unlocked direct subscriber revenue, and readers reward quality insights with Canton Coin.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    featured: true,
  },
  {
    name: "Emily Carter",
    role: "Ecosystem Founder & Hiring Lead",
    quote:
      "Hiring verified talent with smart contract protection eliminated payment disputes completely. We scope milestones and scale our decentralized team with full confidence.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    featured: false,
  },
];

export const TestimonialsSection = () => {
  return (
    <section
      id="testimonials"
      className="relative flex flex-col items-center justify-center overflow-hidden bg-[linear-gradient(180deg,rgba(50,0,83,1)_0%,rgba(0,5,24,1)_100%)] py-10 sm:py-12 lg:py-16 scroll-mt-20"
      aria-labelledby="testimonials-heading"
    >
      <div
        className="absolute left-[200px] top-[-100px] h-[400px] w-[400px] rounded-[200px] bg-[#8080d715] blur-[75px]"
        aria-hidden="true"
      />
      <div
        className="absolute left-[840px] top-[50px] h-[400px] w-[500px] rounded-[250px/200px] bg-[#aad9d910] blur-[90px]"
        aria-hidden="true"
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 flex h-80 w-[1440px] max-w-full flex-col items-start justify-between pointer-events-none opacity-40"
        aria-hidden="true"
      >
        {horizontalLines.map((_, index) => (
          <div
            key={`horizontal-line-${index}`}
            className="relative h-px w-full self-stretch bg-gradient-to-r from-transparent via-white/15 to-transparent"
          />
        ))}
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 flex h-80 w-[1440px] max-w-full items-start justify-between pointer-events-none opacity-40"
        aria-hidden="true"
      >
        {verticalLines.map((_, index) => (
          <div
            key={`vertical-line-${index}`}
            className={`relative h-80 w-px bg-gradient-to-b from-white/15 via-white/5 to-transparent ${index === verticalLines.length - 1 ? "mr-[-1.00px]" : ""
              }`}
          />
        ))}
      </div>

      {/* Main max-width frame */}
      <div className="relative z-10 mx-auto flex w-full max-w-[117.25rem] flex-col items-center gap-8 sm:gap-10 px-6 sm:px-10 lg:px-16">
        <Reveal>
          <header className="flex flex-col items-center gap-3 text-center max-w-[700px] mx-auto">
            <h2
              id="testimonials-heading"
              className="font-outfit text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white"
            >
              Trusted by creators, freelancers, and teams
            </h2>
            <p className="font-sans text-base font-normal leading-relaxed text-[#a1b5d8]">
              Real stories from professionals earning, publishing, and building with guaranteed on-chain payouts.
            </p>
          </header>
        </Reveal>

        {/* Testimonials cards — slightly increased size, 3-column responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-7 w-full max-w-[1180px] mx-auto">
          {testimonials.map((testimonial, idx) => (
            <Reveal
              key={testimonial.name}
              delay={idx * 100}
              className="flex w-full"
            >
              <article
                className="group relative flex flex-col justify-between w-full min-h-[220px] sm:min-h-[235px] gap-5 rounded-2xl border border-transparent bg-white/[0.05] p-6 sm:p-7 shadow-[0_8px_28px_rgba(0,0,0,0.14)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/[0.08] hover:shadow-[0_18px_40px_rgba(128,128,215,0.18)] cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="relative size-14 shrink-0 rounded-full border-2 border-white/20 bg-cover bg-center transition-transform duration-300 group-hover:scale-105 group-hover:border-[#8080d7]"
                    style={{ backgroundImage: `url(${testimonial.avatar})` }}
                    aria-hidden="true"
                  />
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-outfit text-lg sm:text-xl font-bold text-white truncate">
                      {testimonial.name}
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-[#a1b5d8] truncate transition-colors group-hover:text-white">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className="font-sans text-sm sm:text-[15px] text-[#9bb0d3] leading-relaxed transition-colors group-hover:text-[#c4d6f2]">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Center bottom Sign Up button */}
        <Reveal delay={150} className="flex items-center justify-center w-full mt-2 sm:mt-4">
          <button
            type="button"
            id="testimonials-signup-cta"
            onClick={() => handleAction("Sign Up")}
            className="box-border relative flex h-11 px-8 items-center justify-center rounded-xl bg-white hover:bg-white/90 text-[#121212] font-semibold text-sm transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Sign up for Canafri"
          >
            Sign Up
          </button>
        </Reveal>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────
   FAQ SECTION
───────────────────────────────────────────── */
const faqItems = [
  {
    id: "faq-what-is-canafri",
    title: "What is Canafri?",
    description:
      "Canafri is an online marketplace built for creators and freelancers. You can post projects, hire skilled talent, share your work, and get paid securely. Every payment is protected so you always have full control of the money you earn.",
  },
  {
    id: "faq-content-creator",
    title: "How does earning work for content creators?",
    description:
      "As a creator, you earn money whenever people read or engage with your articles and tutorials. You set your own terms, keep what you earn, and withdraw your funds straight to your connected wallet whenever you like.",
  },
  {
    id: "faq-freelancer",
    title: "How do freelancers get paid?",
    description:
      "When a client hires you for a project, the agreed payment is held safely in escrow before you begin work. Once you complete each milestone and the client approves it, your funds are released to your wallet immediately.",
  },
  {
    id: "faq-wallet",
    title: "How do I connect my Canton Wallet?",
    description:
      "Once you log in, go to your account settings and choose Connect Wallet. Confirm the prompt to link your wallet, and all your future earnings will transfer directly to that address.",
  },
  {
    id: "faq-stake",
    title: "What is Canton Coin and how does staking work?",
    description:
      "Canton Coin is the currency used for payments across Canafri. Staking simply means reserving coins in your account to earn extra bonuses, get higher profile visibility, and unlock priority project opportunities. You can stake or unstake anytime from your dashboard.",
  },
];

export const FAQSection = () => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <section
      id="faq"
      className="relative w-full py-10 sm:py-12 lg:py-16 bg-[#f6f6f8] overflow-hidden scroll-mt-20"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto flex w-full max-w-[117.25rem] flex-col items-center gap-8 px-6 sm:px-10 lg:px-16">
        {/* Header row */}
        <Reveal className="w-full flex items-center justify-center">
          <div className="flex w-full items-center justify-center mb-2">
            <h2
              id="faq-heading"
              className="font-outfit text-3xl sm:text-4xl lg:text-[44px] font-bold leading-tight tracking-[-0.84px] text-[#030303] text-center"
            >
              FAQ
            </h2>
          </div>
        </Reveal>

        {/* Accordion items */}
        <div className="flex flex-col gap-4 sm:gap-5 w-full">
          {faqItems.map((item, idx) => {
            const isExpanded = expandedId === item.id;
            return (
              <Reveal key={item.id} delay={Math.min(idx, 4) * 75} className="w-full">
                <div
                  className={`relative flex flex-col w-full rounded-2xl transition-all duration-300 border ${
                    isExpanded
                      ? "bg-[#320053] border-[#320053] shadow-[0_8px_24px_rgba(50,0,83,0.25)]"
                      : "bg-[#f1f1f4] border-transparent hover:border-black/5"
                  }`}
                >
                  {/* Title button */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-6 sm:px-[30px] py-5 text-left cursor-pointer group rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#320053]"
                    aria-label={isExpanded ? `Collapse ${item.title}` : `Expand ${item.title}`}
                    aria-expanded={isExpanded}
                    aria-controls={`${item.id}-content`}
                    onClick={() => toggle(item.id)}
                  >
                    <h3
                      id={`${item.id}-label`}
                      className={`font-outfit font-bold text-lg sm:text-xl tracking-[0] leading-snug pr-4 transition-colors duration-200 ${
                        isExpanded ? "text-white" : "text-[#030303] group-hover:text-[#320053]"
                      }`}
                    >
                      {item.title}
                    </h3>
                    <div
                      className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                        isExpanded
                          ? "bg-white/20 text-white"
                          : "bg-black/[0.04] text-[#5d5d7f] group-hover:bg-[#320053]/10 group-hover:text-[#320053]"
                      }`}
                    >
                      {/* Plus / Minus icon — rotates to × when open */}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                        className="transition-transform duration-300 ease-out"
                        style={{ transform: isExpanded ? "rotate(45deg)" : "rotate(0deg)" }}
                      >
                        <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </button>

                  {/* Expandable animated content using CSS grid 0fr -> 1fr */}
                  <div
                    id={`${item.id}-content`}
                    role="region"
                    aria-labelledby={`${item.id}-label`}
                    className={`grid transition-all duration-300 ease-in-out ${
                      isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-6 sm:px-[30px] pb-6 pt-1">
                        <p className={`font-sans font-normal text-sm sm:text-base leading-[24px] tracking-[0] transition-colors duration-200 ${
                          isExpanded ? "text-white/95" : "text-[#5d5d7f]"
                        }`}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────
   CTA / GET STARTED SECTION
───────────────────────────────────────────── */
export const CTASection = () => {
  // To replace placeholders, set your image URLs here:
  const bannerPhotoSrc: string | null = "/banner/banner1-pic.jpg";
  const logoPhotoSrc: string | null = "/app-logo/canafri-logo.svg";

  return (
    <div className="flex flex-col items-start relative w-full">
      {/* Top banner — PHOTO PLACEHOLDER: set bannerPhotoSrc with your image */}
      <Reveal className="w-full">
        <section
          className="relative self-stretch w-full h-[360px] sm:h-[440px] lg:h-[474px] overflow-hidden"
          aria-label="CanaFri introduction"
        >
          {/* Render real photo if provided */}
          {bannerPhotoSrc ? (
            <img
              id="cta-banner-photo"
              src={bannerPhotoSrc}
              alt="Banner background"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            /* Fallback placeholder */
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#d0d0d8] pointer-events-none select-none px-4 text-center">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect width="56" height="56" rx="12" fill="#b0b0be" />
                <path d="M14 38l9-11 6 8 5-6 8 9H14z" fill="#ffffff" opacity="0.5" />
                <circle cx="20" cy="22" r="4" fill="#ffffff" opacity="0.5" />
                <path d="M10 18h4v-4h4v4h4v4h-4v4h-4v-4h-4v-4z" fill="#ffffff" opacity="0.3" />
              </svg>
              <span className="text-[#5d5d7f] text-sm font-semibold tracking-wide uppercase">
                Replace with your photo
              </span>
              <span className="text-[#8888a0] text-xs">
                Set <code className="bg-black/10 px-1.5 py-0.5 rounded font-mono">bannerPhotoSrc</code>
              </span>
            </div>
          )}

          {/* Logo header inside max-width container to maintain alignment on large screens and zoom */}
          <div className="absolute inset-x-0 top-8 sm:top-[84px] z-10 px-6 sm:px-10 lg:px-16 pointer-events-none">
            <header className="inline-flex items-center gap-3 pointer-events-auto max-w-[117.25rem] mx-auto w-full">
              <div className="relative w-[56px] h-[56px] sm:w-[65px] sm:h-[65px] rounded-full overflow-hidden flex items-center justify-center shrink-0">
                {logoPhotoSrc ? (
                  <img
                    id="cta-logo"
                    src={logoPhotoSrc}
                    alt="CanaFri logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-[10px] sm:text-xs font-bold text-[#8C5CFF] text-center leading-tight select-none">
                    LOGO
                  </span>
                )}
              </div>
              <div className="relative w-fit font-outfit font-extrabold text-white text-3xl sm:text-[40px] tracking-tight leading-normal drop-shadow-lg">
                CanaFri
              </div>
            </header>
          </div>
        </section>
      </Reveal>

      {/* CTA panel — uses identical background from TestimonialsSection and consistent max-width frame */}
      <section
        className="relative w-full overflow-hidden bg-[linear-gradient(180deg,rgba(50,0,83,1)_0%,rgba(0,5,24,1)_100%)] py-10 sm:py-12 lg:py-16"
        aria-labelledby="cta-heading"
      >
        {/* Ambient glow orbs from Testimonials section */}
        <div
          className="absolute left-[200px] top-[-100px] h-[400px] w-[400px] rounded-[200px] bg-[#8080d715] blur-[75px] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute left-[840px] top-[50px] h-[400px] w-[500px] rounded-[250px/200px] bg-[#aad9d910] blur-[90px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Horizontal grid lines from Testimonials section */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 flex h-full w-[1440px] max-w-full flex-col items-start justify-between pointer-events-none opacity-40"
          aria-hidden="true"
        >
          {horizontalLines.map((_, index) => (
            <div
              key={`cta-horizontal-line-${index}`}
              className="relative h-px w-full self-stretch bg-gradient-to-r from-transparent via-white/15 to-transparent"
            />
          ))}
        </div>

        {/* Vertical grid lines from Testimonials section */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 flex h-full w-[1440px] max-w-full items-start justify-between pointer-events-none opacity-40"
          aria-hidden="true"
        >
          {verticalLines.map((_, index) => (
            <div
              key={`cta-vertical-line-${index}`}
              className={`relative h-full w-px bg-gradient-to-b from-white/15 via-white/5 to-transparent ${index === verticalLines.length - 1 ? "mr-[-1.00px]" : ""
                }`}
            />
          ))}
        </div>

        <div className="relative max-w-[117.25rem] mx-auto flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 lg:gap-14 w-full px-6 sm:px-10 lg:px-16">
          {/* Left text block */}
          <Reveal>
            <div className="flex flex-col items-start max-w-[780px]">
              <h2
                id="cta-heading"
                className="font-outfit font-bold text-3xl sm:text-5xl lg:text-[58px] tracking-tight leading-[1.15]"
              >
                <span className="text-white">
                  Ready to work, create, and earn on{" "}
                </span>
                <span className="text-[#8C5CFF]">
                  Canafri?
                </span>
              </h2>
              <p className="mt-5 sm:mt-6 font-sans font-normal text-[var(--muted)] text-base sm:text-lg lg:text-xl leading-relaxed max-w-[640px]">
                Join CanaFri and start building your freelance career or start
                creating valuable content with payment protection that actually
                works.
              </p>
            </div>
          </Reveal>

          {/* Right CTA button — horizontally aligned with left content */}
          <Reveal delay={150} className="flex items-center shrink-0 lg:pb-1">
            <button
              type="button"
              id="cta-get-started"
              onClick={() => handleAction("Get Started")}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-[#f6f0ff] active:scale-[0.98] rounded-xl cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              aria-label="Get started"
            >
              <span className="font-sans font-semibold text-[#320053] text-base tracking-[0] leading-none whitespace-nowrap">
                Get started
              </span>
              {/* Arrow icon */}
              <span className="relative w-[18px] h-[18px] flex items-center justify-center group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 7.5h11M8.5 3l4.5 4.5L8.5 12" stroke="#320053" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

/*LANDING FOOTER (dark-mode only — no theme switching)*/

function FooterXIcon() {
  return (
    <svg className="size-[13px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FooterNavLink({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 text-[11px] text-[#8f9bb3] hover:text-[#8C5CFF] transition-colors duration-200 text-left w-full cursor-pointer"
      >
        <span className="opacity-70 shrink-0">{icon}</span>
        <span>{label}</span>
      </button>
    </li>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <p className="font-sans font-medium text-[13px] text-white/90 leading-5">{title}</p>
        <div className="bg-[#8C5CFF] h-[1.5px] w-8 rounded-full" />
      </div>
      <ul className="flex flex-col gap-3">{children}</ul>
    </div>
  );
}

export const LandingFooter = () => {
  const nav = (page: string) => () => handleAction(page);

  /* ─ inline lucide-style SVG icons (avoids importing lucide into landing) ─ */
  const icons = {
    briefcase: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>,
    users: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    help: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
    fileText: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
    lifeBuoy: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><line x1="4.93" y1="4.93" x2="9.17" y2="9.17" /><line x1="14.83" y1="14.83" x2="19.07" y2="19.07" /><line x1="14.83" y1="9.17" x2="19.07" y2="4.93" /><line x1="4.93" y1="19.07" x2="9.17" y2="14.83" /></svg>,
    shield: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>,
    cookie: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" /><path d="M12 8v4l3 3" /></svg>,
    mail: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
    send: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
  };

  return (
    <footer className="w-full bg-[#09090b] px-6 sm:px-10 lg:px-16 py-12">
      <div className="max-w-[117.25rem] mx-auto flex flex-col gap-8 w-full">

        <div className="flex flex-col md:flex-row justify-between gap-10 md:gap-4 items-start">

          {/* Brand column */}
          <div className="flex flex-col gap-3 max-w-[200px]">
            <p className="font-sans font-bold text-[28px] tracking-tight text-white/90 leading-none">
              Canafri
            </p>
            <p className="font-sans text-[10px] leading-[1.5] text-[#8f9bb3]">
              Connecting talent, opportunities, content creators and businesses through the{' '}
              <span className="text-[#8C5CFF] font-semibold">CC</span> ecosystem
            </p>

            <div className="flex items-center gap-3 mt-1.5">
              <a
                href="https://t.me/canafri"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="flex items-center justify-center size-7 rounded-full bg-white/[0.06] border border-white/10 text-white/70 hover:text-[#8C5CFF] hover:border-[#8C5CFF]/40 transition-all"
              >
                {icons.send}
              </a>
              <a
                href="https://x.com/canafri"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="flex items-center justify-center size-7 rounded-full bg-white/[0.06] border border-white/10 text-white/70 hover:text-[#8C5CFF] hover:border-[#8C5CFF]/40 transition-all"
              >
                <FooterXIcon />
              </a>
            </div>
          </div>

          {/* Nav columns */}
          <div className="grid grid-cols-3 gap-8 md:gap-12">
            <FooterCol title="Marketplace">
              <FooterNavLink icon={icons.briefcase} label="Find Job" onClick={nav('Find Job')} />
              <FooterNavLink icon={icons.users} label="Find Talent" onClick={nav('Find Talent')} />
              <FooterNavLink icon={icons.briefcase} label="Post a Job" onClick={nav('Post a Job')} />
              <FooterNavLink icon={icons.briefcase} label="Become a Seller" onClick={nav('Become a Seller')} />
            </FooterCol>

            <FooterCol title="Resources">
              <li>
                <a
                  href="/about"
                  className="flex items-center gap-2 text-[11px] text-[#8f9bb3] hover:text-[#8C5CFF] transition-colors duration-200 text-left w-full cursor-pointer"
                >
                  <span className="opacity-70 shrink-0">{icons.users}</span>
                  <span>About Us</span>
                </a>
              </li>
              <FooterNavLink icon={icons.help} label="Help Center" onClick={nav('Support')} />
              <FooterNavLink icon={icons.fileText} label="Blog" onClick={nav('Blog')} />
              <FooterNavLink icon={icons.users} label="Community" onClick={nav('Community')} />
              <FooterNavLink icon={icons.lifeBuoy} label="Support" onClick={nav('Support')} />
            </FooterCol>

            <FooterCol title="Legal">
              <li>
                <a
                  href="/terms"
                  className="flex items-center gap-2 text-[11px] text-[#8f9bb3] hover:text-white transition-colors duration-200 text-left w-full cursor-pointer"
                >
                  <span className="opacity-70 shrink-0">{icons.fileText}</span>
                  <span>Terms of Service</span>
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="flex items-center gap-2 text-[11px] text-[#8f9bb3] hover:text-white transition-colors duration-200 text-left w-full cursor-pointer"
                >
                  <span className="opacity-70 shrink-0">{icons.shield}</span>
                  <span>Privacy Policy</span>
                </a>
              </li>
              <FooterNavLink icon={icons.cookie} label="Cookie Policy" onClick={nav('Cookie Policy')} />
              <FooterNavLink icon={icons.mail} label="Contact Us" onClick={nav('Contact')} />
            </FooterCol>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-3">
          <div className="bg-white/10 h-px w-full" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <p className="font-sans text-[10px] text-[#8f9bb3]">
              © 2026 Canafri. All rights reserved
            </p>
            <p className="font-sans text-[10px] text-[#8f9bb3]">
              Powered by <span className="text-[#8C5CFF] font-semibold">CC</span>
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-[1px] w-5 rotate-90 bg-[#61B8FA]" />
      <span className="text-xs font-semibold uppercase text-[#61B8FA]">
        {children}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   WHAT WE OFFER (Figma Container-Query Design)
   Set image paths in OFFER_IMAGES to replace placeholders.
───────────────────────────────────────────── */
const resolveOfferImage = (img: any): string =>
  img && typeof img === "object" && "src" in img ? img.src : (img as string) || "";

export const OFFER_IMAGES = {
  creator: "/what-we-offer/creator.png", // Card 1 (Content Creator)
  escrow: "/what-we-offer/escrow.png", // Card 2 (escroll)
  client: "/what-we-offer/client.png", // Card 3 (client)
  freelancer: "/what-we-offer/freelancer.png", // Card 3 (freelancer - Secondary picture)
};

type OfferCardType = "creator" | "escrow" | "freelancer";

interface OfferFeatureCard {
  title: string;
  description: string;
  type: OfferCardType;
  placeholderLabel: string;
  href: string;
}

const offerFeatureCards: OfferFeatureCard[] = [
  {
    title: "Content Creator",
    description:
      "Publish premium content and earn Canton Coin from every reader. While your stake protects the ecosystem. Quality is enforced at the protocol level.",
    type: "creator",
    placeholderLabel: "creator.png",
    href: "/creator",
  },
  {
    title: "Escrow protection",
    description:
      "Every job on CanaFri locks payment in a Canton smart contract before work begins. Funds release only on milestone approval.",
    type: "escrow",
    placeholderLabel: "escrow.png",
    href: "/escrow",
  },
  {
    title: "Client/Freelancer",
    description:
      "Post jobs with CC escrow or apply as a freelancer. Milestone based payments mean you get paid for what you deliver enforced by smart contracts.",
    type: "freelancer",
    placeholderLabel: "client.png & freelancer.png",
    href: "/freelancer",
  },
];

const CQW = 100 / 360;
const cqwPx = (value: number) => `${(value * CQW).toFixed(4)}cqw`;

function FigmaCardBackground({ idPrefix = "card" }: { idPrefix?: string }) {
  return (
    <>
      {/* Bottom gradient blob */}
      <svg
        style={{
          position: "absolute",
          left: cqwPx(17),
          top: cqwPx(211),
          width: cqwPx(293),
          height: cqwPx(227),
          pointerEvents: "none",
        }}
        viewBox="0 0 293 227"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter={`url(#filter0_f_${idPrefix}_bottom)`}>
          <circle
            cx="108.625"
            cy="117.875"
            r="108.625"
            transform="rotate(-90 108.625 117.875)"
            fill={`url(#paint0_diamond_${idPrefix}_bottom)`}
          />
        </g>
        <g filter={`url(#filter1_f_${idPrefix}_bottom)`} style={{ mixBlendMode: "overlay" }}>
          <circle
            cx="184.375"
            cy="108.625"
            r="108.625"
            transform="rotate(-90 184.375 108.625)"
            fill={`url(#paint1_diamond_${idPrefix}_bottom)`}
          />
        </g>
        <defs>
          <filter
            id={`filter0_f_${idPrefix}_bottom`}
            x="-43.25"
            y="-34"
            width="303.75"
            height="303.75"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="21.625" />
          </filter>
          <filter
            id={`filter1_f_${idPrefix}_bottom`}
            x="28.25"
            y="-47.5"
            width="312.25"
            height="312.25"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="23.75" />
          </filter>
          <radialGradient
            id={`paint0_diamond_${idPrefix}_bottom`}
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(108.625 117.875) scale(108.625)"
          >
            <stop stopColor="#9D01C3" />
            <stop offset="1" stopColor="#9D01C3" stopOpacity="0" />
          </radialGradient>
          <radialGradient
            id={`paint1_diamond_${idPrefix}_bottom`}
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(184.375 108.625) scale(108.625)"
          >
            <stop stopColor="#7928CA" />
            <stop offset="1" stopColor="#7928CA" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* Precision Lower-Left Faded Grid */}
      <svg
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "60%",
          height: "65%",
          pointerEvents: "none",
        }}
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={`grid_pattern_${idPrefix}`}
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1"
            />
          </pattern>
          <radialGradient
            id={`grid_mask_grad_${idPrefix}`}
            cx="15%"
            cy="85%"
            r="80%"
          >
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="35%" stopColor="white" stopOpacity="0.8" />
            <stop offset="65%" stopColor="white" stopOpacity="0.25" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id={`grid_mask_${idPrefix}`}>
            <rect width="100%" height="100%" fill={`url(#grid_mask_grad_${idPrefix})`} />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`url(#grid_pattern_${idPrefix})`}
          mask={`url(#grid_mask_${idPrefix})`}
        />
      </svg>

      {/* Top gradient blob */}
      <svg
        style={{
          position: "absolute",
          left: cqwPx(61),
          top: cqwPx(-164),
          width: cqwPx(361),
          height: cqwPx(387),
          pointerEvents: "none",
        }}
        viewBox="0 0 361 387"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter={`url(#filter0_f_${idPrefix}_top)`}>
          <circle
            cx="211.654"
            cy="158.224"
            r="108.625"
            transform="rotate(30 211.654 158.224)"
            fill={`url(#paint0_diamond_${idPrefix}_top)`}
          />
        </g>
        <g filter={`url(#filter1_f_${idPrefix}_top)`} style={{ mixBlendMode: "overlay" }}>
          <circle
            cx="148.384"
            cy="228.451"
            r="108.625"
            transform="rotate(30 148.384 228.451)"
            fill={`url(#paint1_diamond_${idPrefix}_top)`}
          />
        </g>
        <defs>
          <filter
            id={`filter0_f_${idPrefix}_top`}
            x="59.7615"
            y="6.33105"
            width="303.785"
            height="303.786"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="21.625" />
          </filter>
          <filter
            id={`filter1_f_${idPrefix}_top`}
            x="-7.758"
            y="72.3076"
            width="312.285"
            height="312.286"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="23.75" />
          </filter>
          <radialGradient
            id={`paint0_diamond_${idPrefix}_top`}
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(211.654 158.224) scale(108.625)"
          >
            <stop stopColor="#9D01C3" />
            <stop offset="1" stopColor="#9D01C3" stopOpacity="0" />
          </radialGradient>
          <radialGradient
            id={`paint1_diamond_${idPrefix}_top`}
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(148.384 228.451) scale(108.625)"
          >
            <stop stopColor="#6D28D9" />
            <stop offset="1" stopColor="#6D28D9" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
}

const CreatorPreview = (): JSX.Element => {
  if (OFFER_IMAGES.creator) {
    return (
      <div className="absolute inset-x-0 bottom-0 top-4 flex items-end justify-center z-10 px-4 pb-0 pointer-events-none" style={{ bottom: '-32px' }}>
        <img
          src={resolveOfferImage(OFFER_IMAGES.creator)}
          alt="Content Creator Preview"
          className="w-[82%] max-h-[84%] object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.7)]"
        />
      </div>
    );
  }

  return (
    <>
      {/* Exact Foreground tweet card from Figma */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: cqwPx(34),
          top: cqwPx(84),
          width: cqwPx(322),
          height: cqwPx(228),
          padding: cqwPx(14.115),
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderRadius: cqwPx(8.822),
          background: "rgba(11, 11, 11, 0.40)",
          transform: "rotate(-11.227deg)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: cqwPx(8.822), flex: "1 0 0", alignSelf: "stretch" }}>
          <svg
            style={{ aspectRatio: "1 / 1", fill: "#320053", width: cqwPx(37), height: cqwPx(37), flexShrink: 0 }}
            viewBox="0 0 37 37"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="18.1488" cy="18.1488" r="15.4384" transform="rotate(-11.2274 18.1488 18.1488)" fill="#320053" />
          </svg>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: cqwPx(21.173), flex: "1 0 0", alignSelf: "stretch" }}>
            <div style={{ display: "flex", height: cqwPx(124.389), flexDirection: "column", alignItems: "flex-start", gap: cqwPx(13.233), alignSelf: "stretch" }}>
              <div style={{ display: "flex", height: cqwPx(15.879), justifyContent: "space-between", alignItems: "center", flexShrink: 0, alignSelf: "stretch" }}>
                <div style={{ display: "flex", alignItems: "center", gap: cqwPx(7.94) }}>
                  <span
                    style={{
                      fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
                      fontWeight: 500,
                      fontSize: cqwPx(11.468),
                      lineHeight: cqwPx(15.879),
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    John Trek
                  </span>
                  <span
                    style={{
                      fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
                      fontWeight: 400,
                      fontSize: cqwPx(9.704),
                      lineHeight: cqwPx(14.115),
                      color: "#A0A0A0",
                    }}
                  >
                    @Johntrek
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
                    fontWeight: 400,
                    fontSize: cqwPx(9.704),
                    lineHeight: cqwPx(14.115),
                    color: "#A0A0A0",
                  }}
                >
                  May 10
                </span>
              </div>
              <div style={{ display: "flex", paddingRight: cqwPx(14.115), justifyContent: "center", alignItems: "center", gap: cqwPx(8.822), alignSelf: "stretch" }}>
                <span
                  style={{
                    flex: "1 0 0",
                    fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
                    fontWeight: 400,
                    fontSize: cqwPx(12.351),
                    lineHeight: cqwPx(19.408),
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
                  industry&apos;s standard dummy text ever since 1966, when designers at Letraset and James
                  Mosley, the librarian at St Bride Printing Library, took a 1914
                </span>
              </div>
            </div>
          </div>

          <svg
            style={{ aspectRatio: "1 / 1", overflow: "hidden", width: cqwPx(17), height: cqwPx(17), flexShrink: 0 }}
            viewBox="0 0 17 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.16655 7.64761C8.29491 7.62213 8.42794 7.63528 8.54882 7.68541C8.6697 7.73554 8.773 7.82038 8.84566 7.92922C8.91832 8.03805 8.95707 8.16599 8.95702 8.29685C8.95697 8.42771 8.91811 8.55562 8.84537 8.6644C8.77262 8.77317 8.66925 8.85794 8.54833 8.90797C8.42741 8.958 8.29438 8.97105 8.16604 8.94547C8.0377 8.91989 7.91983 8.85683 7.82734 8.76426C7.73484 8.67169 7.67187 8.55377 7.64639 8.42541C7.61223 8.25329 7.64784 8.07465 7.74538 7.92878C7.84293 7.78292 7.99443 7.68177 8.16655 7.64761ZM5.2668 8.89777C5.24132 8.76941 5.17835 8.65149 5.08585 8.55892C4.99336 8.46636 4.87549 8.40329 4.74715 8.37771C4.61881 8.35213 4.48577 8.36518 4.36486 8.41521C4.24394 8.46524 4.14057 8.55001 4.06782 8.65879C3.99508 8.76756 3.95622 8.89547 3.95617 9.02633C3.95612 9.15719 3.99487 9.28513 4.06753 9.39397C4.14019 9.5028 4.24349 9.58765 4.36437 9.63777C4.48525 9.6879 4.61828 9.70105 4.74664 9.67557C4.91876 9.64141 5.07026 9.54027 5.16781 9.3944C5.26535 9.24853 5.30096 9.06989 5.2668 8.89777ZM11.324 7.69541C11.3494 7.82377 11.4124 7.94169 11.5049 8.03425C11.5974 8.12682 11.7153 8.18989 11.8436 8.21547C11.9719 8.24105 12.105 8.228 12.2259 8.17797C12.3468 8.12794 12.4502 8.04317 12.5229 7.93439C12.5957 7.82562 12.6345 7.69771 12.6346 7.56685C12.6346 7.43599 12.5959 7.30805 12.5232 7.19922C12.4506 7.09038 12.3473 7.00553 12.2264 6.95541C12.1055 6.90528 11.9725 6.89213 11.8441 6.91761C11.672 6.95177 11.5205 7.05291 11.4229 7.19878C11.3254 7.34465 11.2898 7.52329 11.324 7.69541Z"
              fill="white"
              fillOpacity="0.8"
            />
          </svg>
        </div>

        <div style={{ display: "flex", height: cqwPx(14.115), justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0, alignSelf: "stretch" }}>
          <div style={{ display: "flex", alignItems: "center", gap: cqwPx(21.173) }}>
            <svg style={{ aspectRatio: "1 / 1", width: cqwPx(17), height: cqwPx(17) }} viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6.92247 1.37412L9.81882 6.02036L15.2191 6.92247L10.5728 9.81882L9.67072 15.2191L6.77436 10.5728L1.37412 9.67072L6.02036 6.77436L6.92247 1.37412Z"
                fill="#320053"
              />
            </svg>
            <svg style={{ aspectRatio: "1 / 1", width: cqwPx(17), height: cqwPx(17) }} viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9.15626 10.8902L12.5621 10.2142C13.1824 10.091 13.5717 9.50073 13.4545 8.91024L12.5325 4.26526C12.4153 3.67478 11.83 3.27794 11.2097 3.40106L3.73344 4.88512C3.11318 5.00824 2.72382 5.59855 2.84103 6.18903L3.76307 10.834C3.88028 11.4245 4.4656 11.8213 5.08585 11.6982L6.19344 11.4784L6.62739 13.6645L6.62947 13.6641L6.63072 13.6631L9.15626 10.8902ZM7.15308 14.1379C7.02718 14.2756 6.8523 14.3585 6.66599 14.3687C6.47968 14.3789 6.29679 14.3156 6.15659 14.1925C6.04416 14.0927 5.96734 13.9589 5.93776 13.8114L5.6393 12.3079L5.22395 12.3903C4.22989 12.5876 3.26623 11.9522 3.07151 10.9713L2.14948 6.32631C1.95407 5.34553 2.60196 4.39019 3.59603 4.19287L11.0723 2.70882C12.0664 2.51149 13.03 3.14694 13.2247 4.12785L14.1468 8.77283C14.3416 9.75443 13.6936 10.7091 12.6995 10.9064L9.52212 11.5371L7.15308 14.1379Z"
                fill="white"
              />
            </svg>
            <svg style={{ aspectRatio: "1 / 1", width: cqwPx(17), height: cqwPx(17) }} viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.5726 7.83462C12.8983 7.33934 13.0138 6.73499 12.8939 6.1545C12.7739 5.57402 12.4283 5.06496 11.933 4.73932C11.6878 4.57808 11.4132 4.46671 11.1249 4.41159C10.8366 4.35647 10.5403 4.35867 10.2529 4.41806C9.67242 4.53801 9.16336 4.88365 8.83772 5.37893C8.74894 5.51167 8.63517 5.67556 8.4964 5.8706L8.11038 6.41191L7.54687 6.05908C7.34367 5.93153 7.17573 5.82356 7.04307 5.73517C6.55036 5.40567 5.94694 5.2854 5.36556 5.4008C4.78418 5.51621 4.27245 5.85784 3.94295 6.35055C3.26432 7.36607 3.52647 8.73809 4.521 9.42569L9.34961 12.6548L12.5726 7.83462ZM3.35608 5.95858C3.57075 5.63749 3.84656 5.36184 4.16778 5.14736C4.48899 4.93289 4.84931 4.78379 5.22815 4.70859C5.607 4.63339 5.99695 4.63356 6.37573 4.70908C6.7545 4.78461 7.1147 4.93401 7.43573 5.14876C7.56163 5.23329 7.72361 5.33745 7.92167 5.46123C8.05666 5.27134 8.16654 5.11302 8.25131 4.98627C8.6799 4.33466 9.34979 3.88001 10.1136 3.72232C10.8774 3.56463 11.6726 3.71682 12.3242 4.14541C12.9758 4.57401 13.4304 5.24389 13.5881 6.00771C13.7458 6.77152 13.5936 7.56669 13.165 8.21829L9.87083 13.145C9.78411 13.2746 9.64947 13.3645 9.49651 13.3948C9.34354 13.4252 9.18478 13.3936 9.05513 13.3069L4.12764 10.0116C3.49247 9.57253 3.05549 8.90121 2.91109 8.14266C2.76669 7.3841 2.92644 6.59919 3.35585 5.95742L3.35608 5.95858Z"
                fill="white"
              />
            </svg>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: cqwPx(21.173) }}>
            <svg style={{ width: cqwPx(13), height: cqwPx(14) }} viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3.32579 10.8866L6.88041 8.82526L10.9529 9.37263L9.39335 1.51615L1.76627 3.03014L3.32579 10.8866ZM2.16768 13.0398L0.240853 3.33294C0.174619 2.99927 0.267388 2.68385 0.519162 2.38668C0.770508 2.09002 1.10593 1.90006 1.52542 1.81679L9.15249 0.302798C9.57198 0.219529 9.95478 0.266926 10.3009 0.444991C10.6466 0.623561 10.8525 0.879682 10.9188 1.21335L12.8456 10.9202L7.14535 10.16L2.16768 13.0398Z"
                fill="white"
                fillOpacity="0.8"
              />
            </svg>
            <div style={{ display: "flex", width: cqwPx(14.115), height: cqwPx(14.115), justifyContent: "center", alignItems: "center", position: "relative" }}>
              <svg
                style={{ flexShrink: 0, position: "absolute", left: 0, top: cqwPx(-1), width: cqwPx(20), height: cqwPx(21) }}
                viewBox="0 0 20 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M13.4061 1.44554C13.8118 1.69509 14.1674 2.31343 14.2909 2.70444C14.8643 2.9198 15.5951 3.43851 15.8866 4.63081C16.9233 5.08248 17.8478 6.11497 17.3229 7.99728C17.9176 8.36492 18.7605 9.67982 18.2687 10.9719C17.6968 12.4813 15.893 12.9364 14.0291 13.0573C14.7825 14.3153 15.2122 15.5287 14.6996 16.9607C14.1626 18.2473 13.147 18.6405 12.787 18.712C11.8023 18.9074 10.9592 18.1943 10.4618 17.1202C10.2998 16.825 10.0387 16.1033 9.95575 15.9165C9.47881 14.716 8.51099 13.8729 7.05227 13.3872C6.40296 13.1682 5.73297 13.0161 5.05273 12.9333L3.02791 13.3352C2.57708 13.4247 1.94748 13.0757 1.83789 12.5236L0.526288 5.91613C0.466306 5.27867 0.751057 4.89776 1.38054 4.77341L4.07165 4.23922C5.19811 3.7368 6.31738 3.21632 7.42947 2.67777C8.50239 2.14731 8.73064 1.99677 9.47998 1.62138C11.1651 0.808397 12.4485 0.817166 13.4061 1.44554ZM11.4175 2.22071C10.7089 2.36139 9.85481 2.75757 9.48202 2.96378C9.3506 3.03574 9.11928 3.1572 8.87533 3.28298L8.63068 3.40979L8.39555 3.53021L7.93812 3.76312C7.93812 3.76312 6.78296 4.3324 4.50239 5.36251C4.41561 5.39053 4.36899 5.40638 4.36253 5.41006L5.63015 11.796C7.03789 12.0401 8.17734 12.4489 9.04849 13.0224C10.3559 13.8818 10.8527 14.7941 11.279 16.0037C11.5053 16.6091 11.7707 17.0807 12.0884 17.3765C12.1806 17.4658 12.2999 17.5215 12.4275 17.535C12.5628 17.5504 12.7389 17.5181 13.0734 17.2413C13.4076 16.9627 13.7836 16.3331 13.7166 15.5198C13.6238 14.7351 13.2831 14.1066 12.8647 13.4575C12.7208 13.2367 12.5707 13.02 12.4146 12.8076C12.155 12.4876 12.321 11.8377 12.9315 11.8505C13.7593 11.9155 15.7638 11.8279 16.7579 11.091C17.3227 10.5951 17.3622 9.96789 16.8764 9.20928C16.7331 9.04117 16.5544 8.90681 16.3531 8.81578C16.1885 8.75672 15.8252 8.43128 16.0845 7.92923C16.318 7.31174 16.597 6.09344 15.1908 5.64764C15.0929 5.61625 15.005 5.55948 14.9362 5.4831C14.8673 5.40672 14.8199 5.31347 14.7987 5.21281C14.7344 4.97915 14.5979 4.09244 13.8675 3.8291C13.6951 3.77609 13.4936 3.74414 13.3471 3.56365C13.2532 3.44379 13.1673 3.12446 13.1673 3.12446C12.9696 2.59527 12.7454 2.10913 11.4175 2.22071ZM3.18692 5.64072L1.75224 5.92551L2.98156 12.1185L4.41625 11.8337L3.18692 5.64072Z"
                  fill="white"
                  fillOpacity="0.89"
                />
              </svg>
            </div>
            <svg style={{ aspectRatio: "1 / 1", width: cqwPx(17), height: cqwPx(17) }} viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_creator_share)">
                <path
                  d="M11.9866 12.9607C11.6044 13.0366 11.2534 12.9673 10.9339 12.7529C10.6146 12.5381 10.417 12.2395 10.3412 11.8573C10.3297 11.7996 10.3262 11.649 10.3306 11.4054L5.68956 9.7646C5.59351 9.93317 5.46343 10.0763 5.29932 10.194C5.13521 10.3117 4.9497 10.3911 4.7428 10.4322C4.3636 10.5075 4.01453 10.4365 3.69557 10.2192C3.37662 10.0019 3.1797 9.70458 3.10481 9.3273C3.02992 8.95003 3.09836 8.60007 3.31013 8.27742C3.5219 7.95477 3.81739 7.7558 4.19658 7.68053C4.4031 7.63954 4.60487 7.64206 4.80189 7.68809C4.9989 7.73413 5.17383 7.81693 5.32668 7.93649L8.99176 4.65765C8.95003 4.58839 8.91592 4.51821 8.88941 4.44712C8.86245 4.37573 8.84133 4.30157 8.82607 4.22465C8.75026 3.84276 8.81982 3.49138 9.03474 3.1705C9.24973 2.85001 9.54856 2.65178 9.93122 2.57582C10.3139 2.49987 10.6651 2.56946 10.9848 2.78461C11.3045 2.99976 11.5022 3.2987 11.5777 3.68144C11.6533 4.06417 11.5841 4.41529 11.3701 4.73478C11.1561 5.05428 10.8576 5.25185 10.4744 5.3275C10.266 5.36888 10.0652 5.36436 9.87214 5.31394C9.67906 5.26353 9.50628 5.17851 9.35382 5.05887L5.69022 8.3482C5.73195 8.41747 5.7661 8.48784 5.79268 8.55931C5.81957 8.63032 5.84065 8.70429 5.85592 8.78121C5.87118 8.85812 5.87995 8.93453 5.88223 9.01043C5.8845 9.08632 5.88001 9.16437 5.86874 9.24455L10.5104 10.8853C10.606 10.7164 10.7332 10.5718 10.892 10.4516C11.0512 10.3312 11.235 10.2504 11.4434 10.209C11.8257 10.1331 12.1772 10.2024 12.498 10.417C12.8186 10.6324 13.0169 10.9314 13.0928 11.314C13.1688 11.6967 13.0992 12.0479 12.884 12.3676C12.6689 12.6873 12.3694 12.8851 11.9866 12.9607ZM11.875 12.3832C12.1015 12.3383 12.2761 12.2241 12.3988 12.0406C12.5215 11.8572 12.5604 11.6524 12.5155 11.4262C12.4706 11.2001 12.3564 11.0255 12.1729 10.9024C11.9894 10.7794 11.7846 10.7405 11.5585 10.7858C11.3325 10.831 11.1579 10.9452 11.0347 11.1284C10.9116 11.3115 10.8727 11.5163 10.918 11.7427C10.9634 11.9692 11.0776 12.1438 11.2606 12.2665C11.4437 12.3893 11.6481 12.4283 11.875 12.3832ZM4.62817 9.85476C4.85738 9.80927 5.03433 9.6938 5.15901 9.50835C5.28323 9.3226 5.32324 9.11839 5.27904 8.89572C5.23484 8.67304 5.11987 8.4996 4.93411 8.37537C4.74836 8.25115 4.54069 8.21183 4.31109 8.2574C4.08765 8.30176 3.91594 8.41639 3.79595 8.6013C3.67557 8.78629 3.63748 8.99012 3.68168 9.21279C3.72588 9.43547 3.83894 9.6093 4.02084 9.73428C4.20275 9.85927 4.40523 9.89962 4.62829 9.85534"
                  fill="white"
                />
                <path
                  d="M10.8807 4.40801C11.0054 4.22456 11.0453 4.01958 11.0003 3.79306C10.9554 3.56693 10.8412 3.39252 10.6578 3.26984C10.4743 3.14716 10.2696 3.10827 10.0434 3.15315C9.81729 3.19804 9.64269 3.31225 9.51963 3.49577C9.39656 3.67929 9.3577 3.88428 9.40305 4.11072C9.4484 4.33716 9.56353 4.51138 9.74844 4.63337C9.93335 4.75536 10.1374 4.79441 10.3605 4.75051C10.5836 4.70662 10.757 4.59207 10.8807 4.40801Z"
                  fill="white"
                />
              </g>
              <defs>
                <clipPath id="clip0_creator_share">
                  <rect width="14.1151" height="14.1151" fill="white" transform="translate(0 2.74825) rotate(-11.2274)" />
                </clipPath>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Image replacement placeholder label */}
      <div className="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded-md bg-black/60 border border-white/10 text-[10px] text-white/50 backdrop-blur-sm pointer-events-none">
        image.png placeholder
      </div>
    </>
  );
};

const FreelancerPreview = (): JSX.Element => {
  if (OFFER_IMAGES.client || OFFER_IMAGES.freelancer) {
    return (
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        {/* First picture at the right */}
        {OFFER_IMAGES.client && (
          <img
            src={resolveOfferImage(OFFER_IMAGES.client)}
            alt="Client Preview"
            className="absolute right-0 bottom-[70px] w-[64%] max-h-[58%] object-contain drop-shadow-[0_16px_30px_rgba(0,0,0,0.75)] z-10"
          />
        )}
        {/* Second picture shifted up slightly */}
        {OFFER_IMAGES.freelancer && (
          <img
            src={resolveOfferImage(OFFER_IMAGES.freelancer)}
            alt="Freelancer Preview"
            className="absolute left-0 -bottom-10 w-[74%] max-h-[56%] object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.9)] z-20"
          />
        )}
      </div>
    );
  }

  return (
    <>
      {/* Freelancer milestone proposal card */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: cqwPx(60),
          transform: "translateX(-50%)",
          width: cqwPx(314),
          zIndex: 10,
        }}
        className="rounded-2xl bg-[#0c0c14]/85 border border-white/10 backdrop-blur-md p-5 shadow-[0_16px_40px_rgba(0,0,0,0.6)] flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-[#10B981]/20 flex items-center justify-center text-[#10B981]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold text-white">Smart Contract Job</div>
              <div className="text-[10px] text-[#10B981]">Milestone 1 Active</div>
            </div>
          </div>
          <span className="text-xs font-bold text-[#8C5CFF]">2,500 CC</span>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] text-white/50">
            <span>Escrow Locked</span>
            <span className="text-white/80">100% Guaranteed</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#8C5CFF] to-[#10B981]" />
          </div>
        </div>

        {/* Freelancer details */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-white/70">
          <span className="truncate">Canton Protocol Integration</span>
          <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] text-white/80 shrink-0">In Review</span>
        </div>
      </div>

      {/* Image replacement placeholder label */}
      <div className="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded-md bg-black/60 border border-white/10 text-[10px] text-white/50 backdrop-blur-sm pointer-events-none">
        card-fade-3-1.png placeholder
      </div>
    </>
  );
};

const EscrowPreview = (): JSX.Element => {
  if (OFFER_IMAGES.escrow) {
    return (
      <div className="absolute inset-x-0 top-4 flex items-end justify-center z-10 px-2 pb-0 pointer-events-none" style={{ bottom: '-48px' }}>
        <img
          src={resolveOfferImage(OFFER_IMAGES.escrow)}
          alt="Escrow Protection Preview"
          className="w-[94%] max-h-[92%] object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.7)]"
        />
      </div>
    );
  }

  return (
    <>
      {/* Escrow contract lock card */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: cqwPx(42),
          transform: "translateX(-50%)",
          width: cqwPx(310),
          zIndex: 10,
        }}
        className="rounded-2xl bg-[#0c0c14]/90 border border-white/10 backdrop-blur-md p-4 shadow-[0_16px_40px_rgba(0,0,0,0.6)] flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-[#8C5CFF]/25 flex items-center justify-center text-[#8C5CFF]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="text-xs font-bold text-white">Escrow Payment</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] font-semibold">Locked On-Chain</span>
        </div>
        <div className="rounded-xl bg-white/[0.04] p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-white/40">Total Project Value</div>
            <div className="text-sm font-bold text-white">5,000 Canton Coin</div>
          </div>
          <span className="text-xs font-bold text-[#10B981]">Protected</span>
        </div>
      </div>

      {/* Floating activity badge */}
      <div
        style={{
          position: "absolute",
          right: cqwPx(24),
          bottom: cqwPx(28),
          zIndex: 10,
        }}
        className="rounded-xl bg-[#141422]/95 border border-white/15 p-3 shadow-2xl flex items-center gap-2.5"
      >
        <div className="size-3 rounded-full bg-[#10B981] animate-pulse" />
        <span className="text-[11px] font-medium text-white/90">Milestone 2 Verified</span>
      </div>

      {/* Image replacement placeholder label */}
      <div className="absolute bottom-3 left-3 z-20 px-2.5 py-1 rounded-md bg-black/60 border border-white/10 text-[10px] text-white/50 backdrop-blur-sm pointer-events-none">
        card-fade-2-1.png placeholder
      </div>
    </>
  );
};

const CardPreview = ({ type }: { type: OfferCardType }): JSX.Element => {
  return (
    <div
      className="relative w-full overflow-hidden rounded-[22px] bg-[#040612] border border-white/[0.08] shadow-xl"
      style={{ containerType: "inline-size", aspectRatio: "360 / 290" }}
    >
      <FigmaCardBackground idPrefix={type} />
      {type === "creator" && <CreatorPreview />}
      {type === "freelancer" && <FreelancerPreview />}
      {type === "escrow" && <EscrowPreview />}
    </div>
  );
};

function GiftBoxArt({
  tone = "dark",
  size = 110,
  className = "",
}: {
  tone?: "dark" | "light";
  size?: number;
  className?: string;
}) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_20px_26px_rgba(0,0,0,0.32)]"
      >
        {/* Gift Box Body Left Face */}
        <path d="M80 68L28 90V136L80 156V68Z" fill={tone === "light" ? "#2C1B44" : "#24242A"} />
        {/* Gift Box Body Right Face */}
        <path d="M80 68L132 90V136L80 156V68Z" fill={tone === "light" ? "#1B0D2F" : "#18181D"} />
        {/* Box Lid Top */}
        <path d="M80 44L136 65L80 86L24 65L80 44Z" fill={tone === "light" ? "#442D68" : "#383842"} />
        {/* Box Lid Front Left Rim */}
        <path d="M24 65L80 86V98L24 77V65Z" fill={tone === "light" ? "#371F58" : "#2B2B32"} />
        {/* Box Lid Front Right Rim */}
        <path d="M136 65L80 86V98L136 77V65Z" fill={tone === "light" ? "#22103B" : "#1E1E24"} />
        {/* Vertical Ribbon Front Left */}
        <path d="M50 78L60 82V148L50 144V78Z" fill="#888896" />
        {/* Vertical Ribbon Front Right */}
        <path d="M100 82L110 78V144L100 148V82Z" fill="#70707C" />
        {/* Lid Ribbon Cross */}
        <path d="M49 55L106 75L113 72L56 52L49 55Z" fill="#9FA0B0" />
        <path d="M105 54L48 76L41 73L98 51L105 54Z" fill="#8E8F9E" />
        {/* Ribbon Bow Left Loop */}
        <path
          d="M80 44C68 22 46 26 56 40C64 47 74 45 80 45Z"
          fill="#B0B2C4"
        />
        {/* Ribbon Bow Right Loop */}
        <path
          d="M80 44C92 22 114 26 104 40C96 47 86 45 80 45Z"
          fill="#9496A6"
        />
        {/* Ribbon Center Knot */}
        <ellipse cx="80" cy="45" rx="6" ry="4" fill="#C5C7D8" />
      </svg>
    </div>
  );
}

function WalletMiniCard({ showExtraButtons = false }: { showExtraButtons?: boolean }) {
  return (
    <div className="w-full max-w-[270px] sm:max-w-[290px] rounded-2xl bg-white p-4 shadow-[0_12px_32px_rgba(0,0,0,0.08)] border border-black/5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] text-gray-500 font-medium">Total Balance</span>
          <div className="text-lg font-bold text-black leading-tight">100 CC</div>
          <span className="text-[9px] text-gray-400">≈$15.00</span>
        </div>
        <div className="text-gray-400 p-1">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
      </div>

      <div className="inline-flex items-center self-start gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-600">
        $34.44 (5.4%) ↗
      </div>

      <div className="grid grid-cols-2 gap-2 text-[8.5px] border-t border-gray-100 pt-2 text-gray-500">
        <div>
          <span className="block text-gray-400 text-[8px]">Total Balance</span>
          <span className="font-semibold text-gray-800">0.00 CC</span>
          <span className="block text-[7.5px] text-gray-400">≈ $0.00</span>
        </div>
        <div>
          <span className="block text-gray-400 text-[8px]">Locked Balance</span>
          <span className="font-semibold text-gray-800">0.00 CC</span>
          <span className="block text-[7.5px] text-gray-400">≈ $0.00</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-0.5">
        <button type="button" className="rounded-lg bg-[#2D0052] py-2 text-[10px] font-semibold text-white transition hover:bg-[#2D0052]/90 flex items-center justify-center">
          View offer &gt;
        </button>
        <button type="button" className="rounded-lg bg-[#2D0052] py-2 text-[10px] font-semibold text-white transition hover:bg-[#2D0052]/90 flex items-center justify-center">
          Withdraw &gt;
        </button>
      </div>

      {showExtraButtons && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="rounded-lg border border-gray-200 bg-white py-1.5 text-[9.5px] font-medium text-gray-700 transition hover:bg-gray-50 flex items-center justify-center">
            &lt; Stake
          </button>
          <button type="button" className="rounded-lg border border-gray-200 bg-white py-1.5 text-[9.5px] font-medium text-gray-700 transition hover:bg-gray-50 flex items-center justify-center">
            &lt; Subscribe
          </button>
        </div>
      )}
    </div>
  );
}



type RoleKey = "Freelancer" | "Creator" | "Client";

interface HowItWorksCard {
  bgClass: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const HOW_IT_WORKS: Record<RoleKey, HowItWorksCard[]> = {
  Freelancer: [
    {
      bgClass: "bg-gradient-to-br from-[#130028] to-[#4a0082]",
      icon: (
        <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16" aria-hidden="true">
          <rect x="8" y="16" width="32" height="22" rx="3" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M16 16v-3a8 8 0 0116 0v3" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="24" cy="27" r="4" stroke="#8C5CFF" strokeWidth="2.5" />
          <path d="M24 31v4" stroke="#8C5CFF" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
      title: "Discover work that actually pays what you're worth",
      description: "Browse verified job listings across tech, design, writing and Web3. Every client pays in Canton Coin, no currency conversion, no delays.",
    },
    {
      bgClass: "bg-gradient-to-br from-[#1e003d] to-[#5a0096]",
      icon: (
        <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16" aria-hidden="true">
          <rect x="8" y="12" width="32" height="26" rx="3" stroke="white" strokeWidth="2.5" />
          <path d="M15 22h18M15 28h12" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="36" cy="14" r="7" fill="#5a0096" stroke="#a78bfa" strokeWidth="2" />
          <path d="M36 10v8M32 14h8" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: "Pitch with confidence, win with your real track record",
      description: "Send your proposal with your CC rate and timeline. Clients see your verified work history before they commit to anyone.",
    },
    {
      bgClass: "bg-gradient-to-br from-[#0f001e] to-[#3d006e]",
      icon: (
        <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16" aria-hidden="true">
          <rect x="8" y="16" width="32" height="20" rx="3" stroke="white" strokeWidth="2.5" />
          <path d="M16 24h8M16 29h12" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="36" cy="34" r="8" fill="#3d006e" stroke="#8C5CFF" strokeWidth="2" />
          <path d="M33 34l2 2 4-4" stroke="#8C5CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Your money moves the moment work is approved",
      description: "No invoices, no waiting rooms. A smart contract holds your funds and releases them straight to your wallet the instant the client signs off.",
    },
  ],
  Creator: [
    {
      bgClass: "bg-gradient-to-br from-[#1a0035] to-[#6d28d9]",
      icon: (
        <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16" aria-hidden="true">
          <path d="M24 8l3.09 9.26H38l-8.73 6.34 3.27 10.1L24 27.9l-8.54 5.8 3.27-10.1L10 17.26h10.91z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M24 38v6" stroke="#c4b5fd" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="24" cy="46" r="2" fill="#c4b5fd" />
        </svg>
      ),
      title: "Stake once and earn your spot among verified creators",
      description: "Put down 300 CC to activate your creator account. One time, no renewals. You're verified, visible and ready to publish from day one.",
    },
    {
      bgClass: "bg-gradient-to-br from-[#2d0050] to-[#7c3aed]",
      icon: (
        <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16" aria-hidden="true">
          <rect x="8" y="12" width="32" height="24" rx="3" stroke="white" strokeWidth="2.5" />
          <path d="M14 20h20M14 26h14" stroke="#c4b5fd" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M36 8v8M32 12h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: "Turn what you know into a paid subscription people want",
      description: "Write premium articles your readers actually pay to access. You control the price, the topics and the schedule. We handle subscriptions and delivery.",
    },
    {
      bgClass: "bg-gradient-to-br from-[#1a0030] to-[#4c1d95]",
      icon: (
        <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16" aria-hidden="true">
          <circle cx="24" cy="24" r="14" stroke="white" strokeWidth="2.5" />
          <path d="M18 24l4 4 8-8" stroke="#c4b5fd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 8v4M24 36v4M8 24h4M36 24h4" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        </svg>
      ),
      title: "Earn every month without chasing a single payment",
      description: "Your share of the reader rewards pool lands in your wallet automatically every month, based on how people actually engage with your work.",
    },
  ],
  Client: [
    {
      bgClass: "bg-gradient-to-br from-[#001a2e] to-[#0d4a6d]",
      icon: (
        <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16" aria-hidden="true">
          <rect x="8" y="10" width="32" height="28" rx="3" stroke="white" strokeWidth="2.5" />
          <path d="M16 20h16M16 26h10" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="36" cy="38" r="8" fill="#0d4a6d" stroke="#38bdf8" strokeWidth="2" />
          <path d="M33 38h6M36 35v6" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: "Post your job and reach serious talent within minutes",
      description: "Describe what you need and set your CC budget. Your listing goes live instantly to a pool of verified, skilled professionals ready to work.",
    },
    {
      bgClass: "bg-gradient-to-br from-[#001428] to-[#0f3460]",
      icon: (
        <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16" aria-hidden="true">
          <circle cx="18" cy="18" r="8" stroke="white" strokeWidth="2.5" />
          <circle cx="30" cy="18" r="8" stroke="white" strokeWidth="2.5" opacity="0.5" />
          <path d="M8 40c0-5.523 4.477-10 10-10h12c5.523 0 10 4.477 10 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M34 22l2 2 6-6" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Compare real proposals from people who can actually deliver",
      description: "Review bids with portfolios and CC rates side by side. Message any candidate directly before you sign a contract or move a single coin.",
    },
    {
      bgClass: "bg-gradient-to-br from-[#001020] to-[#0a2a4a]",
      icon: (
        <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16" aria-hidden="true">
          <rect x="10" y="14" width="28" height="20" rx="3" stroke="white" strokeWidth="2.5" />
          <path d="M18 24h12" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M24 34v8M14 42h20" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
          <circle cx="38" cy="12" r="7" fill="#0a2a4a" stroke="#38bdf8" strokeWidth="2" />
          <path d="M35 12l2 2 4-4" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Pay only when the work is exactly what you asked for",
      description: "Your CC sits safely in a smart contract escrow. It releases to the freelancer milestone by milestone, only when you say the job is right.",
    },
  ],
};

function HeroRing({ className = "", idSuffix = "main" }: { className?: string; idSuffix?: string }) {
  const gradId = `hero-ring-grad-${idSuffix}`;
  return (
    <svg
      viewBox="0 0 613 594"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none z-0 object-contain drop-shadow-[0_0_28px_rgba(140,92,255,0.35)] ${className}`}
      aria-hidden="true"
    >
      <path
        d="M612.264 297C612.264 461.029 475.204 594 306.132 594C137.06 594 0 461.029 0 297C0 132.971 137.06 0 306.132 0C475.204 0 612.264 132.971 612.264 297ZM14.2224 297C14.2224 453.408 144.915 580.202 306.132 580.202C467.349 580.202 598.041 453.408 598.041 297C598.041 140.592 467.349 13.7982 306.132 13.7982C144.915 13.7982 14.2224 140.592 14.2224 297Z"
        fill={`url(#${gradId})`}
      />
      <defs>
        <linearGradient
          id={gradId}
          x1="306.132"
          y1="0"
          x2="34.7877"
          y2="476.591"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#8C5CFF" />
          <stop offset="30%" stopColor="#6E3AFF" stopOpacity="0.9" />
          <stop offset="65%" stopColor="#320053" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#1B0A33" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export const HeroSection = (): JSX.Element => {
  const [announcement, setAnnouncement] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [incomingIdx, setIncomingIdx] = useState<number | null>(null);
  const [isGliding, setIsGliding] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedFreelancerCategory, setSelectedFreelancerCategory] = useState("All");
  const [activeRole, setActiveRole] = useState<RoleKey>("Freelancer");

  const categoriesNavRef = useRef<HTMLElement | null>(null);
  const [canScrollCategoriesLeft, setCanScrollCategoriesLeft] = useState(false);
  const [canScrollCategoriesRight, setCanScrollCategoriesRight] = useState(false);

  const checkCategoryScroll = useCallback(() => {
    const el = categoriesNavRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollCategoriesLeft(scrollLeft > 4);
    setCanScrollCategoriesRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    checkCategoryScroll();
    const handleResize = () => checkCategoryScroll();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [checkCategoryScroll]);



  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const interval = setInterval(() => {
      // The creator in the small ring glides into the large ring
      setActiveIdx((current) => {
        const next = (current + 1) % creators.length;
        setIncomingIdx(next);

        // Start glide motion on the next animation frame
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsGliding(true);
          });
        });

        // Settle creator on the large board when glide completes
        setTimeout(() => {
          setActiveIdx(next);
          setIncomingIdx(null);
          setIsGliding(false);
        }, 1200);

        return current;
      });
    }, 10000); // 10 seconds interval

    return () => clearInterval(interval);
  }, []);

  const previewIdx = incomingIdx !== null
    ? (incomingIdx + 1) % creators.length
    : (activeIdx + 1) % creators.length;

  const currentCreator = creators[activeIdx];
  const incomingCreator = incomingIdx !== null ? creators[incomingIdx] : null;
  const previewCreator = creators[previewIdx];

  const handleAction = (action: string) => {
    setAnnouncement(`${action} selected. We'll help you continue shortly.`);
  };

  return (
    <main
      className="flex flex-col min-h-screen w-full bg-[#09090b] relative overflow-x-hidden"
      data-model-id="1535:19460"
    >


      {/* Header Container - Fixed to top with glassmorphic backdrop blur */}
      <header className="fixed top-0 inset-x-0 z-50 w-full bg-[#09090b]/80 backdrop-blur-xl [-webkit-backdrop-filter:blur(16px)] border-b border-white/[0.08] transition-all duration-300">
        <div className="flex h-20 items-center justify-between px-6 sm:px-10 lg:px-16 relative w-full max-w-[117.25rem] mx-auto">
          <div className="gap-8 lg:gap-12 inline-flex items-center relative flex-[0_0_auto]">
            <a
              href="#home"
              aria-label="Canafri home"
              className="inline-flex items-center relative flex-[0_0_auto]"
            >
              <img
                src="/app-logo/canafri-logo.svg"
                alt="Canafri logo"
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </a>
            <nav aria-label="Primary navigation" className="hidden md:block">
              <ul className="inline-flex items-center gap-8 relative flex-[0_0_auto]">
                {navigationItems.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="relative w-fit mt-[-0.0625rem] font-sans font-medium text-[var(--muted)] text-sm tracking-normal leading-normal transition-colors hover:text-white focus-visible:text-white"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Right Header: Desktop Actions & Mobile Hamburger */}
          <div className="flex items-center gap-2.5 sm:gap-4 relative flex-[0_0_auto]">
            {/* Desktop Authentication buttons */}
            <div className="hidden md:inline-flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => handleAction("Login")}
                className="all-unset box-border inline-flex items-start px-4 sm:px-5 py-2.5 relative flex-[0_0_auto] rounded-lg cursor-pointer hover:bg-white/[0.05] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              >
                <span className="relative w-fit mt-[-0.0625rem] font-sans font-semibold text-white text-sm tracking-normal leading-normal">
                  Login
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleAction("Sign Up")}
                className="all-unset box-border inline-flex items-start px-4 sm:px-5 py-2.5 relative flex-[0_0_auto] bg-[var(--primary)] rounded-lg shadow-[0_0.25rem_0.75rem_var(--primary-glow)] cursor-pointer hover:bg-[var(--primary-hover)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              >
                <span className="relative w-fit mt-[-0.0625rem] font-sans font-semibold text-white text-sm tracking-normal leading-normal">
                  Sign Up
                </span>
              </button>
            </div>

            {/* Hamburger Menu Toggle Button on Mobile / Tablet */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              {isMobileMenuOpen ? (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer Overlay & Dropdown Menu (placed outside header to escape backdrop-filter containing block) */}
      <div
        className={`md:hidden fixed inset-x-0 top-20 bottom-0 z-50 bg-[#09090b]/95 backdrop-blur-2xl transition-all duration-300 ease-out border-t border-white/[0.08] overflow-y-auto overscroll-contain ${isMobileMenuOpen
          ? "opacity-100 pointer-events-auto translate-y-0"
          : "opacity-0 pointer-events-none -translate-y-2"
          }`}
        style={{ height: "calc(100dvh - 5rem)" }}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="flex flex-col min-h-full p-6 max-w-md mx-auto">
          <nav aria-label="Mobile navigation" className="flex-1">
            <p className="text-xs uppercase tracking-wider text-[var(--muted-dark)] font-sans font-semibold mb-3 px-3">
              Navigation
            </p>
            <ul className="flex flex-col gap-1.5">
              <li>
                <a
                  href="/#home"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl font-sans font-medium text-base text-[var(--muted)] hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <span>Home</span>
                  <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </li>
              {navigationItems.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href.startsWith("#") ? `/${item.href}` : item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl font-sans font-medium text-base text-[var(--muted)] hover:text-white hover:bg-white/[0.05] transition-colors"
                  >
                    <span>{item.label}</span>
                    <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-3 pt-6 border-t border-white/10 mt-6 pb-8">
            <button
              type="button"
              onClick={() => {
                handleAction("Login");
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-3.5 px-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.04] font-sans font-semibold text-white text-base text-center transition-colors cursor-pointer active:bg-white/[0.08]"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                handleAction("Sign Up");
                setIsMobileMenuOpen(false);
              }}
              className="all-unset box-border w-full py-3.5 px-4 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_0.25rem_1rem_var(--primary-glow)] font-sans font-semibold text-white text-base text-center transition-colors cursor-pointer active:opacity-90"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: HERO & WALLET ECOSYSTEM (Independent Section with its own background structure) */}
      <div className="relative w-full overflow-hidden [background:radial-gradient(50%_50%_at_49%_69%,rgba(11,11,11,1)_0%,rgba(8,8,8,1)_100%),linear-gradient(0deg,rgba(4,6,18,1)_0%,rgba(4,6,18,1)_100%)] flex flex-col justify-between pt-20">
        {/* Top Ambient Glow for Hero */}
        <div
          className="absolute top-[-8.5rem] right-1/4 w-[34.625rem] h-[36rem] bg-[#8C5CFF] rounded-[17.3125rem/18rem] blur-[10.9375rem] opacity-15 pointer-events-none"
          aria-hidden="true"
        />

        {/* Hero Content Section - centered with max-width and side margin 7.5rem (120px) */}
        <section
          id="home"
          aria-labelledby="hero-title"
          className="flex flex-1 flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 px-6 sm:px-10 lg:px-16 pt-12 pb-10 sm:pt-16 sm:pb-12 lg:pt-20 lg:pb-14 relative z-10 w-full max-w-[117.25rem] mx-auto"
        >
          {/* Left Side: Headline and CTAs */}
          <div className="flex flex-col w-full lg:max-w-[40rem] items-start gap-8 lg:gap-10 relative z-10">

            <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
              <h1
                id="hero-title"
                className="relative self-stretch w-full font-outfit font-bold text-white tracking-tight leading-[1.1]"
                style={{ fontSize: 'clamp(2.25rem, 4.5vw, 3.75rem)' }}
              >
                Work. Create. Get paid.{' '}
                <span className="text-[#8C5CFF]">Onchain.</span>
              </h1>
              <p className="relative self-stretch font-sans font-normal text-[var(--muted)] text-base sm:text-lg tracking-normal leading-[1.625rem]">
                Find work, hire experts, and discover valuable knowledge, with
                earnings you can withdraw directly to your wallet.
              </p>
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-5 relative flex-[0_0_auto]">
              <button
                type="button"
                onClick={() => handleAction("Get Started")}
                className="all-unset box-border flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 bg-[var(--primary)] rounded-lg shadow-[0_0.25rem_1rem_var(--primary-glow)] cursor-pointer hover:bg-[var(--primary-hover)] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] group"
              >
                <span className="relative w-fit font-sans font-semibold text-white text-sm tracking-normal leading-normal">
                  Get started
                </span>
                <svg
                  className="w-4 h-4 text-white transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
              <a
                href="#how-it-works"
                className="all-unset box-border flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 rounded-lg border border-[#8C5CFF]/35 hover:border-[#8C5CFF]/70 bg-[#8C5CFF]/[0.06] hover:bg-[#8C5CFF]/[0.12] text-white/90 hover:text-white shadow-[0_2px_12px_rgba(140,92,255,0.08)] transition-all cursor-pointer text-sm font-semibold font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] group"
              >
                How it works
                <svg
                  className="w-4 h-4 text-white/70 group-hover:text-white transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right Side: Double Glowing Rings Visual with Wrapped Portraits */}
          <div className="relative w-full max-w-[clamp(19rem,30vw,33.5rem)] h-[clamp(19rem,30vw,33.5rem)] flex items-center justify-center shrink-0">
            {/* Small Floating Circular Avatar (Top-Left Preview Ring) */}
            <div className="absolute top-[-2%] left-[-11%] sm:left-[-15%] z-30 w-[clamp(7rem,11vw,11rem)] h-[clamp(7rem,11vw,11rem)] flex items-center justify-center">
              {/* Replica Ring — Pure Brand Palette */}
              <HeroRing idSuffix="small" />
              {/* Preview Circle — Wrapped inside ring without dark circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] h-[92%] rounded-full overflow-hidden flex items-center justify-center z-10 aspect-square">
                <img
                  key={`preview-${previewCreator.id}`}
                  className={`w-full h-full object-cover ${previewCreator.smallPosition} transition-all duration-[1200ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${isGliding ? "opacity-20 scale-75 blur-[1px]" : "opacity-100 scale-100 blur-0"
                    }`}
                  alt={previewCreator.name}
                  src={previewCreator.image}
                />
              </div>
            </div>

            {/* Main Large Ring — Pure Brand Palette */}
            <HeroRing idSuffix="main" />

            {/* Main Creator Portrait — Wrapped Cleanly Inside the Ring */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] h-[92%] rounded-full overflow-hidden flex items-end justify-center z-10 aspect-square">
              {/* Active Current Creator — wrapped cleanly inside the circle */}
              <img
                key={`current-${currentCreator.id}`}
                className={`w-full h-full object-cover object-top transition-all duration-[1000ms] ease-out ${isGliding ? "opacity-0 scale-95" : "opacity-100 scale-100"
                  }`}
                alt={currentCreator.alt}
                src={currentCreator.image}
              />

              {/* Incoming Creator Gliding & Expanding from the Small Ring into the Large Ring */}
              {incomingCreator && (
                <img
                  key={`incoming-${incomingCreator.id}`}
                  className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-[1200ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${isGliding
                    ? "opacity-100 scale-100"
                    : "opacity-40 scale-[0.45] -translate-x-[42%] -translate-y-[38%]"
                    }`}
                  alt={incomingCreator.alt}
                  src={incomingCreator.image}
                />
              )}
            </div>
          </div>
        </section>

        {/* Wallet Partners Section - Static row on desktop, continuous animated marquee on mobile and tablet */}
        <Reveal className="w-full">
          <section
            aria-label="Supported wallet partners"
            className="relative z-10 w-full max-w-[117.25rem] mx-auto pt-4 pb-10 sm:pb-12 lg:pb-14 overflow-hidden"
          >
            {/* Desktop View: Inline label with static spaced-out row (screens >= lg) */}
            <div className="hidden lg:flex items-center justify-between gap-8 px-6 sm:px-10 lg:px-16">
              <span className="shrink-0 font-space-grotesk font-medium text-[var(--muted)] text-base tracking-tight whitespace-nowrap">
                Supported by:
              </span>
              <div className="flex flex-1 items-center justify-between gap-6">
                {walletPartners.map((partner, index) => (
                  <div
                    key={`desktop-${partner.name}-${index}`}
                    className="group inline-flex items-center gap-[0.4375rem] shrink-0 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                    onClick={() => handleAction(`Wallet: ${partner.name}`)}
                  >
                    <img
                      className="relative w-5 h-5 aspect-square object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200"
                      alt={partner.alt}
                      src={partner.image}
                    />
                    <span
                      className={`relative w-fit font-space-grotesk font-medium text-[var(--muted)] text-base sm:text-lg tracking-tight leading-normal group-hover:text-white transition-colors duration-200 ${index === 3 ? "mt-[-0.25rem]" : "mt-[-0.0625rem]"
                        }`}
                    >
                      {partner.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile & Tablet View: Inline label with smooth horizontal infinite scrolling marquee (screens < lg) */}
            <div className="lg:hidden flex items-center gap-3 sm:gap-5 px-4 sm:px-6">
              <span className="shrink-0 font-space-grotesk font-medium text-[var(--muted)] text-xs sm:text-sm tracking-tight whitespace-nowrap">
                Supported by:
              </span>
              <div className="relative flex-1 overflow-hidden min-w-0 marquee-mask">
                <div className="animate-marquee-track flex">
                  {/* Primary track */}
                  <div className="flex shrink-0 items-center gap-8 pr-8">
                    {walletPartners.map((partner, index) => (
                      <div
                        key={`mobile-1-${partner.name}-${index}`}
                        className="inline-flex items-center gap-[0.4375rem] shrink-0"
                      >
                        <img
                          className="relative w-5 h-5 aspect-square object-cover"
                          alt={partner.alt}
                          src={partner.image}
                        />
                        <span
                          className={`relative w-fit font-space-grotesk font-medium text-[var(--muted)] text-base tracking-tight leading-normal ${index === 3 ? "mt-[-0.25rem]" : "mt-[-0.0625rem]"
                            }`}
                        >
                          {partner.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Duplicate track for seamless infinite loop */}
                  <div className="flex shrink-0 items-center gap-8 pr-8" aria-hidden="true">
                    {walletPartners.map((partner, index) => (
                      <div
                        key={`mobile-2-${partner.name}-${index}`}
                        className="inline-flex items-center gap-[0.4375rem] shrink-0"
                      >
                        <img
                          className="relative w-5 h-5 aspect-square object-cover"
                          alt=""
                          src={partner.image}
                        />
                        <span
                          className={`relative w-fit font-space-grotesk font-medium text-[var(--muted)] text-base tracking-tight leading-normal ${index === 3 ? "mt-[-0.25rem]" : "mt-[-0.0625rem]"
                            }`}
                        >
                          {partner.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      </div>

      {/* ECOSYSTEM TRUST METRICS BAR */}
      <EcosystemMetricsBar />

      {/* SECTION 2: WHAT WE OFFER (Light bg section: #F6F6F8) */}
      <section id="what-we-offer" className="w-full bg-[#F6F6F8] py-10 sm:py-12 lg:py-16 scroll-mt-20">
        <div className="mx-auto flex w-full max-w-[117.25rem] flex-col items-center gap-10 lg:gap-12 px-6 sm:px-10 lg:px-16">
          <Reveal>
            <div className="flex max-w-[800px] flex-col items-center gap-3 text-center">
              <h2 className="font-outfit text-3xl sm:text-4xl lg:text-[40px] font-extrabold leading-tight tracking-tight text-[#030303]">
                Two platforms. One ecosystem.
              </h2>
              <p className="max-w-[480px] text-base leading-[26px] text-[#5D5D7F]">
                Whether you are a creator, a freelancer, a buyer, or all three, CanaFri has a place for you.
              </p>
            </div>
          </Reveal>

          {/* New 3-card layout from Figma — responsive grid with consistent section margins */}
          <div
            className="w-full overflow-x-auto pb-4 pt-1 scroll-smooth cursor-grab active:cursor-grabbing sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 sm:overflow-visible sm:cursor-default [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onWheel={(e) => {
              if (e.deltaY !== 0 && window.innerWidth < 640) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
          >
            <div className="flex items-stretch gap-6 min-w-max pr-6 sm:contents">
              {offerFeatureCards.map((card, idx) => (
                <Reveal
                  key={card.type}
                  delay={idx * 100}
                  className="flex w-[82vw] max-w-[380px] shrink-0 sm:w-auto sm:max-w-none sm:shrink"
                >
                  <article className="flex w-full flex-col items-start gap-6 group">
                    <CardPreview type={card.type} />
                    <div className="flex w-full flex-col items-start gap-2.5">
                      <h3 className="font-outfit text-xl sm:text-2xl font-bold leading-tight tracking-[-0.3px] text-[#030303]">
                        {card.title}
                      </h3>
                      <p className="font-sans text-sm font-normal leading-[22px] tracking-[0] text-[#5D5D7F]">
                        {card.description}
                      </p>
                      <a
                        href={card.href}
                        className="inline-flex items-center gap-1.5 mt-1 text-sm font-semibold text-[#543799] hover:text-[#7c3aed] transition-all duration-300 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
                      >
                        Explore
                        <svg
                          className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: TWO PLATFORMS GRID (Pure white bg section: #FFFFFF) */}
      <section className="w-full bg-white py-10 sm:py-12 lg:py-16">
        <div className="mx-auto flex w-full max-w-[117.25rem] flex-col items-center gap-8 lg:gap-10 px-6 sm:px-10 lg:px-16">
          <Reveal>
            <div className="flex max-w-[840px] flex-col items-center gap-3 text-center">
              <h2 className="font-outfit text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-[#030303]">
                Built for creators and freelancers to thrive.
              </h2>
              <p className="max-w-[540px] text-base leading-[26px] text-[#5D5D7F]">
                Experience fair monetization, guaranteed payment security, and instant global settlements without traditional platform gatekeepers.
              </p>
            </div>
          </Reveal>

          {/* Benefit Cards — 4-card uniform showcase with liquid bottom-up hover fill */}
          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 w-full">
              {[
                {
                  id: "benefit-rewards",
                  title: "Earn Rewards",
                  description:
                    "Earn Canton Coin bonuses, platform incentives, and creator rewards simply by publishing content, completing jobs, and building ecosystem reputation.",
                  badgeBg: "bg-[#f5efff]",
                  icon: "/icons/benefit-earn-rewards.png",
                },
                {
                  id: "benefit-protected",
                  title: "Always Protected",
                  description:
                    "Every project is backed by Canton smart contract escrow. Client funds are locked before work starts, protecting both parties with zero risk of unpaid work.",
                  badgeBg: "bg-[#edf5ff]",
                  icon: "/icons/benefit-always-protected.png",
                },
                {
                  id: "benefit-stable",
                  title: "Stable Earnings",
                  description:
                    "Price jobs and quote milestones with peace of mind. Settle in predictable on-chain value without fear of market fluctuations cutting into your profit.",
                  badgeBg: "bg-[#fff8ed]",
                  icon: "/icons/benefit-stable-earnings.png",
                },
                {
                  id: "benefit-instant",
                  title: "Instant Payouts",
                  description:
                    "No 14-day clearance delays or exorbitant international wire fees. Approved funds hit your wallet immediately and can be withdrawn anytime.",
                  badgeBg: "bg-[#f0fdf4]",
                  icon: "/icons/benefit-instant-payouts.png",
                },
              ].map((card, idx) => (
                <Reveal key={card.id} delay={idx * 75} className="flex w-full">
                  <article className="group relative flex flex-col items-center justify-start py-5 px-4 sm:py-6 sm:px-5 rounded-2xl sm:rounded-3xl bg-[#f9f9fb] border border-black/8 hover:border-[#320053] shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(50,0,83,0.3)] hover:-translate-y-1.5 transition-all duration-300 text-center select-none cursor-pointer overflow-hidden w-full">
                    {/* Gentle bottom-to-top primary fill on hover */}
                    <div
                      className="absolute inset-0 bg-[#320053] translate-y-[calc(100%+8px)] group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none rounded-[inherit]"
                      aria-hidden="true"
                    />

                    {/* Centered Circular Icon Image */}
                    <div
                      className={`relative z-10 flex items-center justify-center size-16 sm:size-18 rounded-full ${card.badgeBg} group-hover:bg-white group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] transition-all duration-300 group-hover:scale-105 mb-2 shrink-0 shadow-inner`}
                    >
                      <img
                        src={card.icon}
                        alt={card.title}
                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                      />
                    </div>

                    {/* Title */}
                    <h3 className="relative z-10 font-outfit font-bold text-[#030303] group-hover:text-white text-base sm:text-lg leading-snug mt-1.5 transition-colors duration-300">
                      {card.title}
                    </h3>

                    {/* Description */}
                    <p className="relative z-10 font-sans text-xs sm:text-[13px] text-[#5D5D7F] group-hover:text-white/90 leading-relaxed mt-1.5 max-w-[260px] transition-colors duration-300">
                      {card.description}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: INTEGRATION / WHY CHOOSE CANAFRI (Logo icons group with What People Say background) */}
      <section
        className="relative w-full overflow-hidden bg-[linear-gradient(180deg,rgba(50,0,83,1)_0%,rgba(0,5,24,1)_100%)] py-10 sm:py-12 lg:py-16"
        aria-labelledby="integration-heading"
      >
        {/* Ambient Glows from Testimonials Section */}
        <div
          className="absolute left-[200px] top-[-100px] h-[400px] w-[400px] rounded-[200px] bg-[#8080d715] blur-[75px] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute left-[840px] top-[50px] h-[400px] w-[500px] rounded-[250px/200px] bg-[#aad9d910] blur-[90px] pointer-events-none"
          aria-hidden="true"
        />
        {/* Background Grid Lines */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 flex h-80 w-[1440px] max-w-full flex-col items-start justify-between pointer-events-none opacity-30"
          aria-hidden="true"
        >
          {horizontalLines.map((_, index) => (
            <div
              key={`integration-horizontal-line-${index}`}
              className="relative h-px w-full self-stretch bg-gradient-to-r from-transparent via-white/15 to-transparent"
            />
          ))}
        </div>
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 flex h-80 w-[1440px] max-w-full items-start justify-between pointer-events-none opacity-30"
          aria-hidden="true"
        >
          {verticalLines.map((_, index) => (
            <div
              key={`integration-vertical-line-${index}`}
              className={`relative h-80 w-px bg-gradient-to-b from-white/15 via-white/5 to-transparent ${index === verticalLines.length - 1 ? "mr-[-1.00px]" : ""
                }`}
            />
          ))}
        </div>

        <div className="mx-auto flex w-full max-w-[117.25rem] items-center justify-between gap-10 lg:gap-14 px-6 sm:px-10 lg:px-16 relative z-10 max-md:flex-col max-md:items-start">
          <Reveal className="relative z-10 flex w-full max-w-[640px] flex-col items-start gap-8">
            <header className="relative flex w-full flex-col items-start gap-3">
              <h2
                id="integration-heading"
                className="relative self-stretch font-outfit text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-white"
              >
                Connect your preferred wallet. Withdraw with ease.
              </h2>
              <p className="relative font-sans text-base font-normal leading-[26px] tracking-[0] text-[#8f9bb3] max-w-[460px]">
                CanaFri connects directly with trusted Canton ecosystem wallets. Link your wallet in moments to receive project earnings, manage milestone payments securely, and withdraw your funds whenever you choose.
              </p>
            </header>
            <div className="relative flex w-full max-w-[460px] flex-col items-start">
              <button
                type="button"
                onClick={() => handleAction("Connect Wallet")}
                className="group relative inline-flex h-[44px] px-6 items-center justify-center gap-2.5 rounded-xl bg-white text-[#121212] font-sans text-sm font-semibold shadow-[0_4px_16px_rgba(255,255,255,0.15)] transition-all duration-200 hover:bg-[#f3f0ff] hover:shadow-[0_6px_24px_rgba(140,92,255,0.35)] hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer"
                aria-label="Connect wallet to Canafri"
              >
                <svg
                  className="w-4 h-4 text-[#8C5CFF] transition-transform duration-200 group-hover:scale-110"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
                </svg>
                <span>Connect Wallet</span>
              </button>
            </div>
          </Reveal>

          <Reveal
            delay={150}
            className="relative z-10 inline-flex flex-[0_0_auto] items-center justify-center gap-4 sm:gap-6 max-md:self-center"
          >
            <div
              className="inline-flex items-center justify-center gap-4 sm:gap-6"
              aria-label="Canafri ecosystem integrations"
            >
              {integrationColumns.map((column, columnIndex) => (
                <div
                  key={`integration-column-${columnIndex}`}
                  className={`relative flex w-[90px] sm:w-[106px] flex-col items-start gap-4 sm:gap-6 ${
                    columnIndex === 0
                      ? "animate-float-col-1"
                      : columnIndex === 1
                      ? "animate-float-col-2"
                      : "animate-float-col-3"
                  }`}
                >
                  {column.map((integration) => (
                    <article
                      key={integration.name}
                      tabIndex={0}
                      role="button"
                      onClick={() => handleAction(`Integration: ${integration.name}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleAction(`Integration: ${integration.name}`);
                        }
                      }}
                      className="group relative flex h-[115px] sm:h-[125px] w-full flex-col items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.04] hover:border-[#8C5CFF]/40 hover:bg-white/[0.08] hover:shadow-[0_16px_36px_rgba(140,92,255,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8C5CFF] cursor-pointer overflow-hidden"
                      aria-label={`${integration.name} integration`}
                    >
                      {/* Ambient Glow behind icon */}
                      <div
                        className="absolute size-14 rounded-full bg-[#8C5CFF]/15 blur-xl pointer-events-none opacity-35 group-hover:opacity-100 group-hover:bg-[#8C5CFF]/30 group-hover:scale-125 transition-all duration-300"
                        aria-hidden="true"
                      />

                      {/* Animated Icon container with subtle micro-bounce & hover bloom */}
                      <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-115 group-hover:-translate-y-0.5">
                        <img
                          className={`${integration.imageClassName} grayscale contrast-125 brightness-110 opacity-75 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300`}
                          alt={integration.alt}
                          src={integration.image}
                        />
                      </div>

                      <p className="relative w-fit font-sans text-xs font-medium leading-[normal] tracking-[0] text-[#cfc7e1] transition-colors group-hover:text-white group-hover:font-semibold">
                        {integration.name}
                      </p>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* SECTION 5: SUBSCRIPTION & STAKING PLANS (Light bg section: #fdfdfd) */}
      <section
        id="pricing"
        className="w-full bg-[#fdfdfd] pt-10 sm:pt-12 lg:pt-16 pb-6 sm:pb-8 lg:pb-10 relative scroll-mt-20"
        aria-labelledby="pricing-heading"
      >
        <div className="mx-auto flex w-full max-w-[117.25rem] flex-col items-center gap-8 sm:gap-10 lg:gap-12 px-6 sm:px-10 lg:px-16">
          <Reveal>
            <header className="flex flex-col items-center gap-3 text-center w-full max-w-[760px] mx-auto">
              <h2
                id="pricing-heading"
                className="font-outfit font-extrabold text-[#030303] text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight"
              >
                Choose how you participate
              </h2>
              <p className="font-sans font-normal text-[#5d5d7f] text-base sm:text-lg leading-relaxed max-w-[540px]">
                Read and learn without limits or stake to publish and monetize your knowledge.
              </p>
            </header>
          </Reveal>

          <div className="flex items-stretch gap-6 relative self-stretch w-full flex-[0_0_auto] max-lg:flex-col">
            {/* Reader Plan Article */}
            <Reveal delay={0}>
              <article
                className="flex flex-col justify-between w-full lg:w-[420px] shrink-0 gap-8 p-6 sm:p-8 relative bg-[#d9c1ff] rounded-2xl"
                aria-labelledby="reader-plan-title"
              >
                <div className="flex flex-col items-start gap-3 relative self-stretch w-full">
                  <h3
                    id="reader-plan-title"
                    className="font-outfit font-bold text-[#320053] text-xl sm:text-2xl tracking-tight leading-snug"
                  >
                    Reader Subscription
                  </h3>
                  <p className="font-sans font-normal text-[#543799] text-sm leading-relaxed">
                    Gain unlimited access to premium articles, verified insights, exclusive opportunities, and firsthand knowledge shared by top professionals.
                  </p>
                </div>

                <div className="flex flex-col gap-5 w-full mt-auto">
                  <p className="font-outfit font-bold text-[#0b002a] text-2xl tracking-tight">
                    35 <span className="text-lg font-semibold text-[#0b002a]/80">CC /month</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => handleAction("Join Today")}
                    className="box-border flex h-11 items-center justify-center px-5 py-2.5 w-full bg-[#320053] hover:bg-[#25003d] text-white rounded-lg font-semibold text-sm transition-colors cursor-pointer"
                    aria-label="Join today for the reader plan"
                  >
                    Join Today
                  </button>
                </div>
              </article>
            </Reveal>

            {/* Creator Plan Article with Benefits */}
            <Reveal delay={150}>
              <article
                className="flex items-stretch gap-8 p-6 sm:p-8 relative flex-1 bg-[#320053] rounded-2xl max-md:flex-col"
                aria-labelledby="creator-plan-title"
              >
                {/* Left side of Creator Card */}
                <div className="flex flex-col justify-between items-start gap-8 relative flex-1 min-w-0 max-md:contents">
                  <div className="flex flex-col items-start gap-3 relative self-stretch w-full order-1">
                    <h3
                      id="creator-plan-title"
                      className="font-outfit font-bold text-white text-xl sm:text-2xl tracking-tight leading-snug"
                    >
                      Creator Staking
                    </h3>
                    <p className="font-sans font-normal text-white/70 text-sm leading-relaxed">
                      Stake to unlock creator privileges. Publish paid articles, build your subscriber audience, and earn continuously from the reader rewards pool.
                    </p>
                  </div>

                  <div className="flex flex-col gap-5 w-full mt-auto order-4 max-md:pt-4 max-md:border-t max-md:border-white/10">
                    <p className="font-outfit font-bold text-white text-2xl tracking-tight">
                      300 <span className="text-lg font-semibold text-white/80">CC</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAction("Get Started")}
                      className="box-border flex h-11 items-center justify-center px-5 py-2.5 w-full bg-white hover:bg-white/90 text-[#121212] rounded-lg font-semibold text-sm transition-colors cursor-pointer"
                      aria-label="Get started with creator staking"
                    >
                      Get Started
                    </button>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div
                  className="w-px bg-[#543799]/60 shrink-0 self-stretch max-md:w-full max-md:h-px max-md:my-2 order-2"
                  aria-hidden="true"
                />

                {/* Benefits List */}
                <ul className="flex flex-col justify-center w-full md:w-[260px] lg:w-[290px] shrink-0 gap-5 relative order-3">
                  {creatorBenefits.map((benefit) => (
                    <li
                      key={benefit.text}
                      className="flex items-start gap-3 relative self-stretch w-full"
                    >
                      <svg
                        className="relative w-[18px] h-[18px] shrink-0 text-[#d9c1ff] mt-0.5"
                        viewBox="0 0 18 17"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M3.75 8.5L7.25 12L14.25 5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="font-sans font-normal text-white/90 text-sm leading-normal">
                        {benefit.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SECTION 6: HOW CANAFRI WORKS — role-based card switcher */}
      <div id="how-it-works" className="w-full bg-[#fdfdfd] relative overflow-hidden scroll-mt-20">
        <section
          id="learn"
          className="relative z-10 w-full px-6 sm:px-10 lg:px-16 py-10 sm:py-12 lg:py-16 max-w-[117.25rem] mx-auto scroll-mt-20 border-t border-black/5"
          aria-labelledby="how-it-works-heading"
        >
          {/* Header row: title and role tab-switcher */}
          <Reveal>
            <div className="flex flex-col items-center text-center gap-6 w-full mb-8 sm:mb-10">
              <div className="flex flex-col items-center gap-3 max-w-[720px]">
                <h2
                  id="how-it-works-heading"
                  className="font-outfit font-extrabold text-[#030303] text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight"
                >
                  How CanaFri works
                </h2>
                <p className="font-sans text-base leading-[26px] text-[#5D5D7F] max-w-[480px]">
                  Pick your role and see exactly what CanaFri does for you.
                </p>
              </div>

              {/* Role switcher pill tabs — centered */}
              <div
                className="flex items-center gap-1 p-1 rounded-full border border-black/10 bg-white shadow-sm shrink-0"
                role="tablist"
                aria-label="Switch role"
              >
                {(["Freelancer", "Creator", "Client"] as RoleKey[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    role="tab"
                    aria-selected={activeRole === role}
                    onClick={() => setActiveRole(role)}
                    className={`px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${activeRole === role
                      ? "bg-[#320053] text-white shadow-sm"
                      : "text-[#5d5d7f] hover:text-[#030303]"
                      }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Role cards — horizontal swipe track on mobile, 3-column grid on desktop */}
          <div
            key={activeRole}
            role="tabpanel"
            className="w-full overflow-x-auto pb-4 pt-1 scroll-smooth cursor-grab active:cursor-grabbing sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 sm:overflow-visible sm:cursor-default [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onWheel={(e) => {
              if (e.deltaY !== 0 && window.innerWidth < 640) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
          >
            <div className="flex items-stretch gap-6 min-w-max pr-6 sm:contents">
              {HOW_IT_WORKS[activeRole].map((card, idx) => (
                <Reveal
                  key={`${activeRole}-${idx}`}
                  delay={idx * 100}
                  className="flex w-[82vw] max-w-[340px] shrink-0 sm:w-auto sm:max-w-none sm:shrink"
                >
                <article
                  className="group relative flex flex-col rounded-2xl bg-white border border-black/5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-4 sm:p-5 lg:bg-transparent lg:border-0 lg:shadow-none lg:p-0 transition-all duration-300 hover:-translate-y-1 w-full"
                >
                  {/* Visual area — rich gradient with icon */}
                  <div
                    className={`relative flex h-[200px] sm:h-[220px] lg:h-[240px] flex-none items-center justify-center overflow-hidden rounded-2xl ${card.bgClass}`}
                  >
                    {/* Decorative glow top-left */}
                    <div
                      className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-white/5 blur-3xl pointer-events-none"
                      aria-hidden="true"
                    />
                    {/* Decorative glow bottom-right */}
                    <div
                      className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full bg-white/[0.04] blur-2xl pointer-events-none"
                      aria-hidden="true"
                    />
                    {/* Step badge */}
                    <span
                      className="absolute top-4 right-4 font-space-grotesk text-[10px] font-bold tracking-[0.2em] uppercase text-white/30"
                      aria-hidden="true"
                    >
                      0{idx + 1}
                    </span>
                    {/* Icon */}
                    {card.icon}
                  </div>

                  {/* Content area */}
                  <div className="flex flex-col flex-1 justify-between gap-5 sm:gap-6 pt-5 sm:pt-6 lg:pt-5 px-0.5 lg:px-0">
                    <div className="flex flex-col gap-2.5">
                      <h3 className="font-outfit font-bold text-[#080808] text-base sm:text-lg leading-snug tracking-tight group-hover:text-[#320053] transition-colors">
                        {card.title}
                      </h3>
                      <p className="font-sans text-sm text-[#5D5D7F] leading-relaxed lg:hidden">
                        {card.description}
                      </p>
                    </div>

                    {/* Explore more — full-width button with brand bg color, revealed on hover on desktop */}
                    <button
                      type="button"
                      onClick={() => handleAction(`Explore ${activeRole}`)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-full text-sm font-semibold bg-[#320053] text-white hover:bg-[#480075] shadow-sm transition-all duration-200 cursor-pointer lg:opacity-0 lg:-translate-y-1 lg:group-hover:opacity-100 lg:group-hover:translate-y-0"
                      aria-label={`Explore more about CanaFri for ${activeRole}`}
                    >
                      <span>Explore more</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14m-7-7 7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </article>
              </Reveal>
            ))}
            </div>
          </div>
        </section>
      </div>

      {/* SECTION 7 & 8 CONTAINER: SCALING GUIDES & HIRE TOP FREELANCERS */}
      <div className="w-full bg-[#fdfdfd] flex flex-col items-center">


        {/* SECTION 8: HIRE THE TOP FREELANCER */}
        <section
          id="freelancers"
          className="flex flex-col items-center gap-8 sm:gap-10 px-6 sm:px-10 lg:px-16 py-10 sm:py-12 lg:py-16 relative self-stretch w-full max-w-[117.25rem] mx-auto border-t border-black/5 scroll-mt-20"
          aria-labelledby="freelancer-hiring-heading"
        >
          <Reveal className="w-full max-w-full min-w-0">
            <div className="flex flex-col items-center gap-4 text-center w-full">
              <h2
                id="freelancer-hiring-heading"
                className="font-outfit font-extrabold text-[#292828] text-3xl sm:text-4xl lg:text-[44px] tracking-tight leading-tight"
              >
                Hire the Top Freelancer
              </h2>

              {/* Categories Navigation Bar — scrollable with dynamic fade cues */}
              <div className="relative w-full max-w-full min-w-0">
                {/* Left fade cue — shows when scrolled */}
                <div
                  className={`absolute left-0 top-0 bottom-2 w-10 sm:w-16 bg-gradient-to-r from-[#fdfdfd] via-[#fdfdfd]/90 to-transparent pointer-events-none z-10 transition-opacity duration-200 ${
                    canScrollCategoriesLeft ? "opacity-100" : "opacity-0"
                  }`}
                  aria-hidden="true"
                />

                <nav
                  ref={categoriesNavRef}
                  onScroll={checkCategoryScroll}
                  onWheel={(e) => {
                    if (e.deltaY !== 0) {
                      e.currentTarget.scrollLeft += e.deltaY;
                    }
                  }}
                  className="flex items-center gap-3 w-full max-w-full overflow-x-auto pb-2 pr-12 scroll-smooth cursor-grab active:cursor-grabbing touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  aria-label="Freelancer categories"
                >
                  {freelancerCategories.map((category, index) => (
                    <div key={`${category}-${index}`} className="flex items-center shrink-0">
                      {index === 4 && (
                        <span
                          className="w-px h-6 mx-3 bg-[#291d46]/20"
                          aria-hidden="true"
                        />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          setSelectedFreelancerCategory(category);
                          e.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                        }}
                        aria-pressed={selectedFreelancerCategory === category}
                        className={`inline-flex items-center justify-center px-4 py-2 rounded-2xl text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${selectedFreelancerCategory === category
                          ? "bg-[#320053] text-white shadow-sm"
                          : "bg-[#291d46]/10 text-[#454545] hover:bg-[#291d46]/15"
                          }`}
                      >
                        {category}
                      </button>
                    </div>
                  ))}
                </nav>

                {/* Right fade cue — signals more chips off-screen */}
                <div
                  className={`absolute right-0 top-0 bottom-2 w-12 sm:w-20 bg-gradient-to-l from-[#fdfdfd] via-[#fdfdfd]/90 to-transparent pointer-events-none z-10 transition-opacity duration-200 ${
                    canScrollCategoriesRight ? "opacity-100" : "opacity-0"
                  }`}
                  aria-hidden="true"
                />
              </div>
            </div>
          </Reveal>


          {/* Freelancer Expert Cards Track */}
          <div
            id="freelancers-track"
            tabIndex={0}
            aria-label="Top freelancers list"
            className="w-full overflow-x-auto pb-4 pt-1 scroll-smooth cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-1 focus-visible:ring-[#320053] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"

            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
          >
            <div className="flex items-stretch gap-6 min-w-max pr-6">
              {experts.map((expert, idx) => (
                <Reveal
                  key={expert.id}
                  delay={Math.min(idx, 4) * 75}
                  className="flex w-[320px] shrink-0"
                >
                  <article
                    className="flex flex-col justify-between w-full gap-6 p-6 relative bg-[#f5f6fa]/80 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/5 hover:-translate-y-1 transition-transform"
                  >
                    <header className="flex items-start justify-between gap-3 w-full">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex size-10 shrink-0 items-center justify-center rounded-full ring-2 font-bold text-sm"
                          style={{
                            backgroundColor: getAvatarStyle(expert.name).bg,
                            boxShadow: `0 0 0 2px ${getAvatarStyle(expert.name).ring}`,
                            color: getAvatarStyle(expert.name).text,
                          }}
                        >
                          {expert.name[0]}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="font-outfit font-bold text-[#333131] text-base leading-tight truncate">
                            {expert.name}
                          </h3>
                          <p className="font-sans text-[11px] text-[#5D5D7F] leading-tight truncate">
                            {expert.role}
                          </p>
                        </div>
                      </div>

                      <div
                        className="inline-flex items-center gap-1 shrink-0 bg-white/80 px-2 py-1 rounded-full border border-black/5"
                        aria-label={`Rated ${expert.rating} out of 5 from ${expert.reviews} reviews`}
                      >
                        <svg
                          className="w-3.5 h-3.5 text-amber-500 fill-amber-500"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-sans font-semibold text-[#444] text-xs">
                          {expert.rating}
                        </span>
                        <span className="font-sans text-[#888] text-[10px]">
                          ({expert.reviews})
                        </span>
                      </div>
                    </header>

                    <div className="flex flex-col gap-4 w-full">
                      <p className="font-sans text-xs text-[#555] leading-relaxed line-clamp-3">
                        {expert.bio}
                      </p>
                      <ul
                        className="flex flex-wrap items-center gap-2 list-none p-0 m-0"
                        aria-label="Skills"
                      >
                        <li className="px-2.5 py-1 rounded bg-[#291d46]/10 text-[10px] font-medium text-[#454545]">
                          React.js
                        </li>
                        <li className="px-2.5 py-1 rounded bg-[#291d46]/10 text-[10px] font-medium text-[#454545]">
                          Smart Contract
                        </li>
                        <li className="px-2.5 py-1 rounded bg-[#291d46]/10 text-[10px] font-medium text-[#454545]">
                          Canton
                        </li>
                      </ul>
                    </div>

                    <div className="w-full h-px bg-black/5" aria-hidden="true" />

                    <footer className="flex items-center justify-between w-full pt-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#777] leading-tight">
                          Starting Rate
                        </span>
                        <span className="font-outfit font-bold text-[#320053] text-sm">
                          {expert.rate}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAction(`Hire ${expert.name}`)}
                        className="inline-flex items-center px-4 py-2 bg-[#320053] hover:bg-[#25003d] text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                        aria-label={`Hire ${expert.name}`}
                      >
                        Hire Expert
                      </button>
                    </footer>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>


        </section>
      </div>

      {/* ── Trending Creator Articles Section ── */}
      <TrendingArticlesSection />

      {/* ── Why Choose Canafri? section ── */}
      <WhyCanafriSection />

      {/* ── For Creators (Testimonials) Section ── */}
      <TestimonialsSection />

      {/* ── FAQ Section ── */}
      <FAQSection />

      {/* ── CTA / Get Started Section ── */}
      <CTASection />

      {/* ── Landing Footer ── */}
      <LandingFooter />

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </main>
  );
};

export default HeroSection;
