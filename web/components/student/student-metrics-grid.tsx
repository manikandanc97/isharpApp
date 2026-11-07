"use client";

import { Award, ShieldCheck, Target, TrendingUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StudentMetricsGridProps {
  solvedCount: number;
  isInternal: boolean;
  studentIdDisplay: string;
}

export function StudentMetricsGrid({
  solvedCount,
  isInternal,
  studentIdDisplay,
}: StudentMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Metric 1: DPP Drills */}
      <div className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-2xs font-semibold uppercase tracking-wide text-slate-500">
            Daily DPP Drills
          </span>
          <div className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-brand-red">
            <Zap className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="type-metric text-slate-900">
            {solvedCount} / 15
          </span>
          <span className="text-xs font-semibold text-emerald-600">
            80% Solved
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-red to-rose-400 transition-all duration-500"
            style={{ width: `${(solvedCount / 15) * 100}%` }}
          />
        </div>
        <p className="flex items-center justify-between text-3xs text-slate-500">
          <span>3 questions to keep streak</span>
          <span className="font-semibold text-slate-700">Ends 11:59 PM</span>
        </p>
      </div>

      {/* Metric 2: Estimated Score */}
      <div className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-2xs font-semibold uppercase tracking-wide text-slate-500">
            Simulated NTA Score
          </span>
          <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-brand-blue">
            <Award className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="type-metric text-slate-900">648</span>
          <span className="text-xs font-medium text-slate-500">/ 720</span>
          <Badge
            variant="outline"
            className="ml-auto text-3xs font-semibold border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            Top 2.5%
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 text-3xs font-semibold text-emerald-600">
          <TrendingUp className="size-3" />
          <span>+28 marks vs previous grand mock</span>
        </div>
        <p className="text-3xs text-slate-500">
          Calibrated against 2024–25 NTA criteria
        </p>
      </div>

      {/* Metric 3: Accuracy */}
      <div className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-2xs font-semibold uppercase tracking-wide text-slate-500">
            Accuracy Index
          </span>
          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Target className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="type-metric text-slate-900">88.5%</span>
          <span className="text-xs font-semibold text-slate-500">
            Target: 90%+
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: "88.5%" }}
          />
        </div>
        <p className="flex items-center justify-between text-3xs text-slate-500">
          <span>Negative Marks Minimized</span>
          <span className="font-semibold text-rose-600">-8 Marks</span>
        </p>
      </div>

      {/* Metric 4: Access Status */}
      <div className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-2xs font-semibold uppercase tracking-wide text-slate-500">
            Academy Status
          </span>
          <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <ShieldCheck className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="truncate text-lg font-semibold text-slate-900">
            {isInternal ? "Internal Scholar" : "Full Access Plan"}
          </span>
        </div>
        <p className="font-mono text-xs font-semibold text-brand-red">
          {studentIdDisplay}
        </p>
        <p className="flex items-center justify-between text-3xs text-slate-500">
          <span>Valid: Academic 2026</span>
          <span className="font-semibold text-emerald-700">Verified</span>
        </p>
      </div>
    </div>
  );
}

