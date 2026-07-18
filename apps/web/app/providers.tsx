'use client';

import { useState, useEffect, useRef } from 'react';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from '@/components/theme-provider';

// Animated spanner/wrench SVG
function SpannerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M54.9 9.1a13.5 13.5 0 0 0-18.3 18.8L10 54.5a3.5 3.5 0 0 0 4.9 4.9l26.7-26.6A13.5 13.5 0 0 0 54.9 9.1zM44 20a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
        fill="currentColor"
      />
    </svg>
  );
}

function MaintenanceScreen({ msg }: { msg: string }) {
  const spannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame: number;
    let angle = 0;
    const animate = () => {
      angle = (angle + 0.15) % 360;
      if (spannerRef.current) {
        spannerRef.current.style.transform = `rotate(${angle}deg)`;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden font-sans"
      style={{ backgroundColor: '#080808' }}
    >
      {/* Purple radial glow — top right, fluid size across all breakpoints */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-60px',
          right: '-20px',
          width: 'clamp(160px, 40vw, 529px)',
          height: 'clamp(180px, 42vw, 553px)',
          background: 'radial-gradient(ellipse at center, rgba(140,92,255,0.28) 0%, rgba(140,92,255,0.08) 50%, transparent 75%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Animated spanner overlay — visible on all screen sizes, smaller on mobile */}
      <div
        ref={spannerRef}
        className="absolute pointer-events-none"
        style={{
          top: 'clamp(-30px, -3vw, -80px)',
          right: 'clamp(4px, 1.5vw, 20px)',
          width: 'clamp(100px, 22vw, 360px)',
          height: 'clamp(100px, 22vw, 360px)',
          color: 'rgba(140,92,255,0.10)',
        }}
      >
        <SpannerIcon className="w-full h-full" />
      </div>

      {/* Center content wrapper */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-[720px] px-5 py-12 sm:px-10 sm:py-16 md:py-20 gap-8 sm:gap-10 md:gap-12">

        {/* Illustration card — scales from mobile → tablet → desktop */}
        <div
          className="rounded-[16px] sm:rounded-[20px] md:rounded-[24px] overflow-hidden flex items-center justify-center w-full shrink-0"
          style={{
            maxWidth: '400px',
            aspectRatio: '4 / 3',
            backgroundColor: '#0b0b0b',
            border: '1px solid #242424',
            boxShadow: '0px 20px 40px 0px rgba(0,0,0,0.5)',
          }}
        >
          {/* Illustration placeholder — replace with <img> when asset is ready */}
          <div className="flex flex-col items-center gap-4 opacity-30">
            <SpannerIcon className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-[#8C5CFF]" />
          </div>
        </div>

        {/* Typography stack */}
        <div className="flex flex-col items-center gap-3 sm:gap-4 text-center w-full">

          {/* "This Site is Currently" */}
          <p
            className="font-extrabold w-full leading-tight"
            style={{
              fontSize: 'clamp(28px, 6.5vw, 48px)',
              letterSpacing: '-1.5px',
              color: '#f5f5f7',
              lineHeight: 1.1,
            }}
          >
            This{' '}
            <span style={{ color: '#8c5cff' }}>Site</span>
            {' '}is Currently
          </p>

          {/* "Down For Maintenance" */}
          <p
            className="font-bold w-full leading-tight"
            style={{
              fontSize: 'clamp(24px, 5.8vw, 44px)',
              letterSpacing: '-1px',
              color: '#86868b',
              lineHeight: 1.1,
            }}
          >
            Down For Maintenance
          </p>

          {/* Description / Admin message */}
          <p
            className="font-normal w-full"
            style={{
              fontSize: 'clamp(13px, 2.2vw, 16px)',
              lineHeight: 'clamp(22px, 3.5vw, 26px)',
              color: '#6e6e73',
              maxWidth: '600px',
            }}
          >
            {msg || 'We are performing scheduled maintenance to improve system performance and reliability. We expect to be back online shortly. Thank you for your patience.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function MaintenanceWrapper({ children }: { children: React.ReactNode }) {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const [isAdminPath, setIsAdminPath] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkPath = () => {
      setIsAdminPath(window.location.pathname.startsWith('/admin'));
    };
    checkPath();

    const checkMaintenance = () => {
      const active = localStorage.getItem('canafri_maintenance_active') === 'true';
      const msg = localStorage.getItem('canafri_maintenance_message') || '';
      setIsMaintenance(active);
      setMaintenanceMsg(msg);
    };
    checkMaintenance();

    const handleStorageChange = () => checkMaintenance();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('canafri_maintenance_change', handleStorageChange);

    const interval = setInterval(checkPath, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('canafri_maintenance_change', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  if (isMaintenance && !isAdminPath) {
    return <MaintenanceScreen msg={maintenanceMsg} />;
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MaintenanceWrapper>{children}</MaintenanceWrapper>
      </ToastProvider>
    </ThemeProvider>
  );
}
