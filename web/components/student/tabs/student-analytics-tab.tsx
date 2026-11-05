"use client";

export function StudentAnalyticsTab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
        <div className="grid gap-1">
          <h2 className="type-section-title text-slate-900">
            Performance &amp; All-India Rank Predictor
          </h2>
          <p className="text-xs text-slate-600 sm:text-sm">
            AI-driven diagnostic analysis pinpointing high-yield score improvement opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
            <p className="text-3xs font-semibold uppercase tracking-wide text-slate-400">
              Projected AIR Rank
            </p>
            <p className="type-metric text-brand-red">AIR 1,850 - 2,400</p>
            <p className="text-3xs font-semibold text-emerald-700">Qualifies for Govt Medical College</p>
          </div>

          <div className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
            <p className="text-3xs font-semibold uppercase tracking-wide text-slate-400">
              Speed per Question
            </p>
            <p className="type-metric text-slate-900">52 Seconds</p>
            <p className="text-3xs font-medium text-slate-500">Standard NTA Benchmark: 60s</p>
          </div>

          <div className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
            <p className="text-3xs font-semibold uppercase tracking-wide text-slate-400">
              Potential Mark Boost
            </p>
            <p className="type-metric text-emerald-600">+24 Marks</p>
            <p className="text-3xs font-medium text-slate-500">Target: Organic Reaction Mechanisms</p>
          </div>
        </div>
      </div>
    </div>
  );
}

