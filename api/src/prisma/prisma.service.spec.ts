import {
  databasePoolConfig,
  normalizeDatabaseConnectionString,
} from './prisma.service.js';

describe('normalizeDatabaseConnectionString', () => {
  it('uses libpq require semantics for the Supabase shared pooler', () => {
    const result = new URL(
      normalizeDatabaseConnectionString(
        'postgresql://postgres.project:secret@aws-0-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require',
      ),
    );

    expect(result.searchParams.get('sslmode')).toBe('require');
    expect(result.searchParams.get('uselibpqcompat')).toBe('true');
  });

  it('does not alter SSL behavior for non-Supabase databases', () => {
    const result = new URL(
      normalizeDatabaseConnectionString(
        'postgresql://user:secret@database.example.com:5432/app?sslmode=require',
      ),
    );

    expect(result.searchParams.has('uselibpqcompat')).toBe(false);
  });

  it('preserves an explicitly configured Supabase compatibility choice', () => {
    const result = new URL(
      normalizeDatabaseConnectionString(
        'postgresql://postgres.project:secret@aws-0-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require&uselibpqcompat=false',
      ),
    );

    expect(result.searchParams.get('uselibpqcompat')).toBe('false');
  });
});

describe('databasePoolConfig', () => {
  it('bounds connection concurrency and allows slow pooler handshakes', () => {
    const config = databasePoolConfig(
      'postgresql://postgres.project:secret@aws-0-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require',
    );

    expect(config).toMatchObject({
      max: 1,
      min: 0,
      connectionTimeoutMillis: 60_000,
      idleTimeoutMillis: 30_000,
      maxLifetimeSeconds: 300,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
    });
    expect(
      new URL(config.connectionString!).searchParams.get('uselibpqcompat'),
    ).toBe('true');
  });

  it('respects DATABASE_POOL_MAX and DATABASE_POOL_MIN environment variables', () => {
    vi.stubEnv('DATABASE_POOL_MAX', '8');
    vi.stubEnv('DATABASE_POOL_MIN', '2');
    const config = databasePoolConfig(
      'postgresql://user:pass@database.example.com:5432/app',
    );
    expect(config.max).toBe(8);
    expect(config.min).toBe(2);
    vi.unstubAllEnvs();
  });
});
