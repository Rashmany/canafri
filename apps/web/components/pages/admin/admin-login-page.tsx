'use client';

import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, AlertCircle, Smartphone } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface AdminLoginPageProps {
  onLoginSuccess: (token: string, user: { id: string; username: string; displayName: string; role: string }) => void;
}

type LoginStep = 'credentials' | 'totp-setup' | 'totp-verify';

const API = 'http://localhost:3001/auth';

export default function AdminLoginPage({ onLoginSuccess }: AdminLoginPageProps) {
  const [step, setStep] = useState<LoginStep>('credentials');

  // Step 1: credentials
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);

  // Pre-auth state (after step 1 succeeds)
  const [preAuthId, setPreAuthId]   = useState('');
  const [totpEnabled, setTotpEnabled] = useState(false);

  // TOTP setup state
  const [qrCodeUrl, setQrCodeUrl]   = useState('');
  const [totpSecret, setTotpSecret] = useState('');

  // TOTP code input
  const [code, setCode] = useState('');

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

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
      setTotpEnabled(data.totpEnabled);

      if (!data.totpEnabled) {
        // First login: fetch QR code before showing setup screen
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

  // ── Fetch TOTP setup (called after first successful credential check) ───────
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

  // ── Step 2 (first login): Confirm the initial TOTP code from the QR scan ───
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
      localStorage.setItem('canafri_admin_access_token', data.accessToken);
      onLoginSuccess(data.accessToken, data.user);
    } catch (err: any) {
      setError(err.message || 'Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 (subsequent logins): Verify TOTP code from Authenticator app ────
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

  // ── Shared error/card helpers ───────────────────────────────────────────────
  const ErrorBanner = () => error ? (
    <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
      <AlertCircle size={15} className="shrink-0 text-red-500" />
      <p className="font-sans text-[0.8125rem] text-red-500">{error}</p>
    </div>
  ) : null;

  const SubmitButton = ({ label }: { label: string }) => (
    <button
      type="submit"
      disabled={loading}
      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#8C5CFF] px-4 py-[0.8125rem] font-sans text-[0.875rem] font-semibold text-white transition-all hover:bg-[#AC8EF3] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#8C5CFF]/25 cursor-pointer"
    >
      {loading ? (
        <>
          <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Verifying…
        </>
      ) : (
        <>
          <ShieldCheck size={16} />
          {label}
        </>
      )}
    </button>
  );

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12">
      {/* Background gradient blob */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[40rem] w-[40rem] rounded-full bg-[#8C5CFF]/5 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[40rem] w-[40rem] rounded-full bg-[#8C5CFF]/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[26rem]">
        <div className="rounded-[1.5rem] border border-border bg-card p-8 shadow-2xl shadow-black/10">

          {/* Logo + badge */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <Logo />
            <div className="flex items-center gap-2 rounded-full border border-[#8C5CFF]/20 bg-[#8C5CFF]/5 px-4 py-1.5">
              <ShieldCheck size={14} className="text-[#8C5CFF]" strokeWidth={2} />
              <span className="font-sans text-[0.6875rem] font-semibold uppercase tracking-widest text-[#8C5CFF]">
                Admin Console
              </span>
            </div>
          </div>

          {/* ── STEP 1: Credentials ────────────────────────────────────────── */}
          {step === 'credentials' && (
            <>
              <div className="mb-7 text-center">
                <h1 className="font-sans text-[1.5rem] font-bold tracking-tight text-foreground">Admin Sign In</h1>
                <p className="mt-1 font-sans text-[0.8125rem] text-muted">Restricted access — authorised personnel only</p>
              </div>
              <form onSubmit={handleCredentials} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="admin-email" className="font-sans text-[0.8125rem] font-medium text-foreground">Email address</label>
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@canafri.com"
                    className="w-full rounded-xl border border-border bg-background px-4 py-[0.6875rem] font-sans text-[0.8125rem] text-foreground placeholder:text-muted outline-none transition-colors focus:border-[#8C5CFF]/60 focus:ring-2 focus:ring-[#8C5CFF]/10"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="admin-password" className="font-sans text-[0.8125rem] font-medium text-foreground">Password</label>
                  <div className="relative">
                    <input
                      id="admin-password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="w-full rounded-xl border border-border bg-background px-4 py-[0.6875rem] pr-12 font-sans text-[0.8125rem] text-foreground placeholder:text-muted outline-none transition-colors focus:border-[#8C5CFF]/60 focus:ring-2 focus:ring-[#8C5CFF]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <ErrorBanner />
                <SubmitButton label="Continue" />
              </form>
            </>
          )}

          {/* ── STEP 2a: First login — TOTP QR setup ──────────────────────── */}
          {step === 'totp-setup' && (
            <>
              <div className="mb-6 text-center">
                <h1 className="font-sans text-[1.25rem] font-bold tracking-tight text-foreground">Set Up Authenticator</h1>
                <p className="mt-1.5 font-sans text-[0.8125rem] text-muted leading-5">
                  Scan this QR code with <strong className="text-foreground">Google Authenticator</strong> or <strong className="text-foreground">Authy</strong>, then enter the 6-digit code to activate MFA on your account.
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
                  <input
                    id="totp-code-setup"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full rounded-xl border border-border bg-background px-4 py-[0.6875rem] font-mono text-[1.125rem] tracking-[0.3em] text-center text-foreground placeholder:text-muted outline-none transition-colors focus:border-[#8C5CFF]/60 focus:ring-2 focus:ring-[#8C5CFF]/10"
                  />
                </div>
                <ErrorBanner />
                <SubmitButton label="Activate MFA & Sign In" />
              </form>
            </>
          )}

          {/* ── STEP 2b: Subsequent logins — TOTP challenge ────────────────── */}
          {step === 'totp-verify' && (
            <>
              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center size-12 rounded-full bg-[#8C5CFF]/10 text-[#8C5CFF] mb-4">
                  <Smartphone size={22} strokeWidth={1.5} />
                </div>
                <h1 className="font-sans text-[1.25rem] font-bold tracking-tight text-foreground">Two-Factor Verification</h1>
                <p className="mt-1.5 font-sans text-[0.8125rem] text-muted leading-5">
                  Enter the 6-digit code from your Authenticator app.
                </p>
              </div>

              <form onSubmit={handleMfaLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="totp-code-verify" className="font-sans text-[0.8125rem] font-medium text-foreground">Authentication code</label>
                  <input
                    id="totp-code-verify"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full rounded-xl border border-border bg-background px-4 py-[0.6875rem] font-mono text-[1.125rem] tracking-[0.3em] text-center text-foreground placeholder:text-muted outline-none transition-colors focus:border-[#8C5CFF]/60 focus:ring-2 focus:ring-[#8C5CFF]/10"
                  />
                </div>
                <ErrorBanner />
                <SubmitButton label="Sign In to Admin Console" />
              </form>

              <button
                type="button"
                onClick={() => { setStep('credentials'); setCode(''); setError(''); }}
                className="mt-4 w-full text-center font-sans text-[0.8125rem] text-muted hover:text-foreground transition-colors"
              >
                ← Use a different account
              </button>
            </>
          )}

          <p className="mt-6 text-center font-sans text-[0.6875rem] text-muted">
            This area is monitored and all access is logged.
          </p>
        </div>

        <p className="mt-5 text-center font-sans text-[0.8125rem] text-muted">
          Not an admin?{' '}
          <a href="/" className="text-[#8C5CFF] font-medium hover:text-[#AC8EF3] transition-colors">
            Return to Canafri
          </a>
        </p>
      </div>
    </div>
  );
}
