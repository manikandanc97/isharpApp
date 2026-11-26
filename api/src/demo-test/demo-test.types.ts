export type PoolMode = 'MANUAL' | 'AUTOMATIC' | 'HYBRID';
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
  examCategory: string;
  title: string;
  code: string;
  instructionsEn: string;
  instructionsTa: string;
  allowedSubjects: SubjectMode[];
  allowedLanguages: LanguageMode[];
  defaultSubject: SubjectMode;
  defaultLanguage: LanguageMode;
  defaultQuestionCount: number;
  defaultDurationMinutes: number;
  countOptions: DemoCountOption[];
  blueprints: DemoBlueprint[];
  poolMode: PoolMode;
  selectionRules: DemoSelectionRules;
  guestAccessEnabled: boolean;
  showResultsImmediately: boolean;
  showSolutionsAfterSubmit: boolean;
  admissionCtaEnabled: boolean;
  selectedQuestionIds?: string[];
}

export const DEFAULT_DEMO_BLUEPRINTS: DemoBlueprint[] = [
  {
    id: 'default-demo',
    label: 'Free NEET Demo Test',
    count: 15,
    durationMinutes: 20,
    maxMarks: 60,
    subjectDistribution: { PHYSICS: 5, CHEMISTRY: 5, BIOLOGY: 5 },
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
  examCategory: 'NEET',
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
  defaultQuestionCount: 15,
  defaultDurationMinutes: 20,
  countOptions: DEFAULT_DEMO_COUNT_OPTIONS,
  blueprints: DEFAULT_DEMO_BLUEPRINTS,
  poolMode: 'AUTOMATIC',
  selectionRules: DEFAULT_DEMO_SELECTION_RULES,
  guestAccessEnabled: true,
  showResultsImmediately: true,
  showSolutionsAfterSubmit: true,
  admissionCtaEnabled: true,
};

export interface ShuffledOptionMapping {
  canonicalOptionId: string;
  shuffledPosition: number;
  displayedLabel: string;
}
