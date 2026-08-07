'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Lock, 
  ShieldCheck, 
  Smartphone, 
  Key, 
  Monitor, 
  Globe, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Download, 
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';

interface ActiveSession {
  id: string;
  device: string;
  ip: string;
  location: string;
  lastSeen: string;
  isCurrent: boolean;
}

interface LoginAttempt {
  id: string;
  timestamp: string;
  ip: string;
  device: string;
  status: 'Success' | 'Failed';
}

const INITIAL_SESSIONS: ActiveSession[] = [
  { id: 's-1', device: 'macOS (Chrome)', ip: '192.168.1.104', location: 'Lagos, Nigeria', lastSeen: 'Active now', isCurrent: true },
  { id: 's-2', device: 'Windows 11 (Firefox)', ip: '102.89.41.22', location: 'Abuja, Nigeria', lastSeen: '3 hours ago', isCurrent: false },
  { id: 's-3', device: 'iPhone 15 Pro (Safari)', ip: '197.210.64.12', location: 'Lagos, Nigeria', lastSeen: '2 days ago', isCurrent: false },
];

const INITIAL_LOGIN_HISTORY: LoginAttempt[] = [
  { id: 'h-1', timestamp: '2026-07-18 08:42:11', ip: '192.168.1.104', device: 'macOS (Chrome)', status: 'Success' },
  { id: 'h-2', timestamp: '2026-07-18 08:41:50', ip: '192.168.1.104', device: 'macOS (Chrome)', status: 'Failed' },
  { id: 'h-3', timestamp: '2026-07-17 19:22:15', ip: '102.89.41.22', device: 'Windows 11 (Firefox)', status: 'Success' },
  { id: 'h-4', timestamp: '2026-07-17 19:21:40', ip: '102.89.41.22', device: 'Windows 11 (Firefox)', status: 'Failed' },
  { id: 'h-5', timestamp: '2026-07-16 11:05:04', ip: '197.210.64.12', device: 'iPhone 15 Pro (Safari)', status: 'Success' },
  { id: 'h-6', timestamp: '2026-07-16 09:12:30', ip: '105.112.38.64', device: 'Linux (Chrome)', status: 'Failed' },
  { id: 'h-7', timestamp: '2026-07-15 14:30:12', ip: '102.89.41.22', device: 'Windows 11 (Firefox)', status: 'Success' },
  { id: 'h-8', timestamp: '2026-07-15 08:15:22', ip: '192.168.1.104', device: 'macOS (Chrome)', status: 'Success' },
  { id: 'h-9', timestamp: '2026-07-14 22:10:45', ip: '197.210.64.12', device: 'iPhone 15 Pro (Safari)', status: 'Success' },
  { id: 'h-10', timestamp: '2026-07-14 22:08:11', ip: '197.210.64.12', device: 'iPhone 15 Pro (Safari)', status: 'Failed' },
  { id: 'h-11', timestamp: '2026-07-13 18:25:30', ip: '102.89.41.22', device: 'Windows 11 (Firefox)', status: 'Success' },
  { id: 'h-12', timestamp: '2026-07-13 10:14:02', ip: '192.168.1.104', device: 'macOS (Chrome)', status: 'Success' },
  { id: 'h-13', timestamp: '2026-07-12 15:40:11', ip: '105.112.38.71', device: 'Android (Firefox)', status: 'Failed' },
  { id: 'h-14', timestamp: '2026-07-12 11:35:19', ip: '192.168.1.104', device: 'macOS (Chrome)', status: 'Success' },
  { id: 'h-15', timestamp: '2026-07-11 09:20:45', ip: '102.89.41.22', device: 'Windows 11 (Firefox)', status: 'Success' },
  { id: 'h-16', timestamp: '2026-07-10 16:50:33', ip: '197.210.64.12', device: 'iPhone 15 Pro (Safari)', status: 'Success' },
  { id: 'h-17', timestamp: '2026-07-10 16:49:15', ip: '197.210.64.12', device: 'iPhone 15 Pro (Safari)', status: 'Failed' },
  { id: 'h-18', timestamp: '2026-07-09 11:05:22', ip: '192.168.1.104', device: 'macOS (Chrome)', status: 'Success' },
  { id: 'h-19', timestamp: '2026-07-08 14:12:40', ip: '102.89.41.22', device: 'Windows 11 (Firefox)', status: 'Success' },
  { id: 'h-20', timestamp: '2026-07-07 09:30:15', ip: '192.168.1.104', device: 'macOS (Chrome)', status: 'Success' },
];

const API = '/api';

function getToken() {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('canafri_admin_access_token') ||
    localStorage.getItem('canafri_access_token') ||
    ''
  );
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getToken()}`,
    ...(opts.headers as Record<string, string> ?? {}),
  };

  if (opts.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(`${API}${path}`, {
    ...opts,
    headers,
  });
}

export default function AdminSecurityPage() {
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Re-auth modal
  const [showReauth, setShowReauth] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthError, setReauthError] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // 2FA State
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpSetupOpen, setTotpSetupOpen] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [totpSetupKey, setTotpSetupKey] = useState('');
  const [totpQrUrl, setTotpQrUrl] = useState('');
  const [totpPreAuthId, setTotpPreAuthId] = useState('');
  const [totpReconfigLoading, setTotpReconfigLoading] = useState(false);

  // Build the otpauth:// URI for the QR code
  const totpUri = useMemo(
    () => totpSetupKey ? `otpauth://totp/CanaFri%20Admin?secret=${totpSetupKey}&issuer=CanaFri&algorithm=SHA1&digits=6&period=30` : '',
    [totpSetupKey]
  );

  // Open the Change TOTP panel: call the dedicated reconfig endpoint for authenticated admins
  const handleOpenTotpReconfig = async () => {
    if (totpSetupOpen) { setTotpSetupOpen(false); return; }
    setTotpReconfigLoading(true);
    try {
      const res = await apiFetch('/admin/security/totp-reconfig', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load TOTP setup.');
      setTotpSetupKey(data.secret ?? '');
      setTotpQrUrl(data.qrCodeUrl ?? '');
      setTotpSetupOpen(true);
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`);
    } finally {
      setTotpReconfigLoading(false);
    }
  };

  // Verify the 6-digit code and get real server-issued recovery codes
  const handleTotpReconfigVerify = async () => {
    if (totpCode.length !== 6) return;
    setTotpReconfigLoading(true);
    try {
      const res = await apiFetch('/admin/security/totp-reconfig/verify', {
        method: 'POST',
        body: JSON.stringify({ code: totpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed.');
      if (data.recoveryCodes && data.recoveryCodes.length > 0) {
        setRecoveryCodes(data.recoveryCodes);
        setRecoveryCodesVisible(true);
      }
      setTotpSetupOpen(false);
      setTotpCode('');
      triggerToast('Authenticator re-configured — save your new recovery codes.');
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`);
    } finally {
      setTotpReconfigLoading(false);
    }
  };

  // Recovery codes — generated once during TOTP activation, shown once
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [recoveryCodesVisible, setRecoveryCodesVisible] = useState(false);
  const [recoveryCodesCopied, setRecoveryCodesCopied] = useState(false);

  // Active Sessions & Login History state
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginAttempt[]>([]);
  const [sessionToRevoke, setSessionToRevoke] = useState<ActiveSession | null>(null);

  // Toast / Alerts
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadSecurityData = useCallback(async () => {
    try {
      const [sessRes, histRes] = await Promise.all([
        apiFetch('/admin/security/sessions'),
        apiFetch('/admin/security/login-history'),
      ]);

      if (sessRes.ok) {
        const data = await sessRes.json();
        if (Array.isArray(data.sessions)) {
          setSessions(data.sessions);
        }
      }

      if (histRes.ok) {
        const data = await histRes.json();
        if (Array.isArray(data.history)) {
          setLoginHistory(data.history);
        }
      }
    } catch (err) {
      console.error('[AdminSecurity] Error loading security sessions/history:', err);
    }
  }, []);

  useEffect(() => {
    loadSecurityData();
  }, [loadSecurityData]);

  const confirmRevokeSession = async () => {
    if (!sessionToRevoke) return;
    try {
      const res = await apiFetch(`/admin/security/sessions/${sessionToRevoke.id}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionToRevoke.id));
        triggerToast('Session revoked successfully.');
      }
    } catch {
      triggerToast('Failed to revoke session.');
    } finally {
      setSessionToRevoke(null);
    }
  };

  // Password requirements calculation
  const reqLength = newPassword.length >= 12;
  const reqUpper  = /[A-Z]/.test(newPassword);
  const reqNumber = /[0-9]/.test(newPassword);
  const reqSymbol = /[^A-Za-z0-9]/.test(newPassword);
  const allReqsMet = reqLength && reqUpper && reqNumber && reqSymbol;

  // Password strength meter
  const getStrengthPercent = () => {
    let score = 0;
    if (newPassword.length > 0) score += 20;
    if (reqLength) score += 20;
    if (reqUpper) score += 20;
    if (reqNumber) score += 20;
    if (reqSymbol) score += 20;
    return score;
  };

  const getStrengthLabel = () => {
    const pct = getStrengthPercent();
    if (pct <= 20) return { text: 'Very Weak', color: 'text-red-500', bar: 'bg-red-500' };
    if (pct <= 40) return { text: 'Weak', color: 'text-red-400', bar: 'bg-red-400' };
    if (pct <= 60) return { text: 'Fair', color: 'text-amber-400', bar: 'bg-amber-400' };
    if (pct <= 80) return { text: 'Good', color: 'text-emerald-400', bar: 'bg-emerald-400' };
    return { text: 'Strong', color: 'text-emerald-500', bar: 'bg-emerald-500' };
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allReqsMet) return;
    if (newPassword !== confirmPassword) return;
    
    // Trigger re-authentication modal before submit
    setShowReauth(true);
    setReauthError('');
    setReauthPassword(currentPassword); // prefill with entered current password
  };

  const handleConfirmReauth = async () => {
    if (!reauthPassword) {
      setReauthError('Please enter your current administrator password.');
      return;
    }
    
    setPasswordSubmitting(true);
    setReauthError('');

    try {
      const res = await apiFetch('/admin/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: reauthPassword,
          newPassword,
          confirmPassword,
          revokeOtherSessions: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowReauth(false);
        setReauthPassword('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        triggerToast('Administrator password updated successfully.');
      } else {
        setReauthError(data.message || 'Failed to update password. Verification failed.');
      }
    } catch {
      setReauthError('Network error while saving password.');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Download recovery codes helper
  const downloadRecoveryCodes = (codes: string[]) => {
    const element = document.createElement('a');
    const file = new Blob(
      [`CanaFri Admin Recovery Codes\nGenerated: ${new Date().toISOString()}\n\n${codes.join('\n')}\n\nStore these in a secure offline location. Each code can only be used once.`],
      { type: 'text/plain' }
    );
    element.href = URL.createObjectURL(file);
    element.download = 'canafri-admin-recovery-codes.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyRecoveryCodes = async (codes: string[]) => {
    await navigator.clipboard.writeText(codes.join('\n'));
    setRecoveryCodesCopied(true);
    setTimeout(() => setRecoveryCodesCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-9 pt-[35px] px-8 pb-10 w-full min-h-full">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
          <span className="text-[13px] font-medium text-foreground">{toastMsg}</span>
        </div>
      )}

      {/* Page Title */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[36px] font-bold text-foreground/80 leading-[42px] tracking-[-0.18px]">
          Security Settings
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Configure multi-factor authentication, change administrative credentials, audit sessions, and inspect login history.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
        {/* ── SECTION 1: Change Password ── */}
        <div className="bg-card border border-border rounded-[16px] p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
            <Lock className="size-4.5 text-[#8C5CFF]" />
            <h3 className="text-[15px] font-bold text-white">Change Password</h3>
          </div>

          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            {/* Current Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-muted-foreground">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#121212] border border-border rounded-lg pl-3 pr-10 py-2.5 text-[13px] text-white focus:border-[#8C5CFF] focus:outline-none"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-muted-foreground">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-[#121212] border border-border rounded-lg pl-3 pr-10 py-2.5 text-[13px] text-white focus:border-[#8C5CFF] focus:outline-none"
                  placeholder="Enter minimum 12 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-muted-foreground">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#121212] border border-border rounded-lg pl-3 pr-10 py-2.5 text-[13px] text-white focus:border-[#8C5CFF] focus:outline-none"
                  placeholder="Re-type new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <span className="text-[11px] text-red-400">Passwords do not match</span>
              )}
            </div>

            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <div className="flex flex-col gap-2 p-3 bg-background border border-border rounded-lg mt-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground">Password strength:</span>
                  <span className={`font-semibold ${getStrengthLabel().color}`}>
                    {getStrengthLabel().text}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${getStrengthLabel().bar}`}
                    style={{ width: `${getStrengthPercent()}%` }}
                  />
                </div>
              </div>
            )}

            {/* Enforcements checklist */}
            <div className="flex flex-col gap-2 p-3 bg-background border border-border rounded-lg text-[11.5px]">
              <span className="font-semibold text-white/90">Security Enforcements:</span>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="flex items-center gap-2">
                  <span className={`size-1.5 rounded-full ${reqLength ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className={reqLength ? 'text-muted-foreground line-through' : 'text-foreground/90'}>Min 12 characters</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`size-1.5 rounded-full ${reqUpper ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className={reqUpper ? 'text-muted-foreground line-through' : 'text-foreground/90'}>Uppercase letter</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`size-1.5 rounded-full ${reqNumber ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className={reqNumber ? 'text-muted-foreground line-through' : 'text-foreground/90'}>Include number</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`size-1.5 rounded-full ${reqSymbol ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className={reqSymbol ? 'text-muted-foreground line-through' : 'text-foreground/90'}>Include symbol (!@#$)</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!allReqsMet || newPassword !== confirmPassword}
              className="mt-2 w-full bg-[#8C5CFF] hover:bg-[#7A4AEE] disabled:opacity-40 disabled:hover:bg-[#8C5CFF] text-white py-2.5 rounded-lg text-[13px] font-semibold transition-colors"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* ── SECTION 2: Authenticator App ── */}
        <div className="bg-card border border-border rounded-[16px] p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
            <ShieldCheck className="size-4.5 text-[#8C5CFF]" />
            <h3 className="text-[15px] font-bold text-white">Authenticator App (TOTP)</h3>
          </div>

          <div className="bg-background border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <Smartphone className="size-5 text-[#06B6D4] shrink-0 mt-0.5" />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-foreground">Google Authenticator (TOTP)</span>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    All logins require a 6-digit code from your authenticator app. Recovery codes were generated during setup.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenTotpReconfig}
                disabled={totpReconfigLoading}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#8C5CFF] hover:bg-[#7A4AEE] disabled:opacity-50 text-white transition-colors shrink-0"
              >
                {totpReconfigLoading ? 'Loading...' : 'Change'}
              </button>
            </div>

            {/* Re-configure panel */}
            {totpSetupOpen && (
              <div className="border-t border-border/40 pt-4 flex flex-col gap-3.5 mt-2 animate-in fade-in duration-200">
                <div className="flex items-start gap-2 bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2.5">
                  <AlertCircle className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] text-amber-400 leading-relaxed">
                    This will generate a new TOTP secret. Your old authenticator app entry will stop working immediately and new recovery codes will be issued.
                  </span>
                </div>
                <div className="flex items-center gap-4 bg-[#121212] p-3 rounded-lg border border-border">
                  {/* Real QR code from qrcode.react */}
                  <div className="shrink-0 bg-white rounded p-1.5">
                    <QRCodeSVG
                      value={totpUri}
                      size={80}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="M"
                    />
                  </div>
                  <div className="flex flex-col min-w-0 gap-1">
                    <span className="text-[11.5px] font-semibold text-foreground">Scan with your authenticator app</span>
                    <span className="text-[10px] text-muted-foreground">Google Authenticator · Authy · 1Password</span>
                    <span className="text-[10px] text-muted-foreground mt-1">Or enter the secret key manually:</span>
                    <span className="text-[11px] font-mono text-[#8C5CFF] font-semibold tracking-wider">{totpSetupKey.replace(/(.{4})/g, '$1 ').trim()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={totpCode}
                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 bg-[#121212] border border-border rounded-lg px-3 py-2 text-[12.5px] font-mono text-center tracking-widest text-white focus:border-[#8C5CFF] focus:outline-none"
                    placeholder="Enter 6-digit code from your app"
                  />
                  <button
                    type="button"
                    disabled={totpCode.length !== 6 || totpReconfigLoading}
                    onClick={handleTotpReconfigVerify}
                    className="px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    {totpReconfigLoading ? 'Verifying...' : 'Verify & Save'}
                  </button>
                </div>
              </div>
            )}

            {/* Recovery codes — shown once after re-configuration */}
            {recoveryCodesVisible && recoveryCodes.length > 0 && (
              <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-4 flex flex-col gap-3 animate-in fade-in duration-300">
                <div className="flex items-start gap-2">
                  <Key className="size-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[12px] font-bold text-amber-400">Save your new recovery codes</span>
                    <span className="text-[10.5px] text-amber-400/80 leading-relaxed">
                      These 8 one-time codes let you regain access if you ever lose your phone. Each code can only be used once.{' '}
                      <strong>They will not be shown again.</strong>
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3 bg-[#0f0f0f] border border-amber-500/20 rounded-lg font-mono text-[12px] text-white">
                  {recoveryCodes.map((code, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-amber-500/60 text-[10px] w-4">{idx + 1}.</span>
                      <span className="tracking-wider">{code}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => copyRecoveryCodes(recoveryCodes)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121212] hover:bg-border/30 text-white rounded-lg text-[11px] font-semibold border border-border transition-colors"
                  >
                    <Copy className="size-3.5" />
                    {recoveryCodesCopied ? 'Copied!' : 'Copy All'}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadRecoveryCodes(recoveryCodes)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-[11px] font-bold transition-colors"
                  >
                    <Download className="size-3.5" />
                    Download TXT
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecoveryCodesVisible(false)}
                    className="px-3 py-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    I've saved these ✓
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 3: Active Sessions ── */}
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center gap-2.5 pb-2 border-b border-border/40 mt-3">
          <Monitor className="size-4.5 text-[#8C5CFF]" />
          <h3 className="text-[15px] font-bold text-white">Active Sessions</h3>
        </div>

        <div className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center px-6 py-4 bg-card border-b border-border text-[13px] font-semibold text-foreground/80">
            <div className="flex-1 min-w-0">Device / Browser</div>
            <div className="w-[150px] shrink-0">IP Address</div>
            <div className="flex-1 min-w-0">Location</div>
            <div className="w-[120px] shrink-0">Last Seen</div>
            <div className="w-[150px] shrink-0 text-right">Action</div>
          </div>

          {/* Table Rows */}
          {sessions.length > 0 ? (
            sessions.map(s => (
              <div key={s.id} className="flex items-center px-6 h-[72px] border-b border-border/40 last:border-0 bg-card hover:bg-background/20 transition-colors">
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-[#8C5CFF]/10 flex items-center justify-center text-[#8C5CFF] shrink-0 border border-[#8C5CFF]/20">
                    <Monitor className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[13.5px] font-medium text-foreground truncate">{s.device}</span>
                    {s.isCurrent && (
                      <span className="text-[9px] bg-[#8C5CFF]/20 text-[#8C5CFF] border border-[#8C5CFF]/30 px-1.5 py-0.5 rounded-full font-semibold max-w-fit">
                        Current Session
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-[150px] shrink-0 text-[13px] font-mono text-muted-foreground">{s.ip}</div>
                <div className="flex-1 min-w-0 text-[13px] text-muted-foreground truncate">{s.location}</div>
                <div className="w-[120px] shrink-0 text-[13px] text-muted-foreground">{s.lastSeen}</div>
                <div className="w-[150px] shrink-0 text-right">
                  {s.isCurrent ? (
                    <span className="text-[11px] text-muted-foreground italic px-3">—</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSessionToRevoke(s)}
                      className="px-3 py-1.5 text-[12px] font-semibold text-red-400 bg-red-400/5 hover:bg-red-400/10 border border-red-400/20 rounded-[8px] transition-colors"
                    >
                      Revoke Access
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">No active sessions found.</div>
          )}
        </div>
      </div>

      {/* ── SECTION 4: Login History ── */}
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center gap-2.5 pb-2 border-b border-border/40 mt-3">
          <History className="size-4.5 text-[#8C5CFF]" />
          <h3 className="text-[15px] font-bold text-white">Login History (Last 20 attempts)</h3>
        </div>

        <div className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center px-6 py-4 bg-card border-b border-border text-[13px] font-semibold text-foreground/80">
            <div className="flex-1 min-w-0">Timestamp</div>
            <div className="w-[150px] shrink-0">IP Address</div>
            <div className="flex-1 min-w-0">Device / User Agent</div>
            <div className="w-[120px] shrink-0 text-right">Status</div>
          </div>

          {/* Table Rows (Last 20) */}
          <div className="max-h-[480px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {loginHistory.length > 0 ? (
              loginHistory.map(h => (
                <div key={h.id} className="flex items-center px-6 h-[54px] border-b border-border/40 last:border-0 bg-card hover:bg-background/20 transition-colors">
                  <div className="flex-1 min-w-0 text-[13px] text-foreground/90 font-medium truncate">{h.timestamp}</div>
                  <div className="w-[150px] shrink-0 text-[13px] font-mono text-muted-foreground">{h.ip}</div>
                  <div className="flex-1 min-w-0 text-[13px] text-muted-foreground truncate">{h.device}</div>
                  <div className="w-[120px] shrink-0 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      h.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {h.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">No recent security login history recorded.</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Re-auth Verification Modal ── */}
      {showReauth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
                <Lock className="size-4 text-[#8C5CFF]" />
                Security Verification
              </h2>
              <p className="text-[12px] text-muted-foreground">
                You must verify your current administrator credentials before submitting password modifications.
              </p>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">Administrator Password</label>
              <input
                type="password"
                required
                value={reauthPassword}
                onChange={e => setReauthPassword(e.target.value)}
                className="w-full bg-[#121212] border border-border rounded-lg px-3 py-2 text-[12.5px] text-white focus:border-[#8C5CFF] focus:outline-none"
                placeholder="Enter current password"
              />
              {reauthError && (
                <span className="text-[11px] text-red-400 flex items-center gap-1">
                  <AlertCircle size={12} /> {reauthError}
                </span>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowReauth(false);
                  setReauthPassword('');
                }}
                className="flex-1 px-4 py-2.5 text-[13px] font-medium text-foreground/70 bg-background border border-border rounded-[10px] hover:bg-border/40 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={passwordSubmitting}
                onClick={handleConfirmReauth}
                className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-[#8C5CFF] rounded-[10px] hover:bg-[#7A4AEE] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {passwordSubmitting ? <RefreshCw className="size-3.5 animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Revoke Session Confirmation Modal ── */}
      {sessionToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
                <AlertCircle className="size-4 text-red-400" />
                Revoke Session
              </h2>
              <p className="text-[12px] text-muted-foreground">
                Are you sure you want to terminate this administrative session? The active administrator on this device will be logged out immediately.
              </p>
            </div>

            <div className="bg-[#121212] border border-border rounded-lg p-3 text-[12px] text-muted-foreground flex flex-col gap-1">
              <span className="font-semibold text-white">{sessionToRevoke.device}</span>
              <span>IP: {sessionToRevoke.ip} · {sessionToRevoke.location}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSessionToRevoke(null)}
                className="flex-1 px-4 py-2.5 text-[13px] font-medium text-foreground/70 bg-background border border-border rounded-[10px] hover:bg-border/40 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRevokeSession}
                className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-red-400 hover:bg-red-500 rounded-[10px] transition-colors"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
