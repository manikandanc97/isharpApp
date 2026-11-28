import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth-user.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type {
  CreateAssessmentTestDto,
  CreateCategoryDto,
  CreateStandaloneTestDto,
  CreateTestSeriesDto,
  DuplicateTestDto,
  GenerateQuestionsDto,
  SetTestBlueprintDto,
  SetTestQuestionsDto,
  UpdateAssessmentTestDto,
  UpdateCategoryDto,
  UpdateStandaloneTestDto,
  UpdateTestSeriesDto,
} from './dto/test-series.dto.js';
import { QuestionSelectionEngine } from './question-selection.engine.js';
import { TestSeriesService } from './test-series.service.js';

@Controller('api/admin/test-series')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class TestSeriesController {
  constructor(
    private readonly service: TestSeriesService,
    private readonly questionEngine: QuestionSelectionEngine,
  ) {}

  // --------------------------------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------------------------------

  @Get('categories')
  getCategories() {
    return this.service.getCategories();
  }

  @Post('categories')
  createCategory(@Body() body: CreateCategoryDto) {
    return this.service.createCategory(body);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.service.updateCategory(id, body);
  }

  @Delete('categories/:id')
  deleteCategory(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('moveToCategoryId') moveToCategoryId?: string,
  ) {
    return this.service.deleteCategory(id, moveToCategoryId);
  }

  // --------------------------------------------------------------------------
  // EXAM PATTERN CONFIGURATION & QUESTION ENGINE
  // --------------------------------------------------------------------------

  @Get('config/exam-pattern')
  getExamConfiguration() {
    return this.service.getExamConfiguration();
  }

  @Post('questions/generate')
  generateQuestions(@Body() body: GenerateQuestionsDto) {
    return this.questionEngine.generateQuestions({
      subjectAllocations: body.subjectAllocations,
      excludeQuestionIds: body.excludeQuestionIds,
    });
  }

  @Get('questions/search')
  searchQuestions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('subjectCode') subjectCode?: string,
    @Query('courseSubjectId') courseSubjectId?: string,
    @Query('chapterId') chapterId?: string,
    @Query('difficulty') difficulty?: string,
    @Query('type') type?: string,
    @Query('query') query?: string,
    @Query('excludeIds') excludeIds?: string,
  ) {
    return this.questionEngine.searchEligibleQuestions({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      subjectCode,
      courseSubjectId,
      chapterId,
      difficulty,
      type,
      query,
      excludeIds: excludeIds ? excludeIds.split(',').filter(Boolean) : undefined,
    });
  }

  // --------------------------------------------------------------------------
  // CATEGORY-BASED TESTS (PRIMARY WORKSPACE ENDPOINTS)
  // --------------------------------------------------------------------------

  @Get('tests')
  listTests(
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('subjectCode') subjectCode?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listTests({
      categoryId,
      search,
      subjectCode,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post('tests')
  createStandaloneTest(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateStandaloneTestDto,
  ) {
    return this.service.createStandaloneTest(req.user.profileId, body);
  }

  @Get('tests/:testId')
  getStandaloneTest(
    @Param('testId', new ParseUUIDPipe({ version: '4' })) testId: string,
  ) {
    return this.service.getTestById(testId);
  }

  @Patch('tests/:testId')
  updateStandaloneTest(
    @Param('testId', new ParseUUIDPipe({ version: '4' })) testId: string,
    @Body() body: UpdateStandaloneTestDto,
  ) {
    return this.service.updateStandaloneTest(testId, body);
  }

  @Delete('tests/:testId')
  deleteStandaloneTest(
    @Param('testId', new ParseUUIDPipe({ version: '4' })) testId: string,
  ) {
    return this.service.deleteStandaloneTest(testId);
  }

  @Post('tests/:testId/duplicate')
  duplicateStandaloneTest(
    @Req() req: AuthenticatedRequest,
    @Param('testId', new ParseUUIDPipe({ version: '4' })) testId: string,
    @Body() body?: DuplicateTestDto,
  ) {
    return this.service.duplicateStandaloneTest(req.user.profileId, testId, body);
  }

  @Put('tests/:testId/questions')
  setStandaloneTestQuestions(
    @Param('testId', new ParseUUIDPipe({ version: '4' })) testId: string,
    @Body() body: SetTestQuestionsDto,
  ) {
    return this.service.setTestQuestions(testId, body);
  }

  // --------------------------------------------------------------------------
  // LEGACY TEST SERIES ROUTES (KEPT FOR BACKWARD COMPATIBILITY)
  // --------------------------------------------------------------------------

  @Get()
  listSeries(
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: string,
    @Query('academicYear') academicYear?: string,
    @Query('search') search?: string,
  ) {
    return this.service.listSeries({
      categoryId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      academicYear,
      search,
    });
  }

  @Get(':id')
  getSeriesById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.getSeriesById(id);
  }

  @Post()
  createSeries(@Req() req: AuthenticatedRequest, @Body() body: CreateTestSeriesDto) {
    return this.service.createSeries(req.user.profileId, body);
  }

  @Patch(':id')
  updateSeries(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateTestSeriesDto,
  ) {
    return this.service.updateSeries(id, body);
  }

  @Delete(':id')
  deleteSeries(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.deleteSeries(id);
  }

  @Post(':id/duplicate')
  duplicateSeries(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.duplicateSeries(req.user.profileId, id);
  }

  @Post(':id/tests')
  createTest(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: CreateAssessmentTestDto,
  ) {
    return this.service.createTest(req.user.profileId, id, body);
  }

  @Get(':id/tests/:testId')
  getTestById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) _seriesId: string,
    @Param('testId', new ParseUUIDPipe({ version: '4' })) testId: string,
  ) {
    return this.service.getTestById(testId);
  }

  @Patch(':id/tests/:testId')
  updateTest(
    @Param('id', new ParseUUIDPipe({ version: '4' })) _seriesId: string,
    @Param('testId', new ParseUUIDPipe({ version: '4' })) testId: string,
    @Body() body: UpdateAssessmentTestDto,
  ) {
    return this.service.updateTest(testId, body);
  }

  @Delete(':id/tests/:testId')
  deleteTest(
    @Param('id', new ParseUUIDPipe({ version: '4' })) _seriesId: string,
    @Param('testId', new ParseUUIDPipe({ version: '4' })) testId: string,
  ) {
    return this.service.deleteTest(testId);
  }

  @Post(':id/tests/:testId/duplicate')
  duplicateTest(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) _seriesId: string,
    @Param('testId', new ParseUUIDPipe({ version: '4' })) testId: string,
    @Body() body?: DuplicateTestDto,
  ) {
    return this.service.duplicateTest(req.user.profileId, testId, body);
  }

  @Post(':id/tests-reorder')
  reorderTests(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body('orderedTestIds') orderedTestIds: string[],
  ) {
    return this.service.reorderTests(id, orderedTestIds);
  }

  @Put(':id/tests/:testId/questions')
  setTestQuestions(
    @Param('id', new ParseUUIDPipe({ version: '4' })) _seriesId: string,
    @Param('testId', new ParseUUIDPipe({ version: '4' })) testId: string,
    @Body() body: SetTestQuestionsDto,
  ) {
    return this.service.setTestQuestions(testId, body);
  }

  @Put(':id/tests/:testId/blueprint')
  setTestBlueprint(
    @Param('id', new ParseUUIDPipe({ version: '4' })) _seriesId: string,
    @Param('testId', new ParseUUIDPipe({ version: '4' })) testId: string,
    @Body() body: SetTestBlueprintDto,
  ) {
    return this.service.setTestBlueprint(testId, body);
  }
}
