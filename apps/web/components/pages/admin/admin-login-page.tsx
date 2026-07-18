'use client';

import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
}

// ─── Hardcoded credentials (replace with API call in production) ──────────────
const ADMIN_EMAIL    = 'admin@canafri.com';
const ADMIN_PASSWORD = 'Admin@2026!';

export default function AdminLoginPage({ onLoginSuccess }: AdminLoginPageProps) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulated auth delay — swap for real API call
    await new Promise(r => setTimeout(r, 900));

    if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('canafri_admin_authed', '1');
      }
      onLoginSuccess();
    } else {
      setError('Invalid admin credentials. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12">
      {/* Background gradient blob */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[40rem] w-[40rem] rounded-full bg-[#8C5CFF]/5 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[40rem] w-[40rem] rounded-full bg-[#8C5CFF]/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[26rem]">
        {/* Card */}
        <div className="rounded-[1.5rem] border border-border bg-card p-8 shadow-2xl shadow-black/10">

          {/* Logo + Admin badge */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <Logo />
            <div className="flex items-center gap-2 rounded-full border border-[#8C5CFF]/20 bg-[#8C5CFF]/5 px-4 py-1.5">
              <ShieldCheck size={14} className="text-[#8C5CFF]" strokeWidth={2} />
              <span className="font-sans text-[0.6875rem] font-semibold uppercase tracking-widest text-[#8C5CFF]">
                Admin Console
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-7 text-center">
            <h1 className="font-sans text-[1.5rem] font-bold tracking-tight text-foreground">
              Admin Sign In
            </h1>
            <p className="mt-1 font-sans text-[0.8125rem] text-muted">
              Restricted access — authorised personnel only
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-email" className="font-sans text-[0.8125rem] font-medium text-foreground">
                Email address
              </label>
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

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-password" className="font-sans text-[0.8125rem] font-medium text-foreground">
                Password
              </label>
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

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                <AlertCircle size={15} className="shrink-0 text-red-500" />
                <p className="font-sans text-[0.8125rem] text-red-500">{error}</p>
              </div>
            )}

            {/* Submit */}
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
                  Authenticating…
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Sign In to Admin Console
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-6 text-center font-sans text-[0.6875rem] text-muted">
            This area is monitored and all access is logged.
          </p>
        </div>

        {/* Back link */}
        <p className="mt-5 text-center font-sans text-[0.8125rem] text-muted">
          Not an admin?{' '}
          <a
            href="/"
            className="text-[#8C5CFF] font-medium hover:text-[#AC8EF3] transition-colors"
          >
            Return to Canafri
          </a>
        </p>
      </div>
    </div>
  );
}
