"use client";

import type { SubjectFilter } from "./use-question-bank";

interface QuestionBankTabsAndSubjectsProps {
  tab: "bank" | "tests";
  onTabChange: (tab: "bank" | "tests") => void;
  questionsCount: number;
  testsCount: number;
  subjectFilter: SubjectFilter;
  onSubjectChange: (subject: SubjectFilter) => void;
  subjectCounts: Record<SubjectFilter, number>;
}

export function QuestionBankTabsAndSubjects({
  tab,
  onTabChange,
  questionsCount,
  testsCount,
  subjectFilter,
  onSubjectChange,
  subjectCounts,
}: QuestionBankTabsAndSubjectsProps) {
  const tabs = [
    { id: "bank" as const, label: "Question bank", count: questionsCount },
    { id: "tests" as const, label: "Mock tests", count: testsCount },
  ];

  const subjects: SubjectFilter[] = ["PHYSICS", "CHEMISTRY", "BIOLOGY"];

  return (
    <>
      <div className="flex w-full border-b border-slate-200">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`relative px-4 pb-3 text-xs font-semibold transition sm:px-6 ${tab === item.id ? "text-brand-blue" : "text-slate-400 hover:text-slate-700"}`}
          >
            {item.label}
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${tab === item.id ? "bg-blue-50 text-brand-blue" : "bg-slate-100 text-slate-500"}`}
            >
              {item.count}
            </span>
            {tab === item.id && (
              <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-blue" />
            )}
          </button>
        ))}
      </div>

      {tab === "bank" && (
        <div className="grid gap-3 md:grid-cols-3">
          {subjects.map((subject) => (
            <button
              key={subject}
              onClick={() => onSubjectChange(subject)}
              className={`group flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition ${subjectFilter === subject ? "border-blue-200 bg-blue-50 text-brand-blue shadow-xs" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
            >
              <span className="grid gap-0.5">
                <span className="block text-xs font-semibold">
                  {subject[0] + subject.slice(1).toLowerCase()}
                </span>
                <span
                  className={`block text-xs font-semibold uppercase tracking-wide ${subjectFilter === subject ? "text-brand-blue" : "text-slate-400"}`}
                >
                  Subject workspace
                </span>
              </span>
              <span
                className={`grid size-8 place-items-center rounded-lg text-xs font-semibold ${subjectFilter === subject ? "bg-white text-indigo-700 ring-1 ring-indigo-200" : "bg-slate-50 text-slate-600 ring-1 ring-slate-200"}`}
              >
                {subjectCounts[subject]}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

