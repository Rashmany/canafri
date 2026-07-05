'use client';
import { useState, useRef } from "react";
import { ChevronLeft, ChevronDown, ChevronUp, X, UploadCloud, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SuccessModal } from "@/components/ui/success-modal";
import { JobSummaryModal } from "@/components/ui/job-summary-modal";

interface SubmitProjectPageProps {
  onBack?: () => void;
  onSubmitSuccess?: () => void;
}

interface FileUpload {
  name: string;
  size: string;
  progress: number;
}

export default function SubmitProjectPage({ onBack, onSubmitSuccess }: SubmitProjectPageProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [description, setDescription] = useState("");
  const [responseDropdownOpen, setResponseDropdownOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([
    { name: "Week 2 progress....zip", size: "15.5KB", progress: 65 }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFile = e.target.files[0];
      const sizeKB = (newFile.size / 1024).toFixed(1);
      const fileObj: FileUpload = {
        name: newFile.name,
        size: `${sizeKB}KB`,
        progress: 100
      };
      setUploadedFiles(prev => [...prev, fileObj]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSuggestResponse = (response: string) => {
    setDescription(response);
    setResponseDropdownOpen(false);
  };

  const suggestedResponses = [
    "Here is the final completed project. Please review and let me know if any updates are needed.",
    "Project delivery: I have completed all milestone objectives as per our agreement. Files attached.",
    "Milestone update: Deliverables completed. Looking forward to your review and feedback."
  ];

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-y-auto no-scrollbar">
      {/* Header with back button and page name */}
      <div className="flex items-center gap-3 border-b border-[#D8D8D8]/30 dark:border-[#121212]/30 bg-background px-6 py-5 shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8D8D8] dark:border-[#121212] bg-[#FAFAFD] dark:bg-[#0B0B0B] text-muted hover:text-foreground transition-colors cursor-pointer"
            title="Back"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        <div>
          <h1 className="text-foreground/80 text-lg font-semibold leading-7">
            Submit Project
          </h1>
        </div>
      </div>

      {/* Main Layout: Column on mobile, Row on desktop */}
      <div className="w-full flex-1 p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row items-start gap-6 max-w-6xl mx-auto">

        {/* Left Column: Deliver Completed Project main card */}
        <div className="bg-[#FAFAFD] dark:bg-[#080808] border border-[#D8D8D8] dark:border-[#121212] rounded-2xl flex flex-col items-start w-full lg:flex-1 overflow-hidden">

          {/* Card Header */}
          <div className="bg-[#F5F8FB] dark:bg-[#0b0b0b] flex items-center justify-between px-6 py-3 border-b border-[#D8D8D8] dark:border-[#121212] w-full">
            <p className="text-[12px] font-medium text-foreground/80 leading-normal">
              Deliver Completed Project
            </p>
          </div>

          {/* Card Body */}
          <div className="flex flex-col gap-6 px-6 py-6 w-full">

            {/* Upload Area Wrapper */}
            <div className="flex flex-col gap-4 w-full">
              {/* Dashed dropzone */}
              <div
                onClick={handleUploadClick}
                className="border border-[#DADADA] dark:border-[#121212] border-dashed rounded-lg bg-[#F5F8FB] dark:bg-[#121212] flex items-center justify-center h-[70px] cursor-pointer hover:bg-[#F5F8FB]/80 dark:hover:bg-[#121212]/80 transition-colors w-full"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-3.5 px-4 justify-center">
                  <UploadCloud size={20} className="text-muted/80 shrink-0" />
                  <div className="text-[10px] text-muted leading-tight text-center">
                    <p className="font-medium">Drag and drop files here or click to upload</p>
                    <p className="opacity-80">pdf, docs, jpj, png (Max 700MB)</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-3.5 bg-transparent shrink-0">
                  <p className="text-[10px] text-muted leading-none whitespace-nowrap">
                    {file.name} {file.size}
                  </p>

                  {/* Progress bar container */}
                  <div className="flex h-6 items-center shrink-0 w-[95px] relative">
                    <div className="bg-[#DADADA] dark:bg-[#1f2937] h-[10px] rounded-full w-full shadow-[0px_2px_4px_0px_rgba(0,0,0,0.1)]" />
                    <div
                      style={{ width: `${file.progress}%` }}
                      className="absolute bg-gradient-to-r from-[#8b5cf6] via-[#3b82f6] to-[#06b6d4] h-[10px] left-0 rounded-full shadow-[0px_0px_12px_rgba(139,92,246,0.25)]"
                    />
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleRemoveFile(idx)}
                    className="text-muted hover:text-foreground transition-colors cursor-pointer shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Description / Feedback Field */}
            <div className="flex flex-col gap-2.5 w-full relative">

              {/* Dropdown toggle */}
              <div className="relative">
                <button
                  onClick={() => setResponseDropdownOpen(prev => !prev)}
                  className="flex items-center gap-3 text-[11px] text-foreground/80 font-medium hover:text-foreground transition-colors cursor-pointer select-none"
                >
                  <span>Use Suggested Responses</span>
                  {responseDropdownOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {responseDropdownOpen && (
                  <div className="absolute left-0 top-[120%] z-50 min-w-[18rem] max-w-full rounded-xl border border-[#DADADA] dark:border-[#1e1e1e] bg-[#FAFAFD] dark:bg-[#0B0B0B] shadow-2xl p-2 flex flex-col gap-1">
                    {suggestedResponses.map((res, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestResponse(res)}
                        className="w-full text-left text-[11px] text-muted hover:text-[#010101] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Textarea container */}
              <div className="bg-[#F5F8FB] dark:bg-[#121212] border border-[#DADADA] dark:border-[#121212] rounded-lg flex flex-col h-[120px] justify-between p-3.5 w-full focus-within:border-[#8C5CFF]/50 transition-colors">
                <textarea
                  maxLength={300}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your delivery here... e.g. state details about the source, explain how to install/run the program, and list what files are included."
                  className="bg-transparent text-[11px] leading-relaxed text-muted placeholder:text-muted/60 outline-none resize-none h-full w-full"
                />
                <div className="flex justify-end w-full">
                  <p className="text-[10px] text-muted/60 whitespace-nowrap">
                    {description.length}/300
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* Card Footer */}
          <div className="bg-[#F5F8FB] dark:bg-[#0b0b0b] flex items-center justify-between px-6 py-4 border-t border-[#D8D8D8] dark:border-[#121212] w-full">
            <button
              onClick={onBack}
              className="cursor-pointer border border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/5 text-[#8C5CFF] text-[13px] font-semibold px-4 py-2 rounded-xl transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowSuccess(true)}
              className="cursor-pointer bg-[#8C5CFF] hover:bg-[#8C5CFF]/90 text-white text-[13px] font-semibold px-5 py-2 rounded-xl transition-all active:scale-[0.98]"
            >
              Submit
            </button>
          </div>

        </div>

        {/* Right Column: Portfolio Samples & Job Summary Card */}
        <div className="w-full lg:w-[18rem] shrink-0 flex flex-col gap-5">
          {/* Summary toggle card */}
          <div className="self-stretch rounded-2xl bg-[#FAFAFD] dark:bg-[#0b0b0b] border border-[#D8D8D8] dark:border-[#121212] flex flex-col items-start p-[1.5rem] gap-[1.25rem]">
            <div className="flex flex-col items-start gap-1 w-full">
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Active Contract</span>
              <p className="text-[13px] font-bold text-foreground leading-normal">
                Create a landing page for my web3 blog
              </p>
              <span className="text-[10px] text-muted">Buyer: @keneweight</span>
            </div>
            <button
              onClick={() => setShowSummary(true)}
              className="cursor-pointer py-[0.5rem] px-[1rem] bg-transparent self-stretch rounded-xl flex items-center justify-center gap-[0.625rem] border border-[#8C5CFF]/30 text-[#8C5CFF] text-[0.813rem] font-semibold hover:bg-[#8C5CFF]/5 dark:hover:bg-[#8C5CFF]/10 transition-colors w-full"
            >
              View Full Summary
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[13px] font-medium text-foreground/80 text-center w-full">
              Portfolio Samples
            </p>
            <div className="bg-[#EBE5FA] dark:bg-[#291d46] border border-[#EBE5FA] dark:border-[#291d46] rounded-2xl flex flex-col gap-3 items-center p-6 w-full">
              <AlertCircle size={44} className="text-[#8c5cff]" />
              <p className="text-[12px] font-medium text-[#8c5cff] leading-relaxed text-center">
                We recommend adding at least one PNG, JPG, audio, or video file to showcase your gig portfolio.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Project Delivery Success Modal */}
      <SuccessModal
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          if (onBack) onBack();
        }}
        title="Project Delivered!"
        description="Your work has been successfully submitted to the buyer. You'll be notified once they review and approve the delivery."
        cta="Back to Order"
        onCta={() => {
          if (onSubmitSuccess) onSubmitSuccess();
          else if (onBack) onBack();
        }}
      />

      {/* Detailed Job Summary Modal */}
      <JobSummaryModal
        open={showSummary}
        onClose={() => setShowSummary(false)}
      />
    </div>
  );
}
