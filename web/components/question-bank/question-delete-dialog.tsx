"use client";

import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Question } from "./types";
import { formatDisplayQuestionId } from "@/lib/question-format";

interface QuestionDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  questions: Question[];
  busy?: boolean;
}

export function QuestionDeleteDialog({
  open,
  onClose,
  onConfirm,
  questions,
  busy = false,
}: QuestionDeleteDialogProps) {
  if (!open || questions.length === 0) return null;

  const isSingle = questions.length === 1;
  const singleQuestion = questions[0];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !busy && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-600">
              <Trash2 className="size-6" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-base font-bold text-slate-900">
                {isSingle ? "Delete Question" : `Delete ${questions.length} Questions`}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {isSingle
                  ? "Are you sure you want to permanently remove this question from the verified question bank?"
                  : `Are you sure you want to delete ${questions.length} selected questions from the question bank?`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-2 space-y-3">
          {isSingle && singleQuestion ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5 text-3xs font-semibold">
                <span
                  title={`ID: ${singleQuestion.externalId}`}
                  className="rounded bg-indigo-50 px-2 py-0.5 text-indigo-700 font-bold"
                >
                  {formatDisplayQuestionId(singleQuestion.externalId)}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-700">
                  {singleQuestion.courseSubject?.subject?.name || "NEET"}
                </span>
                {singleQuestion.chapter?.title && (
                  <>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 truncate max-w-[180px]">
                      {singleQuestion.chapter.title}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs font-medium text-slate-800 line-clamp-2 leading-relaxed">
                {singleQuestion.textEn || singleQuestion.textTa || "Image-based question"}
              </p>
              {singleQuestion.textTa && singleQuestion.textEn && (
                <p className="text-xs text-slate-600 font-serif line-clamp-1">
                  {singleQuestion.textTa}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
              <div className="text-xs font-semibold text-slate-700">
                Selected Questions ({questions.length}):
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {questions.slice(0, 8).map((q) => (
                  <span
                    key={q.id}
                    title={`ID: ${q.externalId}`}
                    className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-3xs font-medium text-slate-600 font-mono"
                  >
                    {formatDisplayQuestionId(q.externalId)}
                  </span>
                ))}
                {questions.length > 8 && (
                  <span className="rounded-md bg-slate-200 px-2 py-0.5 text-3xs font-semibold text-slate-600">
                    +{questions.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-2xs font-medium text-amber-800">
            <AlertTriangle className="size-4 shrink-0 text-amber-600" />
            <span>This action cannot be undone. Any linked test papers will also be updated.</span>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClose}
            className="h-9 px-4 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="h-9 gap-1.5 bg-rose-600 px-4 text-xs font-semibold text-white hover:bg-rose-700 focus:ring-rose-500 shadow-xs"
          >
            {busy ? (
              <>
                <LoaderCircle className="size-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="size-3.5" />
                <span>{isSingle ? "Delete Question" : `Delete ${questions.length} Questions`}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
