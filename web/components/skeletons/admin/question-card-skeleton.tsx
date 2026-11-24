import { Skeleton } from "@/components/ui/skeleton";

export function QuestionCardSkeleton() {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <Skeleton className="mt-0.5 size-4 rounded shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-40 max-w-[60%]" />
              <Skeleton className="h-4 w-16 rounded-md bg-indigo-50" />
            </div>
            {/* Question Text Lines */}
            <div className="space-y-1.5 pt-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-3.5 w-3/4 opacity-75" />
            </div>
          </div>
        </div>

        {/* Difficulty Badge */}
        <div className="flex shrink-0 items-center gap-1.5">
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
      </div>

      {/* 4 Options Grid */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {["A", "B", "C", "D"].map((opt) => (
          <div
            key={opt}
            className="flex items-center gap-2.5 rounded-xl border border-slate-150 bg-slate-50/50 p-2.5"
          >
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-200/80 text-3xs font-bold text-slate-500">
              {opt}
            </div>
            <Skeleton className="h-3.5 flex-1" />
          </div>
        ))}
      </div>

      {/* Footer Info & Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20 rounded" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="size-7 rounded-lg" />
        </div>
      </div>
    </article>
  );
}

export function QuestionCardsSkeletonGrid({
  count = 4,
  layoutMode = "list",
}: {
  count?: number;
  layoutMode?: "list" | "grid";
}) {
  return (
    <div
      className={
        layoutMode === "list"
          ? "flex flex-col gap-4 w-full"
          : "grid gap-4 lg:grid-cols-2"
      }
    >
      {Array.from({ length: count }).map((_, i) => (
        <QuestionCardSkeleton key={i} />
      ))}
    </div>
  );
}
