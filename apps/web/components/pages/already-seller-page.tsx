'use client';

import {
  ChevronLeft,
  Check,
  CheckCircle2,
  ToggleRight,
  Sparkle,
  Briefcase,
  FileText,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';

interface AlreadySellerPageProps {
  /** Triggered when the user clicks "Enable Seller Mode" */
  onEnableSellerMode: () => void;
  /** Back navigation */
  onBack: () => void;
}

export default function AlreadySellerPage({ onEnableSellerMode, onBack }: AlreadySellerPageProps) {
  const completedSteps = [
    { n: 1, label: 'Personal Information' },
    { n: 2, label: 'Skills & Experience' },
    { n: 3, label: 'Review & Submitted' },
    { n: 4, label: 'Account Approved' },
  ];

  return (
    <div className="h-full w-full overflow-y-auto bg-background pb-[76px] lg:pb-12">
      <div className="mx-auto flex max-w-[1400px] flex-col items-start gap-6 px-4 py-6 lg:flex-row lg:px-8">

        {/* ── Left main column ── */}
        <div className="flex w-full flex-1 flex-col gap-6">

          {/* Back arrow + page title breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted transition-colors hover:border-primary hover:text-primary cursor-pointer"
              aria-label="Go back"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-[13px] font-semibold text-foreground">
                Become a Seller — Profile Approved
              </h1>
              <p className="text-[10px] text-muted">Step 4 of 4 · Seller Privileges Active</p>
            </div>
          </div>

          {/* Consistent Stepper Bar (All 4 Completed) */}
          <div className="flex h-[60px] w-full items-center gap-2 md:gap-3 rounded-[8px] border border-border bg-card px-[10px]">
            {completedSteps.map((step, i) => (
              <div key={step.n} className="flex flex-1 items-center gap-2 md:gap-3">
                <div className="flex flex-1 items-center gap-[5px]">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary bg-primary transition-colors">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[10px] font-medium leading-[13px] text-primary truncate">
                    {step.label}
                  </span>
                </div>
                {i < completedSteps.length - 1 && (
                  <div className="h-px flex-1 bg-primary transition-colors" />
                )}
              </div>
            ))}
          </div>

          {/* Main Hero Card */}
          <div className="flex w-full flex-col gap-6 rounded-2xl border border-border bg-card p-6 md:p-8">

            {/* Approved Hero Banner */}
            <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-primary/10 p-6">
              <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-primary/20 blur-3xl" />
              
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/20 ring-1 ring-primary/30 text-primary">
                    <Sparkle className="size-6 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[16px] font-bold text-foreground">You&apos;re Already an Approved Seller!</h2>
                      <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        Approved & Active
                      </span>
                    </div>
                    <p className="text-[12px] text-muted leading-relaxed max-w-xl">
                      Your seller application was reviewed and approved. You don&apos;t need to apply again — simply enable <strong className="text-foreground">Seller Mode</strong> to access your seller dashboard, create gigs, submit proposals, and manage client orders.
                    </p>
                  </div>
                </div>
              </div>

              {/* Main CTA */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={onEnableSellerMode}
                  className="flex items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-3.5 font-sans text-[13px] font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-[#7B4EE8] active:scale-[0.98] cursor-pointer"
                >
                  <ToggleRight size={18} />
                  Enable Seller Mode & Open Dashboard
                </button>

                <button
                  type="button"
                  onClick={onBack}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-5 py-3.5 font-sans text-[12px] font-semibold text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>

            {/* What unlocks in Seller Mode grid */}
            <div className="flex flex-col gap-4">
              <h3 className="text-[13px] font-semibold text-foreground">What Unlocks in Seller Mode?</h3>
              
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {[
                  {
                    icon: ShoppingBag,
                    title: 'Orders & Earnings View',
                    desc: 'Your main dashboard switches to active client orders, milestones, and Canton escrow earnings.',
                  },
                  {
                    icon: Briefcase,
                    title: 'My Gigs Management',
                    desc: 'Publish custom fixed-budget service offerings and manage gig packages for clients.',
                  },
                  {
                    icon: FileText,
                    title: 'Proposals & Buyer Requests',
                    desc: 'Browse open buyer project requests and send tailored fixed-budget proposals directly.',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Canton On-Chain Security',
                    desc: 'Get paid automatically via Canton smart-contract escrow upon milestone completion.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3.5 rounded-xl border border-border bg-[#F5F8FB] dark:bg-[#121212] p-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon size={18} />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <h4 className="text-[12px] font-semibold text-foreground">{item.title}</h4>
                      <p className="text-[11px] text-muted leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Toggle Helper hint */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-4 text-[12px] text-muted">
              <CheckCircle2 className="size-4 shrink-0 text-primary" />
              <span>
                Tip: You can switch between <strong className="text-foreground">Buyer</strong> and <strong className="text-foreground">Seller</strong> modes at any time using the toggle at the bottom of your sidebar.
              </span>
            </div>

          </div>

        </div>

        {/* ── Right sidebar column ── */}
        <div className="flex w-full shrink-0 flex-col gap-6 lg:w-[320px]">
          {/* Why Seller Card */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-primary/5 p-6">
            <h3 className="text-[13px] font-semibold text-primary">Seller Account Verified</h3>
            <ul className="flex flex-col gap-2 pl-0">
              {[
                'Global buyer reach enabled',
                'Fixed-budget project model',
                'Zero-fee Canton payouts',
                'On-chain trust rating active',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-[12px] text-primary/80">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <Check className="h-2.5 w-2.5 text-primary" strokeWidth={2.5} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Guide Card */}
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
            <h4 className="text-[12px] font-semibold text-foreground">Quick Start Steps</h4>
            <ul className="flex flex-col gap-2.5">
              {[
                '1. Toggle on Seller Mode',
                '2. Go to Selling -> Gigs to create your first gig',
                '3. Check Buyer Requests to submit proposals',
              ].map((step) => (
                <li key={step} className="text-[11px] text-muted leading-relaxed">
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
            <h4 className="text-[12px] font-semibold text-foreground">Need support?</h4>
            <p className="text-[11px] text-muted leading-relaxed">
              Have questions about selling on CanaFri? Contact our seller relations team.
            </p>
            <a
              href="mailto:sellers@canafri.com"
              className="mt-1 text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              sellers@canafri.com &rarr;
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
