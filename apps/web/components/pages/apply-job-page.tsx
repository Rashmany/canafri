'use client';

import { useState, useRef } from "react";
import { FileCheck, Link2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Job {
  id: number;
  title: string;
  timeAgo: string;
  pay: string;
  payType: string;
  payUnit: string;
  proposals: number;
}

interface ApplyJobPageProps {
  job: Job | null;
  onBack: () => void;
}

// ─── Sub-components (layout-identical to provided code) ───────────────────────

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[14px] w-full px-6 py-6 rounded-3xl border border-border bg-card">
      <p className="text-[13px] font-medium leading-[18px] text-[#010101] dark:text-white">{title}</p>
      <div className="h-px w-full bg-[#D8D8D8] dark:bg-[#121212]" />
      {children}
    </div>
  );
}

function FormField({
  label,
  required,
  placeholder,
  value,
  onChange,
  maxLength = 300,
  hint,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-[5px]">
      <label className="text-[13px] font-medium leading-[18px] text-[#010101]/80 dark:text-[rgba(255,255,255,0.8)]">
        {label} {required && <span className="text-[#F87171]">*</span>}
      </label>
      <div className="relative">
        <textarea
          className="w-full min-h-[90px] px-3 py-3 rounded-[5px] border border-[#D8D8D8] dark:border-[#121212] bg-[#F5F8FB] dark:bg-[#161616] text-[13px] font-normal leading-5 text-[#010101]/80 dark:text-[rgba(255,255,255,0.8)] placeholder:text-muted resize-none focus:outline-none focus:border-[#8C5CFF] transition-colors"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
        />
        <span className="absolute bottom-2 right-3 text-[10px] font-normal leading-[13px] text-muted">
          {value.length}/{maxLength}
        </span>
      </div>
      {hint && (
        <p className="text-[10px] font-normal leading-[13px] text-muted">{hint}</p>
      )}
    </div>
  );
}

function TermInput({
  value,
  onChange,
  unit,
  onUnitChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  unit: string;
  onUnitChange: (u: string) => void;
  options: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex h-[33px] relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 px-[10px] rounded-l-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] text-[11px] font-normal text-[#010101] dark:text-white focus:outline-none focus:border-[#8C5CFF]"
      />
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-[4px] w-[70px] px-2 rounded-r-[5px] border-y border-r border-border bg-[#F5F8FB] dark:bg-[#161616] text-[11px] font-normal text-muted hover:bg-black/[0.02] dark:hover:bg-white/5 transition-colors"
      >
        <span>{unit}</span>
        <svg width="10" height="5" viewBox="0 0 10 5" fill="none" className="opacity-70 shrink-0">
          <path d="M8.34741 3.24742e-08L9.09033 0.743627L5.04139 4.79398C4.97651 4.85927 4.89936 4.91108 4.81438 4.94644C4.7294 4.9818 4.63826 5 4.54622 5C4.45418 5 4.36304 4.9818 4.27806 4.94644C4.19308 4.91108 4.11593 4.85927 4.05105 4.79398L0 0.743627L0.742926 0.000700839L4.54517 3.80224L8.34741 3.24742e-08Z" fill="#A0A0A0"/>
        </svg>
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-[35px] w-[80px] rounded-lg border border-border bg-card shadow-lg py-1 z-40 animate-in fade-in duration-100">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onUnitChange(opt);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-1.5 text-[11px] text-left text-[#010101] dark:text-white hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors"
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TipsSidebar({ onSubmit, onSave }: { onSubmit: () => void; onSave: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-[9px] p-6 rounded-2xl bg-[#8C5CFF]/10 dark:bg-[rgba(140,92,255,0.12)]">
        <p className="text-[13px] font-medium leading-[18px] text-[#8C5CFF] opacity-80">
          Tips for a strong proposal
        </p>
        <ul className="flex flex-col gap-[3px] list-disc list-inside">
          {[
            "Address the specific requirements listed in the job",
            "Include relevant past work or portfolio links",
            "Set a realistic delivery time and rate",
            "Ask a thoughtful question to show genuine interest",
            "Keep it concise — clients read many proposals",
          ].map((tip, i) => (
            <li key={i} className="text-[13px] font-medium leading-[18px] text-[#8C5CFF] opacity-50">
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onSubmit}
          className="flex items-center justify-center h-[34px] w-full px-4 py-2 rounded-[12px] bg-[#8C5CFF] text-white text-[13px] font-semibold leading-[18px] hover:opacity-90 transition-opacity"
        >
          Submit proposal
        </button>
        <button
          onClick={onSave}
          className="flex items-center justify-center w-full px-4 py-2 rounded-[12px] border border-[#8C5CFF]/30 dark:border-[#8C5CFF]/20 text-[#8C5CFF] text-[13px] font-semibold leading-[18px] hover:bg-[#8C5CFF]/5 dark:hover:bg-[#8C5CFF]/10 transition-colors"
        >
          Save for later
        </button>
      </div>
    </div>
  );
}

export default function ApplyJobPage({ job, onBack }: ApplyJobPageProps) {
  const [coverLetter, setCoverLetter] = useState("");
  const [approach, setApproach] = useState("");
  const [questions, setQuestions] = useState("");
  const [rate, setRate] = useState("1200");
  const [rateUnit, setRateUnit] = useState("CC");
  const [delivery, setDelivery] = useState("30");
  const [deliveryUnit, setDeliveryUnit] = useState("days");
  const [files, setFiles] = useState([
    { type: "file", name: "dashboard-project-2025.pdf" },
    { type: "link", name: "dashboard-project-2025.pdf" },
  ]);
  const [showSuccess, setShowSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles).map((file) => ({
      type: "file",
      name: file.name,
    }));

    setFiles((prev) => {
      const combined = [...prev, ...newFiles];
      return combined.slice(0, 3);
    });
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Compulsory field validation checks
    if (!coverLetter.trim()) {
      alert("Cover Letter is compulsory. Please explain why you are a great fit.");
      return;
    }
    if (coverLetter.trim().length < 100) {
      alert("Cover Letter must be at least 100 characters.");
      return;
    }
    if (!approach.trim()) {
      alert("Your Approach is compulsory. Please describe how you will complete the project.");
      return;
    }
    if (!rate.trim()) {
      alert("Your Rate is compulsory. Please enter your rate.");
      return;
    }
    if (!delivery.trim()) {
      alert("Estimated Delivery is compulsory. Please enter the estimated delivery time.");
      return;
    }

    setShowSuccess(true);
  };

  const handleSave = () => {
    alert("Saved for later!");
  };

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar bg-background">
      <div className="mx-auto max-w-6xl w-full px-8 py-6 flex flex-col gap-9">

        {/* Back nav */}
        <button onClick={onBack} className="flex items-center gap-[2px] w-fit hover:opacity-80 transition-opacity">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3.4605 6.25L6.357 9.146L6 9.5L2.5 6L6 2.5L6.357 2.854L3.46 5.75H9.5V6.25H3.4605Z" fill="currentColor" className="text-muted" />
          </svg>
          <span className="text-[10px] font-normal leading-[13px] text-muted">Back to job</span>
        </button>

        <div className="flex items-start gap-6">

          {/* ── Left: main form ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-[17px]">

            {/* Job summary card */}
            <div className="flex items-center justify-between w-full px-6 py-6 rounded-2xl border border-border bg-card">
              <div className="flex flex-col gap-[10px] flex-1 min-w-0 mr-4">
                <span className="inline-flex self-start items-center justify-center px-[5px] py-[1px] rounded-[10px] bg-[#8C5CFF]/10 dark:bg-[rgba(140,92,255,0.15)] text-[#8C5CFF] text-[10px] font-normal leading-[13px]">
                  Development
                </span>
                <div className="flex flex-col gap-[7px]">
                  <p className="text-[13px] font-normal leading-5 text-[#010101] dark:text-white">
                    {job?.title ?? "Build a React and Next.js frontend for a Canton wallet dashboard"}
                  </p>
                  <div className="flex items-center gap-[15px] flex-wrap">
                    {["30 days", `${job?.proposals ?? 12} applicants`, "Amara C.", "Trust 96"].map((m) => (
                      <span key={m} className="text-[11px] font-normal leading-4 text-muted">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-[3px] flex-shrink-0">
                <p className="text-[15px] font-medium leading-[19px] text-[#010101] dark:text-white">1,200 CC</p>
                <p className="text-[10px] font-normal leading-[13px] text-muted">5 milestones</p>
              </div>
            </div>

            {/* Cover Letter card */}
            <FormCard title="Cover Letter">
              <FormField
                label="Why are you a great fit for this job?"
                required
                placeholder="Introduce yourself and explain why you are the right person for this job, mention relevance experience, past projects..."
                value={coverLetter}
                onChange={setCoverLetter}
                maxLength={300}
                hint="Minimum 100 characters. Be specific — generic proposals are less likely to be selected."
              />
            </FormCard>

            {/* Your Approach card */}
            <FormCard title="Your Approach">
              <FormField
                label="How will you complete this project?"
                required
                placeholder="Describe your plan, tools you will use, and how you will handle each milestone..."
                value={approach}
                onChange={setApproach}
                maxLength={300}
              />
              <FormField
                label="Any questions for the client? (Optional)"
                placeholder="Ask anything that will help you deliver better work..."
                value={questions}
                onChange={setQuestions}
                maxLength={300}
              />
            </FormCard>

            {/* Your Terms card */}
            <FormCard title="Your Terms">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex flex-col gap-[5px] flex-1 min-w-[120px] relative">
                  <label className="text-[11px] font-normal leading-4 text-[#010101]/80 dark:text-[rgba(255,255,255,0.8)]">
                    Your rate <span className="text-[#F87171]">*</span>
                  </label>
                  <TermInput
                    value={rate}
                    onChange={setRate}
                    unit={rateUnit}
                    onUnitChange={setRateUnit}
                    options={["CC", "USD"]}
                  />
                  <span className="text-[10px] font-normal leading-[13px] text-muted">Client budget: 1,200 CC</span>
                </div>
                <div className="flex flex-col gap-[5px] flex-1 min-w-[120px] relative">
                  <label className="text-[11px] font-normal leading-4 text-[#010101]/80 dark:text-[rgba(255,255,255,0.8)]">
                    Estimated delivery <span className="text-[#F87171]">*</span>
                  </label>
                  <TermInput
                    value={delivery}
                    onChange={setDelivery}
                    unit={deliveryUnit}
                    onUnitChange={setDeliveryUnit}
                    options={["days", "weeks", "months"]}
                  />
                  <span className="text-[10px] font-normal leading-[13px] text-muted">Client budget: 30 days</span>
                </div>
              </div>
              <div className="flex items-center justify-center px-[2px] py-[2px] rounded-[6px] bg-[#8C5CFF]/10 dark:bg-[rgba(140,92,255,0.12)] w-fit">
                <span className="text-[#8C5CFF] text-[10px] font-normal leading-[13px] opacity-50 px-2">
                  5% will be deducted for platform maintenance
                </span>
              </div>
            </FormCard>

            {/* Portfolio Samples card */}
            <FormCard title="Portfolio Samples (Optional up to 3)">
              <div className="flex flex-col gap-3">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                />

                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between h-[50px] px-[5px] rounded-[5px] border border-dashed border-[#D8D8D8] dark:border-[#242424] bg-[#F5F8FB] dark:bg-[#161616]">
                    <div className="flex items-center gap-[18px] pl-[10px]">
                      {f.type === "file" ? (
                        <FileCheck size={20} className="text-green-500 shrink-0" />
                      ) : (
                        <Link2 size={20} className="text-[#8C5CFF] shrink-0" />
                      )}
                      <span className="text-[13px] font-normal leading-5 text-muted">{f.name}</span>
                    </div>
                    <button className="pr-[10px]" onClick={() => handleRemoveFile(i)}>
                      <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                        <path d="M9.69629 20.3028L20.3038 9.69531M20.3038 20.3028L9.69629 9.69531" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" className="text-muted"/>
                      </svg>
                    </button>
                  </div>
                ))}

                {files.length < 3 && (
                  <button
                    className="flex items-center gap-1 mt-1 hover:opacity-80 transition-opacity"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8.00033 3.66602C8.08873 3.66602 8.17352 3.70113 8.23603 3.76365C8.29854 3.82616 8.33366 3.91094 8.33366 3.99935V7.66602H12.0003C12.0887 7.66602 12.1735 7.70113 12.236 7.76365C12.2985 7.82616 12.3337 7.91094 12.3337 7.99935C12.3337 8.08775 12.2985 8.17254 12.236 8.23505C12.1735 8.29756 12.0887 8.33268 12.0003 8.33268H8.33366V11.9993C8.33366 12.0878 8.29854 12.1725 8.23603 12.2351C8.17352 12.2976 8.00033 12.3327 8.00033 12.3327C7.91192 12.3327 7.82714 12.2976 7.76462 12.2351C7.70211 12.1725 7.66699 12.0878 7.66699 11.9993V8.33268H4.00033C3.91192 8.33268 3.82714 8.29756 3.76462 8.23505C3.70211 8.17254 3.66699 8.08775 3.66699 7.99935C3.66699 7.91094 3.70211 7.82616 3.76462 7.76365C3.82714 7.70113 3.91192 7.66602 4.00033 7.66602H7.66699V3.99935C7.66699 3.91094 7.70211 3.82616 7.76462 3.76365C7.82714 3.70113 7.91192 3.66602 8.00033 3.66602Z" fill="currentColor" className="text-muted"/>
                    </svg>
                    <span className="text-[10px] font-normal leading-[13px] text-muted">Add link or file</span>
                  </button>
                )}

                <p className="text-[10px] font-normal leading-[13px] text-muted">
                  Minimum 100 characters. Be specific — generic proposals are less likely to be selected.
                </p>
              </div>
            </FormCard>

          </div>

          {/* ── Right: tips + actions sidebar (desktop only) ── */}
          <div className="w-[390px] flex-shrink-0 lg:sticky lg:top-6 flex-col gap-6 hidden lg:flex">
            <TipsSidebar onSubmit={handleSubmit} onSave={handleSave} />
          </div>
        </div>

        {/* Mobile: tips + actions below form */}
        <div className="flex flex-col gap-6 lg:hidden">
          <TipsSidebar onSubmit={handleSubmit} onSave={handleSave} />
        </div>

      </div>

      {showSuccess && (
        <ProposalSuccessModal
          onClose={() => {
            setShowSuccess(false);
            onBack();
          }}
          onBrowseMore={() => {
            setShowSuccess(false);
            onBack();
          }}
        />
      )}
    </div>
  );
}

// ─── Modal Popup Component ──────────────────────────────────────────────────

interface ProposalSuccessModalProps {
  onClose: () => void;
  onBrowseMore: () => void;
}

function ProposalSuccessModal({ onClose, onBrowseMore }: ProposalSuccessModalProps) {
  const [copied, setCopied] = useState(false);
  const jobId = "tx-8457383";

  const handleCopy = () => {
    navigator.clipboard.writeText(jobId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-[390px] bg-card border border-border rounded-2xl px-4 pt-6 pb-9 flex flex-col items-center gap-4 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Close button row */}
        <div className="flex justify-end w-full">
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 12.708L15.246 15.954C15.339 16.0473 15.454 16.0973 15.59 16.104C15.726 16.1107 15.847 16.0607 15.954 15.954C16.061 15.8473 16.114 15.7293 16.114 15.6C16.114 15.4707 16.061 15.3527 15.954 15.246L12.708 12L15.954 8.754C16.047 8.66067 16.097 8.546 16.104 8.41C16.111 8.274 16.061 8.15267 15.954 8.046C15.847 7.93933 15.729 7.886 15.6 7.886C15.471 7.886 15.353 7.93933 15.246 8.046L12 11.292L8.754 8.046C8.661 7.95267 8.546 7.90267 8.41 7.896C8.274 7.88933 8.153 7.93933 8.046 8.046C7.939 8.15267 7.886 8.27067 7.886 8.4C7.886 8.52933 7.939 8.64733 8.046 8.754L11.292 12L8.046 15.246C7.953 15.3393 7.903 15.4543 7.896 15.591C7.889 15.7263 7.939 15.8473 8.046 15.954C8.153 16.0607 8.271 16.114 8.4 16.114C8.529 16.114 8.647 16.0607 8.754 15.954L12 12.708ZM12.003 21C10.758 21 9.588 20.764 8.493 20.292C7.398 19.8193 6.445 19.178 5.634 18.368C4.823 17.558 4.182 16.606 3.709 15.512C3.236 14.418 3 13.2483 3 12.003C3 10.7577 3.236 9.58767 3.709 8.493C4.181 7.39767 4.821 6.44467 5.63 5.634C6.439 4.82333 7.391 4.18167 8.487 3.709C9.583 3.23633 10.753 3 11.997 3C13.241 3 14.411 3.23633 15.507 3.709C16.602 4.181 17.555 4.82167 18.366 5.631C19.177 6.44033 19.818 7.39267 20.291 8.488C20.764 9.58333 21 10.753 21 11.997C21 13.241 20.764 14.411 20.292 15.507C19.82 16.603 19.179 17.556 18.368 18.366C17.557 19.176 16.605 19.8177 15.512 20.291C14.419 20.7643 13.249 21.0007 12.003 21ZM12 20C14.233 20 16.125 19.225 17.675 17.675C19.225 16.125 20 14.2333 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.233 4 12 4C9.767 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 14.2333 4.775 16.125 6.325 17.675C7.875 19.225 9.767 20 12 20Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        {/* Content area */}
        <div className="flex flex-col items-center gap-[30px] w-full">
          {/* Checkmark icon */}
          <svg
            width="106"
            height="106"
            viewBox="0 0 106 106"
            fill="none"
          >
            <path
              d="M53.0006 8.83398C28.6472 8.83398 8.83398 28.6471 8.83398 53.0006C8.83398 77.3541 28.6472 97.1673 53.0006 97.1673C77.3541 97.1673 97.1673 77.3541 97.1673 53.0006C97.1673 48.0275 96.3016 43.2584 94.7778 38.7931L87.6266 45.9443C88.0904 48.2233 88.334 50.5847 88.334 53.0006C88.334 72.4826 72.4826 88.334 53.0006 88.334C33.5187 88.334 17.6673 72.4826 17.6673 53.0006C17.6673 33.5187 33.5187 17.6673 53.0006 17.6673C60.2131 17.6673 66.9216 19.8487 72.522 23.5763L78.845 17.2533C71.5664 11.9798 62.6511 8.83398 53.0006 8.83398ZM94.0446 14.5446L48.584 60.0052L34.04 45.4613L27.7946 51.7067L48.584 72.4961L100.29 20.79L94.0446 14.5446Z"
              fill="#4ADE80"
            />
          </svg>

          {/* Text content */}
          <div className="flex flex-col items-center gap-[10px] w-full max-w-[280px]">
            <p className="text-[#010101] dark:text-white text-center text-[13px] font-semibold leading-[18px] w-full">
              Proposal Submitted
            </p>
            <p className="text-muted text-center text-[10px] font-normal leading-[13px] w-[200px]">
              Your proposal has been sent. Your copy of CC is held in escrow.
            </p>
          </div>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Job ID card */}
          <div className="flex items-center justify-between w-full px-4 py-[10px] rounded-[6px] border border-border bg-[#F5F8FB] dark:bg-[#161616]">
            <div className="flex flex-col gap-[7px]">
              <span className="text-muted text-[10px] font-normal leading-[13px]">
                Proposal ID
              </span>
              <span className="text-[#010101]/80 dark:text-white/80 text-[15px] font-medium leading-[19px]">
                {jobId}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="text-muted hover:text-[#010101] dark:hover:text-white transition-colors relative"
              aria-label="Copy job ID"
            >
              {copied ? (
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 30 30"
                  fill="none"
                >
                  <path
                    d="M12 16.5L9.5 14L8 15.5L12 19.5L22 9.5L20.5 8L12 16.5Z"
                    fill="#4ADE80"
                  />
                </svg>
              ) : (
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 30 30"
                  fill="none"
                >
                  <path
                    d="M17.5 8.125H10C8.96447 8.125 8.125 8.96447 8.125 10V22.5C8.125 23.5355 8.96447 24.375 10 24.375H17.5C18.5355 24.375 19.375 23.5355 19.375 22.5V10C19.375 8.96447 18.5355 8.125 17.5 8.125Z"
                    stroke="currentColor"
                  />
                  <path
                    d="M10.625 7.5C10.625 7.00272 10.8225 6.52581 11.1742 6.17417C11.5258 5.82254 12.0027 5.625 12.5 5.625H20C20.4973 5.625 20.9742 5.82254 21.3258 6.17417C21.6775 6.52581 21.875 7.00272 21.875 7.5V20C21.875 20.4973 21.6775 20.9742 21.3258 21.3258C20.9742 21.6775 20.4973 21.875 20 21.875"
                    stroke="currentColor"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-5 w-full">
            <button
              onClick={onBrowseMore}
              className="flex-1 h-[38px] px-4 flex items-center justify-center rounded-[12px] border border-[#8C5CFF]/30 dark:border-[#8C5CFF]/20 text-[#8C5CFF] text-[13px] font-semibold leading-[18px] hover:bg-[#8C5CFF]/5 dark:hover:bg-[#8C5CFF]/10 transition-colors"
            >
              Browse jobs
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-[38px] px-4 flex items-center justify-center rounded-[12px] bg-[#8C5CFF] text-white text-[13px] font-semibold leading-[18px] hover:opacity-90 transition-opacity"
            >
              My applications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
