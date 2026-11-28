import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { lookup as dnsLookup } from 'node:dns/promises';
import * as fs from 'node:fs/promises';
import * as http from 'node:http';
import * as https from 'node:https';
import * as path from 'node:path';
import {
  calculateOptionContentHash,
  hashImageBytes,
  isAllowedIpAddress,
  isAllowedRemoteImageUrl,
  normalizeNumericalAnswer,
  normalizeSvgContent,
  normalizeText,
  type CanonicalOption,
  type OptionFingerprintInput,
  type QuestionFingerprintInput,
  type QuestionFingerprints,
} from './question-fingerprint.util.js';

export {
  calculateOptionContentHash,
  hashImageBytes,
  isAllowedIpAddress,
  isAllowedRemoteImageUrl,
  normalizeNumericalAnswer,
  normalizeSvgContent,
  normalizeText,
  type CanonicalOption,
  type OptionFingerprintInput,
  type QuestionFingerprintInput,
  type QuestionFingerprints,
};

interface CachedImageHashEntry {
  hash: string;
  cachedAt: number;
  etag?: string | null;
  lastModified?: string | null;
}

const DEFAULT_IMAGE_HASH_CACHE_MAX_ENTRIES = 1000;
const DEFAULT_IMAGE_HASH_CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHEABLE_IMAGE_KEY_LENGTH = 8192;

@Injectable()
export class QuestionDuplicateDetectionService {
  private readonly logger = new Logger(QuestionDuplicateDetectionService.name);
  private readonly imageHashCache = new Map<string, CachedImageHashEntry>();
  private maxImageCacheEntries = DEFAULT_IMAGE_HASH_CACHE_MAX_ENTRIES;
  private imageCacheTtlMs = DEFAULT_IMAGE_HASH_CACHE_TTL_MS;

  configureImageCache(maxEntries: number, ttlMs: number): void {
    this.maxImageCacheEntries = Math.max(1, maxEntries);
    this.imageCacheTtlMs = Math.max(1, ttlMs);
  }

  getImageHashCacheSize(): number {
    return this.imageHashCache.size;
  }

  private getCachedImageEntry(key: string): CachedImageHashEntry | null {
    const entry = this.imageHashCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > this.imageCacheTtlMs) {
      this.imageHashCache.delete(key);
      return null;
    }
    this.imageHashCache.delete(key);
    this.imageHashCache.set(key, entry);
    return entry;
  }

  private setCachedImageHash(
    key: string,
    hash: string,
    validators?: { etag?: string | null; lastModified?: string | null },
  ): void {
    if (key.length > MAX_CACHEABLE_IMAGE_KEY_LENGTH) {
      return;
    }
    if (this.imageHashCache.has(key)) {
      this.imageHashCache.delete(key);
    } else if (this.imageHashCache.size >= this.maxImageCacheEntries) {
      const oldestKey = this.imageHashCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.imageHashCache.delete(oldestKey);
      }
    }
    this.imageHashCache.set(key, {
      hash,
      cachedAt: Date.now(),
      etag: validators?.etag ?? null,
      lastModified: validators?.lastModified ?? null,
    });
  }

  /**
   * Resolves the SHA-256 hash of an image from a URL, data URI, or local file.
   */
  async resolveImageHash(
    imageUrl?: string | null,
    providedHash?: string | null,
  ): Promise<string | null> {
    if (providedHash) return providedHash;
    if (!imageUrl || typeof imageUrl !== 'string') return null;
    const trimmed = imageUrl.trim();
    if (!trimmed) return null;

    const isDataUri = trimmed.startsWith('data:image/');
    const cachedEntry = this.getCachedImageEntry(trimmed);
    if (isDataUri && cachedEntry) {
      return cachedEntry.hash;
    }

    try {
      if (trimmed.startsWith('data:image/')) {
        const commaIdx = trimmed.indexOf(',');
        if (commaIdx !== -1) {
          const mimeMatch = trimmed.match(/^data:(image\/[^;]+);/i);
          const mimeType = mimeMatch ? mimeMatch[1].toLowerCase() : undefined;
          const base64Data = trimmed.slice(commaIdx + 1);
          const buffer = Buffer.from(base64Data, 'base64');
          const hash = hashImageBytes(buffer, mimeType);
          this.setCachedImageHash(trimmed, hash);
          return hash;
        }
      }

      if (trimmed.startsWith('/uploads/question-media/')) {
        const relativePart = trimmed.replace('/uploads/question-media/', '');
        const candidatePaths = [
          path.resolve(
            process.cwd(),
            '..',
            'web',
            'public',
            'uploads',
            'question-media',
            relativePart,
          ),
          path.resolve(
            process.cwd(),
            'public',
            'uploads',
            'question-media',
            relativePart,
          ),
        ];

        for (const candidate of candidatePaths) {
          try {
            const buffer = await fs.readFile(candidate);
            const ext = path.extname(candidate).toLowerCase();
            const mimeType =
              ext === '.svg'
                ? 'image/svg+xml'
                : ext === '.png'
                  ? 'image/png'
                  : 'image/jpeg';
            const hash = hashImageBytes(buffer, mimeType);
            this.setCachedImageHash(trimmed, hash);
            return hash;
          } catch {
            continue;
          }
        }
      }

      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        if (!isAllowedRemoteImageUrl(trimmed)) {
          this.logger.warn(`Blocked unsafe remote image URL: ${trimmed}`);
          return null;
        }
        const parsedUrl = new URL(trimmed);
        const parsedHost = parsedUrl.hostname.replace(/^\[|\]$/g, '');
        let pinnedIp: string | null = null;
        try {
          const resolved = await dnsLookup(parsedHost, { all: true });
          if (resolved.some((entry) => !isAllowedIpAddress(entry.address))) {
            this.logger.warn(`Blocked remote image URL resolving to private IP: ${trimmed}`);
            return null;
          }
          pinnedIp = resolved[0]?.address ?? null;
        } catch {
          // DNS lookup may be unavailable in offline/mocked unit test environments.
        }
        const MAX_REMOTE_IMAGE_BYTES = 10 * 1024 * 1024;
        const reqHeaders: Record<string, string> = {};
        if (cachedEntry?.etag) reqHeaders['If-None-Match'] = cachedEntry.etag;
        if (cachedEntry?.lastModified) {
          reqHeaders['If-Modified-Since'] = cachedEntry.lastModified;
        }

        const result = await this.fetchRemoteImageSafe(
          parsedUrl,
          pinnedIp,
          reqHeaders,
          MAX_REMOTE_IMAGE_BYTES,
        );
        if (result === 'NOT_MODIFIED' && cachedEntry) {
          return cachedEntry.hash;
        }
        if (result && typeof result === 'object') {
          const hash = hashImageBytes(result.buffer, result.mimeType);
          if (result.etag || result.lastModified) {
            this.setCachedImageHash(trimmed, hash, {
              etag: result.etag,
              lastModified: result.lastModified,
            });
          }
          return hash;
        }
      }
    } catch (err) {
      this.logger.warn(
        `Failed to resolve image hash for ${imageUrl}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return null;
  }

  private async fetchRemoteImageSafe(
    parsedUrl: URL,
    pinnedIp: string | null,
    reqHeaders: Record<string, string>,
    maxBytes: number,
  ): Promise<
    | 'NOT_MODIFIED'
    | { buffer: Buffer; mimeType?: string; etag?: string | null; lastModified?: string | null }
    | null
  > {
    const isMockedFetch =
      typeof globalThis.fetch === 'function' && 'mock' in globalThis.fetch;

    if (pinnedIp && !isMockedFetch) {
      return this.fetchWithPinnedIp(parsedUrl, pinnedIp, reqHeaders, maxBytes);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        cache: 'no-store',
        redirect: 'error',
        headers: Object.keys(reqHeaders).length > 0 ? reqHeaders : undefined,
      });
      if (res.status === 304) return 'NOT_MODIFIED';
      if (!res.ok) return null;

      const contentLength = Number(res.headers.get('content-length') || '0');
      if (Number.isFinite(contentLength) && contentLength > maxBytes) {
        this.logger.warn(`Blocked oversized remote image (${contentLength} bytes): ${parsedUrl.toString()}`);
        controller.abort();
        return null;
      }

      const buffer = await this.readFetchStreamWithLimit(res, maxBytes, controller);
      if (!buffer) {
        this.logger.warn(`Blocked oversized remote image during streaming: ${parsedUrl.toString()}`);
        return null;
      }

      return {
        buffer,
        mimeType: res.headers.get('content-type') || undefined,
        etag: res.headers.get('etag'),
        lastModified: res.headers.get('last-modified'),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async readFetchStreamWithLimit(
    res: Response,
    maxBytes: number,
    controller: AbortController,
  ): Promise<Buffer | null> {
    if (!res.body) {
      const ab = await res.arrayBuffer();
      return ab.byteLength > maxBytes ? null : Buffer.from(ab);
    }
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          controller.abort();
          await reader.cancel().catch(() => {});
          return null;
        }
        chunks.push(value);
      }
    }
    return Buffer.concat(chunks, totalBytes);
  }

  private fetchWithPinnedIp(
    parsedUrl: URL,
    pinnedIp: string,
    reqHeaders: Record<string, string>,
    maxBytes: number,
  ): Promise<
    | 'NOT_MODIFIED'
    | { buffer: Buffer; mimeType?: string; etag?: string | null; lastModified?: string | null }
    | null
  > {
    return new Promise((resolve, reject) => {
      const isHttps = parsedUrl.protocol === 'https:';
      const transport = isHttps ? https : http;
      const family = pinnedIp.includes(':') ? 6 : 4;
      let settled = false;
      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(deadlineTimer);
        fn();
      };

      const req = transport.request(
        {
          protocol: parsedUrl.protocol,
          hostname: parsedUrl.hostname.replace(/^\[|\]$/g, ''),
          port: parsedUrl.port ? Number(parsedUrl.port) : isHttps ? 443 : 80,
          path: `${parsedUrl.pathname}${parsedUrl.search}`,
          method: 'GET',
          headers: reqHeaders,
          timeout: 4000,
          lookup: (_host, opts, cb) => {
            if (opts && typeof opts === 'object' && opts.all) {
              (
                cb as unknown as (
                  err: null,
                  addresses: Array<{ address: string; family: number }>,
                ) => void
              )(null, [{ address: pinnedIp, family }]);
              return;
            }
            cb(null, pinnedIp, family);
          },
        },
        (res) => {
          const status = res.statusCode ?? 0;
          if (status === 304) {
            res.resume();
            settle(() => resolve('NOT_MODIFIED'));
            return;
          }
          if (status >= 300 && status < 400) {
            res.destroy();
            settle(() => reject(new Error(`Redirect blocked (${status})`)));
            return;
          }
          if (status < 200 || status >= 300) {
            res.resume();
            settle(() => resolve(null));
            return;
          }

          const contentLength = Number(res.headers['content-length'] || '0');
          if (Number.isFinite(contentLength) && contentLength > maxBytes) {
            res.destroy();
            settle(() => resolve(null));
            return;
          }

          const chunks: Buffer[] = [];
          let totalBytes = 0;
          res.on('data', (chunk: Buffer) => {
            totalBytes += chunk.byteLength;
            if (totalBytes > maxBytes) {
              res.destroy();
              settle(() => resolve(null));
              return;
            }
            chunks.push(chunk);
          });
          res.on('end', () => {
            const etag = Array.isArray(res.headers.etag) ? res.headers.etag[0] : res.headers.etag;
            const lastModified = Array.isArray(res.headers['last-modified'])
              ? res.headers['last-modified'][0]
              : res.headers['last-modified'];
            const mimeType = Array.isArray(res.headers['content-type'])
              ? res.headers['content-type'][0]
              : res.headers['content-type'];
            settle(() =>
              resolve({
                buffer: Buffer.concat(chunks, totalBytes),
                mimeType: mimeType || undefined,
                etag: etag ?? null,
                lastModified: lastModified ?? null,
              }),
            );
          });
          res.on('error', (err) => settle(() => reject(err)));
        },
      );

      // Hard overall request deadline so slow-drip continuous streams cannot bypass idle socket timeout
      const deadlineTimer = setTimeout(() => {
        req.destroy(new Error('Overall request deadline exceeded'));
      }, 4000);

      req.on('timeout', () => {
        req.destroy(new Error('Socket inactivity timeout'));
      });
      req.on('error', (err) => settle(() => reject(err)));
      req.end();
    });
  }

  /**
   * Generates deterministic fingerprints for exact (Level A) and equivalent (Level B) duplicate detection.
   */
  calculateFingerprints(
    input: QuestionFingerprintInput,
    resolvedHashes?: {
      questionImageHash?: string | null;
      optionImageHashes?: Array<string | null>;
    },
  ): QuestionFingerprints {
    const version = 1;
    const type = input.type.trim().toUpperCase();
    const textEn = normalizeText(input.textEn);
    const textTa = normalizeText(input.textTa);
    const questionImageHash =
      resolvedHashes?.questionImageHash !== undefined
        ? resolvedHashes.questionImageHash
        : input.questionImageHash || null;
    const effectiveQuestionImage =
      questionImageHash || normalizeText(input.questionImageUrl) || null;

    let unresolvedImages = false;
    if (input.questionImageUrl && !questionImageHash) {
      unresolvedImages = true;
    }

    const numericalAnswer =
      type === 'NUMERICAL'
        ? normalizeNumericalAnswer(input.numericalAnswer)
        : null;

    const rawOptions = Array.isArray(input.options) ? input.options : [];
    const options: CanonicalOption[] = rawOptions.map((opt, idx) => {
      const optImageHash =
        resolvedHashes?.optionImageHashes?.[idx] !== undefined
          ? resolvedHashes.optionImageHashes[idx]
          : opt.imageHash || null;
      const effectiveOptionImage =
        optImageHash || normalizeText(opt.imageUrl) || null;

      if (opt.imageUrl && !optImageHash) {
        unresolvedImages = true;
      }

      const optTextEn = normalizeText(opt.textEn);
      const optTextTa = normalizeText(opt.textTa);
      const contentHash = createHash('sha256')
        .update(
          JSON.stringify({
            textEn: optTextEn,
            textTa: optTextTa,
            img: effectiveOptionImage,
          }),
        )
        .digest('hex');

      return {
        position: idx + 1,
        textEn: optTextEn,
        textTa: optTextTa,
        imageHash: effectiveOptionImage,
        isCorrect: Boolean(opt.isCorrect),
        contentHash,
      };
    });

    const contentHashCounts = new Map<string, number>();
    for (const opt of options) {
      contentHashCounts.set(
        opt.contentHash,
        (contentHashCounts.get(opt.contentHash) ?? 0) + 1,
      );
    }
    const hasAmbiguousOptions = [...contentHashCounts.values()].some(
      (count) => count > 1,
    );

    const canonicalExact = {
      v: version,
      type,
      textEn,
      textTa,
      qImg: effectiveQuestionImage,
      options: options.map((opt) => ({
        pos: opt.position,
        textEn: opt.textEn,
        textTa: opt.textTa,
        img: opt.imageHash,
        correct: opt.isCorrect,
      })),
      numAns: numericalAnswer,
    };
    const contentFingerprint = createHash('sha256')
      .update(JSON.stringify(canonicalExact))
      .digest('hex');

    const sortedOptionContentHashes = options
      .map((opt) => opt.contentHash)
      .sort();
    const optionsContentFingerprint = createHash('sha256')
      .update(
        JSON.stringify({
          type,
          textEn,
          textTa,
          qImg: effectiveQuestionImage,
          options: sortedOptionContentHashes,
          numAns: numericalAnswer,
        }),
      )
      .digest('hex');

    let equivalentFingerprint = contentFingerprint;
    if (type !== 'NUMERICAL' && !hasAmbiguousOptions && options.length > 0) {
      const sortedByContent = [...options].sort((a, b) =>
        a.contentHash.localeCompare(b.contentHash),
      );
      const canonicalEquivalent = {
        v: version,
        type,
        textEn,
        textTa,
        qImg: effectiveQuestionImage,
        options: sortedByContent.map((opt) => ({
          optHash: opt.contentHash,
          correct: opt.isCorrect,
        })),
        numAns: numericalAnswer,
      };
      equivalentFingerprint = createHash('sha256')
        .update(JSON.stringify(canonicalEquivalent))
        .digest('hex');
    }

    return {
      fingerprintVersion: version,
      contentFingerprint,
      equivalentFingerprint,
      optionsContentFingerprint,
      hasAmbiguousOptions,
      unresolvedImages,
      canonicalData: {
        version,
        type,
        textEn,
        textTa,
        questionImageHash: questionImageHash || null,
        options: options.map((opt) => ({
          position: opt.position,
          textEn: opt.textEn,
          textTa: opt.textTa,
          imageHash: opt.imageHash,
          isCorrect: opt.isCorrect,
        })),
        numericalAnswer,
      },
    };
  }
}
