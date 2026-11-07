/* eslint-disable @next/next/no-img-element */
"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { Question } from "./types";

export interface QuestionCardProps {
  question: Question;
  demo?: boolean;
  onEdit: () => void;
  onDelete?: () => void;
}

export function QuestionCard({
  question,
  demo = false,
  onEdit,
  onDelete,
}: QuestionCardProps) {
  return (
    <article
      className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-md sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-indigo-700">
            {question.externalId} · {question.courseSubject.subject.name}
          </div>
          {demo && (
            <span className="mt-2 inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
              Example content
            </span>
          )}
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {question.textEn || question.textTa || "Image question"}
          </p>
          {question.textEn && question.textTa && (
            <p className="mt-1 text-sm text-slate-600">{question.textTa}</p>
          )}
        </div>
      </div>
      {question.questionImageUrl && (
        <img
          src={question.questionImageUrl}
          alt="Question diagram"
          className="my-3 max-h-48 w-full rounded-lg object-contain"
        />
      )}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {question.options.map((option) => (
          <div
            key={option.label}
            className={`rounded-xl border px-3 py-2.5 text-xs ${option.isCorrect ? "border-emerald-200 bg-emerald-50 font-semibold text-emerald-800" : "border-slate-100 bg-slate-50 text-slate-600"}`}
          >
            {option.label}. {option.textEn || option.textTa || "Image option"}
            {option.imageUrl && (
              <img
                src={option.imageUrl}
                alt={`Option ${option.label}`}
                className="mt-2 max-h-20 object-contain"
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2">
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
            Worked solution
          </p>
          <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-700">
            {question.solutionEn ||
              question.solutionTa ||
              "No worked solution has been added yet."}
          </p>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase text-slate-500">
          <span>{question.type}</span>
          <span>{question.difficulty}</span>
          <span>
            +{question.correctMarks}/−{question.negativeMarks}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 px-3 py-1.5 text-xs font-semibold text-brand-blue transition hover:bg-blue-50"
            title={demo ? "Use as a new question template" : "Edit question"}
          >
            <Pencil className="size-3.5" />
            {demo ? "Use template" : "Edit"}
          </button>
          {!demo && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="grid size-8 place-items-center rounded-full border border-red-200 text-red-600 hover:bg-red-50"
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

