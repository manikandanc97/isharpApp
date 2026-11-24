import { Controller, Get, Query } from '@nestjs/common';
import { DemoTestService } from './demo-test.service.js';
import { DemoTestConfigurationService } from './demo-test-configuration.service.js';

@Controller('api/demo')
export class DemoTestController {
  constructor(
    private readonly demoTestService: DemoTestService,
    private readonly configuration: DemoTestConfigurationService,
  ) {}

  @Get('config')
  getConfiguration() {
    return this.configuration.get(false);
  }

  @Get('questions')
  async getQuestions(
    @Query('count') count?: string,
    @Query('subject') subject?: string,
  ) {
    const parsedCount = count ? parseInt(count, 10) : 9;
    return this.demoTestService.generateDemoTest(
      Number.isNaN(parsedCount) ? 9 : parsedCount,
      subject,
    );
  }
}
