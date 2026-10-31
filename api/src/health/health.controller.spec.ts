import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

describe('HealthController', () => {
  it('reports the database as up when the probe succeeds', async () => {
    const healthService = {
      checkDatabase: vi.fn().mockResolvedValue(undefined),
    } as unknown as HealthService;
    const controller = new HealthController(healthService);

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      api: 'up',
      database: 'up',
    });
  });

  it('returns a generic service-unavailable error when the probe fails', async () => {
    const healthService = {
      checkDatabase: vi.fn().mockRejectedValue(new Error('connection failed')),
    } as unknown as HealthService;
    const controller = new HealthController(healthService);

    await expect(controller.check()).rejects.toEqual(
      new ServiceUnavailableException({
        status: 'error',
        api: 'up',
        database: 'down',
      }),
    );
  });
});
