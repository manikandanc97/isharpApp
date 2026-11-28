import { QuestionDifficulty, QuestionType } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { SelectedQuestionSummary } from './question-selection.engine.js';

function mapQuestionRowToSummary(q: {
  id: string;
  externalId: string;
  courseSubjectId: string;
  chapterId: string | null;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  textEn: string | null;
  textTa: string | null;
  questionImageUrl: string | null;
  solutionEn: string | null;
  solutionTa: string | null;
  solutionImageUrl: string | null;
  correctMarks: number;
  negativeMarks: number;
  chapter: { id: string; title: string } | null;
  courseSubject: {
    subject: { id: string; code: string; name: string };
  };
  options: Array<{
    id: string;
    label: string;
    textEn: string | null;
    textTa: string | null;
    imageUrl: string | null;
    isCorrect: boolean;
    position: number;
  }>;
}): SelectedQuestionSummary {
  return {
    id: q.id,
    externalId: q.externalId,
    courseSubjectId: q.courseSubjectId,
    subjectCode: q.courseSubject.subject.code,
    subjectName: q.courseSubject.subject.name,
    chapterId: q.chapterId,
    chapterTitle: q.chapter?.title ?? null,
    type: q.type,
    difficulty: q.difficulty,
    textEn: q.textEn,
    textTa: q.textTa,
    questionImageUrl: q.questionImageUrl,
    solutionEn: q.solutionEn,
    solutionTa: q.solutionTa,
    solutionImageUrl: q.solutionImageUrl,
    correctMarks: q.correctMarks,
    negativeMarks: q.negativeMarks,
    options: q.options.map((o) => ({
      id: o.id,
      label: o.label,
      textEn: o.textEn,
      textTa: o.textTa,
      imageUrl: o.imageUrl,
      isCorrect: o.isCorrect,
      position: o.position,
    })),
  };
}

export async function fetchSelectedQuestionsByIds(
  prisma: PrismaService,
  ids: string[],
): Promise<SelectedQuestionSummary[]> {
  if (ids.length === 0) return [];

  const rows = await prisma.question.findMany({
    where: { id: { in: ids }, isActive: true },
    include: {
      options: { orderBy: { position: 'asc' } },
      chapter: { select: { id: true, title: true } },
      courseSubject: {
        include: {
          subject: { select: { id: true, code: true, name: true } },
        },
      },
    },
  });

  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map(mapQuestionRowToSummary);
}

export async function searchEligibleBankQuestions(
  prisma: PrismaService,
  params: {
    page?: number;
    limit?: number;
    subjectCode?: string;
    courseSubjectId?: string;
    chapterId?: string;
    difficulty?: string;
    type?: string;
    query?: string;
    excludeIds?: string[];
  },
) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(50, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    isActive: true,
    courseSubject: {
      isActive: true,
      ...(params.subjectCode && params.subjectCode !== 'ALL'
        ? { subject: { code: params.subjectCode.toUpperCase() } }
        : {}),
    },
    OR: [{ chapterId: null }, { chapter: { isActive: true } }],
  };

  if (params.courseSubjectId && params.courseSubjectId !== 'ALL') {
    where.courseSubjectId = params.courseSubjectId;
  }
  if (params.chapterId && params.chapterId !== 'ALL') {
    where.chapterId = params.chapterId;
  }
  if (params.difficulty && params.difficulty !== 'ALL') {
    where.difficulty = params.difficulty as QuestionDifficulty;
  }
  if (params.type && params.type !== 'ALL') {
    where.type = params.type as QuestionType;
  } else {
    where.type = QuestionType.SINGLE_CORRECT;
  }
  if (params.excludeIds?.length) {
    where.id = { notIn: params.excludeIds };
  }
  if (params.query?.trim()) {
    const q = params.query.trim();
    where.AND = [
      {
        OR: [
          { externalId: { contains: q, mode: 'insensitive' } },
          { textEn: { contains: q, mode: 'insensitive' } },
          { textTa: { contains: q, mode: 'insensitive' } },
          { chapter: { title: { contains: q, mode: 'insensitive' } } },
        ],
      },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      include: {
        options: { orderBy: { position: 'asc' } },
        chapter: { select: { id: true, title: true } },
        courseSubject: {
          include: {
            subject: { select: { id: true, code: true, name: true } },
          },
        },
      },
    }),
  ]);

  return {
    items: items.map(mapQuestionRowToSummary),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
