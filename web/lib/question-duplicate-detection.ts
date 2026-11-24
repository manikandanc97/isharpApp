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

export function calculateFingerprints(
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
