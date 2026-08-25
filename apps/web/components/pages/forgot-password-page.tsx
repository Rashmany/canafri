'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import AuthSplitLayout from '@/components/auth-split-layout';

interface ForgotPasswordPageProps {
  onBack?: () => void;
  onEmailSubmit?: (email: string) => void;
}

function sanitizeInput(val: string): string {
  return val.trim().replace(/[<>]/g, '');
}

function validateEmail(val: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(val);
}

export default function ForgotPasswordPage({ onBack, onEmailSubmit }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = validateEmail(email.trim()) && !isSubmitting;

  const handleChange = (val: string) => {
    setEmail(val);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeInput(email);

    if (!clean) {
      setError('Email address is required.');
      return;
    }
    if (!validateEmail(clean)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Request failed.');
      }

      onEmailSubmit?.(clean);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="flex flex-col items-center justify-center w-full min-h-screen md:min-h-0 px-6 py-10 md:py-12">

        {/* Form container */}
        <div className="relative flex flex-col items-center w-full bg-transparent pt-0 px-0 pb-10 max-w-[400px]">
          <div className="flex flex-col gap-6 w-full flex-1">
            {/* Header */}
            <div className="flex flex-col items-center gap-1.5 text-center w-full">
              <h1 className="text-[28px] md:text-[32px] font-bold leading-[34px] md:leading-[38px] tracking-[-0.18px] text-white/95">
                Reset Password
              </h1>
              <p className="text-[13px] font-normal leading-[20px] text-[#a0a0a0]">
                Enter your email to receive a verification code
              </p>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full mt-2">
              <div className="w-full flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#a0a0a0] tracking-wide px-0.5">
                  Email Address
                </label>
                <div className="flex items-center gap-3 h-[46px] w-full rounded-xl bg-[#121212] border border-[#1b1b1b] px-3.5 focus-within:border-primary/80 transition-colors">
                  <span className="text-[#a0a0a0]/60 shrink-0 flex items-center">
                    <Mail size={16} strokeWidth={1.5} />
                  </span>
                  <input
                    type="email"
                    placeholder="e.g., johndoe@gmail.com"
                    value={email}
                    onChange={(e) => handleChange(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-[#e0e0e0] placeholder:text-[#a0a0a0]/40 font-normal leading-[16px] outline-none min-w-0"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                {error && <span className="text-[10px] text-red-500 px-1">{error}</span>}
              </div>

              {/* Back + Send Reset Code button row */}
              <div className="flex gap-3 mt-2">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="h-[40px] px-5 rounded-[12px] text-[13px] font-semibold leading-[18px] text-[#a0a0a0] hover:text-white border border-[#1b1b1b] hover:border-[#2a2a2a] transition-all flex items-center justify-center cursor-pointer shrink-0"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="flex-1 h-[40px] bg-primary rounded-[12px] text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100"
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Code'}
                </button>
              </div>
            </form>

            <p className="text-[13px] font-normal leading-[20px] text-center mt-2">
              <span className="text-[#a0a0a0]">Remember your password? </span>
              <button
                type="button"
                onClick={onBack}
                className="text-primary font-semibold hover:underline cursor-pointer bg-transparent border-none"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
