import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import {
  DIFFICULTIES,
  enumValue,
  httpUrl,
  int,
  isTransactionConflict,
  isUniqueConstraintError,
  LANGUAGES,
  NEET_SUBJECTS,
  obj,
  str,
  TYPES,
} from './question-validation.helper.js';

export async function persistQuestionRecord(
  prisma: PrismaService,
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
  const courseSubject = await prisma.courseSubject.findFirst({
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
    prisma.$transaction(
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

