'use client';

import { useState } from 'react';
import { Check, Clock, Globe, Link2, ChevronLeft, Eye, X, FileText, ExternalLink } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ListTab = 'Pending' | 'Flagged' | 'Recent';

interface ChecklistItem {
  id: string;
  label: string;
  sub: string;
  done: boolean;
}

interface PortfolioFile {
  id: string;
  name: string;
  type: 'pdf' | 'link';
}

interface SellerApplicant {
  id: number;
  name: string;
  handle: string;
  location: string;
  appliedAgo: string;
  specialty: string;
  level: string;
  languages: string;
  initials: string;
  bio: string;
  skills: string[];
  checklist: ChecklistItem[];
  portfolio: PortfolioFile[];
  tab: ListTab;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const APPLICANTS: SellerApplicant[] = [
  {
    id: 1,
    name: 'John Trek',
    handle: '@johntrek',
    location: 'Lagos, Nigeria',
    appliedAgo: 'Applied 1 hour ago',
    specialty: 'UI/UX Design',
    level: 'Intermediate',
    languages: '5 languages',
    initials: 'JT',
    bio: 'Product designer with 4 years of experience working with Web3 startups across Africa. I specialise in dashboard interfaces and have shipped products for two DeFi platforms. Looking to bring clean, accessible design to the Canton ecosystem.',
    skills: ['React.js', 'Figma', 'UI/UX Design', 'Web3 Design'],
    checklist: [
      { id: 'profile',   label: 'John Trek',          sub: 'Name, bio, country, photo', done: true },
      { id: 'skills',    label: 'Skills selected',     sub: 'Primary + sub-skills',     done: true },
      { id: 'wallet',    label: 'Wallet bound',        sub: 'One Canton wallet',         done: true },
      { id: 'phone',     label: 'Phone verified',      sub: 'OTP confirmed',             done: true },
      { id: 'id',        label: 'ID verification',     sub: 'Optional — not submitted',  done: false },
      { id: 'portfolio', label: 'Portfolio attached',  sub: '3 samples provided',        done: false },
    ],
    portfolio: [
      { id: 'p1', name: 'dashboard-project-2025.pdf', type: 'pdf' },
      { id: 'p2', name: 'dashboard-project-2025.pdf', type: 'link' },
      { id: 'p3', name: 'dashboard-project-2025.pdf', type: 'link' },
    ],
    tab: 'Pending',
  },
  {
    id: 2,
    name: 'John Trek',
    handle: '@johntrek2',
    location: 'Accra, Ghana',
    appliedAgo: 'Applied 2 hours ago',
    specialty: 'UI/UX Design',
    level: 'Expert',
    languages: '3 languages',
    initials: 'JT',
    bio: 'Seasoned UX lead with 7 years experience across fintech and Web3. Previously led design at two African startups. Strong systems thinker with a deep understanding of mobile-first design patterns.',
    skills: ['Figma', 'Adobe XD', 'Prototyping', 'Design Systems'],
    checklist: [
      { id: 'profile',   label: 'John Trek',          sub: 'Name, bio, country, photo', done: true },
      { id: 'skills',    label: 'Skills selected',     sub: 'Primary + sub-skills',     done: true },
      { id: 'wallet',    label: 'Wallet bound',        sub: 'One Canton wallet',         done: true },
      { id: 'phone',     label: 'Phone verified',      sub: 'OTP confirmed',             done: true },
      { id: 'id',        label: 'ID verification',     sub: 'Government ID submitted',   done: true },
      { id: 'portfolio', label: 'Portfolio attached',  sub: '2 samples provided',        done: true },
    ],
    portfolio: [
      { id: 'p1', name: 'portfolio-deck-2025.pdf', type: 'pdf' },
      { id: 'p2', name: 'case-study-defi-app.pdf', type: 'pdf' },
    ],
    tab: 'Pending',
  },
  {
    id: 3,
    name: 'John Trek',
    handle: '@johntrek3',
    location: 'Nairobi, Kenya',
    appliedAgo: 'Applied 2 hours ago',
    specialty: 'UI/UX Design',
    level: 'Beginner',
    languages: '2 languages',
    initials: 'JT',
    bio: 'Junior designer pivoting into Web3 from a traditional agency background. Eager to grow and contribute to the Canton ecosystem with fresh perspectives.',
    skills: ['Figma', 'Canva', 'Wireframing'],
    checklist: [
      { id: 'profile',   label: 'John Trek',          sub: 'Name, bio, country, photo', done: true },
      { id: 'skills',    label: 'Skills selected',     sub: 'Primary + sub-skills',     done: true },
      { id: 'wallet',    label: 'Wallet bound',        sub: 'One Canton wallet',         done: true },
      { id: 'phone',     label: 'Phone verified',      sub: 'OTP confirmed',             done: false },
      { id: 'id',        label: 'ID verification',     sub: 'Optional — not submitted',  done: false },
      { id: 'portfolio', label: 'Portfolio attached',  sub: 'No samples yet',            done: false },
    ],
    portfolio: [],
    tab: 'Pending',
  },
  {
    id: 4,
    name: 'John Trek',
    handle: '@johntrek4',
    location: 'Lagos, Nigeria',
    appliedAgo: 'Applied 2 hours ago',
    specialty: 'UI/UX Design',
    level: 'Intermediate',
    languages: '4 languages',
    initials: 'JT',
    bio: 'Multidisciplinary designer with strong experience in mobile applications and Web3 DApp interfaces.',
    skills: ['React.js', 'Figma', 'Motion Design'],
    checklist: [
      { id: 'profile',   label: 'John Trek',          sub: 'Name, bio, country, photo', done: true },
      { id: 'skills',    label: 'Skills selected',     sub: 'Primary + sub-skills',     done: true },
      { id: 'wallet',    label: 'Wallet bound',        sub: 'One Canton wallet',         done: true },
      { id: 'phone',     label: 'Phone verified',      sub: 'OTP confirmed',             done: true },
      { id: 'id',        label: 'ID verification',     sub: 'Optional — not submitted',  done: false },
      { id: 'portfolio', label: 'Portfolio attached',  sub: '3 samples provided',        done: true },
    ],
    portfolio: [
      { id: 'p1', name: 'dashboard-project-2025.pdf', type: 'pdf' },
      { id: 'p2', name: 'dashboard-project-2025.pdf', type: 'link' },
      { id: 'p3', name: 'case-study-mobile.pdf',      type: 'pdf' },
    ],
    tab: 'Pending',
  },
  {
    id: 5,
    name: 'John Trek',
    handle: '@johntrek5',
    location: 'Abuja, Nigeria',
    appliedAgo: 'Applied 2 hours ago',
    specialty: 'UI/UX Design',
    level: 'Intermediate',
    languages: '3 languages',
    initials: 'JT',
    bio: 'Creative designer focused on building delightful user experiences for emerging markets.',
    skills: ['Figma', 'Sketch', 'User Research'],
    checklist: [
      { id: 'profile',   label: 'John Trek',          sub: 'Name, bio, country, photo', done: true },
      { id: 'skills',    label: 'Skills selected',     sub: 'Primary + sub-skills',     done: true },
      { id: 'wallet',    label: 'Wallet bound',        sub: 'One Canton wallet',         done: true },
      { id: 'phone',     label: 'Phone verified',      sub: 'OTP confirmed',             done: true },
      { id: 'id',        label: 'ID verification',     sub: 'Optional — not submitted',  done: false },
      { id: 'portfolio', label: 'Portfolio attached',  sub: '1 sample provided',         done: true },
    ],
    portfolio: [
      { id: 'p1', name: 'portfolio-2025.pdf', type: 'pdf' },
    ],
    tab: 'Pending',
  },
  {
    id: 6,
    name: 'John Trek',
    handle: '@johntrek6',
    location: 'Cape Town, SA',
    appliedAgo: 'Applied 2 hours ago',
    specialty: 'UI/UX Design',
    level: 'Intermediate',
    languages: '2 languages',
    initials: 'JT',
    bio: 'UX designer specialising in data-heavy dashboards and analytics products.',
    skills: ['Figma', 'Data Visualisation'],
    checklist: [
      { id: 'profile',   label: 'John Trek',          sub: 'Name, bio, country, photo', done: true },
      { id: 'skills',    label: 'Skills selected',     sub: 'Primary + sub-skills',     done: false },
      { id: 'wallet',    label: 'Wallet bound',        sub: 'Not yet bound',             done: false },
      { id: 'phone',     label: 'Phone verified',      sub: 'OTP confirmed',             done: true },
      { id: 'id',        label: 'ID verification',     sub: 'Optional — not submitted',  done: false },
      { id: 'portfolio', label: 'Portfolio attached',  sub: '2 samples provided',        done: true },
    ],
    portfolio: [
      { id: 'p1', name: 'dashboard-project-2025.pdf', type: 'pdf' },
      { id: 'p2', name: 'analytics-portfolio.pdf',    type: 'pdf' },
    ],
    tab: 'Flagged',
  },
  {
    id: 7,
    name: 'John Trek',
    handle: '@johntrek7',
    location: 'Kampala, Uganda',
    appliedAgo: 'Applied 2 hours ago',
    specialty: 'UI/UX Design',
    level: 'Expert',
    languages: '5 languages',
    initials: 'JT',
    bio: 'Senior product designer with deep expertise in financial services and compliance-heavy UX.',
    skills: ['Figma', 'Framer', 'React.js', 'TypeScript'],
    checklist: [
      { id: 'profile',   label: 'John Trek',          sub: 'Name, bio, country, photo', done: true },
      { id: 'skills',    label: 'Skills selected',     sub: 'Primary + sub-skills',     done: true },
      { id: 'wallet',    label: 'Wallet bound',        sub: 'One Canton wallet',         done: true },
      { id: 'phone',     label: 'Phone verified',      sub: 'OTP confirmed',             done: true },
      { id: 'id',        label: 'ID verification',     sub: 'Government ID submitted',   done: true },
      { id: 'portfolio', label: 'Portfolio attached',  sub: '3 samples provided',        done: true },
    ],
    portfolio: [
      { id: 'p1', name: 'dashboard-project-2025.pdf', type: 'pdf' },
      { id: 'p2', name: 'dashboard-project-2025.pdf', type: 'link' },
      { id: 'p3', name: 'dashboard-project-2025.pdf', type: 'link' },
    ],
    tab: 'Recent',
  },
];

// ─── Avatar Monogram ──────────────────────────────────────────────────────────

function Monogram({ initials, size = 'md' }: { initials: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = {
    sm: 'size-8 text-[0.625rem]',
    md: 'size-10 text-[0.75rem]',
    lg: 'size-14 text-[1rem]',
  }[size];
  return (
    <div className={`${cls} shrink-0 flex items-center justify-center rounded-full bg-[#8C5CFF]/20 border border-[#8C5CFF]/30 font-sans font-semibold text-[#8C5CFF] select-none`}>
      {initials}
    </div>
  );
}

// ─── Checklist Item ───────────────────────────────────────────────────────────

function ChecklistCell({ item }: { item: ChecklistItem }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <div className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full transition-colors ${item.done ? 'bg-[#4ADE80]/10 border border-[#4ADE80]/30' : 'bg-foreground/5 border border-border'}`}>
        {item.done
          ? <Check size={11} strokeWidth={2.5} className="text-[#4ADE80]" />
          : <Clock size={11} strokeWidth={2} className="text-[#A0A0A0]" />
        }
      </div>
      <div className="min-w-0">
        <p className="font-sans text-[0.8125rem] font-medium text-foreground leading-[18px]">{item.label}</p>
        <p className="font-sans text-[0.6875rem] font-normal text-[#A0A0A0] leading-[14px] mt-0.5">{item.sub}</p>
      </div>
    </div>
  );
}

// ─── Document Preview Modal ──────────────────────────────────────────────────

function DocumentPreviewModal({
  file,
  onClose,
}: {
  file: PortfolioFile;
  onClose: () => void;
}) {
  const isPdf = file.type === 'pdf';
  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 md:p-8"
      onClick={onClose}
    >
      {/* Panel — stop click propagation so clicking inside doesn't close */}
      <div
        className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#8C5CFF]/10">
              {isPdf
                ? <FileText size={15} className="text-[#8C5CFF]" strokeWidth={1.5} />
                : <ExternalLink size={15} className="text-[#8C5CFF]" strokeWidth={1.5} />
              }
            </div>
            <p className="font-sans text-[0.875rem] font-semibold text-foreground truncate">{file.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 flex size-8 shrink-0 items-center justify-center rounded-lg text-[#A0A0A0] transition-colors hover:bg-foreground/5 hover:text-foreground"
            aria-label="Close preview"
          >
            <X size={16} />
          </button>
        </div>

        {/* Preview body */}
        <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar">
          {isPdf ? (
            // ── PDF preview placeholder (replace src with real URL when API is ready) ──
            <div className="flex flex-col items-center justify-center gap-4 py-16 px-8">
              {/* Decorative mock pages */}
              <div className="relative w-48">
                <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-xl border border-border bg-foreground/5" />
                <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-xl border border-border bg-foreground/[0.03]" />
                <div className="relative flex flex-col rounded-xl border border-border bg-card p-5 shadow-lg">
                  {/* Mock PDF lines */}
                  <div className="flex h-4 w-24 items-center justify-center rounded bg-[#8C5CFF]/20 mb-4">
                    <span className="font-sans text-[0.5rem] font-bold text-[#8C5CFF] uppercase tracking-widest">PDF</span>
                  </div>
                  {[90, 75, 85, 60, 70, 50].map((w, i) => (
                    <div key={i} className="mb-2 h-1.5 rounded-full bg-foreground/8" style={{ width: `${w}%` }} />
                  ))}
                  <div className="mt-3 h-12 w-full rounded-lg bg-[#8C5CFF]/5 border border-[#8C5CFF]/10" />
                  {[80, 65, 90, 55].map((w, i) => (
                    <div key={i} className="mt-2 h-1.5 rounded-full bg-foreground/8" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>
              <div className="text-center">
                <p className="font-sans text-[0.875rem] font-medium text-foreground">{file.name}</p>
                <p className="font-sans text-[0.75rem] text-[#A0A0A0] mt-1">
                  PDF preview will display here once connected to the file storage API.
                </p>
              </div>
              <a
                href="#"
                onClick={e => e.preventDefault()}
                className="flex items-center gap-2 rounded-xl bg-[#8C5CFF] px-5 py-2.5 font-sans text-[0.875rem] font-semibold text-white transition-all hover:bg-[#AC8EF3] active:scale-[0.98] shadow-lg shadow-[#8C5CFF]/25"
              >
                <ExternalLink size={14} />
                Open Full Document
              </a>
            </div>
          ) : (
            // ── Link / URL preview ──
            <div className="flex flex-col items-center justify-center gap-4 py-16 px-8">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-[#8C5CFF]/10">
                <Link2 size={24} className="text-[#8C5CFF]" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="font-sans text-[0.875rem] font-medium text-foreground">{file.name}</p>
                <p className="font-sans text-[0.75rem] text-[#A0A0A0] mt-1">
                  External link submitted by the applicant.
                </p>
              </div>
              <a
                href="#"
                onClick={e => e.preventDefault()}
                className="flex items-center gap-2 rounded-xl bg-[#8C5CFF] px-5 py-2.5 font-sans text-[0.875rem] font-semibold text-white transition-all hover:bg-[#AC8EF3] active:scale-[0.98] shadow-lg shadow-[#8C5CFF]/25"
              >
                <ExternalLink size={14} />
                Open Link
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Portfolio File Row ───────────────────────────────────────────────────────

function PortfolioRow({
  file,
  onPreview,
}: {
  file: PortfolioFile;
  onPreview: (file: PortfolioFile) => void;
}) {
  const Icon = file.type === 'pdf' ? Globe : Link2;
  return (
    <div className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-[#8C5CFF]/25 hover:bg-[#8C5CFF]/[0.025] group">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#8C5CFF]/10">
        <Icon size={16} className="text-[#8C5CFF]" strokeWidth={1.5} />
      </div>
      <span className="font-sans text-[0.8125rem] text-foreground/80 group-hover:text-foreground transition-colors truncate flex-1">
        {file.name}
      </span>
      {/* Preview button */}
      <button
        type="button"
        onClick={() => onPreview(file)}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/5 text-[#8C5CFF] px-3 py-1.5 font-sans text-[0.6875rem] font-semibold transition-all active:scale-[0.98] whitespace-nowrap"
        aria-label={`Preview ${file.name}`}
      >
        <Eye size={12} strokeWidth={2} />
        Preview
      </button>
    </div>
  );
}

// ─── Skill Pill ───────────────────────────────────────────────────────────────

function SkillPill({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-[#8C5CFF]/25 bg-[#8C5CFF]/8 px-3 py-1.5">
      <span className="font-sans text-[0.75rem] font-medium text-[#8C5CFF] whitespace-nowrap">{label}</span>
      <span className="font-sans text-[0.625rem] text-[#8C5CFF]/50">×</span>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

interface DetailPanelProps {
  applicant: SellerApplicant;
  onBack?: () => void;
}

function DetailPanel({ applicant, onBack }: DetailPanelProps) {
  const [decision,     setDecision]     = useState<'approved' | 'rejected' | null>(null);
  const [previewFile,  setPreviewFile]  = useState<PortfolioFile | null>(null);

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      {/* Document Preview Modal */}
      {previewFile && (
        <DocumentPreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
      {/* Mobile back button */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-5 pt-4 pb-2 font-sans text-[0.8125rem] text-[#8C5CFF] hover:text-[#AC8EF3] transition-colors md:hidden"
        >
          <ChevronLeft size={16} />
          Back to list
        </button>
      )}

      <div className="flex flex-col gap-6 px-6 py-5">

        {/* Applicant header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <Monogram initials={applicant.initials} size="lg" />
            <div className="min-w-0 flex-1">
              <h2 className="font-sans text-[1.125rem] font-bold text-foreground leading-[24px]">{applicant.name}</h2>
              <p className="font-sans text-[0.75rem] text-[#A0A0A0] leading-[16px] mt-0.5">
                {applicant.handle} · {applicant.location} · {applicant.appliedAgo}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {[applicant.specialty, applicant.level, applicant.languages].map(tag => (
                  <span key={tag} className="rounded-md border border-border bg-card px-2.5 py-1 font-sans text-[0.6875rem] font-medium text-[#A0A0A0]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="h-px w-full bg-border" />
        </div>

        {/* Requirement Checklist */}
        <div className="flex flex-col gap-3">
          <h3 className="font-sans text-[0.875rem] font-semibold text-foreground">Requirement Checklist</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {applicant.checklist.map(item => (
              <ChecklistCell key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-2">
          <h3 className="font-sans text-[0.875rem] font-semibold text-foreground">Bio</h3>
          <p className="font-sans text-[0.8125rem] font-normal text-foreground/70 leading-[1.6] rounded-xl border border-border bg-card p-4">
            {applicant.bio}
          </p>
        </div>

        {/* Skills */}
        <div className="flex flex-col gap-3">
          <h3 className="font-sans text-[0.875rem] font-semibold text-foreground">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {applicant.skills.map(s => <SkillPill key={s} label={s} />)}
          </div>
        </div>

        {/* Portfolio Samples */}
        <div className="flex flex-col gap-3">
          <h3 className="font-sans text-[0.875rem] font-semibold text-foreground">Portfolio Samples</h3>
          {applicant.portfolio.length === 0 ? (
            <p className="font-sans text-[0.8125rem] text-[#A0A0A0] rounded-xl border border-border bg-card p-4">
              No portfolio samples submitted.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {applicant.portfolio.map(f => (
                <PortfolioRow key={f.id} file={f} onPreview={setPreviewFile} />
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {decision === null ? (
          <div className="flex gap-3 pt-2 pb-4">
            {/* Approve — primary button */}
            <button
              type="button"
              onClick={() => setDecision('approved')}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#8C5CFF] px-5 py-3 font-sans text-[0.875rem] font-semibold text-white transition-all hover:bg-[#AC8EF3] active:scale-[0.98] shadow-lg shadow-[#8C5CFF]/25 cursor-pointer"
            >
              <Check size={16} strokeWidth={2.5} />
              Approve Application
            </button>
            {/* Reject — variant 2 (outlined) */}
            <button
              type="button"
              onClick={() => setDecision('rejected')}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/5 text-[#8C5CFF] px-5 py-3 font-sans text-[0.875rem] font-semibold transition-all active:scale-[0.98] cursor-pointer"
            >
              Reject
            </button>
          </div>
        ) : (
          <div className={`flex items-center gap-2 rounded-xl border px-5 py-3 font-sans text-[0.875rem] font-semibold mb-4 ${decision === 'approved' ? 'border-[#8C5CFF]/30 bg-[#8C5CFF]/10 text-[#8C5CFF]' : 'border-border bg-foreground/5 text-foreground/70'}`}>
            {decision === 'approved' ? (
              <><Check size={16} strokeWidth={2.5} /> Application Approved</>
            ) : (
              <><span className="text-[1rem] leading-none">✕</span> Application Rejected</>
            )}
            <button
              type="button"
              onClick={() => setDecision(null)}
              className="ml-auto font-sans text-[0.6875rem] underline opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            >
              Undo
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Applicant List Item ──────────────────────────────────────────────────────

function ListItem({
  applicant,
  selected,
  onClick,
}: {
  applicant: SellerApplicant;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition-colors',
        selected
          ? 'bg-[#8C5CFF]/8 border-l-2 border-l-[#8C5CFF]'
          : 'hover:bg-foreground/[0.03]',
      ].join(' ')}
    >
      <Monogram initials={applicant.initials} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className={`font-sans text-[0.8125rem] font-semibold leading-[18px] truncate ${selected ? 'text-foreground' : 'text-foreground/80'}`}>
          {applicant.name}
        </p>
        <p className="font-sans text-[0.6875rem] text-[#A0A0A0] leading-[14px] mt-0.5 truncate">
          {applicant.specialty}
        </p>
      </div>
      <span className="shrink-0 font-sans text-[0.625rem] text-[#A0A0A0] whitespace-nowrap">
        {applicant.appliedAgo.replace('Applied ', '')}
      </span>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const LIST_TABS: ListTab[] = ['Pending', 'Flagged', 'Recent'];

export default function AdminSellerAppsPage() {
  const [activeTab,   setActiveTab]   = useState<ListTab>('Pending');
  const [selectedId,  setSelectedId]  = useState<number>(1);
  const [mobileView,  setMobileView]  = useState<'list' | 'detail'>('list');

  const visibleApplicants = APPLICANTS.filter(a => a.tab === activeTab);
  const pendingCount = APPLICANTS.filter(a => a.tab === 'Pending').length;
  const selected = APPLICANTS.find(a => a.id === selectedId) ?? APPLICANTS[0];

  const handleSelect = (id: number) => {
    setSelectedId(id);
    setMobileView('detail');
  };

  return (
    <div className="flex h-full w-full overflow-hidden">

      {/* ── Left Sidebar ── */}
      <aside className={[
        'flex h-full w-full flex-col border-r border-border bg-card shrink-0',
        'md:w-[300px] lg:w-[320px]',
        // On mobile: show only if in list view
        mobileView === 'detail' ? 'hidden md:flex' : 'flex',
      ].join(' ')}>

        {/* Sidebar Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h1 className="font-sans text-[1.125rem] font-bold text-foreground">Seller Apps</h1>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 items-center gap-1 px-4 py-2.5 border-b border-border bg-[#080808]/30">
          <div className="flex items-center gap-1 bg-[#080808] border border-border p-1 rounded-xl shadow-inner w-full">
            {LIST_TABS.map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); setSelectedId(APPLICANTS.find(a => a.tab === tab)?.id ?? selectedId); }}
                className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-1 rounded-lg font-sans text-[0.6875rem] font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-[#8C5CFF] text-white shadow'
                    : 'text-[#A0A0A0] hover:text-white'
                }`}
              >
                {tab}
                {tab === 'Pending' && (
                  <span className={`flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 font-sans text-[9px] font-bold ${
                    activeTab === 'Pending' ? 'bg-white/20 text-white' : 'bg-border text-[#A0A0A0]'
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Applicant List */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {visibleApplicants.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
              <p className="font-sans text-[0.8125rem] text-[#A0A0A0]">No {activeTab.toLowerCase()} applications</p>
            </div>
          ) : (
            visibleApplicants.map(app => (
              <ListItem
                key={app.id}
                applicant={app}
                selected={selectedId === app.id}
                onClick={() => handleSelect(app.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── Right Detail Panel ── */}
      <main className={[
        'flex h-full min-w-0 flex-1 flex-col bg-background',
        // On mobile: show only if in detail view
        mobileView === 'list' ? 'hidden md:flex' : 'flex',
      ].join(' ')}>

        {/* Panel header */}
        <div className="flex shrink-0 items-center border-b border-border px-6 py-4 gap-3">
          <h2 className="font-sans text-[1.125rem] font-bold text-foreground">Seller Apps</h2>
          <span className="rounded-full bg-[#8C5CFF]/10 border border-[#8C5CFF]/20 px-2.5 py-0.5 font-sans text-[0.6875rem] font-semibold text-[#8C5CFF]">
            Review
          </span>
        </div>

        {selected ? (
          <DetailPanel
            applicant={selected}
            onBack={() => setMobileView('list')}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="font-sans text-[0.875rem] text-[#A0A0A0]">Select an application to review</p>
          </div>
        )}
      </main>

    </div>
  );
}
