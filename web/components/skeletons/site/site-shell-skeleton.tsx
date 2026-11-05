import { BrandLogo } from "@/components/brand-logo";
import { skeletonItems, SkeletonLines } from "@/components/skeletons/skeleton-primitives";
import { Skeleton } from "@/components/ui/skeleton";

export function SiteHeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-xs">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-brand-red" />
      <div className="layout-container flex h-(--layout-site-header-height) items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <BrandLogo priority className="h-8.5 w-auto sm:h-9.5" />
          <span className="hidden h-5 w-px bg-slate-300 sm:block" />
          <Skeleton className="hidden h-7 w-52 rounded-full lg:block" />
        </div>
        <Skeleton className="h-8.5 w-24 rounded-full bg-brand-red/30" />
      </div>
    </header>
  );
}

function AccessCardSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200/85 bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="space-y-2">
          <Skeleton className="h-5 w-28 rounded-full bg-emerald-100/80" />
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-3 w-52 max-w-full" />
        </div>
        <Skeleton className="size-10.5 rounded-2xl bg-brand-red/30" />
      </div>

      <div className="mt-3.5 space-y-2.5">
        {skeletonItems(3).map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
          >
            <Skeleton className="size-9 shrink-0 rounded-xl" />
            <SkeletonLines
              className="min-w-0 flex-1 space-y-1.5"
              lineClassName="h-3"
              widths={["w-2/5", "w-4/5"]}
            />
            <Skeleton className="size-7 rounded-full" />
          </div>
        ))}
      </div>

      <div className="mt-3.5 flex justify-between border-t border-slate-100 pt-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <section className="relative flex min-h-[calc(100svh-var(--layout-site-header-height))] flex-col justify-center overflow-hidden border-b border-slate-200 bg-slate-50 py-(--space-layout) lg:py-0">
      <div className="layout-container grid grid-cols-[minmax(0,1fr)] items-center gap-(--space-layout) lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <Skeleton className="h-7 w-72 max-w-full rounded-full" />
          <SkeletonLines
            className="mt-5 space-y-2.5"
            lineClassName="h-10 max-w-xl rounded-xl"
            widths={["w-full", "w-4/5 bg-rose-200/65"]}
          />
          <SkeletonLines
            className="mt-4 max-w-xl"
            lineClassName="h-4"
            widths={["w-full", "w-11/12", "w-3/4"]}
          />

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5">
            {["w-28", "w-36", "w-32"].map((width) => (
              <div key={width} className="flex items-center gap-2">
                <Skeleton className="size-4.5 rounded-full bg-emerald-200/80" />
                <Skeleton className={`h-4 ${width}`} />
              </div>
            ))}
          </div>

          <div className="mt-7 flex gap-3.5">
            <Skeleton className="h-10 w-40 rounded-full bg-brand-red/35" />
            <Skeleton className="h-10 w-36 rounded-full" />
          </div>
          <div className="mt-7 flex max-w-xl flex-wrap gap-5 border-t border-slate-200/80 pt-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        <div className="lg:col-span-5">
          <AccessCardSkeleton />
        </div>
      </div>
    </section>
  );
}

export function FooterSkeleton() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="layout-container flex justify-between gap-4 py-5">
          <Skeleton className="h-9 w-64 max-w-[60%] bg-slate-800" />
          <Skeleton className="h-7 w-44 rounded-full bg-slate-800" />
        </div>
      </div>
      <div className="layout-container grid gap-10 py-(--space-layout) sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          <Skeleton className="h-12 w-32 bg-white/15" />
          <SkeletonLines
            lineClassName="h-3 bg-slate-800"
            widths={["w-full", "w-4/5"]}
          />
        </div>
        {skeletonItems(3).map((column) => (
          <div key={column} className="space-y-3">
            <Skeleton className="h-4 w-24 bg-slate-700" />
            {skeletonItems(4).map((item) => (
              <Skeleton key={item} className="h-3 w-28 bg-slate-800" />
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
