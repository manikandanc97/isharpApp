import dotenv from 'dotenv';
dotenv.config({ path: 'api/.env' });
process.env.DATABASE_POOL_MAX = '8';
process.env.DATABASE_POOL_MIN = '1';

import { performance } from 'node:perf_hooks';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AdminService } from '../src/admin/admin.service.js';
import { QuestionBankService } from '../src/question-bank/question-bank.service.js';
import { StudentAccessResolver } from '../src/auth/student-access-resolver.service.js';

interface BenchmarkRunResult {
  endpoint: string;
  scenario: 'COLD' | 'WARM' | 'DB_QUERY';
  concurrency: number;
  totalRequests: number;
  successful: number;
  errors: number;
  errorRate: string;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  avgMs: number;
  rps: number;
  heapUsedMb: number;
}

function calculatePercentiles(latencies: number[]) {
  if (latencies.length === 0) return { p50: 0, p95: 0, p99: 0, avg: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const avg = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  return {
    p50: Number(p50.toFixed(2)),
    p95: Number(p95.toFixed(2)),
    p99: Number(p99.toFixed(2)),
    avg: Number(avg.toFixed(2)),
  };
}

async function runWorkerLoad(
  name: string,
  scenario: 'COLD' | 'WARM' | 'DB_QUERY',
  fn: () => Promise<unknown>,
  concurrency: number,
  requestsPerWorker: number,
): Promise<BenchmarkRunResult> {
  const totalRequests = concurrency * requestsPerWorker;
  const latencies: number[] = [];
  let successful = 0;
  let errors = 0;
  let remaining = totalRequests;

  const tStart = performance.now();

  const worker = async () => {
    while (remaining > 0) {
      remaining--;
      const t0 = performance.now();
      try {
        await fn();
        latencies.push(performance.now() - t0);
        successful++;
      } catch (err: any) {
        console.error(`[${name}] Worker failed:`, err?.message || err);
        errors++;
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const totalSec = (performance.now() - tStart) / 1000;
  const mem = process.memoryUsage().heapUsed / 1024 / 1024;
  const { p50, p95, p99, avg } = calculatePercentiles(latencies);
  const rps = totalSec > 0 ? Number((successful / totalSec).toFixed(1)) : 0;
  const errorRate = totalRequests > 0 ? `${((errors / totalRequests) * 100).toFixed(1)}%` : '0.0%';

  return {
    endpoint: name,
    scenario,
    concurrency,
    totalRequests,
    successful,
    errors,
    errorRate,
    p50Ms: p50,
    p95Ms: p95,
    p99Ms: p99,
    avgMs: avg,
    rps,
    heapUsedMb: Number(mem.toFixed(2)),
  };
}

async function main() {
  console.log('='.repeat(90));
  console.log('PHASE 5: DATABASE-BOUND LOAD & CONCURRENCY BENCHMARK (POOL MAX=8, MIN=1)');
  console.log(`Node: ${process.version} | Platform: ${process.platform} | Time: ${new Date().toISOString()}`);
  console.log('='.repeat(90));

  const config = new ConfigService({ DATABASE_URL: process.env.DATABASE_URL });
  const prisma = new PrismaService(config);
  await prisma.onModuleInit();

  const adminService = new AdminService(prisma);
  const questionService = new QuestionBankService(prisma, config);
  const studentResolver = new StudentAccessResolver(prisma);

  // Warm-up database connection with retry
  process.stdout.write('Checking database connectivity & warming initial pool socket... ');
  const t0Conn = performance.now();
  let connected = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await prisma.$queryRawUnsafe('SELECT 1');
      connected = true;
      break;
    } catch (err: any) {
      console.log(`\n  Connection attempt ${attempt} failed (${err.message || err}), retrying in 2s...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  if (!connected) {
    throw new Error('Could not establish initial database connection after 3 attempts');
  }
  console.log(`Connected in ${(performance.now() - t0Conn).toFixed(1)} ms\n`);

  const results: BenchmarkRunResult[] = [];

  // --- TARGET 1: Admin Overview (Cold DB Trip vs Warm In-Memory Cache) ---
  console.log('>>> [1/6] BENCHMARKING: Admin Overview');
  adminService.invalidateOverviewCache();
  const t0ColdOverview = performance.now();
  await adminService.overview();
  const coldOverviewMs = performance.now() - t0ColdOverview;
  console.log(`    Cold DB Overview fetch: ${coldOverviewMs.toFixed(2)} ms`);
  results.push({
    endpoint: 'Admin Overview',
    scenario: 'COLD',
    concurrency: 1,
    totalRequests: 1,
    successful: 1,
    errors: 0,
    errorRate: '0.0%',
    p50Ms: Number(coldOverviewMs.toFixed(2)),
    p95Ms: Number(coldOverviewMs.toFixed(2)),
    p99Ms: Number(coldOverviewMs.toFixed(2)),
    avgMs: Number(coldOverviewMs.toFixed(2)),
    rps: Number((1000 / coldOverviewMs).toFixed(1)),
    heapUsedMb: Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)),
  });

  for (const c of [5, 10, 25, 50]) {
    const res = await runWorkerLoad('Admin Overview', 'WARM', () => adminService.overview(), c, 4);
    results.push(res);
    console.log(`    [C=${c.toString().padStart(2)}] WARM P50: ${res.p50Ms}ms | P95: ${res.p95Ms}ms | RPS: ${res.rps} | Errors: ${res.errorRate}`);
  }

  // --- TARGET 2: Student Dashboard / Course Catalog ---
  console.log('\n>>> [2/6] BENCHMARKING: Student Dashboard (Course Catalog Navigation)');
  adminService.invalidateCatalogCache();
  const t0ColdCatalog = performance.now();
  await adminService.catalog();
  const coldCatalogMs = performance.now() - t0ColdCatalog;
  console.log(`    Cold DB Catalog fetch: ${coldCatalogMs.toFixed(2)} ms`);
  results.push({
    endpoint: 'Course Catalog',
    scenario: 'COLD',
    concurrency: 1,
    totalRequests: 1,
    successful: 1,
    errors: 0,
    errorRate: '0.0%',
    p50Ms: Number(coldCatalogMs.toFixed(2)),
    p95Ms: Number(coldCatalogMs.toFixed(2)),
    p99Ms: Number(coldCatalogMs.toFixed(2)),
    avgMs: Number(coldCatalogMs.toFixed(2)),
    rps: Number((1000 / coldCatalogMs).toFixed(1)),
    heapUsedMb: Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)),
  });

  for (const c of [5, 10, 25, 50]) {
    const res = await runWorkerLoad('Course Catalog', 'WARM', () => adminService.catalog(), c, 4);
    results.push(res);
    console.log(`    [C=${c.toString().padStart(2)}] WARM P50: ${res.p50Ms}ms | P95: ${res.p95Ms}ms | RPS: ${res.rps} | Errors: ${res.errorRate}`);
  }

  // --- TARGET 3: Question Bank Paged Listing (Direct Database Query) ---
  console.log('\n>>> [3/6] BENCHMARKING: Question Bank Paged List (take 20, Direct DB Query)');
  for (const c of [1, 5, 10, 25]) {
    const res = await runWorkerLoad(
      'Question Bank (Paged)',
      'DB_QUERY',
      () => questionService.listQuestions({ page: 1, limit: 20 }),
      c,
      2,
    );
    results.push(res);
    console.log(`    [C=${c.toString().padStart(2)}] DB P50: ${res.p50Ms}ms | P95: ${res.p95Ms}ms | RPS: ${res.rps} | Errors: ${res.errorRate}`);
  }

  // --- TARGET 4: Question Search (Insensitive Substring Search in DB) ---
  console.log('\n>>> [4/6] BENCHMARKING: Question Search ("NEET" / "Physics", Direct DB Query)');
  for (const c of [1, 5, 10]) {
    const res = await runWorkerLoad(
      'Question Search ("Physics")',
      'DB_QUERY',
      () => questionService.listQuestions({ query: 'Physics', page: 1, limit: 20 }),
      c,
      2,
    );
    results.push(res);
    console.log(`    [C=${c.toString().padStart(2)}] DB P50: ${res.p50Ms}ms | P95: ${res.p95Ms}ms | RPS: ${res.rps} | Errors: ${res.errorRate}`);
  }

  // --- TARGET 5: Mock Tests Listing (Cold DB vs Warm Cache) ---
  console.log('\n>>> [5/6] BENCHMARKING: Mock Tests Listing');
  questionService.invalidateMockTestsCache();
  const t0ColdMocks = performance.now();
  await questionService.listMockTests();
  const coldMocksMs = performance.now() - t0ColdMocks;
  console.log(`    Cold DB Mock Tests fetch: ${coldMocksMs.toFixed(2)} ms`);
  results.push({
    endpoint: 'Mock Tests List',
    scenario: 'COLD',
    concurrency: 1,
    totalRequests: 1,
    successful: 1,
    errors: 0,
    errorRate: '0.0%',
    p50Ms: Number(coldMocksMs.toFixed(2)),
    p95Ms: Number(coldMocksMs.toFixed(2)),
    p99Ms: Number(coldMocksMs.toFixed(2)),
    avgMs: Number(coldMocksMs.toFixed(2)),
    rps: Number((1000 / coldMocksMs).toFixed(1)),
    heapUsedMb: Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)),
  });

  for (const c of [5, 10, 25, 50]) {
    const res = await runWorkerLoad('Mock Tests List', 'WARM', () => questionService.listMockTests(), c, 4);
    results.push(res);
    console.log(`    [C=${c.toString().padStart(2)}] WARM P50: ${res.p50Ms}ms | P95: ${res.p95Ms}ms | RPS: ${res.rps} | Errors: ${res.errorRate}`);
  }

  // --- TARGET 6: Student Access Verification (Authentication Hot Path) ---
  console.log('\n>>> [6/6] BENCHMARKING: Student Access Verification (findUnique in DB)');
  const sampleAuthUserId = '00000000-0000-0000-0000-000000000000';
  for (const c of [1, 5, 10, 25]) {
    const res = await runWorkerLoad(
      'Student Access Verification',
      'DB_QUERY',
      () => studentResolver.resolve(sampleAuthUserId, { email: 'student@example.com' }),
      c,
      2,
    );
    results.push(res);
    console.log(`    [C=${c.toString().padStart(2)}] DB P50: ${res.p50Ms}ms | P95: ${res.p95Ms}ms | RPS: ${res.rps} | Errors: ${res.errorRate}`);
  }

  console.log('\n' + '='.repeat(90));
  console.log('PHASE 5 DATABASE-BOUND BENCHMARK AUDIT MATRIX (POOL MAX=8, MIN=1)');
  console.log('='.repeat(90));
  console.table(
    results.map((r) => ({
      Endpoint: r.endpoint,
      Scenario: r.scenario,
      Concurrency: r.concurrency,
      Requests: r.totalRequests,
      'P50 (ms)': r.p50Ms,
      'P95 (ms)': r.p95Ms,
      'P99 (ms)': r.p99Ms,
      RPS: r.rps,
      Errors: r.errorRate,
      'Heap (MB)': r.heapUsedMb,
    })),
  );

  await prisma.onModuleDestroy();
  console.log('\nBenchmark completed successfully.');
}

main().catch(console.error);
