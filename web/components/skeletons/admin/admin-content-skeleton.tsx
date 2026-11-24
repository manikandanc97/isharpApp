import { skeletonItems, SkeletonLines } from "@/components/skeletons/skeleton-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionCardSkeleton } from "./question-card-skeleton";
import type { Section } from "@/components/admin/admin-types";

export type AdminSkeletonSection = Section | "overview" | "students" | "courses" | "tests";

function OverviewSkeleton() {
  return (
    <div className="space-y-7 animate-pulse">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="max-w-xl space-y-2">
            <Skeleton className="h-6 w-48 rounded-full bg-rose-100/80" />
            <Skeleton className="h-8 w-80 max-w-full rounded-lg" />
            <SkeletonLines widths={["w-full", "w-4/5"]} />
          </div>
          <Skeleton className="h-10 w-52 rounded-full bg-brand-red/30" />
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
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 animate-pulse">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <SkeletonLines widths={["w-40", "w-96 max-w-full"]} lineClassName="first:h-5 last:h-3" />
        <Skeleton className="h-9 w-44 rounded-full bg-brand-red/30" />
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
      <Skeleton className="ml-auto h-7 w-16 rounded-full" />
    </div>
  );
}

function CoursesSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="border-b border-slate-200 bg-[#fbfbfa] px-5 py-7 sm:px-7 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-8 w-72 max-w-full" />
              <Skeleton className="h-3.5 w-full max-w-xl" />
            </div>
            <Skeleton className="h-10 w-36 rounded-full bg-brand-red/30" />
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

export function QuestionBankSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Question Bank Header Strip */}
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

        {/* Quick subject counters */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
          {["All", "Physics", "Chemistry", "Biology"].map((sub) => (
            <Skeleton key={sub} className="h-9 w-28 rounded-full" />
          ))}
        </div>
      </section>

      {/* Filter Bar & Cards */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>

        {/* 4 Question Card Skeletons */}
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <QuestionCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function TestSeriesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-8 w-64 rounded-lg" />
            <Skeleton className="h-3.5 w-80 max-w-full" />
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-10 w-36 rounded-full bg-brand-red/30" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3 border-t border-slate-100 pt-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
      </section>

      {/* Series Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-start">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4 rounded-md" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExamsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded-full" />
            <Skeleton className="h-8 w-72 rounded-lg" />
            <Skeleton className="h-3.5 w-80 max-w-full" />
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-10 w-36 rounded-full bg-brand-red/30" />
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
        </div>

        {/* 4 Real-time Metric Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 border-t border-slate-100 pt-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </section>

      {/* Exam Sessions Table */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-[#fbfbfa]">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-8 w-64 rounded-lg" />
        </div>
        <div className="divide-y divide-slate-100 p-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-44 rounded" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-3.5 w-64" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-8 w-64 rounded-lg" />
            <Skeleton className="h-3.5 w-80 max-w-full" />
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-32 rounded-full" />
          </div>
        </div>

        {/* Metric Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 border-t border-slate-100 pt-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      </section>

      {/* Leaderboard Table */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-[#fbfbfa] flex justify-between items-center">
          <Skeleton className="h-8 w-44 rounded-lg" />
          <Skeleton className="h-8 w-56 rounded-lg" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AuditLogsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-8 w-60 rounded-lg" />
            <Skeleton className="h-3.5 w-72" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        </div>

        {/* Modules Filter row */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {["All", "Question Bank", "Courses", "Exams", "Roles", "Settings"].map((m) => (
            <Skeleton key={m} className="h-7 w-24 rounded-lg" />
          ))}
        </div>
      </section>

      {/* Table */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between px-6 py-3.5">
              <Skeleton className="h-3 w-32 font-mono" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function RolesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded-full" />
            <Skeleton className="h-8 w-64 rounded-lg" />
            <Skeleton className="h-3.5 w-80 max-w-full" />
          </div>
          <Skeleton className="h-10 w-36 rounded-full bg-brand-red/30" />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {["Admin", "Super Admin", "Faculty Evaluator"].map((role) => (
          <div key={role} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-3.5 w-full" />
            <div className="pt-2 border-t border-slate-100 flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-8 w-64 rounded-lg" />
            <Skeleton className="h-3.5 w-80 max-w-full" />
          </div>
          <Skeleton className="h-10 w-32 rounded-full bg-brand-red/30" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-3.5 w-64" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminWorkspaceContentSkeleton({
  section = "overview",
}: {
  section?: AdminSkeletonSection;
}) {
  if (section === "students") return <StudentsSkeleton />;
  if (section === "courses") return <CoursesSkeleton />;
  if (section === "questions") return <QuestionBankSkeleton />;
  if (section === "test-series" || section === "tests") return <TestSeriesSkeleton />;
  if (section === "exams") return <ExamsSkeleton />;
  if (section === "results") return <ResultsSkeleton />;
  if (section === "audit-logs") return <AuditLogsSkeleton />;
  if (section === "roles") return <RolesSkeleton />;
  if (section === "settings") return <SettingsSkeleton />;
  return <OverviewSkeleton />;
}
