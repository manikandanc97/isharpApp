import { NextRequest, NextResponse } from "next/server";
import { examManagementStore, type ExamStatus } from "@/lib/exam-management-store";
import { getNestApiClient } from "@/lib/nest-api";
import { getRequestAccessToken } from "@/lib/server-access-token";

export async function GET(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const search = request.nextUrl.search;
  try {
    const payload = await getNestApiClient().request(`/api/admin/exams${search}`, {
      method: "GET",
      accessToken: token,
      cache: "no-store",
    });
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, private" },
    });
  } catch {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as ExamStatus | undefined;

    const exams = examManagementStore.getExams(status);
    const stats = examManagementStore.getExamStats();

    return NextResponse.json({ exams, stats });
  }
}

export async function POST(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.testId || !body.testName) {
      return NextResponse.json({ message: "testId and testName are required" }, { status: 400 });
    }

    const scheduled = examManagementStore.scheduleExam({
      testId: body.testId,
      testSeriesId: body.testSeriesId || "series-general",
      testName: body.testName,
      testCode: body.testCode || `EXAM-${Date.now().toString().slice(-4)}`,
      categoryName: body.categoryName || "General NEET",
      durationMinutes: Number(body.durationMinutes) || 180,
      totalQuestions: Number(body.totalQuestions) || 180,
      totalMarks: Number(body.totalMarks) || 720,
      startTime: body.startTime || new Date().toISOString(),
      endTime: body.endTime || new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      assignmentTarget: body.assignmentTarget || "ALL",
      assignedStudentIds: body.assignedStudentIds || [],
      status: body.status || "UPCOMING",
      maxAttempts: Number(body.maxAttempts) || 1,
      autoSubmitOnTimeout: body.autoSubmitOnTimeout !== false,
    });

    return NextResponse.json(scheduled, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to schedule exam" },
      { status: 400 }
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
    const { id, status, assignmentTarget, assignedStudentIds } = body;
    if (!id) {
      return NextResponse.json({ message: "Exam ID is required" }, { status: 400 });
    }

    try {
      const payload = await getNestApiClient().request(`/api/admin/exams/${id}`, {
        method: "PATCH",
        accessToken: token,
        body: { status, assignmentTarget, assignedStudentIds },
        cache: "no-store",
      });
      return NextResponse.json(payload);
    } catch {
      let updated = examManagementStore.getExamById(id);
      if (!updated) {
        return NextResponse.json({ message: "Exam not found" }, { status: 404 });
      }

      if (status) {
        updated = examManagementStore.updateExamStatus(id, status);
      }
      if (assignmentTarget) {
        updated = examManagementStore.updateStudentAssignment(id, assignmentTarget, assignedStudentIds || []);
      }

      return NextResponse.json(updated);
    }
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to update exam" },
      { status: 400 }
    );
  }
}
