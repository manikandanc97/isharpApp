import { describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../prisma/prisma.service.js';
import { QuestionBankService } from './question-bank.service.js';
import {
  hashImageBytes,
  QuestionDuplicateDetectionService,
} from './question-duplicate-detection.service.js';
import { persistQuestionRecord } from './question-persistence.helper.js';

describe('Question Duplicate Detection Integration & Import Scenarios', () => {
  const dupService = new QuestionDuplicateDetectionService();

  // Scenario 6 & 7: Identical images with different filenames and URLs
  it('Scenario 6 & 7: resolves identical image bytes with different filenames or URLs to equal fingerprints', async () => {
    const rawPngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x01, 0x02, 0x03, 0x04]);
    const hash = hashImageBytes(rawPngBytes, 'image/png');

    const q1 = {
      type: 'SINGLE_CORRECT',
      textEn: 'Look at the diagram:',
      questionImageUrl: 'https://bucket-a.supabase.co/image1.png',
      questionImageHash: hash,
      options: [
        { textEn: 'True', isCorrect: true },
        { textEn: 'False', isCorrect: false },
      ],
    };
    const q2 = {
      type: 'SINGLE_CORRECT',
      textEn: 'Look at the diagram:',
      questionImageUrl: 'https://cdn.example.org/different-name.png',
      questionImageHash: hash,
      options: [
        { textEn: 'True', isCorrect: true },
        { textEn: 'False', isCorrect: false },
      ],
    };

    const fp1 = dupService.calculateFingerprints(q1);
    const fp2 = dupService.calculateFingerprints(q2);

    expect(fp1.contentFingerprint).toBe(fp2.contentFingerprint);
  });

  // Scenario 8: Different SVG diagrams with identical PNG placeholders
  it('Scenario 8: distinguishes different SVG diagrams even if their raster placeholders are identical', () => {
    const svgA = '<svg width="50" height="50"><rect x="0" y="0" width="50" height="50"/></svg>';
    const svgB = '<svg width="50" height="50"><circle cx="25" cy="25" r="20"/></svg>';

    const hashA = hashImageBytes(Buffer.from(svgA), 'image/svg+xml');
    const hashB = hashImageBytes(Buffer.from(svgB), 'image/svg+xml');

    expect(hashA).not.toBe(hashB);

    const fpA = dupService.calculateFingerprints({
      type: 'SINGLE_CORRECT',
      textEn: 'Shape question',
      questionImageHash: hashA,
      options: [{ textEn: 'A', isCorrect: true }, { textEn: 'B', isCorrect: false }],
    });
    const fpB = dupService.calculateFingerprints({
      type: 'SINGLE_CORRECT',
      textEn: 'Shape question',
      questionImageHash: hashB,
      options: [{ textEn: 'A', isCorrect: true }, { textEn: 'B', isCorrect: false }],
    });

    expect(fpA.contentFingerprint).not.toBe(fpB.contentFingerprint);
  });

  // Scenario 9: Same question repeated within one Excel file
  it('Scenario 9: skips identical questions repeated within one Excel import, preserving the first occurrence', async () => {
    const mockPrisma = {
      courseSubject: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'cs-1',
          chapters: [{ id: 'ch-1', title: 'Kinematics' }],
        }),
      },
      question: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockImplementation((args) => ({
          id: 'q-new-1',
          externalId: args.data.externalId,
        })),
        findUnique: vi.fn().mockImplementation(() => ({
          id: 'q-new-1',
          externalId: 'PHY-001',
          options: [],
        })),
      },
      questionOption: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      $transaction: vi.fn(async (cb) => cb(mockPrisma)),
    };

    const service = new QuestionBankService(
      mockPrisma as unknown as PrismaService,
      new ConfigService(),
      dupService,
    );

    const q = {
      courseCode: 'NEET',
      subjectCode: 'PHYSICS',
      type: 'SINGLE_CORRECT',
      textEn: 'What is the SI unit of force?',
      options: [
        { textEn: 'Newton', isCorrect: true },
        { textEn: 'Joule', isCorrect: false },
      ],
      solutionEn: 'Force unit is Newton',
    };

    const result = await service.importQuestions('admin-1', {
      rows: [
        { rowNumber: 2, data: { ...q, externalId: 'PHY-001' } },
        { rowNumber: 4, data: { ...q, externalId: 'PHY-002' } }, // same content, different externalId
      ],
    });

    expect(result.total).toBe(2);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.results[0].status).toBe('imported');
    expect(result.results[0].row).toBe(2);
    expect(result.results[1].status).toBe('skipped');
    expect(result.results[1].row).toBe(4);
    expect(result.results[1].reason).toContain('Duplicate of row 2');
  });

  // Scenario 10: Same question already existing in the database
  it('Scenario 10: skips a question already existing in the database and reports the matched database ID', async () => {
    const qContent = {
      type: 'SINGLE_CORRECT',
      textEn: 'What is the valency of Carbon?',
      options: [
        { textEn: '4', isCorrect: true },
        { textEn: '2', isCorrect: false },
      ],
    };
    const fps = dupService.calculateFingerprints(qContent);

    const mockPrisma = {
      courseSubject: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'cs-chem',
          chapters: [{ id: 'ch-chem-1', title: 'Carbon' }],
        }),
      },
      question: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'db-existing-uuid-99',
            externalId: 'CHEM-EXISTING-1',
            contentFingerprint: fps.contentFingerprint,
            equivalentFingerprint: fps.equivalentFingerprint,
          },
        ]),
        findFirst: vi.fn().mockResolvedValue({
          id: 'db-existing-uuid-99',
          externalId: 'CHEM-EXISTING-1',
        }),
      },
      $transaction: vi.fn(async (cb) => cb(mockPrisma)),
    };

    const service = new QuestionBankService(
      mockPrisma as unknown as PrismaService,
      new ConfigService(),
      dupService,
    );

    const result = await service.importQuestions('admin-1', {
      rows: [
        {
          rowNumber: 5,
          data: {
            ...qContent,
            subjectCode: 'CHEMISTRY',
            solutionEn: 'Carbon has valency 4',
            externalId: 'NEW-ROW-ID',
          },
        },
      ],
    });

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.results[0].status).toBe('skipped');
    expect(result.results[0].matchedId).toBe('CHEM-EXISTING-1');
    expect(result.results[0].reason).toContain('Duplicate of database question');
  });

  // Scenario 19: Same external ID but different question content is flagged as a conflict
  it('Scenario 19: flags external ID collision with different question content as a conflict', async () => {
    const mockPrisma = {
      courseSubject: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'cs-1',
          chapters: [{ id: 'ch-1', title: 'General' }],
        }),
      },
      question: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'db-uuid-conflict',
            externalId: 'TAKEN-ID-1',
            contentFingerprint: 'different-fingerprint-aaa',
            equivalentFingerprint: 'different-fingerprint-aaa',
          },
        ]),
        findFirst: vi.fn().mockImplementation((args) => {
          if (args.where?.externalId) {
            return { id: 'db-uuid-conflict', externalId: 'TAKEN-ID-1' };
          }
          return null;
        }),
      },
      $transaction: vi.fn(async (cb) => cb(mockPrisma)),
    };

    const service = new QuestionBankService(
      mockPrisma as unknown as PrismaService,
      new ConfigService(),
      dupService,
    );

    const result = await service.importQuestions('admin-1', {
      rows: [
        {
          rowNumber: 3,
          data: {
            externalId: 'TAKEN-ID-1',
            subjectCode: 'PHYSICS',
            type: 'SINGLE_CORRECT',
            textEn: 'Brand new completely different question text',
            options: [
              { textEn: 'Alpha', isCorrect: true },
              { textEn: 'Beta', isCorrect: false },
            ],
            solutionEn: 'Sol',
          },
        },
      ],
    });

    expect(result.imported).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.results[0].status).toBe('failed');
    expect(result.results[0].duplicateType).toBe('id_conflict');
    expect(result.results[0].reason).toContain('Conflict');
  });

  // Scenario 20: Concurrency protection serializes identical question inserts
  it('Scenario 20: concurrency protection safely skips duplicate when two uploads run concurrently', async () => {
    let callCount = 0;
    const mockPrisma = {
      courseSubject: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'cs-1',
          chapters: [],
        }),
      },
      question: {
        findFirst: vi.fn().mockImplementation((args) => {
          if (args.where?.contentFingerprint) {
            callCount++;
            // First concurrent check finds nothing; second check after lock finds the inserted record
            if (callCount > 1) {
              return { id: 'q-locked-1', externalId: 'CONCUR-1' };
            }
          }
          return null;
        }),
        create: vi.fn().mockResolvedValue({ id: 'q-locked-1', externalId: 'CONCUR-1' }),
        findUnique: vi.fn().mockResolvedValue({ id: 'q-locked-1', externalId: 'CONCUR-1', options: [] }),
      },
      questionOption: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      $executeRawUnsafe: vi.fn().mockResolvedValue(1),
      $transaction: vi.fn(async (cb) => cb(mockPrisma)),
    };

    const body = {
      subjectCode: 'PHYSICS',
      type: 'SINGLE_CORRECT',
      textEn: 'Concurrent question test',
      options: [
        { textEn: 'A', isCorrect: true },
        { textEn: 'B', isCorrect: false },
      ],
      solutionEn: 'Sol',
    };

    // First call inserts
    const res1 = await persistQuestionRecord(mockPrisma as any, 'user-1', body, { duplicateMode: 'SKIP_DUPLICATES' });
    expect(res1.id).toBe('q-locked-1');
    expect(res1.isSkipped).toBeFalsy();

    // Second concurrent call skips
    const res2 = await persistQuestionRecord(mockPrisma as any, 'user-2', body, { duplicateMode: 'SKIP_DUPLICATES' });
    expect(res2.isSkipped).toBe(true);
    expect(res2.status).toBe('skipped');
    expect(res2.reason).toContain('Duplicate of database question');
  });

  // Scenario 21: Re-importing the same Excel twice results in all questions skipped on 2nd import
  it('Scenario 21: re-importing the same questions twice results in 0 inserts on the second import', async () => {
    const q1 = {
      type: 'SINGLE_CORRECT',
      textEn: 'Question X',
      options: [{ textEn: '1', isCorrect: true }, { textEn: '2', isCorrect: false }],
    };
    const fp1 = dupService.calculateFingerprints(q1);

    let databaseHasRecords = false;

    const mockPrisma = {
      courseSubject: {
        findFirst: vi.fn().mockResolvedValue({ id: 'cs-1', chapters: [] }),
      },
      question: {
        findMany: vi.fn().mockImplementation(() => {
          if (databaseHasRecords) {
            return [
              {
                id: 'db-q1',
                externalId: 'EXT-Q1',
                contentFingerprint: fp1.contentFingerprint,
                equivalentFingerprint: fp1.equivalentFingerprint,
              },
            ];
          }
          return [];
        }),
        findFirst: vi.fn().mockImplementation(() => {
          if (databaseHasRecords) {
            return { id: 'db-q1', externalId: 'EXT-Q1' };
          }
          return null;
        }),
        create: vi.fn().mockResolvedValue({ id: 'db-q1', externalId: 'EXT-Q1' }),
        findUnique: vi.fn().mockResolvedValue({ id: 'db-q1', externalId: 'EXT-Q1', options: [] }),
      },
      questionOption: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      $transaction: vi.fn(async (cb) => cb(mockPrisma)),
    };

    const service = new QuestionBankService(mockPrisma as any, new ConfigService(), dupService);

    // First import: inserts question
    const run1 = await service.importQuestions('admin-1', {
      rows: [{ rowNumber: 2, data: { ...q1, subjectCode: 'PHYSICS', solutionEn: 'Sol', externalId: 'EXT-Q1' } }],
    });
    expect(run1.imported).toBe(1);
    expect(run1.skipped).toBe(0);

    // Simulate DB state after 1st import
    databaseHasRecords = true;

    // Second import: skips question
    const run2 = await service.importQuestions('admin-1', {
      rows: [{ rowNumber: 2, data: { ...q1, subjectCode: 'PHYSICS', solutionEn: 'Sol', externalId: 'EXT-Q1' } }],
    });
    expect(run2.imported).toBe(0);
    expect(run2.skipped).toBe(1);
    expect(run2.results[0].reason).toContain('Duplicate of database question');
  });

  // Scenario 22: Importing two files with overlapping questions
  it('Scenario 22: importing two files with overlapping questions only inserts the non-overlapping ones', async () => {
    const qShared = {
      type: 'SINGLE_CORRECT',
      textEn: 'Shared question',
      options: [{ textEn: 'Yes', isCorrect: true }, { textEn: 'No', isCorrect: false }],
    };
    const qUnique = {
      type: 'SINGLE_CORRECT',
      textEn: 'Unique second file question',
      options: [{ textEn: 'A', isCorrect: true }, { textEn: 'B', isCorrect: false }],
    };
    const fpShared = dupService.calculateFingerprints(qShared);

    const mockPrisma = {
      courseSubject: {
        findFirst: vi.fn().mockResolvedValue({ id: 'cs-1', chapters: [] }),
      },
      question: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'db-shared-id',
            externalId: 'EXT-SHARED',
            contentFingerprint: fpShared.contentFingerprint,
            equivalentFingerprint: fpShared.equivalentFingerprint,
          },
        ]),
        findFirst: vi.fn().mockImplementation((args) => {
          if (args.where?.contentFingerprint === fpShared.contentFingerprint) {
            return { id: 'db-shared-id', externalId: 'EXT-SHARED' };
          }
          return null;
        }),
        create: vi.fn().mockResolvedValue({ id: 'db-unique-id', externalId: 'EXT-UNIQUE' }),
        findUnique: vi.fn().mockResolvedValue({ id: 'db-unique-id', externalId: 'EXT-UNIQUE', options: [] }),
      },
      questionOption: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      $transaction: vi.fn(async (cb) => cb(mockPrisma)),
    };

    const service = new QuestionBankService(mockPrisma as any, new ConfigService(), dupService);

    const result = await service.importQuestions('admin-1', {
      rows: [
        { rowNumber: 2, data: { ...qShared, subjectCode: 'PHYSICS', solutionEn: 'Sol', externalId: 'EXT-SHARED' } },
        { rowNumber: 3, data: { ...qUnique, subjectCode: 'PHYSICS', solutionEn: 'Sol', externalId: 'EXT-UNIQUE' } },
      ],
    });

    expect(result.total).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.imported).toBe(1);
    expect(result.results[0].status).toBe('skipped');
    expect(result.results[1].status).toBe('imported');
  });

  // Scenario 23: Existing records with missing image hashes
  it('Scenario 23: handles questions with missing or remote image hashes gracefully during comparison', async () => {
    const qWithRemote = {
      type: 'SINGLE_CORRECT',
      textEn: 'Diagram test with remote image',
      questionImageUrl: 'https://images.example.com/missing-or-remote.png',
      options: [{ textEn: 'Yes', isCorrect: true }, { textEn: 'No', isCorrect: false }],
    };
    const fps = dupService.calculateFingerprints(qWithRemote);
    expect(fps.unresolvedImages).toBe(true);
    // Fingerprint is still deterministically calculated
    expect(fps.contentFingerprint).toBeTruthy();
  });

  // Scenario 24: Fingerprint regeneration after question editing
  it('Scenario 24: regenerates fingerprints transactionally when question is edited', async () => {
    let updatedData: any = null;
    const mockPrisma = {
      courseSubject: {
        findFirst: vi.fn().mockResolvedValue({ id: 'cs-1', chapters: [] }),
      },
      question: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'existing-q-uuid',
          externalId: 'EXT-1',
          options: [],
        }),
        update: vi.fn().mockImplementation((args) => {
          updatedData = args.data;
          return { id: 'existing-q-uuid', externalId: 'EXT-1' };
        }),
      },
      questionOption: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      $transaction: vi.fn(async (cb) => cb(mockPrisma)),
    };

    const editedBody = {
      id: 'existing-q-uuid',
      externalId: 'EXT-1',
      subjectCode: 'PHYSICS',
      type: 'SINGLE_CORRECT',
      textEn: 'Updated question text after admin edit',
      options: [
        { textEn: 'New option A', isCorrect: true },
        { textEn: 'New option B', isCorrect: false },
      ],
      solutionEn: 'New solution',
    };

    await persistQuestionRecord(mockPrisma as any, 'admin-1', editedBody, {
      duplicateMode: 'UPDATE_EXISTING',
    });

    expect(updatedData).toBeTruthy();
    expect(updatedData.contentFingerprint).toBeTruthy();
    expect(updatedData.textEn).toBe('Updated question text after admin edit');
  });

  // Scenario 25: Existing duplicate records during fingerprint backfill
  it('Scenario 25: backfills fingerprints safely without deleting or corrupting existing question records', async () => {
    const existingQuestions = [
      {
        id: 'q-1',
        externalId: 'PHY-001',
        type: 'SINGLE_CORRECT',
        textEn: 'Question one',
        textTa: null,
        questionImageUrl: null,
        numericalAnswer: null,
        options: [
          { label: 'A', textEn: 'Opt 1', textTa: null, imageUrl: null, isCorrect: true, position: 1 },
          { label: 'B', textEn: 'Opt 2', textTa: null, imageUrl: null, isCorrect: false, position: 2 },
        ],
      },
      {
        id: 'q-2',
        externalId: 'PHY-002',
        type: 'SINGLE_CORRECT',
        textEn: 'Question one', // duplicate content
        textTa: null,
        questionImageUrl: null,
        numericalAnswer: null,
        options: [
          { label: 'A', textEn: 'Opt 1', textTa: null, imageUrl: null, isCorrect: true, position: 1 },
          { label: 'B', textEn: 'Opt 2', textTa: null, imageUrl: null, isCorrect: false, position: 2 },
        ],
      },
    ];

    const updates: Array<{ id: string; data: any }> = [];

    const mockPrisma = {
      question: {
        findMany: vi.fn().mockImplementation((args) => {
          if (args.where?.contentFingerprint === null) {
            return existingQuestions;
          }
          return [];
        }),
        update: vi.fn().mockImplementation((args) => {
          updates.push(args);
          return args;
        }),
      },
    };

    const service = new QuestionBankService(mockPrisma as any, new ConfigService(), dupService);
    const backfillResult = await service.backfillFingerprints(10);

    expect(backfillResult.processed).toBe(2);
    expect(backfillResult.updated).toBe(2);
    expect(updates).toHaveLength(2);
    // Both existing records received fingerprints safely without deletion
    expect(updates[0].data.contentFingerprint).toBe(updates[1].data.contentFingerprint);
  });
});
