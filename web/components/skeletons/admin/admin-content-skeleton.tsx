import { skeletonItems, SkeletonLines } from "@/components/skeletons/skeleton-primitives";
import { Skeleton } from "@/components/ui/skeleton";

export type AdminSkeletonSection = "overview" | "students" | "courses";

function OverviewSkeleton() {
  return (
    <div className="space-y-7">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="max-w-xl space-y-2">
            <Skeleton className="h-6 w-48 rounded-full bg-rose-100/80" />
            <Skeleton className="h-8 w-80 max-w-full rounded-lg" />
            <SkeletonLines widths={["w-full", "w-4/5"]} />
          </div>
          <Skeleton className="h-10 w-52 rounded-xl bg-brand-red/30" />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {skeletonItems(4).map((item) => (
          <div key={item} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <SkeletonLines widths={["w-24", "w-16"]} lineClassName="first:h-3 last:h-8" />
              <Skeleton className="size-11 rounded-xl bg-slate-100" />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 xl:col-span-7">
          <PanelHeader action />
          <div className="mt-5 space-y-3">
            {skeletonItems(4).map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <Skeleton className="size-10 rounded-full bg-rose-100/70" />
                <SkeletonLines className="flex-1" widths={["w-2/5", "w-1/3"]} />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 xl:col-span-5">
          <PanelHeader />
          <div className="mt-5 space-y-3">
            {skeletonItems(3).map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-100 p-4">
                <Skeleton className="size-10 rounded-xl" />
                <SkeletonLines className="flex-1" widths={["w-2/3", "w-4/5"]} />
                <Skeleton className="size-5" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function PanelHeader({ action = false }: { action?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <SkeletonLines widths={["w-44", "w-64 max-w-full"]} lineClassName="first:h-5 last:h-3" />
      {action && <Skeleton className="h-8 w-24 rounded-lg" />}
    </div>
  );
}

function StudentsSkeleton() {
  const columns = ["w-16", "w-20", "w-12", "w-20", "w-18", "w-14", "w-16"];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <SkeletonLines widths={["w-40", "w-96 max-w-full"]} lineClassName="first:h-5 last:h-3" />
        <Skeleton className="h-9 w-44 rounded-xl bg-brand-red/30" />
      </div>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full max-w-md rounded-xl" />
        <Skeleton className="h-3.5 w-40" />
      </div>
      <div className="mt-4 flex gap-2">
        {["w-24", "w-18", "w-20"].map((width) => (
          <Skeleton key={width} className={`h-7 ${width} rounded-full`} />
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
        <div className="grid min-w-4xl grid-cols-[1.5fr_.8fr_.65fr_.9fr_.8fr_.8fr_.7fr] gap-4 border-b border-slate-200 bg-slate-50/70 px-4 py-3">
          {columns.map((width, index) => (
            <Skeleton key={index} className={`h-3 ${width}`} />
          ))}
        </div>
        <div className="min-w-4xl divide-y divide-slate-100">
          {skeletonItems(5).map((row) => <StudentRowSkeleton key={row} />)}
        </div>
      </div>
      <div className="mt-4 flex justify-between">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-8 w-40 rounded-lg" />
      </div>
    </section>
  );
}

function StudentRowSkeleton() {
  return (
    <div className="grid grid-cols-[1.5fr_.8fr_.65fr_.9fr_.8fr_.8fr_.7fr] items-center gap-4 px-4 py-3.5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-full bg-rose-100/70" />
        <SkeletonLines widths={["w-32", "w-24"]} />
      </div>
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-14 rounded-full" />
      <Skeleton className="ml-auto h-7 w-16 rounded-lg" />
    </div>
  );
}

function CoursesSkeleton() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="border-b border-slate-200 bg-[#fbfbfa] px-5 py-7 sm:px-7 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-8 w-72 max-w-full" />
              <Skeleton className="h-3.5 w-full max-w-xl" />
            </div>
            <Skeleton className="h-10 w-36 rounded-xl bg-brand-red/30" />
          </div>
        </div>

        <div className="grid border-b border-slate-200 sm:grid-cols-2 xl:grid-cols-4">
          {skeletonItems(4).map((item) => (
            <div key={item} className="flex items-center gap-3 border-slate-100 px-5 py-4 sm:border-l">
              <Skeleton className="size-10 rounded-lg" />
              <SkeletonLines widths={["w-12", "w-24"]} lineClassName="first:h-6 last:h-3" />
            </div>
          ))}
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
            <SkeletonLines widths={["w-32", "w-44"]} lineClassName="first:h-5 last:h-3" />
            <Skeleton className="h-10 w-full rounded-lg sm:w-80" />
          </div>
          <div className="mt-5 space-y-3">
            {skeletonItems(4).map((item) => <CourseRowSkeleton key={item} />)}
          </div>
        </div>
      </section>
      <QuestionBankSkeleton />
    </div>
  );
}

function CourseRowSkeleton() {
  return (
    <article className="grid gap-5 rounded-xl border border-slate-200 p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.85fr)_auto] lg:items-center lg:p-6">
      <div className="flex gap-4">
        <Skeleton className="size-12 shrink-0 rounded-xl bg-indigo-100/70" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex gap-2"><Skeleton className="h-5 w-16" /><Skeleton className="h-5 w-24 rounded-full" /></div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
        <div className="flex justify-between"><Skeleton className="h-3 w-28" /><Skeleton className="h-3 w-16" /></div>
        <div className="mt-3 flex gap-2"><Skeleton className="h-6 w-20 bg-white" /><Skeleton className="h-6 w-24 bg-white" /></div>
      </div>
      <SkeletonLines widths={["w-8", "w-16"]} lineClassName="first:h-5 last:h-3" />
    </article>
  );
}

function QuestionBankSkeleton() {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <SkeletonLines widths={["w-48", "w-96 max-w-full"]} lineClassName="first:h-5" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {skeletonItems(3).map((item) => (
          <div key={item} className="rounded-xl border border-slate-200 p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-7 w-14" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function AdminWorkspaceContentSkeleton({
  section = "overview",
}: {
  section?: AdminSkeletonSection;
}) {
  if (section === "students") return <StudentsSkeleton />;
  if (section === "courses") return <CoursesSkeleton />;
  return <OverviewSkeleton />;
}
