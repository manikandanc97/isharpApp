import { NextRequest, NextResponse } from "next/server";
import { auditLogsStore } from "@/lib/audit-logs-store";
import { getRequestAccessToken } from "@/lib/server-access-token";

export async function GET(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const moduleFilter = searchParams.get("module") || undefined;

  const logs = auditLogsStore.getLogs(moduleFilter);
  return NextResponse.json(logs);
}

export async function POST(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const created = auditLogsStore.logAction({
      actorEmail: body.actorEmail || "admin@isharpacademy.in",
      actorRole: body.actorRole || "ADMIN",
      action: body.action || "GENERIC_ACTION",
      module: body.module || "SETTINGS",
      targetEntityId: body.targetEntityId || null,
      targetEntityName: body.targetEntityName || null,
      details: body.details || "",
      ipAddress: "127.0.0.1",
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to record audit log" },
      { status: 400 }
    );
  }
}
