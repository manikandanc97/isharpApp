import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { AppModule } from './app.module.js';
import { DemoTestService } from './demo-test/demo-test.service.js';
import { DemoAttemptService } from './demo-test/services/demo-attempt.service.js';
import { DemoEvaluationService } from './demo-test/services/demo-evaluation.service.js';
import { DemoExposureService } from './demo-test/services/demo-exposure.service.js';
import { DemoVisitorService } from './demo-test/services/demo-visitor.service.js';
import { ExaminationEngineService } from './examination-engine/examination-engine.service.js';
import { AttemptLifecycleService } from './examination-engine/services/attempt-lifecycle.service.js';
import { AttemptSubmissionService } from './examination-engine/services/attempt-submission.service.js';
import { ResultRecalculationService } from './examination-engine/services/result-recalculation.service.js';
import { PrismaService } from './prisma/prisma.service.js';
import { QuestionBankService } from './question-bank/question-bank.service.js';
import { QuestionImportService } from './question-bank/services/question-import.service.js';
import { StudentDashboardService } from './student-portal/services/student-dashboard.service.js';
import { StudentTestQueryService } from './student-portal/services/student-test-query.service.js';
import { StudentPortalService } from './student-portal/student-portal.service.js';
import { AssessmentTestService } from './test-series/services/assessment-test.service.js';
import { TestCategoryService } from './test-series/services/test-category.service.js';
import { TestConfigurationService } from './test-series/services/test-configuration.service.js';
import { TestQuestionAssignmentService } from './test-series/services/test-question-assignment.service.js';
import { TestSeriesService } from './test-series/test-series.service.js';

describe('AppModule Dependency Injection', () => {
  it('compiles all modular services without missing providers or circular dependencies', async () => {
    const mockPrisma = {
      onModuleInit: vi.fn(),
      onModuleDestroy: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    expect(moduleRef.get(TestSeriesService)).toBeDefined();
    expect(moduleRef.get(TestCategoryService)).toBeDefined();
    expect(moduleRef.get(TestConfigurationService)).toBeDefined();
    expect(moduleRef.get(AssessmentTestService)).toBeDefined();
    expect(moduleRef.get(TestQuestionAssignmentService)).toBeDefined();

    expect(moduleRef.get(QuestionBankService)).toBeDefined();
    expect(moduleRef.get(QuestionImportService)).toBeDefined();

    expect(moduleRef.get(StudentPortalService)).toBeDefined();
    expect(moduleRef.get(StudentDashboardService)).toBeDefined();
    expect(moduleRef.get(StudentTestQueryService)).toBeDefined();

    expect(moduleRef.get(ExaminationEngineService)).toBeDefined();
    expect(moduleRef.get(AttemptLifecycleService)).toBeDefined();
    expect(moduleRef.get(AttemptSubmissionService)).toBeDefined();
    expect(moduleRef.get(ResultRecalculationService)).toBeDefined();

    expect(moduleRef.get(DemoTestService)).toBeDefined();
    expect(moduleRef.get(DemoVisitorService)).toBeDefined();
    expect(moduleRef.get(DemoExposureService)).toBeDefined();
    expect(moduleRef.get(DemoEvaluationService)).toBeDefined();
    expect(moduleRef.get(DemoAttemptService)).toBeDefined();

    await moduleRef.close();
  });
});
