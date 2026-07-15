'use client';
import { useState, useRef, useCallback } from "react";
import { FileText, ChevronLeft, ChevronRight, Plus, Pencil, X, Copy, PauseCircle, XCircle, BarChart2, Flag, Check, CheckCircle2, RefreshCw, Download, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const getStatusStyles = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/20';
    case 'working':
      return 'bg-[#8C5CFF]/15 text-[#8C5CFF] border border-[#8C5CFF]/20';
    case 'to_review':
      return 'bg-amber-500/15 text-amber-600/80 dark:text-amber-400/80 border border-amber-500/20';
    case 'completed':
      return 'bg-emerald-500/15 text-emerald-600/80 dark:text-emerald-400/80 border border-emerald-500/20';
    case 'draft':
      return 'bg-foreground/10 text-muted/80 border border-border/20';
    case 'cancelled':
      return 'bg-rose-500/15 text-rose-600/80 dark:text-rose-400/80 border border-rose-500/20';
    default:
      return 'bg-foreground/10 text-muted/80';
  }
};

interface StatCard {
  label: string;
  value: string;
  sub: string;
  subClassName: string;
}

const stats: StatCard[] = [
  { label: "Active Contracts", value: "1", sub: "Working underway", subClassName: "text-muted/80" },
  { label: "Locked Escrow",    value: "400 CC", sub: "Locked in contracts", subClassName: "text-[#4ADE80]/80" },
  { label: "Open Postings",    value: "1", sub: "Accepting proposals", subClassName: "text-primary/80" },
  { label: "Total Posted",     value: "4", sub: "All time postings", subClassName: "text-muted/80" },
];

const STATIC_TABS = [
  { label: "All",       count: 5 },
  { label: "Open",      count: 1 },
  { label: "Working",   count: 1 },
  { label: "To Review", count: 1 },
  { label: "Drafts",    count: 1 },
  { label: "Completed", count: 1 },
];

interface Job {
  id: number;
  title: string;
  category: string;
  proposals: number;
  date: string;
  budget: string;
  status: "open" | "working" | "to_review" | "completed" | "draft";
  freelancerName: string;
  freelancerHandle: string;
  avatarClassName: string;
  initials: string;
  description?: string;
  questions?: string[];
}

const mockJobs: Job[] = [
  { id: 1, title: "Create a landing page for my web3 blog", category: "Web Programming & Design", proposals: 8, date: "Mar. 24", budget: "150 CC", status: "open", freelancerName: "No Selection Yet", freelancerHandle: "Accepting proposals", avatarClassName: "bg-muted text-muted-foreground border border-border", initials: "?" },
  { id: 2, title: "Daml Smart Contract Escrow System", category: "Smart Contracts", proposals: 15, date: "Mar. 20", budget: "400 CC", status: "working", freelancerName: "Alex Daml", freelancerHandle: "@alexdaml", avatarClassName: "bg-[#291D46]", initials: "AD" },
  { id: 3, title: "Next.js frontend theme refactor", category: "Frontend Dev", proposals: 12, date: "Mar. 15", budget: "250 CC", status: "completed", freelancerName: "Sina Front", freelancerHandle: "@sinafront", avatarClassName: "bg-[#291D46]", initials: "SF" },
  { id: 4, title: "Tailwind layout alignment tweaks", category: "UI CSS Tweak", proposals: 0, date: "Mar. 28", budget: "50 CC", status: "draft", freelancerName: "Draft Status", freelancerHandle: "Not published", avatarClassName: "bg-[#291D46]", initials: "DS" },
  { id: 5, title: "Develop a Responsive Website", category: "Web Programming & Design", proposals: 1, date: "May 10", budget: "850 CC", status: "to_review", freelancerName: "David Okoro", freelancerHandle: "@davidokoro", avatarClassName: "bg-[#291D46]", initials: "DO" },
];

/* â”€â”€â”€ Client Job Detail Panel (Figma 1143-16953) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function ClientJobDetailPanel({ job, onClose, onEdit }: { job: Job; onClose: () => void; onEdit: () => void }) {
  const mockDescription = job.description || `We are looking for a dedicated specialist to help grow this project. Your primary responsibility will be ensuring every deliverable reaches its maximum potential through research, optimization, and performance tracking.\n\nThis is a long-term role for someone who understands the nuances of the platform and stays updated on the latest trends.`;

  const mockRequirements = [
    `Minimum 2 years of proven experience in ${job.category}`,
    "Fluent English communication skills (written and verbal)",
    "Proficient with relevant tools and frameworks",
    "Ability to analyze performance and identify improvement gaps",
    "Experience with project documentation and reporting",
  ];

  const mockSkills = job.category.split(" & ").flatMap(s => s.split(" ")).filter(s => s.length > 2).concat(["TypeScript", "Documentation", "Analysis"]).slice(0, 8);

  const mockQuestions = job.questions && job.questions.length > 0
    ? job.questions.map((q: string, idx: number) => ({ q: `${idx + 1}. ${q}`, hint: "Please provide a detailed response." }))
    : [
        { q: `1. Have you worked on a similar ${job.category} project before? Please provide examples.`, hint: "The client is looking for proven results and past performance." },
        { q: "2. What tools and methodologies do you prefer for this type of work?", hint: "Mention specific software or methodologies you utilize." },
      ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200 min-w-0 overflow-hidden">
      {/* X close button row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-medium capitalize", getStatusStyles(job.status))}>{job.status}</span>
          <span className="text-[11px] text-muted">Posted {job.date} Â· Budget: {job.budget}</span>
        </div>
        <button
          onClick={onClose}
          title="Close"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D8D8D8] dark:border-[#121212] bg-[#FAFAFD] dark:bg-[#0B0B0B] text-muted hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      {/* Two-column Figma layout */}
      <div className="flex gap-6 items-start min-w-0 overflow-hidden">

        {/* â”€â”€ Left: Main Job Details Card â”€â”€ */}
        <div className="flex-1 min-w-0 flex flex-col gap-8 bg-card border border-card-border rounded-[12px] p-8">

          {/* Header: title + meta + location */}
          <div className="flex flex-col gap-2">
            <h2 className="text-[28px] font-bold leading-tight text-foreground/85 break-words">{job.title}</h2>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-[14px] text-primary/85 font-normal">{job.category}</span>
              <span className="w-1 h-1 rounded-full bg-muted/60" />
              <span className="text-[14px] text-muted font-normal">Posted {job.date}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-muted">
                <path fillRule="evenodd" clipRule="evenodd" d="M8 1.333C5.423 1.333 3.333 3.423 3.333 6c0 3.5 4.667 8.667 4.667 8.667S12.667 9.5 12.667 6c0-2.577-2.09-4.667-4.667-4.667ZM8 7.667A1.667 1.667 0 1 1 8 4.333a1.667 1.667 0 0 1 0 3.334Z" fill="currentColor" />
              </svg>
              <span className="text-[11px] text-foreground/85">Only freelancers located in your region may apply</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#D8D8D8] dark:bg-[#121212]" />

          {/* Description */}
          <div className="flex flex-col gap-4 text-[14px] font-normal leading-[22px] text-foreground/85">
            {mockDescription.split("\n\n").map((para: string, i: number) => (
              <p key={i} className="break-words min-w-0">{para}</p>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-[#D8D8D8] dark:bg-[#121212]" />

          {/* Requirements */}
          <div className="flex flex-col gap-4">
            <p className="text-[18px] font-semibold text-foreground/85">Other Requirements</p>
            <div className="flex flex-col gap-2">
              {mockRequirements.map((req, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-[12px] text-muted shrink-0 mt-0.5">â€¢</span>
                  <p className="text-[14px] leading-[22px] text-foreground/85 flex-1">{req}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#D8D8D8] dark:bg-[#121212]" />

          {/* Skills */}
          <div className="flex flex-col gap-4">
            <p className="text-[18px] font-semibold text-foreground/85">Skills and Expertise</p>
            <div className="flex flex-wrap gap-2">
              {mockSkills.map((skill, i) => (
                <span key={i} className="px-[10px] py-[5px] rounded-[3px] bg-[#8C5CFF]/10 dark:bg-[rgba(140,92,255,0.15)] text-[#8C5CFF] text-[12px] font-normal leading-[16px] whitespace-nowrap">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#D8D8D8] dark:bg-[#121212]" />

          {/* Activity on this job */}
          <div className="flex flex-col gap-4">
            <p className="text-[18px] font-semibold text-foreground/85">Activity on this job</p>
            <div className="flex flex-col gap-2">
              {[
                { label: "Proposals:", value: `${job.proposals} received` },
                { label: "Interviewing:", value: job.status === "working" ? "1" : "0" },
                { label: "Invites sent:", value: "0" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between text-[14px]">
                  <span className="text-muted">{label}</span>
                  <span className="text-foreground/85 font-normal">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#D8D8D8] dark:bg-[#121212]" />

          {/* Interview Questions */}
          <div className="flex flex-col gap-4">
            <p className="text-[18px] font-semibold text-foreground/85">You will be asked to answer the following questions when submitting a proposal:</p>
            <div className="flex flex-col gap-5">
              {mockQuestions.map((item: { q: string; hint: string }, i: number) => (
                <div key={i} className="flex flex-col gap-2">
                  <p className="text-[14px] font-semibold text-foreground/85 break-words">{item.q}</p>
                  <p className="text-[14px] font-normal text-muted break-words">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* â”€â”€ Right: Sidebar â”€â”€ */}
        <div className="hidden lg:flex flex-col gap-8 w-[320px] shrink-0 bg-card border border-card-border rounded-[12px] p-8">

          {/* About the client */}
          <div className="flex flex-col gap-3">
            <p className="text-[16px] font-semibold text-foreground/85">About the client</p>
            <div className="flex flex-col gap-4">
              {/* Star rating */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#FF9529">
                    <path d="M7 0L8.573 4.83H13.657L9.542 7.813L11.115 12.642L7 9.659L2.885 12.642L4.458 7.813L0.343 4.83H5.427L7 0Z" />
                  </svg>
                ))}
                <span className="text-[14px] font-semibold text-foreground/85 ml-1">4.9 of 124 reviews</span>
              </div>
              {/* Stats */}
              {[
                { icon: "map-pin", label: job.freelancerName !== "No Selection Yet" ? job.freelancerName : "United States", sub: "Location" },
                { icon: "briefcase", label: "$100k+", sub: "Total spent" },
                { icon: "users", label: "$45.00 / hr", sub: "Avg hourly rate paid" },
                { icon: "file-text", label: "12 jobs posted", sub: "Jobs posted" },
                { icon: "clock", label: "Oct 12, 2018", sub: "Member since" },
              ].map(({ icon, label, sub }) => (
                <div key={sub} className="flex gap-3 items-start">
                  <div className="w-4 h-4 shrink-0 mt-0.5 text-muted">
                    {icon === "map-pin" && <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path fillRule="evenodd" clipRule="evenodd" d="M8 1.333C5.423 1.333 3.333 3.423 3.333 6c0 3.5 4.667 8.667 4.667 8.667S12.667 9.5 12.667 6c0-2.577-2.09-4.667-4.667-4.667ZM8 7.667A1.667 1.667 0 1 1 8 4.333a1.667 1.667 0 0 1 0 3.334Z" fill="currentColor" stroke="none" /></svg>}
                    {icon === "briefcase" && <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5" width="14" height="10" rx="2" /><path d="M5 5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>}
                    {icon === "users" && <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11 13v-1a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v1" /><circle cx="6.5" cy="5" r="2.5" /><path d="M13 13v-1a3 3 0 0 0-2-2.83" /><path d="M10.5 2.17a2.5 2.5 0 0 1 0 4.66" /></svg>}
                    {icon === "file-text" && <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5L9 1Z" /><path d="M9 1v4h4M6 9h4M6 11h2" /></svg>}
                    {icon === "clock" && <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6.5" /><path d="M8 4.5v4l2.5 1.5" /></svg>}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[14px] font-semibold text-foreground/85 leading-tight">{label}</p>
                    <p className="text-[12px] font-normal text-muted">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#D8D8D8] dark:bg-[#121212]" />

          {/* Project type */}
          <div className="flex flex-col gap-3">
            <p className="text-[16px] font-semibold text-foreground/85">Project Type</p>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted">
                <rect x="1" y="2" width="14" height="13" rx="2" /><path d="M1 6h14M5 2v4M11 2v4" />
              </svg>
              <span className="text-[14px] font-normal text-foreground/85">Ongoing project</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#D8D8D8] dark:bg-[#121212]" />

          {/* Job link */}
          <div className="flex flex-col gap-2">
            <p className="text-[14px] font-semibold text-foreground/85">Job link</p>
            <div className="bg-background rounded-[8px] px-3 py-3 overflow-hidden">
              <p className="text-[12px] text-primary/85 truncate">{`https://canafri.io/jobs/~${job.id.toString().padStart(8, '0')}...`}</p>
            </div>
            <button className="text-[12px] text-muted hover:text-foreground transition-colors text-left">Copy link</button>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#D8D8D8] dark:bg-[#121212]" />

          {/* Client management actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onEdit}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-[8px] bg-primary text-[14px] font-semibold text-white hover:bg-primary-hover transition-colors cursor-pointer"
            >
              <Pencil size={14} />
              Edit Job
            </button>
            <button className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-[8px] border border-primary text-[14px] font-semibold text-primary hover:bg-primary/5 transition-colors cursor-pointer">
              <Copy size={14} />
              Duplicate
            </button>
            <button className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-[8px] border border-yellow-500/30 text-[14px] font-semibold text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/5 transition-colors cursor-pointer">
              <PauseCircle size={14} />
              Pause posting
            </button>
            <button className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-[8px] border border-rose-500/30 text-[14px] font-semibold text-rose-500 hover:bg-rose-500/5 transition-colors cursor-pointer">
              <XCircle size={14} />
              Close job
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€ Job Delivery & Approval Panel (Figma 1159-17126) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
interface DeliveredFile {
  name: string;
  size: string;
  iconBg: string;
  icon: "pdf" | "zip" | "img";
  dataUrl?: string | null;
}

interface LiveDelivery {
  id: number;
  jobTitle: string;
  freelancerName: string;
  freelancerHandle: string;
  initials: string;
  avatarBg: string;
  message: string;
  submittedAt: string;
  files: DeliveredFile[];
  status: string;
  review: { rating: number; feedback: string; action: string } | null;
}

function FileIcon({ type }: { type: "pdf" | "zip" | "img" }) {
  if (type === "pdf") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-500/80">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  if (type === "zip") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-amber-500/80">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-500/80">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <polyline points="21 15 16 10 5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const FALLBACK_FILES: DeliveredFile[] = [
  { name: "project-report.pdf", size: "2.4 MB", iconBg: "bg-red-500/10", icon: "pdf" },
  { name: "source-code.zip", size: "18.7 MB", iconBg: "bg-amber-500/10", icon: "zip" },
  { name: "preview.png", size: "1.2 MB", iconBg: "bg-blue-500/10", icon: "img" },
];

function ClientDeliveryApprovalPanel({ job, onClose, onDisputeClick }: { job: Job; onClose: () => void; onDisputeClick?: () => void }) {
  // Load latest delivery from localStorage
  const [delivery] = useState<LiveDelivery | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const arr: LiveDelivery[] = JSON.parse(localStorage.getItem("canafri_job_deliveries") || "[]");
      return arr.length > 0 ? arr[0] : null;
    } catch { return null; }
  });

  // Pre-populate review state from persisted review
  const [rating, setRating] = useState(delivery?.review?.rating ?? 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState(delivery?.review?.feedback ?? "");
  const [actionDone, setActionDone] = useState<"approved" | "changes" | "rejected" | "disputed" | null>(
    (delivery?.review?.action as "approved" | "changes" | "rejected" | "disputed" | null) ?? null
  );
  const [reviewSaved, setReviewSaved] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  const displayRating = hoverRating || rating;
  const ratingLabel =
    displayRating >= 5 ? "Excellent" :
    displayRating >= 4 ? "Good" :
    displayRating >= 3 ? "Fair" :
    displayRating >= 2 ? "Poor" : "Very Poor";

  const ratingLabelColor =
    displayRating >= 5 ? "text-emerald-500" :
    displayRating >= 4 ? "text-blue-500" :
    displayRating >= 3 ? "text-amber-500" : "text-rose-500";

  const deliveredFiles: DeliveredFile[] = delivery?.files?.length
    ? delivery.files.map(f => ({
        ...f,
        icon: (["pdf", "zip", "img"].includes(f.icon) ? f.icon : "img") as "pdf" | "zip" | "img",
      }))
    : FALLBACK_FILES;

  const freelancerName = delivery?.freelancerName ?? job.freelancerName;
  const freelancerInitials = delivery?.initials ?? job.initials;
  const freelancerAvatarBg = delivery?.avatarBg ?? job.avatarClassName;
  const freelancerMessage = delivery?.message ?? "Hello! I have completed the job as per your requirements. Please review the work and let me know if any changes are needed.";
  const submittedAt = delivery?.submittedAt ?? "May 10, 2025 - 10:28 AM";

  const handleDownload = (file: DeliveredFile) => {
    if (file.dataUrl) {
      // Real file â€” trigger browser download
      const a = document.createElement("a");
      a.href = file.dataUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Mock file â€” generate a text blob as placeholder
      const blob = new Blob(
        [`This is a placeholder download for: ${file.name}\nFile size: ${file.size}\nJob: ${job.title}`],
        { type: "text/plain" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const persistAction = (action: "approved" | "changes" | "rejected" | "disputed") => {
    setActionDone(action);
    if (typeof window !== "undefined" && delivery) {
      try {
        const arr: LiveDelivery[] = JSON.parse(localStorage.getItem("canafri_job_deliveries") || "[]");
        const updated = arr.map(d =>
          d.id === delivery.id
            ? { ...d, status: action, review: { rating, feedback, action } }
            : d
        );
        localStorage.setItem("canafri_job_deliveries", JSON.stringify(updated));
      } catch (e) { console.error(e); }
    }
  };

  const handleSaveReview = () => {
    if (typeof window !== "undefined" && delivery) {
      try {
        const arr: LiveDelivery[] = JSON.parse(localStorage.getItem("canafri_job_deliveries") || "[]");
        const updated = arr.map(d =>
          d.id === delivery.id
            ? { ...d, review: { rating, feedback, action: actionDone || "pending" } }
            : d
        );
        localStorage.setItem("canafri_job_deliveries", JSON.stringify(updated));
        setReviewSaved(true);
        setTimeout(() => setReviewSaved(false), 2500);
      } catch (e) { console.error(e); }
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Close button row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-medium capitalize", getStatusStyles("to_review"))}>
            In Review
          </span>
          <span className="text-[11px] text-muted">Delivered {job.date} Â· Budget: {job.budget}</span>
        </div>
        <button onClick={onClose} title="Close" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D8D8D8] dark:border-[#121212] bg-[#FAFAFD] dark:bg-[#0B0B0B] text-muted hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
          <X size={15} />
        </button>
      </div>

      {/* Page Title */}
      <div className="flex flex-col gap-2">
        <h1 className="text-[2rem] font-bold leading-[42px] tracking-[-0.18px] text-foreground/85">Job Delivery &amp; Approval</h1>
        <p className="text-[13px] font-normal leading-[20px] text-muted">Review the freelancer's submission and approve or request changes.</p>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start flex-col lg:flex-row">

        {/* â”€â”€ Left Column â”€â”€ */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">

          {/* Freelancer Submission Card */}
          <div className="bg-card border border-card-border rounded-[16px] p-6 flex flex-col gap-5">
            <p className="text-[16px] font-bold text-foreground/85">Freelancer Submission</p>

            {/* Freelancer info row */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold text-white", freelancerAvatarBg)}>
                  {freelancerInitials}
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <p className="text-[15px] font-bold text-foreground/85">{freelancerName}</p>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-primary shrink-0">
                      <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15"/>
                      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-[13px] text-muted">Full Stack Developer</p>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 items-end">
                <p className="text-[11px] text-muted">Submitted on</p>
                <p className="text-[12px] font-medium text-foreground/85">{submittedAt}</p>
              </div>
            </div>

            {/* Freelancer Message */}
            <div className="flex flex-col gap-3">
              <p className="text-[13px] font-bold uppercase text-foreground/85">Freelancer Message</p>
              <div className="bg-background border border-[#D8D8D8] dark:border-[#121212] rounded-[8px] p-4">
                <p className="text-[14px] font-normal leading-[1.5] text-foreground/85 whitespace-pre-wrap">{freelancerMessage}</p>
              </div>
            </div>

            {/* Delivered Files */}
            <div className="flex flex-col gap-3">
              <p className="text-[13px] font-bold uppercase text-foreground/85">Delivered Files ({deliveredFiles.length})</p>
              <div className="flex flex-col gap-2">
                {deliveredFiles.map((file, idx) => (
                  <div key={`${file.name}-${idx}`}>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-[8px] shrink-0", file.iconBg)}>
                          <FileIcon type={file.icon} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[14px] font-medium text-foreground/85">{file.name}</p>
                          <p className="text-[12px] text-muted">{file.size}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(file)}
                        title={`Download ${file.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                    {idx < deliveredFiles.length - 1 && <div className="h-px bg-[#D8D8D8] dark:bg-[#121212]" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Your Review Card */}
          <div className="bg-card border border-card-border rounded-[16px] p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <p className="text-[16px] font-bold text-foreground/85">Your Review</p>
              {reviewSaved && (
                <span className="flex items-center gap-1 text-[12px] font-medium text-emerald-500 animate-in fade-in duration-200">
                  <Check size={13} /> Saved
                </span>
              )}
            </div>
            <div className="flex flex-col gap-5">
              {/* Star rating */}
              <div className="flex flex-col gap-3">
                <p className="text-[13px] font-semibold text-foreground/85">Overall Rating</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="cursor-pointer transition-transform hover:scale-125 active:scale-110 focus:outline-none"
                        title={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                      >
                        <Star
                          size={24}
                          className={cn(
                            "transition-all duration-150",
                            star <= displayRating
                              ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                              : "fill-none text-foreground/20"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  <div className={cn("px-2 py-1 rounded-[4px] bg-foreground/5 transition-colors", displayRating >= 5 ? "bg-emerald-500/10" : displayRating >= 4 ? "bg-blue-500/10" : displayRating >= 3 ? "bg-amber-500/10" : "bg-rose-500/10")}>
                    <p className={cn("text-[11px] font-semibold transition-colors", ratingLabelColor)}>{ratingLabel}</p>
                  </div>
                  <p className="text-[12px] text-muted">{displayRating}/5 stars</p>
                </div>
              </div>

              {/* Feedback textarea */}
              <div className="flex flex-col gap-3">
                <p className="text-[13px] font-semibold text-foreground/85">Feedback (optional)</p>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Great job! You delivered exactly what I needed and ahead of schedule. The code is clean and well-documented..."
                  rows={4}
                  className="w-full bg-background border border-[#D8D8D8] dark:border-[#121212] rounded-[8px] p-4 text-[14px] font-normal leading-[1.5] text-foreground/85 placeholder:text-muted resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow"
                />
              </div>

              {/* Save Review button */}
              <button
                onClick={handleSaveReview}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-primary/10 border border-primary/20 text-primary text-[13px] font-semibold hover:bg-primary/15 transition-colors cursor-pointer self-end"
              >
                <Check size={14} />
                Save Review
              </button>
            </div>
          </div>
        </div>

        {/* â”€â”€ Right Column â”€â”€ */}
        <div className="flex flex-col gap-6 w-full lg:w-[380px] shrink-0">

          {/* Job Summary Card */}
          <div className="relative bg-card border border-card-border rounded-[16px] p-6 flex flex-col gap-5">
            <p className="text-[16px] font-bold text-foreground/85">Job Summary</p>
            <div className="absolute top-6 right-6">
              <div className={cn(
                "border rounded-full px-[10px] py-1",
                actionDone === "approved" ? "bg-emerald-500/10 border-emerald-500/25" :
                actionDone === "rejected" ? "bg-rose-500/10 border-rose-500/25" :
                actionDone === "changes" ? "bg-amber-500/10 border-amber-500/25" :
                "bg-amber-500/10 border-amber-500/25"
              )}>
                <p className={cn(
                  "text-[11px] font-bold whitespace-nowrap",
                  actionDone === "approved" ? "text-emerald-500" :
                  actionDone === "rejected" ? "text-rose-500" :
                  actionDone === "changes" ? "text-amber-500" : "text-amber-500"
                )}>
                  {actionDone === "approved" ? "Approved" :
                   actionDone === "rejected" ? "Rejected" :
                   actionDone === "changes" ? "Changes Requested" : "In Review"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-[12px] text-muted">Job Title</p>
                <p className="text-[14px] font-semibold text-foreground/85">{job.title}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[12px] text-muted">Job ID</p>
                <p className="text-[14px] font-semibold text-foreground/85">#JOB-{String(job.id).padStart(4, "0")}</p>
              </div>
              <div className="h-px bg-[#D8D8D8] dark:bg-[#121212]" />
              <div className="flex flex-col gap-3 text-[13px]">
                {[
                  { label: "Milestone", value: "Final Delivery" },
                  { label: "Agreed Price", value: job.budget, bold: true },
                  { label: "Escrow Amount", value: job.budget, bold: true },
                  { label: "Due Date", value: `${job.date}, 2025` },
                  { label: "Delivery Submitted", value: submittedAt },
                ].map(({ label, value, bold }) => (
                  <div key={label} className="flex items-center justify-between">
                    <p className="text-muted">{label}</p>
                    <p className={cn("text-right text-foreground/85", bold && "font-bold")}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-[16px] p-6 flex flex-col gap-5">
            <p className="text-[16px] font-bold text-foreground/85">Approval Actions</p>
            
            {showApproveConfirm ? (
              <div className="flex flex-col gap-4 p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 size={22} />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <p className="text-[14px] font-bold text-foreground/80 leading-normal">
                      Confirm Approval
                    </p>
                    <p className="text-[12px] text-muted leading-relaxed">
                      You are approving this project. This confirms you are 100% satisfied with the freelancer's work. This action is final and cannot be undone.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowApproveConfirm(false)}
                    className="flex-1 h-[38px] flex items-center justify-center rounded-lg border border-border text-[12px] font-semibold text-foreground/80 hover:bg-foreground/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      persistAction("approved");
                      setShowApproveConfirm(false);
                    }}
                    className="flex-1 h-[38px] flex items-center justify-center rounded-lg bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 transition-colors cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    Yes, release fund to the seller
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Approve */}
                <button
                  onClick={() => setShowApproveConfirm(true)}
                  disabled={actionDone !== null}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-[12px] border transition-all cursor-pointer text-left w-full",
                    actionDone === "approved"
                      ? "bg-emerald-500/15 border-emerald-500/30"
                      : "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30",
                    actionDone !== null && actionDone !== "approved" && "opacity-40 cursor-not-allowed pointer-events-none"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                    <Check size={20} className="text-emerald-500" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[14px] font-semibold text-emerald-500">Approve &amp; Release Payment</p>
                    <p className="text-[12px] text-muted">Freelancer will receive the payment</p>
                  </div>
                </button>

                {/* Request Changes */}
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.setItem("canafri_dispute_mode", "changes");
                    }
                    if (onDisputeClick) onDisputeClick();
                  }}
                  disabled={actionDone !== null}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-[12px] border transition-all cursor-pointer text-left w-full",
                    actionDone === "changes"
                      ? "bg-amber-500/15 border-amber-500/30"
                      : "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/30",
                    actionDone !== null && actionDone !== "changes" && "opacity-40 cursor-not-allowed pointer-events-none"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                    <RefreshCw size={20} className="text-amber-500" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[14px] font-semibold text-amber-500">Request Changes</p>
                    <p className="text-[12px] text-muted">Send feedback and request updates</p>
                  </div>
                </button>

                {/* Reject */}
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.setItem("canafri_dispute_mode", "reject");
                    }
                    if (onDisputeClick) onDisputeClick();
                  }}
                  disabled={actionDone !== null}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-[12px] border transition-all cursor-pointer text-left w-full",
                    actionDone === "rejected"
                      ? "bg-rose-500/15 border-rose-500/30"
                      : "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10 hover:border-rose-500/30",
                    actionDone !== null && actionDone !== "rejected" && "opacity-40 cursor-not-allowed pointer-events-none"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/10">
                    <XCircle size={20} className="text-rose-500" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[14px] font-semibold text-rose-500">Reject Delivery</p>
                    <p className="text-[12px] text-muted">Reject and ask freelancer to redo</p>
                  </div>
                </button>

                {/* Dispute */}
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.setItem("canafri_dispute_mode", "dispute");
                    }
                    if (onDisputeClick) onDisputeClick();
                  }}
                  disabled={actionDone !== null}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-[12px] border transition-all cursor-pointer text-left w-full",
                    actionDone === "disputed"
                      ? "bg-red-500/15 border-red-500/30"
                      : "bg-red-500/5 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30",
                    actionDone !== null && actionDone !== "disputed" && "opacity-40 cursor-not-allowed pointer-events-none"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                    <Flag size={20} className="text-red-500" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[14px] font-semibold text-red-500">Dispute Delivery</p>
                    <p className="text-[12px] text-muted">Raise complaint on project submitted</p>
                  </div>
                </button>

                {/* Undo action — only visible after selection */}
                {actionDone !== null && (
                  <button
                    onClick={() => setActionDone(null)}
                    className="flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium text-muted hover:text-foreground/80 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    Undo decision
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Help / Dispute Card */}
          <div className="bg-card border border-card-border rounded-[16px] p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-[14px] font-bold text-primary">Need Help?</p>
                <p className="text-[12px] leading-[1.5] text-muted">
                  If you face any issue with this delivery, you can{" "}
                  <span className="text-primary underline cursor-pointer hover:opacity-80 transition-opacity">open a dispute.</span>
                </p>
              </div>
              <button className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-[8px] border border-primary/20 text-primary hover:bg-primary/5 transition-colors cursor-pointer">
                <Flag size={14} />
                <span className="text-[13px] font-semibold">Open Dispute</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* â”€â”€â”€ Tab Button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€*/
function TabButton({ label, count, isActive, onClick }: {
  label: string; count: number; isActive: boolean; onClick: () => void;

}) {
  const [hovered, setHovered] = useState(false);

  const stroke = "inset 0 0.5px 0 0 #8C5CFF, inset 0.5px 0 0 0 #8C5CFF, inset -0.5px 0 0 0 #8C5CFF, inset 0 -2px 0 0 #8C5CFF";
  const shadow = isActive ? stroke : (hovered ? stroke : "none");

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ boxShadow: shadow }}
      className={cn(
        "flex-1 flex items-center justify-center gap-[0.375rem] h-full relative px-4",
        "font-sans text-[0.8125rem] leading-[1.125rem] select-none cursor-pointer whitespace-nowrap",
        "transition-all duration-200 ease-out transform",
        isActive
          ? "font-semibold text-foreground/80 bg-[#8C5CFF]/10 dark:bg-[#8C5CFF]/15 scale-[1.02] z-10"
          : "font-normal text-muted/80 bg-transparent hover:text-foreground/80 hover:scale-[1.01] hover:z-10"
      )}
    >
      <span>{label}</span>
      <span className={cn(
        "flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full px-[0.25rem]",
        "text-[0.6875rem] font-medium transition-colors duration-200",
        isActive ? "bg-[#8C5CFF] text-white opacity-80" : "bg-foreground/10 text-muted/80",
      )}>
        {count}
      </span>
    </button>
  );
}

/* â”€â”€â”€ Tab Scroll Container with arrow buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function TabScrollContainer({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 2);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -160 : 160, behavior: 'smooth' });
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <button
        onClick={() => scroll('left')}
        aria-label="Scroll tabs left"
        className={cn(
          "absolute left-0 top-0 h-full z-20 flex items-center justify-center w-14 lg:hidden cursor-pointer",
          "bg-gradient-to-r from-[#FAFAFD] dark:from-[#0B0B0B] via-[#FAFAFD]/90 dark:via-[#0B0B0B]/90 to-transparent",
          "transition-opacity duration-200",
          showLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <ChevronLeft size={28} strokeWidth={2} className="text-muted/80" />
      </button>

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex h-full w-full overflow-x-auto no-scrollbar"
      >
        <div className="flex h-full min-w-max lg:min-w-0 lg:w-full">
          {children}
        </div>
      </div>

      <button
        onClick={() => scroll('right')}
        aria-label="Scroll tabs right"
        className={cn(
          "absolute right-0 top-0 h-full z-20 flex items-center justify-center w-14 lg:hidden cursor-pointer",
          "bg-gradient-to-l from-[#FAFAFD] dark:from-[#0B0B0B] via-[#FAFAFD]/90 dark:via-[#0B0B0B]/90 to-transparent",
          "transition-opacity duration-200",
          showRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <ChevronRight size={28} strokeWidth={2} className="text-muted/80" />
      </button>
    </div>
  );
}

/* â”€â”€â”€ Search Toolbar: Search + Filter + Sort â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function SearchToolbar({ 
  onSearchChange, 
  filter, 
  setFilter, 
  sort, 
  setSort 
}: {
  onSearchChange: (val: string) => void;
  filter: string;
  setFilter: (val: string) => void;
  sort: string;
  setSort: (val: string) => void;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen]     = useState(false);

  const filters = ['All', 'Open', 'Working', 'Completed', 'Drafts'];
  const sorts   = ['Newest', 'Oldest', 'Budget: Low to High', 'Budget: High to Low'];

  const baseDropdown = "absolute right-0 top-[calc(100%+6px)] z-50 min-w-[10rem] rounded-xl border border-[#D8D8D8] dark:border-[#1e1e1e] bg-[#FAFAFD] dark:bg-[#0B0B0B] shadow-lg overflow-hidden";
  const dropItem     = "w-full px-3.5 py-2 text-left text-[0.8125rem] text-foreground/80 hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors duration-150 cursor-pointer";
  const dropActive   = "bg-[#8C5CFF]/10 dark:bg-[#8C5CFF]/15 text-[#8C5CFF]/80 font-semibold";
  const pill         = "flex items-center gap-1.5 px-4 py-[0.5625rem] rounded-[3.125rem] bg-[#F5F8FB] dark:bg-[#161616] border border-[#D8D8D8] dark:border-[#1e1e1e] text-[0.8125rem] font-medium text-foreground/80 cursor-pointer select-none hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors duration-150 whitespace-nowrap";

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex items-center gap-3 px-4 py-[0.5625rem] rounded-[3.125rem] bg-[#F5F8FB] dark:bg-[#161616] border border-[#D8D8D8] dark:border-[#1e1e1e] flex-1 min-w-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="shrink-0 text-foreground/40">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          type="text"
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search posted jobs..."
          className="w-full bg-transparent text-[#010101]/80 dark:text-[rgba(255,255,255,0.8)] text-[0.8125rem] leading-[1.125rem] placeholder:text-muted/80 outline-none"
        />
      </div>

      {/* Filter dropdown */}
      <div className="relative shrink-0">
        <button
          onClick={() => { setFilterOpen(v => !v); setSortOpen(false); }}
          className={pill}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="text-foreground/50">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <span className="hidden sm:inline">Filter:</span>
          <span className="text-[#8C5CFF]/80 font-semibold">{filter}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={cn("text-foreground/40 transition-transform duration-200", filterOpen && "rotate-180")}>
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        {filterOpen && (
          <div className={baseDropdown}>
            {filters.map(f => (
              <button key={f} onClick={() => { setFilter(f); setFilterOpen(false); }}
                className={cn(dropItem, filter === f && dropActive)}>
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sort dropdown */}
      <div className="relative shrink-0">
        <button
          onClick={() => { setSortOpen(v => !v); setFilterOpen(false); }}
          className={pill}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="text-foreground/50">
            <path d="M3 6h18M7 12h10M11 18h2"/>
          </svg>
          <span className="hidden sm:inline">Sort:</span>
          <span className="text-[#8C5CFF]/80 font-semibold truncate max-w-[5rem]">{sort}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={cn("text-foreground/40 transition-transform duration-200", sortOpen && "rotate-180")}>
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        {sortOpen && (
          <div className={baseDropdown}>
            {sorts.map(s => (
              <button key={s} onClick={() => { setSort(s); setSortOpen(false); }}
                className={cn(dropItem, sort === s && dropActive)}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
interface BuyerJobsPageProps {
  onBack?: () => void;
  onJobClick?: () => void;
  onCreateJobClick?: () => void;
  onDisputeClick?: () => void;
}

export default function BuyerJobsPage({ onBack, onJobClick, onCreateJobClick, onDisputeClick }: BuyerJobsPageProps) {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [jobs, setJobs] = useState<Job[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("canafri_posted_jobs");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return mockJobs;
  });

  // Build tabs dynamically — include Proposals tab with live count
  const proposalJobs = jobs.filter(j => j.proposals > 0);
  const tabs = [
    ...STATIC_TABS.slice(0, 1), // All
    { label: "Proposals", count: proposalJobs.length },
    ...STATIC_TABS.slice(1),    // Open, Working …
  ];

  // Filter and Search logic
  const filteredJobs = jobs.filter(job => {
    // Tab filter
    if (activeTab === "Proposals"  && job.proposals === 0) return false;
    if (activeTab === "Open"       && job.status !== "open") return false;
    if (activeTab === "Working"    && job.status !== "working") return false;
    if (activeTab === "To Review"  && job.status !== "to_review") return false;
    if (activeTab === "Drafts"     && job.status !== "draft") return false;
    if (activeTab === "Completed"  && job.status !== "completed") return false;

    // Search input
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = job.title.toLowerCase().includes(q);
      const matchFreelancer = job.freelancerName.toLowerCase().includes(q);
      if (!matchTitle && !matchFreelancer) return false;
    }

    // Filter Dropdown
    if (filter === "Open"      && job.status !== "open") return false;
    if (filter === "Working"   && job.status !== "working") return false;
    if (filter === "Completed" && job.status !== "completed") return false;
    if (filter === "Drafts"    && job.status !== "draft") return false;

    return true;
  });

  // Handle row click — Proposals tab navigates to ReviewProposals, others open detail panel
  const handleRowClick = (job: Job) => {
    if (activeTab === "Proposals") {
      if (typeof window !== "undefined") {
        localStorage.setItem("canafri_selected_job_for_proposals", JSON.stringify({
          id: job.id,
          title: job.title,
          category: job.category,
          budget: job.budget,
          proposals: job.proposals,
          status: job.status,
        }));
      }
      onJobClick?.();
    } else {
      setSelectedJob(job);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-y-auto no-scrollbar">
      <div className="mx-auto flex max-w-6xl flex-col gap-9 px-4 py-10 sm:px-6 lg:px-8 w-full">

        {/* Top Header Row â€” always visible */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8D8D8] dark:border-[#121212] bg-[#FAFAFD] dark:bg-[#0B0B0B] text-muted hover:text-foreground transition-colors cursor-pointer"
                title="Back"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground/80 sm:text-[2rem]">
              Manage posted jobs
            </h1>
          </div>

          <button
            onClick={onCreateJobClick}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 font-sans text-[13px] font-semibold leading-[18px] text-white hover:bg-primary-hover active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-[#8C5CFF]/10"
          >
            <Plus size={16} />
            Post a Job
          </button>
        </div>

        {/* Stats Grid â€” always visible */}
        <div>
          {/* Desktop */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="h-[7.5rem] rounded-2xl border border-[#D8D8D8] dark:border-[#121212] bg-[#FAFAFD] dark:bg-[#0B0B0B] px-6 flex flex-col justify-center gap-1.5 shadow-sm">
                <span className="text-[0.8125rem] font-medium text-muted/80">{stat.label}</span>
                <span className="text-[1.375rem] font-medium tracking-[-0.066px] text-foreground/80">{stat.value}</span>
                <span className={cn("text-[0.6875rem]", stat.subClassName)}>{stat.sub}</span>
              </div>
            ))}
          </div>

          {/* Mobile & Tablet â€” single wrapper card, 2Ã—2 grid */}
          <div className="lg:hidden rounded-2xl border border-[#D8D8D8] dark:border-[#121212] bg-[#FAFAFD] dark:bg-[#0B0B0B] overflow-hidden">
            <div className="grid grid-cols-2">
              {stats.map((stat, idx) => (
                <div
                  key={stat.label}
                  className={cn(
                    "h-[7.5rem] px-5 sm:px-6 flex flex-col justify-center gap-1.5",
                    idx === 0 && "border-r border-b border-[#D8D8D8]/50 dark:border-[#121212]/50",
                    idx === 1 && "border-b border-[#D8D8D8]/50 dark:border-[#121212]/50",
                    idx === 2 && "border-r border-[#D8D8D8]/50 dark:border-[#121212]/50",
                  )}
                >
                  <span className="text-[0.8125rem] font-medium text-muted/80">{stat.label}</span>
                  <span className="text-[1.375rem] font-medium tracking-[-0.066px] text-foreground/80">{stat.value}</span>
                  <span className={cn("text-[0.6875rem]", stat.subClassName)}>{stat.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search + Tabs â€” always visible */}
        <div className="flex flex-col gap-[5px]">
          <SearchToolbar
            onSearchChange={setSearchQuery}
            filter={filter}
            setFilter={setFilter}
            sort={sort}
            setSort={setSort}
          />

          {/* Tab scrollable container */}
          <div className="w-full h-[3.75rem] border border-[#D8D8D8] dark:border-[#121212] bg-[#FAFAFD] dark:bg-[#0B0B0B]">
            <TabScrollContainer>
              {tabs.map((tab) => (
                <TabButton
                  key={tab.label}
                  label={tab.label}
                  count={tab.count}
                  isActive={tab.label === activeTab}
                  onClick={() => { setActiveTab(tab.label); setSelectedJob(null); }}
                />
              ))}
            </TabScrollContainer>
          </div>
        </div>

        {/* Content area â€” switches between detail panels and table */}
        {selectedJob?.status === "to_review" ? (
          <ClientDeliveryApprovalPanel
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            onDisputeClick={() => {
              if (typeof window !== "undefined") {
                localStorage.setItem("canafri_dispute_job_id", String(selectedJob.id));
              }
              if (onDisputeClick) onDisputeClick();
            }}
          />
        ) : selectedJob ? (
          <ClientJobDetailPanel
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            onEdit={() => {
              setSelectedJob(null);
              if (onCreateJobClick) onCreateJobClick();
            }}
          />
        ) : (
          /* Table Container */
          <div className="overflow-hidden rounded-2xl border border-[#D8D8D8] dark:border-[#121212] bg-[#FAFAFD] dark:bg-[#0B0B0B]">

            {/* Header info */}
            <div className="px-6 py-4 border-b border-[#D8D8D8] dark:border-[#121212] bg-foreground/[0.01] dark:bg-white/[0.01] flex items-center justify-between">
              <h2 className="text-[0.9375rem] font-semibold text-foreground/80">
                {activeTab === "Proposals" ? "Jobs with Proposals" : `${activeTab} Postings`}
              </h2>
              <span className="text-[0.6875rem] font-medium text-muted/80">
                {activeTab === "Proposals"
                  ? `${filteredJobs.length} job${filteredJobs.length !== 1 ? 's' : ''} received proposals`
                  : `Showing ${filteredJobs.length} active job listings`
                }
              </span>
            </div>

            {/* Horizontally scrollable list */}
            <div className="overflow-x-auto no-scrollbar">
              <div className="grid grid-cols-[minmax(9rem,2fr)_minmax(12rem,3fr)_minmax(5rem,1fr)_minmax(5rem,1fr)_minmax(3rem,0.6fr)_minmax(6rem,1.2fr)] items-center gap-4 border-b border-[#D8D8D8] dark:border-[#121212] px-6 py-3 min-w-[42rem]">
                <span className="text-[0.75rem] font-medium text-foreground/80">Freelancer</span>
                <span className="text-[0.75rem] font-medium text-foreground/80">Job Title</span>
                <span className="text-[0.75rem] font-medium text-foreground/80">Posted</span>
                <span className="text-[0.75rem] font-medium text-foreground/80">Budget</span>
                <span className="text-[0.75rem] font-medium text-foreground/80 text-center">Proposals</span>
                <span className="text-[0.75rem] font-medium text-foreground/80 text-right">Status</span>
              </div>

              <div className="divide-y divide-[#D8D8D8] dark:divide-[#121212]">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => handleRowClick(job)}
                      className="grid grid-cols-[minmax(9rem,2fr)_minmax(12rem,3fr)_minmax(5rem,1fr)_minmax(5rem,1fr)_minmax(3rem,0.6fr)_minmax(6rem,1.2fr)] items-center gap-4 px-6 py-4 min-w-[42rem] cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] active:bg-black/[0.04] dark:active:bg-white/[0.04] transition-colors duration-200"
                    >
                      {/* Candidate info / avatar */}
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "flex h-[2.25rem] w-[2.25rem] md:h-[2.8125rem] md:w-[2.8125rem] shrink-0 items-center justify-center rounded-full text-[0.75rem] md:text-[0.875rem] font-semibold text-white",
                          job.avatarClassName,
                        )}>
                          {job.initials}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[0.75rem] md:text-[0.875rem] font-medium text-foreground/80 leading-5 truncate">{job.freelancerName}</span>
                          <span className="text-[0.625rem] md:text-[0.6875rem] font-medium text-muted/80 truncate">{job.freelancerHandle}</span>
                        </div>
                      </div>

                      {/* Job Title / category */}
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[0.75rem] md:text-[0.875rem] font-medium text-foreground/80 leading-5 truncate">{job.title}</span>
                        <span className="text-[0.625rem] md:text-[0.8125rem] font-medium text-muted/80 truncate">{job.category}</span>
                      </div>

                      {/* Date */}
                      <span className="text-[0.75rem] md:text-[0.8125rem] font-medium text-muted/80">{job.date}</span>

                      {/* Budget */}
                      <span className="text-[0.75rem] md:text-[0.8125rem] font-medium text-muted/80">{job.budget}</span>

                      {/* Proposals count */}
                      <div className="text-[0.75rem] md:text-[0.8125rem] font-semibold text-foreground/80 text-center">
                        {job.proposals}
                      </div>

                      {/* Status */}
                      <div className="flex justify-end">
                        <span className={cn(
                          "inline-flex items-center justify-center rounded-full px-2.5 md:px-3 py-1 text-[0.5625rem] md:text-[0.625rem] font-medium capitalize whitespace-nowrap",
                          getStatusStyles(job.status)
                        )}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-12 text-center text-muted/80 text-[0.8125rem]">
                    No job postings found matching the selected filters.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
