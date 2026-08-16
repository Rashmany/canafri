'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import AuthSplitLayout from '@/components/auth-split-layout';

interface OtpVerificationPageProps {
  email?: string;
  length?: number;
  isForgotPassword?: boolean;
  devOtp?: string; // Dev-mode code exposed by backend when no email provider is configured
  onBack?: () => void;
  onVerificationSuccess?: (code?: string) => void;
}

export default function OtpVerificationPage({
  email = 'user@gmail.com',
  length = 6,
  isForgotPassword = false,
  devOtp,
  onBack,
  onVerificationSuccess,
}: OtpVerificationPageProps) {
  const [otp, setOtp] = useState<string[]>(() => Array(length).fill(''));
  const [timer, setTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status & Animation States
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isShaking, setIsShaking] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer effect
  useEffect(() => {
    setTimer(59);
    setCanResend(false);
    setOtp(Array(length).fill(''));
    setStatus('idle');
    setIsShaking(false);
  }, [length]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const triggerVerification = async (codeToVerify: string) => {
    if (codeToVerify.length < length || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const endpoint = isForgotPassword
        ? '/api/auth/verify-forgot-otp'
        : '/api/auth/verify-email';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: codeToVerify,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Verification failed.');
      }

      // Success visual state (Minimal green border on OTP boxes only)
      setStatus('success');
      setIsShaking(false);

      if (data.accessToken) {
        localStorage.setItem('canafri_access_token', data.accessToken);
      }
      if (data.user) {
        localStorage.setItem(
          'canafri_user_profile',
          JSON.stringify({
            fullName: data.user.displayName || data.user.username || '',
            username: data.user.username || '',
            email: data.user.email || '',
            isSeller: !!data.user.isSeller,
            sellerApproved: !!data.user.sellerApproved,
          })
        );
      }

      // Brief delay to let the user see the green verification state
      setTimeout(() => {
        onVerificationSuccess?.(codeToVerify);
      }, 450);
    } catch (err: any) {
      // Error visual state (Minimal red border + shake on OTP boxes only)
      setStatus('error');
      setIsShaking(true);
      setError(err.message || 'Invalid verification code. Please try again.');

      setTimeout(() => {
        setIsShaking(false);
      }, 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    // Only allow numeric digits
    if (value !== '' && !/^[0-9]$/.test(value)) return;

    setError('');
    setStatus('idle');
    setIsShaking(false);

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input if a digit was typed
    if (value !== '' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-trigger verification if all digits are entered
    const completeCode = newOtp.join('');
    if (completeCode.length === length && newOtp.every((d) => d !== '')) {
      triggerVerification(completeCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError('');
    setStatus('idle');
    setIsShaking(false);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to resend verification code.');
      }

      setTimer(59);
      setCanResend(false);
      setOtp(Array(length).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code. Please try again.');
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < length) {
      setError(`Please enter the complete ${length}-digit code.`);
      setStatus('error');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    triggerVerification(code);
  };

  const isComplete = otp.every((digit) => digit !== '');

  return (
    <AuthSplitLayout>
      {/* ── Keyframe style for minimal shake animation ── */}
      <style>{`
        @keyframes otpShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-otp-shake {
          animation: otpShake 0.45s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>

      <div className="flex flex-col items-center justify-center w-full min-h-screen md:min-h-0 px-6 py-10 md:py-12">

        {/* Mobile Back Button */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden h-[36px] px-4 rounded-[10px] text-[13px] font-semibold text-[#a0a0a0] hover:text-white border border-[#1b1b1b] hover:border-[#2a2a2a] transition-all flex items-center justify-center cursor-pointer self-start mb-6"
          >
            Back
          </button>
        )}

        {/* Form container */}
        <div className="relative flex flex-col items-center w-full bg-transparent pt-0 px-0 pb-10 max-w-[400px]">
          <div className="flex flex-col gap-6 w-full flex-1">
            {/* Header (matching Login & Register header format) */}
            <div className="flex flex-col items-center gap-1.5 text-center w-full">
              <h1 className="text-[32px] font-bold leading-[38px] tracking-[-0.18px] text-white/95">
                OTP Verification
              </h1>
              <p className="text-[13px] font-normal leading-[20px] text-[#a0a0a0]">
                Enter the {length}-digit code sent to <span className="text-white font-medium break-all">{email}</span>
              </p>
            </div>

            {/* OTP Form */}
            <form onSubmit={handleVerify} className="flex flex-col gap-5 w-full mt-2">
              {/* OTP inputs container with conditional shake animation */}
              <div className={`flex justify-center items-center gap-2 xs:gap-3 transition-transform my-1 ${isShaking ? 'animate-otp-shake' : ''}`}>
                {otp.map((digit, index) => {
                  let borderClass = 'border-[#1b1b1b] focus:border-primary/80 bg-[#121212] text-white';
                  if (status === 'success') {
                    borderClass = 'border-emerald-500/90 text-emerald-400 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
                  } else if (status === 'error') {
                    borderClass = 'border-rose-500/90 text-rose-400 bg-rose-950/20 shadow-[0_0_12px_rgba(244,63,94,0.2)]';
                  }

                  return (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`w-11 h-12 shrink-0 border rounded-2xl text-center text-lg font-bold outline-none transition-all duration-200 ${borderClass}`}
                    />
                  );
                })}
              </div>

              {error && (
                <div className="text-[11px] text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 text-center w-full">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={!isComplete || isSubmitting}
                className="w-full h-[40px] bg-primary rounded-[12px] text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100 mt-1"
              >
                {isSubmitting ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>

            {/* Timer / resend */}
            <div className="flex flex-col items-center gap-2 mt-2 text-center">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer"
                >
                  <RefreshCw size={14} />
                  Resend verification code
                </button>
              ) : (
                <p className="text-xs text-[#a0a0a0]">
                  Resend code in{' '}
                  <span className="text-white font-semibold">
                    00:{timer < 10 ? `0${timer}` : timer}
                  </span>
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
