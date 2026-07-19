'use client';

import { useState } from 'react';
import { Eye, EyeOff, User, Lock, Mail, Check, X, ArrowLeft } from 'lucide-react';

interface RegisterPageProps {
  onLoginClick?: () => void;
  onRegisterSuccess?: (email?: string) => void;
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
  prefixText?: string;
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
  prefixText,
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
        {prefixText && (
          <span className="text-xs text-primary font-semibold select-none mr-[-6px] flex items-center">
            {prefixText}
          </span>
        )}
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

// Sanitization & Validation Helpers
function sanitizeInput(val: string): string {
  return val.trim().replace(/[<>]/g, '');
}

function validateEmail(val: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(val);
}

function validateUsername(val: string): boolean {
  const clean = val.startsWith('@') ? val.slice(1) : val;
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(clean);
}

function validateFullName(val: string): boolean {
  const nameRegex = /^[a-zA-Z\s]{2,50}$/;
  return nameRegex.test(val);
}

export default function RegisterPage({ onLoginClick, onRegisterSuccess, onBackClick }: RegisterPageProps) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // ── Multi-step state ──────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);

  // Mock taken usernames database
  const takenUsernames = ['taken', 'admin', 'canafri', 'johndoe', 'joshtrek'];

  // Error States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time password requirement flags
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const cleanUsername = username;
  const isUsernameTaken = takenUsernames.includes(cleanUsername.toLowerCase());

  const isFormValid =
    validateFullName(fullName) &&
    validateUsername(username) &&
    !isUsernameTaken &&
    validateEmail(email) &&
    hasMinLength &&
    hasUppercase &&
    hasNumber &&
    hasSpecialChar &&
    password === confirmPassword &&
    agreedToTerms &&
    !isSubmitting;

  const handlePasswordFocus = () => setIsPasswordFocused(true);
  const handlePasswordBlur = () => setIsPasswordFocused(false);

  // Validate step 1 fields before advancing
  const isStep1Valid =
    validateFullName(fullName) &&
    validateUsername(username) &&
    !isUsernameTaken &&
    validateEmail(email);

  const handleNextStep = () => {
    const fieldErrors: Record<string, string> = {};
    if (!validateFullName(fullName)) fieldErrors.fullName = 'Enter a valid full name (letters only, 2–50 chars).';
    if (!validateUsername(username)) fieldErrors.username = 'Username must be 3–20 characters (letters, numbers, _ or -).';
    else if (isUsernameTaken) fieldErrors.username = 'Username already taken.';
    if (!validateEmail(email)) fieldErrors.email = 'Enter a valid email address.';
    if (Object.keys(fieldErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      return;
    }
    setStep(2);
  };


  const handleFieldChange = (field: string, value: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setApiError(null);

    if (field === 'fullName') setFullName(value);
    if (field === 'username') {
      const clean = value.replace(/[@\s]/g, '');
      setUsername(clean);
    }
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (field === 'confirmPassword') setConfirmPassword(value);
  };

  const handleTermsChange = (checked: boolean) => {
    if (errors.agreed) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.agreed;
        return next;
      });
    }
    setAgreedToTerms(checked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsSubmitting(true);
    setApiError(null);

    const cleanedUsername = sanitizeInput(username);

    try {
      const res = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: sanitizeInput(fullName),
          username: cleanedUsername,
          email: sanitizeInput(email),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const firstDetail = Array.isArray(data.details) && data.details[0]?.message;
        throw new Error(firstDetail || data.message || data.error || 'Registration failed.');
      }

      onRegisterSuccess?.(sanitizeInput(email));
    } catch (err: any) {
      setApiError(err.message || 'An error occurred. Please try again.');
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
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2">
              <span
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === 1 ? 'w-6 bg-primary' : 'w-3 bg-[#2a2a2a]'
                }`}
              />
              <span
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === 2 ? 'w-6 bg-primary' : 'w-3 bg-[#2a2a2a]'
                }`}
              />
            </div>

            {/* Header */}
            <div className="flex flex-col items-center gap-1.5">
              <h1 className="text-[32px] font-bold leading-[38px] tracking-[-0.18px] text-white/95 text-center">
                {step === 1 ? 'Register' : 'Set Password'}
              </h1>
              <p className="text-[13px] font-normal leading-[20px] text-[#a0a0a0] text-center">
                {step === 1 ? 'Create your account' : 'Choose a strong password'}
              </p>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">

              {/* ── Step 1: Identity ──────────────────────────────────── */}
              {step === 1 && (
                <div className="flex flex-col gap-4 w-full">
                  <InputField
                    label="Full Name"
                    icon={<User size={16} strokeWidth={1.5} />}
                    placeholder="e.g., John Doe"
                    value={fullName}
                    onChange={(val) => handleFieldChange('fullName', val)}
                    error={errors.fullName}
                  />

                  <div>
                    <InputField
                      label="Username"
                      icon={<User size={16} strokeWidth={1.5} />}
                      prefixText="@"
                      placeholder="johndoe123"
                      value={username}
                      onChange={(val) => handleFieldChange('username', val)}
                      error={errors.username}
                    />
                    {username.length > 0 && !errors.username && (
                      <div className="px-1 mt-1">
                        {isUsernameTaken ? (
                          <span className="text-[10px] text-red-500 font-medium">Username already taken</span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-medium">Username available</span>
                        )}
                      </div>
                    )}
                  </div>

                  <InputField
                    label="Email Address"
                    icon={<Mail size={16} strokeWidth={1.5} />}
                    placeholder="e.g., johndoe@gmail.com"
                    value={email}
                    onChange={(val) => handleFieldChange('email', val)}
                    error={errors.email}
                  />

                  {/* Next button */}
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full h-[40px] bg-primary rounded-[12px] text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer mt-2"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* ── Step 2: Password ──────────────────────────────────── */}
              {step === 2 && (
                <div className="flex flex-col gap-4 w-full">
                  <InputField
                    label="Password"
                    icon={<Lock size={16} strokeWidth={1.5} />}
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(val) => handleFieldChange('password', val)}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
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

                  {isPasswordFocused && (
                    <div className="flex flex-col gap-1.5 bg-[#121212]/50 border border-[#1b1b1b] rounded-xl p-3 text-[11px] leading-[15px] transition-all">
                      <span className="font-semibold text-white/70 mb-0.5">Password must contain:</span>
                      <div className="flex items-center gap-2">
                        {hasMinLength ? <Check size={12} className="text-emerald-500 shrink-0" /> : <X size={12} className="text-white/30 shrink-0" />}
                        <span className={hasMinLength ? 'text-emerald-400' : 'text-[#a0a0a0]'}>At least 8 characters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasUppercase ? <Check size={12} className="text-emerald-500 shrink-0" /> : <X size={12} className="text-white/30 shrink-0" />}
                        <span className={hasUppercase ? 'text-emerald-400' : 'text-[#a0a0a0]'}>One uppercase letter (A-Z)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasNumber ? <Check size={12} className="text-emerald-500 shrink-0" /> : <X size={12} className="text-white/30 shrink-0" />}
                        <span className={hasNumber ? 'text-emerald-400' : 'text-[#a0a0a0]'}>One number (0-9)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasSpecialChar ? <Check size={12} className="text-emerald-500 shrink-0" /> : <X size={12} className="text-white/30 shrink-0" />}
                        <span className={hasSpecialChar ? 'text-emerald-400' : 'text-[#a0a0a0]'}>One special character (e.g., @$!%*?&)</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <InputField
                      label="Confirm Password"
                      icon={<Lock size={16} strokeWidth={1.5} />}
                      placeholder="••••••••"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(val) => handleFieldChange('confirmPassword', val)}
                      error={errors.confirmPassword}
                      rightSlot={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((p) => !p)}
                          className="hover:text-white transition-colors cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                        </button>
                      }
                    />
                    {confirmPassword.length > 0 && (
                      <div className="flex items-center gap-1.5 px-1 mt-1.5">
                        {password === confirmPassword ? (
                          <><Check size={12} className="text-emerald-500 shrink-0" /><span className="text-[10px] text-emerald-400 font-medium">Passwords match</span></>
                        ) : (
                          <><X size={12} className="text-red-500 shrink-0" /><span className="text-[10px] text-red-400 font-medium">Passwords do not match</span></>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Terms */}
                  <div className="flex flex-col gap-1 mt-1">
                    <label className="flex items-start gap-2.5 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => handleTermsChange(e.target.checked)}
                        className="mt-0.5 rounded border-[#242424] text-primary focus:ring-primary bg-transparent size-4 cursor-pointer accent-primary"
                      />
                      <span className="text-[11px] leading-[16px] text-[#a0a0a0] font-normal">
                        By signing up, you agree to our{' '}
                        <a href="#" className="text-primary hover:underline font-medium">Terms &amp; Conditions</a>
                        {' '}and{' '}
                        <a href="#" className="text-primary hover:underline font-medium">Privacy Policy</a>.
                      </span>
                    </label>
                    {errors.agreed && <span className="text-[10px] text-red-500 px-1">{errors.agreed}</span>}
                  </div>

                  {apiError && (
                    <div className="text-[11px] text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 text-center">
                      {apiError}
                    </div>
                  )}

                  {/* Back + Register buttons */}
                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="h-[40px] px-5 rounded-[12px] text-[13px] font-semibold leading-[18px] text-[#a0a0a0] hover:text-white border border-[#1b1b1b] hover:border-[#2a2a2a] transition-all flex items-center justify-center cursor-pointer shrink-0"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!isFormValid || isSubmitting}
                      className="flex-1 h-[40px] bg-primary rounded-[12px] text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100"
                    >
                      {isSubmitting ? 'Registering...' : 'Register'}
                    </button>
                  </div>
                </div>
              )}

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
