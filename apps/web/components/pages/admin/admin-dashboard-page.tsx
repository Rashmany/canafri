'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Users,
  Briefcase,
  Scale,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronRight,
  Shield,
  ShoppingCart,
  Store,
  Video,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  ChevronDown,
  UserPlus,
  Copy,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminPage =
  | 'Dashboard'
  | 'Analytics'
  | 'Active Jobs'
  | 'Seller Apps'
  | 'Disputes'
  | 'Delisted'
  | 'Review Queue'
  | 'All Users'
  | 'Treasury'
  | 'Platform Config'
  | 'Content Creators'
  | 'Buyers'
  | 'Sellers'
  | 'Risk Scores'
  | 'Admin Team';

interface AdminDashboardPageProps {
  onNavigate?: (page: AdminPage) => void;
}

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: React.ReactNode;
  accent: string;
  onClick?: () => void;
}

interface AdminActivityLog {
  id: string;
  operatorName: string;
  operatorHandle: string;
  operatorRole: 'Super Admin' | 'Content Admin' | 'Finance Admin' | 'Support Admin';
  action: string;
  target: string;
  timestamp: Date;
}

// ─── Verification Analytics Donut Data ───────────────────────────────────────

interface DonutSlice {
  label: string;
  value: number;
  pct: number;
  color: string;
  amount: string;
  page: AdminPage;
}

// Adjusted mock values to ensure all segments have a visible color share in the Donut Chart
const DONUT_DATA: DonutSlice[] = [
  { label: 'KYC Verified',        value: 14240, pct: 62.5, color: '#10B981', amount: '14,240', page: 'All Users' },
  { label: 'Pending Review',       value: 4500,  pct: 19.7, color: '#F59E0B', amount: '4,500',  page: 'Review Queue' },
  { label: 'Suspended Accounts',   value: 2100,  pct: 9.2,  color: '#EF4444', amount: '2,100',  page: 'All Users' },
  { label: 'Seller Applications',  value: 1961,  pct: 8.6,  color: '#3B82F6', amount: '1,961',  page: 'Seller Apps' },
];

// ─── Platform Utilization Health Pie Data ─────────────────────────────────────

interface PieSlice {
  label: string;
  value: number;
  pct: number;
  color: string;
  amount: string;
  page: AdminPage;
}

const PIE_DATA: PieSlice[] = [
  { label: 'Buyers',           value: 14607, pct: 56.1, color: '#3B82F6', amount: '14,607', page: 'Buyers' },
  { label: 'Sellers',          value: 7006,  pct: 26.9, color: '#10B981', amount: '7,006',  page: 'Sellers' },
  { label: 'Content Creators', value: 3218,  pct: 12.4, color: '#8C5CFF', amount: '3,218',  page: 'Content Creators' },
  { label: 'Active Jobs',      value: 1204,  pct: 4.6,  color: '#F59E0B', amount: '1,204',  page: 'Active Jobs' },
];

// ─── Trend Data ──────────────────────────────────────────────────────────────

interface TrendPoint {
  day: string;
  users: number;
  creators: number;
}

const TREND_DATA_DAILY: TrendPoint[] = [
  { day: 'Mon', users: 120, creators: 24 },
  { day: 'Tue', users: 145, creators: 35 },
  { day: 'Wed', users: 132, creators: 28 },
  { day: 'Thu', users: 178, creators: 42 },
  { day: 'Fri', users: 210, creators: 50 },
  { day: 'Sat', users: 189, creators: 44 },
  { day: 'Sun', users: 245, creators: 58 },
];

const TREND_DATA_WEEKLY: TrendPoint[] = [
  { day: 'Wk 1', users: 840,  creators: 180 },
  { day: 'Wk 2', users: 950,  creators: 210 },
  { day: 'Wk 3', users: 1120, creators: 240 },
  { day: 'Wk 4', users: 1300, creators: 290 },
];

const TREND_DATA_MONTHLY: TrendPoint[] = [
  { day: 'Jan', users: 3800, creators: 750  },
  { day: 'Feb', users: 4200, creators: 840  },
  { day: 'Mar', users: 4900, creators: 990  },
  { day: 'Apr', users: 5100, creators: 1100 },
  { day: 'May', users: 5800, creators: 1250 },
  { day: 'Jun', users: 6400, creators: 1400 },
];

// ─── Activity Metric Datasets ────────────────────────────────────────────────

type MetricPeriod = 'Daily' | 'Weekly' | 'Monthly';

interface MetricPoint { label: string; value: number; }

const ACTIVITY_METRICS: Record<string, Record<MetricPeriod, MetricPoint[]>> = {
  'Jobs Posted': {
    Daily:   [{ label: 'Mon', value: 48 }, { label: 'Tue', value: 63 }, { label: 'Wed', value: 55 }, { label: 'Thu', value: 80 }, { label: 'Fri', value: 102 }, { label: 'Sat', value: 74 }, { label: 'Sun', value: 91 }],
    Weekly:  [{ label: 'Wk 1', value: 310 }, { label: 'Wk 2', value: 420 }, { label: 'Wk 3', value: 390 }, { label: 'Wk 4', value: 510 }],
    Monthly: [{ label: 'Jan', value: 1200 }, { label: 'Feb', value: 1400 }, { label: 'Mar', value: 1850 }, { label: 'Apr', value: 1700 }, { label: 'May', value: 2100 }, { label: 'Jun', value: 2400 }],
  },
  'Jobs Completed': {
    Daily:   [{ label: 'Mon', value: 32 }, { label: 'Tue', value: 41 }, { label: 'Wed', value: 38 }, { label: 'Thu', value: 55 }, { label: 'Fri', value: 67 }, { label: 'Sat', value: 49 }, { label: 'Sun', value: 62 }],
    Weekly:  [{ label: 'Wk 1', value: 210 }, { label: 'Wk 2', value: 290 }, { label: 'Wk 3', value: 270 }, { label: 'Wk 4', value: 360 }],
    Monthly: [{ label: 'Jan', value: 890 }, { label: 'Feb', value: 1050 }, { label: 'Mar', value: 1300 }, { label: 'Apr', value: 1200 }, { label: 'May', value: 1600 }, { label: 'Jun', value: 1850 }],
  },
  'Content Published': {
    Daily:   [{ label: 'Mon', value: 74 }, { label: 'Tue', value: 92 }, { label: 'Wed', value: 84 }, { label: 'Thu', value: 120 }, { label: 'Fri', value: 147 }, { label: 'Sat', value: 108 }, { label: 'Sun', value: 133 }],
    Weekly:  [{ label: 'Wk 1', value: 480 }, { label: 'Wk 2', value: 620 }, { label: 'Wk 3', value: 590 }, { label: 'Wk 4', value: 740 }],
    Monthly: [{ label: 'Jan', value: 1900 }, { label: 'Feb', value: 2300 }, { label: 'Mar', value: 2800 }, { label: 'Apr', value: 2600 }, { label: 'May', value: 3200 }, { label: 'Jun', value: 3700 }],
  },
  'CC Spent': {
    Daily:   [{ label: 'Mon', value: 4200 }, { label: 'Tue', value: 5800 }, { label: 'Wed', value: 4900 }, { label: 'Thu', value: 7200 }, { label: 'Fri', value: 8900 }, { label: 'Sat', value: 6400 }, { label: 'Sun', value: 7800 }],
    Weekly:  [{ label: 'Wk 1', value: 28000 }, { label: 'Wk 2', value: 36000 }, { label: 'Wk 3', value: 33000 }, { label: 'Wk 4', value: 44000 }],
    Monthly: [{ label: 'Jan', value: 112000 }, { label: 'Feb', value: 134000 }, { label: 'Mar', value: 158000 }, { label: 'Apr', value: 147000 }, { label: 'May', value: 192000 }, { label: 'Jun', value: 220000 }],
  },
  'CC Deposited': {
    Daily:   [{ label: 'Mon', value: 6100 }, { label: 'Tue', value: 7400 }, { label: 'Wed', value: 6600 }, { label: 'Thu', value: 9300 }, { label: 'Fri', value: 11200 }, { label: 'Sat', value: 8100 }, { label: 'Sun', value: 9800 }],
    Weekly:  [{ label: 'Wk 1', value: 38000 }, { label: 'Wk 2', value: 48000 }, { label: 'Wk 3', value: 44000 }, { label: 'Wk 4', value: 57000 }],
    Monthly: [{ label: 'Jan', value: 145000 }, { label: 'Feb', value: 172000 }, { label: 'Mar', value: 204000 }, { label: 'Apr', value: 189000 }, { label: 'May', value: 241000 }, { label: 'Jun', value: 280000 }],
  },
  'CC Withdrawn': {
    Daily:   [{ label: 'Mon', value: 1800 }, { label: 'Tue', value: 2200 }, { label: 'Wed', value: 1900 }, { label: 'Thu', value: 3100 }, { label: 'Fri', value: 3800 }, { label: 'Sat', value: 2600 }, { label: 'Sun', value: 3200 }],
    Weekly:  [{ label: 'Wk 1', value: 12000 }, { label: 'Wk 2', value: 16000 }, { label: 'Wk 3', value: 14000 }, { label: 'Wk 4', value: 18000 }],
    Monthly: [{ label: 'Jan', value: 48000 }, { label: 'Feb', value: 57000 }, { label: 'Mar', value: 68000 }, { label: 'Apr', value: 62000 }, { label: 'May', value: 78000 }, { label: 'Jun', value: 91000 }],
  },
  'Platform CC Earned': {
    Daily:   [{ label: 'Mon', value: 420 }, { label: 'Tue', value: 580 }, { label: 'Wed', value: 490 }, { label: 'Thu', value: 720 }, { label: 'Fri', value: 890 }, { label: 'Sat', value: 640 }, { label: 'Sun', value: 780 }],
    Weekly:  [{ label: 'Wk 1', value: 2800 }, { label: 'Wk 2', value: 3600 }, { label: 'Wk 3', value: 3300 }, { label: 'Wk 4', value: 4400 }],
    Monthly: [{ label: 'Jan', value: 11200 }, { label: 'Feb', value: 13400 }, { label: 'Mar', value: 15800 }, { label: 'Apr', value: 14700 }, { label: 'May', value: 19200 }, { label: 'Jun', value: 22000 }],
  },
};

const ACTIVITY_METRIC_META: { key: string; isDual?: boolean; keys: string[]; colors: string[]; unit: string; desc: string }[] = [
  { key: 'Job Activity',      isDual: true,  keys: ['Jobs Posted', 'Jobs Completed'], colors: ['#3B82F6', '#10B981'], unit: 'jobs',   desc: 'New jobs posted vs. completed jobs' },
  { key: 'Content Published', isDual: false, keys: ['Content Published'],            colors: ['#8C5CFF'],             unit: 'pieces', desc: 'New content pieces published by creators' },
  { key: 'CC Spent',          isDual: false, keys: ['CC Spent'],                     colors: ['#F59E0B'],             unit: 'CC',     desc: 'Total CC tokens spent on services' },
  { key: 'CC Treasury Flows', isDual: true,  keys: ['CC Deposited', 'CC Withdrawn'],   colors: ['#06B6D4', '#EF4444'], unit: 'CC',     desc: 'Total CC tokens deposited vs. withdrawn' },
  { key: 'Platform CC Earned',isDual: false, keys: ['Platform CC Earned'],           colors: ['#A855F7'],             unit: 'CC',     desc: 'Platform fee revenue in CC tokens' },
];

const INITIAL_ACTIVITY_LOGS: AdminActivityLog[] = [
  { id: 'l-1', operatorName: 'David M.',  operatorHandle: '@david', operatorRole: 'Super Admin',   action: 'Suspended creator account', target: 'James McAllister (@james)', timestamp: new Date(Date.now() - 12 * 60 * 1000) },
  { id: 'l-2', operatorName: 'Jane Doe',  operatorHandle: '@jane',  operatorRole: 'Content Admin', action: 'Approved seller application', target: 'design_pro_ng', timestamp: new Date(Date.now() - 45 * 60 * 1000) },
  { id: 'l-3', operatorName: 'David M.',  operatorHandle: '@david', operatorRole: 'Super Admin',   action: 'Invited team member', target: 'Samuel Ojo (samuel@canafri.io)', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: 'l-4', operatorName: 'Tunde K.',  operatorHandle: '@tunde', operatorRole: 'Finance Admin', action: 'Approved milestone release', target: 'Order #7281 (240 CC)', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
  { id: 'l-5', operatorName: 'Bola Taiwo', operatorHandle: '@bola',  operatorRole: 'Support Admin', action: 'Resolved user dispute', target: 'Dispute #491 (Refunded)', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  { id: 'l-6', operatorName: 'Jane Doe',  operatorHandle: '@jane',  operatorRole: 'Content Admin', action: 'Flagged suspicious gig', target: 'Logo Design Promo', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000) },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, change, up, icon, accent, onClick }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col gap-4 rounded-[1.25rem] border border-border bg-[#0b0b0b] p-6 shadow-sm text-left transition-all ${
        onClick ? 'hover:border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/[0.03] cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-sans text-[0.8125rem] font-medium text-muted-foreground">{label}</span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: `${accent}14` }}
        >
          <span style={{ color: accent }}>{icon}</span>
        </span>
      </div>
      <div>
        <p className="font-sans text-[2rem] font-bold leading-none tracking-tight text-foreground">{value}</p>
        <div className={`mt-1.5 flex items-center gap-1 font-sans text-[0.75rem] font-medium ${up ? 'text-emerald-500' : 'text-red-400'}`}>
          {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {change}
        </div>
      </div>
    </button>
  );
}

function MiniMetric({
  label,
  value,
  sub,
  icon,
  accent,
  onClick,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accent: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-4 rounded-[1rem] border border-border bg-[#0b0b0b] p-4 text-left transition-all ${
        onClick ? 'hover:border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/[0.03] cursor-pointer' : 'cursor-default'
      }`}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${accent}14`, color: accent }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-sans text-[0.75rem] text-muted-foreground leading-none mb-1">{label}</p>
        <p className="font-sans text-[1.25rem] font-bold text-foreground leading-none">{value}</p>
        <p className="font-sans text-[0.6875rem] text-muted-foreground/60 mt-0.5">{sub}</p>
      </div>
    </button>
  );
}

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────

function PlatformDonutChart({ size = 180 }: { size?: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.44;
  const innerR = size * 0.32;
  const gap = 3;

  const total = DONUT_DATA.reduce((s, d) => s + d.value, 0);
  let cursor = -90;

  const slices = DONUT_DATA.map((d, i) => {
    const sweep = (d.value / total) * (360 - gap * DONUT_DATA.length);
    const start = cursor + gap / 2;
    const end = cursor + sweep;
    cursor = end + gap / 2;

    const mid = (((start + end) / 2) * Math.PI) / 180;
    return { ...d, start, end, mid, index: i };
  });

  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <defs>
          {slices.map(s => (
            <filter key={s.index} id={`dash-donut-glow-${s.index}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          ))}
        </defs>

        {/* Halo Rings */}
        <circle cx={cx} cy={cy} r={outerR + 3} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={innerR - 3} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

        {/* Slices */}
        {slices.map(s => {
          const isHov = hovered === s.index;
          const rOuter = isHov ? outerR + 5 : outerR;
          const rInner = isHov ? innerR - 2 : innerR;

          const toRad = (d: number) => (d * Math.PI) / 180;
          const x1 = cx + rInner * Math.cos(toRad(s.start));
          const y1 = cy + rInner * Math.sin(toRad(s.start));
          const x2 = cx + rOuter * Math.cos(toRad(s.start));
          const y2 = cy + rOuter * Math.sin(toRad(s.start));
          const x3 = cx + rOuter * Math.cos(toRad(s.end));
          const y3 = cy + rOuter * Math.sin(toRad(s.end));
          const x4 = cx + rInner * Math.cos(toRad(s.end));
          const y4 = cy + rInner * Math.sin(toRad(s.end));

          const large = s.end - s.start > 180 ? 1 : 0;
          const dPath = [
            `M ${x1} ${y1}`,
            `L ${x2} ${y2}`,
            `A ${rOuter} ${rOuter} 0 ${large} 1 ${x3} ${y3}`,
            `L ${x4} ${y4}`,
            `A ${rInner} ${rInner} 0 ${large} 0 ${x1} ${y1}`,
            'Z',
          ].join(' ');

          const offsetDist = isHov ? 3 : 0;
          const tx = offsetDist * Math.cos(s.mid);
          const ty = offsetDist * Math.sin(s.mid);

          return (
            <path
              key={s.index}
              d={dPath}
              fill={s.color}
              fillOpacity={isHov ? 0.95 : 0.75}
              stroke="#0b0b0b"
              strokeWidth={1.5}
              transform={`translate(${tx}, ${ty})`}
              className="cursor-pointer transition-all duration-300 ease-out"
              onMouseEnter={() => setHovered(s.index)}
              onMouseLeave={() => setHovered(null)}
              filter={isHov ? `url(#dash-donut-glow-${s.index})` : undefined}
            />
          );
        })}

        {/* Center Ring */}
        <circle cx={cx} cy={cy} r={innerR - 5} fill="rgba(15, 15, 17, 0.95)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      </svg>

      <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none select-none">
        <span className="font-sans text-[9px] font-medium tracking-wider text-muted-foreground uppercase">
          {hovered !== null ? 'Percentage' : 'Total'}
        </span>
        <span className="font-sans text-[1.125rem] font-bold text-white leading-none mt-0.5 tracking-tight">
          {hovered !== null ? `${DONUT_DATA[hovered].pct}%` : '22.8K'}
        </span>
      </div>
    </div>
  );
}

// ─── SVG Solid Pie Chart ──────────────────────────────────────────────────────

function PlatformPieChart({ size = 180 }: { size?: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.44;
  const gap = 2; // small degrees gap between segments for clean spacing

  const total = PIE_DATA.reduce((s, d) => s + d.value, 0);
  let cursor = -90;

  const slices = PIE_DATA.map((d, i) => {
    const sweep = (d.value / total) * (360 - gap * PIE_DATA.length);
    const start = cursor + gap / 2;
    const end = cursor + sweep;
    cursor = end + gap / 2;

    const mid = (((start + end) / 2) * Math.PI) / 180;
    return { ...d, start, end, mid, index: i };
  });

  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <defs>
          {slices.map(s => (
            <filter key={s.index} id={`dash-pie-glow-${s.index}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          ))}
        </defs>

        {/* Halo Ring */}
        <circle cx={cx} cy={cy} r={outerR + 3} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

        {/* Solid Slices starting at center (cx, cy) */}
        {slices.map(s => {
          const isHov = hovered === s.index;
          const rOuter = isHov ? outerR + 5 : outerR;

          const toRad = (d: number) => (d * Math.PI) / 180;
          const x1 = cx + rOuter * Math.cos(toRad(s.start));
          const y1 = cy + rOuter * Math.sin(toRad(s.start));
          const x2 = cx + rOuter * Math.cos(toRad(s.end));
          const y2 = cy + rOuter * Math.sin(toRad(s.end));

          const large = s.end - s.start > 180 ? 1 : 0;
          const dPath = [
            `M ${cx} ${cy}`,
            `L ${x1} ${y1}`,
            `A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2}`,
            'Z',
          ].join(' ');

          const offsetDist = isHov ? 3 : 0;
          const tx = offsetDist * Math.cos(s.mid);
          const ty = offsetDist * Math.sin(s.mid);

          return (
            <path
              key={s.index}
              d={dPath}
              fill={s.color}
              fillOpacity={isHov ? 0.95 : 0.75}
              stroke="#0b0b0b"
              strokeWidth={1.5}
              transform={`translate(${tx}, ${ty})`}
              className="cursor-pointer transition-all duration-300 ease-out"
              onMouseEnter={() => setHovered(s.index)}
              onMouseLeave={() => setHovered(null)}
              filter={isHov ? `url(#dash-pie-glow-${s.index})` : undefined}
            />
          );
        })}
      </svg>

      {/* Floating Center Overlay Text */}
      <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none select-none">
        {hovered !== null && (
          <div className="bg-[rgba(15,15,17,0.92)] border border-[rgba(255,255,255,0.08)] px-2 py-1 rounded-md flex flex-col items-center shadow-xl">
            <span className="font-sans text-[8px] text-muted-foreground uppercase tracking-wider">{PIE_DATA[hovered].label}</span>
            <span className="font-sans text-[11px] font-bold text-white mt-0.5">{PIE_DATA[hovered].pct}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SVG User Trend Chart ────────────────────────────────────────────────────

function UserTrendChart({ trendType }: { trendType: 'Daily' | 'Weekly' | 'Monthly' }) {
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const width = 500;
  const height = 180;
  const padding = { top: 20, right: 30, bottom: 30, left: 40 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Selected Trend Data Set
  const activeDataset = useMemo(() => {
    if (trendType === 'Weekly') return TREND_DATA_WEEKLY;
    if (trendType === 'Monthly') return TREND_DATA_MONTHLY;
    return TREND_DATA_DAILY;
  }, [trendType]);

  const maxVal = Math.max(...activeDataset.map(d => d.users));
  const minVal = 0;

  const points = useMemo(() => {
    return activeDataset.map((d, i) => {
      const x = padding.left + (i / (activeDataset.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((d.users - minVal) / (maxVal - minVal)) * chartHeight;
      return { x, y, data: d, index: i };
    });
  }, [activeDataset, chartWidth, chartHeight, maxVal]);

  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((path, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
    }, '');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const startX = points[0].x;
    const endX = points[points.length - 1].x;
    const baseY = padding.top + chartHeight;
    return `${linePath} L ${endX} ${baseY} L ${startX} ${baseY} Z`;
  }, [points, linePath, chartHeight]);

  return (
    <div className="relative w-full h-full">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8C5CFF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#8C5CFF" stopOpacity="0.0" />
          </linearGradient>
          <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padding.top + chartHeight * pct;
          const val = Math.round(maxVal - pct * (maxVal - minVal));
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y + 3}
                fill="rgba(160,160,160,0.5)"
                fontSize="10"
                fontFamily="Inter"
                textAnchor="end"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Area Under the Line */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Smooth Trend Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#8C5CFF"
          strokeWidth="2.5"
          filter="url(#line-glow)"
        />

        {/* Interaction Circles */}
        {points.map((p, i) => {
          const isAct = activePoint === i;
          return (
            <g key={i}>
              {/* Vertical guideline on hover */}
              {isAct && (
                <line
                  x1={p.x}
                  y1={padding.top}
                  x2={p.x}
                  y2={padding.top + chartHeight}
                  stroke="rgba(140, 92, 255, 0.25)"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                />
              )}

              {/* Data points */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isAct ? 5 : 3.5}
                fill={isAct ? '#ffffff' : '#8C5CFF'}
                stroke="#0b0b0b"
                strokeWidth={isAct ? 2.5 : 1.5}
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setActivePoint(i)}
                onMouseLeave={() => setActivePoint(null)}
              />

              {/* X Axis labels */}
              <text
                x={p.x}
                y={padding.top + chartHeight + 18}
                fill={isAct ? '#ffffff' : 'rgba(160,160,160,0.6)'}
                fontSize="10"
                fontWeight={isAct ? '600' : '400'}
                fontFamily="Inter"
                textAnchor="middle"
              >
                {p.data.day}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {activePoint !== null && (
        <div
          className="absolute z-10 pointer-events-none rounded-lg bg-[rgba(15,15,17,0.92)] border border-[rgba(255,255,255,0.08)] px-3 py-2 shadow-2xl transition-opacity"
          style={{
            left: `${(points[activePoint].x / width) * 100}%`,
            top: `${(points[activePoint].y / height) * 100 - 15}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[rgba(15,15,17,0.92)] border-r border-b border-[rgba(255,255,255,0.08)] rotate-45" />
          <p className="font-sans text-[10px] font-semibold text-white">{activeDataset[activePoint].day} Registrations</p>
          <p className="font-sans text-[9px] text-[#A0A0A0] leading-normal flex gap-3 justify-between mt-1">
            <span>New Users:</span>
            <span className="text-[#8C5CFF] font-semibold">+{activeDataset[activePoint].users}</span>
          </p>
          <p className="font-sans text-[9px] text-[#A0A0A0] leading-normal flex gap-3 justify-between">
            <span>New Creators:</span>
            <span className="text-emerald-400 font-semibold">+{activeDataset[activePoint].creators}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Generic Activity Trend Chart ────────────────────────────────────────────

function ActivityTrendChart({
  keys,
  colors,
  unit,
  period,
  chartId,
  isDual,
}: {
  keys: string[];
  colors: string[];
  unit: string;
  period: MetricPeriod;
  chartId: string;
  isDual?: boolean;
}) {
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const width = 500;
  const height = 160;
  const padding = { top: 18, right: 28, bottom: 28, left: 44 };
  const chartWidth  = width  - padding.left - padding.right;
  const chartHeight = height - padding.top  - padding.bottom;

  const dataset1 = ACTIVITY_METRICS[keys[0]][period];
  const dataset2 = isDual ? ACTIVITY_METRICS[keys[1]][period] : null;

  const maxVal = useMemo(() => {
    const v1 = Math.max(...dataset1.map(d => d.value));
    const v2 = dataset2 ? Math.max(...dataset2.map(d => d.value)) : 0;
    return Math.max(v1, v2, 1);
  }, [dataset1, dataset2]);

  const minVal = 0;

  const points1 = useMemo(() => {
    return dataset1.map((d, i) => {
      const x = padding.left + (i / Math.max(dataset1.length - 1, 1)) * chartWidth;
      const y = padding.top + chartHeight - ((d.value - minVal) / maxVal) * chartHeight;
      return { x, y, d, i };
    });
  }, [dataset1, chartWidth, chartHeight, maxVal]);

  const points2 = useMemo(() => {
    if (!dataset2) return [];
    return dataset2.map((d, i) => {
      const x = padding.left + (i / Math.max(dataset2.length - 1, 1)) * chartWidth;
      const y = padding.top + chartHeight - ((d.value - minVal) / maxVal) * chartHeight;
      return { x, y, d, i };
    });
  }, [dataset2, chartWidth, chartHeight, maxVal]);

  const linePath1 = useMemo(() => points1.reduce((p, pt, i) => i === 0 ? `M ${pt.x} ${pt.y}` : `${p} L ${pt.x} ${pt.y}`, ''), [points1]);
  const areaPath1 = useMemo(() => {
    if (!points1.length) return '';
    return `${linePath1} L ${points1[points1.length - 1].x} ${padding.top + chartHeight} L ${points1[0].x} ${padding.top + chartHeight} Z`;
  }, [linePath1, points1, chartHeight]);

  const linePath2 = useMemo(() => points2.reduce((p, pt, i) => i === 0 ? `M ${pt.x} ${pt.y}` : `${p} L ${pt.x} ${pt.y}`, ''), [points2]);
  const areaPath2 = useMemo(() => {
    if (!points2.length) return '';
    return `${linePath2} L ${points2[points2.length - 1].x} ${padding.top + chartHeight} L ${points2[0].x} ${padding.top + chartHeight} Z`;
  }, [linePath2, points2, chartHeight]);

  const gradId1  = `ag-1-${chartId}`;
  const gradId2  = `ag-2-${chartId}`;
  const glowId  = `ag-glow-${chartId}`;

  return (
    <div className="relative w-full" style={{ height: 160 }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id={gradId1} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={colors[0]} stopOpacity="0.18" />
            <stop offset="100%" stopColor={colors[0]} stopOpacity="0.0"  />
          </linearGradient>
          {isDual && (
            <linearGradient id={gradId2} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={colors[1]} stopOpacity="0.12" />
              <stop offset="100%" stopColor={colors[1]} stopOpacity="0.0"  />
            </linearGradient>
          )}
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid lines */}
        {[0, 0.5, 1].map((pct, i) => {
          const y   = padding.top + chartHeight * pct;
          const val = Math.round(maxVal - pct * (maxVal - minVal));
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y}
                stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <text x={padding.left - 6} y={y + 3.5}
                fill="rgba(160,160,160,0.45)" fontSize="9" fontFamily="Inter" textAnchor="end">
                {val >= 1000 ? `${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}k` : val}
              </text>
            </g>
          );
        })}

        {/* Areas */}
        <path d={areaPath1} fill={`url(#${gradId1})`} />
        {isDual && <path d={areaPath2} fill={`url(#${gradId2})`} />}

        {/* Lines */}
        <path d={linePath1} fill="none" stroke={colors[0]} strokeWidth="2" filter={`url(#${glowId})`} />
        {isDual && <path d={linePath2} fill="none" stroke={colors[1]} strokeWidth="2" filter={`url(#${glowId})`} />}

        {/* Interaction guideline on hover */}
        {activePoint !== null && (
          <line
            x1={points1[activePoint].x}
            y1={padding.top}
            x2={points1[activePoint].x}
            y2={padding.top + chartHeight}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.5"
            strokeDasharray="3,3"
          />
        )}

        {/* Point Interactive Areas */}
        {points1.map((p, i) => {
          const isAct = activePoint === i;
          return (
            <g key={i}>
              {/* Invisible bar to capture hovering easily */}
              <rect
                x={p.x - 12}
                y={padding.top}
                width={24}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setActivePoint(i)}
                onMouseLeave={() => setActivePoint(null)}
              />
              <circle
                cx={p.x} cy={p.y}
                r={isAct ? 4.5 : 3}
                fill={isAct ? '#ffffff' : colors[0]}
                stroke="#0b0b0b" strokeWidth={isAct ? 2 : 1.5}
                className="pointer-events-none"
              />
              {isDual && points2[i] && (
                <circle
                  cx={points2[i].x} cy={points2[i].y}
                  r={isAct ? 4.5 : 3}
                  fill={isAct ? '#ffffff' : colors[1]}
                  stroke="#0b0b0b" strokeWidth={isAct ? 2 : 1.5}
                  className="pointer-events-none"
                />
              )}
              <text
                x={p.x} y={padding.top + chartHeight + 16}
                fill={isAct ? '#ffffff' : 'rgba(160,160,160,0.55)'}
                fontSize="9" fontWeight={isAct ? '600' : '400'}
                fontFamily="Inter" textAnchor="middle"
                className="pointer-events-none"
              >
                {p.d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {activePoint !== null && (
        <div
          className="absolute z-10 pointer-events-none rounded-lg bg-[rgba(15,15,17,0.93)] border border-[rgba(255,255,255,0.08)] px-3 py-2 shadow-2xl"
          style={{
            left: `${(points1[activePoint].x / width) * 100}%`,
            top:  `${(points1[activePoint].y / height) * 100 - 12}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[rgba(15,15,17,0.93)] border-r border-b border-[rgba(255,255,255,0.08)] rotate-45" />
          <p className="font-sans text-[10px] font-semibold text-white">{dataset1[activePoint].label}</p>
          <p className="font-sans text-[9px] text-[#A0A0A0] flex gap-4 justify-between mt-0.5">
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: colors[0] }} />
              {keys[0]}:
            </span>
            <span className="font-semibold text-white">
              {dataset1[activePoint].value.toLocaleString()} {unit}
            </span>
          </p>
          {isDual && dataset2 && (
            <p className="font-sans text-[9px] text-[#A0A0A0] flex gap-4 justify-between">
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: colors[1] }} />
                {keys[1]}:
              </span>
              <span className="font-semibold text-white">
                {dataset2[activePoint].value.toLocaleString()} {unit}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Dashboard Component ──────────────────────────────────────────

export default function AdminDashboardPage({ onNavigate }: AdminDashboardPageProps) {
  const nav = (page: AdminPage) => onNavigate?.(page);
  const [logs] = useState<AdminActivityLog[]>(INITIAL_ACTIVITY_LOGS);

  // User registration trend select state
  const [trendType, setTrendType] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [showTrendDropdown, setShowTrendDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTrendDropdown) return;
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTrendDropdown(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showTrendDropdown]);

  const formatLogTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <div className="flex-1 w-full max-w-[72rem] mx-auto px-6 py-8 flex flex-col gap-8">

        {/* Header Banner */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-sans text-[36px] font-bold tracking-[-0.18px] text-foreground/80 leading-[42px]">
              Admin Dashboard
            </h1>
            <p className="mt-1 font-sans text-[13px] text-muted-foreground">
              Platform-wide performance monitoring, metrics, and administration.
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 font-sans text-[11px] font-medium text-emerald-500">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            All systems live
          </span>
        </div>

        {/* Primary Stat Cards */}
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <StatCard label="Total Users"   value="24,831" change="+3.2% this week"    up={true}  icon={<Users size={18} />}         accent="#8C5CFF" onClick={() => nav('All Users')} />
          <StatCard label="Active Jobs"   value="1,204"  change="+12% this week"     up={true}  icon={<Briefcase size={18} />}     accent="#3B82F6" onClick={() => nav('Active Jobs')} />
          <StatCard label="Open Disputes" value="47"     change="+8 since yesterday" up={false} icon={<Scale size={18} />}         accent="#F59E0B" onClick={() => nav('Disputes')} />
          <StatCard label="Risk Flags"    value="13"     change="-4 since yesterday" up={true}  icon={<AlertTriangle size={18} />} accent="#EF4444" onClick={() => nav('Risk Scores')} />
        </div>

        {/* Secondary Mini Metrics */}
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <MiniMetric label="Content Creators" value="3,218"  sub="142 pending verification" icon={<Video size={16} />}        accent="#8C5CFF" onClick={() => nav('Content Creators')} />
          <MiniMetric label="Buyers"           value="14,607" sub="23 spend limit alerts"    icon={<ShoppingCart size={16} />} accent="#3B82F6" onClick={() => nav('Buyers')} />
          <MiniMetric label="Sellers"          value="7,006"  sub="31 new applications"      icon={<Store size={16} />}        accent="#10B981" onClick={() => nav('Sellers')} />
          <MiniMetric label="Treasury Balance" value="845K"   sub="CAF tokens in reserve"    icon={<Coins size={16} />}        accent="#F59E0B" onClick={() => nav('Treasury')} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* User Registration Trend */}
          <div className="lg:col-span-2 rounded-[1.25rem] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div className="flex flex-col">
                <span className="font-sans text-[14px] font-semibold text-foreground">User Registration Trend</span>
                <span className="font-sans text-[11px] text-muted-foreground">New active users and creator registrations</span>
              </div>

              {/* Dynamic dropdown filter */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowTrendDropdown(v => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-foreground/80 bg-background border border-border rounded-[8px] hover:bg-border/40 hover:text-foreground transition-colors"
                >
                  {trendType}
                  <ChevronDown className={`size-3 transition-transform ${showTrendDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showTrendDropdown && (
                  <div className="absolute right-0 top-full mt-1 z-50 bg-[#0b0b0b] border border-border rounded-xl shadow-2xl min-w-[120px] py-1 overflow-hidden">
                    {(['Daily', 'Weekly', 'Monthly'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { setTrendType(t); setShowTrendDropdown(false); }}
                        className={`w-full text-left px-4 py-2 text-[12px] transition-colors hover:bg-background/40 ${
                          trendType === t ? 'text-foreground font-semibold' : 'text-muted-foreground'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-h-[180px]">
              <UserTrendChart trendType={trendType} />
            </div>
          </div>

          {/* User KYC / Verification Status Donut Chart */}
          <div className="rounded-[1.25rem] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div className="flex flex-col">
                <span className="font-sans text-[14px] font-semibold text-foreground">Verification Analytics</span>
                <span className="font-sans text-[11px] text-muted-foreground">Admins KYC & applications share</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-6">
              <PlatformDonutChart size={160} />
              
              {/* Legend List */}
              <div className="w-full flex flex-col gap-2 pt-1">
                {DONUT_DATA.map(d => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => nav(d.page)}
                    className="flex items-center justify-between text-[12px] hover:bg-background/40 px-2 py-1.5 rounded-lg border border-transparent hover:border-border transition-all w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground">{d.label}</span>
                    </div>
                    <span className="font-semibold text-foreground">{d.amount}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Logs & Quick Actions Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Admin Recent Activity Logs (Scrollbars hidden using CSS classes) */}
          <div className="lg:col-span-2 rounded-[1.25rem] border border-border bg-[#0b0b0b] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 bg-[#0b0b0b]">
              <div className="flex flex-col">
                <span className="font-sans text-[14px] font-semibold text-foreground">Admin Activity Logs</span>
                <span className="font-sans text-[11px] text-muted-foreground">Recent operations performed by admin operators</span>
              </div>
              <button 
                type="button" 
                onClick={() => nav('Admin Team')}
                className="text-[11px] text-[#8C5CFF] font-semibold hover:underline"
              >
                Manage Team
              </button>
            </div>
            
            {/* Scrollbars completely hidden using scrollbar-width: none (no-scrollbar class) */}
            <div className="divide-y divide-border/40 max-h-[350px] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-background/20 transition-colors">
                  <div className="flex-shrink-0 size-9 rounded-xl bg-background border border-border flex items-center justify-center text-[#8C5CFF]">
                    <Shield size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-foreground">{log.operatorName}</span>
                        <span className="text-[11px] text-muted-foreground">{log.operatorHandle}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#8C5CFF]/10 text-[#8C5CFF] font-semibold">
                          {log.operatorRole.split(' ')[0]}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatLogTime(log.timestamp)}</span>
                    </div>
                    <p className="text-[12px] text-foreground/80 mt-1">
                      {log.action} <span className="text-foreground font-semibold">{log.target}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-[1.25rem] border border-border bg-[#0b0b0b] overflow-hidden">
            <div className="px-6 py-5 border-b border-border/40">
              <span className="font-sans text-[14px] font-semibold text-foreground block">Quick Actions</span>
              <span className="font-sans text-[11px] text-muted-foreground block mt-0.5">Quickly jump to admin tasks</span>
            </div>
            <div className="flex flex-col gap-2.5 p-4">
              {[
                { label: 'Review Queue',      desc: '3 pending reviews',        accent: '#8C5CFF', page: 'Review Queue'     as AdminPage, icon: <ClipboardList size={16} /> },
                { label: 'Seller Apps',       desc: '31 new applications',      accent: '#10B981', page: 'Seller Apps'      as AdminPage, icon: <Store size={16} /> },
                { label: 'Open Disputes',     desc: '47 awaiting resolution',   accent: '#F59E0B', page: 'Disputes'         as AdminPage, icon: <Scale size={16} /> },
                { label: 'Risk Score Alerts', desc: '13 flagged accounts',      accent: '#EF4444', page: 'Risk Scores'      as AdminPage, icon: <Shield size={16} /> },
                { label: 'Content Creators',  desc: '142 pending verification', accent: '#A855F7', page: 'Content Creators' as AdminPage, icon: <Video size={16} /> },
                { label: 'Buyer Alerts',      desc: '23 spend limit breaches',  accent: '#3B82F6', page: 'Buyers'           as AdminPage, icon: <ShoppingCart size={16} /> },
              ].map(item => (
                <button
                  key={item.page}
                  type="button"
                  onClick={() => nav(item.page)}
                  className="group flex items-center gap-4 rounded-[0.875rem] border border-border p-4 text-left transition-all hover:border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/[0.03]"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                    style={{ background: `${item.accent}14`, color: item.accent }}
                  >
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-[0.8125rem] font-semibold text-foreground">{item.label}</p>
                    <p className="font-sans text-[0.75rem] text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Platform Utilization Health Pie Chart (Solid segment layout) */}
        <div className="rounded-[1.25rem] border border-border bg-[#0b0b0b] overflow-hidden flex flex-col p-6 gap-5">
          <div className="flex flex-col border-b border-border/40 pb-4">
            <span className="font-sans text-[14px] font-semibold text-foreground">Platform Utilization Health</span>
            <span className="font-sans text-[11px] text-muted-foreground">Distribution share of active platform accounts and jobs</span>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-10 py-2">
            <PlatformPieChart size={160} />

            {/* legend grid */}
            <div className="flex-1 grid grid-cols-2 gap-4 max-w-md w-full">
              {PIE_DATA.map(s => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => nav(s.page)}
                  className="flex items-center justify-between bg-background border border-border rounded-[12px] p-4 text-left hover:border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-[12px] text-muted-foreground font-medium">{s.label}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[14px] font-bold text-foreground">{s.amount}</span>
                    <span className="text-[10px] text-[#A0A0A0]">{s.pct}% share</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Platform Activity Trends ─────────────────────────────────────── */}
        <ActivityTrendsSection />

      </div>
    </div>
  );
}

// ─── Platform Activity Trends Section ────────────────────────────────────────

function ActivityTrendsSection() {
  const [periods, setPeriods] = useState<Record<string, MetricPeriod>>(
    Object.fromEntries(ACTIVITY_METRIC_META.map(m => [m.key, 'Daily' as MetricPeriod]))
  );
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openDropdown) return;
    const h = (e: MouseEvent) => {
      if (sectionRef.current && !sectionRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [openDropdown]);

  const setPeriod = (key: string, p: MetricPeriod) => {
    setPeriods(prev => ({ ...prev, [key]: p }));
    setOpenDropdown(null);
  };

  return (
    <div ref={sectionRef} className="flex flex-col gap-6">
      {/* Section header */}
      <div className="flex flex-col gap-0.5 mt-4">
        <h2 className="font-sans text-[20px] font-bold tracking-tight text-foreground/80">
          Platform Activity Trends
        </h2>
        <p className="font-sans text-[13px] text-muted-foreground">
          Daily aggregated platform-wide activity metrics across jobs, content, and token flows.
        </p>
      </div>

      {/* 2-column chart grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {ACTIVITY_METRIC_META.map(meta => {
          const period = periods[meta.key] || 'Daily';
          const isOpen = openDropdown === meta.key;

          // Calculate summary totals (handles single or dual metrics)
          const primaryKey = meta.keys[0];
          const dataset1   = ACTIVITY_METRICS[primaryKey]?.[period] || [];
          const total1     = dataset1.reduce((s, d) => s + d.value, 0);

          let summaryText = '';
          let changeText = '';
          let up = true;

          if (meta.isDual) {
            const secondaryKey = meta.keys[1];
            const dataset2     = ACTIVITY_METRICS[secondaryKey]?.[period] || [];
            const total2       = dataset2.reduce((s, d) => s + d.value, 0);
            
            const formatVal = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString();
            summaryText = `Posted: ${formatVal(total1)} | Completed: ${formatVal(total2)}`;
            
            const last1 = dataset1[dataset1.length - 1]?.value || 0;
            const prev1 = dataset1[dataset1.length - 2]?.value ?? last1;
            const pct1  = prev1 === 0 ? 0 : Math.round(((last1 - prev1) / prev1) * 100);

            const last2 = dataset2[dataset2.length - 1]?.value || 0;
            const prev2 = dataset2[dataset2.length - 2]?.value ?? last2;
            const pct2  = prev2 === 0 ? 0 : Math.round(((last2 - prev2) / prev2) * 100);

            changeText = `${pct1 >= 0 ? '+' : ''}${pct1}% / ${pct2 >= 0 ? '+' : ''}${pct2}% vs prev`;
            up = pct1 + pct2 >= 0;
          } else {
            const total = total1;
            summaryText = total >= 1000000
              ? `${(total / 1000000).toFixed(1)}M`
              : total >= 1000
              ? `${(total / 1000).toFixed(1)}k`
              : total.toLocaleString();

            const last = dataset1[dataset1.length - 1]?.value || 0;
            const prev = dataset1[dataset1.length - 2]?.value ?? last;
            const change = prev === 0 ? 0 : Math.round(((last - prev) / prev) * 100);
            changeText = `${change >= 0 ? '+' : ''}${change}% vs prev`;
            up = change >= 0;
          }

          return (
            <div
              key={meta.key}
              className="rounded-[1.25rem] border border-border bg-[#0b0b0b] p-6 flex flex-col gap-4"
            >
              {/* Card header */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    {meta.colors.map(col => (
                      <span
                        key={col}
                        className="size-2 rounded-full"
                        style={{ backgroundColor: col }}
                      />
                    ))}
                    <span className="font-sans text-[14px] font-semibold text-foreground">
                      {meta.key}
                    </span>
                  </div>
                  <span className="font-sans text-[11px] text-muted-foreground pl-4">
                    {meta.desc}
                  </span>
                </div>

                {/* Period dropdown */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(isOpen ? null : meta.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-foreground/80 bg-background border border-border rounded-[8px] hover:bg-border/40 hover:text-foreground transition-colors"
                  >
                    {period}
                    <ChevronDown className={`size-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="absolute right-0 top-full mt-1 z-50 bg-[#0b0b0b] border border-border rounded-xl shadow-2xl min-w-[110px] py-1 overflow-hidden">
                      {(['Daily', 'Weekly', 'Monthly'] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setPeriod(meta.key, t)}
                          className={`w-full text-left px-4 py-2 text-[12px] transition-colors hover:bg-background/40 ${
                            period === t ? 'text-foreground font-semibold' : 'text-muted-foreground'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary stats strip */}
              <div className="flex items-center gap-6 pl-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground">
                    {period === 'Daily' ? 'This week' : period === 'Weekly' ? 'This month' : 'This year'}
                  </span>
                  <span className="text-[18px] font-bold text-foreground tracking-tight">
                    {summaryText}
                    {!meta.isDual && (
                      <span className="text-[11px] font-normal text-muted-foreground"> {meta.unit}</span>
                    )}
                  </span>
                </div>
                <div className={`flex items-center gap-1 text-[12px] font-semibold ${
                  up ? 'text-emerald-500' : 'text-red-400'
                }`}>
                  {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {changeText}
                </div>
              </div>

              {/* Chart */}
              <ActivityTrendChart
                keys={meta.keys}
                colors={meta.colors}
                unit={meta.unit}
                period={period}
                chartId={meta.key.replace(/\s+/g, '-').toLowerCase()}
                isDual={meta.isDual}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
