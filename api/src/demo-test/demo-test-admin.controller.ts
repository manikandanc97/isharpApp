import {
  Body,
  Controller,
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
import { DemoTestAnalyticsService } from './demo-test-analytics.service.js';
import {
  DemoTestConfigurationService,
  type PoolQuestionFilters,
} from './demo-test-configuration.service.js';
import { DemoTestService, type StartDemoAttemptInput } from './demo-test.service.js';

@Controller('api/admin/demo-test')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class DemoTestAdminController {
  constructor(
    private readonly configuration: DemoTestConfigurationService,
    private readonly demoTestService: DemoTestService,
    private readonly analytics: DemoTestAnalyticsService,
  ) {}

  @Get()
  getConfiguration() {
    return this.configuration.get(true);
  }

  @Patch()
  updateConfiguration(
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    return this.configuration.update(body, req.user.profileId);
  }

  @Post('validate')
  validateConfiguration(@Body() body?: unknown) {
    return this.configuration.validateConfiguration(body);
  }

  @Post('preview')
  async startPreview(
    @Req() req: AuthenticatedRequest,
    @Body() body: StartDemoAttemptInput,
  ) {
    const { visitorId } = await this.demoTestService.resolveOrCreateVisitor({
      userProfileId: req.user.profileId,
    });
    return this.demoTestService.startAttempt({
      visitorId,
      userProfileId: req.user.profileId,
      input: {
        ...body,
        isPreview: true,
      },
    });
  }

  @Get('pool')
  listPoolQuestions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('query') query?: string,
    @Query('subject') subject?: string,
    @Query('chapterId') chapterId?: string,
    @Query('difficulty') difficulty?: string,
    @Query('language') language?: string,
    @Query('type') type?: string,
    @Query('mediaFilter') mediaFilter?: string,
    @Query('activeFilter') activeFilter?: string,
    @Query('approvalFilter') approvalFilter?: string,
    @Query('usageFilter') usageFilter?: string,
  ) {
    const filters: PoolQuestionFilters = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
      query,
      subject,
      chapterId,
      difficulty,
      language,
      type,
      mediaFilter,
      activeFilter,
      approvalFilter,
      usageFilter,
    };
    return this.configuration.listPoolQuestions(filters);
  }

  @Get('pool/:questionId/preview')
  getQuestionPreview(
    @Param('questionId', new ParseUUIDPipe({ version: '4' })) questionId: string,
  ) {
    return this.configuration.getQuestionPreview(questionId);
  }

  @Post('pool/bulk')
  bulkUpdatePool(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      action: 'APPROVE' | 'REMOVE' | 'RESTRICT' | 'UNRESTRICT';
      questionIds?: string[];
      selectAllFiltered?: boolean;
      filters?: PoolQuestionFilters;
    },
  ) {
    return this.configuration.bulkUpdatePool(body, req.user.profileId);
  }

  @Put('questions')
  setQuestionPool(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.configuration.setQuestionPool(body, req.user.profileId);
  }

  @Get('health')
  getPoolHealth() {
    return this.configuration.getPoolHealth();
  }

  @Get('analytics')
  getAnalytics(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('subject') subject?: string,
  ) {
    return this.analytics.getAnalytics({ from, to, subject });
  }
}
