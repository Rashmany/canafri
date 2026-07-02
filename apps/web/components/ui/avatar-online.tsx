'use client';

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

  const inner = (
    <>
      {/* Avatar placeholder — user silhouette */}
      <span className={`block relative rounded-full overflow-hidden bg-[#E8E4F7] dark:bg-[#1E1830] ${s.wrapper}`}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-label={alt}
        >
          {/* Head */}
          <circle cx="20" cy="15" r="7" fill="#8C5CFF" fillOpacity="0.55" />
          {/* Body */}
          <ellipse cx="20" cy="34" rx="13" ry="10" fill="#8C5CFF" fillOpacity="0.35" />
        </svg>
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
