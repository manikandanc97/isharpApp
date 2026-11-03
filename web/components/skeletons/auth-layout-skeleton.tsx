import { Skeleton } from "@/components/ui/skeleton";
import { BrandLogo } from "@/components/brand-logo";

interface AuthLayoutSkeletonProps {
  type?: "login" | "admin" | "register";
}

export function AuthLayoutSkeleton({ type = "login" }: AuthLayoutSkeletonProps) {
  const isAdmin = type === "admin";
  const isRegister = type === "register";

  return (
    <div className="flex min-h-svh flex-col bg-slate-50/70 font-sans text-slate-900 selection:bg-brand-red selection:text-white antialiased lg:h-svh lg:overflow-hidden">
      {/* 01. NAVIGATION HEADER SKELETON */}
      <header className="sticky top-0 z-50 shrink-0 border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <BrandLogo priority className="h-8.5 sm:h-9.5 w-auto opacity-80" />
            <span
              className="hidden h-5 w-px bg-slate-200 sm:block"
              aria-hidden="true"
            />
            {/* Capsule */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50 px-3 py-1">
              <Skeleton className="size-2 rounded-full bg-brand-red/50" />
              <Skeleton className="h-3 w-32 rounded-full" />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8.5 w-24 rounded-full" />
          </div>
        </div>
      </header>

      {/* 02. AUTH SPLIT CONTAINER SKELETON */}
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden px-4 py-6 sm:px-8 lg:py-8">
        <div className="grid flex-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Academic / Portal Pillars */}
          <div className="hidden flex-col justify-center lg:col-span-6 lg:flex xl:col-span-7">
            <div className="space-y-4">
              <Skeleton className="h-6 w-36 rounded-full bg-rose-100" />
              <div className="space-y-2">
                <Skeleton className="h-9 w-4/5 rounded-xl" />
                <Skeleton className="h-9 w-3/5 rounded-xl" />
              </div>
              <Skeleton className="h-4 w-3/4 rounded-md" />
            </div>

            {/* 3 Value Proposition Blocks */}
            <div className="mt-8 space-y-4">
              {[1, 2, 3].map((pillar) => (
                <div
                  key={pillar}
                  className="flex items-start gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
                >
                  <Skeleton className="size-10 shrink-0 rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40 rounded-md" />
                    <Skeleton className="h-3 w-64 rounded-md" />
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Support Badge */}
            <div className="mt-8 flex items-center gap-3 pt-6 border-t border-slate-200/60">
              <Skeleton className="size-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-40 rounded-md" />
                <Skeleton className="h-3 w-28 rounded-md" />
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="flex justify-center lg:col-span-6 xl:col-span-5">
            <div className="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl sm:p-8 space-y-6">
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32 rounded-lg" />
                  <Skeleton
                    className={`h-5 w-20 rounded-full ${
                      isAdmin ? "bg-slate-200" : "bg-rose-100"
                    }`}
                  />
                </div>
                <Skeleton className="h-3.5 w-48 rounded-md" />
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {isRegister ? (
                  <>
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-20 rounded-md" />
                      <Skeleton className="h-10.5 w-full rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-24 rounded-md" />
                      <Skeleton className="h-10.5 w-full rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-16 rounded-md" />
                        <Skeleton className="h-10.5 w-full rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-16 rounded-md" />
                        <Skeleton className="h-10.5 w-full rounded-xl" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-24 rounded-md" />
                      <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-20 rounded-md" />
                        <Skeleton className="h-3 w-24 rounded-md" />
                      </div>
                      <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                  </>
                )}

                {/* Primary Action Button */}
                <Skeleton
                  className={`mt-2 h-11 w-full rounded-xl ${
                    isAdmin ? "bg-brand-navy/60" : "bg-brand-red/60"
                  }`}
                />

                {/* Alternate Actions / OAuth */}
                {!isAdmin && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-slate-200" />
                      <Skeleton className="h-3 w-24 rounded-md" />
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <Skeleton className="h-10.5 w-full rounded-xl" />
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-2 text-center border-t border-slate-100">
                <Skeleton className="mx-auto h-3.5 w-48 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

