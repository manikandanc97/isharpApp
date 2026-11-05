import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { int, obj, str } from './question-validation.helper.js';

export async function createMockTestRecord(
  prisma: PrismaService,
  profileId: string | null,
  body: unknown,
) {
  if (!profileId)
    throw new BadRequestException('Administrator profile is not linked');
  const input = obj(body);
  return prisma.mockTest.create({
    data: {
      code: str(input.code, 'code', true, 64)!,
      title: str(input.title, 'title', true, 200)!,
      description: str(input.description, 'description'),
      durationMinutes: int(input.durationMinutes, 180, 1, 600),
      totalMarks: int(input.totalMarks, 720, 1, 2000),
      createdById: profileId,
    },
  });
}

export async function setMockTestQuestionsRecord(
  prisma: PrismaService,
  id: string,
  body: unknown,
) {
  const values = obj(body).questions;
  if (!Array.isArray(values) || values.length > 200)
    throw new BadRequestException(
      'questions must be an array of up to 200 items',
    );
  const questionIds = values.map((value) =>
    str(obj(value).questionId, 'questionId', true, 64)!,
  );
  if (new Set(questionIds).size !== questionIds.length)
    throw new BadRequestException('Duplicate questions are not allowed');
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds }, isActive: true },
  });
  if (questions.length !== questionIds.length)
    throw new BadRequestException('One or more questions are invalid');
  if (!(await prisma.mockTest.findUnique({ where: { id } })))
    throw new NotFoundException('Mock test not found');
  const byId = new Map(questions.map((question) => [question.id, question]));
  await prisma.$transaction(async (tx) => {
    await tx.mockTestQuestion.deleteMany({ where: { mockTestId: id } });
    if (questionIds.length)
      await tx.mockTestQuestion.createMany({
        data: questionIds.map((questionId, index) => {
          const customSection = obj(values[index]).section;
          return {
            mockTestId: id,
            questionId,
            position: index + 1,
            section:
              typeof customSection === 'string' && customSection.trim()
                ? customSection.trim().slice(0, 50)
                : byId.get(questionId)!.type,
            correctMarks: byId.get(questionId)!.correctMarks,
            negativeMarks: byId.get(questionId)!.negativeMarks,
          };
        }),
      });
  });
  return { id, questionCount: questionIds.length };
}

