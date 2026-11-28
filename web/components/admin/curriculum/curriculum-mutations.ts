import type { Course } from "@/components/admin/admin-types";
import type {
  CurriculumChapter,
  CurriculumSubject,
} from "./curriculum-types";
import { generateDefaultTopicsForChapter } from "./topic-catalog";

export interface CurriculumStoragePayload {
  subjects: CurriculumSubject[];
  chapters: Record<string, CurriculumChapter[]>;
  selectedSubjectId: string | null;
}

export function loadCachedCurriculum(
  storageKey: string,
): CurriculumStoragePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(storageKey);
    if (!cached) return null;
    return JSON.parse(cached) as CurriculumStoragePayload;
  } catch {
    return null;
  }
}

export function buildInitialSubjects(course: Course): CurriculumSubject[] {
  return course.courseSubjects.map((cs, idx) => ({
    id: cs.subject.id,
    courseSubjectId: cs.id,
    code: cs.subject.code,
    name: cs.subject.name,
    description:
      cs.subject.description || `NEET ${cs.subject.name} Curriculum`,
    position: idx + 1,
    isActive: true,
    chaptersCount: cs.chapters?.length || cs._count?.chapters || 0,
  }));
}

export function buildInitialChaptersMap(
  course: Course,
): Record<string, CurriculumChapter[]> {
  const initialMap: Record<string, CurriculumChapter[]> = {};
  course.courseSubjects.forEach((cs) => {
    const subjectId = cs.subject.id;
    const rawChapters = cs.chapters || [];
    initialMap[subjectId] = rawChapters.map((ch, idx) => ({
      id: ch.id || `ch-${subjectId}-${idx + 1}`,
      title: ch.title,
      description: ch.description || null,
      position: ch.position ?? idx + 1,
      isActive: ch.isActive ?? true,
      courseSubjectId: cs.id,
      topics: generateDefaultTopicsForChapter(ch.title, idx),
    }));
  });
  return initialMap;
}

export function syncSubjectChapterCounts(
  newChaptersMap: Record<string, CurriculumChapter[]>,
  currentSubjects: CurriculumSubject[],
): CurriculumSubject[] {
  return currentSubjects.map((sub) => ({
    ...sub,
    chaptersCount: (newChaptersMap[sub.id] || []).length,
  }));
}

export function reorderItemsWithPosition<T extends { id: string; position: number }>(
  items: T[],
  itemId: string,
  direction: "up" | "down",
): T[] {
  const index = items.findIndex((item) => item.id === itemId);
  if (index === -1) return items;
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) return items;

  const next = [...items];
  const temp = next[index];
  next[index] = next[targetIndex];
  next[targetIndex] = temp;

  return next.map((item, idx) => ({ ...item, position: idx + 1 }));
}
