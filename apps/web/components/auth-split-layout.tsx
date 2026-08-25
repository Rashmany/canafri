'use client';

import React from 'react';
import { Logo } from '@/components/ui/logo';

interface AuthSplitLayoutProps {
  children: React.ReactNode;
}

/**
 * Two-column split layout for Login & Register on tablet/desktop.
 * - Left:  branded image placeholder + logo
 * - Right: the form content
 * - On mobile: only renders children (the form), no left panel.
 */
export default function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-[#080808] text-white font-sans">

      {/* ── LEFT PANEL (hidden on mobile, visible md+) ── */}
      <div className="hidden md:flex md:w-[47%] lg:w-[50%] xl:w-[52%] shrink-0 p-3.5 md:pr-2 lg:p-5 lg:pr-3">
        {/*
          the desktop splash page side image is here and the 
          Corner radius is rounded-[30px] as requested.
        */}
        <div className="relative w-full h-full rounded-[30px] overflow-hidden bg-[#0d0d0d] border border-[#1a1a1a] flex flex-col min-h-[calc(100vh-48px)]">

          {/*you can change the image here*/}
          <img src="/images/3dset.jpg" alt="CanaFri" className="absolute inset-0 w-full h-full object-cover" />

          {/* ── Logo — top-left corner ── */}
          <div className="relative z-10 flex justify-start p-6 lg:p-8">
            <Logo />
          </div>

        </div>
      </div>

      {/* ── RIGHT PANEL — form content ── */}
      <div className="flex flex-1 flex-col items-center justify-center min-h-screen md:min-h-0 w-full overflow-y-auto">
        {children}
      </div>

    </div>
  );
}
