import type { LanguageMode, StudentPortalData } from "../student-types";
import { StudentDppEmptyState } from "./student-dpp-empty-state";
import { CardLanguage, StudentDppQuestionCard } from "./student-dpp-question-card";

export interface StudentDppListProps {
  questions: StudentPortalData["recentQuestions"];
  totalCount: number;
  globalLanguage: LanguageMode;
  practicedMap: Record<string, boolean>;
  bookmarkedMap: Record<string, boolean>;
  expandedSolutions: Record<string, boolean>;
  cardLangMap: Record<string, CardLanguage>;
  copiedId: string | null;
  onTogglePracticed: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onToggleSolution: (id: string) => void;
  onCardLangChange: (id: string, lang: CardLanguage) => void;
  onCopyId: (id: string) => void;
  onResetFilters: () => void;
}

export function StudentDppList({
  questions,
  totalCount,
  globalLanguage,
  practicedMap,
  bookmarkedMap,
  expandedSolutions,
  cardLangMap,
  copiedId,
  onTogglePracticed,
  onToggleBookmark,
  onToggleSolution,
  onCardLangChange,
  onCopyId,
  onResetFilters,
}: StudentDppListProps) {
  if (!questions.length) {
    return <StudentDppEmptyState onResetFilters={onResetFilters} />;
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
        <span>
          Showing {questions.length} of {totalCount} Questions
        </span>
        <span className="text-3xs uppercase tracking-wider text-slate-400">
          NEET / JEE Pattern
        </span>
      </div>

      {/* Questions Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {questions.map((question) => (
          <StudentDppQuestionCard
            key={question.id}
            question={question}
            globalLanguage={globalLanguage}
            isPracticed={!!practicedMap[question.id]}
            isBookmarked={!!bookmarkedMap[question.id]}
            isSolutionOpen={!!expandedSolutions[question.id]}
            cardLang={cardLangMap[question.id]}
            isCopied={copiedId === question.externalId}
            onTogglePracticed={onTogglePracticed}
            onToggleBookmark={onToggleBookmark}
            onToggleSolution={onToggleSolution}
            onCardLangChange={onCardLangChange}
            onCopyId={onCopyId}
          />
        ))}
      </div>
    </div>
  );
}
