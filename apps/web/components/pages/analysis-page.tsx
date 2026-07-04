'use client';

import { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  Lock,
  CheckCircle,
  PenTool,
  UserCheck,
  Briefcase,
  UserPlus,
  Coins,
  ArrowUpRight,
  ChevronLeft,
} from 'lucide-react';
import { AnalysisPageSkeleton } from '@/components/ui/skeleton';

// ─── Shared Primitives ────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-2xl border border-border bg-card ${className}`}>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full shrink-0 bg-border" />;
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, sub, subColor = 'var(--muted)', icon }: StatCardProps) {
  return (
    <Card className="flex items-start justify-between gap-3 p-6 min-w-0 flex-1">
      <div className="flex flex-col gap-2 min-w-0">
        <p className="font-sans text-[13px] font-medium leading-[18px] text-muted">{label}</p>
        <p className="font-sans text-[22px] font-medium leading-[26px] tracking-[-0.066px] text-foreground">{value}</p>
        <p className="font-sans text-[11px] leading-[16px]" style={{ color: subColor }}>{sub}</p>
      </div>
      <div className="mt-1 shrink-0 text-foreground">{icon}</div>
    </Card>
  );
}

// ─── Quick Action Cards ───────────────────────────────────────────────────────

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  sub: string;
}

function QuickActionCard({ icon, title, sub }: QuickActionCardProps) {
  return (
    <Card className="flex h-[100px] items-center gap-4 p-5 min-w-0 flex-1 hover:border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/5 transition-all duration-200 cursor-pointer">
      <div className="flex size-[45px] shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
        {icon}
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <p className="font-sans text-[13px] font-medium leading-[18px] text-foreground truncate">{title}</p>
        <p className="font-sans text-[13px] font-medium leading-[18px] text-muted truncate">{sub}</p>
      </div>
    </Card>
  );
}

// ─── CTA Cards ────────────────────────────────────────────────────────────────

interface CTACardProps {
  title: string;
  sub: string;
  btnLabel: string;
}

function CTACard({ title, sub, btnLabel }: CTACardProps) {
  return (
    <Card className="flex h-[100px] items-center justify-between gap-4 px-4 py-5 min-w-0 flex-1">
      <div className="flex flex-col gap-2 min-w-0">
        <p className="font-sans text-[22px] font-medium leading-[26px] tracking-[-0.066px] text-foreground truncate">{title}</p>
        <p className="font-sans text-[13px] font-medium leading-[18px] text-muted truncate">{sub}</p>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-xl bg-primary px-4 py-2.5 font-sans text-[13px] font-semibold leading-[18px] text-white transition-colors hover:bg-primary-hover active:scale-[0.98] cursor-pointer"
      >
        {btnLabel}
      </button>
    </Card>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

interface FeedItem {
  icon: React.ReactNode;
  title: string;
  sub: string;
  time: string;
}

function FeedRow({ icon, title, sub, time }: FeedItem) {
  return (
    <div className="flex items-start justify-between gap-3 w-full min-w-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex size-[45px] shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
          {icon}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <p className="font-sans text-[13px] font-medium leading-[18px] text-foreground truncate">{title}</p>
          <p className="font-sans text-[13px] font-medium leading-[18px] text-muted truncate">{sub}</p>
        </div>
      </div>
      <p className="font-sans text-[13px] font-medium leading-[18px] text-foreground shrink-0 whitespace-nowrap mt-1">{time}</p>
    </div>
  );
}

function FeedCard({ title, items }: { title: string; items: FeedItem[] }) {
  return (
    <Card className="flex flex-col gap-5 p-[35px] min-w-0 flex-1">
      <p className="font-sans text-[22px] font-medium leading-[26px] tracking-[-0.066px] text-foreground">{title}</p>
      <div className="flex flex-col gap-5">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col gap-5">
            {i > 0 && <Divider />}
            <FeedRow {...item} />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function FooterLink({ label }: { label: string }) {
  return (
    <span className="cursor-pointer font-sans text-[10px] leading-[13px] text-muted transition-colors hover:text-foreground">
      {label}
    </span>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="font-sans text-[14px] font-medium leading-[20px] text-foreground">{title}</p>
        <div className="h-px w-[42px] bg-primary" />
      </div>
      <div className="flex flex-col gap-1.5">
        {links.map((l) => (
          <FooterLink key={l} label={l} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

interface AnalysisPageProps {
  onBack?: () => void;
}

export default function AnalysisPage({ onBack }: AnalysisPageProps) {
  const [loading, setLoading] = useState(true);

  // Skeleton loading: clears after mount; swap setTimeout for API finally() when real data arrives
  useEffect(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t); }, []);
  if (loading) return <AnalysisPageSkeleton />;

  const subscribeItems: FeedItem[] = [
    {
      icon: <PenTool size={20} strokeWidth={1.5} />,
      title: 'Published new article',
      sub: 'The Future of Decentralized Work',
      time: '2h ago',
    },
    {
      icon: <UserPlus size={20} strokeWidth={1.5} />,
      title: 'New subscription received',
      sub: 'From @michaeld',
      time: '2h ago',
    },
    {
      icon: <Coins size={20} strokeWidth={1.5} />,
      title: 'Earned 25.00 CC',
      sub: 'From article views',
      time: '2h ago',
    },
    {
      icon: <Briefcase size={20} strokeWidth={1.5} />,
      title: 'Applied for job',
      sub: 'Design logo for DeFi project',
      time: '2h ago',
    },
  ];

  const contentItems: FeedItem[] = [
    {
      icon: <ArrowUpRight size={20} className="text-[#8C5CFF]" />,
      title: 'What is Canton Coin?',
      sub: 'Admin. 5 min read',
      time: '2h ago',
    },
    {
      icon: <ArrowUpRight size={20} className="text-[#8C5CFF]" />,
      title: 'How to Build on Canton',
      sub: 'Tunde K. 12 min',
      time: '2h ago',
    },
    {
      icon: <ArrowUpRight size={20} className="text-[#8C5CFF]" />,
      title: 'DeFi vs TradFi Explained',
      sub: 'Amara C. 8 min',
      time: '2h ago',
    },
    {
      icon: <ArrowUpRight size={20} className="text-[#8C5CFF]" />,
      title: 'Canton Network Basics',
      sub: 'Admin. 6 min',
      time: '2h ago',
    },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-y-auto no-scrollbar">
      {/* Main content */}
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 md:block">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-foreground/10 transition-colors md:hidden"
                aria-label="Go back"
              >
                <ChevronLeft className="size-5 text-foreground" />
              </button>
            )}
            <h1 className="font-sans text-[36px] font-bold leading-[42px] tracking-[-0.18px] text-foreground">
              Analysis
            </h1>
          </div>
          <p className="mt-4 font-sans text-[24px] leading-[16px] text-muted">Hello! @Joshtrek</p>
        </div>

        {/* Stat cards — 1 col mobile, 2 col sm, 4 col lg */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <StatCard
            label="Wallet Balance"
            value="5,250 CC"
            sub="~ $1,200.00"
            icon={<Wallet size={20} strokeWidth={1.5} />}
          />
          <StatCard
            label="CC Earned"
            value="2,250 CC"
            sub="+18.5% this month"
            subColor="#4ade80"
            icon={<TrendingUp size={20} strokeWidth={1.5} className="text-[#4ade80]" />}
          />
          <StatCard
            label="CC Staked"
            value="100 CC"
            sub="Locked for 30 days"
            icon={<Lock size={20} strokeWidth={1.5} />}
          />
          <StatCard
            label="Subscription"
            value="Active"
            sub="Renews in 12 days"
            icon={<CheckCircle size={20} strokeWidth={1.5} className="text-[#4ade80]" />}
          />
        </div>

        {/* Quick action cards — 1 col mobile, 3 col from tablet up */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
          <QuickActionCard icon={<PenTool size={22} />} title="Publish Content" sub="Creator only" />
          <QuickActionCard icon={<UserCheck size={22} />} title="Become a Seller" sub="Offer a service" />
          <QuickActionCard icon={<Briefcase size={22} />} title="Post a Job" sub="Hire talent" />
        </div>

        {/* CTA cards — 1 col mobile, 2 col lg */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <CTACard title="Publish Content" sub="Creator only" btnLabel="Subscribe" />
          <CTACard title="Become a Creator" sub="Stake 100 CC-earn from subscribers" btnLabel="Stake" />
        </div>

        {/* Feed cards — 1 col mobile, 2 col lg */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <FeedCard title="Subscribe Activity" items={subscribeItems} />
          <FeedCard title="Content Preview" items={contentItems} />
        </div>
      </div>

      {/* Footer — hidden on mobile */}
      <footer className="hidden bg-gradient-to-tr from-[#F8FAFC] via-[#FAFAFD] to-[#F1F5F9] dark:from-[#0A0714] dark:via-[#080808] dark:to-[#110E1B] backdrop-blur-md shadow-[0_-12px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_-12px_40px_-15px_rgba(0,0,0,0.7)] px-4 py-6 md:block sm:px-8 lg:px-12">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row">
          {/* Brand */}
          <div className="flex max-w-[200px] flex-col gap-3">
            <p className="font-sans text-[36px] font-bold leading-[42px] tracking-[-0.18px] text-foreground">Canfri</p>
            <p className="font-sans text-[10px] leading-[13px] text-muted">
              Connecting talent, opportunities, content creators and businesses through the{' '}
              <span className="text-primary">CC</span> ecosystem
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-8">
            <FooterCol title="Marketplace" links={['Find Job', 'Find Talent', 'Post a Job', 'Become a Seller']} />
            <FooterCol title="Resources" links={['Help Center', 'Blog', 'Community', 'Support']} />
            <FooterCol title="Legal" links={['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Contact Us']} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-2">
          <p className="font-sans text-[10px] leading-[13px] text-muted">© 2026 Canafri. All right reserved</p>
          <p className="font-sans text-[10px] leading-[13px] text-muted">
            Powered by <span className="text-primary font-semibold">CC</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
