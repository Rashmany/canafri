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

const horizontalLines = Array.from({ length: 5 });
const verticalLines = Array.from({ length: 9 });

const steps = [
  {
    n: '01',
    title: 'Client Defines Milestones',
    body: 'The client posts a contract with explicitly defined milestones and deliverables. The total payment amount is funded and committed upfront before any freelancer begins work.',
    img: '/what-we-offer/fig-5.jpg',
    points: [
      'Crystal clear deliverables locked into code',
      'No surprise scope creep during execution',
      'Upfront funding verification on-chain',
    ],
  },
  {
    n: '02',
    title: 'Funds Secured in Escrow',
    body: 'The full payment locks into a Canton smart contract. Neither client nor freelancer can touch or withdraw funds unilaterally. The contract holds custody neutrally until agreed milestones are satisfied.',
    img: '/what-we-offer/fig-6.jpg',
    points: [
      'Non-custodial smart contract vault',
      'Zero unauthorized clawbacks or chargebacks',
      'Mathematical security without bank intermediaries',
    ],
  },
  {
    n: '03',
    title: 'Milestone Execution & Proof',
    body: 'Work advances milestone by milestone. Freelancers submit work directly through the platform with cryptographic timestamps, giving both parties an immutable audit trail.',
    img: '/what-we-offer/fig-7.jpg',
    points: [
      'Cryptographically signed deliverable handoffs',
      'Transparent revision requests and approvals',
      'Complete milestone progress visible in real time',
    ],
  },
  {
    n: '04',
    title: 'Instant Automated Settlement',
    body: 'Once the client signs off on a milestone, the smart contract releases payment directly to the freelancer wallet in seconds. No waiting days for bank clearing or wire transfer fees.',
    img: '/what-we-offer/fig-8.jpg',
    points: [
      'Direct wallet payout with zero settlement delays',
      'Sub-ledger privacy keeps contract terms confidential',
      'Verified reputation score boost recorded on-chain',
    ],
  },
];

const escrowFaqs = [
  { q: 'What happens if a freelancer misses a milestone?', a: 'If a freelancer misses a milestone deadline, the client can raise a dispute. The arbitration panel reviews on-chain evidence and can order a partial or full refund from escrow back to the client.' },
  { q: 'What fees does CanaFri charge on escrow?', a: 'CanaFri charges a protocol fee of 2.5% of the total escrow value. This is split between protocol treasury and arbitration reserve. There are no hidden fees because all charges are encoded in the smart contract.' },
  { q: 'Can milestones be modified after the job starts?', a: 'Milestones can only be modified with mutual consent from both parties. Any modification triggers a new contract state that both client and freelancer must cryptographically sign.' },
  { q: 'What is the minimum escrow amount?', a: 'The minimum escrow amount is 50 CC. There is no maximum. The contract can handle enterprise-scale multi-party agreements worth thousands of CC.' },
  { q: 'How long does arbitration take?', a: 'The arbitration SLA is 72 hours from dispute submission. Arbitrators are required to deliver a ruling within this window or face a penalty on their own staked CC.' },
];

export default function EscrowPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
                  <Link href="/escrow" className="font-sans font-semibold text-[#8C5CFF] text-sm flex items-center gap-1.5">
                    Escrow <span className="size-1.5 rounded-full bg-[#8C5CFF]" />
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
                <Link href="/escrow" onClick={() => setMobileOpen(false)} className="flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-base text-[#8C5CFF] bg-[#8C5CFF]/10 border border-[#8C5CFF]/20">
                  <span>Escrow</span><span className="size-2 rounded-full bg-[#8C5CFF]" />
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
      <section className="relative w-full pt-36 pb-0 sm:pt-44 flex flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-[#8C5CFF]/10 blur-[120px]" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[300px] rounded-full bg-[#320053]/20 blur-[80px]" />
        </div>
        <div className="bg-grid-pattern absolute inset-0 opacity-40" />
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6 sm:px-10 lg:px-16 pb-16 sm:pb-20 w-full">
          <Reveal>
            <h1 className="font-outfit font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight mb-6">
              Zero-trust payment<br />
              <span className="gradient-text-primary">protection on Canton</span>
            </h1>
          </Reveal>
          <Reveal delay={150}>
            <p className="font-sans text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
              Every CanaFri job locks payment in a Canton DAML smart contract before work begins. Funds release only on milestone approval, guaranteed mathematically with zero reliance on trust.
            </p>
          </Reveal>
          <Reveal delay={225}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/#signup" className="px-8 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-xl font-sans font-semibold text-white text-sm shadow-[0_0.25rem_1rem_var(--primary-glow)] hover:shadow-[0_0.35rem_1.5rem_var(--primary-glow)] transition-all duration-300 hover:-translate-y-0.5">
                Post a Job with Escrow
              </Link>
              <Link href="/#freelancers" className="px-8 py-3.5 rounded-xl font-sans font-semibold text-sm text-white/80 hover:text-white border border-[#8C5CFF]/40 hover:border-[#8C5CFF] hover:bg-[#8C5CFF]/5 transition-all duration-300">
                Browse Marketplace
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Key Metrics Strip — exact style from About & Creator page */}
        <div className="w-full border-t border-white/[0.08] mt-16 sm:mt-20">
          <div className="max-w-[117.25rem] mx-auto px-6 sm:px-10 lg:px-16">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.06]">
              <div className="flex flex-col items-center text-center gap-0.5 py-4 sm:py-5">
                <span className="font-outfit text-lg sm:text-xl font-bold text-white">100%</span>
                <span className="font-sans text-[11px] sm:text-xs text-[#8f9bb3]">Non-Custodial</span>
              </div>
              <div className="flex flex-col items-center text-center gap-0.5 py-4 sm:py-5">
                <span className="font-outfit text-lg sm:text-xl font-bold text-[#a78bfa]">2.5%</span>
                <span className="font-sans text-[11px] sm:text-xs text-[#8f9bb3]">Protocol Fee</span>
              </div>
              <div className="flex flex-col items-center text-center gap-0.5 py-4 sm:py-5">
                <span className="font-outfit text-lg sm:text-xl font-bold text-white">72h</span>
                <span className="font-sans text-[11px] sm:text-xs text-[#8f9bb3]">Dispute SLA</span>
              </div>
              <div className="flex flex-col items-center text-center gap-0.5 py-4 sm:py-5">
                <span className="font-outfit text-lg sm:text-xl font-bold text-[#a78bfa]">$0</span>
                <span className="font-sans text-[11px] sm:text-xs text-[#8f9bb3]">Bank Transfer Fees</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-6 sm:px-10 lg:px-16 relative">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16 sm:mb-20">
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4">Milestone escrow in four steps</h2>
            <p className="font-sans text-sm sm:text-base text-[var(--muted)] max-w-xl mx-auto">Every payment flow is automated by Canton smart contracts with no manual release delays and no surprises.</p>
          </Reveal>

          <div className="flex flex-col gap-8 sm:gap-12 lg:gap-14">
            {steps.map((step, i) => {
              const isEven = i % 2 === 0;
              return (
                <Reveal key={step.n} delay={Math.min(i, 3) * 75}>
                  <div className="relative rounded-3xl bg-[#0d0d12]/70 backdrop-blur-xl p-6 sm:p-8 lg:p-10 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(50,0,83,0.25)] group overflow-hidden">
                    {/* Ambient light glow */}
                    <div
                      className={`pointer-events-none absolute w-80 h-80 rounded-full blur-[90px] opacity-15 transition-opacity duration-500 group-hover:opacity-30 ${
                        isEven ? '-top-20 -right-20 bg-[#8C5CFF]' : '-bottom-20 -left-20 bg-[#6366f1]'
                      }`}
                      aria-hidden="true"
                    />

                    <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                      {/* Image column */}
                      <div className={`w-full lg:w-1/2 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                        <div className="relative w-full h-[260px] sm:h-[320px] lg:h-[360px] rounded-2xl overflow-hidden bg-black/50 transition-all duration-500">
                          <img
                            src={step.img}
                            alt={step.title}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/80 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-xs font-outfit font-bold text-white tracking-wider uppercase flex items-center gap-2">
                            <span className="size-2 rounded-full bg-[#8C5CFF]" />
                            Step {step.n}
                          </div>
                        </div>
                      </div>

                      {/* Content column */}
                      <div className={`w-full lg:w-1/2 flex flex-col justify-center ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                        <h3 className="font-outfit font-bold text-2xl sm:text-3xl text-white mb-3.5 leading-snug">
                          {step.title}
                        </h3>
                        <p className="font-sans text-sm sm:text-base text-[var(--muted)] leading-relaxed mb-6">
                          {step.body}
                        </p>
                        <ul className="flex flex-col gap-2.5">
                          {step.points.map((pt) => (
                            <li key={pt} className="flex items-center gap-3 text-xs sm:text-sm text-white/85">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#8C5CFF]/20 text-[#8C5CFF]">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Escrow Visual (3-Step Forward Flow) ── */}
      <section className="py-24 px-6 sm:px-10 lg:px-16 relative">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-3xl bg-[#0d0d12]/70 backdrop-blur-xl p-8 sm:p-12 lg:p-16 overflow-hidden shadow-[0_20px_50px_rgba(50,0,83,0.25)]">
            {/* Ambient glow blobs */}
            <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#8C5CFF]/15 blur-[90px]" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#38BDF8]/10 blur-[90px]" aria-hidden="true" />

            <Reveal className="text-center mb-16 sm:mb-20">
              <h2 className="font-outfit font-bold text-3xl sm:text-4xl lg:text-5xl text-white">
                Funds always move forward, never backward
              </h2>
            </Reveal>

            {/* 3 Steps Timeline Container */}
            <div className="relative">
              {/* Connecting line behind circles on desktop */}
              <div
                className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-[#8C5CFF]/40 via-[#8C5CFF]/20 to-[#8C5CFF]/40 pointer-events-none"
                aria-hidden="true"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 lg:gap-12 relative z-10">
                {[
                  {
                    step: 1,
                    dashOffset: 84, // ~33% progressive arc
                    title: 'Lock CC in Escrow',
                    body: 'The client deposits the full contract budget into a Canton smart contract before work starts, guaranteeing payment availability.',
                  },
                  {
                    step: 2,
                    dashOffset: 42, // ~66% progressive arc
                    title: 'Deliver with Proof',
                    body: 'The freelancer submits completed milestones on-chain. Progress is tracked cryptographically with an immutable audit trail.',
                  },
                  {
                    step: 3,
                    dashOffset: 0, // 100% full circle
                    title: 'Instant Settlement',
                    body: 'On milestone signoff, funds release automatically to the freelancer wallet in seconds with zero banking delays.',
                  },
                ].map((item, idx) => (
                  <Reveal key={item.step} delay={idx * 100} className="flex flex-col items-center text-center">
                    {/* Circle badge with progressive arc */}
                    <div className="relative size-16 flex items-center justify-center mb-6 group">
                      <svg className="size-full -rotate-90" viewBox="0 0 48 48">
                        {/* Background track */}
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          className="stroke-white/10"
                          strokeWidth="3"
                          fill="#09090b"
                        />
                        {/* Accent progress arc */}
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="#8C5CFF"
                          strokeWidth="3.5"
                          fill="none"
                          strokeDasharray="125.6"
                          strokeDashoffset={item.dashOffset}
                          strokeLinecap="round"
                          className="transition-all duration-700 ease-out"
                        />
                      </svg>
                      <span className="absolute font-outfit font-bold text-lg text-white">
                        {item.step}
                      </span>
                    </div>

                    <h3 className="font-outfit font-bold text-lg sm:text-xl text-white mb-3">
                      {item.title}
                    </h3>
                    <p className="font-sans text-sm text-[var(--muted)] leading-relaxed max-w-xs">
                      {item.body}
                    </p>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ (Home & Creator exact style) ── */}
      <section className="relative w-full py-10 sm:py-12 lg:py-16 bg-[#f6f6f8] overflow-hidden scroll-mt-20">
        <div className="mx-auto flex w-full max-w-[117.25rem] flex-col items-center gap-8 px-6 sm:px-10 lg:px-16">
          <Reveal className="w-full flex items-center justify-center">
            <div className="flex w-full items-center justify-center mb-2">
              <h2 className="font-outfit text-3xl sm:text-4xl lg:text-[44px] font-bold leading-tight tracking-[-0.84px] text-[#030303] text-center">
                Escrow questions answered
              </h2>
            </div>
          </Reveal>
          <div className="flex flex-col gap-4 sm:gap-5 w-full">
            {escrowFaqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <Reveal key={i} delay={Math.min(i, 4) * 75} className="w-full">
                  <div className={`relative flex flex-col w-full rounded-2xl transition-all duration-300 border ${isOpen ? 'bg-[#320053] border-[#320053] shadow-[0_8px_24px_rgba(50,0,83,0.25)]' : 'bg-[#f1f1f4] border-transparent hover:border-black/5'}`}>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-6 sm:px-[30px] py-5 text-left cursor-pointer group rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#320053]"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                    >
                      <h3 className={`font-outfit font-bold text-lg sm:text-xl tracking-[0] leading-snug pr-4 transition-colors duration-200 ${isOpen ? 'text-white' : 'text-[#030303] group-hover:text-[#320053]'}`}>
                        {faq.q}
                      </h3>
                      <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${isOpen ? 'bg-white/20 text-white' : 'bg-black/[0.04] text-[#5d5d7f] group-hover:bg-[#320053]/10 group-hover:text-[#320053]'}`}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="transition-transform duration-300 ease-out" style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                          <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                    </button>
                    <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <div className="px-6 sm:px-[30px] pb-6 pt-1">
                          <p className={`font-sans font-normal text-sm sm:text-base leading-[24px] transition-colors duration-200 ${isOpen ? 'text-white/95' : 'text-[#5d5d7f]'}`}>
                            {faq.a}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Banner (Exact Testimonials Dark Gradient Style) ── */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden bg-[linear-gradient(180deg,rgba(50,0,83,1)_0%,rgba(0,5,24,1)_100%)] py-20 sm:py-24 lg:py-28 px-6 sm:px-10 lg:px-16">
        {/* Glow blobs */}
        <div className="absolute left-[200px] top-[-100px] h-[400px] w-[400px] rounded-[200px] bg-[#8080d715] blur-[75px]" aria-hidden="true" />
        <div className="absolute left-[840px] top-[50px] h-[400px] w-[500px] rounded-[250px/200px] bg-[#aad9d910] blur-[90px]" aria-hidden="true" />
        {/* Horizontal lines */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 flex h-80 w-[1440px] max-w-full flex-col items-start justify-between pointer-events-none opacity-40" aria-hidden="true">
          {horizontalLines.map((_, index) => (
            <div key={`hl-${index}`} className="relative h-px w-full self-stretch bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          ))}
        </div>
        {/* Vertical lines */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 flex h-80 w-[1440px] max-w-full items-start justify-between pointer-events-none opacity-40" aria-hidden="true">
          {verticalLines.map((_, index) => (
            <div key={`vl-${index}`} className={`relative h-80 w-px bg-gradient-to-b from-white/15 via-white/5 to-transparent ${index === verticalLines.length - 1 ? 'mr-[-1.00px]' : ''}`} />
          ))}
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-5 leading-tight">
              Get paid for what you <span className="gradient-text-primary">actually deliver</span>
            </h2>
            <p className="font-sans text-sm text-[#a1b5d8] mb-10 max-w-xl mx-auto leading-relaxed">
              Every payment is locked securely before work starts and released on your terms. CanaFri escrow is the trustless foundation every modern freelancer and client deserves.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/#signup" className="px-8 py-3.5 bg-white hover:bg-[#f6f0ff] active:scale-[0.98] rounded-xl font-sans font-semibold text-[#320053] text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                Post a Job with Escrow
              </Link>
              <Link href="/freelancer" className="px-8 py-3.5 rounded-xl font-sans font-semibold text-sm text-white border border-[#8C5CFF] hover:bg-[#8C5CFF]/20 transition-all duration-300 hover:-translate-y-0.5">
                Find Freelancers →
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
                <li><Link href="/escrow" className="flex items-center gap-2 text-[11px] text-[#8C5CFF] font-medium"><span>Escrow Protection</span></Link></li>
                <li><Link href="/freelancer" className="flex items-center gap-2 text-[11px] text-[#8f9bb3] hover:text-[#8C5CFF] transition-colors"><span>Client &amp; Freelancer</span></Link></li>
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
