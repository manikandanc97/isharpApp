import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Optional,
} from '@nestjs/common';
import {
  ExamDeliveryMode,
  TestAttemptStatus,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AutosaveAnswerDto } from '../dto/examination.dto.js';
import {
  createOptionMappings,
  generateSecureSeed,
  secureShuffle,
} from '../examination-randomization.helper.js';
import { formatSanitizedAttempt } from '../helpers/attempt-payload.helper.js';
import {
  assertAttemptOwnership,
  assertStudentProfileId,
  assertTestOpenForAttempt,
} from '../policies/attempt-access.policy.js';
import { AttemptSubmissionService } from './attempt-submission.service.js';

const OPTION_MAPPING_BATCH_SIZE = 500;

@Injectable()
export class AttemptLifecycleService {
  private readonly submission: AttemptSubmissionService;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() submission?: AttemptSubmissionService,
  ) {
    this.submission = submission ?? new AttemptSubmissionService(prisma);
  }

  async startOrResumeAttempt(
    profileId: string | null,
    testId: string,
    clientInfo?: { ip?: string; userAgent?: string },
  ) {
    assertStudentProfileId(profileId);

    const [test, existingInProgress] = await Promise.all([
      this.prisma.assessmentTest.findUnique({
        where: { id: testId },
        include: {
          testSeries: {
            select: {
              id: true,
              title: true,
              isActive: true,
              courseId: true,
            },
          },
        },
      }),
      this.prisma.testAttempt.findFirst({
        where: {
          assessmentTestId: testId,
          studentProfileId: profileId,
          status: TestAttemptStatus.IN_PROGRESS,
        },
        include: {
          questions: {
            orderBy: { position: 'asc' },
            include: {
              optionMappings: { orderBy: { shuffledPosition: 'asc' } },
              question: {
                include: {
                  options: true,
                  courseSubject: { include: { subject: true } },
                  chapter: true,
                },
              },
            },
          },
          answers: true,
        },
      }),
    ]);

    const now = new Date();
    assertTestOpenForAttempt(test, now);

    if (existingInProgress) {
      if (existingInProgress.expiresAt < now) {
        return this.submission.autoSubmitExpiredAttempt(existingInProgress.id);
      }
      return formatSanitizedAttempt(existingInProgress, test);
    }

    const [pastAttemptsCount, membership, testWithQuestions] = await Promise.all([
      this.prisma.testAttempt.count({
        where: {
          assessmentTestId: testId,
          studentProfileId: profileId,
        },
      }),
      this.prisma.institutionMembership.findUnique({
        where: { userId: profileId },
        select: { id: true },
      }),
      this.prisma.assessmentTest.findUnique({
        where: { id: testId },
        select: {
          questions: {
            include: {
              question: {
                include: {
                  options: true,
                  courseSubject: { include: { subject: true } },
                  chapter: true,
                },
              },
            },
          },
        },
      }),
    ]);

    if (pastAttemptsCount >= test.maxAttempts) {
      throw new BadRequestException(
        `You have reached the maximum allowed attempts (${test.maxAttempts}) for this examination`,
      );
    }

    const assignedQuestions = testWithQuestions?.questions ?? [];
    if (assignedQuestions.length === 0) {
      throw new BadRequestException('This test has no questions assigned yet');
    }

    if (
      typeof test.totalQuestions === 'number' &&
      assignedQuestions.length !== test.totalQuestions
    ) {
      throw new BadRequestException(
        `This test has an incomplete question set (${assignedQuestions.length} of ${test.totalQuestions} questions assigned) and cannot accept new attempts`,
      );
    }

    const randomSeed = generateSecureSeed();
    const durationMs = test.durationMinutes * 60 * 1000;
    const expiresAt = new Date(Date.now() + durationMs);

    const questionItems = test.randomizeQuestions
      ? secureShuffle(assignedQuestions)
      : [...assignedQuestions].sort((a, b) => a.position - b.position);

    const createdAttempt = await this.prisma.$transaction(async (tx) => {
      const concurrentActive = await tx.testAttempt.findFirst({
        where: {
          assessmentTestId: testId,
          studentProfileId: profileId,
          status: TestAttemptStatus.IN_PROGRESS,
        },
        include: {
          questions: {
            orderBy: { position: 'asc' },
            include: {
              optionMappings: { orderBy: { shuffledPosition: 'asc' } },
              question: {
                include: {
                  options: true,
                  courseSubject: { include: { subject: true } },
                  chapter: true,
                },
              },
            },
          },
          answers: true,
        },
      });
      if (concurrentActive) {
        return concurrentActive;
      }

      const txAttemptCount = await tx.testAttempt.count({
        where: {
          assessmentTestId: testId,
          studentProfileId: profileId,
        },
      });
      if (txAttemptCount >= test.maxAttempts) {
        throw new BadRequestException(
          `You have reached the maximum allowed attempts (${test.maxAttempts}) for this examination`,
        );
      }

      const attempt = await tx.testAttempt.create({
        data: {
          assessmentTestId: testId,
          studentProfileId: profileId,
          membershipId: membership?.id || null,
          attemptNumber: txAttemptCount + 1,
          mode: ExamDeliveryMode.ONLINE,
          status: TestAttemptStatus.IN_PROGRESS,
          startedAt: now,
          expiresAt,
          randomSeed,
          ipAddress: clientInfo?.ip || null,
          userAgent: clientInfo?.userAgent || null,
        },
      });

      const attemptQuestionsData: Array<{
        id: string;
        attemptId: string;
        questionId: string;
        position: number;
        section: string;
        correctMarks: number;
        negativeMarks: number;
        isDropped: boolean;
      }> = [];
      const optionMappingsData: Array<{
        attemptQuestionId: string;
        canonicalOptionId: string;
        shuffledPosition: number;
        displayedLabel: string;
      }> = [];

      for (let i = 0; i < questionItems.length; i++) {
        const item = questionItems[i];
        const attemptQuestionId = randomUUID();
        attemptQuestionsData.push({
          id: attemptQuestionId,
          attemptId: attempt.id,
          questionId: item.questionId,
          position: i + 1,
          section: item.section,
          correctMarks: item.correctMarks,
          negativeMarks: item.negativeMarks,
          isDropped: item.isDropped,
        });

        const optionMappings = createOptionMappings(
          item.question.options,
          test.randomizeOptions,
        );
        for (const m of optionMappings) {
          optionMappingsData.push({
            attemptQuestionId,
            canonicalOptionId: m.canonicalOptionId,
            shuffledPosition: m.shuffledPosition,
            displayedLabel: m.displayedLabel,
          });
        }
      }

      if (attemptQuestionsData.length > 0) {
        await tx.attemptQuestion.createMany({
          data: attemptQuestionsData,
        });
      }

      for (
        let offset = 0;
        offset < optionMappingsData.length;
        offset += OPTION_MAPPING_BATCH_SIZE
      ) {
        await tx.attemptOptionMapping.createMany({
          data: optionMappingsData.slice(
            offset,
            offset + OPTION_MAPPING_BATCH_SIZE,
          ),
        });
      }

      return tx.testAttempt.findUnique({
        where: { id: attempt.id },
        include: {
          questions: {
            orderBy: { position: 'asc' },
            include: {
              optionMappings: { orderBy: { shuffledPosition: 'asc' } },
              question: {
                include: {
                  options: true,
                  courseSubject: { include: { subject: true } },
                  chapter: true,
                },
              },
            },
          },
          answers: true,
        },
      });
    });

    if (createdAttempt && createdAttempt.expiresAt < now) {
      return this.submission.autoSubmitExpiredAttempt(createdAttempt.id);
    }

    return formatSanitizedAttempt(createdAttempt!, test);
  }

  async getAttempt(profileId: string | null, attemptId: string) {
    assertStudentProfileId(profileId, 'Student profile required');

    const attempt = await this.prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessmentTest: true,
        questions: {
          orderBy: { position: 'asc' },
          include: {
            optionMappings: { orderBy: { shuffledPosition: 'asc' } },
            question: {
              include: {
                options: true,
                courseSubject: { include: { subject: true } },
                chapter: true,
              },
            },
          },
        },
        answers: true,
      },
    });

    assertAttemptOwnership(attempt, profileId);

    const now = new Date();
    if (
      attempt.status === TestAttemptStatus.IN_PROGRESS &&
      attempt.expiresAt < now
    ) {
      return this.submission.autoSubmitExpiredAttempt(attempt.id);
    }

    return formatSanitizedAttempt(attempt, attempt.assessmentTest);
  }

  async autosaveAnswer(
    profileId: string | null,
    attemptId: string,
    dto: AutosaveAnswerDto,
  ) {
    assertStudentProfileId(profileId, 'Student profile required');

    const attempt = await this.prisma.testAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        studentProfileId: true,
        status: true,
        expiresAt: true,
      },
    });

    assertAttemptOwnership(attempt, profileId, 'Access denied');

    if (attempt.status !== TestAttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Attempt is already submitted or closed');
    }

    const now = new Date();
    if (attempt.expiresAt.getTime() + 30_000 < now.getTime()) {
      await this.submission.autoSubmitExpiredAttempt(attemptId);
      throw new BadRequestException(
        'Examination time has expired. Attempt has been submitted.',
      );
    }

    const attemptQuestion = await this.prisma.attemptQuestion.findUnique({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId: dto.questionId,
        },
      },
    });

    if (!attemptQuestion) {
      throw new BadRequestException(
        'Question does not belong to this examination attempt',
      );
    }

    const saved = await this.prisma.attemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId: dto.questionId,
        },
      },
      create: {
        attemptId,
        questionId: dto.questionId,
        selectedOptionId: dto.selectedOptionId || null,
        numericalAnswer: dto.numericalAnswer?.trim() || null,
        isMarkedForReview: dto.isMarkedForReview ?? false,
        isVisited: dto.isVisited !== false,
        timeSpentSeconds: dto.timeSpentSeconds ?? 0,
        answeredAt: dto.selectedOptionId ? now : null,
      },
      update: {
        selectedOptionId:
          dto.selectedOptionId !== undefined ? dto.selectedOptionId : undefined,
        numericalAnswer:
          dto.numericalAnswer !== undefined
            ? dto.numericalAnswer?.trim() || null
            : undefined,
        isMarkedForReview:
          dto.isMarkedForReview !== undefined
            ? dto.isMarkedForReview
            : undefined,
        isVisited: dto.isVisited !== undefined ? dto.isVisited : undefined,
        timeSpentSeconds:
          dto.timeSpentSeconds !== undefined ? dto.timeSpentSeconds : undefined,
        answeredAt: dto.selectedOptionId ? now : undefined,
      },
    });

    return {
      attemptId,
      questionId: dto.questionId,
      selectedOptionId: saved.selectedOptionId,
      numericalAnswer: saved.numericalAnswer,
      isMarkedForReview: saved.isMarkedForReview,
      isVisited: saved.isVisited,
      timeSpentSeconds: saved.timeSpentSeconds,
      savedAt: now.toISOString(),
    };
  }
}
