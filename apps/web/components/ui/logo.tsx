/**
 * CanaFri brand wordmark — gradient logo.
 *
 * The SVG path data from the Figma export will be wired up here once those
 * paths are extracted. Until then the component renders a styled text mark
 * using the exact brand gradients.
 *
 * Import path: `@/components/ui/logo`
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogoProps {
  /**
   * When true (collapsed tablet sidebar) render only the "C" monogram
   * instead of the full "CanaFri" wordmark.
   */
  collapsed?: boolean;
  className?: string;
}

// ─── Gradient style (matches Figma radialGradient spec exactly) ───────────────

const WORDMARK_GRADIENT: React.CSSProperties = {
  backgroundImage: 'radial-gradient(ellipse at 50% 45%, #AC8EF3 0%, #3E1A94 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const MONOGRAM_GRADIENT: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, #AC8EF3 0%, #3E1A94 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Logo({ collapsed = false, className = '' }: LogoProps) {
  if (collapsed) {
    return (
      <span
        className={`select-none font-bold text-lg leading-none ${className}`}
        style={MONOGRAM_GRADIENT}
      >
        C
      </span>
    );
  }

  return (
    <span
      className={`select-none font-bold text-[1.25rem] leading-none tracking-tight ${className}`}
      style={WORDMARK_GRADIENT}
    >
      CanaFri
    </span>
  );
}
