import { describe, expect, it } from "vitest";
import { calculateResultsOverview, INITIAL_LEADERBOARD } from "./results-store";

describe("Results & Performance Analytics Store", () => {
  it("calculates accurate performance metrics and averages", () => {
    const results = calculateResultsOverview();
    expect(results.totalAttempts).toBeGreaterThan(0);
    expect(results.averageMarks).toBeGreaterThan(0);
    expect(results.highestMarks).toBe(685);
    expect(results.passPercentage).toBe(100);
  });

  it("provides subject-wise accuracy benchmarks", () => {
    const results = calculateResultsOverview();
    expect(results.subjectPerformance.physics.accuracy).toBeGreaterThan(80);
    expect(results.subjectPerformance.chemistry.accuracy).toBeGreaterThan(80);
    expect(results.subjectPerformance.biology.accuracy).toBeGreaterThan(85);
  });

  it("orders leaderboard entries by score and rank", () => {
    const results = calculateResultsOverview();
    expect(results.leaderboard[0].rank).toBe(1);
    expect(results.leaderboard[0].score).toBeGreaterThanOrEqual(results.leaderboard[1].score);
    expect(results.leaderboard[0].studentName).toBe("Meenakshi Sundaram");
  });

  it("includes high-yield chapter accuracy insights", () => {
    const results = calculateResultsOverview();
    expect(results.chapterInsights.length).toBeGreaterThan(0);
    const electro = results.chapterInsights.find((c) => c.chapterTitle.includes("Electrostatics"));
    expect(electro).toBeDefined();
    expect(electro?.accuracyPercentage).toBeGreaterThan(70);
  });
});
