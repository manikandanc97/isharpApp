import {
  skeletonItems,
  SkeletonLines,
  SkeletonSectionHeading,
} from "@/components/skeletons/skeleton-primitives";
import { Skeleton } from "@/components/ui/skeleton";

export function FeatureSkeleton() {
  return (
    <section className="border-b border-slate-200/80 bg-white py-12 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SkeletonSectionHeading />
          <Skeleton className="h-10 w-full max-w-sm" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 sm:grid-cols-4">
            {skeletonItems(4).map((item) => (
              <div key={item} className="flex items-center gap-2.5 px-4 py-4">
                <Skeleton className="size-8 rounded-lg" />
                <SkeletonLines
                  className="flex-1 space-y-1.5"
                  lineClassName="h-3"
                  widths={["w-full", "w-3/4"]}
                />
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-12">
            <div className="space-y-4 border-b border-slate-200 p-5 sm:p-7 lg:col-span-7 lg:border-r lg:border-b-0 lg:p-8">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-7 w-4/5" />
              <Skeleton className="h-4 w-full" />
              {skeletonItems(3).map((item) => (
                <Skeleton key={item} className="h-9 w-full rounded-xl" />
              ))}
              <Skeleton className="h-9 w-32 rounded-full" />
            </div>
            <div className="bg-slate-50 p-4 sm:p-6 lg:col-span-5">
              <Skeleton className="h-64 w-full rounded-2xl bg-slate-300 sm:h-70 lg:h-75" />
            </div>
          </div>

          <div className="flex justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function AchievementSkeleton() {
  return (
    <section className="border-b border-slate-800 bg-slate-950 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <SkeletonSectionHeading dark />
          <div className="mt-6 space-y-4 border-t border-slate-800 pt-5">
            {skeletonItems(3).map((item) => (
              <div key={item} className="flex gap-3">
                <Skeleton className="size-4.5 rounded-full bg-slate-700" />
                <SkeletonLines
                  className="flex-1"
                  lineClassName="h-3 bg-slate-800"
                  widths={["w-1/2 bg-slate-700", "w-full"]}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          {skeletonItems(4).map((item) => (
            <div key={item} className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="flex justify-between">
                <Skeleton className="size-9 rounded-lg bg-slate-700" />
                <Skeleton className="h-5 w-16 rounded-full bg-slate-800" />
              </div>
              <Skeleton className="mt-5 h-8 w-24 bg-slate-700" />
              <Skeleton className="mt-3 h-4 w-2/3 bg-slate-700" />
              <Skeleton className="mt-2 h-3 w-full bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function JourneySkeleton() {
  return (
    <section className="border-b border-slate-200/80 bg-slate-50 px-4 py-12 sm:px-8 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <SkeletonSectionHeading />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {skeletonItems(4).map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200/90 bg-white p-5">
              <div className="flex justify-between">
                <Skeleton className="size-10 rounded-xl" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="mt-4 h-3 w-20" />
              <Skeleton className="mt-2 h-5 w-4/5" />
              <SkeletonLines className="mt-2 space-y-1.5" lineClassName="h-3" />
              <Skeleton className="mt-5 h-24 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CoursesSkeleton() {
  return (
    <section className="border-b border-slate-200/80 bg-white px-4 py-12 sm:px-8 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <SkeletonSectionHeading />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skeletonItems(6).map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6"
            >
              <div className="flex justify-between">
                <Skeleton className="size-10 rounded-xl" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-4 h-5 w-4/5" />
              <Skeleton className="mt-2 h-3.5 w-full" />
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="my-4 h-px bg-slate-100" />
              <SkeletonLines widths={["w-full", "w-full", "w-full"]} lineClassName="h-3" />
              <Skeleton className="mt-5 h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
