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
    const payload = await getNestApiClient().request(
      `/api/admin/test-series/${encodeURIComponent(id)}`,
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
      { message: error instanceof Error ? error.message : "Test series not found" },
      { status }
    );
  }
}

export async function PATCH(
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
      `/api/admin/test-series/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        accessToken: token,
        body: {
          title: body.name || body.title,
          description: body.description,
          categoryId: body.categoryId,
          academicYear: body.academicYear,
          coverImageUrl: body.coverImage || body.coverImageUrl,
          courseId: body.courseId,
          status: body.status,
          isActive: body.isActive,
          startDate: body.startDate,
          endDate: body.endDate,
        },
        cache: "no-store",
      }
    );
    return NextResponse.json(payload);
  } catch (error) {
    const status = error instanceof ApiClientError ? error.status : 400;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update test series" },
      { status }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const payload = await getNestApiClient().request(
      `/api/admin/test-series/${encodeURIComponent(id)}`,
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
      { message: error instanceof Error ? error.message : "Failed to delete test series" },
      { status }
    );
  }
}
