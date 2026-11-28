import { QuestionType } from '../generated/prisma/client.js';

export interface ExamPatternSubjectRule {
  subjectCode: string;
  subjectName: string;
  questionCount: number;
  maxMarks: number;
}

export interface ExamPatternConfig {
  version: string;
  name: string;
  totalQuestions: number;
  durationMinutes: number;
  correctMarks: number;
  negativeMarks: number;
  unansweredMarks: number;
  maxMarks: number;
  defaultQuestionType: QuestionType;
  allCompulsory: boolean;
  subjects: ExamPatternSubjectRule[];
}

/**
 * Centralized, versioned NEET examination pattern configuration.
 * Reference: Official NEET UG 180 compulsory single-correct MCQs, 180 minutes, 720 marks (+4 / -1 / 0).
 */
export const DEFAULT_NEET_PATTERN: ExamPatternConfig = {
  version: 'NEET_2026_V1',
  name: 'NEET UG Standard Pattern',
  totalQuestions: 180,
  durationMinutes: 180,
  correctMarks: 4,
  negativeMarks: 1,
  unansweredMarks: 0,
  maxMarks: 720,
  defaultQuestionType: QuestionType.SINGLE_CORRECT,
  allCompulsory: true,
  subjects: [
    { subjectCode: 'PHYSICS', subjectName: 'Physics', questionCount: 45, maxMarks: 180 },
    { subjectCode: 'CHEMISTRY', subjectName: 'Chemistry', questionCount: 45, maxMarks: 180 },
    { subjectCode: 'BOTANY', subjectName: 'Botany', questionCount: 45, maxMarks: 180 },
    { subjectCode: 'ZOOLOGY', subjectName: 'Zoology', questionCount: 45, maxMarks: 180 },
  ],
};

/**
 * Calculates proportional duration in whole minutes using the centralized NEET reference pattern.
 * Consistent rounding: nearest whole minute, minimum 1 minute when questionCount > 0.
 */
export function calculateProportionalDuration(
  questionCount: number,
  pattern: ExamPatternConfig = DEFAULT_NEET_PATTERN,
): number {
  if (!Number.isFinite(questionCount) || questionCount <= 0) {
    return 0;
  }
  const raw = (questionCount * pattern.durationMinutes) / pattern.totalQuestions;
  return Math.max(1, Math.round(raw));
}

export function calculateMaximumMarks(
  questionCount: number,
  correctMarks: number,
): number {
  if (!Number.isFinite(questionCount) || questionCount <= 0) return 0;
  if (!Number.isFinite(correctMarks) || correctMarks <= 0) return 0;
  return Math.round(questionCount * correctMarks);
}

/**
 * Resolves subject quotas against the actual subjects present in the Question Bank.
 * Prevents double-counting Biology alongside Botany/Zoology.
 */
export function resolvePatternSubjectsForDb(
  dbSubjects: Array<{ id: string; code: string; name: string }>,
  pattern: ExamPatternConfig = DEFAULT_NEET_PATTERN,
): Array<{
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  questionCount: number;
  maxMarks: number;
}> {
  const byCode = new Map(dbSubjects.map((s) => [s.code.toUpperCase(), s]));
  const hasBotany = byCode.has('BOTANY');
  const hasZoology = byCode.has('ZOOLOGY');
  const hasBiology = byCode.has('BIOLOGY');

  const resolved: Array<{
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    questionCount: number;
    maxMarks: number;
  }> = [];

  for (const rule of pattern.subjects) {
    const code = rule.subjectCode.toUpperCase();
    const match = byCode.get(code);
    if (match) {
      resolved.push({
        subjectId: match.id,
        subjectCode: match.code,
        subjectName: match.name,
        questionCount: rule.questionCount,
        maxMarks: rule.maxMarks,
      });
    }
  }

  // If the DB uses a unified BIOLOGY subject instead of separate BOTANY/ZOOLOGY,
  // map the combined 90 questions (360 marks) to BIOLOGY without double counting.
  if (!hasBotany && !hasZoology && hasBiology) {
    const bio = byCode.get('BIOLOGY')!;
    const bioQuestions =
      (pattern.subjects.find((s) => s.subjectCode === 'BOTANY')?.questionCount ?? 45) +
      (pattern.subjects.find((s) => s.subjectCode === 'ZOOLOGY')?.questionCount ?? 45);
    resolved.push({
      subjectId: bio.id,
      subjectCode: bio.code,
      subjectName: bio.name,
      questionCount: bioQuestions,
      maxMarks: bioQuestions * pattern.correctMarks,
    });
  }

  return resolved;
}
