'use client';

import { useState, useEffect } from 'react';
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

  // 2FA State
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpSetupOpen, setTotpSetupOpen] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [totpSetupKey] = useState('HJDU 73HD KA92 LS04');

  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsSetupOpen, setSmsSetupOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCode, setSmsCode] = useState('');

  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupCodesGenerated, setBackupCodesGenerated] = useState(false);

  // Active Sessions state
  const [sessions, setSessions] = useState<ActiveSession[]>(INITIAL_SESSIONS);
  const [sessionToRevoke, setSessionToRevoke] = useState<ActiveSession | null>(null);

  // Toast / Alerts
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
    
    // Trigger re-authentication before save
    setShowReauth(true);
    setReauthError('');
  };

  const handleConfirmReauth = () => {
    if (reauthPassword !== 'admin123') { // simulated admin check
      setReauthError('Invalid current password verification.');
      return;
    }
    
    // Save successful simulated action
    setShowReauth(false);
    setReauthPassword('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    triggerToast('Administrator password updated successfully');
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Generate Backup Codes
  const generateBackup = () => {
    const codes = Array.from({ length: 10 }, () => 
      Math.floor(10000000 + Math.random() * 90000000).toString().replace(/(\d{4})(\d{4})/, '$1-$2')
    );
    setBackupCodes(codes);
    setBackupCodesGenerated(true);
    triggerToast('Emergency backup codes generated');
  };

  const downloadBackupCodes = () => {
    const element = document.createElement("a");
    const file = new Blob([backupCodes.join("\n")], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "canafri-admin-backup-codes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleRevokeSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    triggerToast('Session revoked successfully');
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

        {/* ── SECTION 2: Two Factor Authentication ── */}
        <div className="bg-card border border-border rounded-[16px] p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
            <ShieldCheck className="size-4.5 text-[#8C5CFF]" />
            <h3 className="text-[15px] font-bold text-white">Two-Factor Authentication</h3>
          </div>

          <div className="flex flex-col gap-4">
            
            {/* Primary Option: Google Authenticator (TOTP) */}
            <div className="bg-background border border-border rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <Smartphone className="size-5 text-[#06B6D4] shrink-0 mt-0.5" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-semibold text-foreground">Google Authenticator (TOTP)</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">Primary recommended method. Codes generated by app.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (totpEnabled) {
                      setTotpEnabled(false);
                      triggerToast('TOTP disabled');
                    } else {
                      setTotpSetupOpen(true);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${
                    totpEnabled ? 'bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20' : 'bg-[#8C5CFF] hover:bg-[#7A4AEE] text-white'
                  }`}
                >
                  {totpEnabled ? 'Disable' : 'Configure'}
                </button>
              </div>

              {/* TOTP Mock Setup UI */}
              {totpSetupOpen && (
                <div className="border-t border-border/40 pt-4 flex flex-col gap-3.5 mt-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-4 bg-[#121212] p-3 rounded-lg border border-border">
                    {/* Simulated QR Code */}
                    <div className="size-16 bg-white flex items-center justify-center shrink-0 rounded p-1">
                      <div className="size-full bg-repeating-linear bg-cover bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIi8+CjxyZWN0IHg9IjQiIHk9IjQiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMwMDAiLz4KPC9zdmc+')] bg-[size:10px_10px] opacity-70" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11.5px] font-semibold text-foreground">Scan this QR code</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">Or enter secret key manually:</span>
                      <span className="text-[11px] font-mono text-[#8C5CFF] font-semibold mt-1 tracking-wider">{totpSetupKey}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={totpCode}
                      onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 bg-[#121212] border border-border rounded-lg px-3 py-2 text-[12.5px] font-mono text-center tracking-widest text-white focus:border-[#8C5CFF] focus:outline-none"
                      placeholder="Enter 6-digit code"
                    />
                    <button
                      type="button"
                      disabled={totpCode.length !== 6}
                      onClick={() => {
                        setTotpEnabled(true);
                        setTotpSetupOpen(false);
                        setTotpCode('');
                        triggerToast('Google Authenticator activated');
                      }}
                      className="px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-lg text-[11px] font-semibold transition-colors"
                    >
                      Verify & Activate
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Backup Option: SMS OTP */}
            <div className="bg-background border border-border rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <Smartphone className="size-5 text-[#10B981] shrink-0 mt-0.5" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-semibold text-foreground">SMS OTP</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">Backup option. Code sent to verified phone number.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (smsEnabled) {
                      setSmsEnabled(false);
                      triggerToast('SMS OTP disabled');
                    } else {
                      setSmsSetupOpen(true);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${
                    smsEnabled ? 'bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20' : 'bg-[#8C5CFF] hover:bg-[#7A4AEE] text-white'
                  }`}
                >
                  {smsEnabled ? 'Disable' : 'Configure'}
                </button>
              </div>

              {/* SMS Mock Setup UI */}
              {smsSetupOpen && (
                <div className="border-t border-border/40 pt-4 flex flex-col gap-3 mt-2 animate-in fade-in duration-200">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground">Phone Number</label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      className="w-full bg-[#121212] border border-border rounded-lg px-3 py-2 text-[12.5px] text-white focus:border-[#8C5CFF] focus:outline-none"
                      placeholder="+234 80 1234 5678"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={smsCode}
                      onChange={e => setSmsCode(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 bg-[#121212] border border-border rounded-lg px-3 py-2 text-[12.5px] font-mono text-center tracking-widest text-white focus:border-[#8C5CFF] focus:outline-none"
                      placeholder="Enter SMS OTP"
                    />
                    <button
                      type="button"
                      disabled={!phoneNumber.trim()}
                      onClick={() => {
                        setSmsEnabled(true);
                        setSmsSetupOpen(false);
                        setSmsCode('');
                        setPhoneNumber('');
                        triggerToast('SMS backup option enabled');
                      }}
                      className="px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-lg text-[11px] font-semibold transition-colors"
                    >
                      Verify & Enable
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Emergency Option: Backup Codes */}
            <div className="bg-background border border-border rounded-xl p-4 flex flex-col gap-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <Key className="size-5 text-[#F59E0B] shrink-0 mt-0.5" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-semibold text-foreground">Backup Codes</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">Emergency access. Save these codes in a secure location.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={generateBackup}
                  className="px-3 py-1.5 bg-background border border-border hover:bg-border/40 text-foreground/80 rounded-lg text-[11px] font-semibold transition-colors shrink-0"
                >
                  {backupCodesGenerated ? 'Regenerate' : 'Generate'}
                </button>
              </div>

              {/* Generated Backup Codes */}
              {backupCodesGenerated && backupCodes.length > 0 && (
                <div className="border-t border-border/40 pt-4 flex flex-col gap-4 mt-1 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-3 bg-[#121212] border border-border rounded-lg p-4 font-mono text-[12px] text-white font-semibold">
                    {backupCodes.map((c, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <span className="text-[10px] text-muted-foreground w-4">{i + 1}.</span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(backupCodes.join("\n"));
                        triggerToast('Backup codes copied to clipboard');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121212] hover:bg-border/30 text-white rounded-lg text-[11px] font-semibold border border-border transition-colors"
                    >
                      <Copy className="size-3.5" />
                      Copy Codes
                    </button>
                    <button
                      type="button"
                      onClick={downloadBackupCodes}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8C5CFF] hover:bg-[#7A4AEE] text-white rounded-lg text-[11px] font-semibold transition-colors"
                    >
                      <Download className="size-3.5" />
                      Download TXT
                    </button>
                  </div>
                </div>
              )}
            </div>

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
          {sessions.map(s => (
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
          ))}
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
            {INITIAL_LOGIN_HISTORY.map(h => (
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
            ))}
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
                onClick={handleConfirmReauth}
                className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-[#8C5CFF] rounded-[10px] hover:bg-[#7A4AEE] transition-colors"
              >
                Confirm
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
                onClick={() => {
                  handleRevokeSession(sessionToRevoke.id);
                  setSessionToRevoke(null);
                }}
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
