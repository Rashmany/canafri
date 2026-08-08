'use client';

import { useState } from 'react';
import { X, Eye, EyeOff, KeyRound, Mail, CheckCircle2, ArrowRight, Check } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

interface ChangePasswordModalProps {
  onClose: () => void;
  onSave?: () => Promise<void> | void;
  initialMode?: 'change' | 'reset';
  userEmail?: string;
}

// ── Password strength helpers (matches user register page rules) ──────────────
// Rules: min 8 chars · one uppercase · one number · one special char

function isPasswordStrong(pw: string) {
  return (
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
}

/** Live checklist shown while the field is focused and rules aren't all met — exactly like register page. */
function PasswordStrengthGuard({ password, focused }: { password: string; focused: boolean }) {
  if (!focused || password.length === 0 || isPasswordStrong(password)) return null;

  const hasMinLength   = password.length >= 8;
  const hasUppercase   = /[A-Z]/.test(password);
  const hasNumber      = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  return (
    <div className="flex flex-col gap-1.5 bg-background border border-border rounded-xl p-3 text-[11px] leading-[15px] mt-1.5 transition-all">
      <span className="font-semibold text-foreground/70 mb-0.5">Password must contain:</span>
      <div className="flex items-center gap-2">
        {hasMinLength
          ? <Check size={12} className="text-emerald-500 shrink-0" />
          : <X size={12} className="text-foreground/30 shrink-0" />}
        <span className={hasMinLength ? 'text-emerald-400' : 'text-foreground/60'}>At least 8 characters</span>
      </div>
      <div className="flex items-center gap-2">
        {hasUppercase
          ? <Check size={12} className="text-emerald-500 shrink-0" />
          : <X size={12} className="text-foreground/30 shrink-0" />}
        <span className={hasUppercase ? 'text-emerald-400' : 'text-foreground/60'}>One uppercase letter (A-Z)</span>
      </div>
      <div className="flex items-center gap-2">
        {hasNumber
          ? <Check size={12} className="text-emerald-500 shrink-0" />
          : <X size={12} className="text-foreground/30 shrink-0" />}
        <span className={hasNumber ? 'text-emerald-400' : 'text-foreground/60'}>One number (0-9)</span>
      </div>
      <div className="flex items-center gap-2">
        {hasSpecialChar
          ? <Check size={12} className="text-emerald-500 shrink-0" />
          : <X size={12} className="text-foreground/30 shrink-0" />}
        <span className={hasSpecialChar ? 'text-emerald-400' : 'text-foreground/60'}>One special character (e.g., @$!%*?&)</span>
      </div>
    </div>
  );
}

// ── Reusable password input ───────────────────────────────────────────────────

function PasswordField({
  id,
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  error,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: boolean;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={id} className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider">
        {label}
      </label>
      <div className="relative w-full">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={[
            'w-full rounded-xl border bg-background py-3 pl-4 pr-10 font-sans text-[13px] text-foreground placeholder:text-foreground/30 outline-none transition',
            error ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-border focus:border-[#8C5CFF] focus:ring-1 focus:ring-[#8C5CFF]',
          ].join(' ')}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function ChangePasswordModal({
  onClose,
  onSave,
  initialMode = 'change',
  userEmail = '',
}: ChangePasswordModalProps) {
  const [mode, setMode] = useState<'change' | 'reset'>(initialMode);

  // ── Change password state ─────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPwFocused, setNewPwFocused]       = useState(false);

  // ── Reset password state ──────────────────────────────────────────────────
  const [resetEmail, setResetEmail]                 = useState(userEmail);
  const [otpSent, setOtpSent]                       = useState(false);
  const [otpCode, setOtpCode]                       = useState('');
  const [resetNewPassword, setResetNewPassword]     = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetPwFocused, setResetPwFocused]         = useState(false);
  const [resetSuccess, setResetSuccess]             = useState(false);

  const [saving, setSaving]   = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Change tab derived
  const changeWeak      = newPassword.length > 0 && !isPasswordStrong(newPassword);
  const changeMismatch  = confirmPassword.length > 0 && newPassword !== confirmPassword;

  // Reset tab derived
  const resetWeak     = resetNewPassword.length > 0 && !isPasswordStrong(resetNewPassword);
  const resetMismatch = resetConfirmPassword.length > 0 && resetNewPassword !== resetConfirmPassword;

  // ── Change Password — real API call ──────────────────────────────────────
  const handleUpdate = async () => {
    if (!currentPassword) {
      setErrorMsg('Please enter your current password.');
      return;
    }
    if (!isPasswordStrong(newPassword)) {
      setErrorMsg('Your new password does not meet the requirements.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setErrorMsg('');
    setSaving(true);
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message ?? 'Failed to change password. Please try again.');
      }

      if (onSave) await onSave();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Send Reset OTP ────────────────────────────────────────────────────────
  const handleSendResetOtp = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setErrorMsg('');
    setSaving(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? 'Failed to send reset code. Please try again.');
      }
      setOtpSent(true);
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Failed to send reset code. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Reset Password with OTP ───────────────────────────────────────────────
  const handleResetPasswordWithOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg('Please enter the 6-digit code sent to your email.');
      return;
    }
    if (!isPasswordStrong(resetNewPassword)) {
      setErrorMsg('Your new password does not meet the requirements.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setErrorMsg('');
    setSaving(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          otp: otpCode,
          newPassword: resetNewPassword,
          confirmPassword: resetConfirmPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message ?? 'Invalid or expired reset code. Please try again.');
      }

      setResetSuccess(true);
      if (onSave) await onSave();
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Invalid or expired reset code. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-[26.063rem] rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col gap-5 animate-accordion-open"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-[#8C5CFF]" />
              <p className="font-sans text-[15px] font-semibold text-foreground">
                {mode === 'change' ? 'Change Password' : 'Password Reset'}
              </p>
            </div>
            <p className="font-sans text-[11px] text-muted">
              {mode === 'change'
                ? 'Update your password using your current password'
                : 'Reset your password via verification code sent to email'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-foreground/50 hover:bg-foreground/10 hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-background p-1 border border-border/80">
          <button
            type="button"
            onClick={() => { setMode('change'); setErrorMsg(''); }}
            className={[
              'flex-1 rounded-lg py-1.5 font-sans text-[12px] font-medium transition-all',
              mode === 'change' ? 'bg-card text-foreground shadow-sm font-semibold' : 'text-foreground/60 hover:text-foreground',
            ].join(' ')}
          >
            Change Password
          </button>
          <button
            type="button"
            onClick={() => { setMode('reset'); setErrorMsg(''); }}
            className={[
              'flex-1 rounded-lg py-1.5 font-sans text-[12px] font-medium transition-all',
              mode === 'reset' ? 'bg-card text-foreground shadow-sm font-semibold' : 'text-foreground/60 hover:text-foreground',
            ].join(' ')}
          >
            Reset Password
          </button>
        </div>

        {/* ── Mode 1: Change Password ── */}
        {mode === 'change' && (
          <div className="flex flex-col gap-4">
            <div>
              <PasswordField
                id="current-password"
                label="Current password"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <div className="mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => { setMode('reset'); setErrorMsg(''); }}
                  className="font-sans text-[11px] font-medium text-[#8C5CFF] hover:underline"
                >
                  Forgot current password?
                </button>
              </div>
            </div>

            <div>
              <PasswordField
                id="new-password"
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                onFocus={() => setNewPwFocused(true)}
                onBlur={() => setNewPwFocused(false)}
                placeholder="••••••••"
                error={changeWeak && !newPwFocused && newPassword.length > 0}
                autoComplete="new-password"
              />
              <PasswordStrengthGuard password={newPassword} focused={newPwFocused} />
            </div>

            <div>
              <PasswordField
                id="confirm-password"
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="••••••••"
                error={changeMismatch}
                autoComplete="new-password"
              />
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-1.5 px-1 mt-1.5">
                  {!changeMismatch ? (
                    <><Check size={12} className="text-emerald-500 shrink-0" /><span className="text-[10px] text-emerald-400 font-medium">Passwords match</span></>
                  ) : (
                    <><X size={12} className="text-red-500 shrink-0" /><span className="text-[10px] text-red-400 font-medium">Passwords do not match</span></>
                  )}
                </div>
              )}
            </div>

            {errorMsg && (
              <p className="font-sans text-[11px] text-[#ff6b6b] text-center">{errorMsg}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-border bg-transparent py-2.5 font-sans text-[13px] font-semibold text-foreground/70 hover:bg-foreground/5 hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={saving || !currentPassword || changeWeak || changeMismatch}
                className="flex-1 rounded-xl bg-[#8C5CFF] py-2.5 font-sans text-[13px] font-semibold text-white hover:bg-[#AC8EF3] disabled:opacity-60 transition-colors"
              >
                {saving ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </div>
        )}

        {/* ── Mode 2: Reset Password (via OTP) ── */}
        {mode === 'reset' && (
          <div className="flex flex-col gap-4">
            {resetSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                <CheckCircle2 className="size-12 text-emerald-500" />
                <p className="font-sans text-[14px] font-semibold text-foreground">Password Reset Complete!</p>
                <p className="font-sans text-[12px] text-muted max-w-[20rem]">
                  Your password has been updated. You can now log in with your new password.
                </p>
              </div>
            ) : !otpSent ? (
              /* Step 1: Enter email & request code */
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 w-full">
                  <label htmlFor="reset-email" className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider">
                    Registered Email Address
                  </label>
                  <div className="relative w-full">
                    <input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 font-sans text-[13px] text-foreground placeholder:text-foreground/30 outline-none focus:border-[#8C5CFF] focus:ring-1 focus:ring-[#8C5CFF] transition"
                    />
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
                  </div>
                </div>

                {errorMsg && (
                  <p className="font-sans text-[11px] text-[#ff6b6b] text-center">{errorMsg}</p>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-border bg-transparent py-2.5 font-sans text-[13px] font-semibold text-foreground/70 hover:bg-foreground/5 hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendResetOtp}
                    disabled={saving || !resetEmail}
                    className="flex-1 rounded-xl bg-[#8C5CFF] py-2.5 font-sans text-[13px] font-semibold text-white hover:bg-[#AC8EF3] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? 'Sending Code...' : (
                      <><span>Send Reset Code</span><ArrowRight size={14} /></>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Enter OTP & new password */
              <div className="flex flex-col gap-4">
                <div className="p-3 rounded-xl bg-[#8C5CFF]/10 border border-[#8C5CFF]/20 flex items-center justify-between">
                  <p className="font-sans text-[11px] text-foreground/80">
                    Reset code sent to <strong className="text-foreground">{resetEmail}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(''); setErrorMsg(''); }}
                    className="font-sans text-[10px] text-[#8C5CFF] hover:underline font-semibold"
                  >
                    Change
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 w-full">
                  <label htmlFor="otp-code" className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider">
                    6-Digit Verification Code
                  </label>
                  <input
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full rounded-xl border border-border bg-background py-3 text-center font-mono text-[16px] tracking-[0.3em] text-foreground placeholder:tracking-normal placeholder:font-sans placeholder:text-[13px] placeholder:text-foreground/30 outline-none focus:border-[#8C5CFF] focus:ring-1 focus:ring-[#8C5CFF] transition"
                  />
                </div>

                <div>
                  <PasswordField
                    id="reset-new-password"
                    label="New password"
                    value={resetNewPassword}
                    onChange={setResetNewPassword}
                    onFocus={() => setResetPwFocused(true)}
                    onBlur={() => setResetPwFocused(false)}
                    placeholder="••••••••"
                    error={resetWeak && !resetPwFocused && resetNewPassword.length > 0}
                    autoComplete="new-password"
                  />
                  <PasswordStrengthGuard password={resetNewPassword} focused={resetPwFocused} />
                </div>

                <div>
                  <PasswordField
                    id="reset-confirm-password"
                    label="Confirm new password"
                    value={resetConfirmPassword}
                    onChange={setResetConfirmPassword}
                    placeholder="••••••••"
                    error={resetMismatch}
                    autoComplete="new-password"
                  />
                  {resetConfirmPassword.length > 0 && (
                    <div className="flex items-center gap-1.5 px-1 mt-1.5">
                      {!resetMismatch ? (
                        <><Check size={12} className="text-emerald-500 shrink-0" /><span className="text-[10px] text-emerald-400 font-medium">Passwords match</span></>
                      ) : (
                        <><X size={12} className="text-red-500 shrink-0" /><span className="text-[10px] text-red-400 font-medium">Passwords do not match</span></>
                      )}
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <p className="font-sans text-[11px] text-[#ff6b6b] text-center">{errorMsg}</p>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-border bg-transparent py-2.5 font-sans text-[13px] font-semibold text-foreground/70 hover:bg-foreground/5 hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPasswordWithOtp}
                    disabled={saving || otpCode.length !== 6 || resetWeak || resetMismatch}
                    className="flex-1 rounded-xl bg-[#8C5CFF] py-2.5 font-sans text-[13px] font-semibold text-white hover:bg-[#AC8EF3] disabled:opacity-60 transition-colors"
                  >
                    {saving ? 'Resetting Password...' : 'Reset Password'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
