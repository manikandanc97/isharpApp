import { NextRequest, NextResponse } from "next/server";
import { getRequestAccessToken } from "@/lib/server-access-token";

let systemSettings = {
  institutionName: "I-SHARP Academy",
  tagline: "Premier NEET & Medical Entrance Coaching Centre",
  supportEmail: "support@isharpacademy.in",
  supportPhone: "+91 94440 12345",
  currentAcademicYear: "2026-2027",
  defaultTestDurationMinutes: 180,
  defaultPositiveMarks: 4,
  defaultNegativeMarks: 1,
  passingScorePercentage: 50,
  autoSubmitOnTimeout: true,
  resultReleasePolicy: "SCHEDULED" as "IMMEDIATE" | "SCHEDULED" | "MANUAL",
  bilingualDefault: true,
  allowStudentReviewAfterRelease: true,
};

export async function GET(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  return NextResponse.json(systemSettings);
}

export async function PATCH(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    systemSettings = {
      ...systemSettings,
      ...body,
    };
    return NextResponse.json(systemSettings);
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to update settings" },
      { status: 400 }
    );
  }
}
