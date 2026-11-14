export type Option = {
  label: string;
  textEn: string | null;
  textTa: string | null;
  imageUrl: string | null;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  externalId: string;
  type: string;
  language: string;
  difficulty: string;
  textEn: string | null;
  textTa: string | null;
  questionImageUrl: string | null;
  solutionEn: string | null;
  solutionTa: string | null;
  solutionImageUrl: string | null;
  numericalAnswer: string | null;
  source: string | null;
  correctMarks: number;
  negativeMarks: number;
  options: Option[];
  courseSubject: {
    course: { code: string };
    subject: { code: string; name: string };
  };
  chapter: { title: string } | null;
};

export type MockTest = {
  id: string;
  code: string;
  title: string;
  durationMinutes: number;
  totalMarks: number;
  status: string;
  _count: { questions: number };
};

export type Draft = {
  externalId: string;
  courseCode: string;
  subjectCode: string;
  chapterTitle: string;
  type: string;
  language: string;
  difficulty: string;
  textEn: string;
  textTa: string;
  questionImageUrl: string;
  solutionEn: string;
  solutionTa: string;
  solutionImageUrl: string;
  numericalAnswer: string;
  source: string;
  options: {
    label: string;
    textEn: string;
    textTa: string;
    imageUrl: string;
    isCorrect: boolean;
  }[];
};

export type ImportRowResult = {
  row: number;
  externalId?: string;
  status: "imported" | "skipped" | "failed";
  reason?: string;
  error?: string;
};

export type ImportReport = {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  results: ImportRowResult[];
};

export const emptyDraft = (): Draft => ({
  externalId: `NEET-${Date.now().toString().slice(-8)}`,
  courseCode: "",
  subjectCode: "",
  chapterTitle: "",
  type: "SINGLE_CORRECT",
  language: "BILINGUAL",
  difficulty: "MEDIUM",
  textEn: "",
  textTa: "",
  questionImageUrl: "",
  solutionEn: "",
  solutionTa: "",
  solutionImageUrl: "",
  numericalAnswer: "",
  source: "",
  options: ["1", "2", "3", "4"].map((label) => ({
    label,
    textEn: "",
    textTa: "",
    imageUrl: "",
    isCorrect: label === "1",
  })),
});

