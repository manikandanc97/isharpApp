"use client";

import { useMemo, useState } from "react";
import { demoQuestions } from "./demo-questions";
import type { Question } from "./types";

export type SubjectFilter = "PHYSICS" | "CHEMISTRY" | "BIOLOGY";

export interface UseQuestionBankFiltersOptions {
  questions: Question[];
  busy?: boolean;
  initialSubject?: SubjectFilter;
  initialTab?: "bank" | "tests";
}

export function useQuestionBankFilters({
  questions,
  busy = false,
  initialSubject = "PHYSICS",
  initialTab = "bank",
}: UseQuestionBankFiltersOptions) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"bank" | "tests">(initialTab);
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>(initialSubject);
  const [chapterFilter, setChapterFilter] = useState<string>("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [languageFilter, setLanguageFilter] = useState<string>("ALL");

  // Dynamic available chapters based on current subject
  const availableChapters = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (
        q.courseSubject.subject.code === subjectFilter &&
        q.chapter?.title
      ) {
        set.add(q.chapter.title);
      }
    });
    return Array.from(set).sort();
  }, [questions, subjectFilter]);

  const visible = useMemo(() => {
    const value = query.toLowerCase();
    return questions.filter((item) => {
      if (item.courseSubject.subject.code !== subjectFilter) {
        return false;
      }
      if (chapterFilter !== "ALL" && item.chapter?.title !== chapterFilter) {
        return false;
      }
      if (difficultyFilter !== "ALL" && item.difficulty !== difficultyFilter) {
        return false;
      }
      if (typeFilter !== "ALL" && item.type !== typeFilter) {
        return false;
      }
      if (languageFilter !== "ALL" && item.language !== languageFilter) {
        return false;
      }
      if (value) {
        const matches =
          item.externalId.toLowerCase().includes(value) ||
          item.textEn?.toLowerCase().includes(value) ||
          item.textTa?.toLowerCase().includes(value) ||
          (item.chapter?.title && item.chapter.title.toLowerCase().includes(value));
        if (!matches) return false;
      }
      return true;
    });
  }, [questions, query, subjectFilter, chapterFilter, difficultyFilter, typeFilter, languageFilter]);

  const subjectCounts = useMemo(() => ({
    PHYSICS: questions.filter(
      (item) => item.courseSubject.subject.code === "PHYSICS",
    ).length,
    CHEMISTRY: questions.filter(
      (item) => item.courseSubject.subject.code === "CHEMISTRY",
    ).length,
    BIOLOGY: questions.filter(
      (item) => item.courseSubject.subject.code === "BIOLOGY",
    ).length,
  }), [questions]);

  const showingExamples =
    !busy && !query.trim() && subjectCounts[subjectFilter] === 0;

  const libraryQuestions = showingExamples
    ? demoQuestions.filter(
        (item) => item.courseSubject.subject.code === subjectFilter,
      )
    : visible;

  return {
    query,
    setQuery,
    tab,
    setTab,
    subjectFilter,
    setSubjectFilter,
    chapterFilter,
    setChapterFilter,
    difficultyFilter,
    setDifficultyFilter,
    typeFilter,
    setTypeFilter,
    languageFilter,
    setLanguageFilter,
    availableChapters,
    visible,
    subjectCounts,
    showingExamples,
    libraryQuestions,
  };
}
