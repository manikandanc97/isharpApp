import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';

type Data = Record<string, unknown>;
const TYPES = ['SINGLE_CORRECT', 'MULTIPLE_CORRECT', 'NUMERICAL'] as const;
const LANGUAGES = ['ENGLISH', 'TAMIL', 'BILINGUAL'] as const;
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;
const NEET_SUBJECTS = ['PHYSICS', 'CHEMISTRY', 'BIOLOGY'];
function obj(value: unknown): Data {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new BadRequestException('Invalid request body');
  return value as Data;
}
function str(value: unknown, name: string, required = false, max = 20_000) {
  const result = typeof value === 'string' ? value.trim() : '';
  if (required && !result) throw new BadRequestException(`${name} is required`);
  if (result.length > max) throw new BadRequestException(`${name} is too long`);
  return result || null;
}
function enumValue<T extends readonly string[]>(
  value: unknown,
  values: T,
  fallback: T[number],
): T[number] {
  const result =
    typeof value === 'string' ? value.trim().toUpperCase() : fallback;
  if (!values.includes(result as T[number]))
    throw new BadRequestException(`Invalid value: ${result}`);
  return result as T[number];
}
function int(value: unknown, fallback: number, min: number, max: number) {
  const result =
    value === undefined || value === null || value === ''
      ? fallback
      : Number(value);
  if (!Number.isInteger(result) || result < min || result > max)
    throw new BadRequestException(`Number must be between ${min} and ${max}`);
  return result;
}
function httpUrl(value: unknown, name: string) {
  const result = str(value, name, false, 2_000);
  if (!result) return null;
  try {
    if (!['http:', 'https:'].includes(new URL(result).protocol))
      throw new Error();
  } catch {
    throw new BadRequestException(`${name} must be an HTTP(S) URL`);
  }
  return result;
}
function isUniqueConstraintError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  return 'code' in error && error.code === 'P2002';
}
function isTransactionConflict(error: unknown) {
  if (!error || typeof error !== 'object' || !('code' in error)) return false;
  return error.code === 'P2034';
}

@Injectable()
export class QuestionBankService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  listQuestions(query?: string) {
    const q = query?.trim().slice(0, 100);
    return this.prisma.question.findMany({
      where: q
        ? {
            OR: [
              { externalId: { contains: q, mode: 'insensitive' } },
              { textEn: { contains: q, mode: 'insensitive' } },
              { textTa: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        options: { orderBy: { position: 'asc' } },
        chapter: true,
        courseSubject: { include: { course: true, subject: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 250,
    });
  }

  async saveQuestion(
    profileId: string | null,
    body: unknown,
    savePolicy: {
      skipExisting?: boolean;
      createMissingChapter?: boolean;
    } = {},
  ) {
    if (!profileId)
      throw new BadRequestException('Administrator profile is not linked');
    const input = obj(body);
    const externalId = str(input.externalId, 'externalId', true, 64)!;
    const courseCode = str(input.courseCode, 'courseCode', true, 50)!;
    const subjectCode = str(input.subjectCode, 'subjectCode', true, 50)!;
    if (!NEET_SUBJECTS.includes(subjectCode.toUpperCase()))
      throw new BadRequestException(
        'subjectCode must be PHYSICS, CHEMISTRY or BIOLOGY',
      );
    const type = enumValue(input.type, TYPES, 'SINGLE_CORRECT');
    const language = enumValue(input.language, LANGUAGES, 'BILINGUAL');
    const difficulty = enumValue(input.difficulty, DIFFICULTIES, 'MEDIUM');
    const textEn = str(input.textEn, 'textEn');
    const textTa = str(input.textTa, 'textTa');
    const questionImageUrl = httpUrl(
      input.questionImageUrl,
      'questionImageUrl',
    );
    if (!textEn && !textTa && !questionImageUrl)
      throw new BadRequestException('Question text or image is required');
    const solutionEn = str(input.solutionEn, 'solutionEn');
    const solutionTa = str(input.solutionTa, 'solutionTa');
    const solutionImageUrl = httpUrl(
      input.solutionImageUrl,
      'solutionImageUrl',
    );
    if (!solutionEn && !solutionTa && !solutionImageUrl)
      throw new BadRequestException('Solution text or image is required');
    const courseSubject = await this.prisma.courseSubject.findFirst({
      where: {
        course: { code: { equals: courseCode, mode: 'insensitive' } },
        subject: { code: { equals: subjectCode, mode: 'insensitive' } },
      },
      include: { chapters: true },
    });
    if (!courseSubject)
      throw new BadRequestException(
        `Course/subject not found: ${courseCode}/${subjectCode}`,
      );
    const chapterTitle = str(input.chapterTitle, 'chapterTitle', false, 200);
    const chapter = chapterTitle
      ? courseSubject.chapters.find(
          (item) => item.title.toLowerCase() === chapterTitle.toLowerCase(),
        )
      : undefined;
    if (chapterTitle && !chapter && !savePolicy.createMissingChapter)
      throw new BadRequestException(`Chapter not found: ${chapterTitle}`);
    const options = (Array.isArray(input.options) ? input.options : []).map(
      (value, index) => {
        const option = obj(value);
        const label = str(
          option.label,
          `options[${index}].label`,
          true,
          8,
        )!.toUpperCase();
        const optionTextEn = str(option.textEn, `${label} textEn`);
        const optionTextTa = str(option.textTa, `${label} textTa`);
        const imageUrl = httpUrl(option.imageUrl, `${label} imageUrl`);
        if (!optionTextEn && !optionTextTa && !imageUrl)
          throw new BadRequestException(
            `Option ${label} needs text or an image`,
          );
        return {
          label,
          textEn: optionTextEn,
          textTa: optionTextTa,
          imageUrl,
          isCorrect: option.isCorrect === true,
          position: index + 1,
        };
      },
    );
    const numericalAnswer = str(
      input.numericalAnswer,
      'numericalAnswer',
      false,
      100,
    );
    if (type === 'NUMERICAL' && !numericalAnswer)
      throw new BadRequestException('numericalAnswer is required');
    if (type !== 'NUMERICAL') {
      if (options.length < 2 || options.length > 6)
        throw new BadRequestException('MCQ questions require 2 to 6 options');
      const correct = options.filter((option) => option.isCorrect).length;
      if (type === 'SINGLE_CORRECT' && correct !== 1)
        throw new BadRequestException(
          'Single-correct question requires exactly one correct option',
        );
      if (type === 'MULTIPLE_CORRECT' && correct < 1)
        throw new BadRequestException(
          'Multiple-correct question requires at least one correct option',
        );
    }
    const data = {
      courseSubjectId: courseSubject.id,
      type,
      language,
      difficulty,
      textEn,
      textTa,
      questionImageUrl,
      solutionEn,
      solutionTa,
      solutionImageUrl,
      numericalAnswer: type === 'NUMERICAL' ? numericalAnswer : null,
      correctMarks: int(input.correctMarks, 4, 0, 20),
      negativeMarks: int(input.negativeMarks, 1, 0, 20),
      source: str(input.source, 'source', false, 200),
      isActive: input.isActive !== false,
    };
    const persist = () =>
      this.prisma.$transaction(
        async (tx) => {
          const existing = await tx.question.findFirst({
            where: { externalId: { equals: externalId, mode: 'insensitive' } },
          });
          if (existing && savePolicy.skipExisting) return null;

          let chapterId = chapter?.id ?? null;
          let createdChapter: string | null = null;
          if (chapterTitle && !chapterId) {
            const concurrentChapter = await tx.chapter.findFirst({
              where: {
                courseSubjectId: courseSubject.id,
                title: { equals: chapterTitle, mode: 'insensitive' },
              },
            });
            if (concurrentChapter) {
              chapterId = concurrentChapter.id;
            } else {
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
              chapterId = created.id;
              createdChapter = created.title;
            }
          }

          const questionData = { ...data, chapterId };
          const question = existing
            ? await tx.question.update({
                where: { id: existing.id },
                data: questionData,
              })
            : await tx.question.create({
                data: {
                  externalId,
                  createdById: profileId,
                  ...questionData,
                },
              });
          await tx.questionOption.deleteMany({
            where: { questionId: question.id },
          });
          if (type !== 'NUMERICAL')
            await tx.questionOption.createMany({
              data: options.map((option) => ({
                questionId: question.id,
                ...option,
              })),
            });
          const saved = await tx.question.findUnique({
            where: { id: question.id },
            include: { options: { orderBy: { position: 'asc' } } },
          });
          if (!saved) throw new Error('Question could not be read after save');
          return {
            ...saved,
            importMeta: { createdChapter },
          };
        },
        { isolationLevel: 'Serializable' },
      );

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await persist();
      } catch (error) {
        const chapterRace =
          Boolean(chapterTitle) &&
          savePolicy.createMissingChapter &&
          isUniqueConstraintError(error);
        if (attempt < 2 && (isTransactionConflict(error) || chapterRace))
          continue;
        throw error;
      }
    }
    throw new Error('Question save could not be completed');
  }

  async importQuestions(profileId: string | null, body: unknown) {
    const rows = obj(body).rows;
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500)
      throw new BadRequestException('Upload 1 to 500 question rows');
    const results: {
      row: number;
      externalId?: string;
      status: 'imported' | 'skipped' | 'failed';
      reason?: string;
      error?: string;
    }[] = [];
    const seen = new Set<string>();
    for (let index = 0; index < rows.length; index++) {
      const envelope = obj(rows[index]);
      const rowNumber = int(envelope.rowNumber, index + 2, 2, 1_000_000);
      const row = envelope.data === undefined ? envelope : obj(envelope.data);
      const externalId = str(row.externalId, 'externalId', false, 64);
      const duplicateKey = externalId?.toLocaleLowerCase('en-US');
      if (duplicateKey && seen.has(duplicateKey)) {
        results.push({
          row: rowNumber,
          externalId: externalId ?? undefined,
          status: 'skipped',
          reason: 'Duplicate external ID in this workbook',
        });
        continue;
      }
      if (duplicateKey) seen.add(duplicateKey);
      try {
        const saved = await this.saveQuestion(profileId, row, {
          skipExisting: true,
          createMissingChapter: true,
        });
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
      } catch (error) {
        if (externalId && isUniqueConstraintError(error)) {
          results.push({
            row: rowNumber,
            externalId,
            status: 'skipped',
            reason: 'Question already exists',
          });
          continue;
        }
        results.push({
          row: rowNumber,
          externalId: externalId ?? undefined,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Import failed',
        });
      }
    }
    return {
      total: rows.length,
      imported: results.filter((item) => item.status === 'imported').length,
      skipped: results.filter((item) => item.status === 'skipped').length,
      failed: results.filter((item) => item.status === 'failed').length,
      results,
    };
  }

  async importPreflight(body: unknown) {
    const values = obj(body).externalIds;
    if (!Array.isArray(values) || values.length > 500)
      throw new BadRequestException('externalIds must contain up to 500 items');
    const externalIds = values
      .map((value) => str(value, 'externalId', false, 64))
      .filter((value): value is string => Boolean(value));
    const unique = [
      ...new Map(
        externalIds.map((value) => [value.toLocaleLowerCase('en-US'), value]),
      ).values(),
    ];
    if (!unique.length) return { existingExternalIds: [] };
    const existing = await this.prisma.question.findMany({
      where: {
        OR: unique.map((externalId) => ({
          externalId: { equals: externalId, mode: 'insensitive' as const },
        })),
      },
      select: { externalId: true },
    });
    return { existingExternalIds: existing.map((item) => item.externalId) };
  }
  async deleteQuestion(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      select: {
        id: true,
        externalId: true,
        _count: { select: { mockTests: true } },
      },
    });
    if (!question) throw new NotFoundException('Question not found');
    if (question._count.mockTests > 0)
      throw new BadRequestException(
        'Remove this question from mock tests before deleting it',
      );
    await this.prisma.question.delete({ where: { id } });
    return { id, externalId: question.externalId, deleted: true };
  }

  listMockTests() {
    return this.prisma.mockTest.findMany({
      include: { _count: { select: { questions: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }
  async createMockTest(profileId: string | null, body: unknown) {
    if (!profileId)
      throw new BadRequestException('Administrator profile is not linked');
    const input = obj(body);
    return this.prisma.mockTest.create({
      data: {
        code: str(input.code, 'code', true, 64)!,
        title: str(input.title, 'title', true, 200)!,
        description: str(input.description, 'description'),
        durationMinutes: int(input.durationMinutes, 180, 1, 600),
        totalMarks: int(input.totalMarks, 720, 1, 2000),
        createdById: profileId,
      },
    });
  }
  async setMockTestQuestions(id: string, body: unknown) {
    const values = obj(body).questions;
    if (!Array.isArray(values) || values.length > 200)
      throw new BadRequestException(
        'questions must be an array of up to 200 items',
      );
    const questionIds = values.map((value) =>
      str(obj(value).questionId, 'questionId', true, 64)!,
    );
    if (new Set(questionIds).size !== questionIds.length)
      throw new BadRequestException('Duplicate questions are not allowed');
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds }, isActive: true },
    });
    if (questions.length !== questionIds.length)
      throw new BadRequestException('One or more questions are invalid');
    if (!(await this.prisma.mockTest.findUnique({ where: { id } })))
      throw new NotFoundException('Mock test not found');
    const byId = new Map(questions.map((question) => [question.id, question]));
    await this.prisma.$transaction(async (tx) => {
      await tx.mockTestQuestion.deleteMany({ where: { mockTestId: id } });
      if (questionIds.length)
        await tx.mockTestQuestion.createMany({
          data: questionIds.map((questionId, index) => {
            const customSection = obj(values[index]).section;
            return {
              mockTestId: id,
              questionId,
              position: index + 1,
              section:
                typeof customSection === 'string' && customSection.trim()
                  ? customSection.trim().slice(0, 50)
                  : byId.get(questionId)!.type,
              correctMarks: byId.get(questionId)!.correctMarks,
              negativeMarks: byId.get(questionId)!.negativeMarks,
            };
          }),
        });
    });
    return { id, questionCount: questionIds.length };
  }
  async uploadImage(file?: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
  }) {
    if (!file) throw new BadRequestException('Image file is required');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
      throw new BadRequestException(
        'Only JPG, PNG and WebP images are allowed',
      );
    if (file.size > 5 * 1024 * 1024)
      throw new BadRequestException('Image must be 5 MB or smaller');
    const baseUrl = this.config.get<string>('SUPABASE_URL')?.replace(/\/$/, '');
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    const bucket =
      this.config.get<string>('QUESTION_MEDIA_BUCKET')?.trim() ||
      'question-media';
    if (!baseUrl || !serviceKey)
      throw new Error('Question media storage is not configured');
    const extension = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    }[file.mimetype];
    const path = `questions/${new Date().getUTCFullYear()}/${randomUUID()}.${extension}`;
    const response = await fetch(
      `${baseUrl}/storage/v1/object/${bucket}/${path}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          'Content-Type': file.mimetype,
          'x-upsert': 'false',
        },
        body: new Uint8Array(file.buffer),
      },
    );
    if (!response.ok)
      throw new BadRequestException('Image storage upload failed');
    return {
      url: `${baseUrl}/storage/v1/object/public/${bucket}/${path}`,
      path,
    };
  }
}
