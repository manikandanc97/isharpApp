import type {
  DemoBlueprint,
  DemoSelectionRules,
  LanguageMode,
  SubjectMode,
  WeightingMode,
} from './demo-test.types.js';

export interface CandidateQuestionRecord {
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
  contentFingerprint: string | null;
  equivalentFingerprint: string | null;
  correctMarks: number;
  negativeMarks: number;
  isActive: boolean;
  isRestrictedForDemo?: boolean;
  chapterId: string | null;
  chapter?: { id: string; title: string } | null;
  courseSubject?: {
    subject?: { code: string; name?: string } | null;
  } | null;
  options: Array<{
    id: string;
    label: string;
    textEn: string | null;
    textTa: string | null;
    imageUrl: string | null;
    isCorrect: boolean;
    position: number;
  }>;
}

const POSITION_DEPENDENT_PATTERNS = [
  /\ball\s+of\s+the\s+above\b/i,
  /\bnone\s+of\s+the\s+above\b/i,
  /\bboth\s*\(?\s*[a1]\s*\)?\s*(and|&)\s*\(?\s*[b2]\s*\)?/i,
  /\bboth\s*\(?\s*[b2]\s*\)?\s*(and|&)\s*\(?\s*[c3]\s*\)?/i,
  /\bboth\s*\(?\s*[a1]\s*\)?\s*(and|&)\s*\(?\s*[c3]\s*\)?/i,
  /\bonly\s*\(?\s*[a1]\s*\)?\s*(and|&)\s*\(?\s*[b2]\s*\)?/i,
  /\babove\s+all\b/i,
  /இவை\s*அனைத்தும்/,
  /மேற்கண்ட\s*அனைத்தும்/,
  /மேற்கண்ட\s*எதுவுமில்லை/,
  /அனைத்தும்\s*சரி/,
  /ஏதுமில்லை/,
];

/**
 * Checks whether option order must remain fixed because option text refers
 * to positional relationships such as "All of the above" or "Both A and B".
 */
export function isOptionOrderDependent(
  options: Array<{ textEn?: string | null; textTa?: string | null }>,
): boolean {
  for (const opt of options) {
    const en = opt.textEn ?? '';
    const ta = opt.textTa ?? '';
    if (
      POSITION_DEPENDENT_PATTERNS.some(
        (pattern) => pattern.test(en) || pattern.test(ta),
      )
    ) {
      return true;
    }
  }
  return false;
}

export interface QuestionEligibilityResult {
  eligible: boolean;
  reasons: string[];
}

/**
 * Validates that a Question Bank record is safe, complete, and valid for public demo use.
 */
export function evaluateQuestionEligibility(
  q: CandidateQuestionRecord,
  languageMode: LanguageMode | 'ANY' = 'ANY',
): QuestionEligibilityResult {
  const reasons: string[] = [];

  if (!q.isActive) {
    reasons.push('Question is inactive');
  }
  if (q.isRestrictedForDemo) {
    reasons.push('Question is restricted from public demo');
  }
  if (!q.textEn?.trim() && !q.questionImageUrl?.trim()) {
    reasons.push('Missing English question text or image');
  }

  if (q.type === 'NUMERICAL') {
    if (!q.numericalAnswer?.trim()) {
      reasons.push('Missing numerical answer');
    }
  } else {
    if (!q.options || q.options.length < 2) {
      reasons.push('Fewer than 2 options');
    } else {
      const hasCorrect = q.options.some((opt) => opt.isCorrect);
      if (!hasCorrect) {
        reasons.push('No correct option marked');
      }
      const hasEmptyOption = q.options.some(
        (opt) => !opt.textEn?.trim() && !opt.imageUrl?.trim(),
      );
      if (hasEmptyOption) {
        reasons.push('One or more options have no text or image');
      }
    }
  }

  if (languageMode === 'ta') {
    if (!q.textTa?.trim() && !q.questionImageUrl?.trim()) {
      reasons.push('Missing Tamil question translation');
    }
    if (q.type !== 'NUMERICAL' && q.options?.length) {
      const missingTaOption = q.options.some(
        (opt) => !opt.textTa?.trim() && !opt.imageUrl?.trim(),
      );
      if (missingTaOption) {
        reasons.push('Missing Tamil option translation');
      }
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

/**
 * Largest-remainder rounding so difficulty targets always sum to `totalCount`.
 */
export function computeDifficultyTargets(
  totalCount: number,
  distribution: DemoSelectionRules['difficultyDistribution'],
): { EASY: number; MEDIUM: number; HARD: number } {
  if (totalCount <= 0) return { EASY: 0, MEDIUM: 0, HARD: 0 };

  const easyPct = Math.max(0, distribution.EASY ?? 40);
  const medPct = Math.max(0, distribution.MEDIUM ?? 40);
  const hardPct = Math.max(0, distribution.HARD ?? 20);
  const sum = easyPct + medPct + hardPct || 100;

  const raw = [
    { key: 'EASY' as const, exact: (totalCount * easyPct) / sum },
    { key: 'MEDIUM' as const, exact: (totalCount * medPct) / sum },
    { key: 'HARD' as const, exact: (totalCount * hardPct) / sum },
  ];

  const floors = raw.map((item) => ({
    key: item.key,
    count: Math.floor(item.exact),
    remainder: item.exact - Math.floor(item.exact),
  }));

  let remaining = totalCount - floors.reduce((acc, item) => acc + item.count, 0);
  const sortedByRemainder = [...floors].sort(
    (a, b) => b.remainder - a.remainder,
  );
  for (let i = 0; i < remaining; i++) {
    sortedByRemainder[i % sortedByRemainder.length].count += 1;
  }

  const out = { EASY: 0, MEDIUM: 0, HARD: 0 };
  for (const item of floors) {
    out[item.key] = item.count;
  }
  return out;
}

/**
 * Computes subject distribution targets for a paper.
 */
export function computeSubjectTargets(
  totalCount: number,
  subjectMode: SubjectMode,
  blueprint?: DemoBlueprint,
  weightingMode: WeightingMode = 'WEIGHTED',
): Record<'PHYSICS' | 'CHEMISTRY' | 'BIOLOGY', number> {
  if (subjectMode !== 'ALL') {
    return {
      PHYSICS: subjectMode === 'PHYSICS' ? totalCount : 0,
      CHEMISTRY: subjectMode === 'CHEMISTRY' ? totalCount : 0,
      BIOLOGY: subjectMode === 'BIOLOGY' ? totalCount : 0,
    };
  }

  if (blueprint) {
    const bpSum =
      blueprint.subjectDistribution.PHYSICS +
      blueprint.subjectDistribution.CHEMISTRY +
      blueprint.subjectDistribution.BIOLOGY;
    if (bpSum === totalCount) {
      return { ...blueprint.subjectDistribution };
    }
  }

  if (weightingMode === 'EQUAL') {
    const base = Math.floor(totalCount / 3);
    const rem = totalCount - base * 3;
    return {
      PHYSICS: base + (rem >= 1 ? 1 : 0),
      CHEMISTRY: base + (rem >= 2 ? 1 : 0),
      BIOLOGY: base,
    };
  }

  // NEET-inspired default weighting: 25% Physics, 25% Chemistry, 50% Biology
  const phy = Math.round(totalCount * 0.25);
  const chem = Math.round(totalCount * 0.25);
  const bio = Math.max(0, totalCount - phy - chem);
  return { PHYSICS: phy, CHEMISTRY: chem, BIOLOGY: bio };
}
