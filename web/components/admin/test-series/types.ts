export type TestSeriesCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

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
