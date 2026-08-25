'use client';

import { CheckCircle2 } from 'lucide-react';
import AuthSplitLayout from '@/components/auth-split-layout';

interface PasswordUpdatedPageProps {
  onSignInClick?: () => void;
}

export default function PasswordUpdatedPage({ onSignInClick }: PasswordUpdatedPageProps) {
  return (
    <AuthSplitLayout>
      <div className="flex flex-col items-center justify-center w-full min-h-screen md:min-h-0 px-6 py-10 md:py-12">
        {/* Mobile: ambient glows (hidden on md+) */}
        <div className="md:hidden absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Card Sheet */}
        <div className="relative flex flex-col items-center w-full bg-transparent pt-0 px-0 pb-10 max-w-[400px]">
          <div className="flex flex-col gap-8 w-full flex-1">

            {/* Success Content */}
            <div className="flex flex-col items-center gap-4 text-center mt-2">
              <div className="flex items-center justify-center size-20 rounded-full bg-[#00C853]/10 text-[#00C853] animate-bounce">
                <CheckCircle2 size={42} strokeWidth={1.5} />
              </div>
              
              <div className="flex flex-col gap-2">
                <h1 className="text-[28px] md:text-[32px] font-bold leading-[34px] md:leading-[38px] tracking-[-0.18px] text-white/95">
                  Password Updated
                </h1>
                <p className="text-[13px] leading-5 text-[#a0a0a0] px-4 font-normal">
                  Your password has been changed successfully. <br />
                  Please sign in with your new password.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-6 w-full mt-2">
              <button
                type="button"
                onClick={onSignInClick}
                className="w-full h-[44px] bg-primary rounded-xl text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
              >
                Sign In
              </button>
            </div>

            {/* Security Disclaimer Note */}
            <div className="mt-4 px-4 text-center">
              <p className="text-[11px] leading-4 text-[#a0a0a0]/60 font-light">
                Your CanaFri password was changed successfully. <br />
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
    </AuthSplitLayout>
  );
}
