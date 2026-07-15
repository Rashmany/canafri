'use client';

import { useState, useEffect } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Bell, Check, Lock, X } from 'lucide-react';
import { WalletPageSkeleton } from '@/components/ui/skeleton';
import StakeModal from '@/components/ui/stake-modal';
import SubscribeModal from '@/components/ui/subscribe-modal';
import { useToast } from '@/components/ui/toast';
import Footer from '@/components/layout/footer';

// ─── Assets ──────────────────────────────────────────────────────────────────

const COIN_ICON = "https://api.builder.io/api/v1/image/assets/TEMP/e89c4e8d3f5d245132047c30016296b942397554?width=48";
const SENT_ICON = "https://api.builder.io/api/v1/image/assets/TEMP/3acf093b5e334027b5076883a2c3e2eb835afa6a?width=100";
const AVATAR_URL = "https://api.builder.io/api/v1/image/assets/TEMP/4fa9f5c407ab83871a3f40b12b12b725d83f562c?width=52";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: number;
  type: "receive" | "send";
  label: string;
  address: string;
  amount: string;
  usd: string;
  positive: boolean;
  dateGroup?: string;
}

const TRANSACTIONS: Transaction[] = [
  { id: 1, type: "receive", label: "Receive", address: "To 33fa6...5etui",   amount: "+0.000111 CC", usd: "$0.00", positive: true,  dateGroup: "Jun 29, 2026" },
  { id: 2, type: "receive", label: "Receive", address: "From 33fa6...5etui", amount: "+0.000111 CC", usd: "$0.00", positive: true  },
  { id: 3, type: "send",    label: "Sent",    address: "To 33fa6...5etui",   amount: "-0.000111 CC", usd: "$0.00", positive: false },
  { id: 4, type: "send",    label: "Sent",    address: "To 33fa6...5etui",   amount: "-0.000111 CC", usd: "$0.00", positive: false },
  { id: 5, type: "send",    label: "Sent",    address: "To 33fa6...5etui",   amount: "-0.000111 CC", usd: "$0.00", positive: false },
  { id: 6, type: "receive", label: "Receive", address: "From 33fa6...5etui", amount: "+0.000111 CC", usd: "$0.00", positive: true,  dateGroup: "Jun 13, 2026" },
  { id: 7, type: "send",    label: "Sent",    address: "To 33fa6...5etui",   amount: "-0.000111 CC", usd: "$0.00", positive: false },
  { id: 8, type: "send",    label: "Sent",    address: "To 33fa6...5etui",   amount: "-0.000111 CC", usd: "$0.00", positive: false },
];

// ─── Your original SVG icons ──────────────────────────────────────────────────

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

function ChevronRightIcon() {
  return (
    <svg width="6" height="11" viewBox="0 0 6 11" fill="none">
      <path d="M0 0.883333L0.884166 0L5.7 4.81417C5.77763 4.89131 5.83924 4.98304 5.88128 5.08408C5.92332 5.18512 5.94496 5.29348 5.94496 5.40292C5.94496 5.51235 5.92332 5.62071 5.88128 5.72175C5.83924 5.8228 5.77763 5.91453 5.7 5.99167L0.884166 10.8083L0.000833035 9.925L4.52083 5.40417L0 0.883333Z" fill="currentColor" fillOpacity="0.8" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="6" height="11" viewBox="0 0 6 11" fill="none">
      <path d="M5.94496 9.925L5.06079 10.8083L0.244959 5.99417C0.16733 5.91703 0.105723 5.8253 0.0636827 5.72425C0.0216428 5.62321 0 5.51485 0 5.40542C0 5.29598 0.0216428 5.18762 0.0636827 5.08658C0.105723 4.98554 0.16733 4.89381 0.244959 4.81667L5.06079 0L5.94413 0.883333L1.42413 5.40417L5.94496 9.925Z" fill="currentColor" fillOpacity="0.8" />
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

// Power/switch icon — connect control (RETAINED)
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

// ─── Badge icons ──────────────────────────────────────────────────────────────

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

// ─── Transaction row (your exact border style) ────────────────────────────────

function TransactionRow({ tx, isFirst, onClick }: { tx: Transaction; isFirst: boolean; onClick: () => void }) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-4 bg-[#FAFAFD] dark:bg-[#0B0B0B] cursor-pointer hover:bg-black/[0.03] dark:hover:bg-[#111] transition-colors rounded-[10px] ${isFirst ? "border border-[#D8D8D8] dark:border-[#121212]" : "border-r border-b border-l border-[#D8D8D8] dark:border-[#121212]"}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2.5">
          {tx.positive ? <GreenBadgeIcon /> : <WhiteBadgeIcon />}
        </div>
        <div className="flex flex-col gap-[1px]">
          <span className="text-[#010101] dark:text-white text-[13px] font-medium leading-[18px]">{tx.label}</span>
          <span className="text-muted text-[10px] leading-[13px]">{tx.address}</span>
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
      <div className="flex justify-between items-center w-full">
        <span className="text-[#010101]/80 dark:text-[rgba(255,255,255,0.8)] text-[10px] leading-[13px]">{label}</span>
        <span className="text-muted text-[10px] leading-[13px] text-right">{value}</span>
      </div>
      {divider && <div className="h-px w-full bg-[#D8D8D8] dark:bg-[#121212]" />}
    </>
  );
}

// ─── Action Modal (RETAINED — Deposit / Withdraw / Stake / Subscribe) ─────────

type ActionType = "deposit" | "withdraw" | "stake" | "subscribe" | null;

const ACTION_CONFIG = {
  deposit:   { title: "Deposit CC",  cta: "Confirm Deposit",  color: "#4ADE80", desc: "Add CanaFri Coins to your wallet." },
  withdraw:  { title: "Withdraw CC", cta: "Confirm Withdraw", color: "#F87171", desc: "Send CC to an external wallet address." },
  stake:     { title: "Stake CC",    cta: "Stake Now",        color: "#8C5CFF", desc: "Lock CC to earn rewards on premium content." },
  subscribe: { title: "Subscribe",   cta: "Subscribe Now",    color: "#8C5CFF", desc: "Subscribe to a creator using CC." },
};

function ActionModal({ action, onClose }: { action: ActionType; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [done, setDone] = useState(false);

  if (!action) return null;
  const cfg = ACTION_CONFIG[action];

  const handleConfirm = () => {
    setDone(true);
    setTimeout(() => { setDone(false); onClose(); }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#FAFAFD] dark:bg-[#0B0B0B] border border-[#D8D8D8] dark:border-[#121212] w-full max-w-sm rounded-2xl flex flex-col shadow-2xl p-5 gap-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-[#010101] dark:text-white text-sm font-bold">{cfg.title}</h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-[#010101] dark:hover:text-white transition-colors p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
            <X size={16} />
          </button>
        </div>
        <p className="text-muted text-[12px]">{cfg.desc}</p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="action-amount" className="text-muted text-[11px]">Amount (CC)</label>
          <input
            id="action-amount"
            type="number"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[#FDFDFD] dark:bg-[#080808] border border-[#D8D8D8] dark:border-[#121212] rounded-xl px-4 py-2.5 text-[#010101] dark:text-white text-[14px] placeholder:text-muted outline-none focus:border-[#8C5CFF]/50 transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!amount || done}
          style={{ backgroundColor: cfg.color }}
          className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-black transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {done ? <><Check size={15} /> Done!</> : cfg.cta}
        </button>
      </div>
    </div>
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

function WalletPanel({ onBack, onSelectTx }: { onBack: () => void; onSelectTx: (tx: Transaction) => void }) {
  const [isConnected, setIsConnected]     = useState(false);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [copied, setCopied]               = useState(false);
  const [activeAction, setActiveAction]   = useState<ActionType>(null);

  // Custom Withdraw Modals states
  const [withdrawStep, setWithdrawStep] = useState<'select_coin' | 'set_amount' | 'confirm' | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<'CC' | 'USDCx' | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [destAddress, setDestAddress] = useState('a344asa...huaauha..82jdnd');
  const [withdrawDone, setWithdrawDone] = useState(false);

  // Custom Deposit Modals states
  const [depositStep, setDepositStep] = useState<'select_coin' | 'set_amount' | 'confirm' | null>(null);
  const [selectedDepositCoin, setSelectedDepositCoin] = useState<'CC' | 'USDCx' | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDone, setDepositDone] = useState(false);

  // Wallet Connection Modal states
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectedWalletType, setConnectedWalletType] = useState<string | null>(null);

  // Dynamic balance state starting at 100 CC
  const [balance, setBalance] = useState(100.00);

  const { toast } = useToast();

  const handleCopyAddress = () => {
    navigator.clipboard.writeText("we3..3h..445");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const connectColor = isConnected ? "#4ADE80" : "#EF4444";

  return (
    <>
      <div className="flex flex-col gap-6 flex-1 px-4 py-6 overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center gap-[7px]">
          <span className="text-[#010101] dark:text-white text-[14px] font-medium leading-5">Your Wallet</span>
        </div>

        <div className="flex flex-col gap-6">
          {/* Account card */}
          <div className="flex flex-col gap-4 rounded-3xl border border-[#D8D8D8] dark:border-[#121212] bg-[#FDFDFD] dark:bg-[#080808] px-5 pt-0 pb-6">
            {/* Account row */}
            <div className="flex items-center justify-between pt-4 px-0">
              <div className="flex items-center gap-[5px]">
                {/* TODO: Replace 'U' with real user initials from auth context when integrating with backend */}
                <div className="w-[26px] h-[26px] rounded-full bg-[#291D46] flex items-center justify-center flex-shrink-0 text-white text-[10px] font-semibold">
                  U
                </div>
                <span className="text-[#010101] dark:text-white text-[15px] font-medium leading-[19px]">
                  {isConnected ? "we3..3h..445" : "No Wallet Connected"}
                </span>
                <button className="text-foreground opacity-80 hover:opacity-100">
                  <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
                    <path d="M17.4198 2.45199L18.4798 3.51299L12.7028 9.29199C12.6102 9.38514 12.5001 9.45907 12.3789 9.50952C12.2576 9.55997 12.1276 9.58594 11.9963 9.58594C11.8649 9.58594 11.7349 9.55997 11.6137 9.50952C11.4924 9.45907 11.3823 9.38514 11.2898 9.29199L5.50977 3.51299L6.56977 2.45299L11.9948 7.87699L17.4198 2.45199Z" fill="currentColor" fillOpacity="0.8" />
                  </svg>
                </button>
                {/* Copy address — RETAINED */}
                <button onClick={handleCopyAddress} className="text-foreground opacity-80 hover:opacity-100 transition-opacity" title={copied ? "Copied!" : "Copy address"}>
                  {copied ? (
                    <Check size={14} className="text-[#4ADE80]" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13.5 2.25H5.5C5.4337 2.25 5.37011 2.27634 5.32322 2.32322C5.27634 2.37011 5.25 2.4337 5.25 2.5V5.25H2.5C2.4337 5.25 2.37011 5.27634 2.32322 5.32322C2.27634 5.37011 2.25 5.4337 2.25 5.5V13.5C2.25 13.5663 2.27634 13.6299 2.32322 13.6768C2.37011 13.7237 2.4337 13.75 2.5 13.75H10.5C10.5663 13.75 10.6299 13.7237 10.6768 13.6768C10.7237 13.6299 10.75 13.5663 10.75 13.5V10.75H13.5C13.5663 10.75 13.6299 10.7237 13.6768 10.6768C13.7237 10.6299 13.75 10.5663 13.75 10.5V2.5C13.75 2.4337 13.7237 2.37011 13.6768 2.32322C13.6299 2.27634 13.5663 2.25 13.5 2.25ZM10.25 13.25H2.75V5.75H10.25V13.25ZM13.25 10.25H10.75V5.5C10.75 5.4337 10.7237 5.37011 10.6768 5.32322C10.6299 5.27634 10.5663 5.25 10.5 5.25H5.75V2.75H13.25V10.25Z" fill="currentColor" fillOpacity="0.8" />
                    </svg>
                  )}
                </button>
              </div>
 
              {/* Connect / Disconnect — RETAINED */}
              <div className="flex items-center gap-1.5">
                <button
                  id="wallet-connect-btn"
                  onClick={() => setShowConnectModal(true)}
                  className="flex items-center gap-1.5 px-[5px] py-[2px] rounded-[10px] transition-colors"
                  title={isConnected ? "Wallet connected status" : "Click to connect wallet"}
                >
                  <SwitchIcon color={connectColor} />
                  <span className="text-[10px] leading-[13px] font-medium transition-colors duration-200" style={{ color: connectColor }}>
                    {isConnected ? "Connected" : "Connect Wallet"}
                  </span>
                </button>
              </div>
            </div>

            {/* Balance card */}
            <div className="flex flex-col gap-[35px] rounded-3xl border border-[#D8D8D8] dark:border-[#121212] bg-[#F5F8FB] dark:bg-[#0B0B0B] p-4 sm:p-6">
              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-muted text-[10px] leading-[13px]">Total Balance</span>
                    <span className="text-[#010101] dark:text-white text-[22px] font-medium leading-[26px] tracking-tight">
                      {balanceHidden ? "•••• CC" : `${balance.toFixed(2)} CC`}
                    </span>
                    <span className="text-muted text-[10px] leading-[13px]">
                      {balanceHidden ? "= ••••" : `=$${(balance * 0.15).toFixed(2)}`}
                    </span>
                  </div>
                  {/* Eye toggle — RETAINED */}
                  <button
                    className="mt-1 opacity-80 hover:opacity-100 transition-opacity"
                    onClick={() => setBalanceHidden((v) => !v)}
                    title={balanceHidden ? "Show balance" : "Hide balance"}
                  >
                    {balanceHidden ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 px-2 sm:px-4 py-[2px] rounded-[10px] bg-[rgba(74,222,128,0.2)] shrink-0">
                    <span className="text-[#4ADE80] text-[9px] sm:text-[10px] leading-[13px]">$34.44 (5.4%)</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1.74977 8.90378L1.38477 8.53828L4.78827 5.13428L6.78827 7.13428L10.2808 3.13428L10.6343 3.46928L6.80777 7.88428L4.78827 5.86528L1.74977 8.90378Z" fill="#4ADE80" />
                    </svg>
                  </div>
                  <div className="flex gap-2 sm:gap-6">
                    <div className="flex flex-col gap-[-2px]">
                      <span className="text-muted text-[8px] sm:text-[10px] leading-[13px]">Total Balance</span>
                      <span className="text-[#010101]/80 dark:text-[rgba(255,255,255,0.8)] text-[11px] sm:text-[15px] font-medium leading-[19px]">
                        {balanceHidden ? "••••" : "0.00 CC"}
                      </span>
                      <span className="text-muted text-[8px] sm:text-[10px] leading-[13px]">= $0.00</span>
                    </div>
                    <div className="flex flex-col gap-[-2px]">
                      <span className="text-muted text-[8px] sm:text-[10px] leading-[13px]">Locked Balance</span>
                      <span className="text-[#010101]/80 dark:text-[rgba(255,255,255,0.8)] text-[11px] sm:text-[15px] font-medium leading-[19px]">
                        {balanceHidden ? "••••" : "0.00 CC"}
                      </span>
                      <span className="text-muted text-[8px] sm:text-[10px] leading-[13px]">= $0.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons — RETAINED (Deposit / Withdraw / Stake / Subscribe) */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-6">
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
                className="flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#291D46] hover:bg-[#362254] transition-colors"
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
                className="flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#291D46] hover:bg-[#362254] transition-colors"
              >
                <ArrowUpFromLine size={14} className="text-white/80 shrink-0" />
                <span className="text-[rgba(255,255,255,0.8)] text-[13px] font-semibold leading-[18px]">Withdraw</span>
              </button>
            </div>
            <div className="flex gap-6">
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
                className="flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[rgba(140,92,255,0.2)] hover:border-[rgba(140,92,255,0.4)] transition-colors text-[#5E5E5E] dark:text-[rgba(255,255,255,0.8)]"
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
                className="flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[rgba(140,92,255,0.2)] hover:border-[rgba(140,92,255,0.4)] transition-colors text-[#5E5E5E] dark:text-[rgba(255,255,255,0.8)]"
              >
                <Bell size={14} className="shrink-0" />
                <span className="text-[13px] font-semibold leading-[18px]">Subscribe</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="flex flex-col gap-6 px-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <RecentIcon />
                <span className="text-[#010101] dark:text-white text-[13px] font-medium leading-[18px]">Recent Activity</span>
              </div>
                <div className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[#8C5CFF] text-[10px] leading-[13px]">View All</span>
                  <span className="text-foreground"><ArrowBackIcon size={16} /></span>
                </div>
            </div>

            <div className="flex flex-col">
              {TRANSACTIONS.map((tx, idx) => (
                <div key={tx.id}>
                  {tx.dateGroup && (
                    <div className={`mb-2 ${idx === 0 ? 'mt-0' : 'mt-5'}`}>
                      <span className="text-muted text-[11px] font-medium leading-[18px]">{tx.dateGroup}</span>
                    </div>
                  )}
                  <TransactionRow tx={tx} isFirst={idx === 0 || !!tx.dateGroup} onClick={() => onSelectTx(tx)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action modal */}
      {activeAction && activeAction !== 'stake' && activeAction !== 'subscribe' && (
        <ActionModal action={activeAction} onClose={() => setActiveAction(null)} />
      )}
      <StakeModal
        isOpen={activeAction === 'stake'}
        onClose={() => setActiveAction(null)}
        availableBalance={500.5}
      />
      <SubscribeModal
        isOpen={activeAction === 'subscribe'}
        onClose={() => setActiveAction(null)}
        availableBalance={500.5}
        creatorName="Alex Rivera"
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
                className="text-muted hover:text-foreground transition-colors p-1"
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
              <h3 className="text-foreground text-sm font-bold">Withdraw from your balance</h3>
              <button 
                type="button" 
                onClick={() => setWithdrawStep(null)} 
                className="text-muted hover:text-foreground transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-muted text-[11px] font-medium">Input {selectedCoin} amount to withdraw</label>
              
              <div className="relative flex items-center bg-card border border-border rounded-xl px-4 py-3 focus-within:border-primary/50 transition-colors">
                <CoinAvatar symbol={selectedCoin || 'CC'} />
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
                <span>Wallet Balance:</span>
                <span className="font-semibold text-foreground/85">{balance.toFixed(2)} {selectedCoin}</span>
              </div>
              <button
                type="button"
                onClick={() => setWithdrawAmount(balance.toFixed(2))}
                className="text-primary hover:text-primary-hover font-bold tracking-wide transition cursor-pointer"
              >
                MAX
              </button>
            </div>

            {/* Fees list */}
            <div className="rounded-xl border border-border bg-foreground/[0.01] p-4 flex flex-col gap-3 mt-3">
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>Fee</span>
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
              <label className="text-muted text-[11px] font-medium">To</label>
              <input
                type="text"
                placeholder="Enter destination address"
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
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const amt = parseFloat(withdrawAmount);
                  const total = amt + 0.23;
                  if (total > balance) {
                    toast('Insufficient balance to cover withdrawal and network fee', 'error');
                    return;
                  }
                  setWithdrawStep('confirm');
                }}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || (parseFloat(withdrawAmount) + 0.23) > balance || !destAddress.trim()}
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
                className="text-muted hover:text-foreground transition-colors p-1"
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
              <h3 className="text-foreground text-sm font-bold">Deposit to your balance</h3>
              <button 
                type="button" 
                onClick={() => setDepositStep(null)} 
                className="text-muted hover:text-foreground transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-muted text-[11px] font-medium">Input {selectedDepositCoin} amount to deposit</label>
              
              <div className="relative flex items-center bg-card border border-border rounded-xl px-4 py-3 focus-within:border-primary/50 transition-colors">
                <CoinAvatar symbol={selectedDepositCoin || 'CC'} />
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

            <div className="flex items-center justify-between text-[11px] px-1 mt-0.5">
              <div className="flex items-center gap-1 text-muted">
                <span>Wallet Balance:</span>
                <span className="font-semibold text-foreground/85">{balance.toFixed(2)} {selectedDepositCoin}</span>
              </div>
            </div>

            {/* Fees list */}
            <div className="rounded-xl border border-border bg-foreground/[0.01] p-4 flex flex-col gap-3 mt-3">
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>Network Fee</span>
                <span className="font-semibold text-emerald-500">0.00 {selectedDepositCoin}</span>
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
              <label className="text-muted text-[11px] font-medium">To (Your Wallet)</label>
              <input
                type="text"
                readOnly
                value="we3..3h..445"
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
                Cancel
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
                className="text-muted hover:text-foreground transition-colors p-1"
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
                <span className="text-muted">Amount to Receive</span>
                <span className="font-bold text-[#E4F37E]">
                  {parseFloat(withdrawAmount).toFixed(2)} {selectedCoin}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5 w-full mt-2">
              <button
                type="button"
                onClick={() => {
                  const amt = parseFloat(withdrawAmount);
                  const total = amt + 0.23;
                  if (total > balance) {
                    toast('Insufficient balance to cover withdrawal and network fee', 'error');
                    return;
                  }
                  setWithdrawDone(true);
                  setTimeout(() => {
                    setBalance(balance - total);
                    setWithdrawStep(null);
                    setWithdrawAmount('');
                    setWithdrawDone(false);
                    toast(`Successfully withdrew ${amt} ${selectedCoin} to destination address`, 'success');
                  }, 1200);
                }}
                disabled={withdrawDone}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover font-sans text-[12px] font-semibold text-white transition-all active:scale-98 cursor-pointer shadow-lg shadow-primary/10 flex items-center justify-center gap-1.5"
              >
                {withdrawDone ? <><Check size={14} /> Withdrawing...</> : 'Withdraw to Connected Wallet'}
              </button>
              
              <button
                type="button"
                onClick={() => setWithdrawStep('set_amount')}
                className="w-full py-2.5 rounded-xl border border-border hover:bg-foreground/5 font-sans text-[12px] font-semibold text-foreground transition-all active:scale-98 cursor-pointer"
              >
                Back
              </button>
            </div>

            {/* Caption */}
            <span className="text-center font-sans text-[11px] text-muted italic mt-1 select-none">
              Approve the transaction from connected wallet.
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
                className="text-muted hover:text-foreground transition-colors p-1"
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
                onClick={() => {
                  const amt = parseFloat(depositAmount);
                  setDepositDone(true);
                  setTimeout(() => {
                    setBalance(balance + amt);
                    setDepositStep(null);
                    setDepositAmount('');
                    setDepositDone(false);
                    toast(`Successfully deposited ${amt} ${selectedDepositCoin} to your wallet`, 'success');
                  }, 1200);
                }}
                disabled={depositDone}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover font-sans text-[12px] font-semibold text-white transition-all active:scale-98 cursor-pointer shadow-lg shadow-primary/10 flex items-center justify-center gap-1.5"
              >
                {depositDone ? <><Check size={14} /> Depositing...</> : 'Deposit from Connected Wallet'}
              </button>
              
              <button
                type="button"
                onClick={() => setDepositStep('set_amount')}
                className="w-full py-2.5 rounded-xl border border-border hover:bg-foreground/5 font-sans text-[12px] font-semibold text-foreground transition-all active:scale-98 cursor-pointer"
              >
                Back
              </button>
            </div>

            {/* Caption */}
            <span className="text-center font-sans text-[11px] text-muted italic mt-1 select-none">
              Approve the transaction from connected wallet.
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
                className="text-muted hover:text-foreground transition-colors p-1"
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
                      onClick={() => {
                        setConnectedWalletType(wallet.name);
                        setIsConnected(true);
                        setShowConnectModal(false);
                        toast(`Connected successfully to ${wallet.name}`, 'success');
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
                    <span className="font-bold text-foreground">{connectedWalletType || 'Loop Wallet'}</span>
                  </div>
                  <div className="h-px bg-border w-full" />
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted">Address</span>
                    <div className="flex items-center gap-1.5 font-bold text-foreground font-mono">
                      <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>we3..3h..445</span>
                    </div>
                  </div>
                  <div className="h-px bg-border w-full" />
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted">Status</span>
                    <span className="font-bold text-emerald-500">Active</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 w-full mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsConnected(false);
                      setConnectedWalletType(null);
                      setShowConnectModal(false);
                      toast('Wallet disconnected successfully', 'success');
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
  if (!tx) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 overflow-y-auto no-scrollbar">
        <span className="text-muted text-[13px]">Select a transaction to view details</span>
      </div>
    );
  }

  // Derive dynamic details based on tx
  const isReceive = tx.type === "receive";
  const displayType = isReceive ? "Receive" : "Send";
  const fromAddress = isReceive ? tx.address : "we3..3h..445";
  const toAddress = isReceive ? "we3..3h..445" : tx.address;
  const dateStr = tx.dateGroup ? `17/06/2026 11:12am (${tx.dateGroup})` : "17/06/2026 11:12am";

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button onClick={onClose} className="text-foreground opacity-80 hover:opacity-100 transition-opacity">
          <ArrowBackIcon size={24} />
        </button>
        <span className="text-[#010101] dark:text-white text-[14px] font-medium leading-5">{tx.label}</span>
        <button onClick={onClose} className="text-foreground opacity-80 hover:opacity-100 transition-opacity">
          <CloseIcon />
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Token amount card */}
        <div className="flex flex-col gap-[35px] rounded-3xl border border-[#D8D8D8] dark:border-[#121212] bg-[#F5F8FB] dark:bg-[#0B0B0B] p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-[50px] h-[52px]">
              <img src={SENT_ICON} alt="CC" className="w-[50px] h-[50px] rounded-full object-cover absolute left-0 top-0" />
              <div className={`absolute left-[33px] top-[38px] w-[15px] h-[15px] rounded-full border border-black flex-shrink-0 ${tx.positive ? "bg-[#4ADE80]" : "bg-white/80 dark:bg-white/60"}`} />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className={`text-[22px] font-medium leading-[26px] tracking-tight ${tx.positive ? "text-[#4ADE80]" : "text-[#F87171]"}`}>
                {tx.amount}
              </span>
              <span className="text-muted text-[10px] leading-[13px]">≈ {tx.usd}</span>
            </div>
          </div>
        </div>

        {/* Transaction details */}
        <div className="flex flex-col gap-4">
          <DetailRow label="Type"               value={displayType} />
          <DetailRow label="Status"             value="Completed" />
          <DetailRow label="From"               value={fromAddress} />
          <DetailRow label="To"                 value={toAddress} />
          <DetailRow label="Date & time"        value={dateStr} />
          <DetailRow label="Network"            value="Canton" />
          <DetailRow label="Transaction Amount" value={tx.amount.replace(/[+-]/, "")} />
          <DetailRow label="Description"        value={`${displayType} CC transaction`} />
          <DetailRow label="Update ID"          value={`27332...e2${tx.id}3`} divider={false} />
        </div>

        {/* View transaction link */}
        <div className="h-px bg-[#D8D8D8] dark:bg-[#121212]" />
        <button className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <span className="text-[#8C5CFF] text-[10px] leading-[13px]">View transaction</span>
          <ExternalLinkIcon />
        </button>
      </div>
    </div>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────

interface WalletPageProps {
  onBack: () => void;
}

export default function WalletPage({ onBack }: WalletPageProps) {
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [mobileView, setMobileView] = useState<"wallet" | "detail">("wallet");

  // Skeleton loading: clears after mount; swap setTimeout for API finally() when real data arrives
  useEffect(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t); }, []);
  if (loading) return <WalletPageSkeleton />;

  const handleSelectTx = (tx: Transaction) => {
    setSelectedTx(tx);
    setMobileView("detail");
  };

  const handleClose = () => {
    setMobileView("wallet");
  };

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-y-auto no-scrollbar">
      <div className="flex flex-1 gap-6 px-4 sm:px-8 max-w-[1400px] mx-auto w-full">
        {/* Left: Wallet */}
        <div className={`flex flex-col flex-1 min-w-0 h-full lg:h-auto lg:overflow-visible ${mobileView === "detail" ? "hidden lg:flex" : "flex"}`}>
          <WalletPanel onBack={onBack} onSelectTx={handleSelectTx} />
        </div>

        {/* Right: Transaction detail */}
        <div className={`flex flex-col flex-1 min-w-0 h-full lg:h-auto lg:overflow-visible ${mobileView === "wallet" ? "hidden lg:flex" : "flex"}`}>
          <SentPanel tx={selectedTx} onClose={handleClose} />
        </div>
      </div>
      <div className="hidden md:block w-full">
        <Footer />
      </div>
    </div>
  );
}
