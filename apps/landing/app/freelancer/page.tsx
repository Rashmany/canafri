'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

function useInView(options: IntersectionObserverInit = {}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const cb: IntersectionObserverCallback = useCallback(([entry]) => {
    if (entry.isIntersecting) setIsVisible(true);
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(cb, { threshold: 0.08, rootMargin: '0px 0px -50px 0px', ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, [cb, options]);
  return { ref, isVisible };
}

function Reveal({ children, className = '', delay = 0, fade = false }: { children: React.ReactNode; className?: string; delay?: number; fade?: boolean }) {
  const { ref, isVisible } = useInView();
  const base = fade ? 'reveal-fade' : 'reveal';
  const delayClass = [0, 75, 150, 225, 300, 375].includes(delay) ? `delay-${delay}` : '';
  const inlineStyle = delay && !delayClass ? { animationDelay: `${delay}ms` } : undefined;
  return (
    <div ref={ref} style={inlineStyle} className={`${base} ${delayClass}${isVisible ? ' is-visible' : ''}${className ? ' ' + className : ''}`}>
      {children}
    </div>
  );
}

function FooterXIcon() {
  return (
    <svg className="size-[13px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <p className="font-sans font-medium text-[13px] text-white/90 leading-5">{title}</p>
        <div className="bg-[#8C5CFF] h-[1.5px] w-8 rounded-full" />
      </div>
      <ul className="flex flex-col gap-3">{children}</ul>
    </div>
  );
}

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#what-we-offer' },
  { label: 'Articles', href: '/#articles' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Find Talent', href: '/#freelancers' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'About', href: '/about' },
];

const clientSteps = [
  { n: '01', title: 'Post a Job', body: 'Describe your project, define milestones, and set the CC payment. Your posting goes live on the CanaFri marketplace immediately after escrow funding.' },
  { n: '02', title: 'Review & Hire', body: 'Browse verified freelancer profiles, review ratings, and send offers. Use the built-in messaging to align on scope before committing to escrow.' },
  { n: '03', title: 'Track Milestones', body: 'Monitor progress through the on-chain milestone dashboard. Approve or request revisions for each deliverable — all actions are cryptographically signed.' },
  { n: '04', title: 'Release & Review', body: 'On final approval, CC is released instantly. Leave a verified on-chain review that helps the freelancer build their reputation across the platform.' },
];

const freelancerSteps = [
  { n: '01', title: 'Build Your Profile', body: 'Create an on-chain reputation profile listing your Canton Network skills, DAML experience, and past project history. Verified skills earn you a trust badge.' },
  { n: '02', title: 'Browse & Apply', body: 'Search open jobs filtered by skill, CC rate, and duration. Submit proposals with your milestone breakdown directly through the platform.' },
  { n: '03', title: 'Deliver Milestones', body: 'Work and submit deliverables for each milestone. The smart contract tracks your submissions — there is no ambiguity about what was delivered and when.' },
  { n: '04', title: 'Get Paid Instantly', body: 'On milestone approval, CC hits your wallet in seconds. Build your on-chain reputation with every successful delivery to command higher rates.' },
];

const categories = [
  { icon: '⚡', label: 'DAML Smart Contracts', count: '142 open jobs' },
  { icon: '🔗', label: 'Canton Network Dev', count: '89 open jobs' },
  { icon: '🛡️', label: 'Smart Contract Auditing', count: '61 open jobs' },
  { icon: '📊', label: 'Tokenomics Design', count: '47 open jobs' },
  { icon: '🎨', label: 'Web3 UI/UX Design', count: '38 open jobs' },
  { icon: '✍️', label: 'Technical Writing', count: '93 open jobs' },
];

const freelancerFaqs = [
  { q: 'How do I get my first job on CanaFri?', a: 'Create your profile and highlight any Canton Network or DAML experience. Apply to introductory-level jobs to build your initial on-chain reputation. Most clients browse by rating, so early positive reviews are critical.' },
  { q: 'What CC rate should I charge?', a: 'Rates vary by skill and experience. DAML smart contract developers typically charge 250–400 CC/hr. Technical writers typically charge 80–150 CC/hr. Check the marketplace for live rate benchmarks.' },
  { q: 'Is there a fee for freelancers?', a: 'CanaFri charges a 5% service fee on earnings, deducted automatically at the time of escrow release. There are no subscription fees or listing charges for freelancers.' },
  { q: 'How do clients post jobs?', a: 'Clients sign up, complete KYB (Know Your Business) verification, fund their CC wallet, and create a job posting with defined milestones. The escrow contract is created automatically on posting.' },
  { q: 'Can I work on multiple jobs simultaneously?', a: 'Yes, there is no cap on simultaneous contracts. However, your on-chain reputation score factors in delivery rate — consistently missing deadlines will lower your visibility in search results.' },
  { q: 'What happens if a client ghosts me?', a: 'If a client fails to respond to a submitted milestone within 7 days, the smart contract can auto-approve the milestone and release funds to you. This is a built-in protection for freelancers.' },
];

export default function FreelancerPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'freelancer' | 'client'>('freelancer');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const activeSteps = activeTab === 'freelancer' ? freelancerSteps : clientSteps;

  return (
    <main className="flex flex-col min-h-screen w-full bg-[#09090b] text-white relative overflow-x-hidden">

      {/* ── Navbar ── */}
      <header className="fixed top-0 inset-x-0 z-50 w-full bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="flex h-20 items-center justify-between px-6 sm:px-10 lg:px-16 max-w-[117.25rem] mx-auto">
          <div className="inline-flex items-center gap-8 lg:gap-12">
            <Link href="/" aria-label="Canafri home">
              <img src="/app-logo/canafri-logo.svg" alt="Canafri" className="h-9 sm:h-10 w-auto object-contain" />
            </Link>
            <nav aria-label="Primary navigation" className="hidden md:block">
              <ul className="inline-flex items-center gap-8">
                {NAV_LINKS.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="font-sans font-medium text-[var(--muted)] text-sm hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/freelancer" className="font-sans font-semibold text-[#8C5CFF] text-sm flex items-center gap-1.5">
                    Marketplace <span className="size-1.5 rounded-full bg-[#8C5CFF]" />
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="hidden md:inline-flex items-center gap-3">
              <Link href="/#login" className="px-5 py-2.5 rounded-lg font-sans font-semibold text-white text-sm hover:bg-white/[0.05] transition-colors">Login</Link>
              <Link href="/#signup" className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg font-sans font-semibold text-white text-sm shadow-[0_0.25rem_0.75rem_var(--primary-glow)] transition-colors">Sign Up</Link>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen((p) => !p)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              {mobileOpen
                ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed inset-x-0 top-20 bottom-0 z-50 bg-[#09090b]/95 backdrop-blur-2xl border-t border-white/[0.08] overflow-y-auto overscroll-contain transition-all duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none -translate-y-2'}`}
        style={{ height: 'calc(100dvh - 5rem)' }}
        aria-hidden={!mobileOpen}
      >
        <div className="flex flex-col min-h-full p-6 max-w-md mx-auto">
          <nav aria-label="Mobile navigation" className="flex-1">
            <p className="text-xs uppercase tracking-wider text-[var(--muted-dark)] font-semibold mb-3 px-3">Navigation</p>
            <ul className="flex flex-col gap-1.5">
              {NAV_LINKS.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center justify-between px-4 py-3 rounded-xl font-medium text-base text-[var(--muted)] hover:text-white hover:bg-white/[0.05] transition-colors">
                    <span>{item.label}</span>
                    <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/freelancer" onClick={() => setMobileOpen(false)} className="flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-base text-[#8C5CFF] bg-[#8C5CFF]/10 border border-[#8C5CFF]/20">
                  <span>Marketplace</span><span className="size-2 rounded-full bg-[#8C5CFF]" />
                </Link>
              </li>
            </ul>
          </nav>
          <div className="flex flex-col gap-3 pt-6 border-t border-white/[0.08] mt-6">
            <Link href="/#login" onClick={() => setMobileOpen(false)} className="w-full text-center px-5 py-3 rounded-xl font-semibold text-white text-sm border border-white/10 hover:bg-white/[0.05] transition-colors">Login</Link>
            <Link href="/#signup" onClick={() => setMobileOpen(false)} className="w-full text-center px-5 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-xl font-semibold text-white text-sm shadow-[0_0.25rem_0.75rem_var(--primary-glow)] transition-colors">Sign Up</Link>
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative pt-40 pb-24 px-6 sm:px-10 lg:px-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-[#10B981]/08 blur-[120px]" />
          <div className="absolute top-20 left-1/3 w-[500px] h-[300px] rounded-full bg-[#8C5CFF]/12 blur-[80px]" />
        </div>
        <div className="bg-grid-pattern absolute inset-0 opacity-40" />
        <div className="relative max-w-5xl mx-auto text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 mb-8">
              <span className="size-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-sans text-xs font-semibold text-[#10B981] tracking-wide uppercase">Web3 Talent Marketplace</span>
            </div>
          </Reveal>
          <Reveal delay={75}>
            <h1 className="font-outfit font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight mb-6">
              Where elite Canton talent<br />
              <span className="gradient-text-primary">meets trustless work</span>
            </h1>
          </Reveal>
          <Reveal delay={150}>
            <p className="font-sans text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
              CanaFri connects clients with top DAML developers, Canton Network architects, and Web3 specialists. Every engagement is protected by milestone-based CC escrow — zero-trust, zero-surprises.
            </p>
          </Reveal>
          <Reveal delay={225}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/#signup" className="px-8 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-xl font-sans font-semibold text-white text-sm shadow-[0_0.25rem_1rem_var(--primary-glow)] hover:shadow-[0_0.35rem_1.5rem_var(--primary-glow)] transition-all duration-300 hover:-translate-y-0.5">
                Post a Job
              </Link>
              <Link href="/#freelancers" className="px-8 py-3.5 rounded-xl font-sans font-semibold text-sm text-white/80 hover:text-white border border-[#8C5CFF]/40 hover:border-[#8C5CFF] hover:bg-[#8C5CFF]/5 transition-all duration-300">
                Browse Talent
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Stats strip */}
        <Reveal delay={300} className="mt-20 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
            {[
              { value: '500+', label: 'Verified Freelancers' },
              { value: '1,200+', label: 'Jobs Completed' },
              { value: '4.9★', label: 'Average Rating' },
              { value: '5%', label: 'Service Fee' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center py-6 px-4 bg-[#0B0B0B]">
                <p className="font-outfit font-bold text-2xl sm:text-3xl text-white mb-1">{s.value}</p>
                <p className="font-sans text-xs text-[var(--muted)] text-center">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── Job Categories ── */}
      <section className="py-24 px-6 sm:px-10 lg:px-16 bg-[#0B0B0B]">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[#8C5CFF] mb-3">Top Categories</p>
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl text-white mb-4">The most in-demand Canton talent</h2>
            <p className="font-sans text-sm text-[var(--muted)] max-w-xl mx-auto">From DAML smart contract development to technical writing — find exactly the skill you need for your next Canton project.</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat, i) => (
              <Reveal key={cat.label} delay={(i % 3) * 75}>
                <Link href="/#freelancers" className="group glass-card rounded-2xl p-6 flex items-center gap-4 cursor-pointer block">
                  <div className="w-12 h-12 rounded-xl bg-[#8C5CFF]/10 border border-[#8C5CFF]/15 flex items-center justify-center text-2xl shrink-0 group-hover:bg-[#8C5CFF]/20 transition-colors">
                    {cat.icon}
                  </div>
                  <div>
                    <p className="font-outfit font-bold text-sm text-white group-hover:text-[#8C5CFF] transition-colors">{cat.label}</p>
                    <p className="font-sans text-xs text-[var(--muted)] mt-0.5">{cat.count}</p>
                  </div>
                  <svg className="w-4 h-4 text-white/20 group-hover:text-[#8C5CFF] ml-auto shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tabbed How It Works ── */}
      <section className="py-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-12">
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[#8C5CFF] mb-3">How It Works</p>
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl text-white mb-4">One platform, two journeys</h2>
            <p className="font-sans text-sm text-[var(--muted)] max-w-xl mx-auto">Whether you&apos;re hiring or being hired, CanaFri is designed to make every step clear, protected, and on-chain.</p>
          </Reveal>

          {/* Tab selector */}
          <Reveal className="flex justify-center mb-10">
            <div className="inline-flex p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] gap-1">
              {(['freelancer', 'client'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2.5 rounded-lg font-sans font-semibold text-sm transition-all duration-200 cursor-pointer capitalize ${activeTab === tab ? 'bg-[var(--primary)] text-white shadow-[0_0.2rem_0.6rem_var(--primary-glow)]' : 'text-[var(--muted)] hover:text-white'}`}
                >
                  {tab === 'freelancer' ? 'I am a Freelancer' : 'I am a Client'}
                </button>
              ))}
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeSteps.map((step, i) => (
              <Reveal key={`${activeTab}-${step.n}`} delay={(i % 2) * 75}>
                <div className="glass-card rounded-2xl p-7 relative overflow-hidden group h-full">
                  <div className="absolute top-5 right-5 font-outfit font-black text-5xl text-white/[0.04] group-hover:text-white/[0.07] transition-colors select-none leading-none">{step.n}</div>
                  <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center mb-5">
                    <span className="font-outfit font-bold text-sm text-[#10B981]">{step.n}</span>
                  </div>
                  <h3 className="font-outfit font-bold text-lg text-white mb-3">{step.title}</h3>
                  <p className="font-sans text-sm text-[var(--muted)] leading-relaxed">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Signals ── */}
      <section className="py-24 px-6 sm:px-10 lg:px-16 bg-[#0B0B0B]">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[#8C5CFF] mb-3">Why CanaFri</p>
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl text-white mb-4">Built for Web3 professionals</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: 'On-Chain Reputation', body: 'Every review, rating, and completed milestone is recorded on Canton. Your reputation is portable, verifiable, and impossible to fake.', icon: '🏆' },
              { title: 'CC-Denominated Rates', body: 'All payments are in Canton Coin. No FX risk, no bank delays, no cross-border fees. Your rate is what you earn, every time.', icon: '💎' },
              { title: 'Verified Skill Badges', body: 'Pass a community-reviewed skill assessment to earn a verified badge in your Canton or DAML specialty. Badges increase your search visibility by 3x.', icon: '✅' },
              { title: 'Privacy-Preserving', body: 'Client budget, freelancer rate, and contract terms are only visible to the involved parties — not the broader marketplace — thanks to Canton sub-ledgers.', icon: '🔒' },
              { title: 'Automated Protection', body: 'Smart contract auto-approval kicks in if a client goes silent for 7 days. Freelancers are protected by protocol, not platform policy.', icon: '⚡' },
              { title: 'Global Reach, Local Privacy', body: 'CanaFri operates globally but Canton Network ensures your contract details remain private. Work anywhere, keep your business confidential.', icon: '🌍' },
            ].map((feat, i) => (
              <Reveal key={feat.title} delay={(i % 3) * 75}>
                <div className="glass-card rounded-2xl p-6 h-full group">
                  <div className="text-2xl mb-4">{feat.icon}</div>
                  <h3 className="font-outfit font-bold text-base text-white mb-2">{feat.title}</h3>
                  <p className="font-sans text-sm text-[var(--muted)] leading-relaxed">{feat.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-14">
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[#8C5CFF] mb-3">FAQ</p>
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl text-white">Marketplace questions answered</h2>
          </Reveal>
          <div className="flex flex-col gap-3">
            {freelancerFaqs.map((faq, i) => (
              <Reveal key={i} delay={(i % 3) * 75}>
                <div className="glass-card rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer group"
                    aria-expanded={openFaq === i}
                  >
                    <span className="font-sans font-semibold text-sm text-white group-hover:text-[#8C5CFF] transition-colors pr-4">{faq.q}</span>
                    <svg className={`w-4 h-4 text-[#8C5CFF] shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5 border-t border-white/[0.06]">
                      <p className="font-sans text-sm text-[var(--muted)] leading-relaxed pt-4">{faq.a}</p>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-6 sm:px-10 lg:px-16 bg-[#0B0B0B] relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#320053]/20 via-transparent to-[#10B981]/05" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-[#8C5CFF]/08 blur-[100px]" />
        <div className="relative max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-5 leading-tight">
              Ready to work on <span className="gradient-text-primary">the future of finance?</span>
            </h2>
            <p className="font-sans text-sm text-[var(--muted)] mb-10 max-w-xl mx-auto leading-relaxed">
              Join the marketplace purpose-built for Canton Network professionals. Zero-trust escrow, on-chain reputation, and instant CC payments.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/#signup" className="px-8 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-xl font-sans font-semibold text-white text-sm shadow-[0_0.25rem_1rem_var(--primary-glow)] hover:shadow-[0_0.35rem_1.5rem_var(--primary-glow)] transition-all duration-300 hover:-translate-y-0.5">
                Get Started Free
              </Link>
              <Link href="/escrow" className="px-8 py-3.5 rounded-xl font-sans font-semibold text-sm text-white/80 hover:text-white border border-[#8C5CFF]/40 hover:border-[#8C5CFF] hover:bg-[#8C5CFF]/5 transition-all duration-300">
                Learn About Escrow →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="w-full bg-[#09090b] border-t border-white/[0.06] px-6 sm:px-10 lg:px-16 pt-14 pb-8">
        <div className="max-w-[117.25rem] mx-auto flex flex-col gap-12">
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div className="flex flex-col gap-4 max-w-[220px]">
              <Link href="/" aria-label="Canafri home">
                <img src="/app-logo/canafri-logo.svg" alt="Canafri" className="h-8 w-auto object-contain" />
              </Link>
              <p className="font-sans text-[11px] leading-[1.6] text-[#8f9bb3]">
                The decentralized workplace &amp; publishing economy powered by <span className="text-[#8C5CFF] font-semibold">Canton Network</span>.
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <a href="https://t.me/canafri" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="flex items-center justify-center size-7 rounded-full bg-white/[0.06] border border-white/10 text-white/70 hover:text-[#8C5CFF] hover:border-[#8C5CFF]/40 transition-all">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                </a>
                <a href="https://x.com/canafri" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="flex items-center justify-center size-7 rounded-full bg-white/[0.06] border border-white/10 text-white/70 hover:text-[#8C5CFF] hover:border-[#8C5CFF]/40 transition-all">
                  <FooterXIcon />
                </a>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8 md:gap-12">
              <FooterCol title="Explore">
                <li><Link href="/creator" className="flex items-center gap-2 text-[11px] text-[#8f9bb3] hover:text-[#8C5CFF] transition-colors"><span>Content Creator</span></Link></li>
                <li><Link href="/escrow" className="flex items-center gap-2 text-[11px] text-[#8f9bb3] hover:text-[#8C5CFF] transition-colors"><span>Escrow Protection</span></Link></li>
                <li><Link href="/freelancer" className="flex items-center gap-2 text-[11px] text-[#8C5CFF] font-medium"><span>Client &amp; Freelancer</span></Link></li>
              </FooterCol>
              <FooterCol title="Resources">
                <li><Link href="/about" className="flex items-center gap-2 text-[11px] text-[#8f9bb3] hover:text-[#8C5CFF] transition-colors"><span>About Us</span></Link></li>
                <li><Link href="/#articles" className="flex items-center gap-2 text-[11px] text-[#8f9bb3] hover:text-[#8C5CFF] transition-colors"><span>Articles</span></Link></li>
                <li><Link href="/#pricing" className="flex items-center gap-2 text-[11px] text-[#8f9bb3] hover:text-[#8C5CFF] transition-colors"><span>Pricing</span></Link></li>
              </FooterCol>
              <FooterCol title="Legal">
                <li><Link href="/terms" className="flex items-center gap-2 text-[11px] text-[#8f9bb3] hover:text-white transition-colors"><span>Terms of Service</span></Link></li>
                <li><Link href="/privacy" className="flex items-center gap-2 text-[11px] text-[#8f9bb3] hover:text-white transition-colors"><span>Privacy Policy</span></Link></li>
              </FooterCol>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="bg-white/10 h-px w-full" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <p className="font-sans text-[10px] text-[#8f9bb3]">© 2026 Canafri. All rights reserved</p>
              <p className="font-sans text-[10px] text-[#8f9bb3]">Powered by <span className="text-[#8C5CFF] font-semibold">CC</span></p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
