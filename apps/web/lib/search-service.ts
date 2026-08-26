// ─── CanaFri Dynamic Search Service ──────────────────────────────────────────
//
// Handles dynamic searching across real sellers, gigs, published articles, and open jobs.
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
  title: string;
  location: string;
  rate: string;
  earned: string;
  badge?: string;
  badgeColor?: "green" | "purple";
  status?: string;
  statusColor?: "green" | "purple" | "amber" | "red";
  coverLetter?: string;
  avatarUrl?: string;
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
  views: number;
  orders: number;
  ctr: string;
  image?: string;
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
  payType: string;
  pay: string;
  payUnit: string;
  level: string;
  estimate: string;
  tags: string[];
  timeAgo?: string;
  proposals?: number;
  proposalsInReview?: number;
}

export interface SearchTag {
  id?: string;
  name: string;
  category: string;
  count: number;
  postCount: number;
  trending: boolean;
  score: number;
}

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

// ─── In-Memory Dynamic Cache ──────────────────────────────────────────────────

let liveUsers: SearchUser[] = [];
let liveServices: SearchService[] = [];
let liveArticles: SearchArticle[] = [];
let liveJobs: SearchJob[] = [];
let liveTags: SearchTag[] = [];
let isInitialised = false;

export async function initLiveSearchData(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const [sellersRes, jobsRes, contentRes] = await Promise.allSettled([
      fetch("/api/users/sellers"),
      fetch("/api/jobs"),
      fetch("/api/content"),
    ]);

    // 1. Process Sellers
    if (sellersRes.status === "fulfilled" && sellersRes.value.ok) {
      const data = await sellersRes.value.json();
      if (data?.sellers && Array.isArray(data.sellers)) {
        liveUsers = data.sellers.map((s: any) => ({
          type: "freelancer",
          id: String(s.id),
          name: s.name || "Seller",
          handle: s.username ? (s.username.startsWith("@") ? s.username : `@${s.username}`) : "@seller",
          bio: s.bio || s.title || "Canton & Web3 Specialist",
          verified: !!s.isVerified,
          online: !!s.isOnline,
          rating: s.rating ?? 5.0,
          reviews: s.reviewsCount ?? 0,
          followers: 120,
          skills: Array.isArray(s.skills) ? s.skills : [],
          country: s.location || "Global",
          language: "English",
          completionRate: 99,
          responseRate: 98,
          score: 80,
          title: s.title || "Freelancer",
          location: s.location || "Global",
          rate: `${s.minProjectBudget || "100 CC"}`,
          earned: s.totalEarnings || "0 CC earned",
          badge: s.level || "Verified",
          badgeColor: "purple",
          status: s.isOnline ? "Online" : "Available",
          statusColor: "green",
          avatarUrl: s.avatar,
        }));

        // Extract services/gigs from sellers
        const servicesList: SearchService[] = [];
        data.sellers.forEach((s: any) => {
          if (Array.isArray(s.gigs)) {
            s.gigs.forEach((g: any) => {
              servicesList.push({
                type: "service",
                id: String(g.id || `gig-${s.id}`),
                title: g.title,
                description: s.bio || g.title,
                sellerName: s.name,
                sellerHandle: s.username,
                category: "Programming & Tech",
                tags: Array.isArray(s.skills) ? s.skills : ["Canton"],
                rating: g.rating || 5.0,
                reviews: g.reviews || 0,
                startingPrice: parseInt(g.price) || 100,
                deliveryDays: 3,
                score: 85,
                views: 120,
                orders: 4,
                ctr: "5.0%",
                image: g.image,
              });
            });
          }
        });
        if (servicesList.length > 0) {
          liveServices = servicesList;
        }
      }
    }

    // 2. Process Jobs
    if (jobsRes.status === "fulfilled" && jobsRes.value.ok) {
      const data = await jobsRes.value.json();
      if (data?.jobs && Array.isArray(data.jobs)) {
        liveJobs = data.jobs.map((j: any) => ({
          type: "job",
          id: String(j.id),
          title: j.title || "Job Listing",
          description: j.description || "",
          clientName: j.client?.displayName || j.client?.username || "Client",
          budget: `${j.amountCC ?? 100} CC`,
          category: j.category || "Development",
          isRemote: true,
          experienceLevel: "Mid",
          postedAt: j.createdAt ? new Date(j.createdAt).toLocaleDateString() : "Recent",
          timeAgo: j.createdAt ? new Date(j.createdAt).toLocaleDateString() : "Recent",
          score: 80,
          payType: "Fixed Price",
          pay: `${j.amountCC ?? 100} CC`,
          payUnit: "Est. Budget",
          level: "Intermediate",
          estimate: `${j.deadlineDays ?? 7} days`,
          tags: Array.isArray(j.skills) ? j.skills : [j.category || "General"],
          proposals: j.proposalsCount ?? 0,
          proposalsInReview: 0,
        }));
      }
    }

    // 3. Process Content/Articles
    if (contentRes.status === "fulfilled" && contentRes.value.ok) {
      const data = await contentRes.value.json();
      if (data?.content && Array.isArray(data.content)) {
        liveArticles = data.content.map((c: any) => ({
          type: "article",
          id: String(c.id),
          title: c.title,
          excerpt: (c.body || c.title || "").replace(/<[^>]*>/g, "").slice(0, 160) + "…",
          authorName: c.creator?.displayName || c.creator?.username || "Creator",
          authorHandle: c.creator?.username ? `@${c.creator.username}` : "@creator",
          category: c.topic || "Canton & Web3",
          tags: [c.topic || "Blockchain", "Daml"],
          readTime: 5,
          publishedAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Recent",
          score: 85,
          stakeReward: `${c.priceCC || 5} CC Read-Stake`,
          topic: c.topic,
          date: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Recent",
          text: c.body || c.title,
          name: c.title,
        }));
      }
    }

    // Generate tags from skills and topics
    const tagMap = new Map<string, number>();
    liveUsers.forEach((u) => u.skills.forEach((s) => tagMap.set(s, (tagMap.get(s) || 0) + 1)));
    liveJobs.forEach((j) => j.tags.forEach((t) => tagMap.set(t, (tagMap.get(t) || 0) + 1)));
    liveArticles.forEach((a) => a.tags.forEach((t) => tagMap.set(t, (tagMap.get(t) || 0) + 1)));

    liveTags = Array.from(tagMap.entries()).map(([name, count], index) => ({
      id: `tag-${index + 1}`,
      name,
      category: "Topic",
      count,
      postCount: count,
      trending: count > 1,
      score: count * 10,
    }));

    isInitialised = true;
  } catch (err) {
    console.error("Failed to initialize live search cache:", err);
  }
}

// Auto-trigger load
if (typeof window !== "undefined") {
  initLiveSearchData();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalise(str: string): string {
  return str.toLowerCase().trim();
}

function fuzzyMatch(haystack: string, needle: string): boolean {
  const h = normalise(haystack);
  const n = normalise(needle);
  if (!n) return true;
  if (h.includes(n)) return true;
  const words = n.split(/\s+/);
  return words.every((w) => h.includes(w));
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

// ─── Search Functions ─────────────────────────────────────────────────────────

export function mockSearchAll(query: string): SearchApiResponse {
  return searchAll(query);
}

export function searchAll(query: string): SearchApiResponse {
  const q = query.trim();
  if (q.length < 2) {
    return { query: q, totalCount: 0, users: [], services: [], articles: [], jobs: [], tags: [], suggestions: [] };
  }

  // Ensure initialization check
  if (!isInitialised && typeof window !== "undefined") {
    initLiveSearchData();
  }

  const users = liveUsers
    .filter((u) => [u.name, u.handle, u.title, u.bio, ...u.skills].some((f) => fuzzyMatch(f, q)))
    .map((u) => ({ ...u, score: scoreResult(u, q, [u.name, u.title, u.bio, ...u.skills]) + (u.verified ? 10 : 0) }))
    .sort((a, b) => b.score - a.score);

  const services = liveServices
    .filter((s) => [s.title, s.description, s.category, ...s.tags].some((f) => fuzzyMatch(f, q)))
    .map((s) => ({ ...s, score: scoreResult(s, q, [s.title, s.description, ...s.tags]) }))
    .sort((a, b) => b.score - a.score);

  const articles = liveArticles
    .filter((a) => [a.title, a.excerpt, a.category, ...a.tags].some((f) => fuzzyMatch(f, q)))
    .map((a) => ({ ...a, score: scoreResult(a, q, [a.title, a.excerpt, ...a.tags]) }))
    .sort((a, b) => b.score - a.score);

  const jobs = liveJobs
    .filter((j) => [j.title, j.description, j.category, ...j.tags].some((f) => fuzzyMatch(f, q)))
    .map((j) => ({ ...j, score: scoreResult(j, q, [j.title, j.description, ...j.tags]) }))
    .sort((a, b) => b.score - a.score);

  const tags = liveTags
    .filter((t) => fuzzyMatch(t.name, q))
    .map((t) => ({ ...t, score: scoreResult(t, q, [t.name]) + (t.trending ? 5 : 0) }))
    .sort((a, b) => b.score - a.score);

  const suggestions = [
    ...liveUsers.map((u) => u.name),
    ...liveServices.map((s) => s.title),
    ...liveJobs.map((j) => j.title),
    ...liveTags.map((t) => t.name),
  ]
    .filter((s) => normalise(s).includes(normalise(q)) && normalise(s) !== normalise(q))
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 6);

  const totalCount = users.length + services.length + articles.length + jobs.length + tags.length;
  return { query: q, totalCount, users, services, articles, jobs, tags, suggestions };
}

export async function searchAllAsync(query: string): Promise<SearchApiResponse> {
  if (!isInitialised) {
    await initLiveSearchData();
  }
  return searchAll(query);
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
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
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
