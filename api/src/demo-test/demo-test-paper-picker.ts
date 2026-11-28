import { secureShuffle } from '../examination-engine/examination-randomization.helper.js';
import type { CandidateQuestionRecord } from './demo-test-eligibility.helper.js';
import type { DemoSelectionRules, SubjectMode } from './demo-test.types.js';

export interface GlobalExposureStat {
  questionId: string;
  exposureCount: number;
  lastExposedAt: Date | null;
}

export function countUniqueEquivalentQuestions(
  questions: CandidateQuestionRecord[],
): number {
  const seenCfp = new Set<string>();
  const seenEfp = new Set<string>();
  let count = 0;
  for (const q of questions) {
    if (q.contentFingerprint && seenCfp.has(q.contentFingerprint)) continue;
    if (q.equivalentFingerprint && seenEfp.has(q.equivalentFingerprint)) {
      continue;
    }
    if (q.contentFingerprint) seenCfp.add(q.contentFingerprint);
    if (q.equivalentFingerprint) seenEfp.add(q.equivalentFingerprint);
    count += 1;
  }
  return count;
}

function secureRandomFraction(): number {
  const buf = secureShuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  return buf[0] / 10;
}

export function rankTierWithBalancing(
  pool: CandidateQuestionRecord[],
  globalStats: Map<string, GlobalExposureStat>,
  recentUsage: Map<string, number>,
  enableBalancing: boolean,
  preserveRecencyOrder = false,
): CandidateQuestionRecord[] {
  const shuffled = secureShuffle(pool);
  if (preserveRecencyOrder) return pool;
  if (!enableBalancing) return shuffled;

  return shuffled
    .map((q, idx) => {
      const globalCount = globalStats.get(q.id)?.exposureCount ?? 0;
      const recentCount = recentUsage.get(q.id) ?? 0;
      const jitter = (idx % 7) * 0.12 + secureRandomFraction() * 1.5;
      const score = globalCount * 1.0 + recentCount * 1.5 + jitter;
      return { q, score };
    })
    .sort((a, b) => a.score - b.score)
    .map((entry) => entry.q);
}

export function pickBlueprintBalancedPaper(params: {
  tiers: CandidateQuestionRecord[][];
  questionCount: number;
  subjectMode: SubjectMode;
  subjectTargets: Record<'PHYSICS' | 'CHEMISTRY' | 'BIOLOGY', number>;
  difficultyTargets: { EASY: number; MEDIUM: number; HARD: number };
  rules: DemoSelectionRules;
}): CandidateQuestionRecord[] {
  const {
    tiers,
    questionCount,
    subjectMode,
    subjectTargets,
    difficultyTargets,
    rules,
  } = params;

  const selected: CandidateQuestionRecord[] = [];
  const selectedIds = new Set<string>();
  const usedContentFps = new Set<string>();
  const usedEquivFps = new Set<string>();
  const usedChapters = new Set<string>();
  const usedTypes = new Set<string>();

  const subjectCounts: Record<string, number> = {
    PHYSICS: 0,
    CHEMISTRY: 0,
    BIOLOGY: 0,
  };
  const diffCounts: Record<string, number> = {
    EASY: 0,
    MEDIUM: 0,
    HARD: 0,
  };
  let imageCount = 0;

  const canAdd = (q: CandidateQuestionRecord): boolean => {
    if (selectedIds.has(q.id)) return false;
    if (q.contentFingerprint && usedContentFps.has(q.contentFingerprint)) {
      return false;
    }
    if (q.equivalentFingerprint && usedEquivFps.has(q.equivalentFingerprint)) {
      return false;
    }
    return true;
  };

  const commit = (q: CandidateQuestionRecord) => {
    selected.push(q);
    selectedIds.add(q.id);
    if (q.contentFingerprint) usedContentFps.add(q.contentFingerprint);
    if (q.equivalentFingerprint) usedEquivFps.add(q.equivalentFingerprint);
    if (q.chapterId) usedChapters.add(q.chapterId);
    usedTypes.add(q.type);
    const subj = q.courseSubject?.subject?.code?.toUpperCase() ?? 'GENERAL';
    subjectCounts[subj] = (subjectCounts[subj] ?? 0) + 1;
    diffCounts[q.difficulty] = (diffCounts[q.difficulty] ?? 0) + 1;
    if (q.questionImageUrl) imageCount += 1;
  };

  for (const tier of tiers) {
    if (selected.length >= questionCount) break;

    for (const q of tier) {
      if (selected.length >= questionCount) break;
      if (!canAdd(q)) continue;

      const subj = q.courseSubject?.subject?.code?.toUpperCase() ?? 'GENERAL';
      if (subjectMode === 'ALL') {
        const target = subjectTargets[subj as keyof typeof subjectTargets] ?? 0;
        if ((subjectCounts[subj] ?? 0) >= target) continue;
      }

      const diffTarget =
        difficultyTargets[q.difficulty as keyof typeof difficultyTargets] ?? 0;
      if ((diffCounts[q.difficulty] ?? 0) >= diffTarget) continue;

      if (
        rules.minImageQuestions > 0 &&
        imageCount < rules.minImageQuestions &&
        !q.questionImageUrl &&
        questionCount - selected.length <= rules.minImageQuestions - imageCount
      ) {
        continue;
      }

      if (
        rules.chapterDiversity &&
        q.chapterId &&
        usedChapters.has(q.chapterId) &&
        tier.some(
          (alt) =>
            canAdd(alt) &&
            alt.chapterId &&
            !usedChapters.has(alt.chapterId) &&
            (subjectMode !== 'ALL' ||
              alt.courseSubject?.subject?.code?.toUpperCase() === subj),
        )
      ) {
        continue;
      }

      if (
        rules.questionTypeDiversity &&
        usedTypes.has(q.type) &&
        usedTypes.size < 2 &&
        tier.some(
          (alt) =>
            canAdd(alt) &&
            !usedTypes.has(alt.type) &&
            (subjectMode !== 'ALL' ||
              alt.courseSubject?.subject?.code?.toUpperCase() === subj),
        )
      ) {
        continue;
      }

      commit(q);
    }

    for (const q of tier) {
      if (selected.length >= questionCount) break;
      if (!canAdd(q)) continue;

      const subj = q.courseSubject?.subject?.code?.toUpperCase() ?? 'GENERAL';
      if (subjectMode === 'ALL') {
        const target = subjectTargets[subj as keyof typeof subjectTargets] ?? 0;
        if ((subjectCounts[subj] ?? 0) >= target) continue;
      }
      commit(q);
    }

    for (const q of tier) {
      if (selected.length >= questionCount) break;
      if (!canAdd(q)) continue;
      commit(q);
    }
  }

  return selected;
}
