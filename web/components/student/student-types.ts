import type { AuthenticatedSession } from "@/lib/auth-session";

export type TabId = "overview" | "dpp" | "mocks" | "subjects" | "analytics";
export type LanguageMode = "bilingual" | "en" | "ta";

export type StudentPortalData = {
  session: AuthenticatedSession;
  student: {
    profileId: string;
    displayName: string;
    email: string | null;
    studentId: string;
    category: "INTERNAL" | "EXTERNAL";
    paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
    paidAccessUntil: string | null;
  };
  summary: {
    activeCourses: number;
    activeSubjects: number;
    activeChapters: number;
    activeQuestions: number;
    publishedMocks: number;
  };
  courses: Array<{
    id: string;
    code: string;
    title: string;
    description: string | null;
    subjects: Array<{
      id: string;
      code: string;
      name: string;
      description: string | null;
      chapterCount: number;
      questionCount: number;
    }>;
  }>;
  mockTests: Array<{
    id: string;
    code: string;
    title: string;
    description: string | null;
    durationMinutes: number;
    totalMarks: number;
    instructionsEn: string | null;
    instructionsTa: string | null;
    scheduledAt: string | null;
    availableUntil: string | null;
    questionCount: number;
  }>;
  recentQuestions: Array<{
    id: string;
    externalId: string;
    type: "SINGLE_CORRECT" | "MULTIPLE_CORRECT" | "NUMERICAL";
    language: "ENGLISH" | "TAMIL" | "BILINGUAL";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    textEn: string | null;
    textTa: string | null;
    questionImageUrl: string | null;
    updatedAt: string;
    chapter: { id: string; title: string } | null;
    course: { id: string; code: string; title: string };
    subject: { id: string; code: string; name: string };
  }>;
  generatedAt: string;
};

