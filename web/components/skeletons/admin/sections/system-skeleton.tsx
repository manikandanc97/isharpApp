import { Skeleton } from "@/components/ui/skeleton";

export function AuditLogsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
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

        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {["All", "Question Bank", "Courses", "Exams", "Roles", "Settings"].map(
            (m) => (
              <Skeleton key={m} className="h-7 w-24 rounded-lg" />
            ),
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between px-6 py-3.5"
            >
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

export function RolesSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
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
          <div
            key={role}
            className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
          >
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-3.5 w-full" />
            <div className="flex justify-between border-t border-slate-100 pt-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
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
          <div
            key={i}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
          >
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
