'use client';

import { useState } from 'react';
import { X, Mail, Phone } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

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
      <div className="relative w-full max-w-[24rem] rounded-[1.25rem] border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-full bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X size={15} />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-[#8C5CFF]/15 text-[#8C5CFF]">
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
        className="h-9 rounded-[0.625rem] px-4 font-sans text-[0.75rem] font-semibold text-muted hover:bg-foreground/5 transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex h-9 items-center justify-center rounded-[0.625rem] bg-[#8C5CFF] px-4 font-sans text-[0.75rem] font-semibold text-white hover:bg-[#7b46ff] disabled:opacity-50 transition-colors"
      >
        {saving ? 'Processing...' : saveLabel}
      </button>
    </div>
  );
}

// ─── Change Email Modal ───────────────────────────────────────────────────────

export function ChangeEmailModal({
  current,
  onClose,
  onSave,
}: {
  current?: string;
  onClose: () => void;
  onSave?: (email: string) => void;
}) {
  const [email, setEmail] = useState(current ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    onSave?.(email);
    setSaving(false);
    onClose();
  };

  return (
    <ModalShell
      title="Change Email Address"
      subtitle="Used for login and notifications"
      icon={Mail}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <Field
          id="new-email"
          label="New Email Address"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
        />
        <p className="font-sans text-[10px] text-muted">
          A confirmation link will be sent to verify your new address.
        </p>
      </div>
      <Actions onCancel={onClose} onSave={handleSave} saving={saving} />
    </ModalShell>
  );
}

// ─── Change Phone Modal ───────────────────────────────────────────────────────

export function ChangePhoneModal({
  current,
  onClose,
  onSave,
}: {
  current?: string;
  onClose: () => void;
  onSave?: (phone: string) => void;
}) {
  const [phone, setPhone] = useState(current ?? '');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSendOtp = async () => {
    setErrorMsg(null);
    const cleanPhone = phone.replace(/[\s-()]/g, '');
    if (cleanPhone.length < 7) {
      setErrorMsg('Please enter a valid phone number.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP.');
      setStep('verify');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg(null);
    if (code.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit OTP code.');
      return;
    }
    setLoading(true);
    try {
      const cleanPhone = phone.replace(/[\s-()]/g, '');
      const res = await apiFetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid verification code.');

      onSave?.(phone);
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
      subtitle={step === 'input' ? 'Used for OTP and account security' : 'Enter the 6-digit SMS code sent to your phone'}
      icon={Phone}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        {step === 'input' ? (
          <Field
            id="new-phone"
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={setPhone}
            placeholder="+234 800 000 0000"
          />
        ) : (
          <Field
            id="otp-code"
            label="6-Digit OTP Code"
            type="text"
            value={code}
            onChange={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="123456"
          />
        )}

        {errorMsg && (
          <p className="font-sans text-[11px] text-red-500">{errorMsg}</p>
        )}

        <p className="font-sans text-[10px] text-muted">
          {step === 'input'
            ? 'An SMS OTP will be sent to verify your phone number.'
            : 'Dev Mock Code: 123456'}
        </p>
      </div>

      <Actions
        onCancel={onClose}
        onSave={step === 'input' ? handleSendOtp : handleVerifyOtp}
        saving={loading}
        saveLabel={step === 'input' ? 'Send OTP' : 'Verify & Save'}
      />
    </ModalShell>
  );
}
