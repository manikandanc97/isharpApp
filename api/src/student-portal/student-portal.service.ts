import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StudentDashboardService } from './services/student-dashboard.service.js';
import { StudentTestQueryService } from './services/student-test-query.service.js';

/**
 * Compatibility facade coordinating student portal dashboard and test queries.
 */
@Injectable()
export class StudentPortalService {
  private readonly dashboard: StudentDashboardService;
  private readonly testQuery: StudentTestQueryService;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() dashboard?: StudentDashboardService,
    @Optional() testQuery?: StudentTestQueryService,
  ) {
    this.testQuery = testQuery ?? new StudentTestQueryService(prisma);
    this.dashboard =
      dashboard ?? new StudentDashboardService(prisma, this.testQuery);
  }

  getDashboard(profileId: string | null) {
    return this.dashboard.getDashboard(profileId);
  }

  getPublishedAssessmentTests(profileId: string | null) {
    return this.testQuery.getPublishedAssessmentTests(profileId);
  }

  getPublishedTestSeries(profileId: string | null) {
    return this.testQuery.getPublishedTestSeries(profileId);
  }
}
