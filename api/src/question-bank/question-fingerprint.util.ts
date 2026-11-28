import { createHash } from 'node:crypto';

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

export function isAllowedIpAddress(rawIp: string): boolean {
  const host = rawIp.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host) return false;

  if (
    host === '::' ||
    host === '::1' ||
    host === '0:0:0:0:0:0:0:0' ||
    host === '0:0:0:0:0:0:0:1' ||
    host.startsWith('fe80:') ||
    host.startsWith('fc') ||
    host.startsWith('fd')
  ) {
    return false;
  }

  // Handle IPv4-mapped IPv6 in hex form (::ffff:7f00:1) or dotted form (::ffff:127.0.0.1)
  const mappedHex = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex) {
    const hi = parseInt(mappedHex[1], 16);
    const lo = parseInt(mappedHex[2], 16);
    const ipv4Str = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
    return isAllowedIpAddress(ipv4Str);
  }
  const mappedDotted = host.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mappedDotted) {
    return isAllowedIpAddress(mappedDotted[1]);
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b, c, d] = [
      Number(ipv4[1]),
      Number(ipv4[2]),
      Number(ipv4[3]),
      Number(ipv4[4]),
    ];
    if (a > 255 || b > 255 || c > 255 || d > 255) return false;
    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    ) {
      return false;
    }
  }
  return true;
}

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
  return isAllowedIpAddress(host);
}
