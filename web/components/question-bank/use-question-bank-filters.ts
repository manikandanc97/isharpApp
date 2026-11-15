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

  const visible = useMemo(() => {
    const value = query.toLowerCase();
    return questions.filter(
      (item) =>
        item.courseSubject.subject.code === subjectFilter &&
        (!value ||
          item.externalId.toLowerCase().includes(value) ||
          item.textEn?.toLowerCase().includes(value) ||
          item.textTa?.toLowerCase().includes(value)),
    );
  }, [questions, query, subjectFilter]);

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
    visible,
    subjectCounts,
    showingExamples,
    libraryQuestions,
  };
}
