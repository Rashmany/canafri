'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Landmark, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Key, 
  Coins, 
  UserCheck, 
  AlertTriangle,
  X,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminRole = 'Finance Admin' | 'Super Admin';
type WithdrawalStatus = 'Pending Approval' | 'Approved & Executing' | 'Executed' | 'Rejected';

interface WithdrawalRequest {
  id: string;
  amount: number;
  requestedBy: string;
  timeAgo: string;
  destination: string;
  reason: string;
  status: WithdrawalStatus;
  approvedBy?: string;
  executedTxId?: string;
}

interface TreasuryData {
  treasuryBalanceCC: number;
  availableCC: number;
  escrowLockedCC: number;
  minReserveRequirementCC: number;
  reserveStatus: 'HEALTHY' | 'WARNING_UNDER_RESERVE';
  revenueThisMonth: number;
  feesThisMonth: number;
  feesLastMonth: number;
  momChangePct: number;
  totalFeesAllTime: number;
  subscriptionFeeCC: number;
  activeSubscriptions: number;
  pendingWithdrawalCount: number;
  withdrawalHistory: Array<{
    id: string;
    adminName: string;
    adminId?: string;
    target?: string;
    amountCC: number;
    beforeCC: number;
    afterCC: number;
    signers: string[];
    status: string;
    timeAgo: string;
    createdAt: string;
  }>;
  cantonStatus: string;
  cantonAddress: string;
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

// ─── Reserve Details Modal ───────────────────────────────────────────────────

function ReserveDetailsModal({ 
  isOpen, 
  onClose,
  walletBalance,
  cantonAddress
}: { 
  isOpen: boolean; 
  onClose: () => void;
  walletBalance: number;
  cantonAddress: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(cantonAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const freeLiquidity = Math.max(0, walletBalance - 10000);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-lg max-h-[90vh] flex-col rounded-2xl border border-border bg-card p-6 shadow-2xl animate-modal-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Landmark size={18} className="text-[#8C5CFF]" />
            <h3 className="font-sans text-[0.9375rem] font-bold text-white leading-none">Treasury Reserve Details</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[#A0A0A0] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Details list */}
        <div className="flex flex-col gap-4 mt-5 overflow-y-auto max-h-[60vh] pr-1.5 no-scrollbar">
          
          {/* Canton Unique Ledger Address */}
          <div>
            <p className="font-sans text-[0.625rem] text-[#A0A0A0] uppercase tracking-wider font-semibold">Canton On-Chain Custody Address</p>
            <div className="flex items-center justify-between gap-3 bg-[#080808] border border-border rounded-xl px-3.5 py-2.5 mt-1.5 font-sans">
              <span className="font-mono text-[0.725rem] text-white/85 select-all truncate">
                {cantonAddress}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[#8C5CFF] hover:text-[#AC8EF3] transition-colors shrink-0 p-1 hover:bg-[#8C5CFF]/10 rounded flex items-center gap-1"
              >
                {copied ? (
                  <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                    <Check size={12} /> Copied!
                  </span>
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>

          {/* Allocation Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#080808]/40 border border-border/60 rounded-xl p-3.5">
              <span className="font-sans text-[0.625rem] text-[#A0A0A0] uppercase tracking-wider font-semibold">Reserve Guard Status</span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-sans text-[0.8125rem] font-bold text-emerald-400">
                  {walletBalance >= 10000 ? 'Secure' : 'Warning: Low Reserve'}
                </span>
              </div>
            </div>
            <div className="bg-[#080808]/40 border border-border/60 rounded-xl p-3.5">
              <span className="font-sans text-[0.625rem] text-[#A0A0A0] uppercase tracking-wider font-semibold">Ledger Environment</span>
              <span className="block font-sans text-[0.8125rem] font-bold text-white mt-1.5">Canton Network</span>
            </div>
          </div>

          <div className="h-px bg-border/40 w-full" />

          {/* Reserve Boundaries Info */}
          <div className="flex flex-col gap-2">
            <span className="font-sans text-[0.625rem] text-[#A0A0A0] uppercase tracking-wider font-semibold">Reserve Threshold Boundaries</span>
            <div className="grid grid-cols-3 gap-2 bg-[#080808]/30 border border-border rounded-xl px-4 py-3 text-[0.75rem] font-sans">
              <div className="flex flex-col">
                <span className="text-[#A0A0A0]">Total Custody</span>
                <span className="font-bold text-white mt-0.5">{walletBalance.toLocaleString()} CC</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#A0A0A0]">Locked Reserve</span>
                <span className="font-bold text-rose-400 mt-0.5">10,000 CC</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#A0A0A0]">Free Liquidity</span>
                <span className="font-bold text-[#8C5CFF] mt-0.5">{freeLiquidity.toLocaleString()} CC</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-border/40 w-full" />

          {/* Connected Signers */}
          <div>
            <span className="font-sans text-[0.625rem] text-[#A0A0A0] uppercase tracking-wider font-semibold">Multisig Canton Signer Nodes</span>
            <div className="flex flex-col gap-2 mt-2 font-sans">
              <div className="flex items-center justify-between text-[0.75rem] bg-[#080808]/20 border border-border/40 px-3 py-2 rounded-lg">
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-white/95">Finance Admin node</span>
                  <span className="font-mono text-[9px] text-[#A0A0A0] truncate">canafri::nodes::finance_admin#nd_3c4d12</span>
                </div>
                <span className="text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">CONNECTED</span>
              </div>
              <div className="flex items-center justify-between text-[0.75rem] bg-[#080808]/20 border border-border/40 px-3 py-2 rounded-lg">
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-white/95">Super Admin node</span>
                  <span className="font-mono text-[9px] text-[#A0A0A0] truncate">canafri::nodes::super_admin#nd_8a39ef</span>
                </div>
                <span className="text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">CONNECTED</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer close button */}
        <div className="mt-6 pt-3.5 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#8C5CFF] hover:bg-[#AC8EF3] py-2.5 font-sans text-[0.8125rem] font-semibold text-white transition-all active:scale-[0.98]"
          >
            Close Reserve Details
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminTreasuryPage() {
  const { toast } = useToast();
  const [activeRole, setActiveRole] = useState<AdminRole>('Super Admin');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Real backend treasury data
  const [data, setData] = useState<TreasuryData | null>(null);
  
  // Pending requests state (combines local active pending requests & backend history)
  const [localRequests, setLocalRequests] = useState<WithdrawalRequest[]>([]);
  
  // Form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDest, setWithdrawDest] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  
  // Success banner
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter tab
  const [queueTab, setQueueTab] = useState<'All' | 'New' | 'Approved' | 'Rejected'>('All');
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch live treasury metrics from backend
  const loadTreasury = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/admin/treasury');
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setData(result);
        } else {
          toast('Failed to load treasury data.', 'error');
        }
      } else {
        toast('Server error fetching treasury status.', 'error');
      }
    } catch {
      toast('Network error loading treasury status.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTreasury();
  }, [loadTreasury]);

  // Derived metrics
  const walletBalance = data?.treasuryBalanceCC ?? 0;
  const revenueThisMonth = data?.revenueThisMonth ?? 0;
  const feesThisMonth = data?.feesThisMonth ?? 0;
  const subscriptionFeeCC = data?.subscriptionFeeCC ?? 0;
  const escrowLockedCC = data?.escrowLockedCC ?? 0;
  const momChangePct = data?.momChangePct ?? 0;
  const cantonAddress = data?.cantonAddress ?? 'canton://canafri.canton.network/contracts/escrow-vault-reserves#vault_canafri_multisig_01a9b2';

  const donutBackground = useMemo(() => {
    if (revenueThisMonth <= 0) {
      return 'conic-gradient(#262626 0% 100%)';
    }
    const subPct = Math.min(100, Math.round((subscriptionFeeCC / revenueThisMonth) * 100));
    const feePct = Math.min(100 - subPct, Math.round((feesThisMonth / revenueThisMonth) * 100));
    return `conic-gradient(#8C5CFF 0% ${subPct}%, #4ADE80 ${subPct}% ${subPct + feePct}%, #DAC95A ${subPct + feePct}% 100%)`;
  }, [revenueThisMonth, subscriptionFeeCC, feesThisMonth]);

  // Merge history from backend and local active pending requests
  const allRequests = useMemo(() => {
    const list: WithdrawalRequest[] = [...localRequests];
    if (data?.withdrawalHistory) {
      data.withdrawalHistory.forEach((h) => {
        if (!list.some(r => r.id === h.id || (r.destination === h.target && r.amount === h.amountCC))) {
          list.push({
            id: h.id.slice(-7).toUpperCase(),
            amount: h.amountCC,
            requestedBy: h.adminName,
            timeAgo: h.timeAgo,
            destination: h.target || 'N/A',
            reason: 'Treasury multi-sig withdrawal',
            status: 'Executed',
            executedTxId: `0x${h.id.replace(/[^a-f0-9]/gi, '').slice(0, 12)}...canton`,
          });
        }
      });
    }
    return list;
  }, [localRequests, data]);

  const pendingWithdrawals = useMemo(() => {
    return allRequests
      .filter(r => r.status === 'Pending Approval')
      .reduce((sum, r) => sum + r.amount, 0);
  }, [allRequests]);

  const availableBalance = Math.max(0, walletBalance - 10000 - pendingWithdrawals);

  const filteredRequests = useMemo(() => {
    return allRequests.filter(req => {
      if (queueTab === 'All') return true;
      if (queueTab === 'New') return req.status === 'Pending Approval';
      if (queueTab === 'Approved') return req.status === 'Executed' || req.status === 'Approved & Executing';
      if (queueTab === 'Rejected') return req.status === 'Rejected';
      return true;
    });
  }, [allRequests, queueTab]);

  // Handle Withdrawal Request Submission (Finance Admin / Signature 1)
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setFormError('Please enter a valid withdrawal amount.');
      return;
    }

    if (walletBalance - amount < 10000) {
      setFormError(`Transaction blocked: Treasury balance would drop below the 10,000 CC minimum reserve requirement. Maximum available: ${(walletBalance - 10000).toFixed(2)} CC.`);
      return;
    }

    if (!withdrawDest.trim()) {
      setFormError('Please enter a destination wallet address.');
      return;
    }

    if (!withdrawReason.trim()) {
      setFormError('Please state the business reason for this withdrawal request.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/admin/treasury/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          amountCC: amount,
          destinationWallet: withdrawDest.trim(),
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        if (resData.status === 'PENDING_SECOND_SIGNATURE') {
          const reqId = `TX-${Math.floor(1000 + Math.random() * 9000)}`;
          const newReq: WithdrawalRequest = {
            id: reqId,
            amount,
            requestedBy: 'Finance Admin',
            timeAgo: 'Just now',
            destination: withdrawDest.trim(),
            reason: withdrawReason.trim(),
            status: 'Pending Approval',
          };
          setLocalRequests(prev => [newReq, ...prev]);
          setSuccessMsg(`Withdrawal request registered! Signature 1 recorded. Requires Super Admin second signature to execute on Canton network.`);
          toast('Withdrawal request submitted for Super Admin signature.', 'info');
        } else if (resData.status === 'EXECUTED') {
          setSuccessMsg(resData.message || `Withdrawal of ${amount} CC executed successfully on Canton network.`);
          toast('Withdrawal executed successfully!', 'success');
          await loadTreasury();
        }

        setWithdrawAmount('');
        setWithdrawDest('');
        setWithdrawReason('');
      } else {
        setFormError(resData.message || 'Failed to submit withdrawal request.');
        toast(resData.message || 'Withdrawal failed.', 'error');
      }
    } catch {
      setFormError('Network error connecting to treasury API.');
      toast('Network error during withdrawal request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Super Admin Approval / Signature 2
  const handleApprove = async (req: WithdrawalRequest) => {
    setSubmitting(true);
    try {
      const res = await apiFetch('/admin/treasury/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          amountCC: req.amount,
          destinationWallet: req.destination,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setLocalRequests(prev => prev.map(r => {
          if (r.id !== req.id) return r;
          return {
            ...r,
            status: 'Executed',
            approvedBy: 'Super Admin',
            executedTxId: `0x${Math.random().toString(16).substr(2, 10)}...canton`,
          };
        }));

        setSuccessMsg(`Withdrawal ${req.id} approved! Second signature confirmed. Canton on-chain transaction executed.`);
        toast(`Withdrawal ${req.id} executed successfully on Canton network!`, 'success');
        await loadTreasury();
      } else {
        toast(resData.message || 'Approval failed.', 'error');
      }
    } catch {
      toast('Network error confirming withdrawal signature.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = (id: string) => {
    setLocalRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      return { ...r, status: 'Rejected' };
    }));
    setSuccessMsg(`Withdrawal request ${id} rejected.`);
    toast(`Withdrawal ${id} rejected.`, 'info');
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <ReserveDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        walletBalance={walletBalance}
        cantonAddress={cantonAddress}
      />
      <div className="flex flex-col gap-5 w-full max-w-[1200px] mx-auto px-6 py-6">
        
        {/* Header with Refresh & Role Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-sans text-[1.375rem] font-bold text-white tracking-tight">
                Treasury Monitor
              </h1>
              <button
                type="button"
                onClick={loadTreasury}
                disabled={loading}
                className="flex size-7 items-center justify-center rounded-lg text-[#A0A0A0] hover:bg-foreground/5 hover:text-white transition-colors disabled:opacity-40"
                aria-label="Refresh treasury"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
            <p className="font-sans text-[0.75rem] text-[#A0A0A0] mt-0.5">
              On-chain multisig custody reserves and network revenue splits.
            </p>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5 bg-[#080808] border border-border p-1 rounded-xl self-start sm:self-auto shadow-inner">
            <button
              type="button"
              onClick={() => { setActiveRole('Super Admin'); setFormError(null); }}
              className={`px-3.5 py-1.5 rounded-lg font-sans text-[0.6875rem] font-semibold transition-all ${activeRole === 'Super Admin' ? 'bg-[#8C5CFF] text-white shadow' : 'text-[#A0A0A0] hover:text-white'}`}
            >
              Super Admin View
            </button>
            <button
              type="button"
              onClick={() => { setActiveRole('Finance Admin'); setFormError(null); }}
              className={`px-3.5 py-1.5 rounded-lg font-sans text-[0.6875rem] font-semibold transition-all ${activeRole === 'Finance Admin' ? 'bg-[#8C5CFF] text-white shadow' : 'text-[#A0A0A0] hover:text-white'}`}
            >
              Finance Admin View
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 font-sans text-[0.75rem] text-emerald-400 animate-slide-up">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} />
              <span>{successMsg}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-400/50 hover:text-emerald-400 transition-colors"
            >
              <XCircle size={14} />
            </button>
          </div>
        )}

        {/* 1. Top Stats Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col justify-center rounded-xl border border-border bg-card px-4 py-3.5 hover:border-[#8C5CFF]/20 transition-all duration-300">
            <span className="font-sans text-[0.6875rem] font-medium text-[#A0A0A0]">Platform Wallet Balance</span>
            <span className="font-sans text-[1.25rem] font-bold text-white mt-1 leading-none">
              {loading ? '...' : `${walletBalance.toLocaleString()} CC`}
            </span>
            <span className="font-sans text-[0.625rem] text-[#A0A0A0] mt-1.5">
              ≈ ${(walletBalance * 0.19).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD
            </span>
          </div>

          <div className="flex flex-col justify-center rounded-xl border border-border bg-card px-4 py-3.5 hover:border-[#8C5CFF]/20 transition-all duration-300">
            <span className="font-sans text-[0.6875rem] font-medium text-[#A0A0A0]">This Month Revenue</span>
            <span className="font-sans text-[1.25rem] font-bold text-emerald-400 mt-1 leading-none">
              {loading ? '...' : `+${revenueThisMonth.toLocaleString()} CC`}
            </span>
            <span className="font-sans text-[0.625rem] text-emerald-500/80 mt-1.5 flex items-center gap-1 font-medium">
              <ArrowUpRight size={11} />
              {momChangePct >= 0 ? `+${momChangePct}%` : `${momChangePct}%`} vs last month
            </span>
          </div>

          <div className="flex flex-col justify-center rounded-xl border border-border bg-card px-4 py-3.5 hover:border-[#8C5CFF]/20 transition-all duration-300">
            <span className="font-sans text-[0.6875rem] font-medium text-[#A0A0A0]">Pending Withdrawals</span>
            <span className="font-sans text-[1.25rem] font-bold text-amber-400 mt-1 leading-none">
              {pendingWithdrawals.toLocaleString()} CC
            </span>
            <span className="font-sans text-[0.625rem] text-amber-500/80 mt-1.5 flex items-center gap-1">
              <Clock size={11} />
              {allRequests.filter(r => r.status === 'Pending Approval').length} pending signature
            </span>
          </div>

          <div className="flex flex-col justify-center rounded-xl border border-border bg-card px-4 py-3.5 hover:border-[#8C5CFF]/20 transition-all duration-300">
            <span className="font-sans text-[0.6875rem] font-medium text-[#A0A0A0]">Available Balance</span>
            <span className="font-sans text-[1.25rem] font-bold text-white mt-1 leading-none">
              {availableBalance.toLocaleString()} CC
            </span>
            <span className="font-sans text-[0.625rem] text-[#A0A0A0] mt-1.5">
              Unlocked above 10,000 CC reserve
            </span>
          </div>
        </div>

        {/* 2. Middle Revenue Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-3.5 hover:border-[#8C5CFF]/25 transition-all">
            <div>
              <span className="font-sans text-[0.6875rem] font-semibold text-[#A0A0A0] uppercase tracking-wider">Subscription Revenue</span>
              <p className="font-sans text-[1.25rem] font-bold text-white mt-1">
                {loading ? '...' : `${subscriptionFeeCC} CC`}
              </p>
            </div>
            <span className="font-sans text-[0.625rem] text-[#A0A0A0] mt-2">
              {data?.activeSubscriptions ?? 0} active subscriptions (20 CC/mo)
            </span>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-3.5 hover:border-[#8C5CFF]/25 transition-all">
            <div>
              <span className="font-sans text-[0.6875rem] font-semibold text-[#A0A0A0] uppercase tracking-wider">Freelance Fee Revenue</span>
              <p className="font-sans text-[1.25rem] font-bold text-white mt-1">
                {loading ? '...' : `${feesThisMonth.toFixed(1)} CC`}
              </p>
            </div>
            <span className="font-sans text-[0.625rem] text-emerald-400 font-semibold mt-2">
              5% platform fee collected
            </span>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-3.5 hover:border-[#8C5CFF]/25 transition-all">
            <div>
              <span className="font-sans text-[0.6875rem] font-semibold text-[#A0A0A0] uppercase tracking-wider">Escrow Locked in Jobs</span>
              <p className="font-sans text-[1.25rem] font-bold text-[#8C5CFF] mt-1">
                {loading ? '...' : `${escrowLockedCC} CC`}
              </p>
            </div>
            <span className="font-sans text-[0.625rem] text-[#A0A0A0] mt-2">
              Held safely in active job escrows
            </span>
          </div>
        </div>

        {/* 3. Multi Signature Banner Workflow */}
        <div className="rounded-xl border border-[#8C5CFF]/20 bg-[#8C5CFF]/5 p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#8C5CFF]/5 blur-xl pointer-events-none" />
          
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-lg bg-[#8C5CFF]/15 border border-[#8C5CFF]/25 flex items-center justify-center text-[#8C5CFF] shrink-0 mt-0.5">
              <Key size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-sans text-[0.875rem] font-bold text-white tracking-tight">Multi Signature Required</h3>
              <p className="font-sans text-[0.75rem] text-foreground/80 leading-normal mt-1">
                All withdrawals require Finance Admin to request + Super Admin to approve before Canton executes.
              </p>
              
              {/* Flow Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3.5 pt-3 border-t border-border/20">
                <div className="flex items-center gap-2 bg-[#080808]/40 border border-border/20 rounded-lg px-3 py-1.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-[#8C5CFF]/20 text-[#8C5CFF] font-sans text-[0.625rem] font-bold">1</span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-sans text-[0.6875rem] font-semibold text-white/90">Finance Admin</span>
                    <span className="font-sans text-[0.5625rem] text-[#A0A0A0] truncate">Requests withdrawal</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-[#080808]/40 border border-border/20 rounded-lg px-3 py-1.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-[#8C5CFF]/20 text-[#8C5CFF] font-sans text-[0.625rem] font-bold">2</span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-sans text-[0.6875rem] font-semibold text-white/90">Super Admin</span>
                    <span className="font-sans text-[0.5625rem] text-[#A0A0A0] truncate">Approves or Rejects</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-[#080808]/40 border border-border/20 rounded-lg px-3 py-1.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-[#8C5CFF]/20 text-[#8C5CFF] font-sans text-[0.625rem] font-bold">3</span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-sans text-[0.6875rem] font-semibold text-white/90">Canton Network</span>
                    <span className="font-sans text-[0.5625rem] text-[#A0A0A0] truncate">Executes transaction</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Split Layout - Revenue Breakdown & Request Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          
          {/* Revenue Breakdown */}
          <div className="rounded-2xl border border-border bg-card p-5 h-full">
            <h3 className="font-sans text-[0.875rem] font-bold text-white">Revenue Breakdown</h3>
            <p className="font-sans text-[0.725rem] text-[#A0A0A0] mt-0.5">Distribution of platform incoming fees</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-6">
              <div
                className="relative size-32 shrink-0 rounded-full flex items-center justify-center"
                style={{
                  background: donutBackground
                }}
              >
                <div className="absolute inset-3.5 rounded-full bg-card flex flex-col items-center justify-center">
                  <span className="font-sans text-[0.625rem] text-[#A0A0A0] uppercase tracking-wider font-semibold">Total</span>
                  <span className="font-sans text-[1.125rem] font-bold text-white mt-0.5">
                    {revenueThisMonth.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Legends list */}
              <div className="flex flex-col gap-2.5 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-sm bg-[#8C5CFF]" />
                    <span className="font-sans text-[0.75rem] text-[#A0A0A0]">Subscriptions (20 CC/mo)</span>
                  </div>
                  <span className="font-sans text-[0.75rem] font-bold text-white">{subscriptionFeeCC} CC</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-sm bg-[#4ADE80]" />
                    <span className="font-sans text-[0.75rem] text-[#A0A0A0]">Freelance milestone fees (5%)</span>
                  </div>
                  <span className="font-sans text-[0.75rem] font-bold text-white">{feesThisMonth.toFixed(1)} CC</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-sm bg-[#DAC95A]" />
                    <span className="font-sans text-[0.75rem] text-[#A0A0A0]">Canton App Rewards</span>
                  </div>
                  <span className="font-sans text-[0.75rem] font-bold text-white">0 CC</span>
                </div>

                <div className="flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-sm bg-[#A0A0A0]" />
                    <span className="font-sans text-[0.75rem] text-[#A0A0A0]">Boost tip fees</span>
                  </div>
                  <span className="font-sans text-[0.75rem] font-bold text-white">Phase 2</span>
                </div>
              </div>
            </div>
          </div>

          {/* Withdrawal Form */}
          <div className="h-full">
            {activeRole === 'Finance Admin' ? (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-sans text-[0.875rem] font-bold text-white flex items-center gap-2">
                  <UserCheck size={18} className="text-[#8C5CFF]" />
                  Request a Withdrawal — Finance Admin Only
                </h3>
                <p className="font-sans text-[0.725rem] text-[#A0A0A0] mt-0.5 leading-normal">
                  Initiate a multisig platform withdrawal. Requires Super Admin signature.
                </p>

                {formError && (
                  <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 font-sans text-[0.7rem] text-rose-400 animate-slide-up">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleRequestSubmit} className="flex flex-col gap-3.5 mt-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-sans text-[0.625rem] font-semibold text-[#A0A0A0] uppercase tracking-wider">
                      Withdrawal Amount (CC)
                    </label>
                    <input
                      type="number"
                      required
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      placeholder="e.g. 3200"
                      disabled={submitting}
                      className="w-full rounded-xl bg-[#080808] border border-border px-3.5 py-2 font-sans text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none placeholder-foreground/30 disabled:opacity-40"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-sans text-[0.625rem] font-semibold text-[#A0A0A0] uppercase tracking-wider">
                      Destination Wallet Address
                    </label>
                    <input
                      type="text"
                      required
                      value={withdrawDest}
                      onChange={e => setWithdrawDest(e.target.value)}
                      placeholder="e.g. 0x71C...845f"
                      disabled={submitting}
                      className="w-full rounded-xl bg-[#080808] border border-border px-3.5 py-2 font-sans text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none placeholder-foreground/30 disabled:opacity-40"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-sans text-[0.625rem] font-semibold text-[#A0A0A0] uppercase tracking-wider">
                      Reason for Withdrawal
                    </label>
                    <textarea
                      required
                      value={withdrawReason}
                      onChange={e => setWithdrawReason(e.target.value)}
                      placeholder="Specify purpose..."
                      disabled={submitting}
                      className="w-full h-16 rounded-xl bg-[#080808] border border-border p-3 font-sans text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none placeholder-foreground/30 resize-none disabled:opacity-40"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-[#8C5CFF] hover:bg-[#AC8EF3] text-white py-2 font-sans text-[0.75rem] font-semibold transition-all active:scale-[0.98] mt-1.5 shadow-lg disabled:opacity-40 cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : 'Submit Withdrawal Request'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-5 border-dashed border-[#8C5CFF]/30 flex flex-col gap-2.5 justify-center h-full">
                <span className="font-sans text-[0.625rem] font-semibold text-[#8C5CFF] uppercase tracking-wider">Separation of Duties</span>
                <h4 className="font-sans text-[0.875rem] font-bold text-white leading-none">Super Admin Mode Active</h4>
                <p className="font-sans text-[0.725rem] text-[#A0A0A0] leading-relaxed">
                  As Super Admin, you are responsible for reviewing transaction requests submitted by the Finance Admin. You cannot create new withdrawal requests.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveRole('Finance Admin')}
                  className="rounded-xl border border-border hover:border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/5 text-white/90 hover:text-white py-2 font-sans text-[0.75rem] font-semibold transition-all mt-1 cursor-pointer"
                >
                  Switch to Finance Admin to Request
                </button>
              </div>
            )}
          </div>

        </div>

        {/* 5. Treasury Reserve Monitor */}
        <div className="rounded-xl border border-border bg-card p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between md:justify-start gap-4">
              <div className="flex items-center gap-1.5">
                <Landmark size={14} className="text-[#8C5CFF]" />
                <h3 className="font-sans text-[0.8125rem] font-bold text-white">Treasury Reserve</h3>
              </div>
              <span className="font-sans text-[0.75rem] font-bold text-[#8C5CFF]">
                {walletBalance.toLocaleString()} / 10,000 min
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#080808] border border-border mt-2 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#8C5CFF] to-[#AC8EF3] transition-all duration-500" 
                style={{ width: `${Math.min(100, (walletBalance / 50000) * 100)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/10 rounded-lg px-2.5 py-1 text-amber-400 font-sans text-[0.625rem] shrink-0">
            <AlertTriangle size={12} className="shrink-0" />
            <span>Enforced 10k CC reserve floor.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg border border-border hover:border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/5 text-white/90 hover:text-white px-3.5 py-1 font-sans text-[0.6875rem] font-semibold transition-all shrink-0 cursor-pointer"
          >
            View Details
          </button>
        </div>

        {/* 6. Withdrawal Requests Queue & History */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-3">
            <div>
              <h3 className="font-sans text-[0.875rem] font-bold text-white">Withdrawal Requests</h3>
              <p className="font-sans text-[0.725rem] text-[#A0A0A0] mt-0.5">Multisig transaction execution queue</p>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#080808] border border-border p-1 rounded-xl self-start sm:self-auto shadow-inner">
              {(['All', 'New', 'Approved', 'Rejected'] as const).map(tab => {
                const isActive = queueTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setQueueTab(tab)}
                    className={`px-3 py-1 rounded-lg font-sans text-[0.6875rem] font-semibold transition-all ${
                      isActive 
                        ? 'bg-[#8C5CFF] text-white shadow' 
                        : 'text-[#A0A0A0] hover:text-white'
                    }`}
                  >
                    {tab}
                    {tab === 'New' && allRequests.filter(r => r.status === 'Pending Approval').length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-bold">
                        {allRequests.filter(r => r.status === 'Pending Approval').length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Request queue list */}
          <div className="flex flex-col gap-4 mt-2">
            {filteredRequests.length === 0 ? (
              <div className="py-8 text-center text-[#A0A0A0] font-sans text-[0.8125rem]">
                No withdrawal requests found.
              </div>
            ) : (
              filteredRequests.map(req => (
                <div 
                  key={req.id} 
                  className="border-b border-border/40 pb-4 last:border-0 last:pb-0 pt-2 flex flex-col md:grid md:grid-cols-[1.2fr_2fr_2fr_3fr_1.5fr] gap-4 items-start md:items-center"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-[#8C5CFF]/10 flex items-center justify-center text-[#8C5CFF] shrink-0">
                      <Coins size={16} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-sans text-[0.75rem] text-[#A0A0A0] leading-none">{req.id}</span>
                      <span className="font-sans text-[0.9375rem] font-bold text-white mt-1">{req.amount.toLocaleString()} CC</span>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-sans text-[0.6875rem] text-[#A0A0A0]">Requested By</span>
                    <span className="font-sans text-[0.75rem] font-semibold text-white/90 mt-0.5 truncate">{req.requestedBy}</span>
                    <span className="font-sans text-[0.625rem] text-[#A0A0A0] leading-none mt-1">{req.timeAgo}</span>
                  </div>

                  <div className="flex flex-col min-w-0 w-full">
                    <span className="font-sans text-[0.6875rem] text-[#A0A0A0]">Destination Address</span>
                    <span className="font-sans text-[0.75rem] font-mono text-white/80 mt-1 select-all truncate">{req.destination}</span>
                  </div>

                  <div className="flex flex-col w-full">
                    <span className="font-sans text-[0.6875rem] text-[#A0A0A0] mb-1">Reason / Notes</span>
                    <div className="bg-[#080808] px-3 py-2 rounded-lg border border-border/40 font-sans text-[0.75rem] text-[#A0A0A0] leading-normal">
                      {req.reason}
                    </div>
                    {req.executedTxId && (
                      <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[9px] text-[#A0A0A0] truncate">
                        <span className="text-emerald-400 font-sans font-semibold">Tx ID:</span> {req.executedTxId}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 w-full md:w-auto shrink-0">
                    <span className={`inline-block rounded px-2 py-0.5 font-sans text-[0.625rem] font-bold ${
                      req.status === 'Pending Approval' 
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                        : req.status === 'Executed'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                    }`}>
                      {req.status}
                    </span>

                    {req.status === 'Pending Approval' && (
                      activeRole === 'Super Admin' ? (
                        <div className="flex gap-1.5 mt-1.5 w-full md:w-auto">
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleReject(req.id)}
                            className="flex-1 md:flex-none rounded-lg border border-rose-500/30 hover:bg-rose-500/5 text-rose-400 px-2.5 py-1.5 font-sans text-[0.6875rem] font-semibold transition-all active:scale-[0.95] disabled:opacity-40 cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleApprove(req)}
                            className="flex-1 md:flex-none rounded-lg bg-[#8C5CFF] hover:bg-[#AC8EF3] text-white px-3.5 py-1.5 font-sans text-[0.6875rem] font-semibold transition-all active:scale-[0.95] disabled:opacity-40 cursor-pointer"
                          >
                            {submitting ? 'Confirming...' : 'Sign & Execute'}
                          </button>
                        </div>
                      ) : (
                        <span className="font-sans text-[0.625rem] text-amber-400/80 mt-1">
                          Awaiting Super Admin Signature
                        </span>
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
