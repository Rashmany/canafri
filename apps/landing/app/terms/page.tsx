'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SIGNUP_URL, LOGIN_URL } from '@/lib/config';
import { ChevronRight, ChevronDown } from 'lucide-react';

// Table of contents

const TOC_ITEMS = [
  { id: 'section-1',  label: 'Agreement & Acceptance' },
  { id: 'section-2',  label: 'Account Registration & Eligibility' },
  { id: 'section-3',  label: 'Marketplace & Freelancing Services' },
  { id: 'section-4',  label: 'Escrow, Payments & Canton Coin' },
  { id: 'section-5',  label: 'User Conduct & Platform Rules' },
  { id: 'section-6',  label: 'Intellectual Property Rights' },
  { id: 'section-7',  label: 'Dispute Resolution & Refunds' },
  { id: 'section-8',  label: 'Account Suspension & Termination' },
  { id: 'section-9',  label: 'Disclaimers & Warranties' },
  { id: 'section-10', label: 'Limitation of Liability' },
  { id: 'section-11', label: 'Modifications to Terms' },
  { id: 'section-12', label: 'Contact & Legal Inquiries' },
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

// Desktop: section
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

// Mobile: accordion section
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

// Footer helpers
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

function FooterNavLink({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 text-[11px] text-[#8f9bb3] hover:text-white transition-colors duration-200 text-left w-full cursor-pointer"
      >
        <span className="opacity-70 shrink-0">{icon}</span>
        <span>{label}</span>
      </button>
    </li>
  );
}

// Main Page

export default function TermsPage() {
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
            Legal &amp; Compliance
          </span>
          <h1 className="font-outfit text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Terms &amp; Conditions
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#a1b5d8] max-w-[560px]">
            Please review our platform guidelines, escrow protection rules, and community standards.
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
              <nav aria-label="Terms of service sections">
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
              <Section id="section-1" number="01" title="Agreement & Acceptance">
                <Paragraph>
                  By creating an account, browsing listings, submitting proposals, or transacting on CanaFri, you acknowledge that you have read, understood, and agreed to be bound by these Terms and Conditions.
                </Paragraph>
                <Paragraph>
                  If you do not agree with any part of these terms, you must not access or use the platform. CanaFri provides a dual-sided marketplace enabling clients to post projects and hire independent professionals, with payments secured through Canton smart contract escrow.
                </Paragraph>
              </Section>

              <Section id="section-2" number="02" title="Account Registration & Eligibility">
                <Paragraph>
                  To maintain a safe and reliable marketplace, all users must satisfy basic eligibility rules:
                </Paragraph>
                <BulletList items={[
                  { title: 'Minimum Age Requirement', text: 'You must be at least 18 years old to create an account and transact on CanaFri.' },
                  { title: 'Accurate Information', text: 'You agree to provide true, current, and complete details during registration and keep your profile updated.' },
                  { title: 'One Account Per Person', text: 'Users may not operate multiple duplicate accounts without prior platform authorization.' },
                  { title: 'Account Security', text: 'You are responsible for keeping your login credentials confidential and for all activity occurring under your account.' },
                ]} />
              </Section>

              <Section id="section-3" number="03" title="Marketplace & Freelancing Services">
                <Paragraph>
                  CanaFri operates as an intermediary platform connecting buyers (clients) and sellers (freelancers).
                </Paragraph>
                <SubLabel>Roles &amp; Responsibilities</SubLabel>
                <BulletList items={[
                  { title: 'Independent Relationship', text: 'Freelancers operate as independent contractors. No employment, agency, or partnership relationship is formed with CanaFri.' },
                  { title: 'Job Listings & Proposals', text: 'Clients must provide clear project scopes. Freelancers must submit truthful representations of their capabilities and turnaround times.' },
                  { title: 'Deliverables & Quality', text: 'Freelancers agree to deliver completed work according to agreed project specifications and milestones.' },
                ]} />
              </Section>

              <Section id="section-4" number="04" title="Escrow, Payments & Canton Coin">
                <Paragraph>
                  Financial transactions on CanaFri are conducted using supported Canton assets and protected by an automated escrow system.
                </Paragraph>
                <BulletList items={[
                  { title: 'Escrow Funding', text: 'When an order is created, client funds are deposited into secure smart contract escrow before work begins.' },
                  { title: 'Milestone Release', text: 'Escrow funds are released to the seller once the buyer reviews and approves the delivered work.' },
                  { title: 'Platform Service Fees', text: 'CanaFri charges transparent platform fees on completed transactions to support infrastructure and support operations.' },
                  { title: 'No Off-Platform Payments', text: 'Circumventing the platform escrow system to pay or receive payments outside CanaFri is strictly prohibited.' },
                ]} />
              </Section>

              <Section id="section-5" number="05" title="User Conduct & Platform Rules">
                <Paragraph>
                  All platform members agree to maintain professional conduct. The following actions are strictly prohibited:
                </Paragraph>
                <BulletList items={[
                  'Posting fraudulent, misleading, defamatory, or unlawful job listings or proposals',
                  'Attempting to scam, phish, or harass other community members',
                  'Uploading files containing viruses, malware, or malicious scripts',
                  'Attempting to exploit, reverse engineer, or disrupt platform infrastructure or APIs',
                  'Manipulating feedback, ratings, or order reviews through fake transactions',
                  'Engaging in hate speech, discrimination, or abusive messaging in project channels',
                ]} />
              </Section>

              <Section id="section-6" number="06" title="Intellectual Property Rights">
                <Paragraph>
                  Rights governing project deliverables and platform branding are defined as follows:
                </Paragraph>
                <BulletList items={[
                  { title: 'Work Deliverables', text: 'Upon full release of payment from escrow, full ownership of agreed custom deliverables transfers to the client, unless specified otherwise in writing.' },
                  { title: 'Pre-existing Materials', text: 'Freelancers retain rights to their proprietary pre-existing tools, code libraries, or reusable assets incorporated into work.' },
                  { title: 'Platform Trademarks', text: 'CanaFri branding, logos, graphics, and interface code are the exclusive property of CanaFri and may not be copied without permission.' },
                ]} />
              </Section>

              <Section id="section-7" number="07" title="Dispute Resolution & Refunds">
                <Paragraph>
                  If a disagreement arises between a buyer and seller regarding project completion or quality:
                </Paragraph>
                <BulletList items={[
                  { title: 'Direct Resolution', text: 'Parties are encouraged to communicate constructively through project messaging to resolve revisions or scope adjustments.' },
                  { title: 'Resolution Center', text: 'If direct agreement is not reached, either party may open a ticket in the Resolution Center for administrative review.' },
                  { title: 'Admin Evaluation', text: 'Platform support reviews project scopes, messages, and deliverables to determine fair escrow disbursement or refund.' },
                ]} />
              </Section>

              <Section id="section-8" number="08" title="Account Suspension & Termination">
                <Paragraph>
                  CanaFri reserves the right to suspend or terminate accounts that violate platform policies:
                </Paragraph>
                <BulletList items={[
                  { title: 'Policy Violations', text: 'Severe or repeated breaches of these terms, fraud, or abuse will result in immediate account restriction or permanent ban.' },
                  { title: 'Voluntary Closure', text: 'You may close your account at any time through account settings, provided there are no active escrow obligations or pending orders.' },
                  { title: 'Funds on Suspension', text: 'Legitimate undisputed wallet balances will remain withdrawable subject to standard security verifications.' },
                ]} />
              </Section>

              <Section id="section-9" number="09" title="Disclaimers & Warranties">
                <Paragraph>
                  The platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis. CanaFri does not guarantee uninterrupted service, immediate resolution of every dispute, or specific commercial outcomes from posted jobs.
                </Paragraph>
                <Paragraph>
                  Users are solely responsible for evaluating the qualifications, reliability, and deliverables of counterparts before entering agreements.
                </Paragraph>
              </Section>

              <Section id="section-10" number="10" title="Limitation of Liability">
                <Paragraph>
                  To the maximum extent permitted by applicable law, CanaFri and its affiliates will not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the platform, including loss of profits, data loss, or business interruption.
                </Paragraph>
              </Section>

              <Section id="section-11" number="11" title="Modifications to Terms">
                <Paragraph>
                  We may revise these Terms and Conditions from time to time. When changes are made, we will update the effective date at the top of the page. Continued use of CanaFri after updated terms take effect constitutes acceptance of the modified agreement.
                </Paragraph>
              </Section>

              <Section id="section-12" number="12" title="Contact & Legal Inquiries">
                <Paragraph>
                  If you have questions or inquiries regarding these Terms and Conditions, you can reach out to our legal department:
                </Paragraph>
                <div className="rounded-2xl border border-[#320053]/15 bg-[#f8f6fb] p-6 text-sm text-[#5D5D7F] leading-relaxed">
                  <p className="font-bold text-[#0f0a1e] mb-1 font-outfit text-base">CanaFri Legal Operations</p>
                  <p>
                    Email:{' '}
                    <a href="mailto:legal@canafri.com" className="text-[#320053] hover:underline font-semibold">
                      legal@canafri.com
                    </a>
                  </p>
                  <p className="mt-2 text-xs text-[#5D5D7F]/80">
                    Legal and policy inquiries are reviewed and answered within 3 to 5 business days.
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
                      <Paragraph>
                        By creating an account, browsing listings, submitting proposals, or transacting on CanaFri, you acknowledge that you have read, understood, and agreed to be bound by these Terms and Conditions.
                      </Paragraph>
                      <Paragraph>
                        If you do not agree with any part of these terms, you must not access or use the platform.
                      </Paragraph>
                    </>
                  )}
                  {item.id === 'section-2' && (
                    <BulletList items={[
                      { title: 'Minimum Age Requirement', text: 'You must be at least 18 years old to create an account and transact on CanaFri.' },
                      { title: 'Accurate Information', text: 'You agree to provide true, current, and complete details during registration.' },
                      { title: 'One Account Per Person', text: 'Users may not operate multiple duplicate accounts without authorization.' },
                    ]} />
                  )}
                  {item.id === 'section-3' && (
                    <BulletList items={[
                      { title: 'Independent Relationship', text: 'Freelancers operate as independent contractors.' },
                      { title: 'Job Listings & Proposals', text: 'Clients must provide clear project scopes. Freelancers must submit truthful representations.' },
                    ]} />
                  )}
                  {item.id === 'section-4' && (
                    <BulletList items={[
                      { title: 'Escrow Funding', text: 'Funds are deposited into secure smart contract escrow before work begins.' },
                      { title: 'Milestone Release', text: 'Funds are released once the buyer approves delivered work.' },
                      { title: 'No Off-Platform Payments', text: 'Circumventing escrow is strictly prohibited.' },
                    ]} />
                  )}
                  {item.id === 'section-5' && (
                    <BulletList items={[
                      'Posting fraudulent, misleading, or unlawful listings',
                      'Attempting to scam, phish, or harass other members',
                      'Uploading files containing malware or viruses',
                    ]} />
                  )}
                  {item.id === 'section-6' && (
                    <Paragraph>
                      Upon full release of payment from escrow, full ownership of agreed custom deliverables transfers to the client.
                    </Paragraph>
                  )}
                  {item.id === 'section-7' && (
                    <Paragraph>
                      Disputes may be escalated to the Resolution Center for administrative review and fair escrow disbursement.
                    </Paragraph>
                  )}
                  {item.id === 'section-8' && (
                    <Paragraph>
                      Severe or repeated breaches of these terms will result in immediate account restriction or permanent ban.
                    </Paragraph>
                  )}
                  {item.id === 'section-9' && (
                    <Paragraph>
                      The platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis.
                    </Paragraph>
                  )}
                  {item.id === 'section-10' && (
                    <Paragraph>
                      CanaFri will not be liable for any indirect, incidental, or consequential damages.
                    </Paragraph>
                  )}
                  {item.id === 'section-11' && (
                    <Paragraph>
                      We may revise these Terms and Conditions periodically. Continued use signifies acceptance.
                    </Paragraph>
                  )}
                  {item.id === 'section-12' && (
                    <div className="rounded-xl border border-[#320053]/15 bg-[#f8f6fb] p-4 text-xs text-[#5D5D7F]">
                      <p className="font-bold text-[#0f0a1e] mb-1">CanaFri Legal Operations</p>
                      <p>Email: legal@canafri.com</p>
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
                <li><Link href="/terms" className="text-[11px] text-[#8C5CFF] font-medium transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-[11px] text-[#8f9bb3] hover:text-white transition-colors">Privacy Policy</Link></li>
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
