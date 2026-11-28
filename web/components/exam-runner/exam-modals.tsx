"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  HelpCircle,
  LayoutGrid,
  Loader2,
  LogOut,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ExamQuestion, QuestionStatus } from "./exam.types";
import type { SummaryCounts } from "./exam-palette";
import { formatExamTimer } from "./use-exam-timer";
import { ExamExitConfirmDialog } from "@/components/shared/examination/exam-confirm-dialog";

// ----------------------------------------------------------------------------
// 1. SUBMIT CONFIRMATION DIALOG
// ----------------------------------------------------------------------------

interface SubmitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  answeredCount: number;
  unattemptedCount: number;
  markedCount: number;
  secondsRemaining: number;
  isSubmitting: boolean;
  onConfirmSubmit: () => void;
}

export function SubmitConfirmDialog({
  open,
  onOpenChange,
  answeredCount,
  unattemptedCount,
  markedCount,
  secondsRemaining,
  isSubmitting,
  onConfirmSubmit,
}: SubmitConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(val) => !isSubmitting && onOpenChange(val)}>
      <DialogContent className="max-w-md p-6 sm:p-7">
        <DialogHeader className="space-y-1.5 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-rose-100 text-brand-red">
            <Send className="size-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900">
            Submit Examination?
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600">
            Please review your question attempt summary before final submission. Once submitted, your examination is sealed and cannot be resumed.
          </DialogDescription>
        </DialogHeader>

        {/* Attempt Matrix */}
        <div className="grid grid-cols-3 gap-2.5 my-3 text-center">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
            <CheckCircle2 className="mx-auto size-4 text-emerald-600" />
            <p className="mt-1 font-mono text-base font-bold text-emerald-700">
              {answeredCount}
            </p>
            <p className="text-3xs font-semibold text-emerald-800">Answered</p>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3">
            <HelpCircle className="mx-auto size-4 text-rose-600" />
            <p className="mt-1 font-mono text-base font-bold text-rose-700">
              {unattemptedCount}
            </p>
            <p className="text-3xs font-semibold text-rose-800">Unanswered</p>
          </div>

          <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3">
            <Flag className="mx-auto size-4 text-purple-600" />
            <p className="mt-1 font-mono text-base font-bold text-purple-700">
              {markedCount}
            </p>
            <p className="text-3xs font-semibold text-purple-800">Review</p>
          </div>
        </div>

        {/* Time Remaining Warning */}
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
          <Clock className="size-4 shrink-0 text-amber-600" />
          <p>
            You still have <strong>{formatExamTimer(secondsRemaining)}</strong> remaining.
          </p>
        </div>

        <DialogFooter className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-full text-xs font-semibold"
          >
            Return to Exam
          </Button>
          <Button
            onClick={onConfirmSubmit}
            disabled={isSubmitting}
            className="rounded-full bg-brand-red text-xs font-bold text-white shadow-primary hover:bg-brand-red-hover disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                Sealing Attempt &amp; Evaluating...
              </>
            ) : (
              <>
                <Send className="mr-1.5 size-4" />
                Confirm &amp; Final Submit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------------
// 2. EXIT CONFIRMATION DIALOG
// ----------------------------------------------------------------------------

interface ExitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExit: () => void;
}

export function ExitConfirmDialog({
  open,
  onOpenChange,
  onExit,
}: ExitConfirmDialogProps) {
  return (
    <ExamExitConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onExit={onExit}
      title="Exit to Dashboard?"
      description="Your examination timer continues running in the background. You can resume this attempt from your Student Dashboard before the test window expires."
      cancelLabel="Continue Examination"
      confirmLabel="Exit Dashboard"
      titleIcon={<AlertTriangle className="size-5 text-rose-600" />}
      confirmIcon={<LogOut className="mr-1.5 size-3.5" />}
    />
  );
}

// ----------------------------------------------------------------------------
// 3. MOBILE QUESTION PALETTE DIALOG
// ----------------------------------------------------------------------------

interface MobilePaletteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: ExamQuestion[];
  visibleIndices: number[];
  currentIndex: number;
  summaryCounts: SummaryCounts;
  attemptedCount: number;
  remainingCount: number;
  progressPercent: number;
  getQuestionStatus: (qId: string) => QuestionStatus;
  onJumpTo: (index: number) => void;
  onSubmitClick: () => void;
}

export function MobilePaletteDialog({
  open,
  onOpenChange,
  questions,
  visibleIndices,
  currentIndex,
  summaryCounts,
  attemptedCount,
  remainingCount: _remainingCount,
  progressPercent,
  getQuestionStatus,
  onJumpTo,
  onSubmitClick,
}: MobilePaletteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-4 sm:p-5 max-h-[85vh] flex flex-col">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <LayoutGrid className="size-4 text-brand-red" />
              <span>Question Palette</span>
            </DialogTitle>
          </div>
          <DialogDescription className="text-3xs text-slate-500 font-mono">
            {attemptedCount}/{questions.length} Attempted ({progressPercent}%)
          </DialogDescription>
        </DialogHeader>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-3xs font-semibold text-slate-700 border-y border-slate-100 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="grid size-4 place-items-center rounded bg-emerald-600 text-white font-mono text-3xs font-bold">
              {summaryCounts.answered}
            </span>
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="grid size-4 place-items-center rounded bg-rose-600 text-white font-mono text-3xs font-bold">
              {summaryCounts.notAnswered}
            </span>
            <span>Not Answered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="grid size-4 place-items-center rounded bg-purple-600 text-white font-mono text-3xs font-bold">
              {summaryCounts.marked}
            </span>
            <span>Marked Review</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative grid size-4 place-items-center rounded bg-purple-600 text-white font-mono text-3xs font-bold">
              {summaryCounts.answeredAndMarked}
              <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-400 ring-1 ring-white" />
            </span>
            <span>Ans &amp; Marked</span>
          </div>
        </div>

        {/* Numbers Grid */}
        <div className="flex-1 overflow-y-auto py-3">
          <div className="grid grid-cols-5 gap-2">
            {visibleIndices.map((qIdx) => {
              const q = questions[qIdx];
              const isCurrent = qIdx === currentIndex;
              const status = getQuestionStatus(q.id);

              let bgClass = "bg-slate-100 text-slate-700 border-slate-200";
              if (status === "answered") bgClass = "bg-emerald-600 text-white border-emerald-700";
              else if (status === "unanswered") bgClass = "bg-rose-600 text-white border-rose-700";
              else if (status === "marked_for_review") bgClass = "bg-purple-600 text-white border-purple-700";
              else if (status === "answered_and_marked") bgClass = "bg-purple-600 text-white border-purple-700";

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    onJumpTo(qIdx);
                    onOpenChange(false);
                  }}
                  className={`flex h-8 w-full items-center justify-center rounded-lg border font-mono text-xs font-bold ${bgClass} ${
                    isCurrent ? "ring-2 ring-brand-blue ring-offset-1" : ""
                  }`}
                >
                  {qIdx + 1}
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-slate-100">
          <Button
            onClick={() => {
              onOpenChange(false);
              onSubmitClick();
            }}
            className="w-full rounded-full bg-brand-red text-xs font-bold text-white shadow-primary hover:bg-brand-red-hover"
          >
            <Send className="mr-1.5 size-3.5" />
            Submit Examination
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
