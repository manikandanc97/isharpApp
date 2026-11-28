import ExcelJS from "exceljs";
import type { NextRequest } from "next/server";
import { normalizeExcelXmlBuffer } from "@/lib/excel-patch";
import { collectEmbeddedImages } from "@/lib/excel-embedded-images";
import { prepareEmbeddedImageForUpload } from "@/lib/excel-image-upload";
import { getNestApiBaseUrl, getNestApiClient } from "@/lib/nest-api";
import {
  calculateFingerprints,
  type QuestionFingerprints,
} from "@/lib/question-duplicate-detection";
import { generateExternalId, mapQuestionRow, TEMPLATE_HEADERS } from "@/lib/question-import";
import { getRequestAccessToken } from "@/lib/server-access-token";

export const maxDuration = 300;

type ImportRow = {
  rowNumber: number;
  record: Record<string, unknown>;
  externalId: string;
  mappedData: ReturnType<typeof mapQuestionRow>;
  fingerprints: QuestionFingerprints;
};

type ImportResult = {
  row: number;
  externalId?: string;
  status: "imported" | "skipped" | "failed";
  duplicateCategory?: "within_excel" | "database";
  duplicateType?: "exact" | "equivalent" | "answer_conflict" | "id_conflict";
  matchedId?: string | number;
  reason?: string;
  error?: string;
};

function cellValue(value: unknown) {
  if (!value || typeof value !== "object") return value;
  if ("text" in value) return value.text;
  if ("result" in value) return value.result;
  if ("richText" in value && Array.isArray(value.richText))
    return value.richText
      .map((part) =>
        part && typeof part === "object" && "text" in part ? part.text : "",
      )
      .join("");
  return value;
}

export async function POST(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token)
    return Response.json(
      { message: "Authentication is required" },
      { status: 401 },
    );

  const file = (await request.formData()).get("file");
  if (!(file instanceof File))
    return Response.json(
      { message: "Excel file is required" },
      { status: 400 },
    );
  if (!file.name.toLowerCase().endsWith(".xlsx"))
    return Response.json(
      { message: "Only .xlsx workbooks are supported" },
      { status: 400 },
    );
  if (file.size > 25 * 1024 * 1024)
    return Response.json(
      { message: "Excel file must be 25 MB or smaller" },
      { status: 400 },
    );

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (value: unknown) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
        } catch {
          // Closed by client
        }
      };

      try {
        send({
          type: "progress",
          stage: "parsing",
          message: "Parsing Excel workbook structure...",
          total: 0,
          processed: 0,
          imported: 0,
          skipped: 0,
          failed: 0,
        });

        const rawBuffer = Buffer.from(await file.arrayBuffer());
        const cleanBuffer = await normalizeExcelXmlBuffer(rawBuffer);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(cleanBuffer as never);
        const sheet =
          workbook.getWorksheet("Questions") ?? workbook.worksheets[0];
        if (!sheet || sheet.rowCount < 2) {
          send({ type: "error", message: "Questions sheet has no data rows" });
          controller.close();
          return;
        }

        const headers = sheet.getRow(1).values as unknown[];
        const names = headers
          .slice(1)
          .map((item) => String(cellValue(item) ?? "").trim());
        const duplicateHeaders = names.filter(
          (name, index) => name && names.indexOf(name) !== index,
        );
        if (duplicateHeaders.length) {
          send({
            type: "error",
            message: `Duplicate columns: ${[...new Set(duplicateHeaders)].join(", ")}`,
          });
          controller.close();
          return;
        }
        const OPTIONAL_COLUMNS = new Set([
          "external_id",
          "course_code",
          "source",
          "numerical_answer",
        ]);
        const headerMatches = (expected: string) => {
          if (names.includes(expected)) return true;
          if (expected.endsWith("_image") && names.includes(`${expected}_url`)) return true;
          // Support backward compatibility for option_a/b/c/d columns
          const matchNum = expected.match(/^option_([1-4])(_en|_ta|_image)$/);
          if (matchNum) {
            const letter = ['a', 'b', 'c', 'd'][parseInt(matchNum[1], 10) - 1];
            const legacyHeader = `option_${letter}${matchNum[2]}`;
            if (names.includes(legacyHeader)) return true;
            if (expected.endsWith("_image") && names.includes(`${legacyHeader}_url`)) return true;
          }
          return false;
        };
        const missing = TEMPLATE_HEADERS.filter(
          (header) => !OPTIONAL_COLUMNS.has(header) && !headerMatches(header),
        );
        if (missing.length) {
          send({
            type: "error",
            message: `Missing columns: ${missing.join(", ")}`,
          });
          controller.close();
          return;
        }

        const records = new Map<number, Record<string, unknown>>();
        sheet.eachRow((excelRow, number) => {
          if (number === 1) return;
          const record: Record<string, unknown> = {};
          names.forEach((name, index) => {
            record[name] = cellValue(excelRow.getCell(index + 1).value);
          });
          if (Object.values(record).some((item) => String(item ?? "").trim()))
            records.set(number, record);
        });
        if (!records.size) {
          send({ type: "error", message: "Questions sheet has no data rows" });
          controller.close();
          return;
        }
        if (records.size > 500) {
          send({
            type: "error",
            message: "A workbook can contain at most 500 question rows",
          });
          controller.close();
          return;
        }

        // Collect embedded images and populate image hashes into row records
        const embedded = collectEmbeddedImages(workbook, sheet, names);
        if (embedded.length > 100) {
          send({
            type: "error",
            message: "A workbook can contain at most 100 embedded images",
          });
          controller.close();
          return;
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
            if (!record.course_code) {
              record.course_code = courseCode;
            }
            if (!record.source) {
              record.source = "NEET practice";
            }
            const mappedData = mapQuestionRow(record, rowNumber);
            const fingerprints = calculateFingerprints(mappedData);

            return {
              rowNumber,
              record,
              externalId,
              mappedData,
              fingerprints,
            };
          },
        );

        send({
          type: "progress",
          stage: "deduplicating",
          message: `Identified ${allRows.length} question rows. Analyzing for duplicates...`,
          total: allRows.length,
          processed: 0,
          imported: 0,
          skipped: 0,
          failed: 0,
        });

        const skipped: ImportResult[] = [];
        const seenContentFingerprints = new Map<string, number>();
        const seenEquivFingerprints = new Map<string, number>();
        const seenExternalIds = new Map<
          string,
          { rowNumber: number; contentFingerprint: string }
        >();
        const seenOptionsFingerprints = new Map<string, { rowNumber: number }>();

        // Step 1: Detect duplicates within the uploaded Excel file
        const candidateRows = allRows.filter((row) => {
          const { rowNumber, externalId, fingerprints } = row;

          // 1. Exact content duplicate within workbook
          if (seenContentFingerprints.has(fingerprints.contentFingerprint)) {
            const firstRow = seenContentFingerprints.get(
              fingerprints.contentFingerprint,
            )!;
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

          // 2. Equivalent duplicate within workbook (reordered options with matching answer)
          if (
            !fingerprints.hasAmbiguousOptions &&
            seenEquivFingerprints.has(fingerprints.equivalentFingerprint)
          ) {
            const firstRow = seenEquivFingerprints.get(
              fingerprints.equivalentFingerprint,
            )!;
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

          // 3. Option multiset conflict (same question text & options, conflicting answers)
          if (seenOptionsFingerprints.has(fingerprints.optionsContentFingerprint)) {
            const prev = seenOptionsFingerprints.get(
              fingerprints.optionsContentFingerprint,
            )!;
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

          // 4. Duplicate external ID
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
                  reason: `Conflict: Duplicate external ID in this workbook`,
                });
                return false;
              } else {
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
            }
            seenExternalIds.set(extKey, {
              rowNumber,
              contentFingerprint: fingerprints.contentFingerprint,
            });
          }

          seenContentFingerprints.set(fingerprints.contentFingerprint, rowNumber);
          if (!fingerprints.hasAmbiguousOptions) {
            seenEquivFingerprints.set(fingerprints.equivalentFingerprint, rowNumber);
          }
          seenOptionsFingerprints.set(fingerprints.optionsContentFingerprint, {
            rowNumber,
          });

          return true;
        });

        send({
          type: "progress",
          stage: embedded.length > 0 ? "images" : "persisting",
          message: `Identified ${candidateRows.length} unique candidates (${skipped.length} internal duplicate(s) filtered).`,
          total: allRows.length,
          processed: skipped.length,
          imported: 0,
          skipped: skipped.length,
          failed: 0,
        });

        const candidateRowNumbers = new Set(
          candidateRows.map((row) => row.rowNumber),
        );

        const occupiedImageCells = new Set<string>();
        const validImages = embedded.filter((image) =>
          candidateRowNumbers.has(image.rowNumber),
        );

        // Step 2: Upload embedded images ONLY for verified unique candidate rows
        if (validImages.length > 0) {
          const IMAGE_CONCURRENCY = 4;
          for (let i = 0; i < validImages.length; i += IMAGE_CONCURRENCY) {
            const chunk = validImages.slice(i, i + IMAGE_CONCURRENCY);
            await Promise.all(
              chunk.map(async (image) => {
                if (
                  !image.columnName.endsWith("_image") &&
                  !image.columnName.endsWith("_image_url")
                )
                  throw new Error(
                    `Image at row ${image.rowNumber} must be placed in an image column`,
                  );
                const imageCell = `${image.rowNumber}:${image.columnName}`;
                if (occupiedImageCells.has(imageCell))
                  throw new Error(
                    `Only one image is allowed in ${image.columnName} at row ${image.rowNumber}`,
                  );
                occupiedImageCells.add(imageCell);
                const record = records.get(image.rowNumber);
                if (!record)
                  throw new Error(
                    `Image at row ${image.rowNumber} has no question data`,
                  );
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
                    if (uploaded?.url) {
                      imageUrl = uploaded.url;
                    }
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
              total: allRows.length,
              processed: skipped.length,
              imported: 0,
              skipped: skipped.length,
              failed: 0,
            });
          }
        }

        // Refresh mappedData for candidateRows with final image URLs
        for (const row of candidateRows) {
          row.mappedData = mapQuestionRow(row.record, row.rowNumber);
        }

        const importedResults: ImportResult[] = [];
        const sendProgress = (currentMsg?: string) => {
          const results = [...skipped, ...importedResults];
          send({
            type: "progress",
            stage: "persisting",
            message:
              currentMsg ||
              `Verified & persisted ${results.length} of ${allRows.length} questions...`,
            total: allRows.length,
            processed: results.length,
            imported: results.filter((item) => item.status === "imported").length,
            skipped: results.filter((item) => item.status === "skipped").length,
            failed: results.filter((item) => item.status === "failed").length,
          });
        };

        sendProgress("Verifying questions against database...");

        // Stream micro-batches of 4 candidate rows to NestJS API for rapid, fluid real-time updates
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

        const results = [...skipped, ...importedResults].sort(
          (left, right) => left.row - right.row,
        );

        const withinExcelDuplicates = results.filter(
          (item) => item.duplicateCategory === "within_excel",
        ).length;
        const databaseDuplicates = results.filter(
          (item) => item.duplicateCategory === "database",
        ).length;
        const conflicts = results.filter(
          (item) =>
            item.duplicateType === "answer_conflict" ||
            item.duplicateType === "id_conflict" ||
            (item.status === "failed" && item.reason?.includes("Conflict")),
        ).length;

        send({
          type: "complete",
          report: {
            total: allRows.length,
            imported: results.filter((item) => item.status === "imported").length,
            skipped: results.filter((item) => item.status === "skipped").length,
            failed: results.filter((item) => item.status === "failed").length,
            withinExcelDuplicates,
            databaseDuplicates,
            conflicts,
            results,
          },
        });
      } catch (error) {
        send({
          type: "error",
          message:
            error instanceof Error ? error.message : "Excel import failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, private, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
