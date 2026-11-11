import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkDatabase(): Promise<void> {
    const timeout = new Promise<never>((_, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Database health check timed out after 8000ms')),
        8000,
      );
      timer.unref?.();
    });

    await Promise.race([this.prisma.$queryRaw`SELECT 1`, timeout]);
  }
}
