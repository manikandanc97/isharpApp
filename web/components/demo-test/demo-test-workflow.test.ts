import { describe, expect, it } from "vitest";
import { calculateScorecard } from "./demo-test-calculator";
import type { DemoQuestion } from "./demo-test.types";

describe("Demo Test Duration & Scorecard Consistency", () => {
  it("calculates +4 / -1 / 0 NEET marking accurately", () => {
    const questions: DemoQuestion[] = [
      {
        id: "q1",
        externalId: "P1",
        subject: "Physics",
        subjectCode: "PHYSICS",
        difficulty: "EASY",
        textEn: "Q1",
        correctMarks: 4,
        negativeMarks: 1,
        options: [
          { id: "o1", label: "1", textEn: "A", isCorrect: true, position: 1 },
          { id: "o2", label: "2", textEn: "B", isCorrect: false, position: 2 },
        ],
      },
      {
        id: "q2",
        externalId: "C1",
        subject: "Chemistry",
        subjectCode: "CHEMISTRY",
        difficulty: "MEDIUM",
        textEn: "Q2",
        correctMarks: 4,
        negativeMarks: 1,
        options: [
          { id: "o3", label: "1", textEn: "A", isCorrect: false, position: 1 },
          { id: "o4", label: "2", textEn: "B", isCorrect: true, position: 2 },
        ],
      },
      {
        id: "q3",
        externalId: "B1",
        subject: "Biology",
        subjectCode: "BIOLOGY",
        difficulty: "HARD",
        textEn: "Q3",
        correctMarks: 4,
        negativeMarks: 1,
        options: [
          { id: "o5", label: "1", textEn: "A", isCorrect: true, position: 1 },
          { id: "o6", label: "2", textEn: "B", isCorrect: false, position: 2 },
        ],
      },
    ];

    const report = calculateScorecard(
      questions,
      {
        q1: { questionId: "q1", selectedOptionId: "o1", markedForReview: false, visited: true, timeSpentSeconds: 15 },
        q2: { questionId: "q2", selectedOptionId: "o3", markedForReview: false, visited: true, timeSpentSeconds: 20 },
        q3: { questionId: "q3", selectedOptionId: undefined, markedForReview: false, visited: false, timeSpentSeconds: 0 },
      },
      35,
    );

    expect(report.totalScore).toBe(3); // +4 - 1 + 0
    expect(report.maxScore).toBe(12);
    expect(report.correctCount).toBe(1);
    expect(report.wrongCount).toBe(1);
    expect(report.skippedCount).toBe(1);
    expect(report.accuracy).toBe(50);
  });
});
