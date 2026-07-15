'use client';

import { CheckCircle2 } from 'lucide-react';

interface PasswordUpdatedPageProps {
  onSignInClick?: () => void;
}

export default function PasswordUpdatedPage({ onSignInClick }: PasswordUpdatedPageProps) {
  return (
    <div className="flex flex-col items-center min-h-screen bg-[#080808] text-white w-full max-w-md mx-auto md:max-w-full">
      
      {/* Spacer Header */}
      <div className="w-full h-20 shrink-0" />

      {/* Centered Logo */}
      <div className="flex items-center justify-center pb-8 shrink-0">
        <svg width="102" height="23" viewBox="0 0 102 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="18" fontFamily="Inter" fontWeight="700" fontSize="20" fill="#8C5CFF" letterSpacing="-0.5">canafri</text>
          <line x1="0" y1="22" x2="102" y2="22" stroke="#8C5CFF" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Card Sheet */}
      <div className="flex flex-col flex-1 items-center w-full bg-[#0b0b0b] border-t border-[#121212] rounded-tl-[45px] rounded-tr-[45px] pt-12 px-6 pb-12">
        <div className="flex flex-col gap-8 w-full flex-1 max-w-sm">

          {/* Success Content */}
          <div className="flex flex-col items-center gap-4 text-center mt-6">
            <div className="flex items-center justify-center size-20 rounded-full bg-[#00C853]/10 text-[#00C853] animate-bounce">
              <CheckCircle2 size={42} strokeWidth={1.5} />
            </div>
            
            <div className="flex flex-col gap-2.5">
              <h1 className="text-xl font-bold leading-8 text-white/85 tracking-wide">
                Password Updated Successfully
              </h1>
              <p className="text-xs leading-5 text-[#a0a0a0] px-4 font-normal">
                Your password has been changed successfully. <br />
                Please sign in with your new password.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-6 w-full mt-2">
            <button
              onClick={onSignInClick}
              className="w-full h-[44px] bg-primary rounded-xl text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
            >
              Sign In
            </button>
          </div>

          {/* Security Disclaimer Note */}
          <div className="mt-auto px-4 text-center">
            <p className="text-[10px] leading-4 text-[#a0a0a0]/60 font-light">
              Your Canafri password was changed successfully. <br />
              If you did not make this change, please{' '}
              <a href="#" className="text-primary hover:underline font-normal">
                contact support
              </a>{' '}
              immediately.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
