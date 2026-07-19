'use client';

import { useState, useRef, useEffect } from 'react';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';

interface OtpVerificationPageProps {
  email?: string;
  length?: number;
  isForgotPassword?: boolean;
  onBack?: () => void;
  onVerificationSuccess?: (code?: string) => void;
}

export default function OtpVerificationPage({
  email = 'user@gmail.com',
  length = 6,
  isForgotPassword = false,
  onBack,
  onVerificationSuccess,
}: OtpVerificationPageProps) {
  const [otp, setOtp] = useState<string[]>(() => Array(length).fill(''));
  const [timer, setTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer effect
  useEffect(() => {
    setTimer(59);
    setCanResend(false);
    setOtp(Array(length).fill(''));
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

  const handleChange = (index: number, value: string) => {
    // Only allow numeric digits
    if (value !== '' && !/^[0-9]$/.test(value)) return;

    setError(''); // Clear errors on input
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input if a digit was typed
    if (value !== '' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace handles focusing previous box
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError('');

    try {
      const res = await fetch('http://localhost:3001/auth/resend-otp', {
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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    
    if (code.length < length) {
      setError(`Please enter the complete ${length}-digit code.`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const endpoint = isForgotPassword
        ? 'http://localhost:3001/auth/verify-forgot-otp'
        : 'http://localhost:3001/auth/verify-email';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: code,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Verification failed.');
      }

      onVerificationSuccess?.(code);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isComplete = otp.every((digit) => digit !== '');

  return (
    /* Root — full screen, dark bg, flex column */
    <div className="flex flex-col min-h-screen w-full bg-[#080808] text-white">

      {/* ── Top bar: back arrow + title (full width, not inside card) ── */}
      <div className="flex items-center justify-between w-full px-6 pt-10 pb-4 shrink-0 max-w-sm mx-auto md:max-w-[428px]">
        <button
          onClick={onBack}
          className="flex items-center justify-center size-10 rounded-xl bg-[#121212] border border-[#1b1b1b] text-[#a0a0a0] hover:text-white transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <span className="text-sm font-semibold tracking-wide text-white/90">OTP Verification</span>
        <div className="size-10" />
      </div>


      {/* ── Card Sheet — grows to fill remaining height, centered ── */}
      <div className="flex flex-col flex-1 items-center w-full bg-[#0b0b0b] border-t border-[#121212] rounded-tl-[45px] rounded-tr-[45px]">
        <div className="flex flex-col w-full flex-1 max-w-sm mx-auto md:max-w-[428px] px-6 pt-8 pb-10 gap-8">

          {/* Icon and description */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary">
              <Mail size={32} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold leading-8 text-white/90">
                Verification Code
              </h1>
              <p className="text-xs leading-5 text-[#a0a0a0] px-2">
                We have sent a {length}-digit verification code to <br />
                <span className="text-white font-medium break-all">{email}</span>
              </p>
            </div>
          </div>

          {/* OTP form */}
          <form onSubmit={handleVerify} className="flex flex-col gap-8 w-full">
            {/* OTP inputs — gap shrinks on very small screens */}
            <div className="flex justify-center items-center gap-2 xs:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-12 shrink-0 bg-[#121212] border border-[#1b1b1b] focus:border-primary/80 rounded-2xl text-center text-lg font-bold text-white outline-none transition-colors"
                />
              ))}
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center -mt-4">{error}</p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={!isComplete || isSubmitting}
              className="w-full h-[44px] bg-primary rounded-xl text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100"
            >
              {isSubmitting ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>

          {/* Timer / resend */}
          <div className="flex flex-col items-center gap-2 mt-auto">
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
  );
}
