import { NextRequest, NextResponse } from "next/server";
import { examManagementStore } from "@/lib/exam-management-store";
import { getRequestAccessToken } from "@/lib/server-access-token";

export async function GET(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const examId = searchParams.get("examId") || undefined;

  const attempts = examManagementStore.getAttempts(examId);
  return NextResponse.json(attempts);
}

export async function POST(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, attemptId } = body;

    if (!attemptId) {
      return NextResponse.json({ message: "attemptId is required" }, { status: 400 });
    }

    if (action === "AUTO_SUBMIT") {
      const result = examManagementStore.autoSubmitAttempt(attemptId);
      return NextResponse.json(result);
    }

    if (action === "GRANT_REATTEMPT") {
      const result = examManagementStore.grantReattempt(attemptId);
      return NextResponse.json(result);
    }

    if (action === "RESET") {
      examManagementStore.resetAttempt(attemptId);
      return NextResponse.json({ success: true, message: "Attempt reset successfully" });
    }

    return NextResponse.json({ message: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to process attempt action" },
      { status: 400 }
    );
  }
}
