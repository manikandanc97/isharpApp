import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { exportQuestionsToExcel } from "./question-export";
import type { Question } from "@/components/question-bank/types";

const WEB_ROOT = path.resolve(import.meta.dirname, "..");

describe("Phase 1 & 1.1 Regression Guardrails", () => {
  it("exports bilingual Tamil & English questions to Excel using on-demand ExcelJS", async () => {
    const capturedBlobs: Blob[] = [];
    const clickMock = vi.fn();

    vi.stubGlobal("URL", {
      createObjectURL: vi.fn((blob: Blob) => {
        capturedBlobs.push(blob);
        return "blob:mock-export";
      }),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal("document", {
      createElement: vi.fn(() => ({
        href: "",
        download: "",
        click: clickMock,
      })),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    });

    const sampleQuestion: Question = {
      id: "q-1",
      externalId: "PHY-001",
      type: "SINGLE_CORRECT",
      language: "BILINGUAL",
      difficulty: "MEDIUM",
      textEn: "What is the SI unit of force?",
      textTa: "விசையின் SI அலகு என்ன?",
      questionImageUrl: "https://example.com/q.png",
      solutionEn: "Newton",
      solutionTa: "நியூட்டன்",
      solutionImageUrl: null,
      correctMarks: 4,
      negativeMarks: 1,
      source: "NCERT",
      numericalAnswer: null,
      courseSubject: {
        course: { code: "NEET" },
        subject: { code: "PHYSICS", name: "Physics" },
      },
      chapter: { title: "Laws of Motion" },
      options: [
        { label: "A", textEn: "Newton", textTa: "நியூட்டன்", imageUrl: null, isCorrect: true },
        { label: "B", textEn: "Joule", textTa: "ஜூல்", imageUrl: null, isCorrect: false },
        { label: "C", textEn: "Watt", textTa: "வாட்", imageUrl: null, isCorrect: false },
        { label: "D", textEn: "Pascal", textTa: "பாஸ்கல்", imageUrl: null, isCorrect: false },
      ],
    };

    try {
      await exportQuestionsToExcel([sampleQuestion], "test-export.xlsx");
      expect(clickMock).toHaveBeenCalledTimes(1);
      expect(capturedBlobs).toHaveLength(1);
      expect(capturedBlobs[0].size).toBeGreaterThan(1000);
    } finally {
      vi.unstubAllGlobals();
    }
  }, 15_000);

  it("does not statically import exceljs in client export modules", () => {
    const questionExportSrc = readFileSync(
      path.join(WEB_ROOT, "lib/question-export.ts"),
      "utf8",
    );
    const resultsSectionSrc = readFileSync(
      path.join(WEB_ROOT, "components/admin/results/results-section.tsx"),
      "utf8",
    );
    const resultsExportSrc = readFileSync(
      path.join(WEB_ROOT, "components/admin/results/results-export.ts"),
      "utf8",
    );

    expect(questionExportSrc).not.toMatch(/^import\s+ExcelJS\s+from/m);
    expect(resultsSectionSrc).not.toMatch(/^import\s+ExcelJS\s+from/m);
    expect(resultsExportSrc).not.toMatch(/^import\s+ExcelJS\s+from/m);
    expect(questionExportSrc).toContain('await import("exceljs")');
    expect(resultsExportSrc).toContain('await import("exceljs")');
  });

  it("preserves secondary-soft variant in shared Button component", () => {
    const buttonSrc = readFileSync(
      path.join(WEB_ROOT, "components/ui/button.tsx"),
      "utf8",
    );
    expect(buttonSrc).toContain('"secondary-soft"');
  });

  it("keeps removed dead/orphaned files deleted", () => {
    const removed = [
      "components/admin/test-series/test-config-workspace.tsx",
      "components/admin/test-series/test-series-details-view.tsx",
      "components/admin/test-series/question-selector-dialog.tsx",
      "components/admin/test-series/blueprint-builder-dialog.tsx",
      "components/admin/test-series/test-editor-dialog.tsx",
      "components/admin/test-series/test-series-table.tsx",
      "components/admin/test-series/horizontal-category-bar.tsx",
      "components/admin/test-series/category-manager-dialog.tsx",
      "components/admin/test-series/test-series-overview.tsx",
      "components/admin/test-series/test-series-dialog.tsx",
      "lib/test-series-store.ts",
      "lib/test-series-store.test.ts",
      "lib/demo-questions.data.json",
      "app/administration/admin-control-center-preview.tsx",
    ];

    for (const relPath of removed) {
      expect(existsSync(path.join(WEB_ROOT, relPath))).toBe(false);
    }
  });
});
