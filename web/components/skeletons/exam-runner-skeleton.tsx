import { Skeleton } from "@/components/ui/skeleton";

export function ExamRunnerSkeleton() {
  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 font-sans text-slate-900 select-none overflow-hidden animate-pulse">
      {/* 01. EXAMINATION TOP CONTROL BAR */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-28 rounded-lg" />
          <Skeleton className="hidden sm:block h-5 w-48 rounded" />
        </div>
        <div className="flex items-center gap-3">
          {/* Timer pill */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          {/* Language selector */}
          <Skeleton className="h-8 w-24 rounded-lg hidden sm:block" />
          {/* Submit button */}
          <Skeleton className="h-8 w-28 rounded-full bg-brand-red/30" />
        </div>
      </header>

      {/* 02. SUBJECT SECTION TABS */}
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <Skeleton className="h-7 w-28 rounded-full bg-slate-200" />
        <Skeleton className="h-7 w-24 rounded-full bg-slate-100" />
        <Skeleton className="h-7 w-24 rounded-full bg-slate-100" />
        <Skeleton className="h-7 w-24 rounded-full bg-slate-100" />
      </div>

      {/* 03. MAIN BODY */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Question Area */}
        <div className="flex flex-1 flex-col min-w-0 bg-white border-r border-slate-200">
          {/* Question Sub-header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24 rounded" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20 rounded" />
              <Skeleton className="h-7 w-32 rounded-lg" />
            </div>
          </div>

          {/* Question Text & Options */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-11/12" />
              <Skeleton className="h-4 w-4/5 opacity-75" />
            </div>

            {/* 4 Options */}
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 rounded-xl border border-slate-200 p-3.5 bg-slate-50/50"
                >
                  <Skeleton className="size-6 rounded-full shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-6 py-3">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-32 rounded-lg bg-brand-red/30" />
            </div>
          </div>
        </div>

        {/* Right Palette (Desktop) */}
        <aside className="hidden lg:flex w-80 shrink-0 flex-col bg-slate-50 border-l border-slate-200 p-4 space-y-4">
          {/* Candidate Card */}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>

          {/* Palette Status Legend */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Skeleton className="size-3.5 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>

          {/* Numbered Palette Grid */}
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs overflow-hidden">
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 30 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
