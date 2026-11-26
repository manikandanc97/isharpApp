"use client";

import { Clock, Timer, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatSecondsOrMinutes, formatTime } from "./demo-test-calculator";
import type { ScorecardReport } from "./demo-test.types";

export interface ScorecardSubjectGridProps {
  report: ScorecardReport;
}

export function ScorecardSubjectGrid({ report }: ScorecardSubjectGridProps) {
  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
      {/* 01. Subject-Wise Breakdown */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Subject Diagnostic Calibrations
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {report.subjectStats.map((sub) => (
            <div
              key={sub.subjectCode}
              className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{sub.subjectName}</span>
                <span className="text-xs font-extrabold text-brand-red">
                  {sub.marksObtained}{" "}
                  <span className="text-2xs font-normal text-slate-400">/ {sub.maxMarks}</span>
                </span>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-2xs text-slate-500">
                <span className="text-emerald-700 font-semibold">{sub.correct} Correct</span>
                <span className="text-rose-600 font-semibold">{sub.wrong} Wrong</span>
                <span className="text-slate-400">{sub.skipped} Skipped</span>
                {sub.timeSpentSeconds !== undefined && (
                  <span className="font-mono text-slate-600 font-bold">
                    ⏱️ {formatTime(sub.timeSpentSeconds)}
                  </span>
                )}
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-brand-red rounded-full transition-all"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, (sub.correct / Math.max(1, sub.total)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 02. Time & Speed Management Diagnostic */}
      {report.timeAnalytics && (
        <div className="border-t border-slate-100 pt-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Timer className="size-4 text-brand-blue" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                நேர மேலாண்மை பகுப்பாய்வு (Time &amp; Speed Management Diagnostic)
              </h3>
            </div>
            <Badge
              variant="outline"
              className={`text-2xs font-bold uppercase ${
                report.timeAnalytics.paceCategory === "OPTIMAL"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : report.timeAnalytics.paceCategory === "SPEEDY"
                    ? "bg-blue-50 text-brand-blue border-blue-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              Pace Rating: {report.timeAnalytics.paceCategory}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Avg Time / Q */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-1">
              <span className="text-2xs font-semibold text-slate-400 uppercase">Avg Time / Q</span>
              <p className="text-xl font-black text-slate-900">
                {report.timeAnalytics.avgTimePerQuestion}s
              </p>
              <p className="text-2xs text-slate-500">Official NEET benchmark: ~60s</p>
            </div>

            {/* Time on Correct Qs */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 space-y-1">
              <span className="text-2xs font-semibold text-emerald-700 uppercase">
                On Correct Qs
              </span>
              <p className="text-xl font-black text-emerald-800">
                {report.timeAnalytics.avgTimeCorrect}s
              </p>
              <p className="text-2xs text-emerald-600">Quick concept recall</p>
            </div>

            {/* Time on Wrong Qs */}
            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3.5 space-y-1">
              <span className="text-2xs font-semibold text-rose-700 uppercase">On Wrong Qs</span>
              <p className="text-xl font-black text-rose-800">
                {report.timeAnalytics.avgTimeWrong}s
              </p>
              <p className="text-2xs text-rose-600">Negative mark time trap</p>
            </div>

            {/* Time on Skipped Qs */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-1">
              <span className="text-2xs font-semibold text-slate-500 uppercase">
                On Skipped Qs
              </span>
              <p className="text-xl font-black text-slate-700">
                {report.timeAnalytics.avgTimeSkipped}s
              </p>
              <p className="text-2xs text-slate-500">Fast elimination speed</p>
            </div>
          </div>

          {/* Fastest vs Slowest Highlights */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 border border-slate-200/80 px-4 py-2.5 text-2xs text-slate-600">
            <div className="flex items-center gap-2">
              <Zap className="size-3.5 text-amber-500" />
              <span>
                {report.timeAnalytics.fastestQuestion ? (
                  <>
                    Fastest response:{" "}
                    <strong>Question {report.timeAnalytics.fastestQuestion.index + 1}</strong> in{" "}
                    <strong className="text-slate-900">
                      {report.timeAnalytics.fastestQuestion.seconds}s
                    </strong>{" "}
                    ({report.timeAnalytics.fastestQuestion.isCorrect ? "Correct" : "Incorrect"})
                  </>
                ) : (
                  "No attempted questions timed."
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 text-slate-400" />
              <span>
                {report.timeAnalytics.slowestQuestion ? (
                  <>
                    Longest dwell time:{" "}
                    <strong>Question {report.timeAnalytics.slowestQuestion.index + 1}</strong> in{" "}
                    <strong className="text-slate-900">
                      {formatSecondsOrMinutes(report.timeAnalytics.slowestQuestion.seconds)}
                    </strong>
                  </>
                ) : (
                  "Continuous pace recorded."
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
