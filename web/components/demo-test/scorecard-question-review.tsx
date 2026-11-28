"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Languages,
  Lightbulb,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type DemoQuestion,
  type ScorecardReport,
  type UserAnswerRecord,
} from "./demo-test.types";
import { ScorecardReviewItem } from "./scorecard-review-item";

export interface ScorecardQuestionReviewProps {
  questions: DemoQuestion[];
  answers: Record<string, UserAnswerRecord>;
  report: ScorecardReport;
  initialLanguage?: "en" | "ta";
}

export function ScorecardQuestionReview({
  questions,
  answers,
  report,
  initialLanguage = "ta",
}: ScorecardQuestionReviewProps) {
  const [filter, setFilter] = useState<"all" | "correct" | "wrong" | "skipped">(
    "all",
  );
  const [langTab, setLangTab] = useState<"en" | "ta">(initialLanguage);
  const [expandedSolutions, setExpandedSolutions] = useState<
    Record<string, boolean>
  >({});

  const toggleSolution = (id: string) => {
    setExpandedSolutions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredQuestions = questions.filter((q) => {
    const record = answers[q.id];
    const selected = record?.selectedOptionId;
    if (!selected) return filter === "all" || filter === "skipped";

    const opt = q.options.find((o) => o.id === selected);
    const isCorrect = opt?.isCorrect ?? false;

    if (filter === "correct") return isCorrect;
    if (filter === "wrong") return !isCorrect;
    return true;
  });

  const allFilteredExpanded =
    filteredQuestions.length > 0 &&
    filteredQuestions.every((q) => expandedSolutions[q.id]);

  const handleToggleAllSolutions = () => {
    if (allFilteredExpanded) {
      setExpandedSolutions({});
    } else {
      const next: Record<string, boolean> = {};
      questions.forEach((q) => {
        next[q.id] = true;
      });
      setExpandedSolutions(next);
    }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center">
        <div className="space-y-0.5">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 sm:text-lg">
            <Lightbulb className="size-5 text-amber-500" />
            <span>Comprehensive Bilingual Solution Keys</span>
          </h3>
          <p className="text-xs text-slate-500">
            Review each question with candidate choice, verified answer, and
            step-by-step reasoning.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 self-start rounded-full border border-slate-200 bg-slate-50 p-1 text-xs md:self-auto">
          <span className="hidden items-center gap-1 pl-2.5 pr-1 text-2xs font-bold uppercase tracking-wider text-slate-400 sm:inline-flex">
            <Languages className="size-3.5 text-brand-blue" />
            <span>Language:</span>
          </span>
          <button
            type="button"
            onClick={() => setLangTab("ta")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              langTab === "ta"
                ? "bg-brand-red font-bold text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            தமிழ் + English (Both)
          </button>
          <button
            type="button"
            onClick={() => setLangTab("en")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              langTab === "en"
                ? "border border-slate-200/80 bg-white font-bold text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            English (Only)
          </button>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-2 sm:flex-row sm:items-center sm:p-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="hidden px-2 text-2xs font-bold uppercase tracking-wider text-slate-400 lg:inline">
            Filter:
          </span>

          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === "all"
                ? "bg-brand-blue font-bold text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>All Questions</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-2xs font-bold ${
                filter === "all"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {questions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("correct")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === "correct"
                ? "bg-emerald-600 font-bold text-white shadow-xs"
                : "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            <CheckCircle2 className="size-3.5" />
            <span>Correct</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-2xs font-bold ${
                filter === "correct"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {report.correctCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("wrong")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === "wrong"
                ? "bg-rose-600 font-bold text-white shadow-xs"
                : "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
            }`}
          >
            <XCircle className="size-3.5" />
            <span>Incorrect</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-2xs font-bold ${
                filter === "wrong"
                  ? "bg-white/20 text-white"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {report.wrongCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("skipped")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === "skipped"
                ? "bg-slate-700 font-bold text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <HelpCircle className="size-3.5" />
            <span>Skipped</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-2xs font-bold ${
                filter === "skipped"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {report.skippedCount}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 px-2 sm:px-1">
          <span className="text-2xs font-medium text-slate-500">
            Showing{" "}
            <strong className="text-slate-900">
              {filteredQuestions.length}
            </strong>{" "}
            of {questions.length} questions
          </span>
          {filteredQuestions.length > 0 && (
            <button
              type="button"
              onClick={handleToggleAllSolutions}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-2xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-100 hover:text-slate-900"
            >
              {allFilteredExpanded ? (
                <>
                  <EyeOff className="size-3 text-slate-500" />
                  <span>Collapse All</span>
                </>
              ) : (
                <>
                  <Eye className="size-3 text-slate-500" />
                  <span>Expand All</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="space-y-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
          <p className="text-xs font-semibold text-slate-600">
            No questions found under this filter.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilter("all")}
            className="rounded-full text-xs font-medium"
          >
            Show All ({questions.length}) Questions
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => (
            <ScorecardReviewItem
              key={q.id}
              question={q}
              index={idx}
              record={answers[q.id]}
              langTab={langTab}
              expanded={Boolean(expandedSolutions[q.id])}
              onToggleSolution={() => toggleSolution(q.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
