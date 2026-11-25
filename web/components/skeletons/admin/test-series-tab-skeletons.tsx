import { skeletonItems, SkeletonLines } from "@/components/skeletons/skeleton-primitives";
import { Skeleton } from "@/components/ui/skeleton";

function PanelTitle({ width = "w-40" }: { width?: string }) {
  return (
    <div className="space-y-2">
      <Skeleton className={`h-4 ${width}`} />
      <Skeleton className="h-3 w-72 max-w-full" />
    </div>
  );
}

function FieldSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <Skeleton className="mb-1.5 h-3 w-24" />
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  );
}

export function LoginDemoControlSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" aria-hidden="true">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Skeleton className="size-11 shrink-0 rounded-xl bg-indigo-100/80" />
          <SkeletonLines widths={["w-44", "w-80 max-w-full"]} lineClassName="first:h-4 last:h-3" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-9 w-40 rounded-full bg-brand-red/30" />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <PanelTitle width="w-36" />
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton wide />
            <FieldSkeleton wide />
          </div>
        </section>
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <PanelTitle width="w-32" />
          <div className="grid gap-3 sm:grid-cols-2">
            {skeletonItems(4).map((item) => <FieldSkeleton key={item} />)}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {skeletonItems(3).map((item) => (
              <Skeleton key={item} className="h-7 w-28 rounded-full" />
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <PanelTitle width="w-36" />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {skeletonItems(3).map((item) => (
            <div key={item} className="space-y-3 rounded-xl border border-slate-200 p-3">
              <Skeleton className="h-9 w-full rounded-lg" />
              <div className="grid grid-cols-2 gap-2">
                <FieldSkeleton />
                <FieldSkeleton />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <PanelTitle width="w-40" />
          <Skeleton className="h-9 w-52 rounded-full" />
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {skeletonItems(6).map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
              <Skeleton className="size-5 shrink-0 rounded" />
              <SkeletonLines className="flex-1" widths={["w-32", "w-full", "w-4/5"]} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function MockTestsTabSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden="true">
      <div className="grid gap-4 sm:grid-cols-3">
        {skeletonItems(3).map((item) => (
          <div key={item} className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <Skeleton className="size-11 rounded-xl bg-indigo-100/70" />
            <SkeletonLines widths={["w-12", "w-32"]} lineClassName="first:h-7 last:h-3" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(350px,0.8fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <PanelTitle width="w-52" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-5 h-24 w-full rounded-xl bg-indigo-100/60" />
          <Skeleton className="mt-4 h-20 w-full rounded-xl bg-blue-100/60" />
          <div className="mt-5 space-y-3.5 border-t border-slate-100 pt-5">
            <div className="grid gap-3 sm:grid-cols-2"><FieldSkeleton /><FieldSkeleton /></div>
            <FieldSkeleton />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-full bg-brand-red/30" />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <PanelTitle width="w-36" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
          {skeletonItems(4).map((item) => (
            <div key={item} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <div className="mt-3 flex gap-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
