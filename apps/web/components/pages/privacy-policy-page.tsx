'use client';

import { useState } from 'react';
import { ArrowLeft, Shield, ChevronRight, ChevronDown } from 'lucide-react';
import Footer from '@/components/layout/footer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrivacyPolicyPageProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

// ─── Table of contents ────────────────────────────────────────────────────────

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

export default function PrivacyPolicyPage({ onBack, onNavigate }: PrivacyPolicyPageProps) {
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
            Privacy Policy
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
              <nav aria-label="Privacy policy sections">
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

            {/* ── Section 2 ── */}
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

            {/* ── Section 3 ── */}
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

            {/* ── Section 4 ── */}
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

            {/* ── Section 5 ── */}
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

            {/* ── Section 6 ── */}
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

            {/* ── Section 7 ── */}
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

            {/* ── Section 8 ── */}
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

            {/* ── Section 9 ── */}
            <Section id="section-9" number="09" title="Third-Party Services">
              <Paragraph>
                The platform may provide links to external channels, such as our official Telegram community or X (Twitter) profile. These third-party platforms have their own independent privacy policies. We encourage you to review their terms when interacting with external services.
              </Paragraph>
            </Section>

            {/* ── Section 10 ── */}
            <Section id="section-10" number="10" title="Age Requirements">
              <Paragraph>
                CanaFri is strictly for users aged 18 and older. We do not knowingly permit account creation or collect information from individuals under 18. If we discover an account registered by an underage user, we will immediately close the account and remove the associated data.
              </Paragraph>
            </Section>

            {/* ── Section 11 ── */}
            <Section id="section-11" number="11" title="Updates to This Policy">
              <Paragraph>
                We may revise this Privacy Policy periodically to reflect product updates, operational adjustments, or regulatory requirements. When significant revisions are made, we will provide notice through the platform interface or email before changes take effect.
              </Paragraph>
            </Section>

            {/* ── Section 12 ── */}
            <Section id="section-12" number="12" title="Contact Us">
              <Paragraph>
                If you have questions, feedback, or requests regarding this Privacy Policy or your personal information, you can reach our team directly:
              </Paragraph>
              <div className="rounded-xl border border-border/60 bg-foreground/[0.02] p-5 text-[13px] text-[#5E5E5E] dark:text-[#A0A0A0] leading-relaxed">
                <p className="font-semibold text-[#010101] dark:text-white mb-1">CanaFri Legal &amp; Privacy</p>
                <p>
                  Email:{' '}
                  <a
                    href="mailto:privacy@canafri.com"
                    className="text-primary hover:underline transition-all font-medium"
                  >
                    privacy@canafri.com
                  </a>
                </p>
                <p className="mt-2 text-[12px] text-[#5E5E5E]/80 dark:text-[#A0A0A0]/80">
                  Inquiries are handled during standard business hours with a response target of 3 to 5 business days.
                </p>
              </div>
            </Section>

            </div>{/* end hidden lg:block */}

            {/* ── Mobile accordion view ── */}
            <div className="flex flex-col gap-2 lg:hidden">

              <AccordionSection id="section-1-m" number="01" title="Information We Collect" isOpen={openSections.has('section-1')} onToggle={() => toggleSection('section-1')}>
                <Paragraph>We collect personal information directly from you when you register, use our services, or communicate with us.</Paragraph>
                <SubLabel>Account &amp; Profile Details</SubLabel>
                <BulletList items={['Full name and public display name','Registered email address and encrypted password','Date of birth to confirm age eligibility','Profile picture and bio details you choose to share','Account preferences and role selection (Buyer or Seller)']} />
                <SubLabel>Marketplace &amp; Transaction Activity</SubLabel>
                <BulletList items={['Job listings created, proposals submitted, and active contracts','Direct communications and project messages sent between users','Wallet transactions, deposit and withdrawal records, and escrow milestones','Reviews, star ratings, and feedback left on completed orders','Support tickets, inquiry logs, and related attachments']} />
                <SubLabel>Technical &amp; Log Data</SubLabel>
                <BulletList items={['IP address and general country/city location','Device type, browser version, and operating system','Session verification data to secure active logins','System diagnostic logs and security event records']} />
              </AccordionSection>

              <AccordionSection id="section-2-m" number="02" title="How We Use Your Information" isOpen={openSections.has('section-2')} onToggle={() => toggleSection('section-2')}>
                <Paragraph>We use the data we collect solely to operate, secure, and deliver the CanaFri platform services.</Paragraph>
                <BulletList items={['To create and administer user accounts and verify registration details','To facilitate job postings, proposals, escrow contracts, and payouts','To deliver transactional emails, including verification codes and account notices','To enable direct in-app messaging between buyers and freelancers','To protect against fraud, abuse, spam, and security incidents','To assist users with support inquiries and dispute resolution','To maintain platform uptime, monitor server performance, and optimize load times','To satisfy legal, regulatory, and tax compliance requirements']} />
              </AccordionSection>

              <AccordionSection id="section-3-m" number="03" title="Legal Basis for Processing" isOpen={openSections.has('section-3')} onToggle={() => toggleSection('section-3')}>
                <Paragraph>We process your personal information under the following recognized legal grounds:</Paragraph>
                <BulletList items={[{title:'Performance of a Contract',text:'Processing necessary to provide platform features and complete user agreements.'},{title:'Legitimate Interests',text:'Securing the platform, preventing fraud, and ensuring service reliability.'},{title:'Legal Obligations',text:'Complying with accounting rules, tax regulations, and applicable statutory laws.'},{title:'User Consent',text:'Where you give explicit approval for optional preferences or communications.'}]} />
              </AccordionSection>

              <AccordionSection id="section-4-m" number="04" title="Sharing Your Information" isOpen={openSections.has('section-4')} onToggle={() => toggleSection('section-4')}>
                <Paragraph>CanaFri does not sell your personal data to third parties. We share data only in the following specific circumstances:</Paragraph>
                <BulletList items={[{title:'With Other Users',text:'Public profile information, listings, reviews, and transaction details necessary to complete work between buyers and sellers.'},{title:'Service Providers',text:'Trusted infrastructure and database partners operating under strict confidentiality and data protection agreements.'},{title:'Legal & Regulatory Authorities',text:'When required by law, court order, or governmental demand to protect users or legal rights.'},{title:'Business Reorganization',text:'In connection with a company acquisition, merger, or asset transfer, subject to standard privacy protections.'}]} />
              </AccordionSection>

              <AccordionSection id="section-5-m" number="05" title="Data Retention" isOpen={openSections.has('section-5')} onToggle={() => toggleSection('section-5')}>
                <Paragraph>We retain personal data only for as long as needed to fulfill the purposes set out in this policy.</Paragraph>
                <BulletList items={[{title:'Account Data',text:'Maintained during active account status and permanently removed within 30 days of an approved account deletion request.'},{title:'Financial Records',text:'Retained for up to 7 years to comply with statutory accounting and tax regulations.'},{title:'Support & Tickets',text:'Kept for 3 years to assist with history and dispute reviews.'},{title:'Temporary Session OTPs',text:'Automatically discarded after 15 minutes of issuance.'},{title:'Server Access Logs',text:'Rotated and discarded within 90 days.'}]} />
              </AccordionSection>

              <AccordionSection id="section-6-m" number="06" title="Your Privacy Rights" isOpen={openSections.has('section-6')} onToggle={() => toggleSection('section-6')}>
                <Paragraph>Depending on your country or region of residence, you have specific rights regarding your personal information:</Paragraph>
                <BulletList items={[{title:'Right of Access',text:'Request a summary and copy of personal data held about you.'},{title:'Right to Rectification',text:'Update inaccurate or incomplete information through your account settings or support.'},{title:'Right to Erasure',text:'Request deletion of your account and personal records where legally permissible.'},{title:'Right to Restriction',text:'Request that we pause or limit certain processing activities.'},{title:'Right to Data Portability',text:'Receive your account data in an accessible digital format.'},{title:'Right to Object',text:'Object to data processing carried out under legitimate interest grounds.'}]} />
                <Paragraph>To exercise any of these rights, contact us at privacy@canafri.com. Requests are reviewed and addressed within 30 days.</Paragraph>
              </AccordionSection>

              <AccordionSection id="section-7-m" number="07" title="Cookies &amp; Storage" isOpen={openSections.has('section-7')} onToggle={() => toggleSection('section-7')}>
                <Paragraph>CanaFri uses strictly functional browser storage mechanisms necessary for the platform to operate properly:</Paragraph>
                <BulletList items={[{title:'Authentication Storage',text:'Secure session tokens stored locally to keep you logged in across pages.'},{title:'Display Preferences',text:'Theme choice (dark or light mode) saved to preserve your viewing settings.'},{title:'Workspace Mode',text:'Buyer or seller dashboard state stored to maintain your active view.'}]} />
                <Paragraph>We do not deploy third-party advertising trackers, cross-site trackers, or commercial profiling cookies.</Paragraph>
              </AccordionSection>

              <AccordionSection id="section-8-m" number="08" title="Account &amp; Data Security" isOpen={openSections.has('section-8')} onToggle={() => toggleSection('section-8')}>
                <Paragraph>We employ technical and organizational security controls designed to safeguard your information against unauthorized access, loss, or misuse:</Paragraph>
                <BulletList items={['Passwords are protected using industry-standard cryptographic hashing and are never stored in plain text','All platform traffic is encrypted in transit using Transport Layer Security (TLS)','Single-use verification codes expire automatically and cannot be reused','Strict rate limiting is enforced on login and registration endpoints to prevent brute-force attacks','Access to backend administration systems is restricted to authorized operations personnel']} />
              </AccordionSection>

              <AccordionSection id="section-9-m" number="09" title="Third-Party Services" isOpen={openSections.has('section-9')} onToggle={() => toggleSection('section-9')}>
                <Paragraph>The platform may provide links to external channels, such as our official Telegram community or X (Twitter) profile. These third-party platforms have their own independent privacy policies. We encourage you to review their terms when interacting with external services.</Paragraph>
              </AccordionSection>

              <AccordionSection id="section-10-m" number="10" title="Age Requirements" isOpen={openSections.has('section-10')} onToggle={() => toggleSection('section-10')}>
                <Paragraph>CanaFri is strictly for users aged 18 and older. We do not knowingly permit account creation or collect information from individuals under 18. If we discover an account registered by an underage user, we will immediately close the account and remove the associated data.</Paragraph>
              </AccordionSection>

              <AccordionSection id="section-11-m" number="11" title="Updates to This Policy" isOpen={openSections.has('section-11')} onToggle={() => toggleSection('section-11')}>
                <Paragraph>We may revise this Privacy Policy periodically to reflect product updates, operational adjustments, or regulatory requirements. When significant revisions are made, we will provide notice through the platform interface or email before changes take effect.</Paragraph>
              </AccordionSection>

              <AccordionSection id="section-12-m" number="12" title="Contact Us" isOpen={openSections.has('section-12')} onToggle={() => toggleSection('section-12')}>
                <Paragraph>If you have questions, feedback, or requests regarding this Privacy Policy or your personal information, you can reach our team directly:</Paragraph>
                <div className="rounded-xl border border-border/60 bg-foreground/[0.02] p-4 text-[13px] text-[#5E5E5E] dark:text-[#A0A0A0] leading-relaxed mb-2">
                  <p className="font-semibold text-[#010101] dark:text-white mb-1">CanaFri Legal &amp; Privacy</p>
                  <p>Email:{' '}<a href="mailto:privacy@canafri.com" className="text-primary hover:underline transition-all font-medium">privacy@canafri.com</a></p>
                  <p className="mt-2 text-[12px] text-[#5E5E5E]/80 dark:text-[#A0A0A0]/80">Inquiries are handled during standard business hours with a response target of 3 to 5 business days.</p>
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
