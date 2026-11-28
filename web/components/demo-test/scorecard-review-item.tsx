"use client";

import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  HelpCircle,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "./demo-test-calculator";
import {
  getNeetOptionLabel,
  type DemoQuestion,
  type UserAnswerRecord,
} from "./demo-test.types";

interface ScorecardReviewItemProps {
  question: DemoQuestion;
  index: number;
  record?: UserAnswerRecord;
  langTab: "en" | "ta";
  expanded: boolean;
  onToggleSolution: () => void;
}

export function ScorecardReviewItem({
  question: q,
  index: idx,
  record,
  langTab,
  expanded,
  onToggleSolution,
}: ScorecardReviewItemProps) {
  const timeSpent = record?.timeSpentSeconds ?? 0;
  const chosenId = record?.selectedOptionId;
  const chosenOption = q.options.find((o) => o.id === chosenId);
  const isCorrect = chosenOption?.isCorrect ?? false;
  const isSkipped = !chosenId;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-800">
            Q{idx + 1}.
          </span>
          <Badge
            variant="outline"
            className="border-slate-200 bg-slate-50 text-2xs font-semibold uppercase text-slate-700"
          >
            {q.subject}
          </Badge>
          {q.chapterTitle && (
            <span className="text-2xs font-medium text-slate-500">
              • {q.chapterTitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200/90 bg-slate-100 px-2 py-0.5 font-mono text-2xs font-bold text-slate-700">
            <Clock className="size-3 text-brand-blue" />
            <span>
              {timeSpent > 0
                ? `${formatTime(timeSpent)} (${timeSpent}s)`
                : "0s (Rapid)"}
            </span>
          </span>

          {timeSpent > 0 && !isSkipped && (
            <span
              className={`hidden rounded px-1.5 py-0.5 text-3xs font-extrabold uppercase sm:inline-block ${
                timeSpent <= 40
                  ? "bg-emerald-100 text-emerald-800"
                  : timeSpent <= 80
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
              }`}
            >
              {timeSpent <= 40
                ? "⚡ Fast Pace"
                : timeSpent <= 80
                  ? "⏱️ Ideal Pace"
                  : "⏳ High Time"}
            </span>
          )}

          {isSkipped ? (
            <Badge
              variant="outline"
              className="border-slate-300 bg-slate-100 text-2xs font-semibold text-slate-600"
            >
              <HelpCircle className="mr-1 size-3" />
              Skipped (0 Marks)
            </Badge>
          ) : isCorrect ? (
            <Badge
              variant="outline"
              className="border-emerald-300 bg-emerald-50 text-2xs font-bold text-emerald-800"
            >
              <CheckCircle2 className="mr-1 size-3 text-emerald-600" />
              Correct (+4 Marks)
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-rose-300 bg-rose-50 text-2xs font-bold text-rose-800"
            >
              <XCircle className="mr-1 size-3 text-rose-600" />
              Incorrect (-1 Mark)
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-1.5 text-xs font-medium text-slate-900 sm:text-sm">
        {langTab === "en" ? (
          <p className="leading-relaxed">{q.textEn}</p>
        ) : (
          <div className="space-y-1">
            {q.textTa && (
              <p className="font-sans font-bold leading-relaxed text-slate-950">
                {q.textTa}
              </p>
            )}
            <p className="border-l-2 border-brand-red/30 pl-2 text-xs italic leading-relaxed text-slate-600">
              {q.textEn}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
        {q.options.map((opt, optIdx) => {
          const isCandidateChoice = opt.id === chosenId;
          const isTheCorrectOne = opt.isCorrect;

          let cardStyle = "border-slate-200 bg-slate-50/50 text-slate-700";
          if (isTheCorrectOne) {
            cardStyle =
              "border-emerald-500 bg-emerald-50/80 text-emerald-950 font-semibold ring-1 ring-emerald-500/20";
          } else if (isCandidateChoice && !isTheCorrectOne) {
            cardStyle =
              "border-rose-400 bg-rose-50/80 text-rose-950 font-semibold";
          }

          return (
            <div
              key={opt.id}
              className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-xs transition ${cardStyle}`}
            >
              <span
                className={`grid size-5.5 shrink-0 place-items-center rounded-md font-mono text-xs font-bold ${
                  isTheCorrectOne
                    ? "bg-emerald-600 text-white"
                    : isCandidateChoice
                      ? "bg-rose-600 text-white"
                      : "bg-slate-200 text-slate-700"
                }`}
              >
                {getNeetOptionLabel(opt.label, optIdx)}
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                {langTab === "en" ? (
                  <p>{opt.textEn}</p>
                ) : (
                  <div>
                    {opt.textTa && (
                      <p className="font-semibold text-slate-900">
                        {opt.textTa}
                      </p>
                    )}
                    <p className="text-2xs text-slate-500">{opt.textEn}</p>
                  </div>
                )}
                {isCandidateChoice && (
                  <span className="mt-0.5 inline-block text-2xs font-bold uppercase tracking-wider text-slate-500">
                    (Your Choice)
                  </span>
                )}
              </div>
              {isTheCorrectOne && (
                <CheckCircle2 className="size-4 shrink-0 self-center text-emerald-600" />
              )}
              {isCandidateChoice && !isTheCorrectOne && (
                <XCircle className="size-4 shrink-0 self-center text-rose-600" />
              )}
            </div>
          );
        })}
      </div>

      {(q.solutionEn || q.solutionTa) && (
        <div className="space-y-2.5 border-t border-slate-100 pt-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onToggleSolution}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                expanded
                  ? "border border-amber-200 bg-amber-100 font-bold text-amber-950"
                  : "border border-amber-200/80 bg-amber-50/80 text-amber-900 shadow-2xs hover:bg-amber-100/80"
              }`}
            >
              <Sparkles className="size-3.5 text-amber-600" />
              <span>
                {expanded
                  ? "விளக்கம் மறைக்க / Hide Solution"
                  : "விளக்கம் பார்க்க / View Solution & Explanation"}
              </span>
              {expanded ? (
                <ChevronUp className="size-3.5 text-amber-700" />
              ) : (
                <ChevronDown className="size-3.5 text-amber-700" />
              )}
            </button>

            <span className="hidden text-2xs font-medium text-slate-400 sm:inline">
              {expanded ? "Click to collapse" : "NTA Concept Explanation"}
            </span>
          </div>

          {expanded && (
            <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs animate-in fade-in-50 duration-200">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <Sparkles className="size-4 text-amber-600" />
                <span>விரிவான விளக்கம் / Step-by-Step Concept Key:</span>
              </div>
              {langTab === "en" ? (
                <p className="font-sans leading-relaxed text-slate-800">
                  {q.solutionEn}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {q.solutionTa && (
                    <p className="font-sans font-semibold leading-relaxed text-slate-950">
                      {q.solutionTa}
                    </p>
                  )}
                  {q.solutionEn && (
                    <p className="border-t border-amber-200/70 pt-1.5 font-sans text-2xs leading-relaxed text-slate-600">
                      {q.solutionEn}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
