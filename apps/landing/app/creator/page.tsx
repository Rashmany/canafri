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
    title: 'Stake to Publish',
    body: 'Lock 300 CC to verify your commitment and unlock global publishing privileges. Your deposit stays in your personal vault under your sole control, earning passive baseline yield while proving real dedication to quality.',
    img: '/what-we-offer/fig-1.jpg',
    points: [
      'Full custody retained in your personal stake vault',
      'Immediate verified author status across the ecosystem',
      'Earn passive baseline yield from day one',
    ],
  },
  {
    n: '02',
    title: 'Publish In-Depth Knowledge',
    body: 'Share deep architectural breakdowns, DAML smart contracts, or field-tested Web3 guides. Content is peer reviewed by fellow verified creators, giving your work authentic validation and permanent on-chain provenance without algorithmic suppression.',
    img: '/what-we-offer/fig-2.jpg',
    points: [
      'Native support for code snippets, markdown, and formulas',
      'Community peer consensus instead of editorial bias',
      'Permanent intellectual property rights recorded on-chain',
    ],
  },
  {
    n: '03',
    title: 'Readers Stake to Access',
    body: 'Paywalls frustrate readers and kill distribution. On CanaFri, your audience never spends a single coin to read your work. They deposit Canton Coin into your creator pool, generating returns for both of you while they absorb your insights.',
    img: '/what-we-offer/fig-3.jpg',
    points: [
      'No paywalls or monthly subscription fatigue for readers',
      'Readers keep their principal while generating rewards',
      'Mutual alignment where quality directly attracts liquidity',
    ],
  },
  {
    n: '04',
    title: 'Earn Continuous CC Rewards',
    body: 'Forget waiting thirty or sixty days for platform payouts or losing huge cuts to intermediaries. Reader pool yield streams directly into your wallet in real time, turning your evergreen library into compounding digital assets.',
    img: '/what-we-offer/fig-4.jpg',
    points: [
      'Direct real-time reward streaming into your wallet',
      'Sub-ledger privacy protects your financial activity',
      'Evergreen articles compound royalties indefinitely',
    ],
  },
];

const faqs = [
  { q: 'How much CC do I need to become a creator?', a: 'You need to stake a minimum of 300 CC to unlock creator publishing rights. This stake is not spent. It is securely locked and continues earning you yield while you are an active creator.' },
  { q: 'Can I withdraw my staked CC?', a: 'Yes. You can un-stake at any time. However, un-staking will suspend your creator badge and publishing rights until you re-stake. A 7-day cool-down period applies to withdrawals.' },
  { q: 'How does content quality enforcement work?', a: 'Published content goes through a community peer-review process where existing verified creators vote on quality. The smart contract only confirms publication once a threshold of positive votes is reached.' },
  { q: 'Do readers pay a recurring subscription?', a: 'No subscriptions. Readers stake CC into your specific creator pool. They can un-stake anytime, taking their principal plus earned yield. You keep a percentage of the yield generated while they are staked.' },
  { q: 'What types of content are supported?', a: 'CanaFri specialises in technical content around Canton Network, DAML smart contracts, and blockchain economics. Long-form guides, video transcripts, and advisory posts are all supported.' },
];

export default function CreatorPage() {
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
                  <Link href="/creator" className="font-sans font-semibold text-[#8C5CFF] text-sm flex items-center gap-1.5">
                    Creator <span className="size-1.5 rounded-full bg-[#8C5CFF]" />
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
                <Link href="/creator" onClick={() => setMobileOpen(false)} className="flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-base text-[#8C5CFF] bg-[#8C5CFF]/10 border border-[#8C5CFF]/20">
                  <span>Creator</span><span className="size-2 rounded-full bg-[#8C5CFF]" />
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
          <div className="absolute top-20 left-1/4 w-[400px] h-[300px] rounded-full bg-[#320053]/20 blur-[80px]" />
        </div>
        <div className="bg-grid-pattern absolute inset-0 opacity-40" />
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6 sm:px-10 lg:px-16 pb-16 sm:pb-20 w-full">
          <Reveal>
            <h1 className="font-outfit font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight mb-6">
              Publish &amp; Earn with{' '}
              <span className="gradient-text-primary">Canton Coin</span>
            </h1>
          </Reveal>
          <Reveal delay={150}>
            <p className="font-sans text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
              CanaFri&apos;s Read-to-Earn protocol lets technical writers and Canton Network experts monetize their knowledge without paywalls. Stake once, earn continuously with quality enforced at the protocol level.
            </p>
          </Reveal>
          <Reveal delay={225}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/#signup" className="px-8 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-xl font-sans font-semibold text-white text-sm shadow-[0_0.25rem_1rem_var(--primary-glow)] hover:shadow-[0_0.35rem_1.5rem_var(--primary-glow)] transition-all duration-300 hover:-translate-y-0.5">
                Start Publishing &amp; Earn
              </Link>
              <Link href="/#articles" className="px-8 py-3.5 rounded-xl font-sans font-semibold text-sm text-white/80 hover:text-white border border-[#8C5CFF]/40 hover:border-[#8C5CFF] hover:bg-[#8C5CFF]/5 transition-all duration-300">
                Browse Articles
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Key Metrics Strip — exact style from About page */}
        <div className="w-full border-t border-white/[0.08] mt-16 sm:mt-20">
          <div className="max-w-[117.25rem] mx-auto px-6 sm:px-10 lg:px-16">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.06]">
              <div className="flex flex-col items-center text-center gap-0.5 py-4 sm:py-5">
                <span className="font-outfit text-lg sm:text-xl font-bold text-white">300 CC</span>
                <span className="font-sans text-[11px] sm:text-xs text-[#8f9bb3]">Minimum Stake</span>
              </div>
              <div className="flex flex-col items-center text-center gap-0.5 py-4 sm:py-5">
                <span className="font-outfit text-lg sm:text-xl font-bold text-[#a78bfa]">∞</span>
                <span className="font-sans text-[11px] sm:text-xs text-[#8f9bb3]">Earning Potential</span>
              </div>
              <div className="flex flex-col items-center text-center gap-0.5 py-4 sm:py-5">
                <span className="font-outfit text-lg sm:text-xl font-bold text-white">100%</span>
                <span className="font-sans text-[11px] sm:text-xs text-[#8f9bb3]">Non-Custodial</span>
              </div>
              <div className="flex flex-col items-center text-center gap-0.5 py-4 sm:py-5">
                <span className="font-outfit text-lg sm:text-xl font-bold text-[#a78bfa]">Real-time</span>
                <span className="font-sans text-[11px] sm:text-xs text-[#8f9bb3]">CC Settlements</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-6 sm:px-10 lg:px-16 relative">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16 sm:mb-20">
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4">Four steps to your first CC earnings</h2>
            <p className="font-sans text-sm sm:text-base text-[var(--muted)] max-w-xl mx-auto">The entire creator journey from initial commitment to daily earnings is handled by Canton smart contracts with zero middlemen.</p>
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

      {/* ── Tokenomics ── */}
      <section className="py-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card-interactive rounded-3xl p-10 md:p-14 relative overflow-hidden">
            <div className="pointer-events-none absolute top-0 right-0 w-[500px] h-[300px] rounded-full bg-[#8C5CFF]/10 blur-[80px]" />
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <Reveal>
                <h2 className="font-outfit font-bold text-3xl sm:text-4xl text-white mb-5 leading-tight">
                  Stake once.<br />Earn forever.
                </h2>
                <p className="font-sans text-sm text-[var(--muted)] mb-8 leading-relaxed max-w-md">
                  Your 300 CC creator stake never sits idle. It actively participates in reader pool economics, earning baseline yield while your published content generates continuous CC rewards from active reader pools.
                </p>
                <Link
                  href="/#signup"
                  className="inline-flex px-7 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-xl font-sans font-semibold text-white text-sm shadow-[0_0.25rem_1rem_var(--primary-glow)] hover:shadow-[0_0.35rem_1.5rem_var(--primary-glow)] transition-all duration-300 hover:-translate-y-0.5"
                >
                  Become a Creator
                </Link>
              </Reveal>
              <Reveal delay={150}>
                <div className="flex flex-col gap-5">
                  {[
                    { label: 'Author Reward Share', pct: 70, color: '#8C5CFF' },
                    { label: 'Reader Staking Return', pct: 20, color: '#A78BFA' },
                    { label: 'Governance & Network Reserve', pct: 10, color: '#38BDF8' },
                  ].map((bar) => (
                    <div key={bar.label}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-sans text-xs text-[var(--muted)]">{bar.label}</span>
                        <span className="font-outfit font-bold text-xs text-white">{bar.pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${bar.pct}%`,
                            background: `linear-gradient(90deg, ${bar.color}88, ${bar.color})`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="font-sans text-[11px] text-[var(--muted-dark)] mt-1">
                    * 100% automated on-chain distribution executed by Canton smart contracts.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative w-full py-10 sm:py-12 lg:py-16 bg-[#f6f6f8] overflow-hidden scroll-mt-20">
        <div className="mx-auto flex w-full max-w-[117.25rem] flex-col items-center gap-8 px-6 sm:px-10 lg:px-16">
          <Reveal className="w-full flex items-center justify-center">
            <div className="flex w-full items-center justify-center mb-2">
              <h2 className="font-outfit text-3xl sm:text-4xl lg:text-[44px] font-bold leading-tight tracking-[-0.84px] text-[#030303] text-center">
                Creator questions answered
              </h2>
            </div>
          </Reveal>
          <div className="flex flex-col gap-4 sm:gap-5 w-full">
            {faqs.map((faq, i) => {
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

      {/* ── CTA Banner ── */}
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
              Turn your expertise into <span className="gradient-text-primary">passive CC income</span>
            </h2>
            <p className="font-sans text-sm text-[#a1b5d8] mb-10 max-w-xl mx-auto leading-relaxed">
              Join Canton Network experts already earning Canton Coin from their technical content. Your stake earns while you sleep.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/#signup" className="px-8 py-3.5 bg-white hover:bg-[#f6f0ff] active:scale-[0.98] rounded-xl font-sans font-semibold text-[#320053] text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                Start Publishing &amp; Earn
              </Link>
              <Link href="/escrow" className="px-8 py-3.5 rounded-xl font-sans font-semibold text-sm text-white border border-[#8C5CFF] hover:bg-[#8C5CFF]/20 transition-all duration-300 hover:-translate-y-0.5">
                Explore Escrow Protection →
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
                <li><Link href="/creator" className="flex items-center gap-2 text-[11px] text-[#8C5CFF] font-medium"><span>Content Creator</span></Link></li>
                <li><Link href="/escrow" className="flex items-center gap-2 text-[11px] text-[#8f9bb3] hover:text-[#8C5CFF] transition-colors"><span>Escrow Protection</span></Link></li>
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
