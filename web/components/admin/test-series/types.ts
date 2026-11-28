export type ExamPatternMode = "DEFAULT_NEET" | "MANUAL";
export type QuestionSelectionMode = "AUTOMATIC" | "MANUAL";
export type DurationMode = "AUTOMATIC" | "MANUAL";

export type TestSeriesCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  position: number;
  isActive: boolean;
  testCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type SubjectSummaryItem = {
  subjectCode: string;
  subjectName: string;
  count: number;
};

export type CategoryTestItem = {
  id: string;
  testSeriesId: string;
  categoryId: string | null;
  categoryName: string;
  code: string;
  title: string;
  description: string | null;
  isActive: boolean;
  examPatternMode: ExamPatternMode;
  examPatternVersion: string;
  questionSelectionMode: QuestionSelectionMode;
  durationMode: DurationMode;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  correctMarks: number;
  negativeMarks: number;
  hasNegativeMarking: boolean;
  scheduledAt: string | null;
  availableUntil: string | null;
  assignedQuestionCount: number;
  attemptCount: number;
  resultCount: number;
  subjectsSummary: SubjectSummaryItem[];
  configurationWarnings?: string[];
  isConfigurationValid?: boolean;
  randomizeQuestions?: boolean;
  maxAttempts?: number;
  createdAt: string;
  updatedAt: string;
};

export type ChapterAvailability = {
  id: string;
  title: string;
  position: number;
  availableQuestions: number;
};

export type SubjectWithChapters = {
  courseSubjectId: string;
  courseId: string;
  courseCode: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  availableQuestions: number;
  chapters: ChapterAvailability[];
};

export type ExamPatternConfigResponse = {
  defaultPattern: {
    version: string;
    name: string;
    totalQuestions: number;
    durationMinutes: number;
    correctMarks: number;
    negativeMarks: number;
    unansweredMarks: number;
    maxMarks: number;
    defaultQuestionType: string;
    allCompulsory: boolean;
    resolvedSubjects: Array<{
      subjectId: string;
      subjectCode: string;
      subjectName: string;
      questionCount: number;
      maxMarks: number;
      courseSubjectId: string | null;
      availableQuestions: number;
    }>;
  };
  subjects: SubjectWithChapters[];
};

export type ChapterAllocationItem = {
  chapterId: string;
  count: number;
};

export type SubjectAllocationItem = {
  courseSubjectId: string;
  subjectCode: string;
  subjectName: string;
  enabled: boolean;
  chapterMode: "ALL" | "SELECTED";
  chapterAllocationMode: "AUTOMATIC" | "MANUAL";
  questionCount: number;
  chapterIds: string[];
  chapterAllocations: ChapterAllocationItem[];
};

export type QuestionShortageDetail = {
  subjectCode: string;
  subjectName: string;
  chapterId?: string;
  chapterTitle?: string;
  required: number;
  available: number;
  shortage: number;
};

export type SelectedQuestionItem = {
  id: string;
  externalId: string;
  courseSubjectId: string;
  subjectCode: string;
  subjectName: string;
  chapterId: string | null;
  chapterTitle: string | null;
  type: string;
  difficulty: string;
  textEn: string | null;
  textTa: string | null;
  questionImageUrl: string | null;
  solutionEn: string | null;
  solutionTa: string | null;
  solutionImageUrl: string | null;
  correctMarks: number;
  negativeMarks: number;
  options: Array<{
    id: string;
    label: string;
    textEn: string | null;
    textTa: string | null;
    imageUrl: string | null;
    isCorrect: boolean;
    position: number;
  }>;
};

// Legacy compatibility types (for existing store/tests)
export type TestType =
  | "CHAPTER_WISE"
  | "SUBJECT_WISE"
  | "UNIT_TEST"
  | "PART_TEST"
  | "REVISION_TEST"
  | "FULL_SYLLABUS"
  | "GRAND_TEST"
  | "CUSTOM_TEST";

export type DerivedTestLifecycleStatus =
  | "UPCOMING"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED"
  | "INACTIVE";

export type TestBlueprintItem = {
  id?: string;
  subjectCode: string;
  subjectName: string;
  chapterId?: string | null;
  sectionName?: string;
  totalQuestions: number;
  mandatoryCount: number;
  correctMarks?: number;
  negativeMarks?: number;
  orderIndex?: number;
};

export type IndividualTest = {
  id: string;
  testSeriesId: string;
  name: string;
  title?: string;
  code: string;
  description?: string | null;
  instructions?: string | null;
  instructionsTa?: string | null;
  testType: TestType;
  testDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  passingMarks?: number | null;
  negativeMarking: boolean;
  correctMarks?: number;
  negativeMarks?: number;
  maxAttempts: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  showResultsImmediately?: boolean;
  isOfflineAvailable?: boolean;
  isActive: boolean;
  isCancelled?: boolean;
  lifecycleStatus?: DerivedTestLifecycleStatus;
  orderIndex: number;
  questionIds?: string[];
  questionCount?: number;
  attemptCount?: number;
  blueprints?: TestBlueprintItem[];
  scheduledAt?: string | null;
  availableUntil?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TestSeries = {
  id: string;
  name: string;
  title?: string;
  slug?: string;
  description: string | null;
  categoryId: string;
  categoryName?: string;
  coverImage?: string | null;
  academicYear: string;
  courseId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  totalTests: number;
  totalMarks: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tests?: IndividualTest[];
};

export type TestSeriesOverviewStats = {
  totalSeries: number;
  totalTests: number;
  upcomingTests: number;
  completedTests: number;
};
