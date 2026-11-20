import ExcelJS from "exceljs";
import type { NextRequest } from "next/server";
import { normalizeExcelXmlBuffer } from "@/lib/excel-patch";
import { ApiClientError } from "@/lib/api-client";
import { collectEmbeddedImages } from "@/lib/excel-embedded-images";
import { getNestApiBaseUrl, getNestApiClient } from "@/lib/nest-api";
import { generateExternalId, mapQuestionRow, TEMPLATE_HEADERS } from "@/lib/question-import";
import { getRequestAccessToken } from "@/lib/server-access-token";

export const maxDuration = 300;

type ImportRow = {
  rowNumber: number;
  record: Record<string, unknown>;
  externalId: string;
};

type ImportResult = {
  row: number;
  externalId?: string;
  status: "imported" | "skipped" | "failed";
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

  try {
    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const cleanBuffer = await normalizeExcelXmlBuffer(rawBuffer);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(cleanBuffer as never);
    const sheet =
      workbook.getWorksheet("Questions") ?? workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 2)
      return Response.json(
        { message: "Questions sheet has no data rows" },
        { status: 400 },
      );

    const headers = sheet.getRow(1).values as unknown[];
    const names = headers
      .slice(1)
      .map((item) => String(cellValue(item) ?? "").trim());
    const duplicateHeaders = names.filter(
      (name, index) => name && names.indexOf(name) !== index,
    );
    if (duplicateHeaders.length)
      return Response.json(
        {
          message: `Duplicate columns: ${[...new Set(duplicateHeaders)].join(", ")}`,
        },
        { status: 400 },
      );
    const OPTIONAL_COLUMNS = new Set([
      "external_id",
      "course_code",
      "source",
      "numerical_answer",
    ]);
    const missing = TEMPLATE_HEADERS.filter(
      (header) =>
        !OPTIONAL_COLUMNS.has(header) &&
        !names.includes(header) &&
        !(header.endsWith("_image") && names.includes(`${header}_url`)),
    );
    if (missing.length)
      return Response.json(
        { message: `Missing columns: ${missing.join(", ")}` },
        { status: 400 },
      );

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
    if (!records.size)
      return Response.json(
        { message: "Questions sheet has no data rows" },
        { status: 400 },
      );
    if (records.size > 500)
      return Response.json(
        { message: "A workbook can contain at most 500 question rows" },
        { status: 400 },
      );

    const allRows: ImportRow[] = [...records.entries()].map(
      ([rowNumber, record], index) => {
        const courseCode = String(record.course_code ?? "NEET").trim() || "NEET";
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
        return {
          rowNumber,
          record,
          externalId,
        };
      },
    );
    const skipped: ImportResult[] = [];
    const workbookIds = new Set<string>();
    const uniqueRows = allRows.filter((row) => {
      if (!row.externalId) return true;
      const key = row.externalId.toLocaleLowerCase("en-US");
      if (workbookIds.has(key)) {
        skipped.push({
          row: row.rowNumber,
          externalId: row.externalId,
          status: "skipped",
          reason: "Duplicate external ID in this workbook",
        });
        return false;
      }
      workbookIds.add(key);
      return true;
    });

    const preflight = await getNestApiClient().request<{
      existingExternalIds: string[];
    }>("/api/admin/questions/import/preflight", {
      method: "POST",
      accessToken: token,
      body: {
        externalIds: uniqueRows.map((row) => row.externalId).filter(Boolean),
      },
      cache: "no-store",
      timeoutMs: 30_000,
    });
    const existingIds = new Set(
      preflight.existingExternalIds.map((id) =>
        id.toLocaleLowerCase("en-US"),
      ),
    );
    const candidateRows = uniqueRows.filter((row) => {
      if (
        row.externalId &&
        existingIds.has(row.externalId.toLocaleLowerCase("en-US"))
      ) {
        skipped.push({
          row: row.rowNumber,
          externalId: row.externalId,
          status: "skipped",
          reason: "Question already exists",
        });
        return false;
      }
      return true;
    });
    const candidateRowNumbers = new Set(
      candidateRows.map((row) => row.rowNumber),
    );

    const embedded = collectEmbeddedImages(workbook, sheet, names);
    if (embedded.length > 100)
      return Response.json(
        { message: "A workbook can contain at most 100 embedded images" },
        { status: 400 },
      );
    const occupiedImageCells = new Set<string>();
    const validImages = embedded.filter((image) =>
      candidateRowNumbers.has(image.rowNumber),
    );

    // Upload embedded images concurrently in chunks of 4
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
          const imageBuffer = new ArrayBuffer(image.bytes.byteLength);
          new Uint8Array(imageBuffer).set(image.bytes);
          const form = new FormData();
          form.set(
            "file",
            new Blob([imageBuffer], { type: image.mimeType }),
            `excel-row-${image.rowNumber}.${image.extension}`,
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
            // Nest API or Supabase timed out, fall back to local disk
          }

          if (!imageUrl) {
            try {
              const fs = await import("node:fs/promises");
              const path = await import("node:path");
              const crypto = await import("node:crypto");
              const year = new Date().getUTCFullYear();
              const filename = `import-${Date.now()}-${crypto.randomUUID()}.${image.extension}`;
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
                Buffer.from(image.bytes),
              );
              imageUrl = `/uploads/question-media/${year}/${filename}`;
            } catch {
              // Base64 data URL fallback
              imageUrl = `data:${image.mimeType};base64,${Buffer.from(image.bytes).toString("base64")}`;
            }
          }

          record[image.columnName] = imageUrl;
        }),
      );
    }

    // Process candidate rows in batches of 50 to prevent timeout and avoid heavy long-running transactions
    const importedResults: ImportResult[] = [];
    if (candidateRows.length) {
      const BATCH_SIZE = 50;
      for (let i = 0; i < candidateRows.length; i += BATCH_SIZE) {
        const batch = candidateRows.slice(i, i + BATCH_SIZE);
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
              data: mapQuestionRow(row.record, row.rowNumber),
            })),
          },
          cache: "no-store",
          timeoutMs: 90_000,
        });
        importedResults.push(...batchResponse.results);
      }
    }

    const results = [...skipped, ...importedResults].sort(
      (left, right) => left.row - right.row,
    );
    return Response.json(
      {
        total: allRows.length,
        imported: results.filter((item) => item.status === "imported").length,
        skipped: results.filter((item) => item.status === "skipped").length,
        failed: results.filter((item) => item.status === "failed").length,
        results,
      },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (error) {
    const status = error instanceof ApiClientError ? error.status : 400;
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Excel import failed",
      },
      { status },
    );
  }
}
