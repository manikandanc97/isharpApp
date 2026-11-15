import { useMemo, useState } from "react";
import type { StudentPortalData } from "../student-types";
import { extractUniqueSubjects, filterDppQuestions } from "./student-dpp-utils";

export interface UseStudentDppFiltersOptions {
  questions: StudentPortalData["recentQuestions"];
  courses: StudentPortalData["courses"];
  initialSubjectFilter?: string;
}

export function useStudentDppFilters({
  questions,
  courses,
  initialSubjectFilter,
}: UseStudentDppFiltersOptions) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>(
    initialSubjectFilter ?? "ALL"
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  // Collect available subjects across courses
  const allSubjects = useMemo(() => {
    return extractUniqueSubjects(courses);
  }, [courses]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return filterDppQuestions(questions, {
      searchQuery,
      selectedSubject,
      selectedDifficulty,
      selectedType,
    });
  }, [questions, searchQuery, selectedSubject, selectedDifficulty, selectedType]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedSubject("ALL");
    setSelectedDifficulty("ALL");
    setSelectedType("ALL");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedSubject !== "ALL" ||
    selectedDifficulty !== "ALL" ||
    selectedType !== "ALL";

  return {
    searchQuery,
    setSearchQuery,
    selectedSubject,
    setSelectedSubject,
    selectedDifficulty,
    setSelectedDifficulty,
    selectedType,
    setSelectedType,
    allSubjects,
    filteredQuestions,
    hasActiveFilters,
    resetFilters,
  };
}
