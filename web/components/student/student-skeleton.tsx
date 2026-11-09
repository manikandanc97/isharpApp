export function LuxuryDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-900 antialiased animate-pulse">
      {/* Skeleton Header */}
      <div className="h-16 w-full border-b border-slate-200 bg-white px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-28 rounded-xl bg-slate-200/80" />
          <div className="hidden sm:block h-6 w-24 rounded-full bg-slate-100" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-36 rounded-full bg-slate-100" />
          <div className="h-8 w-8 rounded-full bg-slate-200/80" />
        </div>
      </div>

      {/* Skeleton Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Skeleton Nav Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <div className="h-9 w-24 rounded-full bg-slate-200" />
          <div className="h-9 w-32 rounded-full bg-slate-100" />
          <div className="h-9 w-28 rounded-full bg-slate-100" />
          <div className="h-9 w-36 rounded-full bg-slate-100" />
          <div className="h-9 w-28 rounded-full bg-slate-100" />
        </div>

        {/* Skeleton Hero Banner */}
        <div className="h-52 w-full rounded-3xl border border-slate-200 bg-white p-8">
          <div className="space-y-3 max-w-xl">
            <div className="h-5 w-40 rounded-full bg-slate-200" />
            <div className="h-8 w-72 rounded-xl bg-slate-200" />
            <div className="h-4 w-96 rounded-lg bg-slate-100" />
          </div>
        </div>

        {/* Skeleton 5 Cards Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-3 w-16 rounded bg-slate-200" />
                <div className="h-6 w-6 rounded-lg bg-slate-100" />
              </div>
              <div className="h-7 w-12 rounded bg-slate-200" />
            </div>
          ))}
        </div>

        {/* Skeleton Dual Panels */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 rounded-3xl border border-slate-200 bg-white p-6" />
          <div className="h-80 rounded-3xl border border-slate-200 bg-white p-6" />
        </div>
      </div>
    </div>
  );
}
