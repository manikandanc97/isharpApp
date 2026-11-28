"use client";

import { useState } from "react";
import { FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CategoryFormDialog,
  DeleteCategoryDialog,
} from "./category-panel-dialogs";
import type { TestSeriesCategory } from "./types";

interface CategoryPanelProps {
  categories: TestSeriesCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  onAddCategory: (name: string) => Promise<void>;
  onRenameCategory: (id: string, name: string) => Promise<void>;
  onDeleteCategory: (id: string, moveToCategoryId?: string) => Promise<void>;
}

export function CategoryPanel({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
}: CategoryPanelProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingCategory, setEditingCategory] =
    useState<TestSeriesCategory | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingCategory, setDeletingCategory] =
    useState<TestSeriesCategory | null>(null);
  const [moveTargetId, setMoveTargetId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setNewName("");
    setFormError(null);
    setAddOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setFormError("Category name is required");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await onAddCategory(trimmed);
      setAddOpen(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create category",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (cat: TestSeriesCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setEditName(cat.name);
    setFormError(null);
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      setFormError("Category name cannot be empty");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await onRenameCategory(editingCategory.id, trimmed);
      setEditingCategory(null);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to rename category",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (cat: TestSeriesCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    const otherCategories = categories.filter((c) => c.id !== cat.id);
    setDeletingCategory(cat);
    setMoveTargetId(otherCategories[0]?.id ?? "");
    setFormError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    const hasTests = (deletingCategory.testCount ?? 0) > 0;
    if (hasTests && !moveTargetId) {
      setFormError(
        "Please select another category to move existing tests into.",
      );
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await onDeleteCategory(
        deletingCategory.id,
        hasTests ? moveTargetId : undefined,
      );
      setDeletingCategory(null);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to delete category",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const otherCategoriesForDelete = deletingCategory
    ? categories.filter((c) => c.id !== deletingCategory.id)
    : [];

  return (
    <aside className="flex max-h-[calc(100vh-14rem)] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xs">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <FolderOpen className="size-4 shrink-0 text-brand-blue" />
          <h2 className="truncate text-sm font-bold text-slate-900">
            Categories
          </h2>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
            {categories.length}
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleOpenAdd}
          className="h-7 shrink-0 cursor-pointer gap-1 rounded-lg bg-brand-blue px-2.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-blue/90"
        >
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>

      <div className="space-y-1 overflow-y-auto p-2">
        {categories.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-slate-500">
            No categories yet. Add your first category to begin.
          </div>
        ) : (
          categories.map((cat) => {
            const isSelected = cat.id === selectedCategoryId;
            return (
              <div
                key={cat.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectCategory(cat.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectCategory(cat.id);
                  }
                }}
                className={`group flex cursor-pointer items-center justify-between gap-1.5 rounded-xl px-2.5 py-2 text-left transition ${
                  isSelected
                    ? "bg-brand-blue text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate text-xs font-semibold">
                    {cat.name}
                  </span>
                  {typeof cat.testCount === "number" && (
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/70"
                      }`}
                    >
                      {cat.testCount}
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    aria-label={`Edit ${cat.name}`}
                    title="Rename category"
                    onClick={(e) => handleOpenEdit(cat, e)}
                    className={`cursor-pointer rounded-md p-1 transition ${
                      isSelected
                        ? "text-white/80 hover:bg-white/15 hover:text-white"
                        : "text-slate-400 opacity-60 hover:bg-slate-200/70 hover:text-slate-700 group-hover:opacity-100"
                    }`}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${cat.name}`}
                    title="Delete category"
                    onClick={(e) => handleOpenDelete(cat, e)}
                    className={`cursor-pointer rounded-md p-1 transition ${
                      isSelected
                        ? "text-white/80 hover:bg-white/15 hover:text-white"
                        : "text-slate-400 opacity-60 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    }`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <CategoryFormDialog
        open={addOpen}
        title="Add Category"
        description="Create a new category to organize your tests."
        inputId="new-category-name"
        value={newName}
        placeholder="e.g. Class 11, Full Syllabus, Mock Tests"
        error={formError}
        submitting={submitting}
        onValueChange={setNewName}
        onClose={() => setAddOpen(false)}
        onSubmit={handleCreate}
      />

      <CategoryFormDialog
        open={Boolean(editingCategory)}
        title="Rename Category"
        description="Renaming a category preserves all existing tests and student history."
        inputId="edit-category-name"
        value={editName}
        error={formError}
        submitting={submitting}
        onValueChange={setEditName}
        onClose={() => setEditingCategory(null)}
        onSubmit={handleRename}
      />

      <DeleteCategoryDialog
        category={deletingCategory}
        otherCategories={otherCategoriesForDelete}
        moveTargetId={moveTargetId}
        error={formError}
        submitting={submitting}
        onMoveTargetChange={setMoveTargetId}
        onClose={() => setDeletingCategory(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </aside>
  );
}
