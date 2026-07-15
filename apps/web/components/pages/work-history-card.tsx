'use client';

import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface JobListing {
  title: string;
  startDate: string;
  endDate: string;
  feedback: string;
  amount: string;
  rate: string;
  hours: string;
}

const COMPLETED_JOBS: JobListing[] = [
  {
    title: 'Wordpress review sites SEO cleanup - help needed with Google Search console & general audit.',
    startDate: 'Feb 6, 2023',
    endDate: 'Feb 18, 2023',
    feedback: 'No feedback given',
    amount: '$300.00',
    rate: '$60.00',
    hours: '5 hours',
  },
  {
    title: 'Wordpress review sites SEO cleanup - help needed with Google Search console & general audit.',
    startDate: 'Feb 6, 2023',
    endDate: 'Feb 18, 2023',
    feedback: 'No feedback given',
    amount: '$300.00',
    rate: '$60.00',
    hours: '5 hours',
  },
];

const IN_PROGRESS_JOBS: JobListing[] = [
  {
    title: 'Next.js Frontend optimization and API integration support.',
    startDate: 'Jan 10, 2024',
    endDate: 'Present',
    feedback: 'In progress',
    amount: '$1,200.00',
    rate: '$75.00',
    hours: '16 hours',
  },
];

export default function WorkHistoryCard() {
  const [activeTab, setActiveTab] = useState<'completed' | 'progress'>('completed');
  const { toast } = useToast();

  const jobs = activeTab === 'completed' ? COMPLETED_JOBS : IN_PROGRESS_JOBS;

  return (
    <div className="bg-card border border-card-border flex flex-col gap-[20px] items-start p-[24px] rounded-[12px] w-full shrink-0">
      
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <p className="font-bold text-foreground text-[18px] leading-normal">
          Work History
        </p>
        <button
          type="button"
          onClick={() => toast('More work history options', 'success')}
          className="border border-border flex items-center justify-center rounded-[16px] size-[32px] text-muted hover:text-foreground hover:border-primary/55 transition-colors cursor-pointer"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-[24px] items-end w-full border-b border-card-border">
        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className="flex flex-col gap-[8px] items-center relative cursor-pointer pb-[10px]"
        >
          <p className={`font-semibold text-[14px] leading-normal transition-colors ${
            activeTab === 'completed' ? 'text-foreground' : 'text-muted hover:text-foreground'
          }`}>
            Completed jobs (69)
          </p>
          {activeTab === 'completed' && (
            <div className="bg-primary h-[2px] absolute bottom-0 left-0 w-full rounded-full z-10" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('progress')}
          className="flex flex-col gap-[8px] items-center relative cursor-pointer pb-[10px]"
        >
          <p className={`font-semibold text-[14px] leading-normal transition-colors ${
            activeTab === 'progress' ? 'text-foreground' : 'text-muted hover:text-foreground'
          }`}>
            In progress (14)
          </p>
          {activeTab === 'progress' && (
            <div className="bg-primary h-[2px] absolute bottom-0 left-0 w-full rounded-full z-10" />
          )}
        </button>
      </div>

      {/* Job Listing List */}
      <div className="flex flex-col w-full gap-[20px]">
        {jobs.map((job, idx) => (
          <div key={idx} className="w-full flex flex-col gap-[20px]">
            {idx > 0 && <div className="h-px bg-card-border w-full" />}
            <div className="flex flex-col gap-[12px] items-start w-full">
              <p className="font-semibold leading-[1.4] text-[15px] text-foreground/80 w-full">
                {job.title}
              </p>
              <div className="flex flex-col font-normal gap-[4px] items-start leading-normal text-muted text-[13px] w-full">
                <p>
                  {job.startDate} - {job.endDate}
                </p>
                <p className="italic">
                  {job.feedback}
                </p>
              </div>
              <div className="flex items-center justify-between leading-normal pt-[8px] w-full whitespace-nowrap">
                <p className="font-bold text-foreground text-[14px]">
                  {job.amount}
                </p>
                <div className="flex gap-[4px] items-baseline">
                  <p className="font-bold text-foreground text-[14px]">
                    {job.rate}
                  </p>
                  <p className="font-normal text-muted text-[12px]">
                    /hr
                  </p>
                </div>
                <p className="font-bold text-foreground text-[14px]">
                  {job.hours}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}
