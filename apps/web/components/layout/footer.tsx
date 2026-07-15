'use client';

import {
  Briefcase,
  Users,
  HelpCircle,
  FileText,
  LifeBuoy,
  ShieldCheck,
  Cookie,
  Mail,
  Send,
} from 'lucide-react';

// --- Types ---

interface FooterProps {
  onNavigate?: (page: string) => void;
}

// --- Social icons ---

function XIcon() {
  return (
    <svg className="size-[13px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// --- NavLink ---

interface NavLinkProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function NavLink({ icon, label, onClick }: NavLinkProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 text-[11px] text-muted hover:text-primary transition-colors duration-200 text-left w-full cursor-pointer"
      >
        <span className="opacity-70 shrink-0">{icon}</span>
        <span>{label}</span>
      </button>
    </li>
  );
}

// --- FooterColumn ---

interface FooterColumnProps {
  title: string;
  children: React.ReactNode;
}

function FooterColumn({ title, children }: FooterColumnProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <p className="font-sans font-medium text-[13px] text-foreground/90 leading-5">{title}</p>
        <div className="bg-primary h-[1.5px] w-8 rounded-full" />
      </div>
      <ul className="flex flex-col gap-3">{children}</ul>
    </div>
  );
}

// --- Footer ---

export default function Footer({ onNavigate }: FooterProps) {
  const nav = (page: string) => () => onNavigate?.(page);

  return (
    <footer className="w-full border-t border-border bg-gradient-to-r from-background to-[#15121c]/50 backdrop-blur-[9.95px] px-6 md:px-12 py-8">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8">

        <div className="flex flex-col md:flex-row justify-between gap-10 md:gap-4 items-start">

          <div className="flex flex-col gap-3 max-w-[200px]">
            <p className="font-sans font-bold text-[28px] tracking-tight text-foreground/90 leading-none">
              Canfri
            </p>
            <p className="font-sans text-[10px] leading-[1.5] text-muted">
              Connecting talent, opportunities, content creators and businesses through the{' '}
              <span className="text-primary font-semibold">CC</span> ecosystem
            </p>

            <div className="flex items-center gap-3 mt-1.5">
              <a
                href="https://t.me/canafri"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="flex items-center justify-center size-7 rounded-full bg-card border border-border/40 text-foreground/70 hover:text-primary hover:border-primary/40 transition-all"
              >
                <Send size={12} className="ml-0.5 mt-0.5" />
              </a>
              <a
                href="https://x.com/canafri"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="flex items-center justify-center size-7 rounded-full bg-card border border-border/40 text-foreground/70 hover:text-primary hover:border-primary/40 transition-all"
              >
                <XIcon />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 md:gap-12">
            <FooterColumn title="Marketplace">
              <NavLink icon={<Briefcase size={12} />} label="Find Job"        onClick={nav('Find Job')} />
              <NavLink icon={<Users size={12} />}    label="Find Talent"      onClick={nav('My Posted Jobs')} />
              <NavLink icon={<Briefcase size={12} />} label="Post a Job"      onClick={nav('Post a Job')} />
              <NavLink icon={<Briefcase size={12} />} label="Become a Seller" onClick={nav('Become a seller')} />
            </FooterColumn>

            <FooterColumn title="Resources">
              <NavLink icon={<HelpCircle size={12} />} label="Help Center"  onClick={nav('Support')} />
              <NavLink icon={<FileText size={12} />}   label="Blog"         onClick={nav('Dashboard')} />
              <NavLink icon={<Users size={12} />}      label="Community"    onClick={nav('Dashboard')} />
              <NavLink icon={<LifeBuoy size={12} />}   label="Support"      onClick={nav('Support')} />
            </FooterColumn>

            <FooterColumn title="Legal">
              <NavLink icon={<FileText size={12} />}    label="Terms of Service" onClick={nav('Settings')} />
              <NavLink icon={<ShieldCheck size={12} />} label="Privacy Policy"   onClick={nav('Settings')} />
              <NavLink icon={<Cookie size={12} />}      label="Cookie Policy"    onClick={nav('Settings')} />
              <NavLink icon={<Mail size={12} />}        label="Contact Us"       onClick={nav('Settings')} />
            </FooterColumn>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="bg-border h-px w-full" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <p className="font-sans text-[10px] text-muted">
              © 2026 Canafri. All rights reserved
            </p>
            <p className="font-sans text-[10px] text-muted">
              Powered by <span className="text-primary font-semibold">CC</span>
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}
