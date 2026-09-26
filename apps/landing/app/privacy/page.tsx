'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SIGNUP_URL, LOGIN_URL } from '@/lib/config';
import { ChevronRight, ChevronDown } from 'lucide-react';

// Table of contents

const TOC_ITEMS = [
  { id: 'section-1',  label: 'Information We Collect' },
  { id: 'section-2',  label: 'How We Use Your Information' },
  { id: 'section-3',  label: 'Legal Basis for Processing' },
  { id: 'section-4',  label: 'Sharing Your Information' },
  { id: 'section-5',  label: 'Data Retention' },
  { id: 'section-6',  label: 'Your Privacy Rights' },
  { id: 'section-7',  label: 'Cookies & Storage' },
  { id: 'section-8',  label: 'Account & Data Security' },
  { id: 'section-9',  label: 'Third-Party Services' },
  { id: 'section-10', label: 'Age Requirements' },
  { id: 'section-11', label: 'Updates to This Policy' },
  { id: 'section-12', label: 'Contact Us' },
];

const navigationItems = [
  { label: 'Features', href: '/#what-we-offer' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Find Talent', href: '/#freelancers' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'About', href: '/about' },
];

// Sub-components

function SectionHeading({ id, number, children }: { id: string; number: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="flex items-baseline gap-3 scroll-mt-28 text-lg sm:text-xl font-bold font-outfit text-[#0f0a1e] leading-snug mb-4"
    >
      <span className="shrink-0 text-xs font-bold font-mono text-[#320053] bg-[#320053]/10 px-2 py-0.5 rounded tabular-nums select-none">
        {number}
      </span>
      {children}
    </h2>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm sm:text-[15px] leading-[1.75] text-[#5D5D7F] mb-4 last:mb-0 font-sans">
      {children}
    </p>
  );
}

function BulletList({ items }: { items: { title?: string; text: string }[] | string[] }) {
  return (
    <ul className="space-y-3 mb-4">
      {items.map((item, i) => {
        const isObj = typeof item !== 'string';
        const title = isObj ? item.title : undefined;
        const text = isObj ? item.text : item;

        return (
          <li key={i} className="flex items-start gap-3 text-sm sm:text-[15px] leading-[1.65] text-[#5D5D7F] font-sans">
            <span className="mt-[8px] shrink-0 size-2 rounded-full bg-[#320053]" />
            <span>
              {title && <strong className="font-semibold text-[#0f0a1e]">{title}: </strong>}
              {text}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#320053] mt-5 mb-2.5 font-sans">
      {children}
    </p>
  );
}

function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <SectionHeading id={id} number={number}>{title}</SectionHeading>
      {children}
      <div className="mt-8 mb-8 h-px bg-black/[0.08]" />
    </section>
  );
}

function AccordionSection({
  id,
  number,
  title,
  children,
  isOpen,
  onToggle,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div id={id} className="border border-black/10 rounded-2xl overflow-hidden bg-white shadow-xs">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-[#f8f8fa] hover:bg-[#f2f2f6] transition-colors text-left cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="shrink-0 text-xs font-bold font-mono text-[#320053] bg-[#320053]/10 px-2 py-0.5 rounded tabular-nums select-none">
            {number}
          </span>
          <span className="text-sm font-bold font-outfit text-[#0f0a1e] leading-snug">{title}</span>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[#5D5D7F] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={[
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0',
        ].join(' ')}
      >
        <div className="px-5 pt-5 pb-3">
          {children}
        </div>
      </div>
    </div>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 min-w-[120px]">
      <p className="font-sans font-semibold text-xs tracking-wider uppercase text-white/90">
        {title}
      </p>
      <ul className="flex flex-col gap-2">
        {children}
      </ul>
    </div>
  );
}

// Main Page

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('section-1');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['section-1']));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className="min-h-screen bg-[#fdfdfd] text-[#0f0a1e] flex flex-col">
      {/* Fixed Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between w-full h-20 px-6 sm:px-10 lg:px-16 bg-[#09090b]/85 backdrop-blur-md border-b border-white/[0.08] transition-colors">
        <div className="flex items-center justify-between w-full max-w-[117.25rem] mx-auto">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-8 lg:gap-12">
            <Link
              href="/"
              aria-label="Canafri home"
              className="inline-flex items-center relative flex-[0_0_auto]"
            >
              <img
                src="/app-logo/canafri-logo.svg"
                alt="Canafri logo"
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </Link>
            <nav aria-label="Primary navigation" className="hidden md:block">
              <ul className="inline-flex items-center gap-8 relative flex-[0_0_auto]">
                <li>
                  <Link
                    href="/"
                    className="relative w-fit font-sans font-medium text-[var(--muted)] text-sm transition-colors hover:text-white"
                  >
                    Home
                  </Link>
                </li>
                {navigationItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="relative w-fit font-sans font-medium text-[var(--muted)] text-sm transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Right Header: Actions */}
          <div className="flex items-center gap-2.5 sm:gap-4 relative flex-[0_0_auto]">
            <div className="hidden md:inline-flex items-center gap-3 sm:gap-4">
              <a
                href={LOGIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 sm:px-5 py-2.5 rounded-lg font-sans font-semibold text-white text-sm hover:bg-white/[0.05] transition-colors"
              >
                Login
              </a>
              <a
                href={SIGNUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 sm:px-5 py-2.5 bg-[var(--primary)] rounded-lg font-sans font-semibold text-white text-sm shadow-[0_0.25rem_0.75rem_var(--primary-glow)] hover:bg-[var(--primary-hover)] transition-colors"
              >
                Sign Up
              </a>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed inset-x-0 top-20 bottom-0 z-50 bg-[#09090b]/95 backdrop-blur-2xl transition-all duration-300 ease-out border-t border-white/[0.08] overflow-y-auto ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none -translate-y-2'
        }`}
        style={{ height: 'calc(100dvh - 5rem)' }}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="flex flex-col min-h-full p-6 max-w-md mx-auto">
          <nav aria-label="Mobile navigation" className="flex-1">
            <p className="text-xs uppercase tracking-wider text-[var(--muted-dark)] font-sans font-semibold mb-3 px-3">
              Navigation
            </p>
            <ul className="flex flex-col gap-1.5">
              <li>
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl font-sans font-medium text-base text-[var(--muted)] hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <span>Home</span>
                  <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
              {navigationItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl font-sans font-medium text-base text-[var(--muted)] hover:text-white hover:bg-white/[0.05] transition-colors"
                  >
                    <span>{item.label}</span>
                    <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Top Hero Banner */}
      <section className="relative w-full pt-32 pb-14 sm:pt-36 sm:pb-16 bg-[linear-gradient(180deg,rgba(50,0,83,1)_0%,rgba(9,9,11,1)_100%)] overflow-hidden">
        <div className="absolute left-[200px] top-[-80px] h-[350px] w-[350px] rounded-full bg-[#8080d715] blur-[80px] pointer-events-none" />
        <div className="relative z-10 max-w-[117.25rem] mx-auto px-6 sm:px-10 lg:px-16 flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/15 backdrop-blur-md mb-4">
            Data Governance &amp; Security
          </span>
          <h1 className="font-outfit text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#a1b5d8] max-w-[560px]">
            How we protect your privacy, handle ecosystem credentials, and safeguard your data.
          </p>
          <span className="mt-4 text-xs text-white/50">
            Last updated: August 2026
          </span>
        </div>
      </section>

      {/* Main Layout */}
      <div className="flex-1 w-full max-w-[117.25rem] mx-auto px-6 sm:px-10 lg:px-16 py-10 sm:py-12 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          {/* Sidebar TOC (Desktop) */}
          <aside className="hidden lg:flex flex-col gap-1 w-[260px] shrink-0">
            <div className="sticky top-28 bg-[#f8f8fa] p-5 rounded-2xl border border-black/5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#320053] mb-4">
                Table of Contents
              </p>
              <nav aria-label="Privacy policy sections">
                <ul className="space-y-1">
                  {TOC_ITEMS.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => scrollTo(item.id)}
                        className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          activeSection === item.id
                            ? 'bg-[#320053] text-white shadow-xs'
                            : 'text-[#5D5D7F] hover:text-[#0f0a1e] hover:bg-black/5'
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                        {activeSection === item.id && (
                          <ChevronRight size={12} className="shrink-0 text-white" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          {/* Document Body */}
          <div className="flex-1 min-w-0">
            {/* Desktop Sections */}
            <div className="hidden lg:block bg-white p-8 sm:p-10 rounded-3xl border border-black/5 shadow-xs">
              <Section id="section-1" number="01" title="Information We Collect">
                <Paragraph>
                  We collect personal information directly from you when you register, use our services, or communicate with us.
                </Paragraph>
                <SubLabel>Account &amp; Profile Details</SubLabel>
                <BulletList items={[
                  'Full name and public display name',
                  'Registered email address and encrypted password',
                  'Date of birth to confirm age eligibility',
                  'Profile picture and bio details you choose to share',
                  'Account preferences and role selection (Buyer or Seller)',
                ]} />
                <SubLabel>Marketplace &amp; Transaction Activity</SubLabel>
                <BulletList items={[
                  'Job listings created, proposals submitted, and active contracts',
                  'Direct communications and project messages sent between users',
                  'Wallet transactions, deposit and withdrawal records, and escrow milestones',
                  'Reviews, star ratings, and feedback left on completed orders',
                  'Support tickets, inquiry logs, and related attachments',
                ]} />
                <SubLabel>Technical &amp; Log Data</SubLabel>
                <BulletList items={[
                  'IP address and general country/city location',
                  'Device type, browser version, and operating system',
                  'Session verification data to secure active logins',
                  'System diagnostic logs and security event records',
                ]} />
              </Section>

              <Section id="section-2" number="02" title="How We Use Your Information">
                <Paragraph>
                  We use the data we collect solely to operate, secure, and deliver the CanaFri platform services.
                </Paragraph>
                <BulletList items={[
                  'To create and administer user accounts and verify registration details',
                  'To facilitate job postings, proposals, escrow contracts, and payouts',
                  'To deliver transactional emails, including verification codes and account notices',
                  'To enable direct in-app messaging between buyers and freelancers',
                  'To protect against fraud, abuse, spam, and security incidents',
                  'To assist users with support inquiries and dispute resolution',
                  'To maintain platform uptime, monitor server performance, and optimize load times',
                  'To satisfy legal, regulatory, and tax compliance requirements',
                ]} />
              </Section>

              <Section id="section-3" number="03" title="Legal Basis for Processing">
                <Paragraph>
                  We process your personal information under the following recognized legal grounds:
                </Paragraph>
                <BulletList items={[
                  { title: 'Performance of a Contract', text: 'Processing necessary to provide platform features and complete user agreements.' },
                  { title: 'Legitimate Interests', text: 'Securing the platform, preventing fraud, and ensuring service reliability.' },
                  { title: 'Legal Obligations', text: 'Complying with accounting rules, tax regulations, and applicable statutory laws.' },
                  { title: 'User Consent', text: 'Where you give explicit approval for optional preferences or communications.' },
                ]} />
              </Section>

              <Section id="section-4" number="04" title="Sharing Your Information">
                <Paragraph>
                  CanaFri does not sell your personal data to third parties. We share data only in the following specific circumstances:
                </Paragraph>
                <BulletList items={[
                  { title: 'With Other Users', text: 'Public profile information, listings, reviews, and transaction details necessary to complete work between buyers and sellers.' },
                  { title: 'Service Providers', text: 'Trusted infrastructure and database partners operating under strict confidentiality and data protection agreements.' },
                  { title: 'Legal & Regulatory Authorities', text: 'When required by law, court order, or governmental demand to protect users or legal rights.' },
                  { title: 'Business Reorganization', text: 'In connection with a company acquisition, merger, or asset transfer, subject to standard privacy protections.' },
                ]} />
              </Section>

              <Section id="section-5" number="05" title="Data Retention">
                <Paragraph>
                  We retain personal data only for as long as needed to fulfill the purposes set out in this policy.
                </Paragraph>
                <BulletList items={[
                  { title: 'Account Data', text: 'Maintained during active account status and permanently removed within 30 days of an approved account deletion request.' },
                  { title: 'Financial Records', text: 'Retained for up to 7 years to comply with statutory accounting and tax regulations.' },
                  { title: 'Support & Tickets', text: 'Kept for 3 years to assist with history and dispute reviews.' },
                  { title: 'Temporary Session OTPs', text: 'Automatically discarded after 15 minutes of issuance.' },
                  { title: 'Server Access Logs', text: 'Rotated and discarded within 90 days.' },
                ]} />
              </Section>

              <Section id="section-6" number="06" title="Your Privacy Rights">
                <Paragraph>
                  Depending on your country or region of residence, you have specific rights regarding your personal information:
                </Paragraph>
                <BulletList items={[
                  { title: 'Right of Access', text: 'Request a summary and copy of personal data held about you.' },
                  { title: 'Right to Rectification', text: 'Update inaccurate or incomplete information through your account settings or support.' },
                  { title: 'Right to Erasure', text: 'Request deletion of your account and personal records where legally permissible.' },
                  { title: 'Right to Restriction', text: 'Request that we pause or limit certain processing activities.' },
                  { title: 'Right to Data Portability', text: 'Receive your account data in an accessible digital format.' },
                  { title: 'Right to Object', text: 'Object to data processing carried out under legitimate interest grounds.' },
                ]} />
                <Paragraph>
                  To exercise any of these rights, contact us at privacy@canafri.com. Requests are reviewed and addressed within 30 days.
                </Paragraph>
              </Section>

              <Section id="section-7" number="07" title="Cookies &amp; Storage">
                <Paragraph>
                  CanaFri uses strictly functional browser storage mechanisms necessary for the platform to operate properly:
                </Paragraph>
                <BulletList items={[
                  { title: 'Authentication Storage', text: 'Secure session tokens stored locally to keep you logged in across pages.' },
                  { title: 'Display Preferences', text: 'Theme choice (dark or light mode) saved to preserve your viewing settings.' },
                  { title: 'Workspace Mode', text: 'Buyer or seller dashboard state stored to maintain your active view.' },
                ]} />
                <Paragraph>
                  We do not deploy third-party advertising trackers, cross-site trackers, or commercial profiling cookies.
                </Paragraph>
              </Section>

              <Section id="section-8" number="08" title="Account &amp; Data Security">
                <Paragraph>
                  We employ technical and organizational security controls designed to safeguard your information against unauthorized access, loss, or misuse:
                </Paragraph>
                <BulletList items={[
                  'Passwords are protected using industry-standard cryptographic hashing and are never stored in plain text',
                  'All platform traffic is encrypted in transit using Transport Layer Security (TLS)',
                  'Single-use verification codes expire automatically and cannot be reused',
                  'Strict rate limiting is enforced on login and registration endpoints to prevent brute-force attacks',
                  'Access to backend administration systems is restricted to authorized operations personnel',
                ]} />
              </Section>

              <Section id="section-9" number="09" title="Third-Party Services">
                <Paragraph>
                  The platform may provide links to external channels, such as our official Telegram community or X (Twitter) profile. These third-party platforms have their own independent privacy policies. We encourage you to review their terms when interacting with external services.
                </Paragraph>
              </Section>

              <Section id="section-10" number="10" title="Age Requirements">
                <Paragraph>
                  CanaFri is strictly for users aged 18 and older. We do not knowingly permit account creation or collect information from individuals under 18. If we discover an account registered by an underage user, we will immediately close the account and remove the associated data.
                </Paragraph>
              </Section>

              <Section id="section-11" number="11" title="Updates to This Policy">
                <Paragraph>
                  We may revise this Privacy Policy periodically to reflect product updates, operational adjustments, or regulatory requirements. When significant revisions are made, we will provide notice through the platform interface or email before changes take effect.
                </Paragraph>
              </Section>

              <Section id="section-12" number="12" title="Contact Us">
                <Paragraph>
                  If you have questions, feedback, or requests regarding this Privacy Policy or your personal information, you can reach our team directly:
                </Paragraph>
                <div className="rounded-2xl border border-[#320053]/15 bg-[#f8f6fb] p-6 text-sm text-[#5D5D7F] leading-relaxed">
                  <p className="font-bold text-[#0f0a1e] mb-1 font-outfit text-base">CanaFri Legal &amp; Privacy</p>
                  <p>
                    Email:{' '}
                    <a href="mailto:privacy@canafri.com" className="text-[#320053] hover:underline font-semibold">
                      privacy@canafri.com
                    </a>
                  </p>
                  <p className="mt-2 text-xs text-[#5D5D7F]/80">
                    Inquiries are handled during standard business hours with a response target of 3 to 5 business days.
                  </p>
                </div>
              </Section>
            </div>

            {/* Mobile Accordions */}
            <div className="flex flex-col gap-3 lg:hidden">
              {TOC_ITEMS.map((item, idx) => (
                <AccordionSection
                  key={item.id}
                  id={`${item.id}-m`}
                  number={String(idx + 1).padStart(2, '0')}
                  title={item.label}
                  isOpen={openSections.has(item.id)}
                  onToggle={() => toggleSection(item.id)}
                >
                  {item.id === 'section-1' && (
                    <>
                      <Paragraph>We collect personal information directly from you when you register, use our services, or communicate with us.</Paragraph>
                      <SubLabel>Account &amp; Profile Details</SubLabel>
                      <BulletList items={['Full name and public display name','Registered email address and encrypted password','Date of birth to confirm age eligibility','Profile picture and bio details']} />
                    </>
                  )}
                  {item.id === 'section-2' && (
                    <BulletList items={['To administer user accounts','To facilitate escrow contracts and payouts','To deliver transactional notifications','To enable in-app messaging']} />
                  )}
                  {item.id === 'section-3' && (
                    <Paragraph>We process personal information under contract performance, legitimate interests, and statutory legal obligations.</Paragraph>
                  )}
                  {item.id === 'section-4' && (
                    <Paragraph>We never sell your data. We share only with counterparties to complete transactions and trusted infrastructure providers.</Paragraph>
                  )}
                  {item.id === 'section-5' && (
                    <Paragraph>Account records are kept during active membership and removed within 30 days of deletion approval. Financial records are retained as required by law.</Paragraph>
                  )}
                  {item.id === 'section-6' && (
                    <Paragraph>You have rights to access, rectify, port, or erase your personal information. Contact privacy@canafri.com.</Paragraph>
                  )}
                  {item.id === 'section-7' && (
                    <Paragraph>We use strictly functional storage for authentication and theme preferences. No advertising cookies are used.</Paragraph>
                  )}
                  {item.id === 'section-8' && (
                    <Paragraph>All credentials are cryptographically protected and network traffic is secured with TLS encryption.</Paragraph>
                  )}
                  {item.id === 'section-9' && (
                    <Paragraph>External links to Telegram and X operate under their own independent privacy terms.</Paragraph>
                  )}
                  {item.id === 'section-10' && (
                    <Paragraph>CanaFri is strictly for users 18 and older.</Paragraph>
                  )}
                  {item.id === 'section-11' && (
                    <Paragraph>Notice will be provided prior to material changes taking effect.</Paragraph>
                  )}
                  {item.id === 'section-12' && (
                    <div className="rounded-xl border border-[#320053]/15 bg-[#f8f6fb] p-4 text-xs text-[#5D5D7F]">
                      <p className="font-bold text-[#0f0a1e] mb-1">CanaFri Legal &amp; Privacy</p>
                      <p>Email: privacy@canafri.com</p>
                    </div>
                  )}
                </AccordionSection>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-[#09090b] px-6 sm:px-10 lg:px-16 py-12 border-t border-white/10 mt-auto">
        <div className="max-w-[117.25rem] mx-auto flex flex-col gap-8 w-full">
          <div className="flex flex-col md:flex-row justify-between gap-10 md:gap-4 items-start">
            <div className="flex flex-col gap-3 max-w-[200px]">
              <p className="font-sans font-bold text-[28px] tracking-tight text-white/90 leading-none">
                Canafri
              </p>
              <p className="font-sans text-[10px] leading-[1.5] text-[#8f9bb3]">
                Connecting talent, opportunities, content creators and businesses through the{' '}
                <span className="text-[#8C5CFF] font-semibold">CC</span> ecosystem
              </p>
            </div>

            <div className="grid grid-cols-3 gap-8 md:gap-12">
              <FooterCol title="Marketplace">
                <li><Link href="/#what-we-offer" className="text-[11px] text-[#8f9bb3] hover:text-white transition-colors">Find Job</Link></li>
                <li><Link href="/#freelancers" className="text-[11px] text-[#8f9bb3] hover:text-white transition-colors">Find Talent</Link></li>
                <li><Link href="/#pricing" className="text-[11px] text-[#8f9bb3] hover:text-white transition-colors">Pricing</Link></li>
              </FooterCol>

              <FooterCol title="Resources">
                <li><Link href="/about" className="text-[11px] text-[#8f9bb3] hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/#how-it-works" className="text-[11px] text-[#8f9bb3] hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/#faq" className="text-[11px] text-[#8f9bb3] hover:text-white transition-colors">FAQ</Link></li>
              </FooterCol>

              <FooterCol title="Legal">
                <li><Link href="/terms" className="text-[11px] text-[#8f9bb3] hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-[11px] text-[#8C5CFF] font-medium transition-colors">Privacy Policy</Link></li>
              </FooterCol>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="bg-white/10 h-px w-full" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <p className="font-sans text-[10px] text-[#8f9bb3]">
                © 2026 Canafri. All rights reserved
              </p>
              <p className="font-sans text-[10px] text-[#8f9bb3]">
                Powered by <span className="text-[#8C5CFF] font-semibold">CC</span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
