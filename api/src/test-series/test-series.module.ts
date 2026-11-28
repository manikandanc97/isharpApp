import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { QuestionSelectionEngine } from './question-selection.engine.js';
import { AssessmentTestDuplicationService } from './services/assessment-test-duplication.service.js';
import { AssessmentTestQueryService } from './services/assessment-test-query.service.js';
import { AssessmentTestService } from './services/assessment-test.service.js';
import { TestCategoryService } from './services/test-category.service.js';
import { TestConfigurationService } from './services/test-configuration.service.js';
import { TestQuestionAssignmentService } from './services/test-question-assignment.service.js';
import { TestSeriesCrudService } from './services/test-series-crud.service.js';
import { TestSeriesController } from './test-series.controller.js';
import { TestSeriesService } from './test-series.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TestSeriesController],
  providers: [
    TestSeriesService,
    TestCategoryService,
    TestConfigurationService,
    AssessmentTestQueryService,
    AssessmentTestDuplicationService,
    AssessmentTestService,
    TestQuestionAssignmentService,
    TestSeriesCrudService,
    QuestionSelectionEngine,
  ],
  exports: [
    TestSeriesService,
    TestCategoryService,
    TestConfigurationService,
    AssessmentTestQueryService,
    AssessmentTestDuplicationService,
    AssessmentTestService,
    TestQuestionAssignmentService,
    TestSeriesCrudService,
    QuestionSelectionEngine,
  ],
})
export class TestSeriesModule {}
