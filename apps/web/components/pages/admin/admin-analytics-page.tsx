'use client';

import { useState, useRef, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  date: string;
  registered: number;
  freelancers: number;
}

// ─── Design tokens (from Figma) ───────────────────────────────────────────────

const COLORS = {
  purple:  '#8C5CFF',
  green:   '#4ADE80',
  blue:    '#5993F4',
  red:     '#F87171',
  lilac:   '#AC8EF3',
  yellow:  '#DAC95A',
  muted:   '#A0A0A0',
  card:    'var(--card, #0b0b0b)',
  border:  'var(--border, #121212)',
  bg:      'var(--background, #080808)',
};

// ─── Date-range selector ──────────────────────────────────────────────────────

const DATE_RANGES = ['Last 7 days', 'Last 14 days', 'Last 30 days', 'This Month', 'This Year'];

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
            ? 'bg-[var(--input,#121212)] w-[200px] justify-between'
            : 'bg-[var(--background,#080808)] rounded-[5px] gap-2.5 font-medium',
        ].join(' ')}
      >
        {value}
        <ChevronDown size={14} className={`text-white/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
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
}: {
  label: string;
  value: string | number;
  change: string;
  changeColor?: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5 rounded-2xl border border-border bg-card overflow-hidden px-5 py-4 min-h-[110px] justify-center transition-all duration-300 hover:border-[#8C5CFF]/30 hover:shadow-lg hover:shadow-[#8C5CFF]/5">
      <p className="font-sans text-[0.75rem] font-medium leading-[16px] text-[#A0A0A0]">{label}</p>
      <p className="font-sans text-[1.25rem] font-bold leading-[24px] tracking-[-0.05rem] text-white">{value}</p>
      <p className="font-sans text-[0.625rem] font-normal leading-3" style={{ color: changeColor }}>{change}</p>
    </div>
  );
}

// ─── Donut Chart (SVG, pure) ──────────────────────────────────────────────────

interface DonutSlice {
  label: string;
  value: number;
  pct: number;
  color: string;
  amount: string;
}

const DONUT_DATA: DonutSlice[] = [
  { label: 'Content read stakes',    value: 52140, pct: 61.9, color: COLORS.purple, amount: '52,140' },
  { label: 'Daily check-ins',        value: 18200, pct: 21.6, color: COLORS.green,  amount: '18,200' },
  { label: 'Job milestone payments', value: 5890,  pct: 7.0,  color: COLORS.blue,   amount: '5,890' },
  { label: 'Subscription renewals',  value: 4210,  pct: 5.0,  color: COLORS.red,    amount: '4,210' },
  { label: 'Job applications',       value: 2980,  pct: 3.5,  color: COLORS.lilac,  amount: '2,980' },
  { label: 'Other',                  value: 799,   pct: 0.9,  color: COLORS.yellow, amount: '799' },
];

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

function DonutChart({ size = 230 }: { size?: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.44;
  const innerR = size * 0.31; // slightly thinner for a more elegant ring look
  const gap = 3; // degrees gap between slices for a clean segmented style

  const total = DONUT_DATA.reduce((s, d) => s + d.value, 0);
  let cursor = -90; // start at top

  const slices = DONUT_DATA.map((d, i) => {
    const sweep = (d.value / total) * (360 - gap * DONUT_DATA.length);
    const start = cursor + gap / 2;
    const end = cursor + sweep;
    cursor = end + gap / 2;

    const mid = ((start + end) / 2 * Math.PI) / 180;
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
          {/* Neon Glow Filters */}
          {slices.map(s => (
            <filter key={s.index} id={`glow-${s.index}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          ))}
          {/* Inner Shadow for Central Ring */}
          <filter id="center-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Outer subtle halo ring */}
        <circle cx={cx} cy={cy} r={outerR + 4} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={innerR - 4} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

        {/* Slices */}
        {slices.map(s => {
          const isHov = hovered === s.index;
          const rOuter = isHov ? outerR + 6 : outerR;
          const rInner = isHov ? innerR - 2 : innerR;

          // Compute path coordinates
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

          // Translate slightly outward on hover along midpoint vector for 3D pop effect
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
        })}

        {/* Center Glass Dial / Circle */}
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

      {/* Floating Center Overlay Text (combines clean HTML rendering over SVG) */}
      <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none select-none">
        <span className="font-sans text-[0.625rem] font-medium tracking-wider text-[#A0A0A0] uppercase">
          {hovered !== null ? 'Percentage' : 'Total CC'}
        </span>
        <span className="font-sans text-[1.375rem] font-bold text-white leading-none mt-0.5 tracking-tight">
          {hovered !== null ? `${DONUT_DATA[hovered].pct.toFixed(1)}%` : '84.2K'}
        </span>
        <span className="font-sans text-[0.625rem] text-[#8C5CFF] font-medium leading-[14px] mt-0.5 max-w-[90px] truncate">
          {hovered !== null ? DONUT_DATA[hovered].label : 'Volume'}
        </span>
      </div>
    </div>
  );
}

// ─── Legend item ─────────────────────────────────────────────────────────────

function LegendItem({ slice }: { slice: DonutSlice }) {
  return (
    <div className="flex flex-col gap-[5px]">
      <div className="rounded-[2px] size-4 shrink-0" style={{ background: slice.color }} />
      <div className="flex flex-col gap-[5px]">
        <p className="font-sans text-[10px] text-[#A0A0A0] w-36 leading-[13px]">{slice.label}</p>
        <div className="flex items-center gap-3">
          <span className="font-sans text-[10px] text-white font-normal leading-[13px] whitespace-nowrap">{slice.amount}</span>
          <span className="font-sans text-[10px] text-[#A0A0A0] leading-[13px] whitespace-nowrap">{slice.pct}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Bar Chart (SVG, pure, responsive) ───────────────────────────────────────

const BAR_LABELS = ['1 July', '2 July', '3 July', '4 July', '5 July', '6 July', '7 July'];
const BAR_VALUES = [62, 72, 45, 100, 53, 65, 70]; // as % of max

interface BarChartProps {
  tooltip: TooltipState;
  onTooltip: (state: TooltipState) => void;
}

function BarChart({ tooltip, onTooltip }: BarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeBar, setActiveBar] = useState<number | null>(null);

  const W = 100; // viewBox width
  const H = 70;  // reduced height for better aspect ratio
  const padL = 10;
  const padR = 2;
  const padT = 6;
  const padB = 10;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const barW = chartW / BAR_VALUES.length;
  const barGap = barW * 0.35; // slightly wider gap for a clean modern layout
  const innerBarW = barW - barGap;

  const yLabels = [
    { pct: 0, label: '0%' },
    { pct: 25, label: '25%' },
    { pct: 50, label: '50%' },
    { pct: 75, label: '75%' },
    { pct: 100, label: '100%' }
  ];

  const MOCK_REGISTERED   = [18, 25, 12, 34, 20, 28, 22];
  const MOCK_FREELANCERS  = [2, 3, 1, 5, 2, 4, 3];

  const handleBarMouseMove = useCallback((e: React.MouseEvent, i: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    
    // Calculate SVG coordinate translation for exact tooltip tracking
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    setActiveBar(i);
    onTooltip({
      visible: true,
      x: clientX,
      y: clientY,
      date: `${BAR_LABELS[i]} 2026`,
      registered: MOCK_REGISTERED[i],
      freelancers: MOCK_FREELANCERS[i],
    });
  }, [onTooltip]);

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
          {/* Futuristic Purple Bar Gradient */}
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A885FF" />
            <stop offset="60%" stopColor="#8C5CFF" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#8C5CFF" stopOpacity="0.1" />
          </linearGradient>
          {/* Active Highlight Bar Gradient */}
          <linearGradient id="barGradActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C0A8FF" />
            <stop offset="30%" stopColor="#9C73FF" />
            <stop offset="100%" stopColor="#8C5CFF" stopOpacity="0.4" />
          </linearGradient>
          {/* Soft neon glow for active bar */}
          <filter id="bar-glow" x="-30%" y="-10%" width="160%" height="120%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Y Grid Lines & Labels */}
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

        {/* Bars */}
        {BAR_VALUES.map((v, i) => {
          const bh = (v / 100) * chartH;
          const bx = padL + i * barW + barGap / 2;
          const by = padT + chartH - bh;
          const isActive = activeBar === i;

          return (
            <g key={i} className="transition-all duration-300">
              {/* Invisible wide capture area for easy hovering */}
              <rect
                x={padL + i * barW}
                y={padT}
                width={barW}
                height={chartH}
                fill="transparent"
                className="cursor-pointer"
                onMouseMove={(e) => handleBarMouseMove(e, i)}
              />

              {/* The Visual Bar */}
              <rect
                x={bx}
                y={by}
                width={innerBarW}
                height={bh}
                rx="0.7" // Rounded top corners
                fill={isActive ? "url(#barGradActive)" : "url(#barGrad)"}
                stroke={isActive ? "rgba(255,255,255,0.2)" : "rgba(140, 92, 255, 0.15)"}
                strokeWidth="0.2"
                filter={isActive ? "url(#bar-glow)" : undefined}
                className="pointer-events-none transition-all duration-300 ease-out"
              />

              {/* Top Accent Dot on hovered bar */}
              {isActive && (
                <circle
                  cx={bx + innerBarW / 2}
                  cy={by}
                  r="0.5"
                  fill="#ffffff"
                  filter="drop-shadow(0 0 2px #ffffff)"
                />
              )}

              {/* X Axis Labels */}
              <text
                x={bx + innerBarW / 2}
                y={padT + chartH + 4.5}
                textAnchor="middle"
                fill={isActive ? "#ffffff" : "rgba(160, 160, 160, 0.8)"}
                fontSize="2.4"
                fontWeight={isActive ? "600" : "500"}
                fontFamily="Inter"
                className="transition-colors duration-200 pointer-events-none"
              >
                {BAR_LABELS[i].split(' ')[0]}
              </text>
              <text
                x={bx + innerBarW / 2}
                y={padT + chartH + 7.5}
                textAnchor="middle"
                fill="rgba(160, 160, 160, 0.5)"
                fontSize="2.0"
                fontFamily="Inter"
                className="pointer-events-none"
              >
                {BAR_LABELS[i].split(' ')[1]}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Glassmorphic Tooltip Overlay */}
      {tooltip.visible && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg bg-[rgba(15,15,17,0.85)] border border-[rgba(255,255,255,0.08)] backdrop-blur-md px-3 py-2 shadow-2xl transition-all duration-150 ease-out"
          style={{ 
            left: `${(tooltip.x / (svgRef.current?.getBoundingClientRect().width || 1)) * 100}%`,
            top: `${(tooltip.y / (svgRef.current?.getBoundingClientRect().height || 1)) * 100 - 15}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[rgba(15,15,17,0.85)] border-r border-b border-[rgba(255,255,255,0.08)] rotate-45" />
          <p className="font-sans text-[10px] font-semibold text-white leading-tight mb-1">{tooltip.date}</p>
          <p className="font-sans text-[9px] text-[#A0A0A0] leading-normal flex justify-between gap-4">
            <span>New register:</span>
            <span className="text-white font-medium">{tooltip.registered}</span>
          </p>
          <p className="font-sans text-[9px] text-[#A0A0A0] leading-normal flex justify-between gap-4">
            <span>New freelancer:</span>
            <span className="text-white font-medium">{tooltip.freelancers}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Canton rewards panel ────────────────────────────────────────────────────

function CantonRewardsPanel() {
  const NETWORK_SHARE_PCT = 46; // 0.46% shown as 46% of the bar fill

  const rows = [
    { label: 'CC transactions this month', value: '84,219' },
    { label: 'Network total (est.)',        value: '18.3M' },
    { label: 'Rewards pool (monthly)',      value: '516M CC' },
  ];

  return (
    <div className="rounded-[24px] border border-border bg-card px-12 py-8 flex flex-col gap-9 w-full md:px-[200px] lg:px-[200px] max-w-full">
      {/* Title */}
      <div className="flex items-center w-full">
        <p className="font-sans text-[0.8125rem] font-medium leading-[18px] text-white/80 text-center w-full">
          Canton Featured App Rewards
        </p>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-border" />

      {/* Estimated rewards box */}
      <div className="rounded-2xl bg-[#2A2C33] opacity-90 px-6 py-2.5 flex flex-col gap-2 w-full">
        <p className="font-sans text-[10px] font-normal leading-[13px] text-[#A0A0A0]">Estimated Monthly Rewards</p>
        <p className="font-sans text-[1.375rem] font-medium leading-[26px] tracking-[-0.066px] text-white/80">0.00</p>
        <p className="font-sans text-[10px] font-normal leading-[13px] text-[#A0A0A0]">≈ $437,000 at current CC price</p>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center justify-between font-sans text-[10px] text-[#A0A0A0] leading-[13px] whitespace-nowrap">
          <span>Network share progress</span>
          <span>0.46%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-[#1a1a1a] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${NETWORK_SHARE_PCT}%`,
              background: 'linear-gradient(90deg, #8C5CFF 0%, #5993F4 100%)',
            }}
          />
        </div>
      </div>

      {/* Stats rows */}
      {rows.map((row, i) => (
        <div key={row.label}>
          <div className="flex items-center justify-between font-sans text-[0.8125rem] font-medium leading-[18px] whitespace-nowrap w-full">
            <span className="text-white/80">{row.label}</span>
            <span className="text-[#A0A0A0]">{row.value}</span>
          </div>
          {i < rows.length - 1 && <div className="mt-9 h-px w-full bg-border" />}
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange]     = useState('Last 7 days');
  const [revPeriod, setRevPeriod]     = useState('This Month');
  const [volPeriod, setVolPeriod]     = useState('Last 14 Days');
  const [tooltip, setTooltip]         = useState<TooltipState>({
    visible: false, x: 0, y: 0, date: '', registered: 0, freelancers: 0,
  });

  const STAT_CARDS = [
    { label: 'Total CC Transactions',     value: '0', change: '+204% vs last month', changeColor: COLORS.muted },
    { label: 'Daily Active Users',        value: '0', change: '+18% this month',     changeColor: COLORS.green },
    { label: 'Avg Read Sessions / User',  value: '0', change: '+1.1 vs last month',  changeColor: COLORS.muted },
    { label: 'Network Share (est.)',      value: '0', change: 'of total Canton volume', changeColor: COLORS.muted },
  ];

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col gap-6 w-full max-w-[1100px] mx-auto px-6 py-6">

        {/* Heading */}
        <h1 className="font-sans text-[1.875rem] font-bold leading-[34px] tracking-[-0.15px] text-white/80">
          Platform Analytics
        </h1>

        <div className="flex flex-col gap-5">

          {/* Date range bar */}
          <div className="flex h-[64px] items-center rounded-2xl border border-border bg-card px-4">
            <DateRangeSelect value={dateRange} onChange={setDateRange} variant="filled" />
          </div>

          {/* Stat cards row */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STAT_CARDS.map(c => (
              <StatCard key={c.label} {...c} />
            ))}
          </div>

          {/* Revenue + Bar chart row */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

            {/* Revenue Breakdown card */}
            <div className="flex flex-col gap-[50px] rounded-2xl border border-border bg-card p-6 lg:flex-1">
              {/* Header */}
              <div className="flex items-center justify-between">
                <p className="font-sans text-[0.8125rem] font-medium text-white/80 whitespace-nowrap">Revenue Breakdown</p>
                <DateRangeSelect value={revPeriod} onChange={setRevPeriod} variant="ghost" />
              </div>

              {/* Donut + legend */}
              <div className="flex flex-col items-center gap-10 sm:flex-row sm:items-center">
                <DonutChart size={230} />

                {/* Legend grid */}
                <div className="flex flex-col gap-6 flex-1 min-w-0">
                  <div className="grid grid-cols-2 gap-[18px]">
                    {DONUT_DATA.slice(0, 2).map(s => <LegendItem key={s.label} slice={s} />)}
                  </div>
                  <div className="grid grid-cols-2 gap-[18px]">
                    {DONUT_DATA.slice(2, 4).map(s => <LegendItem key={s.label} slice={s} />)}
                  </div>
                  <div className="grid grid-cols-2 gap-[18px]">
                    {DONUT_DATA.slice(4, 6).map(s => <LegendItem key={s.label} slice={s} />)}
                  </div>
                </div>
              </div>

              {/* View Details button */}
              <button
                type="button"
                className="flex w-full items-center justify-center rounded-xl border border-[#8C5CFF] px-4 py-[0.625rem] font-sans text-[0.8125rem] font-semibold text-white transition-colors hover:bg-[#8C5CFF]/10"
              >
                View Details
              </button>
            </div>

            {/* Daily Transaction Volume chart */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 lg:flex-1">
              {/* Background gradient image replacement */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#080808] to-[#0b0b0b] opacity-95" />
              <div className="relative flex flex-col gap-6 h-full">
                {/* Header */}
                <div className="flex items-center justify-between shrink-0">
                  <p className="font-sans text-[0.8125rem] font-medium text-white/80 whitespace-nowrap">
                    Daily Transaction Volume
                  </p>
                  <DateRangeSelect value={volPeriod} onChange={setVolPeriod} variant="ghost" />
                </div>

                {/* Chart */}
                <div className="flex-1 min-h-[320px]">
                  <BarChart tooltip={tooltip} onTooltip={setTooltip} />
                </div>
              </div>
            </div>
          </div>

          {/* Canton Rewards panel */}
          <CantonRewardsPanel />

        </div>
      </div>
    </div>
  );
}
