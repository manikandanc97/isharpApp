import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { collectEmbeddedImages } from "./excel-embedded-images";
import { createFailedRowsWorkbook } from "./question-import-retry";

describe("createFailedRowsWorkbook", () => {
  it("keeps only failed rows, their errors and their embedded images", async () => {
    const source = new ExcelJS.Workbook();
    const sheet = source.addWorksheet("Questions");
    sheet.addRow(["subject_code", "question_text_en", "question_image"]);
    sheet.addRow(["PHYSICS", "successful row", ""]);
    sheet.addRow(["PHYSICS", "failed row", ""]);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="190" height="110" viewBox="0 0 190 110"><rect width="190" height="110" fill="white"/><path d="M10 10 L180 100" stroke="#173b67" stroke-width="3"/></svg>';
    const imageId = source.addImage({
      base64: Buffer.from(svg).toString("base64"),
      extension: "svg" as "png",
    });
    sheet.addImage(imageId, "C3:C3");

    const outputBytes = await createFailedRowsWorkbook(
      Buffer.from(await source.xlsx.writeBuffer()),
      [{ row: 3, externalId: "PHY-003", error: "Solution text or image is required" }],
    );

    const output = new ExcelJS.Workbook();
    await output.xlsx.load(outputBytes as never);
    const questions = output.getWorksheet("Questions")!;
    expect(questions.rowCount).toBe(2);
    expect(questions.getCell("B2").text).toBe("failed row");
    expect(questions.getCell("D2").value).toBe(3);
    expect(questions.getCell("E2").text).toBe("Solution text or image is required");
    expect(output.getWorksheet("Retry Instructions")).toBeDefined();

    const images = collectEmbeddedImages(
      output,
      questions,
      ["subject_code", "question_text_en", "question_image", "original_excel_row", "import_error"],
    );
    expect(images).toHaveLength(1);
    expect(images[0]).toMatchObject({ rowNumber: 2, columnName: "question_image", extension: "svg" });
  });
});
