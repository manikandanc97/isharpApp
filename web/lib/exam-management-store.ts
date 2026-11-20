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

export const INITIAL_SCHEDULED_EXAMS: ScheduledExam[] = [
  {
    id: "exam-live-01",
    testId: "test-c11-03",
    testSeriesId: "series-c11-2026",
    testName: "Test 03 – Biology Chapter 1 (The Living World & Classification)",
    testCode: "NEET-11-BIO-01",
    categoryName: "Class 11",
    durationMinutes: 60,
    totalQuestions: 90,
    totalMarks: 360,
    startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    assignmentTarget: "ALL",
    assignedStudentIds: [],
    status: "LIVE",
    maxAttempts: 2,
    autoSubmitOnTimeout: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "exam-upcoming-01",
    testId: "test-c11-04",
    testSeriesId: "series-c11-2026",
    testName: "Test 04 – Class 11 Mid-Term Full Syllabus Grand Test",
    testCode: "NEET-11-FULL-01",
    categoryName: "Class 11",
    durationMinutes: 180,
    totalQuestions: 180,
    totalMarks: 720,
    startTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 52 * 3600 * 1000).toISOString(),
    assignmentTarget: "INTERNAL_ONLY",
    assignedStudentIds: [],
    status: "UPCOMING",
    maxAttempts: 1,
    autoSubmitOnTimeout: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "exam-completed-01",
    testId: "test-c12-01",
    testSeriesId: "series-c12-2026",
    testName: "Test 01 – Physics (Electrostatics & Current Electricity)",
    testCode: "NEET-12-PHY-01",
    categoryName: "Class 12",
    durationMinutes: 60,
    totalQuestions: 45,
    totalMarks: 180,
    startTime: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() - 7 * 24 * 3600 * 1000 + 3 * 3600 * 1000).toISOString(),
    assignmentTarget: "ALL",
    assignedStudentIds: [],
    status: "COMPLETED",
    maxAttempts: 1,
    autoSubmitOnTimeout: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "exam-completed-02",
    testId: "test-rep-01",
    testSeriesId: "series-rep-2026",
    testName: "Test 01 – Weekly Speed Test 01 (Mechanics & Organic Basics)",
    testCode: "NEET-REP-W01",
    categoryName: "Repeater Course",
    durationMinutes: 90,
    totalQuestions: 90,
    totalMarks: 360,
    startTime: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() - 14 * 24 * 3600 * 1000 + 4 * 3600 * 1000).toISOString(),
    assignmentTarget: "ALL",
    assignedStudentIds: [],
    status: "COMPLETED",
    maxAttempts: 2,
    autoSubmitOnTimeout: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_STUDENT_ATTEMPTS: StudentExamAttempt[] = [
  {
    id: "att-001",
    examId: "exam-live-01",
    testId: "test-c11-03",
    testName: "Test 03 – Biology Chapter 1",
    studentId: "ISA-INT-2026-001",
    studentName: "Aditya Ramanathan",
    studentEmail: "aditya.raman@isharp.edu",
    studentCategory: "INTERNAL",
    attemptNumber: 1,
    maxAllowedAttempts: 2,
    startedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    submittedAt: null,
    durationSeconds: 1500,
    score: 0,
    totalMarks: 360,
    percentage: 0,
    accuracy: 0,
    questionsAttempted: 42,
    totalQuestions: 90,
    status: "IN_PROGRESS",
    subjectScores: {
      physics: { score: 0, max: 0 },
      chemistry: { score: 0, max: 0 },
      biology: { score: 0, max: 360 },
    },
  },
  {
    id: "att-002",
    examId: "exam-completed-01",
    testId: "test-c12-01",
    testName: "Test 01 – Physics (Electrostatics)",
    studentId: "ISA-INT-2026-002",
    studentName: "Priyanka Soundararajan",
    studentEmail: "priyanka.s@gmail.com",
    studentCategory: "INTERNAL",
    attemptNumber: 1,
    maxAllowedAttempts: 1,
    startedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    submittedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000 + 3420 * 1000).toISOString(),
    durationSeconds: 3420,
    score: 168,
    totalMarks: 180,
    percentage: 93.3,
    accuracy: 95.5,
    questionsAttempted: 45,
    totalQuestions: 45,
    status: "EVALUATED",
    subjectScores: {
      physics: { score: 168, max: 180 },
      chemistry: { score: 0, max: 0 },
      biology: { score: 0, max: 0 },
    },
  },
  {
    id: "att-003",
    examId: "exam-completed-01",
    testId: "test-c12-01",
    testName: "Test 01 – Physics (Electrostatics)",
    studentId: "ISA-EXT-2026-042",
    studentName: "Karthik Subramanian",
    studentEmail: "karthik.subramanian@outlook.com",
    studentCategory: "EXTERNAL",
    attemptNumber: 1,
    maxAllowedAttempts: 1,
    startedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    submittedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000 + 3580 * 1000).toISOString(),
    durationSeconds: 3580,
    score: 152,
    totalMarks: 180,
    percentage: 84.4,
    accuracy: 88.0,
    questionsAttempted: 43,
    totalQuestions: 45,
    status: "EVALUATED",
    subjectScores: {
      physics: { score: 152, max: 180 },
      chemistry: { score: 0, max: 0 },
      biology: { score: 0, max: 0 },
    },
  },
  {
    id: "att-004",
    examId: "exam-completed-02",
    testId: "test-rep-01",
    testName: "Test 01 – Weekly Speed Test 01",
    studentId: "ISA-INT-2026-005",
    studentName: "Meenakshi Sundaram",
    studentEmail: "meenakshi.sundar@isharp.edu",
    studentCategory: "INTERNAL",
    attemptNumber: 1,
    maxAllowedAttempts: 2,
    startedAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
    submittedAt: new Date(Date.now() - 14 * 24 * 3600 * 1000 + 5100 * 1000).toISOString(),
    durationSeconds: 5100,
    score: 332,
    totalMarks: 360,
    percentage: 92.2,
    accuracy: 94.0,
    questionsAttempted: 88,
    totalQuestions: 90,
    status: "EVALUATED",
    subjectScores: {
      physics: { score: 164, max: 180 },
      chemistry: { score: 168, max: 180 },
      biology: { score: 0, max: 0 },
    },
  },
];

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
