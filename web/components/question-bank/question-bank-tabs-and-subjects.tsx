"use client";

import type { SubjectFilter } from "./use-question-bank";

interface QuestionBankTabsAndSubjectsProps {
  subjectFilter: SubjectFilter;
  onSubjectChange: (subject: SubjectFilter) => void;
  subjectCounts: Record<SubjectFilter, number>;
}

export function QuestionBankTabsAndSubjects({
  subjectFilter,
  onSubjectChange,
  subjectCounts,
}: QuestionBankTabsAndSubjectsProps) {
  const subjects: SubjectFilter[] = ["PHYSICS", "CHEMISTRY", "BIOLOGY"];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {subjects.map((subject) => (
        <button
          key={subject}
          onClick={() => onSubjectChange(subject)}
          className={`group flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition ${
            subjectFilter === subject
              ? "border-blue-200 bg-blue-50 text-brand-blue shadow-xs"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <span className="grid gap-0.5">
            <span className="block text-xs font-semibold">
              {subject[0] + subject.slice(1).toLowerCase()}
            </span>
            <span
              className={`block text-xs font-semibold uppercase tracking-wide ${
                subjectFilter === subject ? "text-brand-blue" : "text-slate-400"
              }`}
            >
              Subject workspace
            </span>
          </span>
          <span
            className={`grid size-8 place-items-center rounded-lg text-xs font-semibold ${
              subjectFilter === subject
                ? "bg-white text-indigo-700 ring-1 ring-indigo-200"
                : "bg-slate-50 text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {subjectCounts[subject]}
          </span>
        </button>
      ))}
    </div>
  );
}
