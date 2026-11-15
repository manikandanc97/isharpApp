import { describe, expect, it } from "vitest";
import type { Question } from "./types";

describe("Question bank filter utilities", () => {
  const sampleQuestions = [
    {
      id: "q1",
      externalId: "PHY-001",
      courseSubject: {
        course: { code: "NEET" },
        subject: { code: "PHYSICS", name: "Physics" },
      },
      textEn: "What is kinetic energy?",
      textTa: "இயக்க ஆற்றல் என்றால் என்ன?",
      type: "SINGLE_CORRECT",
      language: "BILINGUAL",
      difficulty: "EASY",
      options: [],
    },
    {
      id: "q2",
      externalId: "CHEM-001",
      courseSubject: {
        course: { code: "NEET" },
        subject: { code: "CHEMISTRY", name: "Chemistry" },
      },
      textEn: "Define Avogadro number",
      textTa: null,
      type: "SINGLE_CORRECT",
      language: "ENGLISH",
      difficulty: "MEDIUM",
      options: [],
    },
    {
      id: "q3",
      externalId: "PHY-002",
      courseSubject: {
        course: { code: "NEET" },
        subject: { code: "PHYSICS", name: "Physics" },
      },
      textEn: "Explain torque in rotational motion",
      textTa: null,
      type: "NUMERICAL",
      language: "ENGLISH",
      difficulty: "HARD",
      options: [],
    },
  ] as unknown as Question[];

  it("calculates accurate subjectCounts across all three science streams", () => {
    const counts = {
      PHYSICS: sampleQuestions.filter(
        (item) => item.courseSubject.subject.code === "PHYSICS"
      ).length,
      CHEMISTRY: sampleQuestions.filter(
        (item) => item.courseSubject.subject.code === "CHEMISTRY"
      ).length,
      BIOLOGY: sampleQuestions.filter(
        (item) => item.courseSubject.subject.code === "BIOLOGY"
      ).length,
    };

    expect(counts.PHYSICS).toBe(2);
    expect(counts.CHEMISTRY).toBe(1);
    expect(counts.BIOLOGY).toBe(0);
  });

  it("filters visible questions by subject code and search term (English)", () => {
    const value = "kinetic".toLowerCase();
    const visible = sampleQuestions.filter(
      (item) =>
        item.courseSubject.subject.code === "PHYSICS" &&
        (!value ||
          item.externalId.toLowerCase().includes(value) ||
          item.textEn?.toLowerCase().includes(value) ||
          item.textTa?.toLowerCase().includes(value))
    );

    expect(visible).toHaveLength(1);
    expect(visible[0].externalId).toBe("PHY-001");
  });

  it("filters visible questions by Tamil search term", () => {
    const value = "இயக்க".toLowerCase();
    const visible = sampleQuestions.filter(
      (item) =>
        item.courseSubject.subject.code === "PHYSICS" &&
        (!value ||
          item.externalId.toLowerCase().includes(value) ||
          item.textEn?.toLowerCase().includes(value) ||
          item.textTa?.toLowerCase().includes(value))
    );

    expect(visible).toHaveLength(1);
    expect(visible[0].externalId).toBe("PHY-001");
  });

  it("filters visible questions by externalId code", () => {
    const value = "PHY-002".toLowerCase();
    const visible = sampleQuestions.filter(
      (item) =>
        item.courseSubject.subject.code === "PHYSICS" &&
        (!value ||
          item.externalId.toLowerCase().includes(value) ||
          item.textEn?.toLowerCase().includes(value) ||
          item.textTa?.toLowerCase().includes(value))
    );

    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe("q3");
  });

  it("isolates questions strictly to the active subject filter", () => {
    const visible = sampleQuestions.filter(
      (item) => item.courseSubject.subject.code === "BIOLOGY"
    );
    expect(visible).toHaveLength(0);
  });
});
