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

const steps = [
  { n: '01', title: 'Client Posts a Job', body: 'A client creates a job posting with clearly defined milestones and deliverables. The total CC payment is specified upfront before any work begins.' },
  { n: '02', title: 'Funds Locked in Escrow', body: 'The full payment amount is locked into a Canton smart contract. Neither client nor freelancer can touch the funds — the contract holds them neutrally until conditions are met.' },
  { n: '03', title: 'Milestone-Based Work', body: 'Work proceeds milestone by milestone. Each deliverable is submitted on-chain. The smart contract tracks completion status with cryptographic certainty.' },
  { n: '04', title: 'Automatic CC Release', body: 'On client approval, the smart contract automatically releases CC to the freelancer\'s wallet. No delays, no banking intermediaries — instant settlement.' },
];

const features = [
  { title: 'Non-Custodial by Design', body: 'CanaFri never holds your funds. The Canton smart contract is the sole custodian — mathematically enforced, not trust-based.' },
  { title: 'Multi-Party Privacy', body: 'Canton Network\'s sub-ledger architecture ensures that escrow details are only visible to the client, freelancer, and protocol — not third parties.' },
  { title: 'Dispute Resolution', body: 'On disagreement, a DAO-elected panel of arbitrators review evidence on-chain. Their ruling is automatically enforced by the smart contract.' },
  { title: 'Zero Unauthorized Clawbacks', body: 'Once CC enters escrow, no party can unilaterally withdraw funds. The contract terms are immutable at the point of agreement.' },
  { title: 'Instant Settlements', body: 'CC settlements occur in sub-seconds on Canton Network. No T+2 banking delays, no SWIFT, no wire transfer fees.' },
  { title: 'Audit Trail', body: 'Every milestone approval, dispute, and payment is recorded on the Canton sub-ledger — providing a tamper-proof audit trail for both parties.' },
];

const escrowFaqs = [
  { q: 'What happens if a freelancer misses a milestone?', a: 'If a freelancer misses a milestone deadline, the client can raise a dispute. The arbitration panel reviews on-chain evidence and can order a partial or full refund from escrow back to the client.' },
  { q: 'What fees does CanaFri charge on escrow?', a: 'CanaFri charges a protocol fee of 2.5% of the total escrow value. This is split between protocol treasury and arbitration reserve. There are no hidden fees — all charges are encoded in the smart contract.' },
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
      <section className="relative pt-40 pb-24 px-6 sm:px-10 lg:px-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-[#38BDF8]/08 blur-[120px]" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[300px] rounded-full bg-[#8C5CFF]/15 blur-[80px]" />
        </div>
        <div className="bg-grid-pattern absolute inset-0 opacity-40" />
        <div className="relative max-w-5xl mx-auto text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/20 mb-8">
              <span className="size-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
              <span className="font-sans text-xs font-semibold text-[#38BDF8] tracking-wide uppercase">Canton Smart Contract Escrow</span>
            </div>
          </Reveal>
          <Reveal delay={75}>
            <h1 className="font-outfit font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight mb-6">
              Zero-trust payment<br />
              <span className="gradient-text-primary">protection on Canton</span>
            </h1>
          </Reveal>
          <Reveal delay={150}>
            <p className="font-sans text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
              Every CanaFri job locks payment in a Canton DAML smart contract before work begins. Funds release only on milestone approval — mathematically guaranteed, not trust-based.
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

        {/* Stats strip */}
        <Reveal delay={300} className="mt-20 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
            {[
              { value: '100%', label: 'Non-Custodial' },
              { value: '2.5%', label: 'Protocol Fee' },
              { value: '72h', label: 'Dispute SLA' },
              { value: '$0', label: 'Bank Transfer Fees' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center py-6 px-4 bg-[#0B0B0B]">
                <p className="font-outfit font-bold text-2xl sm:text-3xl text-white mb-1">{s.value}</p>
                <p className="font-sans text-xs text-[var(--muted)] text-center">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[#8C5CFF] mb-3">How It Works</p>
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl text-white mb-4">Milestone escrow in four steps</h2>
            <p className="font-sans text-sm text-[var(--muted)] max-w-xl mx-auto">Every payment flow is automated by Canton smart contracts. No manual release, no disputes, no surprises.</p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((step, i) => (
              <Reveal key={step.n} delay={(i % 2) * 75}>
                <div className="glass-card rounded-2xl p-7 relative overflow-hidden group h-full">
                  <div className="absolute top-5 right-5 font-outfit font-black text-5xl text-white/[0.04] group-hover:text-white/[0.07] transition-colors select-none leading-none">{step.n}</div>
                  <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center mb-5">
                    <span className="font-outfit font-bold text-sm text-[#38BDF8]">{step.n}</span>
                  </div>
                  <h3 className="font-outfit font-bold text-lg text-white mb-3">{step.title}</h3>
                  <p className="font-sans text-sm text-[var(--muted)] leading-relaxed">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Escrow Visual (flow diagram) ── */}
      <section className="py-24 px-6 sm:px-10 lg:px-16 bg-[#0B0B0B]">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[#8C5CFF] mb-3">Escrow Flow</p>
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl text-white mb-4">Funds always move forward, never backward</h2>
            <p className="font-sans text-sm text-[var(--muted)] max-w-xl mx-auto">The Canton contract is the sole arbiter. Once funds enter escrow, only milestone completion or mutual agreement triggers release.</p>
          </Reveal>

          <Reveal delay={75}>
            <div className="glass-card-interactive rounded-3xl p-8 md:p-12 relative overflow-hidden">
              <div className="pointer-events-none absolute top-0 left-0 w-[400px] h-[250px] rounded-full bg-[#38BDF8]/05 blur-[80px]" />
              {/* Flow nodes */}
              <div className="relative flex flex-col md:flex-row items-center gap-4 md:gap-0">
                {[
                  { label: 'Client', sublabel: 'Posts job + locks CC', icon: 'C', color: '#8C5CFF' },
                  { label: 'Smart Contract', sublabel: 'Holds CC in escrow', icon: '⚡', color: '#38BDF8', center: true },
                  { label: 'Freelancer', sublabel: 'Receives CC on approval', icon: 'F', color: '#10B981' },
                ].map((node, i) => (
                  <React.Fragment key={node.label}>
                    {i > 0 && (
                      <div className="hidden md:flex flex-1 items-center justify-center px-2">
                        <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-white/10 via-[#8C5CFF]/40 relative">
                          <svg className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-3 h-3 text-[#8C5CFF]" fill="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                        </div>
                      </div>
                    )}
                    <div className={`flex flex-col items-center gap-3 ${node.center ? 'md:min-w-[180px]' : 'md:min-w-[140px]'}`}>
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-outfit font-bold text-xl border" style={{ background: `${node.color}15`, borderColor: `${node.color}30`, color: node.color }}>
                        {node.icon}
                      </div>
                      <div className="text-center">
                        <p className="font-outfit font-bold text-sm text-white">{node.label}</p>
                        <p className="font-sans text-xs text-[var(--muted)] mt-0.5">{node.sublabel}</p>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'On Approval', body: 'CC released to freelancer instantly', color: '#10B981' },
                  { label: 'On Dispute', body: 'Arbitration panel resolves within 72h', color: '#F59E0B' },
                  { label: 'On Cancellation', body: 'Mutual consent returns CC to client', color: '#8C5CFF' },
                ].map((outcome) => (
                  <div key={outcome.label} className="flex flex-col gap-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="inline-block w-fit px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: `${outcome.color}20`, color: outcome.color }}>{outcome.label}</span>
                    <p className="font-sans text-xs text-[var(--muted)]">{outcome.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[#8C5CFF] mb-3">Features</p>
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl text-white mb-4">Enterprise-grade escrow primitives</h2>
            <p className="font-sans text-sm text-[var(--muted)] max-w-xl mx-auto">Built on Canton Network&apos;s privacy-preserving sub-ledger architecture, the CanaFri escrow is the most secure freelance payment rail in Web3.</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 75}>
                <div className="glass-card rounded-2xl p-6 h-full group">
                  <div className="w-9 h-9 rounded-lg bg-[#38BDF8]/10 flex items-center justify-center mb-4 group-hover:bg-[#38BDF8]/20 transition-colors">
                    <svg className="w-4 h-4 text-[#38BDF8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  </div>
                  <h3 className="font-outfit font-bold text-base text-white mb-2">{f.title}</h3>
                  <p className="font-sans text-sm text-[var(--muted)] leading-relaxed">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-6 sm:px-10 lg:px-16 bg-[#0B0B0B]">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-14">
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[#8C5CFF] mb-3">FAQ</p>
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl text-white">Escrow questions answered</h2>
          </Reveal>
          <div className="flex flex-col gap-3">
            {escrowFaqs.map((faq, i) => (
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
      <section className="py-24 px-6 sm:px-10 lg:px-16 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#320053]/30 via-transparent to-[#38BDF8]/05" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-[#8C5CFF]/08 blur-[100px]" />
        <div className="relative max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-5 leading-tight">
              Get paid for what you <span className="gradient-text-primary">actually deliver</span>
            </h2>
            <p className="font-sans text-sm text-[var(--muted)] mb-10 max-w-xl mx-auto leading-relaxed">
              Every payment is locked before work starts and released on your terms. CanaFri escrow is the trust layer every freelancer deserves.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/#signup" className="px-8 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-xl font-sans font-semibold text-white text-sm shadow-[0_0.25rem_1rem_var(--primary-glow)] hover:shadow-[0_0.35rem_1.5rem_var(--primary-glow)] transition-all duration-300 hover:-translate-y-0.5">
                Post a Job with Escrow
              </Link>
              <Link href="/freelancer" className="px-8 py-3.5 rounded-xl font-sans font-semibold text-sm text-white/80 hover:text-white border border-[#8C5CFF]/40 hover:border-[#8C5CFF] hover:bg-[#8C5CFF]/5 transition-all duration-300">
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
