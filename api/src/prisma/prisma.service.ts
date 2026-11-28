import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool, type PoolConfig } from 'pg';
import { PrismaClient } from '../generated/prisma/client.js';

export function normalizeDatabaseConnectionString(connectionString: string) {
  const url = new URL(connectionString);
  const isSupabase =
    url.hostname === 'pooler.supabase.com' ||
    url.hostname.endsWith('.pooler.supabase.com') ||
    url.hostname.endsWith('.supabase.co');

  // pg-connection-string v2 treats `require` as `verify-full`, while Supabase's
  // shared pooler uses its private CA. Opt into standard libpq `require`
  // semantics: TLS remains mandatory without the misleading strict-CA error.
  if (
    isSupabase &&
    url.searchParams.get('sslmode') === 'require' &&
    !url.searchParams.has('uselibpqcompat')
  ) {
    url.searchParams.set('uselibpqcompat', 'true');
  }

  return url.toString();
}

const MAX_SAFE_POOL_LIMIT = 50;

function parsePoolEnvInt(name: string, raw: string | undefined): number | undefined {
  if (raw === undefined || raw.trim() === '') {
    return undefined;
  }
  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    throw new Error(`${name} must be an integer, received "${raw}"`);
  }
  return Number.parseInt(trimmed, 10);
}

export function databasePoolConfig(connectionString: string): PoolConfig {
  const envMax = parsePoolEnvInt('DATABASE_POOL_MAX', process.env.DATABASE_POOL_MAX);
  const envMin = parsePoolEnvInt('DATABASE_POOL_MIN', process.env.DATABASE_POOL_MIN);

  const max = envMax ?? 1;
  if (max < 1 || max > MAX_SAFE_POOL_LIMIT) {
    throw new Error(
      `DATABASE_POOL_MAX must be between 1 and ${MAX_SAFE_POOL_LIMIT}, received ${max}`,
    );
  }

  const min = envMin ?? 0;
  if (min < 0 || min > max) {
    throw new Error(
      `DATABASE_POOL_MIN must be between 0 and DATABASE_POOL_MAX (${max}), received ${min}`,
    );
  }

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

export function isTransientConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as {
    code?: string;
    message?: string;
    meta?: { driverAdapterError?: { cause?: { kind?: string } } };
  };
  return (
    err.code === 'P1017' ||
    err.meta?.driverAdapterError?.cause?.kind === 'ConnectionClosed' ||
    (typeof err.message === 'string' &&
      (err.message.includes('Server has closed the connection') ||
        err.message.includes('ConnectionClosed')))
  );
}

export async function withTransientDbRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 2,
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt < maxAttempts && isTransientConnectionError(err)) {
        await new Promise((r) => setTimeout(r, 100));
        continue;
      }
      throw err;
    }
  }
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  constructor(configService?: ConfigService) {
    const connectionString =
      configService?.get<string>('DATABASE_URL') ?? process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }

    const poolConfig = databasePoolConfig(connectionString);
    const pool = new Pool(poolConfig);

    pool.on('error', () => {
      // Catch errors on idle clients (e.g. server closed connection)
      // so node-postgres evicts the dead client from the pool cleanly
    });

    const adapter = new PrismaPg(pool);

    super({ adapter });
    this.pool = pool;
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
    await this.pool.end();
  }
}
