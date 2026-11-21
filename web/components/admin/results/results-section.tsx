"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/admin/admin-helpers";
import type { ResultsOverview } from "@/lib/results-store";
import ExcelJS from "exceljs";

interface ResultsSectionProps {
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}

export function ResultsSection({ onNotice, onError }: ResultsSectionProps) {
  const [data, setData] = useState<ResultsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "INTERNAL" | "EXTERNAL">("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Reset page on search or category filter change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, categoryFilter]);

  const loadData = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/admin/results", { cache: "no-store" });
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      }
    } catch {
      onError("Failed to load results and performance analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleExportExcel = async () => {
    if (!data) return;
    try {
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
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const filteredLeaderboard = (data?.leaderboard || []).filter((item) => {
    if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.studentName.toLowerCase().includes(q) ||
        item.studentId.toLowerCase().includes(q) ||
        item.testName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLeaderboard.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedLeaderboard = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeaderboard.slice(start, start + pageSize);
  }, [filteredLeaderboard, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700">
              <BarChart3 className="size-4" /> Academic Performance & CBT Analytics
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Results & Scorecard Analytics
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Comprehensive NTA NEET performance benchmarking, All-India rank percentiles, and subject-wise accuracy tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={refreshing}
              onClick={() => void loadData(true)}
              className="gap-1.5 rounded-full"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Sync</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="gap-1.5 rounded-full"
            >
              <FileSpreadsheet className="size-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintReport}
              className="gap-1.5 rounded-full"
            >
              <Printer className="size-3.5 text-slate-600" />
              <span>Print / PDF</span>
            </Button>
          </div>
        </div>

        {/* Global Summary Statistics */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
            <span className="text-3xs font-semibold uppercase tracking-wider text-indigo-700">
              Total Attempts Evaluated
            </span>
            <p className="mt-2 text-3xl font-extrabold text-indigo-950">
              {data?.totalAttempts ?? 0}
            </p>
            <p className="mt-0.5 text-3xs text-indigo-800 font-medium">Valid CBT test submissions</p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <span className="text-3xs font-semibold uppercase tracking-wider text-emerald-700">
              Academy Average Score
            </span>
            <p className="mt-2 text-3xl font-extrabold text-emerald-950">
              {data?.averageMarks ?? 0} <span className="text-sm font-normal text-emerald-700">/ 720</span>
            </p>
            <p className="mt-0.5 text-3xs text-emerald-800 font-medium">
              Overall Accuracy: {data?.overallAccuracy ?? 0}%
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <span className="text-3xs font-semibold uppercase tracking-wider text-amber-700">
              Highest Score Benchmark
            </span>
            <p className="mt-2 text-3xl font-extrabold text-amber-950">
              {data?.highestMarks ?? 0} <span className="text-sm font-normal text-amber-700">/ 720</span>
            </p>
            <p className="mt-0.5 text-3xs text-amber-800 font-medium">Rank 1: 99.8th percentile</p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <span className="text-3xs font-semibold uppercase tracking-wider text-blue-700">
              Pass / Qualification Rate
            </span>
            <p className="mt-2 text-3xl font-extrabold text-blue-950">
              {data?.passPercentage ?? 0}%
            </p>
            <p className="mt-0.5 text-3xs text-blue-800 font-medium">Scoring ≥ 50% cutoff marks</p>
          </div>
        </div>
      </section>

      {/* Subject-Wise Performance Breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 uppercase">
              Physics
            </span>
            <span className="text-xs font-semibold text-slate-500">Max 180</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900">
              {data?.subjectPerformance.physics.averageScore ?? 156}
            </p>
            <span className="text-xs font-semibold text-blue-700">
              {data?.subjectPerformance.physics.accuracy ?? 86.6}% Acc
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${data?.subjectPerformance.physics.accuracy ?? 86.6}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 uppercase">
              Chemistry
            </span>
            <span className="text-xs font-semibold text-slate-500">Max 180</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900">
              {data?.subjectPerformance.chemistry.averageScore ?? 160}
            </p>
            <span className="text-xs font-semibold text-emerald-700">
              {data?.subjectPerformance.chemistry.accuracy ?? 88.8}% Acc
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-600"
              style={{ width: `${data?.subjectPerformance.chemistry.accuracy ?? 88.8}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 uppercase">
              Biology
            </span>
            <span className="text-xs font-semibold text-slate-500">Max 360</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900">
              {data?.subjectPerformance.biology.averageScore ?? 325}
            </p>
            <span className="text-xs font-semibold text-rose-700">
              {data?.subjectPerformance.biology.accuracy ?? 90.2}% Acc
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-rose-600"
              style={{ width: `${data?.subjectPerformance.biology.accuracy ?? 90.2}%` }}
            />
          </div>
        </div>
      </div>

      {/* Student Rankings / Leaderboard Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-200 bg-[#fbfbfa] p-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Student Leaderboard & Rank Registry
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Official NTA scoring (+4 / -1), percentage, and percentile rankings
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs">
                {(["ALL", "INTERNAL", "EXTERNAL"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded px-2.5 py-1 font-semibold transition ${
                      categoryFilter === cat ? "bg-brand-blue text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {cat === "ALL" ? "All Cohorts" : cat}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or ID..."
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs outline-none focus:border-indigo-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition focus:outline-none"
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
            <thead className="border-b border-slate-200 bg-slate-50 text-3xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Student ID & Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Test Paper</th>
                <th className="px-5 py-3">Total Score</th>
                <th className="px-5 py-3">Accuracy</th>
                <th className="px-5 py-3">Correct / Inc</th>
                <th className="px-5 py-3">Subject Breakdown</th>
                <th className="px-5 py-3 text-right">Percentile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLeaderboard.map((row) => {
                const rankTone =
                  row.rank === 1
                    ? "bg-amber-400 text-white"
                    : row.rank === 2
                    ? "bg-slate-300 text-slate-800"
                    : row.rank === 3
                    ? "bg-amber-700 text-white"
                    : "bg-slate-100 text-slate-600";

                return (
                  <tr key={row.studentId} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <span className={`grid size-7 place-items-center rounded-full text-xs font-extrabold ${rankTone}`}>
                        {row.rank}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <span className="font-bold text-slate-900">{row.studentName}</span>
                        <p className="font-mono text-3xs text-indigo-700">{row.studentId}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-3xs font-bold ${
                          row.category === "INTERNAL"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {row.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium max-w-[200px] truncate">
                      {row.testName}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-extrabold text-emerald-700">{row.score}</span>
                      <span className="text-3xs text-slate-400"> / {row.totalMarks}</span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {row.accuracy}%
                    </td>
                    <td className="px-5 py-3.5 text-3xs text-slate-500 font-mono">
                      <span className="text-emerald-700 font-bold">+{row.correctCount}</span> /{" "}
                      <span className="text-rose-600 font-bold">-{row.incorrectCount}</span>
                    </td>
                    <td className="px-5 py-3.5 text-3xs text-slate-600">
                      P: {row.physicsScore} · C: {row.chemistryScore} · B: {row.biologyScore}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-3xs font-bold text-emerald-800 border border-emerald-200">
                        {row.percentile} %ile
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredLeaderboard.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-500">
                    No leaderboard records found matching this filter.
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

      {/* Chapter-wise Accuracy & High Yield Insights */}
      {data?.chapterInsights && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
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
              <div key={ch.chapterTitle} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
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
