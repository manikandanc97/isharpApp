"use client";

import { Search, Trophy, X } from "lucide-react";
import { TablePagination } from "@/components/admin/admin-helpers";
import type { ResultsOverview } from "@/lib/results-store";

type LeaderboardEntry = ResultsOverview["leaderboard"][number];

interface ResultsLeaderboardTableProps {
  paginatedRows: LeaderboardEntry[];
  totalFilteredCount: number;
  page: number;
  pageSize: number;
  categoryFilter: "ALL" | "INTERNAL" | "EXTERNAL";
  searchQuery: string;
  onCategoryFilterChange: (cat: "ALL" | "INTERNAL" | "EXTERNAL") => void;
  onSearchQueryChange: (q: string) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
}

export function ResultsLeaderboardTable({
  paginatedRows,
  totalFilteredCount,
  page,
  pageSize,
  categoryFilter,
  searchQuery,
  onCategoryFilterChange,
  onSearchQueryChange,
  onPageChange,
  onClearFilters,
}: ResultsLeaderboardTableProps) {
  const isFiltered = Boolean(searchQuery.trim() || categoryFilter !== "ALL");

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="border-b border-slate-200 bg-[#fbfbfa] p-5 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="size-4.5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">
                Student Leaderboard &amp; Rank Registry
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Official NTA scoring (+4 / -1), percentage, and percentile
              rankings
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white p-1 text-xs shadow-2xs">
              {(["ALL", "INTERNAL", "EXTERNAL"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onCategoryFilterChange(cat)}
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

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Search student or ID..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-blue-100/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchQueryChange("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
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
              <th className="px-5 py-3.5">Student ID &amp; Name</th>
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
            {paginatedRows.map((row) => {
              const rankTone =
                row.rank === 1
                  ? "bg-amber-400 text-white shadow-2xs"
                  : row.rank === 2
                    ? "bg-slate-300 text-slate-800 shadow-2xs"
                    : row.rank === 3
                      ? "bg-amber-700 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 font-semibold";

              return (
                <tr
                  key={row.studentId}
                  className="transition hover:bg-slate-50/70"
                >
                  <td className="px-5 py-3.5">
                    <span
                      className={`grid size-7 place-items-center rounded-full text-xs font-bold ${rankTone}`}
                    >
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div>
                      <span className="font-bold text-slate-900">
                        {row.studentName}
                      </span>
                      <p className="font-mono text-3xs text-slate-400">
                        {row.studentId}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-md px-2 py-0.5 text-3xs font-bold ${
                        row.category === "INTERNAL"
                          ? "border border-blue-200/70 bg-blue-50 text-blue-700"
                          : "border border-purple-200/70 bg-purple-50 text-purple-700"
                      }`}
                    >
                      {row.category}
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate px-5 py-3.5 font-medium text-slate-700">
                    {row.testName}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-extrabold text-slate-900">
                      {row.score}
                    </span>
                    <span className="text-3xs font-normal text-slate-400">
                      {" "}
                      / {row.totalMarks}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">
                    {row.accuracy}%
                  </td>
                  <td className="px-5 py-3.5 font-mono text-3xs">
                    <span className="font-bold text-emerald-700">
                      +{row.correctCount}
                    </span>{" "}
                    /{" "}
                    <span className="font-bold text-rose-600">
                      -{row.incorrectCount}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-3xs text-slate-600">
                    P: {row.physicsScore} · C: {row.chemistryScore} · B:{" "}
                    {row.biologyScore}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-3xs font-bold text-emerald-800">
                      {row.percentile} %ile
                    </span>
                  </td>
                </tr>
              );
            })}
            {totalFilteredCount === 0 && (
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
                        onClick={onClearFilters}
                        className="mt-2 cursor-pointer text-xs font-semibold text-brand-blue underline hover:text-brand-blue-hover"
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

      {totalFilteredCount > 0 && (
        <div className="border-t border-slate-200 bg-[#fbfbfa] px-5 py-3.5">
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalItems={totalFilteredCount}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </section>
  );
}
