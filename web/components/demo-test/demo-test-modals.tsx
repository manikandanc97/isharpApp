"use client";

import { AlertTriangle, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatTime } from "./demo-test-calculator";
import type { DemoQuestion, QuestionStatus } from "./demo-test.types";
import { DemoTestPaletteContent, type SummaryCounts } from "./demo-test-palette";
import { ExamExitConfirmDialog } from "@/components/shared/examination/exam-confirm-dialog";

export interface MobilePaletteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: DemoQuestion[];
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
  remainingCount,
  progressPercent,
  getQuestionStatus,
  onJumpTo,
  onSubmitClick,
}: MobilePaletteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="shrink-0 space-y-1 border-b border-slate-100 px-5 py-4 pr-12">
          <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <LayoutGrid className="size-4 text-brand-red" />
            <span>Question Palette ({questions.length} Questions)</span>
          </DialogTitle>
          <DialogDescription className="text-2xs text-slate-500">
            Tap any question number to navigate directly.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <DemoTestPaletteContent
            questions={questions}
            visibleIndices={visibleIndices}
            currentIndex={currentIndex}
            summaryCounts={summaryCounts}
            attemptedCount={attemptedCount}
            getQuestionStatus={getQuestionStatus}
            onJumpTo={(idx) => {
              onJumpTo(idx);
              onOpenChange(false);
            }}
          />
        </div>

        <div className="shrink-0 space-y-3 border-t border-slate-100 px-5 py-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>
                  Attempted:{" "}
                  <strong className="text-slate-900">
                    {attemptedCount}/{questions.length}
                  </strong>{" "}
                  <span className="text-slate-400 font-normal">({progressPercent}%)</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="size-1.5 rounded-full bg-rose-500" />
                <span>
                  Pending: <strong className="text-slate-900">{remainingCount}</strong>
                </span>
              </div>
            </div>

            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl text-xs font-semibold"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onSubmitClick();
              }}
              className="flex-1 rounded-xl bg-brand-red text-xs font-bold text-white shadow-primary hover:bg-brand-red-hover"
            >
              Submit Test
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export interface SubmitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  answeredCount: number;
  unattemptedCount: number;
  markedCount: number;
  secondsRemaining: number;
  onConfirmSubmit: () => void;
}

export function SubmitConfirmDialog({
  open,
  onOpenChange,
  answeredCount,
  unattemptedCount,
  markedCount,
  secondsRemaining,
  onConfirmSubmit,
}: SubmitConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="space-y-2 pr-8">
          <div className="mx-auto grid size-10 place-items-center rounded-full bg-rose-50 text-brand-red">
            <AlertTriangle className="size-5" />
          </div>
          <DialogTitle className="text-center text-lg font-bold text-slate-900">
            Submit Demo Test?
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-slate-500">
            Review your attempt status below before final submission.
          </DialogDescription>
        </DialogHeader>

        <div className="my-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
            <span className="text-2xs text-slate-500 uppercase">Answered</span>
            <p className="text-base font-bold text-emerald-700">{answeredCount}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
            <span className="text-2xs text-slate-500 uppercase">Unattempted</span>
            <p className="text-base font-bold text-rose-600">{unattemptedCount}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
            <span className="text-2xs text-slate-500 uppercase">Marked for Review</span>
            <p className="text-base font-bold text-purple-700">{markedCount}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
            <span className="text-2xs text-slate-500 uppercase">Time Remaining</span>
            <p className="text-base font-bold text-brand-blue font-mono">
              {formatTime(secondsRemaining)}
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-full text-xs font-semibold"
          >
            Resume Test
          </Button>
          <Button
            onClick={onConfirmSubmit}
            className="flex-1 rounded-full bg-brand-red text-xs font-bold text-white shadow-primary hover:bg-brand-red-hover"
          >
            Yes, Submit Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface ExitConfirmDialogProps {
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
      title="Exit Demo Test?"
      description="Your ongoing progress will not be graded if you exit without submitting."
      cancelLabel="Keep Answering"
      confirmLabel="Exit Anyway"
      contentClassName="max-w-sm p-6"
      headerClassName="space-y-1 pr-8"
      descriptionClassName="text-xs text-slate-500"
      footerClassName="mt-4 flex flex-col sm:flex-row gap-2"
      cancelClassName="flex-1 rounded-full text-xs font-semibold"
      confirmClassName="flex-1 rounded-full text-xs font-semibold"
    />
  );
}
