"use client";

import {
  CheckSquare,
  Download,
  LayoutGrid,
  List,
  Square,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuestionBankBulkToolbarProps {
  pageCount: number;
  totalItems: number;
  selectedCount: number;
  isPageAllSelected: boolean;
  isAllSelected: boolean;
  canDelete: boolean;
  pageSize: number;
  layoutMode: "list" | "grid";
  onToggleSelectPage: () => void;
  onToggleSelectAll: () => void;
  onExportSelected: () => void;
  onTriggerBulkDelete: () => void;
  onClearSelection: () => void;
  onPageSizeChange: (size: number) => void;
  onLayoutModeChange: (mode: "list" | "grid") => void;
}

export function QuestionBankBulkToolbar({
  pageCount,
  totalItems,
  selectedCount,
  isPageAllSelected,
  isAllSelected,
  canDelete,
  pageSize,
  layoutMode,
  onToggleSelectPage,
  onToggleSelectAll,
  onExportSelected,
  onTriggerBulkDelete,
  onClearSelection,
  onPageSizeChange,
  onLayoutModeChange,
}: QuestionBankBulkToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-100 px-1 py-2.5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onToggleSelectPage}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
        >
          {isPageAllSelected ? (
            <CheckSquare className="size-4 text-brand-blue" />
          ) : (
            <Square className="size-4 text-slate-400" />
          )}
          <span>Select Page ({pageCount})</span>
        </button>

        {totalItems > pageCount && (
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            {isAllSelected
              ? "Unselect all"
              : `Select all ${totalItems} questions`}
          </button>
        )}

        {selectedCount > 0 && (
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-3xs font-bold text-brand-blue">
            {selectedCount} Selected
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportSelected}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-3xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <Download className="size-3" />
              <span>Export Selected</span>
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={onTriggerBulkDelete}
                className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-3xs font-semibold text-red-700 shadow-2xs hover:bg-red-100"
              >
                <Trash2 className="size-3" />
                <span>Delete Selected</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClearSelection}
              className="text-3xs font-medium text-slate-500 hover:underline"
            >
              Clear
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>Per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => value && onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-7 w-18 rounded-lg px-2 text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10" label="10">
                10
              </SelectItem>
              <SelectItem value="20" label="20">
                20
              </SelectItem>
              <SelectItem value="50" label="50">
                50
              </SelectItem>
              <SelectItem value="100" label="100">
                100
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5">
          <button
            type="button"
            onClick={() => onLayoutModeChange("list")}
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
            onClick={() => onLayoutModeChange("grid")}
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
  );
}
