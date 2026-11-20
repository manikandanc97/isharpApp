import { NextRequest, NextResponse } from "next/server";
import { calculateResultsOverview } from "@/lib/results-store";
import { getRequestAccessToken } from "@/lib/server-access-token";

export async function GET(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const overview = calculateResultsOverview();
  return NextResponse.json(overview);
}
