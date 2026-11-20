"use client";

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
import type { CurriculumChapter } from "./curriculum-types";

interface ChapterDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  chapter: CurriculumChapter | null;
  onConfirm: (chapterId: string) => void;
}

export function ChapterDeleteDialog({
  open,
  onClose,
  chapter,
  onConfirm,
}: ChapterDeleteDialogProps) {
  if (!chapter) return null;

  const handleDelete = () => {
    onConfirm(chapter.id);
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
              <DialogTitle className="text-rose-950">Delete Chapter</DialogTitle>
              <DialogDescription>
                Confirm removal of chapter from the academic directory.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2 text-xs text-slate-600 space-y-2">
          <p>
            Are you sure you want to remove <strong>Chapter {chapter.position}: {chapter.title}</strong>?
          </p>
          {chapter.topics.length > 0 && (
            <p className="text-3xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              Note: This chapter has {chapter.topics.length} configured topic syllabus records which will also be removed.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
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
            className="rounded-full bg-rose-600 text-white hover:bg-rose-700 gap-1.5 shadow-xs"
          >
            <Trash2 className="size-3.5" />
            <span>Confirm Delete</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
