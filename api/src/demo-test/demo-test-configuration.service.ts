import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface DemoCountOption {
  count: number;
  durationMinutes: number;
  label: string;
}

export interface DemoTestConfigurationPayload {
  isEnabled: boolean;
  title: string;
  code: string;
  instructionsEn: string;
  instructionsTa: string;
  allowedSubjects: string[];
  allowedLanguages: string[];
  defaultSubject: string;
  defaultLanguage: string;
  defaultQuestionCount: number;
  countOptions: DemoCountOption[];
  selectedQuestionIds?: string[];
}

export const DEFAULT_DEMO_COUNT_OPTIONS: DemoCountOption[] = [
  { count: 6, durationMinutes: 10, label: 'Quick Drill' },
  { count: 9, durationMinutes: 15, label: 'Standard NEET' },
  { count: 12, durationMinutes: 20, label: 'Deep Mock' },
];

const DEFAULT_CONFIG: DemoTestConfigurationPayload = {
  isEnabled: true,
  title: 'NEET Bilingual Diagnostic Demo Test',
  code: 'NEET-DEMO-2026',
  instructionsEn:
    'Standard NTA NEET format. +4 for correct, -1 for incorrect and 0 for skipped questions.',
  instructionsTa:
    'நிலையான NTA NEET தேர்வு முறை. சரியான விடைக்கு +4, தவறான விடைக்கு -1, விடையளிக்காத வினாவுக்கு 0.',
  allowedSubjects: ['ALL', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY'],
  allowedLanguages: ['en', 'ta'],
  defaultSubject: 'ALL',
  defaultLanguage: 'ta',
  defaultQuestionCount: 9,
  countOptions: DEFAULT_DEMO_COUNT_OPTIONS,
};

@Injectable()
export class DemoTestConfigurationService {
  constructor(private readonly prisma: PrismaService) {}

  private parseCountOptions(value: unknown): DemoCountOption[] {
    if (!Array.isArray(value)) return DEFAULT_DEMO_COUNT_OPTIONS;
    const result = value.slice(0, 6).flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const entry = item as Record<string, unknown>;
      const count = Number(entry.count);
      const durationMinutes = Number(entry.durationMinutes);
      if (
        !Number.isInteger(count) ||
        count < 1 ||
        count > 200 ||
        !Number.isInteger(durationMinutes) ||
        durationMinutes < 1 ||
        durationMinutes > 600
      )
        return [];
      const label =
        typeof entry.label === 'string' ? entry.label.trim().slice(0, 50) : '';
      return [{ count, durationMinutes, label: label || `${count} Questions` }];
    });
    return result.length ? result : DEFAULT_DEMO_COUNT_OPTIONS;
  }

  private normalize(
    record: {
      isEnabled: boolean;
      title: string;
      code: string;
      instructionsEn: string | null;
      instructionsTa: string | null;
      allowedSubjects: string[];
      allowedLanguages: string[];
      defaultSubject: string;
      defaultLanguage: string;
      defaultQuestionCount: number;
      countOptions: unknown;
      questions?: { questionId: string }[];
    } | null,
  ): DemoTestConfigurationPayload {
    if (!record) return { ...DEFAULT_CONFIG };
    return {
      isEnabled: record.isEnabled,
      title: record.title,
      code: record.code,
      instructionsEn: record.instructionsEn ?? DEFAULT_CONFIG.instructionsEn,
      instructionsTa: record.instructionsTa ?? DEFAULT_CONFIG.instructionsTa,
      allowedSubjects: record.allowedSubjects,
      allowedLanguages: record.allowedLanguages,
      defaultSubject: record.defaultSubject,
      defaultLanguage: record.defaultLanguage,
      defaultQuestionCount: record.defaultQuestionCount,
      countOptions: this.parseCountOptions(record.countOptions),
      selectedQuestionIds:
        record.questions?.map((item) => item.questionId) ?? [],
    };
  }

  async get(includeQuestionIds = false) {
    const record = await this.prisma.demoTestConfiguration.findUnique({
      where: { id: 'login-demo' },
      include: { questions: { orderBy: { position: 'asc' } } },
    });
    const result = this.normalize(record);
    if (!includeQuestionIds) delete result.selectedQuestionIds;
    return result;
  }

  async update(body: unknown) {
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw new BadRequestException('Invalid demo configuration');
    const input = body as Record<string, unknown>;
    const allowedSubjects = Array.isArray(input.allowedSubjects)
      ? input.allowedSubjects
          .map(String)
          .filter((item) =>
            ['ALL', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY'].includes(item),
          )
      : DEFAULT_CONFIG.allowedSubjects;
    const allowedLanguages = Array.isArray(input.allowedLanguages)
      ? input.allowedLanguages
          .map(String)
          .filter((item) => ['en', 'ta'].includes(item))
      : DEFAULT_CONFIG.allowedLanguages;
    if (!allowedSubjects.length || !allowedLanguages.length)
      throw new BadRequestException(
        'Enable at least one subject and one language',
      );
    const countOptions = this.parseCountOptions(input.countOptions);
    const defaultSubject = allowedSubjects.includes(
      String(input.defaultSubject),
    )
      ? String(input.defaultSubject)
      : allowedSubjects[0];
    const defaultLanguage = allowedLanguages.includes(
      String(input.defaultLanguage),
    )
      ? String(input.defaultLanguage)
      : allowedLanguages[0];
    const requestedCount = Number(input.defaultQuestionCount);
    const defaultQuestionCount = countOptions.some(
      (option) => option.count === requestedCount,
    )
      ? requestedCount
      : countOptions[0].count;
    const text = (value: unknown, fallback: string, max: number) =>
      typeof value === 'string' && value.trim()
        ? value.trim().slice(0, max)
        : fallback;
    const data = {
      isEnabled: input.isEnabled !== false,
      title: text(input.title, DEFAULT_CONFIG.title, 200),
      code: text(input.code, DEFAULT_CONFIG.code, 64),
      instructionsEn: text(
        input.instructionsEn,
        DEFAULT_CONFIG.instructionsEn,
        20_000,
      ),
      instructionsTa: text(
        input.instructionsTa,
        DEFAULT_CONFIG.instructionsTa,
        20_000,
      ),
      allowedSubjects,
      allowedLanguages,
      defaultSubject,
      defaultLanguage,
      defaultQuestionCount,
      countOptions: countOptions as never,
    };
    await this.prisma.demoTestConfiguration.upsert({
      where: { id: 'login-demo' },
      create: { id: 'login-demo', ...data },
      update: data,
    });
    return this.get(true);
  }

  async setQuestionPool(body: unknown) {
    const questionIds =
      body && typeof body === 'object' && !Array.isArray(body)
        ? (body as Record<string, unknown>).questionIds
        : null;
    if (
      !Array.isArray(questionIds) ||
      questionIds.length > 500 ||
      questionIds.some((id) => typeof id !== 'string')
    )
      throw new BadRequestException('questionIds must contain up to 500 IDs');
    const uniqueIds = [...new Set(questionIds as string[])];
    const valid = await this.prisma.question.findMany({
      where: { id: { in: uniqueIds }, isActive: true },
      select: { id: true },
    });
    if (valid.length !== uniqueIds.length)
      throw new BadRequestException(
        'One or more selected questions are unavailable',
      );
    await this.prisma.$transaction(async (tx) => {
      await tx.demoTestConfiguration.upsert({
        where: { id: 'login-demo' },
        create: {
          id: 'login-demo',
          countOptions: DEFAULT_DEMO_COUNT_OPTIONS as never,
        },
        update: {},
      });
      await tx.demoTestQuestion.deleteMany({
        where: { configId: 'login-demo' },
      });
      if (uniqueIds.length)
        await tx.demoTestQuestion.createMany({
          data: uniqueIds.map((questionId, index) => ({
            configId: 'login-demo',
            questionId,
            position: index + 1,
          })),
        });
    });
    return { questionIds: uniqueIds };
  }
}
