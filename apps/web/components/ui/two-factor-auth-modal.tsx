'use client';

import { useState, useEffect } from 'react';
import { X, ShieldCheck, Smartphone, Copy, Check, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

interface TwoFactorAuthModalProps {
  onClose: () => void;
  onSave?: (enabled: boolean) => void;
}

export default function TwoFactorAuthModal({ onClose, onSave }: TwoFactorAuthModalProps) {
  const [step, setStep] = useState<'loading' | 'intro' | 'setup' | 'active'>('loading');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [code, setCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Check current 2FA status on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch('/api/auth/2fa/status');
        const data = await res.json().catch(() => ({}));
        if (mounted) {
          if (data?.totpEnabled) {
            setStep('active');
          } else {
            setStep('intro');
          }
        }
      } catch {
        if (mounted) setStep('intro');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Initiate 2FA setup (fetch secret & QR code)
  const handleEnableStart = async () => {
    setErrorMsg('');
    setLoadingAction(true);
    try {
      const res = await apiFetch('/api/auth/2fa/setup', {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to start 2FA setup.');
      }

      setQrCodeUrl(data.qrCodeUrl || '');
      setSecret(data.secret || '');
      setStep('setup');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start 2FA setup. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Verify 6-digit TOTP code and activate 2FA
  const handleVerify = async () => {
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setErrorMsg('Please enter a valid 6-digit numeric code.');
      return;
    }

    setErrorMsg('');
    setLoadingAction(true);
    try {
      const res = await apiFetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || 'Verification failed.');
      }

      setStep('active');
      onSave?.(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Disable 2FA
  const handleDisable = async () => {
    setErrorMsg('');
    setLoadingAction(true);
    try {
      const res = await apiFetch('/api/auth/2fa/disable', {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to disable 2FA.');
      }

      setCode('');
      setSecret('');
      setQrCodeUrl('');
      setStep('intro');
      onSave?.(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to disable 2FA. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Copy secret key to clipboard
  const handleCopySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
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

        {/* Loading status */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="size-8 text-[#8C5CFF] animate-spin" />
            <p className="font-sans text-[11px] text-muted">Checking 2FA status…</p>
          </div>
        )}

        {/* Step 1: Intro / Enable button */}
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
            {errorMsg && (
              <p className="font-sans text-[11px] text-[#ff6b6b] text-center">{errorMsg}</p>
            )}
            <button
              type="button"
              onClick={handleEnableStart}
              disabled={loadingAction}
              className="w-full mt-2 rounded-xl bg-[#8C5CFF] py-3 font-sans text-[13px] font-semibold text-white hover:bg-[#AC8EF3] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {loadingAction ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Preparing Setup…</span>
                </>
              ) : (
                'Set up Authenticator'
              )}
            </button>
          </div>
        )}

        {/* Step 2: QR Setup & Verification */}
        {step === 'setup' && (
          <div className="flex flex-col gap-4">
            {/* Step A: Scan QR Code */}
            <div className="flex flex-col gap-2">
              <p className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider">
                1. Scan QR Code
              </p>
              <div className="flex flex-col items-center justify-center border border-border bg-background p-3 rounded-xl gap-2">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="2FA QR Code" className="size-36 rounded-lg border border-border bg-white p-1" />
                ) : (
                  <div className="size-36 rounded-lg bg-foreground/5 flex items-center justify-center text-muted">
                    Loading QR…
                  </div>
                )}
                {secret && (
                  <div className="flex items-center gap-2 w-full pt-1">
                    <div className="flex-1 bg-card border border-border/80 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-foreground/90 text-center tracking-wider truncate select-all">
                      {secret.match(/.{1,4}/g)?.join(' ') || secret}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="p-1.5 rounded-lg border border-border bg-card text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
                      title="Copy Key"
                    >
                      {copiedSecret ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                )}
              </div>
              <p className="font-sans text-[10px] text-foreground/40 text-center leading-relaxed">
                Scan this QR code or manually enter the key into your authenticator app.
              </p>
            </div>

            {/* Step B: 6-digit Code */}
            <div className="flex flex-col gap-2">
              <label htmlFor="otp-code" className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider">
                2. Enter 6-digit Code
              </label>
              <input
                id="otp-code"
                type="text"
                inputMode="numeric"
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

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setErrorMsg(''); setStep('intro'); }}
                className="flex-1 rounded-xl border border-border bg-transparent py-2.5 font-sans text-[13px] font-semibold text-foreground/70 hover:bg-foreground/5 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleVerify}
                disabled={loadingAction || code.length !== 6}
                className="flex-1 rounded-xl bg-[#8C5CFF] py-2.5 font-sans text-[13px] font-semibold text-white hover:bg-[#AC8EF3] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {loadingAction ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Verifying…</span>
                  </>
                ) : (
                  'Verify & Activate'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 2FA Active */}
        {step === 'active' && (
          <div className="flex flex-col gap-4 text-center items-center py-1 animate-scale-up">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck size={32} />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-sans text-[14px] font-semibold text-foreground">2FA is Enabled</h3>
              <p className="font-sans text-[11px] text-foreground/60 leading-relaxed max-w-[19rem]">
                Your account is protected with two-factor authentication.
              </p>
            </div>

            {errorMsg && (
              <p className="font-sans text-[11px] text-[#ff6b6b] text-center">{errorMsg}</p>
            )}

            <div className="w-full flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleDisable}
                disabled={loadingAction}
                className="flex-1 rounded-xl border border-red-500/25 bg-red-500/5 py-2.5 font-sans text-[13px] font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {loadingAction ? <Loader2 size={14} className="animate-spin" /> : 'Disable 2FA'}
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
