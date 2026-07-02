'use client';

import { ChevronRight } from 'lucide-react';

interface FrameComponent2Props {
  property1?: 'Default';
  profile: string;
  profileColor?: string;
  onClick?: () => void;
}

/**
 * Standard settings menu option row.
 * Displays settings item label and chevron indicator.
 *
 * Import path: `@/components/ui/frame-component21`
 */
export default function FrameComponent2({
  profile,
  profileColor,
  onClick,
}: FrameComponent2Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between border-b border-border bg-card p-4 transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#8C5CFF]"
    >
      <span
        className="font-sans text-[13px] font-semibold leading-[18px] text-foreground"
        style={profileColor ? { color: profileColor } : undefined}
      >
        {profile}
      </span>
      <ChevronRight size={16} className="text-foreground/60" />
    </button>
  );
}
