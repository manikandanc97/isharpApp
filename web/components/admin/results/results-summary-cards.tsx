"use client";

import {
  Atom,
  Dna,
  FileSpreadsheet,
  FlaskConical,
  GraduationCap,
  LoaderCircle,
  Printer,
  RefreshCw,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResultsOverview } from "@/lib/results-store";

interface ResultsSummaryCardsProps {
  data: ResultsOverview | null;
  refreshing: boolean;
  exporting: boolean;
  onRefresh: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
}

export function ResultsSummaryCards({
  data,
  refreshing,
  exporting,
  onRefresh,
  onExportExcel,
  onPrint,
}: ResultsSummaryCardsProps) {
  const subjects = [
    {
      label: "Physics",
      max: 180,
      stats: data?.subjectPerformance?.physics,
      Icon: Atom,
      hoverBorder: "hover:border-blue-200",
      badgeCls: "border-blue-200/60 bg-blue-50 text-blue-700",
      accCls: "text-blue-700",
      barCls: "bg-blue-600",
    },
    {
      label: "Chemistry",
      max: 180,
      stats: data?.subjectPerformance?.chemistry,
      Icon: FlaskConical,
      hoverBorder: "hover:border-emerald-200",
      badgeCls: "border-emerald-200/60 bg-emerald-50 text-emerald-700",
      accCls: "text-emerald-700",
      barCls: "bg-emerald-600",
    },
    {
      label: "Biology",
      max: 360,
      stats: data?.subjectPerformance?.biology,
      Icon: Dna,
      hoverBorder: "hover:border-rose-200",
      badgeCls: "border-rose-200/60 bg-rose-50 text-rose-700",
      accCls: "text-rose-700",
      barCls: "bg-brand-red",
    },
  ];

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-3xs font-semibold uppercase tracking-wider text-brand-blue">
              Performance &amp; Rankings
            </p>
            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Results &amp; Analytics
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Scorecards, percentiles, subject accuracy &amp; student
              leaderboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={refreshing}
              onClick={onRefresh}
              className="gap-1.5 rounded-full border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50"
            >
              <RefreshCw
                className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              <span>Sync</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={exporting}
              onClick={onExportExcel}
              className="gap-1.5 rounded-full border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50"
            >
              {exporting ? (
                <LoaderCircle className="size-3.5 animate-spin text-emerald-600" />
              ) : (
                <FileSpreadsheet className="size-3.5 text-emerald-600" />
              )}
              <span>{exporting ? "Exporting..." : "Export Excel"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onPrint}
              className="gap-1.5 rounded-full border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Printer className="size-3.5 text-slate-600" />
              <span>Print / PDF</span>
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative flex flex-col justify-between gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition duration-200 hover:border-blue-200 hover:shadow-card sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Total Attempts Evaluated
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
                  {data?.totalAttempts ?? 0}
                </p>
              </div>
              <div className="grid size-9 place-items-center rounded-xl bg-blue-50 text-brand-blue">
                <Users className="size-4.5" />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500">
              Valid CBT test submissions
            </p>
          </div>

          <div className="group relative flex flex-col justify-between gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition duration-200 hover:border-emerald-200 hover:shadow-card sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Academy Average Score
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
                  {data?.averageMarks ?? 0}{" "}
                  <span className="text-sm font-normal text-slate-400">
                    / 720
                  </span>
                </p>
              </div>
              <div className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="size-4.5" />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500">
              Overall Accuracy:{" "}
              <span className="font-semibold text-emerald-700">
                {data?.overallAccuracy ?? 0}%
              </span>
            </p>
          </div>

          <div className="group relative flex flex-col justify-between gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition duration-200 hover:border-amber-200 hover:shadow-card sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Highest Score Benchmark
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
                  {data?.highestMarks ?? 0}{" "}
                  <span className="text-sm font-normal text-slate-400">
                    / 720
                  </span>
                </p>
              </div>
              <div className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <Trophy className="size-4.5" />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500">
              {data && data.totalAttempts > 0 && data.leaderboard.length > 0
                ? `Rank 1: ${data.leaderboard[0].percentile}th percentile`
                : "No submissions evaluated"}
            </p>
          </div>

          <div className="group relative flex flex-col justify-between gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition duration-200 hover:border-rose-200 hover:shadow-card sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Pass / Qualification Rate
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
                  {data?.passPercentage ?? 0}%
                </p>
              </div>
              <div className="grid size-9 place-items-center rounded-xl bg-rose-50 text-brand-red">
                <GraduationCap className="size-4.5" />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500">
              Scoring ≥ 50% cutoff marks
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {subjects.map(({ label, max, stats, Icon, hoverBorder, badgeCls, accCls, barCls }) => {
          const acc = stats?.accuracy ?? 0;
          return (
            <div
              key={label}
              className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-card ${hoverBorder}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-bold uppercase ${badgeCls}`}
                >
                  <Icon className="size-3.5" />
                  <span>{label}</span>
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  Max {max}
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold text-slate-900">
                    {stats?.averageScore ?? 0}
                  </span>
                  <span className="text-xs font-normal text-slate-400">
                    {" "}
                    / {max}
                  </span>
                </div>
                <span className={`text-xs font-semibold ${accCls}`}>
                  {acc}% Acc
                </span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barCls}`}
                  style={{ width: `${Math.min(100, Math.max(0, acc))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
