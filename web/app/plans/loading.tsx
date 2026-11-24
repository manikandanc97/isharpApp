import { BrandLogo } from "@/components/brand-logo";
import { Skeleton, SkeletonStatus } from "@/components/ui/skeleton";

export default function PlansLoading() {
  return (
    <SkeletonStatus
      label="Loading student access plans"
      className="flex min-h-svh flex-col bg-slate-50/70 font-sans text-slate-900 animate-pulse"
    >
      <header className="sticky top-0 z-50 shrink-0 border-b border-slate-200/80 bg-white/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <BrandLogo priority className="h-9 w-auto" />
            <span className="hidden h-5 w-px bg-slate-200 sm:block" />
            <Skeleton className="hidden h-4 w-28 rounded sm:block" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center py-8">
        <div className="mx-auto grid max-w-7xl w-full grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <section className="space-y-4 lg:col-span-7">
            <Skeleton className="h-6 w-48 rounded-full" />
            <Skeleton className="h-10 w-96 max-w-full rounded-xl" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />

            <div className="mt-8 space-y-3 pt-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
                >
                  <Skeleton className="size-6 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-5">
              <Skeleton className="h-6 w-32 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-44 rounded-xl" />
                <Skeleton className="h-3.5 w-full" />
              </div>
              <div className="space-y-3 border-t border-slate-100 pt-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
              <Skeleton className="h-11 w-full rounded-full bg-brand-red/30" />
            </div>
          </aside>
        </div>
      </main>
    </SkeletonStatus>
  );
}
