export function LuxuryDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8f9fc] py-(--space-content) animate-pulse">
      <div className="layout-container layout-stack" data-size="workspace" data-gap="lg">
        <div className="h-16 w-full rounded-2xl bg-slate-200/60" />
        <div className="h-48 w-full rounded-3xl bg-slate-200/60" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200/60" />
          ))}
        </div>
        <div className="h-96 w-full rounded-3xl bg-slate-200/60" />
      </div>
    </div>
  );
}

