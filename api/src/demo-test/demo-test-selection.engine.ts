import { createHash } from 'node:crypto';
import {
  createOptionMappings,
  secureShuffle,
} from '../examination-engine/examination-randomization.helper.js';
import {
  computeDifficultyTargets,
  computeSubjectTargets,
  evaluateQuestionEligibility,
  isOptionOrderDependent,
  type CandidateQuestionRecord,
} from './demo-test-eligibility.helper.js';
import {
  countUniqueEquivalentQuestions,
  pickBlueprintBalancedPaper,
  rankTierWithBalancing,
  type GlobalExposureStat,
} from './demo-test-paper-picker.js';
import type {
  DemoBlueprint,
  DemoSelectionRules,
  LanguageMode,
  ShuffledOptionMapping,
  SubjectMode,
} from './demo-test.types.js';

export type { GlobalExposureStat };

export interface VisitorExposureRecord {
  questionId: string;
  contentFingerprint: string | null;
  equivalentFingerprint: string | null;
  lastExposedAt: Date;
}

export interface RecentPaperRecord {
  paperFingerprint: string;
  questionIds: string[];
}

export interface SelectionEngineInput {
  candidates: CandidateQuestionRecord[];
  subjectMode: SubjectMode;
  languageMode: LanguageMode;
  questionCount: number;
  blueprint?: DemoBlueprint;
  rules: DemoSelectionRules;
  visitorExposures: VisitorExposureRecord[];
  globalStats: Map<string, GlobalExposureStat>;
  recentPapers: RecentPaperRecord[];
  now?: Date;
}

export interface SelectedPaperQuestion {
  question: CandidateQuestionRecord;
  optionMappings: ShuffledOptionMapping[];
}

export interface SelectionEngineResult {
  questions: SelectedPaperQuestion[];
  paperFingerprint: string;
  controlledReuseUsed: boolean;
  poolExhausted: boolean;
  exhaustedReason?: string;
}

export function computePaperFingerprint(questionIds: string[]): string {
  const sorted = [...questionIds].sort();
  return createHash('sha256').update(sorted.join(',')).digest('hex');
}

export function computePaperOverlapRatio(
  paperAIds: string[],
  paperBIds: string[],
): number {
  if (!paperAIds.length || !paperBIds.length) return 0;
  const setB = new Set(paperBIds);
  let shared = 0;
  for (const id of paperAIds) {
    if (setB.has(id)) shared += 1;
  }
  return shared / Math.max(paperAIds.length, paperBIds.length);
}

/**
 * Selects a randomized, deduplicated, blueprint-aligned demo question paper.
 * Pure function so it can be thoroughly unit-tested with deterministic or live inputs.
 */
export function selectDemoQuestions(
  input: SelectionEngineInput,
): SelectionEngineResult {
  const {
    candidates,
    subjectMode,
    languageMode,
    questionCount,
    blueprint,
    rules,
    visitorExposures,
    globalStats,
    recentPapers,
    now = new Date(),
  } = input;

  const eligibleCandidates = candidates.filter((q) => {
    const subjCode = q.courseSubject?.subject?.code?.toUpperCase() ?? 'GENERAL';
    if (subjectMode !== 'ALL' && subjCode !== subjectMode) {
      return false;
    }
    return evaluateQuestionEligibility(q, languageMode).eligible;
  });

  if (eligibleCandidates.length < questionCount) {
    throw new Error(
      `INSUFFICIENT_ELIGIBLE_POOL: Requested ${questionCount} questions for ${subjectMode} (${languageMode}), but only ${eligibleCandidates.length} eligible questions exist.`,
    );
  }

  const exposedQuestionIds = new Set<string>();
  const exposedContentFps = new Set<string>();
  const exposedEquivFps = new Set<string>();
  const lastExposedMap = new Map<string, Date>();

  for (const exp of visitorExposures) {
    exposedQuestionIds.add(exp.questionId);
    lastExposedMap.set(exp.questionId, exp.lastExposedAt);
    if (exp.contentFingerprint) exposedContentFps.add(exp.contentFingerprint);
    if (exp.equivalentFingerprint) {
      exposedEquivFps.add(exp.equivalentFingerprint);
    }
  }

  const shuffledAll = secureShuffle(eligibleCandidates);

  const isVisitorExposed = (q: CandidateQuestionRecord): boolean => {
    if (!rules.visitorRepeatPrevention) return false;
    if (exposedQuestionIds.has(q.id)) return true;
    if (rules.equivalentRepeatPrevention) {
      if (q.contentFingerprint && exposedContentFps.has(q.contentFingerprint)) {
        return true;
      }
      if (
        q.equivalentFingerprint &&
        exposedEquivFps.has(q.equivalentFingerprint)
      ) {
        return true;
      }
    }
    return false;
  };

  const unseenPool = shuffledAll.filter((q) => !isVisitorExposed(q));
  const cooldownMs = Math.max(0, rules.cooldownHours) * 3_600_000;
  const seenPool = shuffledAll
    .filter((q) => isVisitorExposed(q))
    .sort((a, b) => {
      const aTime = lastExposedMap.get(a.id)?.getTime() ?? 0;
      const bTime = lastExposedMap.get(b.id)?.getTime() ?? 0;
      return aTime - bTime;
    });

  const uniqueUnseenCount = countUniqueEquivalentQuestions(unseenPool);
  let controlledReuseUsed = false;
  let poolExhausted = false;

  if (uniqueUnseenCount < questionCount) {
    poolExhausted = true;
    if (rules.strictNoRepeat || !rules.smartReuseAfterExhaustion) {
      throw new Error(
        `POOL_EXHAUSTED_STRICT: No fresh demo paper is currently available (${uniqueUnseenCount} unseen unique questions remain, ${questionCount} required).`,
      );
    }
    controlledReuseUsed = true;
  }

  const outsideCooldown = seenPool.filter((q) => {
    const last = lastExposedMap.get(q.id)?.getTime() ?? 0;
    return now.getTime() - last >= cooldownMs;
  });
  const insideCooldown = seenPool.filter((q) => {
    const last = lastExposedMap.get(q.id)?.getTime() ?? 0;
    return now.getTime() - last < cooldownMs;
  });

  const recentPaperFingerprints = new Set(
    recentPapers
      .slice(0, rules.recentPaperWindow)
      .map((p) => p.paperFingerprint),
  );
  const recentQuestionUsageCount = new Map<string, number>();
  for (const paper of recentPapers.slice(0, rules.recentPaperWindow)) {
    for (const qid of paper.questionIds) {
      recentQuestionUsageCount.set(
        qid,
        (recentQuestionUsageCount.get(qid) ?? 0) + 1,
      );
    }
  }

  const subjectTargets = computeSubjectTargets(
    questionCount,
    subjectMode,
    blueprint,
    rules.weightingMode,
  );
  const difficultyTargets = computeDifficultyTargets(
    questionCount,
    rules.difficultyDistribution,
  );

  let bestSelection: CandidateQuestionRecord[] | null = null;
  let bestOverlapScore = Infinity;
  const maxAttempts = rules.recentPaperUniqueness ? 6 : 1;

  for (let attemptIdx = 0; attemptIdx < maxAttempts; attemptIdx++) {
    const orderedTiers = [
      rankTierWithBalancing(
        unseenPool,
        globalStats,
        recentQuestionUsageCount,
        rules.globalExposureBalancing,
      ),
      ...(controlledReuseUsed
        ? [
            rankTierWithBalancing(
              outsideCooldown,
              globalStats,
              recentQuestionUsageCount,
              rules.globalExposureBalancing,
              true,
            ),
            rankTierWithBalancing(
              insideCooldown,
              globalStats,
              recentQuestionUsageCount,
              rules.globalExposureBalancing,
              true,
            ),
          ]
        : []),
    ];

    const picked = pickBlueprintBalancedPaper({
      tiers: orderedTiers,
      questionCount,
      subjectMode,
      subjectTargets,
      difficultyTargets,
      rules,
    });

    if (picked.length < questionCount) continue;

    const pickedIds = picked.map((q) => q.id);
    const fp = computePaperFingerprint(pickedIds);
    const isDuplicatePaper = recentPaperFingerprints.has(fp);

    let maxOverlap = 0;
    for (const recent of recentPapers.slice(0, rules.recentPaperWindow)) {
      const ratio = computePaperOverlapRatio(pickedIds, recent.questionIds);
      if (ratio > maxOverlap) maxOverlap = ratio;
    }

    const penalty = (isDuplicatePaper ? 10 : 0) + maxOverlap;
    if (penalty < bestOverlapScore) {
      bestOverlapScore = penalty;
      bestSelection = picked;
    }

    if (
      !isDuplicatePaper &&
      maxOverlap <= (rules.maxPaperOverlapRatio ?? 0.5)
    ) {
      break;
    }
  }

  if (!bestSelection || bestSelection.length < questionCount) {
    throw new Error(
      `INSUFFICIENT_UNIQUE_QUESTIONS: Could not assemble ${questionCount} non-duplicate questions matching blueprint constraints.`,
    );
  }

  const finalQuestions = rules.shuffleQuestions
    ? secureShuffle(bestSelection)
    : bestSelection;

  const paperFingerprint = computePaperFingerprint(
    finalQuestions.map((q) => q.id),
  );

  const mappedQuestions: SelectedPaperQuestion[] = finalQuestions.map((q) => {
    const shouldShuffleOpts =
      rules.shuffleOptions &&
      q.type !== 'NUMERICAL' &&
      !isOptionOrderDependent(q.options);
    const optionMappings = createOptionMappings(q.options, shouldShuffleOpts);
    return { question: q, optionMappings };
  });

  return {
    questions: mappedQuestions,
    paperFingerprint,
    controlledReuseUsed,
    poolExhausted,
    exhaustedReason: poolExhausted
      ? 'Visitor has seen all unique eligible questions; controlled reuse applied.'
      : undefined,
  };
}
