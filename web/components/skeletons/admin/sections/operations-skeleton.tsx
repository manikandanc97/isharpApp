import {
  skeletonItems,
  SkeletonLines,
} from "@/components/skeletons/skeleton-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionCardSkeleton } from "../question-card-skeleton";

export function QuestionBankSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32 rounded-full" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
            <Skeleton className="h-8 w-72 rounded-lg" />
            <Skeleton className="h-3.5 w-96 max-w-full" />
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-10 w-32 rounded-xl bg-brand-red/30" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
          {["All", "Physics", "Chemistry", "Biology"].map((sub) => (
            <Skeleton key={sub} className="h-9 w-28 rounded-full" />
          ))}
        </div>
      </section>

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <QuestionCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function TestSeriesSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-40 rounded-md bg-rose-100/80" />
            <Skeleton className="h-3 w-64 max-w-[45vw]" />
          </div>
          <Skeleton className="h-8 w-80 max-w-full rounded-lg" />
          <Skeleton className="h-3 w-2xl max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-36 rounded-full bg-brand-red/30" />
        </div>
      </div>

      <div className="flex w-full gap-3 rounded-xl border-b border-slate-200 bg-white px-2 shadow-2xs">
        {skeletonItems(3).map((item) => (
          <div key={item} className="flex items-center gap-2 px-5 py-3">
            <Skeleton className="size-4 rounded" />
            <Skeleton className={`h-4 ${item === 2 ? "w-52" : "w-32"}`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        {skeletonItems(5).map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="size-7 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-7 w-12" />
            <Skeleton className="mt-1 h-3 w-32 max-w-full" />
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs md:flex-row">
          <Skeleton className="h-9 min-w-48 flex-1 rounded-lg" />
          {skeletonItems(3).map((item) => (
            <Skeleton key={item} className="h-9 w-32 rounded-lg" />
          ))}
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="grid grid-cols-[1.5fr_.8fr_.7fr_.7fr_.5fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3">
            {skeletonItems(5).map((item) => (
              <Skeleton key={item} className="h-3 w-20" />
            ))}
          </div>
          <div className="divide-y divide-slate-100">
            {skeletonItems(5).map((item) => (
              <div
                key={item}
                className="grid grid-cols-[1.5fr_.8fr_.7fr_.7fr_.5fr] items-center gap-4 px-5 py-4"
              >
                <SkeletonLines widths={["w-44", "w-28"]} />
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="ml-auto size-7 rounded-lg" />
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-slate-200 px-5 py-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-36 rounded-lg" />
          </div>
        </div>
      </section>
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48 rounded-full bg-rose-100/70" />
            <Skeleton className="h-8 w-72 rounded-lg" />
            <Skeleton className="h-3.5 w-96 max-w-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-7 w-20" />
                </div>
                <Skeleton className="size-9 rounded-xl" />
              </div>
              <Skeleton className="mt-3 h-3 w-32" />
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-3.5 w-14" />
            </div>
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-[#fbfbfa] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="space-y-1">
            <Skeleton className="h-5 w-52 rounded" />
            <Skeleton className="h-3 w-64" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-44 rounded-lg" />
            <Skeleton className="h-9 w-48 rounded-lg" />
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between px-6 py-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-7 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
