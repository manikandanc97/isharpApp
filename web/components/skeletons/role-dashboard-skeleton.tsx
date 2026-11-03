import { Skeleton } from "@/components/ui/skeleton";
import { BrandLogo } from "@/components/brand-logo";

export function RoleDashboardSkeleton() {
  return (
    <main className="min-h-svh bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-4">
          <BrandLogo priority className="h-9 w-auto opacity-80" />
          <Skeleton className="h-8.5 w-24 rounded-full" />
        </div>

        {/* Dashboard Card Container */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-2xl bg-brand-red/60" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-36 rounded-md" />
              <Skeleton className="h-7 w-52 rounded-xl" />
            </div>
          </div>

          {/* Verification Status Placeholder */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-4 w-40 rounded-md" />
            </div>
            <Skeleton className="h-3.5 w-64 rounded-md" />
            <Skeleton className="h-3 w-48 rounded-md" />
          </div>

          {/* Quick Metrics / Action Row */}
          <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-100 sm:grid-cols-3">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="rounded-2xl border border-slate-100 p-4 space-y-2"
              >
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-6 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

