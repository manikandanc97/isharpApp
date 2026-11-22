/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  CheckCircle2,
  FileQuestion,
  HelpCircle,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDisplayQuestionId } from "@/lib/question-format";
import type { Question } from "./types";

interface QuestionPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  question: Question | null;
}

export function QuestionPreviewDialog({
  open,
  onClose,
  question,
}: QuestionPreviewDialogProps) {
  const [langMode, setLangMode] = useState<"BILINGUAL" | "EN" | "TA">("BILINGUAL");

  if (!question) return null;

  const difficultyTone =
    question.difficulty === "EASY"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : question.difficulty === "HARD"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between pr-8 sm:pr-9">
            <div className="flex items-center gap-2">
              {!question.externalId?.startsWith("DEMO-") && (
                <span
                  title={`ID: ${question.externalId}`}
                  className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700"
                >
                  {formatDisplayQuestionId(question.externalId)}
                </span>
              )}
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {question.courseSubject.subject.name}
              </span>
              {question.chapter?.title && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {question.chapter.title}
                </span>
              )}
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 text-3xs font-semibold">
              <button
                type="button"
                onClick={() => setLangMode("BILINGUAL")}
                className={`rounded px-2 py-0.5 transition ${
                  langMode === "BILINGUAL" ? "bg-white font-bold text-brand-blue shadow-2xs" : "text-slate-500"
                }`}
              >
                Bilingual
              </button>
              <button
                type="button"
                onClick={() => setLangMode("EN")}
                className={`rounded px-2 py-0.5 transition ${
                  langMode === "EN" ? "bg-white font-bold text-brand-blue shadow-2xs" : "text-slate-500"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLangMode("TA")}
                className={`rounded px-2 py-0.5 transition ${
                  langMode === "TA" ? "bg-white font-bold text-brand-blue shadow-2xs" : "text-slate-500"
                }`}
              >
                தமிழ்
              </button>
            </div>
          </div>
          <DialogTitle className="mt-2 text-base font-bold text-slate-900">
            CBT Question Preview & Solution Analysis
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Previewing question layout, typography, options, and step-by-step verified solution.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full border px-2.5 py-0.5 font-bold uppercase tracking-wider text-3xs ${difficultyTone}`}>
              {question.difficulty}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-700 text-3xs">
              TYPE: {question.type}
            </span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700 text-3xs">
              MARKING: +{question.correctMarks} / -{question.negativeMarks}
            </span>
            {question.source && (
              <span className="rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-slate-500 text-3xs">
                Ref: {question.source}
              </span>
            )}
          </div>

          {/* Question Text */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="text-3xs font-bold uppercase tracking-wider text-slate-400">
              Question Statement
            </div>
            {langMode === "TA" && question.textTa ? (
              <div className="text-sm font-bold leading-relaxed text-slate-900 font-serif">
                {question.textTa}
              </div>
            ) : langMode === "EN" && question.textEn ? (
              <div className="text-sm font-bold leading-relaxed text-slate-900">
                {question.textEn}
              </div>
            ) : (
              /* Bilingual: Tamil first (bold), English second */
              <div className="space-y-2">
                {question.textTa && (
                  <div className="text-sm font-bold leading-relaxed text-slate-900 font-serif">
                    {question.textTa}
                  </div>
                )}
                {question.textEn && (
                  <div className={`text-sm leading-relaxed ${question.textTa ? "text-slate-600 font-medium border-t border-slate-100 pt-2" : "text-slate-900 font-bold"}`}>
                    {question.textEn}
                  </div>
                )}
              </div>
            )}
            {question.questionImageUrl && (
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="mb-2 flex items-center justify-between text-3xs font-semibold text-slate-500">
                  <span>Question Diagram</span>
                  <a
                    href={question.questionImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    Open Full Image ↗
                  </a>
                </div>
                <div className="flex justify-center bg-white p-2 rounded-lg border border-slate-100">
                  <img
                    src={question.questionImageUrl}
                    alt="Question Diagram"
                    className="max-h-72 object-contain rounded-lg"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                      const parent = e.currentTarget.parentElement;
                      if (parent && !parent.querySelector(".img-error-hint")) {
                        const hint = document.createElement("div");
                        hint.className = "img-error-hint py-4 text-center text-xs text-slate-400 font-medium";
                        hint.textContent = "Diagram image preview unavailable or not found";
                        parent.appendChild(hint);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Question Options */}
          {question.options && question.options.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-3xs font-bold uppercase tracking-wider text-slate-400">
                  Answer Options
                </div>
                {question.type === "MULTIPLE_CORRECT" && (
                  <span className="rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-3xs font-bold text-purple-700">
                    Multiple Correct Question ({question.options.filter((o) => o.isCorrect).length} Answers)
                  </span>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {question.options.map((option, idx) => {
                  const displayNum = String(idx + 1);
                  return (
                    <div
                      key={option.label || idx}
                      className={`relative flex flex-col justify-between rounded-xl border p-4 transition ${
                        option.isCorrect
                          ? "border-emerald-300 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-200"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                            option.isCorrect
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {option.label || displayNum}
                        </span>
                        <div className="space-y-1 text-xs">
                          {langMode === "TA" && option.textTa ? (
                            <p className="font-semibold text-slate-900 font-serif">{option.textTa}</p>
                          ) : langMode === "EN" && option.textEn ? (
                            <p className="font-medium text-slate-900">{option.textEn}</p>
                          ) : (
                            /* Bilingual: Tamil first, then English */
                            <>
                              {option.textTa && (
                                <p className="font-semibold text-slate-900 font-serif">{option.textTa}</p>
                              )}
                              {option.textEn && (
                                <p className={`leading-snug ${option.textTa ? "text-slate-500 font-normal" : "font-semibold text-slate-900"}`}>{option.textEn}</p>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {option.imageUrl && (
                        <div className="mt-3 flex justify-center rounded-lg border border-slate-100 bg-slate-50 p-2">
                          <img
                            src={option.imageUrl}
                            alt={`Option ${option.label}`}
                            className="max-h-24 object-contain"
                          />
                        </div>
                      )}

                      {option.isCorrect && (
                        <div className="mt-2 flex items-center gap-1.5 text-3xs font-bold uppercase tracking-wider text-emerald-700">
                          <CheckCircle2 className="size-3.5" />
                          <span>Correct Answer</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Numerical answer if applicable */}
          {question.type === "NUMERICAL" && question.numericalAnswer && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <span className="text-xs font-semibold text-emerald-800">
                Correct Numerical Value: <span className="font-bold text-emerald-950">{question.numericalAnswer}</span>
              </span>
            </div>
          )}

          {/* Worked Solution */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-blue">
              <Sparkles className="size-4" />
              <span>Step-by-Step Worked Solution</span>
            </div>
            {langMode === "TA" && question.solutionTa ? (
              <p className="text-xs leading-relaxed text-slate-800 font-serif whitespace-pre-line font-medium">
                {question.solutionTa}
              </p>
            ) : langMode === "EN" && question.solutionEn ? (
              <p className="text-xs leading-relaxed text-slate-800 font-sans whitespace-pre-line">
                {question.solutionEn}
              </p>
            ) : (
              /* Bilingual: Tamil solution first, English second */
              <div className="space-y-2">
                {question.solutionTa && (
                  <p className="text-xs leading-relaxed text-slate-800 font-serif whitespace-pre-line font-medium">
                    {question.solutionTa}
                  </p>
                )}
                {question.solutionEn && (
                  <p className={`text-xs leading-relaxed font-sans whitespace-pre-line ${question.solutionTa ? "text-slate-600 border-t border-blue-100 pt-2" : "text-slate-800"}`}>
                    {question.solutionEn}
                  </p>
                )}
              </div>
            )}
            {question.solutionImageUrl && (
              <div className="mt-3 flex justify-center rounded-xl border border-blue-100 bg-white p-4">
                <img
                  src={question.solutionImageUrl}
                  alt="Solution Explanation Diagram"
                  className="max-h-60 object-contain rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
          <Button variant="outline" onClick={onClose} className="rounded-full">
            Close Preview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
