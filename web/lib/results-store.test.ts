import { describe, expect, it } from "vitest";
import { calculateResultsOverview, type StudentRankEntry } from "./results-store";

describe("Results & Performance Analytics Store", () => {
  it("handles empty results safely without NaN or Infinity", () => {
    const results = calculateResultsOverview([]);
    expect(results.totalAttempts).toBe(0);
    expect(results.averageMarks).toBe(0);
    expect(results.highestMarks).toBe(0);
    expect(results.passPercentage).toBe(0);
    expect(results.overallAccuracy).toBe(0);
    expect(results.leaderboard).toEqual([]);
    expect(results.chapterInsights).toEqual([]);
  });

  it("calculates accurate performance metrics and averages when entries exist", () => {
    const mockEntries: StudentRankEntry[] = [
      {
        rank: 1,
        studentId: "ISA-001",
        studentName: "Test Student 1",
        category: "INTERNAL",
        testName: "NEET Grand Test",
        score: 680,
        totalMarks: 720,
        percentage: 94.4,
        accuracy: 96,
        correctCount: 172,
        incorrectCount: 8,
        unattemptedCount: 0,
        percentile: 99.8,
        submittedAt: "2026-11-20T10:00:00Z",
        physicsScore: 170,
        chemistryScore: 170,
        biologyScore: 340,
      },
      {
        rank: 2,
        studentId: "ISA-002",
        studentName: "Test Student 2",
        category: "EXTERNAL",
        testName: "NEET Grand Test",
        score: 600,
        totalMarks: 720,
        percentage: 83.3,
        accuracy: 90,
        correctCount: 155,
        incorrectCount: 20,
        unattemptedCount: 5,
        percentile: 95.0,
        submittedAt: "2026-11-20T10:15:00Z",
        physicsScore: 150,
        chemistryScore: 150,
        biologyScore: 300,
      },
    ];

    const results = calculateResultsOverview(mockEntries);
    expect(results.totalAttempts).toBe(2);
    expect(results.averageMarks).toBe(640);
    expect(results.highestMarks).toBe(680);
    expect(results.passPercentage).toBe(100);
    expect(results.overallAccuracy).toBe(93);
    expect(results.subjectPerformance.physics.averageScore).toBe(160);
  });
});
