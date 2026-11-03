import { BrandLogo } from "@/components/brand-logo";
import {
  AdminWorkspaceContentSkeleton,
  type AdminSkeletonSection,
} from "@/components/skeletons/admin/admin-content-skeleton";
import { skeletonItems, SkeletonLines } from "@/components/skeletons/skeleton-primitives";
import { Skeleton, SkeletonStatus } from "@/components/ui/skeleton";

function AdminSidebarSkeleton({ section }: { section: AdminSkeletonSection }) {
  const activeIndex = section === "overview" ? 0 : section === "students" ? 1 : 2;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-white shadow-xs lg:flex">
      <div className="flex h-20 items-center border-b border-slate-100 px-6">
        <BrandLogo priority className="h-8 w-auto" />
      </div>
      <div className="px-5 pt-4 pb-2">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      <div className="flex-1 px-4 py-3">
        <Skeleton className="ml-3 h-3 w-20" />
        <div className="mt-2.5 space-y-1.5">
          {skeletonItems(3).map((item) => {
            const isActive = item === activeIndex;
            return (
              <div
                key={item}
                className={`flex items-center gap-3.5 rounded-2xl border px-3.5 py-3 ${
                  isActive
                    ? "border-brand-red/20 bg-rose-50"
                    : "border-transparent"
                }`}
              >
                <Skeleton
                  className={`size-9 rounded-xl ${isActive ? "bg-brand-red/30" : ""}`}
                />
                <SkeletonLines
                  className="flex-1 space-y-1.5"
                  widths={["w-20", "w-28"]}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/50 p-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <Skeleton className="size-9 rounded-lg bg-blue-100" />
          <SkeletonLines className="flex-1" widths={["w-24", "w-28"]} />
        </div>
        <Skeleton className="mx-auto mt-3 h-3 w-20" />
      </div>
    </aside>
  );
}

function AdminTopbarSkeleton() {
  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-2xs sm:px-8">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-xl lg:hidden" />
        <div className="space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <Skeleton className="hidden h-7 w-36 rounded-full sm:block" />
        <Skeleton className="size-9 rounded-xl" />
        <Skeleton className="size-9 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
    </header>
  );
}

export function AdminLayoutSkeleton({
  section = "overview",
}: {
  section?: AdminSkeletonSection;
}) {
  return (
    <SkeletonStatus
      label={`Loading admin ${section} page`}
      className="relative min-h-svh overflow-x-clip bg-slate-50 font-sans text-slate-900"
    >
      <AdminSidebarSkeleton section={section} />
      <div className="lg:pl-72">
        <AdminTopbarSkeleton />
        <main className="mx-auto max-w-7xl p-4 sm:p-8">
          <AdminWorkspaceContentSkeleton section={section} />
        </main>
      </div>
    </SkeletonStatus>
  );
}
