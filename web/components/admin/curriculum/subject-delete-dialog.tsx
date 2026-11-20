"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CurriculumSubject } from "./curriculum-types";

interface SubjectDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  subject: CurriculumSubject | null;
  chapterCount: number;
  onConfirmDelete: (subjectId: string) => void;
}

export function SubjectDeleteDialog({
  open,
  onClose,
  subject,
  chapterCount,
  onConfirmDelete,
}: SubjectDeleteDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const hasChapters = chapterCount > 0;

  if (!subject) return null;

  const handleDelete = () => {
    if (hasChapters && confirmText.trim().toUpperCase() !== subject.code.toUpperCase()) {
      return;
    }
    onConfirmDelete(subject.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-100">
              <AlertTriangle className="size-4.5" />
            </div>
            <div>
              <DialogTitle className="text-rose-950">
                {hasChapters ? "Subject Contains Indexed Chapters" : "Delete Subject"}
              </DialogTitle>
              <DialogDescription>
                Academic curriculum integrity safeguard.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-2">
          {hasChapters ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900">
              <p className="font-bold">
                ⚠️ &quot;{subject.name}&quot; currently has {chapterCount} indexed chapters and linked questions.
              </p>
              <p className="mt-1 text-3xs leading-relaxed text-amber-800">
                Deleting this subject will remove its chapters from this course workspace. Please verify before proceeding.
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-600">
              Are you sure you want to delete <strong>{subject.name}</strong> ({subject.code})?
            </p>
          )}

          {hasChapters && (
            <div className="space-y-2 pt-1">
              <label className="text-3xs font-semibold uppercase tracking-wider text-slate-500">
                To confirm deletion, type the subject code &quot;<span className="font-bold text-slate-900">{subject.code}</span>&quot; below:
              </label>
              <input
                type="text"
                placeholder={subject.code}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="h-9 w-full rounded-xl border border-rose-200 bg-white px-3 text-xs uppercase font-bold text-rose-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-full"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleDelete}
            disabled={hasChapters && confirmText.trim().toUpperCase() !== subject.code.toUpperCase()}
            className="rounded-full bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 gap-1.5 shadow-xs"
          >
            <Trash2 className="size-3.5" />
            <span>Delete Subject</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
