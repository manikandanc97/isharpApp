"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileQuestion,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { CategoryTestItem, SubjectWithChapters } from "./types";

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
      Array.from(
        new Map(subjects.map((s) => [s.subjectCode, s])).values(),
      ),
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

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-2xs">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              {categoryName}
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {totalCount} {totalCount === 1 ? "Test" : "Tests"}
            </span>
          </div>
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

      {/* Filter Bar */}
      <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/40 px-4 py-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tests..."
            className="h-8 bg-white pl-8 pr-7 text-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Select
            value={subjectFilter}
            onValueChange={(val) => val && onSubjectFilterChange(val)}
          >
            <SelectTrigger className="h-8 w-32 cursor-pointer bg-white text-xs">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="cursor-pointer">
                All Subjects
              </SelectItem>
              {uniqueSubjects.map((s) => (
                <SelectItem
                  key={s.subjectCode}
                  value={s.subjectCode}
                  className="cursor-pointer"
                >
                  {s.subjectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(val) => val && onStatusFilterChange(val)}
          >
            <SelectTrigger className="h-8 w-28 cursor-pointer bg-white text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="cursor-pointer">
                All Status
              </SelectItem>
              <SelectItem value="ACTIVE" className="cursor-pointer">
                Active
              </SelectItem>
              <SelectItem value="INACTIVE" className="cursor-pointer">
                Inactive
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content Area */}
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
              {tests.map((test) => {
                const isSelected = test.id === selectedTestId;
                const hasWarning = test.isConfigurationValid === false;
                return (
                  <tr
                    key={test.id}
                    onClick={() => onSelectTest(test)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? "border-l-2 border-l-brand-blue bg-blue-50/50"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 line-clamp-1">
                          {test.title}
                        </span>
                        {hasWarning && (
                          <span
                            title={
                              test.configurationWarnings?.join(" ") ??
                              "Incomplete configuration"
                            }
                          >
                            <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10px] text-slate-400">
                          {test.code}
                        </span>
                        {test.subjectsSummary.length > 0 ? (
                          <div
                            className="flex flex-wrap items-center gap-1"
                            title={test.subjectsSummary
                              .map((s) => `${s.subjectName}: ${s.count}`)
                              .join(", ")}
                          >
                            {test.subjectsSummary.slice(0, 3).map((s) => (
                              <span
                                key={s.subjectCode}
                                className="inline-flex items-center rounded-md border border-slate-200/80 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                              >
                                {s.subjectName.slice(0, 3)} {s.count}
                              </span>
                            ))}
                            {test.subjectsSummary.length > 3 && (
                              <span className="text-[10px] text-slate-400">
                                +{test.subjectsSummary.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-600">
                            Unconfigured
                          </span>
                        )}
                        {test.attemptCount > 0 && (
                          <span className="text-[10px] font-medium text-amber-600">
                            • {test.attemptCount} attempt
                            {test.attemptCount === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <div
                        className={`font-semibold ${
                          test.assignedQuestionCount === test.totalQuestions
                            ? "text-slate-800"
                            : "text-amber-700"
                        }`}
                      >
                        {test.assignedQuestionCount}/{test.totalQuestions} Qns
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {test.durationMinutes}m • {test.totalMarks} marks
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <Badge
                        variant="outline"
                        className={
                          test.isActive
                            ? "gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]"
                            : "gap-1.5 border-slate-200 bg-slate-100 text-slate-600 text-[10px]"
                        }
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            test.isActive ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {test.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>

                    <td
                      className="px-3 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7 cursor-pointer rounded-lg text-slate-500 hover:text-slate-900"
                            />
                          }
                        >
                          <MoreVertical className="size-3.5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => onSelectTest(test)}
                          >
                            <Pencil className="mr-2 size-3.5" />
                            Edit Test
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => handleOpenRename(test)}
                          >
                            <Pencil className="mr-2 size-3.5" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => onPreviewTest(test)}
                          >
                            <Eye className="mr-2 size-3.5" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => void onToggleActive(test)}
                          >
                            <Power className="mr-2 size-3.5" />
                            {test.isActive ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer text-red-600 focus:text-red-600"
                            onClick={() => setDeleteTarget(test)}
                          >
                            <Trash2 className="mr-2 size-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
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

      {/* Rename Test Dialog */}
      <Dialog
        open={Boolean(renameTarget)}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Test</DialogTitle>
            <DialogDescription>
              Update the name for &ldquo;{renameTarget?.title}&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmRename} className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label
                htmlFor="rename-test-input"
                className="text-xs font-medium text-slate-700"
              >
                Test Name
              </label>
              <Input
                id="rename-test-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Enter test name"
                autoFocus
                disabled={busyAction}
              />
              {renameError && (
                <p className="text-xs text-red-600">{renameError}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => setRenameTarget(null)}
                disabled={busyAction}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="cursor-pointer bg-brand-blue text-white hover:bg-brand-blue/90"
                disabled={busyAction}
              >
                {busyAction && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Test Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Test</DialogTitle>
            <DialogDescription>
              {deleteTarget && deleteTarget.attemptCount > 0
                ? `"${deleteTarget.title}" has ${deleteTarget.attemptCount} student attempt(s) and cannot be deleted. You can deactivate it instead.`
                : `Are you sure you want to permanently delete "${deleteTarget?.title}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={busyAction}
            >
              Cancel
            </Button>
            {deleteTarget && deleteTarget.attemptCount > 0 ? (
              <Button
                type="button"
                onClick={async () => {
                  setBusyAction(true);
                  try {
                    if (deleteTarget.isActive) {
                      await onToggleActive(deleteTarget);
                    }
                    setDeleteTarget(null);
                  } finally {
                    setBusyAction(false);
                  }
                }}
                disabled={busyAction || !deleteTarget.isActive}
              >
                <CheckCircle2 className="mr-1.5 size-3.5" />
                {deleteTarget.isActive
                  ? "Deactivate Instead"
                  : "Already Inactive"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={busyAction}
              >
                {busyAction && (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                )}
                Delete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
