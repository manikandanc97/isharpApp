import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service.js';

type HealthResponse = {
  status: 'ok';
  api: 'up';
  database: 'up';
};

@Controller('api/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check(): Promise<HealthResponse> {
    try {
      await this.healthService.checkDatabase();

      return {
        status: 'ok',
        api: 'up',
        database: 'up',
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        api: 'up',
        database: 'down',
      });
    }
  }
}
