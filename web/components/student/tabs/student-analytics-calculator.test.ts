import { describe, expect, it } from "vitest";
import {
  calculateCurriculumReadiness,
  calculateProgressPercentage,
  calculateSubjectDistribution,
  calculateSyllabusCoverage,
  getActivityRoadmapStats,
} from "./student-analytics-calculator";
import type { StudentPortalData } from "../student-types";

describe("student-analytics-calculator", () => {
  describe("calculateProgressPercentage", () => {
    it("safely handles null and undefined values without NaN", () => {
      expect(calculateProgressPercentage(null, 100)).toBe(0);
      expect(calculateProgressPercentage(50, null)).toBe(0);
      expect(calculateProgressPercentage(undefined, undefined)).toBe(0);
    });

    it("prevents division-by-zero when total is 0 or negative", () => {
      expect(calculateProgressPercentage(10, 0)).toBe(0);
      expect(calculateProgressPercentage(10, -5)).toBe(0);
    });

    it("prevents negative percentage when value is negative", () => {
      expect(calculateProgressPercentage(-10, 50)).toBe(0);
    });

    it("calculates accurate rounded percentage for valid inputs", () => {
      expect(calculateProgressPercentage(1, 3)).toBe(33);
      expect(calculateProgressPercentage(2, 3)).toBe(67);
      expect(calculateProgressPercentage(50, 100)).toBe(50);
    });

    it("clamps at 100% when value exceeds total", () => {
      expect(calculateProgressPercentage(150, 100)).toBe(100);
    });
  });

  describe("calculateSubjectDistribution", () => {
    it("safely handles null, undefined, and empty questions array", () => {
      expect(calculateSubjectDistribution(null)).toEqual([]);
      expect(calculateSubjectDistribution(undefined)).toEqual([]);
      expect(calculateSubjectDistribution([])).toEqual([]);
    });

    it("calculates subject distribution and themes correctly", () => {
      const mockQuestions = [
        {
          id: "q1",
          subject: { id: "s1", code: "PHY", name: "Physics" },
        },
        {
          id: "q2",
          subject: { id: "s1", code: "PHY", name: "Physics" },
        },
        {
          id: "q3",
          subject: { id: "s2", code: "CHEM", name: "Chemistry" },
        },
        {
          id: "q4",
          subject: { id: "s3", code: "BIO", name: "Biology" },
        },
      ] as unknown as StudentPortalData["recentQuestions"];

      const distribution = calculateSubjectDistribution(mockQuestions);

      expect(distribution).toHaveLength(3);
      const physics = distribution.find((d) => d.name === "Physics");
      expect(physics).toBeDefined();
      expect(physics?.count).toBe(2);
      expect(physics?.percentage).toBe(50);
      expect(physics?.theme.name).toBe("Physics");

      const chemistry = distribution.find((d) => d.name === "Chemistry");
      expect(chemistry?.count).toBe(1);
      expect(chemistry?.percentage).toBe(25);

      const biology = distribution.find((d) => d.name === "Biology");
      expect(biology?.count).toBe(1);
      expect(biology?.percentage).toBe(25);
    });
  });

  describe("calculateCurriculumReadiness", () => {
    it("returns 88% readiness when total questions > 0", () => {
      const readiness = calculateCurriculumReadiness(150);
      expect(readiness.percentage).toBe(88);
      expect(readiness.label).toBe("88");
      expect(readiness.widthPercent).toBe(88);
    });

    it("returns 50% baseline readiness when questions is 0, null, or undefined", () => {
      expect(calculateCurriculumReadiness(0).percentage).toBe(50);
      expect(calculateCurriculumReadiness(null).percentage).toBe(50);
      expect(calculateCurriculumReadiness(undefined).percentage).toBe(50);
    });
  });

  describe("calculateSyllabusCoverage", () => {
    it("safely handles null or undefined summary", () => {
      const coverage = calculateSyllabusCoverage(null);
      expect(coverage.activeCourses).toBe(0);
      expect(coverage.activeSubjects).toBe(0);
      expect(coverage.activeChapters).toBe(0);
      expect(coverage.activeQuestions).toBe(0);
      expect(coverage.publishedMocks).toBe(0);
      expect(coverage.hasContent).toBe(false);
    });

    it("aggregates stats accurately for populated summary", () => {
      const coverage = calculateSyllabusCoverage({
        activeCourses: 2,
        activeSubjects: 4,
        activeChapters: 32,
        activeQuestions: 500,
        publishedMocks: 10,
      });
      expect(coverage.activeCourses).toBe(2);
      expect(coverage.activeSubjects).toBe(4);
      expect(coverage.activeChapters).toBe(32);
      expect(coverage.activeQuestions).toBe(500);
      expect(coverage.publishedMocks).toBe(10);
      expect(coverage.hasContent).toBe(true);
    });
  });

  describe("getActivityRoadmapStats", () => {
    it("returns consistent habit tracking values", () => {
      const stats = getActivityRoadmapStats(5);
      expect(stats.streakLabel).toBe("5 Day Streak");
      expect(stats.targetQuestionsPerDay).toBe(25);
      expect(stats.status).toBe("On Track");
    });
  });
});
