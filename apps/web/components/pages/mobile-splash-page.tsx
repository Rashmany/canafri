'use client';

/**
 * Splash Page — Single onboarding screen.
 *
 * ANIMATION SYSTEM (v4)
 * ─────────────────────
 * Background elements (SVGs + circles) are absolutely positioned inside the
 * root container and roam the viewport on mobile devices.
 * Animations are disabled on tablet and desktop screens.
 * prefers-reduced-motion: RAF loop never starts; elements remain static.
 */

import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Mail } from 'lucide-react';
import AuthSplitLayout from '@/components/auth-split-layout';
import { Logo } from '@/components/ui/logo';

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────

const TWO_PI = Math.PI * 2;

// ─────────────────────────────────────────────────────────────────────────────
//  Splash Page
// ─────────────────────────────────────────────────────────────────────────────

interface MobileSplashPageProps {
  onRegisterClick?: () => void;
  onLoginClick?: () => void;
}

export default function MobileSplashPage({ onRegisterClick, onLoginClick }: MobileSplashPageProps) {
  const c1Ref = useRef<HTMLDivElement>(null);
  const c2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktopOrTablet = window.innerWidth >= 768;
    if (reduced || isDesktopOrTablet) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const ORBITS = [
      {
        cx: vw * 0.50, cy: vh * 0.42,
        rx: vw * 0.38, ry: vh * 0.30,
        orbitPeriod: 28_000,
        phase0: Math.PI * 1.05,
        selfRotPeriod: 12_000,
        selfRotDir: 1,
        size: 110,
      },
      {
        cx: vw * 0.50, cy: vh * 0.55,
        rx: vw * 0.34, ry: vh * 0.28,
        orbitPeriod: 20_000,
        phase0: Math.PI * 0.1,
        selfRotPeriod: 9_000,
        selfRotDir: -1,
        size: 82,
      },
    ];

    [c1Ref.current, c2Ref.current].forEach((node, i) => {
      if (!node) return;
      const o = ORBITS[i];
      node.style.width = `${o.size}px`;
      node.style.height = `${o.size}px`;
      const x = o.cx + o.rx * Math.cos(o.phase0) - o.size / 2;
      const y = o.cy + o.ry * Math.sin(o.phase0) - o.size / 2;
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
    });

    if (reduced) return;

    let rafId: number;
    const t0 = performance.now();

    const frame = (now: number) => {
      const t = now - t0;

      [c1Ref.current, c2Ref.current].forEach((node, i) => {
        if (!node) return;
        const o = ORBITS[i];
        const orbitAngle = o.phase0 + (TWO_PI * t) / o.orbitPeriod;
        const x = o.cx + o.rx * Math.cos(orbitAngle) - o.size / 2;
        const y = o.cy + o.ry * Math.sin(orbitAngle) - o.size / 2;
        const selfRot = o.selfRotDir * (TWO_PI * t) / o.selfRotPeriod;
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        node.style.transform = `rotate(${selfRot}rad)`;
      });

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <AuthSplitLayout>
      {/* ── Mobile Background Floating Orbits (hidden on md+) ── */}
      <div className="md:hidden">
        <div
          ref={c1Ref}
          className="absolute pointer-events-none select-none"
          aria-hidden="true"
          style={{
            left: '12vw', top: '15vh',
            width: '110px', height: '110px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 32%, rgba(180,145,255,0.22) 0%, rgba(100,58,200,0.38) 40%, rgba(36,12,90,0.55) 75%, rgba(10,3,28,0.70) 100%)',
            boxShadow: '0 8px 36px 4px rgba(140,92,255,0.12), inset 0 -6px 18px rgba(0,0,0,0.45), inset 0 4px 12px rgba(180,150,255,0.07)',
            opacity: 0.55,
            willChange: 'transform, left, top',
            transformOrigin: 'center center',
          }}
        />
        <div
          ref={c2Ref}
          className="absolute pointer-events-none select-none"
          aria-hidden="true"
          style={{
            left: '85vw', top: '58vh',
            width: '82px', height: '82px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 30%, rgba(165,125,255,0.20) 0%, rgba(80,40,170,0.35) 42%, rgba(28,8,72,0.52) 76%, rgba(8,2,22,0.68) 100%)',
            boxShadow: '0 6px 28px 3px rgba(140,92,255,0.09), inset 0 -5px 14px rgba(0,0,0,0.42), inset 0 3px 10px rgba(180,150,255,0.06)',
            opacity: 0.50,
            willChange: 'transform, left, top',
            transformOrigin: 'center center',
          }}
        />
      </div>

      {/* ── Main Content Container ── */}
      <div className="flex flex-col items-center justify-between md:justify-center min-h-screen md:min-h-0 w-full px-6 py-12 z-10">

        {/* Mobile-only top logo */}
        <div className="flex justify-center w-full mt-[6vh] md:hidden">
          <Logo />
        </div>

        {/* Content Container (Header + Buttons) */}
        <div className="flex flex-col items-center md:items-start w-full max-w-[340px] md:max-w-[380px] mx-auto mb-[4vh] md:mb-0">

          {/* Header */}
          <div className="flex flex-col items-start md:items-start gap-1.5 mb-8 text-center md:text-left w-full">
            <h1 className="text-[28px] md:text-[32px] font-bold leading-[34px] md:leading-[38px] tracking-[-0.18px] text-white/95">
              Welcome to CanaFri
            </h1>
            <p className="text-[13px] font-normal leading-[20px] text-[#a0a0a0]">
              Find jobs. Hire experts. Learn from creators.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-3.5 w-full">
            {/* Button 1: Continue with Google */}
            <button
              id="splash-google-btn"
              type="button"
              onClick={() => {
                window.location.href = '/api/auth/google';
              }}
              className="w-full h-[48px] px-4 rounded-[12px] bg-[#141418] hover:bg-[#1e1e24] border border-[#2a2a34] text-white text-[13px] font-semibold transition-all active:scale-[0.98] flex items-center justify-between cursor-pointer shadow-lg group hover:border-[#8C5CFF]/50"
            >
              <div className="flex items-center gap-3">
                <GoogleLogo size={20} />
                <span className="font-sans text-white/95 group-hover:text-white">
                  Continue with Google
                </span>
              </div>
              <ChevronRight size={18} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Button 2: Login with Email */}
            <button
              id="splash-email-login-btn"
              type="button"
              onClick={onLoginClick}
              className="w-full h-[48px] px-4 rounded-[12px] bg-[#141418] hover:bg-[#1e1e24] border border-[#2a2a34] text-white text-[13px] font-semibold transition-all active:scale-[0.98] flex items-center justify-between cursor-pointer shadow-lg group hover:border-[#8C5CFF]/50"
            >
              <div className="flex items-center gap-3">
                <Mail size={20} strokeWidth={1.5} className="text-white/80 group-hover:text-white transition-colors" />
                <span className="font-sans text-white/95 group-hover:text-white">
                  Login with Email
                </span>
              </div>
              <ChevronRight size={18} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Divider: OR with two lines beside it */}
            <div className="flex items-center w-full my-1 gap-3">
              <div className="flex-1 h-px bg-white/15" />
              <span className="font-sans text-[11px] font-bold text-white/45 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-white/15" />
            </div>

            {/* Button 3: Create Account (Primary CTA) */}
            <button
              id="splash-create-account-btn"
              type="button"
              onClick={onRegisterClick}
              className="w-full h-[48px] bg-[#8C5CFF] hover:bg-[#9d72ff] text-white rounded-[12px] text-[14px] font-bold active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer shadow-xl shadow-[#8C5CFF]/30 tracking-wide"
            >
              Create Account
            </button>
          </div>

        </div>

      </div>
    </AuthSplitLayout>
  );
}

