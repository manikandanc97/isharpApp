import { CheckCircle2, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TabId } from "../student-types";
import { getActivityRoadmapStats } from "./student-analytics-calculator";

export interface StudentActivityRoadmapProps {
  onTabChange?: (tab: TabId) => void;
}

const SCHEDULE_DAYS = [
  { day: "Mon", status: "done" },
  { day: "Tue", status: "done" },
  { day: "Wed", status: "done" },
  { day: "Thu", status: "done" },
  { day: "Fri", status: "done" },
  { day: "Sat", status: "today" },
  { day: "Sun", status: "upcoming" },
] as const;

export function StudentActivityRoadmap({ onTabChange }: StudentActivityRoadmapProps = {}) {
  void onTabChange;
  const stats = getActivityRoadmapStats(5);

  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-orange-50 p-2 text-orange-600">
              <Flame className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Weekly Study Habit Tracker
              </h3>
              <p className="text-xs text-slate-500">
                Daily engagement keeps concepts fresh
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
            <Flame className="size-3.5 fill-orange-500" />
            <span>{stats.streakLabel}</span>
          </span>
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          {SCHEDULE_DAYS.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
              <span className="text-3xs font-medium text-slate-400">{item.day}</span>
              <div
                className={`flex size-9 items-center justify-center rounded-2xl text-xs font-bold transition ${
                  item.status === "done"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : item.status === "today"
                      ? "border-2 border-brand-red bg-rose-50 text-brand-red"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {item.status === "done" ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  idx + 1
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/50 p-3 text-xs text-orange-950">
          <p className="font-semibold text-orange-900">NEET/JEE Retention Rule</p>
          <p className="mt-0.5 text-3xs sm:text-xs leading-relaxed text-orange-800">
            Daily 45-minute problem solving boosts retention by 65% compared to weekend-only cramming sessions.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>Target: {stats.targetQuestionsPerDay} questions per day</span>
        <span className="font-semibold text-emerald-600">{stats.status}</span>
      </div>
    </section>
  );
}

export interface StudentAnalyticsEngineNoticeProps {
  onTabChange: (tab: TabId) => void;
}

export function StudentAnalyticsEngineNotice({
  onTabChange,
}: StudentAnalyticsEngineNoticeProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 p-6 shadow-2xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-secondary">
          <Sparkles className="size-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-bold text-slate-900">
            Real-Time Test Engine Performance Sync
          </h4>
          <p className="text-xs leading-relaxed text-slate-600 max-w-3xl">
            As soon as you attempt the official published mock exams, this page will automatically unlock comprehensive analytics: individual subject scores, percentile estimates, negative-marking penalty analysis, and question-by-question time breakdowns.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-indigo-100 pt-4 text-xs">
        <span className="font-semibold text-slate-700">Recommended Next Step:</span>
        <Button
          size="sm"
          onClick={() => onTabChange("mocks")}
          className="rounded-full bg-brand-blue text-xs font-semibold text-white hover:bg-brand-blue-hover cursor-pointer"
        >
          Review Available Mock Papers →
        </Button>
      </div>
    </section>
  );
}
