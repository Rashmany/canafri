'use client';

interface AdminPlaceholderPageProps {
  pageName: string;
}

export default function AdminPlaceholderPage({ pageName }: AdminPlaceholderPageProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card">
        <svg className="size-8 text-[#8C5CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <div className="text-center">
        <h2 className="font-sans text-[1.25rem] font-bold text-foreground">{pageName}</h2>
        <p className="mt-1 font-sans text-[0.875rem] text-muted">
          This section is under construction and will be available soon.
        </p>
      </div>
    </div>
  );
}
