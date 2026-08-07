'use client';

import { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Smartphone, ArrowLeft, CheckCircle2, Copy, Download, KeyRound, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface AdminLoginPageProps {
  onLoginSuccess: (token: string, user: { id: string; username: string; displayName: string; role: string }) => void;
}

type LoginStep = 'credentials' | 'totp-setup' | 'totp-verify' | 'recovery-codes' | 'forgot-password' | 'forgot-reset';

const API = '/api/auth';

export default function AdminLoginPage({ onLoginSuccess }: AdminLoginPageProps) {
  const [step, setStep] = useState<LoginStep>('credentials');

  // Step 1: credentials
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);

  // Forgot password state
  const [resetOtp, setResetOtp]               = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw]             = useState(false);
  const [showConfirmPw, setShowConfirmPw]     = useState(false);

  // Pre-auth state (after step 1 succeeds)
  const [preAuthId, setPreAuthId]     = useState('');

  // TOTP setup state
  const [qrCodeUrl, setQrCodeUrl]   = useState('');
  const [totpSecret, setTotpSecret] = useState('');

  // TOTP code input
  const [code, setCode] = useState('');
  const [useRecoveryCodeMode, setUseRecoveryCodeMode] = useState(false);

  // Recovery codes — intercepted from server after first TOTP setup, shown ONCE
  const [recoveryCodes, setRecoveryCodes]             = useState<string[]>([]);
  const [recoveryCodesCopied, setRecoveryCodesCopied] = useState(false);
  // Buffered login result — held until admin saves recovery codes
  const [pendingLoginResult, setPendingLoginResult] = useState<{ token: string; user: any } | null>(null);

  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Step 1: Submit credentials ─────────────────────────────────────────────
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid credentials.');

      setPreAuthId(data.preAuthId);

      if (!data.totpEnabled) {
        await fetchTotpSetup(data.preAuthId);
      } else {
        setStep('totp-verify');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch TOTP setup (first login only) ────────────────────────────────────
  const fetchTotpSetup = async (pid: string) => {
    const res = await fetch(`${API}/admin/totp-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preAuthId: pid }),
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'TOTP setup failed.');
    setQrCodeUrl(data.qrCodeUrl);
    setTotpSecret(data.secret);
    setStep('totp-setup');
  };

  // ── Step 2a (first login): Activate TOTP — intercept recovery codes ────────
  const handleTotpSetupVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/totp-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preAuthId, code }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed.');

      // Store the token now so it is ready when they proceed
      localStorage.setItem('canafri_admin_access_token', data.accessToken);

      // Server returns 10 plaintext recovery codes exactly once.
      // Show them on a dedicated screen before entering the dashboard.
      if (data.recoveryCodes && data.recoveryCodes.length > 0) {
        setRecoveryCodes(data.recoveryCodes);
        setPendingLoginResult({ token: data.accessToken, user: data.user });
        setStep('recovery-codes');
      } else {
        onLoginSuccess(data.accessToken, data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2b (subsequent logins): MFA challenge ────────────────────────────
  const handleMfaLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/mfa-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preAuthId, code }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed.');
      localStorage.setItem('canafri_admin_access_token', data.accessToken);
      onLoginSuccess(data.accessToken, data.user);
    } catch (err: any) {
      setError(err.message || 'Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password ────────────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed.');
      setSuccessMsg('Reset instructions and a 6-digit OTP code have been sent to your email.');
      setStep('forgot-reset');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  // ── Reset password confirm ─────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: resetOtp.trim(), newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Password reset failed.');
      setSuccessMsg('Password updated. Log in with your new credentials.');
      setStep('credentials');
      setPassword(''); setResetOtp(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  // ── Recovery code helpers ──────────────────────────────────────────────────
  const handleCopyRecoveryCodes = async () => {
    await navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setRecoveryCodesCopied(true);
    setTimeout(() => setRecoveryCodesCopied(false), 2000);
  };

  const handleDownloadRecoveryCodes = () => {
    const blob = new Blob(
      [`CanaFri Admin Recovery Codes\nGenerated: ${new Date().toISOString()}\n\n${recoveryCodes.join('\n')}\n\nStore these in a secure offline location. Each code can only be used once.`],
      { type: 'text/plain' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'canafri-admin-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleProceedToDashboard = () => {
    if (pendingLoginResult) {
      onLoginSuccess(pendingLoginResult.token, pendingLoginResult.user);
    }
  };

  // ── Shared UI helpers ──────────────────────────────────────────────────────
  const ErrorBanner = () =>
    error ? (
      <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[0.8125rem] text-red-400">
        <AlertCircle size={15} className="shrink-0" /><span>{error}</span>
      </div>
    ) : null;

  const SuccessBanner = () =>
    successMsg ? (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[0.8125rem] text-emerald-400">
        <CheckCircle2 size={15} className="shrink-0" /><span>{successMsg}</span>
      </div>
    ) : null;

  const SubmitButton = ({ label }: { label: string }) => (
    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8C5CFF] py-3 font-sans text-[0.875rem] font-semibold text-white transition-colors hover:bg-[#7A4AEE] disabled:opacity-50"
    >
      {loading
        ? (<><span className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" /><span>Processing...</span></>)
        : label}
    </button>
  );

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[40rem] w-[40rem] rounded-full bg-[#8C5CFF]/5 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[40rem] w-[40rem] rounded-full bg-[#8C5CFF]/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[26rem]">
        <div className="rounded-[1.5rem] border border-border bg-card p-8 shadow-2xl shadow-black/10">

          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <Logo />
          </div>

          {/* ── STEP 1: Credentials ─────────────────────────────────────── */}
          {step === 'credentials' && (
            <>
              <div className="mb-7 text-center">
                <h1 className="font-sans text-[1.5rem] font-bold tracking-tight text-foreground">Admin Sign In</h1>
              </div>
              <SuccessBanner />
              <form onSubmit={handleCredentials} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="admin-email" className="font-sans text-[0.8125rem] font-medium text-foreground">Email address</label>
                  <input
                    id="admin-email" type="email" autoComplete="email" required
                    value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@canafri.com"
                    className="w-full rounded-xl border border-border bg-background px-4 py-[0.6875rem] font-sans text-[0.8125rem] text-foreground placeholder:text-muted outline-none transition-colors focus:border-[#8C5CFF]/60 focus:ring-2 focus:ring-[#8C5CFF]/10"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="admin-password" className="font-sans text-[0.8125rem] font-medium text-foreground">Password</label>
                  <div className="relative">
                    <input
                      id="admin-password" type={showPw ? 'text' : 'password'} autoComplete="current-password" required
                      value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••"
                      className="w-full rounded-xl border border-border bg-background px-4 py-[0.6875rem] pr-12 font-sans text-[0.8125rem] text-foreground placeholder:text-muted outline-none transition-colors focus:border-[#8C5CFF]/60 focus:ring-2 focus:ring-[#8C5CFF]/10"
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                      aria-label={showPw ? 'Hide password' : 'Show password'}>
                      {showPw ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button type="button"
                      onClick={() => { setStep('forgot-password'); setError(''); setSuccessMsg(''); }}
                      className="font-sans text-[0.75rem] font-medium text-[#8C5CFF] hover:text-[#AC8EF3] transition-colors">
                      Forgot password?
                    </button>
                  </div>
                </div>
                <ErrorBanner />
                <SubmitButton label="Continue" />
              </form>
            </>
          )}

          {/* ── Forgot Password Request ──────────────────────────────────── */}
          {step === 'forgot-password' && (
            <>
              <div className="mb-6 text-center">
                <h1 className="font-sans text-[1.375rem] font-bold tracking-tight text-foreground">Forgot Password</h1>
                <p className="mt-1.5 font-sans text-[0.8125rem] text-muted leading-5">Enter your administrator email to receive a reset code.</p>
              </div>
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reset-email" className="font-sans text-[0.8125rem] font-medium text-foreground">Admin Email</label>
                  <input id="reset-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@canafri.com"
                    className="w-full rounded-xl border border-border bg-background px-4 py-[0.6875rem] font-sans text-[0.8125rem] text-foreground placeholder:text-muted outline-none transition-colors focus:border-[#8C5CFF]/60 focus:ring-2 focus:ring-[#8C5CFF]/10" />
                </div>
                <ErrorBanner />
                <SubmitButton label="Send Reset Code" />
              </form>
              <button type="button" onClick={() => { setStep('credentials'); setError(''); setSuccessMsg(''); }}
                className="mt-4 flex items-center justify-center gap-1.5 w-full text-center font-sans text-[0.8125rem] text-muted hover:text-foreground transition-colors">
                <ArrowLeft size={14} /> Back to sign in
              </button>
            </>
          )}

          {/* ── Reset Password Confirm ───────────────────────────────────── */}
          {step === 'forgot-reset' && (
            <>
              <div className="mb-6 text-center">
                <h1 className="font-sans text-[1.375rem] font-bold tracking-tight text-foreground">Reset Password</h1>
                <p className="mt-1.5 font-sans text-[0.8125rem] text-muted leading-5">Enter the 6-digit OTP sent to your email and choose a new password.</p>
              </div>
              <SuccessBanner />
              <form onSubmit={handleResetPassword} className="flex flex-col gap-4 mt-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reset-otp" className="font-sans text-[0.8125rem] font-medium text-foreground">6-digit OTP Code</label>
                  <input id="reset-otp" type="text" inputMode="numeric" maxLength={6} required value={resetOtp}
                    onChange={e => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000"
                    className="w-full rounded-xl border border-border bg-background px-4 py-[0.6875rem] font-mono text-[1.125rem] tracking-[0.3em] text-center text-foreground placeholder:text-muted outline-none transition-colors focus:border-[#8C5CFF]/60 focus:ring-2 focus:ring-[#8C5CFF]/10" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reset-new-password" className="font-sans text-[0.8125rem] font-medium text-foreground">New Password</label>
                  <div className="relative">
                    <input id="reset-new-password" type={showNewPw ? 'text' : 'password'} required value={newPassword}
                      onChange={e => setNewPassword(e.target.value)} placeholder="••••••••••••"
                      className="w-full rounded-xl border border-border bg-background px-4 py-[0.6875rem] pr-12 font-sans text-[0.8125rem] text-foreground placeholder:text-muted outline-none transition-colors focus:border-[#8C5CFF]/60 focus:ring-2 focus:ring-[#8C5CFF]/10" />
                    <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
                      {showNewPw ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reset-confirm-password" className="font-sans text-[0.8125rem] font-medium text-foreground">Confirm New Password</label>
                  <div className="relative">
                    <input id="reset-confirm-password" type={showConfirmPw ? 'text' : 'password'} required value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••••••"
                      className="w-full rounded-xl border border-border bg-background px-4 py-[0.6875rem] pr-12 font-sans text-[0.8125rem] text-foreground placeholder:text-muted outline-none transition-colors focus:border-[#8C5CFF]/60 focus:ring-2 focus:ring-[#8C5CFF]/10" />
                    <button type="button" onClick={() => setShowConfirmPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
                      {showConfirmPw ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                </div>
                <ErrorBanner />
                <SubmitButton label="Update Password" />
              </form>
              <button type="button" onClick={() => { setStep('credentials'); setError(''); setSuccessMsg(''); }}
                className="mt-4 flex items-center justify-center gap-1.5 w-full text-center font-sans text-[0.8125rem] text-muted hover:text-foreground transition-colors">
                <ArrowLeft size={14} /> Cancel & Back to sign in
              </button>
            </>
          )}

          {/* ── TOTP QR Setup (first login) ──────────────────────────────── */}
          {step === 'totp-setup' && (
            <>
              <div className="mb-6 text-center">
                <h1 className="font-sans text-[1.25rem] font-bold tracking-tight text-foreground">Set Up Authenticator</h1>
                <p className="mt-1.5 font-sans text-[0.8125rem] text-muted leading-5">
                  Scan this QR code with <strong className="text-foreground">Google Authenticator</strong> or <strong className="text-foreground">Authy</strong>, then enter the 6-digit code below to activate MFA.
                </p>
              </div>
              {qrCodeUrl && (
                <div className="mb-5 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCodeUrl} alt="TOTP QR Code" className="rounded-xl border border-border p-2 bg-white" width={160} height={160} />
                </div>
              )}
              {totpSecret && (
                <div className="mb-5 rounded-xl border border-border bg-background px-4 py-3 text-center">
                  <p className="font-sans text-[0.6875rem] text-muted mb-1">Manual setup key</p>
                  <code className="font-mono text-[0.75rem] text-foreground tracking-widest break-all">{totpSecret}</code>
                </div>
              )}
              <form onSubmit={handleTotpSetupVerify} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="totp-code-setup" className="font-sans text-[0.8125rem] font-medium text-foreground">6-digit verification code</label>
                  <input id="totp-code-setup" type="text" inputMode="numeric" maxLength={6} autoComplete="one-time-code" required
                    value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000"
                    className="w-full rounded-xl border border-border bg-background px-4 py-[0.6875rem] font-mono text-[1.125rem] tracking-[0.3em] text-center text-foreground placeholder:text-muted outline-none transition-colors focus:border-[#8C5CFF]/60 focus:ring-2 focus:ring-[#8C5CFF]/10" />
                </div>
                <ErrorBanner />
                <SubmitButton label="Activate MFA & Continue" />
              </form>
            </>
          )}

          {/* ── Recovery Codes — shown ONCE after first TOTP setup ───────── */}
          {step === 'recovery-codes' && (
            <>
              <div className="mb-5 text-center">
                <h1 className="font-sans text-[1.125rem] font-bold tracking-tight text-foreground">Save Your Recovery Codes</h1>
                <p className="mt-1.5 font-sans text-[0.8125rem] text-muted leading-5">
                  These <strong className="text-foreground">10 one-time codes</strong> are your emergency backup if you ever lose access to your authenticator app. They will <strong className="text-amber-400">never be shown again</strong>.
                </p>
              </div>

              {/* Warning */}
              <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-2.5">
                <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="font-sans text-[0.75rem] text-amber-300 leading-5">
                  Store these in a password manager or a secure offline location. Each code works only once.
                </p>
              </div>

              {/* 10 codes grid */}
              <div className="mb-4 grid grid-cols-2 gap-2">
                {recoveryCodes.map((rc, i) => (
                  <div key={i}
                    className="rounded-[10px] bg-background border border-border px-3 py-2.5 text-center font-mono text-[0.8125rem] text-foreground tracking-widest select-all">
                    {rc}
                  </div>
                ))}
              </div>

              {/* Copy / Download */}
              <div className="flex gap-2 mb-4">
                <button type="button" onClick={handleCopyRecoveryCodes}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background py-2.5 font-sans text-[0.8125rem] font-medium text-foreground hover:bg-border/40 transition-colors">
                  <Copy size={14} />
                  {recoveryCodesCopied ? 'Copied!' : 'Copy All'}
                </button>
                <button type="button" onClick={handleDownloadRecoveryCodes}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background py-2.5 font-sans text-[0.8125rem] font-medium text-foreground hover:bg-border/40 transition-colors">
                  <Download size={14} />
                  Download .txt
                </button>
              </div>

              {/* Proceed */}
              <button type="button" onClick={handleProceedToDashboard}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#8C5CFF] py-3 font-sans text-[0.875rem] font-semibold text-white transition-colors hover:bg-[#7A4AEE]">
                I've saved my codes, proceed to Dashboard
              </button>
            </>
          )}

          {/* ── TOTP Verify (subsequent logins) ─────────────────────────── */}
          {step === 'totp-verify' && (
            <>
              <div className="mb-6 text-center">
                <div className={`inline-flex items-center justify-center size-12 rounded-full mb-4 ${useRecoveryCodeMode ? 'bg-amber-500/10 text-amber-400' : 'bg-[#8C5CFF]/10 text-[#8C5CFF]'}`}>
                  {useRecoveryCodeMode ? <KeyRound size={22} strokeWidth={1.5} /> : <Smartphone size={22} strokeWidth={1.5} />}
                </div>
                <h1 className="font-sans text-[1.25rem] font-bold tracking-tight text-foreground">
                  {useRecoveryCodeMode ? 'Emergency Recovery Code' : 'Two-Factor Verification'}
                </h1>
                <p className="mt-1.5 font-sans text-[0.8125rem] text-muted leading-5">
                  {useRecoveryCodeMode
                    ? 'Enter one of your stored 8-character recovery codes (e.g. 1234-5678).'
                    : 'Enter the 6-digit code from your Authenticator app.'}
                </p>
              </div>

              <form onSubmit={handleMfaLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="totp-code-verify" className="font-sans text-[0.8125rem] font-medium text-foreground">
                    {useRecoveryCodeMode ? 'Recovery Code' : 'Authentication Code'}
                  </label>
                  <input
                    id="totp-code-verify"
                    type="text"
                    inputMode={useRecoveryCodeMode ? 'text' : 'numeric'}
                    maxLength={useRecoveryCodeMode ? 9 : 6}
                    autoComplete="one-time-code"
                    required
                    value={code}
                    onChange={e => setCode(
                      useRecoveryCodeMode
                        ? e.target.value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 9)
                        : e.target.value.replace(/\D/g, '').slice(0, 6)
                    )}
                    placeholder={useRecoveryCodeMode ? '1234-5678' : '000000'}
                    className={`w-full rounded-xl border border-border bg-background px-4 py-[0.6875rem] font-mono text-[1.125rem] tracking-[0.3em] text-center text-foreground placeholder:text-muted/40 outline-none transition-colors focus:border-[#8C5CFF]/60 focus:ring-2 focus:ring-[#8C5CFF]/10 ${useRecoveryCodeMode ? 'uppercase' : ''}`}
                  />
                </div>
                <ErrorBanner />
                <SubmitButton label={useRecoveryCodeMode ? 'Verify Recovery Code & Sign In' : 'Sign In'} />
              </form>

              <div className="mt-5 flex flex-col gap-3 pt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => { setUseRecoveryCodeMode(v => !v); setCode(''); setError(''); }}
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-[#8C5CFF]/30 bg-[#8C5CFF]/10 py-2.5 px-3 font-sans text-[0.8125rem] font-semibold text-[#8C5CFF] hover:bg-[#8C5CFF]/20 hover:border-[#8C5CFF]/50 transition-all shadow-sm"
                >
                  <KeyRound size={15} />
                  <span>{useRecoveryCodeMode ? 'Back to Authenticator App (TOTP)' : 'Lost your phone? Use a recovery code'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setCode(''); setError(''); setUseRecoveryCodeMode(false); }}
                  className="w-full text-center font-sans text-[0.75rem] text-muted hover:text-foreground transition-colors"
                >
                  ← Sign in as a different admin
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
