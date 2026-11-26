import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { DemoTestConfigurationService } from './demo-test-configuration.service.js';
import { selectDemoQuestions } from './demo-test-selection.engine.js';
import type {
  LanguageMode,
  ShuffledOptionMapping,
  SubjectMode,
} from './demo-test.types.js';

export interface StartDemoAttemptInput {
  subject?: string;
  language?: string;
  questionCount?: number;
  idempotencyKey?: string;
  isPreview?: boolean;
}

export interface SaveDemoAnswerInput {
  questionId: string;
  selectedOptionId?: string | null;
  numericalAnswer?: string | null;
  isMarkedForReview?: boolean;
  isVisited?: boolean;
  timeSpentSeconds?: number;
}

@Injectable()
export class DemoTestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configuration: DemoTestConfigurationService,
  ) {}

  private getSigningSecret(): string {
    return (
      process.env.DEMO_VISITOR_SECRET ||
      process.env.SUPABASE_JWT_SECRET ||
      'isharp-demo-visitor-signing-key-2026'
    );
  }

  /**
   * Issues a tamper-evident guest visitor token (tokenId.hmac).
   */
  issueGuestToken(): string {
    const rawId = randomBytes(24).toString('hex');
    const sig = createHmac('sha256', this.getSigningSecret())
      .update(rawId)
      .digest('hex');
    return `${rawId}.${sig}`;
  }

  /**
   * Verifies a guest visitor token using constant-time comparison.
   */
  verifyGuestToken(token?: string | null): string | null {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [rawId, sig] = parts;
    if (!rawId || !sig || rawId.length < 16) return null;
    const expected = createHmac('sha256', this.getSigningSecret())
      .update(rawId)
      .digest('hex');
    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }
    return rawId;
  }

  hashGuestId(rawId: string): string {
    return createHash('sha256').update(rawId).digest('hex');
  }

  /**
   * Resolves or creates a persistent DemoVisitor record.
   * If `userProfileId` is provided alongside a guest cookie, safely links them.
   */
  async resolveOrCreateVisitor(params: {
    guestToken?: string | null;
    userProfileId?: string | null;
  }): Promise<{ visitorId: string; guestToken: string; isNewCookie: boolean }> {
    const verifiedRaw = this.verifyGuestToken(params.guestToken);
    const guestToken = verifiedRaw ? params.guestToken! : this.issueGuestToken();
    const rawId = verifiedRaw ?? guestToken.split('.')[0];
    const tokenHash = this.hashGuestId(rawId);

    if (params.userProfileId) {
      const byUser = await this.prisma.demoVisitor.findUnique({
        where: { userProfileId: params.userProfileId },
      });
      if (byUser) {
        await this.prisma.demoVisitor.update({
          where: { id: byUser.id },
          data: { lastSeenAt: new Date() },
        });
        return { visitorId: byUser.id, guestToken, isNewCookie: !verifiedRaw };
      }
    }

    const byToken = await this.prisma.demoVisitor.findUnique({
      where: { guestTokenHash: tokenHash },
    });

    if (byToken) {
      if (params.userProfileId && !byToken.userProfileId) {
        await this.prisma.demoVisitor.update({
          where: { id: byToken.id },
          data: { userProfileId: params.userProfileId, lastSeenAt: new Date() },
        });
      } else {
        await this.prisma.demoVisitor.update({
          where: { id: byToken.id },
          data: { lastSeenAt: new Date() },
        });
      }
      return { visitorId: byToken.id, guestToken, isNewCookie: !verifiedRaw };
    }

    const created = await this.prisma.demoVisitor.create({
      data: {
        guestTokenHash: tokenHash,
        userProfileId: params.userProfileId ?? null,
      },
    });

    return { visitorId: created.id, guestToken, isNewCookie: true };
  }

  async startAttempt(params: {
    visitorId: string;
    userProfileId?: string | null;
    input: StartDemoAttemptInput;
  }) {
    const { visitorId, userProfileId, input } = params;
    const isPreview = Boolean(input.isPreview);

    // Idempotency check
    if (input.idempotencyKey?.trim()) {
      const existing = await this.prisma.demoAttempt.findUnique({
        where: { idempotencyKey: input.idempotencyKey.trim() },
      });
      if (existing) {
        if (existing.visitorId !== visitorId && !isPreview) {
          throw new ForbiddenException('Attempt belongs to another visitor');
        }
        return this.getAttemptForClient(existing.id, visitorId, isPreview);
      }
    }

    const config = await this.configuration.get(isPreview);
    if (!isPreview && !config.isEnabled) {
      throw new ServiceUnavailableException('The demo test is currently disabled');
    }
    if (!isPreview && !config.guestAccessEnabled && !userProfileId) {
      throw new ForbiddenException('Please sign in to take the demo test');
    }

    const requestedSubject = (input.subject ?? config.defaultSubject)
      .trim()
      .toUpperCase() as SubjectMode;
    const subjectMode: SubjectMode = config.allowedSubjects.includes(requestedSubject)
      ? requestedSubject
      : config.defaultSubject;

    const requestedLang = (input.language ?? config.defaultLanguage)
      .trim()
      .toLowerCase() as LanguageMode;
    const languageMode: LanguageMode = config.allowedLanguages.includes(requestedLang)
      ? requestedLang
      : config.defaultLanguage;

    const requestedCount = Number(input.questionCount ?? config.defaultQuestionCount);
    const blueprint =
      config.blueprints.find((bp) => bp.count === requestedCount) ??
      config.blueprints.find((bp) => bp.count === config.defaultQuestionCount) ??
      config.blueprints[0];

    if (!blueprint) {
      throw new ServiceUnavailableException('No valid demo blueprint configured');
    }

    const candidates = await this.configuration.fetchPoolCandidates(config.poolMode);
    if (!candidates.length) {
      throw new ServiceUnavailableException(
        'No eligible questions are currently configured in the Demo Question Pool.',
      );
    }

    // Load visitor exposure history (skip for admin previews so previews never contaminate production)
    const [visitorExposures, globalStatsRows, recentAttemptRows] = await Promise.all([
      isPreview
        ? Promise.resolve([])
        : this.prisma.demoVisitorQuestionExposure.findMany({
            where: { visitorId },
            select: {
              questionId: true,
              contentFingerprint: true,
              equivalentFingerprint: true,
              lastExposedAt: true,
            },
          }),
      this.prisma.demoQuestionGlobalStat.findMany({
        select: { questionId: true, exposureCount: true, lastExposedAt: true },
      }),
      this.prisma.demoAttempt.findMany({
        where: { isPreview: false },
        orderBy: { createdAt: 'desc' },
        take: config.selectionRules.recentPaperWindow,
        select: {
          paperFingerprint: true,
          questions: { select: { questionId: true } },
        },
      }),
    ]);

    const globalStats = new Map(
      globalStatsRows.map((row) => [row.questionId, row]),
    );
    const recentPapers = recentAttemptRows.map((row) => ({
      paperFingerprint: row.paperFingerprint,
      questionIds: row.questions.map((q) => q.questionId),
    }));

    let selection;
    try {
      selection = selectDemoQuestions({
        candidates,
        subjectMode,
        languageMode,
        questionCount: blueprint.count,
        blueprint,
        rules: config.selectionRules,
        visitorExposures,
        globalStats,
        recentPapers,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to generate demo paper';
      if (msg.startsWith('POOL_EXHAUSTED_STRICT')) {
        if (!isPreview) {
          await this.prisma.demoAnalyticsEvent.create({
            data: {
              visitorId,
              eventType: 'POOL_EXHAUSTION',
              subjectMode,
              languageMode,
              metadata: { reason: msg } as never,
            },
          });
        }
        throw new ConflictException(
          'You have already completed all available fresh questions for this selection. Please try another subject or contact iSharp Academy.',
        );
      }
      throw new ServiceUnavailableException(msg);
    }

    const startedAt = new Date();
    const expiresAt = new Date(
      startedAt.getTime() + blueprint.durationMinutes * 60_000,
    );
    const maxMarks = selection.questions.reduce(
      (sum, item) => sum + (item.question.correctMarks ?? 4),
      0,
    );

    const createdAttempt = await this.prisma.$transaction(async (tx) => {
      const attempt = await tx.demoAttempt.create({
        data: {
          visitorId,
          userProfileId: userProfileId ?? null,
          configVersionId: null,
          isPreview,
          status: 'IN_PROGRESS',
          subjectMode,
          languageMode,
          questionCount: selection.questions.length,
          durationMinutes: blueprint.durationMinutes,
          maxMarks,
          title: config.title,
          code: config.code,
          instructionsEn: config.instructionsEn,
          instructionsTa: config.instructionsTa,
          paperFingerprint: selection.paperFingerprint,
          controlledReuseUsed: selection.controlledReuseUsed,
          poolExhausted: selection.poolExhausted,
          startedAt,
          expiresAt,
          idempotencyKey: input.idempotencyKey?.trim() || null,
          questions: {
            create: selection.questions.map((item, idx) => ({
              questionId: item.question.id,
              position: idx + 1,
              optionOrderJson: item.optionMappings as never,
              isVisited: idx === 0,
              correctMarks: item.question.correctMarks ?? 4,
              negativeMarks: item.question.negativeMarks ?? 1,
            })),
          },
        },
      });

      if (!isPreview) {
        await tx.demoVisitor.update({
          where: { id: visitorId },
          data: { totalAttempts: { increment: 1 }, lastSeenAt: startedAt },
        });

        for (const item of selection.questions) {
          const q = item.question;
          await tx.demoVisitorQuestionExposure.upsert({
            where: {
              visitorId_questionId: { visitorId, questionId: q.id },
            },
            create: {
              visitorId,
              questionId: q.id,
              contentFingerprint: q.contentFingerprint,
              equivalentFingerprint: q.equivalentFingerprint,
              exposureCount: 1,
              firstExposedAt: startedAt,
              lastExposedAt: startedAt,
            },
            update: {
              exposureCount: { increment: 1 },
              lastExposedAt: startedAt,
            },
          });

          await tx.demoQuestionGlobalStat.upsert({
            where: { questionId: q.id },
            create: {
              questionId: q.id,
              exposureCount: 1,
              lastExposedAt: startedAt,
            },
            update: {
              exposureCount: { increment: 1 },
              lastExposedAt: startedAt,
            },
          });
        }

        await tx.demoAnalyticsEvent.create({
          data: {
            visitorId,
            attemptId: attempt.id,
            eventType: selection.controlledReuseUsed
              ? 'CONTROLLED_REUSE'
              : 'ATTEMPT_STARTED',
            subjectMode,
            languageMode,
            metadata: {
              questionCount: selection.questions.length,
              durationMinutes: blueprint.durationMinutes,
            } as never,
          },
        });
      }

      return attempt;
    });

    return this.getAttemptForClient(createdAttempt.id, visitorId, isPreview);
  }

  /**
   * Returns attempt state for the exam runner.
   * NEVER exposes isCorrect, numericalAnswer, solutionEn, solutionTa, or solutionImageUrl while IN_PROGRESS!
   */
  async getAttemptForClient(
    attemptId: string,
    visitorId: string,
    allowAdminPreview = false,
  ): Promise<Record<string, unknown>> {
    const attempt = await this.prisma.demoAttempt.findUnique({
      where: { id: attemptId },
      include: {
        questions: {
          orderBy: { position: 'asc' },
          include: {
            question: {
              include: {
                options: true,
                chapter: { select: { id: true, title: true } },
                courseSubject: {
                  include: { subject: { select: { code: true, name: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Demo attempt not found');
    }
    if (attempt.visitorId !== visitorId && !(allowAdminPreview && attempt.isPreview)) {
      throw new ForbiddenException('You do not have access to this demo attempt');
    }

    // Auto-expire if time has elapsed while still IN_PROGRESS
    if (attempt.status === 'IN_PROGRESS' && new Date() > attempt.expiresAt) {
      return this.finalizeAttempt(attempt.id, visitorId, 'EXPIRED');
    }

    const isFinished =
      attempt.status === 'SUBMITTED' || attempt.status === 'EXPIRED';

    const subjectCounts = new Map<
      string,
      { name: string; code: string; count: number }
    >();

    const questions = attempt.questions.map((aq) => {
      const q = aq.question;
      const subjCode = q.courseSubject?.subject?.code ?? 'GENERAL';
      const subjName = q.courseSubject?.subject?.name ?? 'General';
      const existingSubj = subjectCounts.get(subjCode);
      if (existingSubj) existingSubj.count += 1;
      else subjectCounts.set(subjCode, { name: subjName, code: subjCode, count: 1 });

      const mappings = (Array.isArray(aq.optionOrderJson)
        ? aq.optionOrderJson
        : []) as unknown as ShuffledOptionMapping[];
      const optionById = new Map(q.options.map((o) => [o.id, o]));

      const orderedOptions = mappings
        .map((m) => {
          const opt = optionById.get(m.canonicalOptionId);
          if (!opt) return null;
          return {
            id: opt.id,
            label: m.displayedLabel,
            textEn: opt.textEn ?? '',
            textTa: opt.textTa,
            imageUrl: opt.imageUrl,
            position: m.shuffledPosition,
            // SECURITY: Only include isCorrect after submission/expiry
            ...(isFinished ? { isCorrect: opt.isCorrect } : {}),
          };
        })
        .filter((o): o is NonNullable<typeof o> => o !== null);

      return {
        id: q.id,
        externalId: q.externalId,
        type: q.type,
        subject: subjName,
        subjectCode: subjCode,
        chapterTitle: q.chapter?.title ?? null,
        difficulty: q.difficulty,
        textEn: q.textEn ?? '',
        textTa: q.textTa,
        questionImageUrl: q.questionImageUrl,
        correctMarks: aq.correctMarks,
        negativeMarks: aq.negativeMarks,
        options: orderedOptions,
        savedState: {
          selectedOptionId: aq.selectedOptionId,
          numericalAnswer: aq.numericalAnswer,
          isMarkedForReview: aq.isMarkedForReview,
          isVisited: aq.isVisited,
          timeSpentSeconds: aq.timeSpentSeconds,
        },
        ...(isFinished
          ? {
              solutionEn: q.solutionEn,
              solutionTa: q.solutionTa,
              solutionImageUrl: q.solutionImageUrl,
              correctNumericalAnswer: q.numericalAnswer,
              isCorrect: aq.isCorrect,
              marksAwarded: aq.marksAwarded,
            }
          : {}),
      };
    });

    const nowMs = Date.now();
    const remainingSeconds = Math.max(
      0,
      Math.floor((attempt.expiresAt.getTime() - nowMs) / 1000),
    );

    return {
      attemptId: attempt.id,
      testId: attempt.id,
      status: attempt.status,
      isPreview: attempt.isPreview,
      title: attempt.title,
      code: attempt.code,
      instructionsEn: attempt.instructionsEn ?? '',
      instructionsTa: attempt.instructionsTa ?? '',
      subjectMode: attempt.subjectMode,
      languageMode: attempt.languageMode,
      durationMinutes: attempt.durationMinutes,
      totalMarks: attempt.maxMarks,
      questionCount: attempt.questionCount,
      startedAt: attempt.startedAt.toISOString(),
      expiresAt: attempt.expiresAt.toISOString(),
      remainingSeconds,
      controlledReuseUsed: attempt.controlledReuseUsed,
      subjects: Array.from(subjectCounts.values()),
      questions,
      ...(isFinished && attempt.resultSnapshot
        ? { result: attempt.resultSnapshot }
        : {}),
    };
  }

  async saveAnswer(
    attemptId: string,
    visitorId: string,
    input: SaveDemoAnswerInput,
  ) {
    const attempt = await this.prisma.demoAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true, visitorId: true, status: true, expiresAt: true },
    });
    if (!attempt) throw new NotFoundException('Demo attempt not found');
    if (attempt.visitorId !== visitorId) {
      throw new ForbiddenException('Unauthorized attempt access');
    }
    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Attempt is already finalized');
    }
    if (new Date() > attempt.expiresAt) {
      await this.finalizeAttempt(attemptId, visitorId, 'EXPIRED');
      throw new BadRequestException('Attempt time has expired');
    }

    const aq = await this.prisma.demoAttemptQuestion.findUnique({
      where: {
        attemptId_questionId: { attemptId, questionId: input.questionId },
      },
      include: { question: { include: { options: { select: { id: true } } } } },
    });
    if (!aq) {
      throw new BadRequestException('Question does not belong to this attempt');
    }

    if (input.selectedOptionId) {
      const validOpt = aq.question.options.some(
        (o) => o.id === input.selectedOptionId,
      );
      if (!validOpt) {
        throw new BadRequestException('Invalid option for this question');
      }
    }

    await this.prisma.demoAttemptQuestion.update({
      where: { id: aq.id },
      data: {
        ...(input.selectedOptionId !== undefined
          ? { selectedOptionId: input.selectedOptionId }
          : {}),
        ...(input.numericalAnswer !== undefined
          ? { numericalAnswer: input.numericalAnswer?.slice(0, 100) ?? null }
          : {}),
        ...(input.isMarkedForReview !== undefined
          ? { isMarkedForReview: Boolean(input.isMarkedForReview) }
          : {}),
        ...(input.isVisited !== undefined
          ? { isVisited: Boolean(input.isVisited) }
          : {}),
        ...(typeof input.timeSpentSeconds === 'number' &&
        input.timeSpentSeconds >= 0
          ? { timeSpentSeconds: Math.min(86400, Math.floor(input.timeSpentSeconds)) }
          : {}),
      },
    });

    return { saved: true };
  }

  async submitAttempt(
    attemptId: string,
    visitorId: string,
    answersPayload?: Record<string, SaveDemoAnswerInput>,
  ) {
    const attempt = await this.prisma.demoAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true, visitorId: true, status: true },
    });
    if (!attempt) throw new NotFoundException('Demo attempt not found');
    if (attempt.visitorId !== visitorId) {
      throw new ForbiddenException('Unauthorized attempt access');
    }

    // Idempotent submission: if already submitted/expired, return finalized state
    if (attempt.status === 'SUBMITTED' || attempt.status === 'EXPIRED') {
      return this.getAttemptForClient(attemptId, visitorId, true);
    }

    if (answersPayload && typeof answersPayload === 'object') {
      for (const [qId, ans] of Object.entries(answersPayload)) {
        if (!ans || typeof ans !== 'object') continue;
        await this.prisma.demoAttemptQuestion
          .updateMany({
            where: { attemptId, questionId: qId },
            data: {
              ...(ans.selectedOptionId !== undefined
                ? { selectedOptionId: ans.selectedOptionId }
                : {}),
              ...(ans.numericalAnswer !== undefined
                ? { numericalAnswer: ans.numericalAnswer?.slice(0, 100) ?? null }
                : {}),
              ...(ans.isMarkedForReview !== undefined
                ? { isMarkedForReview: Boolean(ans.isMarkedForReview) }
                : {}),
              ...(ans.isVisited !== undefined
                ? { isVisited: Boolean(ans.isVisited) }
                : {}),
              ...(typeof ans.timeSpentSeconds === 'number' &&
              ans.timeSpentSeconds >= 0
                ? {
                    timeSpentSeconds: Math.min(
                      86400,
                      Math.floor(ans.timeSpentSeconds),
                    ),
                  }
                : {}),
            },
          })
          .catch(() => {});
      }
    }

    return this.finalizeAttempt(attemptId, visitorId, 'SUBMITTED');
  }

  private async finalizeAttempt(
    attemptId: string,
    visitorId: string,
    targetStatus: 'SUBMITTED' | 'EXPIRED',
  ): Promise<Record<string, unknown>> {
    const attempt = await this.prisma.demoAttempt.findUnique({
      where: { id: attemptId },
      include: {
        questions: {
          orderBy: { position: 'asc' },
          include: {
            question: {
              include: {
                options: true,
                chapter: { select: { title: true } },
                courseSubject: {
                  include: { subject: { select: { code: true, name: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) throw new NotFoundException('Demo attempt not found');
    if (attempt.status === 'SUBMITTED' || attempt.status === 'EXPIRED') {
      return this.getAttemptForClient(attemptId, visitorId, true);
    }

    const now = new Date();
    const elapsedSeconds = Math.min(
      attempt.durationMinutes * 60,
      Math.max(0, Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000)),
    );

    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const subjectStatsMap = new Map<
      string,
      {
        subjectName: string;
        subjectCode: string;
        total: number;
        attempted: number;
        correct: number;
        wrong: number;
        skipped: number;
        marksObtained: number;
        maxMarks: number;
        accuracy: number;
        timeSpentSeconds: number;
      }
    >();

    const chapterStatsMap = new Map<
      string,
      { chapterTitle: string; total: number; correct: number; wrong: number; skipped: number }
    >();

    const questionUpdates: Array<{
      id: string;
      isCorrect: boolean | null;
      marksAwarded: number;
    }> = [];

    for (const aq of attempt.questions) {
      const q = aq.question;
      const subjCode = q.courseSubject?.subject?.code ?? 'GENERAL';
      const subjName = q.courseSubject?.subject?.name ?? 'General';
      if (!subjectStatsMap.has(subjCode)) {
        subjectStatsMap.set(subjCode, {
          subjectName: subjName,
          subjectCode: subjCode,
          total: 0,
          attempted: 0,
          correct: 0,
          wrong: 0,
          skipped: 0,
          marksObtained: 0,
          maxMarks: 0,
          accuracy: 0,
          timeSpentSeconds: 0,
        });
      }
      const sStat = subjectStatsMap.get(subjCode)!;
      sStat.total += 1;
      sStat.maxMarks += aq.correctMarks;
      sStat.timeSpentSeconds += aq.timeSpentSeconds;

      const chTitle = q.chapter?.title ?? null;
      if (chTitle && !chapterStatsMap.has(chTitle)) {
        chapterStatsMap.set(chTitle, {
          chapterTitle: chTitle,
          total: 0,
          correct: 0,
          wrong: 0,
          skipped: 0,
        });
      }
      const cStat = chTitle ? chapterStatsMap.get(chTitle)! : null;
      if (cStat) cStat.total += 1;

      const hasAttempted =
        q.type === 'NUMERICAL'
          ? Boolean(aq.numericalAnswer?.trim())
          : Boolean(aq.selectedOptionId);

      if (!hasAttempted) {
        unansweredCount += 1;
        sStat.skipped += 1;
        if (cStat) cStat.skipped += 1;
        questionUpdates.push({ id: aq.id, isCorrect: null, marksAwarded: 0 });
        continue;
      }

      sStat.attempted += 1;
      let isCorrect = false;
      if (q.type === 'NUMERICAL') {
        isCorrect =
          (aq.numericalAnswer?.trim() ?? '') ===
          (q.numericalAnswer?.trim() ?? '');
      } else {
        const chosenOpt = q.options.find((o) => o.id === aq.selectedOptionId);
        isCorrect = Boolean(chosenOpt?.isCorrect);
      }

      const marksAwarded = isCorrect ? aq.correctMarks : -aq.negativeMarks;
      totalScore += marksAwarded;
      sStat.marksObtained += marksAwarded;

      if (isCorrect) {
        correctCount += 1;
        sStat.correct += 1;
        if (cStat) cStat.correct += 1;
      } else {
        incorrectCount += 1;
        sStat.wrong += 1;
        if (cStat) cStat.wrong += 1;
      }
      questionUpdates.push({ id: aq.id, isCorrect, marksAwarded });
    }

    const attempted = correctCount + incorrectCount;
    const accuracy =
      attempted > 0 ? Math.round((correctCount / attempted) * 1000) / 10 : 0;
    const percentage =
      attempt.maxMarks > 0
        ? Math.max(0, Math.round((totalScore / attempt.maxMarks) * 1000) / 10)
        : 0;

    const subjectStats = Array.from(subjectStatsMap.values()).map((s) => ({
      ...s,
      accuracy:
        s.attempted > 0 ? Math.round((s.correct / s.attempted) * 1000) / 10 : 0,
    }));

    const resultSnapshot = {
      testId: attempt.id,
      totalQuestions: attempt.questionCount,
      attempted,
      correctCount,
      wrongCount: incorrectCount,
      skippedCount: unansweredCount,
      totalScore,
      maxScore: attempt.maxMarks,
      percentage,
      accuracy,
      totalTimeSpentSeconds: elapsedSeconds,
      subjectStats,
      chapterStats: Array.from(chapterStatsMap.values()),
    };

    await this.prisma.$transaction(async (tx) => {
      for (const upd of questionUpdates) {
        await tx.demoAttemptQuestion.update({
          where: { id: upd.id },
          data: { isCorrect: upd.isCorrect, marksAwarded: upd.marksAwarded },
        });
      }

      await tx.demoAttempt.update({
        where: { id: attemptId },
        data: {
          status: targetStatus,
          submittedAt: now,
          timeSpentSeconds: elapsedSeconds,
          totalScore,
          correctCount,
          incorrectCount,
          unansweredCount,
          accuracyPercentage: accuracy,
          resultSnapshot: resultSnapshot as never,
        },
      });

      if (!attempt.isPreview) {
        await tx.demoAnalyticsEvent.create({
          data: {
            visitorId: attempt.visitorId,
            attemptId: attempt.id,
            eventType:
              targetStatus === 'EXPIRED'
                ? 'ATTEMPT_EXPIRED'
                : 'ATTEMPT_SUBMITTED',
            subjectMode: attempt.subjectMode,
            languageMode: attempt.languageMode,
            metadata: {
              totalScore,
              maxMarks: attempt.maxMarks,
              accuracy,
            } as never,
          },
        });
      }
    });

    return this.getAttemptForClient(attemptId, visitorId, true);
  }

  async abandonAttempt(attemptId: string, visitorId: string) {
    const attempt = await this.prisma.demoAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        visitorId: true,
        status: true,
        isPreview: true,
        subjectMode: true,
        languageMode: true,
      },
    });
    if (!attempt) throw new NotFoundException('Demo attempt not found');
    if (attempt.visitorId !== visitorId) {
      throw new ForbiddenException('Unauthorized attempt access');
    }
    if (attempt.status !== 'IN_PROGRESS') {
      return { abandoned: false, status: attempt.status };
    }
    await this.prisma.demoAttempt.update({
      where: { id: attemptId },
      data: { status: 'ABANDONED' },
    });
    if (!attempt.isPreview) {
      await this.prisma.demoAnalyticsEvent.create({
        data: {
          visitorId,
          attemptId,
          eventType: 'ATTEMPT_ABANDONED',
          subjectMode: attempt.subjectMode,
          languageMode: attempt.languageMode,
        },
      });
    }
    return { abandoned: true, status: 'ABANDONED' };
  }

  async trackCtaEvent(visitorId: string, ctaName: string, attemptId?: string) {
    await this.prisma.demoAnalyticsEvent.create({
      data: {
        visitorId,
        attemptId: attemptId ?? null,
        eventType: 'CTA_CLICKED',
        metadata: { ctaName: ctaName.slice(0, 64) } as never,
      },
    });
    return { tracked: true };
  }
}
