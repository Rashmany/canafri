'use client';

import { useState } from 'react';
import { Eye, EyeOff, User, Lock, ArrowLeft } from 'lucide-react';

interface LoginPageProps {
  onRegisterClick?: () => void;
  onLoginSuccess?: () => void;
  onForgotPasswordClick?: () => void;
  onBackClick?: () => void;
}

interface InputFieldProps {
  label?: string;
  icon: React.ReactNode;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  rightSlot?: React.ReactNode;
  error?: string;
}

function InputField({
  label,
  icon,
  placeholder,
  type = 'text',
  value,
  onChange,
  onFocus,
  onBlur,
  rightSlot,
  error,
}: InputFieldProps) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold text-[#a0a0a0] tracking-wide px-0.5">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3 h-[46px] w-full rounded-xl bg-[#121212] border border-[#1b1b1b] px-3.5 focus-within:border-primary/80 transition-colors">
        <span className="text-[#a0a0a0]/60 shrink-0 flex items-center">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className="flex-1 bg-transparent text-xs text-[#e0e0e0] placeholder:text-[#a0a0a0]/40 font-normal leading-[16px] outline-none min-w-0"
        />
        {rightSlot && <span className="shrink-0 flex items-center text-[#a0a0a0]/60">{rightSlot}</span>}
      </div>
      {error && <span className="text-[10px] text-red-500 px-1">{error}</span>}
    </div>
  );
}

// Sanitization Helpers
function sanitizeInput(val: string): string {
  return val.trim().replace(/[<>]/g, '');
}

export default function LoginPage({ onRegisterClick, onLoginSuccess, onForgotPasswordClick, onBackClick }: LoginPageProps) {
  const [identifier, setIdentifier] = useState(''); // Username or Email
  const [password, setPassword] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isFormValid = identifier.trim().length > 0 && password.length >= 8 && !isSubmitting;

  const handleFieldChange = (field: string, value: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setApiError(null);

    if (field === 'identifier') setIdentifier(value);
    if (field === 'password') setPassword(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setApiError(null);
    const fieldErrors: Record<string, string> = {};

    const cleanIdentifier = sanitizeInput(identifier);
    if (!cleanIdentifier) {
      fieldErrors.identifier = 'Username or Email is required.';
    }

    if (password.length < 8) {
      fieldErrors.password = 'Password must be at least 8 characters.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanIdentifier,
          password: password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Login failed.');
      }

      if (typeof window !== 'undefined' && data.accessToken && data.user) {
        localStorage.setItem('canafri_access_token', data.accessToken);
        localStorage.setItem('canafri_user_profile', JSON.stringify({
          id: data.user.id,
          fullName: data.user.displayName || data.user.fullName || '',
          username: data.user.username,
          email: data.user.email,
          role: data.user.role,
          memberSince: "April 2026",
        }));
      }

      onLoginSuccess?.();
    } catch (err: any) {
      setApiError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#080808] text-white">

      {/* ── Top-Left Viewport Back Button (Desktop & Tablet only) ── */}
      {onBackClick && (
        <button
          type="button"
          onClick={onBackClick}
          className="hidden md:flex fixed left-8 top-8 text-[#a0a0a0] hover:text-white transition-colors cursor-pointer items-center justify-center z-30"
          aria-label="Go back"
        >
          <ArrowLeft size={24} strokeWidth={2} />
        </button>
      )}

      {/* ── Main Form Container ── */}
      <div className="relative flex flex-col items-center justify-center w-full py-8 z-10 px-4">
        
        {/* Card Sheet (No split screen on desktop; centered minimal sheet) */}
        <div className="relative flex flex-col items-center w-full bg-[#0b0b0b] border-t md:border border-[#121212] rounded-tl-[45px] rounded-tr-[45px] md:rounded-[24px] pt-16 md:pt-12 px-6 pb-10 max-w-sm md:max-w-[428px] md:w-[428px] md:shadow-2xl md:shadow-black/50">
          
          {/* Back Button for Mobile View (Absolute inside Card Sheet) */}
          {onBackClick && (
            <button
              type="button"
              onClick={onBackClick}
              className="absolute left-6 top-6 text-[#a0a0a0] hover:text-white transition-colors cursor-pointer flex items-center justify-center md:hidden"
              aria-label="Go back"
            >
              <ArrowLeft size={20} strokeWidth={2} />
            </button>
          )}

          <div className="flex flex-col gap-6 w-full flex-1">
            {/* Header */}
            <div className="flex flex-col items-center gap-1.5">
              <h1 className="text-[32px] font-bold leading-[38px] tracking-[-0.18px] text-white/95 text-center">
                Login
              </h1>
              <p className="text-[13px] font-normal leading-[20px] text-[#a0a0a0] text-center">
                Login to your account
              </p>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4.5 w-full">
              <InputField
                label="Username or Email"
                icon={<User size={16} strokeWidth={1.5} />}
                placeholder="e.g., johndoe123 or johndoe@gmail.com"
                value={identifier}
                onChange={(val) => handleFieldChange('identifier', val)}
                error={errors.identifier}
              />

              <div className="w-full flex flex-col gap-1">
                <InputField
                  label="Password"
                  icon={<Lock size={16} strokeWidth={1.5} />}
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(val) => handleFieldChange('password', val)}
                  error={errors.password}
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                    </button>
                  }
                />
                
                <div className="flex justify-end px-1 mt-1">
                  <button
                    type="button"
                    onClick={onForgotPasswordClick}
                    className="text-[11px] text-primary hover:underline font-medium bg-transparent border-none cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {apiError && (
                <div className="text-[11px] text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 text-center mt-2">
                  {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full h-[40px] bg-primary rounded-[12px] text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer mt-4 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100"
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-2.5 w-full mt-2">
              <div className="flex-1 h-px bg-[#242424]" />
              <span className="text-[12px] font-normal text-[#a0a0a0]/80 leading-[18px] shrink-0">Continue With</span>
              <div className="flex-1 h-px bg-[#242424]" />
            </div>

            {/* Social Auth Icons */}
            <div className="flex items-center justify-center gap-6">
              <button
                type="button"
                className="border border-primary/40 hover:border-primary rounded-[12.5px] w-[32px] h-[32px] flex items-center justify-center hover:bg-primary/10 active:scale-95 transition-all cursor-pointer"
                aria-label="Continue with Google"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>

              <button
                type="button"
                className="border border-primary/40 hover:border-primary rounded-[12.5px] w-[32px] h-[32px] flex items-center justify-center hover:bg-primary/10 active:scale-95 transition-all cursor-pointer"
                aria-label="Continue with Apple"
              >
                <svg width="15" height="18" viewBox="0 0 814 1000" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105.4-57.4-155.5-127.4C46 790.3 0 682 0 578c0-178.4 116.1-272.5 230.4-272.5 61.4 0 112.7 40.8 150.9 40.8 36.5 0 94.1-43.4 165.9-43.4 25.9 0 108.2 2.6 166.4 97.9zm-234.4-181.6c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
                </svg>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
