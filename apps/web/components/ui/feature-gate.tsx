'use client';

import React from 'react';

interface FeatureGateProps {
  /** Whether the feature is currently paused/unavailable */
  active: boolean;
  /** Short feature name shown in the heading, e.g. "Messaging" */
  featureName: string;
  /** Optional admin-supplied reason text */
  reason?: string | null;
  /** Content to render when the feature is available */
  children: React.ReactNode;
}

/**
 * FeatureGate
 *
 * Wraps any page or section. When `active` is true it replaces the children
 * with a polished "unavailable" screen. When `active` is false it renders
 * the children untouched — zero overhead in the normal path.
 */
export function FeatureGate({ active, featureName, reason, children }: FeatureGateProps) {
  if (!active) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full bg-background px-6 py-16 font-sans">
      {/* Glow orb */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'clamp(180px, 50vw, 420px)',
          height: 'clamp(180px, 50vw, 420px)',
          background:
            'radial-gradient(ellipse at center, rgba(140,92,255,0.18) 0%, transparent 70%)',
          filter: 'blur(30px)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-[420px]">
        {/* Copy */}
        <div className="flex flex-col gap-2">
          <h2
            className="font-bold text-foreground leading-tight"
            style={{ fontSize: 'clamp(20px, 5vw, 26px)', letterSpacing: '-0.5px' }}
          >
            {featureName} Is Temporarily Unavailable
          </h2>
          <p
            className="text-muted leading-relaxed"
            style={{ fontSize: 'clamp(13px, 2.5vw, 15px)' }}
          >
            {reason?.trim() ||
              `${featureName} is currently undergoing maintenance. Our team is working hard to restore it. Please check back shortly.`}
          </p>
        </div>

        {/* Status pill */}
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 tracking-wide uppercase">
          <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
          Under Maintenance
        </span>
      </div>
    </div>
  );
}
