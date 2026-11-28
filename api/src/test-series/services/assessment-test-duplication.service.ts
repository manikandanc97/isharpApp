import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { DuplicateTestDto } from '../dto/test-series.dto.js';
import {
  QuestionSelectionEngine,
  type SubjectAllocationInput,
} from '../question-selection.engine.js';

@Injectable()
export class AssessmentTestDuplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questionEngine: QuestionSelectionEngine,
  ) {}

  async duplicateStandaloneTest(
    profileId: string | null,
    testId: string,
    dto?: DuplicateTestDto,
  ) {
    if (!profileId) throw new BadRequestException('User profile is required');
    const source = await this.prisma.assessmentTest.findUnique({
      where: { id: testId },
      include: {
        questions: { orderBy: { position: 'asc' } },
        blueprints: { orderBy: { orderIndex: 'asc' } },
        testSeries: { select: { categoryId: true } },
      },
    });
    if (!source) throw new NotFoundException('Assessment test not found');

    const mode = dto?.mode ?? 'COPY_QUESTIONS';
    const copyCode = `${source.code}-CPY-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    const copyTitle = `${source.title} (Copy)`;
    const categoryId = source.categoryId ?? source.testSeries.categoryId;

    let regeneratedQuestions: Array<{ id: string; subjectCode: string }> | null =
      null;
    if (mode === 'REGENERATE_QUESTIONS') {
      const dist = source.subjectDistribution as SubjectAllocationInput[] | null;
      if (!dist || dist.length === 0) {
        throw new BadRequestException(
          'Cannot regenerate questions because this test has no saved subject distribution',
        );
      }
      const result = await this.questionEngine.generateQuestions({
        subjectAllocations: dist,
      });
      if (result.shortages.length > 0) {
        throw new BadRequestException({
          message: 'Insufficient eligible questions to regenerate test',
          shortages: result.shortages,
        });
      }
      regeneratedQuestions = result.questions.map((q) => ({
        id: q.id,
        subjectCode: q.subjectCode,
      }));
    }

    return this.prisma.$transaction(async (tx) => {
      const copy = await tx.assessmentTest.create({
        data: {
          testSeriesId: source.testSeriesId,
          categoryId,
          code: copyCode,
          title: copyTitle,
          description: source.description,
          instructionsEn: source.instructionsEn,
          instructionsTa: source.instructionsTa,
          testType: source.testType,
          examPatternMode: source.examPatternMode,
          examPatternVersion: source.examPatternVersion,
          questionSelectionMode: source.questionSelectionMode,
          durationMode: source.durationMode,
          subjectDistribution: source.subjectDistribution ?? Prisma.JsonNull,
          isActive: source.isActive,
          isCancelled: false,
          durationMinutes: source.durationMinutes,
          totalQuestions: source.totalQuestions,
          totalMarks: source.totalMarks,
          passingMarks: source.passingMarks,
          hasNegativeMarking: source.hasNegativeMarking,
          correctMarks: source.correctMarks,
          negativeMarks: source.negativeMarks,
          maxAttempts: source.maxAttempts,
          randomizeQuestions: source.randomizeQuestions,
          randomizeOptions: source.randomizeOptions,
          showResultsImmediately: source.showResultsImmediately,
          isOfflineAvailable: source.isOfflineAvailable,
          orderIndex: source.orderIndex + 1,
          createdById: profileId,
        },
      });

      if (regeneratedQuestions) {
        await tx.assessmentTestQuestion.createMany({
          data: regeneratedQuestions.map((q, index) => ({
            assessmentTestId: copy.id,
            questionId: q.id,
            position: index + 1,
            section: q.subjectCode,
            correctMarks: source.correctMarks,
            negativeMarks: source.negativeMarks,
          })),
        });
      } else if (source.questions.length > 0) {
        await tx.assessmentTestQuestion.createMany({
          data: source.questions.map((q) => ({
            assessmentTestId: copy.id,
            questionId: q.questionId,
            position: q.position,
            section: q.section,
            correctMarks: q.correctMarks,
            negativeMarks: q.negativeMarks,
          })),
        });
      }

      if (source.blueprints.length > 0) {
        await tx.testBlueprint.createMany({
          data: source.blueprints.map((b) => ({
            assessmentTestId: copy.id,
            subjectCode: b.subjectCode,
            subjectName: b.subjectName,
            chapterId: b.chapterId,
            sectionName: b.sectionName,
            totalQuestions: b.totalQuestions,
            mandatoryCount: b.mandatoryCount,
            correctMarks: b.correctMarks,
            negativeMarks: b.negativeMarks,
            orderIndex: b.orderIndex,
          })),
        });
      }

      return copy;
    });
  }
}
