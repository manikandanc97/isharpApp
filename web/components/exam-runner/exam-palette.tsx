"use client";

import { LayoutGrid, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExamQuestion, QuestionStatus } from "./exam.types";

export interface SummaryCounts {
  answered: number;
  notAnswered: number;
  marked: number;
  answeredAndMarked: number;
  notVisited: number;
}

interface ExamPaletteProps {
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

export function ExamPaletteSidebar({
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
}: ExamPaletteProps) {
  return (
    <aside className="hidden md:flex w-72 lg:w-80 flex-col shrink-0 border-l border-slate-200 bg-white">
      {/* Palette Legend */}
      <div className="border-b border-slate-200 bg-slate-50/60 p-3 sm:p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
            <LayoutGrid className="size-3.5 text-brand-red" />
            <span>Question Palette</span>
          </div>
          <span className="text-3xs font-mono font-semibold text-slate-500">
            {attemptedCount}/{questions.length} Attempted ({progressPercent}%)
          </span>
        </div>

        {/* Legend Grid */}
        <div className="grid grid-cols-2 gap-2 text-3xs font-semibold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="grid size-5 place-items-center rounded bg-emerald-600 text-white font-mono text-2xs font-bold">
              {summaryCounts.answered}
            </span>
            <span className="truncate">Answered</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="grid size-5 place-items-center rounded bg-rose-600 text-white font-mono text-2xs font-bold">
              {summaryCounts.notAnswered}
            </span>
            <span className="truncate">Not Answered</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="grid size-5 place-items-center rounded bg-purple-600 text-white font-mono text-2xs font-bold">
              {summaryCounts.marked}
            </span>
            <span className="truncate">Marked Review</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="relative grid size-5 place-items-center rounded bg-purple-600 text-white font-mono text-2xs font-bold">
              {summaryCounts.answeredAndMarked}
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 ring-1 ring-white" />
            </span>
            <span className="truncate">Ans &amp; Marked</span>
          </div>

          <div className="flex items-center gap-1.5 col-span-2">
            <span className="grid size-5 place-items-center rounded bg-slate-200 text-slate-700 font-mono text-2xs font-bold">
              {summaryCounts.notVisited}
            </span>
            <span className="truncate">Not Visited</span>
          </div>
        </div>
      </div>

      {/* Question Grid Buttons */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="grid grid-cols-5 gap-2">
          {visibleIndices.map((qIdx) => {
            const q = questions[qIdx];
            const isCurrent = qIdx === currentIndex;
            const status = getQuestionStatus(q.id);

            let bgClass = "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200";
            if (status === "answered") {
              bgClass = "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700";
            } else if (status === "unanswered") {
              bgClass = "bg-rose-600 text-white hover:bg-rose-700 border-rose-700";
            } else if (status === "marked_for_review") {
              bgClass = "bg-purple-600 text-white hover:bg-purple-700 border-purple-700";
            } else if (status === "answered_and_marked") {
              bgClass = "bg-purple-600 text-white hover:bg-purple-700 border-purple-700 relative";
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onJumpTo(qIdx)}
                className={`relative flex h-9 w-full items-center justify-center rounded-lg border font-mono text-xs font-bold transition-all ${bgClass} ${
                  isCurrent ? "ring-2 ring-brand-blue ring-offset-2 scale-105 z-10" : ""
                }`}
              >
                <span>{qIdx + 1}</span>
                {status === "answered_and_marked" && (
                  <span className="absolute -top-1 -right-1 size-2 rounded-full bg-emerald-400 ring-1 ring-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Palette Footer Submit */}
      <div className="border-t border-slate-200 bg-slate-50 p-3 sm:p-4">
        <Button
          onClick={onSubmitClick}
          className="w-full rounded-full bg-brand-red text-xs font-bold text-white shadow-primary hover:bg-brand-red-hover cursor-pointer"
        >
          <Send className="mr-1.5 size-3.5" />
          Submit Examination
        </Button>
      </div>
    </aside>
  );
}
