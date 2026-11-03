import { BrandLogo } from "@/components/brand-logo";
import { SkeletonLines } from "@/components/skeletons/skeleton-primitives";
import { Skeleton, SkeletonStatus } from "@/components/ui/skeleton";

export default function PendingAccessLoading() {
  return (
    <SkeletonStatus
      label="Loading account status"
      className="grid min-h-svh place-items-center bg-slate-50 px-4 py-10"
    >
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-card sm:p-9">
        <BrandLogo priority className="mx-auto h-10 w-auto" />
        <Skeleton className="mx-auto mt-7 size-14 rounded-2xl bg-amber-100/80" />
        <Skeleton className="mx-auto mt-5 h-7 w-72 max-w-full" />
        <SkeletonLines
          className="mt-3"
          lineClassName="mx-auto max-w-sm"
          widths={["w-full", "w-4/5 max-w-xs"]}
        />
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-indigo-50 p-4 text-left">
          <Skeleton className="size-4 shrink-0 rounded-full bg-indigo-200" />
          <SkeletonLines
            className="flex-1"
            lineClassName="h-3 bg-indigo-200/80"
            widths={["w-full", "w-11/12", "w-3/5"]}
          />
        </div>
        <Skeleton className="mx-auto mt-6 h-9 w-28 rounded-lg" />
      </section>
    </SkeletonStatus>
  );
}
