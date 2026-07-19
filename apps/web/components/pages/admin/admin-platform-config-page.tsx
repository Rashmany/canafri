'use client';

import { useState, useEffect } from 'react';
import { 
  Sliders, 
  Save, 
  Play, 
  Pause, 
  DollarSign, 
  Settings, 
  CheckCircle2,
  Wrench,
  Power,
  ShieldAlert
} from 'lucide-react';

interface GovernanceLog {
  id: string;
  adminName: string;
  adminHandle: string;
  action: string;
  timestamp: string;
}

export default function AdminPlatformConfigPage() {
  // Maintenance Mode States
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "We are currently conducting scheduled system maintenance to improve platform performance. We'll be back online shortly."
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const active = localStorage.getItem('canafri_maintenance_active') === 'true';
      const msg = localStorage.getItem('canafri_maintenance_message');
      setMaintenanceActive(active);
      if (msg) setMaintenanceMessage(msg);
    }
  }, []);

  // Incentive Phase State
  const [isIncentiveActive, setIsIncentiveActive] = useState(true);

  // Subscription Economics Settings
  const [subscriptionAmount, setSubscriptionAmount] = useState('20');
  const [poolAllocation, setPoolAllocation] = useState('20');
  const [stakeBalanceAllocation, setStakeBalanceAllocation] = useState('20');
  const [platformFeeSubscription, setPlatformFeeSubscription] = useState('20');
  const [platformFeeFreelance, setPlatformFeeFreelance] = useState('20');

  // Continue Reading Stake Settings
  const [stakeAmount, setStakeAmount] = useState('20');
  const [minReadTime, setMinReadTime] = useState('20');
  const [gracePeriod, setGracePeriod] = useState('1');
  const [creatorStakeRequirement, setCreatorStakeRequirement] = useState('20');
  const [creatorLockPeriod, setCreatorLockPeriod] = useState('14');
  const [maxContentPerMonth, setMaxContentPerMonth] = useState('5');

  // Treasury Rules Settings
  const [minimumReserve, setMinimumReserve] = useState('20');
  const [sellerAppDeposit, setSellerAppDeposit] = useState('20');
  const [dailyCheckInReward, setDailyCheckInReward] = useState('20');

  // Save / Alert states
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Governance Audit Log
  const [governanceLogs, setGovernanceLogs] = useState<GovernanceLog[]>([
    {
      id: 'GOV-874',
      adminName: 'John Trek',
      adminHandle: '@johntrek',
      action: 'Updated Platform fee freelance to 20%',
      timestamp: '2 hours ago'
    },
    {
      id: 'GOV-873',
      adminName: 'John Trek',
      adminHandle: '@johntrek',
      action: 'Set grace period to 1 hour',
      timestamp: '1 day ago'
    },
    {
      id: 'GOV-872',
      adminName: 'John Trek',
      adminHandle: '@johntrek',
      action: 'Activated Incentive Phase cycles',
      timestamp: '3 days ago'
    }
  ]);

  const handleSaveAll = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate inputs
    const allInputs = [
      subscriptionAmount, poolAllocation, stakeBalanceAllocation, platformFeeSubscription, platformFeeFreelance,
      stakeAmount, minReadTime, gracePeriod, creatorStakeRequirement, creatorLockPeriod, maxContentPerMonth,
      minimumReserve, sellerAppDeposit, dailyCheckInReward
    ];

    if (allInputs.some(val => isNaN(parseFloat(val)) || parseFloat(val) < 0)) {
      setErrorMsg('Invalid inputs detected. All configurations must be non-negative numeric values.');
      return;
    }

    setIsSaving(true);

    // Simulate Canton Network transaction execution
    setTimeout(() => {
      setIsSaving(false);
      setSuccessMsg('Configurations successfully updated and synced across all Canton participant nodes.');
      
      // Append governance log
      const newLog: GovernanceLog = {
        id: `GOV-${Math.floor(875 + Math.random() * 100)}`,
        adminName: 'John Trek',
        adminHandle: '@johntrek',
        action: 'Updated global transaction economics fees',
        timestamp: 'Just now'
      };
      setGovernanceLogs(prev => [newLog, ...prev]);
    }, 1200);
  };

  const handleSaveMaintenance = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('canafri_maintenance_active', maintenanceActive ? 'true' : 'false');
      localStorage.setItem('canafri_maintenance_message', maintenanceMessage);
      
      // Dispatch a custom event to notify other components instantly
      window.dispatchEvent(new Event('canafri_maintenance_change'));
      
      // Append a governance log
      const newLog: GovernanceLog = {
        id: `GOV-${Math.floor(900 + Math.random() * 100)}`,
        adminName: 'John Trek',
        adminHandle: '@johntrek',
        action: `Maintenance Mode turned ${maintenanceActive ? 'ON' : 'OFF'}`,
        timestamp: 'Just now'
      };
      setGovernanceLogs(prev => [newLog, ...prev]);
      setSuccessMsg(`Maintenance settings saved successfully. Platform is now ${maintenanceActive ? 'UNDER MAINTENANCE' : 'ACTIVE'}.`);
    }
  };

  const toggleIncentivePhase = () => {
    const nextState = !isIncentiveActive;
    setIsIncentiveActive(nextState);
    
    const newLog: GovernanceLog = {
      id: `GOV-${Math.floor(875 + Math.random() * 100)}`,
      adminName: 'John Trek',
      adminHandle: '@johntrek',
      action: nextState ? 'Activated Incentive Phase' : 'Paused Incentive Phase',
      timestamp: 'Just now'
    };
    setGovernanceLogs(prev => [newLog, ...prev]);
    setSuccessMsg(nextState ? 'Incentive Phase resumed.' : 'Incentive Phase successfully paused.');
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto px-6 py-6 font-sans">
        
        {/* Title Heading */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div>
            <h1 className="text-[1.875rem] font-bold text-white tracking-tight">
              Platform Config
            </h1>
            <p className="text-[0.75rem] text-[#A0A0A0] mt-0.5">
              Configure global smart contract boundaries, fee ratios, and active consensus parameters.
            </p>
          </div>
        </div>

        {/* Feedback alerts */}
        {successMsg && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[0.75rem] text-emerald-400 animate-slide-up">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[0.75rem] text-rose-400 animate-slide-up">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Top Banner */}
        <div className="bg-[#0b0b0b] border border-border rounded-[16px] px-6 py-4 flex items-center justify-between shadow-inner">
          <div className="flex flex-col">
            <span className="text-[0.8125rem] font-semibold text-white/90">Global Configurations Deployment</span>
            <span className="text-[0.6875rem] text-[#A0A0A0] mt-0.5">Batch submit all custom input config overrides.</span>
          </div>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="bg-[#8C5CFF] hover:bg-[#AC8EF3] disabled:bg-[#8C5CFF]/50 text-white font-semibold text-[0.8125rem] px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#8C5CFF]/20"
          >
            <Save size={15} />
            {isSaving ? 'Saving to Ledger...' : 'Save All Changes'}
          </button>
        </div>

        {/* Incentive Phase Control Header */}
        <div className="bg-[#0b0b0b] border border-border rounded-[16px] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="size-10 rounded-xl bg-[#8C5CFF]/10 flex items-center justify-center text-[#8C5CFF] border border-[#8C5CFF]/20 shrink-0">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="text-[0.9375rem] font-bold text-white tracking-tight">Incentive Phase</h3>
              <p className="text-[0.75rem] text-[#A0A0A0] mt-0.5">
                Reading stake mechanic is active · users earning rewards per stake cycle
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 shrink-0 w-full md:w-auto justify-end">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isIncentiveActive 
                ? 'bg-[#4ade80]/10 border border-[#4ade80]/20 text-[#4ade80]' 
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}>
              {isIncentiveActive ? 'Active' : 'Paused'}
            </span>
            <button
              type="button"
              onClick={toggleIncentivePhase}
              className="border border-[#8C5CFF] hover:bg-[#8C5CFF]/10 text-white font-semibold text-[0.75rem] px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all"
            >
              {isIncentiveActive ? (
                <>
                  <Pause size={13} className="text-amber-400" />
                  Pause
                </>
              ) : (
                <>
                  <Play size={13} className="text-emerald-400" />
                  Resume
                </>
              )}
            </button>
            <button
              type="button"
              className="bg-[#8C5CFF] hover:bg-[#AC8EF3] text-white font-semibold text-[0.75rem] px-4 py-2 rounded-xl transition-all"
            >
              Configure
            </button>
          </div>
        </div>

        {/* Row 1: 2-Column Grid Layout (Economics & Stake config side by side) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          
          {/* Subscription Economics Box */}
          <div className="bg-[#0b0b0b] border border-border rounded-[16px] p-5 flex flex-col gap-4 h-full">
            <div>
              <h4 className="text-[0.8125rem] font-bold text-white">Subscription Economics</h4>
              <p className="text-[0.6875rem] text-[#A0A0A0] mt-0.5">Parameters governing platform staking payouts and cycles.</p>
            </div>
            <div className="h-px bg-border/40 w-full" />

            {/* Fields List */}
            <div className="flex flex-col gap-3.5">
              {/* Field 1 */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-[0.75rem] font-medium text-white/90">Subscription amount</span>
                  <span className="text-[0.625rem] text-[#A0A0A0] mt-0.5">Default 20 CC monthly</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    value={subscriptionAmount}
                    onChange={e => setSubscriptionAmount(e.target.value)}
                    className="w-20 bg-[#121212] border border-border rounded-lg px-2.5 py-1.5 text-right font-mono font-semibold text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none"
                  />
                  <span className="text-[0.6875rem] font-semibold text-[#A0A0A0] w-6">CC</span>
                </div>
              </div>
              <div className="h-px bg-border/20 w-full" />

              {/* Field 2 */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-[0.75rem] font-medium text-white/90">Pool allocation</span>
                  <span className="text-[0.625rem] text-[#A0A0A0] mt-0.5">Goes to creator distribution</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    value={poolAllocation}
                    onChange={e => setPoolAllocation(e.target.value)}
                    className="w-20 bg-[#121212] border border-border rounded-lg px-2.5 py-1.5 text-right font-mono font-semibold text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none"
                  />
                  <span className="text-[0.6875rem] font-semibold text-[#A0A0A0] w-6">CC</span>
                </div>
              </div>
              <div className="h-px bg-border/20 w-full" />

              {/* Field 3 */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-[0.75rem] font-medium text-white/90">Stake balance allocation</span>
                  <span className="text-[0.625rem] text-[#A0A0A0] mt-0.5">User's reading stake balance</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    value={stakeBalanceAllocation}
                    onChange={e => setStakeBalanceAllocation(e.target.value)}
                    className="w-20 bg-[#121212] border border-border rounded-lg px-2.5 py-1.5 text-right font-mono font-semibold text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none"
                  />
                  <span className="text-[0.6875rem] font-semibold text-[#A0A0A0] w-6">CC</span>
                </div>
              </div>
              <div className="h-px bg-border/20 w-full" />

              {/* Field 4 */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-[0.75rem] font-medium text-white/90">Platform fee subscription</span>
                  <span className="text-[0.625rem] text-[#A0A0A0] mt-0.5">Fee percentage of sub pool</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    value={platformFeeSubscription}
                    onChange={e => setPlatformFeeSubscription(e.target.value)}
                    className="w-20 bg-[#121212] border border-border rounded-lg px-2.5 py-1.5 text-right font-mono font-semibold text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none"
                  />
                  <span className="text-[0.6875rem] font-semibold text-[#A0A0A0] w-6">%</span>
                </div>
              </div>
              <div className="h-px bg-border/20 w-full" />

              {/* Field 5 */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-[0.75rem] font-medium text-white/90">Platform fee freelance</span>
                  <span className="text-[0.625rem] text-[#A0A0A0] mt-0.5">Per milestone release</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    value={platformFeeFreelance}
                    onChange={e => setPlatformFeeFreelance(e.target.value)}
                    className="w-20 bg-[#121212] border border-border rounded-lg px-2.5 py-1.5 text-right font-mono font-semibold text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none"
                  />
                  <span className="text-[0.6875rem] font-semibold text-[#A0A0A0] w-6">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Continue Reading Stake Box */}
          <div className="bg-[#0b0b0b] border border-border rounded-[16px] p-5 flex flex-col gap-4 h-full">
            <div>
              <h4 className="text-[0.8125rem] font-bold text-white">Continue Reading Stake</h4>
              <p className="text-[0.6875rem] text-[#A0A0A0] mt-0.5">Setup parameters for staking duration locks and quotas.</p>
            </div>
            <div className="h-px bg-border/40 w-full" />

            <div className="flex flex-col gap-3.5">
              {/* Stake amount */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-[0.75rem] font-medium text-white/90">Stake amount</span>
                  <span className="text-[0.625rem] text-[#A0A0A0] mt-0.5">CC locked per content piece</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={e => setStakeAmount(e.target.value)}
                    className="w-20 bg-[#121212] border border-border rounded-lg px-2.5 py-1.5 text-right font-mono font-semibold text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none"
                  />
                  <span className="text-[0.6875rem] font-semibold text-[#A0A0A0] w-8">CC</span>
                </div>
              </div>
              <div className="h-px bg-border/20 w-full" />

              {/* Minimum read time */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-[0.75rem] font-medium text-white/90">Minimum read time</span>
                  <span className="text-[0.625rem] text-[#A0A0A0] mt-0.5">Before unstake is allowed</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    value={minReadTime}
                    onChange={e => setMinReadTime(e.target.value)}
                    className="w-20 bg-[#121212] border border-border rounded-lg px-2.5 py-1.5 text-right font-mono font-semibold text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none"
                  />
                  <span className="text-[0.6875rem] font-semibold text-[#A0A0A0] w-8">min</span>
                </div>
              </div>
              <div className="h-px bg-border/20 w-full" />

              {/* Grace period */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-[0.75rem] font-medium text-white/90">Grace period</span>
                  <span className="text-[0.625rem] text-[#A0A0A0] mt-0.5">Re-read without re-staking</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    value={gracePeriod}
                    onChange={e => setGracePeriod(e.target.value)}
                    className="w-20 bg-[#121212] border border-border rounded-lg px-2.5 py-1.5 text-right font-mono font-semibold text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none"
                  />
                  <span className="text-[0.6875rem] font-semibold text-[#A0A0A0] w-8">hr</span>
                </div>
              </div>
              <div className="h-px bg-border/20 w-full" />

              {/* Creator stake requirement */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-[0.75rem] font-medium text-white/90">Creator stake requirement</span>
                  <span className="text-[0.625rem] text-[#A0A0A0] mt-0.5">Minimum to unlock creator mode</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    value={creatorStakeRequirement}
                    onChange={e => setCreatorStakeRequirement(e.target.value)}
                    className="w-20 bg-[#121212] border border-border rounded-lg px-2.5 py-1.5 text-right font-mono font-semibold text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none"
                  />
                  <span className="text-[0.6875rem] font-semibold text-[#A0A0A0] w-8">CC</span>
                </div>
              </div>
              <div className="h-px bg-border/20 w-full" />

              {/* Creator lock period */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-[0.75rem] font-medium text-white/90">Creator lock period</span>
                  <span className="text-[0.625rem] text-[#A0A0A0] mt-0.5">Minimum stake duration</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    value={creatorLockPeriod}
                    onChange={e => setCreatorLockPeriod(e.target.value)}
                    className="w-20 bg-[#121212] border border-border rounded-lg px-2.5 py-1.5 text-right font-mono font-semibold text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none"
                  />
                  <span className="text-[0.6875rem] font-semibold text-[#A0A0A0] w-8">days</span>
                </div>
              </div>
              <div className="h-px bg-border/20 w-full" />

              {/* Max content per month */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-[0.75rem] font-medium text-white/90">Max content per month</span>
                  <span className="text-[0.625rem] text-[#A0A0A0] mt-0.5">Per creator limit</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    value={maxContentPerMonth}
                    onChange={e => setMaxContentPerMonth(e.target.value)}
                    className="w-20 bg-[#121212] border border-border rounded-lg px-2.5 py-1.5 text-right font-mono font-semibold text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none"
                  />
                  <span className="text-[0.6875rem] font-semibold text-[#A0A0A0] w-8">pcs</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Row 2: Treasury Rules (Stretched Full Width) */}
        <div className="w-full">
          <div className="bg-[#0b0b0b] border border-border rounded-[16px] p-5 flex flex-col gap-4">
            <div>
              <h4 className="text-[0.8125rem] font-bold text-white">Treasury Rules</h4>
              <p className="text-[0.6875rem] text-[#A0A0A0] mt-0.5">Threshold allocations for wallet reserves and app rules.</p>
            </div>
            <div className="h-px bg-border/40 w-full" />

            <div className="flex flex-col gap-3.5">
              {/* Minimum reserve */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-[0.75rem] font-medium text-white/90">Minimum reserve</span>
                  <span className="text-[0.625rem] text-[#A0A0A0] mt-0.5">Blocks withdrawal below this</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    value={minimumReserve}
                    onChange={e => setMinimumReserve(e.target.value)}
                    className="w-20 bg-[#121212] border border-border rounded-lg px-2.5 py-1.5 text-right font-mono font-semibold text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none"
                  />
                  <span className="text-[0.6875rem] font-semibold text-[#A0A0A0] w-6">CC</span>
                </div>
              </div>
              <div className="h-px bg-border/20 w-full" />

              {/* Seller Application Deposit */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-[0.75rem] font-medium text-white/90">Seller application deposit</span>
                  <span className="text-[0.625rem] text-[#A0A0A0] mt-0.5">Refundable on job close</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    value={sellerAppDeposit}
                    onChange={e => setSellerAppDeposit(e.target.value)}
                    className="w-20 bg-[#121212] border border-border rounded-lg px-2.5 py-1.5 text-right font-mono font-semibold text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none"
                  />
                  <span className="text-[0.6875rem] font-semibold text-[#A0A0A0] w-6">CC</span>
                </div>
              </div>
              <div className="h-px bg-border/20 w-full" />

              {/* Daily Check-In Reward */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-[0.75rem] font-medium text-white/90">Daily check-in reward</span>
                  <span className="text-[0.625rem] text-[#A0A0A0] mt-0.5">Per active user per day</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    value={dailyCheckInReward}
                    onChange={e => setDailyCheckInReward(e.target.value)}
                    className="w-20 bg-[#121212] border border-border rounded-lg px-2.5 py-1.5 text-right font-mono font-semibold text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none"
                  />
                  <span className="text-[0.6875rem] font-semibold text-[#A0A0A0] w-6">CC</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Mode Controller */}
        <div className="w-full">
          <div className="bg-[#0b0b0b] border border-border rounded-[16px] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[0.8125rem] font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="size-4 text-[#F59E0B]" />
                  Platform Maintenance Settings
                </h4>
                <p className="text-[0.6875rem] text-[#A0A0A0] mt-0.5">
                  Put the entire user platform under maintenance mode and broadcast a custom message.
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setMaintenanceActive(prev => !prev)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  maintenanceActive ? 'bg-[#F59E0B]' : 'bg-border/60'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    maintenanceActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            
            <div className="h-px bg-border/40 w-full" />

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[0.75rem] font-semibold text-white/95">Maintenance Message to Users</span>
                <span className="text-[0.625rem] text-[#A0A0A0]">This message will be displayed on the screen for all locked-out users.</span>
              </div>
              <textarea
                value={maintenanceMessage}
                onChange={e => setMaintenanceMessage(e.target.value)}
                disabled={!maintenanceActive}
                className="w-full min-h-[80px] bg-[#121212] border border-border rounded-lg p-3 text-[0.75rem] text-white focus:border-[#8C5CFF] focus:outline-none disabled:opacity-50 resize-none font-sans"
                placeholder="Write custom maintenance notification message here..."
              />

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveMaintenance}
                  className="flex items-center gap-2 bg-[#8C5CFF] hover:bg-[#7A4AEE] text-white px-4 py-2 rounded-lg text-[0.75rem] font-semibold transition-colors"
                >
                  <Save className="size-3.5" />
                  Save Maintenance Config
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Recent Governance Changes (Stretched Full Width at Bottom) */}
        <div className="w-full">
          <div className="bg-[#0b0b0b] border border-border rounded-[16px] p-5 flex flex-col gap-4">
            <div>
              <h4 className="text-[0.8125rem] font-bold text-white">Recent Governance Changes</h4>
              <p className="text-[0.6875rem] text-[#A0A0A0] mt-0.5">Consensus log details of contract modifications.</p>
            </div>
            <div className="h-px bg-border/40 w-full" />

            {/* Logs List */}
            <div className="flex flex-col gap-3">
              {governanceLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between gap-3 border-b border-border/20 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="size-9 rounded-xl bg-card border border-border flex items-center justify-center text-[#A0A0A0] shrink-0">
                      <Settings size={15} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[0.75rem] font-semibold text-white/95 truncate">{log.adminName}</span>
                      <span className="text-[0.625rem] text-[#A0A0A0] mt-0.5 truncate">{log.adminHandle} · {log.action}</span>
                    </div>
                  </div>
                  <span className="text-[0.625rem] text-[#A0A0A0] whitespace-nowrap shrink-0">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
