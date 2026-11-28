"use client";

import {
  Check,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ExamPatternConfigResponse,
  QuestionShortageDetail,
  SelectedQuestionItem,
} from "../../types";
import type { EditorFormState } from "../test-editor.types";

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
        <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5">
          {replaceTargetId && (
            <div className="flex items-center justify-between rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs text-brand-blue">
              <span>Pick a replacement question below.</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px]"
                onClick={() => setReplaceTargetId(null)}
              >
                Cancel
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="relative min-w-36 flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={bankQuery}
                onChange={(e) => {
                  setBankQuery(e.target.value);
                  setBankPage(1);
                }}
                placeholder="Search bank..."
                className="h-7 bg-white pl-7 pr-7 text-[11px]"
              />
              {bankQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setBankQuery("");
                    setBankPage(1);
                  }}
                  aria-label="Clear question search"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            <Select
              value={bankSubject}
              onValueChange={(v) => {
                if (!v) return;
                setBankSubject(v);
                setBankChapter("ALL");
                setBankPage(1);
              }}
            >
              <SelectTrigger className="h-7 w-auto min-w-[128px] bg-white px-2.5 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Subjects</SelectItem>
                {Array.from(
                  new Map(
                    examConfig.subjects.map((s) => [s.subjectCode, s]),
                  ).values(),
                ).map((s) => (
                  <SelectItem key={s.subjectCode} value={s.subjectCode}>
                    {s.subjectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {availableChaptersForBank.length > 0 && (
              <Select
                value={bankChapter}
                onValueChange={(v) => {
                  if (!v) return;
                  setBankChapter(v);
                  setBankPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-auto min-w-[140px] max-w-[200px] bg-white px-2.5 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Chapters</SelectItem>
                  {availableChaptersForBank.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select
              value={bankDifficulty}
              onValueChange={(v) => {
                if (!v) return;
                setBankDifficulty(v);
                setBankPage(1);
              }}
            >
              <SelectTrigger className="h-7 w-auto min-w-[96px] bg-white px-2.5 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>

            {!replaceTargetId && !hasAttempts && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 bg-white px-2 text-[11px]"
                onClick={onBulkSelectPage}
              >
                Select Page
              </Button>
            )}
          </div>

          {bankLoading ? (
            <div className="py-6 text-center text-xs text-slate-500">
              <Loader2 className="mx-auto mb-1 size-4 animate-spin" />
              Searching...
            </div>
          ) : (
            <div className="space-y-1.5">
              {bankItems.map((q) => {
                const isSel = selectedIdSet.has(q.id);
                return (
                  <div
                    key={q.id}
                    className={`flex items-start justify-between gap-2 rounded-lg border bg-white p-2 text-[11px] ${
                      isSel
                        ? "border-brand-blue bg-blue-50/30"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-slate-500">
                        <span className="font-mono font-semibold text-slate-700">
                          {q.externalId}
                        </span>{" "}
                        • {q.subjectName}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-slate-900">
                        {q.textEn || q.textTa || "(Image question)"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5"
                        onClick={() => onPreviewQuestion(q)}
                      >
                        <Eye className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={isSel ? "secondary" : "default"}
                        className="h-6 px-2 text-[10px]"
                        disabled={
                          hasAttempts || (Boolean(replaceTargetId) && isSel)
                        }
                        onClick={() => onToggleManualQuestion(q)}
                      >
                        {replaceTargetId ? (
                          "Use"
                        ) : isSel ? (
                          <>
                            <Check className="mr-0.5 size-3" /> Added
                          </>
                        ) : (
                          "Add"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                <span>{bankTotal} eligible</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    disabled={bankPage <= 1}
                    onClick={() => setBankPage((p) => p - 1)}
                  >
                    Prev
                  </Button>
                  <span>
                    {bankPage}/{bankTotalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    disabled={bankPage >= bankTotalPages}
                    onClick={() => setBankPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assigned / Selected Questions List */}
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
