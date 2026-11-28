import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { SaveDemoAnswerInput } from '../demo-test.service.js';
import {
  buildDemoClientAttemptPayload,
  evaluateDemoAttemptQuestions,
  type DemoAttemptQuestionRecord,
} from './demo-evaluation.calculator.js';

@Injectable()
export class DemoEvaluationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns attempt state for the exam runner.
   * NEVER exposes isCorrect, numericalAnswer, solutionEn, solutionTa, or solutionImageUrl while IN_PROGRESS.
   */
  async getAttemptForClient(
    attemptId: string,
    visitorId: string,
    allowAdminPreview = false,
  ): Promise<Record<string, unknown>> {
    const attempt = await this.prisma.demoAttempt.findUnique({
      where: { id: attemptId },
      include: {
        questions: {
          orderBy: { position: 'asc' },
          include: {
            question: {
              include: {
                options: true,
                chapter: { select: { id: true, title: true } },
                courseSubject: {
                  include: { subject: { select: { code: true, name: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Demo attempt not found');
    }
    if (
      attempt.visitorId !== visitorId &&
      !(allowAdminPreview && attempt.isPreview)
    ) {
      throw new ForbiddenException(
        'You do not have access to this demo attempt',
      );
    }

    if (attempt.status === 'IN_PROGRESS' && new Date() > attempt.expiresAt) {
      return this.finalizeAttempt(attempt.id, visitorId, 'EXPIRED');
    }

    const isFinished =
      attempt.status === 'SUBMITTED' || attempt.status === 'EXPIRED';

    return buildDemoClientAttemptPayload(
      attempt as unknown as Parameters<typeof buildDemoClientAttemptPayload>[0],
      isFinished,
    );
  }

  async submitAttempt(
    attemptId: string,
    visitorId: string,
    answersPayload?: Record<string, SaveDemoAnswerInput>,
  ) {
    const attempt = await this.prisma.demoAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true, visitorId: true, status: true },
    });
    if (!attempt) throw new NotFoundException('Demo attempt not found');
    if (attempt.visitorId !== visitorId) {
      throw new ForbiddenException('Unauthorized attempt access');
    }

    if (attempt.status === 'SUBMITTED' || attempt.status === 'EXPIRED') {
      return this.getAttemptForClient(attemptId, visitorId, true);
    }

    if (answersPayload && typeof answersPayload === 'object') {
      const entries = Object.entries(answersPayload).filter(
        ([, ans]) => ans && typeof ans === 'object',
      );
      const ANSWER_FLUSH_CONCURRENCY = 10;
      for (let i = 0; i < entries.length; i += ANSWER_FLUSH_CONCURRENCY) {
        const chunk = entries.slice(i, i + ANSWER_FLUSH_CONCURRENCY);
        await Promise.all(
          chunk.map(([qId, ans]) =>
            this.prisma.demoAttemptQuestion
              .updateMany({
                where: { attemptId, questionId: qId },
                data: {
                  ...(ans.selectedOptionId !== undefined
                    ? { selectedOptionId: ans.selectedOptionId }
                    : {}),
                  ...(ans.numericalAnswer !== undefined
                    ? {
                        numericalAnswer:
                          ans.numericalAnswer?.slice(0, 100) ?? null,
                      }
                    : {}),
                  ...(ans.isMarkedForReview !== undefined
                    ? { isMarkedForReview: Boolean(ans.isMarkedForReview) }
                    : {}),
                  ...(ans.isVisited !== undefined
                    ? { isVisited: Boolean(ans.isVisited) }
                    : {}),
                  ...(typeof ans.timeSpentSeconds === 'number' &&
                  ans.timeSpentSeconds >= 0
                    ? {
                        timeSpentSeconds: Math.min(
                          86400,
                          Math.floor(ans.timeSpentSeconds),
                        ),
                      }
                    : {}),
                },
              })
              .catch(() => {}),
          ),
        );
      }
    }

    return this.finalizeAttempt(attemptId, visitorId, 'SUBMITTED');
  }

  async finalizeAttempt(
    attemptId: string,
    visitorId: string,
    targetStatus: 'SUBMITTED' | 'EXPIRED',
  ): Promise<Record<string, unknown>> {
    const attempt = await this.prisma.demoAttempt.findUnique({
      where: { id: attemptId },
      include: {
        questions: {
          orderBy: { position: 'asc' },
          include: {
            question: {
              include: {
                options: true,
                chapter: { select: { title: true } },
                courseSubject: {
                  include: { subject: { select: { code: true, name: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) throw new NotFoundException('Demo attempt not found');
    if (attempt.status === 'SUBMITTED' || attempt.status === 'EXPIRED') {
      return this.getAttemptForClient(attemptId, visitorId, true);
    }

    const now = new Date();
    const elapsedSeconds = Math.min(
      attempt.durationMinutes * 60,
      Math.max(
        0,
        Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000),
      ),
    );

    const evaluation = evaluateDemoAttemptQuestions(
      {
        id: attempt.id,
        questionCount: attempt.questionCount,
        maxMarks: attempt.maxMarks,
        questions: attempt.questions as unknown as DemoAttemptQuestionRecord[],
      },
      elapsedSeconds,
    );

    await this.prisma.$transaction(async (tx) => {
      if (typeof tx.demoAttemptQuestion.updateMany === 'function') {
        const buckets = new Map<
          string,
          { isCorrect: boolean | null; marksAwarded: number; ids: string[] }
        >();
        for (const upd of evaluation.questionUpdates) {
          const key = `${upd.isCorrect === null ? 'null' : upd.isCorrect ? '1' : '0'}:${upd.marksAwarded}`;
          const existing = buckets.get(key);
          if (existing) {
            existing.ids.push(upd.id);
          } else {
            buckets.set(key, {
              isCorrect: upd.isCorrect,
              marksAwarded: upd.marksAwarded,
              ids: [upd.id],
            });
          }
        }
        for (const bucket of buckets.values()) {
          await tx.demoAttemptQuestion.updateMany({
            where: { id: { in: bucket.ids } },
            data: {
              isCorrect: bucket.isCorrect,
              marksAwarded: bucket.marksAwarded,
            },
          });
        }
      } else {
        for (const upd of evaluation.questionUpdates) {
          await tx.demoAttemptQuestion.update({
            where: { id: upd.id },
            data: { isCorrect: upd.isCorrect, marksAwarded: upd.marksAwarded },
          });
        }
      }

      await tx.demoAttempt.update({
        where: { id: attemptId },
        data: {
          status: targetStatus,
          submittedAt: now,
          timeSpentSeconds: elapsedSeconds,
          totalScore: evaluation.totalScore,
          correctCount: evaluation.correctCount,
          incorrectCount: evaluation.incorrectCount,
          unansweredCount: evaluation.unansweredCount,
          accuracyPercentage: evaluation.accuracy,
          resultSnapshot: evaluation.resultSnapshot as never,
        },
      });

      if (!attempt.isPreview) {
        if (attempt.leadId) {
          await tx.demoLead.update({
            where: { id: attempt.leadId },
            data: {
              latestScore: evaluation.totalScore,
              latestMaxMarks: attempt.maxMarks,
              latestPercentage: evaluation.percentage,
              lastAccessAt: now,
            },
          });
        }
        await tx.demoAnalyticsEvent.create({
          data: {
            visitorId: attempt.visitorId,
            attemptId: attempt.id,
            eventType:
              targetStatus === 'EXPIRED'
                ? 'ATTEMPT_EXPIRED'
                : 'ATTEMPT_SUBMITTED',
            subjectMode: attempt.subjectMode,
            languageMode: attempt.languageMode,
            metadata: {
              totalScore: evaluation.totalScore,
              maxMarks: attempt.maxMarks,
              accuracy: evaluation.accuracy,
            } as never,
          },
        });
      }
    });

    return this.getAttemptForClient(attemptId, visitorId, true);
  }
}
