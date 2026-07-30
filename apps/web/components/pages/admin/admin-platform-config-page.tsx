'use client';

import { useState, useEffect } from 'react';
import { 
  Sliders, 
  Save, 
  Play, 
  Pause, 
  Settings, 
  CheckCircle2, 
  Wrench, 
  ShieldAlert, 
  Globe, 
  Bell, 
  Wallet, 
  FileText, 
  MessageSquare, 
  UserCheck, 
  DollarSign, 
  Lock,
  Calendar,
  AlertOctagon,
  RefreshCw,
  Power
} from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { usePlatformConfig } from '@/lib/platform-config-context';

interface GovernanceLog {
  id: string;
  adminName: string;
  adminHandle: string;
  action: string;
  timestamp: string;
}

const COMMON_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'IN', name: 'India' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IR', name: 'Iran' },
  { code: 'KP', name: 'North Korea' },
  { code: 'RU', name: 'Russia' },
];

export default function AdminPlatformConfigPage() {
  const { refresh: refreshGlobalConfig } = usePlatformConfig();

  // Loading & state status
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── 1. Global & Service Maintenance Flags ───────────────────────────────────
  const [globalMaintenance, setGlobalMaintenance] = useState(false);
  const [globalMaintenanceReason, setGlobalMaintenanceReason] = useState('');
  const [freelancingMaintenance, setFreelancingMaintenance] = useState(false);
  const [freelancingMaintenanceReason, setFreelancingMaintenanceReason] = useState('');
  const [contentMaintenance, setContentMaintenance] = useState(false);
  const [contentMaintenanceReason, setContentMaintenanceReason] = useState('');
  const [messagingMaintenance, setMessagingMaintenance] = useState(false);
  const [messagingMaintenanceReason, setMessagingMaintenanceReason] = useState('');
  const [registrationPaused, setRegistrationPaused] = useState(false);
  const [registrationPausedReason, setRegistrationPausedReason] = useState('');
  const [loginPaused, setLoginPaused] = useState(false);
  const [loginPausedReason, setLoginPausedReason] = useState('');

  // ── 2. Financial Emergency Controls ────────────────────────────────────────
  const [walletPaused, setWalletPaused] = useState(false);
  const [walletPausedReason, setWalletPausedReason] = useState('');
  const [depositPaused, setDepositPaused] = useState(false);
  const [depositPausedReason, setDepositPausedReason] = useState('');
  const [withdrawPaused, setWithdrawPaused] = useState(false);
  const [withdrawPausedReason, setWithdrawPausedReason] = useState('');
  const [escrowCreatePaused, setEscrowCreatePaused] = useState(false);
  const [escrowCreatePausedReason, setEscrowCreatePausedReason] = useState('');
  const [escrowReleasePaused, setEscrowReleasePaused] = useState(false);
  const [escrowReleasePausedReason, setEscrowReleasePausedReason] = useState('');
  const [otcTradingPaused, setOtcTradingPaused] = useState(false);

  // ── 3. System Controls ──────────────────────────────────────────────────────
  const [creatorPaused, setCreatorPaused] = useState(false);
  const [notificationsPaused, setNotificationsPaused] = useState(false);
  const [emailSendingPaused, setEmailSendingPaused] = useState(false);

  // ── 4. Country Access Control ───────────────────────────────────────────────
  const [restrictedCountries, setRestrictedCountries] = useState<string[]>([]);
  const [customCountryInput, setCustomCountryInput] = useState('');

  // ── 5. Scheduled Maintenance Banner ─────────────────────────────────────────
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerTitle, setBannerTitle] = useState('Scheduled Maintenance');
  const [bannerMessage, setBannerMessage] = useState('CanaFri will undergo scheduled maintenance. Some services may be temporarily unavailable.');
  const [bannerStart, setBannerStart] = useState('');
  const [bannerEnd, setBannerEnd] = useState('');
  const [bannerDismissible, setBannerDismissible] = useState(true);

  // ── 6. Economics Settings ───────────────────────────────────────────────────
  const [subscriptionAmount, setSubscriptionAmount] = useState('20');
  const [poolAllocation, setPoolAllocation] = useState('15');
  const [stakeBalanceAllocation, setStakeBalanceAllocation] = useState('5');
  const [platformFeeSubscription, setPlatformFeeSubscription] = useState('0.30');
  const [platformFeeFreelance, setPlatformFeeFreelance] = useState('0.05');
  const [stakeAmount, setStakeAmount] = useState('5');
  const [minReadTime, setMinReadTime] = useState('600');
  const [gracePeriod, setGracePeriod] = useState('2');
  const [creatorStakeRequirement, setCreatorStakeRequirement] = useState('100');
  const [creatorLockPeriod, setCreatorLockPeriod] = useState('14');
  const [maxContentPerMonth, setMaxContentPerMonth] = useState('5');
  const [minimumReserve, setMinimumReserve] = useState('10000');
  const [sellerAppDeposit, setSellerAppDeposit] = useState('0.5');
  const [dailyCheckInReward, setDailyCheckInReward] = useState('0.05');
  const [isIncentiveActive, setIsIncentiveActive] = useState(true);

  // Config Version
  const [configVersion, setConfigVersion] = useState(1);

  // Load config on mount
  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/api/admin/config');
        if (res.ok) {
          const data = await res.json();
          const cfg = data.config || {};

          setConfigVersion(cfg.version || 1);
          setGlobalMaintenance(!!cfg.globalMaintenance);
          setGlobalMaintenanceReason(cfg.globalMaintenanceReason || '');
          setFreelancingMaintenance(!!cfg.freelancingMaintenance);
          setFreelancingMaintenanceReason(cfg.freelancingMaintenanceReason || '');
          setContentMaintenance(!!cfg.contentMaintenance);
          setContentMaintenanceReason(cfg.contentMaintenanceReason || '');
          setMessagingMaintenance(!!cfg.messagingMaintenance);
          setMessagingMaintenanceReason(cfg.messagingMaintenanceReason || '');
          setRegistrationPaused(!!cfg.registrationPaused);
          setRegistrationPausedReason(cfg.registrationPausedReason || '');
          setLoginPaused(!!cfg.loginPaused);
          setLoginPausedReason(cfg.loginPausedReason || '');

          setWalletPaused(!!cfg.walletPaused);
          setWalletPausedReason(cfg.walletPausedReason || '');
          setDepositPaused(!!cfg.depositPaused);
          setDepositPausedReason(cfg.depositPausedReason || '');
          setWithdrawPaused(!!cfg.withdrawPaused);
          setWithdrawPausedReason(cfg.withdrawPausedReason || '');
          setEscrowCreatePaused(!!cfg.escrowCreatePaused);
          setEscrowCreatePausedReason(cfg.escrowCreatePausedReason || '');
          setEscrowReleasePaused(!!cfg.escrowReleasePaused);
          setEscrowReleasePausedReason(cfg.escrowReleasePausedReason || '');
          setOtcTradingPaused(!!cfg.otcTradingPaused);

          setCreatorPaused(!!cfg.creatorPaused);
          setNotificationsPaused(!!cfg.notificationsPaused);
          setEmailSendingPaused(!!cfg.emailSendingPaused);

          setRestrictedCountries(Array.isArray(cfg.restrictedCountries) ? cfg.restrictedCountries : []);

          setBannerEnabled(!!cfg.bannerEnabled);
          setBannerTitle(cfg.bannerTitle || 'Scheduled Maintenance');
          setBannerMessage(cfg.bannerMessage || '');
          setBannerStart(cfg.bannerStart ? new Date(cfg.bannerStart).toISOString().slice(0, 16) : '');
          setBannerEnd(cfg.bannerEnd ? new Date(cfg.bannerEnd).toISOString().slice(0, 16) : '');
          setBannerDismissible(cfg.bannerDismissible !== false);

          if (cfg.subscriptionAmountCC) setSubscriptionAmount(String(cfg.subscriptionAmountCC));
          if (cfg.poolAllocationCC) setPoolAllocation(String(cfg.poolAllocationCC));
          if (cfg.stakeBalanceCC) setStakeBalanceAllocation(String(cfg.stakeBalanceCC));
          if (cfg.platformFeeSub) setPlatformFeeSubscription(String(cfg.platformFeeSub));
          if (cfg.platformFeeFreelance) setPlatformFeeFreelance(String(cfg.platformFeeFreelance));
          if (cfg.readStakeAmountCC) setStakeAmount(String(cfg.readStakeAmountCC));
          if (cfg.minReadTimeSeconds) setMinReadTime(String(cfg.minReadTimeSeconds));
          if (cfg.gracePeriodHours) setGracePeriod(String(cfg.gracePeriodHours));
          if (cfg.creatorStakeCC) setCreatorStakeRequirement(String(cfg.creatorStakeCC));
          if (cfg.creatorLockDays) setCreatorLockPeriod(String(cfg.creatorLockDays));
          if (cfg.maxContentPerMonth) setMaxContentPerMonth(String(cfg.maxContentPerMonth));
          if (cfg.minTreasuryReserveCC) setMinimumReserve(String(cfg.minTreasuryReserveCC));
          if (cfg.proposalDepositCC) setSellerAppDeposit(String(cfg.proposalDepositCC));
          if (cfg.dailyCheckinCC) setDailyCheckInReward(String(cfg.dailyCheckinCC));
          if (typeof cfg.incentivePhaseActive === 'boolean') setIsIncentiveActive(cfg.incentivePhaseActive);
        }
      } catch (e) {
        console.error('Failed to load platform config:', e);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const toggleCountry = (code: string) => {
    setRestrictedCountries(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const addCustomCountry = () => {
    const code = customCountryInput.trim().toUpperCase();
    if (code && code.length === 2 && !restrictedCountries.includes(code)) {
      setRestrictedCountries([...restrictedCountries, code]);
      setCustomCountryInput('');
    }
  };

  const handleSaveAll = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSaving(true);

    try {
      const payload: Record<string, any> = {
        globalMaintenance,
        globalMaintenanceReason: globalMaintenanceReason || undefined,
        freelancingMaintenance,
        freelancingMaintenanceReason: freelancingMaintenanceReason || undefined,
        contentMaintenance,
        contentMaintenanceReason: contentMaintenanceReason || undefined,
        messagingMaintenance,
        messagingMaintenanceReason: messagingMaintenanceReason || undefined,
        registrationPaused,
        registrationPausedReason: registrationPausedReason || undefined,
        loginPaused,
        loginPausedReason: loginPausedReason || undefined,

        walletPaused,
        walletPausedReason: walletPausedReason || undefined,
        depositPaused,
        depositPausedReason: depositPausedReason || undefined,
        withdrawPaused,
        withdrawPausedReason: withdrawPausedReason || undefined,
        escrowCreatePaused,
        escrowCreatePausedReason: escrowCreatePausedReason || undefined,
        escrowReleasePaused,
        escrowReleasePausedReason: escrowReleasePausedReason || undefined,
        otcTradingPaused,

        creatorPaused,
        notificationsPaused,
        emailSendingPaused,

        restrictedCountries,

        bannerEnabled,
        bannerTitle,
        bannerMessage,
        bannerStart: bannerStart ? new Date(bannerStart).toISOString() : null,
        bannerEnd: bannerEnd ? new Date(bannerEnd).toISOString() : null,
        bannerDismissible,

        subscriptionAmountCC: parseFloat(subscriptionAmount),
        poolAllocationCC: parseFloat(poolAllocation),
        stakeBalanceCC: parseFloat(stakeBalanceAllocation),
        platformFeeSub: parseFloat(platformFeeSubscription),
        platformFeeFreelance: parseFloat(platformFeeFreelance),
        readStakeAmountCC: parseFloat(stakeAmount),
        minReadTimeSeconds: parseInt(minReadTime, 10),
        gracePeriodHours: parseInt(gracePeriod, 10),
        creatorStakeCC: parseFloat(creatorStakeRequirement),
        creatorLockDays: parseInt(creatorLockPeriod, 10),
        maxContentPerMonth: parseInt(maxContentPerMonth, 10),
        minTreasuryReserveCC: parseFloat(minimumReserve),
        proposalDepositCC: parseFloat(sellerAppDeposit),
        dailyCheckinCC: parseFloat(dailyCheckInReward),
        incentivePhaseActive: isIncentiveActive,
      };

      const res = await apiFetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update platform controls');
      }

      const resData = await res.json();
      if (resData.config?.version) {
        setConfigVersion(resData.config.version);
      }

      // Sync frontend context
      refreshGlobalConfig();

      // Legacy compatibility
      localStorage.setItem('canafri_maintenance_active', String(globalMaintenance));
      localStorage.setItem('canafri_maintenance_message', globalMaintenanceReason || '');
      window.dispatchEvent(new CustomEvent('canafri_maintenance_change'));

      setSuccessMsg('Platform Control Center settings published successfully! Real-time updates pushed to all active sessions.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center text-muted">
        <RefreshCw size={24} className="animate-spin text-[#8C5CFF]" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-8 flex flex-col gap-8 pb-24 font-sans text-foreground">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted tracking-wider uppercase">
            <Sliders size={14} className="text-muted" />
            <span>Platform Governance</span>
            <span className="text-muted">•</span>
            <span className="text-muted">v{configVersion}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Platform Control Center
          </h1>
          <p className="text-sm text-muted mt-1">
            Centralized SUPER_ADMIN emergency controls, maintenance state toggles, country availability, and announcements.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#8C5CFF] hover:bg-[#7b46ff] text-white text-xs font-semibold shadow-lg shadow-[#8C5CFF]/20 transition-all disabled:opacity-50 shrink-0"
        >
          {isSaving ? <RefreshCw size={14} className="animate-spin text-white" /> : <Save size={14} className="text-white" />}
          <span>{isSaving ? 'Publishing Updates...' : 'Publish All Changes'}</span>
        </button>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
          <CheckCircle2 size={16} className="shrink-0 text-muted" />
          <span className="flex-1">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
          <ShieldAlert size={16} className="shrink-0 text-muted" />
          <span className="flex-1">{errorMsg}</span>
        </div>
      )}

      {/* SECTION 1: GLOBAL & EMERGENCY MAINTENANCE */}
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-secondary text-muted">
              <AlertOctagon size={20} className="text-muted" />
            </div>
            <div>
              <h2 className="text-base font-bold">1. Emergency & Service Maintenance</h2>
              <p className="text-xs text-muted">Independent manual toggles — never automatically reset when scheduled windows expire.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Global Maintenance */}
          <div className={`p-4 rounded-xl border transition-all ${globalMaintenance ? 'bg-red-500/10 border-red-500/50' : 'bg-background border-border'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Power size={16} className={globalMaintenance ? 'text-red-400' : 'text-muted'} />
                <span className="text-xs font-bold">Global Maintenance Mode</span>
              </div>
              <button
                type="button"
                onClick={() => setGlobalMaintenance(!globalMaintenance)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${globalMaintenance ? 'bg-red-500 text-white' : 'bg-secondary text-foreground'}`}
              >
                {globalMaintenance ? 'ACTIVE (SYSTEM DOWN)' : 'DISABLED (NORMAL)'}
              </button>
            </div>
            <input
              type="text"
              placeholder="Custom Maintenance Reason Message..."
              value={globalMaintenanceReason}
              onChange={e => setGlobalMaintenanceReason(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs outline-none text-foreground placeholder:text-muted/50 mt-2"
            />
          </div>

          {/* Freelancing Service Maintenance */}
          <div className={`p-4 rounded-xl border transition-all ${freelancingMaintenance ? 'bg-amber-500/10 border-amber-500/50' : 'bg-background border-border'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wrench size={16} className={freelancingMaintenance ? 'text-amber-400' : 'text-muted'} />
                <span className="text-xs font-bold">Freelancing Service</span>
              </div>
              <button
                type="button"
                onClick={() => setFreelancingMaintenance(!freelancingMaintenance)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${freelancingMaintenance ? 'bg-amber-500 text-white' : 'bg-secondary text-foreground'}`}
              >
                {freelancingMaintenance ? 'PAUSED' : 'ACTIVE'}
              </button>
            </div>
            <input
              type="text"
              placeholder="Reason (e.g. The freelancing service is under maintenance...)"
              value={freelancingMaintenanceReason}
              onChange={e => setFreelancingMaintenanceReason(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs outline-none text-foreground placeholder:text-muted/50 mt-2"
            />
          </div>

          {/* User Registration */}
          <div className={`p-4 rounded-xl border transition-all ${registrationPaused ? 'bg-amber-500/10 border-amber-500/50' : 'bg-background border-border'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className={registrationPaused ? 'text-amber-400' : 'text-muted'} />
                <span className="text-xs font-bold">User Registrations</span>
              </div>
              <button
                type="button"
                onClick={() => setRegistrationPaused(!registrationPaused)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${registrationPaused ? 'bg-amber-500 text-white' : 'bg-secondary text-foreground'}`}
              >
                {registrationPaused ? 'PAUSED' : 'ACTIVE'}
              </button>
            </div>
            <input
              type="text"
              placeholder="Registration pause message..."
              value={registrationPausedReason}
              onChange={e => setRegistrationPausedReason(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs outline-none text-foreground placeholder:text-muted/50 mt-2"
            />
          </div>

          {/* Messaging */}
          <div className={`p-4 rounded-xl border transition-all ${messagingMaintenance ? 'bg-amber-500/10 border-amber-500/50' : 'bg-background border-border'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className={messagingMaintenance ? 'text-amber-400' : 'text-muted'} />
                <span className="text-xs font-bold">Messaging Service</span>
              </div>
              <button
                type="button"
                onClick={() => setMessagingMaintenance(!messagingMaintenance)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${messagingMaintenance ? 'bg-amber-500 text-white' : 'bg-secondary text-foreground'}`}
              >
                {messagingMaintenance ? 'PAUSED' : 'ACTIVE'}
              </button>
            </div>
            <input
              type="text"
              placeholder="Messaging pause message..."
              value={messagingMaintenanceReason}
              onChange={e => setMessagingMaintenanceReason(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs outline-none text-foreground placeholder:text-muted/50 mt-2"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: FINANCIAL & PAYMENT CONTROLS */}
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-secondary text-muted">
              <Wallet size={20} className="text-muted" />
            </div>
            <div>
              <h2 className="text-base font-bold">2. Payment & Financial Emergency Controls</h2>
              <p className="text-xs text-muted">Pause specific transaction vectors immediately during security investigations or upgrades.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Wallet Connections */}
          <div className="p-4 rounded-xl border border-border bg-background flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Wallet Connections</span>
              <button
                type="button"
                onClick={() => setWalletPaused(!walletPaused)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${walletPaused ? 'bg-red-500 text-white' : 'bg-secondary text-muted'}`}
              >
                {walletPaused ? 'PAUSED' : 'ACTIVE'}
              </button>
            </div>
            <input
              type="text"
              placeholder="Reason message..."
              value={walletPausedReason}
              onChange={e => setWalletPausedReason(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-2.5 py-1 text-[11px] outline-none text-foreground"
            />
          </div>

          {/* Deposits */}
          <div className="p-4 rounded-xl border border-border bg-background flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Deposits</span>
              <button
                type="button"
                onClick={() => setDepositPaused(!depositPaused)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${depositPaused ? 'bg-red-500 text-white' : 'bg-secondary text-muted'}`}
              >
                {depositPaused ? 'PAUSED' : 'ACTIVE'}
              </button>
            </div>
            <input
              type="text"
              placeholder="Reason message..."
              value={depositPausedReason}
              onChange={e => setDepositPausedReason(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-2.5 py-1 text-[11px] outline-none text-foreground"
            />
          </div>

          {/* Withdrawals */}
          <div className="p-4 rounded-xl border border-border bg-background flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Withdrawals</span>
              <button
                type="button"
                onClick={() => setWithdrawPaused(!withdrawPaused)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${withdrawPaused ? 'bg-red-500 text-white' : 'bg-secondary text-muted'}`}
              >
                {withdrawPaused ? 'PAUSED' : 'ACTIVE'}
              </button>
            </div>
            <input
              type="text"
              placeholder="Reason message..."
              value={withdrawPausedReason}
              onChange={e => setWithdrawPausedReason(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-2.5 py-1 text-[11px] outline-none text-foreground"
            />
          </div>

          {/* Escrow Creation */}
          <div className="p-4 rounded-xl border border-border bg-background flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Escrow Creation</span>
              <button
                type="button"
                onClick={() => setEscrowCreatePaused(!escrowCreatePaused)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${escrowCreatePaused ? 'bg-red-500 text-white' : 'bg-secondary text-muted'}`}
              >
                {escrowCreatePaused ? 'PAUSED' : 'ACTIVE'}
              </button>
            </div>
            <input
              type="text"
              placeholder="Reason message..."
              value={escrowCreatePausedReason}
              onChange={e => setEscrowCreatePausedReason(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-2.5 py-1 text-[11px] outline-none text-foreground"
            />
          </div>

          {/* Escrow Release */}
          <div className="p-4 rounded-xl border border-border bg-background flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Escrow Release</span>
              <button
                type="button"
                onClick={() => setEscrowReleasePaused(!escrowReleasePaused)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${escrowReleasePaused ? 'bg-red-500 text-white' : 'bg-secondary text-muted'}`}
              >
                {escrowReleasePaused ? 'PAUSED' : 'ACTIVE'}
              </button>
            </div>
            <input
              type="text"
              placeholder="Reason message..."
              value={escrowReleasePausedReason}
              onChange={e => setEscrowReleasePausedReason(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-2.5 py-1 text-[11px] outline-none text-foreground"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: COUNTRY ACCESS CONTROL */}
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-secondary text-muted">
              <Globe size={20} className="text-muted" />
            </div>
            <div>
              <h2 className="text-base font-bold">3. Country Access Control</h2>
              <p className="text-xs text-muted">Restricted countries are excluded from registration selectors and rejected server-side.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="2-letter ISO Country Code (e.g. US, IR, KP)..."
              value={customCountryInput}
              onChange={e => setCustomCountryInput(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none text-foreground w-64 uppercase"
              maxLength={2}
            />
            <button
              type="button"
              onClick={addCustomCountry}
              className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition"
            >
              Restrict Country
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {COMMON_COUNTRIES.map(c => {
              const isRestricted = restrictedCountries.includes(c.code);
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => toggleCountry(c.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    isRestricted
                      ? 'bg-red-500/10 border-red-500/50 text-red-400'
                      : 'bg-background border-border text-foreground hover:border-[#8C5CFF]/50'
                  }`}
                >
                  <span>{c.name} ({c.code})</span>
                  {isRestricted ? <Lock size={12} className="text-muted" /> : <CheckCircle2 size={12} className="text-muted/40" />}
                </button>
              );
            })}
          </div>

          {restrictedCountries.length > 0 && (
            <div className="mt-2 text-xs text-red-400 flex items-center gap-2">
              <ShieldAlert size={14} className="text-muted" />
              <span>Currently Restricted ({restrictedCountries.length}): {restrictedCountries.join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: MAINTENANCE ANNOUNCEMENT BANNER */}
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-secondary text-muted">
              <Bell size={20} className="text-muted" />
            </div>
            <div>
              <h2 className="text-base font-bold">4. Scheduled Maintenance Banner</h2>
              <p className="text-xs text-muted">Displays a top sticky announcement across all pages without shifting site geometry.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBannerEnabled(!bannerEnabled)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${bannerEnabled ? 'bg-amber-500 text-white' : 'bg-secondary text-foreground'}`}
          >
            {bannerEnabled ? 'BANNER ENABLED' : 'BANNER DISABLED'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted uppercase">Banner Title</label>
            <input
              type="text"
              value={bannerTitle}
              onChange={e => setBannerTitle(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 me-2 py-2 text-xs outline-none text-foreground"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted uppercase">Dismissible by Users?</label>
            <div className="flex items-center gap-3 h-[38px]">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={bannerDismissible}
                  onChange={e => setBannerDismissible(e.target.checked)}
                  className="rounded border-border"
                />
                <span>Allow users to dismiss banner</span>
              </label>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted uppercase">Announcement Message</label>
            <textarea
              rows={2}
              value={bannerMessage}
              onChange={e => setBannerMessage(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none text-foreground resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted uppercase">Scheduled Start Time (Optional)</label>
            <input
              type="datetime-local"
              value={bannerStart}
              onChange={e => setBannerStart(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none text-foreground"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted uppercase">Scheduled End Time (Optional)</label>
            <input
              type="datetime-local"
              value={bannerEnd}
              onChange={e => setBannerEnd(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none text-foreground"
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: PLATFORM ECONOMICS & GOVERNANCE */}
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-secondary text-muted">
              <DollarSign size={20} className="text-muted" />
            </div>
            <div>
              <h2 className="text-base font-bold">5. Economics & Governance Parameters</h2>
              <p className="text-xs text-muted">Platform fees, subscription rates, reader staking requirements, and treasury rules.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsIncentiveActive(!isIncentiveActive)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${isIncentiveActive ? 'bg-emerald-500 text-white' : 'bg-secondary text-foreground'}`}
          >
            {isIncentiveActive ? 'INCENTIVE PHASE ACTIVE' : 'INCENTIVE PHASE PAUSED'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted uppercase">Subscription Fee (CC)</label>
            <input
              type="number"
              step="0.01"
              value={subscriptionAmount}
              onChange={e => setSubscriptionAmount(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none text-foreground"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted uppercase">Freelance Fee Rate (0.05 = 5%)</label>
            <input
              type="number"
              step="0.01"
              value={platformFeeFreelance}
              onChange={e => setPlatformFeeFreelance(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none text-foreground"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted uppercase">Subscription Platform Fee Rate</label>
            <input
              type="number"
              step="0.01"
              value={platformFeeSubscription}
              onChange={e => setPlatformFeeSubscription(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none text-foreground"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted uppercase">Creator Staking Requirement (CC)</label>
            <input
              type="number"
              value={creatorStakeRequirement}
              onChange={e => setCreatorStakeRequirement(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none text-foreground"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted uppercase">Minimum Treasury Reserve (CC)</label>
            <input
              type="number"
              value={minimumReserve}
              onChange={e => setMinimumReserve(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none text-foreground"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted uppercase">Seller Application Deposit (CC)</label>
            <input
              type="number"
              step="0.1"
              value={sellerAppDeposit}
              onChange={e => setSellerAppDeposit(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none text-foreground"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
