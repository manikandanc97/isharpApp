/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Eye, Pencil, Trash2 } from "lucide-react";
import type { Question } from "./types";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDisplayQuestionId } from "@/lib/question-format";

export interface QuestionCardProps {
  question: Question;
  demo?: boolean;
  selected?: boolean;
  isDuplicate?: boolean;
  languageViewMode?: "BILINGUAL" | "EN" | "TA";
  onToggleSelect?: () => void;
  onEdit: () => void;
  onDuplicate?: () => void;
  onPreview?: () => void;
  onDelete?: () => void;
}

export function QuestionCard({
  question,
  demo = false,
  selected = false,
  isDuplicate = false,
  languageViewMode = "BILINGUAL",
  onToggleSelect,
  onEdit,
  onDuplicate,
  onPreview,
  onDelete,
}: QuestionCardProps) {
  const [diagramVisible, setDiagramVisible] = useState(true);
  const [solutionDiagramVisible, setSolutionDiagramVisible] = useState(true);

  const difficultyBadge =
    question.difficulty === "EASY"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : question.difficulty === "HARD"
      ? "bg-rose-50 text-rose-700 border-rose-100"
      : "bg-amber-50 text-amber-700 border-amber-100";

  const isMultipleCorrect = question.type === "MULTIPLE_CORRECT";
  const isNumerical = question.type === "NUMERICAL";
  const correctCount = question.options.filter((o) => o.isCorrect).length;

  return (
    <article
      className={`flex h-full flex-col rounded-2xl border bg-white p-4 transition sm:p-5 ${
        selected
          ? "border-brand-blue ring-2 ring-brand-blue/20 shadow-sm"
          : isDuplicate
          ? "border-amber-300/80 bg-amber-50/[0.08] hover:border-amber-400 hover:shadow-md"
          : "border-slate-200 hover:border-indigo-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {!demo && onToggleSelect && (
            <div className="pt-0.5">
              <Checkbox
                checked={selected}
                onCheckedChange={() => onToggleSelect()}
                aria-label={`Select ${question.externalId}`}
              />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {question.chapter?.title ? (
                <span className="text-slate-800 font-semibold truncate max-w-[320px]">
                  {question.chapter.title}
                </span>
              ) : (
                <span className="text-slate-800 font-semibold">
                  {question.courseSubject?.subject?.name || "Question"}
                </span>
              )}
              {!demo && question.externalId && (
                <span
                  title={`ID: ${question.externalId}`}
                  className="inline-flex items-center rounded-md bg-indigo-50/80 px-2 py-0.5 font-mono text-3xs font-semibold text-indigo-700 border border-indigo-100"
                >
                  {formatDisplayQuestionId(question.externalId)}
                </span>
              )}
            </div>
            {/* Question Text: Tamil first and bold, English second */}
            {languageViewMode === "TA" && question.textTa ? (
              <p className="mt-2 text-sm font-bold text-slate-900 leading-snug line-clamp-3 font-serif">
                {question.textTa}
              </p>
            ) : languageViewMode === "EN" && question.textEn ? (
              <p className="mt-2 text-sm font-bold text-slate-900 leading-snug line-clamp-3">
                {question.textEn}
              </p>
            ) : (
              /* Bilingual: Tamil first (bold), English second */
              <div className="mt-2 space-y-1.5">
                {question.textTa && (
                  <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-3 font-serif">
                    {question.textTa}
                  </p>
                )}
                {question.textEn && (
                  <p className={`text-sm leading-snug line-clamp-3 ${question.textTa ? "text-slate-600 font-medium" : "font-bold text-slate-900"}`}>
                    {question.textEn}
                  </p>
                )}
                {!question.textTa && !question.textEn && (
                  <p className="text-sm font-bold text-slate-900">Image-based question</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex items-center gap-1">
            {isDuplicate && (
              <span className="rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-amber-800">
                Duplicate
              </span>
            )}
            <span className={`rounded-md border px-2 py-0.5 text-3xs font-bold uppercase tracking-wider ${difficultyBadge}`}>
              {question.difficulty}
            </span>
          </div>
          {isMultipleCorrect && (
            <span className="rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-purple-700">
              Multiple ({correctCount})
            </span>
          )}
          {isNumerical && (
            <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-indigo-700">
              Numerical
            </span>
          )}
        </div>
      </div>

      {/* Question Diagram (only shown if valid and not blank/dummy) */}
      {question.questionImageUrl && diagramVisible && (
        <div className="my-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 p-2.5">
          <div className="mb-1.5 flex items-center justify-between text-3xs font-semibold text-slate-500">
            <span>Question Diagram</span>
            <a
              href={question.questionImageUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              <span>Full View</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
          <div className="flex justify-center bg-white rounded-lg p-1 border border-slate-100">
            <img
              src={question.questionImageUrl}
              alt="Question diagram"
              className="max-h-48 w-full rounded object-contain"
              onLoad={(e) => {
                const target = e.currentTarget;
                if (target.naturalWidth <= 1 && target.naturalHeight <= 1) {
                  setDiagramVisible(false);
                }
              }}
              onError={() => {
                setDiagramVisible(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Numerical Answer display */}
      {isNumerical ? (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-3xs font-bold uppercase tracking-wide text-indigo-700">
              Numerical Answer Value
            </span>
            <span className="rounded bg-indigo-200/50 px-2 py-0.5 font-mono text-3xs font-bold text-indigo-800">
              NTA CBT
            </span>
          </div>
          <p className="mt-1 font-mono text-base font-extrabold text-slate-900">
            {question.numericalAnswer || "No value set"}
          </p>
        </div>
      ) : (
        /* Options preview */
        <div className="mt-4 space-y-2">
          {isMultipleCorrect && (
            <div className="flex items-center justify-between rounded-lg border border-purple-100 bg-purple-50/70 px-2.5 py-1 text-2xs font-semibold text-purple-700">
              <span>Multiple Correct Question</span>
              <span>{correctCount} options marked correct</span>
            </div>
          )}
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {question.options.map((option, optIdx) => {
              const legacy = ["A", "B", "C", "D"];
              const legacyIdx = option.label ? legacy.indexOf(option.label.toUpperCase()) : -1;
              const displayLabel =
                legacyIdx !== -1
                  ? String(legacyIdx + 1)
                  : /^[0-9]+$/.test(option.label ?? "")
                    ? String(option.label)
                    : String(optIdx + 1);
              return (
                <div
                  key={option.label || optIdx}
                  className={`flex flex-col justify-between rounded-xl border px-3 py-2 text-xs transition ${
                    option.isCorrect
                      ? "border-emerald-300 bg-emerald-50/90 font-medium text-emerald-950 shadow-2xs ring-1 ring-emerald-200"
                      : "border-slate-100 bg-slate-50 text-slate-600"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold">({displayLabel})</span>
                      {option.isCorrect && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-emerald-600/10 px-1.5 py-0.5 text-3xs font-bold text-emerald-700">
                          <Check className="size-2.5" />
                          <span>Correct</span>
                        </span>
                      )}
                    </div>
                    {languageViewMode === "TA" && option.textTa ? (
                      <span className="mt-0.5 block font-semibold leading-relaxed font-serif text-slate-900">
                        {option.textTa}
                      </span>
                    ) : languageViewMode === "EN" && option.textEn ? (
                      <span className="mt-0.5 block font-medium leading-relaxed text-slate-900">
                        {option.textEn}
                      </span>
                    ) : (
                      /* Bilingual: Tamil first (important & prominent), then English */
                      <div className="mt-0.5 space-y-0.5">
                        {option.textTa && (
                          <span className="block font-semibold leading-relaxed font-serif text-slate-900">
                            {option.textTa}
                          </span>
                        )}
                        {option.textEn && (
                          <span className={`block leading-snug text-xs ${option.textTa ? "text-slate-500 font-normal" : "font-semibold text-slate-900"}`}>
                            {option.textEn}
                          </span>
                        )}
                        {!option.textTa && !option.textEn && (
                          <span className="block leading-relaxed text-slate-400">Image option</span>
                        )}
                      </div>
                    )}
                  </div>
                  {option.imageUrl && (
                    <div className="mt-1.5 overflow-hidden rounded border border-slate-200 bg-white p-1">
                      <img
                        src={option.imageUrl}
                        alt={`Option ${displayLabel}`}
                        className="max-h-20 w-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Worked Solution Brief */}
      <div className="mt-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2.5">
          <p className="text-3xs font-bold uppercase tracking-wide text-brand-blue">
            Worked Solution
          </p>
          {languageViewMode === "TA" && question.solutionTa ? (
            <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-slate-800 font-serif font-medium">
              {question.solutionTa}
            </p>
          ) : languageViewMode === "EN" && question.solutionEn ? (
            <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-slate-700">
              {question.solutionEn}
            </p>
          ) : (
            /* Bilingual: Tamil solution first, English solution second */
            <div className="mt-0.5 space-y-1">
              {question.solutionTa && (
                <p className="line-clamp-3 text-xs leading-relaxed text-slate-800 font-serif font-medium">
                  {question.solutionTa}
                </p>
              )}
              {question.solutionEn && (
                <p className={`line-clamp-2 text-xs leading-relaxed ${question.solutionTa ? "text-slate-600 border-t border-blue-100/70 pt-1" : "text-slate-700 font-medium"}`}>
                  {question.solutionEn}
                </p>
              )}
              {!question.solutionTa && !question.solutionEn && (
                <p className="text-xs text-slate-500">Standard NTA NEET step-by-step solution available in preview.</p>
              )}
            </div>
          )}
          {question.solutionImageUrl && solutionDiagramVisible && (
            <div className="mt-2 overflow-hidden rounded-lg border border-blue-100 bg-white p-1.5">
              <div className="mb-1 flex items-center justify-between text-3xs text-slate-400">
                <span>Solution Diagram</span>
                <a
                  href={question.solutionImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  Full View ↗
                </a>
              </div>
              <img
                src={question.solutionImageUrl}
                alt="Solution diagram"
                className="max-h-28 w-full object-contain"
                onLoad={(e) => {
                  const target = e.currentTarget;
                  if (target.naturalWidth <= 1 && target.naturalHeight <= 1) {
                    setSolutionDiagramVisible(false);
                  }
                }}
                onError={() => {
                  setSolutionDiagramVisible(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap items-center gap-2 text-3xs font-semibold text-slate-500">
          <span className="rounded bg-slate-100 px-1.5 py-0.5">{question.type}</span>
          <span>+{question.correctMarks}/−{question.negativeMarks}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              title="Preview question"
            >
              <Eye className="size-3.5" />
            </button>
          )}

          {onDuplicate && (
            <button
              type="button"
              onClick={onDuplicate}
              className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              title="Duplicate question"
            >
              <Copy className="size-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/50 px-2.5 py-1.5 text-xs font-semibold text-brand-blue hover:bg-blue-100 transition"
            title={demo ? "Use as template" : "Edit question"}
          >
            <Pencil className="size-3.5" />
            <span>{demo ? "Template" : "Edit"}</span>
          </button>

          {!demo && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="grid size-8 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
              title="Delete question"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
