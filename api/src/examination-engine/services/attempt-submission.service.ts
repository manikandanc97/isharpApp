import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TestAttemptStatus } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { SubmitAttemptDto } from '../dto/examination.dto.js';
import { evaluateStudentAttempt } from '../examination-evaluation.helper.js';
import { formatAttemptResultResponse } from '../helpers/attempt-payload.helper.js';
import {
  batchUpdateEvaluatedAnswerScores,
  buildAttemptQuestionEvalInputs,
  buildTestResultPersistencePayload,
  type EvaluatableAttemptQuestion,
  type ExistingAttemptAnswerRef,
} from '../helpers/test-evaluation.helper.js';
import {
  assertAttemptOwnership,
  assertStudentProfileId,
} from '../policies/attempt-access.policy.js';

@Injectable()
export class AttemptSubmissionService {
  constructor(private readonly prisma: PrismaService) {}

  async submitAttempt(
    profileId: string | null,
    attemptId: string,
    dto?: SubmitAttemptDto,
  ) {
    assertStudentProfileId(profileId, 'Student profile required');

    const attempt = await this.prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessmentTest: true,
        questions: {
          include: {
            question: {
              include: {
                options: true,
                courseSubject: { include: { subject: true } },
              },
            },
          },
        },
        answers: true,
      },
    });

    assertAttemptOwnership(attempt, profileId, 'Access denied');

    if (
      attempt.status === TestAttemptStatus.SUBMITTED ||
      attempt.status === TestAttemptStatus.EVALUATED
    ) {
      return this.getAttemptResult(profileId, attemptId);
    }

    const now = new Date();
    const durationSeconds =
      dto?.timeSpentSeconds ??
      Math.max(
        0,
        Math.round((now.getTime() - attempt.startedAt.getTime()) / 1000),
      );

    return this.evaluateAndFinalizeAttempt(attempt, now, durationSeconds);
  }

  async autoSubmitExpiredAttempt(attemptId: string) {
    const attempt = await this.prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessmentTest: true,
        questions: {
          include: {
            question: {
              include: {
                options: true,
                courseSubject: { include: { subject: true } },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) return null;
    return this.evaluateAndFinalizeAttempt(
      attempt,
      attempt.expiresAt,
      attempt.assessmentTest.durationMinutes * 60,
    );
  }

  async evaluateAndFinalizeAttempt(
    attempt: {
      id: string;
      assessmentTestId: string;
      studentProfileId: string;
      assessmentTest: {
        hasNegativeMarking: boolean;
        showResultsImmediately: boolean;
      };
      questions: EvaluatableAttemptQuestion[];
      answers: ExistingAttemptAnswerRef[];
    },
    submittedAt: Date,
    durationSeconds: number,
  ) {
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

    return this.prisma.$transaction(async (tx) => {
      await tx.testAttempt.update({
        where: { id: attempt.id },
        data: {
          status: TestAttemptStatus.EVALUATED,
          submittedAt,
          durationSeconds,
          totalScore: evaluation.totalMarksScored,
        },
      });

      const existingEvaluated = evaluation.answers.filter((a) =>
        answersByQ.has(a.questionId),
      );
      const missingEvaluated = evaluation.answers.filter(
        (a) => !answersByQ.has(a.questionId),
      );

      if (existingEvaluated.length > 0) {
        await batchUpdateEvaluatedAnswerScores(tx, attempt.id, existingEvaluated);
      }

      if (missingEvaluated.length > 0) {
        await tx.attemptAnswer.createMany({
          data: missingEvaluated.map((a) => ({
            attemptId: attempt.id,
            questionId: a.questionId,
            isCorrect: a.isCorrect,
            marksAwarded: a.marksAwarded,
            isVisited: true,
          })),
        });
      }

      await tx.testResult.upsert(
        buildTestResultPersistencePayload(
          attempt.id,
          attempt.assessmentTestId,
          attempt.studentProfileId,
          evaluation,
          submittedAt,
        ),
      );

      return {
        attemptId: attempt.id,
        testId: attempt.assessmentTestId,
        status: TestAttemptStatus.EVALUATED,
        submittedAt: submittedAt.toISOString(),
        score: evaluation.totalMarksScored,
        maxMarks: evaluation.maxMarks,
        percentage: evaluation.percentage,
        accuracy: evaluation.accuracyPercentage,
        correctCount: evaluation.correctCount,
        incorrectCount: evaluation.incorrectCount,
        unansweredCount: evaluation.unansweredCount,
        physicsScore: evaluation.physicsScore,
        chemistryScore: evaluation.chemistryScore,
        biologyScore: evaluation.biologyScore,
        subjectBreakdown: evaluation.subjectBreakdown,
        showResultsImmediately: attempt.assessmentTest.showResultsImmediately,
      };
    });
  }

  async getAttemptResult(profileId: string | null, attemptId: string) {
    assertStudentProfileId(profileId, 'Student profile required');

    const result = await this.prisma.testResult.findUnique({
      where: { attemptId },
      include: {
        assessmentTest: {
          select: {
            id: true,
            title: true,
            code: true,
            showResultsImmediately: true,
            totalMarks: true,
            passingMarks: true,
          },
        },
        attempt: {
          include: {
            questions: {
              orderBy: { position: 'asc' },
              include: {
                question: {
                  include: {
                    options: { orderBy: { position: 'asc' } },
                    courseSubject: { include: { subject: true } },
                  },
                },
              },
            },
            answers: true,
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Result not found or not yet evaluated');
    }
    if (result.studentProfileId !== profileId) {
      throw new ForbiddenException('Access denied');
    }

    return formatAttemptResultResponse(result);
  }
}
