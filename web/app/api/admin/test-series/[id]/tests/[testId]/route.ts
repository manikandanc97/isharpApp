import { NextRequest, NextResponse } from "next/server";
import { ApiClientError } from "@/lib/api-client";
import { getNestApiClient } from "@/lib/nest-api";
import { getRequestAccessToken } from "@/lib/server-access-token";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; testId: string }> }
) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const { id, testId } = await context.params;
  try {
    const payload = await getNestApiClient().request(
      `/api/admin/test-series/${encodeURIComponent(id)}/tests/${encodeURIComponent(testId)}`,
      {
        method: "GET",
        accessToken: token,
        cache: "no-store",
      }
    );
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, private" },
    });
  } catch (error) {
    const status = error instanceof ApiClientError ? error.status : 404;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Test not found" },
      { status }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; testId: string }> }
) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const { id, testId } = await context.params;
  try {
    const body = await request.json();
    const payload = await getNestApiClient().request(
      `/api/admin/test-series/${encodeURIComponent(id)}/tests/${encodeURIComponent(testId)}`,
      {
        method: "PATCH",
        accessToken: token,
        body: {
          code: body.code,
          title: body.name || body.title,
          description: body.description,
          instructionsEn: body.instructions || body.instructionsEn,
          instructionsTa: body.instructionsTa,
          testType: body.testType,
          status: body.status,
          durationMinutes: body.durationMinutes !== undefined ? Number(body.durationMinutes) : undefined,
          totalQuestions: body.totalQuestions !== undefined ? Number(body.totalQuestions) : undefined,
          totalMarks: body.totalMarks !== undefined ? Number(body.totalMarks) : undefined,
          passingMarks: body.passingMarks !== undefined ? (body.passingMarks ? Number(body.passingMarks) : null) : undefined,
          hasNegativeMarking: body.negativeMarking !== undefined ? Boolean(body.negativeMarking) : undefined,
          correctMarks: body.correctMarks !== undefined ? Number(body.correctMarks) : undefined,
          negativeMarks: body.negativeMarks !== undefined ? Number(body.negativeMarks) : undefined,
          maxAttempts: body.maxAttempts !== undefined ? Number(body.maxAttempts) : undefined,
          randomizeQuestions: body.randomizeQuestions !== undefined ? Boolean(body.randomizeQuestions) : undefined,
          randomizeOptions: body.randomizeOptions !== undefined ? Boolean(body.randomizeOptions) : undefined,
          showResultsImmediately: body.showResultsImmediately !== undefined ? Boolean(body.showResultsImmediately) : undefined,
          isOfflineAvailable: body.isOfflineAvailable !== undefined ? Boolean(body.isOfflineAvailable) : undefined,
          orderIndex: body.orderIndex !== undefined ? Number(body.orderIndex) : undefined,
          scheduledAt: body.testDate
            ? `${body.testDate}T${body.startTime || "10:00"}:00.000Z`
            : body.scheduledAt !== undefined ? body.scheduledAt : undefined,
          availableUntil: body.testDate
            ? `${body.testDate}T${body.endTime || "13:00"}:00.000Z`
            : body.availableUntil !== undefined ? body.availableUntil : undefined,
        },
        cache: "no-store",
      }
    );

    return NextResponse.json(payload);
  } catch (error) {
    const status = error instanceof ApiClientError ? error.status : 400;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update test" },
      { status }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; testId: string }> }
) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const { id, testId } = await context.params;
  try {
    const payload = await getNestApiClient().request(
      `/api/admin/test-series/${encodeURIComponent(id)}/tests/${encodeURIComponent(testId)}`,
      {
        method: "DELETE",
        accessToken: token,
        cache: "no-store",
      }
    );
    return NextResponse.json(payload);
  } catch (error) {
    const status = error instanceof ApiClientError ? error.status : 400;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete test" },
      { status }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; testId: string }> }
) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const { id, testId } = await context.params;
  try {
    const payload = await getNestApiClient().request(
      `/api/admin/test-series/${encodeURIComponent(id)}/tests/${encodeURIComponent(testId)}/duplicate`,
      {
        method: "POST",
        accessToken: token,
        cache: "no-store",
      }
    );
    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiClientError ? error.status : 400;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to duplicate test" },
      { status }
    );
  }
}
