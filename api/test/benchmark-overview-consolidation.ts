import dotenv from 'dotenv';
dotenv.config({ path: 'api/.env' });
import { performance } from 'node:perf_hooks';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AdminService } from '../src/admin/admin.service.js';

async function main() {
  const config = new ConfigService({ DATABASE_URL: process.env.DATABASE_URL });
  const prisma = new PrismaService(config);
  await prisma.onModuleInit();
  const adminService = new AdminService(prisma);

  console.log('Testing Admin Overview consolidation...');

  // 1. Current baseline (6 round-trips via Prisma)
  const t0Baseline = performance.now();
  const baselineRes = await adminService.overview();
  const baselineMs = performance.now() - t0Baseline;
  console.log(`Current 6-round-trip Overview: ${baselineMs.toFixed(1)} ms`);
  console.log('Baseline output:', JSON.stringify(baselineRes));

  // 2. Consolidated query (1 query for counts + 1 for recent = 2 round-trips)
  const t0Consolidated = performance.now();
  const [countsRaw, recent] = await Promise.all([
    prisma.$queryRaw<Array<{
      users: number;
      active_users: number;
      pending_verifications: number;
      courses: number;
      subjects: number;
    }>>`
      SELECT
        (SELECT count(*)::int FROM user_profiles up
         WHERE EXISTS (
           SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
           WHERE ur.user_profile_id = up.id AND r.name = 'STUDENT'
         ) AND NOT EXISTS (
           SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
           WHERE ur.user_profile_id = up.id AND r.name IN ('ADMIN', 'SUPERADMIN')
         )) AS users,
        (SELECT count(*)::int FROM user_profiles up
         WHERE up.is_active = true AND EXISTS (
           SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
           WHERE ur.user_profile_id = up.id AND r.name = 'STUDENT'
         ) AND NOT EXISTS (
           SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
           WHERE ur.user_profile_id = up.id AND r.name IN ('ADMIN', 'SUPERADMIN')
         )) AS active_users,
        (SELECT count(*)::int FROM institution_memberships im
         JOIN user_profiles up ON im.user_id = up.id
         WHERE im.status = 'PENDING' AND EXISTS (
           SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
           WHERE ur.user_profile_id = up.id AND r.name = 'STUDENT'
         ) AND NOT EXISTS (
           SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
           WHERE ur.user_profile_id = up.id AND r.name IN ('ADMIN', 'SUPERADMIN')
         )) AS pending_verifications,
        (SELECT count(*)::int FROM courses WHERE is_active = true) AS courses,
        (SELECT count(*)::int FROM subjects WHERE is_active = true) AS subjects;
    `,
    prisma.institutionMembership.findMany({
      where: {
        user: {
          userRoles: {
            some: { role: { name: 'STUDENT' } },
            none: { role: { name: { in: ['ADMIN', 'SUPERADMIN'] } } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        studentId: true,
        status: true,
        updatedAt: true,
        user: { select: { id: true, displayName: true } },
      },
    }),
  ]);
  const consolidatedMs = performance.now() - t0Consolidated;
  const metrics = countsRaw[0] ? {
    users: countsRaw[0].users,
    activeUsers: countsRaw[0].active_users,
    pendingVerifications: countsRaw[0].pending_verifications,
    courses: countsRaw[0].courses,
    subjects: countsRaw[0].subjects,
  } : { users: 0, activeUsers: 0, pendingVerifications: 0, courses: 0, subjects: 0 };

  console.log(`Consolidated Query Overview: ${consolidatedMs.toFixed(1)} ms`);
  console.log('Consolidated output matches baseline:', JSON.stringify(metrics) === JSON.stringify(baselineRes.metrics));
  console.log(`Latency reduction: ${((baselineMs - consolidatedMs) / baselineMs * 100).toFixed(1)}%`);

  await prisma.onModuleDestroy();
}

main().catch(console.error);

