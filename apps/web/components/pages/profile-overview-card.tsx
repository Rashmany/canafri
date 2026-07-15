'use client';

import {
  DollarSign,
  Wallet,
  Briefcase,
  Clock,
  CheckCircle2,
  Star,
  CheckCircle,
  Info,
  Pencil,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

function DoneOutlined() {
  return (
    <div className="overflow-clip relative shrink-0 size-[24px] flex items-center justify-center">
      <CheckCircle size={22} className="text-[#4ade80]" strokeWidth={1.5} />
    </div>
  );
}

function LanguageBar({ level }: { level: string }) {
  const pct =
    level === 'Native' ? 100 :
    level === 'Fluent' ? 85 :
    level === 'Conversational' ? 60 :
    level === 'Beginner' ? 30 : 50;
  return (
    <div className="flex items-center gap-[8px] w-[120px]">
      <div className="flex-1 h-[4px] rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-medium text-[10px] text-muted whitespace-nowrap">{pct}%</span>
    </div>
  );
}

function StatRow({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex gap-[12px] items-center shrink-0 w-full">
      <div className="bg-background flex items-center justify-center rounded-[8px] shrink-0 size-[40px]">
        {icon}
      </div>
      <div className="flex flex-col gap-[2px] flex-1 min-w-0">
        <p className="font-semibold text-[14px] text-foreground/80 leading-normal">{value}</p>
        <p className="font-medium text-[12px] text-muted leading-normal">{label}</p>
      </div>
    </div>
  );
}

export default function ProfileOverviewCard() {
  const { toast } = useToast();
  return (
    <div className="bg-background flex flex-col gap-[24px] items-start p-[24px] w-full">

      <div className="overflow-x-auto no-scrollbar w-full">
        <div className="flex gap-[24px] items-start min-w-[800px] w-full">

          <div className="flex flex-1 min-w-0 flex-col">
            <div className="bg-card border border-card-border flex flex-col gap-[24px] items-start p-[24px] rounded-[16px] shrink-0 w-full">
              <p className="font-semibold text-[18px] text-foreground/80 leading-normal w-full">Profile overview</p>
              <div className="flex flex-col gap-[16px] items-start w-full">
                <StatRow icon={<DollarSign size={20} className="text-muted" strokeWidth={1.5} />} value="$50.00/hr" label="Hourly rate" />
                <StatRow icon={<Wallet size={20} className="text-muted" strokeWidth={1.5} />} value="$20K+" label="Total earnings" />
                <StatRow icon={<Briefcase size={20} className="text-muted" strokeWidth={1.5} />} value="48" label="Total jobs" />
                <StatRow icon={<Clock size={20} className="text-muted" strokeWidth={1.5} />} value="2,350" label="Total hours" />
                <StatRow icon={<CheckCircle2 size={20} className="text-muted" strokeWidth={1.5} />} value="100%" label="Job success" />
              </div>
              <div className="h-px bg-card-border w-full shrink-0" />
              <div className="flex gap-[12px] items-center shrink-0 w-full">
                <Star size={24} className="text-yellow-400 fill-yellow-400 shrink-0" />
                <div className="flex flex-col gap-[2px] flex-1 min-w-0">
                  <p className="font-semibold text-[14px] text-foreground/80 leading-normal">Top Rated Plus</p>
                  <p className="font-medium text-[12px] text-muted leading-normal">Top 3% of freelancers</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-1 min-w-0 flex-col gap-[24px] self-stretch">
            <div className="bg-card border border-card-border flex flex-col gap-[16px] items-start p-[24px] rounded-[16px] shrink-0 w-full">
              <p className="font-medium text-[13px] text-foreground/80 leading-[18px] whitespace-nowrap">Verification</p>
              {['Email Verified', 'ID Verified', 'Phone Verified', 'Payment Verified'].map((item) => (
                <div key={item} className="flex gap-[16px] items-center shrink-0 w-full">
                  <DoneOutlined />
                  <p className="font-medium text-[13px] text-muted leading-[18px] whitespace-nowrap">{item}</p>
                </div>
              ))}
            </div>
            <div className="bg-card border border-card-border flex flex-1 min-h-0 flex-col gap-[16px] items-start p-[24px] rounded-[16px] w-full">
              <div className="flex items-center justify-between w-full">
                <p className="font-semibold text-[18px] text-foreground/80 leading-normal">Availability</p>
                <button
                  type="button"
                  onClick={() => toast('Edit availability & response time', 'success')}
                  className="flex items-center gap-[6px] px-[10px] h-[28px] rounded-[6px] border border-border text-[11px] text-muted hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
                  title="Edit availability"
                >
                  <Pencil size={11} />
                  Edit
                </button>
              </div>
              <div className="bg-[#304437]/10 dark:bg-[#304437] flex items-center px-[12px] py-[6px] rounded-full shrink-0">
                <p className="font-bold text-[12px] text-green-600 dark:text-[#4ade80] whitespace-nowrap leading-normal">Available</p>
              </div>
              <div className="flex flex-col gap-[4px] items-start w-full">
                <p className="font-semibold text-[14px] text-foreground/80 leading-normal">As needed - open to offers</p>
                <div className="flex gap-[4px] items-center">
                  <p className="font-normal text-[14px] text-muted whitespace-nowrap leading-normal">{'< 24 hrs'}</p>
                  <p className="font-medium text-[12px] text-muted whitespace-nowrap leading-normal">Response time</p>
                  <Info size={14} className="text-muted shrink-0" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="bg-card border border-card-border flex flex-col gap-[20px] items-start p-[24px] rounded-[16px] shrink-0 w-full">
        <div className="flex items-center justify-between w-full">
          <p className="font-semibold text-[18px] text-foreground/80 leading-normal">Languages</p>
          <button
            type="button"
            onClick={() => toast('Edit languages & proficiency levels', 'success')}
            className="flex items-center gap-[6px] px-[10px] h-[28px] rounded-[6px] border border-border text-[11px] text-muted hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
            title="Edit languages"
          >
            <Pencil size={11} />
            Edit
          </button>
        </div>
        <div className="flex flex-col gap-[12px] items-start w-full">
          {[
            { lang: 'English', level: 'Native' },
            { lang: 'Yoruba', level: 'Native' },
            { lang: 'Yoruba', level: 'Conversational' },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between shrink-0 w-full">
              <div className="flex gap-[8px] items-baseline whitespace-nowrap">
                <p className="font-semibold text-[14px] text-foreground/80">{row.lang}</p>
                <p className="font-medium text-[12px] text-muted">{row.level}</p>
              </div>
              <LanguageBar level={row.level} />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}