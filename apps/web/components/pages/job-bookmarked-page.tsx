'use client';

import { useState } from 'react';
import { JOBS, Job, ScrollableTags, PeopleIcon, VerifiedBadge, LocationIcon } from './find-job-page';

interface JobBookmarkedPageProps {
  onBack: () => void;
  onBrowseJobs: () => void;
  savedJobIds: Record<number, boolean>;
  onToggleSaveJob: (id: number) => void;
}

export default function JobBookmarkedPage({
  onBack,
  onBrowseJobs,
  savedJobIds,
  onToggleSaveJob,
}: JobBookmarkedPageProps) {
  const [expandedJobIds, setExpandedJobIds] = useState<Record<number, boolean>>({});

  const bookmarkedJobs = JOBS.filter((job) => savedJobIds[job.id]);

  return (
    <div className="flex flex-col h-full bg-[#FAFAFD] dark:bg-[#0B0B0B] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#D8D8D8] dark:border-[#121212] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-foreground transition-colors"
            title="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15.41 16.58L10.83 12L15.41 7.41L14 6L8 12L14 18L15.41 16.58Z" fill="currentColor" />
            </svg>
          </button>
          <div>
            <h1 className="text-[#010101] dark:text-white text-lg font-semibold leading-7">
              Bookmarked Jobs
            </h1>
            <p className="text-muted text-[11px] leading-4">
              Your saved listings & opportunities
            </p>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 flex flex-col gap-6 max-w-[700px] w-full mx-auto">
        {bookmarkedJobs.length > 0 ? (
          bookmarkedJobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col gap-4 px-5 py-6 rounded-2xl border border-border bg-card transition-shadow hover:shadow-sm"
            >
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[#010101] dark:text-white text-[13px] font-medium leading-[18px] flex-1">
                    {job.title}
                  </span>
                  <span className="text-muted text-[10px] leading-[13px] flex-shrink-0">
                    {job.timeAgo}
                  </span>
                </div>

                {/* Pay info */}
                <div className="flex flex-col gap-[5px]">
                  <div className="flex items-center gap-[7px]">
                    <span className="text-muted text-[10px] leading-[13px]">
                      {job.payType}:
                    </span>
                    <span className="text-[#010101] dark:text-white font-medium text-[10px] leading-[13px]">
                      {job.pay}
                    </span>
                    <span className="text-muted text-[10px] leading-[13px]">
                      {job.payUnit}
                    </span>
                  </div>
                  <div className="flex items-center gap-[9px]">
                    <span className="text-muted text-[10px] leading-[13px]">
                      {job.level}
                    </span>
                    <div className="flex items-center gap-[3px] flex-1 min-w-0">
                      <span className="text-muted text-[10px] leading-[13px] truncate">
                        {job.estimate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <p className={`text-[#010101]/85 dark:text-white/85 text-sm leading-[22px] ${
                  expandedJobIds[job.id] ? "" : "line-clamp-2"
                }`}>
                  {job.description}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setExpandedJobIds((prev) => ({
                      ...prev,
                      [job.id]: !prev[job.id],
                    }));
                  }}
                  className="text-primary text-[11px] font-semibold underline text-left hover:text-primary-hover transition-colors w-fit"
                >
                  {expandedJobIds[job.id] ? "Read less" : "Read more"}
                </button>

                {/* Tags row */}
                <ScrollableTags tags={job.tags} />
              </div>

              {/* Card Footer Section */}
              <div className="flex flex-col gap-3 mt-1">
                {/* Proposals and Ratings */}
                <div className="flex justify-between items-center">
                  <VerifiedBadge />
                  <div className="flex items-center gap-[5px]">
                    <PeopleIcon />
                    <span className="text-muted text-[11px] leading-4">
                      {job.proposals} Proposals
                    </span>
                  </div>

                  {job.proposalsInReview && (
                    <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                      <span className="text-[10px] leading-[13px] font-medium">Proposals in review</span>
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-pulse"
                      >
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-[#D8D8D8]/50 dark:bg-[#121212]/50" />

                {/* Marketplace Details Footer */}
                <div className="flex w-full items-center justify-between gap-3 flex-wrap">
                  {/* Spent info */}
                  <span className="font-sans text-[11px] font-normal leading-4 text-foreground/80 dark:text-white/80">
                    {job.spent}
                  </span>

                  {/* Location */}
                  <div className="flex items-center gap-1.5">
                    <LocationIcon />
                    <span className="font-sans text-[11px] font-normal leading-4 text-foreground/80 dark:text-white/80">
                      {job.location}
                    </span>
                  </div>

                  {/* Bookmark icon */}
                  <button
                    type="button"
                    onClick={() => onToggleSaveJob(job.id)}
                    className="flex items-center text-primary transition-colors cursor-pointer"
                  >
                    <svg
                      width="14"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-card rounded-2xl border border-border p-6">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-muted/60"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-foreground">No bookmarked jobs</h3>
              <p className="text-muted text-[11px] max-w-[240px]">
                Browse active jobs in the Marketplace and click the bookmark icon to save them here.
              </p>
            </div>
            <button
              onClick={onBrowseJobs}
              className="mt-2 h-9 rounded-xl bg-primary px-5 text-[12px] font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Browse Jobs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
