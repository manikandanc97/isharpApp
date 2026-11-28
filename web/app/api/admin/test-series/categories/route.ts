import { NextRequest, NextResponse } from "next/server";
import { ApiClientError } from "@/lib/api-client";
import { getNestApiClient } from "@/lib/nest-api";
import { getRequestAccessToken } from "@/lib/server-access-token";

export async function GET(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    const payload = await getNestApiClient().request(`/api/admin/test-series/categories`, {
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
      { message: error instanceof Error ? error.message : "Failed to load categories" },
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
    const payload = await getNestApiClient().request(`/api/admin/test-series/categories`, {
      method: "POST",
      accessToken: token,
      body,
      cache: "no-store",
    });
    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiClientError ? error.status : 400;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create category" },
      { status }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ message: "Category ID is required" }, { status: 400 });
    }

    const payload = await getNestApiClient().request(
      `/api/admin/test-series/categories/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        accessToken: token,
        body: updates,
        cache: "no-store",
      }
    );
    return NextResponse.json(payload);
  } catch (error) {
    const status = error instanceof ApiClientError ? error.status : 400;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update category" },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const moveToCategoryId = searchParams.get("moveToCategoryId");
  if (!id) {
    return NextResponse.json({ message: "Category ID is required" }, { status: 400 });
  }

  const query = moveToCategoryId
    ? `?moveToCategoryId=${encodeURIComponent(moveToCategoryId)}`
    : "";

  try {
    const payload = await getNestApiClient().request(
      `/api/admin/test-series/categories/${encodeURIComponent(id)}${query}`,
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
      { message: error instanceof Error ? error.message : "Failed to delete category" },
      { status }
    );
  }
}
