"use client";

import { LoaderCircle, Search } from "lucide-react";
import { Stack } from "@/components/layout/layout-primitives";
import { QuestionCard } from "./question-card";
import type { Question } from "./types";
import type { SubjectFilter } from "./use-question-bank";

interface QuestionBankListProps {
  subjectFilter: SubjectFilter;
  showingExamples: boolean;
  visibleCount: number;
  query: string;
  onQueryChange: (query: string) => void;
  busy: boolean;
  libraryQuestions: Question[];
  onEdit: (question: Question) => void;
  onDelete?: (question: Question) => void;
}

export function QuestionBankList({
  subjectFilter,
  showingExamples,
  visibleCount,
  query,
  onQueryChange,
  busy,
  libraryQuestions,
  onEdit,
  onDelete,
}: QuestionBankListProps) {
  return (
    <Stack className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <Stack gap="xs">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Content library
          </p>
          <h3 className="text-sm font-semibold text-slate-950">
            {subjectFilter[0] + subjectFilter.slice(1).toLowerCase()} questions
          </h3>
        </Stack>
        <div className="flex items-center gap-2">
          {showingExamples && (
            <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
              Demo preview
            </span>
          )}
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
            {visibleCount} records
          </span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 size-4 text-slate-400" />
        <input
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none"
          placeholder={`Search ${subjectFilter.toLowerCase()} questions`}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {busy && !libraryQuestions.length ? (
          <div className="grid h-48 place-items-center">
            <LoaderCircle className="animate-spin" />
          </div>
        ) : (
          libraryQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              demo={showingExamples}
              onEdit={() => onEdit(question)}
              onDelete={
                showingExamples || !onDelete
                  ? undefined
                  : () => onDelete(question)
              }
            />
          ))
        )}
        {!busy && !libraryQuestions.length && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No {subjectFilter.toLowerCase()} questions yet.
          </div>
        )}
      </div>
    </Stack>
  );
}

