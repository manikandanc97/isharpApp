"use client";

import { Download, Plus, Search, X } from "lucide-react";
import type { CurriculumChapter, CurriculumSubject } from "./curriculum-types";

interface ChapterTableHeaderProps {
  subject: CurriculumSubject;
  chapters: CurriculumChapter[];
  query: string;
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  onQueryChange: (q: string) => void;
  onStatusFilterChange: (f: "ALL" | "ACTIVE" | "INACTIVE") => void;
  onExportCSV: () => void;
  onOpenAddDialog: () => void;
}

export function ChapterTableHeader({
  subject,
  chapters,
  query,
  statusFilter,
  onQueryChange,
  onStatusFilterChange,
  onExportCSV,
  onOpenAddDialog,
}: ChapterTableHeaderProps) {
  return (
    <div className="border-b border-slate-200 bg-[#fbfbfa] p-5 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-indigo-700">
              {subject.code}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-medium text-slate-500">
              {chapters.length} Total Chapters
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-medium text-emerald-700">
              {chapters.filter((c) => c.isActive).length} Active
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            {subject.name} Chapters Directory
          </h2>
          <p className="line-clamp-1 text-xs text-slate-500">
            {subject.description ||
              `Manage ${subject.name} curriculum chapters, ordering, and syllabus topics.`}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExportCSV}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-400 hover:bg-slate-50 active:scale-95"
            title="Export Chapters to CSV"
          >
            <Download className="size-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddDialog}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-brand-navy px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-navy/90 active:scale-95"
          >
            <Plus className="size-4" />
            <span>Add Chapter</span>
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search chapter title, number, or keywords..."
            className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 p-1">
          {(["ALL", "ACTIVE", "INACTIVE"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onStatusFilterChange(filter)}
              className={`rounded-lg px-2.5 py-1 text-3xs font-bold uppercase tracking-wider transition ${
                statusFilter === filter
                  ? "bg-white text-indigo-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {filter === "ALL"
                ? "All"
                : filter === "ACTIVE"
                  ? "Active"
                  : "Archived"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
