import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  evaluateQuestionEligibility,
  type CandidateQuestionRecord,
} from './demo-test-eligibility.helper.js';
import {
  DEFAULT_DEMO_BLUEPRINTS,
  DEFAULT_DEMO_CONFIG,
  DEFAULT_DEMO_COUNT_OPTIONS,
  DEFAULT_DEMO_SELECTION_RULES,
  type DemoBlueprint,
  type DemoCountOption,
  type DemoSelectionRules,
  type DemoTestConfigurationPayload,
  type LanguageMode,
  type PoolMode,
  type PublishStatus,
  type SubjectMode,
} from './demo-test.types.js';

export interface PoolQuestionFilters {
  page?: number;
  limit?: number;
  query?: string;
  subject?: string;
  chapterId?: string;
  difficulty?: string;
  language?: string;
  type?: string;
  mediaFilter?: string;
  activeFilter?: string;
  approvalFilter?: string;
  usageFilter?: string;
}

@Injectable()
export class DemoTestConfigurationService {
  constructor(private readonly prisma: PrismaService) {}

  private parseBlueprints(value: unknown, countOptionsFallback?: unknown): DemoBlueprint[] {
    if (Array.isArray(value) && value.length > 0) {
      const parsed = value.slice(0, 6).flatMap((item, idx) => {
        if (!item || typeof item !== 'object') return [];
        const e = item as Record<string, unknown>;
        const count = Number(e.count);
        const durationMinutes = Number(e.durationMinutes);
        if (
          !Number.isInteger(count) ||
          count < 1 ||
          count > 200 ||
          !Number.isInteger(durationMinutes) ||
          durationMinutes < 1 ||
          durationMinutes > 600
        ) {
          return [];
        }
        const label =
          typeof e.label === 'string' && e.label.trim()
            ? e.label.trim().slice(0, 50)
            : `${count} Questions`;
        const id =
          typeof e.id === 'string' && e.id.trim()
            ? e.id.trim().slice(0, 40)
            : `blueprint-${idx + 1}`;
        const sd = (e.subjectDistribution ?? {}) as Record<string, unknown>;
        let phy = Number.isInteger(Number(sd.PHYSICS)) ? Math.max(0, Number(sd.PHYSICS)) : Math.round(count * 0.25);
        let chem = Number.isInteger(Number(sd.CHEMISTRY)) ? Math.max(0, Number(sd.CHEMISTRY)) : Math.round(count * 0.25);
        let bio = Number.isInteger(Number(sd.BIOLOGY)) ? Math.max(0, Number(sd.BIOLOGY)) : Math.max(0, count - phy - chem);
        if (phy + chem + bio !== count) {
          phy = Math.round(count * 0.25);
          chem = Math.round(count * 0.25);
          bio = Math.max(0, count - phy - chem);
        }
        return [
          {
            id,
            label,
            count,
            durationMinutes,
            maxMarks: count * 4,
            subjectDistribution: { PHYSICS: phy, CHEMISTRY: chem, BIOLOGY: bio },
          },
        ];
      });
      if (parsed.length) return parsed;
    }

    if (Array.isArray(countOptionsFallback) && countOptionsFallback.length > 0) {
      return this.parseCountOptions(countOptionsFallback).map((opt, idx) => {
        const phy = Math.round(opt.count * 0.25);
        const chem = Math.round(opt.count * 0.25);
        const bio = Math.max(0, opt.count - phy - chem);
        return {
          id: `blueprint-${idx + 1}`,
          label: opt.label,
          count: opt.count,
          durationMinutes: opt.durationMinutes,
          maxMarks: opt.count * 4,
          subjectDistribution: { PHYSICS: phy, CHEMISTRY: chem, BIOLOGY: bio },
        };
      });
    }

    return DEFAULT_DEMO_BLUEPRINTS;
  }

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
      ) {
        return [];
      }
      const label =
        typeof entry.label === 'string' ? entry.label.trim().slice(0, 50) : '';
      return [{ count, durationMinutes, label: label || `${count} Questions` }];
    });
    return result.length ? result : DEFAULT_DEMO_COUNT_OPTIONS;
  }

  private parseSelectionRules(value: unknown): DemoSelectionRules {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ...DEFAULT_DEMO_SELECTION_RULES };
    }
    const v = value as Record<string, unknown>;
    const diff = (v.difficultyDistribution ?? {}) as Record<string, unknown>;
    const easy = Number.isFinite(Number(diff.EASY)) ? Math.max(0, Math.min(100, Number(diff.EASY))) : 40;
    const medium = Number.isFinite(Number(diff.MEDIUM)) ? Math.max(0, Math.min(100, Number(diff.MEDIUM))) : 40;
    const hard = Number.isFinite(Number(diff.HARD)) ? Math.max(0, Math.min(100, Number(diff.HARD))) : 20;

    return {
      autoRandomSelection: v.autoRandomSelection !== false,
      visitorRepeatPrevention: v.visitorRepeatPrevention !== false,
      equivalentRepeatPrevention: v.equivalentRepeatPrevention !== false,
      globalExposureBalancing: v.globalExposureBalancing !== false,
      recentPaperUniqueness: v.recentPaperUniqueness !== false,
      recentPaperWindow:
        Number.isInteger(Number(v.recentPaperWindow)) && Number(v.recentPaperWindow) >= 1
          ? Math.min(200, Number(v.recentPaperWindow))
          : DEFAULT_DEMO_SELECTION_RULES.recentPaperWindow,
      maxPaperOverlapRatio:
        Number.isFinite(Number(v.maxPaperOverlapRatio)) &&
        Number(v.maxPaperOverlapRatio) >= 0 &&
        Number(v.maxPaperOverlapRatio) <= 1
          ? Number(v.maxPaperOverlapRatio)
          : DEFAULT_DEMO_SELECTION_RULES.maxPaperOverlapRatio,
      shuffleQuestions: v.shuffleQuestions !== false,
      shuffleOptions: v.shuffleOptions !== false,
      cooldownHours:
        Number.isInteger(Number(v.cooldownHours)) && Number(v.cooldownHours) >= 0
          ? Math.min(720, Number(v.cooldownHours))
          : DEFAULT_DEMO_SELECTION_RULES.cooldownHours,
      strictNoRepeat: v.strictNoRepeat === true,
      smartReuseAfterExhaustion: v.smartReuseAfterExhaustion !== false,
      minUniquePoolSize:
        Number.isInteger(Number(v.minUniquePoolSize)) && Number(v.minUniquePoolSize) >= 1
          ? Math.min(1000, Number(v.minUniquePoolSize))
          : DEFAULT_DEMO_SELECTION_RULES.minUniquePoolSize,
      chapterDiversity: v.chapterDiversity !== false,
      questionTypeDiversity: v.questionTypeDiversity !== false,
      minImageQuestions:
        Number.isInteger(Number(v.minImageQuestions)) && Number(v.minImageQuestions) >= 0
          ? Math.min(50, Number(v.minImageQuestions))
          : 0,
      difficultyDistribution: { EASY: easy, MEDIUM: medium, HARD: hard },
      weightingMode: v.weightingMode === 'EQUAL' ? 'EQUAL' : 'WEIGHTED',
    };
  }

  private normalizeRecord(
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
      poolMode?: string;
      selectionRules?: unknown;
      blueprints?: unknown;
      guestAccessEnabled?: boolean;
      showResultsImmediately?: boolean;
      showSolutionsAfterSubmit?: boolean;
      admissionCtaEnabled?: boolean;
      publishStatus?: string;
      publishedVersionId?: string | null;
      publishedAt?: Date | null;
      draftSnapshot?: unknown;
      questions?: { questionId: string; isApproved?: boolean }[];
    } | null,
    preferDraft = false,
  ): DemoTestConfigurationPayload {
    if (!record) return { ...DEFAULT_DEMO_CONFIG };

    const source =
      preferDraft && record.draftSnapshot && typeof record.draftSnapshot === 'object'
        ? (record.draftSnapshot as Record<string, unknown>)
        : null;

    const blueprints = this.parseBlueprints(
      source?.blueprints ?? record.blueprints,
      source?.countOptions ?? record.countOptions,
    );
    const countOptions = blueprints.map((bp) => ({
      count: bp.count,
      durationMinutes: bp.durationMinutes,
      label: bp.label,
    }));

    const poolModeRaw = String(source?.poolMode ?? record.poolMode ?? 'HYBRID').toUpperCase();
    const poolMode: PoolMode =
      poolModeRaw === 'MANUAL' || poolModeRaw === 'AUTOMATIC' ? poolModeRaw : 'HYBRID';

    const publishStatusRaw = String(record.publishStatus ?? 'PUBLISHED').toUpperCase();
    const publishStatus: PublishStatus =
      publishStatusRaw === 'DRAFT' || publishStatusRaw === 'UNPUBLISHED'
        ? publishStatusRaw
        : 'PUBLISHED';

    const allowedSubjects = (
      Array.isArray(source?.allowedSubjects)
        ? source.allowedSubjects.map(String)
        : record.allowedSubjects
    ).filter((s): s is SubjectMode =>
      ['ALL', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY'].includes(s),
    );

    const allowedLanguages = (
      Array.isArray(source?.allowedLanguages)
        ? source.allowedLanguages.map(String)
        : record.allowedLanguages
    ).filter((l): l is LanguageMode => ['en', 'ta'].includes(l));

    return {
      isEnabled:
        source && typeof source.isEnabled === 'boolean'
          ? source.isEnabled
          : record.isEnabled,
      title: String(source?.title ?? record.title ?? DEFAULT_DEMO_CONFIG.title),
      code: String(source?.code ?? record.code ?? DEFAULT_DEMO_CONFIG.code),
      instructionsEn: String(
        source?.instructionsEn ?? record.instructionsEn ?? DEFAULT_DEMO_CONFIG.instructionsEn,
      ),
      instructionsTa: String(
        source?.instructionsTa ?? record.instructionsTa ?? DEFAULT_DEMO_CONFIG.instructionsTa,
      ),
      allowedSubjects: allowedSubjects.length ? allowedSubjects : DEFAULT_DEMO_CONFIG.allowedSubjects,
      allowedLanguages: allowedLanguages.length ? allowedLanguages : DEFAULT_DEMO_CONFIG.allowedLanguages,
      defaultSubject: String(
        source?.defaultSubject ?? record.defaultSubject ?? 'ALL',
      ) as SubjectMode,
      defaultLanguage: String(
        source?.defaultLanguage ?? record.defaultLanguage ?? 'ta',
      ) as LanguageMode,
      defaultQuestionCount: Number(
        source?.defaultQuestionCount ?? record.defaultQuestionCount ?? 9,
      ),
      countOptions,
      blueprints,
      poolMode,
      selectionRules: this.parseSelectionRules(
        source?.selectionRules ?? record.selectionRules,
      ),
      guestAccessEnabled:
        source && typeof source.guestAccessEnabled === 'boolean'
          ? source.guestAccessEnabled
          : (record.guestAccessEnabled ?? true),
      showResultsImmediately:
        source && typeof source.showResultsImmediately === 'boolean'
          ? source.showResultsImmediately
          : (record.showResultsImmediately ?? true),
      showSolutionsAfterSubmit:
        source && typeof source.showSolutionsAfterSubmit === 'boolean'
          ? source.showSolutionsAfterSubmit
          : (record.showSolutionsAfterSubmit ?? true),
      admissionCtaEnabled:
        source && typeof source.admissionCtaEnabled === 'boolean'
          ? source.admissionCtaEnabled
          : (record.admissionCtaEnabled ?? true),
      publishStatus,
      publishedVersionId: record.publishedVersionId ?? null,
      publishedAt: record.publishedAt ? record.publishedAt.toISOString() : null,
      hasDraftChanges: Boolean(record.draftSnapshot),
      selectedQuestionIds:
        record.questions
          ?.filter((item) => item.isApproved !== false)
          .map((item) => item.questionId) ?? [],
    };
  }

  async get(isAdmin = false): Promise<DemoTestConfigurationPayload> {
    const record = await this.prisma.demoTestConfiguration.findUnique({
      where: { id: 'login-demo' },
      include: {
        questions: {
          where: { isApproved: true },
          orderBy: { position: 'asc' },
          select: { questionId: true, isApproved: true },
        },
      },
    });
    const result = this.normalizeRecord(record, isAdmin);
    if (!isAdmin) {
      delete result.selectedQuestionIds;
      // If unpublished, mark disabled for public
      if (result.publishStatus === 'UNPUBLISHED') {
        result.isEnabled = false;
      }
    }
    return result;
  }

  private sanitizeConfigInput(body: unknown) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Invalid demo configuration');
    }
    const input = body as Record<string, unknown>;
    const allowedSubjects = Array.isArray(input.allowedSubjects)
      ? input.allowedSubjects
          .map(String)
          .filter((item): item is SubjectMode =>
            ['ALL', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY'].includes(item),
          )
      : DEFAULT_DEMO_CONFIG.allowedSubjects;
    const allowedLanguages = Array.isArray(input.allowedLanguages)
      ? input.allowedLanguages
          .map(String)
          .filter((item): item is LanguageMode => ['en', 'ta'].includes(item))
      : DEFAULT_DEMO_CONFIG.allowedLanguages;
    if (!allowedSubjects.length || !allowedLanguages.length) {
      throw new BadRequestException('Enable at least one subject and one language');
    }

    const blueprints = this.parseBlueprints(input.blueprints, input.countOptions);
    const countOptions = blueprints.map((bp) => ({
      count: bp.count,
      durationMinutes: bp.durationMinutes,
      label: bp.label,
    }));

    const defaultSubject = allowedSubjects.includes(String(input.defaultSubject) as SubjectMode)
      ? (String(input.defaultSubject) as SubjectMode)
      : allowedSubjects[0];
    const defaultLanguage = allowedLanguages.includes(String(input.defaultLanguage) as LanguageMode)
      ? (String(input.defaultLanguage) as LanguageMode)
      : allowedLanguages[0];
    const requestedCount = Number(input.defaultQuestionCount);
    const defaultQuestionCount = countOptions.some((o) => o.count === requestedCount)
      ? requestedCount
      : countOptions[0].count;

    const poolModeRaw = String(input.poolMode ?? 'HYBRID').toUpperCase();
    const poolMode: PoolMode =
      poolModeRaw === 'MANUAL' || poolModeRaw === 'AUTOMATIC' ? poolModeRaw : 'HYBRID';

    const selectionRules = this.parseSelectionRules(input.selectionRules);
    const diffSum =
      selectionRules.difficultyDistribution.EASY +
      selectionRules.difficultyDistribution.MEDIUM +
      selectionRules.difficultyDistribution.HARD;
    if (diffSum !== 100) {
      throw new BadRequestException(
        `Difficulty distribution must sum to 100% (currently ${diffSum}%)`,
      );
    }

    const text = (value: unknown, fallback: string, max: number) =>
      typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : fallback;

    return {
      isEnabled: input.isEnabled !== false,
      title: text(input.title, DEFAULT_DEMO_CONFIG.title, 200),
      code: text(input.code, DEFAULT_DEMO_CONFIG.code, 64),
      instructionsEn: text(input.instructionsEn, DEFAULT_DEMO_CONFIG.instructionsEn, 20_000),
      instructionsTa: text(input.instructionsTa, DEFAULT_DEMO_CONFIG.instructionsTa, 20_000),
      allowedSubjects,
      allowedLanguages,
      defaultSubject,
      defaultLanguage,
      defaultQuestionCount,
      countOptions,
      blueprints,
      poolMode,
      selectionRules,
      guestAccessEnabled: input.guestAccessEnabled !== false,
      showResultsImmediately: input.showResultsImmediately !== false,
      showSolutionsAfterSubmit: input.showSolutionsAfterSubmit !== false,
      admissionCtaEnabled: input.admissionCtaEnabled !== false,
    };
  }

  async saveDraft(body: unknown, actorUserId?: string | null) {
    const sanitized = this.sanitizeConfigInput(body);
    await this.prisma.demoTestConfiguration.upsert({
      where: { id: 'login-demo' },
      create: {
        id: 'login-demo',
        countOptions: DEFAULT_DEMO_COUNT_OPTIONS as never,
        blueprints: DEFAULT_DEMO_BLUEPRINTS as never,
        selectionRules: DEFAULT_DEMO_SELECTION_RULES as never,
        draftSnapshot: sanitized as never,
      },
      update: {
        draftSnapshot: sanitized as never,
      },
    });
    await this.logAdminAction(actorUserId, 'SAVE_DRAFT', {
      title: sanitized.title,
      poolMode: sanitized.poolMode,
    });
    return this.get(true);
  }

  async update(body: unknown, actorUserId?: string | null) {
    const sanitized = this.sanitizeConfigInput(body);
    await this.prisma.demoTestConfiguration.upsert({
      where: { id: 'login-demo' },
      create: {
        id: 'login-demo',
        ...sanitized,
        countOptions: sanitized.countOptions as never,
        blueprints: sanitized.blueprints as never,
        selectionRules: sanitized.selectionRules as never,
        draftSnapshot: null as never,
      },
      update: {
        ...sanitized,
        countOptions: sanitized.countOptions as never,
        blueprints: sanitized.blueprints as never,
        selectionRules: sanitized.selectionRules as never,
        draftSnapshot: null as never,
      },
    });
    await this.logAdminAction(actorUserId, 'UPDATE_CONFIG', {
      title: sanitized.title,
      poolMode: sanitized.poolMode,
    });
    return this.get(true);
  }

  async validateConfiguration(body?: unknown) {
    const config = body ? this.sanitizeConfigInput(body) : await this.get(true);
    const errors: string[] = [];
    const warnings: string[] = [];

    const candidates = await this.fetchPoolCandidates(config.poolMode);
    const maxBlueprintCount = Math.max(
      ...config.blueprints.map((bp) => bp.count),
    );

    if (candidates.length === 0) {
      errors.push(
        config.poolMode === 'AUTOMATIC'
          ? 'No active, eligible questions exist in the Question Bank.'
          : 'No approved questions exist in the Demo Question Pool. Approve questions in the Question Pool tab before publishing.',
      );
    }

    for (const bp of config.blueprints) {
      const sdSum =
        bp.subjectDistribution.PHYSICS +
        bp.subjectDistribution.CHEMISTRY +
        bp.subjectDistribution.BIOLOGY;
      if (sdSum !== bp.count) {
        errors.push(
          `Blueprint "${bp.label}" subject distribution sums to ${sdSum}, expected ${bp.count}.`,
        );
      }
      if (bp.durationMinutes < 1) {
        errors.push(`Blueprint "${bp.label}" duration must be at least 1 minute.`);
      }
    }

    for (const lang of config.allowedLanguages) {
      for (const subj of config.allowedSubjects) {
        const eligibleForCombo = candidates.filter((q) => {
          const code = q.courseSubject?.subject?.code?.toUpperCase() ?? 'GENERAL';
          if (subj !== 'ALL' && code !== subj) return false;
          return evaluateQuestionEligibility(q, lang).eligible;
        });

        if (eligibleForCombo.length < maxBlueprintCount) {
          errors.push(
            `Insufficient eligible questions for ${subj} (${lang === 'ta' ? 'Tamil + English' : 'English'}): ${eligibleForCombo.length} available, ${maxBlueprintCount} required for largest blueprint.`,
          );
        } else if (eligibleForCombo.length < maxBlueprintCount * 2) {
          warnings.push(
            `Low pool depth for ${subj} (${lang === 'ta' ? 'Tamil + English' : 'English'}): only ${eligibleForCombo.length} questions available (fewer than 2 fresh attempts).`,
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      eligiblePoolCount: candidates.length,
    };
  }

  async publish(actorUserId?: string | null, changeSummary?: string) {
    const current = await this.get(true);
    const validation = await this.validateConfiguration(current);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Configuration validation failed before publish',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    const sanitized = this.sanitizeConfigInput(current);
    const published = await this.prisma.$transaction(async (tx) => {
      const lastVersion = await tx.demoConfigurationVersion.findFirst({
        where: { configId: 'login-demo' },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true },
      });
      const nextVersion = (lastVersion?.versionNumber ?? 0) + 1;

      await tx.demoConfigurationVersion.updateMany({
        where: { configId: 'login-demo', status: 'PUBLISHED' },
        data: { status: 'ARCHIVED' },
      });

      const version = await tx.demoConfigurationVersion.create({
        data: {
          configId: 'login-demo',
          versionNumber: nextVersion,
          status: 'PUBLISHED',
          snapshot: sanitized as never,
          changeSummary: changeSummary?.trim().slice(0, 500) || `Published v${nextVersion}`,
          createdById: actorUserId ?? null,
        },
      });

      await tx.demoTestConfiguration.upsert({
        where: { id: 'login-demo' },
        create: {
          id: 'login-demo',
          ...sanitized,
          countOptions: sanitized.countOptions as never,
          blueprints: sanitized.blueprints as never,
          selectionRules: sanitized.selectionRules as never,
          publishStatus: 'PUBLISHED',
          publishedVersionId: version.id,
          publishedAt: new Date(),
          draftSnapshot: null as never,
        },
        update: {
          ...sanitized,
          countOptions: sanitized.countOptions as never,
          blueprints: sanitized.blueprints as never,
          selectionRules: sanitized.selectionRules as never,
          publishStatus: 'PUBLISHED',
          publishedVersionId: version.id,
          publishedAt: new Date(),
          draftSnapshot: null as never,
        },
      });

      return version;
    });

    await this.logAdminAction(actorUserId, 'PUBLISH', {
      versionNumber: published.versionNumber,
      versionId: published.id,
      changeSummary: published.changeSummary,
    });

    return {
      configuration: await this.get(true),
      version: published,
      warnings: validation.warnings,
    };
  }

  async unpublish(actorUserId?: string | null) {
    await this.prisma.demoTestConfiguration.upsert({
      where: { id: 'login-demo' },
      create: {
        id: 'login-demo',
        isEnabled: false,
        publishStatus: 'UNPUBLISHED',
        countOptions: DEFAULT_DEMO_COUNT_OPTIONS as never,
        blueprints: DEFAULT_DEMO_BLUEPRINTS as never,
        selectionRules: DEFAULT_DEMO_SELECTION_RULES as never,
      },
      update: {
        isEnabled: false,
        publishStatus: 'UNPUBLISHED',
      },
    });
    await this.logAdminAction(actorUserId, 'UNPUBLISH', {});
    return this.get(true);
  }

  async listVersions() {
    return this.prisma.demoConfigurationVersion.findMany({
      where: { configId: 'login-demo' },
      orderBy: { versionNumber: 'desc' },
      take: 30,
    });
  }

  async rollback(versionId: string, actorUserId?: string | null) {
    const target = await this.prisma.demoConfigurationVersion.findUnique({
      where: { id: versionId },
    });
    if (!target || target.configId !== 'login-demo') {
      throw new NotFoundException('Configuration version not found');
    }
    const sanitized = this.sanitizeConfigInput(target.snapshot);
    await this.prisma.demoTestConfiguration.update({
      where: { id: 'login-demo' },
      data: { draftSnapshot: sanitized as never },
    });
    const result = await this.publish(
      actorUserId,
      `Rolled back to v${target.versionNumber}`,
    );
    await this.logAdminAction(actorUserId, 'ROLLBACK', {
      targetVersionId: versionId,
      targetVersionNumber: target.versionNumber,
    });
    return result;
  }

  async fetchPoolCandidates(poolMode: PoolMode): Promise<CandidateQuestionRecord[]> {
    const includeRelations = {
      options: { orderBy: { position: 'asc' as const } },
      chapter: { select: { id: true, title: true } },
      courseSubject: { include: { subject: { select: { code: true, name: true } } } },
    };

    if (poolMode === 'AUTOMATIC') {
      return this.prisma.question.findMany({
        where: { isActive: true, isRestrictedForDemo: false },
        include: includeRelations,
      });
    }

    // MANUAL or HYBRID: strictly use explicitly approved DemoTestQuestion rows (never fall back to entire Question Bank!)
    const poolRows = await this.prisma.demoTestQuestion.findMany({
      where: {
        configId: 'login-demo',
        isApproved: true,
        question: { isActive: true, isRestrictedForDemo: false },
      },
      include: {
        question: { include: includeRelations },
      },
    });
    return poolRows.map((row) => row.question);
  }

  private buildQuestionWhere(filters: PoolQuestionFilters) {
    const where: Record<string, unknown> = {};

    if (filters.activeFilter === 'INACTIVE') {
      where.isActive = false;
    } else if (filters.activeFilter !== 'ALL') {
      where.isActive = true;
    }

    if (filters.subject && ['PHYSICS', 'CHEMISTRY', 'BIOLOGY'].includes(filters.subject.toUpperCase())) {
      where.courseSubject = {
        subject: { code: filters.subject.toUpperCase() },
      };
    }

    if (filters.chapterId) {
      where.chapterId = filters.chapterId;
    }

    if (filters.difficulty && ['EASY', 'MEDIUM', 'HARD'].includes(filters.difficulty.toUpperCase())) {
      where.difficulty = filters.difficulty.toUpperCase();
    }

    if (filters.type && filters.type !== 'ALL') {
      where.type = filters.type.toUpperCase();
    }

    if (filters.language === 'en') {
      where.textEn = { not: null };
    } else if (filters.language === 'ta') {
      where.AND = [
        ...(Array.isArray(where.AND) ? (where.AND as unknown[]) : []),
        { textTa: { not: null } },
        { NOT: { textTa: '' } },
      ];
    }

    if (filters.mediaFilter === 'DIAGRAM') {
      where.AND = [
        ...(Array.isArray(where.AND) ? (where.AND as unknown[]) : []),
        { questionImageUrl: { not: null } },
        { NOT: { questionImageUrl: '' } },
      ];
    } else if (filters.mediaFilter === 'TEXT_ONLY') {
      where.OR = [{ questionImageUrl: null }, { questionImageUrl: '' }];
    } else if (filters.mediaFilter === 'IMAGE_OPTIONS') {
      where.options = { some: { imageUrl: { not: null } } };
    }

    if (filters.approvalFilter === 'APPROVED') {
      where.demoTests = { some: { configId: 'login-demo', isApproved: true } };
    } else if (filters.approvalFilter === 'UNAPPROVED') {
      where.demoTests = { none: { configId: 'login-demo', isApproved: true } };
    } else if (filters.approvalFilter === 'RESTRICTED') {
      where.isRestrictedForDemo = true;
    }

    if (filters.usageFilter === 'FREQUENT') {
      where.demoGlobalStat = { exposureCount: { gte: 5 } };
    } else if (filters.usageFilter === 'RARELY_USED') {
      where.demoGlobalStat = { exposureCount: { gt: 0, lt: 5 } };
    } else if (filters.usageFilter === 'UNUSED') {
      where.OR = [
        ...(Array.isArray(where.OR) ? (where.OR as unknown[]) : []),
        { demoGlobalStat: null },
        { demoGlobalStat: { exposureCount: 0 } },
      ];
    }

    if (filters.query?.trim()) {
      const q = filters.query.trim();
      where.AND = [
        ...(Array.isArray(where.AND) ? (where.AND as unknown[]) : []),
        {
          OR: [
            { externalId: { contains: q, mode: 'insensitive' } },
            { textEn: { contains: q, mode: 'insensitive' } },
            { textTa: { contains: q, mode: 'insensitive' } },
          ],
        },
      ];
    }

    return where;
  }

  async listPoolQuestions(filters: PoolQuestionFilters) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 25));
    const skip = (page - 1) * limit;
    const where = this.buildQuestionWhere(filters);

    const [total, rows] = await Promise.all([
      this.prisma.question.count({ where: where as never }),
      this.prisma.question.findMany({
        where: where as never,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { externalId: 'asc' }],
        include: {
          options: { orderBy: { position: 'asc' } },
          chapter: { select: { id: true, title: true } },
          courseSubject: { include: { subject: { select: { code: true, name: true } } } },
          demoTests: {
            where: { configId: 'login-demo' },
            select: { isApproved: true, addedAt: true },
          },
          demoGlobalStat: {
            select: { exposureCount: true, lastExposedAt: true },
          },
        },
      }),
    ]);

    const items = rows.map((q) => {
      const enCheck = evaluateQuestionEligibility(q, 'en');
      const taCheck = evaluateQuestionEligibility(q, 'ta');
      const hasQuestionImage = Boolean(q.questionImageUrl?.trim());
      const hasOptionImages = q.options.some((o) => Boolean(o.imageUrl?.trim()));
      const isApproved = q.demoTests.some((dt) => dt.isApproved);

      return {
        id: q.id,
        externalId: q.externalId,
        textPreview: (q.textEn || q.textTa || '').slice(0, 180),
        subject: q.courseSubject?.subject?.name ?? 'General',
        subjectCode: q.courseSubject?.subject?.code ?? 'GENERAL',
        chapterTitle: q.chapter?.title ?? null,
        difficulty: q.difficulty,
        type: q.type,
        languageAvailability: taCheck.eligible ? 'BILINGUAL' : enCheck.eligible ? 'ENGLISH' : 'INCOMPLETE',
        hasQuestionImage,
        hasOptionImages,
        isActive: q.isActive,
        isRestrictedForDemo: q.isRestrictedForDemo,
        isApproved,
        isDemoEligible: enCheck.eligible,
        eligibilityIssues: enCheck.reasons,
        globalExposureCount: q.demoGlobalStat?.exposureCount ?? 0,
        lastUsedAt: q.demoGlobalStat?.lastExposedAt?.toISOString() ?? null,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getQuestionPreview(questionId: string) {
    const q = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        options: { orderBy: { position: 'asc' } },
        chapter: { select: { id: true, title: true } },
        courseSubject: { include: { subject: { select: { code: true, name: true } } } },
        demoTests: { where: { configId: 'login-demo' } },
        demoGlobalStat: true,
      },
    });
    if (!q) throw new NotFoundException('Question not found');
    return q;
  }

  async bulkUpdatePool(
    body: {
      action: 'APPROVE' | 'REMOVE' | 'RESTRICT' | 'UNRESTRICT';
      questionIds?: string[];
      selectAllFiltered?: boolean;
      filters?: PoolQuestionFilters;
    },
    actorUserId?: string | null,
  ) {
    if (!body || !['APPROVE', 'REMOVE', 'RESTRICT', 'UNRESTRICT'].includes(body.action)) {
      throw new BadRequestException('Invalid pool action');
    }

    let targetIds: string[] = [];
    if (body.selectAllFiltered) {
      const where = this.buildQuestionWhere(body.filters ?? {});
      const matched = await this.prisma.question.findMany({
        where: where as never,
        select: { id: true },
        take: 5000,
      });
      targetIds = matched.map((m) => m.id);
    } else if (Array.isArray(body.questionIds)) {
      targetIds = [...new Set(body.questionIds.filter((id) => typeof id === 'string'))];
    }

    if (!targetIds.length) {
      return { updatedCount: 0, skippedCount: 0 };
    }

    await this.prisma.demoTestConfiguration.upsert({
      where: { id: 'login-demo' },
      create: {
        id: 'login-demo',
        countOptions: DEFAULT_DEMO_COUNT_OPTIONS as never,
        blueprints: DEFAULT_DEMO_BLUEPRINTS as never,
        selectionRules: DEFAULT_DEMO_SELECTION_RULES as never,
      },
      update: {},
    });

    let updatedCount = 0;
    let skippedCount = 0;

    if (body.action === 'APPROVE') {
      const questions = await this.prisma.question.findMany({
        where: { id: { in: targetIds } },
        include: { options: { orderBy: { position: 'asc' } } },
      });
      const eligibleIds = questions
        .filter((q) => evaluateQuestionEligibility(q, 'en').eligible)
        .map((q) => q.id);
      skippedCount = targetIds.length - eligibleIds.length;

      if (eligibleIds.length) {
        await this.prisma.$transaction(async (tx) => {
          const maxPos = await tx.demoTestQuestion.aggregate({
            where: { configId: 'login-demo' },
            _max: { position: true },
          });
          let nextPos = (maxPos._max.position ?? 0) + 1;

          const existing = await tx.demoTestQuestion.findMany({
            where: { configId: 'login-demo', questionId: { in: eligibleIds } },
            select: { questionId: true },
          });
          const existingSet = new Set(existing.map((e) => e.questionId));
          const toInsert = eligibleIds.filter((id) => !existingSet.has(id));

          if (existing.length) {
            await tx.demoTestQuestion.updateMany({
              where: { configId: 'login-demo', questionId: { in: [...existingSet] } },
              data: { isApproved: true, addedById: actorUserId ?? null },
            });
          }
          if (toInsert.length) {
            await tx.demoTestQuestion.createMany({
              data: toInsert.map((qId) => ({
                configId: 'login-demo',
                questionId: qId,
                position: nextPos++,
                isApproved: true,
                addedById: actorUserId ?? null,
              })),
            });
          }
        });
        updatedCount = eligibleIds.length;
      }
    } else if (body.action === 'REMOVE') {
      const res = await this.prisma.demoTestQuestion.deleteMany({
        where: { configId: 'login-demo', questionId: { in: targetIds } },
      });
      updatedCount = res.count;
    } else if (body.action === 'RESTRICT') {
      await this.prisma.$transaction(async (tx) => {
        const res = await tx.question.updateMany({
          where: { id: { in: targetIds } },
          data: { isRestrictedForDemo: true },
        });
        await tx.demoTestQuestion.deleteMany({
          where: { configId: 'login-demo', questionId: { in: targetIds } },
        });
        updatedCount = res.count;
      });
    } else if (body.action === 'UNRESTRICT') {
      const res = await this.prisma.question.updateMany({
        where: { id: { in: targetIds } },
        data: { isRestrictedForDemo: false },
      });
      updatedCount = res.count;
    }

    await this.logAdminAction(actorUserId, `POOL_${body.action}`, {
      requestedCount: targetIds.length,
      updatedCount,
      skippedCount,
    });

    return { updatedCount, skippedCount };
  }

  async setQuestionPool(body: unknown, actorUserId?: string | null) {
    const questionIds =
      body && typeof body === 'object' && !Array.isArray(body)
        ? (body as Record<string, unknown>).questionIds
        : null;
    if (
      !Array.isArray(questionIds) ||
      questionIds.length > 500 ||
      questionIds.some((id) => typeof id !== 'string')
    ) {
      throw new BadRequestException('questionIds must contain up to 500 IDs');
    }
    const uniqueIds = [...new Set(questionIds as string[])];
    const valid = await this.prisma.question.findMany({
      where: { id: { in: uniqueIds }, isActive: true, isRestrictedForDemo: false },
      select: { id: true },
    });
    if (valid.length !== uniqueIds.length) {
      throw new BadRequestException('One or more selected questions are unavailable or restricted');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.demoTestConfiguration.upsert({
        where: { id: 'login-demo' },
        create: {
          id: 'login-demo',
          countOptions: DEFAULT_DEMO_COUNT_OPTIONS as never,
          blueprints: DEFAULT_DEMO_BLUEPRINTS as never,
          selectionRules: DEFAULT_DEMO_SELECTION_RULES as never,
        },
        update: {},
      });
      await tx.demoTestQuestion.deleteMany({ where: { configId: 'login-demo' } });
      if (uniqueIds.length) {
        await tx.demoTestQuestion.createMany({
          data: uniqueIds.map((questionId, index) => ({
            configId: 'login-demo',
            questionId,
            position: index + 1,
            isApproved: true,
            addedById: actorUserId ?? null,
          })),
        });
      }
    });
    await this.logAdminAction(actorUserId, 'SET_QUESTION_POOL', {
      count: uniqueIds.length,
    });
    return { questionIds: uniqueIds };
  }

  async getPoolHealth() {
    const config = await this.get(true);
    const [allActive, approvedRows, globalStats] = await Promise.all([
      this.prisma.question.findMany({
        where: { isActive: true },
        include: {
          options: { orderBy: { position: 'asc' } },
          courseSubject: { include: { subject: { select: { code: true } } } },
        },
      }),
      this.prisma.demoTestQuestion.findMany({
        where: { configId: 'login-demo', isApproved: true },
        select: { questionId: true },
      }),
      this.prisma.demoQuestionGlobalStat.findMany({
        orderBy: { exposureCount: 'desc' },
        take: 10,
      }),
    ]);

    const approvedSet = new Set(approvedRows.map((r) => r.questionId));
    const poolQuestions =
      config.poolMode === 'AUTOMATIC'
        ? allActive.filter((q) => !q.isRestrictedForDemo)
        : allActive.filter((q) => approvedSet.has(q.id) && !q.isRestrictedForDemo);

    const eligibleQuestions = poolQuestions.filter(
      (q) => evaluateQuestionEligibility(q, 'en').eligible,
    );

    const uniqueEquivSet = new Set<string>();
    const uniqueEligible = eligibleQuestions.filter((q) => {
      const key = q.equivalentFingerprint || q.contentFingerprint || q.id;
      if (uniqueEquivSet.has(key)) return false;
      uniqueEquivSet.add(key);
      return true;
    });

    const bySubject = { PHYSICS: 0, CHEMISTRY: 0, BIOLOGY: 0 };
    const byDifficulty = { EASY: 0, MEDIUM: 0, HARD: 0 };
    const byType: Record<string, number> = {};
    let englishReady = 0;
    let bilingualReady = 0;
    let imageBased = 0;
    let invalidOrDuplicate = 0;

    for (const q of allActive) {
      if (!evaluateQuestionEligibility(q, 'en').eligible) {
        invalidOrDuplicate += 1;
      }
    }

    for (const q of uniqueEligible) {
      const subj = q.courseSubject?.subject?.code?.toUpperCase() ?? '';
      if (subj === 'PHYSICS' || subj === 'CHEMISTRY' || subj === 'BIOLOGY') {
        bySubject[subj] += 1;
      }
      if (q.difficulty === 'EASY' || q.difficulty === 'MEDIUM' || q.difficulty === 'HARD') {
        byDifficulty[q.difficulty] += 1;
      }
      byType[q.type] = (byType[q.type] ?? 0) + 1;
      if (evaluateQuestionEligibility(q, 'en').eligible) englishReady += 1;
      if (evaluateQuestionEligibility(q, 'ta').eligible) bilingualReady += 1;
      if (q.questionImageUrl?.trim() || q.options.some((o) => o.imageUrl?.trim())) {
        imageBased += 1;
      }
    }

    const standardBp =
      config.blueprints.find((bp) => bp.count === config.defaultQuestionCount) ??
      config.blueprints[0];
    const bpCount = standardBp?.count ?? 9;
    const estimatedFreshAttemptsAll = bpCount > 0 ? Math.floor(uniqueEligible.length / bpCount) : 0;

    const warnings: string[] = [];
    if (uniqueEligible.length < config.selectionRules.minUniquePoolSize) {
      warnings.push(
        `Eligible unique pool (${uniqueEligible.length}) is below minimum threshold (${config.selectionRules.minUniquePoolSize}). Add more eligible questions.`,
      );
    }
    if (estimatedFreshAttemptsAll < 3) {
      warnings.push(
        `Pool currently supports only ~${estimatedFreshAttemptsAll} fresh ${bpCount}-question attempt(s) per visitor before reuse.`,
      );
    }
    if (config.allowedLanguages.includes('ta') && bilingualReady < bpCount) {
      warnings.push(
        `Only ${bilingualReady} bilingual (Tamil + English) questions are eligible; ${bpCount} needed for standard blueprint.`,
      );
    }

    const exhaustionRisk =
      uniqueEligible.length === 0
        ? 'CRITICAL'
        : estimatedFreshAttemptsAll < 3
          ? 'HIGH'
          : estimatedFreshAttemptsAll < 8
            ? 'MODERATE'
            : 'LOW';

    return {
      totalQuestionBank: allActive.length,
      approvedPoolCount: approvedSet.size,
      eligibleUniqueCount: uniqueEligible.length,
      bySubject,
      byDifficulty,
      byType,
      englishReady,
      bilingualReady,
      imageBased,
      invalidOrDuplicate,
      estimatedFreshAttemptsPerVisitor: estimatedFreshAttemptsAll,
      exhaustionRisk,
      frequentlyExposedCount: globalStats.filter((s) => s.exposureCount >= 10).length,
      warnings,
      poolMode: config.poolMode,
      publishStatus: config.publishStatus,
    };
  }

  async logAdminAction(
    actorUserId: string | null | undefined,
    action: string,
    details: Record<string, unknown>,
  ) {
    try {
      await this.prisma.demoAdminAuditLog.create({
        data: {
          actorUserId: actorUserId ?? null,
          action,
          details: details as never,
        },
      });
    } catch {
      // Audit logging should not break primary flow
    }
  }
}
