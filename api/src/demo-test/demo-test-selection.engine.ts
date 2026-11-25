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
import type {
  DemoBlueprint,
  DemoSelectionRules,
  LanguageMode,
  ShuffledOptionMapping,
  SubjectMode,
} from './demo-test.types.js';

export interface VisitorExposureRecord {
  questionId: string;
  contentFingerprint: string | null;
  equivalentFingerprint: string | null;
  lastExposedAt: Date;
}

export interface GlobalExposureStat {
  questionId: string;
  exposureCount: number;
  lastExposedAt: Date | null;
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

  // 1. Filter by eligibility (active, non-restricted, valid options/answers, language completeness)
  //    and subject filter if single-subject mode.
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

  // 2. Build visitor exposure lookup maps
  const exposedQuestionIds = new Set<string>();
  const exposedContentFps = new Set<string>();
  const exposedEquivFps = new Set<string>();
  const lastExposedMap = new Map<string, Date>();

  for (const exp of visitorExposures) {
    exposedQuestionIds.add(exp.questionId);
    lastExposedMap.set(exp.questionId, exp.lastExposedAt);
    if (exp.contentFingerprint) exposedContentFps.add(exp.contentFingerprint);
    if (exp.equivalentFingerprint)
      exposedEquivFps.add(exp.equivalentFingerprint);
  }

  // 3. Deduplicate candidate pool by content & equivalent fingerprint for intra-paper uniqueness,
  //    shuffling first so duplicate representatives aren't biased by ID order.
  const shuffledAll = secureShuffle(eligibleCandidates);

  const isVisitorExposed = (q: CandidateQuestionRecord): boolean => {
    if (!rules.visitorRepeatPrevention) return false;
    if (exposedQuestionIds.has(q.id)) return true;
    if (rules.equivalentRepeatPrevention) {
      if (q.contentFingerprint && exposedContentFps.has(q.contentFingerprint))
        return true;
      if (
        q.equivalentFingerprint &&
        exposedEquivFps.has(q.equivalentFingerprint)
      )
        return true;
    }
    return false;
  };

  // Partition into Unseen vs Previously Exposed (sorted least-recently-exposed first)
  const unseenPool = shuffledAll.filter((q) => !isVisitorExposed(q));
  const cooldownMs = Math.max(0, rules.cooldownHours) * 3_600_000;
  const seenPool = shuffledAll
    .filter((q) => isVisitorExposed(q))
    .sort((a, b) => {
      const aTime = lastExposedMap.get(a.id)?.getTime() ?? 0;
      const bTime = lastExposedMap.get(b.id)?.getTime() ?? 0;
      return aTime - bTime; // oldest exposed first
    });

  // Check if unseen questions are sufficient (accounting for subject & equivalence constraints)
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

  // Build ordered candidate tiers:
  // Tier 1: Unseen questions
  // Tier 2 (only if controlled reuse needed): seen questions outside cooldown, then inside cooldown
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

  // Try up to 6 randomized sampling passes to satisfy recent-paper uniqueness & overlap threshold
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

    if (picked.length < questionCount) {
      continue;
    }

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

  // Final question order shuffling
  const finalQuestions = rules.shuffleQuestions
    ? secureShuffle(bestSelection)
    : bestSelection;

  const paperFingerprint = computePaperFingerprint(
    finalQuestions.map((q) => q.id),
  );

  // Build option mappings (respecting position-dependent options like "All of the above")
  const mappedQuestions: SelectedPaperQuestion[] = finalQuestions.map((q) => {
    const shouldShuffleOpts =
      rules.shuffleOptions &&
      q.type !== 'NUMERICAL' &&
      !isOptionOrderDependent(q.options);
    const optionMappings = createOptionMappings(q.options, shouldShuffleOpts);
    return {
      question: q,
      optionMappings,
    };
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

function countUniqueEquivalentQuestions(
  questions: CandidateQuestionRecord[],
): number {
  const seenCfp = new Set<string>();
  const seenEfp = new Set<string>();
  let count = 0;
  for (const q of questions) {
    if (q.contentFingerprint && seenCfp.has(q.contentFingerprint)) continue;
    if (q.equivalentFingerprint && seenEfp.has(q.equivalentFingerprint))
      continue;
    if (q.contentFingerprint) seenCfp.add(q.contentFingerprint);
    if (q.equivalentFingerprint) seenEfp.add(q.equivalentFingerprint);
    count += 1;
  }
  return count;
}

/**
 * Ranks a tier of questions using global exposure count + random jitter so
 * less-exposed questions are preferred without becoming predictably sequential.
 */
function rankTierWithBalancing(
  pool: CandidateQuestionRecord[],
  globalStats: Map<string, GlobalExposureStat>,
  recentUsage: Map<string, number>,
  enableBalancing: boolean,
  preserveRecencyOrder = false,
): CandidateQuestionRecord[] {
  const shuffled = secureShuffle(pool);
  if (preserveRecencyOrder) {
    // Keep least-recently-exposed order with slight jitter within same timestamp bucket
    return pool;
  }
  if (!enableBalancing) {
    return shuffled;
  }
  return shuffled
    .map((q, idx) => {
      const globalCount = globalStats.get(q.id)?.exposureCount ?? 0;
      const recentCount = recentUsage.get(q.id) ?? 0;
      // Add bounded random jitter [0, 1.5) so equally or closely exposed items shuffle freely
      const jitter = (idx % 7) * 0.12 + (secureRandomFraction() * 1.5);
      const score = globalCount * 1.0 + recentCount * 1.5 + jitter;
      return { q, score };
    })
    .sort((a, b) => a.score - b.score)
    .map((entry) => entry.q);
}

function secureRandomFraction(): number {
  const buf = secureShuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  return buf[0] / 10;
}

function pickBlueprintBalancedPaper(params: {
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
    if (q.contentFingerprint && usedContentFps.has(q.contentFingerprint))
      return false;
    if (q.equivalentFingerprint && usedEquivFps.has(q.equivalentFingerprint))
      return false;
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

  // Multi-pass selection:
  // Pass 1: Match subject target + difficulty target + diversity (chapter/type/image)
  // Pass 2: Match subject target (relax difficulty)
  // Pass 3: Fill remaining slots from any eligible non-duplicate in tiers
  for (const tier of tiers) {
    if (selected.length >= questionCount) break;

    // Pass 1: Strict subject + difficulty + diversity preference
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
        usedChapters.has(q.chapterId)
      ) {
        // Defer repeated chapter to pass 2 if other chapters might exist
        continue;
      }

      commit(q);
    }

    // Pass 2: Match subject target (allow repeated chapters or relaxed difficulty)
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

    // Pass 3: Fill any remaining slots if a particular subject lacked questions
    for (const q of tier) {
      if (selected.length >= questionCount) break;
      if (!canAdd(q)) continue;
      commit(q);
    }
  }

  return selected;
}
