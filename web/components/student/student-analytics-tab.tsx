"use client";

import { useMemo } from "react";
import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StudentPortalData, TabId } from "./student-types";
import {
  calculateSubjectDistribution,
} from "./tabs/student-analytics-calculator";
import {
  StudentActivityRoadmap,
  StudentAnalyticsEngineNotice,
} from "./tabs/student-activity-roadmap";
import { StudentAnalyticsSummary } from "./tabs/student-analytics-summary";
import { StudentSubjectDistribution } from "./tabs/student-subject-distribution";

export {
  calculateCurriculumReadiness,
  calculateProgressPercentage,
  calculateSubjectDistribution,
  calculateSyllabusCoverage,
  getActivityRoadmapStats,
} from "./tabs/student-analytics-calculator";
export {
  StudentActivityRoadmap,
  StudentAnalyticsEngineNotice,
} from "./tabs/student-activity-roadmap";
export { StudentAnalyticsSummary } from "./tabs/student-analytics-summary";
export { StudentSubjectDistribution } from "./tabs/student-subject-distribution";

interface StudentAnalyticsTabProps {
  data: StudentPortalData;
  onTabChange: (tab: TabId) => void;
}

export function StudentAnalyticsTab({
  data,
  onTabChange,
}: StudentAnalyticsTabProps) {
  // Compute subject distribution based on real questions count safely
  const subjectDistribution = useMemo(() => {
    return calculateSubjectDistribution(data.recentQuestions);
  }, [data.recentQuestions]);

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700">
                LEARNING ACTIVITY & ROADMAP
              </span>
              <span className="text-xs text-slate-500">
                Academic Progress & Practice Insights
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Preparation Readiness & Syllabus Activity
            </h2>
            <p className="mt-1 text-xs text-slate-600 max-w-xl">
              Track your daily learning consistency, syllabus question coverage, and exam target milestones to maximize your NEET/JEE rank.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1">
              <Activity className="mr-1.5 size-3.5 text-emerald-600" />
              <span>Syllabus Active</span>
            </Badge>
          </div>
        </div>
      </section>

      {/* Grid: Readiness Index & Habit Tracker */}
      <div className="grid gap-6 md:grid-cols-2">
        <StudentAnalyticsSummary summary={data.summary} onTabChange={onTabChange} />
        <StudentActivityRoadmap onTabChange={onTabChange} />
      </div>

      {/* Question Bank Subject Distribution */}
      <StudentSubjectDistribution distribution={subjectDistribution} />

      {/* Online Assessment Engine Analytics Notice */}
      <StudentAnalyticsEngineNotice onTabChange={onTabChange} />
    </div>
  );
}
