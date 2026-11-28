import type { NextRequest } from "next/server";
import { mapQuestionRow } from "@/lib/question-import";
import {
  deduplicateImportRows,
  parseQuestionsWorkbook,
  persistImportBatches,
  uploadImportImages,
} from "@/lib/question-import-stream";
import { getRequestAccessToken } from "@/lib/server-access-token";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return Response.json(
      { message: "Authentication is required" },
      { status: 401 },
    );
  }

  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) {
    return Response.json(
      { message: "Excel file is required" },
      { status: 400 },
    );
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return Response.json(
      { message: "Only .xlsx workbooks are supported" },
      { status: 400 },
    );
  }
  if (file.size > 25 * 1024 * 1024) {
    return Response.json(
      { message: "Excel file must be 25 MB or smaller" },
      { status: 400 },
    );
  }

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

        const { records, embedded, allRows } =
          await parseQuestionsWorkbook(file);

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

        const { candidateRows, skipped } = deduplicateImportRows(allRows);

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
        const validImages = embedded.filter((image) =>
          candidateRowNumbers.has(image.rowNumber),
        );

        if (validImages.length > 0) {
          await uploadImportImages(
            validImages,
            records,
            token,
            allRows.length,
            skipped.length,
            send,
          );
        }

        for (const row of candidateRows) {
          row.mappedData = mapQuestionRow(row.record, row.rowNumber);
        }

        const results = await persistImportBatches(
          candidateRows,
          skipped,
          allRows.length,
          token,
          send,
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
            imported: results.filter((item) => item.status === "imported")
              .length,
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
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
}
