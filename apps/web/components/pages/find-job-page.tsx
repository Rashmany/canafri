'use client';

import { useState, useRef } from 'react';
import ApplyJobPage from '@/components/pages/apply-job-page';

// ─── Types & Mock Data ────────────────────────────────────────────────────────

export interface Job {
  id: number;
  title: string;
  timeAgo: string;
  pay: string;
  payType: string;
  payUnit: string;
  level: string;
  estimate: string;
  description: string;
  tags: string[];
  paymentVerified: boolean;
  proposals: number;
  rating: number;
  spent: string;
  location: string;
  proposalsInReview?: boolean;
}

export const JOBS: Job[] = [
  {
    id: 1,
    title: "Full Stack Web Developer",
    timeAgo: "2 days ago",
    pay: "$20-30",
    payType: "Hourly",
    payUnit: "Worth of CC",
    level: "Expert",
    estimate: "Est - Time: More than 3months, 30+ hrs/week",
    description:
      "We are building a Canton wallet dashboard for our DeFi platform and need an experienced React and Next.js developer to build the complete frontend. The dashboard should connect to a Canton participant node via the Ledger API and display real-time CC balances, transaction history, and staking information.",
    tags: ["smart contract", "Daml developer", "React", "TypeScript"],
    paymentVerified: true,
    proposals: 5,
    rating: 4,
    spent: "20k+ CC Spent",
    location: "Turkey",
    proposalsInReview: true,
  },
  {
    id: 2,
    title: "Senior Daml Smart Contract Developer",
    timeAgo: "3 days ago",
    pay: "$40-60",
    payType: "Hourly",
    payUnit: "Worth of CC",
    level: "Expert",
    estimate: "Est - Time: 1 to 3 months, 20+ hrs/week",
    description:
      "Looking for a specialized Daml developer to write secure multi-party agreements and asset tokenization contracts on the Canton network.",
    tags: ["smart contract", "Daml", "Canton network", "Ledger API"],
    paymentVerified: true,
    proposals: 12,
    rating: 5,
    spent: "50k+ CC Spent",
    location: "United Kingdom",
    proposalsInReview: false,
  },
  {
    id: 3,
    title: "Frontend Integration Engineer (Next.js)",
    timeAgo: "5 days ago",
    pay: "$1,500",
    payType: "Fixed-price",
    payUnit: "CC Budget",
    level: "Intermediate",
    estimate: "Est - Time: Less than 1 month",
    description:
      "Integrate predefined Tailwind components with backend Fastify WebSockets to deliver real-time order matching updates.",
    tags: ["React", "Next.js", "Tailwind CSS", "WebSockets"],
    paymentVerified: false,
    proposals: 8,
    rating: 3,
    spent: "5k+ CC Spent",
    location: "Turkey",
    proposalsInReview: true,
  },
];

// ─── Custom UI Icons ──────────────────────────────────────────────────────────

function StarRating({ filled, total = 5 }: { filled: number; total?: number }) {
  return (
    <div className="flex items-center gap-[3px]">
      {Array.from({ length: total }, (_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 0L9.79611 5.52786H15.6085L10.9062 8.94427L12.7023 14.4721L8 11.0557L3.29772 14.4721L5.09383 8.94427L0.391548 5.52786H6.20389L8 0Z"
            fill={i < filled ? "#FF9529" : "#A0A0A0"}
          />
        </svg>
      ))}
    </div>
  );
}

export function Tag({ label }: { label: string }) {
  return (
    <span className="flex-shrink-0 px-2.5 py-[5px] rounded-[3px] bg-[#8C5CFF]/10 dark:bg-[rgba(140,92,255,0.15)] text-[#8C5CFF] text-[10px] leading-[13px] whitespace-nowrap">
      {label}
    </span>
  );
}

export function ScrollableTags({ tags }: { tags: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) return;

    const offset = direction === 'left' ? -150 : 150;
    const start = container.scrollLeft;
    const change = offset;
    const duration = 400; // 400ms
    let startTime: number | null = null;

    const animateScroll = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease Out Quadratic easing
      const ease = progress * (2 - progress);

      container.scrollLeft = start + change * ease;

      if (elapsed < duration) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  return (
    <div className="relative flex items-center w-full group overflow-hidden">
      {/* Left Scroll Arrow */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          scroll('left');
        }}
        className="absolute left-0 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 dark:bg-card/90 border border-border text-foreground/80 hover:text-primary transition-all shadow-md opacity-0 group-hover:opacity-100"
        aria-label="Scroll left"
      >
        <svg width="6" height="10" viewBox="0 0 6 11" fill="none" className="rotate-180">
          <path d="M0 0.883333L0.884166 0L5.7 4.81417C5.77763 4.89131 5.83924 4.98304 5.88128 5.08408C5.92332 5.18512 5.94496 5.29348 5.94496 5.40292C5.94496 5.51235 5.92332 5.62071 5.88128 5.72175C5.83924 5.8228 5.77763 5.91453 5.7 5.99167L0.884166 10.8083L0.000833035 9.925L4.52083 5.40417L0 0.883333Z" fill="currentColor" />
        </svg>
      </button>

      {/* Left Edge Blur Overlay */}
      <div className="absolute left-6 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-r from-card via-card/40 to-transparent z-10" />

      {/* Tags Wrapper */}
      <div
        ref={scrollRef}
        className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-6 mx-6"
      >
        {tags.map((tag) => (
          <Tag key={tag} label={tag} />
        ))}
      </div>

      {/* Right Edge Blur Overlay */}
      <div className="absolute right-6 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-l from-card via-card/40 to-transparent z-10" />

      {/* Right Scroll Arrow */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          scroll('right');
        }}
        className="absolute right-0 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 dark:bg-card/90 border border-border text-foreground/80 hover:text-primary transition-all shadow-md opacity-0 group-hover:opacity-100"
        aria-label="Scroll right"
      >
        <svg width="6" height="10" viewBox="0 0 6 11" fill="none">
          <path d="M0 0.883333L0.884166 0L5.7 4.81417C5.77763 4.89131 5.83924 4.98304 5.88128 5.08408C5.92332 5.18512 5.94496 5.29348 5.94496 5.40292C5.94496 5.51235 5.92332 5.62071 5.88128 5.72175C5.83924 5.8228 5.77763 5.91453 5.7 5.99167L0.884166 10.8083L0.000833035 9.925L4.52083 5.40417L0 0.883333Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}

export function VerifiedBadge() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative w-[19px] h-[19px] flex items-center justify-center">
        <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
          <path
            d="M9.11405 0.468617C9.31405 0.225776 9.68595 0.225776 9.88595 0.468617L11.5108 2.44146C11.6344 2.59158 11.8339 2.65639 12.0221 2.60761L14.4963 1.9666C14.8008 1.8877 15.1017 2.10629 15.1208 2.42031L15.2757 4.97144C15.2875 5.16555 15.4107 5.33523 15.5917 5.40642L17.9701 6.34209C18.2628 6.45726 18.3778 6.81096 18.2086 7.07621L16.8344 9.23116C16.7299 9.39514 16.7299 9.60486 16.8344 9.76884L18.2086 11.9238C18.3778 12.189 18.2629 12.5427 17.9701 12.6579L15.5917 13.5936C15.4107 13.6648 15.2875 13.8344 15.2757 14.0286L15.1208 16.5797C15.1017 16.8937 14.8008 17.1123 14.4963 17.0334L12.0221 16.3924C11.8339 16.3436 11.6344 16.4084 11.5108 16.5585L9.88595 18.5314C9.68595 18.7742 9.31405 18.7742 9.88595 18.5314L7.48921 16.5585C7.36558 16.4084 7.16612 16.3436 6.97786 16.3924L4.50373 17.0334C4.19918 17.1123 3.89831 16.8937 3.87924 16.5797L3.72434 14.0286C3.71255 13.8344 3.58928 13.6648 3.4083 13.5936L1.02991 12.6579C0.73715 12.5427 0.622227 12.189 0.791378 11.9238L2.16557 9.76884C2.27013 9.60486 2.27013 9.39514 2.16557 9.23116L0.791378 7.07621C0.622227 6.81096 0.73715 6.45726 1.02991 6.34209L3.4083 5.40642C3.58928 5.33523 3.71255 5.16555 3.72434 4.97144L3.87924 2.42031C3.89831 2.10629 4.19918 1.8877 4.50373 1.9666L6.97786 2.60761C7.16612 2.65639 7.36558 2.59158 7.48921 2.44146L9.11405 0.468617Z"
            fill="#8C5CFF"
          />
        </svg>
        <svg
          className="absolute"
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
        >
          <path
            d="M8.96973 2.7207L3.75 7.94531L1.03027 5.2207L1.46973 4.78125L3.75 7.05664L8.53027 2.28125L8.96973 2.7207Z"
            fill="white"
          />
        </svg>
      </div>
      <span className="text-muted text-[11px] leading-4">
        Payment Verified
      </span>
    </div>
  );
}

export function PeopleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="text-muted shrink-0">
      <g clipPath="url(#peopleClip)">
        <path
          d="M5 8.89962C6.44 8.89962 7.68 9.15162 8.575 9.75462C9.502 10.3796 10 11.3426 10 12.5996C9.99195 12.7268 9.93578 12.8461 9.84289 12.9333C9.75001 13.0205 9.6274 13.069 9.5 13.069C9.3726 13.069 9.24999 13.0205 9.15711 12.9333C9.06422 12.8461 9.00805 12.7268 9 12.5996C9 11.6416 8.642 11.0036 8.017 10.5826C7.359 10.1406 6.35 9.89962 5 9.89962C3.65 9.89962 2.64 10.1406 1.983 10.5836C1.358 11.0046 1 11.6426 1 12.6006C0.991955 12.7278 0.935776 12.8471 0.842892 12.9343C0.750008 13.0215 0.627397 13.07 0.5 13.07C0.372603 13.07 0.249992 13.0215 0.157108 12.9343C0.064224 12.8471 0.0080452 12.7268 0 12.6006C0 11.3426 0.497 10.3796 1.424 9.75462C2.319 9.15162 3.56 8.89962 5 8.89962ZM9.975 8.89962C11.414 8.89962 12.655 9.15162 13.55 9.75462C14.477 10.3796 14.975 11.3426 14.975 12.6006C14.975 12.7332 14.9223 12.8604 14.8286 12.9542C14.7348 13.0479 14.6076 13.1006 14.475 13.1006C14.3424 13.1006 14.2152 13.0479 14.1214 12.9542C14.0277 12.8604 13.975 12.7332 13.975 12.6006C13.975 11.6426 13.617 11.0046 12.991 10.5836C12.473 10.2346 11.738 10.0136 10.789 9.93362C10.5526 9.54749 10.2593 9.19923 9.919 8.90062L9.975 8.89962ZM5 1.84962C5.82169 1.87033 6.60277 2.21129 7.1766 2.79977C7.75044 3.38826 8.07162 4.17767 8.07162 4.99962C8.07162 5.82158 7.75044 6.61099 7.1766 7.19947C6.60277 7.78796 5.82169 8.12892 5 8.14962C4.16457 8.14962 3.36335 7.81775 2.77261 7.22701C2.18187 6.63627 1.85 5.83506 1.85 4.99962C1.85 4.16419 2.18187 3.36298 2.77261 2.77224C3.36335 2.1815 4.16457 1.84962 5 1.84962ZM9.975 1.84962C10.8104 1.84962 11.6116 2.1815 12.2024 2.77224C12.7931 3.36298 13.125 4.16419 13.125 4.99962C13.125 5.83506 12.7931 6.63627 12.2024 7.22701C11.6116 7.81775 10.8104 8.14962 9.975 8.14962C9.451 8.14962 8.959 8.01962 8.525 7.79362C8.73427 7.53047 8.91339 7.24468 9.059 6.94162C9.3867 7.09665 9.74827 7.16629 10.1101 7.14409C10.4719 7.12188 10.8223 7.00854 11.1286 6.81461C11.4349 6.62067 11.6871 6.35244 11.8619 6.03486C12.0367 5.71727 12.1284 5.36064 12.1284 4.99812C12.1284 4.63561 12.0367 4.27898 11.8619 3.96139C11.6871 3.6438 11.4349 3.37557 11.1286 3.18164C10.8223 2.98771 10.4719 2.87437 10.1101 2.85216C9.74827 2.82995 9.3867 2.8996 9.059 3.05462C8.91294 2.75221 8.73349 2.46711 8.524 2.20462C8.9712 1.96994 9.46897 1.84808 9.974 1.84962M5 2.84962C4.44114 2.86667 3.91087 3.10066 3.52158 3.502C3.1323 3.90335 2.91458 4.4405 2.91458 4.99962C2.91458 5.55875 3.1323 6.0959 3.52158 6.49724C3.91087 6.89859 4.44114 7.13258 5 7.14962C5.57022 7.14962 6.11708 6.92311 6.52028 6.5199C6.92348 6.1167 7.15 5.56984 7.15 4.99962C7.15 4.42941 6.92348 3.88255 6.52028 3.47934C6.11708 3.07614 5.57022 2.84962 5 2.84962Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="peopleClip">
          <rect width="15" height="15" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function LocationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted shrink-0">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.16499 13.98C8.93173 13.2842 9.64135 12.528 10.287 11.7187C11.647 10.01 12.4743 8.32532 12.5303 6.82732C12.5525 6.21851 12.4517 5.61149 12.234 5.0425C12.0163 4.47352 11.6862 3.95425 11.2633 3.51571C10.8405 3.07717 10.3335 2.72836 9.77285 2.49012C9.21216 2.25188 8.6092 2.12909 7.99999 2.12909C7.39079 2.12909 6.78783 2.25188 6.22714 2.49012C5.66645 2.72836 5.15953 3.07717 4.73666 3.51571C4.3138 3.95425 3.98366 4.47352 3.76597 5.0425C3.54827 5.61149 3.4475 6.21851 3.46966 6.82732C3.52633 8.32532 4.35433 10.01 5.71366 11.7187C6.3593 12.528 7.06892 13.2842 7.83566 13.98C7.90944 14.0467 7.96433 14.0951 8.00033 14.1253L8.16499 13.98ZM7.50833 14.7567C7.50833 14.7567 2.66699 10.6793 2.66699 6.66732C2.66699 5.25283 3.2289 3.89628 4.22909 2.89608C5.22928 1.89589 6.58584 1.33398 8.00033 1.33398C9.41481 1.33398 10.7714 1.89589 11.7716 2.89608C12.7718 3.89628 13.3337 5.25283 13.3337 6.66732C13.3337 10.6793 8.49233 14.7567 8.49233 14.7567C8.22299 15.0047 7.77966 15.002 7.50833 14.7567ZM8.00033 8.53398C8.4954 8.53398 8.97019 8.33732 9.32026 7.98725C9.67033 7.63718 9.86699 7.16239 9.86699 6.66732C9.86699 6.17225 9.67033 5.69745 9.32026 5.34738C8.97019 4.99732 8.4954 4.80065 8.00033 4.80065C7.50525 4.80065 7.03046 4.99732 6.68039 5.34738C6.33032 5.69745 6.13366 6.17225 6.13366 6.66732C6.13366 7.16239 6.33032 7.63718 6.68039 7.98725C7.03046 8.33732 7.50525 8.53398 8.00033 8.53398Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DislikeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 19 20" fill="none" className="text-muted shrink-0">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.307 0.935994C15.703 1.30299 15.962 2.06899 16.013 2.53099C16.603 2.89699 17.301 3.63499 17.362 5.02499C18.415 5.75599 19.215 7.10799 18.216 9.08499C18.796 9.62499 19.443 11.273 18.611 12.601C17.642 14.153 15.536 14.261 13.437 13.984C13.997 15.549 14.207 16.993 13.321 18.472C12.44 19.784 11.224 19.997 10.808 19.997C9.67 19.997 8.89 19.018 8.574 17.714C8.459 17.35 8.328 16.49 8.277 16.264C8.01167 14.824 7.12167 13.673 5.607 12.811C4.93341 12.4242 4.22205 12.1072 3.484 11.865H1.144C0.623 11.865 0 11.338 0 10.7V3.06399C0.074 2.34199 0.474667 1.98133 1.202 1.98199H4.312C5.67533 1.67199 7.03467 1.34033 8.39 0.986994C9.7 0.633994 9.987 0.516994 10.903 0.264994C12.956 -0.267006 14.381 0.0259936 15.307 0.935994ZM12.925 1.35899C12.106 1.35899 11.069 1.61099 10.609 1.75799C10.447 1.80899 10.163 1.89299 9.864 1.97899L9.564 2.06599L9.276 2.14799L8.716 2.30599C8.716 2.30599 7.306 2.68399 4.543 3.32599C4.44033 3.33799 4.385 3.34533 4.377 3.34799V10.728C5.88833 11.31 7.065 12.016 7.907 12.846C9.171 14.09 9.522 15.214 9.729 16.653C9.847 17.376 10.038 17.959 10.326 18.358C10.4087 18.4776 10.5291 18.5659 10.668 18.609C10.815 18.656 11.018 18.659 11.451 18.425C11.884 18.189 12.441 17.572 12.546 16.653C12.616 15.76 12.376 14.986 12.054 14.172C11.9427 13.8947 11.8237 13.6206 11.697 13.35C11.479 12.937 11.807 12.251 12.483 12.4C13.389 12.655 15.637 13 16.905 12.4C17.6423 11.9733 17.8247 11.2847 17.452 10.334C17.3297 10.1155 17.1607 9.92662 16.957 9.78099C16.787 9.67899 16.455 9.23699 16.854 8.73599C17.25 8.10099 17.829 6.80799 16.364 6.00199C16.262 5.94548 16.1769 5.86296 16.1171 5.76284C16.0574 5.66272 16.0253 5.54857 16.024 5.43199C16.004 5.15799 16.048 4.14199 15.294 3.68799C15.114 3.59099 14.897 3.51099 14.774 3.27799C14.696 3.12399 14.671 2.74999 14.671 2.74999C14.568 2.11799 14.426 1.52799 12.925 1.35899ZM3.019 3.34499H1.361V10.502H3.019V3.34499Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="none" className="text-muted shrink-0">
      <path
        d="M1.71429 13.2889L6 11.3778L10.2857 13.2889V1.77778H1.71429V13.2889ZM0 16V1.77778C0 1.28889 0.168 0.870222 0.504 0.521778C0.839428 0.173926 1.24286 0 1.71429 0H10.2857C10.7571 0 11.1609 0.173926 11.4969 0.521778C11.8323 0.870222 12 1.28889 12 1.77778V16L6 13.3333L0 16Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="10" height="20" viewBox="0 0 10 20" fill="none" className="text-muted">
      <path
        d="M7.95668 14.5168L7.07251 15.4001L2.25668 10.586C2.17905 10.5088 2.11744 10.4171 2.0754 10.3161C2.03336 10.215 2.01172 10.1067 2.01172 9.99721C2.01172 9.88777 2.03336 9.77942 2.0754 9.67838C2.11744 9.57733 2.17905 9.4856 2.25668 9.40846L7.07251 4.5918L7.95584 5.47513L3.43584 9.99596L7.95668 14.5168Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="10" height="20" viewBox="0 0 10 20" fill="none" className="text-muted">
      <path
        d="M2.04332 5.4832L2.92749 4.59987L7.74332 9.41404C7.82095 9.49118 7.88256 9.58291 7.9246 9.68395C7.96664 9.78499 7.98828 9.89335 7.98828 10.0028C7.98828 10.1122 7.96664 10.2206 7.9246 10.3216C7.88256 10.4227 7.82095 10.5144 7.74332 10.5915L2.92749 15.4082L2.04416 14.5249L6.56416 10.004L2.04332 5.4832Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" className="text-muted shrink-0">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.41667 3.95958L6.03792 5.58083L5.68458 5.93458L3.91667 4.16667V1.66667H4.41667V3.95958ZM4.16667 8.33333C1.86542 8.33333 0 6.46792 0 4.16667C0 1.86542 1.86542 0 4.16667 0C6.46792 0 8.33333 1.86542 8.33333 4.16667C8.33333 6.46792 6.46792 8.33333 4.16667 8.33333ZM4.16667 7.83333C5.13913 7.83333 6.07176 7.44703 6.75939 6.75939C7.44703 6.07176 7.83333 5.13913 7.83333 4.16667C7.83333 3.19421 7.44703 2.26158 6.75939 1.57394C6.07176 0.886308 5.13913 0.5 4.16667 0.5C3.19421 0.5 2.26158 0.886308 1.57394 1.57394C0.886308 2.26158 0.5 3.19421 0.5 4.16667C0.5 5.13913 0.886308 6.07176 1.57394 6.75939C2.26158 7.44703 3.19421 7.83333 4.16667 7.83333Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ─── Sub-Panels ──────────────────────────────────────────────────────────────

interface JobListPanelProps {
  onBack?: () => void;
  selectedJobId: number;
  onSelectJob: (job: Job) => void;
  savedJobIds: Record<number, boolean>;
  onToggleSaveJob: (id: number) => void;
}

function JobListPanel({ onBack, selectedJobId, onSelectJob, savedJobIds, onToggleSaveJob }: JobListPanelProps) {
  const [expandedJobIds, setExpandedJobIds] = useState<Record<number, boolean>>({});
  return (
    <div className="flex flex-col h-full bg-[#FAFAFD] dark:bg-[#0B0B0B]">
      {/* Page header */}
      <div className="px-5 pt-6 pb-4 border-b border-[#D8D8D8] dark:border-[#121212]">
        <div className="flex items-center gap-[7px] mb-1">
          <h1 className="text-[#010101] dark:text-white text-lg font-semibold leading-7">
            Marketplace
          </h1>
        </div>
        <p className="text-muted text-sm leading-5">
          Find blockchain & Canton development jobs
        </p>
      </div>

      {/* Job list */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {JOBS.map((job, index) => {
          const isSelected = selectedJobId === job.id;
          return (
            <div
              key={job.id}
              onClick={() => onSelectJob(job)}
              className={`flex flex-col gap-4 px-5 py-6 cursor-pointer border-b border-[#D8D8D8] dark:border-[#121212] transition-colors ${
                isSelected
                  ? "bg-[#F0EDFC] dark:bg-[#161626]"
                  : "bg-transparent hover:bg-black/[0.02] dark:hover:bg-[#111]"
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[#010101] dark:text-white text-[13px] font-medium leading-[18px] flex-1">
                    {job.title}
                  </span>
                  <span className="text-muted text-[10px] leading-[13px] flex-shrink-0">
                    {job.timeAgo}
                  </span>
                </div>

                {/* Pay info */}
                <div className="flex flex-col gap-[5px]">
                  <div className="flex items-center gap-[7px]">
                    <span className="text-muted text-[10px] leading-[13px]">
                      {job.payType}:
                    </span>
                    <span className="text-[#010101] dark:text-white font-medium text-[10px] leading-[13px]">
                      {job.pay}
                    </span>
                    <span className="text-muted text-[10px] leading-[13px]">
                      {job.payUnit}
                    </span>
                  </div>
                  <div className="flex items-center gap-[9px]">
                    <span className="text-muted text-[10px] leading-[13px]">
                      {job.level}
                    </span>
                    <div className="flex items-center gap-[3px] flex-1 min-w-0">
                      <ClockIcon />
                      <span className="text-muted text-[10px] leading-[13px] truncate">
                        {job.estimate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <p className={`text-[#010101]/85 dark:text-white/85 text-sm leading-[22px] ${
                  expandedJobIds[job.id] ? "" : "line-clamp-2"
                }`}>
                  {job.description}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedJobIds((prev) => ({
                      ...prev,
                      [job.id]: !prev[job.id],
                    }));
                  }}
                  className="text-primary text-[11px] font-semibold underline text-left hover:text-primary-hover transition-colors w-fit"
                >
                  {expandedJobIds[job.id] ? "Read less" : "Read more"}
                </button>

                {/* Tags row */}
                <ScrollableTags tags={job.tags} />
              </div>

              {/* Card Footer Section */}
              <div className="flex flex-col gap-3 mt-1">
                {/* Proposals and Ratings */}
                <div className="flex justify-between items-center">
                  <VerifiedBadge />
                  <div className="flex items-center gap-[5px]">
                    <PeopleIcon />
                    <span className="text-muted text-[11px] leading-4">
                      {job.proposals} Proposals
                    </span>
                  </div>
                  
                  {/* Proposals in review status replacing StarRating */}
                  {job.proposalsInReview && (
                    <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                      <span className="text-[10px] leading-[13px] font-medium">Proposals in review</span>
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-pulse"
                      >
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-[#D8D8D8]/50 dark:bg-[#121212]/50" />

                {/* Marketplace Details Footer */}
                <div className="flex w-full items-center justify-between gap-3 flex-wrap">
                  {/* Spent info */}
                  <span className="font-sans text-[11px] font-normal leading-4 text-foreground/80 dark:text-white/80">
                    {job.spent}
                  </span>

                  {/* Location */}
                  <div className="flex items-center gap-1.5">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M8.16499 13.98C8.93173 13.2842 9.64135 12.528 10.287 11.7187C11.647 10.01 12.4743 8.32532 12.5303 6.82732C12.5525 6.21851 12.4517 5.61149 12.234 5.0425C12.0163 4.47352 11.6862 3.95425 11.2633 3.51571C10.8405 3.07717 10.3335 2.72836 9.77285 2.49012C9.21216 2.25188 8.6092 2.12909 7.99999 2.12909C7.39079 2.12909 6.78783 2.25188 6.22714 2.49012C5.66645 2.72836 5.15953 3.07717 4.73666 3.51571C4.3138 3.95425 3.98366 4.47352 3.76597 5.0425C3.54827 5.61149 3.4475 6.21851 3.46966 6.82732C3.52633 8.32532 4.35433 10.01 5.71366 11.7187C6.3593 12.528 7.06892 13.2842 7.83566 13.98C7.90944 14.0467 7.96433 14.0951 8.00033 14.1253L8.16499 13.98ZM7.50833 14.7567C7.50833 14.7567 2.66699 10.6793 2.66699 6.66732C2.66699 5.25283 3.2289 3.89628 4.22909 2.89608C5.22928 1.89589 6.58584 1.33398 8.00033 1.33398C9.41481 1.33398 10.7714 1.89589 11.7716 2.89608C12.7718 3.89628 13.3337 5.25283 13.3337 6.66732C13.3337 10.6793 8.49233 14.7567 8.49233 14.7567C8.22299 15.0047 7.77966 15.002 7.50833 14.7567ZM8.00033 8.53398C8.4954 8.53398 8.97019 8.33732 9.32026 7.98725C9.67033 7.63718 9.86699 7.16239 9.86699 6.66732C9.86699 6.17225 9.67033 5.69745 9.32026 5.34738C8.97019 4.99732 8.4954 4.80065 8.00033 4.80065C7.50525 4.80065 7.03046 4.99732 6.68039 5.34738C6.33032 5.69745 6.13366 6.17225 6.13366 6.66732C6.13366 7.16239 6.33032 7.63718 6.68039 7.98725C7.03046 8.33732 7.50525 8.53398 8.00033 8.53398ZM8.00033 9.33398C7.29308 9.33398 6.6148 9.05303 6.11471 8.55294C5.61461 8.05284 5.33366 7.37456 5.33366 6.66732C5.33366 5.96007 5.61461 5.2818 6.11471 4.7817C6.6148 4.2816 7.29308 4.00065 8.00033 4.00065C8.70757 4.00065 9.38585 4.2816 9.88594 4.7817C10.386 5.2818 10.667 5.96007 10.667 6.66732C10.667 7.37456 10.386 8.05284 9.88594 8.55294C9.38585 9.05303 8.70757 9.33398 8.00033 9.33398Z"
                        fill="#A0A0A0"
                      />
                    </svg>
                    <span className="font-sans text-[11px] font-normal leading-4 text-foreground/80 dark:text-white/80">
                      {job.location}
                    </span>
                  </div>

                  {/* Bookmark icon */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSaveJob(job.id);
                    }}
                    className={`flex items-center transition-colors cursor-pointer ${
                      savedJobIds[job.id]
                        ? 'text-primary'
                        : 'text-muted hover:text-primary'
                    }`}
                  >
                    <svg
                      width="14"
                      height="18"
                      viewBox="0 0 24 24"
                      fill={savedJobIds[job.id] ? "currentColor" : "none"}
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
        })}
      </div>
    </div>
  );
}

interface JobDetailPanelProps {
  job: Job | null;
  onClose: () => void;
}

function Divider() {
  return <div className="h-px w-full bg-[#D8D8D8] dark:bg-[#121212]" />;
}

function ActivityRow({ label, value, showIcon }: { label: string; value: string; showIcon?: boolean }) {
  return (
    <div className="flex justify-between items-center py-[2px]">
      <span className="text-[13px] font-normal leading-5 text-[#010101] dark:text-white">{label}</span>
      <div className="flex items-center gap-[6px]">
        {showIcon && (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <g clipPath="url(#clip-activity)">
              <path d="M4.5 6.65625C4.57767 6.65625 4.64062 6.59329 4.64062 6.51562C4.64062 6.43796 4.57767 6.375 4.5 6.375C4.42233 6.375 4.35938 6.43796 4.35938 6.51562C4.35938 6.59329 4.42233 6.65625 4.5 6.65625Z" fill="#4ADE80"/>
              <path d="M3.20215 3.64144C3.20215 3.28313 3.34727 2.95875 3.58221 2.72381C3.81715 2.48888 4.14134 2.34375 4.49965 2.34375C4.84377 2.34375 5.17379 2.48045 5.41712 2.72378C5.66045 2.96711 5.79715 3.29713 5.79715 3.64125C5.79715 3.99975 5.67621 4.35113 5.41709 4.55888C5.14859 4.77431 4.49496 5.12719 4.49496 5.67637" stroke="#4ADE80" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4.5 8.53125C6.7264 8.53125 8.53125 6.7264 8.53125 4.5C8.53125 2.2736 6.7264 0.46875 4.5 0.46875C2.2736 0.46875 0.46875 2.2736 0.46875 4.5C0.46875 6.7264 2.2736 8.53125 4.5 8.53125Z" stroke="#4ADE80" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            <defs>
              <clipPath id="clip-activity">
                <rect width="9" height="9" fill="white"/>
              </clipPath>
            </defs>
          </svg>
        )}
        <span className="text-[11px] font-normal leading-4 text-muted">{value}</span>
      </div>
    </div>
  );
}

function ClientStat({ top, bottom }: { top: string; bottom: string }) {
  return (
    <div className="flex items-center justify-center px-4 py-[5px] rounded-[3px] bg-[#8C5CFF]/10 dark:bg-[rgba(140,92,255,0.15)] min-w-[90px]">
      <span className="text-[#8C5CFF] text-[10px] font-normal leading-[13px] text-center">
        {top}<br />{bottom}
      </span>
    </div>
  );
}

function JobDetailPanel({ job, onClose, onApply }: { job: Job | null; onClose: () => void; onApply: () => void }) {
  if (!job) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-[#FDFDFD] dark:bg-[#080808] px-4 py-6 overflow-y-auto no-scrollbar">
        <span className="text-muted text-[13px]">Select a job post to view details</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 bg-[#FDFDFD] dark:bg-[#080808] px-4 py-6 overflow-y-auto no-scrollbar">
      {/* Back nav */}
      <button onClick={onClose} className="flex items-center gap-4 text-muted hover:text-foreground transition-colors self-start">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M6.921 12.5L12.714 18.292L12 19L5 12L12 5L12.714 5.708L6.92 11.5H19V12.5H6.921Z" fill="currentColor"/>
        </svg>
        <span className="text-[14px] font-medium leading-5">Back to marketplace</span>
      </button>

      {/* Tags + title block */}
      <div className="flex flex-col gap-4 mt-2">
        {/* Tag row */}
        <div className="flex flex-wrap items-center gap-2">
          {job.tags.map((tag, i) => (
            <span key={i} className="flex items-center justify-center px-[10px] py-[5px] rounded-[3px] bg-[#8C5CFF]/15 dark:bg-[#8C5CFF]/10 text-[#8C5CFF] text-[10px] font-normal leading-[13px]">
              {tag}
            </span>
          ))}
        </div>

        {/* Title + meta */}
        <div className="flex flex-col gap-3">
          <p className="text-[15px] font-semibold leading-[22px] text-[#010101] dark:text-white">
            {job.title}
          </p>
          <div className="flex items-center gap-[15px] flex-wrap">
            <span className="text-[11px] font-normal leading-4 text-muted">{job.payType}: {job.pay} {job.payUnit}</span>
            <span className="text-[11px] font-normal leading-4 text-muted">{job.proposals} Applicants</span>
            <span className="text-[11px] font-normal leading-4 text-muted">Posted {job.timeAgo}</span>
          </div>
        </div>
      </div>

      <Divider />

      {/* Job description */}
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-normal leading-5 text-[#010101]/85 dark:text-white/85 whitespace-pre-line">
          <span className="font-semibold text-[#010101] dark:text-white">Job Description</span>
          {"\n\n"}
          {job.description}
        </p>
      </div>

      <Divider />

      {/* Requirements */}
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-medium leading-[18px] text-[#010101] dark:text-white">Requirements</p>
        <ol className="list-decimal list-inside space-y-1">
          {[
            "React and Next.js developer experience",
            "Typescript proficiency required",
            "Tailwind CSS styling capabilities",
            "Web3 / Blockchain integration experience",
          ].map((req, i) => (
            <li key={i} className="text-[13px] font-normal leading-5 text-[#010101]/80 dark:text-white/80">
              {req}
            </li>
          ))}
        </ol>
      </div>

      <Divider />

      {/* Project type */}
      <p className="text-[13px] leading-5 text-[#010101]/85 dark:text-white/85">
        <span className="font-semibold text-[#010101] dark:text-white">Project type:</span>
        <span className="font-normal text-muted"> Ongoing project</span>
      </p>

      <Divider />

      {/* Job questions */}
      <div className="flex flex-col gap-[6px]">
        <p className="text-[13px] font-medium leading-[18px] text-[#010101] dark:text-white">Job questions:</p>
        <div className="flex flex-col gap-2.5">
          <p className="text-[13px] font-normal leading-5 text-muted">
            1. Describe your recent experience with similar projects
          </p>
          <p className="text-[13px] font-normal leading-5 text-muted">
            2. What framework have you worked with?
          </p>
          <p className="text-[13px] font-normal leading-5 text-muted">
            3. Include a link to GitHub profile and/ or website
          </p>
        </div>
      </div>

      <Divider />

      {/* Expertise */}
      <div className="flex flex-col gap-4">
        <p className="text-[13px] font-medium leading-[18px] text-[#010101] dark:text-white">Expertise</p>

        <div className="flex flex-col gap-[6px]">
          <p className="text-[11px] font-normal leading-4 text-muted">Mandatory skills</p>
          <div className="flex items-center gap-3 flex-wrap">
            {["Web development", "Javascript", "Next.js"].map((skill, i) => (
              <span key={i} className="flex items-center justify-center px-[10px] py-[5px] rounded-[3px] bg-[#8C5CFF]/10 dark:bg-[rgba(140,92,255,0.15)] text-[#8C5CFF] text-[12px] font-normal leading-[16px]">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-[6px] mt-2">
          <p className="text-[11px] font-normal leading-4 text-muted">Other preferred</p>
          <div className="flex items-center gap-3 flex-wrap">
            {["Smart contract", "Daml", "escrow", "Canton"].map((skill, i) => (
              <span key={i} className="flex items-center justify-center px-[10px] py-[5px] rounded-[3px] bg-[#8C5CFF]/10 dark:bg-[rgba(140,92,255,0.15)] text-[#8C5CFF] text-[12px] font-normal leading-[16px]">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <Divider />

      {/* Activity section */}
      <div className="flex flex-col gap-6 py-4">
        <div className="flex flex-col gap-[6px]">
          <p className="text-[13px] font-medium leading-[18px] text-[#010101] dark:text-white">Activity on this job</p>
          <div className="flex flex-col">
            <ActivityRow label="Proposals:" value={`${job.proposals}+`} showIcon />
            <ActivityRow label="Invite sent:" value="3" showIcon />
            <ActivityRow label="Unanswered invites:" value="0" />
            <ActivityRow label="Interviewing:" value="1" />
            <ActivityRow label="Last view:" value="5min ago" />
          </div>
        </div>

        <Divider />

        {/* Project value */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-[5px]">
            <p className="text-[13px] font-medium leading-[18px] text-[#010101] dark:text-white">Total project value</p>
            <p className="text-[13px] font-normal leading-5 text-[#010101]/80 dark:text-white/80">
              1,200 CC<br />
              <span className="text-muted text-[11px]">$228.00 at current rate</span>
            </p>
          </div>

          <div className="flex flex-col gap-1.5 bg-[#FAFAFD] dark:bg-[#111] p-3.5 rounded-2xl border border-[#D8D8D8] dark:border-[#121212]">
            <div className="flex justify-between items-center py-[2px]">
              <span className="text-[12px] font-normal text-[#010101] dark:text-white">Per milestone</span>
              <span className="text-[12px] font-normal text-muted">240 CC × 5</span>
            </div>
            <div className="flex justify-between items-center py-[2px]">
              <span className="text-[12px] font-normal text-[#010101] dark:text-white">Platform fee 5%</span>
              <span className="text-[12px] font-normal text-red-500">-60 CC</span>
            </div>
            <div className="flex justify-between items-center py-[2px] border-t border-[#D8D8D8] dark:border-[#121212] pt-1.5 mt-1">
              <span className="text-[12px] font-semibold text-[#010101] dark:text-white">You receive</span>
              <span className="text-[12px] font-semibold text-green-500">1,140 CC</span>
            </div>
          </div>
        </div>

        <Divider />

        {/* CC locked badge */}
        <div className="flex items-center justify-center px-[10px] py-[5px] rounded-[3px] bg-[#8C5CFF]/10 dark:bg-[rgba(140,92,255,0.15)] w-full">
          <span className="text-[#8C5CFF] text-[10px] font-normal leading-[13px]">CC locked in Canton escrow</span>
        </div>

        <Divider />

        {/* About the client */}
        <div className="flex flex-col gap-[6px]">
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-medium leading-[18px] text-[#010101] dark:text-white">About the client</p>
            <div className="flex justify-between items-center">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#8C5CFF]/10 flex-shrink-0">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/33048cc161e585938ca07278f072c117e1df8df4?width=32"
                  alt="John Trek"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-right">
                <p className="text-[13px] font-normal leading-5 text-[#010101] dark:text-white">John Trek</p>
                <p className="text-[10px] font-normal leading-[13px] text-muted">@johntrek</p>
              </div>
            </div>
          </div>

          <Divider />

          {/* Client stats */}
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex justify-between items-center px-4">
              <ClientStat top="14" bottom="Jobs posted" />
              <ClientStat top="92%" bottom="Hire rate" />
            </div>
            <div className="flex justify-between items-center px-4">
              <ClientStat top="Trust Score" bottom="96" />
              <ClientStat top="6mo" bottom="On platform" />
            </div>
          </div>
        </div>
      </div>

      <Divider />

      {/* Action buttons */}
      <div className="flex flex-col gap-4 pb-6 mt-2">
        <button onClick={onApply} className="flex items-center justify-center gap-[10px] w-full px-4 py-2.5 rounded-[12px] bg-[#8C5CFF] text-white text-[13px] font-semibold leading-[18px] hover:opacity-90 transition-opacity">
          Apply for this job
          <svg width="6" height="11" viewBox="0 0 6 11" fill="none">
            <path d="M0 0.883333L0.884166 0L5.7 4.81417C5.77763 4.89131 5.83924 4.98304 5.88128 5.08408C5.92332 5.18512 5.94496 5.29348 5.94496 5.40292C5.94496 5.51235 5.92332 5.62071 5.88128 5.72175C5.83924 5.8228 5.77763 5.91453 5.7 5.99167L0.884166 10.8083L0.000833035 9.925L4.52083 5.40417L0 0.883333Z" fill="currentColor" />
          </svg>
        </button>
        <button className="flex items-center justify-center gap-[10px] w-full px-4 py-2.5 rounded-[12px] border border-[#8C5CFF]/30 dark:border-[#8C5CFF]/20 text-[#8C5CFF] text-[13px] font-semibold leading-[18px] hover:bg-[#8C5CFF]/5 dark:hover:bg-[#8C5CFF]/10 transition-colors">
          Save for later
        </button>
      </div>
    </div>
  );
}

interface FindJobPageProps {
  onBack?: () => void;
  onMobileViewChange?: (view: "list" | "detail") => void;
  savedJobIds?: Record<number, boolean>;
  onToggleSaveJob?: (id: number) => void;
}

export default function FindJobPage({ onBack, onMobileViewChange, savedJobIds: externalSavedJobIds, onToggleSaveJob: externalToggleSaveJob }: FindJobPageProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(JOBS[0]);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [internalSavedJobIds, setInternalSavedJobIds] = useState<Record<number, boolean>>({});

  // Use external state if provided, otherwise use internal
  const savedJobIds = externalSavedJobIds ?? internalSavedJobIds;
  const handleToggleSaveJob = externalToggleSaveJob ?? ((id: number) => {
    setInternalSavedJobIds((prev) => ({ ...prev, [id]: !prev[id] }));
  });

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
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

  const handleApply = () => {
    setApplyingJob(selectedJob);
  };

  const handleBackFromApply = () => {
    setApplyingJob(null);
  };

  // ── Apply form: full-page overlay within the SPA ──
  if (applyingJob) {
    return <ApplyJobPage job={applyingJob} onBack={handleBackFromApply} />;
  }

  return (
    <div className="h-full w-full flex overflow-hidden">
      <div className="flex flex-1 h-full">
        {/* Left: Job List */}
        <div
          className={`flex-col w-full lg:w-[380px] lg:flex-shrink-0 h-full border-r border-[#D8D8D8] dark:border-[#121212] ${
            mobileView === "detail" ? "hidden lg:flex" : "flex"
          }`}
        >
          <JobListPanel
            onBack={onBack}
            selectedJobId={selectedJob?.id || 0}
            onSelectJob={handleSelectJob}
            savedJobIds={savedJobIds}
            onToggleSaveJob={handleToggleSaveJob}
          />
        </div>

        {/* Right: Job details */}
        <div
          className={`flex-col flex-1 min-w-0 h-full ${
            mobileView === "list" ? "hidden lg:flex" : "flex"
          }`}
        >
          <JobDetailPanel job={selectedJob} onClose={handleCloseDetail} onApply={handleApply} />
        </div>
      </div>
    </div>
  );
}
