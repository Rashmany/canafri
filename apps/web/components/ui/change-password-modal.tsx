'use client';

import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordModalProps {
  onClose: () => void;
  onSave?: () => Promise<void> | void;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
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
          placeholder={placeholder}
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

export default function ChangePasswordModal({ onClose, onSave }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isTooShort = newPassword.length > 0 && newPassword.length < 8;
  const isMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleUpdate = async () => {
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setErrorMsg('');
    setSaving(true);
    try {
      if (onSave) {
        await onSave();
      } else {
        await new Promise((r) => setTimeout(r, 800));
      }
      onClose();
    } catch (e) {
      setErrorMsg('Failed to update password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative mx-4 w-full max-w-[26.063rem] rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-[0.375rem]">
            <p className="font-sans text-[13px] font-medium text-foreground">Change Password</p>
            <p className="font-sans text-[10px] text-muted">Update your account password</p>
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

        {/* Form Body */}
        <div className="flex flex-col gap-4">
          <PasswordField
            id="current-password"
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="••••••••"
          />

          <PasswordField
            id="new-password"
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="••••••••"
            error={isTooShort}
          />
          {isTooShort && (
            <p className="font-sans text-[10px] text-[#ff6b6b]">Min. 8 characters</p>
          )}

          <PasswordField
            id="confirm-password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="••••••••"
            error={isMismatch}
          />
          {isMismatch && (
            <p className="font-sans text-[10px] text-[#ff6b6b]">Passwords do not match</p>
          )}

          {errorMsg && (
            <p className="font-sans text-[11px] text-[#ff6b6b] text-center">{errorMsg}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
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
            disabled={saving || !currentPassword || isTooShort || isMismatch}
            className="flex-1 rounded-xl bg-[#8C5CFF] py-2.5 font-sans text-[13px] font-semibold text-white hover:bg-[#AC8EF3] disabled:opacity-60 transition-colors"
          >
            {saving ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </div>
    </div>
  );
}
