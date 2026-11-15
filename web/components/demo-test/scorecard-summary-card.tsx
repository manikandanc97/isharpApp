"use client";

import { Award, CheckCircle2, Clock, Flame, RefreshCw, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTime } from "./demo-test-calculator";
import type { ScorecardReport } from "./demo-test.types";

export interface ScorecardSummaryCardProps {
  report: ScorecardReport;
  rankInfo: { label: string; color: string };
  onRetake: () => void;
  onClose: () => void;
}

export function ScorecardSummaryCard({
  report,
  rankInfo,
  onRetake,
  onClose,
}: ScorecardSummaryCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold"
            >
              <CheckCircle2 className="size-3.5 mr-1 text-emerald-600" />
              Assessment Finished
            </Badge>
            <Badge variant="outline" className={rankInfo.color}>
              {rankInfo.label}
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Demo Test Diagnostic Performance Report
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Evaluated strictly on authentic NTA bilingual marking rules (+4 for correct, -1 for wrong).
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Button
            variant="outline"
            onClick={onRetake}
            className="flex-1 sm:flex-initial rounded-full text-xs font-semibold text-slate-700 hover:text-brand-red border-slate-300"
          >
            <RefreshCw className="size-3.5 mr-1.5" />
            Retake with New Questions
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 sm:flex-initial rounded-full bg-brand-blue text-xs font-semibold text-white hover:bg-brand-blue-hover"
          >
            Back to Home
          </Button>
        </div>
      </div>

      {/* Score Metrics Strip */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-center">
          <Award className="mx-auto size-5 text-brand-red" />
          <p className="mt-1 text-xs font-medium text-slate-500">Total Score</p>
          <div className="mt-0.5 flex items-baseline justify-center gap-1">
            <span className="text-2xl font-black text-brand-red">{report.totalScore}</span>
            <span className="text-xs font-semibold text-slate-400">/ {report.maxScore}</span>
          </div>
          <p className="mt-0.5 text-2xs text-slate-500 font-medium">{report.percentage}% Marks</p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-center">
          <Target className="mx-auto size-5 text-emerald-600" />
          <p className="mt-1 text-xs font-medium text-slate-500">Accuracy Rate</p>
          <p className="mt-0.5 text-2xl font-black text-emerald-700">{report.accuracy}%</p>
          <p className="mt-0.5 text-2xs text-slate-500 font-medium">
            {report.correctCount} correct of {report.attempted} tried
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-center">
          <Clock className="mx-auto size-5 text-brand-blue" />
          <p className="mt-1 text-xs font-medium text-slate-500">Time Taken</p>
          <p className="mt-0.5 text-2xl font-black text-brand-blue">
            {formatTime(report.totalTimeSpentSeconds)}
          </p>
          <p className="mt-0.5 text-2xs text-slate-500 font-medium">
            Avg ~{Math.round(report.totalTimeSpentSeconds / Math.max(1, report.totalQuestions))}s / question
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-center">
          <Flame className="mx-auto size-5 text-amber-500" />
          <p className="mt-1 text-xs font-medium text-slate-500">Attempted Ratio</p>
          <div className="mt-0.5 flex items-baseline justify-center gap-1">
            <span className="text-2xl font-black text-slate-900">{report.attempted}</span>
            <span className="text-xs font-semibold text-slate-400">/ {report.totalQuestions}</span>
          </div>
          <p className="mt-0.5 text-2xs text-slate-500 font-medium">{report.skippedCount} skipped</p>
        </div>
      </div>
    </div>
  );
}
