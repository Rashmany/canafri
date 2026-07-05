'use client';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { X, User, FileText, Calendar, DollarSign, Clock, ShieldAlert, Award } from 'lucide-react';

interface JobSummaryModalProps {
  open: boolean;
  onClose: () => void;
}

export function JobSummaryModal({ open, onClose }: JobSummaryModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const jobDetails = {
    orderId: "FO4564554",
    title: "Create a landing page for my web3 blog",
    category: "Web Programming & Design",
    revisions: "2 Revisions Allowed",
    duration: "7 Days Delivery",
    amount: "$25.00",
    date: "March 20, 2026",
    brief: "Please create a responsive landing page for my new Web3 blog. The design needs to be dark-themed, using modern typography, with elements for featured articles, a newsletter subscription form, and a placeholder Connect Wallet button. I'll need source files delivered in a structured zip format.",
  };

  const buyerDetails = {
    username: "keneweight",
    rating: "4.9",
    reviewsCount: 12,
    memberSince: "March 2024",
    totalOrders: 24,
    level: "Level 2 Buyer",
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center transition-all duration-300',
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div
        className={cn(
          'relative z-10 w-full max-w-lg mx-4 rounded-3xl overflow-hidden',
          'bg-[#FAFAFD] dark:bg-[#0B0B0B]',
          'border border-[#D8D8D8] dark:border-[#121212]',
          'shadow-[0_32px_80px_rgba(140,92,255,0.15)]',
          'transition-all duration-500 ease-out',
          visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        )}
      >
        {/* Top accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#8c5cff] to-transparent" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#D8D8D8]/45 dark:border-[#242424]/45">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-[15px] font-bold text-[#010101] dark:text-white">
              Order Summary
            </h3>
            <span className="text-[11px] text-muted">Order ID: #{jobDetails.orderId}</span>
          </div>
          <button
            onClick={handleClose}
            className="text-muted hover:text-[#010101] dark:hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-foreground/5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto no-scrollbar">
          
          {/* Buyer Profile Section */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[11px] font-bold text-[#8c5cff] uppercase tracking-wider flex items-center gap-1.5">
              <User size={12} />
              Buyer Profile
            </h4>
            <div className="flex items-start justify-between bg-[#F5F8FB] dark:bg-[#121212] rounded-2xl p-4 border border-[#D8D8D8] dark:border-[#1e1e1e] gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-[#8c5cff]/15 flex items-center justify-center text-[#8c5cff] font-bold shrink-0">
                  {buyerDetails.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-bold text-[#010101] dark:text-white leading-none">
                      {buyerDetails.username}
                    </span>
                    <span className="text-[9px] bg-primary/10 dark:bg-primary/25 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full font-medium leading-none">
                      {buyerDetails.level}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted">Member since {buyerDetails.memberSince}</span>
                </div>
              </div>
              <div className="flex flex-col items-end text-right gap-1 shrink-0">
                <div className="flex items-center gap-1 text-[11px] font-bold text-[#DAC95A]">
                  ★ <span className="text-foreground">{buyerDetails.rating}</span>
                  <span className="text-muted font-normal">({buyerDetails.reviewsCount})</span>
                </div>
                <span className="text-[10px] text-muted">{buyerDetails.totalOrders} total orders placed</span>
              </div>
            </div>
          </div>

          {/* Job details */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[11px] font-bold text-[#8c5cff] uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={12} />
              Job Deliverables
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F5F8FB] dark:bg-[#121212] rounded-2xl p-3 border border-[#D8D8D8] dark:border-[#1e1e1e] flex flex-col gap-1">
                <span className="text-[10px] text-muted flex items-center gap-1">
                  <DollarSign size={10} /> Amount
                </span>
                <span className="text-[14px] font-bold text-foreground">{jobDetails.amount}</span>
              </div>
              <div className="bg-[#F5F8FB] dark:bg-[#121212] rounded-2xl p-3 border border-[#D8D8D8] dark:border-[#1e1e1e] flex flex-col gap-1">
                <span className="text-[10px] text-muted flex items-center gap-1">
                  <Clock size={10} /> Timeline
                </span>
                <span className="text-[14px] font-bold text-foreground">{jobDetails.duration}</span>
              </div>
            </div>
          </div>

          {/* Detailed requirements */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-[11px] font-bold text-[#8c5cff] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={12} />
              Project Brief Requirements
            </h4>
            <div className="bg-[#F5F8FB] dark:bg-[#121212] rounded-2xl p-4 border border-[#D8D8D8] dark:border-[#1e1e1e] flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-foreground">{jobDetails.title}</span>
                <span className="text-[10px] text-muted">{jobDetails.category} • {jobDetails.revisions}</span>
              </div>
              <div className="h-px bg-[#DADADA] dark:bg-[#242424] w-full" />
              <p className="text-[11.5px] leading-relaxed text-muted whitespace-pre-line">
                {jobDetails.brief}
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#F5F8FB] dark:bg-[#0b0b0b] border-t border-[#D8D8D8]/45 dark:border-[#242424]/45 flex justify-end">
          <button
            onClick={handleClose}
            className="cursor-pointer bg-[#8C5CFF] hover:bg-[#8C5CFF]/90 text-white text-[13px] font-semibold px-6 py-2 rounded-xl transition-all active:scale-[0.98]"
          >
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
}
