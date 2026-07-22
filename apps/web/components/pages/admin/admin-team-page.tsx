'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  UserPlus,
  Check,
  X,
  Shield,
  Mail,
  Clock,
  Edit2,
  Trash2,
  Ban,
  MoreHorizontal,
  Copy,
  CheckCircle2,
  Link2,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

type AdminRole = 'Super Admin' | 'Content Admin' | 'Finance Admin' | 'Support Admin';
type AdminStatus = 'Online' | 'Offline' | 'Invite Pending' | 'Revoked';

interface AdminMember {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  scope: string;
  status: AdminStatus;
  isSelf?: boolean;
  joinedAt: Date;
  lastActive?: Date;
}

// ─── Permissions Matrix ─────────────────────────────────────────────────────

const PERMISSIONS: Record<string, Record<AdminRole, boolean>> = {
  'User management':      { 'Super Admin': true,  'Content Admin': false, 'Finance Admin': false, 'Support Admin': true  },
  'Content review':       { 'Super Admin': true,  'Content Admin': true,  'Finance Admin': false, 'Support Admin': false },
  'Dispute resolution':   { 'Super Admin': true,  'Content Admin': false, 'Finance Admin': false, 'Support Admin': true  },
  'Treasury withdrawal':  { 'Super Admin': true,  'Content Admin': false, 'Finance Admin': true,  'Support Admin': false },
  'Platform config':      { 'Super Admin': true,  'Content Admin': false, 'Finance Admin': false, 'Support Admin': false },
  'Invite / remove admins':{ 'Super Admin': true, 'Content Admin': false, 'Finance Admin': false, 'Support Admin': false },
};

const ROLE_SCOPES: Record<AdminRole, string> = {
  'Super Admin':    'Primary Signal',
  'Content Admin':  'Review Queue, Creators',
  'Finance Admin':  'Treasury, Analytics',
  'Support Admin':  'Users, Disputes',
};

const ROLE_COLORS: Record<AdminRole, string> = {
  'Super Admin':    'bg-[#8C5CFF] text-white',
  'Content Admin':  'bg-[#8C5CFF] text-white',
  'Finance Admin':  'bg-[#8C5CFF] text-white',
  'Support Admin':  'bg-[#8C5CFF] text-white',
};

// ─── API base ──────────────────────────────────────────────────────────────

const API = 'http://localhost:3001';

// ─── Helpers ───────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name === 'You' ? 'ME' : name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Avatar ────────────────────────────────────────────────────────────────

function AdminAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'size-8 text-[10px]' : 'size-11 text-[12px]';
  const colors = ['bg-purple-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-pink-600'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`flex-shrink-0 ${sizeClass} rounded-full ${color} flex items-center justify-center font-semibold text-white`}>
      {getInitials(name)}
    </div>
  );
}

// ─── Role Badge ────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: AdminRole }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${ROLE_COLORS[role]}`}>
      {role}
    </span>
  );
}

// ─── Status Dot ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AdminStatus }) {
  if (status === 'Online') return (
    <div className="flex items-center gap-1.5">
      <span className="size-1.5 rounded-full bg-emerald-400" />
      <span className="text-[13px] font-medium text-emerald-400">Online</span>
    </div>
  );
  if (status === 'Invite Pending') return (
    <div className="flex items-center gap-1.5">
      <Clock className="size-3 text-amber-400" />
      <span className="text-[13px] font-medium text-amber-400">Invite Pending</span>
    </div>
  );
  if (status === 'Revoked') return (
    <div className="flex items-center gap-1.5">
      <span className="size-1.5 rounded-full bg-red-500" />
      <span className="text-[13px] font-medium text-red-500">Revoked</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1.5">
      <span className="size-1.5 rounded-full bg-muted-foreground" />
      <span className="text-[13px] font-medium text-muted-foreground">Offline</span>
    </div>
  );
}

// ─── Revoke Reason Modal ───────────────────────────────────────────────────

function RevokeReasonModal({
  member,
  onClose,
  onConfirm,
}: {
  member: AdminMember;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for deactivation.');
      return;
    }
    onConfirm(reason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-foreground">Revoke Admin Access</h2>
          <button type="button" onClick={onClose} className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-border/40 hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>
        
        <p className="text-[13px] text-muted-foreground">
          Are you sure you want to deactivate <strong className="text-foreground">{member.name}</strong>? They will be signed out immediately and blocked from logging in.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-muted-foreground">Reason for Revocation</label>
            <textarea
              autoFocus
              value={reason}
              onChange={e => { setReason(e.target.value); setError(''); }}
              placeholder="e.g. Contract ended, Policy violation, Offboarding"
              rows={3}
              className="w-full bg-background border border-border rounded-[10px] px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none resize-none focus:border-[#8C5CFF]/60"
            />
            {error && <span className="text-[11px] text-red-400">{error}</span>}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-[13px] font-medium text-foreground/70 bg-background border border-border rounded-[10px] hover:bg-border/40 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-red-500 rounded-[10px] hover:bg-red-600 transition-colors">
              Revoke Access
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Invite Link Modal ─────────────────────────────────────────────────────

function InviteLinkModal({ link, onClose }: { link: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="size-4 text-[#8C5CFF]" />
            <h2 className="text-[15px] font-semibold text-foreground">Invite Link Ready</h2>
          </div>
          <button type="button" onClick={onClose} className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-border/40 hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <p className="text-[12px] text-muted-foreground">
          Share this link with the invited admin. It expires in <strong className="text-foreground">48 hours</strong>.
        </p>

        <div className="flex items-center gap-2 bg-background border border-border rounded-[10px] px-3 py-2.5">
          <span className="flex-1 font-mono text-[11px] text-foreground/80 truncate">{link}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium bg-[#8C5CFF]/10 hover:bg-[#8C5CFF]/20 text-[#8C5CFF] rounded-lg transition-colors"
          >
            {copied ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <button type="button" onClick={onClose} className="w-full px-4 py-2.5 text-[13px] font-medium text-foreground bg-background border border-border rounded-[10px] hover:bg-border/40 transition-colors">
          Done
        </button>
      </div>
    </div>
  );
}

// ─── Invite Modal ──────────────────────────────────────────────────────────

function InviteModal({ onClose, onInvite }: {
  onClose: () => void;
  onInvite: (email: string, role: AdminRole) => Promise<string>; // returns invite link
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('Content Admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const roles: AdminRole[] = ['Content Admin', 'Finance Admin', 'Support Admin'];

  const ROLE_TO_API: Record<AdminRole, string> = {
    'Super Admin':   'SUPER_ADMIN',
    'Content Admin': 'ADMIN',
    'Finance Admin': 'ADMIN',
    'Support Admin': 'ADMIN',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) { setError('Enter a valid email address.'); return; }
    setLoading(true);
    setError('');
    try {
      const link = await onInvite(email.trim(), role);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send invite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="size-4 text-[#8C5CFF]" />
            <h2 className="text-[15px] font-semibold text-foreground">Invite Admin Member</h2>
          </div>
          <button type="button" onClick={onClose} className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-border/40 hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-muted-foreground">Email address</label>
            <div className="flex items-center gap-2 bg-background border border-border rounded-[10px] px-3 py-2.5">
              <Mail className="size-3.5 text-muted-foreground shrink-0" />
              <input
                autoFocus
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="admin@example.io"
                className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none"
              />
            </div>
            {error && <span className="text-[11px] text-red-400">{error}</span>}
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-muted-foreground">Assign Role</label>
            <div className="flex flex-col gap-2">
              {roles.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex items-start gap-3 p-3 rounded-[10px] border text-left transition-colors ${
                    role === r ? 'border-[#8C5CFF]/60 bg-[#8C5CFF]/5' : 'border-border bg-background hover:bg-border/20'
                  }`}
                >
                  <div className={`flex-shrink-0 size-4 mt-0.5 rounded-full border-2 flex items-center justify-center ${role === r ? 'border-[#8C5CFF]' : 'border-border'}`}>
                    {role === r && <span className="size-2 rounded-full bg-[#8C5CFF]" />}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-medium text-foreground">{r}</span>
                    <span className="text-[11px] text-muted-foreground">Scope: {ROLE_SCOPES[r]}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-[13px] font-medium text-foreground/70 bg-background border border-border rounded-[10px] hover:bg-border/40 transition-colors">
              Cancel
            </button>
          <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-[#8C5CFF] rounded-[10px] hover:bg-[#7A4AEE] disabled:opacity-60 transition-colors">
            {loading ? 'Sending…' : 'Send Invite'}
          </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Role mappers ────────────────────────────────────────────────────────────

function mapRoleToDisplay(role: string): AdminRole {
  if (role === 'SUPER_ADMIN') return 'Super Admin';
  if (role === 'FINANCE_ADMIN') return 'Finance Admin';
  if (role === 'SUPPORT_ADMIN') return 'Support Admin';
  return 'Content Admin';
}

function mapDisplayToApiRole(role: AdminRole): string {
  if (role === 'Super Admin') return 'SUPER_ADMIN';
  if (role === 'Finance Admin') return 'FINANCE_ADMIN';
  if (role === 'Support Admin') return 'SUPPORT_ADMIN';
  return 'CONTENT_ADMIN';
}

// ─── Edit Role Modal ────────────────────────────────────────────────────────

function EditRoleModal({ member, onClose, onSave }: {
  member: AdminMember;
  onClose: () => void;
  onSave: (id: string, role: AdminRole) => void;
}) {
  const roles: AdminRole[] = ['Content Admin', 'Finance Admin', 'Support Admin', 'Super Admin'];
  const [selected, setSelected] = useState<AdminRole>(member.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit2 className="size-4 text-[#8C5CFF]" />
            <h2 className="text-[15px] font-semibold text-foreground">Edit Role</h2>
          </div>
          <button type="button" onClick={onClose} className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-border/40 hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 bg-background border border-border rounded-[10px]">
          <AdminAvatar name={member.name} size="sm" />
          <div>
            <p className="text-[13px] font-medium text-foreground">{member.name}</p>
            <p className="text-[11px] text-muted-foreground">{member.email}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto no-scrollbar">
          {roles.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setSelected(r)}
              className={`flex items-center gap-3 p-3 rounded-[10px] border text-left transition-colors ${
                selected === r ? 'border-[#8C5CFF]/60 bg-[#8C5CFF]/5' : 'border-border bg-background hover:bg-border/20'
              }`}
            >
              <div className={`flex-shrink-0 size-4 rounded-full border-2 flex items-center justify-center ${selected === r ? 'border-[#8C5CFF]' : 'border-border'}`}>
                {selected === r && <span className="size-2 rounded-full bg-[#8C5CFF]" />}
              </div>
              <div>
                <p className="text-[13px] font-medium text-foreground">{r}</p>
                <p className="text-[11px] text-muted-foreground">{ROLE_SCOPES[r]}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-[13px] font-medium text-foreground/70 bg-background border border-border rounded-[10px] hover:bg-border/40 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={() => { onSave(member.id, selected); onClose(); }} className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-[#8C5CFF] rounded-[10px] hover:bg-[#7A4AEE] transition-colors">
            Save Role
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Modal ──────────────────────────────────────────────────────────

function ConfirmModal({ title, description, confirmLabel, confirmClass, onClose, onConfirm }: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
          <button type="button" onClick={onClose} className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-border/40 hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>
        <p className="text-[13px] text-muted-foreground">{description}</p>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-[13px] font-medium text-foreground/70 bg-background border border-border rounded-[10px] hover:bg-border/40 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={() => { onConfirm(); onClose(); }} className={`flex-1 px-4 py-2.5 text-[13px] font-semibold text-white rounded-[10px] transition-colors ${confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 shadow-2xl">
      <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
      <span className="text-[13px] font-medium text-foreground">{message}</span>
    </div>
  );
}

// ─── Member Row ─────────────────────────────────────────────────────────────

function MemberRow({
  member,
  isSuperAdmin,
  onEdit,
  onRemove,
  onRevoke,
  onReactivate,
}: {
  member: AdminMember;
  isSuperAdmin: boolean;
  onEdit: (m: AdminMember) => void;
  onRemove: (m: AdminMember) => void;
  onRevoke: (m: AdminMember) => void;
  onReactivate: (m: AdminMember) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  const isPending = member.status === 'Invite Pending';

  return (
    <div className="flex items-center px-6 h-[80px] border-b border-border/40 last:border-0 bg-card hover:bg-background/20 transition-colors">
      {/* Admin Profile */}
      <div className="flex-[2] min-w-0 flex items-center gap-3">
        <AdminAvatar name={member.name} />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[14px] font-medium text-foreground truncate">{member.name}</span>
          <span className="text-[12px] text-muted-foreground truncate">{member.email}</span>
        </div>
      </div>

      {/* Role */}
      <div className="w-[150px] shrink-0 flex items-center">
        <RoleBadge role={member.role} />
      </div>

      {/* Scope */}
      <div className="flex-[2] min-w-0 flex items-center pr-4">
        <span className="text-[13px] font-medium text-muted-foreground truncate">{member.scope}</span>
      </div>

      {/* Status */}
      <div className="w-[120px] shrink-0 flex items-center">
        <StatusBadge status={member.status} />
      </div>

      {/* Actions */}
      <div className="w-[180px] shrink-0 flex items-center justify-end gap-2">
        {member.isSelf ? (
          <span className="text-[11px] text-muted-foreground italic px-3">—</span>
        ) : isSuperAdmin ? (
          <>
            {member.status === 'Revoked' ? (
              <button
                type="button"
                onClick={() => onReactivate(member)}
                className="px-3 py-1.5 text-[12px] font-semibold text-white bg-emerald-500 rounded-[8px] hover:bg-emerald-600 transition-colors"
              >
                Reactivate
              </button>
            ) : (
              <>
                {!isPending && (
                  <button
                    type="button"
                    onClick={() => onEdit(member)}
                    className="px-3 py-1.5 text-[12px] font-semibold text-foreground bg-background border border-border rounded-[8px] hover:bg-border/40 transition-colors"
                  >
                    Edit
                  </button>
                )}
                {isPending && (
                  <div className="px-3 py-1.5 text-[12px] font-semibold text-muted-foreground/80 bg-background border border-border rounded-[8px]">
                    Pending
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => isPending ? onRevoke(member) : onRemove(member)}
                  className="px-3 py-1.5 text-[12px] font-semibold text-white bg-red-400 rounded-[8px] hover:bg-red-500 transition-colors"
                >
                  {isPending ? 'Revoke' : 'Remove'}
                </button>
              </>
            )}
          </>
        ) : (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(v => !v)}
              className="flex size-8 items-center justify-center rounded-[8px] bg-background border border-border text-foreground/70 hover:bg-border/40 hover:text-foreground transition-colors"
            >
              <MoreHorizontal className="size-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-[160px] bg-card border border-border rounded-xl shadow-xl overflow-hidden py-1">
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(member.email); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-foreground/80 hover:bg-foreground/5 hover:text-foreground text-left"
                >
                  <Copy className="size-3.5 shrink-0" /> Copy email
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Permissions Table ──────────────────────────────────────────────────────

function PermissionsMatrix() {
  const roles: AdminRole[] = ['Super Admin', 'Content Admin', 'Finance Admin', 'Support Admin'];
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-6 py-5 border-b border-border bg-card">
        <div className="flex-1">
          <span className="text-[13px] font-medium text-foreground">Role Permissions Matrix</span>
        </div>
        <div className="flex gap-0 w-[440px]">
          {roles.map(r => (
            <div key={r} className="flex-1 text-center">
              <span className="text-[10px] font-normal text-foreground/80 whitespace-nowrap">
                {r.replace(' Admin', '')}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Rows */}
      {Object.entries(PERMISSIONS).map(([perm, roleMap], i) => (
        <div key={perm} className={`flex items-center px-6 h-[70px] border-b border-border/60 last:border-0 ${i % 2 === 1 ? 'bg-background/30' : 'bg-card'}`}>
          <div className="flex-1">
            <span className="text-[13px] font-medium text-foreground/80">{perm}</span>
          </div>
          <div className="flex gap-0 w-[440px]">
            {roles.map(r => (
              <div key={r} className="flex-1 flex items-center justify-center">
                {roleMap[r] ? (
                  <Check className="size-4 text-emerald-400 stroke-[2.5]" />
                ) : (
                  <span className="text-[13px] text-muted-foreground/40 font-light">—</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AdminTeamPage() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminMember | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AdminMember | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<AdminMember | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');

  const isSuperAdmin = (() => {
    if (typeof window === 'undefined') return false;
    try {
      const tok = localStorage.getItem('canafri_admin_access_token');
      if (!tok) return false;
      const b64 = tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(b64));
      return payload.role === 'SUPER_ADMIN';
    } catch {
      return false;
    }
  })();

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('canafri_admin_access_token') ?? '' : '';

  const authHeader = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

  // ── Load team on mount ────────────────────────────────────────────────────
  const loadTeam = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/team`, { headers: authHeader() });
      if (!res.ok) throw new Error('Failed to load team.');
      const data = await res.json();

      let currentAdminId = '';
      try {
        const tok = localStorage.getItem('canafri_admin_access_token');
        if (tok) {
          const b64 = tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(b64));
          currentAdminId = payload.userId || payload.sub || '';
        }
      } catch {
        // ignore decoding errors
      }

      const active: AdminMember[] = (data.activeAdmins ?? []).map((u: any) => {
        const displayRole = mapRoleToDisplay(u.role);
        return {
          id: u.id,
          name: u.displayName || u.username,
          email: u.email ?? '',
          role: displayRole,
          scope: ROLE_SCOPES[displayRole] || 'System Access',
          status: u.status === 'REVOKED' ? 'Revoked' : 'Online' as const,
          isSelf: u.id === currentAdminId,
          joinedAt: new Date(u.createdAt),
        };
      });

      const pending: AdminMember[] = (data.pendingInvites ?? []).map((inv: any) => {
        const displayRole = mapRoleToDisplay(inv.role);
        return {
          id: inv.id,
          name: inv.email.split('@')[0],
          email: inv.email,
          role: displayRole,
          scope: ROLE_SCOPES[displayRole] || 'System Access',
          status: 'Invite Pending' as const,
          isSelf: false,
          joinedAt: new Date(inv.createdAt),
        };
      });

      setMembers([...active, ...pending]);
    } catch (err: any) {
      setLoadError(err.message);
    }
  }, []);

  useEffect(() => { loadTeam(); }, [loadTeam]);

  const totalAdmins  = members.filter(m => m.status === 'Online' || m.status === 'Offline').length;
  const pendingCount = members.filter(m => m.status === 'Invite Pending').length;
  const onlineCount  = members.filter(m => m.status === 'Online').length;

  // ── Invite ────────────────────────────────────────────────────────────────
  const handleInvite = async (email: string, role: AdminRole): Promise<string> => {
    const apiRole = mapDisplayToApiRole(role);
    const res = await fetch(`${API}/admin/invites`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ email, role: apiRole }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Invite failed.');
    setInviteLink(data.inviteLink);
    setToast(`Invite created for ${email}`);
    await loadTeam();
    return data.inviteLink;
  };

  // ── Edit role ──────────────────────────────────────────────────────────────
  const handleEditSave = async (id: string, newDisplayRole: AdminRole) => {
    const apiRole = mapDisplayToApiRole(newDisplayRole);
    try {
      const res = await fetch(`${API}/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: authHeader(),
        body: JSON.stringify({ role: apiRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Role update failed.');
      setToast('Role updated successfully');
      await loadTeam();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    }
  };

  // ── Remove admin (Revoke Access) ─────────────────────────────────────────
  const handleRemove = async (member: AdminMember, reason: string) => {
    try {
      const res = await fetch(`${API}/admin/users/${member.id}`, {
        method: 'DELETE',
        headers: authHeader(),
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Remove failed.');
      setToast(`${member.name}'s admin access has been revoked`);
      await loadTeam();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    }
  };

  // ── Reactivate admin ──────────────────────────────────────────────────────
  const handleReactivate = async (member: AdminMember) => {
    try {
      // No body — do NOT send Content-Type: application/json with an empty body
      // as Fastify will try to parse it and throw a cryptic error.
      const res = await fetch(`${API}/admin/users/${member.id}/reactivate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || JSON.stringify(data));
      setToast(`${member.name}'s admin access has been reactivated`);
      await loadTeam();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    }
  };


  // ── Revoke invite ─────────────────────────────────────────────────────────
  const handleRevoke = async (member: AdminMember) => {
    try {
      const res = await fetch(`${API}/admin/invites/${member.id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Revoke failed.');
      setToast(`Invite revoked for ${member.email}`);
      await loadTeam();
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-9 pt-[35px] px-8 pb-10 w-full min-h-full">
      {/* Page Title */}
      <h1 className="text-[36px] font-bold text-foreground/80 leading-[42px] tracking-[-0.18px]">
        Admin Team
      </h1>

      <div className="flex flex-col gap-6 w-full">
        {/* Invite Banner */}
        <div className="bg-card border border-border rounded-2xl px-6 py-5 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[14px] font-semibold text-foreground">Team Members</span>
            <span className="text-[12px] text-muted-foreground">Manage admin access, assign roles, and configure system permissions.</span>
          </div>
          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 bg-[#8C5CFF] hover:bg-[#7A4AEE] text-white px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-colors"
          >
            <UserPlus className="size-4" />
            Invite Admin
          </button>
        </div>

        {/* Stats Row */}
        <div className="flex gap-6 w-full">
          {[
            { label: 'Total Admins',    value: totalAdmins,  sub: '1 super admin' },
            { label: 'Pending Invites', value: pendingCount, sub: 'Awaiting acceptance', subColor: 'text-emerald-400' },
            { label: 'Active Now',      value: onlineCount,  sub: 'Online in last hour' },
          ].map(s => (
            <div key={s.label} className="flex-1 bg-card border border-border rounded-2xl p-6 flex flex-col gap-2.5">
              <span className="text-[13px] font-medium text-muted-foreground">{s.label}</span>
              <span className="text-[22px] font-medium text-foreground tracking-tight">{s.value}</span>
              <span className={`text-[11px] font-normal ${s.subColor ?? 'text-muted-foreground'}`}>{s.sub}</span>
            </div>
          ))}
        </div>

        {/* Members Table */}
        <div className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center px-6 py-4 bg-card border-b border-border text-[13px] font-semibold text-foreground/80">
            <div className="flex-[2] min-w-0">Admin</div>
            <div className="w-[150px] shrink-0">Role</div>
            <div className="flex-[2] min-w-0">Scope</div>
            <div className="w-[120px] shrink-0">Status</div>
            <div className="w-[180px] shrink-0 text-right">Actions</div>
          </div>

          {/* Member Rows */}
          {members.map(member => (
            <MemberRow
              key={member.id}
              member={member}
              isSuperAdmin={isSuperAdmin}
              onEdit={setEditTarget}
              onRemove={setRemoveTarget}
              onRevoke={setRevokeTarget}
              onReactivate={handleReactivate}
            />
          ))}

          {members.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Shield className="size-8 opacity-30" />
              <span className="text-[13px]">No admin members yet</span>
            </div>
          )}
        </div>

        {/* Role Permissions Matrix */}
        <PermissionsMatrix />
      </div>

      {/* Modals */}
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvite={handleInvite}
        />
      )}
      {inviteLink && <InviteLinkModal link={inviteLink} onClose={() => setInviteLink(null)} />}
      {editTarget && (
        <EditRoleModal member={editTarget} onClose={() => setEditTarget(null)} onSave={handleEditSave} />
      )}
      {removeTarget && (
        <RevokeReasonModal
          member={removeTarget}
          onClose={() => setRemoveTarget(null)}
          onConfirm={(reason) => handleRemove(removeTarget, reason)}
        />
      )}
      {revokeTarget && (
        <ConfirmModal
          title="Revoke Invite"
          description={`Revoke the pending invite for ${revokeTarget.email}? They will no longer be able to accept it.`}
          confirmLabel="Revoke Invite"
          confirmClass="bg-red-400 hover:bg-red-500"
          onClose={() => setRevokeTarget(null)}
          onConfirm={() => handleRevoke(revokeTarget)}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
