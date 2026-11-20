import { NextRequest, NextResponse } from "next/server";
import { ApiClientError } from "@/lib/api-client";
import { getNestApiClient } from "@/lib/nest-api";
import { getRequestAccessToken } from "@/lib/server-access-token";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const { attemptId } = await context.params;
  try {
    const payload = await getNestApiClient().request(`/api/exam/attempts/${attemptId}`, {
      method: "GET",
      accessToken: token,
      cache: "no-store",
    });
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, private" },
    });
  } catch (error) {
    const status = error instanceof ApiClientError ? error.status : 500;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to load examination attempt" },
      { status }
    );
  }
}
