import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DemoTestConfigurationService } from '../demo-test-configuration.service.js';
import { selectDemoQuestions } from '../demo-test-selection.engine.js';
import type {
  SaveDemoAnswerInput,
  StartDemoAttemptInput,
} from '../demo-test.service.js';
import type { LanguageMode, SubjectMode } from '../demo-test.types.js';
import { DemoEvaluationService } from './demo-evaluation.service.js';
import { DemoExposureService } from './demo-exposure.service.js';

@Injectable()
export class DemoAttemptService {
  private readonly exposure: DemoExposureService;
  private readonly evaluation: DemoEvaluationService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configuration: DemoTestConfigurationService,
    @Optional() exposure?: DemoExposureService,
    @Optional() evaluation?: DemoEvaluationService,
  ) {
    this.exposure = exposure ?? new DemoExposureService();
    this.evaluation = evaluation ?? new DemoEvaluationService(prisma);
  }

  async startAttempt(params: {
    visitorId: string;
    leadId?: string | null;
    userProfileId?: string | null;
    input: StartDemoAttemptInput;
  }) {
    const { visitorId, leadId, userProfileId, input } = params;
    const isPreview = Boolean(input.isPreview);

    if (input.idempotencyKey?.trim()) {
      const existing = await this.prisma.demoAttempt.findUnique({
        where: { idempotencyKey: input.idempotencyKey.trim() },
      });
      if (existing) {
        if (existing.visitorId !== visitorId && !isPreview) {
          throw new ForbiddenException('Attempt belongs to another visitor');
        }
        return this.evaluation.getAttemptForClient(
          existing.id,
          visitorId,
          isPreview,
        );
      }
    }

    const config = await this.configuration.get(isPreview);
    if (!isPreview && !config.isEnabled) {
      throw new ServiceUnavailableException(
        'The demo test is currently disabled',
      );
    }
    if (!isPreview && !config.guestAccessEnabled && !userProfileId) {
      throw new ForbiddenException('Please sign in to take the demo test');
    }

    const requestedSubject = (input.subject ?? config.defaultSubject)
      .trim()
      .toUpperCase() as SubjectMode;
    const subjectMode: SubjectMode = config.allowedSubjects.includes(
      requestedSubject,
    )
      ? requestedSubject
      : config.defaultSubject;

    const requestedLang = (input.language ?? config.defaultLanguage)
      .trim()
      .toLowerCase() as LanguageMode;
    const languageMode: LanguageMode = config.allowedLanguages.includes(
      requestedLang,
    )
      ? requestedLang
      : config.defaultLanguage;

    const requestedCount = Number(
      input.questionCount ?? config.defaultQuestionCount,
    );
    const blueprint =
      config.blueprints.find((bp) => bp.count === requestedCount) ??
      config.blueprints.find(
        (bp) => bp.count === config.defaultQuestionCount,
      ) ??
      config.blueprints[0];

    if (!blueprint) {
      throw new ServiceUnavailableException(
        'No valid demo blueprint configured',
      );
    }

    const candidates = await this.configuration.fetchPoolCandidates(
      config.poolMode,
    );
    if (!candidates.length) {
      throw new ServiceUnavailableException(
        'No eligible questions are currently configured in the Demo Question Pool.',
      );
    }

    const [visitorExposures, globalStatsRows, recentAttemptRows] =
      await Promise.all([
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
          select: {
            questionId: true,
            exposureCount: true,
            lastExposedAt: true,
          },
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
      const msg =
        err instanceof Error ? err.message : 'Unable to generate demo paper';
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
          leadId: leadId ?? null,
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
        if (leadId) {
          await tx.demoLead.update({
            where: { id: leadId },
            data: { totalAttempts: { increment: 1 }, lastAccessAt: startedAt },
          });
        }

        await this.exposure.recordAttemptExposuresInTx(tx, {
          visitorId,
          startedAt,
          visitorExposures,
          globalStats,
          selectedQuestions: selection.questions,
        });

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

    return this.evaluation.getAttemptForClient(
      createdAttempt.id,
      visitorId,
      isPreview,
    );
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
      await this.evaluation.finalizeAttempt(attemptId, visitorId, 'EXPIRED');
      throw new BadRequestException('Attempt time has expired');
    }

    const aq = await this.prisma.demoAttemptQuestion.findUnique({
      where: {
        attemptId_questionId: { attemptId, questionId: input.questionId },
      },
      include: { question: { include: { options: { select: { id: true } } } } },
    });
    if (!aq) {
      throw new BadRequestException(
        'Question does not belong to this attempt',
      );
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
          ? {
              timeSpentSeconds: Math.min(
                86400,
                Math.floor(input.timeSpentSeconds),
              ),
            }
          : {}),
      },
    });

    return { saved: true };
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
