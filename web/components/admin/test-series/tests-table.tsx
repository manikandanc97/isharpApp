"use client";

import { useMemo, useState } from "react";
import { AlertCircle, FileQuestion, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CategoryTestItem, SubjectWithChapters } from "./types";
import { TestsTableFilters } from "./tests-table/tests-table-filters";
import { TestsTableRow } from "./tests-table/tests-table-row";
import {
  DeleteTestDialog,
  RenameTestDialog,
} from "./tests-table/tests-table-dialogs";

interface TestsTableProps {
  categoryName: string;
  tests: CategoryTestItem[];
  selectedTestId: string | null;
  subjects: SubjectWithChapters[];
  loading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  subjectFilter: string;
  onSubjectFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onCreateTest: () => void;
  onSelectTest: (test: CategoryTestItem) => void;
  onPreviewTest: (test: CategoryTestItem) => void;
  onRenameTest: (test: CategoryTestItem, newTitle: string) => Promise<void>;
  onToggleActive: (test: CategoryTestItem) => Promise<void>;
  onDeleteTest: (test: CategoryTestItem) => Promise<void>;
}

export function TestsTable({
  categoryName,
  tests,
  selectedTestId,
  subjects,
  loading,
  error,
  search,
  onSearchChange,
  subjectFilter,
  onSubjectFilterChange,
  statusFilter,
  onStatusFilterChange,
  page,
  totalPages,
  totalCount,
  onPageChange,
  onRetry,
  onCreateTest,
  onSelectTest,
  onPreviewTest,
  onRenameTest,
  onToggleActive,
  onDeleteTest,
}: TestsTableProps) {
  const [renameTarget, setRenameTarget] = useState<CategoryTestItem | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryTestItem | null>(
    null,
  );
  const [busyAction, setBusyAction] = useState(false);

  const uniqueSubjects = useMemo(
    () =>
      Array.from(new Map(subjects.map((s) => [s.subjectCode, s])).values()),
    [subjects],
  );

  const handleOpenRename = (test: CategoryTestItem) => {
    setRenameTarget(test);
    setRenameValue(test.title);
    setRenameError(null);
  };

  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget) return;
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenameError("Test name cannot be empty");
      return;
    }
    setBusyAction(true);
    setRenameError(null);
    try {
      await onRenameTest(renameTarget, trimmed);
      setRenameTarget(null);
    } catch (err) {
      setRenameError(
        err instanceof Error ? err.message : "Failed to rename test",
      );
    } finally {
      setBusyAction(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyAction(true);
    try {
      await onDeleteTest(deleteTarget);
      setDeleteTarget(null);
    } finally {
      setBusyAction(false);
    }
  };

  const handleDeactivateInstead = async () => {
    if (!deleteTarget) return;
    setBusyAction(true);
    try {
      if (deleteTarget.isActive) {
        await onToggleActive(deleteTarget);
      }
      setDeleteTarget(null);
    } finally {
      setBusyAction(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900">
            {categoryName}
          </h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {totalCount} {totalCount === 1 ? "Test" : "Tests"}
          </span>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={onCreateTest}
          className="h-8 cursor-pointer gap-1.5 rounded-xl bg-brand-blue px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-blue/90"
        >
          <Plus className="size-3.5" />
          Create Test
        </Button>
      </div>

      <TestsTableFilters
        search={search}
        onSearchChange={onSearchChange}
        subjectFilter={subjectFilter}
        onSubjectFilterChange={onSubjectFilterChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        uniqueSubjects={uniqueSubjects}
      />

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <Skeleton className="h-9 w-2/5 rounded-lg" />
                <Skeleton className="h-7 w-1/4 rounded-lg" />
                <Skeleton className="h-7 w-14 rounded-lg" />
                <Skeleton className="h-7 w-12 rounded-lg" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
            <AlertCircle className="size-7 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Failed to load tests
              </p>
              <p className="mt-1 text-xs text-slate-500">{error}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="mr-1.5 size-3.5" />
              Retry
            </Button>
          </div>
        ) : tests.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center">
            <div className="grid size-10 place-items-center rounded-2xl bg-slate-100 text-slate-500">
              <FileQuestion className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                No tests in {categoryName}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {search || subjectFilter !== "ALL" || statusFilter !== "ALL"
                  ? "No tests match your current search or filters."
                  : "Create your first test in this category to get started."}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={onCreateTest}
              className="mt-1 cursor-pointer gap-1.5 rounded-xl bg-brand-blue text-xs font-semibold text-white hover:bg-brand-blue/90"
            >
              <Plus className="size-3.5" />
              Create Test
            </Button>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 text-[11px] font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-xs">
              <tr>
                <th className="px-4 py-2.5">Test</th>
                <th className="px-3 py-2.5 text-right">Pattern</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tests.map((test) => (
                <TestsTableRow
                  key={test.id}
                  test={test}
                  isSelected={test.id === selectedTestId}
                  onSelect={() => onSelectTest(test)}
                  onRename={() => handleOpenRename(test)}
                  onPreview={() => onPreviewTest(test)}
                  onToggleActive={() => void onToggleActive(test)}
                  onDelete={() => setDeleteTarget(test)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalCount > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
          <span>
            {tests.length} of {totalCount}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 cursor-pointer px-2 text-[11px]"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Prev
            </Button>
            <span className="px-1.5 font-medium text-slate-700">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 cursor-pointer px-2 text-[11px]"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <RenameTestDialog
        target={renameTarget}
        value={renameValue}
        error={renameError}
        busy={busyAction}
        onValueChange={setRenameValue}
        onClose={() => setRenameTarget(null)}
        onSubmit={(e) => void handleConfirmRename(e)}
      />

      <DeleteTestDialog
        target={deleteTarget}
        busy={busyAction}
        onClose={() => setDeleteTarget(null)}
        onConfirmDelete={() => void handleConfirmDelete()}
        onDeactivateInstead={() => void handleDeactivateInstead()}
      />
    </div>
  );
}
