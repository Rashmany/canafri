'use client';
import { useState, useRef } from "react";
import { 
  ChevronLeft, 
  UploadCloud, 
  Trash2, 
  File as FileIcon, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Clock,
  UserX,
  ThumbsDown,
  FileX2,
  MoreHorizontal,
  ShieldAlert,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SuccessModal } from "@/components/ui/success-modal";
import { useToast } from "@/components/ui/toast";

interface ResolutionPageProps {
  onBack?: () => void;
  onSubmitSuccess?: () => void;
}

interface EvidenceFile {
  name: string;
  size: string;
  type: string;
  previewUrl?: string;
}

// -- Mode config -------------------------------------------------------------
type DisputeMode = "dispute" | "changes" | "reject";

interface ModeConfig {
  heading: string;
  subtitle: string;
  showIssueCards: boolean;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  bannerText: string;
  bannerColorCls: string;
  submitLabel: string;
  submitColorCls: string;
  nextSteps: string[];
  sidebarBadgeLabel: string;
  sidebarBadgeCls: string;
  successTitle: string;
  successDescription: string;
  successCta: string;
  persistStatus: string;
}

const modeConfigs: Record<DisputeMode, ModeConfig> = {
  dispute: {
    heading: "Open a Dispute",
    subtitle: "You can open a dispute if you're not satisfied with the delivery. Our team will review both sides and help resolve the issue.",
    showIssueCards: true,
    descriptionLabel: "Describe the issue",
    descriptionPlaceholder: "The delivered website does not match the requirements we discussed...",
    bannerText: "Opening a dispute will pause the payment until the issue is resolved.",
    bannerColorCls: "bg-primary/5 border-primary/10 text-primary",
    submitLabel: "Open Dispute",
    submitColorCls: "bg-primary hover:bg-primary/95 shadow-primary/10",
    nextSteps: [
      "Freelancer will be notified and have 48 hours to respond.",
      "Our team will review all information and make a fair decision.",
    ],
    sidebarBadgeLabel: "Dispute Not Open",
    sidebarBadgeCls: "bg-rose-500/10 border border-rose-500/20 text-rose-500",
    successTitle: "Dispute Opened Successfully!",
    successDescription: "Your dispute has been logged. The freelancer has been notified and our support team will review the claim details. Expect updates within 24 to 48 hours.",
    successCta: "Back to Postings",
    persistStatus: "disputed",
  },
  changes: {
    heading: "Request Changes",
    subtitle: "Tell the freelancer exactly what you'd like revised. Be specific so they can address your feedback effectively.",
    showIssueCards: false,
    descriptionLabel: "What changes do you need?",
    descriptionPlaceholder: "Please describe the specific changes you'd like the freelancer to make...",
    bannerText: "Requesting changes will send the delivery back to the freelancer. Payment remains in escrow until you approve.",
    bannerColorCls: "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400",
    submitLabel: "Send Change Request",
    submitColorCls: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/10",
    nextSteps: [
      "Freelancer will receive your feedback and be asked to revise the work.",
      "You'll be notified when the freelancer resubmits the delivery.",
    ],
    sidebarBadgeLabel: "Changes Requested",
    sidebarBadgeCls: "bg-amber-500/10 border border-amber-500/20 text-amber-500",
    successTitle: "Change Request Sent!",
    successDescription: "Your feedback has been sent to the freelancer. They have been notified and will work on the requested changes. You'll receive an update when they resubmit.",
    successCta: "Back to Postings",
    persistStatus: "changes",
  },
  reject: {
    heading: "Reject Delivery",
    subtitle: "Rejecting this delivery will notify the freelancer that their work does not meet the agreed requirements. Please provide a clear reason.",
    showIssueCards: true,
    descriptionLabel: "Reason for rejection",
    descriptionPlaceholder: "Explain clearly why you are rejecting this delivery and what the freelancer needs to address...",
    bannerText: "Rejecting this delivery will ask the freelancer to redo the work from scratch. Payment stays in escrow.",
    bannerColorCls: "bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400",
    submitLabel: "Reject Delivery",
    submitColorCls: "bg-rose-500 hover:bg-rose-600 shadow-rose-500/10",
    nextSteps: [
      "Freelancer will be notified of the rejection and your reason.",
      "They must resubmit a revised delivery meeting your requirements.",
    ],
    sidebarBadgeLabel: "Delivery Rejected",
    sidebarBadgeCls: "bg-rose-500/10 border border-rose-500/20 text-rose-500",
    successTitle: "Delivery Rejected",
    successDescription: "The freelancer has been notified of your rejection and the detailed reason. They will need to resubmit a revised delivery that meets your requirements.",
    successCta: "Back to Postings",
    persistStatus: "rejected",
  },
};

export default function ResolutionPage({ onBack, onSubmitSuccess }: ResolutionPageProps) {
  const { toast } = useToast();

  // Determine mode from localStorage
  const mode: DisputeMode = (() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("canafri_dispute_mode");
      if (raw === "changes" || raw === "reject") return raw as DisputeMode;
    }
    return "dispute";
  })();

  const config = modeConfigs[mode];

  // Load job details from localStorage or fallback to defaults
  const [job] = useState(() => {
    if (typeof window !== 'undefined') {
      const jobIdStr = localStorage.getItem('canafri_dispute_job_id');
      if (jobIdStr) {
        const jobId = Number(jobIdStr);
        try {
          const deliveries = JSON.parse(localStorage.getItem('canafri_job_deliveries') || '[]');
          const del = deliveries.find((d: any) => d.id === jobId);
          if (del) {
            return {
              id: del.id,
              title: del.title || 'Develop a Responsive Website',
              budget: del.budget || '850 CC',
              freelancerName: del.freelancerName || 'David Olavo',
              freelancerHandle: del.freelancerHandle || '@davidolavo',
              avatarBg: del.avatarBg || 'bg-blue-600',
              initials: del.initials || 'DO',
              submittedAt: del.submittedAt || 'May 10, 2025'
            };
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {
      id: 5,
      title: 'Develop a Responsive Website',
      budget: '850 CC',
      freelancerName: 'David Olavo',
      freelancerHandle: '@davidolavo',
      avatarBg: 'bg-blue-600',
      initials: 'DO',
      submittedAt: 'May 10, 2025'
    };
  });

  const [selectedIssueIdx, setSelectedIssueIdx] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([
    { name: "screenshot-1.png", size: "1.2 MB", type: "image/png" },
    { name: "Missing-features.pdf", size: "2.4 MB", type: "application/pdf" },
    { name: "mobile-view-issue.png", size: "1.1 MB", type: "image/png" }
  ]);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const issues = [
    {
      title: "Work does not meet requirements",
      desc: "The delivered work is different from what was agreed.",
      icon: <FileX2 className="size-5 text-primary" />
    },
    {
      title: "Incomplete delivery",
      desc: "Freelancer did not deliver the full scope of work.",
      icon: <ShieldAlert className="size-5 text-primary" />
    },
    {
      title: "Poor quality work",
      desc: "The work quality is not acceptable.",
      icon: <ThumbsDown className="size-5 text-primary" />
    },
    {
      title: "Missed deadline",
      desc: "Delivery was not made on the agreed date.",
      icon: <Clock className="size-5 text-primary" />
    },
    {
      title: "Unprofessional behavior",
      desc: "Freelancer was uncooperative or unprofessional.",
      icon: <UserX className="size-5 text-primary" />
    },
    {
      title: "Other issue",
      desc: "A different issue not listed above.",
      icon: <MoreHorizontal className="size-5 text-primary" />
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: EvidenceFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.size > 10 * 1024 * 1024) {
        toast(`${f.name} is larger than the 10MB limit.`, 'error');
        continue;
      }
      newFiles.push({
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        type: f.type
      });
    }
    setEvidenceFiles((prev) => [...prev, ...newFiles]);
    toast(`Successfully uploaded ${newFiles.length} file(s).`, 'success');
  };

  const removeFile = (idx: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== idx));
    toast("File removed.", "info");
  };

  const handleSubmit = () => {
    if (!description.trim() || description.length < 10) {
      toast("Please provide a detailed explanation (at least 10 characters).", "error");
      return;
    }

    if (typeof window !== "undefined") {
      try {
        const arr = JSON.parse(localStorage.getItem("canafri_job_deliveries") || "[]");
        const updated = arr.map((d: any) =>
          d.id === job.id
            ? {
                ...d,
                status: config.persistStatus,
                review: {
                  rating: mode === "reject" ? 1 : 3,
                  feedback: `${config.heading}: ${description}`,
                  action: config.persistStatus
                }
              }
            : d
        );
        localStorage.setItem("canafri_job_deliveries", JSON.stringify(updated));
        localStorage.removeItem("canafri_dispute_mode");
      } catch (e) {
        console.error(e);
      }
    }

    setShowSuccess(true);
  };

  const BannerIcon = mode === "dispute" ? Info : mode === "changes" ? AlertTriangle : XCircle;

  const navTitle =
    mode === "changes" ? "Request Changes" :
    mode === "reject" ? "Reject Delivery" :
    "Resolution Center";

  const roadmapTitle =
    mode === "changes" ? "How Change Requests Work" :
    mode === "reject" ? "How Rejection Works" :
    "How Disputes Work";

  const step1Label = mode === "changes" ? "You request changes" : mode === "reject" ? "You reject the delivery" : "You open a dispute";
  const step1Desc = mode === "changes" ? "Describe what needs to be revised." : mode === "reject" ? "Explain the reason clearly." : "Explain the issue and provide evidence.";
  const step2Desc = mode === "changes" ? "Freelancer revises and resubmits the work." : "Freelancer will have 48 hours to respond.";
  const step3Label = mode === "changes" ? "You review and approve" : "Our team reviews";
  const step3Desc = mode === "changes" ? "Approve when the changes meet your expectations." : "We review both sides and make a decision.";
  const step4Desc = mode === "changes" ? "Payment is released once you approve the revision." : "Payment is released or returned based on decision.";

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-y-auto no-scrollbar">
      {/* Header row */}
      <div className="flex items-center gap-4 border-b border-border bg-card px-6 py-4 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex size-8 items-center justify-center rounded-full bg-background border border-border text-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft size={16} />
        </button>
        <div>
          <h1 className="font-sans text-[15px] font-bold text-foreground">
            {navTitle}
          </h1>
        </div>
      </div>

      {/* Main content grid */}
      <div className="flex flex-col lg:flex-row w-full flex-1 p-6 gap-8 max-w-[1200px] mx-auto">
        
        {/* Left Side: Form */}
        <div className="flex-1 flex flex-col gap-8 min-w-0">
          
          {/* Page Header */}
          <div className="flex flex-col gap-2">
            <h2 className="font-sans text-[28px] font-bold text-foreground/85 leading-tight tracking-tight">
              {config.heading}
            </h2>
            <p className="font-sans text-[13px] text-muted leading-relaxed">
              {config.subtitle}
            </p>
          </div>

          {/* Section: Issues (only for dispute + reject modes) */}
          {config.showIssueCards && (
            <div className="flex flex-col gap-4">
              <p className="font-sans text-[13px] font-semibold text-foreground/80">
                {mode === "reject" ? "Primary reason for rejection" : "What issue are you facing?"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {issues.map((item, idx) => {
                  const isSelected = selectedIssueIdx === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedIssueIdx(idx)}
                      className={cn(
                        "flex gap-3 items-start p-4 rounded-xl border transition-all cursor-pointer bg-card select-none",
                        isSelected
                          ? "border-primary bg-primary/[0.02]"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-1 text-left">
                        <p className="font-sans text-[13px] font-semibold text-foreground/85 leading-snug">
                          {item.title}
                        </p>
                        <p className="font-sans text-[10px] text-muted leading-tight">
                          {item.desc}
                        </p>
                      </div>
                      <div className="shrink-0 size-4 rounded-full border border-border flex items-center justify-center mt-0.5">
                        {isSelected && <div className="size-2 rounded-full bg-primary" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Description */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="font-sans text-[13px] font-semibold text-foreground/80">
                {config.descriptionLabel}
              </p>
              <p className="font-sans text-[10px] text-muted">
                Provide a detailed explanation so the freelancer understands exactly what is needed.
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-[#F5F8FB] dark:bg-[#161616] p-4 focus-within:border-primary transition-colors">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                placeholder={config.descriptionPlaceholder}
                rows={5}
                className="w-full resize-none bg-transparent text-[13px] text-foreground outline-none leading-relaxed placeholder:text-muted"
              />
              <span className="self-end text-[10px] text-muted/65 font-medium select-none">
                {description.length}/2000
              </span>
            </div>
          </div>

          {/* Section: Evidence Upload */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="font-sans text-[13px] font-semibold text-foreground/80">
                Upload supporting evidence (optional)
              </p>
              <p className="font-sans text-[10px] text-muted">
                Upload screenshots, files, or any proof that supports your {mode === "changes" ? "request" : mode === "reject" ? "rejection" : "dispute"}.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 items-start">
              {evidenceFiles.map((file, idx) => (
                <div 
                  key={idx} 
                  className="bg-card border border-border rounded-lg p-2 w-[120px] flex flex-col gap-2 relative group animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="h-[80px] w-full rounded-[4px] bg-muted flex items-center justify-center overflow-hidden relative border border-border/30">
                    {file.type.startsWith("image/") || file.name.endsWith(".png") || file.name.endsWith(".jpg") ? (
                      <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url('/images/portfolio-placeholder.png')` }} />
                    ) : (
                      <FileIcon className="size-8 text-primary/70" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                      title="Delete file"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-0.5 leading-tight select-none">
                    <p className="text-[10px] font-semibold text-foreground/85 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[8px] text-muted font-medium">
                      {file.size}
                    </p>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-card border border-dashed border-border hover:border-primary/50 rounded-lg h-[132px] w-[120px] flex flex-col items-center justify-center p-3 gap-2 text-center transition-colors cursor-pointer"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  onChange={handleFileUpload}
                />
                <UploadCloud className="size-6 text-primary" />
                <span className="text-[10px] font-semibold text-foreground/85 leading-tight">
                  Upload more
                </span>
                <span className="text-[8px] text-muted">
                  Max 10MB per file
                </span>
              </button>
            </div>
          </div>

          {/* Banner notification */}
          <div className={cn("border rounded-xl p-4 flex gap-3 items-center", config.bannerColorCls)}>
            <BannerIcon className="size-5 shrink-0" />
            <p className="font-sans text-[13px] leading-normal text-left">
              <span className="font-bold mr-1">Please note:</span>
              {config.bannerText}
            </p>
          </div>

          {/* What happens next */}
          <div className="flex flex-col gap-3 pt-4 border-t border-border">
            <p className="font-sans text-[13px] font-semibold text-foreground/80">
              What happens next?
            </p>
            <div className="flex flex-col gap-2 text-left">
              {config.nextSteps.map((step, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span className="font-sans text-[12px] text-muted leading-none">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 justify-end pt-4">
            <button
              type="button"
              onClick={onBack}
              className="px-5 h-[38px] flex items-center justify-center rounded-xl border border-primary text-primary text-[13px] font-semibold hover:bg-primary/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className={cn(
                "px-6 h-[38px] flex items-center justify-center rounded-xl text-white text-[13px] font-semibold transition-colors cursor-pointer shadow-lg",
                config.submitColorCls
              )}
            >
              {config.submitLabel}
            </button>
          </div>

        </div>

        {/* Right Side: Job Summary Info Panel */}
        <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-6">
          
          {/* Job Summary Card */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-5 text-left">
            <div className="flex items-center justify-between">
              <p className="font-sans text-[13px] font-semibold text-foreground/80">
                Job Summary
              </p>
              <div className={cn("rounded-full px-2.5 py-0.5 shrink-0", config.sidebarBadgeCls)}>
                <span className="text-[9px] font-bold uppercase tracking-wide">
                  {config.sidebarBadgeLabel}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Job Title</span>
                <span className="text-[13px] font-semibold text-foreground/85 leading-snug">{job.title}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Job ID</span>
                <span className="text-[13px] font-semibold text-foreground/85">#JOB-2025-{String(job.id).padStart(4, "0")}</span>
              </div>
              
              <div className="flex flex-col gap-2.5">
                <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Freelancer</span>
                <div className="flex items-center gap-2.5">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white shrink-0", job.avatarBg)}>
                    {job.initials}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[11px] font-bold text-foreground/85 leading-tight truncate">{job.freelancerName}</span>
                    <span className="text-[10px] text-muted truncate">{job.freelancerHandle}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-border w-full my-1" />

            <div className="flex flex-col gap-2.5 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-muted">Agreed Price</span>
                <span className="font-bold text-foreground/85">{job.budget}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Escrow Amount</span>
                <span className="font-bold text-foreground/85">{job.budget}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Delivery Submitted</span>
                <span className="font-medium text-foreground/85">{job.submittedAt}</span>
              </div>
            </div>
          </div>

          {/* Process Roadmap */}
          <div className="flex flex-col gap-4 text-left p-2">
            <p className="font-sans text-[13px] font-semibold text-foreground/80">
              {roadmapTitle}
            </p>
            <div className="flex flex-col">
              
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="size-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    1
                  </div>
                  <div className="w-px bg-border flex-1 min-h-[20px]" />
                </div>
                <div className="flex flex-col pb-4 text-left">
                  <p className="text-[12px] font-bold text-foreground/85">{step1Label}</p>
                  <p className="text-[10px] text-muted mt-0.5">{step1Desc}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="size-6 rounded-full bg-card border border-border flex items-center justify-center text-[10px] font-bold text-muted shrink-0">
                    2
                  </div>
                  <div className="w-px bg-border flex-1 min-h-[20px]" />
                </div>
                <div className="flex flex-col pb-4 text-left">
                  <p className="text-[12px] font-semibold text-muted/80">Freelancer responds</p>
                  <p className="text-[10px] text-muted/60 mt-0.5">{step2Desc}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="size-6 rounded-full bg-card border border-border flex items-center justify-center text-[10px] font-bold text-muted shrink-0">
                    3
                  </div>
                  <div className="w-px bg-border flex-1 min-h-[20px]" />
                </div>
                <div className="flex flex-col pb-4 text-left">
                  <p className="text-[12px] font-semibold text-muted/80">{step3Label}</p>
                  <p className="text-[10px] text-muted/60 mt-0.5">{step3Desc}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="size-6 rounded-full bg-card border border-border flex items-center justify-center text-[10px] font-bold text-muted shrink-0">
                    4
                  </div>
                </div>
                <div className="flex flex-col text-left">
                  <p className="text-[12px] font-semibold text-muted/80">Resolution</p>
                  <p className="text-[10px] text-muted/60 mt-0.5">{step4Desc}</p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Success Modal */}
      <SuccessModal
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          if (onSubmitSuccess) onSubmitSuccess();
          else if (onBack) onBack();
        }}
        title={config.successTitle}
        description={config.successDescription}
        cta={config.successCta}
        onCta={() => {
          setShowSuccess(false);
          if (onSubmitSuccess) onSubmitSuccess();
          else if (onBack) onBack();
        }}
      />
    </div>
  );
}
