import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface OptionFingerprintInput {
  label?: string;
  textEn?: string | null;
  textTa?: string | null;
  imageUrl?: string | null;
  imageHash?: string | null;
  isCorrect: boolean;
  position?: number;
}

export interface QuestionFingerprintInput {
  type: string;
  textEn?: string | null;
  textTa?: string | null;
  questionImageUrl?: string | null;
  questionImageHash?: string | null;
  options?: OptionFingerprintInput[];
  numericalAnswer?: string | null;
  courseSubjectId?: string | null;
}

export interface CanonicalOption {
  position: number;
  textEn: string | null;
  textTa: string | null;
  imageHash: string | null;
  isCorrect: boolean;
  contentHash: string;
}

export interface QuestionFingerprints {
  fingerprintVersion: number;
  contentFingerprint: string;
  equivalentFingerprint: string;
  optionsContentFingerprint: string;
  hasAmbiguousOptions: boolean;
  unresolvedImages: boolean;
  canonicalData: {
    version: number;
    type: string;
    textEn: string | null;
    textTa: string | null;
    questionImageHash: string | null;
    options: Array<{
      position: number;
      textEn: string | null;
      textTa: string | null;
      imageHash: string | null;
      isCorrect: boolean;
    }>;
    numericalAnswer: string | null;
  };
}

export function normalizeText(text?: string | null): string | null {
  if (text === null || text === undefined) return null;
  const s = String(text).normalize('NFC');
  const trimmed = s
    .replace(/\r\n/g, '\n')
    .replace(/[\t\v\f\r ]+/g, ' ')
    .trim();
  return trimmed || null;
}

export function normalizeNumericalAnswer(ans?: string | null): string | null {
  const normalized = normalizeText(ans);
  if (!normalized) return null;
  // If it's a simple number with unnecessary leading '+' or extra spaces around decimal, trim them safely
  const cleaned = normalized.replace(/^\+/, '').trim();
  return cleaned || null;
}

export function normalizeSvgContent(svgString: string): string {
  return svgString
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!doctype[\s\S]*?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
}

export function hashImageBytes(
  bytes: Uint8Array | Buffer,
  mimeType?: string,
): string {
  const isSvg =
    mimeType === 'image/svg+xml' ||
    (bytes.length > 4 &&
      Buffer.from(bytes.subarray(0, 100))
        .toString('utf8')
        .toLowerCase()
        .includes('<svg'));

  if (isSvg) {
    const rawSvg = Buffer.from(bytes).toString('utf8');
    const normalizedSvg = normalizeSvgContent(rawSvg);
    return createHash('sha256').update(normalizedSvg, 'utf8').digest('hex');
  }

  return createHash('sha256').update(bytes).digest('hex');
}

export function calculateOptionContentHash(opt: {
  textEn?: string | null;
  textTa?: string | null;
  imageHash?: string | null;
  imageUrl?: string | null;
}): string {
  const contentObj = {
    textEn: normalizeText(opt.textEn),
    textTa: normalizeText(opt.textTa),
    img: opt.imageHash || normalizeText(opt.imageUrl) || null,
  };
  return createHash('sha256').update(JSON.stringify(contentObj)).digest('hex');
}

interface CachedImageHashEntry {
  hash: string;
  cachedAt: number;
  etag?: string | null;
  lastModified?: string | null;
}

const DEFAULT_IMAGE_HASH_CACHE_MAX_ENTRIES = 1000;
const DEFAULT_IMAGE_HASH_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CACHEABLE_IMAGE_KEY_LENGTH = 8192;

export function isAllowedRemoteImageUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return false;
  }
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host || host === 'localhost' || host.endsWith('.local')) {
    return false;
  }
  if (
    host === '::1' ||
    host.startsWith('fe80:') ||
    host.startsWith('fc') ||
    host.startsWith('fd')
  ) {
    return false;
  }
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    ) {
      return false;
    }
  }
  return true;
}

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
    // Refresh LRU order
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
      // 1. Data URL
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

      // 2. Local uploads path
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

      // 3. HTTP(S) URL (SSRF-guarded + ETag/Last-Modified revalidated)
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        if (!isAllowedRemoteImageUrl(trimmed)) {
          this.logger.warn(`Blocked unsafe remote image URL: ${trimmed}`);
          return null;
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        try {
          const reqHeaders: Record<string, string> = {};
          if (cachedEntry?.etag) {
            reqHeaders['If-None-Match'] = cachedEntry.etag;
          }
          if (cachedEntry?.lastModified) {
            reqHeaders['If-Modified-Since'] = cachedEntry.lastModified;
          }
          const res = await fetch(trimmed, {
            signal: controller.signal,
            cache: 'no-store',
            headers: Object.keys(reqHeaders).length > 0 ? reqHeaders : undefined,
          });
          if (res.status === 304 && cachedEntry) {
            return cachedEntry.hash;
          }
          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const mimeType = res.headers.get('content-type') || undefined;
            const hash = hashImageBytes(Buffer.from(arrayBuffer), mimeType);
            const etag = res.headers.get('etag');
            const lastModified = res.headers.get('last-modified');
            // Only cache mutable remote URLs when the server provides a validator
            if (etag || lastModified) {
              this.setCachedImageHash(trimmed, hash, { etag, lastModified });
            }
            return hash;
          }
        } finally {
          clearTimeout(timeout);
        }
      }
    } catch (err) {
      this.logger.warn(
        `Failed to resolve image hash for ${imageUrl}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return null;
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

    // Process options
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

      const contentObj = {
        textEn: optTextEn,
        textTa: optTextTa,
        img: effectiveOptionImage,
      };

      const contentHash = createHash('sha256')
        .update(JSON.stringify(contentObj))
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

    // Check for duplicate identical options in the same question (ambiguous reordering)
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

    // 1. Level A: Strict Exact Duplicate
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

    // 2. Options Content multiset fingerprint (independent of correct answer)
    // Used to detect answer conflicts (same question & options but different answer)
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

    // 3. Level B: Equivalent Duplicate
    // If ambiguous identical options exist, fallback to exact fingerprint to prevent unsafe auto-skips
    let equivalentFingerprint = contentFingerprint;

    if (type !== 'NUMERICAL' && !hasAmbiguousOptions && options.length > 0) {
      // Sort options deterministically by contentHash
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
