import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TestAttemptStatus } from '../../generated/prisma/client.js';

export function assertStudentProfileId(
  profileId: string | null,
  message = 'Authenticated student profile is required',
): asserts profileId is string {
  if (!profileId) {
    throw new ForbiddenException(message);
  }
}

export function assertTestOpenForAttempt(
  test: {
    isActive: boolean;
    isCancelled: boolean;
    scheduledAt: Date | null;
    availableUntil: Date | null;
    testSeries?: { isActive: boolean } | null;
  } | null,
  now: Date = new Date(),
): asserts test is NonNullable<typeof test> {
  if (!test) {
    throw new NotFoundException('Assessment test not found');
  }
  if (test.testSeries && !test.testSeries.isActive) {
    throw new BadRequestException(
      'The test series containing this examination is not currently active',
    );
  }
  if (!test.isActive || test.isCancelled) {
    throw new BadRequestException(
      test.isCancelled
        ? 'This examination has been cancelled'
        : 'This test is not currently open for examination',
    );
  }
  if (test.scheduledAt && test.scheduledAt > now) {
    throw new BadRequestException(
      'This examination is scheduled for a future time and is not yet available',
    );
  }
  if (test.availableUntil && test.availableUntil < now) {
    throw new BadRequestException(
      'The availability window for this examination has expired',
    );
  }
}

export function assertAttemptOwnership(
  attempt: { studentProfileId: string; status?: TestAttemptStatus } | null,
  profileId: string,
  forbiddenMessage = 'You do not have permission to access this attempt',
): asserts attempt is NonNullable<typeof attempt> {
  if (!attempt) {
    throw new NotFoundException('Attempt not found');
  }
  if (attempt.studentProfileId !== profileId) {
    throw new ForbiddenException(forbiddenMessage);
  }
}
