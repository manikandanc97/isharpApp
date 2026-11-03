import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import type { PoolConfig } from 'pg';
import { PrismaClient } from '../generated/prisma/client.js';

export function normalizeDatabaseConnectionString(connectionString: string) {
  const url = new URL(connectionString);
  const isSupabaseSharedPooler =
    url.hostname === 'pooler.supabase.com' ||
    url.hostname.endsWith('.pooler.supabase.com');

  // pg-connection-string v2 treats `require` as `verify-full`, while Supabase's
  // shared pooler uses its private CA. Opt into standard libpq `require`
  // semantics: TLS remains mandatory without the misleading strict-CA error.
  if (
    isSupabaseSharedPooler &&
    url.searchParams.get('sslmode') === 'require' &&
    !url.searchParams.has('uselibpqcompat')
  ) {
    url.searchParams.set('uselibpqcompat', 'true');
  }

  return url.toString();
}

export function databasePoolConfig(connectionString: string): PoolConfig {
  return {
    connectionString: normalizeDatabaseConnectionString(connectionString),
    // This API runs against Supabase's shared session pooler. Keep one warm
    // socket and queue local work: concurrent cold socket bursts are throttled
    // intermittently by the network/pooler, while one reused connection is
    // sufficient for these short dashboard queries.
    max: 1,
    min: 1,
    connectionTimeoutMillis: 60_000,
    idleTimeoutMillis: 600_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  };
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }

    const adapter = new PrismaPg(databasePoolConfig(connectionString));

    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
    } catch {
      // Keep the API available so its health endpoint can report the outage.
      // Prisma will retry the connection when the next query is made.
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
