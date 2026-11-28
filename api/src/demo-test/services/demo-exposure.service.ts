import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';

@Injectable()
export class DemoExposureService {
  /**
   * Records visitor and global question exposures within an active transaction,
   * preserving Phase 3 createMany/updateMany batching with upsert fallbacks.
   */
  async recordAttemptExposuresInTx(
    tx: Prisma.TransactionClient,
    params: {
      visitorId: string;
      startedAt: Date;
      visitorExposures: Array<{ questionId: string }>;
      globalStats: Map<string, unknown>;
      selectedQuestions: Array<{
        question: {
          id: string;
          contentFingerprint: string | null;
          equivalentFingerprint: string | null;
        };
      }>;
    },
  ) {
    const {
      visitorId,
      startedAt,
      visitorExposures,
      globalStats,
      selectedQuestions,
    } = params;

    const exposedSet = new Set(visitorExposures.map((e) => e.questionId));
    const newExposures: Array<{
      visitorId: string;
      questionId: string;
      contentFingerprint: string | null;
      equivalentFingerprint: string | null;
      exposureCount: number;
      firstExposedAt: Date;
      lastExposedAt: Date;
    }> = [];
    const existingExposureIds: string[] = [];

    const newGlobalStats: Array<{
      questionId: string;
      exposureCount: number;
      lastExposedAt: Date;
    }> = [];
    const existingGlobalStatIds: string[] = [];

    for (const item of selectedQuestions) {
      const q = item.question;
      if (exposedSet.has(q.id)) {
        existingExposureIds.push(q.id);
      } else {
        newExposures.push({
          visitorId,
          questionId: q.id,
          contentFingerprint: q.contentFingerprint,
          equivalentFingerprint: q.equivalentFingerprint,
          exposureCount: 1,
          firstExposedAt: startedAt,
          lastExposedAt: startedAt,
        });
      }

      if (globalStats.has(q.id)) {
        existingGlobalStatIds.push(q.id);
      } else {
        newGlobalStats.push({
          questionId: q.id,
          exposureCount: 1,
          lastExposedAt: startedAt,
        });
      }
    }

    if (
      typeof tx.demoVisitorQuestionExposure.createMany === 'function' &&
      typeof tx.demoVisitorQuestionExposure.updateMany === 'function'
    ) {
      if (newExposures.length > 0) {
        await tx.demoVisitorQuestionExposure.createMany({
          data: newExposures,
          skipDuplicates: true,
        });
      }
      if (existingExposureIds.length > 0) {
        await tx.demoVisitorQuestionExposure.updateMany({
          where: { visitorId, questionId: { in: existingExposureIds } },
          data: { exposureCount: { increment: 1 }, lastExposedAt: startedAt },
        });
      }
    } else {
      for (const item of selectedQuestions) {
        const q = item.question;
        await tx.demoVisitorQuestionExposure.upsert({
          where: { visitorId_questionId: { visitorId, questionId: q.id } },
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
      }
    }

    if (
      typeof tx.demoQuestionGlobalStat.createMany === 'function' &&
      typeof tx.demoQuestionGlobalStat.updateMany === 'function'
    ) {
      if (newGlobalStats.length > 0) {
        await tx.demoQuestionGlobalStat.createMany({
          data: newGlobalStats,
          skipDuplicates: true,
        });
      }
      if (existingGlobalStatIds.length > 0) {
        await tx.demoQuestionGlobalStat.updateMany({
          where: { questionId: { in: existingGlobalStatIds } },
          data: { exposureCount: { increment: 1 }, lastExposedAt: startedAt },
        });
      }
    } else {
      for (const item of selectedQuestions) {
        const q = item.question;
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
    }
  }
}
