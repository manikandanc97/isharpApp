export type SubjectMode = "ALL" | "PHYSICS" | "CHEMISTRY" | "BIOLOGY";
export type LanguageMode = "en" | "ta";
export type PoolMode = "MANUAL" | "AUTOMATIC" | "HYBRID";
export type PublishStatus = "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
export type WeightingMode = "WEIGHTED" | "EQUAL";

export interface DemoBlueprint {
  id: string;
  label: string;
  count: number;
  durationMinutes: number;
  maxMarks: number;
  subjectDistribution: {
    PHYSICS: number;
    CHEMISTRY: number;
    BIOLOGY: number;
  };
}

export interface DemoSelectionRules {
  autoRandomSelection: boolean;
  visitorRepeatPrevention: boolean;
  equivalentRepeatPrevention: boolean;
  globalExposureBalancing: boolean;
  recentPaperUniqueness: boolean;
  recentPaperWindow: number;
  maxPaperOverlapRatio: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  cooldownHours: number;
  strictNoRepeat: boolean;
  smartReuseAfterExhaustion: boolean;
  minUniquePoolSize: number;
  chapterDiversity: boolean;
  questionTypeDiversity: boolean;
  minImageQuestions: number;
  difficultyDistribution: {
    EASY: number;
    MEDIUM: number;
    HARD: number;
  };
  weightingMode: WeightingMode;
}

export interface DemoTestConfiguration {
  isEnabled: boolean;
  title: string;
  code: string;
  instructionsEn: string;
  instructionsTa: string;
  allowedSubjects: SubjectMode[];
  allowedLanguages: LanguageMode[];
  defaultSubject: SubjectMode;
  defaultLanguage: LanguageMode;
  defaultQuestionCount: number;
  countOptions: { count: number; durationMinutes: number; label: string }[];
  blueprints?: DemoBlueprint[];
  poolMode?: PoolMode;
  selectionRules?: DemoSelectionRules;
  guestAccessEnabled?: boolean;
  showResultsImmediately?: boolean;
  showSolutionsAfterSubmit?: boolean;
  admissionCtaEnabled?: boolean;
  publishStatus?: PublishStatus;
  publishedVersionId?: string | null;
  publishedAt?: string | null;
  hasDraftChanges?: boolean;
  selectedQuestionIds?: string[];
}

export interface DemoOption {
  id: string;
  label: string;
  textEn: string;
  textTa?: string | null;
  imageUrl?: string | null;
  isCorrect: boolean;
  position: number;
}

export interface DemoQuestion {
  id: string;
  externalId: string;
  type?: string;
  subject: string;
  subjectCode: string;
  chapterTitle?: string | null;
  difficulty: string;
  textEn: string;
  textTa?: string | null;
  questionImageUrl?: string | null;
  solutionEn?: string | null;
  solutionTa?: string | null;
  solutionImageUrl?: string | null;
  correctMarks: number;
  negativeMarks: number;
  options: DemoOption[];
  savedState?: {
    selectedOptionId?: string | null;
    numericalAnswer?: string | null;
    isMarkedForReview?: boolean;
    isVisited?: boolean;
    timeSpentSeconds?: number;
  };
}

export interface DemoTestPackage {
  attemptId?: string;
  testId: string;
  status?: string;
  title: string;
  code: string;
  instructionsEn: string;
  instructionsTa: string;
  durationMinutes: number;
  remainingSeconds?: number;
  totalMarks: number;
  questionCount: number;
  controlledReuseUsed?: boolean;
  subjects: { name: string; code: string; count: number }[];
  questions: DemoQuestion[];
  result?: ScorecardReport;
}

export type QuestionStatus =
  | 'not_visited'
  | 'unanswered'
  | 'answered'
  | 'marked_for_review'
  | 'answered_and_marked';

export interface UserAnswerRecord {
  questionId: string;
  selectedOptionId?: string;
  markedForReview: boolean;
  visited: boolean;
  timeSpentSeconds: number;
}

export interface SubjectStat {
  subjectName: string;
  subjectCode: string;
  total: number;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  marksObtained: number;
  maxMarks: number;
  accuracy: number;
  timeSpentSeconds?: number;
  avgTimeSeconds?: number;
}

export interface TimeAnalytics {
  avgTimePerQuestion: number;
  avgTimeCorrect: number;
  avgTimeWrong: number;
  avgTimeSkipped: number;
  fastestQuestion?: { questionId: string; index: number; seconds: number; isCorrect: boolean };
  slowestQuestion?: { questionId: string; index: number; seconds: number; isCorrect: boolean };
  paceCategory: "OPTIMAL" | "SPEEDY" | "OVERTIME";
  paceMessage: string;
}

export interface ScorecardReport {
  testId: string;
  totalQuestions: number;
  attempted: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  totalScore: number;
  maxScore: number;
  percentage: number;
  accuracy: number;
  totalTimeSpentSeconds: number;
  subjectStats: SubjectStat[];
  timeAnalytics?: TimeAnalytics;
}

/**
 * In official NTA NEET examinations, multiple-choice question options are
 * strictly numbered as 1, 2, 3, 4 (or (1), (2), (3), (4)) instead of letters A, B, C, D.
 */
export function getNeetOptionLabel(label?: string | number | null, index?: number): string {
  if (label !== undefined && label !== null) {
    const trimmed = String(label).trim().toUpperCase();
    if (trimmed === "A" || trimmed === "1") return "1";
    if (trimmed === "B" || trimmed === "2") return "2";
    if (trimmed === "C" || trimmed === "3") return "3";
    if (trimmed === "D" || trimmed === "4") return "4";
    if (/^[0-9]+$/.test(trimmed)) return trimmed;
  }
  return typeof index === "number" ? String(index + 1) : "1";
}


