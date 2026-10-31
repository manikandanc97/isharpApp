import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { SupabaseTokenVerifier } from './../src/auth/supabase-token-verifier.service.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
      })
      .overrideProvider(SupabaseTokenVerifier)
      .useValue({ verify: vi.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer()).get('/api/health').expect(200).expect({
      status: 'ok',
      api: 'up',
      database: 'up',
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
