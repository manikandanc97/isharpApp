import { PrismaService } from '../prisma/prisma.service.js';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  it('probes the database through Prisma', async () => {
    const queryRaw = vi.fn().mockResolvedValue([{ '?column?': 1 }]);
    const prisma = {
      $queryRaw: queryRaw,
    } as unknown as PrismaService;
    const service = new HealthService(prisma);

    await expect(service.checkDatabase()).resolves.toBeUndefined();
    expect(queryRaw).toHaveBeenCalledOnce();
  });
});
