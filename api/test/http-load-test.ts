import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config({ path: 'api/.env' });
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module.js';
import { type INestApplication } from '@nestjs/common';
import { performance } from 'node:perf_hooks';
import http from 'node:http';

interface HttpTestResult {
  endpoint: string;
  scenario: 'CACHE_HIT' | 'CACHE_MISS' | 'DB_PROBE';
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

function percentiles(values: number[]) {
  if (values.length === 0) return { p50: 0, p95: 0, p99: 0, avg: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  return {
    avg: Number((sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(2)),
    p50: Number(sorted[Math.floor(sorted.length * 0.5)].toFixed(2)),
    p95: Number(sorted[Math.floor(sorted.length * 0.95)].toFixed(2)),
    p99: Number(sorted[Math.floor(sorted.length * 0.99)].toFixed(2)),
  };
}

async function runHttpWorkerLoad(
  baseUrl: string,
  path: string,
  name: string,
  scenario: 'CACHE_HIT' | 'CACHE_MISS' | 'DB_PROBE',
  concurrency: number,
  requestsPerWorker: number,
  agent: http.Agent,
): Promise<HttpTestResult> {
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
        const res = await fetch(`${baseUrl}${path}`, {
          // @ts-expect-error Node fetch agent support
          agent,
          headers: { 'Connection': 'keep-alive' },
        });
        const duration = performance.now() - t0;
        if (res.ok) {
          latencies.push(duration);
          successful++;
        } else {
          errors++;
        }
      } catch {
        errors++;
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const totalSec = (performance.now() - tStart) / 1000;
  const mem = process.memoryUsage().heapUsed / 1024 / 1024;
  const { p50, p95, p99, avg } = percentiles(latencies);
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
  try {
    console.log('='.repeat(90));
    console.log('PHASE 4: REAL END-TO-END HTTP PRODUCTION READINESS LOAD TEST');
    console.log(`Environment: Node ${process.version} | ${process.platform} | Time: ${new Date().toISOString()}`);
    console.log('='.repeat(90));

    // Initialize real NestJS HTTP Server
    console.log('Starting NestJS server...');
    const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
    app.enableShutdownHooks();
    await app.listen(0); // Bind to OS ephemeral port
    console.log('NestJS server started successfully.');

  const server = app.getHttpServer();
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3001;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`NestJS HTTP Server listening on real TCP loopback: ${baseUrl}\n`);

  const agent = new http.Agent({ keepAlive: true, maxSockets: 150 });
  const results: HttpTestResult[] = [];

  const concurrencyTiers = [10, 25, 50, 100];

  // 1. SCENARIO A: Real HTTP Requests hitting Cache (e.g. Catalog Cache-Hit)
  // First prime the catalog cache
  console.log('>>> Priming in-memory course catalog cache...');
  await fetch(`${baseUrl}/api/courses/catalog`).catch(() => {});
  console.log('Catalog primed.\n');

  console.log('--- TEST SUITE 1: HTTP REAL LOAD (CACHE-HIT TRAFFIC) ---');
  for (const c of concurrencyTiers) {
    const res = await runHttpWorkerLoad(
      baseUrl,
      '/api/courses/catalog',
      'Course Catalog',
      'CACHE_HIT',
      c,
      5, // 5 requests per worker: e.g. C=100 -> 500 HTTP requests
      agent,
    );
    results.push(res);
    console.log(
      `  [C=${c.toString().padStart(3)}] HTTP P50: ${res.p50Ms.toString().padStart(6)}ms | ` +
      `P95: ${res.p95Ms.toString().padStart(6)}ms | P99: ${res.p99Ms.toString().padStart(6)}ms | ` +
      `RPS: ${res.rps.toString().padStart(6)} | Errors: ${res.errorRate}`
    );
  }

  // 2. SCENARIO B: Real HTTP Requests hitting Database (Health DB Probe SELECT 1)
  console.log('\n--- TEST SUITE 2: HTTP REAL LOAD (DATABASE PROBE: SELECT 1 via Prisma) ---');
  for (const c of [10, 25, 50]) {
    const res = await runHttpWorkerLoad(
      baseUrl,
      '/api/health',
      'Health DB Check',
      'DB_PROBE',
      c,
      2,
      agent,
    );
    results.push(res);
    console.log(
      `  [C=${c.toString().padStart(3)}] HTTP P50: ${res.p50Ms.toString().padStart(6)}ms | ` +
      `P95: ${res.p95Ms.toString().padStart(6)}ms | P99: ${res.p99Ms.toString().padStart(6)}ms | ` +
      `RPS: ${res.rps.toString().padStart(6)} | Errors: ${res.errorRate}`
    );
  }

  console.log('\n' + '='.repeat(90));
  console.log('REAL HTTP LOAD TEST AUDIT MATRIX');
  console.log('='.repeat(90));
  console.table(
    results.map((r) => ({
      Endpoint: r.endpoint,
      Scenario: r.scenario,
      Concurrency: r.concurrency,
      HTTP_Requests: r.totalRequests,
      'P50 (ms)': r.p50Ms,
      'P95 (ms)': r.p95Ms,
      'P99 (ms)': r.p99Ms,
      RPS: r.rps,
      Errors: r.errorRate,
      'Heap (MB)': r.heapUsedMb,
    })),
  );

  agent.destroy();
  await app.close();
  console.log('\nHTTP Server shut down cleanly. All resources released.');
  } catch (err) {
    console.error('FATAL ERROR CAUGHT IN MAIN:', err);
  }
}

main().catch((err) => console.error('TOP LEVEL REJECTION:', err));
