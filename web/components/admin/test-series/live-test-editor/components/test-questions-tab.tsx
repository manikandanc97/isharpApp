"use client";

import { Eye, Loader2, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  ExamPatternConfigResponse,
  QuestionShortageDetail,
  SelectedQuestionItem,
} from "../../types";
import type { EditorFormState } from "../test-editor.types";
import { TestQuestionsBankPicker } from "./test-questions-bank-picker";

interface TestQuestionsTabProps {
  form: EditorFormState;
  examConfig: ExamPatternConfigResponse;
  hasAttempts: boolean;
  totalQuestions: number;
  loadedQuestions: SelectedQuestionItem[];
  setLoadedQuestions: React.Dispatch<
    React.SetStateAction<SelectedQuestionItem[]>
  >;
  selectedIdSet: Set<string>;
  generating: boolean;
  shortages: QuestionShortageDetail[];
  allocationErrors: string[];
  replaceTargetId: string | null;
  setReplaceTargetId: (id: string | null) => void;
  bankQuery: string;
  setBankQuery: (q: string) => void;
  bankSubject: string;
  setBankSubject: (s: string) => void;
  bankChapter: string;
  setBankChapter: (c: string) => void;
  bankDifficulty: string;
  setBankDifficulty: (d: string) => void;
  bankPage: number;
  setBankPage: React.Dispatch<React.SetStateAction<number>>;
  bankItems: SelectedQuestionItem[];
  bankTotal: number;
  bankTotalPages: number;
  bankLoading: boolean;
  availableChaptersForBank: Array<{ id: string; title: string }>;
  onGenerateQuestions: () => void;
  onBulkSelectPage: () => void;
  onToggleManualQuestion: (q: SelectedQuestionItem) => void;
  onPreviewQuestion: (q: SelectedQuestionItem) => void;
  updateForm: (updater: (prev: EditorFormState) => EditorFormState) => void;
}

export function TestQuestionsTab({
  form,
  examConfig,
  hasAttempts,
  totalQuestions,
  loadedQuestions,
  setLoadedQuestions,
  selectedIdSet,
  generating,
  shortages,
  allocationErrors,
  replaceTargetId,
  setReplaceTargetId,
  bankQuery,
  setBankQuery,
  bankSubject,
  setBankSubject,
  bankChapter,
  setBankChapter,
  bankDifficulty,
  setBankDifficulty,
  bankPage,
  setBankPage,
  bankItems,
  bankTotal,
  bankTotalPages,
  bankLoading,
  availableChaptersForBank,
  onGenerateQuestions,
  onBulkSelectPage,
  onToggleManualQuestion,
  onPreviewQuestion,
  updateForm,
}: TestQuestionsTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900">
            Selected: {loadedQuestions.length} / {totalQuestions}
          </span>
          <span className="text-slate-500">
            (Remaining: {Math.max(0, totalQuestions - loadedQuestions.length)})
          </span>
          <Badge variant="outline" className="bg-white text-[10px]">
            {form.questionSelectionMode === "AUTOMATIC"
              ? "Automatic"
              : "Manual"}
          </Badge>
        </div>

        {form.questionSelectionMode === "AUTOMATIC" && (
          <Button
            type="button"
            size="sm"
            disabled={hasAttempts || generating || allocationErrors.length > 0}
            onClick={onGenerateQuestions}
            className="h-8 gap-1.5 rounded-xl bg-brand-blue px-3 text-xs font-semibold text-white hover:bg-brand-blue/90"
          >
            {generating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : loadedQuestions.length > 0 ? (
              <RefreshCw className="size-3.5" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {loadedQuestions.length > 0
              ? "Regenerate Questions"
              : "Generate Questions"}
          </Button>
        )}
      </div>

      {form.questionSelectionMode === "AUTOMATIC" && shortages.length > 0 && (
        <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
          <div className="font-bold">Insufficient Questions:</div>
          {shortages.map((s, i) => (
            <div key={i}>
              • {s.subjectName}
              {s.chapterTitle ? ` – ${s.chapterTitle}` : ""}: Required{" "}
              {s.required}, Available {s.available}, Shortage{" "}
              <strong className="text-red-700">{s.shortage}</strong>
            </div>
          ))}
        </div>
      )}

      {(form.questionSelectionMode === "MANUAL" || replaceTargetId) && (
        <TestQuestionsBankPicker
          examConfig={examConfig}
          hasAttempts={hasAttempts}
          selectedIdSet={selectedIdSet}
          replaceTargetId={replaceTargetId}
          setReplaceTargetId={setReplaceTargetId}
          bankQuery={bankQuery}
          setBankQuery={setBankQuery}
          bankSubject={bankSubject}
          setBankSubject={setBankSubject}
          bankChapter={bankChapter}
          setBankChapter={setBankChapter}
          bankDifficulty={bankDifficulty}
          setBankDifficulty={setBankDifficulty}
          bankPage={bankPage}
          setBankPage={setBankPage}
          bankItems={bankItems}
          bankTotal={bankTotal}
          bankTotalPages={bankTotalPages}
          bankLoading={bankLoading}
          availableChaptersForBank={availableChaptersForBank}
          onBulkSelectPage={onBulkSelectPage}
          onToggleManualQuestion={onToggleManualQuestion}
          onPreviewQuestion={onPreviewQuestion}
        />
      )}

      {loadedQuestions.length > 0 && (
        <div className="space-y-1.5">
          {loadedQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs transition hover:border-slate-300"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                  #{idx + 1}
                </span>
                <span className="shrink-0 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-blue">
                  {q.subjectName}
                </span>
                <span
                  className="min-w-0 flex-1 truncate text-slate-800"
                  title={q.textEn || q.textTa || q.externalId}
                >
                  {q.textEn || q.textTa || q.externalId}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="Preview question"
                  className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                  onClick={() => onPreviewQuestion(q)}
                >
                  <Eye className="size-3.5" />
                </Button>
                {!hasAttempts && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px] font-medium text-brand-blue hover:bg-blue-50"
                      onClick={() => setReplaceTargetId(q.id)}
                    >
                      Replace
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title="Remove question"
                      className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => {
                        const next = loadedQuestions.filter(
                          (item) => item.id !== q.id,
                        );
                        setLoadedQuestions(next);
                        updateForm((p) => ({
                          ...p,
                          questionIds: next.map((i) => i.id),
                        }));
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
