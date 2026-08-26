'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Bell, Check, Lock, X } from 'lucide-react';
import { WalletPageSkeleton } from '@/components/ui/skeleton';
import StakeModal from '@/components/ui/stake-modal';
import SubscribeModal from '@/components/ui/subscribe-modal';
import { useToast } from '@/components/ui/toast';
import { usePlatformConfig } from '@/lib/platform-config-context';
import { FeatureGate } from '@/components/ui/feature-gate';
import { apiFetch } from '@/lib/api-client';

// ─── Assets ──────────────────────────────────────────────────────────────────

const COIN_ICON = "https://api.builder.io/api/v1/image/assets/TEMP/e89c4e8d3f5d245132047c30016296b942397554?width=48";
const SENT_ICON = "https://api.builder.io/api/v1/image/assets/TEMP/3acf093b5e334027b5076883a2c3e2eb835afa6a?width=100";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Transaction {
  id: string | number;
  type: "receive" | "send";
  label: string;
  address: string;
  amount: string;
  rawAmount?: number;
  usd: string;
  positive: boolean;
  dateGroup?: string;
  status?: string;
  date?: string;
  fromAddress?: string;
  toAddress?: string;
  description?: string;
  network?: string;
  txHash?: string;
}

export interface WalletBalanceData {
  walletBound: boolean;
  walletAddress: string | null;
  availableBalanceCC: number;
  lockedBalanceCC: {
    creatorStakeCC: number;
    readStakesCC: number;
    escrowLockedCC: number;
    totalLockedCC: number;
  };
  totalBalanceCC: number;
  usdRate: number;
}

// ─── SVG Icons ──────────────────────────────────────────────────

function ArrowBackIcon({ size = 24 }: { size?: number }) {
  if (size === 24) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M6.921 12.5L12.714 18.292L12 19L5 12L12 5L12.714 5.708L6.92 11.5H19V12.5H6.921Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M11.3854 7.66675L7.52335 3.80542L7.99935 3.33342L12.666 8.00008L7.99935 12.6667L7.52335 12.1947L11.386 8.33342L3.33268 8.33341L3.33268 7.66675L11.3854 7.66675Z" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="21" height="24" viewBox="0 0 21 24" fill="none">
      <path d="M6.78711 7.75716L14.2124 16.2432M14.2124 7.75716L6.78711 16.2432" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M11.9999 16.3299C9.60992 16.3299 7.66992 14.3899 7.66992 11.9999C7.66992 9.60992 9.60992 7.66992 11.9999 7.66992C14.3899 7.66992 16.3299 9.60992 16.3299 11.9999C16.3299 14.3899 14.3899 16.3299 11.9999 16.3299ZM11.9999 9.16992C10.4399 9.16992 9.16992 10.4399 9.16992 11.9999C9.16992 13.5599 10.4399 14.8299 11.9999 14.8299C13.5599 14.8299 14.8299 13.5599 14.8299 11.9999C14.8299 10.4399 13.5599 9.16992 11.9999 9.16992Z" fill="#A0A0A0" />
      <path d="M12.0001 21.0205C8.24008 21.0205 4.69008 18.8205 2.25008 15.0005C1.19008 13.3505 1.19008 10.6605 2.25008 9.00047C4.70008 5.18047 8.25008 2.98047 12.0001 2.98047C15.7501 2.98047 19.3001 5.18047 21.7401 9.00047C22.8001 10.6505 22.8001 13.3405 21.7401 15.0005C19.3001 18.8205 15.7501 21.0205 12.0001 21.0205ZM12.0001 4.48047C8.77008 4.48047 5.68008 6.42047 3.52008 9.81047C2.77008 10.9805 2.77008 13.0205 3.52008 14.1905C5.68008 17.5805 8.77008 19.5205 12.0001 19.5205C15.2301 19.5205 18.3201 17.5805 20.4801 14.1905C21.2301 13.0205 21.2301 10.9805 20.4801 9.81047C18.3201 6.42047 15.2301 4.48047 12.0001 4.48047Z" fill="#A0A0A0" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M2 2L22 22" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.71277 6.7226C3.66479 8.79527 2 12 2 12C2 12 5.63636 19 12 19C14.0503 19 15.8174 18.2734 17.2711 17.2884M11 5.05822C11.3254 5.02013 11.6588 5 12 5C18.3636 5 22 12 22 12C22 12 21.3082 13.3317 20 14.8335" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.7645 14.7926C14.1583 15.3543 13.3564 15.7 12.4748 15.7C10.5415 15.7 8.97485 14.0449 8.97485 12C8.97485 11.0883 9.29896 10.2541 9.83705 9.62109" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RecentIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M13.5 8H12V13L16.28 15.54L17 14.33L13.5 12.25V8ZM13 3C10.6131 3 8.32387 3.94821 6.63604 5.63604C4.94821 7.32387 4 9.61305 4 12H1L4.96 16.03L9 12H6C6 10.1435 6.7375 8.36301 8.05025 7.05025C9.36301 5.7375 11.1435 5 13 5C14.8565 5 16.637 5.7375 17.9497 7.05025C19.2625 8.36301 20 10.1435 20 12C20 13.8565 19.2625 15.637 17.9497 16.9497C16.637 18.2625 14.8565 19 13 19C11.07 19 9.32 18.21 8.06 16.94L6.64 18.36C7.47161 19.2004 8.46234 19.8668 9.55433 20.32C10.6463 20.7733 11.8177 21.0045 13 21C15.3869 21 17.6761 20.0518 19.364 18.364C21.0518 16.6761 22 14.3869 22 12C22 9.61305 21.0518 7.32387 19.364 5.63604C17.6761 3.94821 15.3869 3 13 3Z" fill="#A0A0A0" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9.625 1.3125H12.6875V4.375M12.0312 1.96875L8.75 5.25M7.4375 2.1875H3.5C3.1519 2.1875 2.81806 2.32578 2.57192 2.57192C2.32578 2.81806 2.1875 3.1519 2.1875 3.5V10.5C2.1875 10.8481 2.32578 11.1819 2.57192 11.4281C2.81806 11.6742 3.1519 11.8125 3.5 11.8125H10.5C10.8481 11.8125 11.1819 11.6742 11.4281 11.4281C11.6742 11.1819 11.8125 10.8481 11.8125 10.5V6.5625" stroke="#8C5CFF" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SwitchIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M11.4375 2.43764L11.4375 3.53608C11.4375 3.61108 11.4703 3.68139 11.5281 3.72827C11.661 3.83764 11.7891 3.95483 11.911 4.07827C12.4163 4.58311 12.8191 5.18112 13.0969 5.8392C13.3849 6.52099 13.5326 7.25378 13.5313 7.99389C13.5313 8.74233 13.3844 9.46733 13.0969 10.1486C12.8191 10.8067 12.4163 11.4047 11.911 11.9095C11.4073 12.4153 10.8103 12.8185 10.1531 13.097C9.4719 13.3861 8.74846 13.5314 8.00002 13.5314C7.25159 13.5314 6.52815 13.3845 5.8469 13.097C5.18909 12.8189 4.5969 12.4189 4.08909 11.9095C3.58127 11.4001 3.18127 10.808 2.90315 10.1486C2.61565 9.46733 2.46877 8.74233 2.46877 7.99389C2.46877 7.24545 2.61409 6.52045 2.90315 5.8392C3.18127 5.17983 3.58127 4.58764 4.08909 4.07827C4.21252 3.95483 4.34065 3.8392 4.4719 3.72827C4.52971 3.68139 4.56252 3.60952 4.56252 3.53608L4.56252 2.43764C4.56252 2.3392 4.45315 2.27827 4.37034 2.33295C2.50784 3.53139 1.27502 5.62827 1.28127 8.01108C1.29065 11.7548 4.32971 14.7564 8.06877 14.7189C11.7485 14.6814 14.7188 11.6845 14.7188 7.99389C14.7188 5.61733 13.4875 3.52983 11.6297 2.33295C11.5469 2.27983 11.4375 2.3392 11.4375 2.43764ZM7.90159 1.04858L6.15159 3.26577C6.08596 3.34858 6.14534 3.46889 6.25002 3.46889L7.43752 3.46889L7.43752 8.37514C7.43752 8.44389 7.49377 8.50014 7.56252 8.50014L8.43752 8.50014C8.50627 8.50014 8.56252 8.44389 8.56252 8.37514L8.56252 3.46889L9.75002 3.46889C9.85471 3.46889 9.91409 3.34702 9.84846 3.26577L8.09846 1.04858C8.08677 1.03364 8.07183 1.02155 8.05477 1.01325C8.03772 1.00494 8.019 1.00062 8.00002 1.00062C7.98105 1.00062 7.96233 1.00494 7.94527 1.01325C7.92822 1.02155 7.91328 1.03364 7.90159 1.04858Z"
        fill={color}
      />
    </svg>
  );
}

function GreenBadgeIcon() {
  return (
    <div className="relative w-6 h-[25px] flex-shrink-0">
      <img src={COIN_ICON} alt="CC" className="w-6 h-6 rounded-full object-cover absolute left-0 top-0" />
      <div className="absolute left-4 top-[18px] w-[7px] h-[7px] rounded-full bg-[#4ADE80] border border-black flex-shrink-0" />
    </div>
  );
}

function WhiteBadgeIcon() {
  return (
    <div className="relative w-6 h-[25px] flex-shrink-0">
      <img src={COIN_ICON} alt="CC" className="w-6 h-6 rounded-full object-cover absolute left-0 top-0" />
      <div className="absolute left-4 top-[18px] w-[7px] h-[7px] rounded-full bg-white/80 border border-black flex-shrink-0" />
    </div>
  );
}

// ─── Transaction row ─────────────────────────────────────────────────────────

function TransactionRow({ tx, isFirst, onClick }: { tx: Transaction; isFirst: boolean; onClick: () => void }) {
  return (
    <div
      className={`flex items-center justify-between px-3 sm:px-4 py-3.5 sm:py-4 bg-[#FAFAFD] dark:bg-[#0B0B0B] cursor-pointer hover:bg-black/[0.03] dark:hover:bg-[#111] transition-colors rounded-[10px] ${isFirst ? "border border-[#D8D8D8] dark:border-[#121212]" : "border-r border-b border-l border-[#D8D8D8] dark:border-[#121212]"}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2.5">
          {tx.positive ? <GreenBadgeIcon /> : <WhiteBadgeIcon />}
        </div>
        <div className="flex flex-col gap-[1px]">
          <span className="text-[#010101] dark:text-white text-[13px] font-medium leading-[18px]">{tx.label}</span>
          <span className="text-muted text-[10px] leading-[13px] truncate max-w-[150px] sm:max-w-[220px]">{tx.address}</span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className={`text-[13px] font-medium leading-[18px] ${tx.positive ? "text-[#4ADE80]" : "text-[#F87171]"}`}>
          {tx.amount}
        </span>
        <span className="text-muted text-[10px] leading-[13px] text-right">{tx.usd}</span>
      </div>
    </div>
  );
}

// ─── Detail row ───────────────────────────────────────────────────────────────

function DetailRow({ label, value, divider = true }: { label: string; value: string; divider?: boolean }) {
  return (
    <>
      <div className="flex justify-between items-center w-full gap-4">
        <span className="text-[#010101]/80 dark:text-[rgba(255,255,255,0.8)] text-[10px] leading-[13px] shrink-0">{label}</span>
        <span className="text-muted text-[10px] leading-[13px] text-right break-all">{value}</span>
      </div>
      {divider && <div className="h-px w-full bg-[#D8D8D8] dark:bg-[#121212]" />}
    </>
  );
}

function CoinAvatar({ symbol }: { symbol: string }) {
  return (
    <div className="size-[30px] rounded-full bg-[#18181b] border border-border/20 flex items-center justify-center shrink-0">
      <span className="font-sans font-extrabold text-[15px] text-[#E4F37E]">
        {symbol === 'CC' ? 'C' : 'U'}
      </span>
    </div>
  );
}

function WalletIcon({ name }: { name: string }) {
  let color = "#E4F37E";
  let letter = "Z";
  if (name === 'Metamask') {
    color = '#F6851B';
    letter = 'M';
  } else if (name === 'Zoro Wallet') {
    color = '#00C37A';
    letter = 'Z';
  } else if (name === 'Loop Wallet') {
    color = '#8C5CFF';
    letter = 'L';
  }
  return (
    <div 
      className="size-8 rounded-xl flex items-center justify-center font-sans font-bold text-white shrink-0 shadow-sm"
      style={{ backgroundColor: color }}
    >
      {letter}
    </div>
  );
}

// ─── Wallet Panel ─────────────────────────────────────────────────────────────

interface WalletPanelProps {
  balanceData: WalletBalanceData | null;
  transactions: Transaction[];
  user?: any;
  onBack: () => void;
  onSelectTx: (tx: Transaction) => void;
  onConnect: (walletType: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
  onDeposit: (coin: 'CC' | 'USDCx', amount: number) => Promise<void>;
  onWithdraw: (coin: 'CC' | 'USDCx', amount: number, address: string) => Promise<void>;
}

function WalletPanel({
  balanceData,
  transactions,
  user,
  onBack,
  onSelectTx,
  onConnect,
  onDisconnect,
  onDeposit,
  onWithdraw,
}: WalletPanelProps) {
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeAction, setActiveAction] = useState<"stake" | "subscribe" | null>(null);

  // Custom Withdraw Modals states
  const [withdrawStep, setWithdrawStep] = useState<'select_coin' | 'set_amount' | 'confirm' | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<'CC' | 'USDCx'>('CC');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [destAddress, setDestAddress] = useState('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Custom Deposit Modals states
  const [depositStep, setDepositStep] = useState<'select_coin' | 'set_amount' | 'confirm' | null>(null);
  const [selectedDepositCoin, setSelectedDepositCoin] = useState<'CC' | 'USDCx'>('CC');
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  // Wallet Connection Modal states
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectedWalletType, setConnectedWalletType] = useState<string | null>(null);

  const { toast } = useToast();

  const isConnected = !!balanceData?.walletBound;
  const rawAddress = balanceData?.walletAddress || '';
  const displayAddress = rawAddress
    ? rawAddress.length > 14
      ? `${rawAddress.slice(0, 6)}...${rawAddress.slice(-4)}`
      : rawAddress
    : 'No Wallet Connected';

  const totalBalance = balanceData?.totalBalanceCC ?? 500.0;
  const availableBalance = balanceData?.availableBalanceCC ?? 500.0;
  const lockedBalance = balanceData?.lockedBalanceCC?.totalLockedCC ?? 0.0;
  const usdRate = balanceData?.usdRate ?? 0.15;

  const userInitial = (user?.displayName || user?.username || 'U')[0].toUpperCase();

  const handleCopyAddress = () => {
    if (!rawAddress) {
      toast('No wallet address connected to copy', 'error');
      return;
    }
    navigator.clipboard.writeText(rawAddress);
    setCopied(true);
    toast('Wallet address copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 1500);
  };

  const connectColor = isConnected ? "#4ADE80" : "#EF4444";

  return (
    <>
      <div className="flex flex-col gap-5 sm:gap-6 flex-1 px-1 sm:px-4 py-4 sm:py-6 overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center gap-[7px]">
          <span className="text-[#010101] dark:text-white text-[14px] font-medium leading-5">Your Wallet</span>
        </div>

        <div className="flex flex-col gap-5 sm:gap-6">
          {/* Account card */}
          <div className="flex flex-col gap-4 rounded-2xl sm:rounded-3xl border border-[#D8D8D8] dark:border-[#121212] bg-[#FDFDFD] dark:bg-[#080808] px-3.5 sm:px-5 pt-0 pb-5 sm:pb-6">
            {/* Account row */}
            <div className="flex items-center justify-between pt-4 px-0">
              <div className="flex items-center gap-[5px] min-w-0">
                <div className="w-[26px] h-[26px] rounded-full bg-[#291D46] flex items-center justify-center flex-shrink-0 text-white text-[10px] font-semibold">
                  {userInitial}
                </div>
                <span className="text-[#010101] dark:text-white text-[14px] sm:text-[15px] font-medium leading-[19px] truncate max-w-[140px] sm:max-w-[200px]">
                  {displayAddress}
                </span>
                {isConnected && (
                  <button onClick={handleCopyAddress} className="text-foreground opacity-80 hover:opacity-100 transition-opacity p-1" title={copied ? "Copied!" : "Copy address"}>
                    {copied ? (
                      <Check size={14} className="text-[#4ADE80]" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.5 2.25H5.5C5.4337 2.25 5.37011 2.27634 5.32322 2.32322C5.27634 2.37011 5.25 2.4337 5.25 2.5V5.25H2.5C2.4337 5.25 2.37011 5.27634 2.32322 5.32322C2.27634 5.37011 2.25 5.4337 2.25 5.5V13.5C2.25 13.5663 2.27634 13.6299 2.32322 13.6768C2.37011 13.7237 2.4337 13.75 2.5 13.75H10.5C10.5663 13.75 10.6299 13.7237 10.6768 13.6768C10.7237 13.6299 10.75 13.5663 10.75 13.5V10.75H13.5C13.5663 10.75 13.6299 10.7237 13.6768 10.6768C13.7237 10.6299 13.75 10.5663 13.75 10.5V2.5C13.75 2.4337 13.7237 2.37011 13.6768 2.32322C13.6299 2.27634 13.5663 2.25 13.5 2.25ZM10.25 13.25H2.75V5.75H10.25V13.25ZM13.25 10.25H10.75V5.5C10.75 5.4337 10.7237 5.37011 10.6768 5.32322C10.6299 5.27634 10.5663 5.25 10.5 5.25H5.75V2.75H13.25V10.25Z" fill="currentColor" fillOpacity="0.8" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
 
              {/* Connect / Disconnect button */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  id="wallet-connect-btn"
                  onClick={() => setShowConnectModal(true)}
                  className="flex items-center gap-1.5 px-[8px] py-[3px] rounded-[10px] hover:bg-foreground/5 transition-colors cursor-pointer"
                  title={isConnected ? "Wallet connected status" : "Click to connect wallet"}
                >
                  <SwitchIcon color={connectColor} />
                  <span className="text-[11px] leading-[13px] font-semibold transition-colors duration-200" style={{ color: connectColor }}>
                    {isConnected ? "Connected" : "Connect Wallet"}
                  </span>
                </button>
              </div>
            </div>

            {/* Balance card */}
            <div className="flex flex-col gap-6 sm:gap-[35px] rounded-2xl sm:rounded-3xl border border-[#D8D8D8] dark:border-[#121212] bg-[#F5F8FB] dark:bg-[#0B0B0B] p-3.5 sm:p-6">
              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-muted text-[10px] leading-[13px]">Total Balance</span>
                    <span className="text-[#010101] dark:text-white text-[22px] font-bold leading-[26px] tracking-tight">
                      {balanceHidden ? "•••• CC" : `${totalBalance.toFixed(2)} CC`}
                    </span>
                    <span className="text-muted text-[10px] leading-[13px]">
                      {balanceHidden ? "= ••••" : `≈ $${(totalBalance * usdRate).toFixed(2)}`}
                    </span>
                  </div>
                  {/* Eye toggle */}
                  <button
                    className="mt-1 opacity-80 hover:opacity-100 transition-opacity cursor-pointer p-1"
                    onClick={() => setBalanceHidden((v) => !v)}
                    title={balanceHidden ? "Show balance" : "Hide balance"}
                  >
                    {balanceHidden ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 px-2 sm:px-3 py-[2px] rounded-[10px] bg-[rgba(74,222,128,0.15)] shrink-0">
                    <span className="text-[#4ADE80] text-[9px] sm:text-[10px] leading-[13px] font-semibold">1 CC = ${usdRate.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2 sm:gap-6">
                    <div className="flex flex-col gap-[-2px]">
                      <span className="text-muted text-[8px] sm:text-[10px] leading-[13px]">Available</span>
                      <span className="text-[#010101]/80 dark:text-[rgba(255,255,255,0.8)] text-[11px] sm:text-[15px] font-medium leading-[19px]">
                        {balanceHidden ? "••••" : `${availableBalance.toFixed(2)} CC`}
                      </span>
                      <span className="text-muted text-[8px] sm:text-[10px] leading-[13px]">≈ ${(availableBalance * usdRate).toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col gap-[-2px]">
                      <span className="text-muted text-[8px] sm:text-[10px] leading-[13px]">Locked (Escrow/Stakes)</span>
                      <span className="text-[#010101]/80 dark:text-[rgba(255,255,255,0.8)] text-[11px] sm:text-[15px] font-medium leading-[19px]">
                        {balanceHidden ? "••••" : `${lockedBalance.toFixed(2)} CC`}
                      </span>
                      <span className="text-muted text-[8px] sm:text-[10px] leading-[13px]">≈ ${(lockedBalance * usdRate).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons (Deposit / Withdraw / Stake / Subscribe) */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex gap-3 sm:gap-6">
              <button
                id="wallet-deposit-btn"
                onClick={() => {
                  if (!isConnected) {
                    setShowConnectModal(true);
                    toast('Please connect a wallet first', 'error');
                  } else {
                    setDepositStep("select_coin");
                  }
                }}
                className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#291D46] hover:bg-[#362254] transition-colors cursor-pointer"
              >
                <ArrowDownToLine size={14} className="text-white/80 shrink-0" />
                <span className="text-[rgba(255,255,255,0.8)] text-[13px] font-semibold leading-[18px]">Deposit</span>
              </button>
              <button
                id="wallet-withdraw-btn"
                onClick={() => {
                  if (!isConnected) {
                    setShowConnectModal(true);
                    toast('Please connect a wallet first', 'error');
                  } else {
                    setWithdrawStep("select_coin");
                  }
                }}
                className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#291D46] hover:bg-[#362254] transition-colors cursor-pointer"
              >
                <ArrowUpFromLine size={14} className="text-white/80 shrink-0" />
                <span className="text-[rgba(255,255,255,0.8)] text-[13px] font-semibold leading-[18px]">Withdraw</span>
              </button>
            </div>
            <div className="flex gap-3 sm:gap-6">
              <button
                id="wallet-stake-btn"
                onClick={() => {
                  if (!isConnected) {
                    setShowConnectModal(true);
                    toast('Please connect a wallet first', 'error');
                  } else {
                    setActiveAction("stake");
                  }
                }}
                className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[rgba(140,92,255,0.2)] hover:border-[rgba(140,92,255,0.4)] transition-colors text-[#5E5E5E] dark:text-[rgba(255,255,255,0.8)] cursor-pointer"
              >
                <Lock size={14} className="shrink-0" />
                <span className="text-[13px] font-semibold leading-[18px]">Stake</span>
              </button>
              <button
                id="wallet-subscribe-btn"
                onClick={() => {
                  if (!isConnected) {
                    setShowConnectModal(true);
                    toast('Please connect a wallet first', 'error');
                  } else {
                    setActiveAction("subscribe");
                  }
                }}
                className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[rgba(140,92,255,0.2)] hover:border-[rgba(140,92,255,0.4)] transition-colors text-[#5E5E5E] dark:text-[rgba(255,255,255,0.8)] cursor-pointer"
              >
                <Bell size={14} className="shrink-0" />
                <span className="text-[13px] font-semibold leading-[18px]">Subscribe</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="flex flex-col gap-4 px-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <RecentIcon />
                <span className="text-[#010101] dark:text-white text-[13px] font-semibold leading-[18px]">Recent Activity</span>
              </div>
              <span className="text-muted text-[11px] font-medium">{transactions.length} record{transactions.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="flex flex-col">
              {transactions.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center flex flex-col items-center justify-center gap-2">
                  <span className="text-sm font-semibold text-foreground/80">No recent activity</span>
                  <span className="text-xs text-muted">Transactions, deposits, milestones, and stakes will appear here.</span>
                </div>
              ) : (
                transactions.map((tx, idx) => (
                  <div key={tx.id}>
                    {tx.dateGroup && (
                      <div className={`mb-2 ${idx === 0 ? 'mt-0' : 'mt-5'}`}>
                        <span className="text-muted text-[11px] font-medium leading-[18px]">{tx.dateGroup}</span>
                      </div>
                    )}
                    <TransactionRow tx={tx} isFirst={idx === 0 || !!tx.dateGroup} onClick={() => onSelectTx(tx)} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stake Modal */}
      <StakeModal
        isOpen={activeAction === 'stake'}
        onClose={() => setActiveAction(null)}
        availableBalance={availableBalance}
      />

      {/* Subscribe Modal */}
      <SubscribeModal
        isOpen={activeAction === 'subscribe'}
        onClose={() => setActiveAction(null)}
        availableBalance={availableBalance}
        creatorName={user?.displayName || "CanaFri Creator"}
      />

      {/* ── SELECT COIN TO WITHDRAW MODAL ── */}
      {withdrawStep === 'select_coin' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-card border border-border w-full max-w-sm rounded-2xl flex flex-col shadow-2xl p-5 gap-4 animate-in zoom-in-95 duration-200 text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-foreground text-sm font-bold">Select Asset to Withdraw</h3>
              <button 
                type="button" 
                onClick={() => setWithdrawStep(null)} 
                className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex flex-col gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCoin('CC');
                  setWithdrawStep('set_amount');
                }}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-foreground/[0.02] hover:border-primary/40 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <CoinAvatar symbol="CC" />
                  <div className="flex flex-col">
                    <span className="font-sans text-[13px] font-bold text-foreground leading-none">CANTON COIN (CC)</span>
                    <span className="font-sans text-[10px] text-muted mt-1.5 leading-none">Canton Network</span>
                  </div>
                </div>
                <span className="text-muted/60"><ArrowBackIcon size={16} /></span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedCoin('USDCx');
                  setWithdrawStep('set_amount');
                }}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-foreground/[0.02] hover:border-primary/40 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <CoinAvatar symbol="USDCx" />
                  <div className="flex flex-col">
                    <span className="font-sans text-[13px] font-bold text-foreground leading-none">USDCx (CC)</span>
                    <span className="font-sans text-[10px] text-muted mt-1.5 leading-none">Canton Network</span>
                  </div>
                </div>
                <span className="text-muted/60"><ArrowBackIcon size={16} /></span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SET WITHDRAW AMOUNT MODAL ── */}
      {withdrawStep === 'set_amount' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-card border border-border w-full max-w-sm rounded-2xl flex flex-col shadow-2xl p-5 gap-4 animate-in zoom-in-95 duration-200 text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-foreground text-sm font-bold">Withdraw {selectedCoin}</h3>
              <button 
                type="button" 
                onClick={() => setWithdrawStep(null)} 
                className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-muted text-[11px] font-medium">Amount to withdraw ({selectedCoin})</label>
              
              <div className="relative flex items-center bg-card border border-border rounded-xl px-4 py-3 focus-within:border-primary/50 transition-colors">
                <CoinAvatar symbol={selectedCoin} />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-transparent text-right font-sans text-[16px] font-bold text-foreground outline-none ml-4 pr-1 placeholder:text-muted/30"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] px-1 mt-0.5">
              <div className="flex items-center gap-1 text-muted">
                <span>Available Balance:</span>
                <span className="font-semibold text-foreground/85">{availableBalance.toFixed(2)} {selectedCoin}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const maxAmt = Math.max(0, availableBalance - 0.23);
                  setWithdrawAmount(maxAmt.toFixed(2));
                }}
                className="text-primary hover:text-primary-hover font-bold tracking-wide transition cursor-pointer"
              >
                MAX
              </button>
            </div>

            {/* Fees list */}
            <div className="rounded-xl border border-border bg-foreground/[0.01] p-4 flex flex-col gap-3 mt-3">
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>Network Fee</span>
                <span className="font-semibold text-amber-500">0.23 {selectedCoin}</span>
              </div>
              <div className="h-px bg-border w-full" />
              <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                <span>Total Deducted</span>
                <span className="text-[#AC8EF3]">
                  {withdrawAmount && parseFloat(withdrawAmount) > 0
                    ? (parseFloat(withdrawAmount) + 0.23).toFixed(2)
                    : '0.00'}{' '}
                  {selectedCoin}
                </span>
              </div>
            </div>

            {/* Destination field */}
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-muted text-[11px] font-medium">Recipient Address</label>
              <input
                type="text"
                placeholder="Enter destination Canton/Web3 address"
                value={destAddress}
                onChange={(e) => setDestAddress(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-[11px] font-mono text-foreground placeholder:text-muted/50 outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 mt-5">
              <button
                type="button"
                onClick={() => setWithdrawStep('select_coin')}
                className="flex-1 py-2.5 rounded-xl border border-border hover:bg-foreground/5 font-sans text-[12px] font-semibold text-foreground transition-all active:scale-98 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  const amt = parseFloat(withdrawAmount);
                  const total = amt + 0.23;
                  if (total > availableBalance) {
                    toast(`Insufficient available balance (${availableBalance.toFixed(2)} CC) to cover amount + 0.23 fee`, 'error');
                    return;
                  }
                  setWithdrawStep('confirm');
                }}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || (parseFloat(withdrawAmount) + 0.23) > availableBalance || !destAddress.trim()}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover font-sans text-[12px] font-semibold text-white transition-all active:scale-98 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/10 flex items-center justify-center gap-1.5"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SELECT COIN TO DEPOSIT MODAL ── */}
      {depositStep === 'select_coin' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-card border border-border w-full max-w-sm rounded-2xl flex flex-col shadow-2xl p-5 gap-4 animate-in zoom-in-95 duration-200 text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-foreground text-sm font-bold">Select Asset to Deposit</h3>
              <button 
                type="button" 
                onClick={() => setDepositStep(null)} 
                className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex flex-col gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDepositCoin('CC');
                  setDepositStep('set_amount');
                }}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-foreground/[0.02] hover:border-primary/40 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <CoinAvatar symbol="CC" />
                  <div className="flex flex-col">
                    <span className="font-sans text-[13px] font-bold text-foreground leading-none">CANTON COIN (CC)</span>
                    <span className="font-sans text-[10px] text-muted mt-1.5 leading-none">Canton Network</span>
                  </div>
                </div>
                <span className="text-muted/60"><ArrowBackIcon size={16} /></span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedDepositCoin('USDCx');
                  setDepositStep('set_amount');
                }}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-foreground/[0.02] hover:border-primary/40 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <CoinAvatar symbol="USDCx" />
                  <div className="flex flex-col">
                    <span className="font-sans text-[13px] font-bold text-foreground leading-none">USDCx (CC)</span>
                    <span className="font-sans text-[10px] text-muted mt-1.5 leading-none">Canton Network</span>
                  </div>
                </div>
                <span className="text-muted/60"><ArrowBackIcon size={16} /></span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SET DEPOSIT AMOUNT MODAL ── */}
      {depositStep === 'set_amount' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-card border border-border w-full max-w-sm rounded-2xl flex flex-col shadow-2xl p-5 gap-4 animate-in zoom-in-95 duration-200 text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-foreground text-sm font-bold">Deposit {selectedDepositCoin}</h3>
              <button 
                type="button" 
                onClick={() => setDepositStep(null)} 
                className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-muted text-[11px] font-medium">Amount to deposit ({selectedDepositCoin})</label>
              
              <div className="relative flex items-center bg-card border border-border rounded-xl px-4 py-3 focus-within:border-primary/50 transition-colors">
                <CoinAvatar symbol={selectedDepositCoin} />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-transparent text-right font-sans text-[16px] font-bold text-foreground outline-none ml-4 pr-1 placeholder:text-muted/30"
                />
              </div>
            </div>

            {/* Fees list */}
            <div className="rounded-xl border border-border bg-foreground/[0.01] p-4 flex flex-col gap-3 mt-3">
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>Network Fee</span>
                <span className="font-semibold text-emerald-500">0.00 {selectedDepositCoin} (Free)</span>
              </div>
              <div className="h-px bg-border w-full" />
              <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                <span>Total Credited</span>
                <span className="text-[#AC8EF3]">
                  {depositAmount && parseFloat(depositAmount) > 0
                    ? parseFloat(depositAmount).toFixed(2)
                    : '0.00'}{' '}
                  {selectedDepositCoin}
                </span>
              </div>
            </div>

            {/* Destination field */}
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-muted text-[11px] font-medium">To (Your Account Address)</label>
              <input
                type="text"
                readOnly
                value={rawAddress || '0x...'}
                className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-[11px] font-mono text-muted outline-none cursor-not-allowed select-all"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 mt-5">
              <button
                type="button"
                onClick={() => setDepositStep('select_coin')}
                className="flex-1 py-2.5 rounded-xl border border-border hover:bg-foreground/5 font-sans text-[12px] font-semibold text-foreground transition-all active:scale-98 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setDepositStep('confirm');
                }}
                disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover font-sans text-[12px] font-semibold text-white transition-all active:scale-98 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/10 flex items-center justify-center gap-1.5"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM WITHDRAWAL FINAL SIGNING MODAL ── */}
      {withdrawStep === 'confirm' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-card border border-border w-full max-w-sm rounded-2xl flex flex-col shadow-2xl p-6 gap-5 animate-in zoom-in-95 duration-200 text-foreground relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-foreground text-sm font-bold">Confirm Withdrawal</h3>
              <button 
                type="button" 
                onClick={() => setWithdrawStep(null)} 
                className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Token details cards */}
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-foreground/[0.01] p-4">
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-muted">Amount to Withdraw</span>
                <span className="font-bold text-foreground">
                  {parseFloat(withdrawAmount).toFixed(2)} {selectedCoin}
                </span>
              </div>
              <div className="h-px bg-border w-full" />
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-muted">Network Fee</span>
                <span className="font-bold text-amber-500">
                  0.23 {selectedCoin}
                </span>
              </div>
              <div className="h-px bg-border w-full" />
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-muted">Total Deducted</span>
                <span className="font-bold text-[#E4F37E]">
                  {(parseFloat(withdrawAmount) + 0.23).toFixed(2)} {selectedCoin}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5 w-full mt-2">
              <button
                type="button"
                onClick={async () => {
                  const amt = parseFloat(withdrawAmount);
                  try {
                    setIsWithdrawing(true);
                    await onWithdraw(selectedCoin, amt, destAddress);
                    setWithdrawStep(null);
                    setWithdrawAmount('');
                  } catch (err: any) {
                    toast(err?.message || 'Withdrawal failed', 'error');
                  } finally {
                    setIsWithdrawing(false);
                  }
                }}
                disabled={isWithdrawing}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover font-sans text-[12px] font-semibold text-white transition-all active:scale-98 cursor-pointer shadow-lg shadow-primary/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isWithdrawing ? 'Signing & Withdrawing...' : 'Confirm & Withdraw'}
              </button>
              
              <button
                type="button"
                onClick={() => setWithdrawStep('set_amount')}
                className="w-full py-2.5 rounded-xl border border-border hover:bg-foreground/5 font-sans text-[12px] font-semibold text-foreground transition-all active:scale-98 cursor-pointer"
              >
                Back
              </button>
            </div>

            <span className="text-center font-sans text-[11px] text-muted italic mt-1 select-none">
              Transaction will be broadcast to the Canton Network ledger.
            </span>
          </div>
        </div>
      )}

      {/* ── CONFIRM DEPOSIT FINAL SIGNING MODAL ── */}
      {depositStep === 'confirm' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-card border border-border w-full max-w-sm rounded-2xl flex flex-col shadow-2xl p-6 gap-5 animate-in zoom-in-95 duration-200 text-foreground relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-foreground text-sm font-bold">Confirm Deposit</h3>
              <button 
                type="button" 
                onClick={() => setDepositStep(null)} 
                className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Token details cards */}
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-foreground/[0.01] p-4">
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-muted">Amount to Deposit</span>
                <span className="font-bold text-foreground">
                  {parseFloat(depositAmount).toFixed(2)} {selectedDepositCoin}
                </span>
              </div>
              <div className="h-px bg-border w-full" />
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-muted">Amount to Receive</span>
                <span className="font-bold text-[#E4F37E]">
                  {parseFloat(depositAmount).toFixed(2)} {selectedDepositCoin}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5 w-full mt-2">
              <button
                type="button"
                onClick={async () => {
                  const amt = parseFloat(depositAmount);
                  try {
                    setIsDepositing(true);
                    await onDeposit(selectedDepositCoin, amt);
                    setDepositStep(null);
                    setDepositAmount('');
                  } catch (err: any) {
                    toast(err?.message || 'Deposit failed', 'error');
                  } finally {
                    setIsDepositing(false);
                  }
                }}
                disabled={isDepositing}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover font-sans text-[12px] font-semibold text-white transition-all active:scale-98 cursor-pointer shadow-lg shadow-primary/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDepositing ? 'Processing Deposit...' : 'Confirm & Deposit'}
              </button>
              
              <button
                type="button"
                onClick={() => setDepositStep('set_amount')}
                className="w-full py-2.5 rounded-xl border border-border hover:bg-foreground/5 font-sans text-[12px] font-semibold text-foreground transition-all active:scale-98 cursor-pointer"
              >
                Back
              </button>
            </div>

            <span className="text-center font-sans text-[11px] text-muted italic mt-1 select-none">
              Transaction will be recorded immediately on your account ledger.
            </span>
          </div>
        </div>
      )}

      {/* ── WALLET CONNECT SYSTEM MODAL ── */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-card border border-border w-full max-w-sm rounded-2xl flex flex-col shadow-2xl p-5 gap-5 animate-in zoom-in-95 duration-200 text-foreground relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-foreground text-sm font-bold">
                {isConnected ? 'Wallet Status' : 'Connect Wallet'}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowConnectModal(false)} 
                className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {!isConnected ? (
              <>
                <p className="text-muted text-[11.5px] leading-relaxed">
                  Connect your Web3 wallet to CanaFri to deposit, withdraw, or stake Canton Coins (CC).
                </p>
                <div className="flex flex-col gap-2 mt-1">
                  {[
                    { id: 'loop', name: 'Loop Wallet', desc: 'Loop native Canton Network integration' },
                    { id: 'metamask', name: 'Metamask', desc: 'Connect to your Metamask browser extension' },
                    { id: 'zoro', name: 'Zoro Wallet', desc: 'Fast and secure Canton-native Zoro wallet' },
                  ].map((wallet) => (
                    <button
                      key={wallet.id}
                      type="button"
                      onClick={async () => {
                        try {
                          await onConnect(wallet.name);
                          setConnectedWalletType(wallet.name);
                          setShowConnectModal(false);
                        } catch (err: any) {
                          toast(err?.message || 'Failed to connect wallet', 'error');
                        }
                      }}
                      className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-foreground/[0.02] hover:border-primary/40 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <WalletIcon name={wallet.name} />
                        <div className="flex flex-col">
                          <span className="font-sans text-[12px] font-bold text-foreground leading-none">{wallet.name}</span>
                          <span className="font-sans text-[9.5px] text-muted mt-1.5 leading-none">{wallet.desc}</span>
                        </div>
                      </div>
                      <span className="text-muted/60 rotate-180"><ArrowBackIcon size={16} /></span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-foreground/[0.01] p-4">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted">Connected via</span>
                    <span className="font-bold text-foreground">{connectedWalletType || 'Canton Web3 Wallet'}</span>
                  </div>
                  <div className="h-px bg-border w-full" />
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted">Address</span>
                    <div className="flex items-center gap-1.5 font-bold text-foreground font-mono text-[11px]">
                      <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{displayAddress}</span>
                    </div>
                  </div>
                  <div className="h-px bg-border w-full" />
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted">Status</span>
                    <span className="font-bold text-emerald-500">Active & Ready</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 w-full mt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await onDisconnect();
                        setConnectedWalletType(null);
                        setShowConnectModal(false);
                      } catch (err: any) {
                        toast(err?.message || 'Failed to disconnect wallet', 'error');
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 font-sans text-[12px] font-semibold text-white transition-all active:scale-98 cursor-pointer shadow-lg shadow-red-600/10 flex items-center justify-center gap-1.5"
                  >
                    Disconnect Wallet
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowConnectModal(false)}
                    className="w-full py-2.5 rounded-xl border border-border hover:bg-foreground/5 font-sans text-[12px] font-semibold text-foreground transition-all active:scale-98 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Sent Panel ───────────────────────────────────────────────────────────────

function SentPanel({ tx, onClose }: { tx: Transaction | null; onClose: () => void }) {
  const { toast } = useToast();

  if (!tx) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 overflow-y-auto no-scrollbar">
        <span className="text-muted text-[13px]">Select a transaction to view details</span>
      </div>
    );
  }

  const isReceive = tx.type === "receive" || tx.positive;
  const displayType = isReceive ? "Receive" : "Send";
  const fromAddress = tx.fromAddress || (isReceive ? tx.address : "Your Account");
  const toAddress = tx.toAddress || (isReceive ? "Your Account" : tx.address);
  const dateStr = tx.date ? new Date(tx.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "N/A";

  const handleCopyHash = () => {
    if (tx.txHash || tx.id) {
      navigator.clipboard.writeText(String(tx.txHash || tx.id));
      toast('Transaction hash copied to clipboard', 'success');
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-5 sm:gap-6 px-1 sm:px-4 py-4 sm:py-6 overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button onClick={onClose} className="text-foreground opacity-80 hover:opacity-100 transition-opacity p-1 cursor-pointer">
          <ArrowBackIcon size={24} />
        </button>
        <span className="text-[#010101] dark:text-white text-[14px] font-medium leading-5">{tx.label}</span>
        <button onClick={onClose} className="text-foreground opacity-80 hover:opacity-100 transition-opacity p-1 cursor-pointer">
          <CloseIcon />
        </button>
      </div>

      <div className="flex flex-col gap-5 sm:gap-6">
        {/* Token amount card */}
        <div className="flex flex-col gap-[35px] rounded-2xl sm:rounded-3xl border border-[#D8D8D8] dark:border-[#121212] bg-[#F5F8FB] dark:bg-[#0B0B0B] p-4 sm:p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-[50px] h-[52px]">
              <img src={SENT_ICON} alt="CC" className="w-[50px] h-[50px] rounded-full object-cover absolute left-0 top-0" />
              <div className={`absolute left-[33px] top-[38px] w-[15px] h-[15px] rounded-full border border-black flex-shrink-0 ${tx.positive ? "bg-[#4ADE80]" : "bg-white/80 dark:bg-white/60"}`} />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className={`text-[22px] font-bold leading-[26px] tracking-tight ${tx.positive ? "text-[#4ADE80]" : "text-[#F87171]"}`}>
                {tx.amount}
              </span>
              <span className="text-muted text-[10px] leading-[13px]">≈ {tx.usd}</span>
            </div>
          </div>
        </div>

        {/* Transaction details */}
        <div className="flex flex-col gap-4">
          <DetailRow label="Type"               value={displayType} />
          <DetailRow label="Status"             value={tx.status || "Completed"} />
          <DetailRow label="From"               value={fromAddress} />
          <DetailRow label="To"                 value={toAddress} />
          <DetailRow label="Date & time"        value={dateStr} />
          <DetailRow label="Network"            value={tx.network || "Canton"} />
          <DetailRow label="Transaction Amount" value={tx.amount.replace(/[+-]/, "")} />
          <DetailRow label="Description"        value={tx.description || `${displayType} CC transaction`} />
          <DetailRow label="Transaction ID"     value={String(tx.txHash || tx.id)} divider={false} />
        </div>

        {/* View transaction link */}
        <div className="h-px bg-[#D8D8D8] dark:bg-[#121212]" />
        <button onClick={handleCopyHash} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer">
          <span className="text-[#8C5CFF] text-[10px] leading-[13px] font-semibold">Copy transaction hash</span>
          <ExternalLinkIcon />
        </button>
      </div>
    </div>
  );
}

// ─── Page Root ────────────────────────────────────────────────────────────────

interface WalletPageProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
  user?: any;
}

export default function WalletPage({ onBack, onNavigate, user }: WalletPageProps) {
  const { config } = usePlatformConfig();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [balanceData, setBalanceData] = useState<WalletBalanceData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [mobileView, setMobileView] = useState<"wallet" | "detail">("wallet");

  // Load real wallet balance & transaction history
  const loadWalletData = useCallback(async () => {
    try {
      const [balRes, txRes] = await Promise.all([
        apiFetch('/api/wallet/balance'),
        apiFetch('/api/wallet/transactions'),
      ]);

      if (balRes.ok) {
        const balJson = await balRes.json();
        if (balJson.success) {
          setBalanceData(balJson);
        }
      }

      if (txRes.ok) {
        const txJson = await txRes.json();
        if (txJson.success && Array.isArray(txJson.transactions)) {
          setTransactions(txJson.transactions);
        }
      }
    } catch (err) {
      console.error('Failed to load wallet data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  // Connect wallet handler
  const handleConnectWallet = async (walletType: string) => {
    const res = await apiFetch('/api/wallet/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletType }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to connect wallet');
    }
    toast(`${walletType} connected successfully`, 'success');
    await loadWalletData();
  };

  // Disconnect wallet handler
  const handleDisconnectWallet = async () => {
    const res = await apiFetch('/api/wallet/disconnect', {
      method: 'POST',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to disconnect wallet');
    }
    toast('Wallet disconnected successfully', 'success');
    await loadWalletData();
  };

  // Deposit handler
  const handleDeposit = async (coin: 'CC' | 'USDCx', amount: number) => {
    const res = await apiFetch('/api/wallet/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coin, amount }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Deposit failed');
    }
    toast(`Successfully deposited ${amount} ${coin}`, 'success');
    await loadWalletData();
  };

  // Withdraw handler
  const handleWithdraw = async (coin: 'CC' | 'USDCx', amount: number, address: string) => {
    const res = await apiFetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coin, amount, destinationAddress: address }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Withdrawal failed');
    }
    toast(`Successfully withdrew ${amount} ${coin}`, 'success');
    await loadWalletData();
  };

  if (config.walletPaused) {
    return (
      <FeatureGate active={true} featureName="Wallet Services" reason={config.walletPausedReason}>
        <div />
      </FeatureGate>
    );
  }

  if (loading) return <WalletPageSkeleton />;

  const handleSelectTx = (tx: Transaction) => {
    setSelectedTx(tx);
    setMobileView("detail");
  };

  const handleClose = () => {
    setMobileView("wallet");
  };

  return (
    <div className="min-h-full w-full bg-background flex flex-col overflow-y-auto no-scrollbar">
      <div className="flex flex-1 gap-6 px-2 sm:px-8 max-w-[1400px] mx-auto w-full">
        {/* Left: Wallet Panel */}
        <div className={`flex flex-col flex-1 min-w-0 h-full lg:h-auto lg:overflow-visible ${mobileView === "detail" ? "hidden lg:flex" : "flex"}`}>
          <WalletPanel
            balanceData={balanceData}
            transactions={transactions}
            user={user}
            onBack={onBack}
            onSelectTx={handleSelectTx}
            onConnect={handleConnectWallet}
            onDisconnect={handleDisconnectWallet}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
          />
        </div>

        {/* Right: Transaction detail */}
        <div className={`flex flex-col flex-1 min-w-0 h-full lg:h-auto lg:overflow-visible ${mobileView === "wallet" ? "hidden lg:flex" : "flex"}`}>
          <SentPanel tx={selectedTx} onClose={handleClose} />
        </div>
      </div>
    </div>
  );
}
