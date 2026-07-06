'use client';
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { SuccessModal } from "@/components/ui/success-modal";

interface ResolutionPageProps {
  onBack?: () => void;
  onSubmitSuccess?: () => void;
}

export default function ResolutionPage({ onBack, onSubmitSuccess }: ResolutionPageProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<number | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<number | null>(null);

  const issues = [
    "Buyer hasn't provided enough brief details to start working",
    "Seller is unresponsive to messages and feedback requests",
    "Milestone delivery deadlines need to be adjusted or extended",
    "Requesting mutual cancellation of this order due to project scope changes"
  ];

  const resolutions = [
    "Extend the project delivery time by 3 days",
    "Request the buyer to submit additional brief guidelines and resources",
    "Cancel the order mutually (will refund the CC from Escrow back to the buyer)"
  ];

  const handleNextStep = () => {
    if (step === 1) {
      if (selectedIssue === null) {
        alert("Please select an issue to continue.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedResolution === null) {
        alert("Please select a resolution to continue.");
        return;
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    } else if (onBack) {
      onBack();
    }
  };

  const handleSubmit = () => {
    setShowSuccess(true);
  };

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-y-auto no-scrollbar">
      {/* Header with back button and page name */}
      <div className="flex items-center gap-3 border-b border-[#D8D8D8]/30 dark:border-[#121212]/30 bg-background px-6 py-5 shrink-0">
        <button
          onClick={handlePrevStep}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8D8D8] dark:border-[#121212] bg-[#FAFAFD] dark:bg-[#0B0B0B] text-muted hover:text-foreground transition-colors cursor-pointer"
          title="Back"
        >
          <ChevronLeft size={16} />
        </button>
        <div>
          <h1 className="text-foreground/80 text-lg font-semibold leading-7">
            Resolution Center
          </h1>
        </div>
      </div>

      {/* Main Layout */}
      <div className="w-full flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-4xl mx-auto">
        
        {/* Stepper Progress Header */}
        <div className="bg-[#FAFAFD] dark:bg-[#0b0b0b] border border-[#D8D8D8] dark:border-[#121212] rounded-2xl flex h-[60px] items-center px-4 sm:px-6 w-full justify-between gap-2">
          
          {/* Step 1: Issue */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-[#8c5cff] border border-[#8c5cff] flex items-center justify-center rounded-full size-5 shrink-0">
              <span className="text-[10px] font-bold text-white">1</span>
            </div>
            <span className="text-[11px] font-medium text-foreground/85 whitespace-nowrap">
              Issue
            </span>
          </div>
          
          {/* Line separator 1 */}
          <div className={cn("flex-1 h-[2px] min-w-[2rem] transition-colors", step >= 2 ? "bg-[#8c5cff]" : "bg-[#DADADA] dark:bg-[#242424]")} />

          {/* Step 2: Resolution */}
          <div className="flex items-center gap-2 shrink-0">
            <div className={cn(
              "flex items-center justify-center rounded-full size-5 shrink-0 border transition-all",
              step >= 2 ? "bg-[#8c5cff] border-[#8c5cff]" : "bg-transparent border-[#DADADA] dark:border-[#2a2c33]"
            )}>
              <span className={cn("text-[10px] font-bold", step >= 2 ? "text-white" : "text-muted")}>2</span>
            </div>
            <span className={cn("text-[11px] font-medium whitespace-nowrap transition-colors", step >= 2 ? "text-foreground/85" : "text-muted/80")}>
              Resolution
            </span>
          </div>

          {/* Line separator 2 */}
          <div className={cn("flex-1 h-[2px] min-w-[2rem] transition-colors", step >= 3 ? "bg-[#8c5cff]" : "bg-[#DADADA] dark:bg-[#242424]")} />

          {/* Step 3: Submit */}
          <div className="flex items-center gap-2 shrink-0">
            <div className={cn(
              "flex items-center justify-center rounded-full size-5 shrink-0 border transition-all",
              step >= 3 ? "bg-[#8c5cff] border-[#8c5cff]" : "bg-transparent border-[#DADADA] dark:border-[#2a2c33]"
            )}>
              <span className={cn("text-[10px] font-bold", step >= 3 ? "text-white" : "text-muted")}>3</span>
            </div>
            <span className={cn("text-[11px] font-medium whitespace-nowrap transition-colors", step >= 3 ? "text-foreground/85" : "text-muted/80")}>
              Submit
            </span>
          </div>

        </div>

        {/* Dynamic Card Container */}
        <div className="bg-[#FAFAFD] dark:bg-[#0B0B0B] border border-[#D8D8D8] dark:border-[#121212] rounded-2xl flex flex-col items-start p-5 sm:p-6 gap-5 w-full">
          
          {step === 1 && (
            <>
              {/* Section title */}
              <div className="w-full flex flex-col gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-[#010101] dark:text-white/80 tracking-tight leading-normal">
                  Select Issue
                </h2>
                <div className="bg-[#DADADA] dark:bg-[#242424] h-px w-full" />
              </div>

              {/* Radios group */}
              <div className="flex flex-col gap-4 w-full">
                {issues.map((issue, idx) => {
                  const isSelected = selectedIssue === idx;
                  return (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedIssue(idx)}
                      className="flex items-center gap-3 cursor-pointer group py-1"
                    >
                      {/* Custom Radio Button */}
                      <div className={cn(
                        "size-4 rounded-full border flex items-center justify-center shrink-0 transition-all",
                        isSelected 
                          ? "border-[#8c5cff] bg-transparent" 
                          : "border-[#DADADA] dark:border-[#291d46] bg-transparent group-hover:border-[#8c5cff]/50"
                      )}>
                        {isSelected && (
                          <div className="size-2 rounded-full bg-[#8c5cff]" />
                        )}
                      </div>

                      {/* Issue label */}
                      <p className={cn(
                        "text-[13px] leading-relaxed transition-colors",
                        isSelected ? "text-[#010101] dark:text-white font-medium" : "text-[#5e5e5e] dark:text-white/70 group-hover:text-[#010101] dark:group-hover:text-white"
                      )}>
                        {issue}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Section title */}
              <div className="w-full flex flex-col gap-2.5">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#010101] dark:text-white/80 tracking-tight leading-normal">
                    Select Resolution
                  </h2>
                  <p className="text-[12px] font-medium text-[#5e5e5e] dark:text-[#a0a0a0]">
                    The issue you have selected is: <span className="text-[#8c5cff] font-semibold">{issues[selectedIssue ?? 0]}</span>
                  </p>
                </div>
                <div className="bg-[#DADADA] dark:bg-[#242424] h-px w-full" />
              </div>

              {/* Sub-heading */}
              <p className="text-[13px] font-semibold text-[#010101] dark:text-white/80 leading-normal">
                How would you like to solve this issue?
              </p>

              {/* Radios group */}
              <div className="flex flex-col gap-4 w-full">
                {resolutions.map((res, idx) => {
                  const isSelected = selectedResolution === idx;
                  return (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedResolution(idx)}
                      className="flex items-center gap-3 cursor-pointer group py-1"
                    >
                      {/* Custom Radio Button */}
                      <div className={cn(
                        "size-4 rounded-full border flex items-center justify-center shrink-0 transition-all",
                        isSelected 
                          ? "border-[#8c5cff] bg-transparent" 
                          : "border-[#DADADA] dark:border-[#291d46] bg-transparent group-hover:border-[#8c5cff]/50"
                      )}>
                        {isSelected && (
                          <div className="size-2 rounded-full bg-[#8c5cff]" />
                        )}
                      </div>

                      {/* Resolution label */}
                      <p className={cn(
                        "text-[13px] leading-relaxed transition-colors",
                        isSelected ? "text-[#010101] dark:text-white font-medium" : "text-[#5e5e5e] dark:text-white/70 group-hover:text-[#010101] dark:group-hover:text-white"
                      )}>
                        {res}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {/* Section title */}
              <div className="w-full flex flex-col gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-[#010101] dark:text-white/80 tracking-tight leading-normal">
                  Confirm Submission
                </h2>
                <div className="bg-[#DADADA] dark:bg-[#242424] h-px w-full" />
              </div>

              <div className="flex flex-col gap-4 py-2 w-full text-[13px] text-[#5e5e5e] dark:text-[#a0a0a0]">
                <p>Please review your resolution request details before sending it to the buyer for review:</p>
                <div className="p-4 rounded-xl bg-foreground/5 flex flex-col gap-3 border border-[#DADADA] dark:border-[#1e1e1e]">
                  <div>
                    <span className="font-semibold text-[#010101] dark:text-white/80">Selected Issue:</span>
                    <p className="mt-1 text-[13px]">{issues[selectedIssue ?? 0]}</p>
                  </div>
                  <div className="h-px bg-[#DADADA] dark:bg-[#1e1e1e] w-full" />
                  <div>
                    <span className="font-semibold text-[#010101] dark:text-white/80">Proposed Resolution:</span>
                    <p className="mt-1 text-[13px]">{resolutions[selectedResolution ?? 0]}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Separator */}
          <div className="bg-[#DADADA] dark:bg-[#242424] h-px w-full" />

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 mt-2">
            
            {/* Help / Contact support link */}
            <p className="text-[12px] font-semibold text-[#010101] dark:text-white/80 text-center sm:text-left leading-normal">
              Couldn’t find what you are looking for?{" "}
              <a 
                href="mailto:support@canafri.com"
                className="text-[#4ade80] hover:underline cursor-pointer ml-1"
              >
                contact support
              </a>
            </p>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-end">
              <button
                onClick={handlePrevStep}
                className="cursor-pointer border border-[#8C5CFF]/30 hover:bg-[#8C5CFF]/5 text-[#8C5CFF] text-[13px] font-semibold px-4 py-2 rounded-xl transition-all active:scale-[0.98] w-full sm:w-auto text-center"
              >
                {step === 1 ? "Cancel" : "Back"}
              </button>
              
              {step < 3 ? (
                <button
                  onClick={handleNextStep}
                  className={cn(
                    "cursor-pointer text-[13px] font-semibold px-5 py-2 rounded-xl transition-all active:scale-[0.98] w-full sm:w-auto text-center",
                    ((step === 1 && selectedIssue !== null) || (step === 2 && selectedResolution !== null))
                      ? "bg-[#8c5cff] text-white hover:bg-[#8c5cff]/90"
                      : "bg-[#DADADA] dark:bg-[#2a2c33] text-muted/65 cursor-not-allowed opacity-80"
                  )}
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="cursor-pointer bg-[#8c5cff] hover:bg-[#8c5cff]/90 text-white text-[13px] font-semibold px-5 py-2 rounded-xl transition-all active:scale-[0.98] w-full sm:w-auto text-center"
                >
                  Submit Resolution
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Resolution Success Modal */}
      <SuccessModal
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          if (onBack) onBack();
        }}
        title="Resolution Submitted!"
        description="Your resolution request has been sent to the buyer for review. The support team will follow up within 24–48 hours with an update."
        cta="Back to Order"
        onCta={() => {
          setShowSuccess(false);
          if (onSubmitSuccess) onSubmitSuccess();
          else if (onBack) onBack();
        }}
      />
    </div>
  );
}
