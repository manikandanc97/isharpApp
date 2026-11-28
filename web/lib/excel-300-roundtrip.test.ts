import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./nest-api", () => ({
  getNestApiBaseUrl: () => "http://localhost:3001",
  getNestApiClient: () => ({}),
}));

import ExcelJS from "exceljs";
import { performance } from "node:perf_hooks";
import { QUESTION_HEADERS } from "./question-import";
import {
  deduplicateImportRows,
  parseQuestionsWorkbook,
} from "./question-import-stream";

// Valid PNG > 100 bytes (smaller <=100B 1x1 placeholders are intentionally filtered)
const VALID_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGNgAAAAAgAB4iG8MwAAACB0RVh0Q29tbWVudABUZXN0IGVtYmVkZGVkIGltYWdlIHBheWxvYWQgZGF0YUKie4cAAAAASUVORK5CYII=",
  "base64",
);

describe("300+ Question Bilingual Excel Import Fixture & Benchmark", () => {
  it("parses, extracts images, validates, and deduplicates a 305-row mixed workbook", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Questions");
    sheet.addRow([...QUESTION_HEADERS]);

    const subjects = ["PHYSICS", "CHEMISTRY", "BOTANY", "ZOOLOGY"];
    const difficulties = ["EASY", "MEDIUM", "HARD"];
    const pngId = workbook.addImage({ buffer: VALID_PNG as never, extension: "png" });

    // 300 unique valid bilingual questions (mix of MCQ + NUMERICAL + math expressions)
    for (let i = 1; i <= 300; i++) {
      const subject = subjects[i % subjects.length];
      const diff = difficulties[i % difficulties.length];
      const isNumerical = i % 10 === 0;
      const rowData: Record<string, string> = {
        external_id: `SYNTH-${subject}-${String(i).padStart(4, "0")}`,
        course_code: "NEET",
        subject_code: subject,
        chapter_title: `${subject} Chapter ${(i % 5) + 1}`,
        question_type: isNumerical ? "NUMERICAL" : "SINGLE_CHOICE",
        difficulty: diff,
        source: "Synthetic QA Fixture",
        question_text_en: `Q${i}: Evaluate ∫(x^2 + ${i})dx and ΔG = ΔH - TΔS for 10^-6 M`,
        question_text_ta: `கே${i}: ∫(x^2 + ${i})dx மற்றும் ΔG = ΔH - TΔS மதிப்பைக் கணக்கிடுக`,
        question_image: "",
        option_1_en: isNumerical ? "" : `Value ${i}A`,
        option_1_ta: isNumerical ? "" : `மதிப்பு ${i}அ`,
        option_1_image: "",
        option_2_en: isNumerical ? "" : `Value ${i}B`,
        option_2_ta: isNumerical ? "" : `மதிப்பு ${i}ஆ`,
        option_2_image: "",
        option_3_en: isNumerical ? "" : `Value ${i}C`,
        option_3_ta: isNumerical ? "" : `மதிப்பு ${i}இ`,
        option_3_image: "",
        option_4_en: isNumerical ? "" : `Value ${i}D`,
        option_4_ta: isNumerical ? "" : `மதிப்பு ${i}ஈ`,
        option_4_image: "",
        correct_options: isNumerical ? "" : String(((i - 1) % 4) + 1),
        numerical_answer: isNumerical ? String(i * 2.5) : "",
        solution_en: `Step-by-step solution for Q${i}`,
        solution_ta: `கே${i}-க்கான படிப்படியான தீர்வு`,
        solution_image: "",
        correct_marks: "4",
        negative_marks: "1",
      };

      const row = sheet.addRow(QUESTION_HEADERS.map((h) => rowData[h] ?? ""));
      // Embed images on first 5 rows (question, option_1, solution)
      if (i <= 5) {
        const qCol = QUESTION_HEADERS.indexOf("question_image");
        const oCol = QUESTION_HEADERS.indexOf("option_1_image");
        const sCol = QUESTION_HEADERS.indexOf("solution_image");
        sheet.addImage(pngId, {
          tl: { col: qCol, row: row.number - 1 },
          ext: { width: 16, height: 16 },
        });
        sheet.addImage(pngId, {
          tl: { col: oCol, row: row.number - 1 },
          ext: { width: 16, height: 16 },
        });
        sheet.addImage(pngId, {
          tl: { col: sCol, row: row.number - 1 },
          ext: { width: 16, height: 16 },
        });
      }
    }

    // 1 exact intra-file duplicate of row 6 (no embedded image)
    const row6Subject = subjects[6 % subjects.length];
    const dupRow6: Record<string, string> = {
      external_id: "DUP-OF-ROW-6",
      course_code: "NEET",
      subject_code: row6Subject,
      chapter_title: `${row6Subject} Chapter ${(6 % 5) + 1}`,
      question_type: "SINGLE_CHOICE",
      difficulty: difficulties[6 % difficulties.length],
      source: "Synthetic QA Fixture",
      question_text_en: "Q6: Evaluate ∫(x^2 + 6)dx and ΔG = ΔH - TΔS for 10^-6 M",
      question_text_ta: "கே6: ∫(x^2 + 6)dx மற்றும் ΔG = ΔH - TΔS மதிப்பைக் கணக்கிடுக",
      option_1_en: "Value 6A",
      option_1_ta: "மதிப்பு 6அ",
      option_2_en: "Value 6B",
      option_2_ta: "மதிப்பு 6ஆ",
      option_3_en: "Value 6C",
      option_3_ta: "மதிப்பு 6இ",
      option_4_en: "Value 6D",
      option_4_ta: "மதிப்பு 6ஈ",
      correct_options: "2",
      solution_en: "Step-by-step solution for Q6",
      solution_ta: "கே6-க்கான படிப்படியான தீர்வு",
      correct_marks: "4",
      negative_marks: "1",
    };
    sheet.addRow(QUESTION_HEADERS.map((h) => dupRow6[h] ?? ""));

    // Add 4 invalid rows (missing text / missing correct_options)
    for (let bad = 1; bad <= 4; bad++) {
      sheet.addRow(
        QUESTION_HEADERS.map((h) =>
          h === "external_id"
            ? `BAD-${bad}`
            : h === "subject_code"
              ? "PHYSICS"
              : h === "question_type"
                ? "SINGLE_CHOICE"
                : "",
        ),
      );
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const file = new File([buffer], "synthetic-305-questions.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const t0 = performance.now();
    const parsed = await parseQuestionsWorkbook(file);
    const parseMs = performance.now() - t0;

    const t1 = performance.now();
    const { candidateRows, skipped } = deduplicateImportRows(parsed.allRows);
    const dedupMs = performance.now() - t1;

    expect(parsed.allRows.length).toBe(305);
    expect(parsed.embedded.length).toBe(15); // 5 rows * 3 images each
    expect(skipped.some((s) => s.externalId === "DUP-OF-ROW-6")).toBe(true);
    expect(skipped.length).toBe(4); // DUP-OF-ROW-6 + BAD-2..4 identical empty rows
    expect(candidateRows.length).toBe(301);
    expect(parseMs).toBeLessThan(15000);
    expect(dedupMs).toBeLessThan(500);
  }, 30000);
});
