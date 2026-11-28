"use client";

import type { ResultsOverview } from "@/lib/results-store";

type ChapterAccuracyInsight = NonNullable<
  ResultsOverview["chapterInsights"]
>[number];

export function ResultsChapterInsights({
  insights,
}: {
  insights: ChapterAccuracyInsight[];
}) {
  if (insights.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900">
          Chapter-Wise Accuracy &amp; High-Yield Analysis
        </h3>
        <p className="text-xs text-slate-500">
          Identifies which syllabus chapters students find most challenging
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((ch) => (
          <div
            key={ch.chapterTitle}
            className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4"
          >
            <div className="flex items-center justify-between text-3xs font-bold uppercase tracking-wider text-slate-500">
              <span>{ch.subject}</span>
              <span className="font-semibold text-slate-400">
                {ch.totalQuestionsAnswered} answered
              </span>
            </div>
            <h4 className="mt-1 line-clamp-1 text-xs font-bold text-slate-900">
              {ch.chapterTitle}
            </h4>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">Student Accuracy:</span>
              <span className="font-bold text-emerald-700">
                {ch.accuracyPercentage}%
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-slate-500">Mistake Rate:</span>
              <span className="font-bold text-rose-600">
                {ch.commonMistakeRate}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
