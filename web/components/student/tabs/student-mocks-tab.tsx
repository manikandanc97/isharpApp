"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StudentMocksTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="type-section-title text-slate-900">
              720-Mark NTA Simulated Mock Tests
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Calibrated mock papers with exact NTA exam pattern, negative marking scheme, and bilingual support.
            </p>
          </div>
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-brand-blue font-semibold text-xs shrink-0">
            All India Percentile Calibrated
          </Badge>
        </div>

        <div className="mt-6 space-y-4">
          {[
            {
              code: "MOCK-NEET-04",
              title: "Grand Mock Test 04 (Full Syllabus)",
              status: "Live This Sunday 02:00 PM",
              duration: "180 Mins",
              marks: "720 Marks",
              action: "Register / Set Reminder",
              badge: "Upcoming Live",
              badgeColor: "bg-brand-red text-white",
            },
            {
              code: "MOCK-NEET-03",
              title: "Calibrated Mega Mock Test 03",
              status: "Completed (28 Oct 2026)",
              duration: "180 Mins",
              marks: "Score: 648 / 720",
              action: "View Detailed Analysis",
              badge: "Completed",
              badgeColor: "bg-emerald-100 text-emerald-800",
            },
            {
              code: "MOCK-NEET-02",
              title: "Sectional Speed Drill: Chemistry & Biology",
              status: "Completed (21 Oct 2026)",
              duration: "90 Mins",
              marks: "Score: 512 / 540",
              action: "View Analysis",
              badge: "Completed",
              badgeColor: "bg-emerald-100 text-emerald-800",
            },
          ].map((mock, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:border-slate-300 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-3xs font-semibold uppercase tracking-wide text-slate-400">
                    {mock.code}
                  </span>
                  <span className={cn("rounded-full px-2 py-0.5 text-3xs font-semibold", mock.badgeColor)}>
                    {mock.badge}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-900">{mock.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{mock.duration}</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">{mock.marks}</span>
                  <span>•</span>
                  <span>{mock.status}</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="rounded-full border-slate-300 text-xs font-semibold text-slate-800 hover:border-brand-red hover:text-brand-red shrink-0"
              >
                {mock.action}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

