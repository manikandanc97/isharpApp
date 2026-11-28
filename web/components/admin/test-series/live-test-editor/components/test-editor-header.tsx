"use client";

import { FileQuestion, Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TestSeriesCategory } from "../../types";
import type { EditorMode, EditorTab } from "../test-editor.types";

export function TestEditorEmptyState({
  onCreateTestClick,
}: {
  onCreateTestClick: () => void;
}) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xs">
      <div className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
        <FileQuestion className="size-6" />
      </div>
      <h3 className="mt-4 text-sm font-bold text-slate-900">
        Select a test to view or edit its configuration.
      </h3>
      <p className="mt-1 max-w-xs text-xs text-slate-500">
        Click any test in the table on the left, or create a new test in this
        category.
      </p>
      <Button
        type="button"
        size="sm"
        onClick={onCreateTestClick}
        className="mt-4 gap-1.5 rounded-xl bg-brand-red text-xs font-semibold text-white hover:bg-brand-red/90"
      >
        <Plus className="size-3.5" />
        Create Test
      </Button>
    </div>
  );
}

export function TestEditorLoadingState({ inDialog }: { inDialog: boolean }) {
  return (
    <div
      className={
        inDialog
          ? "flex h-full min-h-0 flex-1 items-center justify-center bg-white text-xs text-slate-500"
          : "flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-xs text-slate-500 shadow-2xs"
      }
    >
      <Loader2 className="mr-2 size-4 animate-spin" />
      Loading test configuration...
    </div>
  );
}

interface TestEditorHeaderProps {
  mode: Exclude<EditorMode, "empty">;
  title: string;
  selectedTitle?: string;
  categoryId: string;
  categories: TestSeriesCategory[];
  isActive: boolean;
  isDirty: boolean;
  inDialog: boolean;
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  assignedCount: number;
  totalQuestions: number;
}

export function TestEditorHeader({
  mode,
  title,
  selectedTitle,
  categoryId,
  categories,
  isActive,
  isDirty,
  inDialog,
  activeTab,
  onTabChange,
  assignedCount,
  totalQuestions,
}: TestEditorHeaderProps) {
  const tabs: Array<{ id: EditorTab; label: string }> = [
    { id: "details", label: "Test Details" },
    { id: "subjects", label: "Subjects & Chapters" },
    {
      id: "questions",
      label: `Questions (${assignedCount}/${totalQuestions})`,
    },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="shrink-0 border-b border-slate-100 px-5 py-3.5">
      <div
        className={`flex items-center justify-between gap-2 ${inDialog ? "pr-8" : ""}`}
      >
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-slate-900">
            {mode === "create"
              ? "Create Test"
              : `Edit Test – ${title || selectedTitle || ""}`}
          </h3>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
            <span>
              {categories.find((c) => c.id === categoryId)?.name ??
                "Uncategorized"}
            </span>
            {isDirty && (
              <span className="font-semibold text-amber-600">
                • Unsaved changes
              </span>
            )}
          </div>
        </div>

        <Badge
          variant="outline"
          className={
            isActive
              ? "border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700"
              : "border-slate-200 bg-slate-100 text-[11px] text-slate-600"
          }
        >
          {isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="-mx-4 mt-3 flex gap-1 overflow-x-auto border-b border-slate-100 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`shrink-0 border-b-2 px-3 py-2 text-xs font-semibold transition ${
              activeTab === tab.id
                ? "border-brand-blue text-brand-blue"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
