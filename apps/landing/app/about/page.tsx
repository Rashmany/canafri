'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

/* ─── useInView hook ───────────────────────────────────────────── */
function useInView(options: IntersectionObserverInit = {}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const cb: IntersectionObserverCallback = useCallback(([entry]) => {
    if (entry.isIntersecting) {
      setIsVisible(true);
    }
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

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  fade?: boolean;
}

function Reveal({ children, className = '', delay = 0, fade = false }: RevealProps) {
  const { ref, isVisible } = useInView();
  const base = fade ? 'reveal-fade' : 'reveal';
  const delayClass = [0, 75, 150, 225, 300, 375].includes(delay) ? `delay-${delay}` : '';
  const inlineStyle = delay && !delayClass ? { animationDelay: `${delay}ms` } : undefined;
  return (
    <div
      ref={ref}
      style={inlineStyle}
      className={`${base} ${delayClass}${isVisible ? ' is-visible' : ''}${className ? ' ' + className : ''}`}
    >
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

function FooterNavLink({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 text-[11px] text-[#8f9bb3] hover:text-[#8C5CFF] transition-colors duration-200 text-left w-full cursor-pointer"
      >
        <span className="opacity-70 shrink-0">{icon}</span>
        <span>{label}</span>
      </button>
    </li>
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

export default function AboutPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'mission' | 'canton' | 'future'>('mission');
  const [modelTab, setModelTab] = useState<'traditional' | 'canafri'>('traditional');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleAction = (action: string) => {
    window.location.href = action === 'Login' ? '/#login' : '/#signup';
  };

  return (
    <main className="flex flex-col min-h-screen w-full bg-[#09090b] text-white relative overflow-x-hidden">
      {/* ── Fixed Navigation Header ── */}
      <header className="fixed top-0 inset-x-0 z-50 w-full bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.08] transition-all duration-300">
        <div className="flex h-20 items-center justify-between px-6 sm:px-10 lg:px-16 relative w-full max-w-[117.25rem] mx-auto">
          <div className="gap-8 lg:gap-12 inline-flex items-center relative flex-[0_0_auto]">
            <Link href="/" aria-label="Canafri home" className="inline-flex items-center relative flex-[0_0_auto]">
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
                <li>
                  <Link
                    href="/#what-we-offer"
                    className="relative w-fit font-sans font-medium text-[var(--muted)] text-sm transition-colors hover:text-white"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#articles"
                    className="relative w-fit font-sans font-medium text-[var(--muted)] text-sm transition-colors hover:text-white"
                  >
                    Articles
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#how-it-works"
                    className="relative w-fit font-sans font-medium text-[var(--muted)] text-sm transition-colors hover:text-white"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#freelancers"
                    className="relative w-fit font-sans font-medium text-[var(--muted)] text-sm transition-colors hover:text-white"
                  >
                    Find Talent
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#pricing"
                    className="relative w-fit font-sans font-medium text-[var(--muted)] text-sm transition-colors hover:text-white"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#faq"
                    className="relative w-fit font-sans font-medium text-[var(--muted)] text-sm transition-colors hover:text-white"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="relative w-fit font-sans font-semibold text-[#8C5CFF] text-sm transition-colors flex items-center gap-1.5"
                  >
                    <span>About</span>
                    <span className="size-1.5 rounded-full bg-[#8C5CFF]" />
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Right Header: Actions */}
          <div className="flex items-center gap-2.5 sm:gap-4 relative flex-[0_0_auto]">
            <div className="hidden md:inline-flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => handleAction('Login')}
                className="px-4 sm:px-5 py-2.5 rounded-lg font-sans font-semibold text-white text-sm hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleAction('Sign Up')}
                className="px-4 sm:px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg font-sans font-semibold text-white text-sm shadow-[0_0.25rem_0.75rem_var(--primary-glow)] transition-colors cursor-pointer"
              >
                Sign Up
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
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

      {/* Mobile Navigation Drawer Overlay & Dropdown Menu (placed outside header to escape backdrop-filter containing block) */}
      <div
        className={`md:hidden fixed inset-x-0 top-20 bottom-0 z-50 bg-[#09090b]/95 backdrop-blur-2xl transition-all duration-300 ease-out border-t border-white/[0.08] overflow-y-auto overscroll-contain ${
          isMobileMenuOpen
            ? 'opacity-100 pointer-events-auto translate-y-0'
            : 'opacity-0 pointer-events-none -translate-y-2'
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
              <li>
                <Link
                  href="/#what-we-offer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl font-sans font-medium text-base text-[var(--muted)] hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <span>Features</span>
                  <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
              <li>
                <Link
                  href="/#articles"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl font-sans font-medium text-base text-[var(--muted)] hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <span>Articles</span>
                  <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
              <li>
                <Link
                  href="/#how-it-works"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl font-sans font-medium text-base text-[var(--muted)] hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <span>How It Works</span>
                  <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
              <li>
                <Link
                  href="/#freelancers"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl font-sans font-medium text-base text-[var(--muted)] hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <span>Find Talent</span>
                  <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
              <li>
                <Link
                  href="/#pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl font-sans font-medium text-base text-[var(--muted)] hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <span>Pricing</span>
                  <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
              <li>
                <Link
                  href="/#faq"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl font-sans font-medium text-base text-[var(--muted)] hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <span>FAQ</span>
                  <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl font-sans font-semibold text-base text-[#8C5CFF] bg-[#8C5CFF]/10 border border-[#8C5CFF]/20 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    About Us
                    <span className="size-1.5 rounded-full bg-[#8C5CFF]" />
                  </span>
                  <svg className="w-4 h-4 text-[#8C5CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
              <li>
                <Link
                  href="/#faq"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl font-sans font-medium text-base text-[var(--muted)] hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <span>FAQ</span>
                  <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex flex-col gap-3 pt-6 border-t border-white/10 mt-6 pb-8">
            <button
              type="button"
              onClick={() => {
                handleAction('Login');
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-3.5 px-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.04] font-sans font-semibold text-white text-base text-center transition-colors cursor-pointer active:bg-white/[0.08]"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                handleAction('Sign Up');
                setIsMobileMenuOpen(false);
              }}
              className="all-unset box-border w-full py-3.5 px-4 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_0.25rem_1rem_var(--primary-glow)] font-sans font-semibold text-white text-base text-center transition-colors cursor-pointer active:opacity-90"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: HERO ── */}
      <section className="relative w-full min-h-[88vh] sm:min-h-[92vh] pt-36 pb-0 sm:pt-44 flex flex-col overflow-hidden [background:radial-gradient(60%_60%_at_50%_35%,rgba(50,0,83,0.55)_0%,rgba(9,9,11,1)_100%)]">
        {/* Ambient Top Glow */}
        <div
          className="absolute top-10 left-1/2 -translate-x-1/2 w-[48rem] h-[26rem] bg-[#8C5CFF] rounded-full blur-[140px] opacity-25 pointer-events-none"
          aria-hidden="true"
        />

        {/* Hero Text — centered freely on the gradient background */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 sm:px-10 lg:px-16 pb-28 sm:pb-32">
          <Reveal className="flex flex-col items-center text-center w-full max-w-[900px] mx-auto">
            <h1 className="font-outfit text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] text-white mx-auto text-center">
              About Us
            </h1>
            <p className="mt-6 max-w-[680px] mx-auto text-center text-base sm:text-lg text-[#a1b5d8] leading-relaxed font-sans">
              CanaFri was born to eliminate middlemen, high platform fees, and payment delays. We unite top talent and verified creators through non-custodial milestone escrow and direct token settlements.
            </p>
          </Reveal>
        </div>

        {/* Key Metrics Strip — pinned flush to the very bottom of hero, transparent with only border lines */}
        <div className="absolute bottom-0 inset-x-0 z-20 w-full border-t border-white/[0.08]">
          <div className="max-w-[117.25rem] mx-auto px-6 sm:px-10 lg:px-16">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.06]">
              <div className="flex flex-col items-center text-center gap-0.5 py-4 sm:py-5">
                <span className="font-outfit text-lg sm:text-xl font-bold text-white">0%</span>
                <span className="font-sans text-[11px] sm:text-xs text-[#8f9bb3]">Arbitrary Escrow Holds</span>
              </div>
              <div className="flex flex-col items-center text-center gap-0.5 py-4 sm:py-5">
                <span className="font-outfit text-lg sm:text-xl font-bold text-[#a78bfa]">Instant</span>
                <span className="font-sans text-[11px] sm:text-xs text-[#8f9bb3]">Milestone Payouts</span>
              </div>
              <div className="flex flex-col items-center text-center gap-0.5 py-4 sm:py-5">
                <span className="font-outfit text-lg sm:text-xl font-bold text-white">100%</span>
                <span className="font-sans text-[11px] sm:text-xs text-[#8f9bb3]">Creator Content Ownership</span>
              </div>
              <div className="flex flex-col items-center text-center gap-0.5 py-4 sm:py-5">
                <span className="font-outfit text-lg sm:text-xl font-bold text-[#a78bfa]">Canton</span>
                <span className="font-sans text-[11px] sm:text-xs text-[#8f9bb3]">Institutional Privacy</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: THE PROBLEM VS THE CANAFRI SOLUTION ── */}
      <section className="relative w-full py-10 sm:py-12 lg:py-16 bg-[#fdfdfd]">
        <div className="max-w-[117.25rem] mx-auto px-6 sm:px-10 lg:px-16 flex flex-col items-center">
          <Reveal>
            <div className="flex flex-col items-center gap-3 text-center mb-8 sm:mb-10">
              <h2 className="font-outfit text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0f0a1e]">
                Why the traditional model is broken
              </h2>
            </div>
          </Reveal>

          {/* Interactive Comparison Tabs */}
          <div className="w-full max-w-[760px] flex flex-col items-center gap-6">
            <div className="flex p-1.5 rounded-full bg-black/[0.04] border border-black/5">
              <button
                type="button"
                onClick={() => setModelTab('traditional')}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  modelTab === 'traditional'
                    ? 'bg-[#320053] text-white shadow-sm'
                    : 'text-[#5c5a72] hover:text-[#0f0a1e]'
                }`}
              >
                Traditional Platforms
              </button>
              <button
                type="button"
                onClick={() => setModelTab('canafri')}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  modelTab === 'canafri'
                    ? 'bg-[#320053] text-white shadow-sm'
                    : 'text-[#5c5a72] hover:text-[#0f0a1e]'
                }`}
              >
                The CanaFri Standard
              </button>
            </div>

            <div className="w-full p-7 sm:p-9 rounded-3xl bg-[#f5f6fa]/80 border border-black/5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-5">
              {modelTab === 'traditional' && (
                <>
                  <h3 className="font-outfit text-xl sm:text-2xl font-bold text-[#0f0a1e] text-center">
                    High fees, payment delays, zero privacy
                  </h3>
                  <ul className="flex flex-col gap-3.5 text-sm sm:text-base text-[#5c5a72] font-sans max-w-[560px] mx-auto w-full pt-2">
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
                      <span>20%+ commission cuts taken from every completed milestone</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
                      <span>14-day mandatory payment clearance holds and bank wire fees</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
                      <span>Arbitrary account suspensions with frozen balance risks</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
                      <span>Paywalled platforms keep your subscribers and reader relations</span>
                    </li>
                  </ul>
                </>
              )}
              {modelTab === 'canafri' && (
                <>
                  <h3 className="font-outfit text-xl sm:text-2xl font-bold text-[#0f0a1e] text-center">
                    Decentralized, non-custodial, direct
                  </h3>
                  <ul className="flex flex-col gap-3.5 text-sm sm:text-base text-[#5c5a72] font-sans max-w-[560px] mx-auto w-full pt-2">
                    <li className="flex items-start gap-3">
                      <span className="text-[#7c3aed] font-bold shrink-0 mt-0.5">✓</span>
                      <span>Direct peer-to-peer contracts with zero unfair commission cuts</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#7c3aed] font-bold shrink-0 mt-0.5">✓</span>
                      <span>Funds locked in smart contract escrow; released instantly on approval</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#7c3aed] font-bold shrink-0 mt-0.5">✓</span>
                      <span>Non-custodial: only you hold the keys to your Canton wallet</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#7c3aed] font-bold shrink-0 mt-0.5">✓</span>
                      <span>Read to Earn publishing where you own your subscribers and content</span>
                    </li>
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: THREE FOUNDATIONAL PILLARS ── */}
      <section className="relative w-full py-10 sm:py-12 lg:py-16 overflow-hidden bg-[linear-gradient(180deg,rgba(50,0,83,1)_0%,rgba(0,5,24,1)_100%)]">
        {/* Ambient Glows */}
        <div
          className="absolute left-[200px] top-[-100px] h-[400px] w-[400px] rounded-[200px] bg-[#8080d715] blur-[75px] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute left-[840px] top-[50px] h-[400px] w-[500px] rounded-[250px/200px] bg-[#aad9d910] blur-[90px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Background Grid Lines */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 flex h-full w-[1440px] max-w-full flex-col items-start justify-between pointer-events-none opacity-30"
          aria-hidden="true"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`pillars-h-line-${index}`}
              className="relative h-px w-full self-stretch bg-gradient-to-r from-transparent via-white/15 to-transparent"
            />
          ))}
        </div>
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 flex h-full w-[1440px] max-w-full items-start justify-between pointer-events-none opacity-30"
          aria-hidden="true"
        >
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={`pillars-v-line-${index}`}
              className={`relative h-full w-px bg-gradient-to-b from-white/15 via-white/5 to-transparent ${
                index === 11 ? "mr-[-1.00px]" : ""
              }`}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-[117.25rem] mx-auto px-6 sm:px-10 lg:px-16">
          <Reveal>
            <div className="flex flex-col items-center gap-3 text-center mb-8 sm:mb-10">
              <h2 className="font-outfit text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Our Three Foundational Pillars
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-[1100px] mx-auto">
            {/* Pillar 1 */}
            <Reveal delay={50}>
              <article className="flex flex-col h-full justify-between p-6 sm:p-7 rounded-2xl bg-white/[0.05] shadow-[0_8px_28px_rgba(0,0,0,0.14)] backdrop-blur-md hover:bg-white/[0.08] hover:shadow-[0_18px_40px_rgba(128,128,215,0.18)] hover:-translate-y-1.5 transition-all duration-300">
                <div className="flex flex-col gap-4">
                  <div className="size-12 rounded-xl bg-[#8C5CFF]/15 flex items-center justify-center text-[#8C5CFF]">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-outfit text-xl font-bold text-white">
                    Escrow Protection
                  </h3>
                  <p className="font-sans text-sm text-[#8f9bb3] leading-relaxed">
                    Client funds are locked safely before work starts. Once you deliver and the milestone is approved, payment releases straight to your wallet with zero hold times.
                  </p>
                </div>
              </article>
            </Reveal>

            {/* Pillar 2 */}
            <Reveal delay={100}>
              <article className="flex flex-col h-full justify-between p-6 sm:p-7 rounded-2xl bg-white/[0.05] shadow-[0_8px_28px_rgba(0,0,0,0.14)] backdrop-blur-md hover:bg-white/[0.08] hover:shadow-[0_18px_40px_rgba(128,128,215,0.18)] hover:-translate-y-1.5 transition-all duration-300">
                <div className="flex flex-col gap-4">
                  <div className="size-12 rounded-xl bg-[#8C5CFF]/15 flex items-center justify-center text-[#8C5CFF]">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="font-outfit text-xl font-bold text-white">
                    Reader Funded Publishing
                  </h3>
                  <p className="font-sans text-sm text-[#8f9bb3] leading-relaxed">
                    Publish directly to your readers without middleman cuts or intrusive ads. Subscribers support your work directly with Canton Coin, so you keep what you create.
                  </p>
                </div>
              </article>
            </Reveal>

            {/* Pillar 3 */}
            <Reveal delay={150}>
              <article className="flex flex-col h-full justify-between p-6 sm:p-7 rounded-2xl bg-white/[0.05] shadow-[0_8px_28px_rgba(0,0,0,0.14)] backdrop-blur-md hover:bg-white/[0.08] hover:shadow-[0_18px_40px_rgba(128,128,215,0.18)] hover:-translate-y-1.5 transition-all duration-300">
                <div className="flex flex-col gap-4">
                  <div className="size-12 rounded-xl bg-[#8C5CFF]/15 flex items-center justify-center text-[#8C5CFF]">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="font-outfit text-xl font-bold text-white">
                    Complete Privacy
                  </h3>
                  <p className="font-sans text-sm text-[#8f9bb3] leading-relaxed">
                    Your contracts, communication, and invoices stay strictly between you and your client. No public block explorer can view your project scope or payment amounts.
                  </p>
                </div>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: WHY CANTON NETWORK ── */}
      <section className="relative w-full py-10 sm:py-12 lg:py-16 bg-[#fdfdfd] border-t border-black/5">
        <div className="max-w-[117.25rem] mx-auto px-6 sm:px-10 lg:px-16 flex flex-col items-center">
          <Reveal>
            <div className="flex flex-col items-center gap-3 text-center max-w-[700px] mb-8 sm:mb-10">
              <h2 className="font-outfit text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0f0a1e]">
                Why We Built on Canton Network
              </h2>
            </div>
          </Reveal>

          {/* Interactive Feature Tabs */}
          <div className="w-full max-w-[900px] flex flex-col items-center gap-6">
            <div className="flex p-1.5 rounded-full bg-black/[0.04] border border-black/5">
              <button
                type="button"
                onClick={() => setActiveTab('mission')}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'mission'
                    ? 'bg-[#320053] text-white shadow-sm'
                    : 'text-[#5c5a72] hover:text-[#0f0a1e]'
                }`}
              >
                Privacy By Design
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('canton')}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'canton'
                    ? 'bg-[#320053] text-white shadow-sm'
                    : 'text-[#5c5a72] hover:text-[#0f0a1e]'
                }`}
              >
                Sub-Second Finality
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('future')}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'future'
                    ? 'bg-[#320053] text-white shadow-sm'
                    : 'text-[#5c5a72] hover:text-[#0f0a1e]'
                }`}
              >
                Zero Gas Spikes
              </button>
            </div>

            <div className="w-full p-8 rounded-3xl bg-[#f5f6fa]/80 border border-black/5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center flex flex-col items-center gap-4">
              {activeTab === 'mission' && (
                <>
                  <h4 className="font-outfit text-2xl font-bold text-[#0f0a1e]">Confidential Multi-Party Workflows</h4>
                  <p className="max-w-[650px] text-sm sm:text-base text-[#5c5a72] leading-relaxed font-sans">
                    Canton ensures that only transacting participants see contract payloads. Your client contracts, NDA-protected work, and rate negotiations are cryptographically shielded from public scrutiny.
                  </p>
                </>
              )}
              {activeTab === 'canton' && (
                <>
                  <h4 className="font-outfit text-2xl font-bold text-[#0f0a1e]">Instant Milestone Execution</h4>
                  <p className="max-w-[650px] text-sm sm:text-base text-[#5c5a72] leading-relaxed font-sans">
                    Traditional banks delay payments for days. Canton Network transactions settle in sub-seconds across independent nodes, so you can withdraw earnings to your wallet the exact second work is approved.
                  </p>
                </>
              )}
              {activeTab === 'future' && (
                <>
                  <h4 className="font-outfit text-2xl font-bold text-[#0f0a1e]">Predictable Tokenomics</h4>
                  <p className="max-w-[650px] text-sm sm:text-base text-[#5c5a72] leading-relaxed font-sans">
                    Never worry about Ethereum-style $50 gas spikes destroying your micro-earnings. CanaFri utilizes Canton Coin (CC) for seamless, frictionless accounting and staking rewards.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: FINAL CTA ── */}
      <section className="relative w-full py-10 sm:py-12 lg:py-16 overflow-hidden bg-[linear-gradient(180deg,rgba(50,0,83,1)_0%,rgba(0,5,24,1)_100%)]">
        {/* Ambient Glows */}
        <div
          className="absolute left-[200px] top-[-100px] h-[400px] w-[400px] rounded-[200px] bg-[#8080d715] blur-[75px] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute left-[840px] top-[50px] h-[400px] w-[500px] rounded-[250px/200px] bg-[#aad9d910] blur-[90px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Background Grid Lines */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 flex h-full w-[1440px] max-w-full flex-col items-start justify-between pointer-events-none opacity-30"
          aria-hidden="true"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`cta-h-line-${index}`}
              className="relative h-px w-full self-stretch bg-gradient-to-r from-transparent via-white/15 to-transparent"
            />
          ))}
        </div>
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 flex h-full w-[1440px] max-w-full items-start justify-between pointer-events-none opacity-30"
          aria-hidden="true"
        >
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={`cta-v-line-${index}`}
              className={`relative h-full w-px bg-gradient-to-b from-white/15 via-white/5 to-transparent ${
                index === 11 ? "mr-[-1.00px]" : ""
              }`}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-[117.25rem] mx-auto px-6 sm:px-10 lg:px-16 flex flex-col items-center text-center">
          <Reveal>
            <h2 className="font-outfit text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Ready to work and create with true ownership?
            </h2>
            <p className="mt-4 max-w-[600px] text-base text-[#8f9bb3] leading-relaxed font-sans">
              Join thousands of freelancers, builders, and content creators collaborating safely on the Canton Network.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              <button
                type="button"
                onClick={() => handleAction('Sign Up')}
                className="px-8 py-3.5 bg-white text-[#121212] hover:bg-[#f3f0ff] rounded-xl font-sans font-semibold text-sm shadow-[0_4px_16px_rgba(255,255,255,0.15)] hover:shadow-[0_6px_24px_rgba(140,92,255,0.35)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                Create Account
              </button>
              <Link
                href="/#what-we-offer"
                className="px-7 py-3.5 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/30 text-white font-sans font-semibold text-sm transition-all"
              >
                Explore Marketplace
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER (Consistent with landing footer) ── */}
      <footer className="w-full bg-[#09090b] px-6 sm:px-10 lg:px-16 py-12">
        <div className="max-w-[117.25rem] mx-auto flex flex-col gap-8 w-full">
          <div className="flex flex-col md:flex-row justify-between gap-10 md:gap-4 items-start">
            {/* Brand column */}
            <div className="flex flex-col gap-3 max-w-[200px]">
              <p className="font-sans font-bold text-[28px] tracking-tight text-white/90 leading-none">
                Canafri
              </p>
              <p className="font-sans text-[10px] leading-[1.5] text-[#8f9bb3]">
                Connecting talent, opportunities, content creators and businesses through the{' '}
                <span className="text-[#8C5CFF] font-semibold">CC</span> ecosystem
              </p>

              <div className="flex items-center gap-3 mt-1.5">
                <a
                  href="https://t.me/canafri"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                  className="flex items-center justify-center size-7 rounded-full bg-white/[0.06] border border-white/10 text-white/70 hover:text-[#8C5CFF] hover:border-[#8C5CFF]/40 transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                </a>
                <a
                  href="https://x.com/canafri"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="flex items-center justify-center size-7 rounded-full bg-white/[0.06] border border-white/10 text-white/70 hover:text-[#8C5CFF] hover:border-[#8C5CFF]/40 transition-all"
                >
                  <FooterXIcon />
                </a>
              </div>
            </div>

            {/* Nav columns */}
            <div className="grid grid-cols-3 gap-8 md:gap-12">
              <FooterCol title="Marketplace">
                <FooterNavLink icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>} label="Find Job" onClick={() => handleAction('Find Job')} />
                <FooterNavLink icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>} label="Find Talent" onClick={() => handleAction('Find Talent')} />
                <FooterNavLink icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>} label="Post a Job" onClick={() => handleAction('Post a Job')} />
                <FooterNavLink icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>} label="Become a Seller" onClick={() => handleAction('Become a Seller')} />
              </FooterCol>

              <FooterCol title="Resources">
                <li>
                  <Link
                    href="/about"
                    className="flex items-center gap-2 text-[11px] text-[#8C5CFF] font-medium transition-colors duration-200 text-left w-full cursor-pointer"
                  >
                    <span className="opacity-70 shrink-0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg></span>
                    <span>About Us</span>
                  </Link>
                </li>
                <FooterNavLink icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>} label="Help Center" onClick={() => handleAction('Support')} />
                <FooterNavLink icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>} label="Blog" onClick={() => handleAction('Blog')} />
                <FooterNavLink icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>} label="Community" onClick={() => handleAction('Community')} />
                <FooterNavLink icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><line x1="4.93" y1="4.93" x2="9.17" y2="9.17" /><line x1="14.83" y1="14.83" x2="19.07" y2="19.07" /><line x1="14.83" y1="9.17" x2="19.07" y2="4.93" /><line x1="4.93" y1="19.07" x2="9.17" y2="14.83" /></svg>} label="Support" onClick={() => handleAction('Support')} />
              </FooterCol>

              <FooterCol title="Legal">
                <li>
                  <Link
                    href="/terms"
                    className="flex items-center gap-2 text-[11px] text-[#8f9bb3] hover:text-white transition-colors duration-200 text-left w-full cursor-pointer"
                  >
                    <span className="opacity-70 shrink-0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg></span>
                    <span>Terms of Service</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="flex items-center gap-2 text-[11px] text-[#8f9bb3] hover:text-white transition-colors duration-200 text-left w-full cursor-pointer"
                  >
                    <span className="opacity-70 shrink-0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg></span>
                    <span>Privacy Policy</span>
                  </Link>
                </li>
                <FooterNavLink icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" /><path d="M12 8v4l3 3" /></svg>} label="Cookie Policy" onClick={() => handleAction('Cookie Policy')} />
                <FooterNavLink icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>} label="Contact Us" onClick={() => handleAction('Contact')} />
              </FooterCol>
            </div>
          </div>

          {/* Bottom bar */}
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
