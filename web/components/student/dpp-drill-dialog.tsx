"use client";

import { CheckCircle2, ChevronRight, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sampleDPPQuestions } from "@/data/sample-dpp";
import { cn } from "@/lib/utils";

export interface DppDrillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentQIndex: number;
  setCurrentQIndex: (action: number | ((prev: number) => number)) => void;
  selectedAnswer: string | null;
  setSelectedAnswer: (answer: string | null) => void;
  showExplanation: boolean;
  setShowExplanation: (show: boolean) => void;
  setSolvedCount: (action: number | ((prev: number) => number)) => void;
}

export function DppDrillDialog({
  open,
  onOpenChange,
  currentQIndex,
  setCurrentQIndex,
  selectedAnswer,
  setSelectedAnswer,
  showExplanation,
  setShowExplanation,
  setSolvedCount,
}: DppDrillDialogProps) {
  const currentQuestion = sampleDPPQuestions[currentQIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl p-6 sm:p-8">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-brand-red font-semibold text-xs">
              Question {currentQIndex + 1} of {sampleDPPQuestions.length} • {currentQuestion.subject}
            </Badge>
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-600">
              <Clock3 className="size-3.5 text-brand-red" />
              <span>01:45 remaining</span>
            </div>
          </div>
          <DialogTitle className="mt-3 text-base sm:text-lg font-semibold text-slate-900">
            {currentQuestion.topic}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Select your answer. Verified explanation and Tamil translation are rendered instantaneously.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
              {currentQuestion.questionEn}
            </p>
            <p className="mt-2 text-xs sm:text-sm text-slate-700 font-tamil leading-relaxed">
              {currentQuestion.questionTa}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {currentQuestion.options.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  setSelectedAnswer(opt.label);
                  setShowExplanation(true);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border p-3.5 text-left text-xs sm:text-sm transition-all",
                  selectedAnswer === opt.label
                    ? opt.label === currentQuestion.correctOption
                      ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold"
                      : "border-rose-400 bg-rose-50 text-rose-950 font-semibold"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-md bg-slate-200/80 font-mono text-xs font-semibold text-slate-700">
                    {opt.label}
                  </span>
                  <span className="font-medium text-slate-800">{opt.textEn}</span>
                </div>
                {selectedAnswer === opt.label && opt.label === currentQuestion.correctOption && (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                )}
              </button>
            ))}
          </div>

          {/* Verified Explanation Box */}
          {showExplanation && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-950 animate-in fade-in duration-200">
              <p className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-700" />
                Correct Option: {currentQuestion.correctOption}
              </p>
              <p className="mt-1 text-slate-700 leading-relaxed">{currentQuestion.explanationEn}</p>
              <p className="mt-1 text-slate-700 font-tamil leading-relaxed">{currentQuestion.explanationTa}</p>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentQIndex === 0}
              onClick={() => {
                setCurrentQIndex((prev) => Math.max(0, prev - 1));
                setSelectedAnswer(null);
                setShowExplanation(false);
              }}
              className="rounded-full text-xs"
            >
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {currentQIndex < sampleDPPQuestions.length - 1 ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setCurrentQIndex((prev) => prev + 1);
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                    setSolvedCount((c) => Math.min(15, c + 1));
                  }}
                  className="rounded-full bg-brand-red px-4 text-xs font-semibold text-white hover:bg-brand-red-hover"
                >
                  <span>Next Question</span>
                  <ChevronRight className="ml-1 size-3" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    setSolvedCount(15);
                  }}
                  className="rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="mr-1 size-3.5" />
                  <span>Complete DPP Drill</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

