import { Skeleton } from "@/components/ui/skeleton";
import { BrandLogo } from "@/components/brand-logo";

export function DemoTestScreenSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 font-sans text-slate-900 select-none antialiased animate-pulse">
      {/* Top Header */}
      <header className="sticky top-0 z-40 shrink-0 border-b border-slate-200 bg-white/95 px-4 sm:px-8 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo priority className="h-8 sm:h-9 w-auto" />
            <span className="hidden sm:block h-5 w-px bg-slate-200" />
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="hidden md:block h-4 w-48 rounded" />
          </div>
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
      </header>

      {/* Main Lobby Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-5 lg:p-6 space-y-5">
        {/* Hero Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="max-w-2xl space-y-3">
            <Skeleton className="h-5 w-36 rounded-full" />
            <Skeleton className="h-8 w-80 max-w-full rounded-xl" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          {/* Subject Cards Grid */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50/50"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="size-9 rounded-xl" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-3.5 w-32 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-end">
            <Skeleton className="h-10 w-full rounded-full bg-brand-red/30" />
          </div>
        </div>
      </main>
    </div>
  );
}

export function DemoTestDialogSkeleton() {
  return (
    <div className="flex flex-col h-full max-h-[92vh] overflow-y-auto animate-pulse">
      {/* Header Strip */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sm:px-8 bg-slate-50/60">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-3.5 w-36 rounded" />
          </div>
          <Skeleton className="h-6 w-64 rounded-lg" />
        </div>
      </div>

      {/* Body */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Subject Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 p-4 space-y-2.5 bg-slate-50/40"
            >
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
          ))}
        </div>

        {/* Option Selectors */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-10 w-44 rounded-full bg-brand-red/30" />
        </div>
      </div>
    </div>
  );
}
