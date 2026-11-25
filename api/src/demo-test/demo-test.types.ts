export type PoolMode = 'MANUAL' | 'AUTOMATIC' | 'HYBRID';
export type PublishStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';
export type SubjectMode = 'ALL' | 'PHYSICS' | 'CHEMISTRY' | 'BIOLOGY';
export type LanguageMode = 'en' | 'ta';
export type WeightingMode = 'WEIGHTED' | 'EQUAL';

export interface DemoCountOption {
  count: number;
  durationMinutes: number;
  label: string;
}

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

export interface DemoTestConfigurationPayload {
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
  countOptions: DemoCountOption[];
  blueprints: DemoBlueprint[];
  poolMode: PoolMode;
  selectionRules: DemoSelectionRules;
  guestAccessEnabled: boolean;
  showResultsImmediately: boolean;
  showSolutionsAfterSubmit: boolean;
  admissionCtaEnabled: boolean;
  publishStatus: PublishStatus;
  publishedVersionId: string | null;
  publishedAt: string | null;
  hasDraftChanges: boolean;
  selectedQuestionIds?: string[];
}

export const DEFAULT_DEMO_BLUEPRINTS: DemoBlueprint[] = [
  {
    id: 'quick-demo',
    label: 'Quick Demo',
    count: 6,
    durationMinutes: 10,
    maxMarks: 24,
    subjectDistribution: { PHYSICS: 2, CHEMISTRY: 1, BIOLOGY: 3 },
  },
  {
    id: 'standard-demo',
    label: 'Standard Demo',
    count: 9,
    durationMinutes: 15,
    maxMarks: 36,
    subjectDistribution: { PHYSICS: 3, CHEMISTRY: 2, BIOLOGY: 4 },
  },
  {
    id: 'extended-demo',
    label: 'Extended Demo',
    count: 12,
    durationMinutes: 20,
    maxMarks: 48,
    subjectDistribution: { PHYSICS: 3, CHEMISTRY: 3, BIOLOGY: 6 },
  },
];

export const DEFAULT_DEMO_COUNT_OPTIONS: DemoCountOption[] =
  DEFAULT_DEMO_BLUEPRINTS.map((bp) => ({
    count: bp.count,
    durationMinutes: bp.durationMinutes,
    label: bp.label,
  }));

export const DEFAULT_DEMO_SELECTION_RULES: DemoSelectionRules = {
  autoRandomSelection: true,
  visitorRepeatPrevention: true,
  equivalentRepeatPrevention: true,
  globalExposureBalancing: true,
  recentPaperUniqueness: true,
  recentPaperWindow: 25,
  maxPaperOverlapRatio: 0.5,
  shuffleQuestions: true,
  shuffleOptions: true,
  cooldownHours: 24,
  strictNoRepeat: false,
  smartReuseAfterExhaustion: true,
  minUniquePoolSize: 12,
  chapterDiversity: true,
  questionTypeDiversity: true,
  minImageQuestions: 0,
  difficultyDistribution: {
    EASY: 40,
    MEDIUM: 40,
    HARD: 20,
  },
  weightingMode: 'WEIGHTED',
};

export const DEFAULT_DEMO_CONFIG: DemoTestConfigurationPayload = {
  isEnabled: true,
  title: 'Free NEET Demo Test',
  code: 'NEET-DEMO-2026',
  instructionsEn:
    'Standard NTA NEET format. +4 marks for each correct answer, -1 mark for each incorrect answer, and 0 for unattempted questions.',
  instructionsTa:
    'நிலையான NTA NEET தேர்வு முறை. சரியான விடைக்கு +4 மதிப்பெண்கள், தவறான விடைக்கு -1 மதிப்பெண், விடையளிக்காத வினாவுக்கு 0.',
  allowedSubjects: ['ALL', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY'],
  allowedLanguages: ['en', 'ta'],
  defaultSubject: 'ALL',
  defaultLanguage: 'ta',
  defaultQuestionCount: 9,
  countOptions: DEFAULT_DEMO_COUNT_OPTIONS,
  blueprints: DEFAULT_DEMO_BLUEPRINTS,
  poolMode: 'HYBRID',
  selectionRules: DEFAULT_DEMO_SELECTION_RULES,
  guestAccessEnabled: true,
  showResultsImmediately: true,
  showSolutionsAfterSubmit: true,
  admissionCtaEnabled: true,
  publishStatus: 'PUBLISHED',
  publishedVersionId: null,
  publishedAt: null,
  hasDraftChanges: false,
};

export interface ShuffledOptionMapping {
  canonicalOptionId: string;
  shuffledPosition: number;
  displayedLabel: string;
}
