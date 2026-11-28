import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { OfflineExaminationService } from './offline-examination.service.js';

describe('OfflineExaminationService', () => {
  it('requires user profile to create a session and validates test existence', async () => {
    const prisma = {
      assessmentTest: { findUnique: vi.fn().mockResolvedValue(null) },
    };
    const service = new OfflineExaminationService(prisma as never);

    await expect(
      service.createSession(null, {
        assessmentTestId: 't1',
        sessionName: 'Morning Batch',
        examDate: '2026-12-01',
        startTime: '09:00',
        endTime: '12:00',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.createSession('admin-1', {
        assessmentTestId: 'missing-test',
        sessionName: 'Morning Batch',
        examDate: '2026-12-01',
        startTime: '09:00',
        endTime: '12:00',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('creates session and evaluates offline answers with negative marking', async () => {
    const createdAttempt = { id: 'offline-attempt-1' };
    const tx = {
      testAttempt: {
        upsert: vi.fn().mockResolvedValue({ ...createdAttempt, status: 'EVALUATED' }),
      },
      testResult: { upsert: vi.fn().mockResolvedValue({ id: 'res-1', totalMarksScored: 3 }) },
      offlineStudentAttendance: { update: vi.fn().mockResolvedValue({ status: 'PRESENT' }) },
    };

    const prisma = {
      assessmentTest: {
        findUnique: vi.fn().mockResolvedValue({ id: 'test-1', title: 'Offline NEET', code: 'OFF-1' }),
      },
      offlineExamSession: {
        create: vi.fn().mockResolvedValue({ id: 'sess-1', sessionName: 'Hall A' }),
        findUnique: vi.fn().mockResolvedValue({
          id: 'sess-1',
          assessmentTestId: 'test-1',
          assessmentTest: {
            id: 'test-1',
            hasNegativeMarking: true,
            questions: [
              {
                questionId: 'q1',
                position: 1,
                section: 'PHYSICS',
                correctMarks: 4,
                negativeMarks: 1,
                question: {
                  isDropped: false,
                  numericalAnswer: null,
                  courseSubject: { subject: { code: 'PHYSICS' } },
                  options: [
                    { id: 'q1-o1', label: 'A', position: 1, isCorrect: true },
                    { id: 'q1-o2', label: 'B', position: 2, isCorrect: false },
                  ],
                },
              },
              {
                questionId: 'q2',
                position: 2,
                section: 'CHEMISTRY',
                correctMarks: 4,
                negativeMarks: 1,
                question: {
                  isDropped: false,
                  numericalAnswer: null,
                  courseSubject: { subject: { code: 'CHEMISTRY' } },
                  options: [
                    { id: 'q2-o1', label: 'A', position: 1, isCorrect: true },
                    { id: 'q2-o2', label: 'B', position: 2, isCorrect: false },
                  ],
                },
              },
            ],
          },
        }),
      },
      $transaction: vi.fn(async (cb: (client: typeof tx) => unknown) => cb(tx)),
    };

    const service = new OfflineExaminationService(prisma as never);
    const session = await service.createSession('admin-1', {
      assessmentTestId: 'test-1',
      sessionName: 'Hall A',
      examDate: '2026-12-01',
      startTime: '09:00',
      endTime: '12:00',
    });
    expect(session.id).toBe('sess-1');

    const evalResult = await service.enterOfflineAnswers('admin-1', 'sess-1', {
      studentProfileId: 'student-1',
      rawAnswers: { '1': 'A', '2': 'B' }, // +4 and -1 => 3
    });

    expect(evalResult.score).toBe(3);
    expect(evalResult.correctCount).toBe(1);
    expect(evalResult.incorrectCount).toBe(1);
    expect(tx.testResult.upsert).toHaveBeenCalledTimes(1);
  });
});
