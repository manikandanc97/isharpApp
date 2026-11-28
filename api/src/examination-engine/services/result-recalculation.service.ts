import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TestAttemptStatus } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AnswerKeyAuditDto } from '../dto/examination.dto.js';
import { evaluateStudentAttempt } from '../examination-evaluation.helper.js';
import {
  batchUpdateEvaluatedAnswerScores,
  buildAttemptQuestionEvalInputs,
  buildTestResultPersistencePayload,
  type ExistingAttemptAnswerRef,
} from '../helpers/test-evaluation.helper.js';

const RECALC_ATTEMPT_BATCH_SIZE = 25;

@Injectable()
export class ResultRecalculationService {
  constructor(private readonly prisma: PrismaService) {}

  async auditAnswerKeyChange(
    adminProfileId: string | null,
    testId: string,
    dto: AnswerKeyAuditDto,
  ) {
    if (!adminProfileId) throw new ForbiddenException('Admin profile required');

    const test = await this.prisma.assessmentTest.findUnique({
      where: { id: testId },
    });
    if (!test) throw new NotFoundException('Assessment test not found');

    const question = await this.prisma.question.findUnique({
      where: { id: dto.questionId },
      include: { options: true },
    });
    if (!question) throw new NotFoundException('Question not found');

    const previousCorrect = question.options.find((o) => o.isCorrect);

    await this.prisma.$transaction(async (tx) => {
      if (dto.changeType === 'QUESTION_DROPPED') {
        await tx.assessmentTestQuestion.updateMany({
          where: { assessmentTestId: testId, questionId: dto.questionId },
          data: { isDropped: true },
        });
        await tx.attemptQuestion.updateMany({
          where: {
            attempt: { assessmentTestId: testId },
            questionId: dto.questionId,
          },
          data: { isDropped: true },
        });
      } else if (dto.changeType === 'ANSWER_CHANGE') {
        await tx.questionOption.updateMany({
          where: { questionId: dto.questionId },
          data: { isCorrect: false },
        });
        await tx.questionOption.update({
          where: { id: dto.newKey },
          data: { isCorrect: true },
        });
      }

      await tx.answerKeyAudit.create({
        data: {
          assessmentTestId: testId,
          questionId: dto.questionId,
          previousKey: previousCorrect ? previousCorrect.id : 'NONE',
          newKey: dto.newKey,
          changeType: dto.changeType,
          reason: dto.reason,
          changedById: adminProfileId,
          recalculated: false,
        },
      });
    });

    return this.recalculateTestResults(testId);
  }

  async recalculateTestResults(testId: string) {
    let recalculatedCount = 0;
    let cursorId: string | undefined;

    while (true) {
      const attempts = await this.prisma.testAttempt.findMany({
        where: {
          assessmentTestId: testId,
          status: {
            in: [TestAttemptStatus.SUBMITTED, TestAttemptStatus.EVALUATED],
          },
        },
        orderBy: { id: 'asc' },
        take: RECALC_ATTEMPT_BATCH_SIZE,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
        select: {
          id: true,
          assessmentTestId: true,
          studentProfileId: true,
          assessmentTest: { select: { hasNegativeMarking: true } },
          questions: {
            select: {
              questionId: true,
              position: true,
              section: true,
              correctMarks: true,
              negativeMarks: true,
              isDropped: true,
              question: {
                select: {
                  numericalAnswer: true,
                  options: { select: { id: true, isCorrect: true } },
                  courseSubject: {
                    select: { subject: { select: { code: true } } },
                  },
                },
              },
            },
          },
          answers: {
            select: {
              questionId: true,
              selectedOptionId: true,
              numericalAnswer: true,
            },
          },
        },
      });

      if (attempts.length === 0) {
        break;
      }

      for (const attempt of attempts) {
        const answersByQ = new Map<string, ExistingAttemptAnswerRef>(
          attempt.answers.map((a) => [a.questionId, a]),
        );

        const evalInputs = buildAttemptQuestionEvalInputs(
          attempt.questions,
          answersByQ,
        );

        const evaluation = evaluateStudentAttempt(
          evalInputs,
          attempt.assessmentTest.hasNegativeMarking,
        );

        const calculatedAt = new Date();
        await this.prisma.$transaction(async (tx) => {
          await tx.testAttempt.update({
            where: { id: attempt.id },
            data: { totalScore: evaluation.totalMarksScored },
          });

          await batchUpdateEvaluatedAnswerScores(
            tx,
            attempt.id,
            evaluation.answers,
          );

          await tx.testResult.upsert(
            buildTestResultPersistencePayload(
              attempt.id,
              attempt.assessmentTestId,
              attempt.studentProfileId,
              evaluation,
              calculatedAt,
            ),
          );
        });

        recalculatedCount++;
      }

      if (attempts.length < RECALC_ATTEMPT_BATCH_SIZE) {
        break;
      }
      cursorId = attempts[attempts.length - 1].id;
    }

    await this.prisma.answerKeyAudit.updateMany({
      where: { assessmentTestId: testId, recalculated: false },
      data: { recalculated: true, affectedAttempts: recalculatedCount },
    });

    return { testId, recalculatedCount };
  }
}
