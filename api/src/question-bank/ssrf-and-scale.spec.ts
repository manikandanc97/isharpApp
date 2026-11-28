import { describe, expect, it, vi, afterEach } from 'vitest';
import * as http from 'node:http';
import { performance } from 'node:perf_hooks';
import {
  isAllowedIpAddress,
  isAllowedRemoteImageUrl,
  QuestionDuplicateDetectionService,
} from './question-duplicate-detection.service.js';

describe('SSRF Hardening & 300-Question Fingerprint Benchmark', () => {
  const service = new QuestionDuplicateDetectionService();

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('blocks IPv4-mapped IPv6, loopback, link-local, metadata, CGNAT, and unsafe schemes', () => {
    const blockedUrls = [
      'http://[::ffff:127.0.0.1]/secret.png',
      'http://[::ffff:169.254.169.254]/latest/meta-data/',
      'http://[::ffff:10.0.0.1]/internal.png',
      'http://[::ffff:192.168.1.10]/lan.png',
      'http://[::ffff:172.16.0.5]/vpc.png',
      'http://[::1]/loopback.png',
      'http://[::]/unspecified.png',
      'http://[fe80::1]/link-local.png',
      'http://[fc00::1]/ula.png',
      'http://127.0.0.1/a.png',
      'http://0177.0.0.1/octal.png',
      'http://2130706433/decimal.png',
      'http://100.64.0.1/cgnat.png',
      'http://169.254.169.254/latest/meta-data/',
      'http://localhost:3001/admin.png',
      'http://internal.local/secret.png',
      'file:///etc/passwd',
      'ftp://example.com/file.png',
      'gopher://127.0.0.1:6379/_INFO',
    ];

    for (const url of blockedUrls) {
      expect(isAllowedRemoteImageUrl(url)).toBe(false);
    }

    expect(isAllowedIpAddress('::ffff:7f00:1')).toBe(false);
    expect(isAllowedIpAddress('::ffff:a9fe:a9fe')).toBe(false);
    expect(isAllowedIpAddress('8.8.8.8')).toBe(true);
    expect(isAllowedRemoteImageUrl('https://cdn.example.com/physics/q1.png')).toBe(true);
  });

  it('enforces redirect: error and blocks oversized remote image responses', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.redirect).toBe('error');
      return new Response(new Uint8Array(16), {
        status: 200,
        headers: {
          'content-type': 'image/png',
          'content-length': String(12 * 1024 * 1024),
        },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const oversizedByHeader = await service.resolveImageHash(
      'https://cdn.example.com/huge-header.png',
    );
    expect(oversizedByHeader).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const bigBufferMock = vi.fn(async () => {
      return new Response(new Uint8Array(10 * 1024 * 1024 + 64), {
        status: 200,
        headers: { 'content-type': 'image/png' },
      });
    });
    vi.stubGlobal('fetch', bigBufferMock);

    const oversizedByBody = await service.resolveImageHash(
      'https://cdn.example.com/huge-body.png',
    );
    expect(oversizedByBody).toBeNull();

    // Streaming chunked response without Content-Length that exceeds 10 MB mid-stream
    const chunkedStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(6 * 1024 * 1024));
        controller.enqueue(new Uint8Array(5 * 1024 * 1024));
        controller.close();
      },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(chunkedStream, { status: 200, headers: { 'content-type': 'image/png' } })),
    );
    const oversizedByStream = await service.resolveImageHash(
      'https://cdn.example.com/huge-stream.png',
    );
    expect(oversizedByStream).toBeNull();
  });

  it('aborts timed-out remote image fetches safely', async () => {
    const abortErr = new DOMException('The operation was aborted', 'AbortError');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw abortErr;
      }),
    );

    const hash = await service.resolveImageHash('https://cdn.example.com/slow.png');
    expect(hash).toBeNull();
  });

  it('rejects redirects and aborts slow-drip/chunked >10MB streams via real HTTP transport', async () => {
    const server = http.createServer((req, res) => {
      if (req.url === '/redirect') {
        res.writeHead(302, { Location: 'http://127.0.0.1/secret' });
        res.end();
        return;
      }
      if (req.url === '/chunked-huge') {
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.write(Buffer.alloc(6 * 1024 * 1024));
        res.write(Buffer.alloc(5 * 1024 * 1024));
        res.end();
        return;
      }
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(Buffer.from('ok'));
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address() as { port: number };
    try {
      const redirectResult = await (service as unknown as {
        fetchWithPinnedIp: (u: URL, ip: string, h: Record<string, string>, m: number) => Promise<unknown>;
      }).fetchWithPinnedIp(
        new URL(`http://cdn.example.com:${addr.port}/redirect`),
        '127.0.0.1',
        {},
        10 * 1024 * 1024,
      ).catch((e: Error) => e.message);
      expect(redirectResult).toContain('Redirect blocked (302)');

      const hugeResult = await (service as unknown as {
        fetchWithPinnedIp: (u: URL, ip: string, h: Record<string, string>, m: number) => Promise<unknown>;
      }).fetchWithPinnedIp(
        new URL(`http://cdn.example.com:${addr.port}/chunked-huge`),
        '127.0.0.1',
        {},
        10 * 1024 * 1024,
      );
      expect(hugeResult).toBeNull();
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('computes deterministic fingerprints for 300 bilingual questions within budget', () => {
    const latenciesMs: number[] = [];
    const tTotalStart = performance.now();

    for (let i = 0; i < 300; i++) {
      const t0 = performance.now();
      const fp = service.calculateFingerprints({
        type: i % 5 === 0 ? 'NUMERICAL' : 'SINGLE_CHOICE',
        textEn: `Question ${i}: Calculate ΔG = ΔH - TΔS for reaction ${i} with 10^-6 M`,
        textTa: `கேள்வி ${i}: வினை ${i}-க்கு ΔG = ΔH - TΔS மதிப்பைக் கணக்கிடுக`,
        numericalAnswer: i % 5 === 0 ? String(i * 1.5) : null,
        options:
          i % 5 === 0
            ? []
            : [
                { textEn: `Opt A ${i}`, textTa: `விருப்பம் அ ${i}`, isCorrect: i % 4 === 0, position: 1 },
                { textEn: `Opt B ${i}`, textTa: `விருப்பம் ஆ ${i}`, isCorrect: i % 4 === 1, position: 2 },
                { textEn: `Opt C ${i}`, textTa: `விருப்பம் இ ${i}`, isCorrect: i % 4 === 2, position: 3 },
                { textEn: `Opt D ${i}`, textTa: `விருப்பம் ஈ ${i}`, isCorrect: i % 4 === 3, position: 4 },
              ],
      });
      latenciesMs.push(performance.now() - t0);
      expect(fp.contentFingerprint).toHaveLength(64);
      expect(fp.equivalentFingerprint).toHaveLength(64);
    }

    const totalMs = performance.now() - tTotalStart;
    latenciesMs.sort((a, b) => a - b);
    const p95 = latenciesMs[Math.floor(latenciesMs.length * 0.95)];
    expect(totalMs).toBeLessThan(2000);
    expect(p95).toBeLessThan(20);
  });
});
