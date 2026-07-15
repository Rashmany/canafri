// ─── CanaFri Search Service ───────────────────────────────────────────────────
//
// This module defines all search types and handles local simulation of searches.
// Updated to support exact field mappings for CanaFri's core page component layouts.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

// ─── Entity Types ─────────────────────────────────────────────────────────────

export interface SearchUser {
  type: "user" | "freelancer";
  id: string;
  name: string;
  handle: string;
  bio: string;
  verified: boolean;
  online: boolean;
  rating: number;
  reviews: number;
  followers: number;
  skills: string[];
  country: string;
  language: string;
  completionRate: number;
  responseRate: number;
  score: number;
  // Match ReviewProposalsPage candidate fields
  title: string;
  location: string;
  rate: string;
  earned: string;
  badge?: string;
  badgeColor?: "green" | "purple";
  status?: string;
  statusColor?: "green" | "purple" | "amber" | "red";
  coverLetter?: string;
}

export interface SearchService {
  type: "service";
  id: string;
  title: string;
  description: string;
  sellerName: string;
  sellerHandle: string;
  category: string;
  tags: string[];
  rating: number;
  reviews: number;
  startingPrice: number;
  deliveryDays: number;
  score: number;
  // Match GigsPage stats fields
  views: number;
  orders: number;
  ctr: string;
}

export interface SearchArticle {
  type: "article";
  id: string;
  title: string;
  excerpt: string;
  authorName: string;
  authorHandle: string;
  category: string;
  tags: string[];
  readTime: number;
  publishedAt: string;
  score: number;
  // Match Dashboard PostCard fields
  stakeReward?: string;
  topic?: string;
  publication?: string;
  image?: string;
  date: string;
  text: string;
  name: string;
}

export interface SearchJob {
  type: "job";
  id: string;
  title: string;
  description: string;
  clientName: string;
  budget: string;
  category: string;
  isRemote: boolean;
  experienceLevel: "Entry" | "Mid" | "Senior";
  postedAt: string;
  score: number;
  // Match FindJobPage list row fields
  payType: string;
  pay: string;
  payUnit: string;
  level: string;
  estimate: string;
  tags: string[];
  proposals: number;
  proposalsInReview: boolean;
  timeAgo: string;
}

export interface SearchTag {
  type: "tag";
  id: string;
  name: string;
  postCount: number;
  trending: boolean;
  score: number;
}

export type SearchResult = SearchUser | SearchService | SearchArticle | SearchJob | SearchTag;

export interface SearchApiResponse {
  query: string;
  totalCount: number;
  users: SearchUser[];
  services: SearchService[];
  articles: SearchArticle[];
  jobs: SearchJob[];
  tags: SearchTag[];
  suggestions: string[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_USERS: SearchUser[] = [
  {
    type: "freelancer",
    id: "u1",
    name: "James Ade",
    handle: "@jamesade",
    bio: "Full-stack developer specialising in React and Node.js. Delivered over 50 projects with 100% completion rate.",
    verified: true,
    online: true,
    rating: 4.9,
    reviews: 312,
    followers: 2840,
    skills: ["React", "Node.js", "TypeScript"],
    country: "Nigeria",
    language: "English",
    completionRate: 98,
    responseRate: 99,
    score: 100,
    title: "Senior Full Stack React Engineer",
    location: "Lagos, Nigeria",
    rate: "450 CC / hr",
    earned: "15k+ CC earned",
    badge: "Top Rated",
    badgeColor: "green",
    status: "Available Now",
    statusColor: "green",
    coverLetter: "Hi! I am James. I specialize in building highly responsive, performant React dashboards. I have read your requirements and can deliver your project with premium quality, clean code, and fast turnarounds.",
  },
  {
    type: "freelancer",
    id: "u2",
    name: "Amara Chibueze",
    handle: "@amarachi",
    bio: "UI/UX designer with a love for clean, accessible, and high-fidelity prototypes.",
    verified: true,
    online: false,
    rating: 4.8,
    reviews: 194,
    followers: 1620,
    skills: ["Figma", "UI/UX", "Prototyping"],
    country: "Nigeria",
    language: "English",
    completionRate: 97,
    responseRate: 95,
    score: 90,
    title: "Lead UI/UX Product Designer",
    location: "Abuja, Nigeria",
    rate: "300 CC / hr",
    earned: "8k+ CC earned",
    badge: "Verified Creator",
    badgeColor: "purple",
    status: "Busy",
    statusColor: "amber",
    coverLetter: "Hey there! I am interested in helping you design your mobile application. I have designed over 20+ successful apps in Figma, crafting cohesive design systems and interactive prototypes.",
  },
  {
    type: "user",
    id: "u3",
    name: "Alex Daml",
    handle: "@alexdaml",
    bio: "Smart contract developer and blockchain security researcher.",
    verified: true,
    online: true,
    rating: 4.7,
    reviews: 88,
    followers: 980,
    skills: ["Solidity", "Daml", "Web3"],
    country: "Germany",
    language: "English",
    completionRate: 95,
    responseRate: 92,
    score: 88,
    title: "Smart Contract Auditor & Architect",
    location: "Berlin, Germany",
    rate: "600 CC / hr",
    earned: "24k+ CC earned",
    badge: "Top Rated",
    badgeColor: "green",
    status: "Active Dispute Mode",
    statusColor: "red",
    coverLetter: "Hello, I am a security-focused Solidity developer. I can design secure Daml / Solidity escrow smart contracts for your web3 platforms. Let's build a safe system.",
  },
  {
    type: "freelancer",
    id: "u4",
    name: "Sina Front",
    handle: "@sinafront",
    bio: "Frontend engineer focused on Next.js, CSS animations, and layout speed optimizations.",
    verified: false,
    online: true,
    rating: 4.6,
    reviews: 57,
    followers: 430,
    skills: ["Next.js", "React", "CSS"],
    country: "Iran",
    language: "English",
    completionRate: 93,
    responseRate: 90,
    score: 75,
    title: "Next.js Theme & Interface Specialist",
    location: "Tehran, Iran",
    rate: "250 CC / hr",
    earned: "3k+ CC earned",
    status: "Open for gigs",
    statusColor: "green",
  },
  {
    type: "user",
    id: "u5",
    name: "Maria Solano",
    handle: "@mariasolano",
    bio: "Content creator, marketer and Web3 community coordinator.",
    verified: true,
    online: false,
    rating: 4.5,
    reviews: 42,
    followers: 3200,
    skills: ["Content", "Web3", "Education"],
    country: "Spain",
    language: "Spanish",
    completionRate: 90,
    responseRate: 88,
    score: 70,
    title: "Web3 Educator & Marketer",
    location: "Madrid, Spain",
    rate: "200 CC / hr",
    earned: "4k+ CC earned",
  },
  {
    type: "freelancer",
    id: "u6",
    name: "David Okoro",
    handle: "@davidokoro",
    bio: "React Native developer building cross-platform iOS and Android mobile apps.",
    verified: false,
    online: true,
    rating: 4.4,
    reviews: 29,
    followers: 210,
    skills: ["React Native", "iOS", "Android"],
    country: "Nigeria",
    language: "English",
    completionRate: 88,
    responseRate: 85,
    score: 65,
    title: "Mobile App Developer",
    location: "Enugu, Nigeria",
    rate: "280 CC / hr",
    earned: "2k+ CC earned",
  },
  {
    type: "user",
    id: "u7",
    name: "Lena Koch",
    handle: "@lenakoch",
    bio: "Digital artist and NFT creator with 5 years experience.",
    verified: true,
    online: false,
    rating: 4.8,
    reviews: 76,
    followers: 5400,
    skills: ["NFT", "Digital Art", "Illustration"],
    country: "Germany",
    language: "German",
    completionRate: 96,
    responseRate: 94,
    score: 85,
    title: "NFT Concept Illustrator",
    location: "Munich, Germany",
    rate: "500 CC / hr",
    earned: "11k+ CC earned",
  },
  {
    type: "freelancer",
    id: "u8",
    name: "Carlos Vega",
    handle: "@carlosvega",
    bio: "Backend engineer with expertise in microservices and microservices DevOps.",
    verified: false,
    online: true,
    rating: 4.3,
    reviews: 18,
    followers: 145,
    skills: ["Go", "Docker", "Kubernetes"],
    country: "Mexico",
    language: "Spanish",
    completionRate: 87,
    responseRate: 80,
    score: 60,
    title: "Kubernetes DevOps Engineer",
    location: "Guadalajara, Mexico",
    rate: "400 CC / hr",
    earned: "5k+ CC earned",
  },
];

const MOCK_SERVICES: SearchService[] = [
  { type: "service", id: "s1", title: "React Dashboard Development", description: "I will build a professional React dashboard with charts and real-time data.", sellerName: "James Ade", sellerHandle: "@jamesade", category: "Web Development", tags: ["React", "Dashboard", "TypeScript"], rating: 4.9, reviews: 87, startingPrice: 150, deliveryDays: 7, score: 100, views: 482, orders: 14, ctr: "5.2%" },
  { type: "service", id: "s2", title: "Smart Contract Development on Ethereum", description: "Solidity smart contracts audited and deployed to mainnet or testnet.", sellerName: "Alex Daml", sellerHandle: "@alexdaml", category: "Blockchain", tags: ["Solidity", "Ethereum", "Web3"], rating: 4.8, reviews: 54, startingPrice: 300, deliveryDays: 10, score: 92, views: 290, orders: 8, ctr: "4.8%" },
  { type: "service", id: "s3", title: "UI/UX Design in Figma", description: "Complete UI/UX design with responsive prototypes and design system.", sellerName: "Amara Chibueze", sellerHandle: "@amarachi", category: "Design", tags: ["Figma", "UI/UX", "Design System"], rating: 4.8, reviews: 63, startingPrice: 120, deliveryDays: 5, score: 90, views: 184, orders: 11, ctr: "6.1%" },
  { type: "service", id: "s4", title: "Next.js Full-Stack Web App", description: "Build a production-ready Next.js app with API routes, auth, and deployment.", sellerName: "Sina Front", sellerHandle: "@sinafront", category: "Web Development", tags: ["Next.js", "Full-Stack", "React"], rating: 4.6, reviews: 32, startingPrice: 200, deliveryDays: 14, score: 78, views: 120, orders: 3, ctr: "3.1%" },
  { type: "service", id: "s5", title: "React Native Mobile App", description: "Cross-platform iOS and Android app built with React Native and Expo.", sellerName: "David Okoro", sellerHandle: "@davidokoro", category: "Mobile", tags: ["React Native", "iOS", "Android"], rating: 4.4, reviews: 19, startingPrice: 250, deliveryDays: 21, score: 68, views: 95, orders: 2, ctr: "2.1%" },
  { type: "service", id: "s6", title: "NFT Collection Art and Metadata", description: "Generative NFT art collection with traits, rarity, and metadata setup.", sellerName: "Lena Koch", sellerHandle: "@lenakoch", category: "NFT and Art", tags: ["NFT", "Digital Art", "Generative"], rating: 4.8, reviews: 41, startingPrice: 500, deliveryDays: 14, score: 83, views: 167, orders: 5, ctr: "4.2%" },
];

const MOCK_ARTICLES: SearchArticle[] = [
  { type: "article", id: "a1", title: "Learn React in 2026: The Complete Guide", excerpt: "React continues to evolve. Here is everything you need to know to get started with hooks, RSC, and modern patterns.", authorName: "James Ade", authorHandle: "@jamesade", category: "Development", tags: ["React", "JavaScript", "Frontend"], readTime: 12, publishedAt: "2026-06-15", score: 95, stakeReward: "5 CC Read-Stake Required", topic: "React", publication: "React Daily", date: "Jun. 15", text: "React continues to evolve. In 2026, the focus has shifted heavily to React Server Components (RSC), hybrid client-server routing, and optimized builds. This comprehensive guide covers hooks, suspense, hydration strategies, and how to write clean component structures.", name: "James Ade" },
  { type: "article", id: "a2", title: "Blockchain Security: Pitfalls in Contracts", excerpt: "A deep dive into reentrancy, integer overflows, and front-running attacks in Solidity.", authorName: "Alex Daml", authorHandle: "@alexdaml", category: "Blockchain", tags: ["Solidity", "Security", "Web3"], readTime: 15, publishedAt: "2026-05-28", score: 90, stakeReward: "10 CC Read-Stake Required", topic: "Solidity", publication: "Decentralized Review", date: "May. 28", text: "Writing secure Solidity code is critical. Millions are lost yearly to reentrancy bugs, incorrect access control, and flash loan attacks. We explore detailed code snippets highlighting these vulnerabilities and how to audit them properly.", name: "Alex Daml" },
  { type: "article", id: "a3", title: "Designing for Web3 UX Patterns", excerpt: "How to design interfaces that make blockchain interactions feel simple and safe.", authorName: "Amara Chibueze", authorHandle: "@amarachi", category: "Design", tags: ["UI/UX", "Web3", "Design"], readTime: 8, publishedAt: "2026-06-02", score: 85, stakeReward: "5 CC Read-Stake Required", topic: "UI/UX", publication: "Design Hub", date: "Jun. 02", text: "UX design in Web3 remains one of the largest bottlenecks for mainstream adoption. Users must feel safe when signing payloads, staking CC tokens, or interacting with escrow contracts. Let's simplify design systems and micro-interactions.", name: "Amara Chibueze" },
  { type: "article", id: "a4", title: "Next.js 15: What is New in Frontend", excerpt: "Breaking changes, new features, and a migration guide for Next.js 15.", authorName: "Sina Front", authorHandle: "@sinafront", category: "Development", tags: ["Next.js", "React", "Web"], readTime: 10, publishedAt: "2026-06-20", score: 82, stakeReward: "5 CC Read-Stake Required", topic: "Next.js", publication: "Frontend Weekly", date: "Jun. 20", text: "Next.js 15 brings major performance changes, changes to caching behavior, and a tighter integration with React 19. Learn how to migrate your existing layout files and resolve build deprecations quickly.", name: "Sina Front" },
  { type: "article", id: "a5", title: "How to Price Your Gigs & Freelance Services", excerpt: "Strategies for pricing your work competitively while ensuring fair compensation.", authorName: "Maria Solano", authorHandle: "@mariasolano", category: "Freelancing", tags: ["Freelancing", "Business", "Pricing"], readTime: 6, publishedAt: "2026-07-01", score: 78, stakeReward: "3 CC Read-Stake Required", topic: "Freelancing", publication: "Freelancer Hub", date: "Jul. 01", text: "As freelance markets adapt in 2026, structuring your rates correctly is essential. We analyze flat rates vs hourly rates, deposit guidelines, escrow protection schemes, and how to communicate value clearly to clients.", name: "Maria Solano" },
];

const MOCK_JOBS: SearchJob[] = [
  { type: "job", id: "j1", title: "Senior React Developer", description: "Build a Web3 dashboard with React, TypeScript, and wagmi hooks. Need someone with solid frontend layout skills.", clientName: "John Trek", budget: "400 CC", category: "Web Development", isRemote: true, experienceLevel: "Senior", postedAt: "2 hours ago", score: 95, payType: "Fixed-price", pay: "400 CC", payUnit: "Est. Budget", level: "Expert", estimate: "Est. Time: 1 month", tags: ["React", "TypeScript", "Web3"], proposals: 8, proposalsInReview: true, timeAgo: "2 hours ago" },
  { type: "job", id: "j2", title: "Smart Contract Auditor", description: "Audit a DeFi protocol for security vulnerabilities and produce a detailed report. Experienced auditor only.", clientName: "CryptoCo", budget: "800 CC", category: "Blockchain", isRemote: true, experienceLevel: "Senior", postedAt: "1 day ago", score: 90, payType: "Fixed-price", pay: "800 CC", payUnit: "Est. Budget", level: "Expert", estimate: "Est. Time: 2 weeks", tags: ["Solidity", "Security", "Audit"], proposals: 15, proposalsInReview: false, timeAgo: "1 day ago" },
  { type: "job", id: "j3", title: "UI/UX Designer for Mobile App", description: "Design a cross-platform mobile app with modern, accessible UI patterns in Figma.", clientName: "AppVentures", budget: "250 CC", category: "Design", isRemote: true, experienceLevel: "Mid", postedAt: "3 hours ago", score: 85, payType: "Hourly", pay: "25 CC", payUnit: "/ hr", level: "Intermediate", estimate: "Est. Time: 3 months", tags: ["Figma", "UI/UX", "Mobile"], proposals: 12, proposalsInReview: true, timeAgo: "3 hours ago" },
  { type: "job", id: "j4", title: "Next.js Full-Stack Engineer", description: "Build a SaaS product with Next.js, Prisma, and PostgreSQL. Local layout adjustments needed.", clientName: "StartupXYZ", budget: "600 CC", category: "Web Development", isRemote: false, experienceLevel: "Mid", postedAt: "5 days ago", score: 80, payType: "Fixed-price", pay: "600 CC", payUnit: "Est. Budget", level: "Intermediate", estimate: "Est. Time: 2 months", tags: ["Next.js", "Prisma", "PostgreSQL"], proposals: 4, proposalsInReview: false, timeAgo: "5 days ago" },
  { type: "job", id: "j5", title: "Technical Content Writer - Blockchain", description: "Write in-depth articles on DeFi, NFTs, and blockchain fundamentals.", clientName: "CanaFri Media", budget: "100 CC", category: "Content", isRemote: true, experienceLevel: "Entry", postedAt: "1 hour ago", score: 72, payType: "Hourly", pay: "15 CC", payUnit: "/ hr", level: "Entry", estimate: "Est. Time: Ongoing", tags: ["Web3", "Content", "Writing"], proposals: 1, proposalsInReview: false, timeAgo: "1 hour ago" },
];

const MOCK_TAGS: SearchTag[] = [
  { type: "tag", id: "t1", name: "React", postCount: 1240, trending: true, score: 100 },
  { type: "tag", id: "t2", name: "Blockchain", postCount: 980, trending: true, score: 98 },
  { type: "tag", id: "t3", name: "AI", postCount: 2100, trending: true, score: 97 },
  { type: "tag", id: "t4", name: "Web3", postCount: 870, trending: true, score: 95 },
  { type: "tag", id: "t5", name: "Solidity", postCount: 640, trending: false, score: 88 },
  { type: "tag", id: "t6", name: "NextJS", postCount: 720, trending: true, score: 90 },
  { type: "tag", id: "t7", name: "RemoteWork", postCount: 1100, trending: true, score: 93 },
  { type: "tag", id: "t8", name: "TypeScript", postCount: 850, trending: false, score: 87 },
  { type: "tag", id: "t9", name: "Figma", postCount: 420, trending: false, score: 75 },
  { type: "tag", id: "t10", name: "NFT", postCount: 560, trending: false, score: 78 },
];

export const POPULAR_SKILLS = ["React", "Solidity", "UI/UX", "Figma", "Smart Contracts", "TypeScript", "Next.js", "Node.js", "Web3", "Blockchain"];

export const TRENDING_TERMS = ["#AI", "#Blockchain", "#RemoteWork", "#NextJS", "#Web3", "#Solidity"];

export const POPULAR_CREATORS: SearchUser[] = MOCK_USERS
  .filter((u) => u.verified)
  .sort((a, b) => b.followers - a.followers)
  .slice(0, 4);

// ─── Fuzzy Matching ───────────────────────────────────────────────────────────

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

function fuzzyMatch(haystack: string, needle: string): boolean {
  const n = normalise(needle);
  const h = normalise(haystack);
  if (h.includes(n)) return true;
  if (n.length <= 3) return h.includes(n);
  for (let i = 0; i <= n.length - 3; i++) {
    if (h.includes(n.slice(i, i + Math.ceil(n.length * 0.7)))) return true;
  }
  return false;
}

function scoreResult<T extends { score: number }>(item: T, query: string, fields: string[]): number {
  const q = normalise(query);
  let bonus = 0;
  for (const field of fields) {
    const v = normalise(field);
    if (v === q) bonus += 30;
    else if (v.startsWith(q)) bonus += 20;
    else if (v.includes(q)) bonus += 10;
  }
  return Math.min(100, item.score + bonus);
}

// ─── Core Search Function ─────────────────────────────────────────────────────

export function mockSearchAll(query: string): SearchApiResponse {
  const q = query.trim();
  if (q.length < 2) {
    return { query: q, totalCount: 0, users: [], services: [], articles: [], jobs: [], tags: [], suggestions: [] };
  }

  const users = MOCK_USERS
    .filter((u) => [u.name, u.title, u.bio, ...u.skills].some((f) => fuzzyMatch(f, q)))
    .map((u) => ({ ...u, score: scoreResult(u, q, [u.name, u.title, u.bio, ...u.skills]) + (u.verified ? 10 : 0) }))
    .sort((a, b) => b.score - a.score);

  const services = MOCK_SERVICES
    .filter((s) => [s.title, s.description, s.category, ...s.tags].some((f) => fuzzyMatch(f, q)))
    .map((s) => ({ ...s, score: scoreResult(s, q, [s.title, s.description, ...s.tags]) }))
    .sort((a, b) => b.score - a.score);

  const articles = MOCK_ARTICLES
    .filter((a) => [a.title, a.excerpt, a.category, ...a.tags].some((f) => fuzzyMatch(f, q)))
    .map((a) => ({ ...a, score: scoreResult(a, q, [a.title, a.excerpt, ...a.tags]) }))
    .sort((a, b) => b.score - a.score);

  const jobs = MOCK_JOBS
    .filter((j) => [j.title, j.description, j.category, ...j.tags].some((f) => fuzzyMatch(f, q)))
    .map((j) => ({ ...j, score: scoreResult(j, q, [j.title, j.description, ...j.tags]) }))
    .sort((a, b) => b.score - a.score);

  const tags = MOCK_TAGS
    .filter((t) => fuzzyMatch(t.name, q))
    .map((t) => ({ ...t, score: scoreResult(t, q, [t.name]) + (t.trending ? 5 : 0) }))
    .sort((a, b) => b.score - a.score);

  const suggestions = [
    ...MOCK_USERS.map((u) => u.name),
    ...MOCK_SERVICES.map((s) => s.title),
    ...MOCK_TAGS.map((t) => t.name),
    ...POPULAR_SKILLS,
  ]
    .filter((s) => normalise(s).includes(normalise(q)) && normalise(s) !== normalise(q))
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 6);

  const totalCount = users.length + services.length + articles.length + jobs.length + tags.length;
  return { query: q, totalCount, users, services, articles, jobs, tags, suggestions };
}

// ─── Debounce ─────────────────────────────────────────────────────────────────

export function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ─── Search History ───────────────────────────────────────────────────────────

const HISTORY_KEY = "canafri_search_history";
const MAX_HISTORY = 10;

export function getSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); } catch { return []; }
}

export function addToSearchHistory(query: string): void {
  if (typeof window === "undefined" || !query.trim()) return;
  const existing = getSearchHistory().filter((q) => q !== query.trim());
  localStorage.setItem(HISTORY_KEY, JSON.stringify([query.trim(), ...existing].slice(0, MAX_HISTORY)));
}

export function removeFromSearchHistory(query: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(getSearchHistory().filter((q) => q !== query)));
}

export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
}
