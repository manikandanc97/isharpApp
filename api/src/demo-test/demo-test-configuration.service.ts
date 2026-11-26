import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CandidateQuestionRecord } from './demo-test-eligibility.helper.js';
import {
  DEFAULT_DEMO_CONFIG,
  DEFAULT_DEMO_SELECTION_RULES,
  type DemoBlueprint,
  type DemoCountOption,
  type DemoSelectionRules,
  type DemoTestConfigurationPayload,
  type LanguageMode,
  type PoolMode,
  type SubjectMode,
  type WeightingMode,
} from './demo-test.types.js';

@Injectable()
export class DemoTestConfigurationService {
  constructor(private readonly prisma: PrismaService) {}

  private buildBalancedBlueprint(
    questionCount: number,
    durationMinutes: number,
    allowedSubjects: SubjectMode[],
    label?: string,
    index = 0,
    weightingMode: WeightingMode = 'WEIGHTED',
  ): DemoBlueprint {
    const enabledSubjects = allowedSubjects.filter((s) =>
      ['PHYSICS', 'CHEMISTRY', 'BIOLOGY'].includes(s),
    );
    const activeSet = new Set(
      enabledSubjects.length ? enabledSubjects : ['PHYSICS', 'CHEMISTRY', 'BIOLOGY'],
    );
    const dist = { PHYSICS: 0, CHEMISTRY: 0, BIOLOGY: 0 };

    if (
      weightingMode === 'WEIGHTED' &&
      activeSet.has('PHYSICS') &&
      activeSet.has('CHEMISTRY') &&
      activeSet.has('BIOLOGY')
    ) {
      // NEET standard 1:1:2 weighting (25% Phy, 25% Chem, 50% Bio)
      const phy = Math.floor(questionCount * 0.25);
      const chem = Math.floor(questionCount * 0.25);
      const bio = questionCount - phy - chem;
      dist.PHYSICS = phy;
      dist.CHEMISTRY = chem;
      dist.BIOLOGY = bio;
    } else {
      const activeCount = activeSet.size;
      const base = Math.floor(questionCount / activeCount);
      let remainder = questionCount % activeCount;
      for (const subj of ['BIOLOGY', 'PHYSICS', 'CHEMISTRY'] as const) {
        if (activeSet.has(subj)) {
          dist[subj] = base + (remainder > 0 ? 1 : 0);
          if (remainder > 0) remainder -= 1;
        }
      }
    }

    const cleanLabel = label?.trim() || `${questionCount} Questions`;

    return {
      id: index === 0 ? 'default-demo' : `demo-preset-${questionCount}`,
      label: cleanLabel,
      count: questionCount,
      durationMinutes,
      maxMarks: questionCount * 4,
      subjectDistribution: dist,
    };
  }

  private normalizeCountOptions(
    raw: unknown,
    fallbackCount: number,
    fallbackDuration: number,
  ): DemoCountOption[] {
    if (!Array.isArray(raw) || raw.length === 0) {
      return [
        {
          count: fallbackCount,
          durationMinutes: fallbackDuration,
          label: `${fallbackCount} Questions`,
        },
      ];
    }

    const seen = new Set<number>();
    const normalized: DemoCountOption[] = [];
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const obj = item as Record<string, unknown>;
      const count = Math.trunc(Number(obj.count));
      const durationMinutes = Math.trunc(Number(obj.durationMinutes));
      if (
        !Number.isFinite(count) ||
        count < 1 ||
        count > 180 ||
        !Number.isFinite(durationMinutes) ||
        durationMinutes < 1 ||
        durationMinutes > 240 ||
        seen.has(count)
      ) {
        continue;
      }
      seen.add(count);
      const label =
        typeof obj.label === 'string' && obj.label.trim()
          ? obj.label.trim().slice(0, 60)
          : `${count} Questions`;
      normalized.push({ count, durationMinutes, label });
    }

    if (!normalized.length) {
      return [
        {
          count: fallbackCount,
          durationMinutes: fallbackDuration,
          label: `${fallbackCount} Questions`,
        },
      ];
    }

    return normalized.sort((a, b) => a.count - b.count);
  }

  private normalizeSelectionRules(raw: unknown): DemoSelectionRules {
    const base = { ...DEFAULT_DEMO_SELECTION_RULES };
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return base;
    }
    const r = raw as Record<string, unknown>;

    const bool = (key: keyof DemoSelectionRules, fallback: boolean) =>
      typeof r[key] === 'boolean' ? (r[key] as boolean) : fallback;

    const num = (
      key: keyof DemoSelectionRules,
      fallback: number,
      min: number,
      max: number,
    ) => {
      const n = Number(r[key]);
      return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
    };

    const weightingMode: WeightingMode =
      r.weightingMode === 'EQUAL' || r.weightingMode === 'WEIGHTED'
        ? r.weightingMode
        : base.weightingMode;

    return {
      ...base,
      autoRandomSelection: bool('autoRandomSelection', base.autoRandomSelection),
      visitorRepeatPrevention: bool('visitorRepeatPrevention', base.visitorRepeatPrevention),
      equivalentRepeatPrevention: bool(
        'equivalentRepeatPrevention',
        base.equivalentRepeatPrevention,
      ),
      globalExposureBalancing: bool('globalExposureBalancing', base.globalExposureBalancing),
      recentPaperUniqueness: bool('recentPaperUniqueness', base.recentPaperUniqueness),
      recentPaperWindow: Math.trunc(num('recentPaperWindow', base.recentPaperWindow, 1, 100)),
      maxPaperOverlapRatio: num('maxPaperOverlapRatio', base.maxPaperOverlapRatio, 0, 1),
      shuffleQuestions: bool('shuffleQuestions', base.shuffleQuestions),
      shuffleOptions: bool('shuffleOptions', base.shuffleOptions),
      cooldownHours: Math.trunc(num('cooldownHours', base.cooldownHours, 0, 720)),
      strictNoRepeat: bool('strictNoRepeat', base.strictNoRepeat),
      smartReuseAfterExhaustion: bool(
        'smartReuseAfterExhaustion',
        base.smartReuseAfterExhaustion,
      ),
      chapterDiversity: bool('chapterDiversity', base.chapterDiversity),
      questionTypeDiversity: bool('questionTypeDiversity', base.questionTypeDiversity),
      weightingMode,
    };
  }

  private normalizeRecord(
    record: {
      isEnabled: boolean;
      examCategory?: string;
      title: string;
      code: string;
      instructionsEn: string | null;
      instructionsTa: string | null;
      allowedSubjects: string[];
      allowedLanguages: string[];
      defaultSubject: string;
      defaultLanguage: string;
      defaultQuestionCount: number;
      defaultDurationMinutes?: number;
      countOptions?: unknown;
      selectionRules?: unknown;
      guestAccessEnabled?: boolean;
      showResultsImmediately?: boolean;
      showSolutionsAfterSubmit?: boolean;
      admissionCtaEnabled?: boolean;
    } | null,
  ): DemoTestConfigurationPayload {
    if (!record) return { ...DEFAULT_DEMO_CONFIG };

    const allowedSubjects = record.allowedSubjects.filter((s): s is SubjectMode =>
      ['ALL', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY'].includes(s),
    );
    const normalizedSubjects = allowedSubjects.length
      ? allowedSubjects
      : DEFAULT_DEMO_CONFIG.allowedSubjects;

    const allowedLanguages = record.allowedLanguages.filter((l): l is LanguageMode =>
      ['en', 'ta'].includes(l),
    );
    const normalizedLanguages = allowedLanguages.length
      ? allowedLanguages
      : DEFAULT_DEMO_CONFIG.allowedLanguages;

    const fallbackQuestionCount = Math.max(
      1,
      Math.min(180, Number(record.defaultQuestionCount || DEFAULT_DEMO_CONFIG.defaultQuestionCount)),
    );
    const fallbackDurationMinutes = Math.max(
      1,
      Math.min(240, Number(record.defaultDurationMinutes || DEFAULT_DEMO_CONFIG.defaultDurationMinutes)),
    );

    const countOptions = this.normalizeCountOptions(
      record.countOptions,
      fallbackQuestionCount,
      fallbackDurationMinutes,
    );

    const matchedDefault =
      countOptions.find((opt) => opt.count === fallbackQuestionCount) ?? countOptions[0];
    const defaultQuestionCount = matchedDefault.count;
    const defaultDurationMinutes = matchedDefault.durationMinutes;

    const selectionRules = this.normalizeSelectionRules(record.selectionRules);

    const blueprints = countOptions.map((opt, idx) =>
      this.buildBalancedBlueprint(
        opt.count,
        opt.durationMinutes,
        normalizedSubjects,
        opt.label,
        idx,
        selectionRules.weightingMode,
      ),
    );

    return {
      isEnabled: record.isEnabled,
      examCategory: record.examCategory || DEFAULT_DEMO_CONFIG.examCategory,
      title: record.title ?? DEFAULT_DEMO_CONFIG.title,
      code: record.code ?? DEFAULT_DEMO_CONFIG.code,
      instructionsEn: record.instructionsEn ?? DEFAULT_DEMO_CONFIG.instructionsEn,
      instructionsTa: record.instructionsTa ?? DEFAULT_DEMO_CONFIG.instructionsTa,
      allowedSubjects: normalizedSubjects,
      allowedLanguages: normalizedLanguages,
      defaultSubject: normalizedSubjects.includes(record.defaultSubject as SubjectMode)
        ? (record.defaultSubject as SubjectMode)
        : normalizedSubjects[0],
      defaultLanguage: normalizedLanguages.includes(record.defaultLanguage as LanguageMode)
        ? (record.defaultLanguage as LanguageMode)
        : normalizedLanguages[0],
      defaultQuestionCount,
      defaultDurationMinutes,
      countOptions,
      blueprints,
      poolMode: 'AUTOMATIC',
      selectionRules,
      guestAccessEnabled: record.guestAccessEnabled ?? true,
      showResultsImmediately: record.showResultsImmediately ?? true,
      showSolutionsAfterSubmit: record.showSolutionsAfterSubmit ?? true,
      admissionCtaEnabled: record.admissionCtaEnabled ?? true,
    };
  }

  async get(_isAdmin = false): Promise<DemoTestConfigurationPayload> {
    const record = await this.prisma.demoTestConfiguration.findUnique({
      where: { id: 'login-demo' },
    });
    return this.normalizeRecord(record);
  }

  private sanitizeSettingsInput(
    body: unknown,
    existing: DemoTestConfigurationPayload,
  ) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Invalid demo settings payload');
    }
    const input = body as Record<string, unknown>;

    const isEnabled =
      typeof input.isEnabled === 'boolean' ? input.isEnabled : existing.isEnabled;

    const title =
      typeof input.title === 'string' && input.title.trim()
        ? input.title.trim().slice(0, 200)
        : existing.title;

    const code =
      typeof input.code === 'string' && input.code.trim()
        ? input.code.trim().slice(0, 64)
        : existing.code;

    const instructionsEn =
      typeof input.instructionsEn === 'string'
        ? input.instructionsEn.trim()
        : existing.instructionsEn;

    const instructionsTa =
      typeof input.instructionsTa === 'string'
        ? input.instructionsTa.trim()
        : existing.instructionsTa;

    const rawCategory = 'NEET';

    let selectedSubjects: SubjectMode[] = Array.isArray(input.allowedSubjects)
      ? input.allowedSubjects
          .map((s) => String(s).trim().toUpperCase())
          .filter((s): s is SubjectMode =>
            ['PHYSICS', 'CHEMISTRY', 'BIOLOGY'].includes(s),
          )
      : existing.allowedSubjects.filter((s) =>
          ['PHYSICS', 'CHEMISTRY', 'BIOLOGY'].includes(s),
        );

    selectedSubjects = [...new Set(selectedSubjects)];
    if (!selectedSubjects.length) {
      throw new BadRequestException('Select at least one subject');
    }

    const allowedSubjects: SubjectMode[] =
      selectedSubjects.length > 1 ? ['ALL', ...selectedSubjects] : selectedSubjects;

    const requestedDefaultSubject =
      typeof input.defaultSubject === 'string'
        ? (input.defaultSubject.trim().toUpperCase() as SubjectMode)
        : existing.defaultSubject;

    const defaultSubject: SubjectMode = allowedSubjects.includes(requestedDefaultSubject)
      ? requestedDefaultSubject
      : selectedSubjects.length > 1
        ? 'ALL'
        : selectedSubjects[0];

    let allowedLanguages: LanguageMode[] = Array.isArray(input.allowedLanguages)
      ? input.allowedLanguages
          .map((l) => String(l).trim().toLowerCase())
          .filter((l): l is LanguageMode => ['en', 'ta'].includes(l))
      : existing.allowedLanguages;
    allowedLanguages = [...new Set(allowedLanguages)];
    if (!allowedLanguages.length) {
      throw new BadRequestException('Select at least one language');
    }

    const requestedDefaultLanguage =
      typeof input.defaultLanguage === 'string'
        ? (input.defaultLanguage.trim().toLowerCase() as LanguageMode)
        : existing.defaultLanguage;
    const defaultLanguage: LanguageMode = allowedLanguages.includes(requestedDefaultLanguage)
      ? requestedDefaultLanguage
      : allowedLanguages[0];

    const selectionRules = this.normalizeSelectionRules(
      input.selectionRules !== undefined
        ? { ...existing.selectionRules, ...(input.selectionRules as Record<string, unknown>) }
        : existing.selectionRules,
    );

    let countOptions: DemoCountOption[];
    if (Array.isArray(input.countOptions)) {
      if (input.countOptions.length === 0 || input.countOptions.length > 8) {
        throw new BadRequestException('Configure between 1 and 8 question count options');
      }
      const seenCounts = new Set<number>();
      countOptions = input.countOptions.map((item, idx) => {
        if (!item || typeof item !== 'object') {
          throw new BadRequestException(`Invalid option at position ${idx + 1}`);
        }
        const obj = item as Record<string, unknown>;
        const count = Number(obj.count);
        const durationMinutes = Number(obj.durationMinutes);
        if (!Number.isInteger(count) || count < 1 || count > 180) {
          throw new BadRequestException('Question count must be between 1 and 180');
        }
        if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 240) {
          throw new BadRequestException('Duration must be between 1 and 240 minutes');
        }
        if (seenCounts.has(count)) {
          throw new BadRequestException(`Duplicate question count option: ${count}`);
        }
        seenCounts.add(count);
        const label =
          typeof obj.label === 'string' && obj.label.trim()
            ? obj.label.trim().slice(0, 60)
            : `${count} Questions`;
        return { count, durationMinutes, label };
      });
      countOptions.sort((a, b) => a.count - b.count);
    } else {
      const questionCount =
        input.defaultQuestionCount !== undefined
          ? Number(input.defaultQuestionCount)
          : existing.defaultQuestionCount;
      if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 180) {
        throw new BadRequestException('Number of questions must be between 1 and 180');
      }
      const durationMinutes =
        input.defaultDurationMinutes !== undefined
          ? Number(input.defaultDurationMinutes)
          : existing.defaultDurationMinutes;
      if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 240) {
        throw new BadRequestException('Test duration must be between 1 and 240 minutes');
      }
      countOptions = [
        {
          count: questionCount,
          durationMinutes,
          label: `${questionCount} Questions`,
        },
      ];
    }

    const requestedDefaultCount =
      input.defaultQuestionCount !== undefined
        ? Number(input.defaultQuestionCount)
        : existing.defaultQuestionCount;
    const defaultOption =
      countOptions.find((opt) => opt.count === requestedDefaultCount) ?? countOptions[0];

    const blueprints = countOptions.map((opt, idx) =>
      this.buildBalancedBlueprint(
        opt.count,
        opt.durationMinutes,
        allowedSubjects,
        opt.label,
        idx,
        selectionRules.weightingMode,
      ),
    );

    const guestAccessEnabled =
      typeof input.guestAccessEnabled === 'boolean'
        ? input.guestAccessEnabled
        : existing.guestAccessEnabled;
    const showResultsImmediately =
      typeof input.showResultsImmediately === 'boolean'
        ? input.showResultsImmediately
        : existing.showResultsImmediately;
    const showSolutionsAfterSubmit =
      typeof input.showSolutionsAfterSubmit === 'boolean'
        ? input.showSolutionsAfterSubmit
        : existing.showSolutionsAfterSubmit;
    const admissionCtaEnabled =
      typeof input.admissionCtaEnabled === 'boolean'
        ? input.admissionCtaEnabled
        : existing.admissionCtaEnabled;

    return {
      isEnabled,
      examCategory: rawCategory,
      title,
      code,
      instructionsEn,
      instructionsTa,
      allowedSubjects,
      allowedLanguages,
      defaultSubject,
      defaultLanguage,
      defaultQuestionCount: defaultOption.count,
      defaultDurationMinutes: defaultOption.durationMinutes,
      countOptions,
      blueprints,
      poolMode: 'AUTOMATIC' as PoolMode,
      selectionRules,
      guestAccessEnabled,
      showResultsImmediately,
      showSolutionsAfterSubmit,
      admissionCtaEnabled,
    };
  }

  async update(body: unknown, actorUserId?: string | null) {
    const existing = await this.get(true);
    const sanitized = this.sanitizeSettingsInput(body, existing);

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
  async fetchPoolCandidates(_poolMode?: PoolMode): Promise<CandidateQuestionRecord[]> {
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
      include: {
        options: { orderBy: { position: 'asc' } },
        chapter: { select: { id: true, title: true } },
        courseSubject: { include: { subject: { select: { code: true, name: true } } } },
      },
    });
  }
}
