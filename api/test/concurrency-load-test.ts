import dotenv from 'dotenv';
dotenv.config({ path: 'api/.env' });
import { performance } from 'node:perf_hooks';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AdminService } from '../src/admin/admin.service.js';
import { QuestionBankService } from '../src/question-bank/question-bank.service.js';

interface ConcurrencyMetric {
  target: string;
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
  return { p50, p95, p99, avg };
}

async function testWorkerLoad(
  name: string,
  fn: () => Promise<unknown>,
  concurrency: number,
  requestsPerWorker: number,
): Promise<ConcurrencyMetric> {
  const totalRequests = concurrency * requestsPerWorker;
  const latencies: number[] = [];
  let successful = 0;
  let errors = 0;
  let remaining = totalRequests;

  const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;
  const tStart = performance.now();

  const worker = async () => {
    while (remaining > 0) {
      remaining--;
      const t0 = performance.now();
      try {
        await fn();
        latencies.push(performance.now() - t0);
        successful++;
      } catch (err) {
        errors++;
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const totalSec = (performance.now() - tStart) / 1000;
  const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;

  const { p50, p95, p99, avg } = calculatePercentiles(latencies);
  const rps = totalSec > 0 ? successful / totalSec : 0;
  const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;

  return {
    target: name,
    concurrency,
    totalRequests,
    successful,
    errors,
    errorRate: `${errorRate.toFixed(1)}%`,
    p50Ms: Number(p50.toFixed(1)),
    p95Ms: Number(p95.toFixed(1)),
    p99Ms: Number(p99.toFixed(1)),
    avgMs: Number(avg.toFixed(1)),
    rps: Number(rps.toFixed(1)),
    heapUsedMb: Number(memAfter.toFixed(2)),
  };
}

async function runSuite() {
  const config = new ConfigService({ DATABASE_URL: process.env.DATABASE_URL });
  const prisma = new PrismaService(config);
  await prisma.onModuleInit();

  const adminService = new AdminService(prisma);
  const questionService = new QuestionBankService(prisma, config);

  console.log('='.repeat(90));
  console.log('I-SHARP ACADEMY ENTERPRISE CONCURRENCY & SCALABILITY LOAD TEST HARNESS');
  console.log(`Node: ${process.version} | Platform: ${process.platform} | Time: ${new Date().toISOString()}`);
  console.log('='.repeat(90));

  const concurrencyLevels = [1, 5, 10, 25, 50];

  // Target 1: Course Catalog (High-frequency student & admin read)
  console.log('\n>>> BENCHMARKING TARGET: Course & Chapter Catalog');
  const catalogResults: ConcurrencyMetric[] = [];
  for (const c of concurrencyLevels) {
    const res = await testWorkerLoad('Course Catalog', () => adminService.catalog(), c, 2);
    catalogResults.push(res);
    console.log(`  [C=${c.toString().padStart(2)}] P50: ${res.p50Ms}ms | P95: ${res.p95Ms}ms | RPS: ${res.rps} | Errors: ${res.errorRate}`);
  }

  // Target 2: Mock Tests Catalog (Student Mock Test Portal)
  console.log('\n>>> BENCHMARKING TARGET: Mock Tests List');
  const mockResults: ConcurrencyMetric[] = [];
  for (const c of concurrencyLevels) {
    const res = await testWorkerLoad('Mock Tests List', () => questionService.listMockTests(), c, 2);
    mockResults.push(res);
    console.log(`  [C=${c.toString().padStart(2)}] P50: ${res.p50Ms}ms | P95: ${res.p95Ms}ms | RPS: ${res.rps} | Errors: ${res.errorRate}`);
  }

  // Target 3: Question Bank Paged List (Student DPP & Admin Question Bank)
  console.log('\n>>> BENCHMARKING TARGET: Question Bank Paged List (take 20)');
  const questionResults: ConcurrencyMetric[] = [];
  for (const c of [1, 5, 10, 25]) {
    const res = await testWorkerLoad(
      'Question Bank (Paged)',
      () => questionService.listQuestions({ page: 1, limit: 20 }),
      c,
      2,
    );
    questionResults.push(res);
    console.log(`  [C=${c.toString().padStart(2)}] P50: ${res.p50Ms}ms | P95: ${res.p95Ms}ms | RPS: ${res.rps} | Errors: ${res.errorRate}`);
  }

  console.log('\n' + '='.repeat(90));
  console.log('CONCURRENCY AUDIT RESULTS TABLE');
  console.log('='.repeat(90));
  console.table(
    [...catalogResults, ...mockResults, ...questionResults].map((r) => ({
      Target: r.target,
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
}

runSuite().catch(console.error);

