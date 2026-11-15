import { BarChart3 } from "lucide-react";
import type { SubjectDistributionItem } from "./student-analytics-calculator";

export interface StudentSubjectDistributionProps {
  distribution: SubjectDistributionItem[];
}

const PALETTE_COLORS = [
  "bg-sky-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
] as const;

export function StudentSubjectDistribution({
  distribution,
}: StudentSubjectDistributionProps) {
  if (!distribution.length) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-indigo-50 p-2 text-brand-blue">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Question Bank Subject Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Relative weightage of questions currently available in your portal
            </p>
          </div>
        </div>
      </div>

      {/* Segmented Distribution Bar */}
      <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        {distribution.map((item, idx) => {
          const color = PALETTE_COLORS[idx % PALETTE_COLORS.length];
          return (
            <div
              key={item.name}
              style={{ width: `${item.percentage}%` }}
              className={`${color} transition-all duration-300`}
              title={`${item.name}: ${item.percentage}% (${item.count} Qs)`}
            />
          );
        })}
      </div>

      {/* Legend Items */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {distribution.map((item, idx) => {
          const dot = PALETTE_COLORS[idx % PALETTE_COLORS.length];
          return (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${dot}`} />
                <span className="font-semibold text-slate-800">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900">{item.count} Qs</span>
                <span className="ml-1 text-3xs text-slate-400">({item.percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
