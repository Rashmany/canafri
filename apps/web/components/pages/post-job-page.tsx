'use client';

import { useState, useRef, useEffect } from "react";
import { ConfirmDepositDialog, JobPostedDialog } from "@/components/ui/post-job-dialogs";
import { useToast } from "@/components/ui/toast";
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  X,
  Pencil,
  UploadCloud,
  Bold,
  Link2,
  List,
  ListOrdered,
  Check,
  FileText,
  Smartphone,
} from "lucide-react";

type PayType = "hourly" | "fixed";
type ExperienceLevel = "entry" | "intermediate" | "expert";

const experienceOptions: { id: ExperienceLevel; title: string; subtitle: string }[] = [
  { id: "entry", title: "Entry Level", subtitle: "0-2 years" },
  { id: "intermediate", title: "Intermediate", subtitle: "2-5 years" },
  { id: "expert", title: "Expert", subtitle: "5+ years" },
];

const CATEGORY_OPTIONS = [
  'Development & IT',
  'Design & Creative',
  'Sales & Marketing',
  'Writing & Translation',
  'Finance & Accounting',
  'Canton Integration & blockchain',
];

const SUB_CATEGORY_OPTIONS = [
  'Full Stack Development',
  'Frontend Development',
  'Backend Development',
  'UI/UX Design',
  'Smart Contract Development',
  'Escrow & Wallet Integration',
];

const ESTIMATED_TIME_OPTIONS = [
  'More than 6 months',
  '3 to 6 months',
  '1 to 3 months',
  'Less than 1 month',
];

const WEEKLY_COMMITMENT_OPTIONS = [
  '30+ hrs/week',
  '20-30 hrs/week',
  '10-20 hrs/week',
  'Less than 10 hrs/week',
];

const LOCATION_OPTIONS = [
  'Remote',
  'United States',
  'Europe',
  'Canada',
  'Asia',
  'Africa',
];

// ─── SVG Icons from figma design ──────────────────────────────────────────────

function BackArrowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d="M3.4605 6.25L6.357 9.146L6 9.5L2.5 6L6 2.5L6.357 2.854L3.46 5.75H9.5V6.25H3.4605Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BreadcrumbChevron() {
  return (
    <svg
      width="10"
      height="16"
      viewBox="0 0 10 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d="M2.04332 4.38666L2.92749 3.67999L7.74332 7.53133C7.82095 7.59304 7.88256 7.66642 7.9246 7.74726C7.96664 7.82809 7.98828 7.91478 7.98828 8.00233C7.98828 8.08988 7.96664 8.17656 7.9246 8.2574C7.88256 8.33823 7.82095 8.41161 7.74332 8.47333L2.92749 12.3267L2.04416 11.62L6.56416 8.00333L2.04332 4.38666Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CheckBadgeIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 rounded-[5px] bg-[#8C5CFF] p-[2px]"
    >
      <rect width="10" height="10" rx="5" fill="#8C5CFF" />
      <path
        d="M8 3.31034L4.05535 7L2 5.07586L2.3321 4.76552L4.05535 6.37241L7.6679 3L8 3.31034Z"
        fill="white"
        fillOpacity="0.8"
      />
    </svg>
  );
}

function RadioDot({ active }: { active: boolean }) {
  return (
    <svg
      width="5"
      height="5"
      viewBox="0 0 5 5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mt-1 shrink-0"
    >
      <circle
        cx="2.5"
        cy="2.5"
        r="2.5"
        stroke={active ? "#8C5CFF" : "#A0A0A0"}
        strokeWidth="2"
      />
      <circle cx="2.5" cy="2.5" r="2.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
    </svg>
  );
}

function EstimateIcon() {
  return (
    <svg
      width="93"
      height="93"
      viewBox="0 0 93 93"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="aspect-square h-16 w-16 shrink-0 self-center sm:h-20 sm:w-20"
    >
      <path
        d="M69.75 33.9295V26.35C69.75 17.5809 69.75 13.1983 66.7469 10.4741C63.7399 7.75 58.9078 7.75 49.2319 7.75H32.1431C22.4673 7.75 17.6351 7.75 14.6281 10.4741C11.6211 13.1983 11.625 17.5809 11.625 26.35V51.15C11.625 59.9191 11.625 64.3018 14.6281 67.0259C17.6351 69.75 22.4673 69.75 32.1431 69.75H49.2319"
        stroke="#8C5CFF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M23.25 23.25H58.125M23.25 38.75H27.125M38.75 38.75H42.625M54.25 38.75H58.125M23.25 54.25H27.125M38.75 54.25H42.625"
        stroke="#8C5CFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M80.2358 58.1405C79.174 55.4474 76.4383 52.2893 70.215 52.2893C62.9843 52.2893 59.9385 55.6024 59.3224 57.3733C58.3575 59.7409 58.2684 64.852 67.0298 65.1426C77.4923 65.4914 81.871 66.9135 81.3285 72.6485C80.7899 78.3835 74.7604 79.1818 70.215 79.4918C65.5456 79.3561 59.7719 78.3796 58.125 73.4274M69.7268 46.5V52.0645M69.7616 79.4724V85.25"
        stroke="#8C5CFF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DraftArrowIcon() {
  return (
    <svg
      width="6"
      height="11"
      viewBox="0 0 6 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 rotate-180"
    >
      <path
        d="M5.94496 9.925L5.06079 10.8083L0.244959 5.99417C0.16733 5.91703 0.105723 5.8253 0.0636827 5.72425C0.0216428 5.62321 0 5.51485 0 5.40542C0 5.29598 0.0216428 5.18762 0.0636827 5.08658C0.105723 4.98554 0.16733 4.89381 0.244959 4.81667L5.06079 0L5.94413 0.883333L1.42413 5.40417L5.94496 9.925Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ─── Form Helpers ─────────────────────────────────────────────────────────────

function FieldLabel({ children, required = true }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[13px] font-medium leading-[18px] text-foreground/80">
      {children} {required && <span className="text-[#F87171]">*</span>}
    </label>
  );
}

function DropdownSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
  required = true,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1.5 w-full relative">
      <FieldLabel required={required}>{label}</FieldLabel>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-[38px] w-full items-center justify-between gap-2.5 rounded-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 text-left text-[11px] text-foreground focus:outline-none focus:border-[#8C5CFF] transition-colors"
      >
        <span className={value ? "text-foreground" : "text-muted"}>
          {value || placeholder}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-[60px] w-full rounded-lg border border-border bg-card shadow-lg py-1 z-40 max-h-[200px] overflow-y-auto no-scrollbar animate-in fade-in duration-100">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-[11px] text-left text-foreground hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors"
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

function PillOption({
  title,
  subtitle,
  selected,
  onClick,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center gap-2.5 rounded-[5px] px-3 py-2.5 text-left transition-colors border ${
        selected
          ? "bg-[#8C5CFF]/10 dark:bg-[rgba(140,92,255,0.12)] border-[#8C5CFF]"
          : "bg-[#F5F8FB] dark:bg-[#161616] border-border"
      }`}
    >
      <svg width="5" height="5" viewBox="0 0 5 5" fill="none" className="shrink-0">
        <circle
          cx="2.5"
          cy="2.5"
          r="1.5"
          stroke={selected ? "#8C5CFF" : "#A0A0A0"}
          strokeWidth="2"
        />
      </svg>
      <span className="text-[11px] leading-[14px] text-foreground">
        <span className="font-medium">{title}</span>{" "}
        <span className="font-normal text-[10px] text-muted">{subtitle}</span>
      </span>
    </button>
  );
}

// ─── Step 2 Components ────────────────────────────────────────────────────────

function PayPerkRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <CheckBadgeIcon />
      <span className="text-[10px] leading-[13px] text-primary">{children}</span>
    </div>
  );
}

function PaymentOption({
  active,
  title,
  subtitle,
  perks,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  perks: string[];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex flex-1 items-start gap-2.5 rounded-[15px] px-6 py-4 text-left border transition-colors cursor-pointer " +
        (active
          ? "bg-[#8C5CFF]/10 dark:bg-[rgba(140,92,255,0.12)] border-[#8C5CFF]"
          : "bg-[#F5F8FB] dark:bg-[#161616] border-border hover:bg-border/20")
      }
    >
      <RadioDot active={active} />
      <div className="flex flex-1 flex-col gap-2">
        <div className="text-[10px] leading-[13px] tracking-[0.004px] text-foreground">
          <span className="text-[12px] font-semibold">{title}</span>
          <br />
          <span className="font-normal text-muted">{subtitle}</span>
        </div>
        <div className="flex flex-col gap-2 mt-1">
          {perks.map((perk, i) => (
            <PayPerkRow key={i}>{perk}</PayPerkRow>
          ))}
        </div>
      </div>
    </button>
  );
}

function BudgetRangeCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-border bg-card px-5 py-6 shadow-sm">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[13px] font-medium leading-[18px] text-foreground">
          {title}
        </h2>
        <p className="text-[11px] leading-[16px] text-muted">
          {subtitle}
        </p>
      </div>
      {children}
    </div>
  );
}

function RateField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5 w-full">
      <div className="text-[11px] font-semibold leading-[15px] text-foreground/80">
        {label} <span className="text-[#F87171]">*</span>
      </div>
      <input
        type="number"
        min="1"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[38px] w-full rounded-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 text-[11px] text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors"
      />
    </div>
  );
}

function UsFlag() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 9 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d="M8 1.25H1C0.948667 1.25 0.898333 1.25375 0.849 1.26125L0.848 1.69975L0.1655 1.69875C0.0575034 1.86231 -4.74053e-05 2.054 2.92989e-08 2.25V6.75C2.92989e-08 7.01522 0.105357 7.26957 0.292893 7.45711C0.48043 7.64464 0.734784 7.75 1 7.75H8C8.26522 7.75 8.51957 7.64464 8.70711 7.45711C8.89464 7.26957 9 7.01522 9 6.75V2.25C9 1.98478 8.89464 1.73043 8.70711 1.54289C8.51957 1.35536 8.26522 1.25 8 1.25Z"
        fill="#00247D"
      />
      <path
        d="M2.75 1.25H2V2.5H0V3.25H2V4.5H2.75V3.25H4.75V2.5H2.75V1.25Z"
        fill="#CF1B2B"
      />
      <path
        d="M4.75 1.25H4.16725L3 2.06725V1.25H1.75V1.89225L0.849 1.26125C0.698708 1.28368 0.555644 1.34058 0.431 1.4275L1.6065 2.25H1.1725L0.24175 1.59775C0.214226 1.62977 0.188759 1.66351 0.1655 1.69875L0.95325 2.25H0V3.5H0.97125L0 4.1915V4.5H0.833L1.75 3.858V4.5H3V3.68275L4.167 4.5H4.75V3.99275L4.04625 3.5H4.75V2.25H4.0465L4.75 1.75725V1.25Z"
        fill="#EEEEEE"
      />
      <path
        d="M4.75009 1.25H4.38484L3.00009 2.21975V2.25H3.39284L4.75009 1.2995V1.25ZM0.431094 1.4275C0.361015 1.47596 0.297417 1.53317 0.241844 1.59775L1.17259 2.25H1.60634L0.431094 1.4275ZM1.60934 3.5L0.183594 4.5H0.615344L1.75009 3.7055V3.5H1.60934ZM4.75009 4.4505V4.1455L3.82834 3.5H3.39259L4.75009 4.4505Z"
        fill="#CF1B2B"
      />
    </svg>
  );
}

function CanadaFlag() {
  return (
    <svg width="14" height="14" viewBox="0 0 9 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect width="9" height="6" fill="#F01C24" />
      <rect x="2.25" width="4.5" height="6" fill="#FFFFFF" />
      <path d="M4.5 1.5L4.8 2.5L5.8 2.5L5 3.2L5.3 4.2L4.5 3.6L3.7 4.2L4 3.2L3.2 2.5L4.2 2.5L4.5 1.5Z" fill="#F01C24" />
    </svg>
  );
}

function UkFlag() {
  return (
    <svg width="14" height="14" viewBox="0 0 9 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect width="9" height="6" fill="#00247D" />
      <path d="M0 0L9 6M9 0L0 6" stroke="#FFFFFF" strokeWidth="0.8" />
      <path d="M0 0L9 6M9 0L0 6" stroke="#CF1B2B" strokeWidth="0.4" />
      <path d="M4.5 0V6M0 3H9" stroke="#FFFFFF" strokeWidth="1.2" />
      <path d="M4.5 0V6M0 3H9" stroke="#CF1B2B" strokeWidth="0.6" />
    </svg>
  );
}

function NigeriaFlag() {
  return (
    <svg width="14" height="14" viewBox="0 0 9 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect width="3" height="6" fill="#008751" />
      <rect x="3" width="3" height="6" fill="#FFFFFF" />
      <rect x="6" width="3" height="6" fill="#008751" />
    </svg>
  );
}

function GermanyFlag() {
  return (
    <svg width="14" height="14" viewBox="0 0 9 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect width="9" height="2" fill="#000000" />
      <rect y="2" width="9" height="2" fill="#DD0000" />
      <rect y="4" width="9" height="2" fill="#FFCC00" />
    </svg>
  );
}

function FranceFlag() {
  return (
    <svg width="14" height="14" viewBox="0 0 9 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect width="3" height="6" fill="#00209F" />
      <rect x="3" width="3" height="6" fill="#FFFFFF" />
      <rect x="6" width="3" height="6" fill="#F6424F" />
    </svg>
  );
}

function AustraliaFlag() {
  return (
    <svg width="14" height="14" viewBox="0 0 9 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect width="9" height="6" fill="#000080" />
      <rect width="4.5" height="3" fill="#00247D" />
      <path d="M0 0L4.5 3M4.5 0L0 3" stroke="#FFFFFF" strokeWidth="0.4" />
      <path d="M2.25 0V3M0 1.5H4.5" stroke="#FFFFFF" strokeWidth="0.6" />
      <path d="M2.25 0V3M0 1.5H4.5" stroke="#CF1B2B" strokeWidth="0.3" />
      <circle cx="6.75" cy="1.5" r="0.3" fill="#FFFFFF" />
      <circle cx="6.75" cy="4.5" r="0.3" fill="#FFFFFF" />
      <circle cx="5.4" cy="3" r="0.3" fill="#FFFFFF" />
      <circle cx="8.1" cy="3" r="0.3" fill="#FFFFFF" />
      <circle cx="7.4" cy="3.6" r="0.15" fill="#FFFFFF" />
    </svg>
  );
}

interface CountryPhoneOption {
  code: string;
  prefix: string;
  name: string;
  FlagComponent: React.ComponentType;
}

const PHONE_PREFIX_OPTIONS: CountryPhoneOption[] = [
  { code: 'US', prefix: '+1', name: 'United States', FlagComponent: UsFlag },
  { code: 'CA', prefix: '+1', name: 'Canada', FlagComponent: CanadaFlag },
  { code: 'GB', prefix: '+44', name: 'United Kingdom', FlagComponent: UkFlag },
  { code: 'NG', prefix: '+234', name: 'Nigeria', FlagComponent: NigeriaFlag },
  { code: 'DE', prefix: '+49', name: 'Germany', FlagComponent: GermanyFlag },
  { code: 'FR', prefix: '+33', name: 'France', FlagComponent: FranceFlag },
  { code: 'AU', prefix: '+61', name: 'Australia', FlagComponent: AustraliaFlag },
];

interface PostJobPageProps {
  onBack: () => void;
}

export default function PostJobPage({ onBack }: PostJobPageProps) {
  // Wizard view step (1 = details, 2 = payment)
  const [step, setStep] = useState(1);

  // Step 1 states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [payType, setPayType] = useState<PayType>("fixed");
  const [experience, setExperience] = useState<ExperienceLevel>("expert");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [weeklyCommitment, setWeeklyCommitment] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState(["React.js", "Next.js", "Canton Ledger", "Tailwind CSS"]);
  const [skillInput, setSkillInput] = useState("");
  const [prefSkills, setPrefSkills] = useState<string[]>([]);
  const [prefSkillInput, setPrefSkillInput] = useState("");
  const [attachments, setAttachments] = useState<{ name: string; size: string }[]>([]);

  // Step 2 budget states
  const [minHourlyRate, setMinHourlyRate] = useState("20");
  const [maxHourlyRate, setMaxHourlyRate] = useState("45");
  const [minTotalBudget, setMinTotalBudget] = useState("800");
  const [maxTotalBudget, setMaxTotalBudget] = useState("1200");
  const [deadline, setDeadline] = useState("30");
  const [milestones, setMilestones] = useState("5");

  // Revision policy states (Step 2)
  const [freeRevisions, setFreeRevisions] = useState("2");
  const [revisionDeadline, setRevisionDeadline] = useState("7");
  const [revisionScope, setRevisionScope] = useState("");
  const [extraRevisionCost, setExtraRevisionCost] = useState("50");

  // Screening questions state (Step 1)
  const [screeningQuestions, setScreeningQuestions] = useState<string[]>([
    "Describe your recent experience with similar projects",
    "What framework have you worked with?",
  ]);
  const [questionInput, setQuestionInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog states
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  // Phone OTP verification modal
  const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(59);
  const [otpError, setOtpError] = useState('');
  const [selectedPrefix, setSelectedPrefix] = useState<CountryPhoneOption>(PHONE_PREFIX_OPTIONS[0]);
  const [phoneInputVal, setPhoneInputVal] = useState("");
  const [otpStep, setOtpStep] = useState<"input" | "verify">("input");
  const [showPrefixDropdown, setShowPrefixDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (showPhoneOtpModal && otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [showPhoneOtpModal, otpTimer]);

  const { toast } = useToast();

  const sanitize = (val: string): string => {
    return val.trim().replace(/[<>]/g, '');
  };

  // Estimated values dynamically derived
  const derivedBudget = payType === "fixed" 
    ? (Number(maxTotalBudget) || 1200)
    : (Number(maxHourlyRate) * 40 || 1800); // Hourly calculates based on estimated week budget

  const removeSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const addSkill = () => {
    if (!skillInput.trim()) return;
    setSkills((prev) => [...prev, skillInput.trim()]);
    setSkillInput("");
  };

  const removePrefSkill = (index: number) => {
    setPrefSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const addPrefSkill = () => {
    if (!prefSkillInput.trim()) return;
    setPrefSkills((prev) => [...prev, prefSkillInput.trim()]);
    setPrefSkillInput("");
  };

  const addScreeningQuestion = () => {
    if (!questionInput.trim() || screeningQuestions.length >= 5) return;
    setScreeningQuestions((prev) => [...prev, questionInput.trim()]);
    setQuestionInput("");
  };

  const removeScreeningQuestion = (index: number) => {
    setScreeningQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).map(file => ({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB"
    }));
    setAttachments(prev => [...prev, ...newFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Checklist verification (computed dynamically)
  const isTitleDone = title.trim().length > 0;
  const isCategoryDone = category.trim().length > 0;
  const isDescriptionDone = description.trim().length >= 10;
  const isSkillsDone = skills.length > 0;
  const isBudgetDone = payType === "hourly" 
    ? (Number(minHourlyRate) > 0 && Number(maxHourlyRate) >= Number(minHourlyRate))
    : (Number(minTotalBudget) > 0 && Number(maxTotalBudget) >= Number(minTotalBudget));
  const isMilestonesDone = Number(milestones) > 0;
  const isRequirementsDone = attachments.length > 0 || prefSkills.length > 0;

  const checklistItems = [
    { label: "Job title added", done: isTitleDone },
    { label: "Category selected", done: isCategoryDone },
    { label: "Description written", done: isDescriptionDone },
    { label: "Skills added", done: isSkillsDone },
    { label: "Budget set", done: isBudgetDone },
    { label: "Milestones defined", done: isMilestonesDone },
    { label: "Requirements optional", done: isRequirementsDone },
  ];

  function JobPreviewContent() {
    return (
      <div className="flex flex-col gap-6">
        <span className="text-center text-[10px] leading-[13px] font-bold text-foreground/80 tracking-wider">
          JOB PREVIEW
        </span>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex w-full items-center justify-between">
              <span className="text-[10px] leading-[13px] text-muted font-bold">
                SUMMARY
              </span>
              <button 
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-[10px] leading-[13px] text-primary font-semibold hover:opacity-85"
              >
                Edit
                <Pencil className="h-2 w-2" />
              </button>
            </div>

            <div className="flex w-full flex-col gap-3">
              <p className="text-[13px] font-medium leading-[18px] text-foreground min-h-[36px] break-words overflow-hidden w-full">
                {title || "Build a React and Next.js frontend for a Canton wallet dashboard."}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-[5px] bg-[#8C5CFF]/15 px-2.5 py-1 text-center text-[10px] font-semibold leading-[14px] text-primary">
                  {category || "Development"}
                </span>
                {subCategory && (
                  <span className="rounded-[5px] bg-[#8C5CFF]/15 px-2.5 py-1 text-center text-[10px] font-semibold leading-[14px] text-primary">
                    {subCategory}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex flex-col py-2.5 border-t border-border">
              <div className="flex items-center justify-between text-[11px] leading-[14px]">
                <span className="text-foreground/80 font-medium">Total budget</span>
                <span className="text-muted font-normal">{derivedBudget.toLocaleString()} CC</span>
              </div>
            </div>
            
            {payType === "fixed" && (
              <>
                <div className="flex flex-col py-2.5">
                  <div className="flex items-center justify-between text-[11px] leading-[14px]">
                    <span className="text-foreground/80 font-medium">Deadline</span>
                    <span className="text-muted font-normal">{deadline} days</span>
                  </div>
                </div>
                <div className="flex flex-col py-2.5">
                  <div className="flex items-center justify-between text-[11px] leading-[14px]">
                    <span className="text-foreground/80 font-medium">Milestones</span>
                    <span className="text-muted font-normal">{milestones} phases</span>
                  </div>
                </div>
                <div className="flex flex-col py-2.5">
                  <div className="flex items-center justify-between text-[11px] leading-[14px]">
                    <span className="text-foreground/80 font-medium">Per milestone</span>
                    <span className="text-muted font-normal">
                      {milestones && Number(milestones) > 0 ? Math.round(derivedBudget / Number(milestones)).toLocaleString() : 0} CC
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col py-2.5">
              <div className="flex items-center justify-between text-[11px] leading-[14px]">
                <span className="text-foreground/80 font-medium">Platform fee</span>
                <span className="text-muted font-normal">5%</span>
              </div>
            </div>

            <div className="flex flex-col py-2.5">
              <div className="flex items-center justify-between text-[11px] leading-[14px]">
                <span className="text-foreground/80 font-medium">Seller receives</span>
                <span className="text-muted font-normal">{(derivedBudget * 0.95).toLocaleString()} CC</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-[8px] bg-[#8C5CFF]/10 dark:bg-[rgba(140,92,255,0.12)] p-4 border border-[#8C5CFF]/20">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] leading-[14px] text-primary font-bold">
              CC locked on post
            </span>
            <span className="text-[10px] leading-[13px] text-primary/80">
              {derivedBudget.toLocaleString()} CC will be locked in Canton escrow when you post. Released per milestone on approval.
            </span>
          </div>
        </div>

        <div className="h-px w-full bg-border" />

        <div className="flex flex-col gap-4">
          <h3 className="text-[13px] font-medium leading-[18px] text-foreground">
            Checklist Stepper
          </h3>
          <div className="flex flex-col gap-3">
            {checklistItems.map((item, idx) => (
              <div key={item.label} className="flex items-center gap-3">
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold border transition-colors ${
                    item.done 
                      ? "bg-primary border-primary text-white" 
                      : "bg-transparent border-border text-muted"
                  }`}
                >
                  {item.done ? <Check className="h-3 w-3" /> : idx + 1}
                </div>
                <span
                  className={`text-[11px] leading-[14px] transition-colors ${
                    item.done ? "text-foreground font-semibold" : "text-muted"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleSaveDraft = () => {
    toast('Draft saved — you can resume editing anytime.', 'info');
  };

  const handlePublish = () => {
    // Validate Step 1 first just in case
    if (!title.trim() || !category || !description.trim()) {
      toast('Please fill in all required fields on Step 1 first.', 'error');
      setStep(1);
      return;
    }

    // Validate Step 2 inputs
    if (payType === 'fixed') {
      const minB = Number(minTotalBudget);
      const maxB = Number(maxTotalBudget);
      if (isNaN(minB) || minB <= 0 || isNaN(maxB) || maxB <= 0) {
        toast('Please set valid positive numbers for your total budget range.', 'error');
        return;
      }
      if (minB > maxB) {
        toast('Minimum budget cannot exceed maximum budget.', 'error');
        return;
      }
      
      const dl = Number(deadline);
      if (isNaN(dl) || dl <= 0 || !Number.isInteger(dl)) {
        toast('Please enter a valid positive number of days for the deadline.', 'error');
        return;
      }

      const ms = Number(milestones);
      if (isNaN(ms) || ms <= 0 || !Number.isInteger(ms)) {
        toast('Please enter a valid positive number of milestone phases.', 'error');
        return;
      }
    } else {
      const minR = Number(minHourlyRate);
      const maxR = Number(maxHourlyRate);
      if (isNaN(minR) || minR <= 0 || isNaN(maxR) || maxR <= 0) {
        toast('Please set valid positive numbers for your hourly rate range.', 'error');
        return;
      }
      if (minR > maxR) {
        toast('Minimum hourly rate cannot exceed maximum hourly rate.', 'error');
        return;
      }
    }

    // Validate revision configurations
    const revs = Number(freeRevisions);
    if (isNaN(revs) || revs < 0 || !Number.isInteger(revs)) {
      toast('Please enter a valid non-negative integer for free revisions.', 'error');
      return;
    }

    const revDl = Number(revisionDeadline);
    if (isNaN(revDl) || revDl <= 0 || !Number.isInteger(revDl)) {
      toast('Please enter a valid positive number of days for the revision response deadline.', 'error');
      return;
    }

    const revCost = Number(extraRevisionCost);
    if (isNaN(revCost) || revCost < 0) {
      toast('Please enter a valid non-negative number for additional revision cost.', 'error');
      return;
    }

    // Sanitize input values
    const sanitizedTitle = sanitize(title);
    const sanitizedDesc = sanitize(description);
    const sanitizedWeeklyCommitment = sanitize(weeklyCommitment);
    const sanitizedEstimatedTime = sanitize(estimatedTime);
    const sanitizedLocation = sanitize(location);
    const sanitizedRevisionScope = sanitize(revisionScope);

    setTitle(sanitizedTitle);
    setDescription(sanitizedDesc);
    setWeeklyCommitment(sanitizedWeeklyCommitment);
    setEstimatedTime(sanitizedEstimatedTime);
    setLocation(sanitizedLocation);
    setRevisionScope(sanitizedRevisionScope);

    // Open the deposit confirmation dialog directly without phone OTP intercept
    setDepositDialogOpen(true);
  };

  const createAndPublishJob = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("canafri_posted_jobs");
      let jobsList = [];
      if (stored) {
        try {
          jobsList = JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }
      } else {
        // Fallback/seed default mock jobs
        jobsList = [
          { id: 1, title: "Create a landing page for my web3 blog", category: "Web Programming & Design", proposals: 8, date: "Mar. 24", budget: "150 CC", status: "open", freelancerName: "No Selection Yet", freelancerHandle: "Accepting proposals", avatarClassName: "bg-muted text-muted-foreground border border-border", initials: "?" },
          { id: 2, title: "Daml Smart Contract Escrow System", category: "Smart Contracts", proposals: 15, date: "Mar. 20", budget: "400 CC", status: "working", freelancerName: "Alex Daml", freelancerHandle: "@alexdaml", avatarClassName: "bg-purple-600", initials: "AD" },
          { id: 3, title: "Next.js frontend theme refactor", category: "Frontend Dev", proposals: 12, date: "Mar. 15", budget: "250 CC", status: "completed", freelancerName: "Sina Front", freelancerHandle: "@sinafront", avatarClassName: "bg-emerald-600", initials: "SF" },
          { id: 4, title: "Tailwind layout alignment tweaks", category: "UI CSS Tweak", proposals: 0, date: "Mar. 28", budget: "50 CC", status: "draft", freelancerName: "Draft Status", freelancerHandle: "Not published", avatarClassName: "bg-gray-400", initials: "DS" },
        ];
      }

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const dateObj = new Date();
      const dateStr = `${months[dateObj.getMonth()]}. ${dateObj.getDate()}`;

      const newJob = {
        id: Date.now(),
        title,
        category,
        proposals: 0,
        date: dateStr,
        budget: `${derivedBudget} CC`,
        status: "open",
        freelancerName: "No Selection Yet",
        freelancerHandle: "Accepting proposals",
        avatarClassName: "bg-muted text-muted-foreground border border-border",
        initials: "?",
        description,
        questions: screeningQuestions,
      };

      jobsList.unshift(newJob);
      localStorage.setItem("canafri_posted_jobs", JSON.stringify(jobsList));
    }

    // Mark that the user has now successfully posted their first job
    if (typeof window !== 'undefined') {
      localStorage.setItem('canafri_first_posted', 'true');
      localStorage.setItem('canafri_phone_verified', 'true');
    }

    // Small delay so dialog exit animates before success appears
    setTimeout(() => setSuccessDialogOpen(true), 80);
  };

  const handleDepositConfirm = () => {
    setDepositDialogOpen(false);

    // Check if user has verified their phone number AND has posted at least once before.
    // canafri_phone_verified = phone OTP completed
    // canafri_first_posted   = set after the very first successful job post
    // We require BOTH: if either is missing, show the phone verification popup.
    const isPhoneVerified = typeof window !== 'undefined' &&
      localStorage.getItem('canafri_phone_verified') === 'true';
    const hasPostedBefore = typeof window !== 'undefined' &&
      localStorage.getItem('canafri_first_posted') === 'true';

    if (!isPhoneVerified || !hasPostedBefore) {
      // Find the country and phone pre-selected from the post-job form or registration profile
      let userCountry = "United States";
      let userPhone = "";
      if (typeof window !== 'undefined') {
        const storedProfile = localStorage.getItem("canafri_user_profile");
        if (storedProfile) {
          try {
            const p = JSON.parse(storedProfile);
            if (p.country) userCountry = p.country;
            if (p.phone) userPhone = p.phone;
          } catch (e) {
            console.error("Error reading profile data from storage:", e);
          }
        }
      }
      
      // Match against PHONE_PREFIX_OPTIONS
      const matchedPrefix = PHONE_PREFIX_OPTIONS.find(
        opt => opt.name.toLowerCase() === userCountry.toLowerCase()
      ) || PHONE_PREFIX_OPTIONS[0];

      setSelectedPrefix(matchedPrefix);
      setPhoneInputVal(userPhone);
      setOtpStep("input");
      setOtpDigits(['', '', '', '']);
      setOtpTimer(59);
      setOtpError('');
      setShowPhoneOtpModal(true);
      return;
    }

    createAndPublishJob();
  };

  const handleNextStep = () => {
    if (!title.trim()) {
      toast("Please enter a job title.", "error");
      return;
    }
    if (title.trim().length < 10) {
      toast("Job title must be at least 10 characters long.", "error");
      return;
    }
    if (!category) {
      toast("Please select a category.", "error");
      return;
    }
    if (!subCategory) {
      toast("Please select a sub-category.", "error");
      return;
    }
    if (!estimatedTime) {
      toast("Please select estimated job duration.", "error");
      return;
    }
    if (!weeklyCommitment) {
      toast("Please select weekly commitment.", "error");
      return;
    }
    if (!location) {
      toast("Please select location requirement.", "error");
      return;
    }
    if (!description.trim()) {
      toast("Please enter a job description.", "error");
      return;
    }
    if (description.trim().length < 30) {
      toast("Job description must be at least 30 characters long.", "error");
      return;
    }
    if (skills.length === 0) {
      toast("Please add at least one required skill tag.", "error");
      return;
    }

    // Sanitize Step 1 inputs
    const sanitizedTitle = sanitize(title);
    const sanitizedDesc = sanitize(description);
    
    setTitle(sanitizedTitle);
    setDescription(sanitizedDesc);
    setStep(2);
  };

  return (
    <div className="w-full h-full bg-background overflow-y-auto pb-12">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-start lg:px-8">
        
        {/* Main form Column */}
        <div className="flex flex-1 flex-col gap-9">
          
          {/* Breadcrumb / Title header */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] leading-[13px] text-muted font-medium">
              <button 
                onClick={onBack}
                className="flex items-center gap-0.5 hover:text-foreground transition-colors"
              >
                <BackArrowIcon />
                <span>Job</span>
              </button>
              <div className="flex items-center gap-1 text-muted">
                <BreadcrumbChevron />
                <span className={step === 1 ? "text-foreground font-semibold" : ""}>Post a job</span>
              </div>
              {step === 2 && (
                <div className="flex items-center gap-1 text-muted">
                  <BreadcrumbChevron />
                  <span className="text-foreground font-semibold">Budget & Payments</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold leading-[42px] tracking-[-0.18px] text-foreground sm:text-4xl">
                Post a job
              </h1>
              <p className="text-[11px] leading-[16px] text-muted">
                {step === 1 
                  ? "Fill in the details below to find the right talent for your project."
                  : "Set your budget and payment preferences. All payments are securely held in Canton escrow until work is completed."
                }
              </p>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* STEP 1: JOB DETAILS                                      */}
          {/* ──────────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              
              {/* Job details card */}
              <section className="flex flex-col gap-5 border border-border bg-card rounded-[25px] p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-[13px] font-medium leading-[18px] text-foreground">
                    Job Details
                  </h2>
                  <span className="text-[10px] text-muted">* Required fields</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Job Title</FieldLabel>
                  <input
                    type="text"
                    placeholder="e.g Full Stack Web Developer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-[38px] w-full rounded-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 text-[11px] text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DropdownSelect
                    label="Category"
                    placeholder="Select Category"
                    value={category}
                    options={CATEGORY_OPTIONS}
                    onChange={setCategory}
                  />
                  <DropdownSelect
                    label="Sub-category"
                    placeholder="Select Sub-category"
                    value={subCategory}
                    options={SUB_CATEGORY_OPTIONS}
                    onChange={setSubCategory}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Required Experience Level</FieldLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {experienceOptions.map((opt) => (
                      <PillOption
                        key={opt.id}
                        title={opt.title}
                        subtitle={opt.subtitle}
                        selected={experience === opt.id}
                        onClick={() => setExperience(opt.id)}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DropdownSelect
                    label="Estimated Time"
                    placeholder="Select duration"
                    value={estimatedTime}
                    options={ESTIMATED_TIME_OPTIONS}
                    onChange={setEstimatedTime}
                  />
                  <DropdownSelect
                    label="Weekly Commitment"
                    placeholder="Select commitment"
                    value={weeklyCommitment}
                    options={WEEKLY_COMMITMENT_OPTIONS}
                    onChange={setWeeklyCommitment}
                  />
                </div>

                <DropdownSelect
                  label="Location Preference"
                  placeholder="Select location preference"
                  value={location}
                  options={LOCATION_OPTIONS}
                  onChange={setLocation}
                  required={false}
                />
              </section>

              {/* Description card */}
              <section className="flex flex-col gap-3 border border-border bg-card rounded-[25px] p-6">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Job Description</FieldLabel>
                  <div className="relative rounded-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616]">
                    <div className="flex items-center gap-4 border-b border-border/60 px-4 py-2 text-foreground/75">
                      <button type="button" className="text-xs font-bold hover:text-primary transition-colors">B</button>
                      <button type="button" className="text-xs italic hover:text-primary transition-colors">i</button>
                      <button type="button" className="text-xs underline hover:text-primary transition-colors">U</button>
                      <ListOrdered className="h-3.5 w-3.5 cursor-pointer hover:text-primary transition-colors" />
                      <List className="h-3.5 w-3.5 cursor-pointer hover:text-primary transition-colors" />
                      <Link2 className="h-3.5 w-3.5 cursor-pointer hover:text-primary transition-colors" />
                    </div>
                    <textarea
                      placeholder="Describe the job, responsibilities, deliverables and project goals..."
                      rows={10}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={2500}
                      className="w-full resize-none bg-transparent px-4 py-3 text-[11px] text-foreground placeholder:text-muted outline-none"
                    />
                    <div className="flex justify-end px-2 pb-2 text-[10px] text-muted">
                      {description.length}/2500
                    </div>
                  </div>
                </div>
              </section>

              {/* Skills card */}
              <section className="flex flex-col gap-4 border border-border bg-card rounded-[25px] p-6">
                <h2 className="text-[13px] font-medium leading-[18px] text-foreground">
                  Skill and Requirements
                </h2>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Required Skills</FieldLabel>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSkill()}
                        placeholder="e.g. React.js, Canton, Escrow"
                        className="h-[38px] flex-1 rounded-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 text-[11px] text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors"
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        className="h-[38px] shrink-0 rounded-[8px] bg-primary px-5 text-[13px] font-semibold text-white hover:bg-primary-hover transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {skills.map((skill, i) => (
                      <div
                        key={`${skill}-${i}`}
                        className="flex items-center gap-2.5 rounded-[5px] bg-[#8C5CFF]/10 dark:bg-[rgba(140,92,255,0.12)] border border-[#8C5CFF]/20 px-3 py-1.5"
                      >
                        <span className="text-[10px] leading-[13px] text-primary font-medium">{skill}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(i)}
                          className="text-primary hover:opacity-85 transition-opacity"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <FieldLabel required={false}>Preferred Skills (Optional)</FieldLabel>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={prefSkillInput}
                        onChange={(e) => setPrefSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addPrefSkill()}
                        placeholder="e.g. Next.js, Smart Contracts"
                        className="h-[38px] flex-1 rounded-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 text-[11px] text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors"
                      />
                      <button
                        type="button"
                        onClick={addPrefSkill}
                        className="h-[38px] shrink-0 rounded-[8px] border border-border bg-border/20 text-foreground hover:bg-border/40 px-5 text-[13px] font-semibold transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {prefSkills.map((skill, i) => (
                      <div
                        key={`${skill}-${i}`}
                        className="flex items-center gap-2.5 rounded-[5px] bg-border/30 dark:bg-border/10 border border-border px-3 py-1.5"
                      >
                        <span className="text-[10px] leading-[13px] text-foreground font-medium">{skill}</span>
                        <button
                          type="button"
                          onClick={() => removePrefSkill(i)}
                          className="text-foreground/80 hover:text-foreground"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-medium leading-[18px] text-foreground/80">
                      Supporting Documents (Optional)
                    </label>
                    <label className="flex min-h-[90px] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-[10px] border border-dashed border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 py-4 text-center hover:bg-border/20 transition-colors">
                      <input 
                        type="file" 
                        className="hidden" 
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                      <UploadCloud className="h-5 w-5 text-primary" />
                      <span className="text-[10px] leading-[13px] text-muted">
                        Drag and drop files here or click to upload
                        <br />
                        PDF, DOCS, JPG, PNG (Max 5MB)
                      </span>
                    </label>
                  </div>

                  {attachments.length > 0 && (
                    <div className="flex flex-col gap-2 border border-border bg-border/5 rounded-lg p-3">
                      <span className="text-[10px] font-bold text-foreground">Attached Files ({attachments.length}):</span>
                      {attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-card p-2 rounded border border-border">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-[10px] text-foreground truncate">{file.name}</span>
                            <span className="text-[9px] text-muted shrink-0">({file.size})</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeAttachment(idx)} 
                            className="text-muted hover:text-foreground transition-colors p-1"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Screening Questions card */}
              <section className="flex flex-col gap-4 border border-border bg-card rounded-[25px] p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-[13px] font-medium leading-[18px] text-foreground">Screening Questions</h2>
                  <span className="text-[10px] text-muted">{screeningQuestions.length}/5 questions</span>
                </div>
                <p className="text-[11px] leading-[16px] text-muted -mt-2">
                  Add up to 5 questions freelancers must answer when applying. This helps you screen candidates more effectively.
                </p>

                {/* Question list */}
                <div className="flex flex-col gap-2">
                  {screeningQuestions.map((q, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-[8px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 py-2.5">
                      <span className="text-[10px] font-bold text-primary shrink-0 mt-0.5">{i + 1}.</span>
                      <span className="flex-1 text-[11px] leading-5 text-foreground">{q}</span>
                      <button
                        type="button"
                        onClick={() => removeScreeningQuestion(i)}
                        className="shrink-0 text-muted hover:text-foreground transition-colors ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add question input */}
                {screeningQuestions.length < 5 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addScreeningQuestion()}
                      placeholder="e.g. What is your experience with Canton network?"
                      className="h-[38px] flex-1 rounded-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 text-[11px] text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={addScreeningQuestion}
                      className="h-[38px] shrink-0 rounded-[8px] bg-primary px-5 text-[13px] font-semibold text-white hover:bg-primary-hover transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}
              </section>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="h-[38px] flex-1 rounded-xl border border-primary text-[13px] font-semibold text-primary hover:bg-primary/5 transition-colors"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="h-[38px] flex-1 rounded-xl bg-primary text-[13px] font-semibold text-white hover:bg-primary-hover transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* STEP 2: BUDGET & TIMELINE                                */}
          {/* ──────────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              
              {/* Payment Method Option Card */}
              <div className="flex flex-col gap-4 rounded-[25px] border border-border bg-card p-6">
                <h2 className="text-[13px] font-medium leading-[18px] text-foreground">
                  Payment Method
                </h2>
                <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:gap-6">
                  <PaymentOption 
                    active={payType === "hourly"} 
                    title="Hourly"
                    subtitle="Pay for the actual time worked"
                    perks={[
                      "Pay as work progresses",
                      "Ideal for ongoing, flexible work",
                      "Set rates to match experience"
                    ]}
                    onClick={() => setPayType("hourly")}
                  />
                  <PaymentOption 
                    active={payType === "fixed"} 
                    title="Fixed Price"
                    subtitle="Pay a set amount for milestones"
                    perks={[
                      "Canton Escrow security pre-funded",
                      "Ideal for well-defined projects",
                      "Release funds upon milestone approval"
                    ]}
                    onClick={() => setPayType("fixed")}
                  />
                </div>
              </div>

              {/* Hourly rates configuration card */}
              {payType === "hourly" && (
                <BudgetRangeCard 
                  title="Hourly Rate Budget Range"
                  subtitle="Set your hourly rates preference to attract suitable candidate rates"
                >
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                    <RateField 
                      label="Minimum Rate CC/hr" 
                      value={minHourlyRate} 
                      onChange={setMinHourlyRate} 
                      placeholder="e.g. 20" 
                    />
                    <RateField 
                      label="Maximum Rate CC/hr" 
                      value={maxHourlyRate} 
                      onChange={setMaxHourlyRate} 
                      placeholder="e.g. 50" 
                    />
                  </div>
                  <div className="flex items-center justify-center rounded-[5px] bg-[#8C5CFF]/10 p-3 text-center border border-[#8C5CFF]/15">
                    <span className="text-[10px] leading-[14px] text-primary font-semibold">
                      This range will help us to match you with the right talent within your budget.
                    </span>
                  </div>
                </BudgetRangeCard>
              )}

              {/* Fixed price configuration card */}
              {payType === "fixed" && (
                <BudgetRangeCard
                  title="Total Project Budget Range"
                  subtitle="Define target escrow settings for fixed milestones"
                >
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                    <RateField 
                      label="Minimum Total Budget (CC)" 
                      value={minTotalBudget} 
                      onChange={setMinTotalBudget} 
                      placeholder="e.g. 500" 
                    />
                    <RateField 
                      label="Maximum Total Budget (CC)" 
                      value={maxTotalBudget} 
                      onChange={setMaxTotalBudget} 
                      placeholder="e.g. 1500" 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Est. Project Deadline (Days)</FieldLabel>
                      <input
                        type="number"
                        min="1"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="h-[38px] w-full rounded-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 text-[11px] text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel>Estimated Milestones (Phases)</FieldLabel>
                      <input
                        type="number"
                        min="1"
                        value={milestones}
                        onChange={(e) => setMilestones(e.target.value)}
                        className="h-[38px] w-full rounded-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 text-[11px] text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-6 rounded-2xl bg-[#8C5CFF]/10 dark:bg-[rgba(140,92,255,0.12)] border border-[#8C5CFF]/15 px-6 py-6 sm:flex-row sm:gap-12 sm:items-center">
                    <div className="flex flex-1 flex-col gap-2.5 text-center sm:text-left">
                      <p className="text-[11px] leading-[16px] text-muted">
                        Estimated total budget
                      </p>
                      <p className="text-[20px] font-bold leading-[24px] text-primary">
                        {derivedBudget.toLocaleString()} CC (approx. ${(derivedBudget * 1.5).toLocaleString()} USD)
                      </p>
                      <p className="text-[11px] leading-[16px] text-muted">
                        This is an estimate, final payment may vary based on actual hours worked or milestone agreements.
                      </p>
                    </div>
                    <div className="flex shrink-0 justify-center">
                      <EstimateIcon />
                    </div>
                  </div>
                </BudgetRangeCard>
              )}

              {/* Revision Policy card (Step 2) */}
              <div className="flex flex-col gap-4 rounded-[25px] border border-border bg-card p-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-[13px] font-medium leading-[18px] text-foreground">Revision Policy</h2>
                  <p className="text-[11px] leading-[16px] text-muted">Define how many revisions are included and what happens when the client requests more.</p>
                </div>

                {/* Free revisions count */}
                <div className="flex flex-col gap-1.5">
                  <FieldLabel required={false}>Number of Free Revisions</FieldLabel>
                  <div className="flex flex-wrap items-center gap-2">
                    {["0", "1", "2", "3", "Unlimited"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFreeRevisions(opt)}
                        className={`flex items-center justify-center h-[34px] px-4 rounded-[5px] border text-[11px] font-semibold transition-colors ${
                          freeRevisions === opt
                            ? "bg-[#8C5CFF]/10 dark:bg-[rgba(140,92,255,0.12)] border-[#8C5CFF] text-primary"
                            : "bg-[#F5F8FB] dark:bg-[#161616] border-border text-muted hover:text-foreground"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  {/* Revision request deadline */}
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel required={false}>Revision Request Deadline (Days after delivery)</FieldLabel>
                    <input
                      type="number"
                      min="1"
                      value={revisionDeadline}
                      onChange={(e) => setRevisionDeadline(e.target.value)}
                      className="h-[38px] w-full rounded-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 text-[11px] text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  {/* Extra revision cost */}
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel required={false}>Extra Revision Cost (CC per request)</FieldLabel>
                    <input
                      type="number"
                      min="0"
                      value={extraRevisionCost}
                      onChange={(e) => setExtraRevisionCost(e.target.value)}
                      placeholder="e.g. 50"
                      className="h-[38px] w-full rounded-[5px] border border-border bg-[#F5F8FB] dark:bg-[#161616] px-3 text-[11px] text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Revision scope */}
                <DropdownSelect
                  label="Scope of Revision"
                  placeholder="Select revision scope"
                  value={revisionScope}
                  options={["Minor tweaks only", "Content & layout changes", "Major design changes", "Full rework allowed"]}
                  onChange={setRevisionScope}
                  required={false}
                />

                <div className="flex items-center gap-2 rounded-[8px] bg-[#8C5CFF]/10 dark:bg-[rgba(140,92,255,0.12)] border border-[#8C5CFF]/20 px-4 py-3">
                  <span className="text-[10px] leading-[14px] text-primary/80">
                    ✦ Freelancers see your revision policy before applying, which reduces disputes and sets clear expectations on both sides.
                  </span>
                </div>
              </div>

              {/* Mobile and Tablet Preview (Step 2 bottom, before buttons) */}
              <div className="block lg:hidden border border-border bg-card rounded-[25px] px-4 py-6 shadow-sm">
                <JobPreviewContent />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setStep(1)}
                  className="h-[38px] flex-1 rounded-xl border border-primary text-[13px] font-semibold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                >
                  <DraftArrowIcon />
                  Previous
                </button>
                <button 
                  onClick={handleSaveDraft}
                  className="h-[38px] flex-1 rounded-xl border border-primary text-[13px] font-semibold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                >
                  Save as Draft
                </button>
                <button 
                  onClick={handlePublish}
                  className="h-[38px] flex-1 rounded-xl bg-primary text-[13px] font-semibold text-white hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
                >
                  Post a Job
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Job preview sidebar (desktop only) */}
        <aside className="hidden lg:flex w-full flex-col gap-6 bg-card border border-border rounded-[25px] px-4 py-6 lg:w-[343px] lg:shrink-0">
          <JobPreviewContent />
        </aside>

      </div>

      {/* ── Phone OTP Verification Modal (first-time post) ──────────── */}
      {showPhoneOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-[400px] rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            {otpStep === "input" ? (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Smartphone size={22} className="text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[16px] font-bold text-foreground">Verify Your Phone Number</h3>
                    <p className="text-[12px] leading-[18px] text-muted">
                      Please enter your phone number to receive a verification code. This helps verify your identity for your first posting.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-left relative">
                  <label className="text-[11px] font-semibold text-foreground/85">Phone Number <span className="text-rose-500">*</span></label>
                  <div className="flex items-center gap-2">
                    {/* Prefix dropdown trigger */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowPrefixDropdown(prev => !prev)}
                        className="flex items-center gap-1.5 px-3 h-[38px] rounded-lg border border-border bg-[#F5F8FB] dark:bg-[#161616] hover:bg-foreground/5 transition-colors cursor-pointer"
                      >
                        <selectedPrefix.FlagComponent />
                        <span className="text-[12px] font-semibold text-foreground">{selectedPrefix.prefix}</span>
                        <ChevronDown size={12} className="text-muted" />
                      </button>

                      {/* Dropdown list */}
                      {showPrefixDropdown && (
                        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[240px] rounded-xl border border-border bg-card p-2 shadow-xl flex flex-col gap-2">
                          <input
                            type="text"
                            placeholder="Search country..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-[#F5F8FB] dark:bg-[#161616] text-[11px] outline-none text-foreground"
                          />
                          <div className="max-h-[160px] overflow-y-auto flex flex-col gap-0.5 no-scrollbar">
                            {PHONE_PREFIX_OPTIONS.filter(opt =>
                              opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              opt.prefix.includes(searchQuery)
                            ).map((opt) => (
                              <button
                                key={opt.code}
                                type="button"
                                onClick={() => {
                                  setSelectedPrefix(opt);
                                  setShowPrefixDropdown(false);
                                  setSearchQuery("");
                                }}
                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11px] hover:bg-foreground/5 transition-colors w-full text-left cursor-pointer"
                              >
                                <opt.FlagComponent />
                                <span className="font-semibold text-foreground">{opt.prefix}</span>
                                <span className="text-muted font-medium truncate">{opt.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Phone number input field */}
                    <input
                      type="tel"
                      placeholder="e.g. 5550123"
                      value={phoneInputVal}
                      onChange={(e) => setPhoneInputVal(e.target.value.replace(/[^0-9]/g, ''))}
                      className="flex-1 h-[38px] px-3 rounded-lg border border-border bg-[#F5F8FB] dark:bg-[#161616] text-[12px] font-semibold outline-none focus:border-primary transition-colors text-foreground"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full mt-1">
                  <button
                    type="button"
                    onClick={() => { setShowPhoneOtpModal(false); setOtpError(''); }}
                    className="flex-1 h-[38px] rounded-xl border border-border text-[13px] font-semibold hover:bg-foreground/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!phoneInputVal.trim()}
                    onClick={() => {
                      const cleanPhone = phoneInputVal.replace(/[\s-()]/g, '');
                      if (cleanPhone.length < 7 || cleanPhone.length > 15) {
                        setOtpError("Please enter a valid phone number (7 to 15 digits).");
                        return;
                      }
                      setOtpError('');
                      setOtpTimer(59);
                      setOtpDigits(['', '', '', '']);
                      setOtpStep("verify");
                    }}
                    className="flex-1 h-[38px] rounded-xl bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Send Code
                  </button>
                </div>
                {otpError && (
                  <p className="text-[11px] text-red-500 text-center">{otpError}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Header */}
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Smartphone size={22} className="text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[16px] font-bold text-foreground">Verify Your Phone Number</h3>
                    <p className="text-[12px] leading-[18px] text-muted">
                      We sent a 4-digit code to <strong className="text-foreground">{selectedPrefix.prefix} {phoneInputVal}</strong>.
                    </p>
                  </div>
                </div>

                {/* OTP digit inputs */}
                <div className="flex justify-center items-center gap-3 py-1">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`post-otp-${idx}`}
                      type="text"
                      maxLength={1}
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== '' && !/^[0-9]$/.test(val)) return;
                        const next = [...otpDigits];
                        next[idx] = val;
                        setOtpDigits(next);
                        if (val !== '' && idx < 3) {
                          document.getElementById(`post-otp-${idx + 1}`)?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && otpDigits[idx] === '' && idx > 0) {
                          document.getElementById(`post-otp-${idx - 1}`)?.focus();
                        }
                      }}
                      className="w-12 h-12 rounded-xl border border-border bg-[#F5F8FB] dark:bg-[#161616] text-center text-lg font-bold text-foreground focus:border-primary outline-none transition-colors"
                    />
                  ))}
                </div>

                {otpError && (
                  <p className="text-[11px] text-red-500 text-center -mt-2">{otpError}</p>
                )}

                {/* Resend timer */}
                <div className="flex flex-col items-center gap-1">
                  {otpTimer > 0 ? (
                    <p className="text-[11px] text-muted">Resend code in <span className="font-semibold text-foreground">00:{otpTimer < 10 ? `0${otpTimer}` : otpTimer}</span></p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setOtpTimer(59); setOtpDigits(['', '', '', '']); setOtpError(''); }}
                      className="text-[11px] font-semibold text-primary hover:underline cursor-pointer bg-transparent border-none"
                    >
                      Resend code
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep("input");
                      setOtpDigits(['', '', '', '']);
                      setOtpError('');
                    }}
                    className="flex-1 h-[38px] rounded-xl border border-border text-[13px] font-semibold hover:bg-foreground/5 transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={otpDigits.some(d => d === '')}
                    onClick={() => {
                      const code = otpDigits.join('');
                      if (code === '0000') {
                        setOtpError('Invalid code. Please try again.');
                      } else {
                        // Mark phone as verified
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('canafri_phone_verified', 'true');
                        }
                        setShowPhoneOtpModal(false);
                        setOtpDigits(['', '', '', '']);
                        setOtpError('');
                        // Now create and publish the job directly
                        createAndPublishJob();
                      }
                    }}
                    className="flex-1 h-[38px] rounded-xl bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Verify & Continue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Deposit confirmation popup ───────────────────────────────── */}
      <ConfirmDepositDialog
        open={depositDialogOpen}
        title={title}
        category={category}
        budget={derivedBudget}
        deadline={deadline}
        milestones={milestones}
        payType={payType}
        onClose={() => setDepositDialogOpen(false)}
        onCancel={() => setDepositDialogOpen(false)}
        onConfirm={handleDepositConfirm}
      />

      {/* ── Job posted success popup ─────────────────────────────────── */}
      <JobPostedDialog
        open={successDialogOpen}
        title={title}
        budget={derivedBudget}
        milestones={milestones}
        deadline={deadline}
        onClose={() => { setSuccessDialogOpen(false); onBack(); }}
        onBrowseJobs={() => { setSuccessDialogOpen(false); onBack(); }}
        onMyJobs={() => { setSuccessDialogOpen(false); onBack(); }}
      />
    </div>
  );
}
