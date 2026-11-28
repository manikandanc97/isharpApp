import { NextRequest, NextResponse } from "next/server";
import { ApiClientError } from "@/lib/api-client";
import { getNestApiClient } from "@/lib/nest-api";
import { getRequestAccessToken } from "@/lib/server-access-token";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const series = await getNestApiClient().request<{ tests?: unknown[] }>(
      `/api/admin/test-series/${encodeURIComponent(id)}`,
      {
        method: "GET",
        accessToken: token,
        cache: "no-store",
      }
    );
    return NextResponse.json(series?.tests || []);
  } catch (error) {
    const status = error instanceof ApiClientError ? error.status : 404;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Test series not found" },
      { status }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const body = await request.json();
    const payload = await getNestApiClient().request(
      `/api/admin/test-series/${encodeURIComponent(id)}/tests`,
      {
        method: "POST",
        accessToken: token,
        body: {
          testSeriesId: id,
          title: body.name || body.title,
          code: body.code,
          description: body.description,
          instructionsEn: body.instructions || body.instructionsEn,
          instructionsTa: body.instructionsTa,
          testType: body.testType,
          status: body.status,
          durationMinutes: Number(body.durationMinutes),
          totalQuestions: Number(body.totalQuestions),
          totalMarks: Number(body.totalMarks),
          passingMarks: body.passingMarks ? Number(body.passingMarks) : undefined,
          hasNegativeMarking: body.negativeMarking !== false,
          correctMarks: body.correctMarks ? Number(body.correctMarks) : 4,
          negativeMarks: body.negativeMarks ? Number(body.negativeMarks) : 1,
          maxAttempts: Number(body.maxAttempts) || 1,
          randomizeQuestions: body.randomizeQuestions !== false,
          randomizeOptions: body.randomizeOptions !== false,
          showResultsImmediately: Boolean(body.showResultsImmediately),
          isOfflineAvailable: body.isOfflineAvailable !== false,
          orderIndex: Number(body.orderIndex) || undefined,
          scheduledAt: body.testDate
            ? `${body.testDate}T${body.startTime || "10:00"}:00.000Z`
            : body.scheduledAt || null,
          availableUntil: body.testDate
            ? `${body.testDate}T${body.endTime || "13:00"}:00.000Z`
            : body.availableUntil || null,
        },
        cache: "no-store",
      }
    );

    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiClientError ? error.status : 400;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create test" },
      { status }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const body = await request.json();
    const payload = await getNestApiClient().request(
      `/api/admin/test-series/${encodeURIComponent(id)}/tests-reorder`,
      {
        method: "POST",
        accessToken: token,
        body,
        cache: "no-store",
      }
    );
    return NextResponse.json(payload);
  } catch (error) {
    const status = error instanceof ApiClientError ? error.status : 400;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to reorder tests" },
      { status }
    );
  }
}
