import { BrandLogo } from "@/components/brand-logo";
import { skeletonItems } from "@/components/skeletons/skeleton-primitives";
import { Skeleton, SkeletonStatus } from "@/components/ui/skeleton";

type AuthSkeletonType = "login" | "register" | "admin";

function HeaderSkeleton({ type }: { type: AuthSkeletonType }) {
  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-slate-200/80 bg-white/85 shadow-xs backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <BrandLogo priority className="h-8.5 w-auto sm:h-9.5" />
          <span className="hidden h-5 w-px bg-slate-200 sm:block" />
          <Skeleton className="hidden h-7 w-44 rounded-full lg:block" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-4 w-24 rounded-full" />
          <span className="h-3.5 w-px bg-slate-200" />
          <Skeleton
            className={`h-7 rounded-full ${type === "login" ? "w-25" : "w-23"}`}
          />
        </div>
      </div>
    </header>
  );
}

function PresentationSkeleton({ type }: { type: AuthSkeletonType }) {
  const isRegister = type === "register";
  const isAdmin = type === "admin";

  return (
    <section
      className={`flex flex-col justify-center ${
        isRegister ? "lg:col-span-5" : "lg:col-span-6 xl:col-span-7"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-6 w-36 rounded-full bg-blue-100/80" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-8 w-11/12 rounded-lg sm:h-9" />
        <Skeleton className="h-8 w-3/5 rounded-lg sm:h-9" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-3.5 w-full max-w-xl" />
        <Skeleton className="h-3.5 w-4/5 max-w-lg" />
      </div>

      <div
        className={`mt-4 ${
          isAdmin ? "grid grid-cols-1 gap-2.5 sm:grid-cols-3" : "space-y-2"
        }`}
      >
        {skeletonItems(3).map((index) => (
          <div
            key={index}
            className={`rounded-xl border border-slate-200/90 bg-white/90 shadow-2xs ${
              isAdmin ? "p-3" : "flex items-center gap-3 px-3 py-2"
            }`}
          >
            <Skeleton className="size-7.5 shrink-0 rounded-lg bg-slate-100" />
            <div className={isAdmin ? "mt-2 space-y-2" : "min-w-0 flex-1 space-y-1.5"}>
              <Skeleton className={`h-3.5 ${isAdmin ? "w-4/5" : "w-2/5"}`} />
              <Skeleton className={`h-3 ${isAdmin ? "w-full" : "w-4/5"}`} />
            </div>
          </div>
        ))}
      </div>

      {isRegister ? (
        <div className="mt-4 rounded-xl bg-brand-navy p-3.5">
          <Skeleton className="h-3 w-28 bg-white/20" />
          <div className="mt-2 flex items-center gap-3">
            <Skeleton className="size-8 rounded-lg bg-white/15" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32 bg-white/25" />
              <Skeleton className="h-3 w-44 bg-white/15" />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2">
          <div className="flex -space-x-1.5">
            {skeletonItems(3).map((item) => (
              <Skeleton key={item} className="size-7 rounded-full ring-2 ring-white" />
            ))}
          </div>
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      )}
    </section>
  );
}

function FieldSkeleton() {
  return (
    <div>
      <Skeleton className="mb-1 h-3 w-24" />
      <Skeleton className="h-10.5 w-full rounded-xl" />
    </div>
  );
}

function FormSkeleton({ type }: { type: AuthSkeletonType }) {
  const isRegister = type === "register";
  return (
    <section
      className={`w-full rounded-2xl border border-slate-200/90 bg-white shadow-card ${
        isRegister
          ? "p-4.5 sm:p-5.5 lg:col-span-7 lg:p-6"
          : "max-w-md p-5 sm:p-6 lg:col-span-6 xl:col-span-5"
      }`}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32 rounded-full bg-rose-100/80" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="mt-3 h-6 w-3/5" />
      <Skeleton className="mt-2 h-3 w-4/5" />

      {isRegister && (
        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/40 p-2.5">
          <Skeleton className="h-10 w-full rounded-lg bg-white" />
          <Skeleton className="mx-auto mt-2 h-3 w-3/5" />
        </div>
      )}

      <div className="my-3 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <Skeleton className="h-3 w-20" />
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className={isRegister ? "grid gap-2.5 sm:grid-cols-2" : "space-y-3"}>
        {skeletonItems(isRegister ? 6 : 2).map((index) => (
          <FieldSkeleton key={index} />
        ))}
      </div>
      <Skeleton className="mt-4 h-10.5 w-full rounded-full bg-brand-red/35" />
      <Skeleton className="mx-auto mt-2 h-3 w-3/4" />
      <div className="my-3 h-px bg-slate-100" />
      <Skeleton className="h-12 w-full rounded-xl bg-blue-100/70" />
    </section>
  );
}

export function AuthLayoutSkeleton({ type = "login" }: { type?: AuthSkeletonType }) {
  const isRegister = type === "register";
  return (
    <SkeletonStatus
      label={`Loading ${type} page`}
      className="flex min-h-svh flex-col bg-slate-50/70 font-sans text-slate-900 lg:h-svh lg:overflow-hidden"
    >
      <HeaderSkeleton type={type} />
      <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-4 sm:px-8 lg:overflow-hidden lg:py-0">
        <div
          className={`relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-10 ${
            isRegister ? "" : "xl:gap-14"
          }`}
        >
          <PresentationSkeleton type={type} />
          <FormSkeleton type={type} />
        </div>
      </main>
    </SkeletonStatus>
  );
}
