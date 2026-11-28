"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, Download, Trash2 } from "lucide-react";
import { Stack } from "@/components/layout/layout-primitives";
import { QuestionCardsSkeletonGrid } from "@/components/skeletons/admin/question-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { exportQuestionsToExcel } from "@/lib/question-export";
import { QuestionCard } from "./question-card";
import { QuestionDeleteDialog } from "./question-delete-dialog";
import { getQuestionDuplicateKey } from "./question-duplicate-utils";
import type { Question } from "./types";
import type { SubjectFilter } from "./use-question-bank";
import { QuestionBankFilterBar } from "./list/question-bank-filter-bar";
import { QuestionBankBulkToolbar } from "./list/question-bank-bulk-toolbar";
import { QuestionBankPagination } from "./list/question-bank-pagination";
import { QuestionBankEmptyState } from "./list/question-bank-empty-state";

const QuestionPreviewDialog = dynamic(
  () =>
    import("./question-preview-dialog").then((m) => m.QuestionPreviewDialog),
  { ssr: false },
);

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
  totalSubjectCount: _totalSubjectCount,
  query,
  onQueryChange,
  chapterFilter = "ALL",
  onChapterChange,
  difficultyFilter = "ALL",
  onDifficultyChange,
  typeFilter = "ALL",
  onTypeChange,
  languageFilter = "ALL",
  onLanguageChange: _onLanguageChange,
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
  const [languageViewMode, setLanguageViewMode] = useState<
    "BILINGUAL" | "EN" | "TA"
  >("BILINGUAL");
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<"list" | "grid">("list");

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const containerRef = useRef<HTMLDivElement>(null);

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
        ids.slice(1).forEach((id) => redundantSet.add(id));
      }
    }
    return { duplicateIds: dupSet, redundantDuplicateIds: redundantSet };
  }, [libraryQuestions]);

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
      showDuplicatesOnly,
  );

  const filterKey = `${subjectFilter}|${chapterFilter}|${difficultyFilter}|${typeFilter}|${languageFilter}|${query}|${pageSize}|${showDuplicatesOnly}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const totalItems = displayedQuestions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedQuestions = useMemo(
    () => displayedQuestions.slice(startIndex, endIndex),
    [displayedQuestions, startIndex, endIndex],
  );

  const handlePageChange = (newPage: number) => {
    const valid = Math.min(Math.max(1, newPage), totalPages);
    setPage(valid);
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
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
      setSelectedIds(
        Array.from(
          new Set([...selectedIds, ...paginatedQuestions.map((q) => q.id)]),
        ),
      );
    }
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      isAllSelected ? [] : displayedQuestions.map((q) => q.id),
    );
  };

  const handleExportSelected = async () => {
    const selectedQuestions = libraryQuestions.filter((q) =>
      selectedIds.includes(q.id),
    );
    await exportQuestionsToExcel(
      selectedQuestions.length > 0 ? selectedQuestions : displayedQuestions,
      `isharp-neet-${subjectFilter.toLowerCase()}-questions.xlsx`,
    );
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

  return (
    <Stack
      ref={containerRef}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xs font-semibold uppercase tracking-wider text-indigo-700">
              Verified NEET Repository
            </span>
            <span className="text-slate-300">·</span>
            {busy && !libraryQuestions.length ? (
              <Skeleton className="inline-block h-3.5 w-24 align-middle" />
            ) : (
              <span className="text-xs font-medium text-slate-500">
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
          <h3 className="mt-0.5 text-base font-bold text-slate-900">
            {subjectFilter[0] + subjectFilter.slice(1).toLowerCase()} Questions
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 text-xs font-semibold">
            {(
              [
                ["BILINGUAL", "தமிழ் + English"],
                ["TA", "தமிழ்"],
                ["EN", "English"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setLanguageViewMode(mode)}
                className={`rounded px-2.5 py-1 text-2xs transition ${
                  languageViewMode === mode
                    ? "bg-white font-bold text-indigo-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void handleExportSelected()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <Download className="size-3.5" />
            <span>
              Export {selectedIds.length > 0 ? `(${selectedIds.length})` : "View"}
            </span>
          </button>
        </div>
      </div>

      {redundantDuplicateIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-amber-600" />
            <span className="font-semibold text-amber-900">
              {redundantDuplicateIds.size} duplicate question{" "}
              {redundantDuplicateIds.size > 1 ? "copies" : "copy"} detected
            </span>
            <span className="hidden text-amber-700 sm:inline">
              (matching content, diagrams, and options in{" "}
              {subjectFilter.toLowerCase()}).
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                showDuplicatesOnly
                  ? "border-amber-400 bg-amber-200/80 font-bold text-amber-900 shadow-2xs"
                  : "border-amber-300 bg-white text-amber-800 hover:bg-amber-100/50"
              }`}
            >
              {showDuplicatesOnly
                ? "Show All Questions"
                : `Filter Duplicates (${duplicateIds.size})`}
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget(
                    libraryQuestions.filter((q) =>
                      redundantDuplicateIds.has(q.id),
                    ),
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-2xs transition hover:bg-rose-700"
              >
                <Trash2 className="size-3" />
                <span>Clean {redundantDuplicateIds.size} Duplicates</span>
              </button>
            )}
          </div>
        </div>
      )}

      <QuestionBankFilterBar
        subjectFilter={subjectFilter}
        query={query}
        onQueryChange={onQueryChange}
        chapterFilter={chapterFilter}
        onChapterChange={onChapterChange}
        difficultyFilter={difficultyFilter}
        onDifficultyChange={onDifficultyChange}
        typeFilter={typeFilter}
        onTypeChange={onTypeChange}
        availableChapters={availableChapters}
      />

      {totalItems > 0 && (
        <QuestionBankBulkToolbar
          pageCount={paginatedQuestions.length}
          totalItems={totalItems}
          selectedCount={selectedIds.length}
          isPageAllSelected={isPageAllSelected}
          isAllSelected={isAllSelected}
          canDelete={Boolean(onDelete)}
          pageSize={pageSize}
          layoutMode={layoutMode}
          onToggleSelectPage={toggleSelectPage}
          onToggleSelectAll={toggleSelectAll}
          onExportSelected={() => void handleExportSelected()}
          onTriggerBulkDelete={() =>
            setDeleteTarget(
              libraryQuestions.filter((q) => selectedIds.includes(q.id)),
            )
          }
          onClearSelection={() => setSelectedIds([])}
          onPageSizeChange={setPageSize}
          onLayoutModeChange={setLayoutMode}
        />
      )}

      <div
        className={
          layoutMode === "list"
            ? "flex w-full flex-col gap-4"
            : "grid gap-4 lg:grid-cols-2"
        }
      >
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
                  : () =>
                      onEdit({
                        ...question,
                        id: "",
                        externalId: `${question.externalId}-COPY`,
                      })
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
          <QuestionBankEmptyState
            subjectFilter={subjectFilter}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={onClearFilters}
            onCreateQuestion={onCreateQuestion}
            onOpenImport={onOpenImport}
          />
        )}
      </div>

      <QuestionBankPagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        onPageChange={handlePageChange}
      />

      {Boolean(previewQuestion) && (
        <QuestionPreviewDialog
          open={Boolean(previewQuestion)}
          onClose={() => setPreviewQuestion(null)}
          question={previewQuestion}
        />
      )}

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
