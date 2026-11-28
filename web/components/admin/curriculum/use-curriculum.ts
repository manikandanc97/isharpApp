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
import {
  buildInitialChaptersMap,
  buildInitialSubjects,
  loadCachedCurriculum,
  reorderItemsWithPosition,
  syncSubjectChapterCounts,
  type CurriculumStoragePayload,
} from "./curriculum-mutations";
import { generateDefaultTopicsForChapter } from "./topic-catalog";

export function useCurriculum(course: Course) {
  const storageKey = `isharp_curriculum_v2_${course.id}`;

  const [subjects, setSubjects] = useState<CurriculumSubject[]>(() => {
    const parsed = loadCachedCurriculum(storageKey);
    if (parsed?.subjects?.length) return parsed.subjects;
    return buildInitialSubjects(course);
  });

  const [chaptersBySubject, setChaptersBySubject] = useState<
    Record<string, CurriculumChapter[]>
  >(() => {
    const parsed = loadCachedCurriculum(storageKey);
    if (parsed?.chapters && Object.keys(parsed.chapters).length > 0) {
      return parsed.chapters;
    }
    return buildInitialChaptersMap(course);
  });

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    const parsed = loadCachedCurriculum(storageKey);
    if (parsed?.selectedSubjectId) return parsed.selectedSubjectId;
    return course.courseSubjects[0]?.subject.id || "";
  });

  const validSelectedSubjectId =
    subjects.length > 0 && !subjects.some((s) => s.id === selectedSubjectId)
      ? subjects[0].id
      : selectedSubjectId;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const payload: CurriculumStoragePayload = {
        subjects,
        chapters: chaptersBySubject,
        selectedSubjectId: validSelectedSubjectId,
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // Ignore quota errors
    }
  }, [subjects, chaptersBySubject, validSelectedSubjectId, storageKey]);

  const selectedSubject = useMemo(
    () =>
      subjects.find((s) => s.id === selectedSubjectId) || subjects[0] || null,
    [subjects, selectedSubjectId],
  );

  const activeChapters = useMemo(() => {
    if (!selectedSubject) return [];
    return chaptersBySubject[selectedSubject.id] || [];
  }, [selectedSubject, chaptersBySubject]);

  const addSubject = useCallback(
    (data: SubjectFormData) => {
      const newSubjectId = `subj-${Date.now().toString(36)}`;
      const newSubject: CurriculumSubject = {
        id: newSubjectId,
        courseSubjectId: `cs-${Date.now().toString(36)}`,
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
        position: subjects.length + 1,
        isActive: data.isActive ?? true,
        chaptersCount: 0,
      };

      setSubjects((prev) => [...prev, newSubject]);
      setChaptersBySubject((prev) => ({ ...prev, [newSubjectId]: [] }));
      setSelectedSubjectId(newSubjectId);
      return newSubject;
    },
    [subjects.length],
  );

  const editSubject = useCallback(
    (subjectId: string, data: Partial<SubjectFormData>) => {
      setSubjects((prev) =>
        prev.map((sub) =>
          sub.id !== subjectId
            ? sub
            : {
                ...sub,
                name: data.name !== undefined ? data.name.trim() : sub.name,
                code:
                  data.code !== undefined
                    ? data.code.trim().toUpperCase()
                    : sub.code,
                description:
                  data.description !== undefined
                    ? data.description.trim() || null
                    : sub.description,
                isActive:
                  data.isActive !== undefined ? data.isActive : sub.isActive,
              },
        ),
      );
    },
    [],
  );

  const toggleSubjectActive = useCallback((subjectId: string) => {
    setSubjects((prev) =>
      prev.map((sub) =>
        sub.id === subjectId ? { ...sub, isActive: !sub.isActive } : sub,
      ),
    );
  }, []);

  const reorderSubject = useCallback(
    (subjectId: string, direction: "up" | "down") => {
      setSubjects((prev) =>
        reorderItemsWithPosition(prev, subjectId, direction),
      );
    },
    [],
  );

  const deleteSubject = useCallback(
    (subjectId: string) => {
      setSubjects((prev) =>
        prev
          .filter((s) => s.id !== subjectId)
          .map((item, idx) => ({ ...item, position: idx + 1 })),
      );
      setChaptersBySubject((prev) => {
        const copy = { ...prev };
        delete copy[subjectId];
        return copy;
      });
      setSelectedSubjectId((current) => {
        if (current === subjectId) {
          const remaining = subjects.filter((s) => s.id !== subjectId);
          return remaining[0]?.id || "";
        }
        return current;
      });
    },
    [subjects],
  );

  const addChapter = useCallback(
    (subjectId: string, data: ChapterFormData) => {
      const currentList = chaptersBySubject[subjectId] || [];
      const newChapter: CurriculumChapter = {
        id: `ch-${subjectId}-${Date.now().toString(36)}`,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        position: data.position || currentList.length + 1,
        isActive: data.isActive ?? true,
        courseSubjectId: subjectId,
        topics: generateDefaultTopicsForChapter(
          data.title.trim(),
          currentList.length,
        ),
      };

      setChaptersBySubject((prev) => {
        const updatedList = [...(prev[subjectId] || []), newChapter].sort(
          (a, b) => a.position - b.position,
        );
        const nextMap = { ...prev, [subjectId]: updatedList };
        setSubjects((currSubs) => syncSubjectChapterCounts(nextMap, currSubs));
        return nextMap;
      });

      return newChapter;
    },
    [chaptersBySubject],
  );

  const editChapter = useCallback(
    (chapterId: string, data: Partial<ChapterFormData>) => {
      if (!selectedSubject) return;
      const subjectId = selectedSubject.id;
      setChaptersBySubject((prev) => {
        const updatedList = (prev[subjectId] || [])
          .map((ch) =>
            ch.id !== chapterId
              ? ch
              : {
                  ...ch,
                  title: data.title !== undefined ? data.title.trim() : ch.title,
                  description:
                    data.description !== undefined
                      ? data.description.trim() || null
                      : ch.description,
                  position:
                    data.position !== undefined ? data.position : ch.position,
                  isActive:
                    data.isActive !== undefined ? data.isActive : ch.isActive,
                },
          )
          .sort((a, b) => a.position - b.position);
        return { ...prev, [subjectId]: updatedList };
      });
    },
    [selectedSubject],
  );

  const toggleChapterActive = useCallback(
    (chapterId: string) => {
      if (!selectedSubject) return;
      const subjectId = selectedSubject.id;
      setChaptersBySubject((prev) => ({
        ...prev,
        [subjectId]: (prev[subjectId] || []).map((ch) =>
          ch.id === chapterId ? { ...ch, isActive: !ch.isActive } : ch,
        ),
      }));
    },
    [selectedSubject],
  );

  const reorderChapter = useCallback(
    (chapterId: string, direction: "up" | "down") => {
      if (!selectedSubject) return;
      const subjectId = selectedSubject.id;
      setChaptersBySubject((prev) => ({
        ...prev,
        [subjectId]: reorderItemsWithPosition(
          prev[subjectId] || [],
          chapterId,
          direction,
        ),
      }));
    },
    [selectedSubject],
  );

  const deleteChapter = useCallback(
    (chapterId: string) => {
      if (!selectedSubject) return;
      const subjectId = selectedSubject.id;
      setChaptersBySubject((prev) => {
        const renumbered = (prev[subjectId] || [])
          .filter((ch) => ch.id !== chapterId)
          .map((ch, idx) => ({ ...ch, position: idx + 1 }));
        const nextMap = { ...prev, [subjectId]: renumbered };
        setSubjects((currSubs) => syncSubjectChapterCounts(nextMap, currSubs));
        return nextMap;
      });
    },
    [selectedSubject],
  );

  const addTopic = useCallback(
    (chapterId: string, data: TopicFormData) => {
      if (!selectedSubject) return;
      const subjectId = selectedSubject.id;
      setChaptersBySubject((prev) => ({
        ...prev,
        [subjectId]: (prev[subjectId] || []).map((ch) => {
          if (ch.id !== chapterId) return ch;
          const newTopic: CurriculumTopic = {
            id: `topic-${Date.now().toString(36)}`,
            title: data.title.trim(),
            position: data.position || ch.topics.length + 1,
            isCovered: data.isCovered ?? true,
          };
          return { ...ch, topics: [...ch.topics, newTopic] };
        }),
      }));
    },
    [selectedSubject],
  );

  const editTopic = useCallback(
    (chapterId: string, topicId: string, data: Partial<TopicFormData>) => {
      if (!selectedSubject) return;
      const subjectId = selectedSubject.id;
      setChaptersBySubject((prev) => ({
        ...prev,
        [subjectId]: (prev[subjectId] || []).map((ch) =>
          ch.id !== chapterId
            ? ch
            : {
                ...ch,
                topics: ch.topics.map((t) =>
                  t.id !== topicId
                    ? t
                    : {
                        ...t,
                        title:
                          data.title !== undefined
                            ? data.title.trim()
                            : t.title,
                        position:
                          data.position !== undefined
                            ? data.position
                            : t.position,
                        isCovered:
                          data.isCovered !== undefined
                            ? data.isCovered
                            : t.isCovered,
                      },
                ),
              },
        ),
      }));
    },
    [selectedSubject],
  );

  const deleteTopic = useCallback(
    (chapterId: string, topicId: string) => {
      if (!selectedSubject) return;
      const subjectId = selectedSubject.id;
      setChaptersBySubject((prev) => ({
        ...prev,
        [subjectId]: (prev[subjectId] || []).map((ch) =>
          ch.id !== chapterId
            ? ch
            : {
                ...ch,
                topics: ch.topics
                  .filter((t) => t.id !== topicId)
                  .map((t, idx) => ({ ...t, position: idx + 1 })),
              },
        ),
      }));
    },
    [selectedSubject],
  );

  const reorderTopic = useCallback(
    (chapterId: string, topicId: string, direction: "up" | "down") => {
      if (!selectedSubject) return;
      const subjectId = selectedSubject.id;
      setChaptersBySubject((prev) => ({
        ...prev,
        [subjectId]: (prev[subjectId] || []).map((ch) =>
          ch.id !== chapterId
            ? ch
            : {
                ...ch,
                topics: reorderItemsWithPosition(ch.topics, topicId, direction),
              },
        ),
      }));
    },
    [selectedSubject],
  );

  const totalChaptersAcrossAllSubjects = useMemo(
    () =>
      Object.values(chaptersBySubject).reduce(
        (acc, list) => acc + list.length,
        0,
      ),
    [chaptersBySubject],
  );

  return {
    subjects,
    selectedSubject,
    selectedSubjectId: validSelectedSubjectId,
    setSelectedSubjectId,
    activeChapters,
    totalChaptersAcrossAllSubjects,
    addSubject,
    editSubject,
    toggleSubjectActive,
    reorderSubject,
    deleteSubject,
    addChapter,
    editChapter,
    toggleChapterActive,
    reorderChapter,
    deleteChapter,
    addTopic,
    editTopic,
    deleteTopic,
    reorderTopic,
  };
}
