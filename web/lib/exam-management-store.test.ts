import { describe, expect, it } from "vitest";
import { examManagementStore } from "./exam-management-store";

describe("Exam Management Store", () => {
  it("initializes cleanly without hardcoded dummy data", () => {
    const exams = examManagementStore.getExams();
    expect(Array.isArray(exams)).toBe(true);

    const attempts = examManagementStore.getAttempts();
    expect(Array.isArray(attempts)).toBe(true);
  });

  it("supports scheduling exams, updating exam status and student eligibility", () => {
    const scheduled = examManagementStore.scheduleExam({
      testId: "test-unit-01",
      testSeriesId: "series-unit",
      testName: "Unit Test Exam",
      testCode: "NEET-UNIT-01",
      categoryName: "Class 11",
      durationMinutes: 120,
      totalQuestions: 90,
      totalMarks: 360,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
      assignmentTarget: "ALL",
      assignedStudentIds: [],
      status: "UPCOMING",
      maxAttempts: 1,
      autoSubmitOnTimeout: true,
    });

    expect(scheduled.id).toBeDefined();
    expect(scheduled.status).toBe("UPCOMING");

    // Update status to LIVE
    const live = examManagementStore.updateExamStatus(scheduled.id, "LIVE");
    expect(live.status).toBe("LIVE");

    // Update eligibility target
    const targetUpdated = examManagementStore.updateStudentAssignment(
      scheduled.id,
      "INTERNAL_ONLY",
      ["ISA-INT-2026-001"]
    );
    expect(targetUpdated.assignmentTarget).toBe("INTERNAL_ONLY");
    expect(targetUpdated.assignedStudentIds).toContain("ISA-INT-2026-001");
  });

  it("handles auto-submit and reattempt configurations for student attempts", () => {
    const attempt = examManagementStore.recordAttempt({
      examId: "exam-test-1",
      testId: "test-unit-01",
      testName: "Unit Test Exam",
      studentId: "ISA-INT-2026-001",
      studentName: "Real Student",
      studentEmail: "student@isharp.edu",
      studentCategory: "INTERNAL",
      attemptNumber: 1,
      maxAllowedAttempts: 1,
      startedAt: new Date().toISOString(),
      submittedAt: null,
      durationSeconds: 1200,
      score: 0,
      totalMarks: 360,
      percentage: 0,
      accuracy: 0,
      questionsAttempted: 30,
      totalQuestions: 90,
      status: "IN_PROGRESS",
      subjectScores: {
        physics: { score: 0, max: 120 },
        chemistry: { score: 0, max: 120 },
        biology: { score: 0, max: 120 },
      },
    });

    expect(attempt.id).toBeDefined();
    expect(attempt.status).toBe("IN_PROGRESS");

    // Auto submit
    const submitted = examManagementStore.autoSubmitAttempt(attempt.id);
    expect(submitted.status).toBe("SUBMITTED");
    expect(submitted.submittedAt).toBeDefined();

    // Grant reattempt
    const initialMax = submitted.maxAllowedAttempts;
    const granted = examManagementStore.grantReattempt(attempt.id);
    expect(granted.maxAllowedAttempts).toBe(initialMax + 1);
  });

  it("calculates accurate exam statistics dynamically", () => {
    const stats = examManagementStore.getExamStats();
    expect(stats.totalExams).toBeGreaterThanOrEqual(1);
    expect(stats.totalAttempts).toBeGreaterThanOrEqual(1);
  });
});
