'use client';

import { useState, useRef } from 'react';
import PersonalInfoModal from '@/components/ui/personal-info-modal';
import { ChangeEmailModal, ChangePhoneModal } from '@/components/ui/contact-modals';
import ChangePasswordModal from '@/components/ui/change-password-modal';
import TwoFactorAuthModal from '@/components/ui/two-factor-auth-modal';
import { useToast } from '@/components/ui/toast';
import { useTheme } from '@/components/theme-provider';
import {
  ChevronRight,
  User,
  Shield,
  Bell,
  Lock,
  Wallet,
  Palette,
  Globe,
  CreditCard,
  ChevronLeft,
  Download,
  Check,
  UploadCloud,
  Trash2,
  File as FileIcon,
  CheckCircle2,
} from 'lucide-react';
import FrameComponent2 from '@/components/ui/frame-component21';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SettingsItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

interface SettingsSection {
  section: string;
  items: SettingsItem[];
}

interface PageProps {
  onBack?: () => void;
  sellerMode?: boolean;
}

// ─── Menu Configuration ───────────────────────────────────────────────────────

const MENU_CONFIG: SettingsSection[] = [
  {
    section: 'ACCOUNT',
    items: [
      { key: 'profile-settings', label: 'Profile Settings', icon: <User size={20} className="text-foreground" /> },
      { key: 'security',         label: 'Security',         icon: <Shield size={20} className="text-foreground" /> },
      { key: 'notification',     label: 'Notification',     icon: <Bell size={20} className="text-foreground" /> },
      { key: 'privacy',          label: 'Privacy',          icon: <Lock size={20} className="text-foreground" /> },
    ],
  },
  {
    section: 'Platform',
    items: [
      { key: 'wallet',    label: 'Wallet',    icon: <Wallet size={20} className="text-foreground" /> },
      { key: 'theme',     label: 'Theme',     icon: <Palette size={20} className="text-foreground" /> },
      { key: 'languages', label: 'Languages', icon: <Globe size={20} className="text-foreground" /> },
    ],
  },
  {
    section: 'Billing',
    items: [
      { key: 'subscription', label: 'Subscription', icon: <CreditCard size={20} className="text-foreground" /> },
    ],
  },
];

// ─── Menu Item Component ──────────────────────────────────────────────────────

function MenuItem({
  item,
  active,
  onClick,
}: {
  item: SettingsItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between border-b border-border p-4 transition-colors ${
        active ? 'bg-border/60' : 'bg-card hover:bg-border/30'
      }`}
    >
      <div className="flex items-center gap-[7px] opacity-90">
        {item.icon}
        <span className="font-sans text-[13px] font-semibold leading-[18px] text-foreground">
          {item.label}
        </span>
      </div>
      <ChevronRight size={16} className="text-foreground/60" />
    </button>
  );
}

// ─── Settings Sidebar Menu ────────────────────────────────────────────────────

function SettingsMenu({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar bg-background">
      {/* Header */}
      <div className="px-4 py-[34px]">
        <h1 className="font-sans text-[36px] font-bold leading-[42px] tracking-[-0.18px] text-foreground">
          Settings
        </h1>
        <p className="mt-1 font-sans text-[11px] leading-[16px] text-muted">
          Manage your account
        </p>
      </div>
      <div className="h-px w-full shrink-0 bg-border" />

      {/* Sections */}
      <div className="flex flex-col gap-[30px] py-[30px]">
        {MENU_CONFIG.map((group) => (
          <div key={group.section} className="flex flex-col gap-3">
            <p className="px-4 font-sans text-[11px] font-semibold uppercase tracking-wider text-muted">
              {group.section}
            </p>
            <div className="flex flex-col">
              {group.items.map((item) => (
                <MenuItem
                  key={item.key}
                  item={item}
                  active={selected === item.key}
                  onClick={() => onSelect(item.key)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Profile Settings Panel ───────────────────────────────────────────────────

interface ProfileSettingsPanelProps {
  onBack: () => void;
  onPersonalInfoOpen: () => void;
  onContactDetailsOpen: () => void;
}

function ProfileSettingsPanel({ onBack, onPersonalInfoOpen, onContactDetailsOpen }: ProfileSettingsPanelProps) {
  const [profileItems] = useState([
    {
      property1: 'Default' as const,
      profile: 'Personal info',
      onClick: onPersonalInfoOpen,
    },
    {
      property1: 'Default' as const,
      profile: 'Contact details',
      onClick: onContactDetailsOpen,
    },
  ]);

  return (
    <div className="relative flex h-full w-full flex-col items-start overflow-hidden bg-background py-[2.125rem] px-0 gap-8 leading-normal tracking-normal text-left text-foreground">
      {/* Top Header Row with back arrow on mobile */}
      <div className="flex items-center gap-4 py-0 pl-4 pr-0">
        <button
          type="button"
          onClick={onBack}
          className="flex size-8 items-center justify-center rounded-full bg-card hover:bg-foreground/5 transition-colors lg:hidden"
          aria-label="Back to settings menu"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <div className="relative font-sans font-medium text-foreground/80">
          Profile
          <br />
          <span className="font-sans text-[14px] text-muted">Personal information</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-[0.063rem] w-full bg-border shrink-0" />

      {/* Options list section */}
      <section className="flex w-full flex-col items-start gap-4">
        <div className="flex w-full flex-col items-start">
          {profileItems.map((item, index) => (
            <FrameComponent2
              key={index}
              property1={item.property1}
              profile={item.profile}
              onClick={item.onClick}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Contact Details Panel ─────────────────────────────────────────────────

interface ContactDetailsPanelProps {
  onBack: () => void;
  onChangeEmail: () => void;
  onChangePhone: () => void;
}

function ContactDetailsPanel({ onBack, onChangeEmail, onChangePhone }: ContactDetailsPanelProps) {
  return (
    <div className="relative flex h-full w-full flex-col items-start overflow-hidden bg-background py-[2.125rem] px-0 gap-8">
      {/* Header */}
      <div className="flex items-center gap-4 py-0 pl-4 pr-0">
        <button
          type="button"
          onClick={onBack}
          className="flex size-8 items-center justify-center rounded-full bg-card hover:bg-foreground/5 transition-colors lg:hidden"
          aria-label="Back"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <div className="flex flex-col gap-[0.375rem]">
          <p className="font-sans font-medium text-foreground/85">Contact Details</p>
          <p className="font-sans text-[10px] text-muted">Manage your email and phone number</p>
        </div>
      </div>

      <div className="h-px w-full bg-border shrink-0" />

      <section className="flex w-full flex-col gap-0 px-4">
        <p className="mb-4 font-sans text-[13px] font-medium text-muted">Contact</p>
        <div className="flex flex-col rounded-xl bg-card">
          {/* Email */}
          <div className="flex items-center justify-between gap-4 px-4 py-5">
            <div className="flex flex-col gap-[0.062rem]">
              <p className="font-sans text-[13px] font-medium text-foreground/85">Email address</p>
              <p className="font-sans text-[10px] text-muted">Used for login and alerts</p>
              <p className="mt-1 font-sans text-[10px] text-muted">janedoe@gmail.com</p>
            </div>
            <button
              type="button"
              onClick={onChangeEmail}
              className="shrink-0 rounded-lg border border-border bg-transparent px-4 py-2 font-sans text-[13px] font-semibold text-foreground/85 hover:bg-foreground/5 hover:text-foreground transition-colors"
            >
              Change
            </button>
          </div>
          <div className="h-px w-full bg-border" />
          {/* Phone */}
          <div className="flex items-center justify-between gap-4 px-4 py-5">
            <div className="flex flex-col gap-[0.062rem]">
              <p className="font-sans text-[13px] font-medium text-foreground/85">Phone number</p>
              <p className="font-sans text-[10px] text-muted">OTP verification</p>
              <p className="mt-1 font-sans text-[10px] text-muted">+234 *** 5678</p>
            </div>
            <button
              type="button"
              onClick={onChangePhone}
              className="shrink-0 rounded-lg border border-border bg-transparent px-4 py-2 font-sans text-[13px] font-semibold text-foreground/85 hover:bg-foreground/5 hover:text-foreground transition-colors"
            >
              Change
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Security Settings Panel ──────────────────────────────────────────────────

interface SecuritySettingsPanelProps {
  onBack: () => void;
  onPasswordOpen: () => void;
  onTwoFactorOpen: () => void;
  onActiveSessionsOpen: () => void;
  onDeleteAccountOpen: () => void;
  onVerifyIdentityOpen: () => void;
  sellerMode?: boolean;
}

function SecuritySettingsPanel({
  onBack,
  onPasswordOpen,
  onTwoFactorOpen,
  onActiveSessionsOpen,
  onDeleteAccountOpen,
  onVerifyIdentityOpen,
  sellerMode = false,
}: SecuritySettingsPanelProps) {
  const securityItems = [
    { profile: 'Password', onClick: onPasswordOpen },
    { profile: 'Two-factor auth', onClick: onTwoFactorOpen },
    { profile: 'Active sessions', onClick: onActiveSessionsOpen },
    ...(sellerMode ? [{ profile: 'Verify your identity', onClick: onVerifyIdentityOpen }] : []),
    { profile: 'Delete account', onClick: onDeleteAccountOpen, color: '#ff4d4d' },
  ];

  return (
    <div className="relative flex h-full w-full flex-col items-start overflow-hidden bg-background py-[2.125rem] px-0 gap-8 leading-normal tracking-normal text-left text-foreground">
      {/* Top Header Row with back arrow on mobile */}
      <div className="flex items-center gap-4 py-0 pl-4 pr-0">
        <button
          type="button"
          onClick={onBack}
          className="flex size-8 items-center justify-center rounded-full bg-card hover:bg-foreground/5 transition-colors lg:hidden"
          aria-label="Back to settings menu"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <div className="relative font-sans font-medium text-foreground/80">
          Security
          <br />
          <span className="font-sans text-[14px] text-muted">Account protection</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-[0.063rem] w-full bg-border shrink-0" />

      {/* Options list section */}
      <section className="flex w-full flex-col items-start gap-4">
        <div className="flex w-full flex-col items-start">
          {securityItems.map((item, index) => (
            <FrameComponent2
              key={index}
              property1="Default"
              profile={item.profile}
              profileColor={item.color}
              onClick={item.onClick}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Verify Identity Panel (Moved from freelancer registration) ───────────────

interface SettingsUploadedFile {
  name: string;
  size: string;
}

interface VerifyIdentityPanelProps {
  onBack: () => void;
}

function VerifyIdentityPanel({ onBack }: VerifyIdentityPanelProps) {
  const { toast } = useToast();
  const [idType, setIdType] = useState('');
  const [idTypeOpen, setIdTypeOpen] = useState(false);
  const [frontFile, setFrontFile] = useState<SettingsUploadedFile | null>(null);
  const [backFile, setBackFile] = useState<SettingsUploadedFile | null>(null);
  const [selfieFile, setSelfieFile] = useState<SettingsUploadedFile | null>(null);
  const [addressFile, setAddressFile] = useState<SettingsUploadedFile | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [idTypeSearchQuery, setIdTypeSearchQuery] = useState('');

  const [userCountry] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('canafri_user_profile');
      if (stored) {
        try {
          const profile = JSON.parse(stored);
          return profile.country || 'United States';
        } catch (e) {
          console.error(e);
        }
      }
    }
    return 'United States';
  });

  const ID_TYPE_OPTIONS = [
    'National ID Card',
    'International Passport',
    "Driver's License",
    'Residence Permit',
    'Voter\'s Card',
  ];

  const handleVerifySubmit = () => {
    if (!idType) {
      toast('Please select ID type.', 'error');
      return;
    }
    if (!frontFile) {
      toast('Please upload the front side of your government ID.', 'error');
      return;
    }
    if (!selfieFile) {
      toast('Please upload selfie verification.', 'error');
      return;
    }

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('canafri_user_profile');
      let profile = stored ? JSON.parse(stored) : {};
      profile.isVerified = false;
      profile.verificationStatus = 'pending';
      profile.idType = idType;
      localStorage.setItem('canafri_user_profile', JSON.stringify(profile));
    }

    setIsSubmitted(true);
    toast('Identity documents submitted for review!', 'success');
  };

  if (isSubmitted) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-background py-[2.125rem] px-6 text-center animate-in fade-in duration-200">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-4">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="text-[16px] font-bold text-foreground mb-2">Verification Under Review</h2>
        <p className="text-[12px] text-muted max-w-sm mb-6 leading-relaxed">
          Your identity verification documents are successfully uploaded. Our security team will review it within <strong>24 to 48 hours</strong>.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl bg-primary px-6 py-[10px] h-[38px] flex items-center justify-center text-[13px] font-semibold text-white hover:bg-primary/95 transition-colors cursor-pointer"
        >
          Back to Security Settings
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col items-start overflow-hidden bg-background py-[2.125rem] px-0 gap-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-4 py-0 pl-4 pr-0">
        <button
          type="button"
          onClick={onBack}
          className="flex size-8 items-center justify-center rounded-full bg-card hover:bg-foreground/5 transition-colors lg:hidden"
          aria-label="Back"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <div className="flex flex-col gap-[0.375rem]">
          <p className="font-sans font-medium text-foreground/85">Verify Your Identity</p>
          <p className="font-sans text-[10px] text-muted">Upload government ID to get a verified trust badge</p>
        </div>
      </div>

      <div className="h-px w-full bg-border shrink-0" />

      {/* Main scrollable body */}
      <div className="flex flex-col w-full gap-6 px-4 flex-1 overflow-y-auto no-scrollbar pb-8">
        
        {/* Country Selector (Read-Only) */}
        <div className="flex flex-col gap-[5px] w-full">
          <label className="block text-[13px] font-medium leading-[18px] text-foreground/80">
            Country / Region
          </label>
          <div className="flex h-[38px] w-full items-center rounded-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 text-[11px] text-foreground/75 select-none opacity-80">
            <span>{userCountry}</span>
          </div>
          <p className="text-[10px] text-muted leading-relaxed">
            * Documents are only allowed from the country you selected during registration ({userCountry}).
          </p>
        </div>

        {/* ID Type dropdown */}
        <div className="flex flex-col gap-[5px] relative w-full">
          <label className="block text-[13px] font-medium leading-[18px] text-foreground/80">
            ID Type <span className="text-destructive">*</span>
          </label>
          <button
            type="button"
            onClick={() => setIdTypeOpen((o) => !o)}
            className="flex h-[38px] w-full items-center justify-between rounded-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 text-left text-[11px] text-foreground outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <span className={idType ? 'text-foreground' : 'text-muted'}>
              {idType || 'Select ID type'}
            </span>
            <ChevronRight size={14} className={`shrink-0 text-muted transition-transform duration-200 ${idTypeOpen ? 'rotate-90' : ''}`} />
          </button>
          {idTypeOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => { setIdTypeOpen(false); setIdTypeSearchQuery(''); }} />
              <div className="absolute left-0 top-[42px] z-40 w-full rounded-lg border border-border bg-card shadow-xl py-1 max-h-[220px] overflow-y-auto flex flex-col">
                <div className="px-2 py-1.5 border-b border-border sticky top-0 bg-card z-10">
                  <input
                    type="text"
                    placeholder="Search ID type..."
                    value={idTypeSearchQuery}
                    onChange={(e) => setIdTypeSearchQuery(e.target.value)}
                    className="w-full h-[28px] rounded-[4px] border border-border bg-background px-2 text-[10px] text-foreground outline-none focus:border-primary transition-colors"
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto">
                  {ID_TYPE_OPTIONS.filter((opt) =>
                    opt.toLowerCase().includes(idTypeSearchQuery.toLowerCase())
                  ).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setIdType(opt);
                        setIdTypeOpen(false);
                        setIdTypeSearchQuery('');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-[11px] text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5 cursor-pointer ${
                        idType === opt ? 'text-primary font-semibold' : 'text-foreground'
                      }`}
                    >
                      <span>{opt}</span>
                      {idType === opt && <Check className="h-3 w-3 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Government ID — Front */}
        <div className="flex flex-col gap-2 w-full">
          <label className="block text-[13px] font-medium text-foreground/80">Government ID (Front Side) <span className="text-destructive">*</span></label>
          <SettingsFileDropzone onSelect={setFrontFile} />
          {frontFile && <SettingsUploadedFileRow file={frontFile} onRemove={() => setFrontFile(null)} />}
        </div>

        {/* Government ID — Back */}
        <div className="flex flex-col gap-2 w-full">
          <label className="block text-[13px] font-medium text-foreground/80">Government ID (Back Side)</label>
          <SettingsFileDropzone onSelect={setBackFile} />
          {backFile && <SettingsUploadedFileRow file={backFile} onRemove={() => setBackFile(null)} />}
        </div>

        {/* Selfie Verification */}
        <div className="flex flex-col gap-2 w-full">
          <label className="block text-[13px] font-medium text-foreground/80">Selfie holding your ID <span className="text-destructive">*</span></label>
          <SettingsFileDropzone onSelect={setSelfieFile} />
          {selfieFile && <SettingsUploadedFileRow file={selfieFile} onRemove={() => setSelfieFile(null)} />}
        </div>

        {/* Utility Bill / Bank Statement Address Proof */}
        <div className="flex flex-col gap-2 w-full">
          <label className="block text-[13px] font-medium text-foreground/80">Address Proof (Utility Bill / Statement)</label>
          <SettingsFileDropzone onSelect={setAddressFile} />
          {addressFile && <SettingsUploadedFileRow file={addressFile} onRemove={() => setAddressFile(null)} />}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleVerifySubmit}
          className="w-full rounded-xl bg-primary py-3 text-[13px] font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer mt-4"
        >
          Submit Verification Documents
        </button>

      </div>
    </div>
  );
}

// Helpers for Settings ID Verification File Uploads
function SettingsFileDropzone({ onSelect }: { onSelect: (file: SettingsUploadedFile) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border bg-card p-4 hover:border-primary transition-colors text-left cursor-pointer"
    >
      <input
        ref={ref}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          onSelect({
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)}MB`,
          });
        }}
      />
      <UploadCloud className="h-5 w-5 text-primary/60" />
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-semibold text-foreground">Click to upload document</span>
        <span className="text-[9px] text-muted">PDF, DOC, JPG, PNG &bull; Max 5MB</span>
      </div>
    </button>
  );
}

function SettingsUploadedFileRow({ file, onRemove }: { file: SettingsUploadedFile; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 min-w-0">
        <FileIcon className="h-5 w-5 text-primary/60 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-foreground">{file.name}</p>
          <p className="text-[9px] text-muted">{file.size}</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        <button type="button" onClick={onRemove} className="text-muted hover:text-red-500 transition-colors cursor-pointer">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Active Sessions Panel ───────────────────────────────────────────────────

interface ActiveSessionsPanelProps {
  onBack: () => void;
  onSessionRevoked: (device: string) => void;
  onRevokeAll: () => void;
}

function ActiveSessionsPanel({ onBack, onSessionRevoked, onRevokeAll }: ActiveSessionsPanelProps) {
  const [otherSessions, setOtherSessions] = useState([
    { id: '1', device: 'iPhone 15 • Safari Mobile', location: 'London, UK', ip: '82.165.2.14', activeTime: '2 hours ago' },
    { id: '2', device: 'MacBook Pro • Brave', location: 'New York, USA', ip: '24.120.5.82', activeTime: '3 days ago' },
  ]);

  const handleRevoke = (id: string, device: string) => {
    setOtherSessions(otherSessions.filter((s) => s.id !== id));
    onSessionRevoked(device);
  };

  const handleRevokeAllClick = () => {
    setOtherSessions([]);
    onRevokeAll();
  };

  return (
    <div className="relative flex h-full w-full flex-col items-start overflow-hidden bg-background py-[2.125rem] px-0 gap-8">
      {/* Header */}
      <div className="flex items-center gap-4 py-0 pl-4 pr-0">
        <button
          type="button"
          onClick={onBack}
          className="flex size-8 items-center justify-center rounded-full bg-card hover:bg-foreground/5 transition-colors lg:hidden"
          aria-label="Back"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <div className="flex flex-col gap-[0.375rem]">
          <p className="font-sans font-medium text-foreground/85">Active Sessions</p>
          <p className="font-sans text-[10px] text-muted">Manage your active login sessions across devices</p>
        </div>
      </div>

      <div className="h-px w-full bg-border shrink-0" />

      {/* Current Session */}
      <section className="flex w-full flex-col gap-3 px-4">
        <p className="font-sans text-[13px] font-medium text-muted">Current Session</p>
        <div className="flex flex-col rounded-xl bg-card p-4 gap-1">
          <div className="flex items-center justify-between">
            <p className="font-sans text-[13px] font-semibold text-foreground/90">Windows PC • Chrome Browser</p>
            <span className="rounded-full bg-[#8C5CFF]/15 px-2.5 py-0.5 font-sans text-[10px] font-semibold text-[#AC8EF3]">
              Active Now
            </span>
          </div>
          <p className="font-sans text-[11px] text-foreground/50">Lagos, Nigeria • IP: 192.168.1.100</p>
        </div>
      </section>

      {/* Other Sessions */}
      <section className="flex w-full flex-col gap-3 px-4 flex-1 overflow-y-auto no-scrollbar">
        <p className="font-sans text-[13px] font-medium text-muted">Other Sessions</p>
        {otherSessions.length > 0 ? (
          <div className="flex flex-col rounded-xl bg-card overflow-hidden">
            {otherSessions.map((session, index) => (
              <div key={session.id} className="flex flex-col">
                {index > 0 && <div className="h-px w-full bg-border" />}
                <div className="flex items-center justify-between gap-4 px-4 py-4">
                  <div className="flex flex-col gap-0.5">
                    <p className="font-sans text-[13px] font-semibold text-foreground/90">{session.device}</p>
                    <p className="font-sans text-[10px] text-foreground/50">{session.location} • IP: {session.ip}</p>
                    <p className="font-sans text-[10px] text-muted">Last active {session.activeTime}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevoke(session.id, session.device)}
                    className="shrink-0 rounded-lg border border-border bg-transparent px-3 py-1.5 font-sans text-[11px] font-semibold text-red-400 hover:bg-red-500/10 hover:border-red-500/25 transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border bg-card/20 text-center">
            <p className="font-sans text-[12px] text-muted">No other active sessions detected.</p>
          </div>
        )}

        {otherSessions.length > 0 && (
          <button
            type="button"
            onClick={handleRevokeAllClick}
            className="w-full mt-2 rounded-xl border border-red-500/20 bg-red-500/5 py-3 font-sans text-[12px] font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Log out of all other sessions
          </button>
        )}
      </section>
    </div>
  );
}

// ─── Notification Toggle Component ───────────────────────────────────────────

function NotificationToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        'relative h-[1.5rem] w-[2.75rem] shrink-0 cursor-pointer rounded-[3.125rem]',
        'border border-border transition-colors duration-300 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5CFF]',
        checked ? 'bg-[#8C5CFF]' : 'bg-border/50',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-[0.1875rem] size-[1.125rem] rounded-full transition-all duration-300 ease-out',
          checked ? 'left-[calc(100%-1.3125rem)] bg-white' : 'left-[0.25rem] bg-muted',
        ].join(' ')}
      />
    </button>
  );
}

// ─── Notification Settings Panel ──────────────────────────────────────────────

interface NotificationSettingsPanelProps {
  onBack: () => void;
  onSettingChange: (setting: string, enabled: boolean) => void;
}

function NotificationSettingsPanel({ onBack, onSettingChange }: NotificationSettingsPanelProps) {
  const [settings, setSettings] = useState({
    inApp: true,
    push: true,
    email: false,
  });

  const handleToggle = (key: keyof typeof settings, label: string) => {
    const newVal = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newVal }));
    onSettingChange(label, newVal);
  };

  return (
    <div className="relative flex h-full w-full flex-col items-start overflow-hidden bg-background py-[2.125rem] px-0 gap-8">
      {/* Top Header Row with back arrow on mobile */}
      <div className="flex items-center gap-4 py-0 pl-4 pr-0">
        <button
          type="button"
          onClick={onBack}
          className="flex size-8 items-center justify-center rounded-full bg-card hover:bg-foreground/5 transition-colors lg:hidden"
          aria-label="Back to settings menu"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <div className="relative font-sans font-medium text-foreground/80">
          Notification Settings
          <br />
          <span className="font-sans text-[14px] text-muted">stay updated with important alerts, messages, and activities.</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-[0.063rem] w-full bg-border shrink-0" />

      {/* Options list section */}
      <section className="flex w-full flex-col gap-6 px-4">
        <div className="flex flex-col gap-0.75">
          <p className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider">ACCOUNT</p>
        </div>

        <div className="flex flex-col rounded-xl bg-card overflow-hidden">
          {/* In-app */}
          <div className="flex items-center justify-between p-4 gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="font-sans text-[13px] font-semibold text-foreground/90">Allow in-app notifications</p>
              <p className="font-sans text-[11px] text-foreground/50 leading-normal">
                These are notifications that are delivered within the app
              </p>
            </div>
            <NotificationToggle
              checked={settings.inApp}
              onChange={() => handleToggle('inApp', 'In-app notifications')}
            />
          </div>

          <div className="h-px w-full bg-border" />

          {/* Push */}
          <div className="flex items-center justify-between p-4 gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="font-sans text-[13px] font-semibold text-foreground/90">Allow push notification</p>
              <p className="font-sans text-[11px] text-foreground/50 leading-normal">
                These are notifications that are pushed to your device immediately
              </p>
            </div>
            <NotificationToggle
              checked={settings.push}
              onChange={() => handleToggle('push', 'Push notifications')}
            />
          </div>

          <div className="h-px w-full bg-border" />

          {/* Email */}
          <div className="flex items-center justify-between p-4 gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="font-sans text-[13px] font-semibold text-foreground/90">Allow email notifications</p>
              <p className="font-sans text-[11px] text-foreground/50 leading-normal">
                These are notifications that are sent primarily to your email
              </p>
            </div>
            <NotificationToggle
              checked={settings.email}
              onChange={() => handleToggle('email', 'Email notifications')}
            />
          </div>
        </div>
      </section>
    </div>
  );
}


// ─── Delete Account Panel ────────────────────────────────────────────────────

interface DeleteAccountPanelProps {
  onBack: () => void;
  onDeleteConfirm: () => void;
}

function DeleteAccountPanel({ onBack, onDeleteConfirm }: DeleteAccountPanelProps) {
  return (
    <div className="relative flex h-full w-full flex-col items-start overflow-hidden bg-background py-[2.125rem] px-0 gap-8">
      {/* Header */}
      <div className="flex items-center gap-4 py-0 pl-4 pr-0">
        <button
          type="button"
          onClick={onBack}
          className="flex size-8 items-center justify-center rounded-full bg-card hover:bg-foreground/5 transition-colors lg:hidden"
          aria-label="Back"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <div className="flex flex-col gap-[0.375rem]">
          <p className="font-sans font-medium text-foreground/85">Delete Account</p>
          <p className="font-sans text-[10px] text-muted">Permanently remove your CanaFri account</p>
        </div>
      </div>

      <div className="h-px w-full bg-border shrink-0" />

      <section className="flex w-full flex-col gap-6 px-4 flex-1 overflow-y-auto no-scrollbar pb-8">
        <p className="font-sans text-[13px] font-medium text-muted">Before you delete</p>
        
        <div className="flex flex-col rounded-xl bg-red-500/5 border border-red-500/10 p-6 gap-4">
          <div className="flex flex-col gap-2">
            <p className="font-sans text-[13px] font-semibold text-red-400">Important Warning</p>
            <p className="font-sans text-[11px] text-foreground/60 leading-relaxed">
              Deleting your account is permanent and cannot be undone. All your publications, job done histories, job posts, reads, and accumulated Canton Coin balance will be permanently erased.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 border-t border-red-500/10 pt-4">
            <p className="font-sans text-[11px] font-semibold text-foreground/70">What you will lose:</p>
            <ul className="list-disc pl-4 font-sans text-[10px] text-foreground/50 space-y-1">
              <li>Permanent loss of access to your username and handle.</li>
              <li>Deletion of all published blogs and articles.</li>
              <li>Removal of all active and completed job contract listings.</li>
              <li>Forfeiture of any wallet contents linked to this profile.</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={onDeleteConfirm}
            className="w-full mt-2 rounded-xl bg-red-600 hover:bg-red-700 py-3 font-sans text-[13px] font-semibold text-white transition-colors"
          >
            Delete my account
          </button>
        </div>
      </section>
    </div>
  );
}


// ─── Theme Settings Panel ─────────────────────────────────────────────────────

type ThemeOption = 'dark' | 'light' | 'system';

interface ThemeOptionCardProps {
  id: ThemeOption;
  selected: ThemeOption;
  label: string;
  description: string;
  preview: React.ReactNode;
  onSelect: (id: ThemeOption) => void;
}

function ThemeOptionCard({ id, selected, label, description, preview, onSelect }: ThemeOptionCardProps) {
  const isSelected = selected === id;
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={[
        'flex flex-col w-full rounded-xl border overflow-hidden text-left transition duration-300 ease-out',
        isSelected ? 'border-[#8C5CFF] ring-1 ring-[#8C5CFF]/40' : 'border-border hover:border-foreground/20',
      ].join(' ')}
    >
      {/* Preview area */}
      <div className="w-full h-[4.5rem] shrink-0 overflow-hidden">
        {preview}
      </div>
      {/* Label row */}
      <div className="flex items-center justify-between px-4 py-3 bg-card">
        <div className="flex flex-col gap-0.5">
          <p className="font-sans text-[13px] font-semibold text-foreground/90">{label}</p>
          <p className="font-sans text-[10px] text-foreground/50">{description}</p>
        </div>
        {/* Radio dot */}
        <span
          className={[
            'flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition duration-300 ease-out',
            isSelected ? 'border-[#8C5CFF] bg-[#8C5CFF]' : 'border-foreground/30 bg-transparent',
          ].join(' ')}
        >
          {isSelected && <span className="size-1.5 rounded-full bg-white" />}
        </span>
      </div>
    </button>
  );
}

function ThemeSettingsPanel({ onBack }: { onBack: () => void }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative flex h-full w-full flex-col items-start overflow-hidden bg-background py-[2.125rem] px-0 gap-8">
      {/* Header */}
      <div className="flex items-center gap-4 py-0 pl-4 pr-0">
        <button
          type="button"
          onClick={onBack}
          className="flex size-8 items-center justify-center rounded-full bg-card hover:bg-foreground/5 transition-colors lg:hidden"
          aria-label="Back"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <div className="flex flex-col gap-[0.375rem]">
          <p className="font-sans font-medium text-foreground/85">Theme</p>
          <p className="font-sans text-[10px] text-muted">Choose your preferred display style</p>
        </div>
      </div>

      <div className="h-px w-full bg-border shrink-0" />

      <div className="flex flex-col w-full gap-6 px-4 flex-1 overflow-y-auto no-scrollbar pb-8">
        <p className="font-sans text-[11px] font-semibold text-muted uppercase tracking-wider">Appearance</p>

        <div className="flex flex-col gap-3">
          <ThemeOptionCard
            id="dark"
            selected={theme}
            label="Dark"
            description="Optimised for low-light environments"
            onSelect={setTheme}
            preview={
              <div className="w-full h-full bg-[#080808] flex items-end px-3 pb-2 gap-2">
                <div className="h-6 w-1/3 rounded-md bg-background" />
                <div className="h-4 w-1/4 rounded-md bg-[#242424]" />
                <div className="h-5 w-1/5 rounded-md bg-[#8C5CFF]/40" />
              </div>
            }
          />

          <ThemeOptionCard
            id="light"
            selected={theme}
            label="Light"
            description="Clean and bright for daytime use"
            onSelect={setTheme}
            preview={
              <div className="w-full h-full bg-[#F5F8FB] flex items-end px-3 pb-2 gap-2">
                <div className="h-6 w-1/3 rounded-md bg-[#E2E8F0]" />
                <div className="h-4 w-1/4 rounded-md bg-[#CBD5E1]" />
                <div className="h-5 w-1/5 rounded-md bg-[#8C5CFF]/60" />
              </div>
            }
          />

          <ThemeOptionCard
            id="system"
            selected={theme}
            label="System"
            description="Automatically follows your device preference"
            onSelect={setTheme}
            preview={
              <div className="w-full h-full flex">
                <div className="w-1/2 h-full bg-[#080808] flex items-end px-2 pb-2">
                  <div className="h-5 w-3/4 rounded-md bg-background" />
                </div>
                <div className="w-1/2 h-full bg-[#F5F8FB] flex items-end px-2 pb-2">
                  <div className="h-5 w-3/4 rounded-md bg-[#E2E8F0]" />
                </div>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}

// ─── Language & Region Settings Panel ─────────────────────────────────────────

interface LanguageSettingsPanelProps {
  onBack: () => void;
  onSave: () => void;
}

function LanguageSettingsPanel({ onBack, onSave }: LanguageSettingsPanelProps) {
  const [language, setLanguage] = useState('en-US');
  const [currency, setCurrency] = useState('CC');
  const [timezone, setTimezone] = useState('WAT');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    onSave();
  };

  return (
    <div className="relative flex h-full w-full flex-col items-start overflow-hidden bg-background py-[2.125rem] px-0 gap-8">
      {/* Header */}
      <div className="flex items-center gap-4 py-0 pl-4 pr-0">
        <button
          type="button"
          onClick={onBack}
          className="flex size-8 items-center justify-center rounded-full bg-card hover:bg-foreground/5 transition-colors lg:hidden"
          aria-label="Back"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <div className="flex flex-col gap-[0.375rem]">
          <p className="font-sans font-medium text-foreground/85">Language & Region</p>
          <p className="font-sans text-[10px] text-muted">Customize your language, currency, and time zone</p>
        </div>
      </div>

      <div className="h-px w-full bg-border shrink-0" />

      <div className="flex flex-col w-full gap-8 px-4 flex-1 overflow-y-auto no-scrollbar pb-8">
        {/* Section 1: Language */}
        <section className="flex flex-col gap-4">
          <p className="font-sans text-[13px] font-medium text-muted">Language</p>
          <div className="flex flex-col rounded-xl bg-card overflow-hidden">
            <div className="flex items-center justify-between gap-4 p-4 flex-wrap">
              <div className="flex flex-col gap-0.5">
                <p className="font-sans text-[13px] font-semibold text-foreground/90">App language</p>
                <p className="font-sans text-[11px] text-muted">Interface display language</p>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="shrink-0 rounded-lg border border-border bg-background px-3 py-2 font-sans text-[12px] text-foreground outline-none focus:border-[#8C5CFF] focus:ring-1 focus:ring-[#8C5CFF] transition duration-300 ease-out"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="fr-FR">French (Français)</option>
                <option value="es-ES">Spanish (Español)</option>
                <option value="de-DE">German (Deutsch)</option>
                <option value="sw-KE">Swahili (Kiswahili)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 2: Currency */}
        <section className="flex flex-col gap-4">
          <p className="font-sans text-[13px] font-medium text-muted">Currency</p>
          <div className="flex flex-col rounded-xl bg-card overflow-hidden">
            <div className="flex items-center justify-between gap-4 p-4 flex-wrap">
              <div className="flex flex-col gap-0.5">
                <p className="font-sans text-[13px] font-semibold text-foreground/90">Display currency</p>
                <p className="font-sans text-[11px] text-muted">Preferred currency for balances and payouts</p>
              </div>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="shrink-0 rounded-lg border border-border bg-background px-3 py-2 font-sans text-[12px] text-foreground outline-none focus:border-[#8C5CFF] focus:ring-1 focus:ring-[#8C5CFF] transition duration-300 ease-out"
              >
                <option value="CC">Canton Coin (CC)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
                <option value="NGN">Nigerian Naira (₦)</option>
                <option value="CAD">Canadian Dollar ($)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 3: Time Zone */}
        <section className="flex flex-col gap-4">
          <p className="font-sans text-[13px] font-medium text-muted">Time Zone</p>
          <div className="flex flex-col rounded-xl bg-card overflow-hidden">
            <div className="flex items-center justify-between gap-4 p-4 flex-wrap">
              <div className="flex flex-col gap-0.5">
                <p className="font-sans text-[13px] font-semibold text-foreground/90">Display time zone</p>
                <p className="font-sans text-[11px] text-muted">Used for activity timestamps and schedules</p>
              </div>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="shrink-0 rounded-lg border border-border bg-background px-3 py-2 font-sans text-[12px] text-foreground outline-none focus:border-[#8C5CFF] focus:ring-1 focus:ring-[#8C5CFF] transition duration-300 ease-out"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="WAT">GMT+1 (Africa/Lagos)</option>
                <option value="GMT">GMT+0 (Europe/London)</option>
                <option value="EST">GMT-5 (America/New_York)</option>
                <option value="PST">GMT-8 (America/Los_Angeles)</option>
                <option value="JST">GMT+9 (Asia/Tokyo)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Save button */}
        <div className="mt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-[#8C5CFF] py-3 font-sans text-[13px] font-semibold text-white hover:bg-[#AC8EF3] transition duration-300 ease-out disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving changes…' : 'Save preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Subscription & Billing Settings Panel ───────────────────────────────────

interface SubscriptionSettingsPanelProps {
  onBack: () => void;
  onUpgrade: () => void;
  onCancel: () => void;
  onDownloadInvoice: (id: string) => void;
}

function SubscriptionSettingsPanel({
  onBack,
  onUpgrade,
  onCancel,
  onDownloadInvoice,
}: SubscriptionSettingsPanelProps) {
  const [canceling, setCanceling] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const billingHistory = [
    { id: 'inv_101', item: 'Creator Pro Plan (Monthly)', date: 'June 27, 2026', amount: '100 CC', status: 'Paid' },
    { id: 'inv_100', item: 'Featured Job Promotion', date: 'June 14, 2026', amount: '25 CC', status: 'Paid' },
    { id: 'inv_099', item: 'Creator Pro Plan (Monthly)', date: 'May 27, 2026', amount: '100 CC', status: 'Paid' },
  ];

  const handleConfirmCancel = async () => {
    setCanceling(true);
    await new Promise((r) => setTimeout(r, 900));
    setCanceling(false);
    setShowConfirmCancel(false);
    onCancel();
  };

  const handleDownload = async (id: string) => {
    setDownloadingId(id);
    await new Promise((r) => setTimeout(r, 800));
    setDownloadingId(null);
    onDownloadInvoice(id);
  };

  return (
    <div className="relative flex h-full w-full flex-col items-start overflow-hidden bg-background py-[2.125rem] px-0 gap-8">
      {/* Header */}
      <div className="flex items-center gap-4 py-0 pl-4 pr-0">
        <button
          type="button"
          onClick={onBack}
          className="flex size-8 items-center justify-center rounded-full bg-card hover:bg-foreground/5 transition-colors lg:hidden"
          aria-label="Back"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <div className="flex flex-col gap-[0.375rem]">
          <p className="font-sans font-medium text-foreground/85">Subscription & Billing</p>
          <p className="font-sans text-[10px] text-muted">Manage your membership plan and invoice history</p>
        </div>
      </div>

      <div className="h-px w-full bg-border shrink-0" />

      <div className="flex flex-col w-full gap-8 px-4 flex-1 overflow-y-auto no-scrollbar pb-8">
        {/* Option 1: Current Subscription */}
        <section className="flex flex-col gap-4">
          <p className="font-sans text-[13px] font-medium text-muted">Current subscription</p>
          <div className="flex flex-col rounded-xl bg-card overflow-hidden border border-border">
            <div className="flex flex-col p-5 gap-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2.5">
                    <p className="font-sans text-[16px] font-bold text-foreground">Creator Pro Plan</p>
                    <span className="rounded-full bg-[#8C5CFF]/15 px-2.5 py-0.5 font-sans text-[10px] font-semibold text-[#AC8EF3]">
                      Active
                    </span>
                  </div>
                  <p className="font-sans text-[12px] text-muted">100 CC / month • Renews on July 27, 2026</p>
                </div>
              </div>

              {/* Plan Included Features */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center gap-2 font-sans text-[12px] text-foreground/80">
                  <Check size={14} className="text-[#8C5CFF]" />
                  <span>Unlimited job posts and proposal applications</span>
                </div>
                <div className="flex items-center gap-2 font-sans text-[12px] text-foreground/80">
                  <Check size={14} className="text-[#8C5CFF]" />
                  <span>Zero commission fees on first 5 milestones</span>
                </div>
                <div className="flex items-center gap-2 font-sans text-[12px] text-foreground/80">
                  <Check size={14} className="text-[#8C5CFF]" />
                  <span>Priority placement in talent marketplace search</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={onUpgrade}
                  className="rounded-lg bg-[#8C5CFF] px-4 py-2 font-sans text-[13px] font-semibold text-white hover:bg-[#AC8EF3] transition duration-300 ease-out cursor-pointer"
                >
                  Upgrade plan
                </button>

                {showConfirmCancel ? (
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-[11px] text-foreground/50">Cancel membership?</span>
                    <button
                      type="button"
                      onClick={handleConfirmCancel}
                      disabled={canceling}
                      className="rounded-lg border border-red-500/25 bg-red-500/5 px-3 py-1.5 font-sans text-[11px] font-semibold text-red-400 hover:bg-red-500/10 transition duration-300 ease-out disabled:opacity-50 cursor-pointer"
                    >
                      {canceling ? 'Canceling…' : 'Yes, cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmCancel(false)}
                      className="rounded-lg border border-border bg-transparent px-3 py-1.5 font-sans text-[11px] font-semibold text-foreground/60 hover:bg-foreground/5 transition duration-300 ease-out cursor-pointer"
                    >
                      Keep plan
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmCancel(true)}
                    className="rounded-lg border border-border bg-transparent px-4 py-2 font-sans text-[13px] font-semibold text-foreground/80 hover:bg-foreground/5 transition duration-300 ease-out cursor-pointer"
                  >
                    Cancel subscription
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Option 2: Billing History */}
        <section className="flex flex-col gap-4">
          <p className="font-sans text-[13px] font-medium text-muted">Billing history</p>
          <div className="flex flex-col rounded-xl bg-card overflow-hidden border border-border">
            {billingHistory.map((inv, index) => (
              <div key={inv.id} className="flex flex-col">
                {index > 0 && <div className="h-px w-full bg-border" />}
                <div className="flex items-center justify-between gap-4 p-4 flex-wrap">
                  <div className="flex flex-col gap-0.5">
                    <p className="font-sans text-[13px] font-semibold text-foreground/90">{inv.item}</p>
                    <p className="font-sans text-[11px] text-muted">{inv.date} • {inv.amount}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-sans text-[10px] font-semibold text-emerald-400">
                      {inv.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownload(inv.id)}
                      disabled={downloadingId === inv.id}
                      className="flex size-8 items-center justify-center rounded-lg border border-border bg-transparent text-foreground/70 hover:bg-foreground/5 hover:text-foreground transition duration-300 ease-out disabled:opacity-50 cursor-pointer"
                      title="Download receipt"
                    >
                      <Download size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Wallet Settings Panel ─────────────────────────────────────────────────────

interface WalletSettingsPanelProps {
  onBack: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

function WalletSettingsPanel({ onBack, onConnect, onDisconnect }: WalletSettingsPanelProps) {
  const [connected, setConnected] = useState(true);
  const [walletAddress] = useState('Canafri:a2b...9f3c');
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    await new Promise((r) => setTimeout(r, 900));
    setConnected(false);
    setDisconnecting(false);
    setConfirmDisconnect(false);
    onDisconnect();
  };

  const handleConnect = async () => {
    setConnecting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setConnected(true);
    setConnecting(false);
    onConnect();
  };

  return (
    <div className="relative flex h-full w-full flex-col items-start overflow-hidden bg-background py-[2.125rem] px-0 gap-8">
      {/* Header */}
      <div className="flex items-center gap-4 py-0 pl-4 pr-0">
        <button
          type="button"
          onClick={onBack}
          className="flex size-8 items-center justify-center rounded-full bg-card hover:bg-foreground/5 transition-colors lg:hidden"
          aria-label="Back"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <div className="flex flex-col gap-[0.375rem]">
          <p className="font-sans font-medium text-foreground/85">Wallet Binding</p>
          <p className="font-sans text-[10px] text-muted">Manage your connected Canton wallet</p>
        </div>
      </div>

      <div className="h-px w-full bg-border shrink-0" />

      <div className="flex flex-col w-full gap-8 px-4 flex-1 overflow-y-auto no-scrollbar pb-8">

        {/* Connected Wallet Section */}
        <section className="flex flex-col gap-4">
          <p className="font-sans text-[13px] font-medium text-muted">Connected wallet</p>
          <div className="flex flex-col rounded-xl bg-card overflow-hidden">

            {/* Wallet row */}
            <div className="flex items-center justify-between gap-4 p-4 flex-wrap">
              <div className="flex flex-col gap-0.5">
                <p className="font-sans text-[13px] font-semibold text-foreground/90">Canton wallet</p>
                <p className="font-sans text-[10px] text-muted font-mono">
                  {connected ? walletAddress : 'No wallet connected'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Status badge */}
                <span
                  className={[
                    'rounded-full px-2.5 py-0.5 font-sans text-[10px] font-semibold transition-colors duration-300 ease-out',
                    connected
                      ? 'bg-[#8C5CFF]/15 text-[#AC8EF3]'
                      : 'bg-foreground/5 text-foreground/40',
                  ].join(' ')}
                >
                  {connected ? 'Connected' : 'Disconnected'}
                </span>

                {connected && (
                  confirmDisconnect ? (
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-[11px] text-foreground/50">Sure?</span>
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        className="rounded-lg border border-red-500/25 bg-red-500/5 px-3 py-1.5 font-sans text-[11px] font-semibold text-red-400 hover:bg-red-500/10 transition duration-300 ease-out disabled:opacity-50"
                      >
                        {disconnecting ? 'Disconnecting…' : 'Yes, disconnect'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDisconnect(false)}
                        className="rounded-lg border border-border bg-transparent px-3 py-1.5 font-sans text-[11px] font-semibold text-foreground/60 hover:bg-foreground/5 transition duration-300 ease-out"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDisconnect(true)}
                      className="rounded-lg border border-border bg-transparent px-4 py-2 font-sans text-[13px] font-semibold text-foreground/85 hover:bg-foreground/5 hover:text-foreground transition duration-300 ease-out"
                    >
                      Disconnect
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="h-px w-full bg-border" />

            {/* Connect new wallet */}
            <div className="flex items-center justify-between gap-4 p-4 flex-wrap">
              <div className="flex flex-col gap-0.5">
                <p className="font-sans text-[13px] font-semibold text-foreground/90">
                  {connected ? 'Connect new wallet' : 'Connect a wallet'}
                </p>
                <p className="font-sans text-[11px] text-foreground/50 leading-normal">
                  {connected ? 'Replace your currently linked Canton wallet' : 'Link a Canton wallet to your account'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting}
                className="shrink-0 rounded-lg bg-[#8C5CFF] px-4 py-2 font-sans text-[13px] font-semibold text-white hover:bg-[#AC8EF3] transition duration-300 ease-out disabled:opacity-50"
              >
                {connecting ? 'Connecting…' : 'Connect'}
              </button>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}

// ─── Privacy Settings Panel ───────────────────────────────────────────────────

interface PrivacySettingsPanelProps {
  onBack: () => void;
  onSettingChange: (setting: string, val: string | boolean) => void;
  onRequestExport: () => Promise<void>;
  onDownloadCSV: () => Promise<void>;
}

function PrivacySettingsPanel({
  onBack,
  onSettingChange,
  onRequestExport,
  onDownloadCSV,
}: PrivacySettingsPanelProps) {
  const [profileVisibility, setProfileVisibility] = useState('everyone');
  const [activityStatus, setActivityStatus] = useState(true);
  const [servicePolicy, setServicePolicy] = useState(true);
  
  const [exportingData, setExportingData] = useState(false);
  const [downloadingCSV, setDownloadingCSV] = useState(false);

  const handleVisibilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setProfileVisibility(val);
    onSettingChange('Profile visibility', val);
  };

  const handleActivityToggle = () => {
    const nextVal = !activityStatus;
    setActivityStatus(nextVal);
    onSettingChange('Activity status', nextVal);
  };

  const handlePolicyToggle = () => {
    const nextVal = !servicePolicy;
    setServicePolicy(nextVal);
    onSettingChange('Service policy consent', nextVal);
  };

  const handleExportClick = async () => {
    setExportingData(true);
    await onRequestExport();
    setExportingData(false);
  };

  const handleDownloadClick = async () => {
    setDownloadingCSV(true);
    await onDownloadCSV();
    setDownloadingCSV(false);
  };

  return (
    <div className="relative flex h-full w-full flex-col items-start overflow-hidden bg-background py-[2.125rem] px-0 gap-8">
      {/* Header */}
      <div className="flex items-center gap-4 py-0 pl-4 pr-0">
        <button
          type="button"
          onClick={onBack}
          className="flex size-8 items-center justify-center rounded-full bg-card hover:bg-foreground/5 transition-colors lg:hidden"
          aria-label="Back"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <div className="flex flex-col gap-[0.375rem]">
          <p className="font-sans font-medium text-foreground/85">Privacy Settings</p>
          <p className="font-sans text-[10px] text-muted">Control who sees your information and manage your data</p>
        </div>
      </div>

      <div className="h-px w-full bg-border shrink-0" />

      {/* Main scrollable body */}
      <div className="flex flex-col w-full gap-8 px-4 flex-1 overflow-y-auto no-scrollbar pb-8">
        
        {/* Section 1: Visibility */}
        <section className="flex flex-col gap-4">
          <p className="font-sans text-[13px] font-medium text-muted">Visibility</p>
          <div className="flex flex-col rounded-xl bg-card overflow-hidden">
            
            {/* Profile Visibility Selector */}
            <div className="flex items-center justify-between p-4 gap-4">
              <div className="flex flex-col gap-0.5">
                <p className="font-sans text-[13px] font-semibold text-foreground/90">Profile visibility</p>
                <p className="font-sans text-[11px] text-foreground/50 leading-normal">
                  Who can view your profile page
                </p>
              </div>
              <select
                value={profileVisibility}
                onChange={handleVisibilityChange}
                className="rounded-lg border border-border bg-background px-3 py-1.5 font-sans text-[12px] text-foreground outline-none focus:border-[#8C5CFF] focus:ring-1 focus:ring-[#8C5CFF] transition duration-300 ease-out"
              >
                <option value="everyone">Everyone</option>
                <option value="members">Members Only</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className="h-px w-full bg-border" />

            {/* Activity Status Toggle */}
            <div className="flex items-center justify-between p-4 gap-4">
              <div className="flex flex-col gap-0.5">
                <p className="font-sans text-[13px] font-semibold text-foreground/90">Activity status</p>
                <p className="font-sans text-[11px] text-foreground/50 leading-normal">
                  Show when you are online in the app
                </p>
              </div>
              <NotificationToggle
                checked={activityStatus}
                onChange={handleActivityToggle}
              />
            </div>

            <div className="h-px w-full bg-border" />

            {/* Service Policy Toggle */}
            <div className="flex items-center justify-between p-4 gap-4">
              <div className="flex flex-col gap-0.5">
                <p className="font-sans text-[13px] font-semibold text-foreground/90">Canafri service policy</p>
                <p className="font-sans text-[11px] text-foreground/50 leading-normal">
                  Accept general Terms & Services policy tracking
                </p>
              </div>
              <NotificationToggle
                checked={servicePolicy}
                onChange={handlePolicyToggle}
              />
            </div>

          </div>
        </section>

        {/* Section 2: Data Export */}
        <section className="flex flex-col gap-4">
          <p className="font-sans text-[13px] font-medium text-muted">Export</p>
          <div className="flex flex-col rounded-xl bg-card overflow-hidden">
            
            {/* Account Data Export */}
            <div className="flex items-center justify-between p-4 gap-4">
              <div className="flex flex-col gap-0.5">
                <p className="font-sans text-[13px] font-semibold text-foreground/90">Account data</p>
                <p className="font-sans text-[11px] text-foreground/50 leading-normal">
                  Download profile, settings, and read logs
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportClick}
                disabled={exportingData}
                className="shrink-0 rounded-lg border border-border bg-transparent px-4 py-2 font-sans text-[13px] font-semibold text-foreground/85 hover:bg-foreground/5 hover:text-foreground transition duration-300 ease-out disabled:opacity-50"
              >
                {exportingData ? 'Requesting...' : 'Request export'}
              </button>
            </div>

            <div className="h-px w-full bg-border" />

            {/* Transaction History Export */}
            <div className="flex items-center justify-between p-4 gap-4">
              <div className="flex flex-col gap-0.5">
                <p className="font-sans text-[13px] font-semibold text-foreground/90">Transaction history</p>
                <p className="font-sans text-[11px] text-foreground/50 leading-normal">
                  Download all Canton Coin movements as CSV
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadClick}
                disabled={downloadingCSV}
                className="shrink-0 rounded-lg bg-[#8c5cff] px-4 py-2 font-sans text-[13px] font-semibold text-white hover:bg-[#ac8ef3] transition duration-300 ease-out disabled:opacity-50"
              >
                {downloadingCSV ? 'Downloading...' : 'Download CSV'}
              </button>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}

// ─── Placeholder Settings Panel ───────────────────────────────────────────────

function PlaceholderPanel({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-4 border-b border-border px-4 py-4">
        <button
          type="button"
          onClick={onBack}
          className="text-foreground/60 hover:text-foreground transition-colors lg:hidden"
        >
          <ChevronLeft size={20} />
        </button>
        <p className="font-sans text-[20px] font-bold text-foreground">{title}</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="font-sans text-[13px] text-muted">
          {title} configuration settings coming soon.
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsPage({ onBack, sellerMode = false }: PageProps) {
  const { toast } = useToast();
  const [selected, setSelected] = useState('profile-settings');
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [personalInfoOpen, setPersonalInfoOpen] = useState(false);
  const [contactDetailsSelected, setContactDetailsSelected] = useState(false);
  const [activeSessionsSelected, setActiveSessionsSelected] = useState(false);
  const [deleteAccountSelected, setDeleteAccountSelected] = useState(false);
  const [verifyIdentitySelected, setVerifyIdentitySelected] = useState(false);
  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [changePhoneOpen, setChangePhoneOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);

  const handleSelect = (key: string) => {
    setSelected(key);
    setContactDetailsSelected(false);
    setActiveSessionsSelected(false);
    setDeleteAccountSelected(false);
    setVerifyIdentitySelected(false);
    setMobileShowDetail(true);
  };

  const handleBack = () => {
    if (contactDetailsSelected) {
      setContactDetailsSelected(false);
    } else if (activeSessionsSelected) {
      setActiveSessionsSelected(false);
    } else if (deleteAccountSelected) {
      setDeleteAccountSelected(false);
    } else if (verifyIdentitySelected) {
      setVerifyIdentitySelected(false);
    } else {
      setMobileShowDetail(false);
    }
  };

  const renderContentPanel = () => {
    const label = MENU_CONFIG.flatMap((g) => g.items).find((i) => i.key === selected)?.label ?? selected;

    if (selected === 'profile-settings' && !contactDetailsSelected) {
      return (
        <ProfileSettingsPanel
          onBack={handleBack}
          onPersonalInfoOpen={() => setPersonalInfoOpen(true)}
          onContactDetailsOpen={() => setContactDetailsSelected(true)}
        />
      );
    }

    if (selected === 'profile-settings' && contactDetailsSelected) {
      return (
        <ContactDetailsPanel
          onBack={handleBack}
          onChangeEmail={() => setChangeEmailOpen(true)}
          onChangePhone={() => setChangePhoneOpen(true)}
        />
      );
    }

    if (selected === 'security' && !activeSessionsSelected && !deleteAccountSelected && !verifyIdentitySelected) {
      return (
        <SecuritySettingsPanel
          onBack={handleBack}
          onPasswordOpen={() => setChangePasswordOpen(true)}
          onTwoFactorOpen={() => setTwoFactorOpen(true)}
          onActiveSessionsOpen={() => setActiveSessionsSelected(true)}
          onDeleteAccountOpen={() => setDeleteAccountSelected(true)}
          onVerifyIdentityOpen={() => setVerifyIdentitySelected(true)}
          sellerMode={sellerMode}
        />
      );
    }

    if (selected === 'security' && verifyIdentitySelected) {
      return (
        <VerifyIdentityPanel
          onBack={handleBack}
        />
      );
    }

    if (selected === 'security' && activeSessionsSelected) {
      return (
        <ActiveSessionsPanel
          onBack={handleBack}
          onSessionRevoked={(device) => {
            toast(`Session revoked successfully for ${device}`, 'success');
          }}
          onRevokeAll={() => {
            toast('Logged out of all other sessions successfully', 'success');
          }}
        />
      );
    }

    if (selected === 'security' && deleteAccountSelected) {
      return (
        <DeleteAccountPanel
          onBack={handleBack}
          onDeleteConfirm={() => {
            toast('Account deletion initiated successfully', 'success');
          }}
        />
      );
    }

    if (selected === 'notification') {
      return (
        <NotificationSettingsPanel
          onBack={handleBack}
          onSettingChange={() => {}}
        />
      );
    }

    if (selected === 'privacy') {
      return (
        <PrivacySettingsPanel
          onBack={handleBack}
          onSettingChange={() => {}}
          onRequestExport={async () => {
            await new Promise((r) => setTimeout(r, 1200));
            toast('Account data export requested. Check your email shortly.', 'success');
          }}
          onDownloadCSV={async () => {
            await new Promise((r) => setTimeout(r, 1000));
            toast('Transaction history CSV downloaded successfully', 'success');
          }}
        />
      );
    }

    if (selected === 'wallet') {
      return (
        <WalletSettingsPanel
          onBack={handleBack}
          onConnect={() => {
            toast('Canton wallet connected successfully', 'success');
          }}
          onDisconnect={() => {
            toast('Canton wallet disconnected successfully', 'success');
          }}
        />
      );
    }

    if (selected === 'theme') {
      return <ThemeSettingsPanel onBack={handleBack} />;
    }

    if (selected === 'languages') {
      return (
        <LanguageSettingsPanel
          onBack={handleBack}
          onSave={() => {
            toast('Language and regional preferences saved successfully', 'success');
          }}
        />
      );
    }

    if (selected === 'subscription') {
      return (
        <SubscriptionSettingsPanel
          onBack={handleBack}
          onUpgrade={() => {
            toast('Subscription plan upgrade initiated', 'success');
          }}
          onCancel={() => {
            toast('Subscription canceled successfully', 'success');
          }}
          onDownloadInvoice={() => {
            toast('Invoice receipt downloaded successfully', 'success');
          }}
        />
      );
    }

    return <PlaceholderPanel title={label} onBack={handleBack} />;
  };

  return (
    <>
      {/* ── Personal Info overlay modal ── */}
      {personalInfoOpen && (
        <PersonalInfoModal
          user={{ name: 'John Trek', username: '@johntrek', memberSince: 'April 2026' }}
          onClose={() => setPersonalInfoOpen(false)}
          onSave={(data) => {
            console.log('Saved personal info:', data);
            toast('Personal info updated successfully', 'success');
          }}
        />
      )}

      {/* ── Change Email modal ── */}
      {changeEmailOpen && (
        <ChangeEmailModal
          current="janedoe@gmail.com"
          onClose={() => setChangeEmailOpen(false)}
          onSave={(email) => {
            console.log('New email:', email);
            toast('Email address updated successfully', 'success');
          }}
        />
      )}

      {/* ── Change Phone modal ── */}
      {changePhoneOpen && (
        <ChangePhoneModal
          current="+234 *** 5678"
          onClose={() => setChangePhoneOpen(false)}
          onSave={(phone) => {
            console.log('New phone:', phone);
            toast('Phone number updated successfully', 'success');
          }}
        />
      )}

      {/* ── Change Password modal ── */}
      {changePasswordOpen && (
        <ChangePasswordModal
          onClose={() => setChangePasswordOpen(false)}
          onSave={() => {
            toast('Password changed successfully', 'success');
          }}
        />
      )}

      {/* ── Two Factor Auth modal ── */}
      {twoFactorOpen && (
        <TwoFactorAuthModal
          onClose={() => setTwoFactorOpen(false)}
          onSave={(enabled) => {
            toast(
              enabled
                ? 'Two-factor authentication enabled successfully'
                : 'Two-factor authentication disabled successfully',
              'success'
            );
          }}
        />
      )}

      <div className="flex h-full w-full overflow-hidden bg-background lg:gap-6 lg:p-6">
        {/* ── Left menu (always visible on desktop, hidden on mobile if detail is open) ── */}
        <div
          className={[
            'flex-col overflow-hidden bg-background w-full',
            mobileShowDetail ? 'hidden lg:flex' : 'flex',
            'lg:flex-1 lg:border-r lg:border-border',
          ].join(' ')}
        >
          <SettingsMenu selected={selected} onSelect={handleSelect} />
        </div>

        {/* ── Right detail panel ── */}
        <div
          className={[
            'flex-1 min-w-0 overflow-hidden',
            mobileShowDetail ? 'flex flex-col' : 'hidden lg:flex lg:flex-col',
          ].join(' ')}
        >
          {renderContentPanel()}
        </div>
      </div>
    </>
  );
}
