import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentPortalData, TabId } from "../student-types";
import {
  calculateCurriculumReadiness,
  calculateSyllabusCoverage,
} from "./student-analytics-calculator";

export interface StudentAnalyticsSummaryProps {
  summary: StudentPortalData["summary"];
  onTabChange: (tab: TabId) => void;
}

export function StudentAnalyticsSummary({
  summary,
  onTabChange,
}: StudentAnalyticsSummaryProps) {
  const coverage = calculateSyllabusCoverage(summary);
  const readiness = calculateCurriculumReadiness(coverage.activeQuestions);

  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-rose-50 p-2 text-brand-red">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Curriculum Readiness Index
              </h3>
              <p className="text-xs text-slate-500">
                Platform readiness based on active modules
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-brand-red bg-rose-50 px-2.5 py-1 rounded-full">
            Active Phase
          </span>
        </div>

        <div className="mt-6 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-slate-900">
            {readiness.label}%
          </span>
          <span className="text-xs text-slate-500">Curriculum Loaded</span>
        </div>

        <div className="mt-3 w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-brand-red via-brand-blue to-emerald-500 h-3 rounded-full"
            style={{ width: `${readiness.widthPercent}%` }}
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center text-xs">
          <div>
            <p className="text-slate-400 font-medium text-3xs uppercase">Subjects</p>
            <p className="font-bold text-slate-900">{coverage.activeSubjects} Active</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium text-3xs uppercase">Question Bank</p>
            <p className="font-bold text-slate-900">{coverage.activeQuestions} Qs</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium text-3xs uppercase">Mock Series</p>
            <p className="font-bold text-slate-900">{coverage.publishedMocks} Papers</p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-600 flex items-center justify-between">
        <span>Ready for your daily practice session?</span>
        <Button
          size="sm"
          onClick={() => onTabChange("dpp")}
          className="rounded-full bg-brand-red text-xs font-semibold text-white hover:bg-brand-red-hover cursor-pointer"
        >
          Start DPP
        </Button>
      </div>
    </section>
  );
}
