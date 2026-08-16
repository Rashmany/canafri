'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Camera, X, AlertCircle, Clock } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonalInfoModalProps {
  /** User data pre-filled in the form */
  user?: {
    name: string;
    username: string;
    avatarSrc?: string;
    memberSince?: string;
    bio?: string;
  };
  isSellerMode?: boolean;
  /** Called when the user presses Cancel or the ✕ close button */
  onClose: () => void;
  /** Called when the user submits the updated data */
  onSave?: (data: { name: string; username: string; bio: string }) => void;
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const clean = name.replace(/^@/, '').trim();
  if (!clean) return 'U';
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

// ─── Form row ─────────────────────────────────────────────────────────────────

function FormField({
  label,
  id,
  value,
  onChange,
  placeholder,
  multiline = false,
  subtitle,
  badgeText,
  maxLength,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  subtitle?: string;
  badgeText?: string;
  maxLength?: number;
}) {
  const base =
    'w-full rounded-xl border border-border bg-background px-4 py-3 font-sans text-[13px] text-foreground placeholder:text-foreground/30 outline-none transition focus:border-[#8C5CFF] focus:ring-1 focus:ring-[#8C5CFF] resize-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

  const atLimit = maxLength !== undefined && value.length >= maxLength;
  const nearLimit = maxLength !== undefined && value.length >= maxLength * 0.85;

  const handleChange = (v: string) => {
    if (maxLength !== undefined && v.length > maxLength) return;
    onChange(v);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label htmlFor={id} className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {badgeText && (
            <span className="flex items-center gap-1 font-sans text-[10px] text-amber-400 font-medium">
              <Clock size={11} />
              {badgeText}
            </span>
          )}
          {maxLength !== undefined && (
            <span className={`font-sans text-[10px] font-semibold tabular-nums ${
              atLimit ? 'text-red-400' : nearLimit ? 'text-amber-400' : 'text-muted'
            }`}>
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      </div>
      {multiline ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className={`${base}${atLimit ? ' border-red-400/60' : ''}`}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      )}
      {subtitle && (
        <p className="font-sans text-[10px] text-muted">{subtitle}</p>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function PersonalInfoModal({
  user = { name: '', username: '', memberSince: 'April 2026' },
  isSellerMode = false,
  onClose,
  onSave,
}: PersonalInfoModalProps) {
  const { toast } = useToast();
  const [name, setName]         = useState(user.name || '');
  const [username, setUsername] = useState((user.username || '').replace('@', ''));
  const [bio, setBio]           = useState(user.bio || '');
  const [saving, setSaving]     = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarSrc ?? null);
  const [displayNameLastEditedAt, setDisplayNameLastEditedAt] = useState<string | null>(null);
  const [usernameLastEditedAt, setUsernameLastEditedAt]       = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch real profile data on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch('/api/users/me');
        const data = await res.json().catch(() => ({}));
        if (mounted && res.ok && data?.user) {
          const u = data.user;
          setName(u.displayName || u.name || '');
          setUsername((u.username || '').replace('@', ''));
          
          // Dual bio handling according to mode
          if (isSellerMode) {
            setBio(data.sellerAppData?.headline || data.sellerAppData?.skillsBio || u.bio || '');
          } else {
            setBio(u.bio || '');
          }

          if (u.avatarUrl) setAvatarPreview(u.avatarUrl);
          if (u.displayNameLastEditedAt) setDisplayNameLastEditedAt(u.displayNameLastEditedAt);
          if (u.usernameLastEditedAt) setUsernameLastEditedAt(u.usernameLastEditedAt);
        }
      } catch {
        // Fall back to props
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isSellerMode]);

  // Calculate remaining cooldown days for Display Name (60 days)
  const displayNameCooldownDays = (() => {
    if (!displayNameLastEditedAt) return 0;
    const daysSince = (Date.now() - new Date(displayNameLastEditedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince < 60 ? Math.ceil(60 - daysSince) : 0;
  })();

  // Calculate remaining cooldown days for Username (30 days)
  const usernameCooldownDays = (() => {
    if (!usernameLastEditedAt) return 0;
    const daysSince = (Date.now() - new Date(usernameLastEditedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince < 30 ? Math.ceil(30 - daysSince) : 0;
  })();

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
    setErrorMsg('');
    setSaving(true);
    try {
      const res = await apiFetch('/api/users/me/identity', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: name.trim(),
          username: username.trim(),
          bio: bio.trim(),
          avatarUrl: avatarPreview,
          isSellerMode,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update personal information.');
      }

      toast('Personal profile updated successfully', 'success');

      // Update local storage profile cache
      if (typeof window !== 'undefined' && data.user) {
        try {
          const stored = localStorage.getItem('canafri_user_profile');
          const p = stored ? JSON.parse(stored) : {};
          p.displayName = data.user.displayName;
          p.username = data.user.username;
          p.bio = data.user.bio;
          p.avatarUrl = data.user.avatarUrl;
          localStorage.setItem('canafri_user_profile', JSON.stringify(p));
        } catch {}
      }

      onSave?.({ name: data.user?.displayName || name, username: `@${data.user?.username || username}`, bio });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
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
              {isSellerMode ? 'Freelancer Profile Information' : 'Personal Information'}
            </p>
            <p className="font-sans text-[10px] text-muted">
              {isSellerMode ? 'Update your professional freelancer headline, handle and bio' : 'Update your name, username and bio'}
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
                {avatarPreview && avatarPreview.trim() && !avatarPreview.includes('default-avatar') ? (
                  <Image
                    src={avatarPreview}
                    alt={user.name}
                    fill
                    sizes="96px"
                    className="object-cover object-center"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#8C5CFF]/35 to-[#8C5CFF]/15 font-sans text-2xl font-bold text-[#AC8EF3] uppercase tracking-wider select-none">
                    {getInitials(name || username || user.name || 'User')}
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

          {/* ── Error Banner ── */}
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/25 p-3 text-red-400 font-sans text-[11px]">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── Form fields ── */}
          <div className="flex flex-col gap-4">
            <FormField
              id="personal-info-name"
              label="Display Name"
              value={name}
              onChange={setName}
              placeholder="Your full name"
              subtitle={
                displayNameCooldownDays > 0
                  ? `Next edit available in ${displayNameCooldownDays} day(s).`
                  : 'Can be updated once every 60 days.'
              }
              badgeText={displayNameCooldownDays > 0 ? `${displayNameCooldownDays}d cooldown` : undefined}
            />
            <FormField
              id="personal-info-username"
              label="Username"
              value={username}
              onChange={setUsername}
              placeholder="yourhandle"
              subtitle={
                usernameCooldownDays > 0
                  ? `Next edit available in ${usernameCooldownDays} day(s).`
                  : 'Can be updated once every 30 days.'
              }
              badgeText={usernameCooldownDays > 0 ? `${usernameCooldownDays}d cooldown` : undefined}
            />
            <FormField
              id="personal-info-bio"
              label={isSellerMode ? 'Freelancer Bio / Headline' : 'Personal Bio'}
              value={bio}
              onChange={setBio}
              placeholder={
                isSellerMode
                  ? 'Highlight your professional freelance skills, services, and experience…'
                  : 'Tell the community a little about yourself…'
              }
              maxLength={isSellerMode ? undefined : 160}
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
