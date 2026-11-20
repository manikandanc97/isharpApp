/* eslint-disable @next/next/no-img-element */
"use client";

import { Copy, Eye, Pencil, Trash2 } from "lucide-react";
import type { Question } from "./types";
import { Checkbox } from "@/components/ui/checkbox";

export interface QuestionCardProps {
  question: Question;
  demo?: boolean;
  selected?: boolean;
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
  onToggleSelect,
  onEdit,
  onDuplicate,
  onPreview,
  onDelete,
}: QuestionCardProps) {
  const difficultyBadge =
    question.difficulty === "EASY"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : question.difficulty === "HARD"
      ? "bg-rose-50 text-rose-700 border-rose-100"
      : "bg-amber-50 text-amber-700 border-amber-100";

  return (
    <article
      className={`flex h-full flex-col rounded-2xl border bg-white p-4 transition sm:p-5 ${
        selected
          ? "border-brand-blue ring-2 ring-brand-blue/20 shadow-sm"
          : "border-slate-200 hover:border-indigo-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {onToggleSelect && (
            <div className="pt-0.5">
              <Checkbox
                checked={selected}
                onCheckedChange={() => onToggleSelect()}
                aria-label={`Select ${question.externalId}`}
              />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              <span className="text-indigo-700 font-bold">{question.externalId}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-700">{question.courseSubject.subject.name}</span>
              {question.chapter?.title && (
                <>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500 truncate max-w-[180px]">{question.chapter.title}</span>
                </>
              )}
            </div>
            {demo && (
              <span className="mt-1.5 inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
                Example content
              </span>
            )}
            <p className="mt-2 text-sm font-semibold text-slate-900 leading-snug line-clamp-3">
              {question.textEn || question.textTa || "Image-based question"}
            </p>
            {question.textEn && question.textTa && (
              <p className="mt-1 text-xs text-slate-600 line-clamp-2 font-serif">
                {question.textTa}
              </p>
            )}
          </div>
        </div>

        <span className={`shrink-0 rounded-md border px-2 py-0.5 text-3xs font-bold uppercase tracking-wider ${difficultyBadge}`}>
          {question.difficulty}
        </span>
      </div>

      {question.questionImageUrl && (
        <div className="my-3 flex justify-center rounded-lg border border-slate-100 bg-slate-50 p-2">
          <img
            src={question.questionImageUrl}
            alt="Question diagram"
            className="max-h-40 w-full rounded object-contain"
          />
        </div>
      )}

      {/* Options preview */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {question.options.map((option, optIdx) => {
          const displayLabel = String(optIdx + 1);
          return (
            <div
              key={option.label || optIdx}
              className={`rounded-xl border px-3 py-2 text-xs transition ${
                option.isCorrect
                  ? "border-emerald-300 bg-emerald-50/80 font-semibold text-emerald-900"
                  : "border-slate-100 bg-slate-50 text-slate-600"
              }`}
            >
              <span className="font-bold mr-1">({option.label || displayLabel})</span>
              <span>{option.textEn || option.textTa || "Image option"}</span>
              {option.imageUrl && (
                <img
                  src={option.imageUrl}
                  alt={`Option ${displayLabel}`}
                  className="mt-1.5 max-h-16 object-contain"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Worked Solution Brief */}
      <div className="mt-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2.5">
          <p className="text-3xs font-bold uppercase tracking-wide text-brand-blue">
            Worked Solution
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-700">
            {question.solutionEn ||
              question.solutionTa ||
              "Standard NTA NEET step-by-step solution available in preview."}
          </p>
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
