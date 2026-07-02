'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

// ─── Shared backdrop / container ──────────────────────────────────────────────

function DialogOverlay({
  children,
  onClose,
  visible,
}: {
  children: React.ReactNode;
  onClose: () => void;
  visible: boolean;
}) {
  // Prevent body scroll while open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  return (
    <div
      className={`fixed inset-0 z-[200] overflow-y-auto transition-all duration-400 ${
        visible ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-modal="true"
      role="dialog"
    >
      {/* Padding wrapper — click-through on the gutters to close */}
      <div className="flex min-h-full items-end justify-center p-0 sm:items-start sm:justify-center sm:p-6">
        <div
          className={`w-full sm:max-w-[420px] md:max-w-[460px] transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            visible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-8 scale-95'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Close button ─────────────────────────────────────────────────────────────

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="flex items-center justify-center rounded-full p-1 text-muted hover:text-foreground transition-colors"
    >
      <svg
        width="20"
        height="20"
        viewBox="336 2 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M346 12.708L349.246 15.954C349.339 16.0473 349.454 16.0973 349.59 16.104C349.726 16.1107 349.847 16.0607 349.954 15.954C350.061 15.8473 350.114 15.7293 350.114 15.6C350.114 15.4707 350.061 15.3527 349.954 15.246L346.708 12L349.954 8.754C350.047 8.66067 350.097 8.546 350.104 8.41C350.111 8.274 350.061 8.15267 349.954 8.046C349.847 7.93933 349.729 7.886 349.6 7.886C349.471 7.886 349.353 7.93933 349.246 8.046L346 11.292L342.754 8.046C342.661 7.95267 342.546 7.90267 342.41 7.896C342.274 7.88933 342.153 7.93933 342.046 8.046C341.939 8.15267 341.886 8.27067 341.886 8.4C341.886 8.52933 341.939 8.64733 342.046 8.754L345.292 12L342.046 15.246C341.953 15.3393 341.903 15.4543 341.896 15.591C341.889 15.7263 341.939 15.8473 342.046 15.954C342.153 16.0607 342.271 16.114 342.4 16.114C342.529 16.114 342.647 16.0607 342.754 15.954L346 12.708ZM346.003 21C344.758 21 343.588 20.764 342.493 20.292C341.398 19.8193 340.445 19.178 339.634 18.368C338.823 17.558 338.182 16.606 337.709 15.512C337.236 14.418 337 13.2483 337 12.003C337 10.7577 337.236 9.58767 337.709 8.493C338.181 7.39767 338.821 6.44467 339.63 5.634C340.439 4.82333 341.391 4.18167 342.487 3.709C343.583 3.23633 344.753 3 345.997 3C347.241 3 348.411 3.23633 349.507 3.709C350.602 4.181 351.555 4.82167 352.366 5.631C353.177 6.44033 353.818 7.39267 354.291 8.488C354.764 9.58333 355 10.753 355 11.997C355 13.241 354.764 14.411 354.292 15.507C353.82 16.603 353.179 17.556 352.368 18.366C351.557 19.176 350.605 19.8177 349.512 20.291C348.419 20.7643 347.249 21.0007 346.003 21ZM346 20C348.233 20 350.125 19.225 351.675 17.675C353.225 16.125 354 14.2333 354 12C354 9.76667 353.225 7.875 351.675 6.325C350.125 4.775 348.233 4 346 4C343.767 4 341.875 4.775 340.325 6.325C338.775 7.875 338 9.76667 338 12C338 14.2333 338.775 16.125 340.325 17.675C341.875 19.225 343.767 20 346 20Z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}

// ─── Wallet Icon ──────────────────────────────────────────────────────────────

function WalletIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="aspect-square shrink-0"
    >
      <path
        d="M12.957 2.70996H3.04362C2.60159 2.70996 2.17767 2.88556 1.86511 3.19812C1.55255 3.51068 1.37695 3.9346 1.37695 4.37663V11.6233C1.37695 12.0653 1.55255 12.4892 1.86511 12.8018C2.17767 13.1144 2.60159 13.29 3.04362 13.29H12.957C13.399 13.29 13.8229 13.1144 14.1355 12.8018C14.448 12.4892 14.6236 12.0653 14.6236 11.6233V4.37663C14.6236 3.9346 14.448 3.51068 14.1355 3.19812C13.8229 2.88556 13.399 2.70996 12.957 2.70996ZM13.957 9.32996H9.67695C9.32333 9.32996 8.98419 9.18948 8.73414 8.93944C8.4841 8.68939 8.34362 8.35025 8.34362 7.99663C8.34362 7.64301 8.4841 7.30387 8.73414 7.05382C8.98419 6.80377 9.32333 6.66329 9.67695 6.66329H13.957V9.32996ZM9.67695 5.99663C9.14652 5.99663 8.63781 6.20734 8.26274 6.58241C7.88767 6.95749 7.67695 7.46619 7.67695 7.99663C7.67695 8.52706 7.88767 9.03577 8.26274 9.41084C8.63781 9.78591 9.14652 9.99663 9.67695 9.99663H13.957V11.6233C13.957 11.8885 13.8516 12.1429 13.6641 12.3304C13.4765 12.5179 13.2222 12.6233 12.957 12.6233H3.04362C2.7784 12.6233 2.52405 12.5179 2.33651 12.3304C2.14898 12.1429 2.04362 11.8885 2.04362 11.6233V4.37663C2.04362 4.11141 2.14898 3.85706 2.33651 3.66952C2.52405 3.48198 2.7784 3.37663 3.04362 3.37663H12.957C13.2222 3.37663 13.4765 3.48198 13.6641 3.66952C13.8516 3.85706 13.957 4.11141 13.957 4.37663V5.99663H9.67695Z"
        fill="#A0A0A0"
      />
      <path
        d="M9.67839 8.66402C10.0466 8.66402 10.3451 8.36555 10.3451 7.99736C10.3451 7.62917 10.0466 7.33069 9.67839 7.33069C9.3102 7.33069 9.01172 7.62917 9.01172 7.99736C9.01172 8.36555 9.3102 8.66402 9.67839 8.66402Z"
        fill="#A0A0A0"
      />
    </svg>
  );
}

// ─── Detail row shared ─────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between self-stretch">
      <span className="text-[10px] leading-[13px] text-foreground/80">{label}</span>
      <span className="text-[10px] leading-[13px] text-muted">{value}</span>
    </div>
  );
}

// ─── 1. Confirm Deposit Dialog ────────────────────────────────────────────────

export interface ConfirmDepositDialogProps {
  open: boolean;
  title: string;
  category: string;
  budget: number;
  deadline: string;
  milestones: string;
  payType: 'hourly' | 'fixed';
  onClose: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDepositDialog({
  open,
  title,
  category,
  budget,
  deadline,
  milestones,
  payType,
  onClose,
  onCancel,
  onConfirm,
}: ConfirmDepositDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      // Tiny delay so the enter animation fires after mount
      const t = setTimeout(() => setMounted(true), 10);
      return () => clearTimeout(t);
    } else {
      setMounted(false);
    }
  }, [open]);

  if (!open) return null;

  const platformFee = Math.round(budget * 0.05);
  const totalCharge = budget + platformFee;

  return (
    <DialogOverlay onClose={onClose} visible={mounted}>
      <div className="flex flex-col gap-0 rounded-t-[28px] sm:rounded-[28px] border border-border bg-background shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold leading-[18px] text-foreground">
              Review & Confirm Deposit
            </span>
            <span className="text-[10px] leading-[13px] text-muted">
              CC will be locked in Canton escrow on confirm
            </span>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 px-6 py-5">
          {/* Job summary */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <span className="inline-flex items-center rounded-[6px] bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary w-fit">
                  {category || 'Development'}
                </span>
                <p className="text-[13px] font-medium leading-[18px] text-foreground line-clamp-2">
                  {title || 'Build a React and Next.js frontend for a Canton wallet dashboard'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <span className="text-[15px] font-semibold leading-[19px] text-foreground whitespace-nowrap">
                  {budget.toLocaleString()} CC
                </span>
                {payType === 'fixed' && milestones && (
                  <span className="text-[10px] text-muted whitespace-nowrap">
                    {milestones} milestones
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="flex flex-col gap-0 rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex flex-col gap-4 px-4 py-4">
              <DetailRow label="Job budget" value={`${budget.toLocaleString()} CC`} />
              <div className="h-px w-full bg-border" />
              <DetailRow label="Platform fee (5%)" value={`${platformFee.toLocaleString()} CC`} />
              <div className="h-px w-full bg-border" />
              {payType === 'fixed' && (
                <>
                  <DetailRow label="Deadline" value={`${deadline} days`} />
                  <div className="h-px w-full bg-border" />
                  <DetailRow label="Milestones" value={`${milestones} phases`} />
                  <div className="h-px w-full bg-border" />
                  <DetailRow
                    label="Per milestone"
                    value={`${milestones && Number(milestones) > 0 ? Math.round(budget / Number(milestones)).toLocaleString() : 0} CC`}
                  />
                  <div className="h-px w-full bg-border" />
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold leading-[14px] text-foreground">
                  Total locked
                </span>
                <span className="text-[13px] font-bold leading-[18px] text-primary">
                  {totalCharge.toLocaleString()} CC
                </span>
              </div>
            </div>
          </div>

          {/* Canton escrow notice */}
          <div className="flex items-start gap-2.5 rounded-[10px] bg-primary/10 border border-primary/20 px-4 py-3">
            <WalletIcon />
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold leading-[14px] text-primary">
                Canton Escrow Protection
              </span>
              <span className="text-[10px] leading-[13px] text-primary/80">
                {totalCharge.toLocaleString()} CC will be locked in a confidential Canton sub-ledger contract. Funds are released per milestone upon your approval. Fully refundable if the job is cancelled before work begins.
              </span>
            </div>
          </div>

          {/* Wallet balance row */}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <WalletIcon />
              <span className="text-[10px] text-muted">Available balance</span>
            </div>
            <span className="text-[10px] text-muted">12,500 CC</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onCancel}
            className="h-[38px] flex-1 rounded-xl border border-border text-[13px] font-semibold text-foreground hover:bg-border/20 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-[38px] flex-1 rounded-xl bg-primary text-[13px] font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            Confirm & Post
          </button>
        </div>
      </div>
    </DialogOverlay>
  );
}

// ─── 2. Job Posted Success (Congratulations) Dialog ───────────────────────────

export interface JobPostedDialogProps {
  open: boolean;
  title: string;
  budget: number;
  milestones: string;
  deadline: string;
  onClose: () => void;
  onBrowseJobs: () => void;
  onMyJobs: () => void;
}

export function JobPostedDialog({
  open,
  title,
  budget,
  milestones,
  deadline,
  onClose,
  onBrowseJobs,
  onMyJobs,
}: JobPostedDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [checkmarkVisible, setCheckmarkVisible] = useState(false);

  useEffect(() => {
    if (open) {
      const t1 = setTimeout(() => setMounted(true), 10);
      // Stagger the checkmark entrance slightly after the card
      const t2 = setTimeout(() => setCheckmarkVisible(true), 150);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      setMounted(false);
      setCheckmarkVisible(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <DialogOverlay onClose={onClose} visible={mounted}>
      <div className="flex flex-col gap-0 rounded-t-[28px] sm:rounded-[28px] border border-border bg-background shadow-2xl overflow-hidden">
        {/* Top close row */}
        <div className="flex justify-end px-5 pt-5 pb-2">
          <CloseButton onClick={onClose} />
        </div>

        {/* Success icon + heading */}
        <div className="flex flex-col items-center gap-6 px-6 pb-2">
          {/* Animated check circle — responsive size */}
          <div
            className={`transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              checkmarkVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}
          >
            <svg
              viewBox="0 0 106 106"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 sm:h-[88px] sm:w-[88px] md:h-[106px] md:w-[106px] aspect-square"
            >
              <path
                d="M53.0006 8.83337C28.6472 8.83337 8.83398 28.6465 8.83398 53C8.83398 77.3535 28.6472 97.1667 53.0006 97.1667C77.3541 97.1667 97.1673 77.3535 97.1673 53C97.1673 48.0269 96.3016 43.2578 94.7778 38.7925L87.6266 45.9437C88.0904 48.2227 88.334 50.5841 88.334 53C88.334 72.4819 72.4826 88.3334 53.0006 88.3334C33.5187 88.3334 17.6673 72.4819 17.6673 53C17.6673 33.5181 33.5187 17.6667 53.0006 17.6667C60.2131 17.6667 66.9216 19.8481 72.522 23.5757L78.845 17.2526C71.5664 11.9791 62.6511 8.83337 53.0006 8.83337ZM94.0446 14.544L48.584 60.0046L34.04 45.4606L27.7946 51.7061L48.584 72.4955L100.29 20.7894L94.0446 14.544Z"
                fill="#4ADE80"
              />
            </svg>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-[15px] font-semibold leading-[20px] text-foreground">
              Job Posted Successfully! 🎉
            </span>
            <span className="text-[11px] leading-[16px] text-muted max-w-[280px]">
              Your job has been published to the CanaFri marketplace. Sellers can now discover and apply.
            </span>
          </div>
        </div>

        {/* Job summary card */}
        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <span className="inline-flex items-center rounded-[6px] bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary w-fit">
                Posted
              </span>
              <p className="text-[13px] font-normal leading-5 text-foreground line-clamp-2">
                {title || 'Build a React and Next.js frontend for a Canton wallet dashboard'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <span className="text-[15px] font-semibold leading-[19px] text-foreground whitespace-nowrap">
                {budget.toLocaleString()} CC
              </span>
              {milestones && (
                <span className="text-[10px] text-muted whitespace-nowrap">
                  {milestones} milestones
                </span>
              )}
            </div>
          </div>

          {/* Detail rows */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card px-4 py-4">
            <DetailRow label="Total budget locked" value={`${budget.toLocaleString()} CC`} />
            <div className="h-px w-full bg-border" />
            <DetailRow label="Estimated deadline" value={`${deadline} days`} />
            <div className="h-px w-full bg-border" />
            <DetailRow label="Status" value="Active — accepting proposals" />
            <div className="h-px w-full bg-border" />
            <DetailRow label="Milestones" value={`${milestones} phases`} />
          </div>

          {/* Deducted row */}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <WalletIcon />
              <span className="text-[10px] text-muted">Deposit deducted</span>
            </div>
            <span className="text-[10px] text-muted">
              {budget.toLocaleString()} CC · locked in escrow
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onBrowseJobs}
            className="h-[38px] flex-1 rounded-xl border border-primary text-[13px] font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            Browse more jobs
          </button>
          <button
            type="button"
            onClick={onMyJobs}
            className="h-[38px] flex-1 rounded-xl bg-primary text-[13px] font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            My posted jobs
          </button>
        </div>
      </div>
    </DialogOverlay>
  );
}
