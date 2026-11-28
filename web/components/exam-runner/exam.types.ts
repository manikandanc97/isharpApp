export type LanguageMode = "en" | "ta";

export interface ExamOption {
  id: string;
  label: string;
  position: number;
  textEn: string;
  textTa?: string | null;
  imageUrl?: string | null;
}

export interface ExamQuestion {
  id: string;
  position: number;
  section: string;
  subject: string;
  subjectCode: string;
  chapterTitle?: string | null;
  difficulty: string;
  type: string;
  textEn: string;
  textTa?: string | null;
  questionImageUrl?: string | null;
  correctMarks: number;
  negativeMarks: number;
  options: ExamOption[];
  savedAnswer?: {
    selectedOptionId?: string | null;
    numericalAnswer?: string | null;
    isMarkedForReview?: boolean;
    isVisited?: boolean;
    timeSpentSeconds?: number;
  } | null;
}

export interface ExamSubject {
  name: string;
  code: string;
  count: number;
}

export interface SanitizedAttemptPayload {
  attemptId: string;
  testId: string;
  title: string;
  code: string;
  instructionsEn?: string | null;
  instructionsTa?: string | null;
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  startedAt: string;
  expiresAt: string;
  secondsRemaining: number;
  subjects: ExamSubject[];
  questions: ExamQuestion[];
}

export type QuestionStatus =
  | "not_visited"
  | "unanswered"
  | "answered"
  | "marked_for_review"
  | "answered_and_marked";

export interface StudentAnswerState {
  questionId: string;
  selectedOptionId?: string;
  numericalAnswer?: string;
  markedForReview: boolean;
  visited: boolean;
  timeSpentSeconds: number;
}

export interface ExamResultReviewItem {
  position: number;
  questionId: string;
  textEn: string;
  textTa?: string | null;
  questionImageUrl?: string | null;
  solutionEn?: string | null;
  solutionTa?: string | null;
  solutionImageUrl?: string | null;
  options: Array<{
    id: string;
    label: string;
    textEn: string;
    textTa?: string | null;
    imageUrl?: string | null;
    isCorrect: boolean;
  }>;
  selectedOptionId?: string | null;
  isCorrect: boolean;
  marksAwarded: number;
}

export interface ExamResultPayload {
  attemptId: string;
  test: {
    id: string;
    title: string;
    code: string;
    showResultsImmediately: boolean;
    totalMarks: number;
    passingMarks?: number | null;
  };
  score: number;
  maxMarks: number;
  percentage: number;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  physicsScore?: number;
  chemistryScore?: number;
  biologyScore?: number;
  botanyScore?: number;
  zoologyScore?: number;
  subjectBreakdown?: Record<string, unknown> | null;
  calculatedAt: string;
  review?: ExamResultReviewItem[] | null;
}
