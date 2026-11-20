import { NextRequest, NextResponse } from "next/server";
import { ApiClientError } from "@/lib/api-client";
import { getNestApiClient } from "@/lib/nest-api";
import { getRequestAccessToken } from "@/lib/server-access-token";

export async function GET(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const search = request.nextUrl.search;
  try {
    const payload = await getNestApiClient().request(`/api/admin/test-series${search}`, {
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
      { message: error instanceof Error ? error.message : "Failed to load test series" },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload = await getNestApiClient().request(`/api/admin/test-series`, {
      method: "POST",
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
    });

    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiClientError ? error.status : 400;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create test series" },
      { status }
    );
  }
}
