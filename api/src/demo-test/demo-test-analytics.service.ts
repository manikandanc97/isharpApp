import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { computePaperOverlapRatio } from './demo-test-selection.engine.js';

export interface DemoAnalyticsFilters {
  from?: string;
  to?: string;
  subject?: string;
}

@Injectable()
export class DemoTestAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(filters: DemoAnalyticsFilters = {}) {
    const now = new Date();
    const fromDate = filters.from
      ? new Date(filters.from)
      : new Date(now.getTime() - 30 * 24 * 3600_000);
    const toDate = filters.to ? new Date(filters.to) : now;

    const attemptWhere: Record<string, unknown> = {
      isPreview: false,
      createdAt: {
        gte: Number.isNaN(fromDate.getTime())
          ? new Date(now.getTime() - 30 * 24 * 3600_000)
          : fromDate,
        lte: Number.isNaN(toDate.getTime()) ? now : toDate,
      },
    };
    if (
      filters.subject &&
      ['ALL', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY'].includes(
        filters.subject.toUpperCase(),
      )
    ) {
      attemptWhere.subjectMode = filters.subject.toUpperCase();
    }

    const [attempts, events, uniqueQuestionsDeliveredRows, totalVisitors] =
      await Promise.all([
        this.prisma.demoAttempt.findMany({
          where: attemptWhere as never,
          orderBy: { createdAt: 'desc' },
          take: 2000,
          include: {
            questions: { select: { questionId: true } },
          },
        }),
        this.prisma.demoAnalyticsEvent.findMany({
          where: {
            createdAt: attemptWhere.createdAt as never,
          },
          select: { eventType: true },
        }),
        this.prisma.demoQuestionGlobalStat.count({
          where: { exposureCount: { gt: 0 } },
        }),
        this.prisma.demoVisitor.count(),
      ]);

    const totalAttempts = attempts.length;
    const uniqueVisitorIds = new Set(attempts.map((a) => a.visitorId));
    const uniqueVisitors = uniqueVisitorIds.size;

    const visitorAttemptCounts = new Map<string, number>();
    for (const a of attempts) {
      visitorAttemptCounts.set(
        a.visitorId,
        (visitorAttemptCounts.get(a.visitorId) ?? 0) + 1,
      );
    }
    const repeatVisitors = Array.from(visitorAttemptCounts.values()).filter(
      (c) => c > 1,
    ).length;
    const repeatAttempts = attempts.filter(
      (a) => (visitorAttemptCounts.get(a.visitorId) ?? 0) > 1,
    ).length;

    const completedAttempts = attempts.filter(
      (a) => a.status === 'SUBMITTED' || a.status === 'EXPIRED',
    );
    const abandonedAttempts = attempts.filter((a) => a.status === 'ABANDONED');
    const completionRate =
      totalAttempts > 0
        ? Math.round((completedAttempts.length / totalAttempts) * 1000) / 10
        : 0;

    const scoredAttempts = completedAttempts.filter(
      (a) => typeof a.totalScore === 'number',
    );
    const averageScore =
      scoredAttempts.length > 0
        ? Math.round(
            (scoredAttempts.reduce((sum, a) => sum + (a.totalScore ?? 0), 0) /
              scoredAttempts.length) *
              10,
          ) / 10
        : 0;

    const averageCompletionSeconds =
      completedAttempts.length > 0
        ? Math.round(
            completedAttempts.reduce(
              (sum, a) => sum + (a.timeSpentSeconds ?? 0),
              0,
            ) / completedAttempts.length,
          )
        : 0;

    const subjectPopularity: Record<string, number> = {};
    const languagePopularity: Record<string, number> = {};
    const blueprintPopularity: Record<string, number> = {};

    const paperFpCounts = new Map<string, number>();
    let controlledReuseCount = 0;
    let poolExhaustionEvents = 0;

    for (const a of attempts) {
      subjectPopularity[a.subjectMode] =
        (subjectPopularity[a.subjectMode] ?? 0) + 1;
      languagePopularity[a.languageMode] =
        (languagePopularity[a.languageMode] ?? 0) + 1;
      const bpKey = `${a.questionCount} Qs (${a.durationMinutes}m)`;
      blueprintPopularity[bpKey] = (blueprintPopularity[bpKey] ?? 0) + 1;

      paperFpCounts.set(
        a.paperFingerprint,
        (paperFpCounts.get(a.paperFingerprint) ?? 0) + 1,
      );
      if (a.controlledReuseUsed) controlledReuseCount += 1;
      if (a.poolExhausted) poolExhaustionEvents += 1;
    }

    const identicalPaperCount = Array.from(paperFpCounts.values()).reduce(
      (sum, c) => sum + (c > 1 ? c - 1 : 0),
      0,
    );
    const identicalPaperRate =
      totalAttempts > 1
        ? Math.round((identicalPaperCount / totalAttempts) * 1000) / 10
        : 0;

    // Average overlap across consecutive recent attempts (sample up to 50 pairs)
    let overlapSum = 0;
    let overlapPairs = 0;
    const recentSlice = attempts.slice(0, 50);
    for (let i = 0; i < recentSlice.length - 1; i++) {
      const aIds = recentSlice[i].questions.map((q) => q.questionId);
      const bIds = recentSlice[i + 1].questions.map((q) => q.questionId);
      if (aIds.length && bIds.length) {
        overlapSum += computePaperOverlapRatio(aIds, bIds);
        overlapPairs += 1;
      }
    }
    const averagePaperOverlap =
      overlapPairs > 0
        ? Math.round((overlapSum / overlapPairs) * 1000) / 10
        : 0;

    const ctaClicks = events.filter((e) => e.eventType === 'CTA_CLICKED').length;

    return {
      totalVisitors,
      uniqueVisitors,
      totalAttempts,
      completedAttempts: completedAttempts.length,
      abandonedAttempts: abandonedAttempts.length,
      completionRate,
      averageScore,
      averageCompletionSeconds,
      repeatVisitorRate:
        uniqueVisitors > 0
          ? Math.round((repeatVisitors / uniqueVisitors) * 1000) / 10
          : 0,
      repeatAttempts,
      uniqueQuestionsDelivered: uniqueQuestionsDeliveredRows,
      controlledReuseCount,
      controlledReuseRate:
        totalAttempts > 0
          ? Math.round((controlledReuseCount / totalAttempts) * 1000) / 10
          : 0,
      poolExhaustionEvents,
      identicalPaperRate,
      averagePaperOverlap,
      ctaConversions: ctaClicks,
      subjectPopularity,
      languagePopularity,
      blueprintPopularity,
    };
  }
}
