'use client';

import { useState } from 'react';
import { ArrowLeft, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import Footer from '@/components/layout/footer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TermsPageProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

// ─── Table of contents ────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ id, number, children }: { id: string; number: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="flex items-baseline gap-3 scroll-mt-48 sm:scroll-mt-52 text-base font-semibold text-[#010101] dark:text-[#EDEDED] leading-snug mb-4"
    >
      <span className="shrink-0 text-sm font-bold font-mono text-[#010101] dark:text-white tabular-nums select-none">{number}</span>
      {children}
    </h2>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] leading-[1.75] text-[#5E5E5E] dark:text-[#A0A0A0] mb-4 last:mb-0">
      {children}
    </p>
  );
}

function BulletList({ items }: { items: { title?: string; text: string }[] | string[] }) {
  return (
    <ul className="space-y-2.5 mb-4">
      {items.map((item, i) => {
        const isObj = typeof item !== 'string';
        const title = isObj ? item.title : undefined;
        const text = isObj ? item.text : item;

        return (
          <li key={i} className="flex items-start gap-2.5 text-[13px] leading-[1.65] text-[#5E5E5E] dark:text-[#A0A0A0]">
            <span className="mt-[7px] shrink-0 size-1.5 rounded-full bg-[#010101] dark:bg-white" />
            <span>
              {title && <strong className="font-medium text-[#010101] dark:text-[#EDEDED]">{title}: </strong>}
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
    <p className="text-[12px] font-semibold text-[#010101] dark:text-[#EDEDED] mb-2.5">{children}</p>
  );
}

// Desktop: always expanded section
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
    <section id={id} className="scroll-mt-48 sm:scroll-mt-52">
      <SectionHeading id={id} number={number}>{title}</SectionHeading>
      {children}
      <div className="mt-8 mb-8 h-px bg-border/40" />
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
    <div id={id} className="border border-border/60 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors text-left cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="shrink-0 text-[12px] font-bold font-mono text-[#010101] dark:text-white tabular-nums select-none">{number}</span>
          <span className="text-[13px] font-semibold text-[#010101] dark:text-[#EDEDED] leading-snug">{title}</span>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[#5E5E5E] dark:text-[#A0A0A0] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={[
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-[9999px] opacity-100 animate-accordion-open' : 'max-h-0 opacity-0',
        ].join(' ')}
      >
        <div className="px-4 pt-4 pb-2">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TermsPage({ onBack, onNavigate }: TermsPageProps) {
  const [activeSection, setActiveSection] = useState('section-1');
  // Accordion state for mobile — first section open by default
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['section-1']));

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
    <div className="flex flex-col min-h-screen bg-[var(--bg-page)]">

      {/* ── Fixed/Sticky Top Hero Banner ── */}
      <header className="sticky top-0 z-30 w-full overflow-hidden border-b border-border bg-[#0B0B0F] shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/images/privacy-banner-image.jpg')` }}
        />
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[0.5px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

        {/* Back button */}
        {onBack && (
          <div className="absolute top-4 sm:top-5 left-4 sm:left-8 z-20">
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="flex items-center justify-center size-9 rounded-xl border border-white/20 bg-black/30 backdrop-blur-md hover:bg-black/50 text-white/90 hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft size={16} />
            </button>
          </div>
        )}

        {/* Centered H1 */}
        <div className="relative z-10 max-w-[1100px] mx-auto px-4 md:px-8 py-12 sm:py-14 md:py-16 flex flex-col items-center justify-center text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
            Terms &amp; Conditions
          </h1>
        </div>

        {/* Last updated on bottom-right without background */}
        <div className="absolute bottom-3.5 right-4 sm:right-8 z-20">
          <span className="text-[11px] text-white/50 font-normal">
            Last updated: August 2026
          </span>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="flex-1 w-full max-w-[1100px] mx-auto px-4 md:px-8 py-10 md:py-14">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">

          {/* ── Sidebar TOC (desktop) ── */}
          <aside className="hidden lg:flex flex-col gap-1 w-[220px] shrink-0">
            <div className="sticky top-52">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5E5E5E]/60 dark:text-[#A0A0A0]/60 mb-4">Contents</p>
              <nav aria-label="Terms of service sections">
                <ul className="space-y-0.5">
                  {TOC_ITEMS.map(item => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => scrollTo(item.id)}
                        className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-[12px] transition-all cursor-pointer ${
                          activeSection === item.id
                            ? 'bg-foreground/10 text-[#010101] dark:text-white font-medium'
                            : 'text-[#5E5E5E] dark:text-[#A0A0A0] hover:text-[#010101] dark:hover:text-white hover:bg-foreground/10'
                        }`}
                      >
                        {activeSection === item.id
                          ? <ChevronRight size={10} className="shrink-0 text-foreground" />
                          : <span className="size-[10px] shrink-0" />
                        }
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          {/* ── Document body ── */}
          <div className="flex-1 min-w-0">

            {/* ── Desktop sections (always expanded) ── */}
            <div className="hidden lg:block">

            {/* ── Section 1 ── */}
            <Section id="section-1" number="01" title="Agreement &amp; Acceptance">
              <Paragraph>
                By creating an account, browsing listings, submitting proposals, or transacting on CanaFri, you acknowledge that you have read, understood, and agreed to be bound by these Terms and Conditions.
              </Paragraph>
              <Paragraph>
                If you do not agree with any part of these terms, you must not access or use the platform. CanaFri provides a dual-sided marketplace enabling clients to post projects and hire independent professionals, with payments secured through escrow contracts.
              </Paragraph>
            </Section>

            {/* ── Section 2 ── */}
            <Section id="section-2" number="02" title="Account Registration &amp; Eligibility">
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

            {/* ── Section 3 ── */}
            <Section id="section-3" number="03" title="Marketplace &amp; Freelancing Services">
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

            {/* ── Section 4 ── */}
            <Section id="section-4" number="04" title="Escrow, Payments &amp; Canton Coin">
              <Paragraph>
                Financial transactions on CanaFri are conducted using supported ecosystem assets and protected by an automated escrow system.
              </Paragraph>
              <BulletList items={[
                { title: 'Escrow Funding', text: 'When an order is created, client funds are deposited into secure escrow before work begins.' },
                { title: 'Milestone Release', text: 'Escrow funds are released to the seller once the buyer reviews and approves the delivered work.' },
                { title: 'Platform Service Fees', text: 'CanaFri charges transparent platform fees on completed transactions to support infrastructure and support operations.' },
                { title: 'No Off-Platform Payments', text: 'Circumventing the platform escrow system to pay or receive payments outside CanaFri is strictly prohibited.' },
              ]} />
            </Section>

            {/* ── Section 5 ── */}
            <Section id="section-5" number="05" title="User Conduct &amp; Platform Rules">
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

            {/* ── Section 6 ── */}
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

            {/* ── Section 7 ── */}
            <Section id="section-7" number="07" title="Dispute Resolution &amp; Refunds">
              <Paragraph>
                If a disagreement arises between a buyer and seller regarding project completion or quality:
              </Paragraph>
              <BulletList items={[
                { title: 'Direct Resolution', text: 'Parties are encouraged to communicate constructively through project messaging to resolve revisions or scope adjustments.' },
                { title: 'Resolution Center', text: 'If direct agreement is not reached, either party may open a ticket in the Resolution Center for administrative review.' },
                { title: 'Admin Evaluation', text: 'Platform support reviews project scopes, messages, and deliverables to determine fair escrow disbursement or refund.' },
              ]} />
            </Section>

            {/* ── Section 8 ── */}
            <Section id="section-8" number="08" title="Account Suspension &amp; Termination">
              <Paragraph>
                CanaFri reserves the right to suspend or terminate accounts that violate platform policies:
              </Paragraph>
              <BulletList items={[
                { title: 'Policy Violations', text: 'Severe or repeated breaches of these terms, fraud, or abuse will result in immediate account restriction or permanent ban.' },
                { title: 'Voluntary Closure', text: 'You may close your account at any time through account settings, provided there are no active escrow obligations or pending orders.' },
                { title: 'Funds on Suspension', text: 'Legitimate undisputed wallet balances will remain withdrawable subject to standard security verifications.' },
              ]} />
            </Section>

            {/* ── Section 9 ── */}
            <Section id="section-9" number="09" title="Disclaimers &amp; Warranties">
              <Paragraph>
                The platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis. CanaFri does not guarantee uninterrupted service, immediate resolution of every dispute, or specific commercial outcomes from posted jobs.
              </Paragraph>
              <Paragraph>
                Users are solely responsible for evaluating the qualifications, reliability, and deliverables of counterparts before entering agreements.
              </Paragraph>
            </Section>

            {/* ── Section 10 ── */}
            <Section id="section-10" number="10" title="Limitation of Liability">
              <Paragraph>
                To the maximum extent permitted by applicable law, CanaFri and its affiliates will not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the platform, including loss of profits, data loss, or business interruption.
              </Paragraph>
            </Section>

            {/* ── Section 11 ── */}
            <Section id="section-11" number="11" title="Modifications to Terms">
              <Paragraph>
                We may revise these Terms and Conditions from time to time. When changes are made, we will update the effective date at the top of the page. Continued use of CanaFri after updated terms take effect constitutes acceptance of the modified agreement.
              </Paragraph>
            </Section>

            {/* ── Section 12 ── */}
            <Section id="section-12" number="12" title="Contact &amp; Legal Inquiries">
              <Paragraph>
                If you have questions or inquiries regarding these Terms and Conditions, you can reach out to our legal department:
              </Paragraph>
              <div className="rounded-xl border border-border/60 bg-foreground/[0.02] p-5 text-[13px] text-[#5E5E5E] dark:text-[#A0A0A0] leading-relaxed">
                <p className="font-semibold text-[#010101] dark:text-white mb-1">CanaFri Legal Operations</p>
                <p>
                  Email:{' '}
                  <a href="mailto:legal@canafri.com" className="text-primary hover:underline transition-all font-medium">
                    legal@canafri.com
                  </a>
                </p>
                <p className="mt-2 text-[12px] text-[#5E5E5E]/80 dark:text-[#A0A0A0]/80">
                  Legal and policy inquiries are reviewed and answered within 3 to 5 business days.
                </p>
              </div>
            </Section>

            </div>{/* end hidden lg:block */}

            {/* ── Mobile accordion view ── */}
            <div className="flex flex-col gap-2 lg:hidden">

              <AccordionSection id="section-1-m" number="01" title="Agreement & Acceptance" isOpen={openSections.has('section-1')} onToggle={() => toggleSection('section-1')}>
                <Paragraph>By creating an account, browsing listings, submitting proposals, or transacting on CanaFri, you acknowledge that you have read, understood, and agreed to be bound by these Terms and Conditions.</Paragraph>
                <Paragraph>If you do not agree with any part of these terms, you must not access or use the platform. CanaFri provides a dual-sided marketplace enabling clients to post projects and hire independent professionals, with payments secured through escrow contracts.</Paragraph>
              </AccordionSection>

              <AccordionSection id="section-2-m" number="02" title="Account Registration & Eligibility" isOpen={openSections.has('section-2')} onToggle={() => toggleSection('section-2')}>
                <Paragraph>To maintain a safe and reliable marketplace, all users must satisfy basic eligibility rules:</Paragraph>
                <BulletList items={[{title:'Minimum Age Requirement',text:'You must be at least 18 years old to create an account and transact on CanaFri.'},{title:'Accurate Information',text:'You agree to provide true, current, and complete details during registration and keep your profile updated.'},{title:'One Account Per Person',text:'Users may not operate multiple duplicate accounts without prior platform authorization.'},{title:'Account Security',text:'You are responsible for keeping your login credentials confidential and for all activity occurring under your account.'}]} />
              </AccordionSection>

              <AccordionSection id="section-3-m" number="03" title="Marketplace & Freelancing Services" isOpen={openSections.has('section-3')} onToggle={() => toggleSection('section-3')}>
                <Paragraph>CanaFri operates as an intermediary platform connecting buyers (clients) and sellers (freelancers).</Paragraph>
                <SubLabel>Roles &amp; Responsibilities</SubLabel>
                <BulletList items={[{title:'Independent Relationship',text:'Freelancers operate as independent contractors. No employment, agency, or partnership relationship is formed with CanaFri.'},{title:'Job Listings & Proposals',text:'Clients must provide clear project scopes. Freelancers must submit truthful representations of their capabilities and turnaround times.'},{title:'Deliverables & Quality',text:'Freelancers agree to deliver completed work according to agreed project specifications and milestones.'}]} />
              </AccordionSection>

              <AccordionSection id="section-4-m" number="04" title="Escrow, Payments & Canton Coin" isOpen={openSections.has('section-4')} onToggle={() => toggleSection('section-4')}>
                <Paragraph>Financial transactions on CanaFri are conducted using supported ecosystem assets and protected by an automated escrow system.</Paragraph>
                <BulletList items={[{title:'Escrow Funding',text:'When an order is created, client funds are deposited into secure escrow before work begins.'},{title:'Milestone Release',text:'Escrow funds are released to the seller once the buyer reviews and approves the delivered work.'},{title:'Platform Service Fees',text:'CanaFri charges transparent platform fees on completed transactions to support infrastructure and support operations.'},{title:'No Off-Platform Payments',text:'Circumventing the platform escrow system to pay or receive payments outside CanaFri is strictly prohibited.'}]} />
              </AccordionSection>

              <AccordionSection id="section-5-m" number="05" title="User Conduct & Platform Rules" isOpen={openSections.has('section-5')} onToggle={() => toggleSection('section-5')}>
                <Paragraph>All platform members agree to maintain professional conduct. The following actions are strictly prohibited:</Paragraph>
                <BulletList items={['Posting fraudulent, misleading, defamatory, or unlawful job listings or proposals','Attempting to scam, phish, or harass other community members','Uploading files containing viruses, malware, or malicious scripts','Attempting to exploit, reverse engineer, or disrupt platform infrastructure or APIs','Manipulating feedback, ratings, or order reviews through fake transactions','Engaging in hate speech, discrimination, or abusive messaging in project channels']} />
              </AccordionSection>

              <AccordionSection id="section-6-m" number="06" title="Intellectual Property Rights" isOpen={openSections.has('section-6')} onToggle={() => toggleSection('section-6')}>
                <Paragraph>Rights governing project deliverables and platform branding are defined as follows:</Paragraph>
                <BulletList items={[{title:'Work Deliverables',text:'Upon full release of payment from escrow, full ownership of agreed custom deliverables transfers to the client, unless specified otherwise in writing.'},{title:'Pre-existing Materials',text:'Freelancers retain rights to their proprietary pre-existing tools, code libraries, or reusable assets incorporated into work.'},{title:'Platform Trademarks',text:'CanaFri branding, logos, graphics, and interface code are the exclusive property of CanaFri and may not be copied without permission.'}]} />
              </AccordionSection>

              <AccordionSection id="section-7-m" number="07" title="Dispute Resolution & Refunds" isOpen={openSections.has('section-7')} onToggle={() => toggleSection('section-7')}>
                <Paragraph>If a disagreement arises between a buyer and seller regarding project completion or quality:</Paragraph>
                <BulletList items={[{title:'Direct Resolution',text:'Parties are encouraged to communicate constructively through project messaging to resolve revisions or scope adjustments.'},{title:'Resolution Center',text:'If direct agreement is not reached, either party may open a ticket in the Resolution Center for administrative review.'},{title:'Admin Evaluation',text:'Platform support reviews project scopes, messages, and deliverables to determine fair escrow disbursement or refund.'}]} />
              </AccordionSection>

              <AccordionSection id="section-8-m" number="08" title="Account Suspension & Termination" isOpen={openSections.has('section-8')} onToggle={() => toggleSection('section-8')}>
                <Paragraph>CanaFri reserves the right to suspend or terminate accounts that violate platform policies:</Paragraph>
                <BulletList items={[{title:'Policy Violations',text:'Severe or repeated breaches of these terms, fraud, or abuse will result in immediate account restriction or permanent ban.'},{title:'Voluntary Closure',text:'You may close your account at any time through account settings, provided there are no active escrow obligations or pending orders.'},{title:'Funds on Suspension',text:'Legitimate undisputed wallet balances will remain withdrawable subject to standard security verifications.'}]} />
              </AccordionSection>

              <AccordionSection id="section-9-m" number="09" title="Disclaimers & Warranties" isOpen={openSections.has('section-9')} onToggle={() => toggleSection('section-9')}>
                <Paragraph>The platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis. CanaFri does not guarantee uninterrupted service, immediate resolution of every dispute, or specific commercial outcomes from posted jobs.</Paragraph>
                <Paragraph>Users are solely responsible for evaluating the qualifications, reliability, and deliverables of counterparts before entering agreements.</Paragraph>
              </AccordionSection>

              <AccordionSection id="section-10-m" number="10" title="Limitation of Liability" isOpen={openSections.has('section-10')} onToggle={() => toggleSection('section-10')}>
                <Paragraph>To the maximum extent permitted by applicable law, CanaFri and its affiliates will not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the platform, including loss of profits, data loss, or business interruption.</Paragraph>
              </AccordionSection>

              <AccordionSection id="section-11-m" number="11" title="Modifications to Terms" isOpen={openSections.has('section-11')} onToggle={() => toggleSection('section-11')}>
                <Paragraph>We may revise these Terms and Conditions from time to time. When changes are made, we will update the effective date at the top of the page. Continued use of CanaFri after updated terms take effect constitutes acceptance of the modified agreement.</Paragraph>
              </AccordionSection>

              <AccordionSection id="section-12-m" number="12" title="Contact & Legal Inquiries" isOpen={openSections.has('section-12')} onToggle={() => toggleSection('section-12')}>
                <Paragraph>If you have questions or inquiries regarding these Terms and Conditions, you can reach out to our legal department:</Paragraph>
                <div className="rounded-xl border border-border/60 bg-foreground/[0.02] p-4 text-[13px] text-[#5E5E5E] dark:text-[#A0A0A0] leading-relaxed mb-2">
                  <p className="font-semibold text-[#010101] dark:text-white mb-1">CanaFri Legal Operations</p>
                  <p>Email:{' '}<a href="mailto:legal@canafri.com" className="text-primary hover:underline transition-all font-medium">legal@canafri.com</a></p>
                  <p className="mt-2 text-[12px] text-[#5E5E5E]/80 dark:text-[#A0A0A0]/80">Legal and policy inquiries are reviewed and answered within 3 to 5 business days.</p>
                </div>
              </AccordionSection>

            </div>{/* end mobile accordion */}

          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
