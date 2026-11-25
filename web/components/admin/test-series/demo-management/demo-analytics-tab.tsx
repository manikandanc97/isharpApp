"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { request } from "@/components/question-bank/helpers";
import type { DemoAnalyticsData } from "./demo-admin.types";

interface Props {
  onError: (msg: string) => void;
}

export function DemoAnalyticsTab({ onError }: Props) {
  const [data, setData] = useState<DemoAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("ALL_FILTER");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (subject !== "ALL_FILTER") params.set("subject", subject);
      const res = await request<DemoAnalyticsData>(
        `demo-test/analytics?${params.toString()}`,
      );
      setData(res);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to load demo analytics");
    } finally {
      setLoading(false);
    }
  }, [from, to, subject, onError]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <section className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid gap-1">
            <span className="text-3xs font-semibold text-slate-500">From Date</span>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-8 rounded-xl border-slate-300 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <span className="text-3xs font-semibold text-slate-500">To Date</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-8 rounded-xl border-slate-300 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <span className="text-3xs font-semibold text-slate-500">Subject Filter</span>
            <Select
              value={subject}
              onValueChange={(v) => {
                if (v) setSubject(v);
              }}
            >
              <SelectTrigger className="h-8 w-40 rounded-xl border-slate-300 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_FILTER">All Modes</SelectItem>
                <SelectItem value="ALL">All 3 Subjects</SelectItem>
                <SelectItem value="PHYSICS">Physics</SelectItem>
                <SelectItem value="CHEMISTRY">Chemistry</SelectItem>
                <SelectItem value="BIOLOGY">Biology</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => void load()}
          className="gap-1.5 rounded-full text-xs"
        >
          <RefreshCw className="size-3.5" /> Refresh
        </Button>
      </section>

      {loading || !data ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-xs text-slate-500">
          <LoaderCircle className="mx-auto mb-2 size-5 animate-spin text-indigo-600" />
          Loading real-time demo analytics...
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatBox label="Total Visitors" value={data.totalVisitors} sub={`${data.uniqueVisitors} active in period`} />
            <StatBox label="Total Attempts" value={data.totalAttempts} sub={`${data.completedAttempts} completed · ${data.abandonedAttempts} abandoned`} />
            <StatBox label="Completion Rate" value={`${data.completionRate}%`} sub={`Avg time: ${data.averageCompletionSeconds}s`} />
            <StatBox label="Average Score" value={data.averageScore} sub={`Repeat visitor rate: ${data.repeatVisitorRate}%`} />
            <StatBox label="Unique Qs Delivered" value={data.uniqueQuestionsDelivered} sub={`${data.repeatAttempts} repeat attempts`} />
            <StatBox label="Controlled Reuse" value={`${data.controlledReuseRate}%`} sub={`${data.controlledReuseCount} reuse attempts`} />
            <StatBox label="Avg Paper Overlap" value={`${data.averagePaperOverlap}%`} sub={`Identical paper rate: ${data.identicalPaperRate}%`} />
            <StatBox label="CTA Conversions" value={data.ctaConversions} sub={`${data.poolExhaustionEvents} exhaustion events`} />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <DistributionCard title="Subject Popularity" map={data.subjectPopularity} />
            <DistributionCard title="Language Popularity" map={data.languagePopularity} />
            <DistributionCard title="Blueprint Popularity" map={data.blueprintPopularity} />
          </div>
        </>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-0.5 text-3xs text-slate-500">{sub}</p>
    </div>
  );
}

function DistributionCard({
  title,
  map,
}: {
  title: string;
  map: Record<string, number>;
}) {
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center gap-2">
        <BarChart3 className="size-4 text-indigo-600" />
        <h4 className="text-xs font-bold text-slate-900">{title}</h4>
      </div>
      <div className="mt-3 space-y-2.5">
        {entries.length === 0 ? (
          <p className="text-xs text-slate-400">No attempt data in this range.</p>
        ) : (
          entries.map(([key, count]) => {
            const pct = Math.round((count / total) * 100);
            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">{key}</span>
                  <span className="font-bold text-slate-900">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
