'use client';

import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Phone, X, ArrowLeft, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';

const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA', name: 'United States / Canada' },
  { code: '+44', country: 'UK', name: 'United Kingdom' },
  { code: '+234', country: 'NG', name: 'Nigeria' },
  { code: '+254', country: 'KE', name: 'Kenya' },
  { code: '+27', country: 'ZA', name: 'South Africa' },
  { code: '+233', country: 'GH', name: 'Ghana' },
  { code: '+49', country: 'DE', name: 'Germany' },
  { code: '+33', country: 'FR', name: 'France' },
  { code: '+91', country: 'IN', name: 'India' },
  { code: '+81', country: 'JP', name: 'Japan' },
  { code: '+61', country: 'AU', name: 'Australia' },
  { code: '+55', country: 'BR', name: 'Brazil' },
  { code: '+971', country: 'AE', name: 'UAE' },
  { code: '+65', country: 'SG', name: 'Singapore' },
];

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: () => void;
  actionTitle?: string; // e.g. "message this freelancer" or "hire talent"
  talentName?: string;
}

export default function PhoneVerificationModal({
  isOpen,
  onClose,
  onVerified,
  actionTitle = 'contact or hire talent',
  talentName,
}: PhoneVerificationModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [phonePrefix, setPhonePrefix] = useState('+1');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  if (!isOpen) return null;

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanNumber = phone.replace(/[\s-()]/g, '').trim();
    if (!cleanNumber || cleanNumber.length < 6) {
      toast('Please enter a valid phone number', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await apiFetch('/api/users/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanNumber, phonePrefix }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      toast(data.message || 'Verification code sent via SMS', 'success');
      setStep('otp');
      setResendTimer(60);
      setCanResend(false);
      setOtp('');
    } catch (err: any) {
      toast(err.message || 'Could not send verification code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      toast('Please enter the full 6-digit verification code', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await apiFetch('/api/users/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/[\s-()]/g, '').trim(),
          phonePrefix,
          code: cleanOtp,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid verification code');
      }

      // Update local storage profile state
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('canafri_user_profile');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.phoneVerified = true;
            parsed.phone = phone;
            parsed.phonePrefix = phonePrefix;
            localStorage.setItem('canafri_user_profile', JSON.stringify(parsed));
          } catch {}
        }
      }

      toast('Phone verified successfully! You can now proceed.', 'success');
      onClose();
      if (onVerified) {
        onVerified();
      }
    } catch (err: any) {
      toast(err.message || 'Verification failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-6 text-foreground animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="font-sans text-[16px] font-bold text-foreground leading-tight">
                Phone Verification Required
              </h3>
              <p className="font-sans text-[11px] text-muted mt-0.5">
                Firewall Security Check
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Security Notice */}
        <div className="p-3 rounded-xl bg-foreground/[0.02] border border-border/60 mb-5 text-[11.5px] leading-[1.5] text-muted">
          <div className="flex items-start gap-2">
            <Lock size={14} className="text-primary shrink-0 mt-0.5" />
            <span>
              To maintain marketplace safety and prevent spam, please verify your phone number before you{' '}
              <strong className="text-foreground">{actionTitle}</strong>
              {talentName ? ` (${talentName})` : ''}.
            </span>
          </div>
        </div>

        {/* Step 1: Input Phone */}
        {step === 'input' && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-foreground/90">
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={phonePrefix}
                  onChange={(e) => setPhonePrefix(e.target.value)}
                  className="w-[110px] shrink-0 h-[42px] px-2 rounded-xl bg-background border border-border text-[12px] font-medium text-foreground outline-none focus:border-primary/60 cursor-pointer"
                >
                  {COUNTRY_CODES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code} ({item.country})
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <input
                    type="tel"
                    placeholder="e.g. 812 345 6789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-[42px] px-3.5 rounded-xl bg-background border border-border text-[13px] font-medium text-foreground outline-none focus:border-primary/60 placeholder:text-muted/40"
                    required
                    autoFocus
                  />
                  <Phone size={15} className="absolute right-3.5 top-3.5 text-muted/40 pointer-events-none" />
                </div>
              </div>
              <span className="text-[10px] text-muted mt-0.5">
                We'll send a 6-digit SMS verification code to this number. Standard rates may apply.
              </span>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-[40px] rounded-xl border border-border hover:bg-foreground/5 text-[12.5px] font-semibold text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="flex-1 h-[40px] rounded-xl bg-primary hover:bg-primary-hover text-[12.5px] font-semibold text-white transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <span>Send Code</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Enter OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-foreground/90">
                  Enter 6-Digit SMS Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={11} />
                  <span>Change number</span>
                </button>
              </div>
              <p className="text-[11px] text-muted">
                Sent to <strong className="text-foreground">{phonePrefix} {phone}</strong>
              </p>
              <div className="relative mt-1">
                <input
                  ref={otpInputRef}
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full h-[46px] text-center tracking-[10px] font-mono text-[20px] font-bold rounded-xl bg-background border border-border text-foreground outline-none focus:border-primary/60 placeholder:text-muted/30"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] px-1">
              <span className="text-muted">Didn't receive code?</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={loading}
                  className="text-primary font-semibold hover:underline cursor-pointer"
                >
                  Resend SMS Code
                </button>
              ) : (
                <span className="text-muted/70 font-medium">
                  Resend in {resendTimer}s
                </span>
              )}
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="flex-1 h-[40px] rounded-xl border border-border hover:bg-foreground/5 text-[12.5px] font-semibold text-foreground transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="flex-1 h-[40px] rounded-xl bg-primary hover:bg-primary-hover text-[12.5px] font-semibold text-white transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
