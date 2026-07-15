'use client';
import { cn } from '@/lib/utils';

interface MobileSplashPageProps {
  onNext?: () => void;
  onSkip?: () => void;
}

export default function MobileSplashPage({ onNext, onSkip }: MobileSplashPageProps) {
  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-[#080808] text-white px-6 py-12 w-full max-w-md mx-auto md:hidden">
      
      {/* Top illustration container */}
      <div className="flex-1 flex flex-col items-center justify-center gap-10 w-full mt-6">
        {/* Placeholder for Connected world illustration */}
        <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[320px] flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
          {/* Dynamic Placeholder SVG Illustration: Globe with connected nodes */}
          <svg
            className="w-4/5 h-4/5 text-primary opacity-80"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="50" cy="50" r="30" className="stroke-primary/40" />
            <path d="M50 20a30 30 0 0 0 0 60M50 20a30 30 0 0 1 0 60" className="stroke-primary/30" />
            <path d="M20 50h60" className="stroke-primary/30" />
            <circle cx="50" cy="20" r="3.5" className="fill-[#8C5CFF]" />
            <circle cx="24" cy="38" r="3" className="fill-white" />
            <circle cx="76" cy="38" r="3" className="fill-white" />
            <circle cx="35" cy="74" r="3.5" className="fill-[#8C5CFF]" />
            <circle cx="65" cy="74" r="3" className="fill-white" />
            {/* Connection lines */}
            <line x1="50" y1="20" x2="24" y2="38" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
            <line x1="50" y1="20" x2="76" y2="38" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
            <line x1="24" y1="38" x2="35" y2="74" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
            <line x1="76" y1="38" x2="65" y2="74" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
            <line x1="35" y1="74" x2="65" y2="74" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
          </svg>
        </div>

        {/* Text Description */}
        <p className="text-[13px] text-center text-white/80 leading-[20px] max-w-[280px] font-normal px-2">
          Earn, stake, and transact securely while growing your reputation and opportunities.
        </p>

        {/* Pagination Dots Indicator */}
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary" />
          <span className="size-2 rounded-full bg-white/20" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3.5 w-full mt-auto">
        <button
          onClick={onNext}
          className="cursor-pointer bg-primary text-white text-[13px] font-semibold h-[38px] w-full rounded-xl hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center"
        >
          Next
        </button>
        <button
          onClick={onSkip}
          className="cursor-pointer bg-transparent border border-primary text-white hover:bg-primary/10 text-[13px] font-semibold h-[38px] w-full rounded-xl active:scale-[0.98] transition-all flex items-center justify-center"
        >
          Skip
        </button>
      </div>

    </div>
  );
}
