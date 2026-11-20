import { NextRequest, NextResponse } from "next/server";
import { ApiClientError } from "@/lib/api-client";
import { getNestApiClient } from "@/lib/nest-api";
import { getRequestAccessToken } from "@/lib/server-access-token";

export async function PUT(
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
      `/api/admin/test-series/${encodeURIComponent(id)}/tests/${encodeURIComponent(testId)}/questions`,
      {
        method: "PUT",
        accessToken: token,
        body,
        cache: "no-store",
      }
    );
    return NextResponse.json(payload);
  } catch (error) {
    const status = error instanceof ApiClientError ? error.status : 400;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to set test questions" },
      { status }
    );
  }
}
