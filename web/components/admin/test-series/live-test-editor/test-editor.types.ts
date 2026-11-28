import type {
  CategoryTestItem,
  DurationMode,
  ExamPatternConfigResponse,
  ExamPatternMode,
  QuestionSelectionMode,
  SubjectAllocationItem,
  TestSeriesCategory,
} from "../types";

export type EditorMode = "empty" | "create" | "edit";
export type EditorTab = "details" | "subjects" | "questions" | "settings";

export interface LiveTestEditorHandle {
  save: () => Promise<boolean>;
  discard: () => void;
}

export interface LiveTestEditorProps {
  mode: EditorMode;
  selectedTest: CategoryTestItem | null;
  categories: TestSeriesCategory[];
  selectedCategoryId: string | null;
  examConfig: ExamPatternConfigResponse | null;
  inDialog?: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onCancelCreate: () => void;
  onClose?: () => void;
  onCreateTestClick: () => void;
  onSaved: (savedId: string, wasCreate: boolean, message: string) => Promise<void>;
  onError: (message: string) => void;
}

export interface EditorFormState {
  title: string;
  categoryId: string;
  description: string;
  isActive: boolean;
  showScheduling: boolean;
  scheduledAt: string;
  availableUntil: string;
  examPatternMode: ExamPatternMode;
  questionSelectionMode: QuestionSelectionMode;
  durationMode: DurationMode;
  manualDuration: number;
  correctMarks: number;
  negativeMarks: number;
  hasNegativeMarking: boolean;
  randomizeQuestions: boolean;
  maxAttempts: number;
  subjectAllocations: SubjectAllocationItem[];
  questionIds: string[];
}
