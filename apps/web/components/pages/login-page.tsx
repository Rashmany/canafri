'use client';

import { useState } from 'react';
import { Eye, EyeOff, User, Lock, Mail, Check, X } from 'lucide-react';

interface LoginPageProps {
  onRegisterClick?: () => void;
  onLoginSuccess?: () => void;
  onForgotPasswordClick?: () => void;
}

interface InputFieldProps {
  label?: string;
  icon: React.ReactNode;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  rightSlot?: React.ReactNode;
  error?: string;
}

function InputField({
  label,
  icon,
  placeholder,
  type = 'text',
  value,
  onChange,
  onFocus,
  onBlur,
  rightSlot,
  error,
}: InputFieldProps) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold text-[#a0a0a0] tracking-wide px-0.5">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3 h-[46px] w-full rounded-xl bg-[#121212] border border-[#1b1b1b] px-3.5 focus-within:border-primary/80 transition-colors">
        <span className="text-[#a0a0a0]/60 shrink-0 flex items-center">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className="flex-1 bg-transparent text-xs text-[#e0e0e0] placeholder:text-[#a0a0a0]/40 font-normal leading-[16px] outline-none min-w-0"
        />
        {rightSlot && <span className="shrink-0 flex items-center text-[#a0a0a0]/60">{rightSlot}</span>}
      </div>
      {error && <span className="text-[10px] text-red-500 px-1">{error}</span>}
    </div>
  );
}

// Sanitization Helpers
function sanitizeInput(val: string): string {
  return val.trim().replace(/[<>]/g, '');
}

export default function LoginPage({ onRegisterClick, onLoginSuccess, onForgotPasswordClick }: LoginPageProps) {
  const [identifier, setIdentifier] = useState(''); // Username or Email
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isFormValid = identifier.trim().length > 0 && password.length >= 8;

  const handleFieldChange = (field: string, value: string) => {
    // Clear errors
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

    if (field === 'identifier') {
      let val = value;
      // Auto-prepend @ if user is typing username handle (doesn't contain @ email sign)
      if (val.length > 0 && !val.includes('@') && !val.startsWith('@')) {
        // If they just typed a letter, we can prepend @
        val = '@' + val;
      }
      setIdentifier(val);
    }
    if (field === 'password') setPassword(value);
  };

  const handleIdentifierFocus = () => {
    if (identifier === '') {
      setIdentifier('@');
    }
  };

  const handleIdentifierBlur = () => {
    if (identifier === '@') {
      setIdentifier('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const cleanIdentifier = sanitizeInput(identifier);

    if (!cleanIdentifier || cleanIdentifier === '@') {
      newErrors.identifier = 'Username or Email is required.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onLoginSuccess?.();
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-stretch min-h-screen bg-[#080808] text-white w-full max-w-md mx-auto md:max-w-none">
      
      {/* LEFT SIDE: Login Form (w-full on mobile, w-1/2 split on desktop) */}
      <div className="flex flex-col w-full md:w-1/2 bg-[#080808] md:bg-[#0b0b0b] items-center justify-center min-h-screen md:min-h-0 py-8">
        
        {/* Mobile Logo (hidden on desktop) */}
        <div className="flex items-center justify-center pb-8 shrink-0 md:hidden">
          <svg width="102" height="23" viewBox="0 0 102 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="18" fontFamily="Inter" fontWeight="700" fontSize="20" fill="#8C5CFF" letterSpacing="-0.5">canafri</text>
            <line x1="0" y1="22" x2="102" y2="22" stroke="#8C5CFF" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Card Sheet */}
        <div className="flex flex-col items-center w-full bg-[#0b0b0b] border-t md:border-t-0 border-[#121212] rounded-tl-[45px] rounded-tr-[45px] md:rounded-none pt-7 md:pt-0 px-6 pb-10 max-w-sm md:w-[428px]">
          
          <div className="flex flex-col gap-6 w-full flex-1">

            {/* Header */}
            <div className="flex flex-col items-center gap-1.5">
              <h1 className="text-[32px] font-bold leading-[38px] tracking-[-0.18px] text-white/95 text-center">
                Login
              </h1>
              <p className="text-[13px] font-normal leading-[20px] text-[#a0a0a0] text-center">
                Login to your account
              </p>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4.5 w-full">
              {/* Identifier (Username or Email) */}
              <InputField
                label="Username or Email"
                icon={<User size={16} strokeWidth={1.5} />}
                placeholder="e.g., @johndoe123 or johndoe@gmail.com"
                value={identifier}
                onChange={(val) => handleFieldChange('identifier', val)}
                onFocus={handleIdentifierFocus}
                onBlur={handleIdentifierBlur}
                error={errors.identifier}
              />

              {/* Password */}
              <div className="w-full flex flex-col gap-1">
                <InputField
                  label="Password"
                  icon={<Lock size={16} strokeWidth={1.5} />}
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(val) => handleFieldChange('password', val)}
                  error={errors.password}
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                    </button>
                  }
                />
                
                {/* Forgot Password Link */}
                <div className="flex justify-end px-1 mt-1">
                  <button
                    type="button"
                    onClick={onForgotPasswordClick}
                    className="text-[11px] text-primary hover:underline font-medium bg-transparent border-none cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid}
                className="w-full h-[40px] bg-primary rounded-[12px] text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer mt-4 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100"
              >
                Login
              </button>

              {/* Browse as Guest Link */}
              <button
                type="button"
                onClick={onLoginSuccess}
                className="text-xs text-[#a0a0a0]/80 hover:text-white hover:underline transition-colors text-center cursor-pointer mt-1 block w-full bg-transparent border-none py-1"
              >
                Browse as Guest
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-2.5 w-full mt-2">
              <div className="flex-1 h-px bg-[#242424]" />
              <span className="text-[12px] font-normal text-[#a0a0a0]/80 leading-[18px] shrink-0">Continue With</span>
              <div className="flex-1 h-px bg-[#242424]" />
            </div>

            {/* Social Auth Icons */}
            <div className="flex items-center justify-center gap-6">
              {/* Google */}
              <button
                type="button"
                className="border border-primary/40 hover:border-primary rounded-[12.5px] w-[32px] h-[32px] flex items-center justify-center hover:bg-primary/10 active:scale-95 transition-all cursor-pointer"
                aria-label="Continue with Google"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>

              {/* Apple */}
              <button
                type="button"
                className="border border-primary/40 hover:border-primary rounded-[12.5px] w-[32px] h-[32px] flex items-center justify-center hover:bg-primary/10 active:scale-95 transition-all cursor-pointer"
                aria-label="Continue with Apple"
              >
                <svg width="15" height="18" viewBox="0 0 814 1000" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105.4-57.4-155.5-127.4C46 790.3 0 682 0 578c0-178.4 116.1-272.5 230.4-272.5 61.4 0 112.7 40.8 150.9 40.8 36.5 0 94.1-43.4 165.9-43.4 25.9 0 108.2 2.6 166.4 97.9zm-234.4-181.6c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
                </svg>
              </button>
            </div>

            {/* Register Link */}
            <p className="text-[13px] font-normal leading-[20px] text-center mt-auto">
              <span className="text-[#a0a0a0]">Not a member yet? </span>
              <button
                type="button"
                onClick={onRegisterClick}
                className="text-primary font-semibold hover:underline cursor-pointer bg-transparent border-none"
              >
                Register
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
