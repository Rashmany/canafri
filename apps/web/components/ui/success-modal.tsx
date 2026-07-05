'use client';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, X } from 'lucide-react';

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  cta?: string;
  onCta?: () => void;
}

export function SuccessModal({
  open,
  onClose,
  title,
  description,
  cta = 'Back to Order',
  onCta,
}: SuccessModalProps) {
  const [visible, setVisible] = useState(false);
  const [ringAnimated, setRingAnimated] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    if (open) {
      // Stagger the entrance animations
      const t1 = setTimeout(() => setVisible(true), 10);
      const t2 = setTimeout(() => setRingAnimated(true), 200);
      const t3 = setTimeout(() => setContentVisible(true), 500);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    } else {
      setVisible(false);
      setRingAnimated(false);
      setContentVisible(false);
    }
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleCta = () => {
    handleClose();
    setTimeout(() => {
      if (onCta) onCta();
    }, 350);
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center transition-all duration-300',
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        onClick={handleClose}
      />

      {/* Modal Panel */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md mx-4 rounded-3xl overflow-hidden',
          'bg-[#FAFAFD] dark:bg-[#0B0B0B]',
          'border border-[#D8D8D8] dark:border-[#121212]',
          'shadow-[0_32px_80px_rgba(140,92,255,0.15)]',
          'transition-all duration-500 ease-out',
          visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        )}
      >
        {/* Top accent bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#8c5cff] to-transparent" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted/50 hover:text-muted transition-colors z-10 cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center px-8 py-10 gap-6">

          {/* Animated check ring */}
          <div className="relative flex items-center justify-center">
            {/* Outer glow ring — grows in */}
            <div
              className={cn(
                'absolute rounded-full transition-all duration-700 ease-out',
                ringAnimated
                  ? 'w-[100px] h-[100px] bg-[#8c5cff]/10 dark:bg-[#8c5cff]/8'
                  : 'w-[40px] h-[40px] bg-[#8c5cff]/0'
              )}
            />
            {/* Middle ring */}
            <div
              className={cn(
                'absolute rounded-full transition-all duration-500 ease-out delay-100',
                ringAnimated
                  ? 'w-[72px] h-[72px] bg-[#8c5cff]/15 dark:bg-[#8c5cff]/12'
                  : 'w-[40px] h-[40px] bg-[#8c5cff]/0'
              )}
            />
            {/* Inner circle with check */}
            <div
              className={cn(
                'relative flex items-center justify-center rounded-full bg-gradient-to-br from-[#8c5cff] to-[#6e3fff]',
                'shadow-[0_0_32px_rgba(140,92,255,0.5)]',
                'transition-all duration-500 ease-out delay-150',
                ringAnimated ? 'w-[52px] h-[52px]' : 'w-[0px] h-[0px]'
              )}
            >
              <CheckCircle2
                className={cn(
                  'text-white transition-all duration-300 delay-300',
                  ringAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                )}
                size={26}
                strokeWidth={2.5}
              />
            </div>
          </div>

          {/* Text content — slides up and fades in */}
          <div
            className={cn(
              'flex flex-col gap-2 transition-all duration-500 ease-out',
              contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            )}
          >
            <h3 className="text-[18px] font-bold text-[#010101] dark:text-white tracking-tight">
              {title}
            </h3>
            <p className="text-[13px] leading-relaxed text-muted max-w-xs mx-auto">
              {description}
            </p>
          </div>

          {/* Divider */}
          <div
            className={cn(
              'w-full h-px bg-[#DADADA] dark:bg-[#1e1e1e] transition-all duration-500 ease-out delay-100',
              contentVisible ? 'opacity-100' : 'opacity-0'
            )}
          />

          {/* CTA Button */}
          <div
            className={cn(
              'flex flex-col gap-3 w-full transition-all duration-500 ease-out delay-200',
              contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}
          >
            <button
              onClick={handleCta}
              className={cn(
                'w-full py-3 rounded-2xl text-[14px] font-semibold text-white',
                'bg-gradient-to-r from-[#8c5cff] to-[#6e3fff]',
                'hover:from-[#9d6fff] hover:to-[#7e50ff]',
                'shadow-[0_8px_24px_rgba(140,92,255,0.35)]',
                'active:scale-[0.98] transition-all duration-200'
              )}
            >
              {cta}
            </button>
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-2xl text-[13px] font-medium text-muted hover:text-foreground hover:bg-foreground/5 transition-all duration-200 cursor-pointer"
            >
              Dismiss
            </button>
          </div>

        </div>

        {/* Bottom subtle gradient */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#8c5cff]/20 to-transparent" />
      </div>
    </div>
  );
}
