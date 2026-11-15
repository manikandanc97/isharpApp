"use client";

import { useState } from "react";
import type { LanguageMode, StudentPortalData } from "./student-types";
import { StudentDppFilterBar } from "./tabs/student-dpp-filter-bar";
import { StudentDppList } from "./tabs/student-dpp-list";
import { CardLanguage } from "./tabs/student-dpp-question-card";
import { useStudentDppFilters } from "./tabs/use-student-dpp-filters";

export { StudentDppEmptyState } from "./tabs/student-dpp-empty-state";
export { StudentDppFilterBar } from "./tabs/student-dpp-filter-bar";
export { StudentDppList } from "./tabs/student-dpp-list";
export { StudentDppQuestionCard } from "./tabs/student-dpp-question-card";
export { useStudentDppFilters } from "./tabs/use-student-dpp-filters";

interface StudentDppTabProps {
  data: StudentPortalData;
  globalLanguage: LanguageMode;
  initialSubjectFilter?: string;
}

export function StudentDppTab({
  data,
  globalLanguage,
  initialSubjectFilter,
}: StudentDppTabProps) {
  const {
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
  } = useStudentDppFilters({
    questions: data.recentQuestions,
    courses: data.courses,
    initialSubjectFilter,
  });

  // Local interactive states for student engagement
  const [practicedMap, setPracticedMap] = useState<Record<string, boolean>>({});
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});
  const [cardLangMap, setCardLangMap] = useState<Record<string, CardLanguage>>({});
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const practicedCount = Object.values(practicedMap).filter(Boolean).length;

  const togglePracticed = (id: string) => {
    setPracticedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSolution = (id: string) => {
    setExpandedSolutions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCardLangChange = (id: string, lang: CardLanguage) => {
    setCardLangMap((prev) => ({ ...prev, [id]: lang }));
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6">
      <StudentDppFilterBar
        practicedCount={practicedCount}
        totalQuestions={data.recentQuestions.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSubject={selectedSubject}
        onSubjectChange={setSelectedSubject}
        allSubjects={allSubjects}
        selectedDifficulty={selectedDifficulty}
        onDifficultyChange={setSelectedDifficulty}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
      />

      <StudentDppList
        questions={filteredQuestions}
        totalCount={data.recentQuestions.length}
        globalLanguage={globalLanguage}
        practicedMap={practicedMap}
        bookmarkedMap={bookmarkedMap}
        expandedSolutions={expandedSolutions}
        cardLangMap={cardLangMap}
        copiedId={copiedId}
        onTogglePracticed={togglePracticed}
        onToggleBookmark={toggleBookmark}
        onToggleSolution={toggleSolution}
        onCardLangChange={handleCardLangChange}
        onCopyId={handleCopyId}
        onResetFilters={resetFilters}
      />
    </div>
  );
}
