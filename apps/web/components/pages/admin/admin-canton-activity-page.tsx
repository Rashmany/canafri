'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Lock,
  DollarSign,
  Briefcase,
  Newspaper,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Wifi,
  WifiOff,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Server,
  Globe,
  Database,
  Award,
  ChevronDown,
  Filter,
  Download,
  ArrowUpRight,
  Zap,
  Package,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TxType =
  | 'stake_lock'
  | 'subscription'
  | 'milestone'
  | 'unstake'
  | 'checkin'
  | 'trust_stake'
  | 'order'
  | 'payment'
  | 'reward';

interface Transaction {
  id: string;
  type: TxType;
  title: string;
  address: string;
  timestamp: Date;
  amount?: string;
  status: 'confirmed' | 'pending' | 'failed';
  blockHeight?: number;
  txHash?: string;
}

interface NodeHealth {
  identity: string;
  status: 'Connected' | 'Syncing' | 'Disconnected';
  sequencer: string;
  domain: string;
  damlPackage: string;
  superValidator: string;
  latency: number; // ms
  blockHeight: number;
  peerCount: number;
  syncedAt: Date;
}

interface NetworkStats {
  transactionsToday: number;
  txTrend: number;
  featuredAppMarkers: number;
  avgConfirmationTime: number; // seconds
  nodeUptime: number; // percentage
  totalVolume: string;
  activeContracts: number;
}

interface RewardsInfo {
  estimatedThisMonth: number;
  usdEquivalent: number;
  networkShare: number; // percentage
  rewardsPool: string;
  lastPayout: string;
  nextPayout: string;
}

// ─── Constants & Helpers ──────────────────────────────────────────────────────

const TX_ICONS: Record<TxType, React.ComponentType<{ className?: string }>> = {
  stake_lock: Lock,
  subscription: DollarSign,
  milestone: Briefcase,
  unstake: Newspaper,
  checkin: ShieldCheck,
  trust_stake: CheckCircle2,
  order: Package,
  payment: DollarSign,
  reward: Award,
};

const TX_COLORS: Record<TxType, string> = {
  stake_lock:    'text-blue-400',
  subscription:  'text-emerald-400',
  milestone:     'text-amber-400',
  unstake:       'text-orange-400',
  checkin:       'text-purple-400',
  trust_stake:   'text-emerald-400',
  order:         'text-sky-400',
  payment:       'text-green-400',
  reward:        'text-yellow-400',
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'tx-001', type: 'stake_lock',   title: 'ReadStake created — 5 CC locked',          address: 'canfri....rrr5edd', timestamp: new Date(Date.now() - 2000),   status: 'confirmed', blockHeight: 1048592, txHash: '0x4a3f...d91c' },
  { id: 'tx-002', type: 'subscription', title: 'Subscription renewed — 20 CC split',        address: 'canfri....rrr5edd', timestamp: new Date(Date.now() - 5000),   status: 'confirmed', blockHeight: 1048591, txHash: '0x72ab...b34e' },
  { id: 'tx-003', type: 'milestone',    title: 'Milestone approved — 240 CC released',      address: 'canfri....rrr5edd', timestamp: new Date(Date.now() - 9000),   status: 'confirmed', blockHeight: 1048589, txHash: '0x9e1d...f22a' },
  { id: 'tx-004', type: 'unstake',      title: 'StakeReceipt unstaked — 5 CC returned',    address: 'canfri....rrr5edd', timestamp: new Date(Date.now() - 13000),  status: 'confirmed', blockHeight: 1048588, txHash: '0x3c8b...a77f' },
  { id: 'tx-005', type: 'checkin',      title: 'CheckIn reward sent — 0.05 CC',             address: 'canfri....rrr5edd', timestamp: new Date(Date.now() - 19000),  status: 'confirmed', blockHeight: 1048585, txHash: '0xf14e...cc39' },
  { id: 'tx-006', type: 'trust_stake',  title: 'TrustProfile staked — 100 CC locked',      address: 'canfri....rrr5edd', timestamp: new Date(Date.now() - 25000),  status: 'confirmed', blockHeight: 1048582, txHash: '0x88d2...1b0e' },
  { id: 'tx-007', type: 'stake_lock',   title: 'ReadStake created — 5 CC locked',           address: 'canfri....rrr5edd', timestamp: new Date(Date.now() - 33000),  status: 'confirmed', blockHeight: 1048579, txHash: '0x61fa...e59d' },
  { id: 'tx-008', type: 'order',        title: 'Order finalized — 120 CC released',         address: 'canfri....mmx7wqq', timestamp: new Date(Date.now() - 45000),  status: 'confirmed', blockHeight: 1048573, txHash: '0xd3c0...8a21' },
  { id: 'tx-009', type: 'payment',      title: 'Milestone payment — 60 CC transferred',    address: 'canfri....kpl3ntt', timestamp: new Date(Date.now() - 58000),  status: 'confirmed', blockHeight: 1048568, txHash: '0x5e71...3f8b' },
  { id: 'tx-010', type: 'reward',       title: 'Network reward distributed — 2 CC',        address: 'canfri....vvz9suu', timestamp: new Date(Date.now() - 72000),  status: 'confirmed', blockHeight: 1048561, txHash: '0xa9b4...77c3' },
];

const MOCK_ADDRESSES = [
  'canfri....rrr5edd',
  'canfri....mmx7wqq',
  'canfri....kpl3ntt',
  'canfri....vvz9suu',
  'canfri....hhq2rpp',
];

const MOCK_TX_TEMPLATES: Array<{ type: TxType; title: (cc: number) => string }> = [
  { type: 'stake_lock',   title: (cc) => `ReadStake created — ${cc} CC locked` },
  { type: 'subscription', title: (cc) => `Subscription renewed — ${cc} CC split` },
  { type: 'milestone',    title: (cc) => `Milestone approved — ${cc} CC released` },
  { type: 'unstake',      title: (cc) => `StakeReceipt unstaked — ${cc} CC returned` },
  { type: 'checkin',      title: (_)  => `CheckIn reward sent — 0.05 CC` },
  { type: 'trust_stake',  title: (cc) => `TrustProfile staked — ${cc} CC locked` },
  { type: 'order',        title: (cc) => `Order finalized — ${cc} CC released` },
  { type: 'payment',      title: (cc) => `Milestone payment — ${cc} CC transferred` },
  { type: 'reward',       title: (_)  => `Network reward distributed — 2 CC` },
];

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  subColor = 'text-muted-foreground',
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  subColor?: string;
  trend?: number;
}) {
  return (
    <div className="flex-1 min-w-0 bg-card border border-border rounded-2xl p-6 flex flex-col gap-2.5 overflow-hidden">
      <span className="text-[13px] font-medium text-muted-foreground leading-[18px]">{label}</span>
      <span className="text-[22px] font-medium text-foreground tracking-tight leading-[26px]">
        {typeof value === 'number' ? formatNumber(value) : value}
      </span>
      {sub && (
        <span className={`text-[11px] font-normal leading-4 ${subColor}`}>
          {sub}
        </span>
      )}
      {trend !== undefined && (
        <span className={`text-[11px] font-normal leading-4 flex items-center gap-1 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {trend >= 0 ? '+' : ''}{trend}% vs yesterday
        </span>
      )}
    </div>
  );
}

function NodeRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <>
      <div className="flex items-center justify-between py-2">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        <span className={`text-[10px] font-normal ${valueColor ?? 'text-foreground/80'}`}>{value}</span>
      </div>
      <div className="h-px bg-border/40 last:hidden" />
    </>
  );
}

function TxIcon({ type }: { type: TxType }) {
  const Icon = TX_ICONS[type];
  const color = TX_COLORS[type];
  return (
    <div className={`flex-shrink-0 size-10 rounded-xl bg-background/60 border border-border flex items-center justify-center ${color}`}>
      <Icon className="size-4" />
    </div>
  );
}

function TxRow({ tx, fresh }: { tx: Transaction; fresh?: boolean }) {
  return (
    <div
      className={`flex gap-3 items-center px-4 py-4 border-b border-border/40 last:border-0 transition-all duration-500 ${
        fresh ? 'bg-emerald-950/20 animate-pulse-once' : 'bg-card'
      }`}
    >
      <TxIcon type={tx.type} />
      <div className="flex-1 min-w-0 flex items-center justify-between">
        <div className="flex flex-col gap-1.5 min-w-0 pr-4">
          <span className="text-[15px] font-medium text-foreground leading-tight truncate">{tx.title}</span>
          <span className="text-[13px] text-muted-foreground">{tx.address}</span>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(tx.timestamp)}</span>
          {tx.txHash && (
            <span className="text-[9px] text-muted-foreground/60 font-mono whitespace-nowrap">{tx.txHash}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCantonActivityPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [freshTxIds, setFreshTxIds] = useState<Set<string>>(new Set());
  const [isLive, setIsLive] = useState(true);
  const [filterType, setFilterType] = useState<TxType | 'all'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [ticker, setTicker] = useState(0); // force re-render for time display
  const filterRef = useRef<HTMLDivElement>(null);

  const [stats] = useState<NetworkStats>({
    transactionsToday: 2847,
    txTrend: 12,
    featuredAppMarkers: 2847,
    avgConfirmationTime: 1.4,
    nodeUptime: 99.98,
    totalVolume: '1.2M CC',
    activeContracts: 389,
  });

  const [node] = useState<NodeHealth>({
    identity: 'canafri-node-01',
    status: 'Connected',
    sequencer: 'global.canton.network',
    domain: 'Global Synchronizer',
    damlPackage: 'canafri-1.0.0',
    superValidator: 'Canton Foundation',
    latency: 24,
    blockHeight: 1048592,
    peerCount: 18,
    syncedAt: new Date(Date.now() - 300000),
  });

  const [rewards] = useState<RewardsInfo>({
    estimatedThisMonth: 0,
    usdEquivalent: 437000,
    networkShare: 0.46,
    rewardsPool: '516M CC',
    lastPayout: '2 days ago',
    nextPayout: 'in 28 days',
  });

  // Simulate live transaction feed
  const addTransaction = useCallback(() => {
    const template = MOCK_TX_TEMPLATES[Math.floor(Math.random() * MOCK_TX_TEMPLATES.length)];
    const cc = [5, 10, 20, 50, 100, 120, 240][Math.floor(Math.random() * 7)];
    const address = MOCK_ADDRESSES[Math.floor(Math.random() * MOCK_ADDRESSES.length)];
    const id = `tx-live-${Date.now()}`;

    const newTx: Transaction = {
      id,
      type: template.type,
      title: template.title(cc),
      address,
      timestamp: new Date(),
      status: 'confirmed',
      blockHeight: node.blockHeight + Math.floor(Math.random() * 3),
      txHash: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
    };

    setTransactions(prev => [newTx, ...prev.slice(0, 49)]);
    setFreshTxIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      setFreshTxIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }, 2500);
  }, [node.blockHeight]);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      addTransaction();
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [isLive, addTransaction]);

  // Ticker for relative timestamps
  useEffect(() => {
    const t = setInterval(() => setTicker(n => n + 1), 10000);
    return () => clearInterval(t);
  }, []);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredTxs = filterType === 'all'
    ? transactions
    : transactions.filter(t => t.type === filterType);

  const filterOptions: Array<{ label: string; value: TxType | 'all' }> = [
    { label: 'All Activities', value: 'all' },
    { label: 'Stake / Lock', value: 'stake_lock' },
    { label: 'Subscription', value: 'subscription' },
    { label: 'Milestone', value: 'milestone' },
    { label: 'Unstake', value: 'unstake' },
    { label: 'Check-In', value: 'checkin' },
    { label: 'Trust Profile', value: 'trust_stake' },
    { label: 'Order', value: 'order' },
    { label: 'Payment', value: 'payment' },
    { label: 'Reward', value: 'reward' },
  ];

  const exportCSV = () => {
    const header = 'ID,Type,Title,Address,Timestamp,Status,Block,TxHash';
    const rows = transactions.map(t =>
      `${t.id},${t.type},"${t.title}",${t.address},${t.timestamp.toISOString()},${t.status},${t.blockHeight ?? ''},${t.txHash ?? ''}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canton-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // suppress unused ticker warning
  void ticker;

  return (
    <div className="flex flex-col gap-9 pt-[35px] px-8 pb-10 w-full min-h-full">
      {/* Page Title */}
      <h1 className="text-[36px] font-bold text-foreground/80 leading-[42px] tracking-[-0.18px]">
        Canton Network Activity
      </h1>

      <div className="flex flex-col gap-6 w-full">
        {/* Node Status Banner */}
        <div className="bg-card border border-border rounded-2xl px-4 py-6 flex items-center justify-end">
          <div className="flex items-center gap-4">
            {/* Latency pill */}
            <div className="flex items-center gap-2 bg-background/60 border border-border rounded-full px-3 py-1">
              <Activity className="size-3.5 text-muted-foreground" />
              <span className="text-[12px] text-muted-foreground">{node.latency}ms</span>
            </div>

            {/* Live / Paused toggle */}
            <button
              type="button"
              onClick={() => setIsLive(v => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                isLive
                  ? 'bg-emerald-400 text-black'
                  : 'bg-muted border border-border text-muted-foreground'
              }`}
            >
              <span className={`size-1.5 rounded-full ${isLive ? 'bg-black animate-pulse' : 'bg-muted-foreground'}`} />
              {isLive ? 'Live' : 'Paused'}
            </button>

            {isLive ? (
              <Wifi className="size-4 text-emerald-400" />
            ) : (
              <WifiOff className="size-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-6 items-stretch w-full">
          <StatCard
            label="Transactions Today"
            value={stats.transactionsToday}
            trend={stats.txTrend}
          />
          <StatCard
            label="Featured App Markers"
            value={stats.featuredAppMarkers}
            sub="1:1 with transactions"
            subColor="text-emerald-400"
          />
          <StatCard
            label="Avg Confirmation Time"
            value={`${stats.avgConfirmationTime}s`}
            sub="Global Synchronizer"
          />
          <StatCard
            label="Node Uptime"
            value={`${stats.nodeUptime}%`}
            sub="Last 30 days"
          />
        </div>

        {/* Live Activity Feed */}
        <div className="flex flex-col w-full bg-card border border-border rounded-2xl overflow-hidden">
          {/* Feed Header */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-border">
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-foreground">Onchain Activity Feed</span>
              <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {filteredTxs.length} events
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter dropdown */}
              <div className="relative" ref={filterRef}>
                <button
                  type="button"
                  onClick={() => setShowFilterDropdown(v => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-medium text-foreground/70 bg-background border border-border rounded-[8px] hover:bg-border/40 hover:text-foreground transition-colors"
                >
                  <Filter className="size-3.5" />
                  {filterOptions.find(o => o.value === filterType)?.label ?? 'All'}
                  <ChevronDown className={`size-3 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showFilterDropdown && (
                  <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-2xl min-w-[180px] py-1 overflow-hidden">
                    {filterOptions.map(o => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => { setFilterType(o.value); setShowFilterDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors hover:bg-muted ${
                          filterType === o.value ? 'text-foreground font-medium' : 'text-muted-foreground'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Refresh */}
              <button
                type="button"
                onClick={addTransaction}
                className="flex items-center justify-center size-[30px] text-foreground/70 bg-background border border-border rounded-[8px] hover:bg-border/40 hover:text-foreground transition-colors"
                title="Refresh"
              >
                <RefreshCw className="size-3.5" />
              </button>

              {/* Export */}
              <button
                type="button"
                onClick={exportCSV}
                className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-medium text-foreground/70 bg-background border border-border rounded-[8px] hover:bg-border/40 hover:text-foreground transition-colors"
              >
                <Download className="size-3.5" />
                Export
              </button>
            </div>
          </div>

          {/* Column headers */}
          <div className="flex items-center gap-3 px-4 py-3 bg-background border-b border-border">
            <div className="size-10 flex-shrink-0" />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Activity</span>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Time</span>
            </div>
          </div>

          {/* Transaction Rows */}
          <div className="divide-y divide-border/40">
            {filteredTxs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <Activity className="size-8 opacity-40" />
                <span className="text-[13px]">No activity for this filter</span>
              </div>
            ) : (
              filteredTxs.map(tx => (
                <TxRow key={tx.id} tx={tx} fresh={freshTxIds.has(tx.id)} />
              ))
            )}
          </div>

          {/* Feed Footer */}
          {filteredTxs.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background">
              <span className="text-[11px] text-muted-foreground">
                Showing {Math.min(filteredTxs.length, 50)} of {filteredTxs.length} events
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Zap className="size-3 text-emerald-400" />
                <span>Block #{node.blockHeight.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom panels */}
        <div className="flex gap-6 items-stretch w-full">
          {/* Participant Node Panel */}
          <div className="flex-1 min-w-0 bg-card border border-border rounded-2xl p-6 flex flex-col gap-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server className="size-4 text-muted-foreground" />
                <span className="text-[13px] font-medium text-foreground">Participant Node</span>
              </div>
              <div className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full ${
                node.status === 'Connected'
                  ? 'bg-emerald-400/10 text-emerald-400'
                  : node.status === 'Syncing'
                  ? 'bg-amber-400/10 text-amber-400'
                  : 'bg-red-400/10 text-red-400'
              }`}>
                <span className={`size-1.5 rounded-full ${
                  node.status === 'Connected' ? 'bg-emerald-400' : node.status === 'Syncing' ? 'bg-amber-400' : 'bg-red-400'
                }`} />
                {node.status}
              </div>
            </div>
            <div className="h-px bg-border/40 mb-1" />

            <div className="flex flex-col">
              <NodeRow label="Node identity"    value={node.identity} />
              <NodeRow label="Status"           value={node.status}           valueColor={node.status === 'Connected' ? 'text-emerald-400' : 'text-muted-foreground'} />
              <NodeRow label="Sequencer"        value={node.sequencer} />
              <NodeRow label="Domain"           value={node.domain} />
              <NodeRow label="Daml package"     value={node.damlPackage} />
              <NodeRow label="Super Validator"  value={node.superValidator} />
            </div>

            <div className="h-px bg-border/40 mt-1 mb-4" />

            {/* Extra diagnostics */}
            <div className="flex gap-4">
              <div className="flex-1 bg-background border border-border rounded-xl p-3 flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">Latency</span>
                <span className="text-[14px] font-medium text-foreground">{node.latency}ms</span>
              </div>
              <div className="flex-1 bg-background border border-border rounded-xl p-3 flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">Peer Nodes</span>
                <span className="text-[14px] font-medium text-foreground">{node.peerCount}</span>
              </div>
              <div className="flex-1 bg-background border border-border rounded-xl p-3 flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">Block Height</span>
                <span className="text-[14px] font-medium text-foreground">{node.blockHeight.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Featured App Rewards Panel */}
          <div className="flex-1 min-w-0 bg-card border border-border rounded-2xl px-4 py-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="size-4 text-muted-foreground" />
                <span className="text-[13px] font-medium text-foreground">Featured App Rewards</span>
              </div>
              <button
                type="button"
                className="text-[11px] text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Details <ArrowUpRight className="size-3" />
              </button>
            </div>

            <div className="h-px bg-border/40" />

            {/* Estimation block */}
            <div className="bg-background border border-border rounded-2xl px-6 py-3 flex flex-col gap-2">
              <span className="text-[10px] text-muted-foreground">Estimated this month</span>
              <span className="text-[22px] font-medium text-foreground/80 tracking-tight">
                {rewards.estimatedThisMonth.toFixed(2)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                ≈ ${rewards.usdEquivalent.toLocaleString()} USD
              </span>
            </div>

            {/* Network share */}
            <div className="flex items-center justify-between text-[13px] font-medium">
              <span className="text-foreground/80">Network share</span>
              <span className="text-muted-foreground">{rewards.networkShare}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-background border border-border rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(rewards.networkShare * 20, 100)}%` }}
              />
            </div>

            <div className="h-px bg-border/40" />

            <div className="flex items-center justify-between text-[13px] font-medium">
              <span className="text-foreground/80">Rewards pool</span>
              <span className="text-muted-foreground">{rewards.rewardsPool}</span>
            </div>

            <div className="h-px bg-border/40" />

            <div className="flex items-center justify-between text-[13px] font-medium">
              <span className="text-foreground/80">Last payout</span>
              <span className="text-muted-foreground">{rewards.lastPayout}</span>
            </div>

            <div className="h-px bg-border/40" />

            <div className="flex items-center justify-between text-[13px] font-medium">
              <span className="text-foreground/80">Next payout</span>
              <div className="flex items-center gap-1.5">
                <Clock className="size-3 text-muted-foreground" />
                <span className="text-muted-foreground">{rewards.nextPayout}</span>
              </div>
            </div>

            {/* Extra stats */}
            <div className="h-px bg-border/40" />

            <div className="flex gap-4">
              <div className="flex-1 bg-background border border-border rounded-xl p-3 flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">Total Volume</span>
                <span className="text-[14px] font-medium text-foreground">{stats.totalVolume}</span>
              </div>
              <div className="flex-1 bg-background border border-border rounded-xl p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <Globe className="size-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Active Contracts</span>
                </div>
                <span className="text-[14px] font-medium text-foreground">{stats.activeContracts}</span>
              </div>
              <div className="flex-1 bg-background border border-border rounded-xl p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <Database className="size-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Chain</span>
                </div>
                <span className="text-[14px] font-medium text-foreground">Canton</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
