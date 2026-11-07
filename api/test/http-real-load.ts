import http from 'node:http';
import { performance } from 'node:perf_hooks';

interface HttpMetric {
  target: string;
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
  heapMb: number;
}

function calculatePercentiles(latencies: number[]) {
  if (latencies.length === 0) return { p50: 0, p95: 0, p99: 0, avg: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  return {
    avg: Number((sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(2)),
    p50: Number(sorted[Math.floor(sorted.length * 0.5)].toFixed(2)),
    p95: Number(sorted[Math.floor(sorted.length * 0.95)].toFixed(2)),
    p99: Number(sorted[Math.floor(sorted.length * 0.99)].toFixed(2)),
  };
}

async function runTier(
  baseUrl: string,
  path: string,
  name: string,
  scenario: 'CACHE_HIT' | 'CACHE_MISS' | 'DB_PROBE',
  concurrency: number,
  requestsPerWorker: number,
  agent: http.Agent,
): Promise<HttpMetric> {
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
          headers: { Connection: 'keep-alive' },
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
  const { p50, p95, p99, avg } = calculatePercentiles(latencies);
  const rps = totalSec > 0 ? Number((successful / totalSec).toFixed(1)) : 0;
  const errorRate = totalRequests > 0 ? `${((errors / totalRequests) * 100).toFixed(1)}%` : '0.0%';

  return {
    target: name,
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
    heapMb: Number(mem.toFixed(2)),
  };
}

async function main() {
  const baseUrl = 'http://127.0.0.1:3005';
  console.log('='.repeat(90));
  console.log('PHASE 4: REAL END-TO-END HTTP PRODUCTION READINESS LOAD TEST');
  console.log(`Target: ${baseUrl} | Node: ${process.version} | Platform: ${process.platform}`);
  console.log('='.repeat(90));

  const agent = new http.Agent({ keepAlive: true, maxSockets: 200 });
  const results: HttpMetric[] = [];

  // SCENARIO 1: Pure HTTP Application Pipeline across 10, 25, 50, 100 concurrent students
  console.log('\n--- 1. REAL HTTP CONCURRENCY: API GATEWAY THROUGHPUT (10, 25, 50, 100 CONCURRENT USERS) ---');
  const concurrencyTiers = [10, 25, 50, 100];
  for (const c of concurrencyTiers) {
    const res = await runTier(
      baseUrl,
      '/',
      'API Gateway (HTTP Pipeline)',
      'CACHE_HIT',
      c,
      10, // 10 requests per worker: e.g. C=100 -> 1,000 real HTTP round-trips over TCP
      agent,
    );
    results.push(res);
    console.log(
      `  [C=${c.toString().padStart(3)}] HTTP P50: ${res.p50Ms.toString().padStart(6)}ms | ` +
      `P95: ${res.p95Ms.toString().padStart(6)}ms | P99: ${res.p99Ms.toString().padStart(6)}ms | ` +
      `RPS: ${res.rps.toString().padStart(7)} | Errors: ${res.errorRate}`
    );
  }

  // SCENARIO 2: Real HTTP Database Health Check (SELECT 1 through Prisma on remote Supabase)
  console.log('\n--- 3. REAL HTTP CONCURRENCY (DATABASE PROBE: SELECT 1 THROUGH PRISMA POOL) ---');
  for (const c of [1, 5, 10, 25]) {
    const res = await runTier(
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
      `RPS: ${res.rps.toString().padStart(7)} | Errors: ${res.errorRate}`
    );
  }

  console.log('\n' + '='.repeat(90));
  console.log('REAL END-TO-END HTTP AUDIT MATRIX');
  console.log('='.repeat(90));
  console.table(
    results.map((r) => ({
      Target: r.target,
      Scenario: r.scenario,
      Concurrency: r.concurrency,
      HTTP_Requests: r.totalRequests,
      'P50 (ms)': r.p50Ms,
      'P95 (ms)': r.p95Ms,
      'P99 (ms)': r.p99Ms,
      RPS: r.rps,
      Errors: r.errorRate,
      'Heap (MB)': r.heapMb,
    })),
  );

  agent.destroy();
}

main().catch(console.error);
