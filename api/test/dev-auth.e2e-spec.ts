import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { SupabaseTokenVerifier } from '../src/auth/supabase-token-verifier.service.js';

describe('Development authentication (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DUMMY_AUTH_ENABLED', 'true');
    vi.stubEnv('DUMMY_AUTH_PASSWORD', 'e2e-password-123');

    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]) })
      .overrideProvider(SupabaseTokenVerifier)
      .useValue({ verify: vi.fn() })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  async function login(identity: 'student' | 'admin' | 'superadmin') {
    const response = await request(app.getHttpServer())
      .post('/api/dev-auth/login')
      .send({ identity, password: 'e2e-password-123' })
      .expect(201);
    return response.body.token as string;
  }

  function access(path: string, token?: string) {
    const call = request(app.getHttpServer()).get(path);
    return token ? call.set('Authorization', `Bearer ${token}`) : call;
  }

  it('returns 401 when authentication is missing', () =>
    access('/api/test/student').expect(401));

  it('allows a student only at the student role level', async () => {
    const token = await login('student');
    await access('/api/test/student', token).expect(200);
    await access('/api/test/admin', token).expect(403);
    await access('/api/test/superadmin', token).expect(403);
  });

  it('allows an admin at the admin level but not student-only or superadmin', async () => {
    const token = await login('admin');
    await access('/api/test/student', token).expect(403);
    await access('/api/test/admin', token).expect(200);
    await access('/api/test/superadmin', token).expect(403);
  });

  it('allows a superadmin at every role level', async () => {
    const token = await login('superadmin');
    await access('/api/test/student', token).expect(200);
    await access('/api/test/admin', token).expect(200);
    await access('/api/test/superadmin', token).expect(200);
  });

  it('rejects role escalation fields and unknown identities', async () => {
    await request(app.getHttpServer())
      .post('/api/dev-auth/login')
      .send({
        identity: 'admin',
        password: 'e2e-password-123',
        role: 'SUPERADMIN',
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/dev-auth/login')
      .send({ identity: 'faculty', password: 'e2e-password-123' })
      .expect(400);
  });

  it('rejects an incorrect development password', () =>
    request(app.getHttpServer())
      .post('/api/dev-auth/login')
      .send({ identity: 'admin', password: 'incorrect-password' })
      .expect(401));

  it('rejects fabricated and logged-out development sessions', async () => {
    await access('/api/test/student', 'isharp_dev_fabricated').expect(401);
    const token = await login('student');
    await request(app.getHttpServer())
      .post('/api/dev-auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(201, { signedOut: true });
    await access('/api/test/student', token).expect(401);
  });

  afterAll(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });
});
