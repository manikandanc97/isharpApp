"use client";

import { CheckCircle2, Clock, FileCheck, Layers } from "lucide-react";
import type { TestSeriesOverviewStats } from "./types";

interface TestSeriesOverviewProps {
  stats: TestSeriesOverviewStats;
}

export function TestSeriesOverview({ stats }: TestSeriesOverviewProps) {
  const cards = [
    {
      title: "Total Test Series",
      value: stats.totalSeries,
      subtext: "Across Class 11, 12 & Repeater",
      icon: Layers,
      color: "text-brand-blue",
      bgColor: "bg-blue-50 border-blue-200/80",
    },
    {
      title: "Total Tests",
      value: stats.totalTests,
      subtext: "Chapter, subject & grand papers",
      icon: FileCheck,
      color: "text-purple-700",
      bgColor: "bg-purple-50 border-purple-200/80",
    },
    {
      title: "Upcoming Tests",
      value: stats.upcomingTests,
      subtext: "Scheduled for future dates",
      icon: Clock,
      color: "text-amber-700",
      bgColor: "bg-amber-50 border-amber-200/80",
    },
    {
      title: "Completed Tests",
      value: stats.completedTests,
      subtext: "Past examination window",
      icon: CheckCircle2,
      color: "text-emerald-700",
      bgColor: "bg-emerald-50 border-emerald-200/80",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.title}
            className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:shadow-card"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">
                {c.title}
              </span>
              <div className={`grid size-7 place-items-center rounded-lg border ${c.bgColor} ${c.color}`}>
                <Icon className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-slate-900">{c.value}</p>
              <p className="mt-0.5 truncate text-3xs text-slate-500">{c.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
