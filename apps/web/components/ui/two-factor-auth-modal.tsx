'use client';

import { useState } from 'react';
import { X, ShieldCheck, Smartphone, Check } from 'lucide-react';

interface TwoFactorAuthModalProps {
  onClose: () => void;
  onSave?: (enabled: boolean) => void;
}

export default function TwoFactorAuthModal({ onClose, onSave }: TwoFactorAuthModalProps) {
  const [step, setStep] = useState<'intro' | 'setup' | 'active'>('intro');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleEnableStart = () => {
    setStep('setup');
  };

  const handleVerify = async () => {
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setErrorMsg('Please enter a valid 6-digit numeric code');
      return;
    }

    setErrorMsg('');
    setVerifying(true);
    // Simulate verification delay
    await new Promise((r) => setTimeout(r, 1000));
    setVerifying(false);
    setStep('active');
    onSave?.(true);
  };

  const handleDisable = async () => {
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 800));
    setVerifying(false);
    setStep('intro');
    onSave?.(false);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 animate-fade-in"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative mx-4 w-full max-w-[24.5rem] rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-[0.375rem]">
            <p className="font-sans text-[13px] font-medium text-foreground">Two-factor Authentication</p>
            <p className="font-sans text-[10px] text-muted">Secure your account with 2FA protection</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-foreground/50 hover:bg-foreground/10 hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step Content */}
        {step === 'intro' && (
          <div className="flex flex-col gap-5 text-center items-center py-2">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#8C5CFF]/15 text-[#8C5CFF]">
              <Smartphone size={28} />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-sans text-[14px] font-semibold text-foreground">Authenticator App</h3>
              <p className="font-sans text-[11px] text-foreground/60 leading-relaxed max-w-[19rem]">
                Use an authenticator app (like Google Authenticator or Microsoft Authenticator) to get verification codes for logins.
              </p>
            </div>
            <button
              type="button"
              onClick={handleEnableStart}
              className="w-full mt-2 rounded-xl bg-[#8C5CFF] py-3 font-sans text-[13px] font-semibold text-white hover:bg-[#AC8EF3] transition-colors"
            >
              Set up Authenticator
            </button>
          </div>
        )}

        {step === 'setup' && (
          <div className="flex flex-col gap-5">
            {/* Step 1: Scan QR */}
            <div className="flex flex-col gap-2.5">
              <p className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider">
                1. Scan QR Code
              </p>
              <div className="flex items-center justify-center border border-border bg-background p-4 rounded-xl">
                {/* Styled Mock QR Code using CSS grid */}
                <div className="relative size-32 bg-white p-2 rounded-md flex flex-wrap gap-1 content-center items-center justify-center">
                  <div className="grid grid-cols-6 gap-[2px] w-[100px] h-[100px]">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-[1px] ${
                          (i % 3 === 0 || i % 7 === 0 || i < 7 || i % 6 === 0 || i > 28) && i !== 14
                            ? 'bg-black'
                            : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="font-sans text-[10px] text-foreground/40 text-center leading-relaxed">
                Scan this QR code with your authenticator app.
              </p>
            </div>

            {/* Step 2: Verification Code */}
            <div className="flex flex-col gap-2">
              <label htmlFor="otp-code" className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider">
                2. Enter 6-digit Code
              </label>
              <input
                id="otp-code"
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center tracking-[0.5em] font-mono rounded-xl border border-border bg-background px-4 py-3 text-[18px] text-foreground placeholder:text-foreground/20 outline-none transition focus:border-[#8C5CFF] focus:ring-1 focus:ring-[#8C5CFF]"
              />
              {errorMsg && (
                <p className="font-sans text-[10px] text-[#ff6b6b] text-center">{errorMsg}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('intro')}
                className="flex-1 rounded-xl border border-border bg-transparent py-2.5 font-sans text-[13px] font-semibold text-foreground/70 hover:bg-foreground/5 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying || code.length !== 6}
                className="flex-1 rounded-xl bg-[#8C5CFF] py-2.5 font-sans text-[13px] font-semibold text-white hover:bg-[#AC8EF3] disabled:opacity-60 transition-colors"
              >
                {verifying ? 'Verifying…' : 'Verify & Activate'}
              </button>
            </div>
          </div>
        )}

        {step === 'active' && (
          <div className="flex flex-col gap-5 text-center items-center py-2 animate-scale-up">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck size={32} />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-sans text-[14px] font-semibold text-foreground">2FA is Enabled</h3>
              <p className="font-sans text-[11px] text-foreground/60 leading-relaxed max-w-[19rem]">
                Your account is now protected with two-factor authentication.
              </p>
            </div>
            <div className="w-full flex gap-3 mt-2">
              <button
                type="button"
                onClick={handleDisable}
                disabled={verifying}
                className="flex-1 rounded-xl border border-red-500/25 bg-red-500/5 py-2.5 font-sans text-[13px] font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Disable 2FA
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-[#8C5CFF] py-2.5 font-sans text-[13px] font-semibold text-white hover:bg-[#AC8EF3] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
