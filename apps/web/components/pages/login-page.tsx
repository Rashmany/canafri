'use client';

import { useState } from 'react';
import { Eye, EyeOff, User, Lock, ArrowLeft, Mail, RefreshCw, ShieldAlert, X } from 'lucide-react';
import { updateSocketToken } from '@/lib/socket';
import { getOrCreateDeviceId } from '@/lib/api-client';
import { usePlatformConfig } from '@/lib/platform-config-context';
import AuthSplitLayout from '@/components/auth-split-layout';

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
        <span className="text-[#a0a0a0]/60 shrink-0 flex items-center">{icon}</span>
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

// Sanitization Helpers
function sanitizeInput(val: string): string {
  return val.trim().replace(/[<>]/g, '');
}

export default function LoginPage({ onRegisterClick, onLoginSuccess, onForgotPasswordClick, onBackClick }: LoginPageProps) {
  const { config } = usePlatformConfig();
  const [identifier, setIdentifier] = useState(''); // Username or Email
  const [password, setPassword] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Email-not-verified state
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // 2FA Pop-up Modal state
  const [requiresTotp, setRequiresTotp] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [totpError, setTotpError] = useState<string | null>(null);

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
    setEmailNotVerified(false);
    setResendStatus('idle');

    if (field === 'identifier') setIdentifier(value);
    if (field === 'password') setPassword(value);
  };

  const handleResendOTP = async () => {
    if (!resendEmail || resendStatus === 'sending') return;
    setResendStatus('sending');
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resend.');
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  };

  // Account restoration state
  const [pendingDeletion, setPendingDeletion] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState('');
  const [restoring, setRestoring] = useState(false);

  const handleCancelDeletion = async () => {
    setRestoring(true);
    setApiError(null);
    try {
      const cleanIdentifier = sanitizeInput(identifier);
      const res = await fetch('/api/auth/account-deletion/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanIdentifier,
          password: password,
          ...(totpCode ? { totpCode } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to restore account.');
      
      setPendingDeletion(false);
      // Re-trigger submit to complete login
      const deviceId = getOrCreateDeviceId();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (deviceId) headers['X-Device-ID'] = deviceId;

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({ identifier: cleanIdentifier, password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        processLoginSuccess(loginData);
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to restore account.');
    } finally {
      setRestoring(false);
    }
  };

  // Main login submission (Step 1)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    if (config.loginPaused) return;

    setApiError(null);
    setPendingDeletion(false);
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
      const deviceId = getOrCreateDeviceId();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (deviceId) {
        headers['X-Device-ID'] = deviceId;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          identifier: cleanIdentifier,
          password: password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'ACCOUNT_PENDING_DELETION') {
          setPendingDeletion(true);
          setRestoreMessage(data.message || 'Your account is scheduled for deletion.');
        } else if (data.code === 'TOTP_REQUIRED') {
          // Open clean 2FA Pop-up Modal instead of cluttering form UI
          setRequiresTotp(true);
          setTotpCode('');
          setTotpError(null);
        } else if (data.code === 'EMAIL_NOT_VERIFIED') {
          const likelyEmail = cleanIdentifier.includes('@') ? cleanIdentifier : '';
          setResendEmail(likelyEmail);
          setEmailNotVerified(true);
          setResendStatus('idle');
        } else {
          throw new Error(data.message || data.error || 'Login failed.');
        }
        return;
      }

      // Successful login without 2FA
      processLoginSuccess(data);
    } catch (err: any) {
      setApiError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2FA Pop-up Modal Verification (Step 2)
  const handleVerifyTotpAndLogin = async () => {
    if (totpCode.trim().length !== 6) {
      setTotpError('Please enter a valid 6-digit code.');
      return;
    }

    setTotpError(null);
    setIsSubmitting(true);

    try {
      const deviceId = getOrCreateDeviceId();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (deviceId) {
        headers['X-Device-ID'] = deviceId;
      }

      const cleanIdentifier = sanitizeInput(identifier);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          identifier: cleanIdentifier,
          password: password,
          totpCode: totpCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid 2FA code.');
      }

      setRequiresTotp(false);
      processLoginSuccess(data);
    } catch (err: any) {
      setTotpError(err.message || 'Invalid 2FA code. Please check your app and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save session profile & navigate
  const processLoginSuccess = (data: any) => {
    if (typeof window !== 'undefined' && data.accessToken && data.user) {
      localStorage.setItem('canafri_access_token', data.accessToken);
      localStorage.setItem('canafri_user_profile', JSON.stringify({
        id: data.user.id,
        fullName: data.user.displayName || data.user.fullName || '',
        username: data.user.username,
        email: data.user.email,
        role: data.user.role,
        memberSince: "April 2026",
        isSeller: data.user.isSeller ?? false,
        sellerApproved: data.user.sellerApproved ?? false,
      }));
      updateSocketToken(data.accessToken);
    }
    onLoginSuccess?.();
  };

  return (
    <>
      <AuthSplitLayout>
        <div className="flex flex-col items-center justify-center w-full min-h-screen md:min-h-0 px-6 py-10 md:py-12">



          {/* Form container — transparent background matching platform */}
          <div className="relative flex flex-col items-center w-full bg-transparent pt-0 px-0 pb-10 max-w-[400px]">
            <div className="flex flex-col gap-6 w-full flex-1">
              {/* Heading */}
              <div className="flex flex-col items-start md:items-center gap-1 mb-6 text-left md:text-center w-full">
                <h1 className="text-[28px] md:text-[32px] font-bold leading-[34px] md:leading-[38px] tracking-[-0.18px] text-white/95">
                  Log In
                </h1>
                <p className="text-[13px] font-normal leading-[20px] text-[#a0a0a0]">
                  Access your account
                </p>
              </div>

              {/* Platform Control Center Login Paused Banner */}
              {config.loginPaused && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium w-full mb-4">
                  <ShieldAlert size={16} className="shrink-0 text-amber-400" />
                  <span className="flex-1">{config.loginPausedReason || 'Account logins are temporarily paused for maintenance.'}</span>
                </div>
              )}

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4.5 w-full">
                <InputField
                  label="Username or Email"
                  icon={<User size={16} strokeWidth={1.5} />}
                  placeholder="e.g., johndoe123 or johndoe@gmail.com"
                  value={identifier}
                  onChange={(val) => handleFieldChange('identifier', val)}
                  error={errors.identifier}
                  autoComplete="username"
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
                    autoComplete="current-password"
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

                {/* Pending Deletion Restore Banner */}
                {pendingDeletion && (
                  <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs mt-1 animate-accordion-open">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-red-300">Account Deletion Scheduled</span>
                        <span className="text-red-300/80 text-[11px] leading-[17px]">
                          {restoreMessage}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelDeletion}
                      disabled={restoring}
                      className="flex items-center justify-center gap-1.5 w-full h-[34px] rounded-lg bg-red-600 text-[11px] font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      {restoring ? 'Restoring Account…' : 'Restore Account & Cancel Deletion'}
                    </button>
                  </div>
                )}

                {/* Email-not-verified banner */}
                {emailNotVerified && (
                  <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs mt-2">
                    <div className="flex items-start gap-2.5">
                      <Mail size={15} className="text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-amber-300">Email not verified</span>
                        <span className="text-amber-300/70 leading-[18px]">
                          Please check your inbox and verify your email before logging in.
                          {resendEmail && <> We sent the code to <span className="font-medium text-amber-200">{resendEmail}</span>.</>}
                        </span>
                      </div>
                    </div>
                    {resendStatus === 'sent' ? (
                      <p className="text-[11px] text-emerald-400 text-center font-medium">✓ A new verification code has been sent!</p>
                    ) : resendStatus === 'error' ? (
                      <p className="text-[11px] text-red-400 text-center">Failed to resend. Please try again.</p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={resendStatus === 'sending'}
                        className="flex items-center justify-center gap-1.5 w-full h-[32px] rounded-lg bg-amber-500/20 border border-amber-500/30 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        <RefreshCw size={12} className={resendStatus === 'sending' ? 'animate-spin' : ''} />
                        {resendStatus === 'sending' ? 'Sending...' : 'Resend verification code'}
                      </button>
                    )}
                  </div>
                )}

                {/* Generic API error */}
                {apiError && (
                  <div className="text-[11px] text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 text-center mt-2">
                    {apiError}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting || config.loginPaused}
                  className="w-full h-[40px] bg-primary rounded-[12px] text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100 mt-2"
                >
                  {isSubmitting ? 'Logging in...' : config.loginPaused ? 'Log In Paused' : 'Log In'}
                </button>
              </form>



              {/* Footer text */}
              <p className="text-center text-[12px] text-[#a0a0a0] leading-[18px]">
                Don&apos;t have an account?{' '}
                <button
                  onClick={onRegisterClick}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>
        </div>
      </AuthSplitLayout>

      {/* ── 2FA Pop-up Modal ── */}
      {requiresTotp && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 p-4 animate-fade-in"
          onClick={() => setRequiresTotp(false)}
        >
          <div
            className="relative w-full max-w-[24.5rem] rounded-2xl border border-[#242424] bg-[#0d0d0d] p-6 shadow-2xl flex flex-col gap-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldAlert size={18} />
                  <span className="font-sans text-[15px] font-semibold text-white">Two-Factor Authentication</span>
                </div>
                <p className="font-sans text-[11px] text-[#a0a0a0] leading-relaxed">
                  Enter the 6-digit verification code from your authenticator app to complete login.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRequiresTotp(false)}
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#a0a0a0] hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="modal-totp-code" className="font-sans text-[11px] font-semibold text-[#a0a0a0] uppercase tracking-wider">
                Authenticator Code
              </label>
              <input
                id="modal-totp-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center tracking-[0.5em] font-mono rounded-xl border border-[#242424] bg-[#121212] px-4 py-3 text-[18px] text-white placeholder:text-[#a0a0a0]/30 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              />
              {totpError && (
                <p className="font-sans text-[11px] text-red-400 text-center">{totpError}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setRequiresTotp(false); setTotpCode(''); setTotpError(null); }}
                className="flex-1 rounded-xl border border-[#242424] bg-transparent py-2.5 font-sans text-[13px] font-semibold text-[#a0a0a0] hover:bg-white/5 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyTotpAndLogin}
                disabled={isSubmitting || totpCode.length !== 6}
                className="flex-1 rounded-xl bg-primary py-2.5 font-sans text-[13px] font-semibold text-white hover:bg-primary-hover disabled:opacity-60 transition-colors"
              >
                {isSubmitting ? 'Verifying...' : 'Verify & Log In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
