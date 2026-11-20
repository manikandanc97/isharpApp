"use client";

import { useMemo, useState } from "react";
import {
  CheckSquare,
  Copy,
  Download,
  Eye,
  Filter,
  LoaderCircle,
  RefreshCw,
  Search,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { Stack } from "@/components/layout/layout-primitives";
import { QuestionCard } from "./question-card";
import { QuestionPreviewDialog } from "./question-preview-dialog";
import type { Question } from "./types";
import type { SubjectFilter } from "./use-question-bank";
import { exportQuestionsToExcel } from "@/lib/question-export";

interface QuestionBankListProps {
  subjectFilter: SubjectFilter;
  showingExamples: boolean;
  visibleCount: number;
  query: string;
  onQueryChange: (query: string) => void;
  chapterFilter?: string;
  onChapterChange?: (chapter: string) => void;
  difficultyFilter?: string;
  onDifficultyChange?: (diff: string) => void;
  typeFilter?: string;
  onTypeChange?: (type: string) => void;
  languageFilter?: string;
  onLanguageChange?: (lang: string) => void;
  availableChapters?: string[];
  busy: boolean;
  libraryQuestions: Question[];
  onEdit: (question: Question) => void;
  onDuplicate?: (question: Question) => void;
  onDelete?: (question: Question) => void;
}

export function QuestionBankList({
  subjectFilter,
  showingExamples,
  visibleCount,
  query,
  onQueryChange,
  chapterFilter = "ALL",
  onChapterChange,
  difficultyFilter = "ALL",
  onDifficultyChange,
  typeFilter = "ALL",
  onTypeChange,
  languageFilter = "ALL",
  onLanguageChange,
  availableChapters = [],
  busy,
  libraryQuestions,
  onEdit,
  onDuplicate,
  onDelete,
}: QuestionBankListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    libraryQuestions.length > 0 &&
    libraryQuestions.every((q) => selectedIds.includes(q.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(libraryQuestions.map((q) => q.id));
    }
  };

  const handleExportSelected = async () => {
    const selectedQuestions = libraryQuestions.filter((q) =>
      selectedIds.includes(q.id)
    );
    await exportQuestionsToExcel(
      selectedQuestions.length > 0 ? selectedQuestions : libraryQuestions,
      `isharp-neet-${subjectFilter.toLowerCase()}-questions.xlsx`
    );
  };

  const handleBulkDelete = () => {
    if (!onDelete || selectedIds.length === 0) return;
    if (
      confirm(
        `Are you sure you want to delete ${selectedIds.length} selected question(s)?`
      )
    ) {
      const toDelete = libraryQuestions.filter((q) =>
        selectedIds.includes(q.id)
      );
      toDelete.forEach((q) => onDelete(q));
      setSelectedIds([]);
    }
  };

  return (
    <Stack className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
      {/* Title & Quick Stats */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xs font-semibold uppercase tracking-wider text-indigo-700">
              Verified NEET Repository
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">
              {visibleCount} records matched
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">
            {subjectFilter[0] + subjectFilter.slice(1).toLowerCase()} Questions
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showingExamples && (
            <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 border border-amber-200">
              Preview Dataset
            </span>
          )}
          <button
            type="button"
            onClick={handleExportSelected}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <Download className="size-3.5" />
            <span>Export {selectedIds.length > 0 ? `(${selectedIds.length})` : "View"}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Advanced Filter Bar */}
      <div className="grid gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {/* Search Input */}
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            placeholder={`Search ${subjectFilter.toLowerCase()} by ID, text or Tamil...`}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>

        {/* Chapter Filter */}
        {onChapterChange && (
          <div>
            <select
              value={chapterFilter}
              onChange={(e) => onChapterChange(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none cursor-pointer focus:border-indigo-400"
            >
              <option value="ALL">All Chapters ({availableChapters.length})</option>
              {availableChapters.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Difficulty Filter */}
        {onDifficultyChange && (
          <div>
            <select
              value={difficultyFilter}
              onChange={(e) => onDifficultyChange(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none cursor-pointer focus:border-indigo-400"
            >
              <option value="ALL">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
        )}

        {/* Question Type Filter */}
        {onTypeChange && (
          <div>
            <select
              value={typeFilter}
              onChange={(e) => onTypeChange(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none cursor-pointer focus:border-indigo-400"
            >
              <option value="ALL">All Question Types</option>
              <option value="SINGLE_CORRECT">Single Correct MCQ</option>
              <option value="MULTIPLE_CORRECT">Multiple Correct MCQ</option>
              <option value="NUMERICAL">Numerical Questions</option>
              <option value="ASSERTION_REASON">Assertion & Reason</option>
              <option value="MATCH_FOLLOWING">Match the Following</option>
            </select>
          </div>
        )}
      </div>

      {/* Bulk Selection Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-100 py-2.5 px-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            {isAllSelected ? (
              <CheckSquare className="size-4 text-brand-blue" />
            ) : (
              <Square className="size-4 text-slate-400" />
            )}
            <span>Select All on Page ({libraryQuestions.length})</span>
          </button>

          {selectedIds.length > 0 && (
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-3xs font-bold text-brand-blue border border-blue-200">
              {selectedIds.length} Selected
            </span>
          )}
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportSelected}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-3xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              <Download className="size-3" />
              <span>Export Selected</span>
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-3xs font-semibold text-red-700 hover:bg-red-100 shadow-2xs"
              >
                <Trash2 className="size-3" />
                <span>Delete Selected</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-3xs font-medium text-slate-500 hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Question Cards Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {busy && !libraryQuestions.length ? (
          <div className="col-span-2 grid h-48 place-items-center">
            <LoaderCircle className="size-8 animate-spin text-brand-blue" />
          </div>
        ) : (
          libraryQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              demo={showingExamples}
              selected={selectedIds.includes(question.id)}
              onToggleSelect={() => toggleSelectOne(question.id)}
              onPreview={() => setPreviewQuestion(question)}
              onDuplicate={
                onDuplicate
                  ? () => onDuplicate(question)
                  : () => onEdit({ ...question, id: "", externalId: `${question.externalId}-COPY` })
              }
              onEdit={() => onEdit(question)}
              onDelete={
                showingExamples || !onDelete
                  ? undefined
                  : () => onDelete(question)
              }
            />
          ))
        )}
        {!busy && !libraryQuestions.length && (
          <div className="col-span-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center text-xs text-slate-500">
            No {subjectFilter.toLowerCase()} questions match your filter criteria.
          </div>
        )}
      </div>

      {/* Question Preview Modal */}
      <QuestionPreviewDialog
        open={Boolean(previewQuestion)}
        onClose={() => setPreviewQuestion(null)}
        question={previewQuestion}
      />
    </Stack>
  );
}
