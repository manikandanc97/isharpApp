import type { StudentPortalData } from "../student-types";

export interface DppFilterCriteria {
  searchQuery?: string;
  selectedSubject?: string;
  selectedDifficulty?: string;
  selectedType?: string;
}

/**
 * Collect unique subjects across all student enrolled courses.
 */
export function extractUniqueSubjects(
  courses: StudentPortalData["courses"]
): Array<{ id: string; name: string }> {
  const list: Array<{ id: string; name: string }> = [];
  const seen = new Set<string>();
  for (const course of courses) {
    for (const sub of course.subjects) {
      if (!seen.has(sub.name)) {
        seen.add(sub.name);
        list.push({ id: sub.id, name: sub.name });
      }
    }
  }
  return list;
}

/**
 * Pure filter function for DPP questions bank.
 */
export function filterDppQuestions(
  questions: StudentPortalData["recentQuestions"],
  criteria: DppFilterCriteria
): StudentPortalData["recentQuestions"] {
  const trimmedQuery = criteria.searchQuery?.trim().toLowerCase() ?? "";
  const selectedSubject = criteria.selectedSubject ?? "ALL";
  const selectedDifficulty = criteria.selectedDifficulty ?? "ALL";
  const selectedType = criteria.selectedType ?? "ALL";

  return questions.filter((q) => {
    // Search
    if (trimmedQuery) {
      const matchesEn = q.textEn?.toLowerCase().includes(trimmedQuery) ?? false;
      const matchesTa = q.textTa?.toLowerCase().includes(trimmedQuery) ?? false;
      const matchesId = q.externalId.toLowerCase().includes(trimmedQuery);
      const matchesSub = q.subject.name.toLowerCase().includes(trimmedQuery);
      const matchesChap = q.chapter?.title.toLowerCase().includes(trimmedQuery) ?? false;
      if (!matchesEn && !matchesTa && !matchesId && !matchesSub && !matchesChap) {
        return false;
      }
    }

    // Subject Filter
    if (selectedSubject !== "ALL" && q.subject.name !== selectedSubject) {
      return false;
    }

    // Difficulty Filter
    if (selectedDifficulty !== "ALL" && q.difficulty !== selectedDifficulty) {
      return false;
    }

    // Type Filter
    if (selectedType !== "ALL" && q.type !== selectedType) {
      return false;
    }

    return true;
  });
}
