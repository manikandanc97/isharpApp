import ExcelJS from "exceljs";
import { QUESTION_HEADERS } from "./question-import";
import type { Question } from "@/components/question-bank/types";

export async function exportQuestionsToExcel(
  questions: Question[],
  fileName = "i-sharp-questions-export.xlsx"
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "I-SHARP Academy";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Questions");

  // Add header row
  const headerRow = worksheet.addRow([...QUESTION_HEADERS]);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0E387A" }, // I-Sharp brand blue
  };
  headerRow.height = 24;

  // Add each question
  questions.forEach((q) => {
    const optA = q.options.find((o) => o.label === "A" || o.label === "1");
    const optB = q.options.find((o) => o.label === "B" || o.label === "2");
    const optC = q.options.find((o) => o.label === "C" || o.label === "3");
    const optD = q.options.find((o) => o.label === "D" || o.label === "4");

    const correctLabels: string[] = [];
    q.options.forEach((o, i) => {
      if (o.isCorrect) {
        correctLabels.push(String(i + 1));
      }
    });

    const row = [
      q.externalId,
      q.courseSubject?.course?.code || "NEET",
      q.courseSubject?.subject?.code || "PHYSICS",
      q.chapter?.title || "",
      q.type || "SINGLE_CORRECT",
      q.language || "BILINGUAL",
      q.difficulty || "MEDIUM",
      q.textEn || "",
      q.textTa || "",
      q.questionImageUrl || "",
      optA?.textEn || "",
      optA?.textTa || "",
      optA?.imageUrl || "",
      optB?.textEn || "",
      optB?.textTa || "",
      optB?.imageUrl || "",
      optC?.textEn || "",
      optC?.textTa || "",
      optC?.imageUrl || "",
      optD?.textEn || "",
      optD?.textTa || "",
      optD?.imageUrl || "",
      correctLabels.join(","),
      q.numericalAnswer || "",
      q.solutionEn || "",
      q.solutionTa || "",
      q.solutionImageUrl || "",
      q.correctMarks ?? 4,
      q.negativeMarks ?? 1,
      q.source || "",
    ];

    worksheet.addRow(row);
  });

  // Auto-fit column widths
  worksheet.columns.forEach((col) => {
    col.width = 18;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
