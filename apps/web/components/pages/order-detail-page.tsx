'use client';
import { ChevronLeft } from "lucide-react";

interface OrderDetailPageProps {
  onBack?: () => void;
  onDeliverClick?: () => void;
  onResolveClick?: () => void;
}

const RootContainer = ({ onBack, onDeliverClick, onResolveClick }: OrderDetailPageProps) => {
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
            Order Details
          </h1>
        </div>
      </div>

      {/* Main content layout: column on mobile, row on desktop */}
      <div className="w-full flex-1 p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row items-start gap-6 max-w-6xl mx-auto">
        
        {/* Left Column: main order card details */}
        <section className="bg-[#FAFAFD] dark:bg-[#0B0B0B] border border-[#D8D8D8] dark:border-[#121212] rounded-2xl flex flex-col items-start p-5 sm:p-6 gap-6 w-full lg:flex-1">
          
          <div className="flex flex-col items-start gap-2 w-full">
            <div className="flex items-center justify-between w-full gap-4">
              <div className="flex items-baseline gap-3">
                <h1 className="m-0 text-xl sm:text-2xl font-bold text-foreground/85 whitespace-nowrap">
                  Order#FO4564554
                </h1>
                <div className="relative text-[0.625rem] text-primary/80 cursor-pointer whitespace-nowrap font-medium hover:underline">
                  View Gig
                </div>
              </div>
              <h2 className="m-0 text-xl sm:text-2xl font-bold text-muted/80 whitespace-nowrap">
                $88.00
              </h2>
            </div>
            <div className="flex items-center gap-2.5 text-[0.625rem] text-muted/80">
              <div className="relative whitespace-nowrap">Buyer: keneweight (View History)</div>
              <div className="h-[0.625rem] w-[0.063rem] relative bg-[#DADADA] dark:bg-[#242424]" />
              <div className="relative whitespace-nowrap">March 20, 2026</div>
            </div>
          </div>

          {/* Table container — horizontally scrollable on mobile */}
          <div className="w-full overflow-x-auto no-scrollbar">
            <div className="min-w-[32rem] flex flex-col items-start text-[0.813rem] w-full">
              <div className="self-stretch bg-[#F5F8FB] dark:bg-[#080808] border border-[#DADADA] dark:border-[#242424] flex items-center justify-between py-[0.625rem] px-[1rem] gap-4">
                <div className="flex-1 relative font-medium min-w-[1.25rem] whitespace-nowrap text-foreground/90">
                  Item
                </div>
                <nav className="m-0 w-[15.688rem] flex items-center justify-between gap-4 text-left text-[0.813rem] text-foreground/80 font---font-inter shrink-0">
                  <div className="relative font-medium whitespace-nowrap">Quantity</div>
                  <div className="relative font-medium whitespace-nowrap">Duration</div>
                  <div className="relative font-medium whitespace-nowrap">Amount</div>
                </nav>
              </div>
              
              <div className="self-stretch bg-[#FAFAFD] dark:bg-[#0B0B0B] flex flex-col items-end p-[1rem] gap-[0.5rem] text-[0.625rem] text-muted/80 border-x border-b border-[#DADADA] dark:border-[#242424] rounded-b-xl">
                <div className="self-stretch flex items-start justify-between gap-4">
                  <div className="flex-1 flex flex-col items-start gap-[0.187rem] min-w-0">
                    <div className="self-stretch relative text-foreground/80 truncate font-medium">
                      Create a landing page for my web3 blog
                    </div>
                    <div className="self-stretch relative truncate">web Landing Page</div>
                    <div className="self-stretch relative truncate">2 Revision</div>
                  </div>
                  <div className="w-[15.688rem] flex items-center justify-between gap-4 shrink-0 pr-[0.8rem] text-foreground/70">
                    <div className="relative pr-[1.2rem]">1</div>
                    <div className="relative pr-[0.8rem]">7 Days</div>
                    <div className="relative font-medium">$25.00</div>
                  </div>
                </div>
                <div className="self-stretch h-[0.063rem] relative bg-[#DADADA] dark:bg-[#242424]" />
                <div className="flex items-center gap-[1rem] text-[0.813rem] text-foreground/80">
                  <div className="relative font-medium">Total</div>
                  <div className="relative font-semibold">$25.00</div>
                </div>
              </div>
            </div>
          </div>

          {/* Countdown timer with square dots */}
          <div className="self-stretch flex items-center justify-center gap-1.5 sm:gap-3 w-full">
            <div className="flex items-center gap-1">
              <div className="w-8 sm:w-[2.813rem] rounded-md bg-[#F5F8FB] dark:bg-[#121212] border border-[#DADADA] dark:border-[#121212] box-border flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-1 shrink-0">
                <h2 className="m-0 text-sm sm:text-lg font-bold text-foreground/80">0</h2>
              </div>
              <div className="w-8 sm:w-[2.813rem] rounded-md bg-[#F5F8FB] dark:bg-[#121212] border border-[#DADADA] dark:border-[#121212] box-border flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-1 shrink-0">
                <h2 className="m-0 text-sm sm:text-lg font-bold text-foreground/80">6</h2>
              </div>
            </div>
            
            <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-sm bg-[#DADADA] dark:bg-[#242424] shrink-0" />
            
            <div className="flex items-center gap-1">
              <div className="w-8 sm:w-[2.813rem] rounded-md bg-[#F5F8FB] dark:bg-[#121212] border border-[#DADADA] dark:border-[#121212] box-border flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-1 shrink-0">
                <h2 className="m-0 text-sm sm:text-lg font-bold text-foreground/80">6</h2>
              </div>
              <div className="w-8 sm:w-[2.813rem] rounded-md bg-[#F5F8FB] dark:bg-[#121212] border border-[#DADADA] dark:border-[#121212] box-border flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-1 shrink-0">
                <h2 className="m-0 text-sm sm:text-lg font-bold text-foreground/80">8</h2>
              </div>
            </div>
            
            <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-sm bg-[#DADADA] dark:bg-[#242424] shrink-0" />
            
            <div className="flex items-center gap-1">
              <div className="w-8 sm:w-[2.813rem] rounded-md bg-[#F5F8FB] dark:bg-[#121212] border border-[#DADADA] dark:border-[#121212] box-border flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-1 shrink-0">
                <h2 className="m-0 text-sm sm:text-lg font-bold text-foreground/80">0</h2>
              </div>
              <div className="w-8 sm:w-[2.813rem] rounded-md bg-[#F5F8FB] dark:bg-[#121212] border border-[#DADADA] dark:border-[#121212] box-border flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-1 shrink-0">
                <h2 className="m-0 text-sm sm:text-lg font-bold text-foreground/80">3</h2>
              </div>
            </div>
            
            <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-sm bg-[#DADADA] dark:bg-[#242424] shrink-0" />
            
            <div className="flex items-center gap-1">
              <div className="w-8 sm:w-[2.813rem] rounded-md bg-[#F5F8FB] dark:bg-[#121212] border border-[#DADADA] dark:border-[#121212] box-border flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-1 shrink-0">
                <h2 className="m-0 text-sm sm:text-lg font-bold text-foreground/80">0</h2>
              </div>
              <div className="w-8 sm:w-[2.813rem] rounded-md bg-[#F5F8FB] dark:bg-[#121212] border border-[#DADADA] dark:border-[#121212] box-border flex flex-col items-center justify-center py-1 sm:py-2 px-0.5 sm:px-1 shrink-0">
                <h2 className="m-0 text-sm sm:text-lg font-bold text-foreground/80">0</h2>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Tips & Checklist Cards */}
        <section className="w-full lg:w-[22rem] shrink-0 flex flex-col items-start gap-6 text-[0.813rem]">
          
          {/* Issue/Tips card */}
          <div className="self-stretch rounded-2xl bg-[#FAFAFD] dark:bg-[#0B0B0B] border border-[#D8D8D8] dark:border-[#121212] flex flex-col items-start p-[1.5rem] gap-[1.5rem]">
            <div className="self-stretch rounded-2xl bg-[#EBE5FA] dark:bg-[#291D46] flex flex-col items-start p-[1.5rem]">
              <div className="self-stretch relative font-medium text-[#8C5CFF] dark:text-[#8C5CFF]/80">
                Need to modify, cancel, or report an issue with your order?
              </div>
            </div>
            <div className="self-stretch flex flex-col items-start">
              <button 
                onClick={onResolveClick}
                className="cursor-pointer py-[0.5rem] px-[1rem] bg-transparent self-stretch rounded-xl flex items-center justify-center gap-[0.625rem] border border-[#8C5CFF]/30 text-[#8C5CFF] text-[0.813rem] font-semibold hover:bg-[#8C5CFF]/5 dark:hover:bg-[#8C5CFF]/10 transition-colors"
              >
                Resolve Order Issue
              </button>
            </div>
          </div>
          
          {/* Checklist stepper card */}
          <div className="self-stretch rounded-2xl bg-[#FAFAFD] dark:bg-[#0B0B0B] border border-[#D8D8D8] dark:border-[#121212] flex flex-col items-start p-[1.5rem] gap-[1.5rem] text-left">
            <div className="self-stretch relative font-medium text-foreground/80">Checklist</div>
            <div className="flex flex-col">
              {/* Step 1 */}
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold bg-[#8C5CFF] border border-[#8C5CFF] text-white">
                    1
                  </div>
                  <span className="text-[11px] leading-[16px] font-semibold text-[#4ADE80]">
                    Buyer Submited Dettails
                  </span>
                </div>
                <div className="ml-[11px] h-6 w-0.5 bg-[#DADADA] dark:bg-[#242424]" />
              </div>

              {/* Step 2 */}
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold bg-[#DADADA] dark:bg-[#33353A] border border-[#DADADA] dark:border-[#33353A] text-muted dark:text-white">
                    2
                  </div>
                  <span className="text-[11px] leading-[16px] font-semibold text-[#DAC95A]">
                    Work Underway Delivery Soon
                  </span>
                </div>
              </div>
            </div>
            
            <div className="self-stretch flex flex-col items-start">
              <button 
                onClick={onDeliverClick}
                className="cursor-pointer [border:none] py-[0.5rem] px-[1rem] bg-[#8C5CFF] text-white hover:opacity-90 transition-opacity self-stretch rounded-xl flex items-center justify-center gap-[0.625rem]"
              >
                <div className="relative text-[0.813rem] font-semibold font---font-inter text-white text-left">
                  Deliver Project
                </div>
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default RootContainer;
