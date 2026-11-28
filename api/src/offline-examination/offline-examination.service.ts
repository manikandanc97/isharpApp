import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AttendanceStatus,
  ExamDeliveryMode,
  TestAttemptStatus,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  evaluateStudentAttempt,
  type AttemptQuestionEvaluationInput,
} from '../examination-engine/examination-evaluation.helper.js';
import { buildTestResultPersistencePayload } from '../examination-engine/helpers/test-evaluation.helper.js';
import type {
  CreateOfflineSessionDto,
  EnterOfflineAnswersDto,
  RecordAttendanceDto,
  UpdateOfflineSessionDto,
} from './dto/offline-examination.dto.js';

@Injectable()
export class OfflineExaminationService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(profileId: string | null, dto: CreateOfflineSessionDto) {
    if (!profileId) throw new BadRequestException('User profile is required');
    const test = await this.prisma.assessmentTest.findUnique({
      where: { id: dto.assessmentTestId },
    });
    if (!test) throw new NotFoundException('Assessment test not found');

    return this.prisma.offlineExamSession.create({
      data: {
        assessmentTestId: dto.assessmentTestId,
        sessionName: dto.sessionName.trim(),
        centerName: dto.centerName?.trim() || 'I-SHARP Main Campus',
        roomNumber: dto.roomNumber?.trim() || null,
        examDate: new Date(dto.examDate),
        startTime: dto.startTime.trim(),
        endTime: dto.endTime.trim(),
        instructions: dto.instructions?.trim() || null,
        createdById: profileId,
      },
      include: {
        assessmentTest: { select: { id: true, title: true, code: true } },
      },
    });
  }

  async listSessions(testId?: string) {
    const where = testId ? { assessmentTestId: testId } : {};
    return this.prisma.offlineExamSession.findMany({
      where,
      include: {
        assessmentTest: { select: { id: true, title: true, code: true } },
        _count: { select: { attendance: true } },
      },
      orderBy: [{ examDate: 'desc' }, { startTime: 'desc' }],
    });
  }

  async getSessionById(sessionId: string) {
    const session = await this.prisma.offlineExamSession.findUnique({
      where: { id: sessionId },
      include: {
        assessmentTest: {
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
          },
        },
        attendance: {
          include: {
            studentProfile: {
              select: {
                id: true,
                displayName: true,
                email: true,
                institutionMembership: { select: { studentId: true } },
              },
            },
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Offline session not found');
    return session;
  }

  async updateSession(sessionId: string, dto: UpdateOfflineSessionDto) {
    const session = await this.prisma.offlineExamSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Offline session not found');

    return this.prisma.offlineExamSession.update({
      where: { id: sessionId },
      data: {
        ...(dto.sessionName ? { sessionName: dto.sessionName.trim() } : {}),
        ...(dto.centerName !== undefined ? { centerName: dto.centerName } : {}),
        ...(dto.roomNumber !== undefined ? { roomNumber: dto.roomNumber } : {}),
        ...(dto.examDate ? { examDate: new Date(dto.examDate) } : {}),
        ...(dto.startTime ? { startTime: dto.startTime } : {}),
        ...(dto.endTime ? { endTime: dto.endTime } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.instructions !== undefined ? { instructions: dto.instructions } : {}),
      },
    });
  }

  async recordAttendance(
    profileId: string | null,
    sessionId: string,
    dto: RecordAttendanceDto,
  ) {
    const session = await this.prisma.offlineExamSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Offline session not found');

    let present = 0;
    let absent = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.attendance) {
        const status = item.status || AttendanceStatus.PRESENT;
        if (status === AttendanceStatus.PRESENT) present++;
        else absent++;

        await tx.offlineStudentAttendance.upsert({
          where: {
            sessionId_studentProfileId: {
              sessionId,
              studentProfileId: item.studentProfileId,
            },
          },
          create: {
            sessionId,
            studentProfileId: item.studentProfileId,
            assignedPaperSet: item.assignedPaperSet || 'SET_A',
            deskNumber: item.deskNumber || null,
            status,
            omrSheetCode: item.omrSheetCode || null,
            recordedById: profileId,
          },
          update: {
            assignedPaperSet: item.assignedPaperSet || undefined,
            deskNumber: item.deskNumber !== undefined ? item.deskNumber : undefined,
            status,
            omrSheetCode: item.omrSheetCode !== undefined ? item.omrSheetCode : undefined,
            recordedById: profileId,
          },
        });
      }

      await tx.offlineExamSession.update({
        where: { id: sessionId },
        data: {
          totalAssigned: dto.attendance.length,
          totalPresent: present,
          totalAbsent: absent,
        },
      });
    });

    return { sessionId, recordedCount: dto.attendance.length, present, absent };
  }

  async enterOfflineAnswers(
    profileId: string | null,
    sessionId: string,
    dto: EnterOfflineAnswersDto,
  ) {
    const session = await this.prisma.offlineExamSession.findUnique({
      where: { id: sessionId },
      include: {
        assessmentTest: {
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
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Offline exam session not found');

    const test = session.assessmentTest;
    const questions = test.questions;

    // Convert rawAnswers e.g. { "1": "B", "2": "C" }
    const evalInputs: AttemptQuestionEvaluationInput[] = questions.map((item) => {
      const posStr = String(item.position);
      const studentSelectedLabel = dto.rawAnswers[posStr]?.trim().toUpperCase();

      // Find the option corresponding to this label in the question
      const selectedOpt = studentSelectedLabel
        ? item.question.options.find(
            (o) => o.label.toUpperCase() === studentSelectedLabel,
          )
        : null;

      const correctOpt = item.question.options.find((o) => o.isCorrect);

      return {
        questionId: item.questionId,
        position: item.position,
        section: item.section,
        correctMarks: item.correctMarks,
        negativeMarks: item.negativeMarks,
        isDropped: item.isDropped,
        selectedOptionId: selectedOpt?.id || null,
        canonicalCorrectOptionId: correctOpt?.id || null,
        subjectCode: item.question.courseSubject?.subject?.code,
      };
    });

    const evaluation = evaluateStudentAttempt(evalInputs, test.hasNegativeMarking);

    // Save evaluated score in offlineStudentAttendance & create a unified TestAttempt + TestResult
    return this.prisma.$transaction(async (tx) => {
      // 1. Update attendance record
      await tx.offlineStudentAttendance.update({
        where: {
          sessionId_studentProfileId: {
            sessionId,
            studentProfileId: dto.studentProfileId,
          },
        },
        data: {
          marksEntered: true,
          evaluatedScore: evaluation.totalMarksScored,
          rawAnswersJson: dto.rawAnswers,
          recordedById: profileId,
        },
      });

      // 2. Upsert an offline TestAttempt
      const attempt = await tx.testAttempt.upsert({
        where: {
          assessmentTestId_studentProfileId_attemptNumber: {
            assessmentTestId: test.id,
            studentProfileId: dto.studentProfileId,
            attemptNumber: 1,
          },
        },
        create: {
          assessmentTestId: test.id,
          studentProfileId: dto.studentProfileId,
          mode: ExamDeliveryMode.OFFLINE,
          status: TestAttemptStatus.EVALUATED,
          startedAt: session.examDate,
          expiresAt: session.examDate,
          submittedAt: session.examDate,
          totalScore: evaluation.totalMarksScored,
        },
        update: {
          mode: ExamDeliveryMode.OFFLINE,
          status: TestAttemptStatus.EVALUATED,
          totalScore: evaluation.totalMarksScored,
        },
      });

      // 3. Upsert unified TestResult for leaderboard & rankings
      const result = await tx.testResult.upsert(
        buildTestResultPersistencePayload(
          attempt.id,
          test.id,
          dto.studentProfileId,
          evaluation,
          new Date(),
        ),
      );

      return {
        sessionId,
        studentProfileId: dto.studentProfileId,
        score: evaluation.totalMarksScored,
        maxMarks: evaluation.maxMarks,
        percentage: evaluation.percentage,
        accuracy: evaluation.accuracyPercentage,
        correctCount: evaluation.correctCount,
        incorrectCount: evaluation.incorrectCount,
        unansweredCount: evaluation.unansweredCount,
        resultId: result.id,
      };
    });
  }
}
