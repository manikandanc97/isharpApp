import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { SaveDemoAnswerInput } from '../demo-test.service.js';
import type { ShuffledOptionMapping } from '../demo-test.types.js';

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

    const subjectCounts = new Map<
      string,
      { name: string; code: string; count: number }
    >();

    const questions = attempt.questions.map((aq) => {
      const q = aq.question;
      const subjCode = q.courseSubject?.subject?.code ?? 'GENERAL';
      const subjName = q.courseSubject?.subject?.name ?? 'General';
      const existingSubj = subjectCounts.get(subjCode);
      if (existingSubj) existingSubj.count += 1;
      else
        subjectCounts.set(subjCode, { name: subjName, code: subjCode, count: 1 });

      const mappings = (Array.isArray(aq.optionOrderJson)
        ? aq.optionOrderJson
        : []) as unknown as ShuffledOptionMapping[];
      const optionById = new Map(q.options.map((o) => [o.id, o]));

      const orderedOptions = mappings
        .map((m) => {
          const opt = optionById.get(m.canonicalOptionId);
          if (!opt) return null;
          return {
            id: opt.id,
            label: m.displayedLabel,
            textEn: opt.textEn ?? '',
            textTa: opt.textTa,
            imageUrl: opt.imageUrl,
            position: m.shuffledPosition,
            ...(isFinished ? { isCorrect: opt.isCorrect } : {}),
          };
        })
        .filter((o): o is NonNullable<typeof o> => o !== null);

      return {
        id: q.id,
        externalId: q.externalId,
        type: q.type,
        subject: subjName,
        subjectCode: subjCode,
        chapterTitle: q.chapter?.title ?? null,
        difficulty: q.difficulty,
        textEn: q.textEn ?? '',
        textTa: q.textTa,
        questionImageUrl: q.questionImageUrl,
        correctMarks: aq.correctMarks,
        negativeMarks: aq.negativeMarks,
        options: orderedOptions,
        savedState: {
          selectedOptionId: aq.selectedOptionId,
          numericalAnswer: aq.numericalAnswer,
          isMarkedForReview: aq.isMarkedForReview,
          isVisited: aq.isVisited,
          timeSpentSeconds: aq.timeSpentSeconds,
        },
        ...(isFinished
          ? {
              solutionEn: q.solutionEn,
              solutionTa: q.solutionTa,
              solutionImageUrl: q.solutionImageUrl,
              correctNumericalAnswer: q.numericalAnswer,
              isCorrect: aq.isCorrect,
              marksAwarded: aq.marksAwarded,
            }
          : {}),
      };
    });

    const nowMs = Date.now();
    const remainingSeconds = Math.max(
      0,
      Math.floor((attempt.expiresAt.getTime() - nowMs) / 1000),
    );

    return {
      attemptId: attempt.id,
      testId: attempt.id,
      status: attempt.status,
      isPreview: attempt.isPreview,
      title: attempt.title,
      code: attempt.code,
      instructionsEn: attempt.instructionsEn ?? '',
      instructionsTa: attempt.instructionsTa ?? '',
      subjectMode: attempt.subjectMode,
      languageMode: attempt.languageMode,
      durationMinutes: attempt.durationMinutes,
      totalMarks: attempt.maxMarks,
      questionCount: attempt.questionCount,
      startedAt: attempt.startedAt.toISOString(),
      expiresAt: attempt.expiresAt.toISOString(),
      remainingSeconds,
      controlledReuseUsed: attempt.controlledReuseUsed,
      subjects: Array.from(subjectCounts.values()),
      questions,
      ...(isFinished && attempt.resultSnapshot
        ? { result: attempt.resultSnapshot }
        : {}),
    };
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

    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const subjectStatsMap = new Map<
      string,
      {
        subjectName: string;
        subjectCode: string;
        total: number;
        attempted: number;
        correct: number;
        wrong: number;
        skipped: number;
        marksObtained: number;
        maxMarks: number;
        accuracy: number;
        timeSpentSeconds: number;
      }
    >();

    const chapterStatsMap = new Map<
      string,
      {
        chapterTitle: string;
        total: number;
        correct: number;
        wrong: number;
        skipped: number;
      }
    >();

    const questionUpdates: Array<{
      id: string;
      isCorrect: boolean | null;
      marksAwarded: number;
    }> = [];

    for (const aq of attempt.questions) {
      const q = aq.question;
      const subjCode = q.courseSubject?.subject?.code ?? 'GENERAL';
      const subjName = q.courseSubject?.subject?.name ?? 'General';
      if (!subjectStatsMap.has(subjCode)) {
        subjectStatsMap.set(subjCode, {
          subjectName: subjName,
          subjectCode: subjCode,
          total: 0,
          attempted: 0,
          correct: 0,
          wrong: 0,
          skipped: 0,
          marksObtained: 0,
          maxMarks: 0,
          accuracy: 0,
          timeSpentSeconds: 0,
        });
      }
      const sStat = subjectStatsMap.get(subjCode)!;
      sStat.total += 1;
      sStat.maxMarks += aq.correctMarks;
      sStat.timeSpentSeconds += aq.timeSpentSeconds;

      const chTitle = q.chapter?.title ?? null;
      if (chTitle && !chapterStatsMap.has(chTitle)) {
        chapterStatsMap.set(chTitle, {
          chapterTitle: chTitle,
          total: 0,
          correct: 0,
          wrong: 0,
          skipped: 0,
        });
      }
      const cStat = chTitle ? chapterStatsMap.get(chTitle)! : null;
      if (cStat) cStat.total += 1;

      const hasAttempted =
        q.type === 'NUMERICAL'
          ? Boolean(aq.numericalAnswer?.trim())
          : Boolean(aq.selectedOptionId);

      if (!hasAttempted) {
        unansweredCount += 1;
        sStat.skipped += 1;
        if (cStat) cStat.skipped += 1;
        questionUpdates.push({ id: aq.id, isCorrect: null, marksAwarded: 0 });
        continue;
      }

      sStat.attempted += 1;
      let isCorrect = false;
      if (q.type === 'NUMERICAL') {
        isCorrect =
          (aq.numericalAnswer?.trim() ?? '') ===
          (q.numericalAnswer?.trim() ?? '');
      } else {
        const chosenOpt = q.options.find((o) => o.id === aq.selectedOptionId);
        isCorrect = Boolean(chosenOpt?.isCorrect);
      }

      const marksAwarded = isCorrect ? aq.correctMarks : -aq.negativeMarks;
      totalScore += marksAwarded;
      sStat.marksObtained += marksAwarded;

      if (isCorrect) {
        correctCount += 1;
        sStat.correct += 1;
        if (cStat) cStat.correct += 1;
      } else {
        incorrectCount += 1;
        sStat.wrong += 1;
        if (cStat) cStat.wrong += 1;
      }
      questionUpdates.push({ id: aq.id, isCorrect, marksAwarded });
    }

    const attempted = correctCount + incorrectCount;
    const accuracy =
      attempted > 0 ? Math.round((correctCount / attempted) * 1000) / 10 : 0;
    const percentage =
      attempt.maxMarks > 0
        ? Math.max(0, Math.round((totalScore / attempt.maxMarks) * 1000) / 10)
        : 0;

    const subjectStats = Array.from(subjectStatsMap.values()).map((s) => ({
      ...s,
      accuracy:
        s.attempted > 0 ? Math.round((s.correct / s.attempted) * 1000) / 10 : 0,
    }));

    const resultSnapshot = {
      testId: attempt.id,
      totalQuestions: attempt.questionCount,
      attempted,
      correctCount,
      wrongCount: incorrectCount,
      skippedCount: unansweredCount,
      totalScore,
      maxScore: attempt.maxMarks,
      percentage,
      accuracy,
      totalTimeSpentSeconds: elapsedSeconds,
      subjectStats,
      chapterStats: Array.from(chapterStatsMap.values()),
    };

    await this.prisma.$transaction(async (tx) => {
      if (typeof tx.demoAttemptQuestion.updateMany === 'function') {
        const buckets = new Map<
          string,
          { isCorrect: boolean | null; marksAwarded: number; ids: string[] }
        >();
        for (const upd of questionUpdates) {
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
        for (const upd of questionUpdates) {
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
          totalScore,
          correctCount,
          incorrectCount,
          unansweredCount,
          accuracyPercentage: accuracy,
          resultSnapshot: resultSnapshot as never,
        },
      });

      if (!attempt.isPreview) {
        if (attempt.leadId) {
          await tx.demoLead.update({
            where: { id: attempt.leadId },
            data: {
              latestScore: totalScore,
              latestMaxMarks: attempt.maxMarks,
              latestPercentage: percentage,
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
              totalScore,
              maxMarks: attempt.maxMarks,
              accuracy,
            } as never,
          },
        });
      }
    });

    return this.getAttemptForClient(attemptId, visitorId, true);
  }
}
