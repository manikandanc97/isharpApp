export type StudentRankEntry = {
  rank: number;
  studentId: string;
  studentName: string;
  category: "INTERNAL" | "EXTERNAL";
  testName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  percentile: number;
  submittedAt: string;
  physicsScore: number;
  chemistryScore: number;
  biologyScore: number;
};

export type ChapterPerformance = {
  chapterTitle: string;
  subject: "PHYSICS" | "CHEMISTRY" | "BIOLOGY";
  accuracyPercentage: number;
  totalQuestionsAnswered: number;
  commonMistakeRate: number;
};

export type ResultsOverview = {
  totalAttempts: number;
  averageMarks: number;
  highestMarks: number;
  totalMarks: number;
  passPercentage: number;
  overallAccuracy: number;
  subjectPerformance: {
    physics: { averageScore: number; maxScore: number; accuracy: number };
    chemistry: { averageScore: number; maxScore: number; accuracy: number };
    biology: { averageScore: number; maxScore: number; accuracy: number };
  };
  leaderboard: StudentRankEntry[];
  chapterInsights: ChapterPerformance[];
};

export const INITIAL_LEADERBOARD: StudentRankEntry[] = [
  {
    rank: 1,
    studentId: "ISA-INT-2026-005",
    studentName: "Meenakshi Sundaram",
    category: "INTERNAL",
    testName: "NEET Grand Test 01 (Combined)",
    score: 685,
    totalMarks: 720,
    percentage: 95.1,
    accuracy: 96.2,
    correctCount: 173,
    incorrectCount: 7,
    unattemptedCount: 0,
    percentile: 99.8,
    submittedAt: "2026-06-10T17:15:00.000Z",
    physicsScore: 172,
    chemistryScore: 173,
    biologyScore: 340,
  },
  {
    rank: 2,
    studentId: "ISA-INT-2026-002",
    studentName: "Priyanka Soundararajan",
    category: "INTERNAL",
    testName: "NEET Grand Test 01 (Combined)",
    score: 668,
    totalMarks: 720,
    percentage: 92.8,
    accuracy: 94.4,
    correctCount: 170,
    incorrectCount: 10,
    unattemptedCount: 0,
    percentile: 98.9,
    submittedAt: "2026-06-10T17:10:00.000Z",
    physicsScore: 168,
    chemistryScore: 165,
    biologyScore: 335,
  },
  {
    rank: 3,
    studentId: "ISA-EXT-2026-042",
    studentName: "Karthik Subramanian",
    category: "EXTERNAL",
    testName: "NEET Grand Test 01 (Combined)",
    score: 642,
    totalMarks: 720,
    percentage: 89.2,
    accuracy: 91.5,
    correctCount: 164,
    incorrectCount: 14,
    unattemptedCount: 2,
    percentile: 96.5,
    submittedAt: "2026-06-10T17:18:00.000Z",
    physicsScore: 156,
    chemistryScore: 158,
    biologyScore: 328,
  },
  {
    rank: 4,
    studentId: "ISA-INT-2026-009",
    studentName: "Dhivya Bharathi",
    category: "INTERNAL",
    testName: "NEET Grand Test 01 (Combined)",
    score: 618,
    totalMarks: 720,
    percentage: 85.8,
    accuracy: 88.0,
    correctCount: 158,
    incorrectCount: 18,
    unattemptedCount: 4,
    percentile: 94.0,
    submittedAt: "2026-06-10T17:12:00.000Z",
    physicsScore: 148,
    chemistryScore: 152,
    biologyScore: 318,
  },
  {
    rank: 5,
    studentId: "ISA-EXT-2026-118",
    studentName: "Sanjay Balakrishnan",
    category: "EXTERNAL",
    testName: "NEET Grand Test 01 (Combined)",
    score: 592,
    totalMarks: 720,
    percentage: 82.2,
    accuracy: 85.0,
    correctCount: 152,
    incorrectCount: 22,
    unattemptedCount: 6,
    percentile: 91.2,
    submittedAt: "2026-06-10T17:19:00.000Z",
    physicsScore: 140,
    chemistryScore: 144,
    biologyScore: 308,
  },
];

export const INITIAL_CHAPTER_INSIGHTS: ChapterPerformance[] = [
  {
    chapterTitle: "Electrostatics & Capacitance",
    subject: "PHYSICS",
    accuracyPercentage: 78.4,
    totalQuestionsAnswered: 420,
    commonMistakeRate: 21.6,
  },
  {
    chapterTitle: "Optics and Optical Instruments",
    subject: "PHYSICS",
    accuracyPercentage: 69.2,
    totalQuestionsAnswered: 380,
    commonMistakeRate: 30.8,
  },
  {
    chapterTitle: "Chemical Kinetics & Equilibrium",
    subject: "CHEMISTRY",
    accuracyPercentage: 82.5,
    totalQuestionsAnswered: 450,
    commonMistakeRate: 17.5,
  },
  {
    chapterTitle: "Coordination Compounds",
    subject: "CHEMISTRY",
    accuracyPercentage: 74.0,
    totalQuestionsAnswered: 390,
    commonMistakeRate: 26.0,
  },
  {
    chapterTitle: "Genetics & Molecular Basis of Inheritance",
    subject: "BIOLOGY",
    accuracyPercentage: 88.1,
    totalQuestionsAnswered: 620,
    commonMistakeRate: 11.9,
  },
  {
    chapterTitle: "Human Physiology & Neural Control",
    subject: "BIOLOGY",
    accuracyPercentage: 85.3,
    totalQuestionsAnswered: 580,
    commonMistakeRate: 14.7,
  },
];

export function calculateResultsOverview(): ResultsOverview {
  const lb = INITIAL_LEADERBOARD;
  const totalAttempts = lb.length;
  const avg = Math.round(lb.reduce((sum, item) => sum + item.score, 0) / totalAttempts);
  const highest = Math.max(...lb.map((item) => item.score));
  const passCount = lb.filter((item) => item.percentage >= 50).length;

  return {
    totalAttempts: 148, // Aggregated historical attempts
    averageMarks: avg,
    highestMarks: highest,
    totalMarks: 720,
    passPercentage: Math.round((passCount / totalAttempts) * 100),
    overallAccuracy: 89.2,
    subjectPerformance: {
      physics: { averageScore: 156, maxScore: 180, accuracy: 86.6 },
      chemistry: { averageScore: 160, maxScore: 180, accuracy: 88.8 },
      biology: { averageScore: 325, maxScore: 360, accuracy: 90.2 },
    },
    leaderboard: lb,
    chapterInsights: INITIAL_CHAPTER_INSIGHTS,
  };
}
