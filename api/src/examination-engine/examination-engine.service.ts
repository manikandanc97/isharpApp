import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssessmentTestStatus,
  ExamDeliveryMode,
  TestAttemptStatus,
  TestSeriesStatus,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AnswerKeyAuditDto,
  AutosaveAnswerDto,
  SubmitAttemptDto,
} from './dto/examination.dto.js';
import {
  evaluateStudentAttempt,
  type AttemptQuestionEvaluationInput,
} from './examination-evaluation.helper.js';
import {
  createOptionMappings,
  generateSecureSeed,
  secureShuffle,
} from './examination-randomization.helper.js';

@Injectable()
export class ExaminationEngineService {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // 1. START OR RESUME ATTEMPT
  // --------------------------------------------------------------------------

  async startOrResumeAttempt(
    profileId: string | null,
    testId: string,
    clientInfo?: { ip?: string; userAgent?: string },
  ) {
    if (!profileId) {
      throw new ForbiddenException('Authenticated student profile is required');
    }

    const test = await this.prisma.assessmentTest.findUnique({
      where: { id: testId },
      include: {
        testSeries: {
          select: {
            id: true,
            title: true,
            status: true,
            isActive: true,
            courseId: true,
          },
        },
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
    });

    if (!test) {
      throw new NotFoundException('Assessment test not found');
    }

    if (
      test.testSeries &&
      (test.testSeries.status !== TestSeriesStatus.PUBLISHED || !test.testSeries.isActive)
    ) {
      throw new BadRequestException('The test series containing this examination is not currently published');
    }

    if (
      test.status !== AssessmentTestStatus.PUBLISHED &&
      test.status !== AssessmentTestStatus.SCHEDULED
    ) {
      throw new BadRequestException('This test is not currently open for examination');
    }

    const now = new Date();
    if (test.scheduledAt && test.scheduledAt > now) {
      throw new BadRequestException('This examination is scheduled for a future time and is not yet available');
    }
    if (test.availableUntil && test.availableUntil < now) {
      throw new BadRequestException('The availability window for this examination has expired');
    }

    // Check for existing IN_PROGRESS attempt
    const existingInProgress = await this.prisma.testAttempt.findFirst({
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

    if (existingInProgress) {
      // Check if attempt timed out while student was away
      if (existingInProgress.expiresAt < now) {
        return this.autoSubmitExpiredAttempt(existingInProgress.id);
      }
      return this.formatSanitizedAttempt(existingInProgress, test);
    }

    // Check attempt limits
    const pastAttemptsCount = await this.prisma.testAttempt.count({
      where: {
        assessmentTestId: testId,
        studentProfileId: profileId,
      },
    });

    if (pastAttemptsCount >= test.maxAttempts) {
      throw new BadRequestException(
        `You have reached the maximum allowed attempts (${test.maxAttempts}) for this examination`,
      );
    }

    if (test.questions.length === 0) {
      throw new BadRequestException('This test has no questions assigned yet');
    }

    // Fetch student membership ID if available
    const membership = await this.prisma.institutionMembership.findUnique({
      where: { userId: profileId },
      select: { id: true },
    });

    // Generate new attempt with server-side cryptographic randomization
    const nextAttemptNumber = pastAttemptsCount + 1;
    const randomSeed = generateSecureSeed();
    const durationMs = test.durationMinutes * 60 * 1000;
    const expiresAt = new Date(Date.now() + durationMs);

    // Shuffle question order if enabled
    const questionItems = test.randomizeQuestions
      ? secureShuffle(test.questions)
      : [...test.questions].sort((a, b) => a.position - b.position);

    const createdAttempt = await this.prisma.$transaction(async (tx) => {
      const attempt = await tx.testAttempt.create({
        data: {
          assessmentTestId: testId,
          studentProfileId: profileId,
          membershipId: membership?.id || null,
          attemptNumber: nextAttemptNumber,
          mode: ExamDeliveryMode.ONLINE,
          status: TestAttemptStatus.IN_PROGRESS,
          startedAt: now,
          expiresAt,
          randomSeed,
          ipAddress: clientInfo?.ip || null,
          userAgent: clientInfo?.userAgent || null,
        },
      });

      for (let i = 0; i < questionItems.length; i++) {
        const item = questionItems[i];
        const attemptQ = await tx.attemptQuestion.create({
          data: {
            attemptId: attempt.id,
            questionId: item.questionId,
            position: i + 1,
            section: item.section,
            correctMarks: item.correctMarks,
            negativeMarks: item.negativeMarks,
            isDropped: item.isDropped,
          },
        });

        // Generate option mappings for options
        const optionMappings = createOptionMappings(
          item.question.options,
          test.randomizeOptions,
        );

        if (optionMappings.length > 0) {
          await tx.attemptOptionMapping.createMany({
            data: optionMappings.map((m) => ({
              attemptQuestionId: attemptQ.id,
              canonicalOptionId: m.canonicalOptionId,
              shuffledPosition: m.shuffledPosition,
              displayedLabel: m.displayedLabel,
            })),
          });
        }
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

    return this.formatSanitizedAttempt(createdAttempt!, test);
  }

  // --------------------------------------------------------------------------
  // 2. GET ACTIVE ATTEMPT (SANITIZED FOR STUDENT)
  // --------------------------------------------------------------------------

  async getAttempt(profileId: string | null, attemptId: string) {
    if (!profileId) throw new ForbiddenException('Student profile required');

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

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.studentProfileId !== profileId) {
      throw new ForbiddenException('You do not have permission to access this attempt');
    }

    const now = new Date();
    if (attempt.status === TestAttemptStatus.IN_PROGRESS && attempt.expiresAt < now) {
      return this.autoSubmitExpiredAttempt(attempt.id);
    }

    return this.formatSanitizedAttempt(attempt, attempt.assessmentTest);
  }

  // --------------------------------------------------------------------------
  // 3. AUTOSAVE ANSWER
  // --------------------------------------------------------------------------

  async autosaveAnswer(
    profileId: string | null,
    attemptId: string,
    dto: AutosaveAnswerDto,
  ) {
    if (!profileId) throw new ForbiddenException('Student profile required');

    const attempt = await this.prisma.testAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        studentProfileId: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.studentProfileId !== profileId) {
      throw new ForbiddenException('Access denied');
    }
    if (attempt.status !== TestAttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Attempt is already submitted or closed');
    }

    const now = new Date();
    // Allow 30 seconds clock drift tolerance
    if (attempt.expiresAt.getTime() + 30_000 < now.getTime()) {
      await this.autoSubmitExpiredAttempt(attemptId);
      throw new BadRequestException('Examination time has expired. Attempt has been submitted.');
    }

    // Verify question belongs to this attempt
    const attemptQuestion = await this.prisma.attemptQuestion.findUnique({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId: dto.questionId,
        },
      },
    });

    if (!attemptQuestion) {
      throw new BadRequestException('Question does not belong to this examination attempt');
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
        selectedOptionId: dto.selectedOptionId !== undefined ? dto.selectedOptionId : undefined,
        numericalAnswer: dto.numericalAnswer !== undefined ? dto.numericalAnswer?.trim() || null : undefined,
        isMarkedForReview: dto.isMarkedForReview !== undefined ? dto.isMarkedForReview : undefined,
        isVisited: dto.isVisited !== undefined ? dto.isVisited : undefined,
        timeSpentSeconds: dto.timeSpentSeconds !== undefined ? dto.timeSpentSeconds : undefined,
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

  // --------------------------------------------------------------------------
  // 4. SUBMIT ATTEMPT & EVALUATE
  // --------------------------------------------------------------------------

  async submitAttempt(
    profileId: string | null,
    attemptId: string,
    dto?: SubmitAttemptDto,
  ) {
    if (!profileId) throw new ForbiddenException('Student profile required');

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

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.studentProfileId !== profileId) {
      throw new ForbiddenException('Access denied');
    }
    if (attempt.status === TestAttemptStatus.SUBMITTED || attempt.status === TestAttemptStatus.EVALUATED) {
      return this.getAttemptResult(profileId, attemptId);
    }

    const now = new Date();
    const durationSeconds = dto?.timeSpentSeconds ?? Math.max(
      0,
      Math.round((now.getTime() - attempt.startedAt.getTime()) / 1000),
    );

    return this.evaluateAndFinalizeAttempt(attempt, now, durationSeconds);
  }

  private async autoSubmitExpiredAttempt(attemptId: string) {
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

  private async evaluateAndFinalizeAttempt(
    attempt: any,
    submittedAt: Date,
    durationSeconds: number,
  ) {
    const answersByQ = new Map<string, any>(attempt.answers.map((a: any) => [a.questionId, a]));

    const evalInputs: AttemptQuestionEvaluationInput[] = attempt.questions.map((aq: any) => {
      const ans = answersByQ.get(aq.questionId);
      const correctOpt = aq.question.options.find((o: any) => o.isCorrect);

      return {
        questionId: aq.questionId,
        position: aq.position,
        section: aq.section,
        correctMarks: aq.correctMarks,
        negativeMarks: aq.negativeMarks,
        isDropped: aq.isDropped,
        selectedOptionId: ans?.selectedOptionId,
        numericalAnswer: ans?.numericalAnswer,
        canonicalCorrectOptionId: correctOpt?.id || null,
        canonicalNumericalAnswer: aq.question.numericalAnswer || null,
        subjectCode: aq.question.courseSubject?.subject?.code,
      };
    });

    const evaluation = evaluateStudentAttempt(
      evalInputs,
      attempt.assessmentTest.hasNegativeMarking,
    );

    return this.prisma.$transaction(async (tx) => {
      // 1. Update attempt status
      await tx.testAttempt.update({
        where: { id: attempt.id },
        data: {
          status: TestAttemptStatus.EVALUATED,
          submittedAt,
          durationSeconds,
          totalScore: evaluation.totalMarksScored,
        },
      });

      // 2. Update individual answers with scoring
      for (const a of evaluation.answers) {
        await tx.attemptAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: attempt.id,
              questionId: a.questionId,
            },
          },
          create: {
            attemptId: attempt.id,
            questionId: a.questionId,
            isCorrect: a.isCorrect,
            marksAwarded: a.marksAwarded,
            isVisited: true,
          },
          update: {
            isCorrect: a.isCorrect,
            marksAwarded: a.marksAwarded,
          },
        });
      }

      // 3. Upsert test result
      const result = await tx.testResult.upsert({
        where: { attemptId: attempt.id },
        create: {
          attemptId: attempt.id,
          assessmentTestId: attempt.assessmentTestId,
          studentProfileId: attempt.studentProfileId,
          totalMarksScored: evaluation.totalMarksScored,
          maxMarks: evaluation.maxMarks,
          percentage: evaluation.percentage,
          accuracyPercentage: evaluation.accuracyPercentage,
          correctCount: evaluation.correctCount,
          incorrectCount: evaluation.incorrectCount,
          unansweredCount: evaluation.unansweredCount,
          physicsScore: evaluation.physicsScore,
          chemistryScore: evaluation.chemistryScore,
          biologyScore: evaluation.biologyScore,
          botanyScore: evaluation.botanyScore,
          zoologyScore: evaluation.zoologyScore,
          subjectBreakdown: evaluation.subjectBreakdown,
          calculatedAt: submittedAt,
        },
        update: {
          totalMarksScored: evaluation.totalMarksScored,
          maxMarks: evaluation.maxMarks,
          percentage: evaluation.percentage,
          accuracyPercentage: evaluation.accuracyPercentage,
          correctCount: evaluation.correctCount,
          incorrectCount: evaluation.incorrectCount,
          unansweredCount: evaluation.unansweredCount,
          physicsScore: evaluation.physicsScore,
          chemistryScore: evaluation.chemistryScore,
          biologyScore: evaluation.biologyScore,
          botanyScore: evaluation.botanyScore,
          zoologyScore: evaluation.zoologyScore,
          subjectBreakdown: evaluation.subjectBreakdown,
          calculatedAt: submittedAt,
        },
      });

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

  // --------------------------------------------------------------------------
  // 5. GET RESULT
  // --------------------------------------------------------------------------

  async getAttemptResult(profileId: string | null, attemptId: string) {
    if (!profileId) throw new ForbiddenException('Student profile required');

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

    if (!result) throw new NotFoundException('Result not found or not yet evaluated');
    if (result.studentProfileId !== profileId) {
      throw new ForbiddenException('Access denied');
    }

    const answersByQ = new Map(result.attempt.answers.map((a) => [a.questionId, a]));

    return {
      attemptId: result.attemptId,
      test: result.assessmentTest,
      score: result.totalMarksScored,
      maxMarks: result.maxMarks,
      percentage: result.percentage,
      accuracy: result.accuracyPercentage,
      correctCount: result.correctCount,
      incorrectCount: result.incorrectCount,
      unansweredCount: result.unansweredCount,
      physicsScore: result.physicsScore,
      chemistryScore: result.chemistryScore,
      biologyScore: result.biologyScore,
      botanyScore: result.botanyScore,
      zoologyScore: result.zoologyScore,
      subjectBreakdown: result.subjectBreakdown,
      calculatedAt: result.calculatedAt.toISOString(),
      // Full review is available if showResultsImmediately is true
      review: result.assessmentTest.showResultsImmediately
        ? result.attempt.questions.map((aq) => {
            const userAns = answersByQ.get(aq.questionId);
            return {
              position: aq.position,
              questionId: aq.questionId,
              textEn: aq.question.textEn,
              textTa: aq.question.textTa,
              questionImageUrl: aq.question.questionImageUrl,
              solutionEn: aq.question.solutionEn,
              solutionTa: aq.question.solutionTa,
              solutionImageUrl: aq.question.solutionImageUrl,
              options: aq.question.options.map((o, optIdx) => {
                const legacy = ['A', 'B', 'C', 'D', 'E', 'F'];
                const legacyIdx = o.label ? legacy.indexOf(o.label.toUpperCase()) : -1;
                const label = legacyIdx !== -1
                  ? String(legacyIdx + 1)
                  : /^[0-9]+$/.test(o.label ?? '')
                    ? String(o.label)
                    : String(optIdx + 1);
                return {
                  id: o.id,
                  label,
                  textEn: o.textEn,
                  textTa: o.textTa,
                  imageUrl: o.imageUrl,
                  isCorrect: o.isCorrect,
                };
              }),
              selectedOptionId: userAns?.selectedOptionId || null,
              isCorrect: userAns?.isCorrect ?? false,
              marksAwarded: userAns?.marksAwarded ?? 0,
            };
          })
        : null,
    };
  }

  // --------------------------------------------------------------------------
  // 6. SANITIZED PAYLOAD FORMATTER (NEVER LEAKS ANSWERS)
  // --------------------------------------------------------------------------

  private formatSanitizedAttempt(attempt: any, test: any) {
    const now = Date.now();
    const expiresAtMs = attempt.expiresAt.getTime();
    const secondsRemaining = Math.max(0, Math.floor((expiresAtMs - now) / 1000));

    const answersMap = new Map(
      (attempt.answers || []).map((a: any) => [
        a.questionId,
        {
          selectedOptionId: a.selectedOptionId,
          numericalAnswer: a.numericalAnswer,
          isMarkedForReview: a.isMarkedForReview,
          isVisited: a.isVisited,
          timeSpentSeconds: a.timeSpentSeconds,
        },
      ]),
    );

    // Group subjects
    const subjectsMap = new Map<string, { name: string; code: string; count: number }>();

    const sanitizedQuestions = attempt.questions.map((aq: any) => {
      const q = aq.question;
      const subName = q.courseSubject?.subject?.name || 'General';
      const subCode = q.courseSubject?.subject?.code || 'GEN';

      if (!subjectsMap.has(subCode)) {
        subjectsMap.set(subCode, { name: subName, code: subCode, count: 0 });
      }
      subjectsMap.get(subCode)!.count++;

      // Map options according to attemptOptionMapping
      const optMapByCanonical = new Map<string, any>(
        aq.optionMappings.map((m: any) => [m.canonicalOptionId, m]),
      );

      const mappedOptions = q.options.map((opt: any) => {
        const mapping = optMapByCanonical.get(opt.id);
        const legacy = ['A', 'B', 'C', 'D', 'E', 'F'];
        const legacyIdx = opt.label ? legacy.indexOf(String(opt.label).toUpperCase()) : -1;
        const fallbackLabel = legacyIdx !== -1
          ? String(legacyIdx + 1)
          : /^[0-9]+$/.test(opt.label ?? '')
            ? String(opt.label)
            : opt.label;
        return {
          id: opt.id,
          label: mapping ? mapping.displayedLabel : fallbackLabel,
          position: mapping ? mapping.shuffledPosition : opt.position,
          textEn: opt.textEn,
          textTa: opt.textTa,
          imageUrl: opt.imageUrl,
          // CRITICAL SECURITY RULE: isCorrect is NEVER returned to the student!
        };
      });

      // Sort by displayed position
      mappedOptions.sort((a: any, b: any) => a.position - b.position);

      const savedAnswer = answersMap.get(q.id);

      return {
        id: q.id,
        position: aq.position,
        section: aq.section,
        subject: subName,
        subjectCode: subCode,
        chapterTitle: q.chapter?.title || null,
        difficulty: q.difficulty,
        type: q.type,
        textEn: q.textEn,
        textTa: q.textTa,
        questionImageUrl: q.questionImageUrl,
        correctMarks: aq.correctMarks,
        negativeMarks: aq.negativeMarks,
        options: mappedOptions,
        savedAnswer: savedAnswer || null,
        // CRITICAL SECURITY RULE: solutionEn, solutionTa, solutionImageUrl are NEVER returned during test!
      };
    });

    return {
      attemptId: attempt.id,
      testId: test.id,
      title: test.title,
      code: test.code,
      instructionsEn: test.instructionsEn,
      instructionsTa: test.instructionsTa,
      durationMinutes: test.durationMinutes,
      totalMarks: test.totalMarks,
      totalQuestions: sanitizedQuestions.length,
      startedAt: attempt.startedAt.toISOString(),
      expiresAt: attempt.expiresAt.toISOString(),
      secondsRemaining,
      subjects: Array.from(subjectsMap.values()),
      questions: sanitizedQuestions,
    };
  }

  // --------------------------------------------------------------------------
  // 7. ANSWER KEY AUDIT & SAFE RECALCULATION
  // --------------------------------------------------------------------------

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
      // 1. If dropping question
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
        // Change the canonical correct option
        await tx.questionOption.updateMany({
          where: { questionId: dto.questionId },
          data: { isCorrect: false },
        });
        await tx.questionOption.update({
          where: { id: dto.newKey },
          data: { isCorrect: true },
        });
      }

      // Record audit log
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

    // Safely recalculate all affected results
    return this.recalculateTestResults(testId);
  }

  async recalculateTestResults(testId: string) {
    const attempts = await this.prisma.testAttempt.findMany({
      where: {
        assessmentTestId: testId,
        status: { in: [TestAttemptStatus.SUBMITTED, TestAttemptStatus.EVALUATED] },
      },
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

    let recalculatedCount = 0;

    for (const attempt of attempts) {
      const answersByQ = new Map<string, any>(attempt.answers.map((a: any) => [a.questionId, a]));

      const evalInputs: AttemptQuestionEvaluationInput[] = attempt.questions.map((aq) => {
        const ans = answersByQ.get(aq.questionId);
        const correctOpt = aq.question.options.find((o) => o.isCorrect);

        return {
          questionId: aq.questionId,
          position: aq.position,
          section: aq.section,
          correctMarks: aq.correctMarks,
          negativeMarks: aq.negativeMarks,
          isDropped: aq.isDropped,
          selectedOptionId: ans?.selectedOptionId,
          numericalAnswer: ans?.numericalAnswer,
          canonicalCorrectOptionId: correctOpt?.id || null,
          canonicalNumericalAnswer: aq.question.numericalAnswer || null,
          subjectCode: aq.question.courseSubject?.subject?.code,
        };
      });

      const evaluation = evaluateStudentAttempt(
        evalInputs,
        attempt.assessmentTest.hasNegativeMarking,
      );

      await this.prisma.$transaction(async (tx) => {
        await tx.testAttempt.update({
          where: { id: attempt.id },
          data: { totalScore: evaluation.totalMarksScored },
        });

        for (const a of evaluation.answers) {
          await tx.attemptAnswer.updateMany({
            where: { attemptId: attempt.id, questionId: a.questionId },
            data: { isCorrect: a.isCorrect, marksAwarded: a.marksAwarded },
          });
        }

        await tx.testResult.upsert({
          where: { attemptId: attempt.id },
          create: {
            attemptId: attempt.id,
            assessmentTestId: attempt.assessmentTestId,
            studentProfileId: attempt.studentProfileId,
            totalMarksScored: evaluation.totalMarksScored,
            maxMarks: evaluation.maxMarks,
            percentage: evaluation.percentage,
            accuracyPercentage: evaluation.accuracyPercentage,
            correctCount: evaluation.correctCount,
            incorrectCount: evaluation.incorrectCount,
            unansweredCount: evaluation.unansweredCount,
            physicsScore: evaluation.physicsScore,
            chemistryScore: evaluation.chemistryScore,
            biologyScore: evaluation.biologyScore,
            botanyScore: evaluation.botanyScore,
            zoologyScore: evaluation.zoologyScore,
            subjectBreakdown: evaluation.subjectBreakdown,
            calculatedAt: new Date(),
          },
          update: {
            totalMarksScored: evaluation.totalMarksScored,
            maxMarks: evaluation.maxMarks,
            percentage: evaluation.percentage,
            accuracyPercentage: evaluation.accuracyPercentage,
            correctCount: evaluation.correctCount,
            incorrectCount: evaluation.incorrectCount,
            unansweredCount: evaluation.unansweredCount,
            physicsScore: evaluation.physicsScore,
            chemistryScore: evaluation.chemistryScore,
            biologyScore: evaluation.biologyScore,
            botanyScore: evaluation.botanyScore,
            zoologyScore: evaluation.zoologyScore,
            subjectBreakdown: evaluation.subjectBreakdown,
            calculatedAt: new Date(),
          },
        });
      });

      recalculatedCount++;
    }

    // Mark audits as recalculated
    await this.prisma.answerKeyAudit.updateMany({
      where: { assessmentTestId: testId, recalculated: false },
      data: { recalculated: true, affectedAttempts: recalculatedCount },
    });

    return { testId, recalculatedCount };
  }
}
