"use client";

import { CheckCircle2 } from "lucide-react";
import { QuestionDiagram } from "@/components/shared/questions/question-diagram";
import type { PrintLanguage, TestPreviewPayload } from "./test-preview-print";

type PreviewQuestionItem = TestPreviewPayload["questions"][number];

export function TestPreviewQuestionCard({
  item,
  language,
  showAnswers,
}: {
  item: PreviewQuestionItem;
  language: PrintLanguage;
  showAnswers: boolean;
}) {
  const q = item.question;
  const subjectLabel =
    q.courseSubject?.subject?.name ?? q.subjectName ?? item.section;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-bold text-white">
            Q{item.position}
          </span>
          <span className="font-semibold text-brand-blue">{subjectLabel}</span>
          {q.chapter?.title && (
            <span className="text-slate-400">• {q.chapter.title}</span>
          )}
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          {q.externalId}
        </span>
      </div>

      {(language === "BILINGUAL" || language === "EN") && q.textEn && (
        <p className="whitespace-pre-wrap text-sm font-medium text-slate-900">
          {q.textEn}
        </p>
      )}
      {(language === "BILINGUAL" || language === "TA") && q.textTa && (
        <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">
          {q.textTa}
        </p>
      )}
      {q.questionImageUrl && (
        <QuestionDiagram
          src={q.questionImageUrl}
          alt={`Question ${item.position}`}
          className="mt-2 max-h-48 rounded-lg border border-slate-200 object-contain"
        />
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {q.options?.map((opt) => (
          <div
            key={opt.id}
            className={`flex items-start gap-2 rounded-lg border p-2 ${
              showAnswers && opt.isCorrect
                ? "border-emerald-300 bg-emerald-50/70"
                : "border-slate-200 bg-slate-50/40"
            }`}
          >
            <span className="font-bold text-slate-700">{opt.label}.</span>
            <div className="min-w-0 flex-1">
              {(language === "BILINGUAL" || language === "EN") &&
                opt.textEn && <div className="text-slate-800">{opt.textEn}</div>}
              {(language === "BILINGUAL" || language === "TA") &&
                opt.textTa && (
                  <div className="text-[11px] text-slate-500">{opt.textTa}</div>
                )}
              {opt.imageUrl && (
                <QuestionDiagram
                  src={opt.imageUrl}
                  alt={`Option ${opt.label}`}
                  className="mt-1 max-h-20 rounded object-contain"
                />
              )}
            </div>
            {showAnswers && opt.isCorrect && (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            )}
          </div>
        ))}
      </div>

      {showAnswers && (q.solutionEn || q.solutionTa || q.solutionImageUrl) && (
        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/40 p-2.5 text-[11px] text-slate-700">
          <span className="font-semibold text-brand-blue">Solution: </span>
          {q.solutionEn && <span>{q.solutionEn}</span>}
          {q.solutionTa && (
            <div className="mt-0.5 text-slate-500">{q.solutionTa}</div>
          )}
          {q.solutionImageUrl && (
            <QuestionDiagram
              src={q.solutionImageUrl}
              alt="Solution"
              className="mt-1.5 max-h-32 rounded object-contain"
            />
          )}
        </div>
      )}
    </div>
  );
}
