'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react';

interface ResetPasswordPageProps {
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
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  showToggle = true,
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
  onBack,
  onPasswordResetSuccess,
}: ResetPasswordPageProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Password rule tests
  const rules = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    specialChar: /[^A-Za-z0-9]/.test(newPassword),
  };

  const isPasswordValid = Object.values(rules).every(Boolean);

  // Match check
  const passwordsMatch = newPassword !== '' && newPassword === confirmPassword;
  const isFormValid = isPasswordValid && passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Simulate session invalidation / refresh token clearance and redirection
    // These will be wired to backend session management later.
    onPasswordResetSuccess?.();
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#080808] text-white w-full max-w-md mx-auto md:max-w-full">
      
      {/* Header / Navigation */}
      <div className="flex items-center justify-between w-full px-6 pt-10 pb-4 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center justify-center size-10 rounded-xl bg-[#121212] border border-[#1b1b1b] text-[#a0a0a0] hover:text-white transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <svg className="size-5 text-[#a0a0a0]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-sm font-semibold tracking-wide text-white/90">Reset Password</span>
        <div className="size-10" />
      </div>

      {/* Centered Logo */}
      <div className="flex items-center justify-center pt-4 pb-8 shrink-0">
        <svg width="102" height="23" viewBox="0 0 102 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="18" fontFamily="Inter" fontWeight="700" fontSize="20" fill="#8C5CFF" letterSpacing="-0.5">canafri</text>
          <line x1="0" y1="22" x2="102" y2="22" stroke="#8C5CFF" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Card Sheet Container */}
      <div className="flex flex-col flex-1 items-center w-full bg-[#0b0b0b] border-t border-[#121212] rounded-tl-[45px] rounded-tr-[45px] pt-8 px-6 pb-12">
        <div className="flex flex-col gap-6 w-full flex-1 max-w-sm">
          
          <div className="flex flex-col gap-1 text-center">
            <h1 className="text-xl font-bold text-white/90">Create New Password</h1>
            <p className="text-xs text-[#a0a0a0]">Your new password must be different from previous ones.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
            {/* New Password input */}
            <div className="relative" onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)}>
              <InputField
                label="New Password"
                placeholder="••••••••"
                value={newPassword}
                onChange={setNewPassword}
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

            {/* Submit Reset Button */}
            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full h-[44px] bg-primary rounded-xl text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100 mt-2"
            >
              Reset Password
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}
