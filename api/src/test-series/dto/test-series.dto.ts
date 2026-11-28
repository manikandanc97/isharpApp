import { AssessmentTestType } from '../../generated/prisma/client.js';
import type { SubjectAllocationInput } from '../question-selection.engine.js';

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  description?: string;
  position?: number;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  position?: number;
  isActive?: boolean;
}

export interface CreateTestSeriesDto {
  title: string;
  slug?: string;
  description?: string;
  categoryId: string;
  academicYear?: string;
  coverImageUrl?: string;
  courseId?: string;
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateTestSeriesDto {
  title?: string;
  slug?: string;
  description?: string;
  categoryId?: string;
  academicYear?: string;
  coverImageUrl?: string;
  courseId?: string;
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

export type ExamPatternMode = 'DEFAULT_NEET' | 'MANUAL';
export type QuestionSelectionMode = 'AUTOMATIC' | 'MANUAL';
export type DurationMode = 'AUTOMATIC' | 'MANUAL';

export interface CreateStandaloneTestDto {
  categoryId: string;
  title: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  scheduledAt?: string | null;
  availableUntil?: string | null;
  examPatternMode?: ExamPatternMode;
  examPatternVersion?: string;
  questionSelectionMode?: QuestionSelectionMode;
  durationMode?: DurationMode;
  durationMinutes?: number;
  totalQuestions?: number;
  correctMarks?: number;
  negativeMarks?: number;
  hasNegativeMarking?: boolean;
  passingMarks?: number | null;
  maxAttempts?: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  showResultsImmediately?: boolean;
  subjectDistribution?: SubjectAllocationInput[];
  questionIds?: string[];
}

export interface UpdateStandaloneTestDto {
  categoryId?: string;
  title?: string;
  description?: string;
  isActive?: boolean;
  scheduledAt?: string | null;
  availableUntil?: string | null;
  examPatternMode?: ExamPatternMode;
  examPatternVersion?: string;
  questionSelectionMode?: QuestionSelectionMode;
  durationMode?: DurationMode;
  durationMinutes?: number;
  totalQuestions?: number;
  correctMarks?: number;
  negativeMarks?: number;
  hasNegativeMarking?: boolean;
  passingMarks?: number | null;
  maxAttempts?: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  showResultsImmediately?: boolean;
  subjectDistribution?: SubjectAllocationInput[];
  questionIds?: string[];
}

export interface DuplicateTestDto {
  mode?: 'COPY_QUESTIONS' | 'REGENERATE_QUESTIONS';
}

export interface GenerateQuestionsDto {
  subjectAllocations: SubjectAllocationInput[];
  excludeQuestionIds?: string[];
}

export interface CreateAssessmentTestDto {
  testSeriesId: string;
  code: string;
  title: string;
  description?: string;
  instructionsEn?: string;
  instructionsTa?: string;
  testType?: AssessmentTestType;
  isActive?: boolean;
  isCancelled?: boolean;
  durationMinutes?: number;
  totalQuestions?: number;
  totalMarks?: number;
  passingMarks?: number;
  hasNegativeMarking?: boolean;
  correctMarks?: number;
  negativeMarks?: number;
  maxAttempts?: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  showResultsImmediately?: boolean;
  isOfflineAvailable?: boolean;
  orderIndex?: number;
  scheduledAt?: string | null;
  availableUntil?: string | null;
}

export interface UpdateAssessmentTestDto {
  code?: string;
  title?: string;
  description?: string;
  instructionsEn?: string;
  instructionsTa?: string;
  testType?: AssessmentTestType;
  isActive?: boolean;
  isCancelled?: boolean;
  durationMinutes?: number;
  totalQuestions?: number;
  totalMarks?: number;
  passingMarks?: number;
  hasNegativeMarking?: boolean;
  correctMarks?: number;
  negativeMarks?: number;
  maxAttempts?: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  showResultsImmediately?: boolean;
  isOfflineAvailable?: boolean;
  orderIndex?: number;
  scheduledAt?: string | null;
  availableUntil?: string | null;
}

export interface SetTestQuestionsDto {
  questions: Array<{
    questionId: string;
    section?: string;
    position?: number;
    correctMarks?: number;
    negativeMarks?: number;
  }>;
}

export interface SetTestBlueprintDto {
  blueprints: Array<{
    subjectCode: string;
    subjectName: string;
    chapterId?: string;
    sectionName?: string;
    totalQuestions: number;
    mandatoryCount: number;
    correctMarks?: number;
    negativeMarks?: number;
    orderIndex?: number;
  }>;
}
