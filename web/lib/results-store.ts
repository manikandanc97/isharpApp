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

export const INITIAL_LEADERBOARD: StudentRankEntry[] = [];

export const INITIAL_CHAPTER_INSIGHTS: ChapterPerformance[] = [];

export function calculateResultsOverview(leaderboard: StudentRankEntry[] = INITIAL_LEADERBOARD): ResultsOverview {
  const lb = leaderboard;
  const totalAttempts = lb.length;

  if (totalAttempts === 0) {
    return {
      totalAttempts: 0,
      averageMarks: 0,
      highestMarks: 0,
      totalMarks: 720,
      passPercentage: 0,
      overallAccuracy: 0,
      subjectPerformance: {
        physics: { averageScore: 0, maxScore: 180, accuracy: 0 },
        chemistry: { averageScore: 0, maxScore: 180, accuracy: 0 },
        biology: { averageScore: 0, maxScore: 360, accuracy: 0 },
      },
      leaderboard: [],
      chapterInsights: [],
    };
  }

  const avg = Math.round(lb.reduce((sum, item) => sum + item.score, 0) / totalAttempts);
  const highest = Math.max(...lb.map((item) => item.score));
  const passCount = lb.filter((item) => item.percentage >= 50).length;

  return {
    totalAttempts,
    averageMarks: avg,
    highestMarks: highest,
    totalMarks: 720,
    passPercentage: Math.round((passCount / totalAttempts) * 100),
    overallAccuracy: Math.round((lb.reduce((sum, item) => sum + item.accuracy, 0) / totalAttempts) * 10) / 10,
    subjectPerformance: {
      physics: {
        averageScore: Math.round(lb.reduce((sum, item) => sum + item.physicsScore, 0) / totalAttempts),
        maxScore: 180,
        accuracy: 85,
      },
      chemistry: {
        averageScore: Math.round(lb.reduce((sum, item) => sum + item.chemistryScore, 0) / totalAttempts),
        maxScore: 180,
        accuracy: 85,
      },
      biology: {
        averageScore: Math.round(lb.reduce((sum, item) => sum + item.biologyScore, 0) / totalAttempts),
        maxScore: 360,
        accuracy: 85,
      },
    },
    leaderboard: lb,
    chapterInsights: INITIAL_CHAPTER_INSIGHTS,
  };
}
