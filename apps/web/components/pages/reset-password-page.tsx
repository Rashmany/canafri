'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, Check, X, ArrowLeft } from 'lucide-react';
import AuthSplitLayout from '@/components/auth-split-layout';

interface ResetPasswordPageProps {
  email: string;
  otp: string;
  onBack?: () => void;
  onPasswordResetSuccess?: () => void;
}

function sanitizeInput(val: string): string {
  return val.trim().replace(/[<>]/g, '');
}

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  showToggle?: boolean;
  autoComplete?: string;
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  showToggle = true,
  autoComplete,
}: InputFieldProps) {
  const [showText, setShowText] = useState(false);

  return (
    <div className="w-full flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-[#a0a0a0] tracking-wide px-0.5">
        {label}
      </label>
      <div className="flex items-center gap-3 h-[46px] w-full rounded-xl bg-[#121212] border border-[#1b1b1b] px-3.5 focus-within:border-primary/80 transition-colors">
        <span className="text-[#a0a0a0]/60 shrink-0 flex items-center">
          <Lock size={16} strokeWidth={1.5} />
        </span>
        <input
          type={showText ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="flex-1 bg-transparent text-xs text-[#e0e0e0] placeholder:text-[#a0a0a0]/40 font-normal leading-[16px] outline-none min-w-0"
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShowText(!showText)}
            className="text-[#a0a0a0] hover:text-white shrink-0 outline-none flex items-center cursor-pointer"
            aria-label={showText ? 'Hide password' : 'Show password'}
          >
            {showText ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage({
  email,
  otp,
  onBack,
  onPasswordResetSuccess,
}: ResetPasswordPageProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password rule tests
  const rules = {
    length: newPassword.length >= 8, // matches backend Zod: z.string().min(8)
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    specialChar: /[^A-Za-z0-9]/.test(newPassword),
  };

  const isPasswordValid = Object.values(rules).every(Boolean);

  // Match check
  const passwordsMatch = newPassword !== '' && newPassword === confirmPassword;
  const isFormValid = isPasswordValid && passwordsMatch && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Reset password failed.');
      }

      onPasswordResetSuccess?.();
    } catch (err: any) {
      setApiError(err.message || 'An error occurred. Please request a new code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="flex flex-col items-center justify-center w-full min-h-screen md:min-h-0 px-6 py-10 md:py-12">

        {/* Mobile Back Button */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden h-[36px] px-4 rounded-[10px] text-[13px] font-semibold text-[#a0a0a0] hover:text-white hover:bg-[#161616] border border-[#1b1b1b] hover:border-[#2a2a2a] transition-all flex items-center justify-center cursor-pointer self-start mb-6"
          >
            Back
          </button>
        )}

        {/* Form container — transparent on md+, centered card */}
        <div className="relative flex flex-col items-center w-full bg-transparent pt-0 px-0 pb-10 max-w-[400px]">
          <div className="flex flex-col gap-6 w-full flex-1">
            
            <div className="flex flex-col gap-1.5 text-center">
              <h1 className="text-[28px] md:text-[32px] font-bold leading-[34px] md:leading-[38px] tracking-[-0.18px] text-white/95">
                Create New Password
              </h1>
              <p className="text-[13px] font-normal leading-[20px] text-[#a0a0a0]">
                Your new password must be different from previous ones.
              </p>
            </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
            {/* New Password input */}
            <div className="relative" onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)}>
              <InputField
                label="New Password"
                placeholder="••••••••"
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
              />
            </div>

            {/* Live Password checklist (shows only when focused) */}
            {isPasswordFocused && (
              <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-[#121212]/50 border border-[#1b1b1b] transition-all animate-fadeIn">
                <span className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-wider mb-0.5 block">
                  Password Requirements
                </span>
              <ul className="flex flex-col gap-2">
                <li className="flex items-center gap-2 text-[11px] transition-colors duration-150">
                  <span className={rules.length ? 'text-[#00C853]' : 'text-red-500'}>
                    {rules.length ? <Check size={14} strokeWidth={2.5} /> : <X size={14} strokeWidth={2.5} />}
                  </span>
                  <span className={rules.length ? 'text-[#e0e0e0]' : 'text-[#a0a0a0]'}>
                    At least 8 characters long
                  </span>
                </li>
                <li className="flex items-center gap-2 text-[11px] transition-colors duration-150">
                  <span className={rules.uppercase ? 'text-[#00C853]' : 'text-red-500'}>
                    {rules.uppercase ? <Check size={14} strokeWidth={2.5} /> : <X size={14} strokeWidth={2.5} />}
                  </span>
                  <span className={rules.uppercase ? 'text-[#e0e0e0]' : 'text-[#a0a0a0]'}>
                    One uppercase letter (A-Z)
                  </span>
                </li>
                <li className="flex items-center gap-2 text-[11px] transition-colors duration-150">
                  <span className={rules.number ? 'text-[#00C853]' : 'text-red-500'}>
                    {rules.number ? <Check size={14} strokeWidth={2.5} /> : <X size={14} strokeWidth={2.5} />}
                  </span>
                  <span className={rules.number ? 'text-[#e0e0e0]' : 'text-[#a0a0a0]'}>
                    One number (0-9)
                  </span>
                </li>
                <li className="flex items-center gap-2 text-[11px] transition-colors duration-150">
                  <span className={rules.specialChar ? 'text-[#00C853]' : 'text-red-500'}>
                    {rules.specialChar ? <Check size={14} strokeWidth={2.5} /> : <X size={14} strokeWidth={2.5} />}
                  </span>
                  <span className={rules.specialChar ? 'text-[#e0e0e0]' : 'text-[#a0a0a0]'}>
                    One special character (e.g. @$!%*?&)
                  </span>
                </li>
              </ul>
            </div>
            )}

            {/* Confirm Password input */}
            <div className="flex flex-col gap-1 w-full">
              <InputField
                label="Confirm Password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
              />
              {confirmPassword !== '' && (
                <div className="flex items-center gap-1.5 px-1 mt-1">
                  {passwordsMatch ? (
                    <>
                      <Check size={12} className="text-[#00C853]" strokeWidth={2.5} />
                      <span className="text-[10px] text-[#00C853] font-medium">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X size={12} className="text-red-500" strokeWidth={2.5} />
                      <span className="text-[10px] text-red-500 font-medium">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {apiError && (
              <div className="text-[11px] text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 text-center">
                {apiError}
              </div>
            )}

            {/* Submit & Back Buttons */}
            <div className="flex gap-3 mt-2">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="h-[44px] px-5 rounded-xl text-[13px] font-semibold leading-[18px] text-[#a0a0a0] hover:text-white hover:bg-[#161616] border border-[#1b1b1b] hover:border-[#2a2a2a] active:scale-[0.97] transition-all flex items-center justify-center cursor-pointer shrink-0"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="flex-1 h-[44px] bg-primary rounded-xl text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100"
              >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  </AuthSplitLayout>
  );
}
