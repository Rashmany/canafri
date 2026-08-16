'use client';

import { useState } from 'react';
import { X, Mail, Phone, ChevronDown, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

// ─── Global Country List ──────────────────────────────────────────────────────

export const GLOBAL_COUNTRIES = [
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { code: 'AE', name: 'UAE', dial: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
  { code: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
];

// ─── Shared micro-modal shell ─────────────────────────────────────────────────

function ModalShell({
  title,
  subtitle,
  icon: Icon,
  children,
  onClose,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70"
      aria-modal="true"
      role="dialog"
    >
      <div className="relative w-full max-w-[24.5rem] rounded-[1.25rem] border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 mx-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-full bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X size={15} />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-[#8C5CFF]/15 text-[#8C5CFF] shrink-0">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-sans text-[0.9375rem] font-bold text-foreground">{title}</h3>
            <p className="font-sans text-[0.75rem] text-muted">{subtitle}</p>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

// ─── Shared input ─────────────────────────────────────────────────────────────

function Field({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-sans text-[0.75rem] font-medium text-foreground/80">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-[0.625rem] border border-border bg-background px-3 font-sans text-[0.8125rem] text-foreground placeholder:text-muted/60 outline-none focus:border-[#8C5CFF] focus:ring-1 focus:ring-[#8C5CFF] transition-all"
      />
    </div>
  );
}

// ─── Shared action row ────────────────────────────────────────────────────────

function Actions({
  onCancel,
  onSave,
  saving,
  saveLabel = 'Save',
}: {
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  saveLabel?: string;
}) {
  return (
    <div className="mt-6 flex items-center justify-end gap-2.5">
      <button
        type="button"
        onClick={onCancel}
        className="h-9 rounded-[0.625rem] px-4 font-sans text-[0.75rem] font-semibold text-muted hover:bg-foreground/5 transition-colors cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex h-9 items-center justify-center rounded-[0.625rem] bg-[#8C5CFF] px-4 font-sans text-[0.75rem] font-semibold text-white hover:bg-[#7b46ff] disabled:opacity-50 transition-colors cursor-pointer"
      >
        {saving ? 'Processing...' : saveLabel}
      </button>
    </div>
  );
}

// ─── Change Email Modal (2-Step OTP Verified) ───────────────────────────────────

export function ChangeEmailModal({
  current,
  onClose,
  onSave,
}: {
  current?: string;
  onClose: () => void;
  onSave?: (email: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendOtp = async () => {
    setErrorMsg('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Current password is required to verify identity.');
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch('/api/users/email/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: cleanEmail, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send verification OTP code.');
      }

      setStep('verify');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send verification code.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg('');
    if (code.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit verification code.');
      return;
    }

    setSaving(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await apiFetch('/api/users/email/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: cleanEmail, code: code.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Verification failed. Code may be invalid or expired.');
      }

      // Update stored profile cache
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('canafri_user_profile');
          const p = stored ? JSON.parse(stored) : {};
          p.email = cleanEmail;
          localStorage.setItem('canafri_user_profile', JSON.stringify(p));
        } catch {}
      }

      onSave?.(cleanEmail);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Email verification failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Change Email Address"
      subtitle={step === 'input' ? 'Used for login, security alerts and payouts' : `Enter the 6-digit code sent to ${email}`}
      icon={Mail}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        {current && (
          <div className="rounded-xl bg-background border border-border p-2.5 text-left">
            <span className="font-sans text-[10px] text-muted block uppercase tracking-wider font-semibold">Current Email</span>
            <span className="font-sans text-[11px] font-semibold text-foreground/90">{current}</span>
          </div>
        )}

        {step === 'input' ? (
          <>
            <Field
              id="new-email"
              label="New Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
            />
            <Field
              id="email-password"
              label="Current Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter current password to verify identity"
            />
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="font-sans text-[0.75rem] font-medium text-foreground/80">
              6-Digit Email Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="h-11 w-full text-center tracking-[0.4em] font-mono rounded-[0.625rem] border border-border bg-background px-3 text-[16px] text-foreground outline-none focus:border-[#8C5CFF] focus:ring-1 focus:ring-[#8C5CFF] transition-all"
            />
          </div>
        )}

        {errorMsg && (
          <p className="font-sans text-[11px] text-red-500 font-medium">{errorMsg}</p>
        )}

        <p className="font-sans text-[10px] text-muted">
          {step === 'input'
            ? 'A 6-digit OTP code will be sent to verify your new email address.'
            : 'Dev Mock Code: 123456'}
        </p>
      </div>

      <Actions
        onCancel={onClose}
        onSave={step === 'input' ? handleSendOtp : handleVerifyOtp}
        saving={saving}
        saveLabel={step === 'input' ? 'Send OTP Code' : 'Verify & Save Email'}
      />
    </ModalShell>
  );
}

// ─── Change Phone Modal (Global Selector + SMS OTP) ───────────────────────────

export function ChangePhoneModal({
  current,
  onClose,
  onSave,
}: {
  current?: string;
  onClose: () => void;
  onSave?: (phone: string) => void;
}) {
  const [selectedCountry, setSelectedCountry] = useState(GLOBAL_COUNTRIES[0]); // Default Nigeria (+234)
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSendOtp = async () => {
    setErrorMsg(null);
    const cleanPhone = phone.replace(/[\s-()]/g, '');
    if (cleanPhone.length < 6) {
      setErrorMsg('Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/users/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, phonePrefix: selectedCountry.dial }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send SMS code.');
      setStep('verify');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send SMS OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg(null);
    if (code.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit SMS verification code.');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/[\s-()]/g, '');
      const res = await apiFetch('/api/users/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          phonePrefix: selectedCountry.dial,
          code: code.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid SMS verification code.');

      const fullDisplayPhone = `${selectedCountry.dial} ${cleanPhone}`;

      // Update stored profile cache
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('canafri_user_profile');
          const p = stored ? JSON.parse(stored) : {};
          p.phonePrefix = selectedCountry.dial;
          p.phoneVerified = true;
          localStorage.setItem('canafri_user_profile', JSON.stringify(p));
        } catch {}
      }

      onSave?.(fullDisplayPhone);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      title="Change Phone Number"
      subtitle={step === 'input' ? 'Global SMS OTP verification for account security' : `Enter the 6-digit SMS code sent to ${selectedCountry.dial} ${phone}`}
      icon={Phone}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        {current && (
          <div className="rounded-xl bg-background border border-border p-2.5 text-left">
            <span className="font-sans text-[10px] text-muted block uppercase tracking-wider font-semibold">Current Phone</span>
            <span className="font-sans text-[11px] font-semibold text-foreground/90">{current}</span>
          </div>
        )}

        {step === 'input' ? (
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[0.75rem] font-medium text-foreground/80">
              Input Phone Number
            </label>
            <div className="flex items-center gap-2">
              {/* Country Selector */}
              <div className="relative shrink-0">
                <select
                  value={selectedCountry.code}
                  onChange={(e) => {
                    const found = GLOBAL_COUNTRIES.find((c) => c.code === e.target.value);
                    if (found) setSelectedCountry(found);
                  }}
                  className="h-10 appearance-none rounded-[0.625rem] border border-border bg-background pl-3 pr-7 font-sans text-[12px] font-semibold text-foreground outline-none focus:border-[#8C5CFF] cursor-pointer no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                  {GLOBAL_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.dial} ({c.code})
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-3 text-muted pointer-events-none" />
              </div>

              {/* Local Number Input */}
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="801 234 5678"
                className="h-10 w-full flex-1 rounded-[0.625rem] border border-border bg-background px-3 font-sans text-[0.8125rem] text-foreground placeholder:text-muted/60 outline-none focus:border-[#8C5CFF] focus:ring-1 focus:ring-[#8C5CFF] transition-all"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="font-sans text-[0.75rem] font-medium text-foreground/80">
              6-Digit SMS Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="h-11 w-full text-center tracking-[0.4em] font-mono rounded-[0.625rem] border border-border bg-background px-3 text-[16px] text-foreground outline-none focus:border-[#8C5CFF] focus:ring-1 focus:ring-[#8C5CFF] transition-all"
            />
          </div>
        )}

        {errorMsg && (
          <p className="font-sans text-[11px] text-red-500 font-medium">{errorMsg}</p>
        )}

        <p className="font-sans text-[10px] text-muted">
          {step === 'input'
            ? `SMS code will be sent to ${selectedCountry.dial} ${phone || '...'}`
            : 'Dev Mock Code: 123456'}
        </p>
      </div>

      <Actions
        onCancel={onClose}
        onSave={step === 'input' ? handleSendOtp : handleVerifyOtp}
        saving={loading}
        saveLabel={step === 'input' ? 'Send SMS OTP' : 'Verify & Save Phone'}
      />
    </ModalShell>
  );
}
