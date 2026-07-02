'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  /** Show a toast. Defaults to 'success'. Auto-dismisses after 3.5 s. */
  toast: (message: string, variant?: ToastVariant) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ─── Visual config per variant ────────────────────────────────────────────────

const VARIANT_CONFIG: Record<
  ToastVariant,
  { Icon: React.ElementType; bar: string; ring: string; iconColor: string }
> = {
  success: {
    Icon: CheckCircle2,
    bar: 'bg-emerald-500',
    ring: 'ring-emerald-500/25',
    iconColor: 'text-emerald-400',
  },
  error: {
    Icon: AlertCircle,
    bar: 'bg-red-500',
    ring: 'ring-red-500/25',
    iconColor: 'text-red-400',
  },
  info: {
    Icon: Info,
    bar: 'bg-[#8C5CFF]',
    ring: 'ring-[#8C5CFF]/25',
    iconColor: 'text-[#AC8EF3]',
  },
};

const DURATION_MS = 3500;

// ─── Single toast card ────────────────────────────────────────────────────────

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const { Icon, bar, ring, iconColor } = VARIANT_CONFIG[item.variant];

  return (
    <div
      className={[
        // Base card
        'relative flex w-full max-w-[22rem] items-start gap-3 overflow-hidden',
        'rounded-2xl border border-white/10 bg-[#111111]/95 px-4 py-3.5 shadow-2xl',
        'backdrop-blur-xl ring-1',
        ring,
        // Slide-in animation (uses CSS keyframes in globals.css)
        'animate-toast-in',
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      {/* Coloured progress bar at the very bottom */}
      <span
        className={['absolute bottom-0 left-0 h-[2px] rounded-full', bar, 'animate-toast-bar'].join(' ')}
        style={{ animationDuration: `${DURATION_MS}ms` }}
      />

      {/* Icon */}
      <div className={['mt-0.5 shrink-0', iconColor].join(' ')}>
        <Icon size={18} strokeWidth={2} />
      </div>

      {/* Text */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="font-sans text-[13px] font-semibold text-white leading-snug">
          {item.variant === 'success' ? 'Action Successful' : item.variant === 'error' ? 'Something went wrong' : 'Notice'}
        </p>
        <p className="font-sans text-[11px] text-white/60 leading-snug">{item.message}</p>
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        className="mt-0.5 shrink-0 rounded-full p-0.5 text-white/30 transition-colors hover:text-white/70"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
      timers.current[id] = setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast stack — bottom-right on desktop, bottom-centre on mobile */}
      <div
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-6 right-4 z-[300] flex flex-col gap-3 items-end sm:right-6"
      >
        {toasts.map((item) => (
          <div key={item.id} className="pointer-events-auto w-full max-w-[22rem]">
            <ToastCard item={item} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
