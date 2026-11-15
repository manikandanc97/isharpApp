"use client";

import { ArrowLeft, ArrowRight, Clock, Eraser, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTime } from "./demo-test-calculator";
import {
  getNeetOptionLabel,
  type DemoQuestion,
  type UserAnswerRecord,
} from "./demo-test.types";

export interface DemoTestQuestionViewProps {
  currentQuestion: DemoQuestion;
  currentIndex: number;
  totalQuestions: number;
  currentRecord: UserAnswerRecord;
  langMode: "en" | "ta";
  onSelectOption: (optionId: string) => void;
  onClearResponse: () => void;
  onToggleMarkForReview: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function DemoTestQuestionView({
  currentQuestion,
  currentIndex,
  totalQuestions,
  currentRecord,
  langMode,
  onSelectOption,
  onClearResponse,
  onToggleMarkForReview,
  onPrev,
  onNext,
}: DemoTestQuestionViewProps) {
  return (
    <main className="flex flex-1 flex-col justify-between overflow-y-auto bg-white p-4 sm:p-6 lg:p-8">
      <div className="space-y-4">
        {/* Question Header Meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-brand-blue px-2 py-0.5 font-mono text-xs font-bold text-white">
              Question {currentIndex + 1}
            </span>
            <span className="text-xs font-bold text-slate-700">
              {currentQuestion.subject}
            </span>
            {currentQuestion.chapterTitle && (
              <span className="hidden sm:inline text-xs text-slate-400">
                • {currentQuestion.chapterTitle}
              </span>
            )}
            <Badge
              variant="outline"
              className="text-2xs font-semibold uppercase bg-slate-50 border-slate-200 text-slate-600"
            >
              {currentQuestion.difficulty}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-2xs font-semibold">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200/90 px-2.5 py-0.5 text-slate-700 font-mono text-2xs">
              <Clock className="size-3 text-brand-blue" />
              <span>
                Time on Q:{" "}
                <strong className="text-slate-900">
                  {formatTime(currentRecord.timeSpentSeconds || 0)}
                </strong>
              </span>
            </span>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700 border border-emerald-200">
              +{currentQuestion.correctMarks} Marks
            </span>
            <span className="rounded-md bg-rose-50 px-2 py-0.5 text-rose-700 border border-rose-200">
              -{currentQuestion.negativeMarks} Marks
            </span>
          </div>
        </div>

        {/* Question Stem Text */}
        <div className="space-y-2 text-sm sm:text-base font-medium text-slate-900 leading-relaxed">
          {langMode === "en" ? (
            <p>{currentQuestion.textEn}</p>
          ) : (
            <div className="space-y-1.5">
              {currentQuestion.textTa && (
                <p className="text-slate-950 font-sans font-bold text-sm sm:text-base leading-relaxed">
                  {currentQuestion.textTa}
                </p>
              )}
              <p className="text-slate-600 text-xs sm:text-sm border-l-2 border-brand-red/40 pl-2.5 italic">
                {currentQuestion.textEn}
              </p>
            </div>
          )}
        </div>

        {/* Options List */}
        <div className="mt-4 space-y-2.5">
          {currentQuestion.options.map((opt, optIdx) => {
            const isSelected = currentRecord.selectedOptionId === opt.id;
            return (
              <label
                key={opt.id}
                onClick={() => onSelectOption(opt.id)}
                className={`flex items-start gap-3 rounded-2xl border p-3.5 sm:p-4 cursor-pointer transition-all ${
                  isSelected
                    ? "border-brand-red bg-rose-50/60 ring-2 ring-brand-red/30 shadow-xs"
                    : "border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="mt-0.5 flex items-center">
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold transition ${
                      isSelected
                        ? "bg-brand-red text-white shadow-2xs"
                        : "bg-white text-slate-700 border border-slate-300"
                    }`}
                  >
                    {getNeetOptionLabel(opt.label, optIdx)}
                  </span>
                </div>

                <div className="min-w-0 flex-1 space-y-1 text-xs sm:text-sm text-slate-800">
                  {langMode === "en" ? (
                    <p className={isSelected ? "font-semibold text-slate-950" : "font-normal"}>
                      {opt.textEn}
                    </p>
                  ) : (
                    <div className="space-y-0.5">
                      {opt.textTa && (
                        <p
                          className={
                            isSelected
                              ? "font-bold text-slate-950 font-sans"
                              : "font-semibold text-slate-900 font-sans"
                          }
                        >
                          {opt.textTa}
                        </p>
                      )}
                      <p className="text-2xs sm:text-xs text-slate-500 font-sans">
                        {opt.textEn}
                      </p>
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Control Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearResponse}
            disabled={!currentRecord.selectedOptionId}
            className="rounded-full text-xs font-semibold text-slate-600 border-slate-300 hover:text-rose-600 hover:border-rose-300"
          >
            <Eraser className="size-3.5 mr-1" />
            Clear Response
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleMarkForReview}
            className={`rounded-full text-xs font-semibold ${
              currentRecord.markedForReview
                ? "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200"
                : "text-purple-700 border-purple-200 hover:bg-purple-50"
            }`}
          >
            <Flag className="size-3.5 mr-1" />
            {currentRecord.markedForReview ? "Marked for Review" : "Mark for Review & Next"}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={currentIndex === 0}
            className="rounded-full text-xs font-semibold text-slate-700 border-slate-300"
          >
            <ArrowLeft className="size-3.5 mr-1" />
            Previous
          </Button>

          <Button
            size="sm"
            onClick={onNext}
            disabled={currentIndex === totalQuestions - 1}
            className="rounded-full bg-brand-blue text-xs font-semibold text-white hover:bg-brand-blue-hover"
          >
            Save &amp; Next
            <ArrowRight className="size-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </main>
  );
}
