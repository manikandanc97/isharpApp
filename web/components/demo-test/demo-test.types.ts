export type SubjectMode = "ALL" | "PHYSICS" | "CHEMISTRY" | "BIOLOGY";
export type LanguageMode = "en" | "ta";

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
  subject: string;
  subjectCode: string;
  chapterTitle?: string | null;
  difficulty: string;
  textEn: string;
  textTa?: string | null;
  questionImageUrl?: string | null;
  solutionEn?: string | null;
  solutionTa?: string | null;
  correctMarks: number;
  negativeMarks: number;
  options: DemoOption[];
}

export interface DemoTestPackage {
  testId: string;
  title: string;
  code: string;
  instructionsEn: string;
  instructionsTa: string;
  durationMinutes: number;
  totalMarks: number;
  questionCount: number;
  subjects: { name: string; code: string; count: number }[];
  questions: DemoQuestion[];
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

