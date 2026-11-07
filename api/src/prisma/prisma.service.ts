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
  const envMax = process.env.DATABASE_POOL_MAX
    ? parseInt(process.env.DATABASE_POOL_MAX, 10)
    : undefined;
  const envMin = process.env.DATABASE_POOL_MIN
    ? parseInt(process.env.DATABASE_POOL_MIN, 10)
    : undefined;

  const max =
    typeof envMax === 'number' && !Number.isNaN(envMax) && envMax > 0
      ? envMax
      : 1;
  const min =
    typeof envMin === 'number' && !Number.isNaN(envMin) && envMin >= 0
      ? envMin
      : 0;

  return {
    connectionString: normalizeDatabaseConnectionString(connectionString),
    max,
    min,
    connectionTimeoutMillis: 60_000,
    idleTimeoutMillis: 30_000,
    maxLifetimeSeconds: 300,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  };
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService?: ConfigService) {
    const connectionString =
      configService?.get<string>('DATABASE_URL') ?? process.env.DATABASE_URL;

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
