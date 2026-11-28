import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  SetTestBlueprintDto,
  SetTestQuestionsDto,
} from '../dto/test-series.dto.js';
import type { SubjectAllocationInput } from '../question-selection.engine.js';

@Injectable()
export class TestQuestionAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  async syncBlueprints(
    tx: Prisma.TransactionClient,
    testId: string,
    distribution: SubjectAllocationInput[],
    correctMarks: number,
    negativeMarks: number,
  ) {
    const rows: Prisma.TestBlueprintCreateManyInput[] = [];
    let order = 1;
    for (const sub of distribution) {
      if (sub.questionCount <= 0) continue;
      if (
        sub.chapterAllocationMode === 'MANUAL' &&
        sub.chapterAllocations?.length
      ) {
        for (const ch of sub.chapterAllocations) {
          if (ch.count <= 0) continue;
          rows.push({
            assessmentTestId: testId,
            subjectCode: sub.subjectCode.toUpperCase(),
            subjectName: sub.subjectName,
            chapterId: ch.chapterId,
            sectionName: sub.subjectCode.toUpperCase(),
            totalQuestions: ch.count,
            mandatoryCount: ch.count,
            correctMarks,
            negativeMarks,
            orderIndex: order++,
          });
        }
      } else {
        rows.push({
          assessmentTestId: testId,
          subjectCode: sub.subjectCode.toUpperCase(),
          subjectName: sub.subjectName,
          chapterId: null,
          sectionName: sub.subjectCode.toUpperCase(),
          totalQuestions: sub.questionCount,
          mandatoryCount: sub.questionCount,
          correctMarks,
          negativeMarks,
          orderIndex: order++,
        });
      }
    }
    if (rows.length > 0) {
      await tx.testBlueprint.createMany({ data: rows });
    }
  }

  async setTestQuestions(testId: string, dto: SetTestQuestionsDto) {
    const test = await this.prisma.assessmentTest.findUnique({
      where: { id: testId },
      include: { _count: { select: { attempts: true } } },
    });
    if (!test) throw new NotFoundException('Assessment test not found');

    if ((test._count?.attempts ?? 0) > 0) {
      throw new BadRequestException(
        'Cannot modify questions for a test that already has student attempts.',
      );
    }

    const questionIds = dto.questions.map((q) => q.questionId);
    if (new Set(questionIds).size !== questionIds.length) {
      throw new BadRequestException('Duplicate questions are not permitted');
    }

    const dbQuestions = await this.prisma.question.findMany({
      where: { id: { in: questionIds }, isActive: true },
    });
    if (dbQuestions.length !== questionIds.length) {
      throw new BadRequestException(
        'One or more selected questions are invalid or inactive',
      );
    }

    const byId = new Map(dbQuestions.map((q) => [q.id, q]));

    await this.prisma.$transaction(async (tx) => {
      await tx.assessmentTestQuestion.deleteMany({
        where: { assessmentTestId: testId },
      });

      if (dto.questions.length > 0) {
        await tx.assessmentTestQuestion.createMany({
          data: dto.questions.map((item, index) => {
            const q = byId.get(item.questionId)!;
            return {
              assessmentTestId: testId,
              questionId: item.questionId,
              position: item.position ?? index + 1,
              section: item.section || 'A',
              correctMarks:
                item.correctMarks ?? test.correctMarks ?? q.correctMarks,
              negativeMarks:
                item.negativeMarks ?? test.negativeMarks ?? q.negativeMarks,
            };
          }),
        });
      }

      const totalMarks = dto.questions.reduce((sum, item) => {
        const q = byId.get(item.questionId)!;
        return sum + (item.correctMarks ?? test.correctMarks ?? q.correctMarks);
      }, 0);

      await tx.assessmentTest.update({
        where: { id: testId },
        data: {
          totalQuestions: dto.questions.length,
          totalMarks: totalMarks > 0 ? totalMarks : test.totalMarks,
        },
      });
    });

    return {
      testId,
      questionCount: dto.questions.length,
      totalMarks: dto.questions.reduce((sum, item) => {
        const q = byId.get(item.questionId)!;
        return sum + (item.correctMarks ?? test.correctMarks ?? q.correctMarks);
      }, 0),
    };
  }

  async setTestBlueprint(testId: string, dto: SetTestBlueprintDto) {
    const test = await this.prisma.assessmentTest.findUnique({
      where: { id: testId },
    });
    if (!test) throw new NotFoundException('Assessment test not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.testBlueprint.deleteMany({
        where: { assessmentTestId: testId },
      });
      if (dto.blueprints.length > 0) {
        await tx.testBlueprint.createMany({
          data: dto.blueprints.map((b, i) => ({
            assessmentTestId: testId,
            subjectCode: b.subjectCode.toUpperCase(),
            subjectName: b.subjectName,
            chapterId: b.chapterId || null,
            sectionName: b.sectionName || 'Section A',
            totalQuestions: b.totalQuestions,
            mandatoryCount: b.mandatoryCount,
            correctMarks: b.correctMarks ?? 4,
            negativeMarks: b.negativeMarks ?? 1,
            orderIndex: b.orderIndex ?? i + 1,
          })),
        });
      }
    });

    return { testId, blueprintCount: dto.blueprints.length };
  }
}
