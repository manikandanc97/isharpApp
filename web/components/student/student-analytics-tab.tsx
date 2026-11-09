"use client";

import { useMemo } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Flame,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSubjectTheme } from "./student-helpers";
import type { StudentPortalData, TabId } from "./student-types";

interface StudentAnalyticsTabProps {
  data: StudentPortalData;
  onTabChange: (tab: TabId) => void;
}

export function StudentAnalyticsTab({
  data,
  onTabChange,
}: StudentAnalyticsTabProps) {
  // Compute subject distribution based on real questions count
  const subjectDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    for (const q of data.recentQuestions) {
      const name = q.subject.name;
      counts[name] = (counts[name] || 0) + 1;
      total += 1;
    }
    return Object.entries(counts).map(([name, count]) => {
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      const theme = getSubjectTheme(name);
      return {
        name,
        count,
        percentage,
        theme,
      };
    });
  }, [data.recentQuestions]);

  // Total questions in database
  const totalQuestions = data.summary.activeQuestions;
  const publishedMocks = data.summary.publishedMocks;
  const activeSubjects = data.summary.activeSubjects;

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
        {/* Preparation Readiness Index */}
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
                {totalQuestions > 0 ? "88" : "50"}%
              </span>
              <span className="text-xs text-slate-500">Curriculum Loaded</span>
            </div>

            <div className="mt-3 w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-brand-red via-brand-blue to-emerald-500 h-3 rounded-full"
                style={{ width: `${totalQuestions > 0 ? 88 : 50}%` }}
              />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center text-xs">
              <div>
                <p className="text-slate-400 font-medium text-3xs uppercase">Subjects</p>
                <p className="font-bold text-slate-900">{activeSubjects} Active</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium text-3xs uppercase">Question Bank</p>
                <p className="font-bold text-slate-900">{totalQuestions} Qs</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium text-3xs uppercase">Mock Series</p>
                <p className="font-bold text-slate-900">{publishedMocks} Papers</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-600 flex items-center justify-between">
            <span>Ready for your daily practice session?</span>
            <Button
              size="sm"
              onClick={() => onTabChange("dpp")}
              className="rounded-full bg-brand-red text-xs font-semibold text-white hover:bg-brand-red-hover"
            >
              Start DPP
            </Button>
          </div>
        </section>

        {/* 7-Day Consistency & Habit Tracker */}
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
                <span>5 Day Streak</span>
              </span>
            </div>

            <div className="mt-6 flex items-center justify-between gap-2">
              {[
                { day: "Mon", status: "done" },
                { day: "Tue", status: "done" },
                { day: "Wed", status: "done" },
                { day: "Thu", status: "done" },
                { day: "Fri", status: "done" },
                { day: "Sat", status: "today" },
                { day: "Sun", status: "upcoming" },
              ].map((item, idx) => (
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
            <span>Target: 25 questions per day</span>
            <span className="font-semibold text-emerald-600">On Track</span>
          </div>
        </section>
      </div>

      {/* Question Bank Subject Distribution */}
      {subjectDistribution.length > 0 && (
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
            {subjectDistribution.map((item, idx) => {
              const bgColors = [
                "bg-sky-500",
                "bg-purple-500",
                "bg-emerald-500",
                "bg-amber-500",
                "bg-rose-500",
              ];
              const color = bgColors[idx % bgColors.length];
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
            {subjectDistribution.map((item, idx) => {
              const dotColors = [
                "bg-sky-500",
                "bg-purple-500",
                "bg-emerald-500",
                "bg-amber-500",
                "bg-rose-500",
              ];
              const dot = dotColors[idx % dotColors.length];
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
      )}

      {/* Online Assessment Engine Analytics Notice */}
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
            className="rounded-full bg-brand-blue text-xs font-semibold text-white hover:bg-brand-blue-hover"
          >
            Review Available Mock Papers →
          </Button>
        </div>
      </section>
    </div>
  );
}
