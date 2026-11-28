"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
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
import { QuestionDiagram } from "@/components/shared/questions/question-diagram";
import type { SelectedQuestionItem } from "./types";

interface TestPreviewDialogProps {
  testId: string | null;
  onClose: () => void;
}

interface TestPreviewPayload {
  id: string;
  title: string;
  code: string;
  description: string | null;
  categoryName: string | null;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  correctMarks: number;
  negativeMarks: number;
  isActive: boolean;
  questions: Array<{
    position: number;
    section: string;
    question: SelectedQuestionItem & {
      courseSubject?: { subject?: { name: string; code: string } };
      chapter?: { title: string } | null;
    };
  }>;
}

type PrintLanguage = "BILINGUAL" | "EN" | "TA";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function printHtmlDocument(html: string) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc || !iframe.contentWindow) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const triggerPrint = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    window.setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 1000);
  };

  // Wait briefly for images/styles to settle before invoking print dialog
  const images = Array.from(doc.images);
  if (images.length === 0) {
    window.setTimeout(triggerPrint, 150);
  } else {
    let loaded = 0;
    const done = () => {
      loaded += 1;
      if (loaded >= images.length) {
        window.setTimeout(triggerPrint, 100);
      }
    };
    images.forEach((img) => {
      if (img.complete) done();
      else {
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      }
    });
    // Fallback timeout in case an image hangs
    window.setTimeout(triggerPrint, 2500);
  }
}

function buildStudentPaperHtml(
  data: TestPreviewPayload,
  language: PrintLanguage,
): string {
  const showEn = language === "BILINGUAL" || language === "EN";
  const showTa = language === "BILINGUAL" || language === "TA";

  const questionsHtml = data.questions
    .map((item) => {
      const q = item.question;
      const subjectLabel =
        q.courseSubject?.subject?.name ?? q.subjectName ?? item.section;

      const optionsHtml = (q.options ?? [])
        .map((opt) => {
          const enLine =
            showEn && opt.textEn
              ? `<div class="opt-en">${escapeHtml(opt.textEn)}</div>`
              : "";
          const taLine =
            showTa && opt.textTa
              ? `<div class="opt-ta">${escapeHtml(opt.textTa)}</div>`
              : "";
          const imgLine = opt.imageUrl
            ? `<img src="${escapeHtml(opt.imageUrl)}" alt="Option ${escapeHtml(opt.label)}" class="opt-img" />`
            : "";
          return `
            <div class="opt">
              <span class="opt-label">(${escapeHtml(opt.label)})</span>
              <div class="opt-body">${enLine}${taLine}${imgLine}</div>
            </div>
          `;
        })
        .join("");

      return `
        <div class="question">
          <div class="q-head">
            <span class="q-num">Q${item.position}.</span>
            <span class="q-subj">${escapeHtml(subjectLabel)}</span>
          </div>
          ${showEn && q.textEn ? `<div class="q-en">${escapeHtml(q.textEn)}</div>` : ""}
          ${showTa && q.textTa ? `<div class="q-ta">${escapeHtml(q.textTa)}</div>` : ""}
          ${q.questionImageUrl ? `<img src="${escapeHtml(q.questionImageUrl)}" alt="Question ${item.position}" class="q-img" />` : ""}
          <div class="options">${optionsHtml}</div>
        </div>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.title)} - Question Paper</title>
  <style>
    @page { size: A4; margin: 12mm 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      font-size: 11pt;
      line-height: 1.4;
      margin: 0;
    }
    .paper-header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .paper-title-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
    }
    .paper-title {
      font-size: 15pt;
      font-weight: 700;
      margin: 0;
    }
    .paper-code {
      font-family: monospace;
      font-size: 9pt;
      color: #475569;
    }
    .paper-meta {
      margin-top: 4px;
      font-size: 9.5pt;
      color: #334155;
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
    }
    .student-info {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px dashed #94a3b8;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      font-size: 9.5pt;
    }
    .student-field { flex: 1; }
    .question {
      break-inside: avoid;
      page-break-inside: avoid;
      padding: 8px 0 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    .q-head {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .q-num { font-weight: 700; font-size: 10.5pt; }
    .q-subj {
      font-size: 8.5pt;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .q-en { font-size: 10.5pt; font-weight: 500; white-space: pre-wrap; }
    .q-ta { font-size: 9.5pt; color: #334155; margin-top: 2px; white-space: pre-wrap; }
    .q-img {
      max-height: 150px;
      margin-top: 6px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
    }
    .options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px 14px;
      margin-top: 6px;
    }
    .opt { display: flex; align-items: flex-start; gap: 6px; font-size: 9.5pt; }
    .opt-label { font-weight: 700; min-width: 22px; }
    .opt-body { flex: 1; min-width: 0; }
    .opt-ta { font-size: 9pt; color: #475569; }
    .opt-img { max-height: 60px; margin-top: 3px; }
  </style>
</head>
<body>
  <div class="paper-header">
    <div class="paper-title-row">
      <h1 class="paper-title">${escapeHtml(data.title)}</h1>
      <span class="paper-code">${escapeHtml(data.code)}</span>
    </div>
    <div class="paper-meta">
      <span><strong>Category:</strong> ${escapeHtml(data.categoryName ?? "General")}</span>
      <span><strong>Questions:</strong> ${data.questions.length}</span>
      <span><strong>Duration:</strong> ${data.durationMinutes} mins</span>
      <span><strong>Max Marks:</strong> ${data.totalMarks} (+${data.correctMarks} / -${data.negativeMarks})</span>
    </div>
    <div class="student-info">
      <div class="student-field">Student Name: ______________________________</div>
      <div class="student-field">Roll No: ________________</div>
      <div class="student-field">Date: ____________</div>
    </div>
  </div>
  ${questionsHtml}
</body>
</html>`;
}

function buildAnswerKeyHtml(data: TestPreviewPayload): string {
  const cells = data.questions
    .map((item) => {
      const correct = item.question.options?.find((o) => o.isCorrect);
      return `<div class="cell"><span class="q">Q${item.position}</span><span class="ans">${escapeHtml(correct?.label ?? "-")}</span></div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.title)} - Answer Key</title>
  <style>
    @page { size: A4; margin: 14mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      margin: 0;
    }
    h1 { font-size: 14pt; margin: 0 0 4px; }
    .meta { font-size: 9.5pt; color: #475569; margin-bottom: 14px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
    }
    .cell {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10pt;
    }
    .q { font-weight: 600; color: #475569; }
    .ans { font-weight: 700; color: #0f172a; }
  </style>
</head>
<body>
  <h1>${escapeHtml(data.title)} — Answer Key</h1>
  <div class="meta">${escapeHtml(data.categoryName ?? "General")} • ${data.questions.length} Questions • ${escapeHtml(data.code)}</div>
  <div class="grid">${cells}</div>
</body>
</html>`;
}

export function TestPreviewDialog({ testId, onClose }: TestPreviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TestPreviewPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(true);
  const [language, setLanguage] = useState<PrintLanguage>("BILINGUAL");

  useEffect(() => {
    if (!testId) {
      return;
    }
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
          if (active) setError(err instanceof Error ? err.message : "Failed to load");
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
                      <SelectItem value="BILINGUAL">Bilingual (EN + TA)</SelectItem>
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
                    onClick={() => printHtmlDocument(buildAnswerKeyHtml(data))}
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
                {data.questions.map((item) => {
                  const q = item.question;
                  const subjectLabel =
                    q.courseSubject?.subject?.name ?? q.subjectName ?? item.section;
                  return (
                    <div
                      key={`${item.position}-${q.id}`}
                      className="rounded-xl border border-slate-200 bg-white p-4 text-xs"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                            Q{item.position}
                          </span>
                          <span className="font-semibold text-brand-blue">
                            {subjectLabel}
                          </span>
                          {q.chapter?.title && (
                            <span className="text-slate-400">
                              • {q.chapter.title}
                            </span>
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
                            <span className="font-bold text-slate-700">
                              {opt.label}.
                            </span>
                            <div className="min-w-0 flex-1">
                              {(language === "BILINGUAL" || language === "EN") &&
                                opt.textEn && (
                                  <div className="text-slate-800">{opt.textEn}</div>
                                )}
                              {(language === "BILINGUAL" || language === "TA") &&
                                opt.textTa && (
                                  <div className="text-[11px] text-slate-500">
                                    {opt.textTa}
                                  </div>
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

                      {showAnswers &&
                        (q.solutionEn || q.solutionTa || q.solutionImageUrl) && (
                        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/40 p-2.5 text-[11px] text-slate-700">
                          <span className="font-semibold text-brand-blue">
                            Solution:{" "}
                          </span>
                          {q.solutionEn && <span>{q.solutionEn}</span>}
                          {q.solutionTa && (
                            <div className="mt-0.5 text-slate-500">
                              {q.solutionTa}
                            </div>
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
                })}
              </div>
            )}
          </div>
        ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
