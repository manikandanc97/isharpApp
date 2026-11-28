"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
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
import type { CategoryTestItem } from "../types";

interface RenameTestDialogProps {
  target: CategoryTestItem | null;
  value: string;
  error: string | null;
  busy: boolean;
  onValueChange: (val: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function RenameTestDialog({
  target,
  value,
  error,
  busy,
  onValueChange,
  onClose,
  onSubmit,
}: RenameTestDialogProps) {
  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Test</DialogTitle>
          <DialogDescription>
            Update the name for &ldquo;{target?.title}&rdquo;.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3 py-1">
          <div className="space-y-1.5">
            <label
              htmlFor="rename-test-input"
              className="text-xs font-medium text-slate-700"
            >
              Test Name
            </label>
            <Input
              id="rename-test-input"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder="Enter test name"
              autoFocus
              disabled={busy}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="cursor-pointer bg-brand-blue text-white hover:bg-brand-blue/90"
              disabled={busy}
            >
              {busy && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteTestDialogProps {
  target: CategoryTestItem | null;
  busy: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  onDeactivateInstead: () => void;
}

export function DeleteTestDialog({
  target,
  busy,
  onClose,
  onConfirmDelete,
  onDeactivateInstead,
}: DeleteTestDialogProps) {
  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">Delete Test</DialogTitle>
          <DialogDescription>
            {target && target.attemptCount > 0
              ? `"${target.title}" has ${target.attemptCount} student attempt(s) and cannot be deleted. You can deactivate it instead.`
              : `Are you sure you want to permanently delete "${target?.title}"?`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </Button>
          {target && target.attemptCount > 0 ? (
            <Button
              type="button"
              onClick={onDeactivateInstead}
              disabled={busy || !target.isActive}
            >
              <CheckCircle2 className="mr-1.5 size-3.5" />
              {target.isActive ? "Deactivate Instead" : "Already Inactive"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirmDelete}
              disabled={busy}
            >
              {busy && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
              Delete
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
