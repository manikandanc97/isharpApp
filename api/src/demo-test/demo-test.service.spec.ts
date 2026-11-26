import { ForbiddenException, HttpException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { DemoTestConfigurationService } from './demo-test-configuration.service.js';
import {
  computeDifficultyTargets,
  evaluateQuestionEligibility,
  isOptionOrderDependent,
  type CandidateQuestionRecord,
} from './demo-test-eligibility.helper.js';
import { SlidingWindowRateLimiter } from './demo-test-rate-limit.helper.js';
import {
  computePaperFingerprint,
  selectDemoQuestions,
} from './demo-test-selection.engine.js';
import { DemoTestService } from './demo-test.service.js';
import {
  DEFAULT_DEMO_BLUEPRINTS,
  DEFAULT_DEMO_SELECTION_RULES,
} from './demo-test.types.js';

function makeQuestion(
  idx: number,
  subjectCode: 'PHYSICS' | 'CHEMISTRY' | 'BIOLOGY',
  overrides: Partial<CandidateQuestionRecord> = {},
): CandidateQuestionRecord {
  const subjName =
    subjectCode === 'PHYSICS'
      ? 'Physics'
      : subjectCode === 'CHEMISTRY'
        ? 'Chemistry'
        : 'Biology';
  return {
    id: `q-${subjectCode.toLowerCase()}-${idx}`,
    externalId: `${subjectCode.slice(0, 3)}-${idx}`,
    type: 'SINGLE_CORRECT',
    language: 'BILINGUAL',
    difficulty: idx % 3 === 0 ? 'HARD' : idx % 2 === 0 ? 'MEDIUM' : 'EASY',
    textEn: `${subjName} Question ${idx}`,
    textTa: `${subjName} வினா ${idx}`,
    questionImageUrl: null,
    solutionEn: `Solution ${idx}`,
    solutionTa: `தீர்வு ${idx}`,
    solutionImageUrl: null,
    numericalAnswer: null,
    contentFingerprint: `cfp-${subjectCode}-${idx}`,
    equivalentFingerprint: `efp-${subjectCode}-${idx}`,
    correctMarks: 4,
    negativeMarks: 1,
    isActive: true,
    isRestrictedForDemo: false,
    chapterId: `chap-${idx % 4}`,
    chapter: { id: `chap-${idx % 4}`, title: `Chapter ${idx % 4}` },
    courseSubject: { subject: { code: subjectCode, name: subjName } },
    options: [
      {
        id: `opt-${idx}-1`,
        label: 'A',
        textEn: 'Option 1',
        textTa: 'விடை 1',
        imageUrl: null,
        isCorrect: true,
        position: 1,
      },
      {
        id: `opt-${idx}-2`,
        label: 'B',
        textEn: 'Option 2',
        textTa: 'விடை 2',
        imageUrl: null,
        isCorrect: false,
        position: 2,
      },
      {
        id: `opt-${idx}-3`,
        label: 'C',
        textEn: 'Option 3',
        textTa: 'விடை 3',
        imageUrl: null,
        isCorrect: false,
        position: 3,
      },
      {
        id: `opt-${idx}-4`,
        label: 'D',
        textEn: 'Option 4',
        textTa: 'விடை 4',
        imageUrl: null,
        isCorrect: false,
        position: 4,
      },
    ],
    ...overrides,
  };
}

function buildPool(perSubject = 15): CandidateQuestionRecord[] {
  const pool: CandidateQuestionRecord[] = [];
  for (let i = 1; i <= perSubject; i++) {
    pool.push(makeQuestion(i, 'PHYSICS'));
    pool.push(makeQuestion(i + 100, 'CHEMISTRY'));
    pool.push(makeQuestion(i + 200, 'BIOLOGY'));
  }
  return pool;
}

describe('Enterprise Demo Test System', () => {
  describe('Eligibility & Option Order Safety', () => {
    it('excludes restricted, inactive, and incomplete Tamil questions', () => {
      const restricted = makeQuestion(1, 'PHYSICS', { isRestrictedForDemo: true });
      const inactive = makeQuestion(2, 'PHYSICS', { isActive: false });
      const noTamil = makeQuestion(3, 'PHYSICS', { textTa: '' });

      expect(evaluateQuestionEligibility(restricted, 'en').eligible).toBe(false);
      expect(evaluateQuestionEligibility(inactive, 'en').eligible).toBe(false);
      expect(evaluateQuestionEligibility(noTamil, 'en').eligible).toBe(true);
      expect(evaluateQuestionEligibility(noTamil, 'ta').eligible).toBe(false);
    });

    it('detects position-dependent options and disables shuffling for them', () => {
      expect(
        isOptionOrderDependent([
          { textEn: 'Option A' },
          { textEn: 'All of the above' },
        ]),
      ).toBe(true);
      expect(
        isOptionOrderDependent([
          { textEn: 'Both A and B' },
          { textEn: 'Only C' },
        ]),
      ).toBe(true);
      expect(
        isOptionOrderDependent([
          { textTa: 'மேற்கண்ட அனைத்தும்' },
          { textTa: 'விடை 2' },
        ]),
      ).toBe(true);
      expect(
        isOptionOrderDependent([
          { textEn: 'Newton' },
          { textEn: 'Joule' },
        ]),
      ).toBe(false);
    });

    it('rounds difficulty targets accurately for 6, 9, and 12 question papers', () => {
      for (const count of [6, 9, 12]) {
        const t = computeDifficultyTargets(count, { EASY: 40, MEDIUM: 40, HARD: 20 });
        expect(t.EASY + t.MEDIUM + t.HARD).toBe(count);
      }
    });
  });

  describe('Dynamic Random Selection Engine', () => {
    it('prevents repeat questions across consecutive attempts for the same visitor', () => {
      const pool = buildPool(10); // 30 questions total
      const blueprint = DEFAULT_DEMO_BLUEPRINTS[1]; // 9 Qs

      const res1 = selectDemoQuestions({
        candidates: pool,
        subjectMode: 'ALL',
        languageMode: 'ta',
        questionCount: 9,
        blueprint,
        rules: DEFAULT_DEMO_SELECTION_RULES,
        visitorExposures: [],
        globalStats: new Map(),
        recentPapers: [],
      });

      const seen1 = res1.questions.map((q) => ({
        questionId: q.question.id,
        contentFingerprint: q.question.contentFingerprint,
        equivalentFingerprint: q.question.equivalentFingerprint,
        lastExposedAt: new Date(),
      }));

      const res2 = selectDemoQuestions({
        candidates: pool,
        subjectMode: 'ALL',
        languageMode: 'ta',
        questionCount: 9,
        blueprint,
        rules: DEFAULT_DEMO_SELECTION_RULES,
        visitorExposures: seen1,
        globalStats: new Map(),
        recentPapers: [
          {
            paperFingerprint: res1.paperFingerprint,
            questionIds: seen1.map((s) => s.questionId),
          },
        ],
      });

      const ids1 = new Set(res1.questions.map((q) => q.question.id));
      const ids2 = new Set(res2.questions.map((q) => q.question.id));
      for (const id of ids2) {
        expect(ids1.has(id)).toBe(false);
      }
      expect(res2.controlledReuseUsed).toBe(false);
    });

    it('prevents equivalent duplicate questions within a paper and across visitor attempts', () => {
      const pool = [
        makeQuestion(1, 'PHYSICS', { equivalentFingerprint: 'equiv-shared' }),
        makeQuestion(2, 'PHYSICS', { equivalentFingerprint: 'equiv-shared' }),
        makeQuestion(3, 'PHYSICS'),
        makeQuestion(4, 'PHYSICS'),
        makeQuestion(5, 'PHYSICS'),
        makeQuestion(6, 'PHYSICS'),
        makeQuestion(7, 'PHYSICS'),
      ];

      const res = selectDemoQuestions({
        candidates: pool,
        subjectMode: 'PHYSICS',
        languageMode: 'en',
        questionCount: 6,
        rules: DEFAULT_DEMO_SELECTION_RULES,
        visitorExposures: [],
        globalStats: new Map(),
        recentPapers: [],
      });

      const equivs = res.questions.map((q) => q.question.equivalentFingerprint);
      expect(new Set(equivs).size).toBe(6);
    });

    it('handles pool exhaustion in strictNoRepeat mode and controlled reuse mode', () => {
      const pool = buildPool(2); // 6 questions total
      const exposures = pool.map((q, idx) => ({
        questionId: q.id,
        contentFingerprint: q.contentFingerprint,
        equivalentFingerprint: q.equivalentFingerprint,
        lastExposedAt: new Date(Date.now() - (10 - idx) * 3_600_000),
      }));

      expect(() =>
        selectDemoQuestions({
          candidates: pool,
          subjectMode: 'ALL',
          languageMode: 'en',
          questionCount: 6,
          rules: { ...DEFAULT_DEMO_SELECTION_RULES, strictNoRepeat: true },
          visitorExposures: exposures,
          globalStats: new Map(),
          recentPapers: [],
        }),
      ).toThrow(/POOL_EXHAUSTED_STRICT/);

      const reuseRes = selectDemoQuestions({
        candidates: pool,
        subjectMode: 'ALL',
        languageMode: 'en',
        questionCount: 6,
        rules: {
          ...DEFAULT_DEMO_SELECTION_RULES,
          strictNoRepeat: false,
          smartReuseAfterExhaustion: true,
        },
        visitorExposures: exposures,
        globalStats: new Map(),
        recentPapers: [],
      });

      expect(reuseRes.controlledReuseUsed).toBe(true);
      expect(reuseRes.poolExhausted).toBe(true);
      expect(reuseRes.questions).toHaveLength(6);
    });

    it('generates different paper combinations for different visitors when pool permits', () => {
      const pool = buildPool(20); // 60 questions
      const fps = new Set<string>();
      for (let v = 0; v < 5; v++) {
        const res = selectDemoQuestions({
          candidates: pool,
          subjectMode: 'ALL',
          languageMode: 'en',
          questionCount: 9,
          blueprint: DEFAULT_DEMO_BLUEPRINTS[1],
          rules: DEFAULT_DEMO_SELECTION_RULES,
          visitorExposures: [],
          globalStats: new Map(),
          recentPapers: [],
        });
        fps.add(computePaperFingerprint(res.questions.map((q) => q.question.id)));
      }
      expect(fps.size).toBeGreaterThan(1);
    });
  });

  describe('Security, Attempt Lifecycle & Pool Safety', () => {
    it('automatically pulls active, non-restricted Question Bank records excluding upcoming exams', async () => {
      const findManySpy = vi.fn().mockResolvedValue([]);
      const prismaMock = {
        question: { findMany: findManySpy },
      } as unknown as PrismaService;
      const configService = new DemoTestConfigurationService(prismaMock);

      const candidates = await configService.fetchPoolCandidates();
      expect(candidates).toEqual([]);
      expect(findManySpy).toHaveBeenCalledTimes(1);
      const whereArg = findManySpy.mock.calls[0][0].where;
      expect(whereArg.isActive).toBe(true);
      expect(whereArg.isRestrictedForDemo).toBe(false);
      expect(whereArg.assessmentQuestions).toBeDefined();
    });

    it('verifies guest visitor tokens and rejects tampered tokens', () => {
      const prismaMock = {} as PrismaService;
      const configMock = {} as DemoTestConfigurationService;
      const service = new DemoTestService(prismaMock, configMock);

      const token = service.issueGuestToken();
      expect(service.verifyGuestToken(token)).not.toBeNull();
      expect(service.verifyGuestToken(`${token}tamper`)).toBeNull();
      expect(service.verifyGuestToken('invalid')).toBeNull();
    });

    it('never exposes correct answers or solutions while attempt is IN_PROGRESS and blocks unauthorized visitors', async () => {
      const q = makeQuestion(1, 'PHYSICS');
      const attemptRecord = {
        id: 'attempt-1',
        visitorId: 'visitor-owner',
        isPreview: false,
        status: 'IN_PROGRESS',
        title: 'Free NEET Demo Test',
        code: 'NEET-DEMO-2026',
        instructionsEn: 'En',
        instructionsTa: 'Ta',
        subjectMode: 'PHYSICS',
        languageMode: 'en',
        durationMinutes: 15,
        maxMarks: 4,
        questionCount: 1,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 600_000),
        controlledReuseUsed: false,
        resultSnapshot: null,
        questions: [
          {
            id: 'aq-1',
            questionId: q.id,
            position: 1,
            optionOrderJson: q.options.map((o, i) => ({
              canonicalOptionId: o.id,
              shuffledPosition: i + 1,
              displayedLabel: String(i + 1),
            })),
            selectedOptionId: null,
            numericalAnswer: null,
            isMarkedForReview: false,
            isVisited: true,
            timeSpentSeconds: 0,
            correctMarks: 4,
            negativeMarks: 1,
            isCorrect: null,
            marksAwarded: 0,
            question: q,
          },
        ],
      };

      const prismaMock = {
        demoAttempt: { findUnique: vi.fn().mockResolvedValue(attemptRecord) },
      } as unknown as PrismaService;
      const service = new DemoTestService(
        prismaMock,
        {} as DemoTestConfigurationService,
      );

      await expect(
        service.getAttemptForClient('attempt-1', 'visitor-attacker', false),
      ).rejects.toThrow(ForbiddenException);

      const clientPayload = (await service.getAttemptForClient(
        'attempt-1',
        'visitor-owner',
        false,
      )) as {
        questions: Array<{
          solutionEn?: string;
          options: Array<{ isCorrect?: boolean }>;
        }>;
      };

      expect(clientPayload.questions[0].solutionEn).toBeUndefined();
      expect(clientPayload.questions[0].options[0].isCorrect).toBeUndefined();
    });

    it('enforces rate limiting on public demo endpoints', () => {
      const limiter = new SlidingWindowRateLimiter(2, 60_000);
      limiter.consume('v1:1.2.3.4');
      limiter.consume('v1:1.2.3.4');
      expect(() => limiter.consume('v1:1.2.3.4')).toThrow(HttpException);
    });

    it('persists and normalizes multi-type countOptions and full selectionRules in DemoTestConfigurationService', async () => {
      let storedRecord: Record<string, unknown> | null = null;
      const prismaMock = {
        demoTestConfiguration: {
          findUnique: vi.fn(async () => storedRecord),
          upsert: vi.fn(async ({ create }: { create: Record<string, unknown> }) => {
            storedRecord = { ...create };
            return storedRecord;
          }),
        },
        demoAdminAuditLog: {
          create: vi.fn(async () => ({ id: 'audit-1' })),
        },
      } as unknown as PrismaService;

      const configService = new DemoTestConfigurationService(prismaMock);
      const updated = await configService.update(
        {
          isEnabled: true,
          title: 'Custom NEET Demo',
          code: 'NEET-CUSTOM',
          allowedSubjects: ['PHYSICS', 'CHEMISTRY', 'BIOLOGY'],
          defaultSubject: 'ALL',
          allowedLanguages: ['en', 'ta'],
          defaultLanguage: 'en',
          defaultQuestionCount: 18,
          countOptions: [
            { count: 9, durationMinutes: 15, label: 'Quick Sprint' },
            { count: 18, durationMinutes: 30, label: 'Mini Mock' },
            { count: 45, durationMinutes: 60, label: 'Subject Mock' },
          ],
          selectionRules: {
            visitorRepeatPrevention: true,
            strictNoRepeat: true,
            smartReuseAfterExhaustion: false,
            shuffleQuestions: true,
            shuffleOptions: true,
            weightingMode: 'EQUAL',
          },
          guestAccessEnabled: false,
        },
        'admin-1',
      );

      expect(updated.title).toBe('Custom NEET Demo');
      expect(updated.code).toBe('NEET-CUSTOM');
      expect(updated.defaultLanguage).toBe('en');
      expect(updated.defaultQuestionCount).toBe(18);
      expect(updated.defaultDurationMinutes).toBe(30);
      expect(updated.countOptions).toHaveLength(3);
      expect(updated.blueprints).toHaveLength(3);
      expect(updated.selectionRules.strictNoRepeat).toBe(true);
      expect(updated.selectionRules.weightingMode).toBe('EQUAL');
      expect(updated.guestAccessEnabled).toBe(false);
    });

    it('never repeats questions for the same visitor across multiple consecutive attempts while unseen questions exist', () => {
      const pool = buildPool(10); // 30 total questions (10 per subject)
      const exposures: Array<{
        questionId: string;
        contentFingerprint: string | null;
        equivalentFingerprint: string | null;
        lastExposedAt: Date;
      }> = [];
      const seenIds = new Set<string>();

      for (let attempt = 0; attempt < 3; attempt++) {
        const result = selectDemoQuestions({
          candidates: pool,
          subjectMode: 'ALL',
          languageMode: 'ta',
          questionCount: 9,
          rules: {
            ...DEFAULT_DEMO_SELECTION_RULES,
            visitorRepeatPrevention: true,
            strictNoRepeat: true,
          },
          visitorExposures: exposures,
          globalStats: new Map(),
          recentPapers: [],
        });

        expect(result.questions).toHaveLength(9);
        for (const item of result.questions) {
          expect(seenIds.has(item.question.id)).toBe(false);
          seenIds.add(item.question.id);
          exposures.push({
            questionId: item.question.id,
            contentFingerprint: item.question.contentFingerprint,
            equivalentFingerprint: item.question.equivalentFingerprint,
            lastExposedAt: new Date(),
          });
        }
      }

      expect(seenIds.size).toBe(27);
    });
  });
});
