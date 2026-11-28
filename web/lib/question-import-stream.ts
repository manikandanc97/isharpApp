import ExcelJS from "exceljs";
import { normalizeExcelXmlBuffer } from "./excel-patch";
import {
  collectEmbeddedImages,
  type EmbeddedExcelImage,
} from "./excel-embedded-images";
import { prepareEmbeddedImageForUpload } from "./excel-image-upload";
import { getNestApiBaseUrl, getNestApiClient } from "./nest-api";
import {
  calculateFingerprints,
  type QuestionFingerprints,
} from "./question-duplicate-detection";
import {
  generateExternalId,
  mapQuestionRow,
  TEMPLATE_HEADERS,
} from "./question-import";

export type ImportRow = {
  rowNumber: number;
  record: Record<string, unknown>;
  externalId: string;
  mappedData: ReturnType<typeof mapQuestionRow>;
  fingerprints: QuestionFingerprints;
};

export type ImportResult = {
  row: number;
  externalId?: string;
  status: "imported" | "skipped" | "failed";
  duplicateCategory?: "within_excel" | "database";
  duplicateType?: "exact" | "equivalent" | "answer_conflict" | "id_conflict";
  matchedId?: string | number;
  reason?: string;
  error?: string;
};

export type StreamSender = (value: unknown) => void;

const OPTIONAL_COLUMNS = new Set([
  "external_id",
  "course_code",
  "source",
  "numerical_answer",
]);

function cellValue(value: unknown) {
  if (!value || typeof value !== "object") return value;
  if ("text" in value) return value.text;
  if ("result" in value) return value.result;
  if ("richText" in value && Array.isArray(value.richText)) {
    return value.richText
      .map((part) =>
        part && typeof part === "object" && "text" in part ? part.text : "",
      )
      .join("");
  }
  return value;
}

function headerMatches(names: string[], expected: string): boolean {
  if (names.includes(expected)) return true;
  if (expected.endsWith("_image") && names.includes(`${expected}_url`)) {
    return true;
  }
  const matchNum = expected.match(/^option_([1-4])(_en|_ta|_image)$/);
  if (matchNum) {
    const letter = ["a", "b", "c", "d"][parseInt(matchNum[1], 10) - 1];
    const legacyHeader = `option_${letter}${matchNum[2]}`;
    if (names.includes(legacyHeader)) return true;
    if (expected.endsWith("_image") && names.includes(`${legacyHeader}_url`)) {
      return true;
    }
  }
  return false;
}

export async function parseQuestionsWorkbook(file: File): Promise<{
  records: Map<number, Record<string, unknown>>;
  embedded: EmbeddedExcelImage[];
  allRows: ImportRow[];
}> {
  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const cleanBuffer = await normalizeExcelXmlBuffer(rawBuffer);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(cleanBuffer as never);

  const sheet = workbook.getWorksheet("Questions") ?? workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2) {
    throw new Error("Questions sheet has no data rows");
  }

  const headers = sheet.getRow(1).values as unknown[];
  const names = headers
    .slice(1)
    .map((item) => String(cellValue(item) ?? "").trim());
  const duplicateHeaders = names.filter(
    (name, index) => name && names.indexOf(name) !== index,
  );
  if (duplicateHeaders.length) {
    throw new Error(
      `Duplicate columns: ${[...new Set(duplicateHeaders)].join(", ")}`,
    );
  }

  const missing = TEMPLATE_HEADERS.filter(
    (header) => !OPTIONAL_COLUMNS.has(header) && !headerMatches(names, header),
  );
  if (missing.length) {
    throw new Error(`Missing columns: ${missing.join(", ")}`);
  }

  const records = new Map<number, Record<string, unknown>>();
  sheet.eachRow((excelRow, number) => {
    if (number === 1) return;
    const record: Record<string, unknown> = {};
    names.forEach((name, index) => {
      record[name] = cellValue(excelRow.getCell(index + 1).value);
    });
    if (Object.values(record).some((item) => String(item ?? "").trim())) {
      records.set(number, record);
    }
  });

  if (!records.size) {
    throw new Error("Questions sheet has no data rows");
  }
  if (records.size > 500) {
    throw new Error("A workbook can contain at most 500 question rows");
  }

  const embedded = collectEmbeddedImages(workbook, sheet, names);
  if (embedded.length > 100) {
    throw new Error("A workbook can contain at most 100 embedded images");
  }

  for (const image of embedded) {
    const rec = records.get(image.rowNumber);
    if (rec) {
      rec[`${image.columnName}_hash`] = image.imageHash;
    }
  }

  const allRows: ImportRow[] = [...records.entries()].map(
    ([rowNumber, record], index) => {
      const courseCode =
        String(record.course_code ?? "NEET").trim() || "NEET";
      const subjectCode = String(record.subject_code ?? "PHYSICS").trim();
      let externalId = String(record.external_id ?? "").trim();
      if (!externalId) {
        externalId = generateExternalId(courseCode, subjectCode, index + 1);
        record.external_id = externalId;
      }
      if (!record.course_code) record.course_code = courseCode;
      if (!record.source) record.source = "NEET practice";

      const mappedData = mapQuestionRow(record, rowNumber);
      const fingerprints = calculateFingerprints(mappedData);
      return { rowNumber, record, externalId, mappedData, fingerprints };
    },
  );

  return { records, embedded, allRows };
}

export function deduplicateImportRows(allRows: ImportRow[]): {
  candidateRows: ImportRow[];
  skipped: ImportResult[];
} {
  const skipped: ImportResult[] = [];
  const seenContent = new Map<string, number>();
  const seenEquiv = new Map<string, number>();
  const seenExternalIds = new Map<
    string,
    { rowNumber: number; contentFingerprint: string }
  >();
  const seenOptions = new Map<string, { rowNumber: number }>();

  const candidateRows = allRows.filter((row) => {
    const { rowNumber, externalId, fingerprints } = row;

    if (seenContent.has(fingerprints.contentFingerprint)) {
      const firstRow = seenContent.get(fingerprints.contentFingerprint)!;
      skipped.push({
        row: rowNumber,
        externalId,
        status: "skipped",
        duplicateCategory: "within_excel",
        duplicateType: "exact",
        matchedId: firstRow,
        reason: `Duplicate of row ${firstRow} in this workbook (exact match)`,
      });
      return false;
    }

    if (
      !fingerprints.hasAmbiguousOptions &&
      seenEquiv.has(fingerprints.equivalentFingerprint)
    ) {
      const firstRow = seenEquiv.get(fingerprints.equivalentFingerprint)!;
      skipped.push({
        row: rowNumber,
        externalId,
        status: "skipped",
        duplicateCategory: "within_excel",
        duplicateType: "equivalent",
        matchedId: firstRow,
        reason: `Duplicate of row ${firstRow} in this workbook (equivalent match with reordered options)`,
      });
      return false;
    }

    if (seenOptions.has(fingerprints.optionsContentFingerprint)) {
      const prev = seenOptions.get(fingerprints.optionsContentFingerprint)!;
      skipped.push({
        row: rowNumber,
        externalId,
        status: "failed",
        duplicateCategory: "within_excel",
        duplicateType: "answer_conflict",
        matchedId: prev.rowNumber,
        reason: `Conflict: Answer conflict with row ${prev.rowNumber} in this workbook`,
      });
      return false;
    }

    if (externalId) {
      const extKey = externalId.toLowerCase();
      if (seenExternalIds.has(extKey)) {
        const prev = seenExternalIds.get(extKey)!;
        if (prev.contentFingerprint !== fingerprints.contentFingerprint) {
          skipped.push({
            row: rowNumber,
            externalId,
            status: "failed",
            duplicateCategory: "within_excel",
            duplicateType: "id_conflict",
            matchedId: prev.rowNumber,
            reason: "Conflict: Duplicate external ID in this workbook",
          });
          return false;
        }
        skipped.push({
          row: rowNumber,
          externalId,
          status: "skipped",
          duplicateCategory: "within_excel",
          duplicateType: "exact",
          matchedId: prev.rowNumber,
          reason: `Duplicate of row ${prev.rowNumber} in this workbook (exact match)`,
        });
        return false;
      }
      seenExternalIds.set(extKey, {
        rowNumber,
        contentFingerprint: fingerprints.contentFingerprint,
      });
    }

    seenContent.set(fingerprints.contentFingerprint, rowNumber);
    if (!fingerprints.hasAmbiguousOptions) {
      seenEquiv.set(fingerprints.equivalentFingerprint, rowNumber);
    }
    seenOptions.set(fingerprints.optionsContentFingerprint, { rowNumber });
    return true;
  });

  return { candidateRows, skipped };
}

export async function uploadImportImages(
  validImages: EmbeddedExcelImage[],
  records: Map<number, Record<string, unknown>>,
  token: string,
  totalRows: number,
  skippedCount: number,
  send: StreamSender,
): Promise<void> {
  const occupiedImageCells = new Set<string>();
  const IMAGE_CONCURRENCY = 4;

  for (let i = 0; i < validImages.length; i += IMAGE_CONCURRENCY) {
    const chunk = validImages.slice(i, i + IMAGE_CONCURRENCY);
    await Promise.all(
      chunk.map(async (image) => {
        if (
          !image.columnName.endsWith("_image") &&
          !image.columnName.endsWith("_image_url")
        ) {
          throw new Error(
            `Image at row ${image.rowNumber} must be placed in an image column`,
          );
        }
        const imageCell = `${image.rowNumber}:${image.columnName}`;
        if (occupiedImageCells.has(imageCell)) {
          throw new Error(
            `Only one image is allowed in ${image.columnName} at row ${image.rowNumber}`,
          );
        }
        occupiedImageCells.add(imageCell);
        const record = records.get(image.rowNumber);
        if (!record) {
          throw new Error(
            `Image at row ${image.rowNumber} has no question data`,
          );
        }

        const uploadImage = await prepareEmbeddedImageForUpload(image);
        const imageBuffer = new ArrayBuffer(uploadImage.bytes.byteLength);
        new Uint8Array(imageBuffer).set(uploadImage.bytes);
        const form = new FormData();
        form.set(
          "file",
          new Blob([imageBuffer], { type: uploadImage.mimeType }),
          `excel-row-${image.rowNumber}.${uploadImage.extension}`,
        );

        let imageUrl: string | null = null;
        try {
          const upload = await fetch(
            `${getNestApiBaseUrl()}/api/admin/question-media`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: form,
              cache: "no-store",
              signal: AbortSignal.timeout(4000),
            },
          );
          if (upload.ok) {
            const uploaded = (await upload.json().catch(() => ({}))) as {
              url?: string;
            };
            if (uploaded?.url) imageUrl = uploaded.url;
          }
        } catch {
          // Fall back to local storage
        }

        if (!imageUrl) {
          try {
            const fs = await import("node:fs/promises");
            const path = await import("node:path");
            const crypto = await import("node:crypto");
            const year = new Date().getUTCFullYear();
            const filename = `import-${Date.now()}-${crypto.randomUUID()}.${uploadImage.extension}`;
            const uploadDir = path.join(
              process.cwd(),
              "public",
              "uploads",
              "question-media",
              String(year),
            );
            await fs.mkdir(uploadDir, { recursive: true });
            await fs.writeFile(
              path.join(uploadDir, filename),
              Buffer.from(uploadImage.bytes),
            );
            imageUrl = `/uploads/question-media/${year}/${filename}`;
          } catch {
            imageUrl = `data:${uploadImage.mimeType};base64,${Buffer.from(uploadImage.bytes).toString("base64")}`;
          }
        }

        record[image.columnName] = imageUrl;
      }),
    );

    send({
      type: "progress",
      stage: "images",
      message: `Processed diagram ${Math.min(i + IMAGE_CONCURRENCY, validImages.length)} of ${validImages.length}...`,
      total: totalRows,
      processed: skippedCount,
      imported: 0,
      skipped: skippedCount,
      failed: 0,
    });
  }
}

export async function persistImportBatches(
  candidateRows: ImportRow[],
  skipped: ImportResult[],
  totalRows: number,
  token: string,
  send: StreamSender,
): Promise<ImportResult[]> {
  const importedResults: ImportResult[] = [];
  const sendProgress = (currentMsg?: string) => {
    const results = [...skipped, ...importedResults];
    send({
      type: "progress",
      stage: "persisting",
      message:
        currentMsg ||
        `Verified & persisted ${results.length} of ${totalRows} questions...`,
      total: totalRows,
      processed: results.length,
      imported: results.filter((item) => item.status === "imported").length,
      skipped: results.filter((item) => item.status === "skipped").length,
      failed: results.filter((item) => item.status === "failed").length,
    });
  };

  sendProgress("Verifying questions against database...");

  const BATCH_SIZE = 4;
  for (let i = 0; i < candidateRows.length; i += BATCH_SIZE) {
    const batch = candidateRows.slice(i, i + BATCH_SIZE);
    const startRow = batch[0].rowNumber;
    const endRow = batch[batch.length - 1].rowNumber;
    sendProgress(`Validating & saving rows ${startRow}–${endRow}...`);

    const batchResponse = await getNestApiClient().request<{
      total: number;
      imported: number;
      skipped: number;
      failed: number;
      results: ImportResult[];
    }>("/api/admin/questions/import", {
      method: "POST",
      accessToken: token,
      body: {
        rows: batch.map((row) => ({
          rowNumber: row.rowNumber,
          data: row.mappedData,
        })),
      },
      cache: "no-store",
      timeoutMs: 90_000,
    });
    importedResults.push(...batchResponse.results);
    sendProgress();
  }

  return [...skipped, ...importedResults].sort(
    (left, right) => left.row - right.row,
  );
}
