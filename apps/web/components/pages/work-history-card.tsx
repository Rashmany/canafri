'use client';

import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export interface JobListing {
  id?: string;
  title: string;
  startDate: string;
  endDate: string;
  feedback: string;
  amount: string;
}

interface WorkHistoryCardProps {
  completedJobs?: JobListing[];
  inProgressJobs?: JobListing[];
}

export default function WorkHistoryCard({
  completedJobs = [],
  inProgressJobs = [],
}: WorkHistoryCardProps) {
  const [activeTab, setActiveTab] = useState<'completed' | 'progress'>('completed');
  const { toast } = useToast();

  const jobs = activeTab === 'completed' ? completedJobs : inProgressJobs;

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
            Completed jobs ({completedJobs.length})
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
            In progress ({inProgressJobs.length})
          </p>
          {activeTab === 'progress' && (
            <div className="bg-primary h-[2px] absolute bottom-0 left-0 w-full rounded-full z-10" />
          )}
        </button>
      </div>

      {/* Job Listing List */}
      <div className="flex flex-col w-full gap-[20px]">
        {jobs.length === 0 ? (
          <div className="py-8 text-center text-muted text-[13px] w-full">
            {activeTab === 'completed' ? 'No completed jobs yet.' : 'No in-progress jobs.'}
          </div>
        ) : (
          jobs.map((job, idx) => (
            <div key={job.id || idx} className="w-full flex flex-col gap-[20px]">
              {idx > 0 && <div className="h-px bg-card-border w-full" />}
              <div className="flex flex-col gap-[12px] items-start w-full">
                <p className="font-semibold leading-[1.4] text-[15px] text-foreground/80 w-full">
                  {job.title}
                </p>
                <div className="flex flex-col font-normal gap-[4px] items-start leading-normal text-muted text-[13px] w-full">
                  <p>
                    {job.startDate} - {job.endDate}
                  </p>
                  {job.feedback && (
                    <p className="italic">
                      {job.feedback}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between leading-normal pt-[8px] w-full whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground text-[14px]">{job.amount}</span>
                    <span className="text-[10px] text-muted font-normal">Fixed Price</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#8C5CFF]/10 text-[#8C5CFF] text-[11px] font-medium">
                    Canton Escrow {activeTab === 'completed' ? 'Released' : 'Locked'}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
    </div>
  );
}
