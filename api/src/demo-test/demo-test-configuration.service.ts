import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CandidateQuestionRecord } from './demo-test-eligibility.helper.js';
import {
  normalizeDemoConfigRecord,
  sanitizeDemoSettingsInput,
} from './demo-test-config.normalizer.js';
import type {
  DemoTestConfigurationPayload,
  PoolMode,
} from './demo-test.types.js';

@Injectable()
export class DemoTestConfigurationService {
  constructor(private readonly prisma: PrismaService) {}

  async get(_isAdmin = false): Promise<DemoTestConfigurationPayload> {
    const record = await this.prisma.demoTestConfiguration.findUnique({
      where: { id: 'login-demo' },
    });
    return normalizeDemoConfigRecord(record);
  }

  async update(body: unknown, actorUserId?: string | null) {
    const existing = await this.get(true);
    const sanitized = sanitizeDemoSettingsInput(body, existing);

    await this.prisma.demoTestConfiguration.upsert({
      where: { id: 'login-demo' },
      create: {
        id: 'login-demo',
        ...sanitized,
        countOptions: sanitized.countOptions as never,
        blueprints: sanitized.blueprints as never,
        selectionRules: sanitized.selectionRules as never,
      },
      update: {
        ...sanitized,
        countOptions: sanitized.countOptions as never,
        blueprints: sanitized.blueprints as never,
        selectionRules: sanitized.selectionRules as never,
      },
    });

    await this.prisma.demoAdminAuditLog.create({
      data: {
        actorUserId: actorUserId ?? null,
        action: 'UPDATE_DEMO_SETTINGS',
        details: {
          isEnabled: sanitized.isEnabled,
          examCategory: sanitized.examCategory,
          defaultQuestionCount: sanitized.defaultQuestionCount,
          defaultDurationMinutes: sanitized.defaultDurationMinutes,
          allowedSubjects: sanitized.allowedSubjects,
        } as never,
      },
    });

    return this.get(true);
  }

  /**
   * Automatically pulls eligible questions from the Question Bank,
   * excluding inactive, restricted, and protected/upcoming exam questions.
   */
  async fetchPoolCandidates(
    _poolMode?: PoolMode,
  ): Promise<CandidateQuestionRecord[]> {
    const now = new Date();
    return this.prisma.question.findMany({
      where: {
        isActive: true,
        isRestrictedForDemo: false,
        assessmentQuestions: {
          none: {
            assessmentTest: {
              isActive: true,
              isCancelled: false,
              OR: [
                { scheduledAt: { gt: now } },
                { availableUntil: { gt: now } },
              ],
            },
          },
        },
      },
      select: {
        id: true,
        externalId: true,
        type: true,
        language: true,
        difficulty: true,
        textEn: true,
        textTa: true,
        questionImageUrl: true,
        numericalAnswer: true,
        contentFingerprint: true,
        equivalentFingerprint: true,
        correctMarks: true,
        negativeMarks: true,
        isActive: true,
        isRestrictedForDemo: true,
        chapterId: true,
        chapter: { select: { id: true, title: true } },
        courseSubject: {
          select: { subject: { select: { code: true, name: true } } },
        },
        options: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            label: true,
            textEn: true,
            textTa: true,
            imageUrl: true,
            isCorrect: true,
            position: true,
          },
        },
      },
    }) as Promise<CandidateQuestionRecord[]>;
  }
}
