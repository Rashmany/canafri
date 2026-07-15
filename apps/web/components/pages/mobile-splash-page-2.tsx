'use client';

interface MobileSplashPage2Props {
  onNext?: () => void;
  onSkip?: () => void;
}

export default function MobileSplashPage2({ onNext, onSkip }: MobileSplashPage2Props) {
  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-[#080808] text-white px-6 py-12 w-full max-w-md mx-auto md:hidden">

      {/* Top illustration container */}
      <div className="flex-1 flex flex-col items-center justify-center gap-10 w-full mt-6">
        {/* Placeholder for illustration — replace with actual image in /public later */}
        <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[320px] flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
          {/* SVG Placeholder: Network / Connection themed illustration */}
          <svg
            className="w-4/5 h-4/5 text-primary opacity-80"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Central hub */}
            <circle cx="50" cy="50" r="10" className="stroke-primary/60" />
            <circle cx="50" cy="50" r="4" className="fill-[#8C5CFF]" />
            {/* Outer nodes */}
            <circle cx="50" cy="18" r="4" className="fill-white/80" />
            <circle cx="78" cy="34" r="3.5" className="fill-[#8C5CFF]" />
            <circle cx="78" cy="66" r="3.5" className="fill-white/80" />
            <circle cx="50" cy="82" r="4" className="fill-[#8C5CFF]" />
            <circle cx="22" cy="66" r="3.5" className="fill-white/80" />
            <circle cx="22" cy="34" r="3.5" className="fill-[#8C5CFF]" />
            {/* Spokes from center to outer nodes */}
            <line x1="50" y1="60" x2="50" y2="78" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
            <line x1="50" y1="40" x2="50" y2="22" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
            <line x1="59" y1="55" x2="74" y2="64" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
            <line x1="59" y1="45" x2="74" y2="36" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
            <line x1="41" y1="55" x2="26" y2="64" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
            <line x1="41" y1="45" x2="26" y2="36" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
            {/* Outer ring connections */}
            <path d="M50 18 Q78 18 78 34" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 2" className="opacity-30" />
            <path d="M78 34 Q88 50 78 66" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 2" className="opacity-30" />
            <path d="M78 66 Q64 88 50 82" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 2" className="opacity-30" />
            <path d="M50 82 Q36 88 22 66" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 2" className="opacity-30" />
            <path d="M22 66 Q12 50 22 34" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 2" className="opacity-30" />
            <path d="M22 34 Q36 12 50 18" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 2" className="opacity-30" />
          </svg>
        </div>

        {/* Text Description — Splash 2 */}
        <p className="text-[13px] text-center text-white/80 leading-[20px] max-w-[280px] font-normal px-2">
          Find jobs, hire experts, and build meaningful connections in one powerful platform.
        </p>

        {/* Pagination Dots — second dot active */}
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-white/20" />
          <span className="size-2 rounded-full bg-primary" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3.5 w-full mt-auto">
        <button
          onClick={onNext}
          className="cursor-pointer bg-primary text-white text-[13px] font-semibold h-[38px] w-full rounded-xl hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center"
        >
          Get Started
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
