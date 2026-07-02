'use client';

import { useState } from 'react';
import { X, Mail, Phone } from 'lucide-react';

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
      <div
        className="relative mx-4 w-full max-w-[22rem] rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#8C5CFF]/15">
              <Icon size={17} className="text-[#8C5CFF]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="font-sans text-[13px] font-semibold text-foreground">{title}</p>
              <p className="font-sans text-[10px] text-muted">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-foreground/40 hover:bg-foreground/10 hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X size={15} />
          </button>
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
      <label htmlFor={id} className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 font-sans text-[13px] text-foreground placeholder:text-foreground/30 outline-none transition focus:border-[#8C5CFF] focus:ring-1 focus:ring-[#8C5CFF]"
      />
    </div>
  );
}

// ─── Shared action row ────────────────────────────────────────────────────────

function Actions({ onCancel, onSave, saving }: { onCancel: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 rounded-xl border border-border bg-transparent py-2.5 font-sans text-[13px] font-semibold text-foreground/70 hover:bg-foreground/5 hover:text-foreground transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex-1 rounded-xl bg-[#8C5CFF] py-2.5 font-sans text-[13px] font-semibold text-white hover:bg-[#AC8EF3] disabled:opacity-60 transition-colors"
      >
        {saving ? 'Saving…' : 'Save'}
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
  const [confirm, setConfirm] = useState('');
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
      title="Change Email"
      subtitle="Update your login email address"
      icon={Mail}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <Field
          id="new-email"
          label="New Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
        />
        <Field
          id="confirm-email"
          label="Confirm Email"
          type="email"
          value={confirm}
          onChange={setConfirm}
          placeholder="you@example.com"
        />
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
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    onSave?.(phone);
    setSaving(false);
    onClose();
  };

  return (
    <ModalShell
      title="Change Phone Number"
      subtitle="Used for OTP and account security"
      icon={Phone}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <Field
          id="new-phone"
          label="Phone Number"
          type="tel"
          value={phone}
          onChange={setPhone}
          placeholder="+234 800 000 0000"
        />
        <p className="font-sans text-[10px] text-muted">
          An OTP will be sent to verify your new number.
        </p>
      </div>
      <Actions onCancel={onClose} onSave={handleSave} saving={saving} />
    </ModalShell>
  );
}
