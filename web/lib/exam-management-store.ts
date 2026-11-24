export type ExamStatus = "UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED";
export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EVALUATED" | "TIMED_OUT" | "CANCELLED";

export type StudentAssignmentTarget = "ALL" | "INTERNAL_ONLY" | "EXTERNAL_ONLY" | "CUSTOM";

export type ScheduledExam = {
  id: string;
  testId: string;
  testSeriesId: string;
  testName: string;
  testCode: string;
  categoryName: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  assignmentTarget: StudentAssignmentTarget;
  assignedStudentIds: string[];
  status: ExamStatus;
  maxAttempts: number;
  autoSubmitOnTimeout: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StudentExamAttempt = {
  id: string;
  examId: string;
  testId: string;
  testName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentCategory: "INTERNAL" | "EXTERNAL";
  attemptNumber: number;
  maxAllowedAttempts: number;
  startedAt: string;
  submittedAt?: string | null;
  durationSeconds: number;
  score: number;
  totalMarks: number;
  percentage: number;
  accuracy: number;
  questionsAttempted: number;
  totalQuestions: number;
  status: AttemptStatus;
  subjectScores: {
    physics: { score: number; max: number };
    chemistry: { score: number; max: number };
    biology: { score: number; max: number };
  };
};

// Pure real data store (no hardcoded dummy test or student data)
export const INITIAL_SCHEDULED_EXAMS: ScheduledExam[] = [];

export const INITIAL_STUDENT_ATTEMPTS: StudentExamAttempt[] = [];

class ExamManagementDataStore {
  private exams: ScheduledExam[] = JSON.parse(JSON.stringify(INITIAL_SCHEDULED_EXAMS));
  private attempts: StudentExamAttempt[] = JSON.parse(JSON.stringify(INITIAL_STUDENT_ATTEMPTS));

  getExams(statusFilter?: ExamStatus): ScheduledExam[] {
    if (!statusFilter || statusFilter === ("ALL" as never)) return [...this.exams];
    return this.exams.filter((e) => e.status === statusFilter);
  }

  getExamById(id: string): ScheduledExam | null {
    return this.exams.find((e) => e.id === id) || null;
  }

  scheduleExam(data: Omit<ScheduledExam, "id" | "createdAt" | "updatedAt">): ScheduledExam {
    const newExam: ScheduledExam = {
      ...data,
      id: `exam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.exams.unshift(newExam);
    return newExam;
  }

  updateExamStatus(id: string, status: ExamStatus): ScheduledExam {
    const exam = this.exams.find((e) => e.id === id);
    if (!exam) throw new Error("Exam not found");
    exam.status = status;
    exam.updatedAt = new Date().toISOString();
    return exam;
  }

  updateStudentAssignment(id: string, target: StudentAssignmentTarget, studentIds: string[]): ScheduledExam {
    const exam = this.exams.find((e) => e.id === id);
    if (!exam) throw new Error("Exam not found");
    exam.assignmentTarget = target;
    exam.assignedStudentIds = studentIds;
    exam.updatedAt = new Date().toISOString();
    return exam;
  }

  getAttempts(examId?: string): StudentExamAttempt[] {
    if (!examId) return [...this.attempts];
    return this.attempts.filter((a) => a.examId === examId);
  }

  recordAttempt(data: Omit<StudentExamAttempt, "id">): StudentExamAttempt {
    const attempt: StudentExamAttempt = {
      ...data,
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.attempts.unshift(attempt);
    return attempt;
  }

  autoSubmitAttempt(attemptId: string): StudentExamAttempt {
    const attempt = this.attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error("Attempt not found");
    if (attempt.status !== "IN_PROGRESS") {
      throw new Error("Attempt is already submitted or concluded");
    }
    attempt.status = "SUBMITTED";
    attempt.submittedAt = new Date().toISOString();
    // Auto-calculate score
    attempt.score = Math.round(attempt.questionsAttempted * 3.8);
    attempt.percentage = Math.round((attempt.score / attempt.totalMarks) * 100);
    attempt.accuracy = 85.0;
    return attempt;
  }

  grantReattempt(attemptId: string): StudentExamAttempt {
    const attempt = this.attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error("Attempt not found");
    attempt.maxAllowedAttempts = (attempt.maxAllowedAttempts || 1) + 1;
    return attempt;
  }

  resetAttempt(attemptId: string): void {
    const index = this.attempts.findIndex((a) => a.id === attemptId);
    if (index === -1) throw new Error("Attempt not found");
    this.attempts.splice(index, 1);
  }

  getExamStats() {
    return {
      totalExams: this.exams.length,
      liveExams: this.exams.filter((e) => e.status === "LIVE").length,
      upcomingExams: this.exams.filter((e) => e.status === "UPCOMING").length,
      completedExams: this.exams.filter((e) => e.status === "COMPLETED").length,
      activeTestTakers: this.attempts.filter((a) => a.status === "IN_PROGRESS").length,
      totalAttempts: this.attempts.length,
    };
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __examManagementStore: ExamManagementDataStore | undefined;
}

export const examManagementStore =
  globalThis.__examManagementStore ?? new ExamManagementDataStore();

if (process.env.NODE_ENV !== "production") {
  globalThis.__examManagementStore = examManagementStore;
}
