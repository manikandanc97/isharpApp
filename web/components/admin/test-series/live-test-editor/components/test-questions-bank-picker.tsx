"use client";

import { Check, Eye, Loader2, Search, X } from "lucide-react";
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
  SelectedQuestionItem,
} from "../../types";

interface TestQuestionsBankPickerProps {
  examConfig: ExamPatternConfigResponse;
  hasAttempts: boolean;
  selectedIdSet: Set<string>;
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
  onBulkSelectPage: () => void;
  onToggleManualQuestion: (q: SelectedQuestionItem) => void;
  onPreviewQuestion: (q: SelectedQuestionItem) => void;
}

export function TestQuestionsBankPicker({
  examConfig,
  hasAttempts,
  selectedIdSet,
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
  onBulkSelectPage,
  onToggleManualQuestion,
  onPreviewQuestion,
}: TestQuestionsBankPickerProps) {
  return (
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
                  isSel ? "border-brand-blue bg-blue-50/30" : "border-slate-200"
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
  );
}
