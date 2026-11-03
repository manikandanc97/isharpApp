import { BrandLogo } from "@/components/brand-logo";
import { skeletonItems } from "@/components/skeletons/skeleton-primitives";
import { Skeleton, SkeletonStatus } from "@/components/ui/skeleton";

export function RoleDashboardContentSkeleton() {
  return (
    <div className="mt-8 space-y-4">
      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-4 w-48 max-w-[75%]" />
        </div>
        <Skeleton className="h-3.5 w-64 max-w-full" />
        <Skeleton className="h-3 w-40 max-w-[70%]" />
      </div>
      <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
        {skeletonItems(3).map((item) => (
          <div key={item} className="space-y-2 rounded-2xl border border-slate-100 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RoleDashboardSkeleton() {
  return (
    <SkeletonStatus
      label="Loading dashboard"
      className="min-h-svh bg-slate-50 px-4 py-8 text-slate-900 sm:px-8"
    >
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo priority className="h-9 w-auto" />
          <Skeleton className="h-8.5 w-24 rounded-lg" />
        </div>
        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-2xl bg-brand-red/35" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-7 w-52 max-w-[65vw] rounded-lg" />
            </div>
          </div>
          <RoleDashboardContentSkeleton />
          <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
            {["w-20", "w-16", "w-24"].map((width) => (
              <Skeleton key={width} className={`h-7 ${width} rounded-full`} />
            ))}
          </div>
        </section>
      </div>
    </SkeletonStatus>
  );
}
