export interface PoolQuestionItem {
  id: string;
  externalId: string;
  textPreview: string;
  subject: string;
  subjectCode: string;
  chapterTitle: string | null;
  difficulty: string;
  type: string;
  languageAvailability: "BILINGUAL" | "ENGLISH" | "INCOMPLETE";
  hasQuestionImage: boolean;
  hasOptionImages: boolean;
  isActive: boolean;
  isRestrictedForDemo: boolean;
  isApproved: boolean;
  isDemoEligible: boolean;
  eligibilityIssues: string[];
  globalExposureCount: number;
  lastUsedAt: string | null;
}

export interface PoolListResponse {
  items: PoolQuestionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DemoPoolHealth {
  totalQuestionBank: number;
  approvedPoolCount: number;
  eligibleUniqueCount: number;
  bySubject: { PHYSICS: number; CHEMISTRY: number; BIOLOGY: number };
  byDifficulty: { EASY: number; MEDIUM: number; HARD: number };
  byType: Record<string, number>;
  englishReady: number;
  bilingualReady: number;
  imageBased: number;
  invalidOrDuplicate: number;
  estimatedFreshAttemptsPerVisitor: number;
  exhaustionRisk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  frequentlyExposedCount: number;
  warnings: string[];
  poolMode: string;
  publishStatus: string;
}

export interface DemoAnalyticsData {
  totalVisitors: number;
  uniqueVisitors: number;
  totalAttempts: number;
  completedAttempts: number;
  abandonedAttempts: number;
  completionRate: number;
  averageScore: number;
  averageCompletionSeconds: number;
  repeatVisitorRate: number;
  repeatAttempts: number;
  uniqueQuestionsDelivered: number;
  controlledReuseCount: number;
  controlledReuseRate: number;
  poolExhaustionEvents: number;
  identicalPaperRate: number;
  averagePaperOverlap: number;
  ctaConversions: number;
  subjectPopularity: Record<string, number>;
  languagePopularity: Record<string, number>;
  blueprintPopularity: Record<string, number>;
}

export interface DemoConfigVersion {
  id: string;
  versionNumber: number;
  status: string;
  changeSummary: string | null;
  createdAt: string;
  snapshot: Record<string, unknown>;
}
