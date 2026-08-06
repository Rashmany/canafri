'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  date: string;
  registered: number;
  freelancers: number;
  volume: number;
}

interface DonutSlice {
  label: string;
  value: number;
  pct: number;
  color: string;
  amount: string;
}

interface DailySeriesItem {
  date: string;
  fullDate?: string;
  registered: number;
  freelancers: number;
  volume: number;
  pct: number;
}

interface AnalyticsData {
  stats: {
    totalCCTransactions: number;
    totalCCTransactionsFormatted: string;
    dailyActiveUsers: number;
    avgReadSessionsPerUser: number;
    networkSharePct: number;
    totalRevenueCC: number;
  };
  revenueBreakdown: DonutSlice[];
  dailyVolumeSeries: DailySeriesItem[];
  cantonRewards: {
    monthlyCCTransactions: string;
    networkTotalEst: string;
    monthlyRewardsEstCC: number;
    usdValueEst: string;
    networkShareProgressPct: number;
  };
}

// ─── API Setup ────────────────────────────────────────────────────────────────

const API = '/api';

function getToken() {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('canafri_admin_access_token') ||
    localStorage.getItem('canafri_access_token') ||
    ''
  );
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  return fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(opts.headers ?? {}),
    },
  });
}

// ─── Design tokens ─────────────────────────────────────────────────────────────

const COLORS = {
  purple:  '#8C5CFF',
  green:   '#4ADE80',
  blue:    '#5993F4',
  red:     '#F87171',
  lilac:   '#AC8EF3',
  yellow:  '#DAC95A',
  muted:   '#A0A0A0',
};

const DATE_RANGES = ['Last 7 days', 'Last 14 days', 'Last 30 days', 'This Month', 'This Year'];

function rangeToDays(range: string): number {
  if (range.includes('14')) return 14;
  if (range.includes('30') || range.includes('Month')) return 30;
  if (range.includes('Year')) return 90;
  return 7;
}

function DateRangeSelect({
  value,
  onChange,
  variant = 'filled',
}: {
  value: string;
  onChange: (v: string) => void;
  variant?: 'filled' | 'ghost';
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={[
          'flex items-center gap-2 rounded-xl px-4 py-2.5 font-sans text-[0.8125rem] font-semibold text-white transition-colors',
          variant === 'filled'
            ? 'bg-[var(--input,#121212)] w-[200px] justify-between border border-border'
            : 'bg-[var(--background,#080808)] rounded-[5px] gap-2.5 font-medium',
        ].join(' ')}
      >
        {value}
        <ChevronDown size={14} className={`text-white/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 min-w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {DATE_RANGES.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => { onChange(r); setOpen(false); }}
              className={[
                'flex w-full items-center px-4 py-2.5 font-sans text-[0.8125rem] transition-colors text-left',
                r === value
                  ? 'bg-[#8C5CFF]/10 text-[#8C5CFF]'
                  : 'text-foreground/80 hover:bg-foreground/5',
              ].join(' ')}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  change,
  changeColor = COLORS.muted,
  loading = false,
}: {
  label: string;
  value: string | number;
  change: string;
  changeColor?: string;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5 rounded-2xl border border-border bg-card overflow-hidden px-5 py-4 min-h-[110px] justify-center transition-all duration-300 hover:border-[#8C5CFF]/30 hover:shadow-lg hover:shadow-[#8C5CFF]/5">
      <p className="font-sans text-[0.75rem] font-medium leading-[16px] text-[#A0A0A0]">{label}</p>
      <p className="font-sans text-[1.25rem] font-bold leading-[24px] tracking-[-0.05rem] text-white">
        {loading ? '...' : value}
      </p>
      <p className="font-sans text-[0.625rem] font-normal leading-3" style={{ color: changeColor }}>{change}</p>
    </div>
  );
}

// ─── Donut Chart (SVG, pure) ──────────────────────────────────────────────────

function DonutChart({ slices, size = 230 }: { slices: DonutSlice[]; size?: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.44;
  const innerR = size * 0.31;
  const gap = 3;

  const total = slices.reduce((s, d) => s + d.value, 0);

  let cursor = -90;
  const calculatedSlices = slices.map((d, i) => {
    const slicePct = total > 0 ? d.value / total : 0;
    const sweep = slicePct * (360 - gap * slices.length);
    const start = cursor + gap / 2;
    const end = cursor + (sweep > 0 ? sweep : 0.1);
    cursor = end + gap / 2;

    const mid = (((start + end) / 2) * Math.PI) / 180;
    return { ...d, start, end, mid, index: i };
  });

  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        <defs>
          {calculatedSlices.map(s => (
            <filter key={s.index} id={`glow-${s.index}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          ))}
          <filter id="center-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.5" />
          </filter>
        </defs>

        <circle cx={cx} cy={cy} r={outerR + 4} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={innerR - 4} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

        {total === 0 ? (
          <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} stroke="#1a1a1a" strokeWidth={outerR - innerR} fill="none" />
        ) : (
          calculatedSlices.map(s => {
            const isHov = hovered === s.index;
            const rOuter = isHov ? outerR + 6 : outerR;
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

            const offsetDist = isHov ? 4 : 0;
            const tx = offsetDist * Math.cos(s.mid);
            const ty = offsetDist * Math.sin(s.mid);

            return (
              <path
                key={s.index}
                d={dPath}
                fill={s.color}
                fillOpacity={isHov ? 0.95 : 0.75}
                stroke="#0b0b0b"
                strokeWidth={2}
                transform={`translate(${tx}, ${ty})`}
                className="cursor-pointer transition-all duration-300 ease-out"
                onMouseEnter={() => setHovered(s.index)}
                onMouseLeave={() => setHovered(null)}
                filter={isHov ? `url(#glow-${s.index})` : undefined}
              />
            );
          })
        )}

        <circle
          cx={cx}
          cy={cy}
          r={innerR - 6}
          fill="rgba(15, 15, 17, 0.9)"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
          filter="url(#center-shadow)"
        />
      </svg>

      <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none select-none">
        <span className="font-sans text-[0.625rem] font-medium tracking-wider text-[#A0A0A0] uppercase">
          {hovered !== null ? 'Share' : 'Total CC'}
        </span>
        <span className="font-sans text-[1.25rem] font-bold text-white leading-none mt-0.5 tracking-tight">
          {hovered !== null ? `${slices[hovered].pct.toFixed(1)}%` : total.toLocaleString()}
        </span>
        <span className="font-sans text-[0.625rem] text-[#8C5CFF] font-medium leading-[14px] mt-0.5 max-w-[90px] truncate">
          {hovered !== null ? slices[hovered].label : 'Volume'}
        </span>
      </div>
    </div>
  );
}

// ─── Legend item ─────────────────────────────────────────────────────────────

function LegendItem({ slice }: { slice: DonutSlice }) {
  return (
    <div className="flex flex-col gap-[5px]">
      <div className="rounded-[2px] size-3.5 shrink-0" style={{ background: slice.color }} />
      <div className="flex flex-col gap-[2px]">
        <p className="font-sans text-[10px] text-[#A0A0A0] leading-[13px] truncate">{slice.label}</p>
        <div className="flex items-center gap-2">
          <span className="font-sans text-[10px] text-white font-medium whitespace-nowrap">{slice.amount}</span>
          <span className="font-sans text-[10px] text-[#A0A0A0] whitespace-nowrap">({slice.pct}%)</span>
        </div>
      </div>
    </div>
  );
}

// ─── Bar Chart (SVG, pure, responsive) ───────────────────────────────────────

interface BarChartProps {
  series: DailySeriesItem[];
  tooltip: TooltipState;
  onTooltip: (state: TooltipState) => void;
}

function BarChart({ series, tooltip, onTooltip }: BarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeBar, setActiveBar] = useState<number | null>(null);

  const W = 100;
  const H = 70;
  const padL = 10;
  const padR = 2;
  const padT = 6;
  const padB = 10;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const barCount = series.length > 0 ? series.length : 7;
  const barW = chartW / barCount;
  const barGap = barW * 0.35;
  const innerBarW = Math.max(0.5, barW - barGap);

  const yLabels = [
    { pct: 0, label: '0%' },
    { pct: 25, label: '25%' },
    { pct: 50, label: '50%' },
    { pct: 75, label: '75%' },
    { pct: 100, label: '100%' }
  ];

  const handleBarMouseMove = useCallback((e: React.MouseEvent, i: number) => {
    if (!svgRef.current || !series[i]) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    setActiveBar(i);
    const item = series[i];
    onTooltip({
      visible: true,
      x: clientX,
      y: clientY,
      date: item.fullDate || item.date,
      registered: item.registered,
      freelancers: item.freelancers,
      volume: item.volume,
    });
  }, [series, onTooltip]);

  const handleMouseLeave = () => {
    setActiveBar(null);
    onTooltip({ ...tooltip, visible: false });
  };

  return (
    <div className="relative w-full" style={{ paddingBottom: '60%' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A885FF" />
            <stop offset="60%" stopColor="#8C5CFF" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#8C5CFF" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="barGradActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C0A8FF" />
            <stop offset="30%" stopColor="#9C73FF" />
            <stop offset="100%" stopColor="#8C5CFF" stopOpacity="0.4" />
          </linearGradient>
          <filter id="bar-glow" x="-30%" y="-10%" width="160%" height="120%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {yLabels.map(({ pct, label }) => {
          const y = padT + chartH - (pct / 100) * chartH;
          return (
            <g key={pct} className="transition-all duration-300">
              <line 
                x1={padL} 
                y1={y} 
                x2={W - padR} 
                y2={y} 
                stroke="rgba(255, 255, 255, 0.05)" 
                strokeWidth="0.25" 
                strokeDasharray={pct === 0 ? "none" : "1, 1"}
              />
              <text 
                x={padL - 2} 
                y={y + 0.8} 
                textAnchor="end" 
                fill="rgba(160, 160, 160, 0.6)" 
                fontSize="2.4" 
                fontWeight="500"
                fontFamily="Inter"
              >
                {label}
              </text>
            </g>
          );
        })}

        {series.map((item, i) => {
          const bh = Math.max(1, (item.pct / 100) * chartH);
          const bx = padL + i * barW + barGap / 2;
          const by = padT + chartH - bh;
          const isActive = activeBar === i;

          const dateParts = item.date.split(' ');
          const dayNum = dateParts[0] ?? '';
          const monthName = dateParts[1] ?? '';

          return (
            <g key={i} className="transition-all duration-300">
              <rect
                x={padL + i * barW}
                y={padT}
                width={barW}
                height={chartH}
                fill="transparent"
                className="cursor-pointer"
                onMouseMove={(e) => handleBarMouseMove(e, i)}
              />

              <rect
                x={bx}
                y={by}
                width={innerBarW}
                height={bh}
                rx="0.7"
                fill={isActive ? "url(#barGradActive)" : "url(#barGrad)"}
                stroke={isActive ? "rgba(255,255,255,0.2)" : "rgba(140, 92, 255, 0.15)"}
                strokeWidth="0.2"
                filter={isActive ? "url(#bar-glow)" : undefined}
                className="pointer-events-none transition-all duration-300 ease-out"
              />

              {isActive && (
                <circle
                  cx={bx + innerBarW / 2}
                  cy={by}
                  r="0.5"
                  fill="#ffffff"
                  filter="drop-shadow(0 0 2px #ffffff)"
                />
              )}

              <text
                x={bx + innerBarW / 2}
                y={padT + chartH + 4.5}
                textAnchor="middle"
                fill={isActive ? "#ffffff" : "rgba(160, 160, 160, 0.8)"}
                fontSize="2.2"
                fontWeight={isActive ? "600" : "500"}
                fontFamily="Inter"
                className="transition-colors duration-200 pointer-events-none"
              >
                {dayNum}
              </text>
              <text
                x={bx + innerBarW / 2}
                y={padT + chartH + 7.5}
                textAnchor="middle"
                fill="rgba(160, 160, 160, 0.5)"
                fontSize="1.8"
                fontFamily="Inter"
                className="pointer-events-none"
              >
                {monthName}
              </text>
            </g>
          );
        })}
      </svg>

      {tooltip.visible && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg bg-[rgba(15,15,17,0.92)] border border-[rgba(255,255,255,0.12)] backdrop-blur-md px-3.5 py-2.5 shadow-2xl transition-all duration-150 ease-out min-w-[140px]"
          style={{ 
            left: `${(tooltip.x / (svgRef.current?.getBoundingClientRect().width || 1)) * 100}%`,
            top: `${(tooltip.y / (svgRef.current?.getBoundingClientRect().height || 1)) * 100 - 15}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[rgba(15,15,17,0.92)] border-r border-b border-[rgba(255,255,255,0.12)] rotate-45" />
          <p className="font-sans text-[11px] font-semibold text-white leading-tight mb-1.5">{tooltip.date}</p>
          <p className="font-sans text-[10px] text-[#A0A0A0] leading-normal flex justify-between gap-4">
            <span>New Users:</span>
            <span className="text-white font-medium">{tooltip.registered}</span>
          </p>
          <p className="font-sans text-[10px] text-[#A0A0A0] leading-normal flex justify-between gap-4">
            <span>New Freelancers:</span>
            <span className="text-white font-medium">{tooltip.freelancers}</span>
          </p>
          <p className="font-sans text-[10px] text-[#8C5CFF] leading-normal flex justify-between gap-4 mt-0.5 pt-0.5 border-t border-white/10 font-semibold">
            <span>CC Volume:</span>
            <span>{tooltip.volume.toLocaleString()} CC</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Canton Rewards Panel ────────────────────────────────────────────────────

function CantonRewardsPanel({ rewards }: { rewards?: AnalyticsData['cantonRewards'] }) {
  const rows = [
    { label: 'CC transactions this month', value: rewards?.monthlyCCTransactions ?? '0' },
    { label: 'Network total (est.)',        value: rewards?.networkTotalEst ?? '18.3M' },
    { label: 'Rewards pool (monthly)',      value: '516M CC' },
  ];

  const sharePct = rewards?.networkShareProgressPct ?? 0.46;

  return (
    <div className="rounded-[24px] border border-border bg-card px-8 py-8 flex flex-col gap-7 w-full max-w-full">
      <div className="flex items-center w-full">
        <p className="font-sans text-[0.875rem] font-bold leading-[18px] text-white text-center w-full">
          Canton Featured App Rewards
        </p>
      </div>

      <div className="h-px w-full bg-border" />

      <div className="rounded-2xl bg-[#121215] border border-border px-6 py-4 flex flex-col gap-1 w-full">
        <p className="font-sans text-[11px] font-medium text-[#A0A0A0]">Estimated Monthly Rewards</p>
        <p className="font-sans text-[1.5rem] font-bold text-white">
          {rewards?.monthlyRewardsEstCC ? `${rewards.monthlyRewardsEstCC.toFixed(2)} CC` : '0.00 CC'}
        </p>
        <p className="font-sans text-[10px] text-[#A0A0A0]">
          ≈ {rewards?.usdValueEst ?? '$0.00'} at current CC price
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between font-sans text-[11px] text-[#A0A0A0] font-medium">
          <span>Network share progress</span>
          <span className="text-[#8C5CFF] font-semibold">{sharePct}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-[#1a1a1a] overflow-hidden border border-border">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, sharePct * 100)}%`,
              background: 'linear-gradient(90deg, #8C5CFF 0%, #5993F4 100%)',
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-2">
        {rows.map((row, i) => (
          <div key={row.label}>
            <div className="flex items-center justify-between font-sans text-[0.8125rem] font-medium whitespace-nowrap w-full">
              <span className="text-white/80">{row.label}</span>
              <span className="text-[#A0A0A0] font-mono">{row.value}</span>
            </div>
            {i < rows.length - 1 && <div className="mt-4 h-px w-full bg-border/60" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('Last 7 days');
  const [revPeriod, setRevPeriod] = useState('This Month');
  const [volPeriod, setVolPeriod] = useState('Last 7 Days');
  const [loading, setLoading]     = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const [tooltip, setTooltip]     = useState<TooltipState>({
    visible: false, x: 0, y: 0, date: '', registered: 0, freelancers: 0, volume: 0,
  });

  // Stable ref so toast never causes loadAnalytics to re-create (prevents double-fetch)
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; });

  const loadAnalytics = useCallback(async (rangeStr: string) => {
    setLoading(true);
    try {
      const days = rangeToDays(rangeStr);
      const res = await apiFetch(`/admin/analytics?days=${days}`);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg = errBody?.message || `Server responded with ${res.status}`;
        toastRef.current(msg, 'error');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setAnalytics(data);
      } else {
        toastRef.current('Failed to load platform analytics.', 'error');
      }
    } catch (err: any) {
      toastRef.current('Network error loading platform analytics.', 'error');
    } finally {
      setLoading(false);
    }
  // stable: no deps that change every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAnalytics(dateRange);
  // loadAnalytics is stable (no-dep useCallback), dateRange is the only real trigger
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const statCardsData = [
    {
      label: 'Total CC Transactions',
      value: analytics?.stats.totalCCTransactionsFormatted ?? '0',
      change: 'Calculated across all activities',
      changeColor: COLORS.muted,
    },
    {
      label: 'Daily Active Users',
      value: analytics?.stats.dailyActiveUsers ?? '0',
      change: 'Active in last 24h',
      changeColor: COLORS.green,
    },
    {
      label: 'Avg Read Sessions / User',
      value: analytics?.stats.avgReadSessionsPerUser ?? '0',
      change: 'Read stakes per registered member',
      changeColor: COLORS.muted,
    },
    {
      label: 'Network Share (est.)',
      value: `${analytics?.stats.networkSharePct ?? 0.46}%`,
      change: 'of total Canton volume',
      changeColor: COLORS.muted,
    },
  ];

  const slices = analytics?.revenueBreakdown ?? [];
  const series = analytics?.dailyVolumeSeries ?? [];

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col gap-6 w-full max-w-[1100px] mx-auto px-6 py-6">

        {/* Heading & Refresh Button */}
        <div className="flex items-center justify-between">
          <h1 className="font-sans text-[1.875rem] font-bold leading-[34px] tracking-[-0.15px] text-white/80">
            Platform Analytics
          </h1>
          <button
            type="button"
            onClick={() => loadAnalytics(dateRange)}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 font-sans text-[0.8125rem] font-semibold text-white transition-colors hover:bg-foreground/5 disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="flex flex-col gap-5">

          {/* Date range bar */}
          <div className="flex h-[64px] items-center justify-between rounded-2xl border border-border bg-card px-4">
            <span className="font-sans text-[0.8125rem] font-medium text-[#A0A0A0]">Time Period Range:</span>
            <DateRangeSelect value={dateRange} onChange={setDateRange} variant="filled" />
          </div>

          {/* Stat cards row */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCardsData.map(c => (
              <StatCard key={c.label} {...c} loading={loading} />
            ))}
          </div>

          {/* Revenue + Bar chart row */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

            {/* Revenue Breakdown card */}
            <div className="flex flex-col gap-8 rounded-2xl border border-border bg-card p-6 lg:flex-1">
              <div className="flex items-center justify-between">
                <p className="font-sans text-[0.875rem] font-bold text-white whitespace-nowrap">Revenue Breakdown</p>
                <DateRangeSelect value={revPeriod} onChange={setRevPeriod} variant="ghost" />
              </div>

              {loading ? (
                <div className="flex h-[230px] items-center justify-center">
                  <div className="size-8 rounded-full border-2 border-[#8C5CFF] border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
                  <DonutChart slices={slices} size={210} />

                  <div className="flex flex-col gap-4 flex-1 min-w-0">
                    <div className="grid grid-cols-2 gap-4">
                      {slices.slice(0, 2).map(s => <LegendItem key={s.label} slice={s} />)}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {slices.slice(2, 4).map(s => <LegendItem key={s.label} slice={s} />)}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {slices.slice(4, 6).map(s => <LegendItem key={s.label} slice={s} />)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Daily Transaction Volume chart */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 lg:flex-1">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#080808] to-[#0b0b0b] opacity-95" />
              <div className="relative flex flex-col gap-6 h-full">
                <div className="flex items-center justify-between shrink-0">
                  <p className="font-sans text-[0.875rem] font-bold text-white whitespace-nowrap">
                    Daily Transaction Volume
                  </p>
                  <DateRangeSelect value={volPeriod} onChange={setVolPeriod} variant="ghost" />
                </div>

                <div className="flex-1 min-h-[300px]">
                  {loading ? (
                    <div className="flex h-[300px] items-center justify-center">
                      <div className="size-8 rounded-full border-2 border-[#8C5CFF] border-t-transparent animate-spin" />
                    </div>
                  ) : (
                    <BarChart series={series} tooltip={tooltip} onTooltip={setTooltip} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Canton Rewards panel */}
          <CantonRewardsPanel rewards={analytics?.cantonRewards} />

        </div>
      </div>
    </div>
  );
}
