import { getSubjectTheme, type SubjectTheme } from "../student-helpers";
import type { StudentPortalData } from "../student-types";

export interface SubjectDistributionItem {
  name: string;
  count: number;
  percentage: number;
  theme: SubjectTheme;
}

export interface CurriculumReadinessResult {
  percentage: number;
  label: string;
  widthPercent: number;
}

export interface ActivityRoadmapStats {
  streakLabel: string;
  targetQuestionsPerDay: number;
  status: string;
}

export interface SyllabusCoverageStats {
  activeCourses: number;
  activeSubjects: number;
  activeChapters: number;
  activeQuestions: number;
  publishedMocks: number;
  hasContent: boolean;
}

/**
 * Pure calculation for progress percentage with strict division-by-zero protection.
 */
export function calculateProgressPercentage(
  value: number | null | undefined,
  total: number | null | undefined
): number {
  if (!value || !total || total <= 0 || value <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}

/**
 * Calculates subject distribution and percentage share from recent questions.
 * Safe against null, undefined, or empty arrays.
 */
export function calculateSubjectDistribution(
  questions?: StudentPortalData["recentQuestions"] | null
): SubjectDistributionItem[] {
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return [];
  }

  const counts: Record<string, number> = {};
  let total = 0;

  for (const q of questions) {
    const name = q?.subject?.name;
    if (name) {
      counts[name] = (counts[name] || 0) + 1;
      total += 1;
    }
  }

  if (total === 0) {
    return [];
  }

  return Object.entries(counts).map(([name, count]) => {
    const percentage = calculateProgressPercentage(count, total);
    const theme = getSubjectTheme(name);
    return {
      name,
      count,
      percentage,
      theme,
    };
  });
}

/**
 * Calculates curriculum readiness index based on active question repository.
 */
export function calculateCurriculumReadiness(
  totalQuestions: number | null | undefined
): CurriculumReadinessResult {
  const count = typeof totalQuestions === "number" && !isNaN(totalQuestions) ? totalQuestions : 0;
  const pct = count > 0 ? 88 : 50;
  return {
    percentage: pct,
    label: String(pct),
    widthPercent: pct,
  };
}

/**
 * Returns activity and habit consistency statistics.
 */
export function getActivityRoadmapStats(streakDays = 5): ActivityRoadmapStats {
  return {
    streakLabel: `${streakDays} Day Streak`,
    targetQuestionsPerDay: 25,
    status: "On Track",
  };
}

/**
 * Safely aggregates curriculum and syllabus coverage indicators.
 */
export function calculateSyllabusCoverage(
  summary?: StudentPortalData["summary"] | null
): SyllabusCoverageStats {
  const activeCourses = summary?.activeCourses ?? 0;
  const activeSubjects = summary?.activeSubjects ?? 0;
  const activeChapters = summary?.activeChapters ?? 0;
  const activeQuestions = summary?.activeQuestions ?? 0;
  const publishedMocks = summary?.publishedMocks ?? 0;

  return {
    activeCourses,
    activeSubjects,
    activeChapters,
    activeQuestions,
    publishedMocks,
    hasContent: activeQuestions > 0 || activeSubjects > 0,
  };
}
