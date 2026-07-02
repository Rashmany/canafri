'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonalInfoModalProps {
  /** User data pre-filled in the form */
  user?: {
    name: string;
    username: string;
    avatarSrc?: string;
    memberSince?: string;
  };
  /** Called when the user presses Cancel or the ✕ close button */
  onClose: () => void;
  /** Called when the user submits the updated data */
  onSave?: (data: { name: string; username: string; bio: string }) => void;
}

const DEFAULT_AVATAR = '/images/default-avatar.png';

// ─── Form row ─────────────────────────────────────────────────────────────────

function FormField({
  label,
  id,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const base =
    'w-full rounded-xl border border-border bg-background px-4 py-3 font-sans text-[13px] text-foreground placeholder:text-foreground/30 outline-none transition focus:border-[#8C5CFF] focus:ring-1 focus:ring-[#8C5CFF] resize-none';

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

/**
 * PersonalInfoModal — Overlay dialog for editing name, username, and bio.
 *
 * - Backdrop is **non-dismissable** on click (user must use the ✕ or Cancel).
 * - Centred in the viewport using `fixed` positioning.
 *
 * Import path: `@/components/ui/personal-info-modal`
 */
export default function PersonalInfoModal({
  user = { name: 'John Trek', username: '@johntrek', memberSince: 'April 2026' },
  onClose,
  onSave,
}: PersonalInfoModalProps) {
  const [name, setName]         = useState(user.name);
  const [username, setUsername] = useState(user.username.replace('@', ''));
  const [bio, setBio]           = useState('');
  const [saving, setSaving]     = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarSrc ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    onSave?.({ name, username: `@${username}`, bio });
    setSaving(false);
    onClose();
  };

  return (
    // Fixed full-screen backdrop — pointer-events on the backdrop do nothing
    // so the modal cannot be dismissed by clicking beside it.
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70"
      aria-modal="true"
      role="dialog"
      aria-labelledby="personal-info-modal-title"
    >
      {/* Modal card */}
      <div
        className="relative flex w-full max-w-[26.063rem] flex-col overflow-y-auto no-scrollbar rounded-2xl border border-border bg-card shadow-2xl mx-4 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Sticky header ── */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-card px-[1rem] pt-[1.5rem] pb-3">
          <div className="flex flex-col gap-[0.375rem]">
            <p
              id="personal-info-modal-title"
              className="font-sans text-[13px] font-medium text-foreground"
            >
              Personal Information
            </p>
            <p className="font-sans text-[10px] text-muted">
              Update your name, username and bio
            </p>
          </div>

          {/* ✕ Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close personal info dialog"
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5CFF]"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex flex-col gap-[1rem] px-[1rem] pb-[1.5rem] pt-4">

          {/* Avatar — clickable to upload, with remove badge */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />

              {/* Clickable avatar circle */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex size-[6rem] items-center justify-center overflow-hidden rounded-full border-2 border-border shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5CFF]"
                aria-label="Upload profile picture"
              >
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt={user.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-background">
                    <Camera size={24} className="text-foreground/40" />
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera size={20} className="text-foreground" />
                </div>
              </button>

              {/* Remove badge — only shown when a photo is set */}
              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  aria-label="Remove profile picture"
                  className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-white shadow transition-colors hover:bg-red-600"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          </div>

          {/* ── User identity preview ── */}
          <section className="flex flex-col items-center gap-[0.2rem] text-center">
            <h1 className="font-sans text-[1rem] font-bold text-foreground leading-tight">
              {user.name}
            </h1>
            <p className="font-sans text-[0.625rem] text-muted">@{user.username.replace('@', '')}</p>
            <p className="font-sans text-[0.625rem] text-muted">member since {user.memberSince ?? 'April 2026'}</p>
          </section>

          {/* ── Form fields ── */}
          <div className="flex flex-col gap-4">
            <FormField
              id="personal-info-name"
              label="Display Name"
              value={name}
              onChange={setName}
              placeholder="Your full name"
            />
            <FormField
              id="personal-info-username"
              label="Username"
              value={username}
              onChange={setUsername}
              placeholder="yourhandle"
            />
            <FormField
              id="personal-info-bio"
              label="Bio"
              value={bio}
              onChange={setBio}
              placeholder="Tell the world a little about yourself…"
              multiline
            />
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border bg-transparent py-2.5 font-sans text-[13px] font-semibold text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-[#8C5CFF] py-2.5 font-sans text-[13px] font-semibold text-white transition-colors hover:bg-[#AC8EF3] disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>

        </div>
        {/* end scrollable body */}
      </div>
      {/* end modal card */}
    </div>
  );
}
