'use client';

import { useState, useEffect } from 'react';
import { X, HelpCircle, Lock, Wallet, Check, Loader2, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface StakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStakeSuccess?: (amount: number, duration: string) => void;
  availableBalance?: number;
}

type ModalState = 'input' | 'staking' | 'success' | 'failed';

export default function StakeModal({
  isOpen,
  onClose,
  onStakeSuccess,
  availableBalance = 500.5,
}: StakeModalProps) {
  const [modalState, setModalState] = useState<ModalState>('input');
  const [stakeAmount, setStakeAmount] = useState<string>('100');
  const [duration, setDuration] = useState<string>('3 weeks');
  const [agreed, setAgreed] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [txId, setTxId] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setModalState('input');
      setStakeAmount('100');
      setDuration('3 weeks');
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
    if (modalState === 'staking') {
      const isFailureCase = stakeAmount === '404'; // Simulated error trigger

      interval = setInterval(() => {
        setProgress((prev) => {
          if (isFailureCase && prev >= 75) {
            clearInterval(interval);
            setModalState('failed');
            setErrorMessage('Canton Sub-ledger connection timeout during transaction confirmation.');
            return 75;
          }

          if (prev >= 100) {
            clearInterval(interval);
            setTxId(`tx-${Math.floor(1000000 + Math.random() * 9000000)}`);
            setModalState('success');
            onStakeSuccess?.(parseInt(stakeAmount) || 100, duration);
            return 100;
          }
          return prev + 1;
        });
      }, 35); // ~3.5 seconds
    }
    return () => clearInterval(interval);
  }, [modalState, stakeAmount, duration, onStakeSuccess]);

  if (!isOpen) return null;

  const handleAmountChange = (val: string) => {
    if (val !== '' && !/^\d*$/.test(val)) return;
    setStakeAmount(val);
    setErrorMessage('');
  };

  const handleStakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(stakeAmount) || 0;

    if (amount < 100) {
      setErrorMessage('Minimum stake amount is 100 CC.');
      return;
    }

    if (amount > availableBalance) {
      setErrorMessage('Insufficient balance to perform this stake.');
      return;
    }

    if (!agreed) {
      setErrorMessage('You must agree to the terms of service.');
      return;
    }

    setModalState('staking');
    setProgress(0);
  };

  const handleCopyTx = () => {
    navigator.clipboard.writeText(txId);
    setCopied(true);
    toast('Transaction ID copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 1500);
  };

  const numericAmount = parseInt(stakeAmount) || 0;
  const isFormValid = numericAmount >= 100 && numericAmount <= availableBalance && agreed;

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
                <h3 className="text-sm font-bold text-white tracking-wide">Stake CC</h3>
                <p className="text-[10px] text-[#a0a0a0] leading-snug">
                  Lock your CC to unlock platform benefits and increase your trust score
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
                Min: 100 CC
              </span>
            </div>

            {/* Amount Input */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[11px] font-semibold text-[#a0a0a0] tracking-wide px-0.5">
                Enter Lock amount
              </label>
              <div className="flex items-center justify-between h-[46px] w-full rounded-xl bg-[#121212] border border-[#1b1b1b] px-4 focus-within:border-primary/80 transition-colors">
                <div className="flex items-center gap-2.5 flex-1">
                  <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 select-none">
                    C
                  </div>
                  <input
                    type="text"
                    value={stakeAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="100"
                    className="flex-1 bg-transparent text-sm text-[#e0e0e0] font-semibold outline-none min-w-0"
                  />
                </div>
                <span className="text-xs font-semibold text-[#a0a0a0] pl-2 select-none">
                  CC
                </span>
              </div>
              
              {/* Network Fee */}
              <div className="flex items-center justify-between px-0.5 mt-0.5">
                <span className="text-[10px] text-[#a0a0a0]/60">Network Fee</span>
                <span className="text-[10px] text-[#a0a0a0] font-medium">0.001 CC</span>
              </div>
            </div>

            {/* Lock Duration Options */}
            <div className="bg-[#0b0b0b] border border-[#121212] rounded-xl p-4 flex flex-col gap-3.5 w-full">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[#a0a0a0] tracking-wide">
                  Lock duration
                </span>
                <HelpCircle size={12} className="text-[#a0a0a0]/60 cursor-help" />
              </div>

              <div className="grid grid-cols-3 gap-2 w-full">
                {['3 weeks', '30 days', '60 days'].map((option) => {
                  const isSelected = duration === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDuration(option)}
                      className={`h-9 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-[#080808] border-[#1b1b1b] text-white/80 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <span 
                        className={`size-2.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-primary bg-primary' : 'border-[#1b1b1b]'
                        }`}
                      />
                      {option}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-start gap-2.5 pt-1 border-t border-[#121212]">
                <Lock size={13} className="text-[#a0a0a0]/60 shrink-0 mt-0.5" strokeWidth={1.5} />
                <p className="text-[10px] leading-relaxed text-[#a0a0a0]/80">
                  Your CC will remain in your staking wallet until unstaked.
                </p>
              </div>
            </div>

            {/* Benefits of Staking Card */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col gap-2.5 w-full">
              <span className="text-[11px] font-bold text-primary tracking-wide uppercase">
                Benefits of Staking
              </span>
              <div className="flex flex-col gap-2">
                {[
                  'Access premium content',
                  'Publish content',
                  'Higher trust score',
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
                  By clicking deposit you agree to Canafri{' '}
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
                onClick={handleStakeSubmit}
                disabled={!isFormValid}
                className="flex-1 h-[38px] rounded-xl bg-primary text-xs font-semibold hover:bg-primary-hover active:scale-95 transition-all text-white flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100 shadow-lg shadow-primary/10"
              >
                Stake
              </button>
            </div>
          </>
        ) : modalState === 'staking' ? (
          <>
            {/* ─── STAKING PROGRESS STATE ─── */}
            <div className="flex items-center justify-between w-full">
              <h3 className="text-xs font-medium text-white/90 tracking-wide uppercase">staking CC..</h3>
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
                <p className="text-sm font-semibold text-white/90">staking CC..</p>
                <p className="text-[10px] text-[#a0a0a0]">Please do not close this window</p>
              </div>

              {/* Steps Tracker */}
              <div className="flex items-center gap-6 w-full max-w-[240px] mt-2">
                <div className="flex flex-col items-center">
                  {/* Step 1 */}
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

                  {/* Step 2 */}
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

                  {/* Step 3 */}
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
                    Creating stake position
                  </span>
                  <span className={`font-medium transition-colors duration-300 ${
                    step3Status === 'complete' ? 'text-white/95' : step3Status === 'active' ? 'text-primary' : 'text-[#a0a0a0]/40'
                  }`}>
                    Confirming transaction
                  </span>
                </div>
              </div>
            </div>

            {/* Banner */}
            <div className="bg-primary/10 rounded-xl py-3 px-4 flex items-center justify-center w-full mt-2 border border-primary/20">
              <span className="text-[10px] font-medium text-primary text-center">
                Your CC is being staked securely on Canton.
              </span>
            </div>
          </>
        ) : modalState === 'failed' ? (
          <>
            {/* ─── STAKING FAILED STATE ─── */}
            <div className="flex items-center justify-between w-full">
              <h3 className="text-xs font-medium text-red-500 tracking-wide uppercase">staking failed</h3>
              <button onClick={onClose} className="text-[#a0a0a0] hover:text-white transition p-1 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col items-center gap-6 py-6 text-center w-full">
              <div className="flex items-center justify-center size-20 rounded-full bg-red-500/10 text-red-500">
                <X size={44} strokeWidth={2.5} />
              </div>
              
              <div className="flex flex-col gap-2">
                <h4 className="text-sm font-bold text-white">Staking Transaction Failed</h4>
                <p className="text-[11px] text-[#a0a0a0] px-4 leading-relaxed">
                  {errorMessage || 'An error occurred during verification.'}
                </p>
              </div>

              {/* Progress Connector with Error Visual */}
              <div className="flex items-center gap-6 w-full max-w-[220px] bg-[#0c0c0c] border border-red-500/10 rounded-xl p-4 mt-2">
                <div className="flex flex-col items-center shrink-0">
                  <div className="flex items-center justify-center size-5 rounded-full bg-primary border border-primary text-white text-[9px] font-bold">✓</div>
                  <div className="w-0.5 h-4 bg-primary" />
                  <div className="flex items-center justify-center size-5 rounded-full bg-primary border border-primary text-white text-[9px] font-bold">✓</div>
                  <div className="w-0.5 h-4 bg-red-500" />
                  <div className="flex items-center justify-center size-5 rounded-full bg-red-500/20 border border-red-500 text-red-500 text-[9px] font-bold">!</div>
                </div>
                <div className="flex flex-col justify-between h-[84px] text-[11px] text-left">
                  <span className="text-[#a0a0a0]/60">Verifying balance</span>
                  <span className="text-[#a0a0a0]/60">Creating stake position</span>
                  <span className="text-red-500 font-semibold">Transaction validation failed</span>
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
            {/* ─── STAKING SUCCESS STATE (FIGMA) ─── */}
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
                <h4 className="text-sm font-bold text-white tracking-wide">Stake Successful!</h4>
                <p className="text-[10px] text-[#a0a0a0] leading-snug w-[220px] mx-auto">
                  {stakeAmount} CC has been staked successfully.
                </p>
              </div>
            </div>

            {/* Figma transaction card details */}
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

              {/* Total staked card */}
              <div className="bg-[#0b0b0b] border border-[#121212] rounded-xl px-4 py-3.5 flex items-center gap-3.5 w-full text-left">
                <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary shrink-0">
                  <Wallet size={20} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#a0a0a0] font-normal">Total staked</span>
                  <span className="text-sm font-bold text-white/95">{stakeAmount} CC</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 w-full mt-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  toast(`Viewing active stake of ${stakeAmount} CC`, 'success');
                  onClose();
                }}
                className="flex-1 h-[38px] rounded-xl border border-primary/40 text-xs font-semibold hover:border-primary hover:bg-primary/5 active:scale-95 transition-all text-white flex items-center justify-center cursor-pointer"
              >
                View stake
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
