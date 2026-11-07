import dotenv from 'dotenv';
dotenv.config({ path: 'api/.env' });

import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AdminService } from '../src/admin/admin.service.js';
import { QuestionBankService } from '../src/question-bank/question-bank.service.js';

type BenchmarkResult = {
  endpoint: string;
  concurrency: number;
  totalRequests: number;
  successfulRequests: number;
  errorRate: string;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  requestsPerSecond: number;
};

function calculatePercentiles(latencies: number[]): { p50: number; p95: number; p99: number; avg: number } {
  if (latencies.length === 0) return { p50: 0, p95: 0, p99: 0, avg: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const avg = sorted.reduce((sum, val) => sum + val, 0) / sorted.length;
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  return { p50, p95, p99, avg };
}

async function runBenchmark(
  name: string,
  fn: () => Promise<unknown>,
  concurrency: number,
  requestsPerWorker: number,
): Promise<BenchmarkResult> {
  const totalRequests = concurrency * requestsPerWorker;
  const latencies: number[] = [];
  let successful = 0;
  let errors = 0;
  let remaining = totalRequests;

  const startTotal = performance.now();

  const worker = async () => {
    while (remaining > 0) {
      remaining--;
      const start = performance.now();
      try {
        await fn();
        latencies.push(performance.now() - start);
        successful++;
      } catch (err) {
        errors++;
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const totalTimeSec = (performance.now() - startTotal) / 1000;
  const { p50, p95, p99, avg } = calculatePercentiles(latencies);
  const rps = totalTimeSec > 0 ? successful / totalTimeSec : 0;
  const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;

  return {
    endpoint: name,
    concurrency,
    totalRequests,
    successfulRequests: successful,
    errorRate: `${errorRate.toFixed(1)}%`,
    avgLatencyMs: Number(avg.toFixed(1)),
    p50LatencyMs: Number(p50.toFixed(1)),
    p95LatencyMs: Number(p95.toFixed(1)),
    p99LatencyMs: Number(p99.toFixed(1)),
    requestsPerSecond: Number(rps.toFixed(1)),
  };
}

async function main() {
  console.log('='.repeat(80));
  console.log('I-SHARP ACADEMY ENTERPRISE API PERFORMANCE AUDIT & BENCHMARK');
  console.log(`Node: ${process.version} | Platform: ${process.platform} | Time: ${new Date().toISOString()}`);
  console.log('='.repeat(80));

  const config = new ConfigService({
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
  });
  const prisma = new PrismaService(config);

  try {
    process.stdout.write('Checking database connectivity... ');
    const t0 = performance.now();
    await prisma.onModuleInit();
    await prisma.$queryRawUnsafe('SELECT 1');
    console.log(`Connected in ${(performance.now() - t0).toFixed(1)} ms\n`);
  } catch (err: unknown) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }

  const adminService = new AdminService(prisma);
  const questionService = new QuestionBankService(prisma, config);

  const targets = [
    { name: 'Admin Overview', fn: () => adminService.overview() },
    { name: 'Course Catalog', fn: () => adminService.catalog() },
    { name: 'Question Bank List', fn: () => questionService.listQuestions() },
    { name: 'Question Search ("NEET")', fn: () => questionService.listQuestions('NEET') },
    { name: 'Mock Tests List', fn: () => questionService.listMockTests() },
  ];

  const results: BenchmarkResult[] = [];

  for (const target of targets) {
    console.log(`==> Benchmarking Target: ${target.name}`);

    // Concurrency 1 (Baseline)
    const base = await runBenchmark(target.name, target.fn, 1, 5);
    results.push(base);
    console.log(`    [C=1]  Avg: ${base.avgLatencyMs}ms | P50: ${base.p50LatencyMs}ms | P95: ${base.p95LatencyMs}ms | RPS: ${base.requestsPerSecond}`);

    // Concurrency 5
    const c5 = await runBenchmark(target.name, target.fn, 5, 2);
    results.push(c5);
    console.log(`    [C=5]  Avg: ${c5.avgLatencyMs}ms | P50: ${c5.p50LatencyMs}ms | P95: ${c5.p95LatencyMs}ms | RPS: ${c5.requestsPerSecond}`);

    // Concurrency 10
    const c10 = await runBenchmark(target.name, target.fn, 10, 1);
    results.push(c10);
    console.log(`    [C=10] Avg: ${c10.avgLatencyMs}ms | P50: ${c10.p50LatencyMs}ms | P95: ${c10.p95LatencyMs}ms | RPS: ${c10.requestsPerSecond}`);

    console.log('');
  }

  // Memory & Import Performance
  console.log('==> Benchmarking Bulk Question Import & Memory Consumption');
  const memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`    Heap Used Before Import: ${memoryBefore.toFixed(2)} MB`);

  const externalIds = Array.from({ length: 50 }, (_, i) => `BENCHMARK-Q-${Date.now()}-${i}`);
  const tImport0 = performance.now();
  const preflightRes = await questionService.importPreflight({ externalIds });
  const tImportDuration = performance.now() - tImport0;
  const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;

  console.log(`    Preflight 50 Question IDs Checked: ${preflightRes.existingExternalIds.length} existing in ${tImportDuration.toFixed(1)} ms`);
  console.log(`    Heap Used After Import: ${memoryAfter.toFixed(2)} MB (Delta: ${(memoryAfter - memoryBefore).toFixed(2)} MB)`);

  console.log('\n' + '='.repeat(80));
  console.log('BENCHMARK SUMMARY AUDIT MATRIX');
  console.log('='.repeat(80));
  console.table(
    results.map((r) => ({
      Endpoint: r.endpoint,
      Concurrency: r.concurrency,
      Requests: r.totalRequests,
      'Avg (ms)': r.avgLatencyMs,
      'P50 (ms)': r.p50LatencyMs,
      'P95 (ms)': r.p95LatencyMs,
      'P99 (ms)': r.p99LatencyMs,
      RPS: r.requestsPerSecond,
      Errors: r.errorRate,
    })),
  );

  await prisma.onModuleDestroy();
}

main().catch(console.error);
