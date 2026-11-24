"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  HelpCircle,
  Lock,
  PieChart,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ExamResultPayload, ExamResultReviewItem } from "./exam.types";

interface ExamResultViewProps {
  result: ExamResultPayload;
}

export function ExamResultView({ result }: ExamResultViewProps) {
  const router = useRouter();
  const [filterMode, setFilterMode] = useState<"ALL" | "CORRECT" | "INCORRECT" | "SKIPPED">("ALL");
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const hasReview = Boolean(result.review && result.review.length > 0);

  const toggleQuestion = (qId: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const filteredReview = (result.review || []).filter((item) => {
    if (filterMode === "CORRECT") return item.isCorrect;
    if (filterMode === "INCORRECT") return item.selectedOptionId && !item.isCorrect;
    if (filterMode === "SKIPPED") return !item.selectedOptionId;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header Bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/student")}
              className="rounded-full text-xs font-semibold gap-1.5"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Dashboard</span>
            </Button>
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <div>
              <span className="rounded bg-brand-red/10 px-2 py-0.5 font-mono text-3xs font-bold text-brand-red">
                {result.test.code}
              </span>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {result.test.title} – Performance Report
              </h1>
            </div>
          </div>

          <Badge className="bg-emerald-600 text-white font-bold text-xs px-3 py-1">
            <ShieldCheck className="mr-1 size-3.5" />
            EVALUATED
          </Badge>
        </div>
      </header>

      {/* Main Scorecard Container */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
        {/* Scorecard Hero Banner */}
        <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-indigo-50/40 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                  OFFICIAL NEET SCORING
                </span>
                <span className="text-xs text-slate-500">
                  Calculated: {new Date(result.calculatedAt).toLocaleString()}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
                Examination Outcome
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                Performance recorded with server-authoritative marking scheme (+4 for correct, -1 for incorrect).
              </p>
            </div>

            {/* Score Big Badge */}
            <div className="flex items-center gap-4 self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="grid size-16 place-items-center rounded-2xl bg-brand-red/10 text-brand-red">
                <Award className="size-8" />
              </div>
              <div>
                <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">
                  Marks Scored
                </p>
                <p className="font-mono text-3xl font-black text-slate-900">
                  {result.score}{" "}
                  <span className="text-sm font-semibold text-slate-400">
                    / {result.maxMarks}
                  </span>
                </p>
                <p className="text-xs font-bold text-emerald-600 mt-0.5">
                  {Math.round(result.percentage)}% Aggregate Score
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Matrix */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-6 border-t border-slate-200/80">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-2xs">
              <CheckCircle2 className="mx-auto size-5 text-emerald-600" />
              <p className="mt-1 font-mono text-xl font-bold text-emerald-700">
                {result.correctCount}
              </p>
              <p className="text-xs font-semibold text-slate-500">Correct Answers</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-2xs">
              <XCircle className="mx-auto size-5 text-rose-600" />
              <p className="mt-1 font-mono text-xl font-bold text-rose-700">
                {result.incorrectCount}
              </p>
              <p className="text-xs font-semibold text-slate-500">Incorrect Answers</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-2xs">
              <HelpCircle className="mx-auto size-5 text-slate-500" />
              <p className="mt-1 font-mono text-xl font-bold text-slate-700">
                {result.unansweredCount}
              </p>
              <p className="text-xs font-semibold text-slate-500">Unanswered</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-2xs">
              <TrendingUp className="mx-auto size-5 text-brand-blue" />
              <p className="mt-1 font-mono text-xl font-bold text-brand-blue">
                {Math.round(result.accuracy)}%
              </p>
              <p className="text-xs font-semibold text-slate-500">Accuracy Rate</p>
            </div>
          </div>
        </section>

        {/* Subject Breakdown Grid */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
            Subject-Wise Score Breakdown
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {result.physicsScore !== undefined && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="text-3xs font-bold text-blue-600 uppercase">Physics</span>
                <p className="font-mono text-xl font-black text-slate-900 mt-1">
                  {result.physicsScore} <span className="text-xs text-slate-500 font-normal">Marks</span>
                </p>
              </div>
            )}
            {result.chemistryScore !== undefined && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="text-3xs font-bold text-amber-600 uppercase">Chemistry</span>
                <p className="font-mono text-xl font-black text-slate-900 mt-1">
                  {result.chemistryScore} <span className="text-xs text-slate-500 font-normal">Marks</span>
                </p>
              </div>
            )}
            {result.biologyScore !== undefined && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="text-3xs font-bold text-emerald-600 uppercase">Biology</span>
                <p className="font-mono text-xl font-black text-slate-900 mt-1">
                  {result.biologyScore} <span className="text-xs text-slate-500 font-normal">Marks</span>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Review Section */}
        {hasReview ? (
          <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Question-by-Question Solution Review
                </h3>
                <p className="text-xs text-slate-500">
                  Review your responses alongside verified official answer keys and step-by-step explanations.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 rounded-full bg-slate-100 p-1 text-2xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilterMode("ALL")}
                  className={`rounded-full px-2.5 py-1 transition ${
                    filterMode === "ALL" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600"
                  }`}
                >
                  All ({result.review?.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("CORRECT")}
                  className={`rounded-full px-2.5 py-1 transition ${
                    filterMode === "CORRECT" ? "bg-emerald-600 text-white shadow-2xs font-bold" : "text-slate-600"
                  }`}
                >
                  Correct ({result.correctCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("INCORRECT")}
                  className={`rounded-full px-2.5 py-1 transition ${
                    filterMode === "INCORRECT" ? "bg-rose-600 text-white shadow-2xs font-bold" : "text-slate-600"
                  }`}
                >
                  Incorrect ({result.incorrectCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("SKIPPED")}
                  className={`rounded-full px-2.5 py-1 transition ${
                    filterMode === "SKIPPED" ? "bg-slate-700 text-white shadow-2xs font-bold" : "text-slate-600"
                  }`}
                >
                  Skipped ({result.unansweredCount})
                </button>
              </div>
            </div>

            {/* Questions Review List */}
            <div className="space-y-4">
              {filteredReview.map((item) => {
                const isExpanded = expandedQuestions[item.questionId] ?? true;
                const statusBadge = item.isCorrect ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-3xs font-bold">
                    +4 Marks (Correct)
                  </Badge>
                ) : item.selectedOptionId ? (
                  <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-3xs font-bold">
                    -1 Mark (Incorrect)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-3xs text-slate-500 font-bold">
                    0 Marks (Skipped)
                  </Badge>
                );

                return (
                  <article
                    key={item.questionId}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3"
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
                        className="text-slate-400 hover:text-slate-600 transition"
                      >
                        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="space-y-3 pt-2">
                        <p className="text-sm font-medium text-slate-900 whitespace-pre-line leading-relaxed">
                          {item.textEn}
                        </p>
                        {item.textTa && (
                          <p className="text-xs text-slate-700 font-sans italic border-l-2 border-brand-red/30 pl-2">
                            {item.textTa}
                          </p>
                        )}
                        {item.questionImageUrl && (
                          <img
                            src={item.questionImageUrl}
                            alt="Question Diagram"
                            className="max-h-48 object-contain rounded-lg border border-slate-200 p-1"
                          />
                        )}

                        {/* Options Comparison */}
                        <div className="space-y-2 pt-2">
                          {item.options.map((opt, optIdx) => {
                            const isUserChoice = item.selectedOptionId === opt.id;
                            const isCanonicalCorrect = opt.isCorrect;
                            const legacy = ["A", "B", "C", "D"];
                            const legacyIdx = opt.label ? legacy.indexOf(opt.label.toUpperCase()) : -1;
                            const displayLabel =
                              legacyIdx !== -1
                                ? String(legacyIdx + 1)
                                : /^[0-9]+$/.test(opt.label ?? "")
                                  ? String(opt.label)
                                  : String(optIdx + 1);

                            let optStyle = "border-slate-200 bg-slate-50/50 text-slate-700";
                            if (isCanonicalCorrect) {
                              optStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500/30";
                            } else if (isUserChoice && !isCanonicalCorrect) {
                              optStyle = "border-rose-500 bg-rose-50 text-rose-950 line-through ring-1 ring-rose-500/30";
                            }

                            return (
                              <div
                                key={opt.id}
                                className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-xs ${optStyle}`}
                              >
                                <span className="font-mono font-bold">({displayLabel})</span>
                                <div className="flex-1">
                                  <span>{opt.textEn}</span>
                                  {opt.textTa && (
                                    <span className="block text-3xs opacity-80">{opt.textTa}</span>
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

                        {/* Solution / Explanation Box */}
                        {(item.solutionEn || item.solutionTa) && (
                          <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 text-xs text-indigo-950 space-y-1">
                            <p className="font-bold text-brand-blue flex items-center gap-1.5">
                              <BookOpen className="size-3.5" />
                              Official Solution &amp; Key Explanation
                            </p>
                            {item.solutionEn && <p className="leading-relaxed">{item.solutionEn}</p>}
                            {item.solutionTa && (
                              <p className="text-3xs text-indigo-900 font-sans italic pt-1">{item.solutionTa}</p>
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
        ) : (
          /* Delayed Result Release Notice Banner */
          <section className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 sm:p-8 text-center space-y-3">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-amber-100 text-amber-700">
              <Lock className="size-6" />
            </div>
            <h3 className="text-base font-bold text-amber-950">
              Examination Sealed &amp; Under Security Window
            </h3>
            <p className="max-w-md mx-auto text-xs text-amber-900 leading-relaxed">
              Your response paper has been securely recorded. Detailed question-by-question keys, solutions, and cohort percentiles will be released according to academy guidelines.
            </p>
            <div className="pt-2">
              <Button
                onClick={() => router.push("/dashboard/student")}
                className="rounded-full bg-amber-700 text-xs font-semibold text-white hover:bg-amber-800"
              >
                Return to Student Dashboard
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
