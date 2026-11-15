"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DemoQuestion, QuestionStatus } from "./demo-test.types";

export interface SummaryCounts {
  answered: number;
  notAnswered: number;
  marked: number;
  answeredAndMarked: number;
  notVisited: number;
}

export interface DemoTestPaletteProps {
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
  isMobile?: boolean;
}

export function DemoTestPaletteContent({
  questions,
  visibleIndices,
  currentIndex,
  summaryCounts,
  attemptedCount,
  getQuestionStatus,
  onJumpTo,
}: Omit<DemoTestPaletteProps, "onSubmitClick" | "remainingCount" | "progressPercent" | "isMobile">) {
  return (
    <div className="space-y-3">
      {/* 01. Status Legend Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-2.5">
        <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">
          Question Status
        </p>

        <div className="grid grid-cols-2 gap-2 text-2xs font-semibold">
          {/* Answered */}
          <div className="flex items-center justify-between rounded-xl bg-emerald-50/80 border border-emerald-200/70 px-2.5 py-1.5 text-emerald-800">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">Answered</span>
            </div>
            <span className="font-bold font-mono ml-1">{attemptedCount}</span>
          </div>

          {/* Not Answered */}
          <div className="flex items-center justify-between rounded-xl bg-rose-50/80 border border-rose-200/70 px-2.5 py-1.5 text-rose-800">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="size-2 rounded-full bg-rose-500 shrink-0" />
              <span className="truncate">Not Answered</span>
            </div>
            <span className="font-bold font-mono ml-1">{summaryCounts.notAnswered}</span>
          </div>

          {/* Marked */}
          <div className="flex items-center justify-between rounded-xl bg-purple-50/80 border border-purple-200/70 px-2.5 py-1.5 text-purple-800">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="size-2 rounded-full bg-purple-600 shrink-0" />
              <span className="truncate">Marked</span>
            </div>
            <span className="font-bold font-mono ml-1">{summaryCounts.marked}</span>
          </div>

          {/* Not Visited */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-2.5 py-1.5 text-slate-700">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="size-2 rounded-full bg-slate-300 shrink-0" />
              <span className="truncate">Not Visited</span>
            </div>
            <span className="font-bold font-mono ml-1">{summaryCounts.notVisited}</span>
          </div>
        </div>
      </div>

      {/* 02. Questions Matrix Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">
            Questions ({visibleIndices.length})
          </p>
          <span className="text-2xs font-semibold text-slate-400 font-mono">
            Q{currentIndex + 1} Selected
          </span>
        </div>

        {/* Clean 5-Column Buttons Grid */}
        <div className="grid grid-cols-5 gap-2 place-items-center max-h-56 overflow-y-auto p-1">
          {visibleIndices.map((idx) => {
            const q = questions[idx];
            const status = getQuestionStatus(q.id);
            const isCurrent = idx === currentIndex;

            let btnStyle = "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200";
            if (status === "answered") {
              btnStyle = "bg-emerald-600 text-white border-emerald-600 shadow-2xs";
            } else if (status === "marked_for_review") {
              btnStyle = "bg-purple-600 text-white border-purple-600 shadow-2xs";
            } else if (status === "answered_and_marked") {
              btnStyle = "bg-purple-600 text-white border-2 border-emerald-400 shadow-2xs";
            } else if (status === "unanswered") {
              btnStyle = "bg-rose-500 text-white border-rose-500 shadow-2xs";
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onJumpTo(idx)}
                className={`grid size-10 place-items-center rounded-xl font-mono text-xs font-bold border transition cursor-pointer ${btnStyle} ${
                  isCurrent ? "scale-105 shadow-md font-black" : "hover:scale-[1.02]"
                }`}
                title={`Question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function DemoTestPaletteSidebar({
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
}: DemoTestPaletteProps) {
  return (
    <aside className="hidden lg:flex w-[360px] shrink-0 flex-col border-l border-slate-200 bg-slate-50/60 justify-between overflow-hidden">
      {/* Scrollable Upper Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        <DemoTestPaletteContent
          questions={questions}
          visibleIndices={visibleIndices}
          currentIndex={currentIndex}
          summaryCounts={summaryCounts}
          attemptedCount={attemptedCount}
          getQuestionStatus={getQuestionStatus}
          onJumpTo={onJumpTo}
        />
      </div>

      {/* Sticky Bottom Submission Block */}
      <div className="border-t border-slate-200 bg-white p-4 space-y-3 shadow-xs">
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

        <Button
          onClick={onSubmitClick}
          className="w-full rounded-xl bg-linear-to-r from-brand-red to-rose-600 hover:from-brand-red-hover hover:to-rose-700 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="size-4" />
          <span>Finish &amp; View Scorecard</span>
        </Button>

        <p className="text-3xs text-slate-400 text-center font-medium">
          Instant AI Scorecard &amp; Detailed Solutions
        </p>
      </div>
    </aside>
  );
}
