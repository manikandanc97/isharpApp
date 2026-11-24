import type { Question } from "./types";

export function normalizeDuplicateText(val?: string | null): string {
  if (!val) return "";
  return String(val)
    .normalize("NFC")
    .replace(/\r\n/g, "\n")
    .replace(/[\t\v\f\r ]+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Computes deterministic canonical keys for exact and equivalent duplicate detection.
 * Questions are duplicates ONLY if:
 * 1. Their contentFingerprint or equivalentFingerprint matches (if available from backend), OR
 * 2. Deep content matches:
 *    - Same subject
 *    - Same question type
 *    - Same question text (En and Ta)
 *    - Same diagram/image
 *    - Same numerical answer (if NUMERICAL)
 *    - Same options (texts, images, and correct answers).
 * Questions with different diagrams, different options, or different answers are NEVER duplicates!
 */
export function getQuestionDuplicateKey(q: Question): {
  exactKey: string;
  equivKey: string;
} {
  const subject = normalizeDuplicateText(q.courseSubject?.subject?.code);
  const type = (q.type || "SINGLE_CORRECT").toUpperCase();
  const textEn = normalizeDuplicateText(q.textEn);
  const textTa = normalizeDuplicateText(q.textTa);
  const qImg = normalizeDuplicateText(q.questionImageUrl);
  const numAns = normalizeDuplicateText(q.numericalAnswer);

  // If question has stored DB fingerprints, prefer them combined with subject
  if (q.contentFingerprint) {
    return {
      exactKey: `${subject}:${q.contentFingerprint}`,
      equivKey: `${subject}:${q.equivalentFingerprint || q.contentFingerprint}`,
    };
  }

  const rawOptions = Array.isArray(q.options) ? q.options : [];
  const options = rawOptions.map((opt, idx) => {
    const optEn = normalizeDuplicateText(opt.textEn);
    const optTa = normalizeDuplicateText(opt.textTa);
    const optImg = normalizeDuplicateText(opt.imageUrl);
    const isCorrect = Boolean(opt.isCorrect);
    const contentSignature = `${optEn}|${optTa}|${optImg}`;
    return {
      pos: idx + 1,
      contentSignature,
      isCorrect,
    };
  });

  const hasContent = Boolean(
    textEn ||
      textTa ||
      qImg ||
      numAns ||
      options.some((o) => o.contentSignature !== "||")
  );
  if (!hasContent) {
    return {
      exactKey: `empty:${q.id}`,
      equivKey: `empty:${q.id}`,
    };
  }

  const exactOptionsPart = options
    .map((o) => `${o.pos}:${o.contentSignature}:${o.isCorrect}`)
    .join(";");

  const exactKey = `${subject}:${type}:${textEn}:${textTa}:${qImg}:${numAns}:[${exactOptionsPart}]`;

  // Sorted options for equivalent check (reordered options with matching correct answer)
  const sortedOptions = [...options].sort((a, b) =>
    a.contentSignature.localeCompare(b.contentSignature)
  );
  const sortedOptionsPart = sortedOptions
    .map((o) => `${o.contentSignature}:${o.isCorrect}`)
    .join(";");

  const equivKey = `${subject}:${type}:${textEn}:${textTa}:${qImg}:${numAns}:[${sortedOptionsPart}]`;

  return { exactKey, equivKey };
}
