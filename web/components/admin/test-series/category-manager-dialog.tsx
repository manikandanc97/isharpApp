"use client";

import { useState } from "react";
import { Check, Edit2, Loader2, Plus, Power, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { TestSeriesCategory } from "./types";

interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: TestSeriesCategory[];
  onAddCategory: (cat: { name: string; slug: string; description: string }) => Promise<void>;
  onUpdateCategory: (id: string, updates: Partial<TestSeriesCategory>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}

export function CategoryManagerDialog({
  open,
  onOpenChange,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onNotice,
  onError,
}: CategoryManagerDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEdit = (cat: TestSeriesCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      onError("Category name cannot be empty");
      return;
    }
    setIsSubmitting(true);
    try {
      const slug = editName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await onUpdateCategory(id, { name: editName.trim(), slug, description: editDescription.trim() });
      onNotice("Category updated successfully");
      cancelEdit();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: TestSeriesCategory) => {
    try {
      await onUpdateCategory(cat.id, { isActive: !cat.isActive });
      onNotice(`Category ${cat.name} ${!cat.isActive ? "activated" : "deactivated"}`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to toggle category status");
    }
  };

  const handleDelete = async (cat: TestSeriesCategory) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    try {
      await onDeleteCategory(cat.id);
      onNotice(`Category "${cat.name}" deleted successfully`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      onError("Please enter a category name");
      return;
    }
    setIsSubmitting(true);
    try {
      const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await onAddCategory({
        name: newName.trim(),
        slug,
        description: newDescription.trim(),
      });
      onNotice(`Category "${newName}" created successfully`);
      setNewName("");
      setNewDescription("");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
            Manage Test Series Categories
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Configure dynamic grade streams and cohorts. Default categories include Class 11, Class 12, and Repeater Course.
          </DialogDescription>
        </DialogHeader>

        {/* Existing Categories Table/List */}
        <div className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50/50 max-h-72 overflow-y-auto">
          {categories.map((cat) => {
            const isEditing = editingId === cat.id;

            return (
              <div
                key={cat.id}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between transition hover:bg-white"
              >
                {isEditing ? (
                  <div className="flex-1 space-y-2 pr-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Category Name"
                      className="h-8 text-xs font-semibold"
                    />
                    <Input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Category Description"
                      className="h-7 text-xs"
                    />
                  </div>
                ) : (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-3xs font-semibold ${
                          cat.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {cat.description && (
                      <p className="mt-0.5 truncate text-3xs text-slate-500">
                        {cat.description}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        disabled={isSubmitting}
                        onClick={() => handleSaveEdit(cat.id)}
                        className="h-7 rounded-lg bg-emerald-600 px-2 text-2xs text-white hover:bg-emerald-700"
                      >
                        {isSubmitting ? (
                          <Loader2 className="mr-1 size-3 animate-spin" />
                        ) : (
                          <Check className="mr-1 size-3" />
                        )}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        className="h-7 rounded-lg px-2 text-2xs text-slate-500"
                      >
                        <X className="mr-1 size-3" /> Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <button
                        title={cat.isActive ? "Deactivate Category" : "Activate Category"}
                        onClick={() => handleToggleActive(cat)}
                        className={`cursor-pointer rounded-lg p-1.5 transition ${
                          cat.isActive
                            ? "text-emerald-600 hover:bg-emerald-50"
                            : "text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        <Power className="size-3.5" />
                      </button>
                      <button
                        title="Edit Category"
                        onClick={() => startEdit(cat)}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        title="Delete Category"
                        onClick={() => handleDelete(cat)}
                        className="cursor-pointer rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Category Card */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
          <p className="text-xs font-bold text-slate-900">Add New Category</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Foundation Class 10"
              className="h-8 text-xs bg-white"
            />
            <Input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              className="h-8 text-xs bg-white"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              disabled={isSubmitting || !newName.trim()}
              onClick={handleCreate}
              className="h-8 rounded-full bg-brand-blue text-xs font-semibold text-white shadow-xs hover:bg-brand-blue/90"
            >
              {isSubmitting ? (
                <Loader2 className="mr-1 size-3.5 animate-spin" />
              ) : (
                <Plus className="mr-1 size-3.5" />
              )}
              Add Category
            </Button>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs font-medium"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
