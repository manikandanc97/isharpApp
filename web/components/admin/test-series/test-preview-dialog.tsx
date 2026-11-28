"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Eye,
  EyeOff,
  FileQuestion,
  KeyRound,
  Loader2,
  Printer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildAnswerKeyHtml,
  buildStudentPaperHtml,
  printHtmlDocument,
  type PrintLanguage,
  type TestPreviewPayload,
} from "./test-preview/test-preview-print";
import { TestPreviewQuestionCard } from "./test-preview/test-preview-question-card";

interface TestPreviewDialogProps {
  testId: string | null;
  onClose: () => void;
}

export function TestPreviewDialog({ testId, onClose }: TestPreviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TestPreviewPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(true);
  const [language, setLanguage] = useState<PrintLanguage>("BILINGUAL");

  useEffect(() => {
    if (!testId) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      fetch(`/api/admin/test-series/tests/${encodeURIComponent(testId)}`, {
        cache: "no-store",
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || "Failed to load test preview");
          }
          return res.json();
        })
        .then((payload) => {
          if (active) setData(payload);
        })
        .catch((err) => {
          if (active) {
            setError(err instanceof Error ? err.message : "Failed to load");
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [testId]);

  return (
    <Dialog open={Boolean(testId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-4 pr-12">
          <DialogTitle>{data?.title || "Test Preview"}</DialogTitle>
          <DialogDescription>
            {data
              ? `${data.categoryName ?? "Uncategorized"} • ${data.totalQuestions} Questions • ${data.durationMinutes} min • ${data.totalMarks} Marks (+${data.correctMarks} / -${data.negativeMarks})`
              : "Loading test details..."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-xs text-slate-500">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading test questions...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              {error}
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    <FileQuestion className="mr-1 size-3" />
                    {data.questions.length} Assigned Questions
                  </Badge>
                  <Badge variant="outline">
                    <Clock className="mr-1 size-3" />
                    {data.durationMinutes} Minutes
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      data.isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    }
                  >
                    {data.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {data.questions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={language}
                      onValueChange={(val) =>
                        val && setLanguage(val as PrintLanguage)
                      }
                    >
                      <SelectTrigger className="h-8 w-auto min-w-[130px] bg-white px-2.5 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BILINGUAL">
                          Bilingual (EN + TA)
                        </SelectItem>
                        <SelectItem value="EN">English Only</SelectItem>
                        <SelectItem value="TA">Tamil Only</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAnswers((prev) => !prev)}
                      className="h-8 cursor-pointer gap-1.5 bg-white text-xs"
                    >
                      {showAnswers ? (
                        <>
                          <EyeOff className="size-3.5" />
                          Hide Answers
                        </>
                      ) : (
                        <>
                          <Eye className="size-3.5" />
                          Show Answers
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        printHtmlDocument(buildAnswerKeyHtml(data))
                      }
                      className="h-8 cursor-pointer gap-1.5 bg-white text-xs"
                    >
                      <KeyRound className="size-3.5" />
                      Answer Key
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        printHtmlDocument(buildStudentPaperHtml(data, language))
                      }
                      className="h-8 cursor-pointer gap-1.5 bg-brand-blue text-xs font-semibold text-white hover:bg-brand-blue/90"
                    >
                      <Printer className="size-3.5" />
                      Print Question Paper
                    </Button>
                  </div>
                )}
              </div>

              {data.questions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                  No questions have been assigned to this test yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.questions.map((item) => (
                    <TestPreviewQuestionCard
                      key={`${item.position}-${item.question.id}`}
                      item={item}
                      language={language}
                      showAnswers={showAnswers}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
