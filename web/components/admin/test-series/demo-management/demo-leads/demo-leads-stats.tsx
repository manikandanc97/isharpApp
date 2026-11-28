"use client";

import type { DemoLeadStats } from "./demo-leads.types";

export function DemoLeadsStats({ stats }: { stats: DemoLeadStats | null }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <p className="text-xs font-semibold text-slate-500">Total Leads</p>
        <p className="mt-1.5 text-2xl font-bold text-slate-950">
          {stats?.totalLeads ?? 0}
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <p className="text-xs font-semibold text-slate-500">
          Today&apos;s Leads
        </p>
        <p className="mt-1.5 text-2xl font-bold text-indigo-700">
          {stats?.todayLeads ?? 0}
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <p className="text-xs font-semibold text-slate-500">Completed Tests</p>
        <p className="mt-1.5 text-2xl font-bold text-emerald-700">
          {stats?.completedTests ?? 0}
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <p className="text-xs font-semibold text-slate-500">
          Pending Follow-up
        </p>
        <p className="mt-1.5 text-2xl font-bold text-brand-red">
          {stats?.pendingFollowUp ?? 0}
        </p>
      </div>
    </div>
  );
}
