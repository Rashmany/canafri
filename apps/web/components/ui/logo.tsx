'use client';

import React from 'react';

export interface LogoProps {
  /**
   * When true (e.g. collapsed sidebar), renders compact monogram/icon version.
   */
  collapsed?: boolean;
  className?: string;
  width?: number | string;
  height?: number | string;
}

/**
 * Global CanaFri Logo Component.
 * Reusable across top-nav, sidebar, auth split layout, headers, and footer.
 * Source SVG: /images/canafri-logo.svg
 */
export function Logo({
  collapsed = false,
  className = '',
  width,
  height,
}: LogoProps) {
  if (collapsed) {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/canafri-logo.svg"
          alt="CanaFri"
          width={width || 28}
          height={height || 28}
          className="size-7 object-contain transition-transform"
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/canafri-logo.svg"
        alt="CanaFri Logo"
        width={width || 30}
        height={height || 30}
        className="size-[30px] object-contain shrink-0"
      />
      <span className="font-sans font-bold text-[1.25rem] leading-none tracking-tight text-white/95">
        canafri
      </span>
    </div>
  );
}

export default Logo;
