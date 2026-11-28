import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { QuestionDuplicateDetectionService } from '../question-duplicate-detection.service.js';
import {
  persistQuestionRecord,
  type QuestionSavePolicy,
} from '../question-persistence.helper.js';
import { runImportPreflight } from '../question-preflight.helper.js';
import {
  int,
  isUniqueConstraintError,
  obj,
  str,
} from '../question-validation.helper.js';
import type { ImportRowResult } from '../question-bank.service.js';

@Injectable()
export class QuestionImportService {
  private readonly duplicateService: QuestionDuplicateDetectionService;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() duplicateService?: QuestionDuplicateDetectionService,
  ) {
    this.duplicateService =
      duplicateService ?? new QuestionDuplicateDetectionService();
  }

  async importQuestions(
    profileId: string | null,
    body: unknown,
    saveQuestionFn?: (
      profileId: string | null,
      row: unknown,
      policy: QuestionSavePolicy,
    ) => ReturnType<typeof persistQuestionRecord>,
  ) {
    const saveFn =
      saveQuestionFn ??
      ((pid: string | null, rowData: unknown, policy: QuestionSavePolicy) =>
        persistQuestionRecord(this.prisma, pid, rowData, {
          duplicateService: this.duplicateService,
          ...policy,
        }));
    const envelope = obj(body);
    const rows = envelope.rows;
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500)
      throw new BadRequestException('Upload 1 to 500 question rows');
    const results: ImportRowResult[] = [];
    const seenExternalIds = new Set<string>();
    const seenContentFingerprints = new Map<string, number>();
    const seenEquivFingerprints = new Map<string, number>();
    const courseSubjectCache = new Map<string, unknown>();

    const CONCURRENCY = 6;
    for (let i = 0; i < rows.length; i += CONCURRENCY) {
      const slice = rows.slice(i, i + CONCURRENCY);
      await Promise.all(
        slice.map(async (rowItem, sliceIdx) => {
          const index = i + sliceIdx;
          const rowEnvelope = obj(rowItem);
          const rowNumber = int(rowEnvelope.rowNumber, index + 2, 2, 1_000_000);
          const row =
            rowEnvelope.data === undefined ? rowEnvelope : obj(rowEnvelope.data);
          const externalId = str(row.externalId, 'externalId', false, 64);
          const duplicateKey = externalId?.toLocaleLowerCase('en-US');
          if (duplicateKey && seenExternalIds.has(duplicateKey)) {
            results.push({
              row: rowNumber,
              externalId: externalId ?? undefined,
              status: 'skipped',
              duplicateCategory: 'within_excel',
              reason: 'Duplicate external ID in this workbook',
            });
            return;
          }
          if (duplicateKey) seenExternalIds.add(duplicateKey);

          const rawOptions = Array.isArray(row.options) ? row.options : [];
          const fingerprints = this.duplicateService.calculateFingerprints({
            type: str(row.type, 'type', false) || 'SINGLE_CORRECT',
            textEn: str(row.textEn, 'textEn'),
            textTa: str(row.textTa, 'textTa'),
            questionImageUrl: str(row.questionImageUrl, 'questionImageUrl'),
            questionImageHash: str(row.questionImageHash, 'questionImageHash'),
            options: rawOptions as any[],
            numericalAnswer: str(row.numericalAnswer, 'numericalAnswer'),
          });

          if (seenContentFingerprints.has(fingerprints.contentFingerprint)) {
            const firstRow = seenContentFingerprints.get(
              fingerprints.contentFingerprint,
            )!;
            results.push({
              row: rowNumber,
              externalId: externalId ?? undefined,
              status: 'skipped',
              duplicateCategory: 'within_excel',
              duplicateType: 'exact',
              matchedId: firstRow,
              reason: `Duplicate of row ${firstRow} in this workbook`,
            });
            return;
          }
          seenContentFingerprints.set(
            fingerprints.contentFingerprint,
            rowNumber,
          );

          if (
            !fingerprints.hasAmbiguousOptions &&
            seenEquivFingerprints.has(fingerprints.equivalentFingerprint)
          ) {
            const firstRow = seenEquivFingerprints.get(
              fingerprints.equivalentFingerprint,
            )!;
            results.push({
              row: rowNumber,
              externalId: externalId ?? undefined,
              status: 'skipped',
              duplicateCategory: 'within_excel',
              duplicateType: 'equivalent',
              matchedId: firstRow,
              reason: `Duplicate of row ${firstRow} (equivalent match with reordered options)`,
            });
            return;
          }
          if (!fingerprints.hasAmbiguousOptions) {
            seenEquivFingerprints.set(
              fingerprints.equivalentFingerprint,
              rowNumber,
            );
          }

          try {
            const saved = await saveFn(profileId, row, {
              matchExistingContent: true,
              createMissingChapter: true,
              skipReturnDetails: true,
              courseSubjectCache,
              duplicateMode: 'SKIP_DUPLICATES',
              precomputedFingerprints: fingerprints,
            });

            if (saved?.isSkipped) {
              results.push({
                row: rowNumber,
                externalId: saved.externalId || externalId || undefined,
                status: saved.status || 'skipped',
                duplicateCategory: saved.duplicateCategory || 'database',
                duplicateType: saved.duplicateType,
                matchedId: saved.matchedExternalId || saved.matchedQuestionId,
                reason: saved.reason || 'Question already exists',
              });
            } else {
              results.push(
                saved
                  ? {
                      row: rowNumber,
                      externalId: saved.externalId,
                      status: 'imported',
                      reason: saved.importMeta?.createdChapter
                        ? `Imported and created chapter: ${saved.importMeta.createdChapter}`
                        : undefined,
                    }
                  : {
                      row: rowNumber,
                      externalId: externalId ?? undefined,
                      status: 'skipped',
                      reason: 'Question already exists',
                    },
              );
            }
          } catch (error) {
            if (externalId && isUniqueConstraintError(error)) {
              results.push({
                row: rowNumber,
                externalId,
                status: 'skipped',
                reason: 'Question already exists',
              });
              return;
            }
            results.push({
              row: rowNumber,
              externalId: externalId ?? undefined,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Import failed',
            });
          }
        }),
      );
    }
    results.sort((a, b) => a.row - b.row);
    return {
      total: rows.length,
      imported: results.filter((item) => item.status === 'imported').length,
      skipped: results.filter((item) => item.status === 'skipped').length,
      failed: results.filter((item) => item.status === 'failed').length,
      results,
    };
  }

  async backfillFingerprints(batchSize = 100) {
    let processed = 0;
    let updated = 0;
    let unresolved = 0;
    let hasMore = true;

    while (hasMore) {
      const questions = await this.prisma.question.findMany({
        where: { contentFingerprint: null },
        include: { options: { orderBy: { position: 'asc' } } },
        take: batchSize,
      });

      if (!questions || questions.length === 0) break;

      for (const q of questions) {
        processed++;
        const qImgHash = await this.duplicateService.resolveImageHash(
          q.questionImageUrl,
        );
        const optHashes = await Promise.all(
          q.options.map((opt) =>
            this.duplicateService.resolveImageHash(opt.imageUrl),
          ),
        );
        const fps = this.duplicateService.calculateFingerprints(
          {
            type: q.type,
            textEn: q.textEn,
            textTa: q.textTa,
            questionImageUrl: q.questionImageUrl,
            questionImageHash: qImgHash,
            options: q.options.map((opt, i) => ({
              label: opt.label,
              textEn: opt.textEn,
              textTa: opt.textTa,
              imageUrl: opt.imageUrl,
              imageHash: optHashes[i],
              isCorrect: opt.isCorrect,
              position: opt.position,
            })),
            numericalAnswer: q.numericalAnswer,
          },
          { questionImageHash: qImgHash, optionImageHashes: optHashes },
        );

        if (fps.unresolvedImages) unresolved++;

        await this.prisma.question.update({
          where: { id: q.id },
          data: {
            contentFingerprint: fps.contentFingerprint,
            equivalentFingerprint: fps.equivalentFingerprint,
            fingerprintVersion: fps.fingerprintVersion,
          },
        });
        updated++;
      }

      if (questions.length < batchSize) hasMore = false;
    }

    return { processed, updated, unresolved };
  }

  importPreflight(body: unknown) {
    return runImportPreflight(this.prisma, body);
  }
}
