import { describe, expect, it } from "vitest";
import { extractUniqueSubjects, filterDppQuestions } from "./student-dpp-utils";
import type { StudentPortalData } from "../student-types";

describe("student-dpp-utils", () => {
  const mockCourses: StudentPortalData["courses"] = [
    {
      id: "course-1",
      code: "NEET-11",
      title: "NEET Class 11",
      description: null,
      subjects: [
        {
          id: "sub-1",
          code: "PHY",
          name: "Physics",
          description: null,
          chapterCount: 10,
          questionCount: 50,
        },
        {
          id: "sub-2",
          code: "CHEM",
          name: "Chemistry",
          description: null,
          chapterCount: 12,
          questionCount: 60,
        },
      ],
    },
    {
      id: "course-2",
      code: "NEET-12",
      title: "NEET Class 12",
      description: null,
      subjects: [
        {
          id: "sub-1",
          code: "PHY",
          name: "Physics",
          description: null,
          chapterCount: 10,
          questionCount: 40,
        },
      ],
    },
  ];

  const mockQuestions: StudentPortalData["recentQuestions"] = [
    {
      id: "q-1",
      externalId: "PHY-001",
      type: "SINGLE_CORRECT",
      language: "BILINGUAL",
      difficulty: "EASY",
      textEn: "What is velocity?",
      textTa: "திசைவேகம் என்றால் என்ன?",
      questionImageUrl: null,
      updatedAt: "2026-01-01T00:00:00Z",
      chapter: { id: "ch-1", title: "Kinematics" },
      course: { id: "c-1", code: "NEET-11", title: "Class 11" },
      subject: { id: "s-1", code: "PHY", name: "Physics" },
    },
    {
      id: "q-2",
      externalId: "CHEM-001",
      type: "NUMERICAL",
      language: "ENGLISH",
      difficulty: "HARD",
      textEn: "Calculate molarity of solution",
      textTa: null,
      questionImageUrl: null,
      updatedAt: "2026-01-02T00:00:00Z",
      chapter: { id: "ch-2", title: "Solutions" },
      course: { id: "c-1", code: "NEET-11", title: "Class 11" },
      subject: { id: "s-2", code: "CHEM", name: "Chemistry" },
    },
  ];

  describe("extractUniqueSubjects", () => {
    it("extracts distinct subjects from all courses without duplicates", () => {
      const subjects = extractUniqueSubjects(mockCourses);
      expect(subjects).toEqual([
        { id: "sub-1", name: "Physics" },
        { id: "sub-2", name: "Chemistry" },
      ]);
    });

    it("handles empty courses array safely", () => {
      expect(extractUniqueSubjects([])).toEqual([]);
    });
  });

  describe("filterDppQuestions", () => {
    it("returns all questions when criteria are empty/default", () => {
      const filtered = filterDppQuestions(mockQuestions, {});
      expect(filtered).toHaveLength(2);
    });

    it("filters questions by search query (English text)", () => {
      const filtered = filterDppQuestions(mockQuestions, { searchQuery: "velocity" });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("q-1");
    });

    it("filters questions by search query (Tamil text)", () => {
      const filtered = filterDppQuestions(mockQuestions, { searchQuery: "திசைவேகம்" });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("q-1");
    });

    it("filters questions by search query (External ID)", () => {
      const filtered = filterDppQuestions(mockQuestions, { searchQuery: "CHEM-001" });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("q-2");
    });

    it("filters questions by search query (Chapter title)", () => {
      const filtered = filterDppQuestions(mockQuestions, { searchQuery: "Kinematics" });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("q-1");
    });

    it("filters questions by search query (Subject name)", () => {
      const filtered = filterDppQuestions(mockQuestions, { searchQuery: "Physics" });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("q-1");
    });

    it("filters questions by selectedSubject", () => {
      const filtered = filterDppQuestions(mockQuestions, { selectedSubject: "Chemistry" });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("q-2");
    });

    it("filters questions by selectedDifficulty", () => {
      const filtered = filterDppQuestions(mockQuestions, { selectedDifficulty: "HARD" });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("q-2");
    });

    it("filters questions by selectedType", () => {
      const filtered = filterDppQuestions(mockQuestions, { selectedType: "NUMERICAL" });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("q-2");
    });

    it("combines multiple filters correctly", () => {
      const filtered = filterDppQuestions(mockQuestions, {
        selectedSubject: "Physics",
        selectedDifficulty: "HARD",
      });
      expect(filtered).toHaveLength(0);
    });
  });
});
