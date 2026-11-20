import { describe, expect, it } from "vitest";
import { generateDefaultTopicsForChapter } from "./topic-catalog";
import type { Course } from "../admin-types";

describe("Curriculum Topic Generator", () => {
  it("generates known topics for standard NEET chapters", () => {
    const topics = generateDefaultTopicsForChapter("Laws of Motion", 0);
    expect(topics.length).toBeGreaterThanOrEqual(4);
    expect(topics[0].title).toContain("Newton's First and Second Laws");
  });

  it("generates fallback structured topics for custom chapters", () => {
    const topics = generateDefaultTopicsForChapter("Biomolecules and Polymers", 1);
    expect(topics.length).toBe(4);
    expect(topics[0].title).toContain("Fundamental Principles & Core Concepts");
  });
});

describe("Curriculum Data Model Integrity", () => {
  const mockCourse: Course = {
    id: "course-neet-test",
    code: "NEET",
    title: "NEET Coaching Programme",
    description: "NEET Medical Entrance Preparation",
    isActive: true,
    updatedAt: new Date().toISOString(),
    courseSubjects: [
      {
        id: "cs-physics",
        subject: { id: "subj-phy", code: "PHYSICS", name: "Physics" },
        chapters: [
          { id: "ch-1", title: "Physical World", position: 1, isActive: true },
          { id: "ch-2", title: "Kinematics", position: 2, isActive: true },
        ],
        _count: { chapters: 2 },
      },
      {
        id: "cs-chemistry",
        subject: { id: "subj-chem", code: "CHEMISTRY", name: "Chemistry" },
        chapters: [
          { id: "ch-3", title: "Some Basic Concepts of Chemistry", position: 1, isActive: true },
        ],
        _count: { chapters: 1 },
      },
    ],
  };

  it("calculates initial subjects count and chapter distribution correctly", () => {
    const subjects = mockCourse.courseSubjects.map((cs, idx) => ({
      id: cs.subject.id,
      name: cs.subject.name,
      code: cs.subject.code,
      chaptersCount: cs.chapters?.length || 0,
      position: idx + 1,
    }));

    expect(subjects).toHaveLength(2);
    expect(subjects[0].name).toBe("Physics");
    expect(subjects[0].chaptersCount).toBe(2);
    expect(subjects[1].name).toBe("Chemistry");
    expect(subjects[1].chaptersCount).toBe(1);
  });

  it("supports reordering subjects and recalculating positions", () => {
    const list = [
      { id: "1", name: "Physics", position: 1 },
      { id: "2", name: "Chemistry", position: 2 },
    ];

    // Swap positions
    const reordered = [list[1], list[0]].map((item, idx) => ({
      ...item,
      position: idx + 1,
    }));

    expect(reordered[0].name).toBe("Chemistry");
    expect(reordered[0].position).toBe(1);
    expect(reordered[1].name).toBe("Physics");
    expect(reordered[1].position).toBe(2);
  });

  it("supports reordering chapters within a subject", () => {
    const chapters = [
      { id: "ch-1", title: "Physical World", position: 1 },
      { id: "ch-2", title: "Kinematics", position: 2 },
      { id: "ch-3", title: "Laws of Motion", position: 3 },
    ];

    // Move ch-3 up
    const index = 2;
    const target = 1;
    const copy = [...chapters];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;

    const renumbered = copy.map((ch, idx) => ({ ...ch, position: idx + 1 }));

    expect(renumbered[1].title).toBe("Laws of Motion");
    expect(renumbered[1].position).toBe(2);
    expect(renumbered[2].title).toBe("Kinematics");
    expect(renumbered[2].position).toBe(3);
  });
});
