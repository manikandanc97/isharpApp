import type { Prisma } from '../generated/prisma/client.js';
import {
  calculateOptionContentHash,
  normalizeText,
  type QuestionFingerprints,
} from './question-fingerprint.util.js';

export interface DatabaseDuplicateCheckParams {
  courseSubjectId: string;
  type: string;
  textEn: string | null;
  textTa: string | null;
  questionImageUrl: string | null;
  questionImageHash: string | null;
  externalId: string;
  options: Array<{
    textEn: string | null;
    textTa: string | null;
    imageUrl: string | null;
  }>;
  optionImageHashes: Array<string | null>;
  fingerprints: QuestionFingerprints;
}

export async function checkDatabaseQuestionDuplicates(
  tx: Prisma.TransactionClient,
  params: DatabaseDuplicateCheckParams,
) {
  const {
    courseSubjectId,
    type,
    textEn,
    textTa,
    questionImageUrl,
    questionImageHash,
    externalId,
    options,
    optionImageHashes,
    fingerprints,
  } = params;

  const exactMatch = await tx.question.findFirst({
    where: { contentFingerprint: fingerprints.contentFingerprint },
  });
  if (exactMatch) {
    return {
      isSkipped: true as const,
      id: exactMatch.id,
      externalId: exactMatch.externalId,
      status: 'skipped' as const,
      duplicateCategory: 'database' as const,
      duplicateType: 'exact' as const,
      matchedQuestionId: exactMatch.id,
      matchedExternalId: exactMatch.externalId,
      reason: `Duplicate of database question ${exactMatch.externalId || exactMatch.id} (exact match)`,
    };
  }

  if (
    !fingerprints.hasAmbiguousOptions &&
    fingerprints.equivalentFingerprint
  ) {
    const equivMatch = await tx.question.findFirst({
      where: { equivalentFingerprint: fingerprints.equivalentFingerprint },
    });
    if (equivMatch) {
      return {
        isSkipped: true as const,
        id: equivMatch.id,
        externalId: equivMatch.externalId,
        status: 'skipped' as const,
        duplicateCategory: 'database' as const,
        duplicateType: 'equivalent' as const,
        matchedQuestionId: equivMatch.id,
        matchedExternalId: equivMatch.externalId,
        reason: `Duplicate of database question ${equivMatch.externalId || equivMatch.id} (equivalent match)`,
      };
    }
  }

  if ((textEn || textTa) && typeof tx.question?.findMany === 'function') {
    const potentialAnswerConflicts = await tx.question.findMany({
      where: {
        courseSubjectId,
        type: type as never,
        textEn: textEn ? { equals: textEn, mode: 'insensitive' } : null,
        textTa: textTa ? { equals: textTa, mode: 'insensitive' } : null,
      },
      include: { options: true },
    });
    for (const candidate of potentialAnswerConflicts) {
      if (!Array.isArray(candidate?.options) || candidate.options.length === 0) {
        continue;
      }
      const currentDiagram = questionImageHash || normalizeText(questionImageUrl);
      const candidateDiagram =
        (candidate as Record<string, unknown>).questionImageHash ||
        normalizeText(candidate.questionImageUrl);
      if (
        Boolean(currentDiagram || candidateDiagram) &&
        currentDiagram !== candidateDiagram
      ) {
        continue;
      }
      const currentSorted = options
        .map((o, idx) =>
          calculateOptionContentHash({
            textEn: normalizeText(o.textEn),
            textTa: normalizeText(o.textTa),
            imageHash: optionImageHashes[idx],
            imageUrl: o.imageUrl,
          }),
        )
        .sort();
      const candidateSorted = candidate.options
        .map((o) =>
          calculateOptionContentHash({
            textEn: normalizeText(o.textEn),
            textTa: normalizeText(o.textTa),
            imageHash:
              ((o as Record<string, unknown>).imageHash as string | null) || null,
            imageUrl: o.imageUrl || null,
          }),
        )
        .sort();
      if (
        currentSorted.length === candidateSorted.length &&
        JSON.stringify(currentSorted) === JSON.stringify(candidateSorted)
      ) {
        return {
          isSkipped: true as const,
          id: candidate.id,
          externalId: candidate.externalId,
          status: 'failed' as const,
          duplicateCategory: 'database' as const,
          duplicateType: 'answer_conflict' as const,
          matchedQuestionId: candidate.id,
          matchedExternalId: candidate.externalId,
          reason: `Conflict: Answer conflict with existing question ${candidate.externalId || candidate.id}`,
        };
      }
    }
  }

  const externalMatch = await tx.question.findFirst({
    where: { externalId: { equals: externalId, mode: 'insensitive' } },
  });
  if (externalMatch) {
    return {
      isSkipped: true as const,
      id: externalMatch.id,
      externalId: externalMatch.externalId,
      status: 'failed' as const,
      duplicateCategory: 'database' as const,
      duplicateType: 'id_conflict' as const,
      matchedQuestionId: externalMatch.id,
      matchedExternalId: externalMatch.externalId,
      reason: `Conflict: External ID "${externalId}" already exists with different question content`,
    };
  }

  return null;
}

export async function resolveOrCreateChapterId(
  tx: Prisma.TransactionClient,
  courseSubject: { id: string; chapters: Array<{ id: string; title: string }> },
  chapterTitle: string | null,
  initialChapterId: string | null,
  cacheChapters?: boolean,
): Promise<{ chapterId: string | null; createdChapter: string | null }> {
  if (!chapterTitle || initialChapterId) {
    return { chapterId: initialChapterId, createdChapter: null };
  }

  const concurrentChapter = await tx.chapter.findFirst({
    where: {
      courseSubjectId: courseSubject.id,
      title: { equals: chapterTitle, mode: 'insensitive' },
    },
  });
  if (concurrentChapter) {
    return { chapterId: concurrentChapter.id, createdChapter: null };
  }

  const highestPosition = await tx.chapter.aggregate({
    where: { courseSubjectId: courseSubject.id },
    _max: { position: true },
  });
  const created = await tx.chapter.create({
    data: {
      courseSubjectId: courseSubject.id,
      title: chapterTitle,
      position: (highestPosition._max.position ?? 0) + 1,
    },
  });
  if (cacheChapters) {
    courseSubject.chapters.push(created as never);
  }
  return { chapterId: created.id, createdChapter: created.title };
}
