import { BadRequestException, Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { QuestionDifficulty, QuestionType } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  fetchSelectedQuestionsByIds,
  searchEligibleBankQuestions,
} from './question-selection-search.helper.js';

export interface ChapterAllocationInput {
  chapterId: string;
  count: number;
}

export interface SubjectAllocationInput {
  courseSubjectId: string;
  subjectCode: string;
  subjectName: string;
  chapterMode: 'ALL' | 'SELECTED';
  chapterAllocationMode: 'AUTOMATIC' | 'MANUAL';
  questionCount: number;
  chapterIds?: string[];
  chapterAllocations?: ChapterAllocationInput[];
}

export interface QuestionShortageDetail {
  subjectCode: string;
  subjectName: string;
  chapterId?: string;
  chapterTitle?: string;
  required: number;
  available: number;
  shortage: number;
}

export interface SelectedQuestionSummary {
  id: string;
  externalId: string;
  courseSubjectId: string;
  subjectCode: string;
  subjectName: string;
  chapterId: string | null;
  chapterTitle: string | null;
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
  options: Array<{
    id: string;
    label: string;
    textEn: string | null;
    textTa: string | null;
    imageUrl: string | null;
    isCorrect: boolean;
    position: number;
  }>;
}

function cryptoShuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

@Injectable()
export class QuestionSelectionEngine {
  constructor(private readonly prisma: PrismaService) {}

  async getSubjectsAndChapters(allowedTypes?: QuestionType[]) {
    const types = allowedTypes?.length
      ? allowedTypes
      : [QuestionType.SINGLE_CORRECT];

    const courseSubjects = await this.prisma.courseSubject.findMany({
      where: {
        isActive: true,
        course: { isActive: true },
        subject: { isActive: true },
      },
      orderBy: [{ position: 'asc' }, { subject: { name: 'asc' } }],
      include: {
        course: { select: { id: true, code: true, title: true } },
        subject: { select: { id: true, code: true, name: true } },
        chapters: {
          where: { isActive: true },
          orderBy: [{ position: 'asc' }, { title: 'asc' }],
          select: { id: true, title: true, position: true },
        },
      },
    });

    const groupedCounts = await this.prisma.question.groupBy({
      by: ['courseSubjectId', 'chapterId'],
      where: {
        isActive: true,
        type: { in: types },
        courseSubject: { isActive: true },
        OR: [{ chapterId: null }, { chapter: { isActive: true } }],
      },
      _count: { _all: true },
    });

    const subjectTotals = new Map<string, number>();
    const chapterTotals = new Map<string, number>();

    for (const row of groupedCounts) {
      const count = row._count._all;
      subjectTotals.set(
        row.courseSubjectId,
        (subjectTotals.get(row.courseSubjectId) ?? 0) + count,
      );
      if (row.chapterId) {
        chapterTotals.set(
          row.chapterId,
          (chapterTotals.get(row.chapterId) ?? 0) + count,
        );
      }
    }

    const sorted = [...courseSubjects].sort((a, b) => {
      if (a.course.code === 'NEET' && b.course.code !== 'NEET') return -1;
      if (b.course.code === 'NEET' && a.course.code !== 'NEET') return 1;
      return a.position - b.position;
    });

    return sorted.map((cs) => ({
      courseSubjectId: cs.id,
      courseId: cs.course.id,
      courseCode: cs.course.code,
      subjectId: cs.subject.id,
      subjectCode: cs.subject.code,
      subjectName: cs.subject.name,
      availableQuestions: subjectTotals.get(cs.id) ?? 0,
      chapters: cs.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        position: ch.position,
        availableQuestions: chapterTotals.get(ch.id) ?? 0,
      })),
    }));
  }

  async generateQuestions(params: {
    subjectAllocations: SubjectAllocationInput[];
    allowedTypes?: QuestionType[];
    difficulty?: QuestionDifficulty;
    excludeQuestionIds?: string[];
  }): Promise<{
    questions: SelectedQuestionSummary[];
    shortages: QuestionShortageDetail[];
  }> {
    const activeAllocations = params.subjectAllocations.filter(
      (s) => s.questionCount > 0,
    );
    if (activeAllocations.length === 0) {
      throw new BadRequestException(
        'At least one subject with questionCount > 0 is required',
      );
    }

    for (const sub of activeAllocations) {
      if (sub.chapterAllocationMode === 'MANUAL') {
        const allocs = sub.chapterAllocations ?? [];
        const sum = allocs.reduce((acc, item) => acc + (item.count || 0), 0);
        if (sum !== sub.questionCount) {
          throw new BadRequestException(
            `${sub.subjectName}: Sum of chapter allocations (${sum}) must equal subject question count (${sub.questionCount})`,
          );
        }
      }
      if (
        sub.chapterMode === 'SELECTED' &&
        (!sub.chapterIds || sub.chapterIds.length === 0)
      ) {
        throw new BadRequestException(
          `${sub.subjectName}: Please select at least one chapter or switch to All Chapters`,
        );
      }
    }

    const allowedTypes = params.allowedTypes?.length
      ? params.allowedTypes
      : [QuestionType.SINGLE_CORRECT];

    const usedQuestionIds = new Set<string>(params.excludeQuestionIds ?? []);
    const usedContentFingerprints = new Set<string>();
    const usedEquivalentFingerprints = new Set<string>();

    const selectedIds: string[] = [];
    const shortages: QuestionShortageDetail[] = [];

    for (const sub of activeAllocations) {
      const chapterFilter =
        sub.chapterMode === 'SELECTED' && sub.chapterIds?.length
          ? { chapterId: { in: sub.chapterIds } }
          : { OR: [{ chapterId: null }, { chapter: { isActive: true } }] };

      const candidates = await this.prisma.question.findMany({
        where: {
          isActive: true,
          courseSubjectId: sub.courseSubjectId,
          type: { in: allowedTypes },
          ...(params.difficulty ? { difficulty: params.difficulty } : {}),
          ...chapterFilter,
        },
        select: {
          id: true,
          chapterId: true,
          contentFingerprint: true,
          equivalentFingerprint: true,
          chapter: { select: { title: true } },
        },
      });

      const isEligible = (q: (typeof candidates)[number]) => {
        if (usedQuestionIds.has(q.id)) return false;
        if (
          q.contentFingerprint &&
          usedContentFingerprints.has(q.contentFingerprint)
        ) {
          return false;
        }
        if (
          q.equivalentFingerprint &&
          usedEquivalentFingerprints.has(q.equivalentFingerprint)
        ) {
          return false;
        }
        return true;
      };

      const markUsed = (q: (typeof candidates)[number]) => {
        usedQuestionIds.add(q.id);
        if (q.contentFingerprint) {
          usedContentFingerprints.add(q.contentFingerprint);
        }
        if (q.equivalentFingerprint) {
          usedEquivalentFingerprints.add(q.equivalentFingerprint);
        }
        selectedIds.push(q.id);
      };

      if (sub.chapterAllocationMode === 'MANUAL') {
        const chapterMap = new Map<string, typeof candidates>();
        for (const q of cryptoShuffle(candidates)) {
          if (!q.chapterId) continue;
          const list = chapterMap.get(q.chapterId) ?? [];
          list.push(q);
          chapterMap.set(q.chapterId, list);
        }

        const chaptersInfo = await this.prisma.chapter.findMany({
          where: {
            id: { in: (sub.chapterAllocations ?? []).map((a) => a.chapterId) },
          },
          select: { id: true, title: true },
        });
        const chapterTitleById = new Map(
          chaptersInfo.map((c) => [c.id, c.title]),
        );

        for (const alloc of sub.chapterAllocations ?? []) {
          if (alloc.count <= 0) continue;
          const candidatesInChapter = chapterMap.get(alloc.chapterId) ?? [];
          let pickedForChapter = 0;
          for (const candidate of candidatesInChapter) {
            if (pickedForChapter >= alloc.count) break;
            if (isEligible(candidate)) {
              markUsed(candidate);
              pickedForChapter++;
            }
          }
          if (pickedForChapter < alloc.count) {
            shortages.push({
              subjectCode: sub.subjectCode,
              subjectName: sub.subjectName,
              chapterId: alloc.chapterId,
              chapterTitle:
                chapterTitleById.get(alloc.chapterId) ?? 'Selected Chapter',
              required: alloc.count,
              available: pickedForChapter,
              shortage: alloc.count - pickedForChapter,
            });
          }
        }
      } else {
        const shuffled = cryptoShuffle(candidates);
        const byChapter = new Map<string, typeof candidates>();
        for (const q of shuffled) {
          const key = q.chapterId ?? '__UNASSIGNED__';
          const list = byChapter.get(key) ?? [];
          list.push(q);
          byChapter.set(key, list);
        }

        const chapterBuckets = cryptoShuffle(Array.from(byChapter.values()));
        let pickedForSubject = 0;
        let roundMadeProgress = true;

        while (pickedForSubject < sub.questionCount && roundMadeProgress) {
          roundMadeProgress = false;
          for (const bucket of chapterBuckets) {
            if (pickedForSubject >= sub.questionCount) break;
            while (bucket.length > 0) {
              const candidate = bucket.pop()!;
              if (isEligible(candidate)) {
                markUsed(candidate);
                pickedForSubject++;
                roundMadeProgress = true;
                break;
              }
            }
          }
        }

        if (pickedForSubject < sub.questionCount) {
          shortages.push({
            subjectCode: sub.subjectCode,
            subjectName: sub.subjectName,
            required: sub.questionCount,
            available: pickedForSubject,
            shortage: sub.questionCount - pickedForSubject,
          });
        }
      }
    }

    if (shortages.length > 0) {
      return { questions: [], shortages };
    }

    const fullQuestions = await this.fetchQuestionsByIds(selectedIds);
    return { questions: fullQuestions, shortages: [] };
  }

  fetchQuestionsByIds(ids: string[]): Promise<SelectedQuestionSummary[]> {
    return fetchSelectedQuestionsByIds(this.prisma, ids);
  }

  searchEligibleQuestions(params: {
    page?: number;
    limit?: number;
    subjectCode?: string;
    courseSubjectId?: string;
    chapterId?: string;
    difficulty?: string;
    type?: string;
    query?: string;
    excludeIds?: string[];
  }) {
    return searchEligibleBankQuestions(this.prisma, params);
  }
}
