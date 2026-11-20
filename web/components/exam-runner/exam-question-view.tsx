"use client";

import { ArrowLeft, ArrowRight, Clock, Eraser, Flag, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ExamQuestion, LanguageMode, StudentAnswerState } from "./exam.types";

export interface ExamQuestionViewProps {
  currentQuestion: ExamQuestion;
  currentIndex: number;
  totalQuestions: number;
  currentAnswer: StudentAnswerState;
  langMode: LanguageMode;
  onSelectOption: (optionId: string) => void;
  onClearResponse: () => void;
  onToggleMarkForReview: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function ExamQuestionView({
  currentQuestion,
  currentIndex,
  totalQuestions,
  currentAnswer,
  langMode,
  onSelectOption,
  onClearResponse,
  onToggleMarkForReview,
  onPrev,
  onNext,
}: ExamQuestionViewProps) {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <main className="flex flex-1 flex-col justify-between overflow-y-auto bg-white p-4 sm:p-6 lg:p-8">
      <div className="space-y-4">
        {/* Question Header Meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-brand-blue px-2.5 py-0.5 font-mono text-xs font-bold text-white">
              Question {currentIndex + 1}
            </span>
            <span className="text-xs font-bold text-slate-800">
              {currentQuestion.subject}
            </span>
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-2xs font-bold text-brand-blue border border-indigo-100">
              Section {currentQuestion.section || "A"}
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
                  {formatTime(currentAnswer.timeSpentSeconds || 0)}
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

        {/* Question Text */}
        <div className="space-y-2.5 text-sm sm:text-base font-medium text-slate-900 leading-relaxed">
          {langMode === "en" ? (
            <p className="whitespace-pre-line">{currentQuestion.textEn}</p>
          ) : (
            <div className="space-y-2">
              {currentQuestion.textTa && (
                <p className="text-slate-950 font-sans font-bold text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {currentQuestion.textTa}
                </p>
              )}
              <p className="text-slate-600 text-xs sm:text-sm border-l-2 border-brand-red/40 pl-2.5 italic whitespace-pre-line">
                {currentQuestion.textEn}
              </p>
            </div>
          )}
        </div>

        {/* Optional Question Image */}
        {currentQuestion.questionImageUrl && (
          <div className="relative my-3 max-h-72 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
            <img
              src={currentQuestion.questionImageUrl}
              alt="Question Diagram"
              className="mx-auto max-h-64 object-contain"
            />
          </div>
        )}

        {/* 4-Option List */}
        <div className="mt-4 space-y-2.5">
          {currentQuestion.options.map((opt, optIdx) => {
            const isSelected = currentAnswer.selectedOptionId === opt.id;
            const displayLabel = opt.label || String.fromCharCode(65 + optIdx);

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
                    {displayLabel}
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

                  {opt.imageUrl && (
                    <div className="mt-2 max-h-36 max-w-xs overflow-hidden rounded-lg border border-slate-200 bg-white p-1">
                      <img
                        src={opt.imageUrl}
                        alt={`Option ${displayLabel}`}
                        className="max-h-32 object-contain"
                      />
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearResponse}
            disabled={!currentAnswer.selectedOptionId}
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
              currentAnswer.markedForReview
                ? "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200"
                : "text-purple-700 border-purple-200 hover:bg-purple-50"
            }`}
          >
            <Flag className="size-3.5 mr-1" />
            {currentAnswer.markedForReview ? "Marked for Review" : "Mark for Review & Next"}
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
