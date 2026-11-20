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
  CreateTestSeriesDto,
  SetTestBlueprintDto,
  SetTestQuestionsDto,
  UpdateAssessmentTestDto,
  UpdateCategoryDto,
  UpdateTestSeriesDto,
} from './dto/test-series.dto.js';
import { TestSeriesService } from './test-series.service.js';

@Controller('api/admin/test-series')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class TestSeriesController {
  constructor(private readonly service: TestSeriesService) {}

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
  deleteCategory(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.deleteCategory(id);
  }

  // --------------------------------------------------------------------------
  // TEST SERIES
  // --------------------------------------------------------------------------

  @Get()
  listSeries(
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: any,
    @Query('academicYear') academicYear?: string,
    @Query('search') search?: string,
  ) {
    return this.service.listSeries({ categoryId, status, academicYear, search });
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

  // --------------------------------------------------------------------------
  // INDIVIDUAL ASSESSMENT TESTS
  // --------------------------------------------------------------------------

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
  ) {
    return this.service.duplicateTest(req.user.profileId, testId);
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
