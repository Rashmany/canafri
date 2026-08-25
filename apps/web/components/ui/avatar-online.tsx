'use client';

import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarOnlineProps {
  /** Image source URL or path */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Show the green online presence indicator dot */
  online?: boolean;
  /** Click handler — renders the wrapper as a <button> when provided */
  onClick?: () => void;
  /** Visual size variant */
  size?: AvatarSize;
  /** Additional class names for the wrapper */
  className?: string;
}

// ─── Size config ──────────────────────────────────────────────────────────────

const SIZE: Record<AvatarSize, { wrapper: string; dot: string; dotBorder: string; px: number }> = {
  sm: { wrapper: 'size-8',    dot: 'size-2',    dotBorder: 'border-[1.5px]', px: 32 },
  md: { wrapper: 'size-10',   dot: 'size-[0.625rem]', dotBorder: 'border-2',   px: 40 },
  lg: { wrapper: 'size-12',   dot: 'size-3',    dotBorder: 'border-2',   px: 48 },
};

// ─── Component ────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  if (!name) return 'U';
  const clean = name.replace(/^@/, '').trim();
  if (!clean) return 'U';
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

/**
 * Circular avatar with an optional green online-presence indicator dot.
 *
 * Renders as a `<button>` when `onClick` is supplied, otherwise a plain `<div>`.
 * Import path: `@/components/ui/avatar-online`
 */
export function AvatarOnline({
  src,
  alt,
  online = false,
  onClick,
  size = 'md',
  className = '',
}: AvatarOnlineProps) {
  const s = SIZE[size];
  const isInteractive = Boolean(onClick);
  const [imageError, setImageError] = useState(false);

  const wrapperClass = [
    'relative shrink-0 rounded-full overflow-visible',
    s.wrapper,
    isInteractive
      ? 'cursor-pointer hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5CFF]'
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const hasValidCustomImage = Boolean(
    src &&
      src.trim() !== '' &&
      !src.includes('default-avatar') &&
      !imageError
  );

  const initialsText = getInitials(alt);

  const inner = (
    <>
      {/* Avatar image or text initials fallback */}
      <span className={`block relative rounded-full overflow-hidden bg-gradient-to-br from-[#8C5CFF]/25 to-[#8C5CFF]/10 ${s.wrapper}`}>
        {hasValidCustomImage ? (
          <img
            src={src}
            alt={alt}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <span className="flex size-full items-center justify-center font-sans font-bold text-[#AC8EF3] uppercase tracking-wider select-none text-[0.7rem] sm:text-[0.75rem]">
            {initialsText}
          </span>
        )}
      </span>

      {/* Online presence dot */}
      {online && (
        <span
          aria-label="Online"
          className={[
            'absolute bottom-0 right-0 rounded-full bg-emerald-400',
            s.dot,
            s.dotBorder,
            // dot border matches sidebar bg in both themes
            'border-[#101010] dark:border-[#101010]',
          ].join(' ')}
        />
      )}
    </>
  );

  if (isInteractive) {
    return (
      <button type="button" onClick={onClick} className={wrapperClass}>
        {inner}
      </button>
    );
  }

  return <div className={wrapperClass}>{inner}</div>;
}
