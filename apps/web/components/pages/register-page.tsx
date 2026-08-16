'use client';

import { useState } from 'react';
import { Eye, EyeOff, User, Lock, Mail, Check, X, ShieldAlert, Calendar, AlertCircle } from 'lucide-react';
import validator from 'validator';
import { usePlatformConfig } from '@/lib/platform-config-context';
import AuthSplitLayout from '@/components/auth-split-layout';

interface RegisterPageProps {
  onLoginClick?: () => void;
  onRegisterSuccess?: (email?: string, devOtp?: string) => void;
  onBackClick?: () => void;
}

interface InputFieldProps {
  label?: string;
  icon?: React.ReactNode;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  rightSlot?: React.ReactNode;
  error?: string;
  prefixText?: string;
  autoComplete?: string;
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
  autoComplete,
}: InputFieldProps) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold text-[#a0a0a0] tracking-wide px-0.5">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3 h-[46px] w-full rounded-xl bg-[#121212] border border-[#1b1b1b] px-3.5 focus-within:border-primary/80 transition-colors">
        {icon && <span className="text-[#a0a0a0]/60 shrink-0 flex items-center">{icon}</span>}
        {prefixText && (
          <span className="text-xs text-[#a0a0a0]/70 font-semibold select-none mr-[-6px] flex items-center">
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
          autoComplete={autoComplete}
          className="flex-1 bg-transparent text-xs text-[#e0e0e0] placeholder:text-[#a0a0a0]/40 font-normal leading-[16px] outline-none min-w-0"
        />
        {rightSlot && <span className="shrink-0 flex items-center text-[#a0a0a0]/60">{rightSlot}</span>}
      </div>
      {error && <span className="text-[10px] text-red-500 px-1">{error}</span>}
    </div>
  );
}

// ── Email Validation Helpers ─────────────────────────────────────────────────

function isValidEmailSyntax(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return validator.isEmail(email.trim());
}

function checkGmailStandardFormat(email: string): string | null {
  const parts = email.split('@');
  if (parts.length !== 2) return null;

  const domain = parts[1].toLowerCase();
  const local = parts[0];

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    if (local.includes('+')) {
      return 'Gmail alias tags (using "+") are not allowed. Please use your standard Gmail address.';
    }
    if (local.includes('.')) {
      return 'Dotted Gmail addresses are not allowed. Please enter your Gmail address without dots.';
    }
  }
  return null;
}

function calculateAge(dobString: string): number | null {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function sanitizeInput(val: string): string {
  return val.trim().replace(/[<>]/g, '');
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

export default function RegisterPage({
  onLoginClick,
  onRegisterSuccess,
  onBackClick,
}: RegisterPageProps) {
  const { config } = usePlatformConfig();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // ── Multi-step state ──────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);

  // Error States & Real-Time Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live availability states
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameMessage, setUsernameMessage] = useState<string>('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [emailMessage, setEmailMessage] = useState<string>('');
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);

  // Age check
  const age = calculateAge(dateOfBirth);
  const isUnder18 = age !== null && age < 18;

  // Real-time password requirement flags
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const handlePasswordFocus = () => setIsPasswordFocused(true);
  const handlePasswordBlur = () => setIsPasswordFocused(false);

  // Live API Availability Check (/api/auth/check-availability)
  const checkAvailability = async (checkType?: 'username' | 'email' | 'all') => {
    try {
      const payload: { username?: string; email?: string } = {};
      if ((checkType === 'username' || checkType === 'all') && username.length >= 3) {
        payload.username = username;
        setUsernameStatus('checking');
      }
      if (checkType === 'email' || checkType === 'all') {
        if (!email) return;

        if (!isValidEmailSyntax(email)) {
          setEmailStatus('invalid');
          const msg = 'Please enter a valid email address.';
          setEmailMessage(msg);
          setErrors((prev) => ({ ...prev, email: msg }));
          return;
        }

        const gmailErr = checkGmailStandardFormat(email);
        if (gmailErr) {
          setEmailStatus('invalid');
          setEmailMessage(gmailErr);
          setErrors((prev) => ({ ...prev, email: gmailErr }));
          return;
        }

        payload.email = email;
        setEmailStatus('checking');
      }

      if (!payload.username && !payload.email) return;

      const res = await fetch('/api/auth/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (payload.username && data.username) {
        if (data.username.available) {
          setUsernameStatus('available');
          setUsernameMessage('Username is available');
          setErrors((prev) => { const n = { ...prev }; delete n.username; return n; });
        } else {
          setUsernameStatus('taken');
          const msg = data.username.message || 'Username already taken.';
          setUsernameMessage(msg);
          setErrors((prev) => ({ ...prev, username: msg }));
        }
      }

      if (payload.email && data.email) {
        if (data.email.suggestion) {
          setEmailSuggestion(data.email.suggestion);
        } else {
          setEmailSuggestion(null);
        }

        if (!data.email.available) {
          setEmailStatus('taken');
          const msg = data.email.message || 'Email address already registered.';
          setEmailMessage(msg);
          setErrors((prev) => ({ ...prev, email: msg }));
        } else if (data.email.isDisposable) {
          setEmailStatus('invalid');
          const msg = data.email.message || 'Disposable email addresses are not allowed.';
          setEmailMessage(msg);
          setErrors((prev) => ({ ...prev, email: msg }));
        } else {
          setEmailStatus('available');
          setEmailMessage('');
          setErrors((prev) => { const n = { ...prev }; delete n.email; return n; });
        }
      }
    } catch {
      // Ignore network availability errors silently
    }
  };

  // Step 1 Validation (Identity, DOB >= 18, Terms)
  const isStep1Valid =
    validateFullName(fullName) &&
    validateUsername(username) &&
    usernameStatus !== 'taken' &&
    dateOfBirth !== '' &&
    age !== null &&
    age >= 18 &&
    agreedToTerms;

  // Step 2 Validation (Email & Password)
  const isStep2Valid =
    isValidEmailSyntax(email) &&
    !checkGmailStandardFormat(email) &&
    emailStatus !== 'taken' &&
    emailStatus !== 'invalid' &&
    hasMinLength &&
    hasUppercase &&
    hasNumber &&
    hasSpecialChar &&
    password.length > 0 &&
    password === confirmPassword;

  const isFormValid = isStep1Valid && isStep2Valid && !isSubmitting;

  const handleNextStep = async () => {
    const fieldErrors: Record<string, string> = {};
    if (!validateFullName(fullName)) fieldErrors.fullName = 'Enter a valid full name (letters only, 2–50 chars).';
    if (!validateUsername(username)) {
      fieldErrors.username = 'Username must be 3–20 characters (letters, numbers, _ or -).';
    }

    if (!dateOfBirth) {
      fieldErrors.dateOfBirth = 'Please select your Date of Birth.';
    } else if (isUnder18) {
      fieldErrors.dateOfBirth = 'You must be 18 years or older before you can create account on CanaFri.';
    }

    if (!agreedToTerms) {
      fieldErrors.agreed = 'You must agree to the Terms & Conditions to proceed.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      return;
    }

    // Final live check before proceeding to Step 2
    await checkAvailability('username');
    if (usernameStatus === 'taken') return;

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
    if (field === 'dateOfBirth') setDateOfBirth(value);
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
    if (config.registrationPaused) return;
    setIsSubmitting(true);
    setApiError(null);

    const cleanedUsername = sanitizeInput(username);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: sanitizeInput(fullName),
          username: cleanedUsername,
          dateOfBirth,
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

      onRegisterSuccess?.(sanitizeInput(email), data.devOtp);
    } catch (err: any) {
      setApiError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="flex flex-col items-center justify-center w-full min-h-screen md:min-h-0 px-6 py-10 md:py-12">

        {/* Form container — transparent on md+, mobile card on smaller screens */}
        <div className="relative flex flex-col items-center w-full bg-transparent pt-0 px-0 pb-10 max-w-[400px]">

          <div className="flex flex-col gap-6 w-full flex-1">
            {/* Header */}
            <div className="flex flex-col items-center gap-1.5 text-center w-full">
              <h1 className="text-[32px] font-bold leading-[38px] tracking-[-0.18px] text-white/95">
                {step === 1 ? 'Create an account' : 'Email/Password'}
              </h1>
              <p className="text-[13px] font-normal leading-[20px] text-[#a0a0a0]">
                {step === 1 ? 'Step 1 of 2 — Identity & Information' : 'Step 2 of 2 — Email & Password'}
              </p>
            </div>

            {/* Platform Control Center Registration Paused Banner */}
            {config.registrationPaused && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium w-full mb-2">
                <ShieldAlert size={16} className="shrink-0 text-amber-400" />
                <span className="flex-1">{config.registrationPausedReason || 'Account registrations are temporarily paused.'}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">

              {/* ── Step 1: Identity (Full Name, Username, Date of Birth, Terms) ──────── */}
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
                      prefixText="@"
                      placeholder="johndoe123"
                      value={username}
                      onChange={(val) => {
                        handleFieldChange('username', val);
                        setUsernameStatus('idle');
                      }}
                      onBlur={() => checkAvailability('username')}
                      error={errors.username}
                    />
                    {username.length >= 3 && !errors.username && (
                      <div className="px-1 mt-1">
                        {usernameStatus === 'checking' && (
                          <span className="text-[10px] text-white/50 font-medium">Checking availability...</span>
                        )}
                        {usernameStatus === 'available' && (
                          <span className="text-[10px] text-emerald-400 font-medium">Username is available</span>
                        )}
                        {usernameStatus === 'taken' && (
                          <span className="text-[10px] text-red-500 font-medium">{usernameMessage || 'Username is already taken'}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <InputField
                      label="Date of Birth"
                      icon={<Calendar size={16} strokeWidth={1.5} />}
                      type="date"
                      placeholder="YYYY-MM-DD"
                      value={dateOfBirth}
                      onChange={(val) => handleFieldChange('dateOfBirth', val)}
                      error={errors.dateOfBirth}
                    />
                  </div>

                  {/* Terms & Conditions */}
                  <div className="flex flex-col gap-2 mt-1">
                    <label className="flex items-start gap-2.5 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => handleTermsChange(e.target.checked)}
                        className="mt-0.5 rounded border-[#242424] text-primary focus:ring-primary bg-transparent size-4 cursor-pointer accent-primary shrink-0"
                      />
                      <span className="text-[11px] leading-[16px] text-[#a0a0a0] font-normal">
                        By signing up, you agree to our{' '}
                        <a href="#" className="text-primary hover:underline font-medium">Terms &amp; Conditions</a>
                        {' '}and{' '}
                        <a href="#" className="text-primary hover:underline font-medium">Privacy Policy</a>.
                      </span>
                    </label>
                    {errors.agreed && <span className="text-[10px] text-red-500 px-1">{errors.agreed}</span>}

                    {/* Under-18 Warning Banner */}
                    {isUnder18 && (
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] leading-[16px] text-red-400 font-medium mt-1 animate-fade-in">
                        <AlertCircle size={15} className="shrink-0 mt-0.5" />
                        <span>You must be 18 years or older before you can create account on CanaFri.</span>
                      </div>
                    )}
                  </div>

                  {/* Step 1 Button Bar: Back + Next */}
                  <div className="flex gap-3 mt-3">
                    {onBackClick && (
                      <button
                        type="button"
                        onClick={onBackClick}
                        className="h-[40px] px-5 rounded-[12px] text-[13px] font-semibold leading-[18px] text-[#a0a0a0] hover:text-white border border-[#1b1b1b] hover:border-[#2a2a2a] transition-all flex items-center justify-center cursor-pointer shrink-0"
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={!isStep1Valid}
                      className="flex-1 h-[40px] bg-primary rounded-[12px] text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 2: Email & Password ────────────────────────────── */}
              {step === 2 && (
                <div className="flex flex-col gap-4 w-full">
                  <div>
                    <InputField
                      label="Email Address"
                      icon={<Mail size={16} strokeWidth={1.5} />}
                      placeholder="e.g., johndoe@gmail.com"
                      value={email}
                      onChange={(val) => {
                        handleFieldChange('email', val);
                        setEmailStatus('idle');
                        if (val.trim()) {
                          if (!isValidEmailSyntax(val)) {
                            setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
                          } else {
                            const gmailErr = checkGmailStandardFormat(val);
                            if (gmailErr) {
                              setErrors((prev) => ({ ...prev, email: gmailErr }));
                            }
                          }
                        }
                      }}
                      onBlur={() => checkAvailability('email')}
                      error={errors.email}
                      autoComplete="email"
                    />

                    {emailStatus === 'checking' && (
                      <span className="text-[10px] text-white/50 px-1 mt-1 block">Checking availability...</span>
                    )}
                    {emailStatus === 'available' && !errors.email && (
                      <span className="text-[10px] text-emerald-400 px-1 mt-1 block">Email address is available</span>
                    )}
                    {emailStatus === 'taken' && (
                      <span className="text-[10px] text-red-500 px-1 mt-1 block">{emailMessage || 'Email address already registered'}</span>
                    )}
                    {emailStatus === 'invalid' && (
                      <span className="text-[10px] text-red-500 px-1 mt-1 block">{emailMessage}</span>
                    )}

                    {emailSuggestion && (
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEmail(emailSuggestion);
                            setEmailSuggestion(null);
                            setErrors((prev) => { const n = { ...prev }; delete n.email; return n; });
                            checkAvailability('email');
                          }}
                          className="text-[10px] text-primary hover:underline cursor-pointer flex items-center gap-1"
                        >
                          Did you mean <span className="font-semibold text-white">{emailSuggestion}</span>?
                        </button>
                      </div>
                    )}
                  </div>

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
                    autoComplete="new-password"
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
                      autoComplete="new-password"
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

                  {apiError && (
                    <div className="text-[11px] text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 text-center">
                      {apiError}
                    </div>
                  )}

                  {/* Step 2 Button Bar: Back + Register */}
                  <div className="flex gap-3 mt-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="h-[40px] px-5 rounded-[12px] text-[13px] font-semibold leading-[18px] text-[#a0a0a0] hover:text-white hover:bg-[#161616] border border-[#1b1b1b] hover:border-[#2a2a2a] active:scale-[0.97] transition-all flex items-center justify-center cursor-pointer shrink-0"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!isFormValid || isSubmitting || config.registrationPaused}
                      className="flex-1 h-[40px] bg-primary rounded-[12px] text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100"
                    >
                      {isSubmitting ? 'Registering...' : config.registrationPaused ? 'Registration Paused' : 'Register'}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
