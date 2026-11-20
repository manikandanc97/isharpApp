import { describe, expect, it } from "vitest";
import { examManagementStore } from "./exam-management-store";

describe("Exam Management Store", () => {
  it("initializes with seeded scheduled exams", () => {
    const exams = examManagementStore.getExams();
    expect(exams.length).toBeGreaterThanOrEqual(3);

    const live = exams.find((e) => e.status === "LIVE");
    expect(live).toBeDefined();
    expect(live?.testCode).toBe("NEET-11-BIO-01");
  });

  it("supports updating exam status and student eligibility", () => {
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
    const attempts = examManagementStore.getAttempts();
    expect(attempts.length).toBeGreaterThanOrEqual(3);

    const inProgress = attempts.find((a) => a.status === "IN_PROGRESS");
    expect(inProgress).toBeDefined();

    if (inProgress) {
      // Auto submit
      const submitted = examManagementStore.autoSubmitAttempt(inProgress.id);
      expect(submitted.status).toBe("SUBMITTED");
      expect(submitted.submittedAt).toBeDefined();

      // Grant reattempt
      const initialMax = submitted.maxAllowedAttempts;
      const granted = examManagementStore.grantReattempt(inProgress.id);
      expect(granted.maxAllowedAttempts).toBe(initialMax + 1);
    }
  });

  it("calculates accurate exam statistics", () => {
    const stats = examManagementStore.getExamStats();
    expect(stats.totalExams).toBeGreaterThanOrEqual(3);
    expect(stats.totalAttempts).toBeGreaterThanOrEqual(3);
  });
});
