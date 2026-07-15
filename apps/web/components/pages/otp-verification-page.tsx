'use client';

import { useState, useRef, useEffect } from 'react';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';

interface OtpVerificationPageProps {
  email?: string;
  length?: number;
  onBack?: () => void;
  onVerificationSuccess?: () => void;
}

export default function OtpVerificationPage({
  email = 'user@gmail.com',
  length = 4,
  onBack,
  onVerificationSuccess,
}: OtpVerificationPageProps) {
  const [otp, setOtp] = useState<string[]>(() => Array(length).fill(''));
  const [timer, setTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  
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

  const handleResend = () => {
    if (!canResend) return;
    setTimer(59);
    setCanResend(false);
    setOtp(Array(length).fill(''));
    inputRefs.current[0]?.focus();
    setError('');
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    
    if (code.length < length) {
      setError(`Please enter the complete ${length}-digit code.`);
      return;
    }

    // Mock validation: success for any complete code (e.g. 000000 fails)
    const failCode = Array(length).fill('0').join('');
    if (code === failCode) {
      setError('Invalid verification code. Please try again.');
    } else {
      onVerificationSuccess?.();
    }
  };

  const isComplete = otp.every((digit) => digit !== '');

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#080808] text-white w-full max-w-md mx-auto md:max-w-full">
      
      {/* Back navigation & Header */}
      <div className="flex items-center justify-between w-full px-6 pt-10 pb-4 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center justify-center size-10 rounded-xl bg-[#121212] border border-[#1b1b1b] text-[#a0a0a0] hover:text-white transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
        </button>
        <span className="text-sm font-semibold tracking-wide text-white/90">OTP Verification</span>
        <div className="size-10" /> {/* Spacer to balance layout */}
      </div>

      {/* Centered Logo */}
      <div className="flex items-center justify-center pt-4 pb-8 shrink-0">
        <svg width="102" height="23" viewBox="0 0 102 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="18" fontFamily="Inter" fontWeight="700" fontSize="20" fill="#8C5CFF" letterSpacing="-0.5">canafri</text>
          <line x1="0" y1="22" x2="102" y2="22" stroke="#8C5CFF" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Card Sheet */}
      <div className="flex flex-col flex-1 items-center w-full bg-[#0b0b0b] border-t border-[#121212] rounded-tl-[45px] rounded-tr-[45px] pt-8 px-6 pb-12">
        
        <div className="flex flex-col gap-8 w-full flex-1 max-w-sm">

          {/* Icon and Description */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary">
              <Mail size={32} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold leading-8 text-white/90">
                Verification Code
              </h1>
              <p className="text-xs leading-5 text-[#a0a0a0] px-4">
                We have sent a {length}-digit verification code to <br />
                <span className="text-white font-medium break-all">{email}</span>
              </p>
            </div>
          </div>

          {/* OTP Code Fields Form */}
          <form onSubmit={handleVerify} className="flex flex-col gap-8 w-full">
            <div className="flex justify-center items-center gap-2">
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
                  className="size-12 bg-[#121212] border border-[#1b1b1b] focus:border-primary/80 rounded-2xl text-center text-lg font-bold text-white outline-none transition-colors"
                />
              ))}
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center mt-[-10px]">{error}</p>
            )}

            {/* Submit Verification Button */}
            <button
              type="submit"
              disabled={!isComplete}
              className="w-full h-[44px] bg-primary rounded-xl text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100"
            >
              Verify Code
            </button>
          </form>

          {/* Timer and Resend option */}
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
