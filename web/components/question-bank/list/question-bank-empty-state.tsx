"use client";

import { FileQuestion, Plus, RotateCcw, UploadCloud } from "lucide-react";
import type { SubjectFilter } from "../use-question-bank";

interface QuestionBankEmptyStateProps {
  subjectFilter: SubjectFilter;
  hasActiveFilters: boolean;
  onClearFilters?: () => void;
  onCreateQuestion?: () => void;
  onOpenImport?: () => void;
}

export function QuestionBankEmptyState({
  subjectFilter,
  hasActiveFilters,
  onClearFilters,
  onCreateQuestion,
  onOpenImport,
}: QuestionBankEmptyStateProps) {
  const subjectLabel =
    subjectFilter[0] + subjectFilter.slice(1).toLowerCase();

  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center sm:p-14">
      <div className="flex size-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50">
        <FileQuestion className="size-7" />
      </div>

      {hasActiveFilters ? (
        <>
          <h4 className="mt-4 text-base font-bold text-slate-800">
            No matching {subjectLabel} questions
          </h4>
          <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
            No questions match your current search and filter settings. Try
            clearing your filters or search query.
          </p>
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-indigo-600"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </>
      ) : (
        <>
          <h4 className="mt-4 text-base font-bold text-slate-800">
            No {subjectLabel} Questions Yet
          </h4>
          <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">
            There are currently no questions in {subjectLabel}. Start building
            your verified question repository by creating questions or importing
            them from Excel.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {onCreateQuestion && (
              <button
                type="button"
                onClick={onCreateQuestion}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-indigo-700"
              >
                <Plus className="size-4" />
                <span>Create Question</span>
              </button>
            )}
            {onOpenImport && (
              <button
                type="button"
                onClick={onOpenImport}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50"
              >
                <UploadCloud className="size-4 text-slate-500" />
                <span>Import Excel</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
