"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Course } from "@/components/admin/admin-types";
import type {
  ChapterFormData,
  CurriculumChapter,
  CurriculumSubject,
  CurriculumTopic,
  SubjectFormData,
  TopicFormData,
} from "./curriculum-types";
import { generateDefaultTopicsForChapter } from "./topic-catalog";

interface StoragePayload {
  subjects: CurriculumSubject[];
  chapters: Record<string, CurriculumChapter[]>; // key: subjectId
  selectedSubjectId: string | null;
}

export function useCurriculum(course: Course) {
  const storageKey = `isharp_curriculum_v2_${course.id}`;

  // Initial State Hydration
  const [subjects, setSubjects] = useState<CurriculumSubject[]>(() => {
    // 1. Check local storage first for modifications
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          const parsed = JSON.parse(cached) as StoragePayload;
          if (parsed.subjects && parsed.subjects.length > 0) {
            return parsed.subjects;
          }
        }
      } catch {
        // Fall back to server course data
      }
    }

    // 2. Initialize from course.courseSubjects
    return course.courseSubjects.map((cs, idx) => ({
      id: cs.subject.id,
      courseSubjectId: cs.id,
      code: cs.subject.code,
      name: cs.subject.name,
      description: cs.subject.description || `NEET ${cs.subject.name} Curriculum`,
      position: idx + 1,
      isActive: true,
      chaptersCount: cs.chapters?.length || cs._count?.chapters || 0,
    }));
  });

  const [chaptersBySubject, setChaptersBySubject] = useState<
    Record<string, CurriculumChapter[]>
  >(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          const parsed = JSON.parse(cached) as StoragePayload;
          if (parsed.chapters && Object.keys(parsed.chapters).length > 0) {
            return parsed.chapters;
          }
        }
      } catch {
        // Fall back
      }
    }

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
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          const parsed = JSON.parse(cached) as StoragePayload;
          if (parsed.selectedSubjectId) {
            return parsed.selectedSubjectId;
          }
        }
      } catch {
        // Fall back
      }
    }
    return course.courseSubjects[0]?.subject.id || "";
  });

  const validSelectedSubjectId =
    subjects.length > 0 && !subjects.some((s) => s.id === selectedSubjectId)
      ? subjects[0].id
      : selectedSubjectId;

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const payload: StoragePayload = {
        subjects,
        chapters: chaptersBySubject,
        selectedSubjectId: validSelectedSubjectId,
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // Ignore quota errors
    }
  }, [subjects, chaptersBySubject, validSelectedSubjectId, storageKey]);

  // Helper to sync chapter counts in subjects
  const syncSubjectChapterCounts = useCallback(
    (
      newChaptersMap: Record<string, CurriculumChapter[]>,
      currentSubjects: CurriculumSubject[]
    ) => {
      return currentSubjects.map((sub) => ({
        ...sub,
        chaptersCount: (newChaptersMap[sub.id] || []).length,
      }));
    },
    []
  );

  // Active Subject Object
  const selectedSubject = useMemo(() => {
    return (
      subjects.find((s) => s.id === selectedSubjectId) ||
      subjects[0] ||
      null
    );
  }, [subjects, selectedSubjectId]);

  // Active Subject's Chapters
  const activeChapters = useMemo(() => {
    if (!selectedSubject) return [];
    return chaptersBySubject[selectedSubject.id] || [];
  }, [selectedSubject, chaptersBySubject]);

  // --- SUBJECT OPERATIONS ---

  const addSubject = useCallback(
    (data: SubjectFormData) => {
      const newSubjectId = `subj-${Date.now().toString(36)}`;
      const newCourseSubjId = `cs-${Date.now().toString(36)}`;
      const newSubject: CurriculumSubject = {
        id: newSubjectId,
        courseSubjectId: newCourseSubjId,
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
        position: subjects.length + 1,
        isActive: data.isActive ?? true,
        chaptersCount: 0,
      };

      setSubjects((prev) => [...prev, newSubject]);
      setChaptersBySubject((prev) => ({
        ...prev,
        [newSubjectId]: [],
      }));
      setSelectedSubjectId(newSubjectId);
      return newSubject;
    },
    [subjects.length]
  );

  const editSubject = useCallback(
    (subjectId: string, data: Partial<SubjectFormData>) => {
      setSubjects((prev) =>
        prev.map((sub) => {
          if (sub.id !== subjectId) return sub;
          return {
            ...sub,
            name: data.name !== undefined ? data.name.trim() : sub.name,
            code: data.code !== undefined ? data.code.trim().toUpperCase() : sub.code,
            description:
              data.description !== undefined ? data.description.trim() || null : sub.description,
            isActive: data.isActive !== undefined ? data.isActive : sub.isActive,
          };
        })
      );
    },
    []
  );

  const toggleSubjectActive = useCallback((subjectId: string) => {
    setSubjects((prev) =>
      prev.map((sub) =>
        sub.id === subjectId ? { ...sub, isActive: !sub.isActive } : sub
      )
    );
  }, []);

  const reorderSubject = useCallback(
    (subjectId: string, direction: "up" | "down") => {
      setSubjects((prev) => {
        const index = prev.findIndex((s) => s.id === subjectId);
        if (index === -1) return prev;
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= prev.length) return prev;

        const next = [...prev];
        const temp = next[index];
        next[index] = next[targetIndex];
        next[targetIndex] = temp;

        // Recalculate positions
        return next.map((item, idx) => ({ ...item, position: idx + 1 }));
      });
    },
    []
  );

  const deleteSubject = useCallback(
    (subjectId: string) => {
      setSubjects((prev) => {
        const filtered = prev.filter((s) => s.id !== subjectId);
        return filtered.map((item, idx) => ({ ...item, position: idx + 1 }));
      });

      setChaptersBySubject((prev) => {
        const copy = { ...prev };
        delete copy[subjectId];
        return copy;
      });

      // If deleted subject was active, switch to first available
      setSelectedSubjectId((current) => {
        if (current === subjectId) {
          const remaining = subjects.filter((s) => s.id !== subjectId);
          return remaining[0]?.id || "";
        }
        return current;
      });
    },
    [subjects]
  );

  // --- CHAPTER OPERATIONS ---

  const addChapter = useCallback(
    (subjectId: string, data: ChapterFormData) => {
      const newChapterId = `ch-${subjectId}-${Date.now().toString(36)}`;
      const currentList = chaptersBySubject[subjectId] || [];

      const newChapter: CurriculumChapter = {
        id: newChapterId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        position: data.position || currentList.length + 1,
        isActive: data.isActive ?? true,
        courseSubjectId: subjectId,
        topics: generateDefaultTopicsForChapter(data.title.trim(), currentList.length),
      };

      setChaptersBySubject((prev) => {
        const updatedList = [...(prev[subjectId] || []), newChapter].sort(
          (a, b) => a.position - b.position
        );
        const nextMap = { ...prev, [subjectId]: updatedList };

        // Also update subjects chapterCount
        setSubjects((currSubs) => syncSubjectChapterCounts(nextMap, currSubs));

        return nextMap;
      });

      return newChapter;
    },
    [chaptersBySubject, syncSubjectChapterCounts]
  );

  const editChapter = useCallback(
    (chapterId: string, data: Partial<ChapterFormData>) => {
      if (!selectedSubject) return;
      const subjectId = selectedSubject.id;

      setChaptersBySubject((prev) => {
        const currentList = prev[subjectId] || [];
        const updatedList = currentList.map((ch) => {
          if (ch.id !== chapterId) return ch;
          return {
            ...ch,
            title: data.title !== undefined ? data.title.trim() : ch.title,
            description:
              data.description !== undefined ? data.description.trim() || null : ch.description,
            position: data.position !== undefined ? data.position : ch.position,
            isActive: data.isActive !== undefined ? data.isActive : ch.isActive,
          };
        });

        // Re-sort by position
        updatedList.sort((a, b) => a.position - b.position);

        return { ...prev, [subjectId]: updatedList };
      });
    },
    [selectedSubject]
  );

  const toggleChapterActive = useCallback(
    (chapterId: string) => {
      if (!selectedSubject) return;
      const subjectId = selectedSubject.id;

      setChaptersBySubject((prev) => {
        const currentList = prev[subjectId] || [];
        const updated = currentList.map((ch) =>
          ch.id === chapterId ? { ...ch, isActive: !ch.isActive } : ch
        );
        return { ...prev, [subjectId]: updated };
      });
    },
    [selectedSubject]
  );

  const reorderChapter = useCallback(
    (chapterId: string, direction: "up" | "down") => {
      if (!selectedSubject) return;
      const subjectId = selectedSubject.id;

      setChaptersBySubject((prev) => {
        const currentList = [...(prev[subjectId] || [])];
        const index = currentList.findIndex((ch) => ch.id === chapterId);
        if (index === -1) return prev;
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= currentList.length) return prev;

        const temp = currentList[index];
        currentList[index] = currentList[targetIndex];
        currentList[targetIndex] = temp;

        // Re-assign 1-based positions
        const renumbered = currentList.map((ch, idx) => ({
          ...ch,
          position: idx + 1,
        }));

        return { ...prev, [subjectId]: renumbered };
      });
    },
    [selectedSubject]
  );

  const deleteChapter = useCallback(
    (chapterId: string) => {
      if (!selectedSubject) return;
      const subjectId = selectedSubject.id;

      setChaptersBySubject((prev) => {
        const filtered = (prev[subjectId] || []).filter((ch) => ch.id !== chapterId);
        const renumbered = filtered.map((ch, idx) => ({ ...ch, position: idx + 1 }));
        const nextMap = { ...prev, [subjectId]: renumbered };

        setSubjects((currSubs) => syncSubjectChapterCounts(nextMap, currSubs));

        return nextMap;
      });
    },
    [selectedSubject, syncSubjectChapterCounts]
  );

  // --- TOPIC OPERATIONS ---

  const addTopic = useCallback(
    (chapterId: string, data: TopicFormData) => {
      if (!selectedSubject) return;
      const subjectId = selectedSubject.id;

      setChaptersBySubject((prev) => {
        const currentList = prev[subjectId] || [];
        const updated = currentList.map((ch) => {
          if (ch.id !== chapterId) return ch;
          const newTopic: CurriculumTopic = {
            id: `topic-${Date.now().toString(36)}`,
            title: data.title.trim(),
            position: data.position || ch.topics.length + 1,
            isCovered: data.isCovered ?? true,
          };
          return {
            ...ch,
            topics: [...ch.topics, newTopic],
          };
        });
        return { ...prev, [subjectId]: updated };
      });
    },
    [selectedSubject]
  );

  const editTopic = useCallback(
    (chapterId: string, topicId: string, data: Partial<TopicFormData>) => {
      if (!selectedSubject) return;
      const subjectId = selectedSubject.id;

      setChaptersBySubject((prev) => {
        const currentList = prev[subjectId] || [];
        const updated = currentList.map((ch) => {
          if (ch.id !== chapterId) return ch;
          const updatedTopics = ch.topics.map((t) => {
            if (t.id !== topicId) return t;
            return {
              ...t,
              title: data.title !== undefined ? data.title.trim() : t.title,
              position: data.position !== undefined ? data.position : t.position,
              isCovered: data.isCovered !== undefined ? data.isCovered : t.isCovered,
            };
          });
          return { ...ch, topics: updatedTopics };
        });
        return { ...prev, [subjectId]: updated };
      });
    },
    [selectedSubject]
  );

  const deleteTopic = useCallback(
    (chapterId: string, topicId: string) => {
      if (!selectedSubject) return;
      const subjectId = selectedSubject.id;

      setChaptersBySubject((prev) => {
        const currentList = prev[subjectId] || [];
        const updated = currentList.map((ch) => {
          if (ch.id !== chapterId) return ch;
          const remainingTopics = ch.topics
            .filter((t) => t.id !== topicId)
            .map((t, idx) => ({ ...t, position: idx + 1 }));
          return { ...ch, topics: remainingTopics };
        });
        return { ...prev, [subjectId]: updated };
      });
    },
    [selectedSubject]
  );

  const reorderTopic = useCallback(
    (chapterId: string, topicId: string, direction: "up" | "down") => {
      if (!selectedSubject) return;
      const subjectId = selectedSubject.id;

      setChaptersBySubject((prev) => {
        const currentList = prev[subjectId] || [];
        const updated = currentList.map((ch) => {
          if (ch.id !== chapterId) return ch;
          const topics = [...ch.topics];
          const index = topics.findIndex((t) => t.id === topicId);
          if (index === -1) return ch;
          const target = direction === "up" ? index - 1 : index + 1;
          if (target < 0 || target >= topics.length) return ch;

          const temp = topics[index];
          topics[index] = topics[target];
          topics[target] = temp;

          const renumbered = topics.map((t, idx) => ({ ...t, position: idx + 1 }));
          return { ...ch, topics: renumbered };
        });
        return { ...prev, [subjectId]: updated };
      });
    },
    [selectedSubject]
  );

  // Total chapters across all subjects
  const totalChaptersAcrossAllSubjects = useMemo(() => {
    return Object.values(chaptersBySubject).reduce(
      (acc, list) => acc + list.length,
      0
    );
  }, [chaptersBySubject]);

  return {
    subjects,
    selectedSubject,
    selectedSubjectId: validSelectedSubjectId,
    setSelectedSubjectId,
    activeChapters,
    totalChaptersAcrossAllSubjects,
    // Subject Actions
    addSubject,
    editSubject,
    toggleSubjectActive,
    reorderSubject,
    deleteSubject,
    // Chapter Actions
    addChapter,
    editChapter,
    toggleChapterActive,
    reorderChapter,
    deleteChapter,
    // Topic Actions
    addTopic,
    editTopic,
    deleteTopic,
    reorderTopic,
  };
}
