"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Download,
  Eye,
  FileQuestion,
  Filter,
  Languages,
  LayoutGrid,
  List,
  LoaderCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Square,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Stack } from "@/components/layout/layout-primitives";
import { QuestionCard } from "./question-card";
import { QuestionPreviewDialog } from "./question-preview-dialog";
import { QuestionDeleteDialog } from "./question-delete-dialog";
import { QuestionCardsSkeletonGrid } from "@/components/skeletons/admin/question-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import type { Question } from "./types";
import type { SubjectFilter } from "./use-question-bank";
import { exportQuestionsToExcel } from "@/lib/question-export";
import { getQuestionDuplicateKey } from "./question-duplicate-utils";

interface QuestionBankListProps {
  subjectFilter: SubjectFilter;
  showingExamples?: boolean;
  visibleCount: number;
  totalSubjectCount?: number;
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
  onDelete?: (question: Question) => Promise<void> | void;
  onBulkDelete?: (questions: Question[]) => Promise<void> | void;
  onCreateQuestion?: () => void;
  onOpenImport?: () => void;
  onClearFilters?: () => void;
}

export function QuestionBankList({
  subjectFilter,
  showingExamples = false,
  visibleCount,
  totalSubjectCount,
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
  onBulkDelete,
  onCreateQuestion,
  onOpenImport,
  onClearFilters,
}: QuestionBankListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question[] | null>(null);
  const [deleteBusy, setDeleteBusy] = useState<boolean>(false);
  const [languageViewMode, setLanguageViewMode] = useState<"BILINGUAL" | "EN" | "TA">("BILINGUAL");
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<"list" | "grid">("list");

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const containerRef = useRef<HTMLDivElement>(null);

  // Duplicate questions detection: content & equivalent duplicate detection
  const { duplicateIds, redundantDuplicateIds } = useMemo(() => {
    const keyToIds = new Map<string, string[]>();

    libraryQuestions.forEach((q) => {
      const { equivKey } = getQuestionDuplicateKey(q);
      const list = keyToIds.get(equivKey) || [];
      list.push(q.id);
      keyToIds.set(equivKey, list);
    });

    const dupSet = new Set<string>();
    const redundantSet = new Set<string>();

    for (const ids of keyToIds.values()) {
      if (ids.length > 1) {
        ids.forEach((id) => dupSet.add(id));
        // Keep the first record as canonical, rest are redundant duplicates
        ids.slice(1).forEach((id) => redundantSet.add(id));
      }
    }

    return { duplicateIds: dupSet, redundantDuplicateIds: redundantSet };
  }, [libraryQuestions]);

  // Questions filtered for duplicate view if enabled
  const displayedQuestions = useMemo(() => {
    if (!showDuplicatesOnly) return libraryQuestions;
    return libraryQuestions.filter((q) => duplicateIds.has(q.id));
  }, [libraryQuestions, showDuplicatesOnly, duplicateIds]);

  const hasActiveFilters = Boolean(
    query.trim() ||
      chapterFilter !== "ALL" ||
      difficultyFilter !== "ALL" ||
      typeFilter !== "ALL" ||
      languageFilter !== "ALL" ||
      showDuplicatesOnly
  );

  // Reset to page 1 whenever filters or query change
  useEffect(() => {
    setPage(1);
  }, [
    subjectFilter,
    chapterFilter,
    difficultyFilter,
    typeFilter,
    languageFilter,
    query,
    pageSize,
    showDuplicatesOnly,
  ]);

  const totalItems = displayedQuestions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedQuestions = useMemo(() => {
    return displayedQuestions.slice(startIndex, endIndex);
  }, [displayedQuestions, startIndex, endIndex]);

  const handlePageChange = (newPage: number) => {
    const valid = Math.min(Math.max(1, newPage), totalPages);
    setPage(valid);
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isPageAllSelected =
    paginatedQuestions.length > 0 &&
    paginatedQuestions.every((q) => selectedIds.includes(q.id));

  const isAllSelected =
    displayedQuestions.length > 0 &&
    displayedQuestions.every((q) => selectedIds.includes(q.id));

  const toggleSelectPage = () => {
    if (isPageAllSelected) {
      const pageIds = new Set(paginatedQuestions.map((q) => q.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const next = new Set([...selectedIds, ...paginatedQuestions.map((q) => q.id)]);
      setSelectedIds(Array.from(next));
    }
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedQuestions.map((q) => q.id));
    }
  };

  const handleExportSelected = async () => {
    const selectedQuestions = libraryQuestions.filter((q) =>
      selectedIds.includes(q.id)
    );
    await exportQuestionsToExcel(
      selectedQuestions.length > 0 ? selectedQuestions : displayedQuestions,
      `isharp-neet-${subjectFilter.toLowerCase()}-questions.xlsx`
    );
  };

  const handleTriggerBulkDelete = () => {
    if (selectedIds.length === 0) return;
    const toDelete = libraryQuestions.filter((q) => selectedIds.includes(q.id));
    setDeleteTarget(toDelete);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleteTarget.length === 0) return;
    setDeleteBusy(true);
    try {
      if (onBulkDelete) {
        await onBulkDelete(deleteTarget);
      } else if (onDelete) {
        for (const q of deleteTarget) {
          await onDelete(q);
        }
      }
      const deletedIds = new Set(deleteTarget.map((q) => q.id));
      setSelectedIds((prev) => prev.filter((id) => !deletedIds.has(id)));
      setDeleteTarget(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  // Generate page numbers with ellipsis
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "ellipsis")[] = [1];
    if (currentPage > 3) {
      pages.push("ellipsis");
    }
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    if (currentPage < totalPages - 2) {
      pages.push("ellipsis");
    }
    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  return (
    <Stack ref={containerRef} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
      {/* Title & Quick Stats */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xs font-semibold uppercase tracking-wider text-indigo-700">
              Verified NEET Repository
            </span>
            <span className="text-slate-300">·</span>
            {busy && !libraryQuestions.length ? (
              <Skeleton className="h-3.5 w-24 inline-block align-middle" />
            ) : (
              <span className="text-xs text-slate-500 font-medium">
                {visibleCount} records matched
              </span>
            )}
            {totalItems > 0 && !busy && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-xs font-semibold text-brand-blue">
                  Showing {startIndex + 1}–{endIndex}
                </span>
              </>
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">
            {subjectFilter[0] + subjectFilter.slice(1).toLowerCase()} Questions
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Language View Switcher */}
          <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLanguageViewMode("BILINGUAL")}
              className={`rounded px-2.5 py-1 text-2xs transition ${
                languageViewMode === "BILINGUAL"
                  ? "bg-white text-indigo-700 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Bilingual
            </button>
            <button
              type="button"
              onClick={() => setLanguageViewMode("EN")}
              className={`rounded px-2.5 py-1 text-2xs transition ${
                languageViewMode === "EN"
                  ? "bg-white text-indigo-700 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguageViewMode("TA")}
              className={`rounded px-2.5 py-1 text-2xs transition font-serif ${
                languageViewMode === "TA"
                  ? "bg-white text-indigo-700 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              தமிழ்
            </button>
          </div>

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

      {/* Duplicate Notice Banner (if duplicates exist) */}
      {redundantDuplicateIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-amber-600" />
            <span className="font-semibold text-amber-900">
              {redundantDuplicateIds.size} duplicate question {redundantDuplicateIds.size > 1 ? "copies" : "copy"} detected
            </span>
            <span className="text-amber-700 hidden sm:inline">
              (matching content, diagrams, and options in {subjectFilter.toLowerCase()}).
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                showDuplicatesOnly
                  ? "border-amber-400 bg-amber-200/80 text-amber-900 font-bold shadow-2xs"
                  : "border-amber-300 bg-white text-amber-800 hover:bg-amber-100/50"
              }`}
            >
              {showDuplicatesOnly ? "Show All Questions" : `Filter Duplicates (${duplicateIds.size})`}
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  const redundantList = libraryQuestions.filter((q) =>
                    redundantDuplicateIds.has(q.id)
                  );
                  setDeleteTarget(redundantList);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700 shadow-2xs transition"
              >
                <Trash2 className="size-3" />
                <span>Clean {redundantDuplicateIds.size} Duplicates</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Advanced Filter Bar */}
      <div className="grid gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {/* Search Input */}
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            placeholder={`Search ${subjectFilter.toLowerCase()} by ID, text or Tamil...`}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition focus:outline-none"
            >
              <X className="size-3.5" />
            </button>
          )}
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
            </select>
          </div>
        )}
      </div>

      {/* Bulk Selection Toolbar & Page Size Selector - only shown when questions exist */}
      {totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-100 py-2.5 px-1">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectPage}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              {isPageAllSelected ? (
                <CheckSquare className="size-4 text-brand-blue" />
              ) : (
                <Square className="size-4 text-slate-400" />
              )}
              <span>Select Page ({paginatedQuestions.length})</span>
            </button>

            {totalItems > paginatedQuestions.length && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs text-indigo-600 hover:underline font-semibold"
              >
                {isAllSelected ? "Unselect all" : `Select all ${totalItems} questions`}
              </button>
            )}

            {selectedIds.length > 0 && (
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-3xs font-bold text-brand-blue border border-blue-200">
                {selectedIds.length} Selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
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
                    onClick={handleTriggerBulkDelete}
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

            {/* Page size dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-7 rounded border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:border-indigo-400"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Layout mode switcher: Full-width list vs 2-column grid */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5">
              <button
                type="button"
                onClick={() => setLayoutMode("list")}
                title="Full width layout"
                aria-label="Full width layout"
                className={`rounded p-1 transition ${
                  layoutMode === "list"
                    ? "bg-white text-indigo-700 shadow-2xs"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <List className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("grid")}
                title="Two-column grid layout"
                aria-label="Two-column grid layout"
                className={`rounded p-1 transition ${
                  layoutMode === "grid"
                    ? "bg-white text-indigo-700 shadow-2xs"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <LayoutGrid className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Cards Container */}
      <div className={layoutMode === "list" ? "flex flex-col gap-4 w-full" : "grid gap-4 lg:grid-cols-2"}>
        {busy && !libraryQuestions.length ? (
          <div className="col-span-full w-full">
            <QuestionCardsSkeletonGrid count={6} layoutMode={layoutMode} />
          </div>
        ) : (
          paginatedQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              demo={showingExamples}
              selected={selectedIds.includes(question.id)}
              isDuplicate={duplicateIds.has(question.id)}
              languageViewMode={languageViewMode}
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
                  : () => setDeleteTarget([question])
              }
            />
          ))
        )}
        {!busy && !libraryQuestions.length && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 sm:p-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50">
              <FileQuestion className="size-7" />
            </div>

            {hasActiveFilters ? (
              <>
                <h4 className="mt-4 text-base font-bold text-slate-800">
                  No matching {subjectFilter[0] + subjectFilter.slice(1).toLowerCase()} questions
                </h4>
                <p className="mt-1.5 max-w-sm text-xs text-slate-500 leading-relaxed">
                  No questions match your current search and filter settings. Try clearing your filters or search query.
                </p>
                {onClearFilters && (
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 transition"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <h4 className="mt-4 text-base font-bold text-slate-800">
                  No {subjectFilter[0] + subjectFilter.slice(1).toLowerCase()} Questions Yet
                </h4>
                <p className="mt-1.5 max-w-md text-xs text-slate-500 leading-relaxed">
                  There are currently no questions in {subjectFilter[0] + subjectFilter.slice(1).toLowerCase()}. Start building your verified question repository by creating questions or importing them from Excel.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  {onCreateQuestion && (
                    <button
                      type="button"
                      onClick={onCreateQuestion}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition"
                    >
                      <Plus className="size-4" />
                      <span>Create Question</span>
                    </button>
                  )}
                  {onOpenImport && (
                    <button
                      type="button"
                      onClick={onOpenImport}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition"
                    >
                      <UploadCloud className="size-4 text-slate-500" />
                      <span>Import Excel</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Pagination Bar */}
      {totalPages > 1 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-4 px-1">
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{startIndex + 1}</span> to{" "}
            <span className="font-bold text-slate-800">{endIndex}</span> of{" "}
            <span className="font-bold text-slate-800">{totalItems}</span> questions
          </div>

          <div className="flex items-center gap-1">
            {/* First Page */}
            <button
              type="button"
              onClick={() => handlePageChange(1)}
              disabled={currentPage <= 1}
              className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="First Page"
            >
              <ChevronsLeft className="size-4" />
            </button>

            {/* Previous Page */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              <ChevronLeft className="size-4" />
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1 mx-1">
              {pageNumbers.map((p, idx) => {
                if (p === "ellipsis") {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-slate-400">
                      …
                    </span>
                  );
                }
                const isCurrent = p === currentPage;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    className={`size-8 rounded-lg text-xs font-semibold transition ${
                      isCurrent
                        ? "bg-brand-blue text-white shadow-xs"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              <ChevronRight className="size-4" />
            </button>

            {/* Last Page */}
            <button
              type="button"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage >= totalPages}
              className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Last Page"
            >
              <ChevronsRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Question Preview Modal */}
      <QuestionPreviewDialog
        open={Boolean(previewQuestion)}
        onClose={() => setPreviewQuestion(null)}
        question={previewQuestion}
      />

      {/* Question Delete Confirmation Modal */}
      <QuestionDeleteDialog
        open={Boolean(deleteTarget && deleteTarget.length > 0)}
        onClose={() => !deleteBusy && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        questions={deleteTarget || []}
        busy={deleteBusy}
      />
    </Stack>
  );
}
