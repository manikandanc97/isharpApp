import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { SupabaseTokenVerifier } from '../src/auth/supabase-token-verifier.service.js';
import { StudentAccessResolver } from '../src/auth/student-access-resolver.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const identities = {
  student: {
    authUserId: '00000000-0000-4000-8000-000000000001',
    profileId: '20000000-0000-4000-8000-000000000001',
    roles: ['STUDENT'],
  },
  otherStudent: {
    authUserId: '00000000-0000-4000-8000-000000000002',
    profileId: '20000000-0000-4000-8000-000000000002',
    roles: ['STUDENT'],
  },
  revokedStudent: {
    authUserId: '00000000-0000-4000-8000-000000000005',
    profileId: '20000000-0000-4000-8000-000000000005',
    roles: ['STUDENT'],
  },
  externalUnpaid: {
    authUserId: '00000000-0000-4000-8000-000000000007',
    profileId: '20000000-0000-4000-8000-000000000007',
    roles: ['STUDENT'],
  },
  externalPaid: {
    authUserId: '00000000-0000-4000-8000-000000000008',
    profileId: '20000000-0000-4000-8000-000000000008',
    roles: ['STUDENT'],
  },
  externalExpired: {
    authUserId: '00000000-0000-4000-8000-000000000009',
    profileId: '20000000-0000-4000-8000-000000000009',
    roles: ['STUDENT'],
  },
  admin: {
    authUserId: '00000000-0000-4000-8000-000000000003',
    profileId: '20000000-0000-4000-8000-000000000003',
    roles: ['ADMIN'],
  },
  superadmin: {
    authUserId: '00000000-0000-4000-8000-000000000004',
    profileId: '20000000-0000-4000-8000-000000000004',
    roles: ['SUPERADMIN'],
  },
  pendingGoogleUser: {
    authUserId: '00000000-0000-4000-8000-000000000006',
    profileId: null,
    roles: [],
  },
} as const;

describe('RBAC (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const profiles = Object.values(identities);
    const prisma = {
      userProfile: {
        findUnique: vi.fn(
          async ({
            where,
          }: {
            where: { authUserId?: string; id?: string };
          }) => {
            const profile = profiles.find(
              (candidate) =>
                candidate.authUserId === where.authUserId ||
                candidate.profileId === where.id,
            );
            if (!profile) return null;
            if (where.authUserId && profile.profileId === null) return null;
            if (where.authUserId) {
              return {
                id: profile.profileId,
                isActive: true,
                userRoles: profile.roles.map((name) => ({ role: { name } })),
              };
            }
            return {
              id: profile.profileId,
              displayName: 'Test user',
              isActive: true,
              createdAt: new Date('2026-01-01T00:00:00Z'),
              userRoles: profile.roles.map((name) => ({ role: { name } })),
            };
          },
        ),
      },
      institutionMembership: {
        findUnique: vi.fn(async ({ where }: { where: { userId: string } }) => {
          const external = [
            identities.externalUnpaid.profileId,
            identities.externalPaid.profileId,
            identities.externalExpired.profileId,
          ].includes(where.userId as never);
          return {
            status:
              where.userId === identities.revokedStudent.profileId
                ? 'REVOKED'
                : 'VERIFIED',
            studentCategory: external ? 'EXTERNAL' : 'INTERNAL',
            paymentStatus:
              where.userId === identities.externalPaid.profileId ||
              where.userId === identities.externalExpired.profileId
                ? 'PAID'
                : external
                  ? 'PENDING'
                  : 'NOT_REQUIRED',
            paidAccessUntil:
              where.userId === identities.externalExpired.profileId
                ? new Date('2020-01-01T00:00:00Z')
                : null,
          };
        }),
      },
      $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    const verifier = {
      verify: vi.fn(async (token: string) => {
        const identity = identities[token as keyof typeof identities];
        if (!identity) throw new Error('Test passed an unknown token');
        return { sub: identity.authUserId };
      }),
    };

    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(SupabaseTokenVerifier)
      .useValue(verifier)
      .overrideProvider(StudentAccessResolver)
      .useValue({
        resolve: vi.fn(async (authUserId: string) => {
          const profile = profiles.find(
            (candidate) => candidate.authUserId === authUserId,
          );
          if (!profile || profile.profileId === null) return null;
          const isStudent = profile.roles.some((role) => role === 'STUDENT');
          const external = new Set<string>([
            identities.externalUnpaid.profileId,
            identities.externalPaid.profileId,
            identities.externalExpired.profileId,
          ]).has(profile.profileId);
          return {
            id: profile.profileId,
            isActive: true,
            userRoles: profile.roles.map((name) => ({ role: { name } })),
            institutionMembership: isStudent
              ? {
                  studentCategory: external ? 'EXTERNAL' : 'INTERNAL',
                  paymentStatus:
                    profile.profileId === identities.externalPaid.profileId ||
                    profile.profileId === identities.externalExpired.profileId
                      ? 'PAID'
                      : external
                        ? 'PENDING'
                        : 'NOT_REQUIRED',
                  paidAccessUntil:
                    profile.profileId === identities.externalExpired.profileId
                      ? new Date('2020-01-01T00:00:00Z')
                      : null,
                }
              : null,
          };
        }),
      })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  const get = (path: string, token?: keyof typeof identities) => {
    const call = request(app.getHttpServer()).get(path);
    return token ? call.set('Authorization', `Bearer ${token}`) : call;
  };

  it('returns 401 when a protected endpoint has no bearer token', () =>
    get('/api/learning').expect(401));

  it('returns server-derived identity and roles for an authenticated user', () =>
    get('/api/auth/me', 'admin').expect(200, {
      authUserId: identities.admin.authUserId,
      profileId: identities.admin.profileId,
      displayName: null,
      email: null,
      roles: ['ADMIN'],
      studentAccess: null,
    }));

  it('returns the resolved free or paid learning entitlement in the session', async () => {
    await get('/api/auth/me', 'student').expect(200, {
      authUserId: identities.student.authUserId,
      profileId: identities.student.profileId,
      displayName: null,
      email: null,
      roles: ['STUDENT'],
      studentAccess: {
        category: 'INTERNAL',
        paymentStatus: 'NOT_REQUIRED',
        paidAccessUntil: null,
        hasLearningAccess: true,
      },
    });
    await get('/api/auth/me', 'externalUnpaid').expect(200, {
      authUserId: identities.externalUnpaid.authUserId,
      profileId: identities.externalUnpaid.profileId,
      displayName: null,
      email: null,
      roles: ['STUDENT'],
      studentAccess: {
        category: 'EXTERNAL',
        paymentStatus: 'PENDING',
        paidAccessUntil: null,
        hasLearningAccess: false,
      },
    });
  });

  it('allows a student on learning routes but denies admin routes', async () => {
    await get('/api/learning', 'student').expect(200);
    await get('/api/admin/content', 'student').expect(403);
    await get('/api/admin/questions', 'student').expect(403);
  });

  it('protects the question bank from unauthenticated requests', () =>
    get('/api/admin/questions').expect(401));

  it('allows internal students free access and requires payment for external students', async () => {
    await get('/api/learning', 'student').expect(200);
    await get('/api/learning', 'externalUnpaid').expect(403);
    await get('/api/learning', 'externalPaid').expect(200);
    await get('/api/learning', 'externalExpired').expect(403);
  });

  it('allows an admin on academic administration but denies system settings', async () => {
    await get('/api/admin/content', 'admin').expect(200);
    await get('/api/system/settings', 'admin').expect(403);
  });

  it('allows SUPERADMIN on all privileged route levels', async () => {
    await get('/api/learning', 'superadmin').expect(200);
    await get('/api/admin/content', 'superadmin').expect(200);
    await get('/api/system/settings', 'superadmin').expect(200);
  });

  it('authenticates a new Google identity without granting any role', async () => {
    await get('/api/auth/me', 'pendingGoogleUser').expect(200, {
      authUserId: identities.pendingGoogleUser.authUserId,
      profileId: null,
      displayName: null,
      email: null,
      roles: [],
      studentAccess: null,
    });
    await get('/api/learning', 'pendingGoogleUser').expect(403);
    await get('/api/admin/content', 'pendingGoogleUser').expect(403);
  });

  it('blocks an ADMIN from granting SUPERADMIN', () =>
    request(app.getHttpServer())
      .post(`/api/profiles/${identities.otherStudent.profileId}/roles`)
      .set('Authorization', 'Bearer admin')
      .send({ role: 'SUPERADMIN' })
      .expect(403));

  it('blocks self-role changes', () =>
    request(app.getHttpServer())
      .post(`/api/profiles/${identities.admin.profileId}/roles`)
      .set('Authorization', 'Bearer admin')
      .send({ role: 'STUDENT' })
      .expect(403));

  it('blocks students from manual membership decisions', () =>
    request(app.getHttpServer())
      .patch(
        '/api/institution-memberships/30000000-0000-4000-8000-000000000001/verification',
      )
      .set('Authorization', 'Bearer student')
      .send({ status: 'VERIFIED', reason: 'Attempted self approval' })
      .expect(403));

  it('blocks administrators from submitting a student membership', () =>
    request(app.getHttpServer())
      .post('/api/institution-memberships/me/submission')
      .set('Authorization', 'Bearer admin')
      .send({ studentId: 'ISHARP-1001' })
      .expect(403));

  it("allows a student's own private profile but denies another student's", async () => {
    await get(
      `/api/profiles/${identities.student.profileId}/private`,
      'student',
    ).expect(200);
    await get(
      `/api/profiles/${identities.otherStudent.profileId}/private`,
      'student',
    ).expect(403);
  });

  it('prevents ADMIN from managing a SUPERADMIN profile', () =>
    get(
      `/api/profiles/${identities.superadmin.profileId}/private`,
      'admin',
    ).expect(403));

  afterAll(async () => app.close());
});
