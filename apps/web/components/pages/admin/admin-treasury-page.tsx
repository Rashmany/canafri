'use client';

import { useState, useMemo } from 'react';
import { 
  Landmark, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Key, 
  Coins, 
  UserCheck, 
  AlertTriangle,
  X,
  Check
} from 'lucide-react';

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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_REQUESTS: WithdrawalRequest[] = [
  {
    id: 'TX-9082',
    amount: 3200,
    requestedBy: 'Finance Admin (Sarah K.)',
    timeAgo: '2hr ago',
    destination: 'a67..1C...84f',
    reason: 'Validator Staking Rewards Allocation',
    status: 'Pending Approval',
  },
  {
    id: 'TX-8921',
    amount: 1500,
    requestedBy: 'Finance Admin (Sarah K.)',
    timeAgo: '1 day ago',
    destination: '0x3D2...99a1',
    reason: 'Platform Liquidity Sweep',
    status: 'Executed',
    approvedBy: 'Super Admin (David M.)',
    executedTxId: '0x8892f392...a381',
  },
  {
    id: 'TX-8742',
    amount: 800,
    requestedBy: 'Finance Admin (Sarah K.)',
    timeAgo: '3 days ago',
    destination: '0x12A...f531',
    reason: 'Intercom Integrations Fee Payout',
    status: 'Rejected',
  }
];

function ReserveDetailsModal({ 
  isOpen, 
  onClose,
  walletBalance 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  walletBalance: number;
}) {
  const [copied, setCopied] = useState(false);
  const cantonAddress = 'canton://canafri.canton.network/contracts/escrow-vault-reserves#vault_canafri_multisig_01a9b2';

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(cantonAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
                className="text-[#8C5CFF] hover:text-[#AC8EF3] transition-colors shrink-0 p-1 hover:bg-[#8C5CFF]/10 rounded"
              >
                {copied ? (
                  <span className="text-emerald-400 text-[10px] font-semibold">Copied!</span>
                ) : (
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
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
                <span className="font-sans text-[0.8125rem] font-bold text-emerald-400">Secure</span>
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
                <span className="font-bold text-[#8C5CFF] mt-0.5">{(walletBalance - 10000).toLocaleString()} CC</span>
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
                  <span className="font-mono text-[9px] text-[#A0A0A0] truncate">canafri::nodes::finance_SarahK#nd_3c4d12</span>
                </div>
                <span className="text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">CONNECTED</span>
              </div>
              <div className="flex items-center justify-between text-[0.75rem] bg-[#080808]/20 border border-border/40 px-3 py-2 rounded-lg">
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-white/95">Super Admin node</span>
                  <span className="font-mono text-[9px] text-[#A0A0A0] truncate">canafri::nodes::super_DavidM#nd_8a39ef</span>
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

export default function AdminTreasuryPage() {
  // Active role state to simulate separation of duties
  const [activeRole, setActiveRole] = useState<AdminRole>('Super Admin');
  const [requests, setRequests] = useState<WithdrawalRequest[]>(INITIAL_REQUESTS);
  
  // Platform balances states (in CC)
  const [walletBalance, setWalletBalance] = useState(42180);
  const [revenueThisMonth, setRevenueThisMonth] = useState(6820);
  
  // Form state for Finance Admin withdrawal requests
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDest, setWithdrawDest] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  
  // Success toast/banner message
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Link Nav queue tab filter
  const [queueTab, setQueueTab] = useState<'All' | 'New' | 'Approved' | 'Rejected'>('All');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Computed Values
  const pendingWithdrawals = useMemo(() => {
    return requests
      .filter(r => r.status === 'Pending Approval')
      .reduce((sum, r) => sum + r.amount, 0);
  }, [requests]);

  const availableBalance = walletBalance - pendingWithdrawals;

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      if (queueTab === 'All') return true;
      if (queueTab === 'New') return req.status === 'Pending Approval';
      if (queueTab === 'Approved') return req.status === 'Executed' || req.status === 'Approved & Executing';
      if (queueTab === 'Rejected') return req.status === 'Rejected';
      return true;
    });
  }, [requests, queueTab]);

  // Handle request submission (Finance Admin only)
  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setFormError('Please enter a valid withdrawal amount.');
      return;
    }

    if (amount > availableBalance) {
      setFormError('Insufficient available balance to cover this request.');
      return;
    }

    if (walletBalance - amount < 10000) {
      setFormError('Transaction blocked: Platform balance would drop below the 10,000 CC minimum reserve.');
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

    // Success - add request
    const newRequest: WithdrawalRequest = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      amount,
      requestedBy: 'Finance Admin (Sarah K.)',
      timeAgo: 'Just now',
      destination: withdrawDest,
      reason: withdrawReason,
      status: 'Pending Approval',
    };

    setRequests(prev => [newRequest, ...prev]);
    setSuccessMsg(`Withdrawal request ${newRequest.id} for ${amount} CC submitted to Super Admin.`);
    
    // Reset form
    setWithdrawAmount('');
    setWithdrawDest('');
    setWithdrawReason('');
  };

  // Super Admin action handlers
  const handleApprove = (id: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;

    // Transition status to approved and execute balance updates
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      return { 
        ...r, 
        status: 'Executed', 
        approvedBy: 'Super Admin (David M.)',
        executedTxId: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`
      };
    }));

    setWalletBalance(prev => prev - req.amount);
    setSuccessMsg(`Withdrawal ${id} approved! Canton on-chain transaction executed successfully.`);
  };

  const handleReject = (id: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      return { ...r, status: 'Rejected' };
    }));
    setSuccessMsg(`Withdrawal request ${id} has been rejected.`);
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <ReserveDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} walletBalance={walletBalance} />
      <div className="flex flex-col gap-5 w-full max-w-[1200px] mx-auto px-6 py-6">
        
        {/* Header with Role Toggle Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <h1 className="font-sans text-[1.375rem] font-bold text-white tracking-tight">
              Treasury Monitor
            </h1>
            <p className="font-sans text-[0.75rem] text-[#A0A0A0] mt-0.5">
              On-chain multisig custody reserves and network revenue splits.
            </p>
          </div>

          {/* Separation of Duties Switch */}
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

        {/* Success message banner */}
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
              {walletBalance.toLocaleString()} CC
            </span>
            <span className="font-sans text-[0.625rem] text-[#A0A0A0] mt-1.5">
              ≈ ${(walletBalance * 0.19).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD
            </span>
          </div>

          <div className="flex flex-col justify-center rounded-xl border border-border bg-card px-4 py-3.5 hover:border-[#8C5CFF]/20 transition-all duration-300">
            <span className="font-sans text-[0.6875rem] font-medium text-[#A0A0A0]">This Month Revenue</span>
            <span className="font-sans text-[1.25rem] font-bold text-emerald-400 mt-1 leading-none">
              +{revenueThisMonth.toLocaleString()} CC
            </span>
            <span className="font-sans text-[0.625rem] text-emerald-500/80 mt-1.5 flex items-center gap-1 font-medium">
              <ArrowUpRight size={11} />
              +12.4% vs last month
            </span>
          </div>

          <div className="flex flex-col justify-center rounded-xl border border-border bg-card px-4 py-3.5 hover:border-[#8C5CFF]/20 transition-all duration-300">
            <span className="font-sans text-[0.6875rem] font-medium text-[#A0A0A0]">Pending Withdrawals</span>
            <span className="font-sans text-[1.25rem] font-bold text-amber-400 mt-1 leading-none">
              {pendingWithdrawals.toLocaleString()} CC
            </span>
            <span className="font-sans text-[0.625rem] text-amber-500/80 mt-1.5 flex items-center gap-1">
              <Clock size={11} />
              {requests.filter(r => r.status === 'Pending Approval').length} pending signature
            </span>
          </div>

          <div className="flex flex-col justify-center rounded-xl border border-border bg-card px-4 py-3.5 hover:border-[#8C5CFF]/20 transition-all duration-300">
            <span className="font-sans text-[0.6875rem] font-medium text-[#A0A0A0]">Available Balance</span>
            <span className="font-sans text-[1.25rem] font-bold text-white mt-1 leading-none">
              {availableBalance.toLocaleString()} CC
            </span>
            <span className="font-sans text-[0.625rem] text-[#A0A0A0] mt-1.5">
              Unlocked & ready for deployment
            </span>
          </div>
        </div>

        {/* 2. Middle Revenue Breakdown Cards (Reduced Height & Margins) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-3.5 hover:border-[#8C5CFF]/25 transition-all">
            <div>
              <span className="font-sans text-[0.6875rem] font-semibold text-[#A0A0A0] uppercase tracking-wider">Subscription Revenue</span>
              <p className="font-sans text-[1.25rem] font-bold text-white mt-1">0 CC</p>
            </div>
            <span className="font-sans text-[0.625rem] text-[#A0A0A0] mt-2">
              ≈ $0.00 at current rate
            </span>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-3.5 hover:border-[#8C5CFF]/25 transition-all">
            <div>
              <span className="font-sans text-[0.6875rem] font-semibold text-[#A0A0A0] uppercase tracking-wider">Freelance Fee Revenue</span>
              <p className="font-sans text-[1.25rem] font-bold text-white mt-1">920 CC</p>
            </div>
            <span className="font-sans text-[0.625rem] text-emerald-400 font-semibold mt-2">
              +8% this month
            </span>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-3.5 hover:border-[#8C5CFF]/25 transition-all">
            <div>
              <span className="font-sans text-[0.6875rem] font-semibold text-[#A0A0A0] uppercase tracking-wider">Canton App Rewards</span>
              <p className="font-sans text-[1.25rem] font-bold text-white mt-1">290 CC</p>
            </div>
            <span className="font-sans text-[0.625rem] text-[#A0A0A0] mt-2">
              Featured app share split
            </span>
          </div>
        </div>

        {/* 3. Multi Signature Banner Workflow (Reduced Height) */}
        <div className="rounded-xl border border-[#8C5CFF]/20 bg-[#8C5CFF]/5 p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#8C5CFF]/5 blur-xl pointer-events-none" />
          
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-lg bg-[#8C5CFF]/15 border border-[#8C5CFF]/25 flex items-center justify-center text-[#8C5CFF] shrink-0 mt-0.5">
              <Key size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-sans text-[0.875rem] font-bold text-white tracking-tight">Multi Signature Required</h3>
              <p className="font-sans text-[0.75rem] text-foreground/80 leading-normal mt-1">
                All withdrawals need Finance Admin to request + Super Admin to approve before Canton executes.
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

        {/* 4. Split Layout - Side-by-side Revenue Breakdown & Request Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          
          {/* Revenue Breakdown Donut Chart */}
          <div className="rounded-2xl border border-border bg-card p-5 h-full">
            <h3 className="font-sans text-[0.875rem] font-bold text-white">Revenue Breakdown</h3>
            <p className="font-sans text-[0.725rem] text-[#A0A0A0] mt-0.5">Distribution of platform incoming fees</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-6">
              {/* Custom CSS Donut Chart */}
              <div className="relative size-32 shrink-0 rounded-full flex items-center justify-center"
                   style={{
                     background: 'conic-gradient(#8C5CFF 0% 82.3%, #4ADE80 82.3% 95.8%, #DAC95A 95.8% 100%)'
                   }}>
                {/* Outer circle cut-out */}
                <div className="absolute inset-3.5 rounded-full bg-card flex flex-col items-center justify-center">
                  <span className="font-sans text-[0.625rem] text-[#A0A0A0] uppercase tracking-wider font-semibold">Total</span>
                  <span className="font-sans text-[1.125rem] font-bold text-white mt-0.5">50,000</span>
                </div>
              </div>

              {/* Legends list */}
              <div className="flex flex-col gap-2.5 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-sm bg-[#8C5CFF]" />
                    <span className="font-sans text-[0.75rem] text-[#A0A0A0]">Subscription pool (30%)</span>
                  </div>
                  <span className="font-sans text-[0.75rem] font-bold text-white">5,610 CC <span className="text-[#A0A0A0] font-normal text-[0.625rem] ml-1">82.3%</span></span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-sm bg-[#4ADE80]" />
                    <span className="font-sans text-[0.75rem] text-[#A0A0A0]">Freelance milestone fees (5%)</span>
                  </div>
                  <span className="font-sans text-[0.75rem] font-bold text-white">920 CC <span className="text-[#A0A0A0] font-normal text-[0.625rem] ml-1">13.5%</span></span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-sm bg-[#DAC95A]" />
                    <span className="font-sans text-[0.75rem] text-[#A0A0A0]">Canton featured app rewards</span>
                  </div>
                  <span className="font-sans text-[0.75rem] font-bold text-white">290 CC <span className="text-[#A0A0A0] font-normal text-[0.625rem] ml-1">4.2%</span></span>
                </div>

                <div className="flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-sm bg-[#A0A0A0]" />
                    <span className="font-sans text-[0.75rem] text-[#A0A0A0]">Boost tip fees (5%)</span>
                  </div>
                  <span className="font-sans text-[0.75rem] font-bold text-white">0 CC <span className="text-[#A0A0A0] font-normal text-[0.625rem] ml-1">Phase 3</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side: Withdrawal Form / Action controls */}
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
                      className="w-full rounded-xl bg-[#080808] border border-border px-3.5 py-2 font-sans text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none placeholder-foreground/30"
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
                      className="w-full rounded-xl bg-[#080808] border border-border px-3.5 py-2 font-sans text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none placeholder-foreground/30"
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
                      className="w-full h-16 rounded-xl bg-[#080808] border border-border p-3 font-sans text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none placeholder-foreground/30 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[#8C5CFF] hover:bg-[#AC8EF3] text-white py-2 font-sans text-[0.75rem] font-semibold transition-all active:scale-[0.98] mt-1.5 shadow-lg"
                  >
                    Submit Withdrawal Request
                  </button>
                </form>
              </div>
            ) : (
              // Super Admin view explanation
              <div className="rounded-2xl border border-border bg-card p-5 border-dashed border-[#8C5CFF]/30 flex flex-col gap-2.5 justify-center h-full">
                <span className="font-sans text-[0.625rem] font-semibold text-[#8C5CFF] uppercase tracking-wider">Separation of Duties</span>
                <h4 className="font-sans text-[0.875rem] font-bold text-white leading-none">Super Admin Mode Active</h4>
                <p className="font-sans text-[0.725rem] text-[#A0A0A0] leading-relaxed">
                  As Super Admin, you are responsible for reviewing transaction requests submitted by the Finance Admin. You cannot create new withdrawal requests.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveRole('Finance Admin')}
                  className="rounded-xl border border-border hover:border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/5 text-white/90 hover:text-white py-2 font-sans text-[0.75rem] font-semibold transition-all mt-1"
                >
                  Switch to Finance Admin to Request
                </button>
              </div>
            )}
          </div>

        </div>

        {/* 5. Treasury Reserve Monitor (Full Width, Compacted height & content sizes) */}
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
            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-[#080808] border border-border mt-2 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#8C5CFF] to-[#AC8EF3] transition-all duration-500" 
                style={{ width: `${Math.min(100, (walletBalance / 42180) * 100)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/10 rounded-lg px-2.5 py-1 text-amber-400 font-sans text-[0.625rem] shrink-0">
            <AlertTriangle size={12} className="shrink-0" />
            <span>Locked under 10k CC.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg border border-border hover:border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/5 text-white/90 hover:text-white px-3.5 py-1 font-sans text-[0.6875rem] font-semibold transition-all shrink-0"
          >
            View Details
          </button>
        </div>

        {/* 6. Withdrawal Requests List (Full Width, navigation link tabs) */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
          {/* Header and Link Nav Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-3">
            <div>
              <h3 className="font-sans text-[0.875rem] font-bold text-white">Withdrawal Requests</h3>
              <p className="font-sans text-[0.725rem] text-[#A0A0A0] mt-0.5">Multisig transaction execution queue</p>
            </div>
            
            {/* Navigation Link Tabs */}
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
                    {tab === 'New' ? 'New' : tab === 'Approved' ? 'Approved' : tab === 'Rejected' ? 'Rejected' : 'All'}
                    {tab === 'New' && requests.filter(r => r.status === 'Pending Approval').length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-bold">
                        {requests.filter(r => r.status === 'Pending Approval').length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Request queue list - styled as responsive full-width rows */}
          <div className="flex flex-col gap-4 mt-2">
            {filteredRequests.length === 0 ? (
              <div className="py-8 text-center text-[#A0A0A0] font-sans text-[0.8125rem]">
                No withdrawal requests found for this filter.
              </div>
            ) : (
              filteredRequests.map(req => (
                <div 
                  key={req.id} 
                  className="border-b border-border/40 pb-4 last:border-0 last:pb-0 pt-2 flex flex-col md:grid md:grid-cols-[1.2fr_2fr_2fr_3fr_1.5fr] gap-4 items-start md:items-center"
                >
                  {/* Col 1: ID & Amount */}
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-[#8C5CFF]/10 flex items-center justify-center text-[#8C5CFF] shrink-0">
                      <Coins size={16} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-sans text-[0.75rem] text-[#A0A0A0] leading-none">{req.id}</span>
                      <span className="font-sans text-[0.9375rem] font-bold text-white mt-1">{req.amount.toLocaleString()} CC</span>
                    </div>
                  </div>

                  {/* Col 2: Requester & Time */}
                  <div className="flex flex-col">
                    <span className="font-sans text-[0.6875rem] text-[#A0A0A0]">Requested By</span>
                    <span className="font-sans text-[0.75rem] font-semibold text-white/90 mt-0.5 truncate">{req.requestedBy}</span>
                    <span className="font-sans text-[0.625rem] text-[#A0A0A0] leading-none mt-1">{req.timeAgo}</span>
                  </div>

                  {/* Col 3: Destination Wallet */}
                  <div className="flex flex-col min-w-0 w-full">
                    <span className="font-sans text-[0.6875rem] text-[#A0A0A0]">Destination Address</span>
                    <span className="font-sans text-[0.75rem] font-mono text-white/80 mt-1 select-all truncate">{req.destination}</span>
                  </div>

                  {/* Col 4: Reason (NON-ITALIC) */}
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

                  {/* Col 5: Status badge & action buttons */}
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
                            onClick={() => handleReject(req.id)}
                            className="flex-1 md:flex-none rounded-lg border border-rose-500/30 hover:bg-rose-500/5 text-rose-400 px-2.5 py-1.5 font-sans text-[0.6875rem] font-semibold transition-all active:scale-[0.95]"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprove(req.id)}
                            className="flex-1 md:flex-none rounded-lg bg-[#8C5CFF] hover:bg-[#AC8EF3] text-white px-3.5 py-1.5 font-sans text-[0.6875rem] font-semibold transition-all active:scale-[0.95]"
                          >
                            Approve
                          </button>
                        </div>
                      ) : (
                        <span className="text-[0.625rem] text-[#A0A0A0] mt-1 font-semibold">Awaiting Super Admin Signature</span>
                      )
                    )}
                  </div>

                </div>
              ))
            )}
          </div>

          {/* Warning Notice at bottom */}
          <div className="h-px bg-border/40 w-full my-1" />
          <div className="flex gap-2.5 items-start bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 text-[#8C5CFF] font-sans text-[0.75rem] leading-relaxed">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-white/90">Multi Sign Status</span>
              <span>All withdrawals require approval from 2 distinct admin parties before CC is released on-chain.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
