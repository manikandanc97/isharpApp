"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  EyeOff,
  HelpCircle,
  Languages,
  Lightbulb,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTime } from "./demo-test-calculator";
import {
  getNeetOptionLabel,
  type DemoQuestion,
  type ScorecardReport,
  type UserAnswerRecord,
} from "./demo-test.types";

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
  const [filter, setFilter] = useState<"all" | "correct" | "wrong" | "skipped">("all");
  const [langTab, setLangTab] = useState<"en" | "ta">(initialLanguage);
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});

  const toggleSolution = (id: string) => {
    setExpandedSolutions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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
    <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
      {/* Tier 1 Header: Title & Language Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-0.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="size-5 text-amber-500" />
            <span>Comprehensive Bilingual Solution Keys</span>
          </h3>
          <p className="text-xs text-slate-500">
            Review each question with candidate choice, verified answer, and step-by-step reasoning.
          </p>
        </div>

        {/* Language Selector */}
        <div className="inline-flex items-center gap-1 self-start md:self-auto rounded-full border border-slate-200 bg-slate-50 p-1 text-xs">
          <span className="hidden sm:inline-flex items-center gap-1 pl-2.5 pr-1 text-2xs font-bold uppercase tracking-wider text-slate-400">
            <Languages className="size-3.5 text-brand-blue" />
            <span>Language:</span>
          </span>
          <button
            type="button"
            onClick={() => setLangTab("ta")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              langTab === "ta"
                ? "bg-brand-red text-white shadow-2xs font-bold"
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
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            English (Only)
          </button>
        </div>
      </div>

      {/* Tier 2: Dedicated Status Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-slate-50/80 border border-slate-100 p-2 sm:p-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 px-2 hidden lg:inline">
            Filter:
          </span>

          {/* All Questions */}
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === "all"
                ? "bg-brand-blue text-white shadow-xs font-bold"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>All Questions</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-2xs font-bold ${
                filter === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {questions.length}
            </span>
          </button>

          {/* Correct */}
          <button
            type="button"
            onClick={() => setFilter("correct")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === "correct"
                ? "bg-emerald-600 text-white shadow-xs font-bold"
                : "bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
            }`}
          >
            <CheckCircle2 className="size-3.5" />
            <span>Correct</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-2xs font-bold ${
                filter === "correct" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {report.correctCount}
            </span>
          </button>

          {/* Wrong */}
          <button
            type="button"
            onClick={() => setFilter("wrong")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === "wrong"
                ? "bg-rose-600 text-white shadow-xs font-bold"
                : "bg-white text-rose-700 hover:bg-rose-50 border border-rose-200"
            }`}
          >
            <XCircle className="size-3.5" />
            <span>Incorrect</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-2xs font-bold ${
                filter === "wrong" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800"
              }`}
            >
              {report.wrongCount}
            </span>
          </button>

          {/* Skipped */}
          <button
            type="button"
            onClick={() => setFilter("skipped")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === "skipped"
                ? "bg-slate-700 text-white shadow-xs font-bold"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <HelpCircle className="size-3.5" />
            <span>Skipped</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-2xs font-bold ${
                filter === "skipped" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {report.skippedCount}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 px-2 sm:px-1">
          <span className="text-2xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredQuestions.length}</strong> of{" "}
            {questions.length} questions
          </span>
          {filteredQuestions.length > 0 && (
            <button
              type="button"
              onClick={handleToggleAllSolutions}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-2xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 shadow-2xs transition"
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

      {/* Questions list */}
      {filteredQuestions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-2">
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
          {filteredQuestions.map((q, idx) => {
            const record = answers[q.id];
            const timeSpent = record?.timeSpentSeconds ?? 0;
            const chosenId = record?.selectedOptionId;
            const chosenOption = q.options.find((o) => o.id === chosenId);
            const isCorrect = chosenOption?.isCorrect ?? false;
            const isSkipped = !chosenId;

            return (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3"
              >
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      Q{idx + 1}.
                    </span>
                    <Badge
                      variant="outline"
                      className="text-2xs font-semibold uppercase bg-slate-50 border-slate-200 text-slate-700"
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
                    {/* Question Dwell Time Indicator */}
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200/90 px-2 py-0.5 font-mono text-2xs font-bold text-slate-700">
                      <Clock className="size-3 text-brand-blue" />
                      <span>
                        {timeSpent > 0 ? `${formatTime(timeSpent)} (${timeSpent}s)` : "0s (Rapid)"}
                      </span>
                    </span>

                    {/* Pace Badge */}
                    {timeSpent > 0 && !isSkipped && (
                      <span
                        className={`hidden sm:inline-block rounded px-1.5 py-0.5 text-3xs font-extrabold uppercase ${
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
                        className="border-slate-300 bg-slate-100 text-slate-600 text-2xs font-semibold"
                      >
                        <HelpCircle className="size-3 mr-1" />
                        Skipped (0 Marks)
                      </Badge>
                    ) : isCorrect ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-300 bg-emerald-50 text-emerald-800 text-2xs font-bold"
                      >
                        <CheckCircle2 className="size-3 mr-1 text-emerald-600" />
                        Correct (+4 Marks)
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-rose-300 bg-rose-50 text-rose-800 text-2xs font-bold"
                      >
                        <XCircle className="size-3 mr-1 text-rose-600" />
                        Incorrect (-1 Mark)
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <div className="space-y-1.5 text-xs sm:text-sm font-medium text-slate-900">
                  {langTab === "en" ? (
                    <p className="leading-relaxed">{q.textEn}</p>
                  ) : (
                    <div className="space-y-1">
                      {q.textTa && (
                        <p className="leading-relaxed font-sans font-bold text-slate-950">
                          {q.textTa}
                        </p>
                      )}
                      <p className="leading-relaxed text-slate-600 text-xs border-l-2 border-brand-red/30 pl-2 italic">
                        {q.textEn}
                      </p>
                    </div>
                  )}
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isCandidateChoice = opt.id === chosenId;
                    const isTheCorrectOne = opt.isCorrect;

                    let cardStyle = "border-slate-200 bg-slate-50/50 text-slate-700";
                    if (isTheCorrectOne) {
                      cardStyle =
                        "border-emerald-500 bg-emerald-50/80 text-emerald-950 font-semibold ring-1 ring-emerald-500/20";
                    } else if (isCandidateChoice && !isTheCorrectOne) {
                      cardStyle = "border-rose-400 bg-rose-50/80 text-rose-950 font-semibold";
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
                                <p className="font-semibold text-slate-900">{opt.textTa}</p>
                              )}
                              <p className="text-2xs text-slate-500">{opt.textEn}</p>
                            </div>
                          )}
                          {isCandidateChoice && (
                            <span className="inline-block mt-0.5 text-2xs font-bold text-slate-500 uppercase tracking-wider">
                              (Your Choice)
                            </span>
                          )}
                        </div>
                        {isTheCorrectOne && (
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 self-center" />
                        )}
                        {isCandidateChoice && !isTheCorrectOne && (
                          <XCircle className="size-4 shrink-0 text-rose-600 self-center" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Step-by-Step Solution Note (Collapsible Accordion) */}
                {(q.solutionEn || q.solutionTa) && (
                  <div className="pt-2 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleSolution(q.id)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                          expandedSolutions[q.id]
                            ? "bg-amber-100 text-amber-950 font-bold border border-amber-200"
                            : "bg-amber-50/80 text-amber-900 hover:bg-amber-100/80 border border-amber-200/80 shadow-2xs"
                        }`}
                      >
                        <Sparkles className="size-3.5 text-amber-600" />
                        <span>
                          {expandedSolutions[q.id]
                            ? "விளக்கம் மறைக்க / Hide Solution"
                            : "விளக்கம் பார்க்க / View Solution & Explanation"}
                        </span>
                        {expandedSolutions[q.id] ? (
                          <ChevronUp className="size-3.5 text-amber-700" />
                        ) : (
                          <ChevronDown className="size-3.5 text-amber-700" />
                        )}
                      </button>

                      <span className="text-2xs text-slate-400 font-medium hidden sm:inline">
                        {expandedSolutions[q.id]
                          ? "Click to collapse"
                          : "NTA Concept Explanation"}
                      </span>
                    </div>

                    {expandedSolutions[q.id] && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs space-y-2 animate-in fade-in-50 duration-200">
                        <div className="flex items-center gap-1.5 font-bold text-amber-950">
                          <Sparkles className="size-4 text-amber-600" />
                          <span>விரிவான விளக்கம் / Step-by-Step Concept Key:</span>
                        </div>
                        {langTab === "en" ? (
                          <p className="text-slate-800 leading-relaxed font-sans">{q.solutionEn}</p>
                        ) : (
                          <div className="space-y-1.5">
                            {q.solutionTa && (
                              <p className="text-slate-950 font-semibold leading-relaxed font-sans">
                                {q.solutionTa}
                              </p>
                            )}
                            {q.solutionEn && (
                              <p className="text-slate-600 leading-relaxed font-sans text-2xs border-t border-amber-200/70 pt-1.5">
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
          })}
        </div>
      )}
    </div>
  );
}
