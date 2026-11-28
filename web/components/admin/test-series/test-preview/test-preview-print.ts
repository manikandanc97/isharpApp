import type { SelectedQuestionItem } from "../types";

export interface TestPreviewPayload {
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

export type PrintLanguage = "BILINGUAL" | "EN" | "TA";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function printHtmlDocument(html: string) {
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
    window.setTimeout(triggerPrint, 2500);
  }
}

export function buildStudentPaperHtml(
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
    .paper-title { font-size: 15pt; font-weight: 700; margin: 0; }
    .paper-code { font-family: monospace; font-size: 9pt; color: #475569; }
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
    .q-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .q-num { font-weight: 700; font-size: 10.5pt; }
    .q-subj { font-size: 8.5pt; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.03em; }
    .q-en { font-size: 10.5pt; font-weight: 500; white-space: pre-wrap; }
    .q-ta { font-size: 9.5pt; color: #334155; margin-top: 2px; white-space: pre-wrap; }
    .q-img { max-height: 150px; margin-top: 6px; border: 1px solid #cbd5e1; border-radius: 4px; }
    .options { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 14px; margin-top: 6px; }
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

export function buildAnswerKeyHtml(data: TestPreviewPayload): string {
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
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; }
    h1 { font-size: 14pt; margin: 0 0 4px; }
    .meta { font-size: 9.5pt; color: #475569; margin-bottom: 14px; }
    .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
    .cell { border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; font-size: 10pt; }
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
