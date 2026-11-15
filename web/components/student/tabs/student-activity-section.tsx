import { Flame, Sparkles, Target } from "lucide-react";
import type { TabId } from "../student-types";

export interface StudentActivitySectionProps {
  onTabChange: (tab: TabId) => void;
}

const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;

export function StudentActivitySection({ onTabChange }: StudentActivitySectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Daily Streak Tracker */}
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-orange-50 p-3 text-orange-600">
            <Flame className="size-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Study Streak</p>
            <h3 className="text-xl font-bold text-slate-900">Consistent Scholar</h3>
            <p className="mt-1 text-xs text-slate-500">
              Regular daily practice is key to top scores in NEET / JEE.
            </p>
            <div className="mt-3 flex items-center gap-1.5">
              {WEEK_DAYS.map((day, idx) => (
                <span
                  key={idx}
                  className={`flex size-6 items-center justify-center rounded-full text-3xs font-bold ${
                    idx < 5 ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Daily DPP Goal */}
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-indigo-50 p-3 text-brand-blue">
            <Target className="size-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Goal</p>
            <h3 className="text-xl font-bold text-slate-900">25 Questions / Day</h3>
            <p className="mt-1 text-xs text-slate-500">
              Solve at least 25 problems every session to build numerical accuracy.
            </p>
            <div className="mt-3 w-full bg-slate-100 rounded-full h-2">
              <div className="bg-brand-blue h-2 rounded-full w-3/4" />
            </div>
          </div>
        </div>

        {/* Expert NEET/JEE Tip */}
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-purple-50 p-3 text-purple-600">
            <Sparkles className="size-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Advice</p>
            <h3 className="text-base font-bold text-slate-900">Formula & Diagram Revision</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Review mistakes from your mock attempts immediately to convert weak areas into strengths.
            </p>
            <button
              type="button"
              onClick={() => onTabChange("analytics")}
              className="mt-2 text-xs font-semibold text-brand-blue hover:underline cursor-pointer"
            >
              View Study Roadmap →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
