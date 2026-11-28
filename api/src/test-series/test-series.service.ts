import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateAssessmentTestDto,
  CreateCategoryDto,
  CreateStandaloneTestDto,
  CreateTestSeriesDto,
  DuplicateTestDto,
  SetTestBlueprintDto,
  SetTestQuestionsDto,
  UpdateAssessmentTestDto,
  UpdateCategoryDto,
  UpdateStandaloneTestDto,
  UpdateTestSeriesDto,
} from './dto/test-series.dto.js';
import { QuestionSelectionEngine } from './question-selection.engine.js';
import { AssessmentTestService } from './services/assessment-test.service.js';
import { TestCategoryService } from './services/test-category.service.js';
import { TestConfigurationService } from './services/test-configuration.service.js';
import { TestQuestionAssignmentService } from './services/test-question-assignment.service.js';
import {
  deriveTestLifecycleStatus,
  TestSeriesCrudService,
  type DerivedTestLifecycleStatus,
} from './services/test-series-crud.service.js';

export { deriveTestLifecycleStatus, type DerivedTestLifecycleStatus };

/**
 * Coordinates test-series CRUD and overview statistics while delegating
 * category management, exam configuration, assessment tests, and question
 * assignment to focused domain services.
 */
@Injectable()
export class TestSeriesService {
  private readonly categories: TestCategoryService;
  private readonly configuration: TestConfigurationService;
  private readonly assessmentTests: AssessmentTestService;
  private readonly questionAssignment: TestQuestionAssignmentService;
  private readonly seriesCrud: TestSeriesCrudService;

  constructor(
    prisma: PrismaService,
    questionEngine: QuestionSelectionEngine,
    @Optional() categories?: TestCategoryService,
    @Optional() configuration?: TestConfigurationService,
    @Optional() assessmentTests?: AssessmentTestService,
    @Optional() questionAssignment?: TestQuestionAssignmentService,
    @Optional() seriesCrud?: TestSeriesCrudService,
  ) {
    this.categories = categories ?? new TestCategoryService(prisma);
    this.configuration =
      configuration ?? new TestConfigurationService(questionEngine);
    this.questionAssignment =
      questionAssignment ?? new TestQuestionAssignmentService(prisma);
    this.assessmentTests =
      assessmentTests ??
      new AssessmentTestService(
        prisma,
        questionEngine,
        this.categories,
        this.questionAssignment,
      );
    this.seriesCrud =
      seriesCrud ?? new TestSeriesCrudService(prisma, this.categories);
  }

  getCategories() {
    return this.categories.getCategories();
  }

  createCategory(dto: CreateCategoryDto) {
    return this.categories.createCategory(dto);
  }

  updateCategory(id: string, dto: UpdateCategoryDto) {
    return this.categories.updateCategory(id, dto);
  }

  deleteCategory(id: string, moveToCategoryId?: string) {
    return this.categories.deleteCategory(id, moveToCategoryId);
  }

  getExamConfiguration() {
    return this.configuration.getExamConfiguration();
  }

  listTests(filters: {
    categoryId?: string;
    search?: string;
    subjectCode?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    return this.assessmentTests.listTests(filters);
  }

  createStandaloneTest(profileId: string | null, dto: CreateStandaloneTestDto) {
    return this.assessmentTests.createStandaloneTest(profileId, dto);
  }

  updateStandaloneTest(testId: string, dto: UpdateStandaloneTestDto) {
    return this.assessmentTests.updateStandaloneTest(testId, dto);
  }

  duplicateStandaloneTest(
    profileId: string | null,
    testId: string,
    dto?: DuplicateTestDto,
  ) {
    return this.assessmentTests.duplicateStandaloneTest(profileId, testId, dto);
  }

  deleteStandaloneTest(testId: string) {
    return this.assessmentTests.deleteStandaloneTest(testId);
  }

  createTest(
    profileId: string | null,
    seriesId: string,
    dto: CreateAssessmentTestDto,
  ) {
    return this.assessmentTests.createTest(profileId, seriesId, dto);
  }

  getTestById(testId: string) {
    return this.assessmentTests.getTestById(testId);
  }

  updateTest(testId: string, dto: UpdateAssessmentTestDto) {
    return this.assessmentTests.updateTest(testId, dto);
  }

  deleteTest(testId: string) {
    return this.assessmentTests.deleteStandaloneTest(testId);
  }

  duplicateTest(
    profileId: string | null,
    testId: string,
    dto?: DuplicateTestDto,
  ) {
    return this.assessmentTests.duplicateStandaloneTest(profileId, testId, dto);
  }

  reorderTests(seriesId: string, orderedTestIds: string[]) {
    return this.assessmentTests.reorderTests(seriesId, orderedTestIds);
  }

  setTestQuestions(testId: string, dto: SetTestQuestionsDto) {
    return this.questionAssignment.setTestQuestions(testId, dto);
  }

  setTestBlueprint(testId: string, dto: SetTestBlueprintDto) {
    return this.questionAssignment.setTestBlueprint(testId, dto);
  }

  listSeries(filters: {
    categoryId?: string;
    isActive?: boolean;
    academicYear?: string;
    search?: string;
  }) {
    return this.seriesCrud.listSeries(filters);
  }

  getSeriesById(id: string) {
    return this.seriesCrud.getSeriesById(id);
  }

  createSeries(profileId: string | null, dto: CreateTestSeriesDto) {
    return this.seriesCrud.createSeries(profileId, dto);
  }

  updateSeries(id: string, dto: UpdateTestSeriesDto) {
    return this.seriesCrud.updateSeries(id, dto);
  }

  deleteSeries(id: string) {
    return this.seriesCrud.deleteSeries(id);
  }

  duplicateSeries(profileId: string | null, id: string) {
    return this.seriesCrud.duplicateSeries(profileId, id);
  }
}
