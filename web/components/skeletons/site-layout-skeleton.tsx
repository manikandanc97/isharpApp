import { Skeleton } from "@/components/ui/skeleton";
import { BrandLogo } from "@/components/brand-logo";

export function SiteLayoutSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900 selection:bg-brand-red selection:text-white antialiased">
      {/* 01. SITE HEADER SKELETON */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-xs">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-brand-red/40"
          aria-hidden="true"
        />
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <BrandLogo priority className="h-8.5 w-auto sm:h-9.5 opacity-80" />
            <span
              className="hidden h-5 w-px bg-slate-200 sm:block"
              aria-hidden="true"
            />
            {/* Dual instruction pill skeleton */}
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/70 px-3.5 py-1">
              <Skeleton className="size-2 rounded-full bg-brand-blue/40" />
              <Skeleton className="h-3 w-28 rounded-full" />
            </div>
          </div>

          {/* Action button skeleton */}
          <Skeleton className="h-8.5 w-24 rounded-full bg-slate-200/80" />
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* 02. HERO SECTION SKELETON */}
        <section className="relative flex min-h-[calc(100vh-4rem)] flex-col justify-center overflow-hidden border-b border-slate-200 bg-slate-50 py-8 lg:py-0">
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-8 lg:grid-cols-12 lg:gap-14">
            {/* Left Column: Academic Proposition Skeleton */}
            <div className="flex flex-col lg:col-span-7">
              {/* Eyebrow badge capsule */}
              <div className="flex items-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/90 bg-white/90 px-4 py-1.5 shadow-xs">
                  <Skeleton className="size-2 rounded-full bg-brand-red/50" />
                  <Skeleton className="h-3.5 w-48 rounded-full" />
                  <span className="h-3.5 w-px bg-slate-200" aria-hidden="true" />
                  <Skeleton className="h-3.5 w-16 rounded-full bg-rose-200/70" />
                </div>
              </div>

              {/* Headline Skeleton */}
              <div className="mt-5 space-y-3">
                <Skeleton className="h-10 w-4/5 rounded-xl sm:h-12" />
                <Skeleton className="h-10 w-3/5 rounded-xl sm:h-12 bg-rose-200/60" />
              </div>

              {/* Subtitle Paragraph Skeleton */}
              <div className="mt-5 max-w-xl space-y-2">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-11/12 rounded-md" />
                <Skeleton className="h-4 w-4/5 rounded-md" />
              </div>

              {/* Academic Highlights Checkmarks Skeleton */}
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-4.5 rounded-full bg-emerald-200/80" />
                  <Skeleton className="h-4 w-28 rounded-md" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="size-4.5 rounded-full bg-emerald-200/80" />
                  <Skeleton className="h-4 w-36 rounded-md" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="size-4.5 rounded-full bg-emerald-200/80" />
                  <Skeleton className="h-4 w-32 rounded-md" />
                </div>
              </div>

              {/* CTA Buttons Skeleton */}
              <div className="mt-7 flex flex-wrap items-center gap-3.5">
                <Skeleton className="h-10 w-36 rounded-full bg-brand-red/60" />
                <Skeleton className="h-10 w-32 rounded-full" />
              </div>

              {/* Trust Micro-Rating Strip Skeleton */}
              <div className="mt-8 flex items-center gap-4 border-t border-slate-200/80 pt-6">
                <div className="flex -space-x-2">
                  <Skeleton className="size-8 rounded-full border-2 border-white" />
                  <Skeleton className="size-8 rounded-full border-2 border-white" />
                  <Skeleton className="size-8 rounded-full border-2 border-white" />
                  <Skeleton className="size-8 rounded-full border-2 border-white" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-32 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              </div>
            </div>

            {/* Right Column: Access Portal Card Skeleton */}
            <div className="flex justify-center lg:col-span-5">
              <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-7">
                {/* Card Header & Badge */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-36 rounded-md" />
                    <Skeleton className="h-3 w-44 rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full bg-rose-100" />
                </div>

                {/* Tab Switcher Skeleton */}
                <div className="mt-5 grid grid-cols-3 gap-1 rounded-2xl bg-slate-100/80 p-1">
                  <Skeleton className="h-8 rounded-xl bg-white shadow-xs" />
                  <Skeleton className="h-8 rounded-xl bg-transparent" />
                  <Skeleton className="h-8 rounded-xl bg-transparent" />
                </div>

                {/* Form Inputs Skeleton */}
                <div className="mt-5 space-y-4">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                    <Skeleton className="h-11 w-full rounded-2xl" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <Skeleton className="h-3.5 w-20 rounded-md" />
                      <Skeleton className="h-3.5 w-24 rounded-md" />
                    </div>
                    <Skeleton className="h-11 w-full rounded-2xl" />
                  </div>

                  {/* Primary CTA Skeleton */}
                  <Skeleton className="mt-2 h-11 w-full rounded-2xl bg-brand-red/70" />
                </div>

                {/* Card Reassurance Footnote */}
                <div className="mt-5 flex items-center justify-center gap-2 border-t border-slate-100 pt-4">
                  <Skeleton className="size-3.5 rounded-full" />
                  <Skeleton className="h-3 w-48 rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 03. ACHIEVEMENT BANNER STRIP SKELETON */}
        <section className="border-b border-slate-200/90 bg-white py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center text-center space-y-2">
                  <Skeleton className="h-8 w-20 rounded-lg sm:h-9" />
                  <Skeleton className="h-3.5 w-28 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 04. COURSES / FEATURES SKELETON */}
        <section className="bg-slate-50/60 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <div className="mx-auto max-w-2xl text-center space-y-3">
              <div className="flex justify-center">
                <Skeleton className="h-6 w-36 rounded-full" />
              </div>
              <Skeleton className="mx-auto h-8 w-3/4 rounded-xl" />
              <Skeleton className="mx-auto h-4 w-4/5 rounded-md" />
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {[1, 2, 3].map((card) => (
                <div
                  key={card}
                  className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="size-11 rounded-2xl bg-slate-100" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-5/6 rounded-md" />
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <Skeleton className="h-3.5 w-full rounded-md" />
                    <Skeleton className="h-3.5 w-4/5 rounded-md" />
                    <Skeleton className="h-3.5 w-3/4 rounded-md" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-xl bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 05. SITE FOOTER SKELETON */}
        <footer className="border-t border-slate-800 bg-slate-950 text-white">
          <div className="border-b border-slate-800 bg-slate-900/50 py-4">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-8">
              <Skeleton className="h-4 w-72 rounded-md bg-slate-800" />
              <Skeleton className="h-6 w-48 rounded-full bg-slate-800" />
            </div>
          </div>
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-3 lg:col-span-2">
                <Skeleton className="h-9 w-32 rounded-lg bg-slate-800" />
                <Skeleton className="h-3.5 w-64 rounded-md bg-slate-800" />
                <Skeleton className="h-3.5 w-56 rounded-md bg-slate-800" />
              </div>
              {[1, 2, 3].map((col) => (
                <div key={col} className="space-y-2.5">
                  <Skeleton className="h-4 w-24 rounded-md bg-slate-800" />
                  <Skeleton className="h-3 w-32 rounded-md bg-slate-800/60" />
                  <Skeleton className="h-3 w-28 rounded-md bg-slate-800/60" />
                  <Skeleton className="h-3 w-36 rounded-md bg-slate-800/60" />
                </div>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

