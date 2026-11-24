import type { NextRequest } from "next/server";
import {
  createFailedRowsWorkbook,
  type FailedImportRow,
} from "@/lib/question-import-retry";
import { getRequestAccessToken } from "@/lib/server-access-token";

export const maxDuration = 60;

function safeDownloadName(name: string) {
  const base = name.replace(/\.xlsx$/i, "").replace(/[^a-zA-Z0-9._-]+/g, "-");
  return `${base || "question-import"}-failed-rows.xlsx`;
}

export async function POST(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token)
    return Response.json({ message: "Authentication is required" }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx"))
      return Response.json({ message: "Original .xlsx workbook is required" }, { status: 400 });
    if (file.size > 25 * 1024 * 1024)
      return Response.json({ message: "Excel file must be 25 MB or smaller" }, { status: 400 });

    const rawFailures = form.get("failures");
    if (typeof rawFailures !== "string")
      return Response.json({ message: "Failed row details are required" }, { status: 400 });
    const parsed = JSON.parse(rawFailures) as FailedImportRow[];
    if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 500)
      return Response.json({ message: "Failed row details are invalid" }, { status: 400 });
    const failures = parsed.map((item) => ({
      row: Number(item?.row),
      externalId: typeof item?.externalId === "string" ? item.externalId.slice(0, 64) : undefined,
      error: typeof item?.error === "string" ? item.error.slice(0, 500) : "Import failed",
    }));
    const bytes = await createFailedRowsWorkbook(
      Buffer.from(await file.arrayBuffer()),
      failures,
    );
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${safeDownloadName(file.name)}"`,
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Failed rows workbook could not be created" },
      { status: 400 },
    );
  }
}
