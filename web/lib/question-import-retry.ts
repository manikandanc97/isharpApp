import ExcelJS from "exceljs";
import { collectEmbeddedImages } from "./excel-embedded-images";
import { normalizeExcelXmlBuffer } from "./excel-patch";

export type FailedImportRow = {
  row: number;
  externalId?: string;
  error?: string;
};

function copyCell(source: ExcelJS.Cell, target: ExcelJS.Cell) {
  target.value = source.value;
  target.style = { ...source.style };
  target.numFmt = source.numFmt;
}

export async function createFailedRowsWorkbook(
  sourceBytes: Buffer,
  failures: FailedImportRow[],
) {
  const normalized = await normalizeExcelXmlBuffer(sourceBytes);
  const sourceBook = new ExcelJS.Workbook();
  await sourceBook.xlsx.load(normalized as never);
  const sourceSheet =
    sourceBook.getWorksheet("Questions") ?? sourceBook.worksheets[0];
  if (!sourceSheet) throw new Error("Questions worksheet was not found");

  const uniqueFailures = [
    ...new Map(failures.map((failure) => [failure.row, failure])).values(),
  ].sort((left, right) => left.row - right.row);
  if (!uniqueFailures.length || uniqueFailures.length > 500)
    throw new Error("Select 1 to 500 failed rows");

  const sourceHeaders = (sourceSheet.getRow(1).values as unknown[])
    .slice(1)
    .map((value) => String(value ?? "").trim());
  if (!sourceHeaders.some(Boolean)) throw new Error("Workbook headers are missing");

  const outputBook = new ExcelJS.Workbook();
  outputBook.creator = "iSharp controlled import";
  outputBook.created = new Date();
  const outputSheet = outputBook.addWorksheet("Questions", {
    views: sourceSheet.views,
  });

  sourceHeaders.forEach((header, index) => {
    copyCell(sourceSheet.getRow(1).getCell(index + 1), outputSheet.getRow(1).getCell(index + 1));
    outputSheet.getRow(1).getCell(index + 1).value = header;
    outputSheet.getColumn(index + 1).width =
      sourceSheet.getColumn(index + 1).width ?? 18;
  });
  const originalRowColumn = sourceHeaders.length + 1;
  const errorColumn = sourceHeaders.length + 2;
  outputSheet.getCell(1, originalRowColumn).value = "original_excel_row";
  outputSheet.getCell(1, errorColumn).value = "import_error";
  outputSheet.getColumn(originalRowColumn).width = 18;
  outputSheet.getColumn(errorColumn).width = 55;
  outputSheet.getRow(1).font = { ...outputSheet.getRow(1).font, bold: true };
  outputSheet.views = [{ state: "frozen", ySplit: 1 }];

  const outputRowsBySourceRow = new Map<number, number>();
  uniqueFailures.forEach((failure, index) => {
    if (!Number.isInteger(failure.row) || failure.row < 2 || failure.row > sourceSheet.rowCount)
      throw new Error(`Failed row ${failure.row} does not exist in the workbook`);
    const targetRowNumber = index + 2;
    const sourceRow = sourceSheet.getRow(failure.row);
    const targetRow = outputSheet.getRow(targetRowNumber);
    sourceHeaders.forEach((_header, columnIndex) =>
      copyCell(sourceRow.getCell(columnIndex + 1), targetRow.getCell(columnIndex + 1)),
    );
    targetRow.getCell(originalRowColumn).value = failure.row;
    targetRow.getCell(errorColumn).value = failure.error || "Import failed";
    targetRow.getCell(errorColumn).note =
      "Correct this row, save the workbook, then upload this failed-rows workbook.";
    targetRow.height = sourceRow.height ?? 72;
    outputRowsBySourceRow.set(failure.row, targetRowNumber);
  });

  const images = collectEmbeddedImages(sourceBook, sourceSheet, sourceHeaders);
  for (const image of images) {
    const targetRow = outputRowsBySourceRow.get(image.rowNumber);
    if (!targetRow) continue;
    const columnIndex = sourceHeaders.indexOf(image.columnName);
    if (columnIndex < 0) continue;
    const imageId = outputBook.addImage({
      base64: Buffer.from(image.bytes).toString("base64"),
      extension: image.extension as "png",
    });
    outputSheet.addImage(imageId, {
      tl: { col: columnIndex + 0.08, row: targetRow - 0.92 },
      ext: { width: 180, height: 96 },
      editAs: "oneCell",
    });
  }

  const instructions = outputBook.addWorksheet("Retry Instructions");
  instructions.columns = [
    { header: "Step", key: "step", width: 12 },
    { header: "Action", key: "action", width: 90 },
  ];
  instructions.addRows([
    { step: 1, action: "Open the Questions sheet and correct only the rows listed there." },
    { step: 2, action: "Use import_error and original_excel_row for reference. Do not rename template columns." },
    { step: 3, action: "Save as .xlsx and choose Re-upload corrected rows in iSharp." },
  ]);
  instructions.getRow(1).font = { bold: true };
  instructions.views = [{ state: "frozen", ySplit: 1 }];

  return Buffer.from(await outputBook.xlsx.writeBuffer());
}
