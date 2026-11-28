"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TestSeriesCategory } from "./types";

interface CategoryFormDialogProps {
  open: boolean;
  title: string;
  description: string;
  inputId: string;
  value: string;
  placeholder?: string;
  error: string | null;
  submitting: boolean;
  onValueChange: (val: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CategoryFormDialog({
  open,
  title,
  description,
  inputId,
  value,
  placeholder,
  error,
  submitting,
  onValueChange,
  onClose,
  onSubmit,
}: CategoryFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={inputId}>Category Name</Label>
            <Input
              id={inputId}
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder={placeholder}
              autoFocus
            />
          </div>
          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteCategoryDialogProps {
  category: TestSeriesCategory | null;
  otherCategories: TestSeriesCategory[];
  moveTargetId: string;
  error: string | null;
  submitting: boolean;
  onMoveTargetChange: (id: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteCategoryDialog({
  category,
  otherCategories,
  moveTargetId,
  error,
  submitting,
  onMoveTargetChange,
  onClose,
  onConfirm,
}: DeleteCategoryDialogProps) {
  const hasTests = (category?.testCount ?? 0) > 0;

  return (
    <Dialog open={Boolean(category)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="size-4" />
            Delete Category
          </DialogTitle>
          <DialogDescription>
            {hasTests && category
              ? `"${category.name}" currently contains ${category.testCount} test(s). Select another category to move them into before deleting.`
              : `Are you sure you want to delete "${category?.name}"?`}
          </DialogDescription>
        </DialogHeader>

        {hasTests && (
          <div className="space-y-2 py-1">
            <Label>Move tests to category</Label>
            {otherCategories.length === 0 ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Create another category first before deleting this one.
              </p>
            ) : (
              <Select
                value={moveTargetId}
                onValueChange={(val) => val && onMoveTargetChange(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target category" />
                </SelectTrigger>
                <SelectContent>
                  {otherCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {error && <p className="text-xs font-medium text-red-600">{error}</p>}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={
              submitting || (hasTests && otherCategories.length === 0)
            }
          >
            {submitting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            {hasTests ? "Move Tests & Delete" : "Delete Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
