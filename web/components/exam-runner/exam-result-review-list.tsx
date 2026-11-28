"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { QuestionDiagram } from "@/components/shared/questions/question-diagram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ExamResultPayload } from "./exam.types";

interface ExamResultReviewListProps {
  result: ExamResultPayload;
  onBackToDashboard: () => void;
}

export function ExamResultReviewList({
  result,
  onBackToDashboard,
}: ExamResultReviewListProps) {
  const [filterMode, setFilterMode] = useState<
    "ALL" | "CORRECT" | "INCORRECT" | "SKIPPED"
  >("ALL");
  const [expandedQuestions, setExpandedQuestions] = useState<
    Record<string, boolean>
  >({});

  const hasReview = Boolean(result.review && result.review.length > 0);

  const toggleQuestion = (qId: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const filteredReview = (result.review || []).filter((item) => {
    if (filterMode === "CORRECT") return item.isCorrect;
    if (filterMode === "INCORRECT") {
      return item.selectedOptionId && !item.isCorrect;
    }
    if (filterMode === "SKIPPED") return !item.selectedOptionId;
    return true;
  });

  if (!hasReview) {
    return (
      <section className="space-y-3 rounded-3xl border border-amber-200 bg-amber-50/70 p-6 text-center sm:p-8">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-amber-100 text-amber-700">
          <Lock className="size-6" />
        </div>
        <h3 className="text-base font-bold text-amber-950">
          Examination Sealed &amp; Under Security Window
        </h3>
        <p className="mx-auto max-w-md text-xs leading-relaxed text-amber-900">
          Your response paper has been securely recorded. Detailed
          question-by-question keys, solutions, and cohort percentiles will be
          released according to academy guidelines.
        </p>
        <div className="pt-2">
          <Button
            onClick={onBackToDashboard}
            className="rounded-full bg-amber-700 text-xs font-semibold text-white hover:bg-amber-800"
          >
            Return to Student Dashboard
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Question-by-Question Solution Review
          </h3>
          <p className="text-xs text-slate-500">
            Review your responses alongside verified official answer keys and
            step-by-step explanations.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-slate-100 p-1 text-2xs font-semibold">
          {(
            [
              ["ALL", `All (${result.review?.length})`, "bg-white text-slate-900"],
              [
                "CORRECT",
                `Correct (${result.correctCount})`,
                "bg-emerald-600 text-white",
              ],
              [
                "INCORRECT",
                `Incorrect (${result.incorrectCount})`,
                "bg-rose-600 text-white",
              ],
              [
                "SKIPPED",
                `Skipped (${result.unansweredCount})`,
                "bg-slate-700 text-white",
              ],
            ] as const
          ).map(([mode, label, activeCls]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterMode(mode)}
              className={`rounded-full px-2.5 py-1 transition ${
                filterMode === mode
                  ? `${activeCls} font-bold shadow-2xs`
                  : "text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredReview.map((item) => {
          const isExpanded = expandedQuestions[item.questionId] ?? true;
          const statusBadge = item.isCorrect ? (
            <Badge className="border-emerald-300 bg-emerald-100 text-3xs font-bold text-emerald-800">
              +4 Marks (Correct)
            </Badge>
          ) : item.selectedOptionId ? (
            <Badge className="border-rose-300 bg-rose-100 text-3xs font-bold text-rose-800">
              -1 Mark (Incorrect)
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-3xs font-bold text-slate-500"
            >
              0 Marks (Skipped)
            </Badge>
          );

          return (
            <article
              key={item.questionId}
              className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs"
            >
              <div
                onClick={() => toggleQuestion(item.questionId)}
                className="flex cursor-pointer items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    Q{item.position}.
                  </span>
                  {statusBadge}
                </div>
                <button
                  type="button"
                  className="text-slate-400 transition hover:text-slate-600"
                >
                  {isExpanded ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="space-y-3 pt-2">
                  {item.textTa && (
                    <p className="whitespace-pre-line font-sans text-sm font-bold leading-relaxed text-slate-900">
                      {item.textTa}
                    </p>
                  )}
                  {item.textEn && (
                    <p
                      className={`whitespace-pre-line leading-relaxed ${
                        item.textTa
                          ? "border-l-2 border-brand-red/30 pl-2 text-xs italic text-slate-700"
                          : "text-sm font-medium text-slate-900"
                      }`}
                    >
                      {item.textEn}
                    </p>
                  )}
                  {item.questionImageUrl && (
                    <QuestionDiagram
                      src={item.questionImageUrl}
                      alt="Question Diagram"
                      className="max-h-48 rounded-lg border border-slate-200 object-contain p-1"
                    />
                  )}

                  <div className="space-y-2 pt-2">
                    {item.options.map((opt, optIdx) => {
                      const isUserChoice = item.selectedOptionId === opt.id;
                      const isCanonicalCorrect = opt.isCorrect;
                      const legacy = ["A", "B", "C", "D"];
                      const legacyIdx = opt.label
                        ? legacy.indexOf(opt.label.toUpperCase())
                        : -1;
                      const displayLabel =
                        legacyIdx !== -1
                          ? String(legacyIdx + 1)
                          : /^[0-9]+$/.test(opt.label ?? "")
                            ? String(opt.label)
                            : String(optIdx + 1);

                      let optStyle =
                        "border-slate-200 bg-slate-50/50 text-slate-700";
                      if (isCanonicalCorrect) {
                        optStyle =
                          "border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500/30";
                      } else if (isUserChoice && !isCanonicalCorrect) {
                        optStyle =
                          "border-rose-500 bg-rose-50 text-rose-950 line-through ring-1 ring-rose-500/30";
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-xs ${optStyle}`}
                        >
                          <span className="font-mono font-bold">
                            ({displayLabel})
                          </span>
                          <div className="flex-1">
                            {opt.textTa && (
                              <span className="block font-semibold">
                                {opt.textTa}
                              </span>
                            )}
                            {opt.textEn && (
                              <span
                                className={`block ${opt.textTa ? "text-3xs opacity-80" : ""}`}
                              >
                                {opt.textEn}
                              </span>
                            )}
                          </div>
                          {isCanonicalCorrect && (
                            <span className="rounded bg-emerald-600 px-1.5 py-0.2 font-mono text-3xs font-bold text-white">
                              CORRECT
                            </span>
                          )}
                          {isUserChoice && !isCanonicalCorrect && (
                            <span className="rounded bg-rose-600 px-1.5 py-0.2 font-mono text-3xs font-bold text-white">
                              YOUR CHOICE
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {(item.solutionEn || item.solutionTa) && (
                    <div className="mt-3 space-y-1 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 text-xs text-indigo-950">
                      <p className="flex items-center gap-1.5 font-bold text-brand-blue">
                        <BookOpen className="size-3.5" />
                        Official Solution &amp; Key Explanation
                      </p>
                      {item.solutionTa && (
                        <p className="font-sans font-semibold leading-relaxed">
                          {item.solutionTa}
                        </p>
                      )}
                      {item.solutionEn && (
                        <p
                          className={`leading-relaxed ${
                            item.solutionTa
                              ? "border-t border-indigo-100 pt-1 text-3xs text-indigo-900"
                              : ""
                          }`}
                        >
                          {item.solutionEn}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
