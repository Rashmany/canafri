'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface AdminAcceptInvitePageProps {
  token: string;
  onComplete: () => void; // redirect to login after setup
}

const API = 'http://localhost:3001';

type Step = 'validating' | 'setup' | 'done' | 'error';

export default function AdminAcceptInvitePage({ token, onComplete }: AdminAcceptInvitePageProps) {
  const [step, setStep]           = useState<Step>('validating');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole]   = useState('');
  const [errorMsg, setErrorMsg]   = useState('');

  // Form fields
  const [fullName, setFullName]   = useState('');
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [formError, setFormError] = useState('');

  // Validate the token on mount
  useEffect(() => {
    if (!token) { setStep('error'); setErrorMsg('No invite token provided.'); return; }

    fetch(`${API}/auth/admin/invites/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Invalid invite.');
        setInviteEmail(data.invite.email);
        setInviteRole(data.invite.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin');
        setStep('setup');
      })
      .catch((err) => {
        setStep('error');
        setErrorMsg(err.message || 'This invite link is invalid or has expired.');
      });
  }, [token]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/admin/invites/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: fullName.trim(), username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Setup failed.');
      setStep('done');
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // ── Validating spinner ─────────────────────────────────────────────────────
  if (step === 'validating') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="size-7 animate-spin text-[#8C5CFF]" />
          <p className="font-sans text-[0.875rem]">Validating invite…</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-[26rem] rounded-[1.5rem] border border-border bg-card p-8 text-center shadow-2xl shadow-black/10">
          <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <AlertCircle size={22} strokeWidth={1.5} />
          </div>
          <h1 className="font-sans text-[1.25rem] font-bold text-foreground mb-2">Invite Invalid</h1>
          <p className="font-sans text-[0.8125rem] text-muted mb-6 leading-5">{errorMsg}</p>
          <a href="/admin" className="font-sans text-[0.875rem] font-medium text-[#8C5CFF] hover:text-[#AC8EF3] transition-colors">
            Back to Admin Login →
          </a>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-[26rem] rounded-[1.5rem] border border-border bg-card p-8 text-center shadow-2xl shadow-black/10">
          <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 size={22} strokeWidth={1.5} />
          </div>
          <h1 className="font-sans text-[1.25rem] font-bold text-foreground mb-2">Account Created!</h1>
          <p className="font-sans text-[0.8125rem] text-muted mb-6 leading-5">
            Your admin account is ready. Sign in and you will be guided to set up your Authenticator app (MFA) on your first login.
          </p>
          <button
            type="button"
            onClick={onComplete}
            className="w-full rounded-xl bg-[#8C5CFF] px-4 py-[0.8125rem] font-sans text-[0.875rem] font-semibold text-white transition-all hover:bg-[#AC8EF3] active:scale-[0.98] shadow-lg shadow-[#8C5CFF]/25 cursor-pointer"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  // ── Setup Form ─────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12">
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
                Admin Invite Setup
              </span>
            </div>
          </div>

          <div className="mb-7 text-center">
            <h1 className="font-sans text-[1.375rem] font-bold tracking-tight text-foreground">Set Up Your Account</h1>
            <p className="mt-1.5 font-sans text-[0.8125rem] text-muted leading-5">
              You have been invited as <strong className="text-foreground">{inviteRole}</strong>. Your email is{' '}
              <strong className="text-[#8C5CFF]">{inviteEmail}</strong>.
            </p>
          </div>

          <form onSubmit={handleSetup} className="flex flex-col gap-4">
            {/* Full name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="invite-fullname" className="font-sans text-[0.8125rem] font-medium text-foreground">Full name</label>
              <input
                id="invite-fullname"
                type="text"
                autoFocus
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-border bg-background px-4 py-[0.6875rem] font-sans text-[0.8125rem] text-foreground placeholder:text-muted outline-none transition-colors focus:border-[#8C5CFF]/60 focus:ring-2 focus:ring-[#8C5CFF]/10"
              />
            </div>

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="invite-username" className="font-sans text-[0.8125rem] font-medium text-foreground">Username</label>
              <input
                id="invite-username"
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="jane_admin"
                className="w-full rounded-xl border border-border bg-background px-4 py-[0.6875rem] font-sans text-[0.8125rem] text-foreground placeholder:text-muted outline-none transition-colors focus:border-[#8C5CFF]/60 focus:ring-2 focus:ring-[#8C5CFF]/10"
              />
              <span className="font-sans text-[0.6875rem] text-muted">Letters, numbers and underscores only.</span>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="invite-password" className="font-sans text-[0.8125rem] font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  id="invite-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
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

            {/* Error */}
            {formError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                <AlertCircle size={15} className="shrink-0 text-red-500" />
                <p className="font-sans text-[0.8125rem] text-red-500">{formError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#8C5CFF] px-4 py-[0.8125rem] font-sans text-[0.875rem] font-semibold text-white transition-all hover:bg-[#AC8EF3] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#8C5CFF]/25 cursor-pointer"
            >
              {loading ? (
                <><svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating account…</>
              ) : (
                <><ShieldCheck size={16} />Complete Setup</>
              )}
            </button>
          </form>

          <p className="mt-6 text-center font-sans text-[0.6875rem] text-muted">
            After setup, sign in to activate your Authenticator (MFA).
          </p>
        </div>
      </div>
    </div>
  );
}
