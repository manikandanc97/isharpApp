"use client";

import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Database,
  Eye,
  Image as ImageIcon,
  Layers,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DemoTestConfiguration } from "@/components/demo-test/demo-test.types";
import type { DemoAnalyticsData, DemoPoolHealth } from "./demo-admin.types";

interface Props {
  config: DemoTestConfiguration;
  health: DemoPoolHealth | null;
  analytics: DemoAnalyticsData | null;
  onRefresh: () => void;
  onNavigateTab: (tab: string) => void;
}

export function DemoOverviewTab({
  config,
  health,
  analytics,
  onRefresh,
  onNavigateTab,
}: Props) {
  const riskBadge = {
    LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
    MODERATE: "border-amber-200 bg-amber-50 text-amber-700",
    HIGH: "border-orange-200 bg-orange-50 text-orange-700",
    CRITICAL: "border-rose-200 bg-rose-50 text-rose-700",
  }[health?.exhaustionRisk ?? "CRITICAL"];

  return (
    <div className="space-y-5">
      {/* Status Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                System &amp; Pool Health Status
              </h4>
              <Badge
                variant="outline"
                className={
                  config.publishStatus === "PUBLISHED" && config.isEnabled
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }
              >
                {config.publishStatus === "PUBLISHED" && config.isEnabled
                  ? "Live & Published"
                  : config.publishStatus === "UNPUBLISHED"
                    ? "Unpublished"
                    : "Disabled"}
              </Badge>
              {config.hasDraftChanges && (
                <Badge
                  variant="outline"
                  className="border-indigo-200 bg-indigo-50 text-indigo-700"
                >
                  Unpublished Draft Changes
                </Badge>
              )}
              {health && (
                <Badge variant="outline" className={riskBadge}>
                  Exhaustion Risk: {health.exhaustionRisk}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Pool Mode: <strong className="text-slate-700">{config.poolMode ?? "HYBRID"}</strong>{" "}
              · Estimated Fresh Attempts / Visitor:{" "}
              <strong className="text-slate-700">
                {health?.estimatedFreshAttemptsPerVisitor ?? 0}
              </strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="gap-1.5 rounded-full text-xs"
          >
            <RefreshCw className="size-3.5" /> Refresh Metrics
          </Button>
          <Button
            size="sm"
            onClick={() => onNavigateTab("pool")}
            className="gap-1.5 rounded-full bg-indigo-600 text-xs text-white hover:bg-indigo-700"
          >
            <Database className="size-3.5" /> Manage Pool
          </Button>
        </div>
      </div>

      {/* Warnings */}
      {health && health.warnings.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <AlertTriangle className="size-4 text-amber-600" />
            <span>Pool Capacity Warnings</span>
          </div>
          <ul className="list-inside list-disc space-y-1 text-xs text-amber-800">
            {health.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Database}
          label="Total Question Bank"
          value={health?.totalQuestionBank ?? 0}
          sub={`${health?.invalidOrDuplicate ?? 0} invalid/incomplete`}
          tone="slate"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Approved Demo Pool"
          value={health?.approvedPoolCount ?? 0}
          sub={`${health?.eligibleUniqueCount ?? 0} unique eligible`}
          tone="emerald"
        />
        <MetricCard
          icon={Users}
          label="Unique Demo Visitors"
          value={analytics?.uniqueVisitors ?? 0}
          sub={`${analytics?.totalAttempts ?? 0} total attempts`}
          tone="indigo"
        />
        <MetricCard
          icon={Activity}
          label="Repeat Attempts & Reuse"
          value={analytics?.repeatAttempts ?? 0}
          sub={`${analytics?.controlledReuseRate ?? 0}% reuse rate`}
          tone="amber"
        />
      </div>

      {/* Breakdown Cards */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-brand-red" />
            <h4 className="text-sm font-bold text-slate-900">
              Subject &amp; Difficulty Coverage (Unique Eligible)
            </h4>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
              <p className="text-2xs font-semibold uppercase text-slate-500">Physics</p>
              <p className="mt-1 text-xl font-black text-slate-900">
                {health?.bySubject.PHYSICS ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
              <p className="text-2xs font-semibold uppercase text-slate-500">Chemistry</p>
              <p className="mt-1 text-xl font-black text-slate-900">
                {health?.bySubject.CHEMISTRY ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
              <p className="text-2xs font-semibold uppercase text-slate-500">Biology</p>
              <p className="mt-1 text-xl font-black text-slate-900">
                {health?.bySubject.BIOLOGY ?? 0}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5 text-center">
              <p className="text-2xs font-semibold text-emerald-700">Easy</p>
              <p className="text-base font-bold text-emerald-900">
                {health?.byDifficulty.EASY ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-2.5 text-center">
              <p className="text-2xs font-semibold text-amber-700">Medium</p>
              <p className="text-base font-bold text-amber-900">
                {health?.byDifficulty.MEDIUM ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-2.5 text-center">
              <p className="text-2xs font-semibold text-rose-700">Hard</p>
              <p className="text-base font-bold text-rose-900">
                {health?.byDifficulty.HARD ?? 0}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-brand-blue" />
            <h4 className="text-sm font-bold text-slate-900">
              Language &amp; Media Readiness
            </h4>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <p className="text-2xs font-semibold text-slate-500">English Ready</p>
              <p className="mt-1 text-xl font-black text-slate-900">
                {health?.englishReady ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <p className="text-2xs font-semibold text-slate-500">Bilingual (TA+EN)</p>
              <p className="mt-1 text-xl font-black text-brand-blue">
                {health?.bilingualReady ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <p className="flex items-center gap-1 text-2xs font-semibold text-slate-500">
                <ImageIcon className="size-3" /> Image-Based
              </p>
              <p className="mt-1 text-xl font-black text-slate-900">
                {health?.imageBased ?? 0}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <Eye className="size-3.5 text-slate-400" />
              Unique Questions Delivered:{" "}
              <strong className="text-slate-900">
                {analytics?.uniqueQuestionsDelivered ?? 0}
              </strong>
            </span>
            <span>
              Completion Rate:{" "}
              <strong className="text-slate-900">
                {analytics?.completionRate ?? 0}%
              </strong>
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sub: string;
  tone: "slate" | "emerald" | "indigo" | "amber";
}) {
  const iconTone = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <span className={`grid size-8 place-items-center rounded-lg ${iconTone}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-0.5 text-2xs text-slate-500">{sub}</p>
    </div>
  );
}
