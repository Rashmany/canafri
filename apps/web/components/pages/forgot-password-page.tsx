'use client';

import { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';

interface ForgotPasswordPageProps {
  onBack?: () => void;
  onEmailSubmit?: (email: string) => void;
}

function sanitizeInput(val: string): string {
  return val.trim().replace(/[<>]/g, '');
}

function validateEmail(val: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(val);
}

export default function ForgotPasswordPage({ onBack, onEmailSubmit }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const isFormValid = validateEmail(email.trim());

  const handleChange = (val: string) => {
    setEmail(val);
    if (error) setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeInput(email);

    if (!clean) {
      setError('Email address is required.');
      return;
    }
    if (!validateEmail(clean)) {
      setError('Please enter a valid email address.');
      return;
    }

    onEmailSubmit?.(clean);
  };

  return (
    <div className="flex flex-col md:flex-row items-stretch min-h-screen bg-[#080808] text-white w-full max-w-md mx-auto md:max-w-none">
      
      {/* LEFT SIDE: Reset Password Form (w-full on mobile, w-1/2 split on desktop) */}
      <div className="flex flex-col w-full md:w-1/2 bg-[#080808] md:bg-[#0b0b0b] items-center justify-center min-h-screen md:min-h-0 py-8 relative">
        
        {/* Back navigation - absolute or relative at the top */}
        <div className="absolute top-6 left-6 z-10">
          <button
            onClick={onBack}
            className="flex items-center justify-center size-10 rounded-xl bg-[#121212] border border-[#1b1b1b] text-[#a0a0a0] hover:text-white transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Mobile Logo (hidden on desktop) */}
        <div className="flex items-center justify-center pb-8 shrink-0 md:hidden mt-10">
          <svg width="102" height="23" viewBox="0 0 102 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="18" fontFamily="Inter" fontWeight="700" fontSize="20" fill="#8C5CFF" letterSpacing="-0.5">canafri</text>
            <line x1="0" y1="22" x2="102" y2="22" stroke="#8C5CFF" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Card Sheet */}
        <div className="flex flex-col items-center w-full bg-[#0b0b0b] border-t md:border-t-0 border-[#121212] rounded-tl-[45px] rounded-tr-[45px] md:rounded-none pt-10 md:pt-0 px-6 pb-12 max-w-sm md:w-[428px]">
          
          <div className="flex flex-col gap-8 w-full flex-1">

            {/* Icon and Description */}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary">
                <Mail size={32} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold leading-8 text-white/90">
                  Reset Password
                </h1>
                <p className="text-xs leading-5 text-[#a0a0a0] px-2">
                  Enter the email address linked to your account and we'll send you a verification code to reset your password.
                </p>
              </div>
            </div>

            {/* Email Input Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">

              {/* Email Field */}
              <div className="w-full flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#a0a0a0] tracking-wide px-0.5">
                  Email Address
                </label>
                <div className="flex items-center gap-3 h-[46px] w-full rounded-xl bg-[#121212] border border-[#1b1b1b] px-3.5 focus-within:border-primary/80 transition-colors">
                  <span className="text-[#a0a0a0]/60 shrink-0 flex items-center">
                    <Mail size={16} strokeWidth={1.5} />
                  </span>
                  <input
                    type="email"
                    placeholder="e.g., johndoe@gmail.com"
                    value={email}
                    onChange={(e) => handleChange(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-[#e0e0e0] placeholder:text-[#a0a0a0]/40 font-normal leading-[16px] outline-none min-w-0"
                    autoFocus
                  />
                </div>
                {error && <span className="text-[10px] text-red-500 px-1">{error}</span>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid}
                className="w-full h-[44px] bg-primary rounded-xl text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer mt-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100"
              >
                Send Reset Code
              </button>
            </form>

            {/* Back to Login link */}
            <p className="text-[13px] font-normal leading-[20px] text-center mt-auto">
              <span className="text-[#a0a0a0]">Remember your password? </span>
              <button
                type="button"
                onClick={onBack}
                className="text-primary font-semibold hover:underline cursor-pointer bg-transparent border-none"
              >
                Login
              </button>
            </p>

          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Info Illustration panel (desktop/tablet md: and up only) */}
      <div className="hidden md:flex md:w-1/2 flex-col items-center justify-between p-12 bg-[#0b0b0b] border-l border-[#242424] self-stretch">
        
        {/* Logo at top-left */}
        <div className="w-full flex justify-start pl-6">
          <svg width="102" height="23" viewBox="0 0 102 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="18" fontFamily="Inter" fontWeight="700" fontSize="20" fill="#8C5CFF" letterSpacing="-0.5">canafri</text>
            <line x1="0" y1="22" x2="102" y2="22" stroke="#8C5CFF" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Connected illustration placeholder representing Growth, Revenue, Gigs */}
        <div className="flex-1 flex items-center justify-center max-w-[420px] max-h-[420px] my-10 select-none">
          <svg width="340" height="340" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-primary">
            {/* Background grid */}
            <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" className="opacity-15"/>
            <circle cx="100" cy="100" r="55" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" className="opacity-20"/>
            <circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="0.5" className="opacity-25"/>
            
            {/* Center node */}
            <circle cx="100" cy="100" r="14" fill="currentColor" className="opacity-10"/>
            <circle cx="100" cy="100" r="8" fill="currentColor"/>
            
            {/* Connected nodes */}
            <g className="opacity-80">
              <line x1="100" y1="100" x2="145" y2="70" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="145" cy="70" r="5" fill="#00C853"/>
              
              <line x1="100" y1="100" x2="60" y2="65" stroke="currentColor" strokeWidth="1"/>
              <circle cx="60" cy="65" r="4" fill="currentColor"/>
              
              <line x1="100" y1="100" x2="70" y2="140" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="70" cy="140" r="5" fill="#00C853"/>

              <line x1="100" y1="100" x2="135" y2="135" stroke="currentColor" strokeWidth="1"/>
              <circle cx="135" cy="135" r="4.5" fill="currentColor"/>
            </g>

            {/* Orbital path and satellites */}
            <path d="M 100,100 m -55,0 a 55,55 0 1,0 110,0 a 55,55 0 1,0 -110,0" stroke="currentColor" strokeWidth="0.5" className="opacity-30"/>
            <circle cx="138" cy="60" r="2.5" fill="currentColor"/>
            <circle cx="58" cy="130" r="3" fill="#8C5CFF"/>
          </svg>
        </div>

        {/* Footer text */}
        <p className="text-[13px] font-normal leading-[20px] text-center text-[#a0a0a0] max-w-sm px-6">
          Find jobs, hire experts, and build meaningful connections in one powerful platform.
        </p>

      </div>

    </div>
  );
}
