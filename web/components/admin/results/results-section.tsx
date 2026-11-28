"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Atom,
  Dna,
  FileSpreadsheet,
  FlaskConical,
  GraduationCap,
  LoaderCircle,
  Printer,
  RefreshCw,
  Search,
  TrendingUp,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/components/admin/admin-api";
import { TablePagination } from "@/components/admin/admin-helpers";
import { AdminWorkspaceContentSkeleton } from "@/components/skeletons/admin/admin-content-skeleton";
import type { ResultsOverview } from "@/lib/results-store";

interface ResultsSectionProps {
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}

export function ResultsSection({ onNotice, onError }: ResultsSectionProps) {
  const [data, setData] = useState<ResultsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "INTERNAL" | "EXTERNAL">("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Reset page on search or category filter change
  const filterKey = `${searchQuery}|${categoryFilter}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const loadData = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    try {
      const payload = await api<ResultsOverview>("results");
      setData(payload);
    } catch {
      onError("Failed to load results and performance analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onError]);

  useEffect(() => {
    let active = true;
    api<ResultsOverview>("results")
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch(() => {
        if (active) onError("Failed to load results and performance analytics");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onError]);

  const handleExportExcel = async () => {
    if (!data || exporting) return;
    setExporting(true);
    try {
      const { default: ExcelJS } = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      wb.creator = "I-SHARP Academy";
      const ws = wb.addWorksheet("NEET Results Leaderboard");

      ws.addRow([
        "Rank",
        "Student ID",
        "Student Name",
        "Category",
        "Test Paper",
        "Score",
        "Total Marks",
        "Percentage",
        "Accuracy %",
        "Percentile",
        "Physics Score",
        "Chemistry Score",
        "Biology Score",
        "Submitted At",
      ]);

      data.leaderboard.forEach((row) => {
        ws.addRow([
          row.rank,
          row.studentId,
          row.studentName,
          row.category,
          row.testName,
          row.score,
          row.totalMarks,
          `${row.percentage}%`,
          `${row.accuracy}%`,
          row.percentile,
          row.physicsScore,
          row.chemistryScore,
          row.biologyScore,
          row.submittedAt,
        ]);
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `isharp-neet-results-leaderboard-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onNotice("Results exported to Excel successfully");
    } catch {
      onError("Failed to export results");
    } finally {
      setExporting(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const filteredLeaderboard = useMemo(() => {
    const rows = data?.leaderboard || [];
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((item) => {
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) {
        return false;
      }
      if (q) {
        return (
          item.studentName.toLowerCase().includes(q) ||
          item.studentId.toLowerCase().includes(q) ||
          item.testName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data?.leaderboard, categoryFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredLeaderboard.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedLeaderboard = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeaderboard.slice(start, start + pageSize);
  }, [filteredLeaderboard, currentPage, pageSize]);

  // Prevent flashing fake or empty data while initial fetch is pending
  if (loading && !data) {
    return <AdminWorkspaceContentSkeleton section="results" />;
  }

  const isFiltered = Boolean(searchQuery.trim() || categoryFilter !== "ALL");

  return (
    <div className="space-y-6">
      {/* Actions & Global Summary Statistics */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-3xs font-semibold uppercase tracking-wider text-brand-blue">
              Performance &amp; Rankings
            </p>
            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Results &amp; Analytics
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Scorecards, percentiles, subject accuracy &amp; student leaderboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={refreshing}
              onClick={() => void loadData(true)}
              className="gap-1.5 rounded-full border-slate-200 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition shadow-2xs"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Sync</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={exporting}
              onClick={handleExportExcel}
              className="gap-1.5 rounded-full border-slate-200 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition shadow-2xs"
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
              onClick={handlePrintReport}
              className="gap-1.5 rounded-full border-slate-200 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition shadow-2xs"
            >
              <Printer className="size-3.5 text-slate-600" />
              <span>Print / PDF</span>
            </Button>
          </div>
        </div>

        {/* Global Summary Statistics - Themed White Luxury Metric Cards */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Attempts */}
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
            <p className="text-xs font-medium text-slate-500">Valid CBT test submissions</p>
          </div>

          {/* Card 2: Average Score */}
          <div className="group relative flex flex-col justify-between gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition duration-200 hover:border-emerald-200 hover:shadow-card sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Academy Average Score
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
                  {data?.averageMarks ?? 0}{" "}
                  <span className="text-sm font-normal text-slate-400">/ 720</span>
                </p>
              </div>
              <div className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="size-4.5" />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500">
              Overall Accuracy:{" "}
              <span className="font-semibold text-emerald-700">{data?.overallAccuracy ?? 0}%</span>
            </p>
          </div>

          {/* Card 3: Highest Score */}
          <div className="group relative flex flex-col justify-between gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition duration-200 hover:border-amber-200 hover:shadow-card sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Highest Score Benchmark
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
                  {data?.highestMarks ?? 0}{" "}
                  <span className="text-sm font-normal text-slate-400">/ 720</span>
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

          {/* Card 4: Pass / Qualification Rate */}
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
            <p className="text-xs font-medium text-slate-500">Scoring ≥ 50% cutoff marks</p>
          </div>
        </div>
      </section>

      {/* Subject-Wise Performance Breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Physics */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-blue-200 hover:shadow-card">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200/60 bg-blue-50 px-2 py-0.5 text-xs font-bold uppercase text-blue-700">
              <Atom className="size-3.5" />
              <span>Physics</span>
            </span>
            <span className="text-xs font-semibold text-slate-400">Max 180</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-slate-900">
                {data?.subjectPerformance?.physics?.averageScore ?? 0}
              </span>
              <span className="text-xs font-normal text-slate-400"> / 180</span>
            </div>
            <span className="text-xs font-semibold text-blue-700">
              {data?.subjectPerformance?.physics?.accuracy ?? 0}% Acc
            </span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, data?.subjectPerformance?.physics?.accuracy ?? 0)
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Chemistry */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-emerald-200 hover:shadow-card">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-xs font-bold uppercase text-emerald-700">
              <FlaskConical className="size-3.5" />
              <span>Chemistry</span>
            </span>
            <span className="text-xs font-semibold text-slate-400">Max 180</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-slate-900">
                {data?.subjectPerformance?.chemistry?.averageScore ?? 0}
              </span>
              <span className="text-xs font-normal text-slate-400"> / 180</span>
            </div>
            <span className="text-xs font-semibold text-emerald-700">
              {data?.subjectPerformance?.chemistry?.accuracy ?? 0}% Acc
            </span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, data?.subjectPerformance?.chemistry?.accuracy ?? 0)
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Biology */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-rose-200 hover:shadow-card">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200/60 bg-rose-50 px-2 py-0.5 text-xs font-bold uppercase text-rose-700">
              <Dna className="size-3.5" />
              <span>Biology</span>
            </span>
            <span className="text-xs font-semibold text-slate-400">Max 360</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-slate-900">
                {data?.subjectPerformance?.biology?.averageScore ?? 0}
              </span>
              <span className="text-xs font-normal text-slate-400"> / 360</span>
            </div>
            <span className="text-xs font-semibold text-rose-700">
              {data?.subjectPerformance?.biology?.accuracy ?? 0}% Acc
            </span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-red transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, data?.subjectPerformance?.biology?.accuracy ?? 0)
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Student Rankings / Leaderboard Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="border-b border-slate-200 bg-[#fbfbfa] p-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="size-4.5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Student Leaderboard & Rank Registry
                </h3>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Official NTA scoring (+4 / -1), percentage, and percentile rankings
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white p-1 text-xs shadow-2xs">
                {(["ALL", "INTERNAL", "EXTERNAL"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded-lg px-3 py-1 font-semibold transition ${
                      categoryFilter === cat
                        ? "bg-brand-blue text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {cat === "ALL" ? "All Cohorts" : cat}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or ID..."
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-900 outline-none transition placeholder-slate-400 focus:border-brand-blue focus:ring-2 focus:ring-blue-100/60"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition focus:outline-none"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Rank</th>
                <th className="px-5 py-3.5">Student ID & Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Test Paper</th>
                <th className="px-5 py-3.5">Total Score</th>
                <th className="px-5 py-3.5">Accuracy</th>
                <th className="px-5 py-3.5">Correct / Inc</th>
                <th className="px-5 py-3.5">Subject Breakdown</th>
                <th className="px-5 py-3.5 text-right">Percentile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLeaderboard.map((row) => {
                const rankTone =
                  row.rank === 1
                    ? "bg-amber-400 text-white shadow-2xs"
                    : row.rank === 2
                    ? "bg-slate-300 text-slate-800 shadow-2xs"
                    : row.rank === 3
                    ? "bg-amber-700 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 font-semibold";

                return (
                  <tr key={row.studentId} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <span className={`grid size-7 place-items-center rounded-full text-xs font-bold ${rankTone}`}>
                        {row.rank}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <span className="font-bold text-slate-900">{row.studentName}</span>
                        <p className="font-mono text-3xs text-slate-400">{row.studentId}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-3xs font-bold ${
                          row.category === "INTERNAL"
                            ? "bg-blue-50 text-blue-700 border border-blue-200/70"
                            : "bg-purple-50 text-purple-700 border border-purple-200/70"
                        }`}
                      >
                        {row.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium max-w-[200px] truncate">
                      {row.testName}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-extrabold text-slate-900">{row.score}</span>
                      <span className="text-3xs text-slate-400 font-normal"> / {row.totalMarks}</span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {row.accuracy}%
                    </td>
                    <td className="px-5 py-3.5 text-3xs font-mono">
                      <span className="text-emerald-700 font-bold">+{row.correctCount}</span> /{" "}
                      <span className="text-rose-600 font-bold">-{row.incorrectCount}</span>
                    </td>
                    <td className="px-5 py-3.5 text-3xs text-slate-600">
                      P: {row.physicsScore} · C: {row.chemistryScore} · B: {row.biologyScore}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-3xs font-bold text-emerald-800 border border-emerald-200/80">
                        {row.percentile} %ile
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredLeaderboard.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                        <Trophy className="size-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        No Leaderboard Records Found
                      </h4>
                      <p className="max-w-xs text-xs text-slate-500">
                        {isFiltered
                          ? "No leaderboard records match your current search query or filter."
                          : "No valid CBT test submissions have been evaluated yet."}
                      </p>
                      {isFiltered && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setCategoryFilter("ALL");
                          }}
                          className="mt-2 text-xs font-semibold text-brand-blue hover:text-brand-blue-hover underline cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Leaderboard Pagination Footer */}
        {filteredLeaderboard.length > 0 && (
          <div className="border-t border-slate-200 bg-[#fbfbfa] px-5 py-3.5">
            <TablePagination
              page={currentPage}
              pageSize={pageSize}
              totalItems={filteredLeaderboard.length}
              onPageChange={setPage}
            />
          </div>
        )}
      </section>

      {/* Chapter-wise Accuracy & High Yield Insights (if available) */}
      {data?.chapterInsights && data.chapterInsights.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Chapter-Wise Accuracy & High-Yield Analysis
            </h3>
            <p className="text-xs text-slate-500">
              Identifies which syllabus chapters students find most challenging
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.chapterInsights.map((ch) => (
              <div key={ch.chapterTitle} className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between text-3xs font-bold uppercase tracking-wider text-slate-500">
                  <span>{ch.subject}</span>
                  <span className="font-semibold text-slate-400">{ch.totalQuestionsAnswered} answered</span>
                </div>
                <h4 className="mt-1 text-xs font-bold text-slate-900 line-clamp-1">
                  {ch.chapterTitle}
                </h4>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Student Accuracy:</span>
                  <span className="font-bold text-emerald-700">{ch.accuracyPercentage}%</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Mistake Rate:</span>
                  <span className="font-bold text-rose-600">{ch.commonMistakeRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
