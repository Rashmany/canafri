'use client';

import { useState, useEffect } from 'react';
import { X, HelpCircle, Lock, Wallet, Check, Loader2, Calendar, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribeSuccess?: (amount: number) => void;
  availableBalance?: number;
  creatorName?: string;
}

type ModalState = 'input' | 'subscribing' | 'success' | 'failed';

export default function SubscribeModal({
  isOpen,
  onClose,
  onSubscribeSuccess,
  availableBalance = 500.5,
  creatorName = 'Alex Rivera',
}: SubscribeModalProps) {
  const [modalState, setModalState] = useState<ModalState>('input');
  // Fixed subscription amount is 25 CC. Cannot be greater or less.
  const subscribeAmount = '25'; 
  const [agreed, setAgreed] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [txId, setTxId] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setModalState('input');
      setAgreed(false);
      setProgress(0);
      setErrorMessage('');
      setTxId('');
      setCopied(false);
    }
  }, [isOpen]);

  // Stepper progress simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (modalState === 'subscribing') {
      // Simulate failure if available balance is less than subscription amount (25 CC)
      // or a specific trigger (e.g. if the balance is exactly 20 CC)
      const isFailureCase = availableBalance < 25; 

      interval = setInterval(() => {
        setProgress((prev) => {
          if (isFailureCase && prev >= 66) {
            clearInterval(interval);
            setModalState('failed');
            setErrorMessage('Canton Sub-ledger activation error. Insufficient staking validation.');
            return 66;
          }

          if (prev >= 100) {
            clearInterval(interval);
            setTxId(`tx-${Math.floor(1000000 + Math.random() * 9000000)}`);
            setModalState('success');
            onSubscribeSuccess?.(25);
            return 100;
          }
          return prev + 1;
        });
      }, 35); // ~3.5 seconds
    }
    return () => clearInterval(interval);
  }, [modalState, availableBalance, onSubscribeSuccess]);

  if (!isOpen) return null;

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (availableBalance < 25) {
      setErrorMessage('Insufficient balance to perform this subscription (Requires 25 CC).');
      return;
    }

    if (!agreed) {
      setErrorMessage('You must agree to the terms of service.');
      return;
    }

    setModalState('subscribing');
    setProgress(0);
  };

  const handleCopyTx = () => {
    navigator.clipboard.writeText(txId);
    setCopied(true);
    toast('Transaction ID copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 1500);
  };

  const isFormValid = agreed;

  // Stepper status flags
  const step1Status = progress >= 33 ? 'complete' : 'active';
  const step2Status = progress < 33 ? 'pending' : progress >= 66 ? 'complete' : 'active';
  const step3Status = progress < 66 ? 'pending' : progress >= 100 ? 'complete' : 'active';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        className="relative bg-[#080808] border border-[#1b1b1b] w-full max-w-[400px] rounded-2xl p-5 flex flex-col gap-4 shadow-2xl animate-in zoom-in-95 duration-200 text-white max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        
        {modalState === 'input' ? (
          <>
            {/* ─── INPUT STATE (FORM) ─── */}
            {/* Header */}
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-sm font-bold text-white tracking-wide">Subscribe to Premium</h3>
                <p className="text-[10px] text-[#a0a0a0] leading-snug">
                  Unlock exclusive content feed and direct privileges by subscribing monthly
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-[#a0a0a0] hover:text-white transition p-1.5 rounded-full hover:bg-white/5 cursor-pointer"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Available Balance Box */}
            <div className="bg-[#0b0b0b] border border-[#121212] rounded-xl px-4 py-3.5 flex items-center justify-between w-full">
              <div className="flex items-center gap-3.5">
                <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary">
                  <Wallet size={20} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#a0a0a0] font-medium uppercase tracking-wide">Available Balance</span>
                  <span className="text-sm font-bold text-white/95">{availableBalance} CC</span>
                </div>
              </div>
              <span className="text-[10px] text-[#a0a0a0]/60 font-semibold tracking-wide">
                Min: 25 CC
              </span>
            </div>

            {/* Amount Input (Statically set to 25 CC - read only) */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[11px] font-semibold text-[#a0a0a0] tracking-wide px-0.5">
                Monthly amount
              </label>
              <div className="flex items-center justify-between h-[46px] w-full rounded-xl bg-[#121212]/50 border border-[#1b1b1b]/70 px-4 transition-colors select-none">
                <div className="flex items-center gap-2.5 flex-1">
                  <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    C
                  </div>
                  <span className="text-sm text-[#e0e0e0] font-semibold opacity-90">
                    {subscribeAmount}
                  </span>
                </div>
                <span className="text-xs font-medium text-[#a0a0a0]/70 pl-2">
                  CC / month (fixed)
                </span>
              </div>
              
              {/* Network Fee */}
              <div className="flex items-center justify-between px-0.5 mt-0.5">
                <span className="text-[10px] text-[#a0a0a0]/60">Network Fee</span>
                <span className="text-[10px] text-[#a0a0a0] font-medium">0.001 CC</span>
              </div>
            </div>

            {/* Lock Duration Info (Monthly Only - Static) */}
            <div className="bg-[#0b0b0b] border border-[#121212] rounded-xl p-4 flex flex-col gap-3.5 w-full">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[#a0a0a0] tracking-wide">
                  Subscription Duration
                </span>
                <HelpCircle size={12} className="text-[#a0a0a0]/60 cursor-help" />
              </div>

              {/* Static Select Box */}
              <div className="bg-primary/10 border border-primary text-primary h-9 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 w-full">
                <Calendar size={13} strokeWidth={2.5} />
                <span>Monthly (30 Days Cycle)</span>
              </div>

              <div className="flex items-start gap-2.5 pt-1 border-t border-[#121212]">
                <Lock size={13} className="text-[#a0a0a0]/60 shrink-0 mt-0.5" strokeWidth={1.5} />
                <p className="text-[10px] leading-relaxed text-[#a0a0a0]/80">
                  You will be reminded to renew your subscription manually before the 30-day period expires.
                </p>
              </div>
            </div>

            {/* Benefits of Subscribing */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col gap-2.5 w-full">
              <span className="text-[11px] font-bold text-primary tracking-wide uppercase">
                Benefits of Subscribing
              </span>
              <div className="flex flex-col gap-2">
                {[
                  "Access all creators' premium content",
                  'Direct messaging privileges',
                  'Exclusive sub-ledger insights',
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2 text-[11px] text-white/70">
                    <span className="flex items-center justify-center size-3.5 rounded-full bg-primary/20 text-primary">
                      <Check size={10} strokeWidth={3} />
                    </span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms agreement checkbox */}
            <div className="flex flex-col gap-1">
              <label className="flex items-start gap-2.5 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-[#242424] text-primary focus:ring-primary bg-transparent size-4 cursor-pointer accent-primary"
                />
                <span className="text-[10px] leading-[14px] text-[#a0a0a0] font-normal">
                  By clicking subscribe you agree to Canafri{' '}
                  <a href="#" className="text-primary hover:underline font-medium">terms of service</a>,{' '}
                  <a href="#" className="text-primary hover:underline font-medium">privacy policy</a>.
                </span>
              </label>
            </div>

            {/* Error message */}
            {errorMessage && (
              <p className="text-[10px] text-red-500 font-medium px-1 -mt-1">{errorMessage}</p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full mt-1 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-[38px] rounded-xl border border-primary/40 text-xs font-semibold hover:border-primary hover:bg-primary/5 active:scale-95 transition-all text-white flex items-center justify-center cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleSubscribeSubmit}
                disabled={!isFormValid}
                className="flex-1 h-[38px] rounded-xl bg-primary text-xs font-semibold hover:bg-primary-hover active:scale-95 transition-all text-white flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100 shadow-lg shadow-primary/10"
              >
                Subscribe
              </button>
            </div>
          </>
        ) : modalState === 'subscribing' ? (
          <>
            {/* ─── SUBSCRIBING PROGRESS STATE ─── */}
            <div className="flex items-center justify-between w-full">
              <h3 className="text-xs font-medium text-white/90 tracking-wide uppercase">subscribing CC..</h3>
              <div className="size-8" />
            </div>

            <div className="flex flex-col items-center gap-8 py-4 w-full">
              {/* Circular Gauge */}
              <div className="relative flex items-center justify-center w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="64"
                    stroke="#161616"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="64"
                    stroke="#8C5CFF"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={402.1}
                    strokeDashoffset={402.1 - (progress / 100) * 402.1}
                    strokeLinecap="round"
                    className="transition-all duration-75 ease-linear"
                  />
                </svg>
                <span className="absolute text-4xl font-extrabold text-[#8C5CFF] tracking-tighter">
                  {progress}%
                </span>
              </div>

              {/* Progress Text Description */}
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-sm font-semibold text-white/90">activating subscription..</p>
                <p className="text-[10px] text-[#a0a0a0]">Please do not close this window</p>
              </div>

              {/* Steps Tracker */}
              <div className="flex items-center gap-6 w-full max-w-[240px] mt-2">
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center size-6 rounded-full border text-[10px] font-semibold transition-all duration-300 ${
                    step1Status === 'complete' 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-primary/20 border-primary text-primary'
                  }`}>
                    {step1Status === 'complete' ? <Check size={11} strokeWidth={3} /> : '1'}
                  </div>
                  <div className={`w-0.5 h-6 transition-all duration-300 ${
                    progress >= 33 ? 'bg-primary' : 'bg-[#1b1b1b]'
                  }`} />

                  <div className={`flex items-center justify-center size-6 rounded-full border text-[10px] font-semibold transition-all duration-300 ${
                    step2Status === 'complete'
                      ? 'bg-primary border-primary text-white'
                      : step2Status === 'active'
                      ? 'bg-primary/20 border-primary text-primary animate-pulse'
                      : 'bg-[#121212] border-[#1b1b1b] text-[#a0a0a0]/60'
                  }`}>
                    {step2Status === 'complete' ? <Check size={11} strokeWidth={3} /> : '2'}
                  </div>
                  <div className={`w-0.5 h-6 transition-all duration-300 ${
                    progress >= 66 ? 'bg-primary' : 'bg-[#1b1b1b]'
                  }`} />

                  <div className={`flex items-center justify-center size-6 rounded-full border text-[10px] font-semibold transition-all duration-300 ${
                    step3Status === 'complete'
                      ? 'bg-primary border-primary text-white'
                      : step3Status === 'active'
                      ? 'bg-primary/20 border-primary text-primary animate-pulse'
                      : 'bg-[#121212] border-[#1b1b1b] text-[#a0a0a0]/60'
                  }`}>
                    {step3Status === 'complete' ? <Check size={11} strokeWidth={3} /> : '3'}
                  </div>
                </div>

                {/* Stepper labels */}
                <div className="flex flex-col justify-between h-[116px] text-xs py-0.5">
                  <span className={`font-medium transition-colors duration-300 ${
                    step1Status === 'complete' ? 'text-white/95' : 'text-[#a0a0a0]/70'
                  }`}>
                    Verifying balance
                  </span>
                  <span className={`font-medium transition-colors duration-300 ${
                    step2Status === 'complete' ? 'text-white/95' : step2Status === 'active' ? 'text-primary' : 'text-[#a0a0a0]/40'
                  }`}>
                    Setting up recurring channel
                  </span>
                  <span className={`font-medium transition-colors duration-300 ${
                    step3Status === 'complete' ? 'text-white/95' : step3Status === 'active' ? 'text-primary' : 'text-[#a0a0a0]/40'
                  }`}>
                    Activating creator access
                  </span>
                </div>
              </div>
            </div>

            {/* Banner */}
            <div className="bg-primary/10 rounded-xl py-3 px-4 flex items-center justify-center w-full mt-2 border border-primary/20">
              <span className="text-[10px] font-medium text-primary text-center">
                Your subscription is being activated securely on Canton.
              </span>
            </div>
          </>
        ) : modalState === 'failed' ? (
          <>
            {/* ─── SUBSCRIBING FAILED STATE ─── */}
            <div className="flex items-center justify-between w-full">
              <h3 className="text-xs font-medium text-red-500 tracking-wide uppercase">subscription failed</h3>
              <button onClick={onClose} className="text-[#a0a0a0] hover:text-white transition p-1 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col items-center gap-6 py-6 text-center w-full">
              <div className="flex items-center justify-center size-20 rounded-full bg-red-500/10 text-red-500">
                <X size={44} strokeWidth={2.5} />
              </div>
              
              <div className="flex flex-col gap-2">
                <h4 className="text-sm font-bold text-white">Subscription Setup Failed</h4>
                <p className="text-[11px] text-[#a0a0a0] px-4 leading-relaxed">
                  {errorMessage || 'An error occurred during recurring channel registration.'}
                </p>
              </div>

              {/* Progress Connector with Error Visual */}
              <div className="flex items-center gap-6 w-full max-w-[220px] bg-[#0c0c0c] border border-red-500/10 rounded-xl p-4 mt-2">
                <div className="flex flex-col items-center shrink-0">
                  <div className="flex items-center justify-center size-5 rounded-full bg-primary border border-primary text-white text-[9px] font-bold">✓</div>
                  <div className="w-0.5 h-4 bg-primary" />
                  <div className="flex items-center justify-center size-5 rounded-full bg-primary/20 border border-primary text-primary text-[9px] font-bold">✓</div>
                  <div className="w-0.5 h-4 bg-red-500" />
                  <div className="flex items-center justify-center size-5 rounded-full bg-red-500/20 border border-red-500 text-red-500 text-[9px] font-bold">!</div>
                </div>
                <div className="flex flex-col justify-between h-[84px] text-[11px] text-left">
                  <span className="text-[#a0a0a0]/60">Verifying balance</span>
                  <span className="text-primary font-semibold">Setting up recurring channel</span>
                  <span className="text-red-500 font-semibold">Creator access validation failed</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full mt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-[38px] rounded-xl border border-red-500/30 text-xs font-semibold hover:bg-red-500/5 transition-all text-white flex items-center justify-center cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setModalState('input')}
                className="flex-1 h-[38px] rounded-xl bg-red-500 hover:bg-red-600 text-xs font-semibold transition-all text-white flex items-center justify-center cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </>
        ) : (
          <>
            {/* ─── SUBSCRIBING SUCCESS STATE ─── */}
            <div className="flex items-center justify-end w-full">
              <button
                onClick={onClose}
                className="text-[#a0a0a0] hover:text-white transition p-1 cursor-pointer"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col items-center gap-6 py-2 text-center w-full">
              {/* Checkmark icon from Figma */}
              <div className="flex items-center justify-center size-[96px] rounded-full bg-green-500/10 text-green-500 animate-bounce duration-1000">
                <div className="flex items-center justify-center size-20 rounded-full border-[6px] border-green-500">
                  <Check size={42} strokeWidth={4.5} className="text-green-500" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h4 className="text-sm font-bold text-white tracking-wide">Subscription Successful!</h4>
                <p className="text-[10px] text-[#a0a0a0] leading-snug w-[240px] mx-auto">
                  {subscribeAmount} CC has been subscribed successfully.
                </p>
              </div>
            </div>

            {/* transaction card details */}
            <div className="flex flex-col gap-3 w-full">
              {/* Transaction ID card */}
              <div className="bg-[#0b0b0b] border border-[#121212] rounded-xl px-4 py-3 flex items-center justify-between w-full">
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[10px] text-[#a0a0a0] font-normal">Transaction ID</span>
                  <span className="text-sm font-medium text-white/95">{txId || 'tx-8457383'}</span>
                </div>
                <button
                  onClick={handleCopyTx}
                  className="text-[#a0a0a0] hover:text-white p-1 rounded transition cursor-pointer"
                  title="Copy Tx ID"
                >
                  <Copy size={16} />
                </button>
              </div>

              {/* Total subscribed card */}
              <div className="bg-[#0b0b0b] border border-[#121212] rounded-xl px-4 py-3.5 flex items-center gap-3.5 w-full text-left">
                <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary shrink-0">
                  <Wallet size={20} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#a0a0a0] font-normal">Total subscribed</span>
                  <span className="text-sm font-bold text-white/95">{subscribeAmount} CC / month</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 w-full mt-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  toast(`Viewing active premium subscription details`, 'success');
                  onClose();
                }}
                className="flex-1 h-[38px] rounded-xl border border-primary/40 text-xs font-semibold hover:border-primary hover:bg-primary/5 active:scale-95 transition-all text-white flex items-center justify-center cursor-pointer"
              >
                View subscription
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-[38px] rounded-xl bg-primary text-xs font-semibold hover:bg-primary-hover active:scale-95 transition-all text-white flex items-center justify-center cursor-pointer shadow-lg shadow-primary/10"
              >
                Go to dashboard
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
