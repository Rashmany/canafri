'use client';

/**
 * Splash Page — Single onboarding screen.
 *
 * ANIMATION SYSTEM (v4)
 * ─────────────────────
 * Background elements (SVGs + circles) are absolutely positioned inside the
 * FULL-SCREEN root container so they roam the entire viewport at every size.
 * Home positions are set with vw/vh units so they always spread across the
 * whole screen rather than bunching in the top-left corner.
 *
 * The onboarding card (logo, rotating text, buttons) is a flex overlay that
 * always fits the visible area with no overflow / clipping.
 *
 * Each element follows a Lissajous orbit (parametric sin / cos).
 * Soft-repulsion collision detection runs every RAF frame.
 *
 * RotatingText state-machine: fade-in 600 ms → hold 3 400 ms → fade-out 600 ms
 * Fixed-height container (100 px) → zero layout shift.
 * prefers-reduced-motion: RAF loop never starts; elements are static.
 */

import { useState, useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────

const TWO_PI = Math.PI * 2;
const period = (ms: number) => TWO_PI / ms;

const FADE_MS = 600;
const HOLD_MS = 3_400;
const TICK_MS = 50;

const SPLASH_TEXTS = [
  'Find jobs, hire experts, and build meaningful connections in one powerful platform.',
  'Earn, stake, and transact securely while growing your reputation and opportunities.',
];

const TEXT_GRADIENT: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(106.36deg, rgba(255,255,255,0.95) 36.43%, rgba(140,92,255,1) 103.17%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

// ─────────────────────────────────────────────────────────────────────────────
//  RotatingText
// ─────────────────────────────────────────────────────────────────────────────

function RotatingText({ texts }: { texts: string[] }) {
  const [index,   setIndex]   = useState(0);
  const [opacity, setOpacity] = useState(0);
  const reducedMotion = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.current = mq.matches;
    if (mq.matches) setOpacity(1);
  }, []);

  useEffect(() => {
    if (reducedMotion.current) return;
    let cancelled = false;
    const t1 = window.setTimeout(() => { if (!cancelled) setOpacity(1); }, TICK_MS);
    const t2 = window.setTimeout(() => { if (!cancelled) setOpacity(0); }, TICK_MS + HOLD_MS);
    const t3 = window.setTimeout(() => {
      if (!cancelled) { setOpacity(0); setIndex(i => (i + 1) % texts.length); }
    }, TICK_MS + HOLD_MS + FADE_MS);
    return () => { cancelled = true; clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{ position: 'relative', width: '100%', height: '100px' }}
    >
      <p
        className="absolute inset-0 text-center font-sans text-[16px] leading-[24px] font-bold"
        style={{
          ...TEXT_GRADIENT,
          opacity,
          transition: reducedMotion.current ? undefined : `opacity ${FADE_MS}ms ease-in-out`,
          margin: 0,
        }}
      >
        {texts[index]}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Background element descriptor — viewport-relative home positions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * homeXPct / homeYPct — home centre as fraction of viewport (0‒1).
 * axPct / ayPct       — Lissajous amplitude as fraction of viewport.
 * wPx / hPx           — base element size in px.
 * wScale / hScale     — size multiplier applied on larger screens.
 */
interface ElemDesc {
  homeXPct: number; homeYPct: number;
  wPx: number;      hPx: number;
  wScale: number;   hScale: number;
  axPct: number;    ayPct: number;
  wx: number;       wy: number;
  phx: number;      phy: number;
  initRot: number;  rotSpeed: number;
}

const ELEMS: ElemDesc[] = [
  /* 0 ── Decorative Circle 1 — top-left quadrant */
  {
    homeXPct: 0.12,  homeYPct: 0.15,
    wPx: 100, hPx: 100, wScale: 0.9, hScale: 0.9,
    axPct: 0.20, ayPct: 0.16,
    wx: period(83_000), wy: period(67_000),
    phx: 0,            phy: Math.PI / 3,
    initRot: 0,        rotSpeed: period(180_000),
  },
  /* 1 ── Decorative Circle 2 — right-centre */
  {
    homeXPct: 0.85,  homeYPct: 0.58,
    wPx: 100, hPx: 100, wScale: 0.9, hScale: 0.9,
    axPct: 0.16, ayPct: 0.18,
    wx: period(71_000), wy: period(94_000),
    phx: Math.PI / 2, phy: Math.PI,
    initRot: 0,        rotSpeed: -period(165_000),
  },
  /* 2 ── Reading SVG — upper-right area */
  {
    homeXPct: 0.72,  homeYPct: 0.28,
    wPx: 203, hPx: 174, wScale: 1.0, hScale: 1.0,
    axPct: 0.14, ayPct: 0.13,
    wx: period(79_000), wy: period(58_000),
    phx: Math.PI / 4,      phy: (3 * Math.PI) / 4,
    initRot:  7.6  * (Math.PI / 180), rotSpeed: period(210_000),
  },
  /* 3 ── Content Creator SVG — lower-left area */
  {
    homeXPct: 0.18,  homeYPct: 0.72,
    wPx: 213, hPx: 188, wScale: 1.0, hScale: 1.0,
    axPct: 0.16, ayPct: 0.13,
    wx: period(64_000), wy: period(89_000),
    phx: (2 * Math.PI) / 3, phy: Math.PI / 6,
    initRot: -18.26 * (Math.PI / 180), rotSpeed: -period(195_000),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Splash Page
// ─────────────────────────────────────────────────────────────────────────────

interface MobileSplashPageProps {
  onRegisterClick?: () => void;
  onLoginClick?:    () => void;
}

export default function MobileSplashPage({ onRegisterClick, onLoginClick }: MobileSplashPageProps) {
  const c1Ref    = useRef<HTMLDivElement>(null);
  const c2Ref    = useRef<HTMLDivElement>(null);
  const readRef  = useRef<HTMLImageElement>(null);
  const creatRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const nodes: (HTMLElement | null)[] = [
      c1Ref.current,
      c2Ref.current,
      readRef.current,
      creatRef.current,
    ];

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isLarge = vw >= 768;
    // Scale factor: grows smoothly with viewport width on larger screens
    const sizeMult = isLarge ? Math.max(1.4, Math.min(2.2, vw / 600)) : 1;

    // Resolve each element's pixel values from viewport-relative descriptors
    const resolved = ELEMS.map(el => {
      const wFactor = isLarge ? el.wScale * (sizeMult / 1.5) : 1;
      const hFactor = isLarge ? el.hScale * (sizeMult / 1.5) : 1;
      const w  = el.wPx * wFactor;
      const h  = el.hPx * hFactor;
      // Centre element on its home percentage; left/top = centre minus half-size
      const homeLeft = vw * el.homeXPct - w  * 0.5;
      const homeTop  = vh * el.homeYPct - h  * 0.5;
      const ax = vw * el.axPct;
      const ay = vh * el.ayPct;
      return { w, h, homeLeft, homeTop, ax, ay,
               wx: el.wx, wy: el.wy, phx: el.phx, phy: el.phy,
               initRot: el.initRot, rotSpeed: el.rotSpeed };
    });

    // Apply initial sizes & positions immediately (overrides CSS vw/vh values
    // so the RAF physics loop starts from the correct pixel positions)
    nodes.forEach((node, i) => {
      if (!node) return;
      const r = resolved[i];
      node.style.width  = `${r.w}px`;
      node.style.height = `${r.h}px`;
      node.style.left   = `${r.homeLeft}px`;
      node.style.top    = `${r.homeTop}px`;
    });

    if (reduced) {
      nodes.forEach((node, i) => {
        if (node) node.style.transform = `rotate(${resolved[i].initRot}rad)`;
      });
      return; // skip RAF
    }

    // Per-element bounce velocity accumulator (collision impulse + friction)
    const bv = resolved.map(() => ({ x: 0, y: 0 }));
    const FRICTION = 0.88;
    const IMPULSE  = 2.6;

    let rafId: number;
    const t0 = performance.now();

    const frame = (now: number) => {
      const t = now - t0;

      // 1. Lissajous orbital position
      const pos = resolved.map((el, i) => {
        const ox  = el.ax * Math.sin(el.wx * t + el.phx);
        const oy  = el.ay * Math.sin(el.wy * t + el.phy);
        const rot = el.initRot + el.rotSpeed * t;
        const cx  = el.homeLeft + el.w * 0.5 + ox + bv[i].x;
        const cy  = el.homeTop  + el.h * 0.5 + oy + bv[i].y;
        return { ox, oy, rot, cx, cy };
      });

      // 2. Pairwise soft-collision detection & impulse
      for (let i = 0; i < resolved.length; i++) {
        for (let j = i + 1; j < resolved.length; j++) {
          const dx   = pos[j].cx - pos[i].cx;
          const dy   = pos[j].cy - pos[i].cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const ri   = Math.min(resolved[i].w, resolved[i].h) * 0.44;
          const rj   = Math.min(resolved[j].w, resolved[j].h) * 0.44;
          const minD = ri + rj;

          if (dist < minD && dist > 0.5) {
            const penetration = (minD - dist) / minD;
            const nx = dx / dist;
            const ny = dy / dist;
            const f  = penetration * IMPULSE;
            bv[i].x -= nx * f;
            bv[i].y -= ny * f;
            bv[j].x += nx * f;
            bv[j].y += ny * f;
          }
        }
      }

      // 3. Decay bounce velocity; write GPU transform
      nodes.forEach((node, i) => {
        bv[i].x *= FRICTION;
        bv[i].y *= FRICTION;
        const tx = pos[i].ox + bv[i].x;
        const ty = pos[i].oy + bv[i].y;
        if (node) {
          node.style.transform = `translate3d(${tx}px,${ty}px,0) rotate(${pos[i].rot}rad)`;
        }
      });

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    /* Root — always fills the full viewport; no scroll, no clip */
    <div
      className="fixed inset-0 w-full h-full overflow-hidden"
      style={{ backgroundColor: '#080808' }}
    >

      {/* ── Background layer: elements roam the full viewport ──────────────── */}

      {/* Circle 1 — initial position via vw/vh so it's visually distributed */}
      <div
        ref={c1Ref}
        className="absolute pointer-events-none select-none"
        aria-hidden="true"
        style={{
          left: '12vw', top: '15vh',
          width: '100px', height: '100px',
          borderRadius: '50%',
          backgroundColor: '#8C5CFF',
          opacity: 0.10,
          willChange: 'transform',
          transformOrigin: 'center center',
        }}
      />

      {/* Circle 2 */}
      <div
        ref={c2Ref}
        className="absolute pointer-events-none select-none"
        aria-hidden="true"
        style={{
          left: '85vw', top: '58vh',
          width: '100px', height: '100px',
          borderRadius: '50%',
          backgroundColor: '#8C5CFF',
          opacity: 0.10,
          willChange: 'transform',
          transformOrigin: 'center center',
        }}
      />

      {/* Reading SVG — upper-right */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={readRef}
        src="/images/splash-reading.svg"
        alt="" aria-hidden="true" draggable={false}
        className="absolute pointer-events-none select-none"
        style={{
          left: '72vw', top: '28vh',
          width: '203px', height: '174px',
          transformOrigin: 'center center',
          willChange: 'transform',
          opacity: 0.10,
        }}
      />

      {/* Creator SVG — lower-left */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={creatRef}
        src="/images/splash-creator.svg"
        alt="" aria-hidden="true" draggable={false}
        className="absolute pointer-events-none select-none"
        style={{
          left: '18vw', top: '72vh',
          width: '213px', height: '188px',
          transformOrigin: 'center center',
          willChange: 'transform',
          opacity: 0.10,
        }}
      />

      {/* ── Content layer — centered flex, always fits viewport ─────────────── */}
      <div className="absolute inset-0 flex flex-col items-center z-10 px-6">

        {/* Logo — mobile only; hidden on md+ */}
        <div className="flex justify-center w-full mt-[12vh] md:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/splash-logo.svg"
            alt="CanaFri"
            style={{ width: '101px', height: '23px', objectFit: 'contain' }}
          />
        </div>

        {/* Top spacer — larger so text lands nearer the vertical centre */}
        <div className="flex-[3]" />

        {/* Rotating description text */}
        <div className="w-full max-w-[310px] mx-auto">
          <RotatingText texts={SPLASH_TEXTS} />
        </div>

        {/* Bottom spacer — keeps buttons off the very bottom edge */}
        <div className="flex-[2]" />

        {/* Buttons */}
        <div className="flex flex-col items-center gap-5 w-full max-w-[310px] mx-auto mt-2 mb-[8vh]">
          {/* Create Account */}
          <button
            id="splash-create-account-btn"
            type="button"
            onClick={onRegisterClick}
            className="w-full bg-primary hover:bg-primary-hover text-white rounded-[12px] text-[13px] font-semibold leading-[18px] active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
            style={{ height: '46px' }}
          >
            Create Account
          </button>

          {/* Sign in text button */}
          <button
            id="splash-sign-in-btn"
            type="button"
            onClick={onLoginClick}
            className="cursor-pointer font-sans font-bold text-[15px] leading-[18px] transition-colors"
            style={{ color: 'rgba(255,255,255,0.75)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)';
            }}
          >
            Sign in
          </button>
        </div>

      </div>
    </div>
  );
}
