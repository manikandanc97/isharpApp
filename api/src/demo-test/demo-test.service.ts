import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface DemoTestQuestionOption {
  id: string;
  label: string;
  textEn: string;
  textTa?: string | null;
  imageUrl?: string | null;
  isCorrect: boolean;
  position: number;
}

export interface DemoTestQuestion {
  id: string;
  externalId: string;
  subject: string;
  subjectCode: string;
  chapterTitle?: string | null;
  difficulty: string;
  textEn: string;
  textTa?: string | null;
  questionImageUrl?: string | null;
  solutionEn?: string | null;
  solutionTa?: string | null;
  correctMarks: number;
  negativeMarks: number;
  options: DemoTestQuestionOption[];
}

export interface DemoTestPayload {
  testId: string;
  title: string;
  code: string;
  instructionsEn: string;
  instructionsTa: string;
  durationMinutes: number;
  totalMarks: number;
  questionCount: number;
  subjects: { name: string; code: string; count: number }[];
  questions: DemoTestQuestion[];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}

@Injectable()
export class DemoTestService {
  constructor(private readonly prisma: PrismaService) {}

  private questionsCache: {
    data: Awaited<ReturnType<DemoTestService['fetchFromDatabase']>>;
    expiresAt: number;
  } | null = null;
  private readonly CACHE_TTL_MS = 60_000;

  invalidateCache() {
    this.questionsCache = null;
  }

  private async fetchFromDatabase() {
    return this.prisma.question.findMany({
      where: { isActive: true },
      include: {
        options: { orderBy: { position: 'asc' } },
        chapter: true,
        courseSubject: {
          include: {
            subject: true,
          },
        },
      },
    });
  }

  private async fetchActiveQuestions() {
    const now = Date.now();
    if (this.questionsCache && this.questionsCache.expiresAt > now) {
      return this.questionsCache.data;
    }
    const data = await this.fetchFromDatabase();
    this.questionsCache = { data, expiresAt: now + this.CACHE_TTL_MS };
    return data;
  }

  async generateDemoTest(
    targetCount = 9,
    subject?: string,
  ): Promise<DemoTestPayload> {
    const rawQuestions = await this.fetchActiveQuestions();

    if (!rawQuestions.length) {
      return {
        testId: `DEMO-${Date.now()}`,
        title: 'I-Sharp Academy NEET Demo Test',
        code: 'NEET-DEMO-2026',
        instructionsEn: 'No active questions currently available.',
        instructionsTa: 'தற்போது வினாக்கள் ஏதும் கிடைக்கவில்லை.',
        durationMinutes: 15,
        totalMarks: 0,
        questionCount: 0,
        subjects: [],
        questions: [],
      };
    }

    const normalizedSubject = subject?.trim().toUpperCase();
    const isSingleSubject =
      normalizedSubject &&
      normalizedSubject !== 'ALL' &&
      normalizedSubject !== 'MIXED';

    let selectedQuestions: typeof rawQuestions = [];
    const subjectsMeta: { name: string; code: string; count: number }[] = [];
    let testTitle = 'NEET Bilingual Diagnostic Demo Test';

    if (isSingleSubject) {
      const subjectPool = rawQuestions.filter(
        (q) =>
          q.courseSubject?.subject?.code?.toUpperCase() === normalizedSubject,
      );

      const subjectName =
        subjectPool[0]?.courseSubject?.subject?.name ??
        normalizedSubject.charAt(0) + normalizedSubject.slice(1).toLowerCase();

      testTitle = `NEET ${subjectName} Practice Drill`;
      const count = Math.max(1, Math.min(targetCount, subjectPool.length));
      selectedQuestions = shuffleArray(subjectPool).slice(0, count);

      subjectsMeta.push({
        name: subjectName,
        code: normalizedSubject,
        count: selectedQuestions.length,
      });
    } else {
      // Group questions by subject code
      const bySubject = new Map<string, typeof rawQuestions>();
      for (const q of rawQuestions) {
        const code = q.courseSubject?.subject?.code ?? 'GENERAL';
        const list = bySubject.get(code) ?? [];
        list.push(q);
        bySubject.set(code, list);
      }

      const subjectCodes = Array.from(bySubject.keys()).sort();
      const count = Math.max(3, Math.min(targetCount, rawQuestions.length));
      const perSubject = Math.max(1, Math.floor(count / subjectCodes.length));

      for (const code of subjectCodes) {
        const pool = shuffleArray(bySubject.get(code) || []);
        const picked = pool.slice(0, perSubject);
        selectedQuestions.push(...picked);

        const subjectName =
          picked[0]?.courseSubject?.subject?.name ??
          code.charAt(0) + code.slice(1).toLowerCase();
        subjectsMeta.push({
          name: subjectName,
          code,
          count: picked.length,
        });
      }

      // If we still need more questions to meet count, fill from remaining
      if (selectedQuestions.length < count) {
        const selectedIds = new Set(selectedQuestions.map((q) => q.id));
        const remaining = shuffleArray(
          rawQuestions.filter((q) => !selectedIds.has(q.id)),
        );
        const toAdd = remaining.slice(0, count - selectedQuestions.length);
        selectedQuestions.push(...toAdd);

        for (const item of toAdd) {
          const itemCode = item.courseSubject?.subject?.code ?? 'GENERAL';
          const meta = subjectsMeta.find((s) => s.code === itemCode);
          if (meta) {
            meta.count += 1;
          }
        }
      }
    }

    // Arrange the test with a balanced shuffle
    const shuffledTestQuestions = shuffleArray(selectedQuestions);

    const questions: DemoTestQuestion[] = shuffledTestQuestions.map((q) => ({
      id: q.id,
      externalId: q.externalId,
      subject: q.courseSubject?.subject?.name ?? 'General',
      subjectCode: q.courseSubject?.subject?.code ?? 'GENERAL',
      chapterTitle: q.chapter?.title ?? null,
      difficulty: q.difficulty,
      textEn: q.textEn ?? '',
      textTa: q.textTa,
      questionImageUrl: q.questionImageUrl,
      solutionEn: q.solutionEn,
      solutionTa: q.solutionTa,
      correctMarks: q.correctMarks ?? 4,
      negativeMarks: q.negativeMarks ?? 1,
      options: q.options.map((opt) => ({
        id: opt.id,
        label: opt.label,
        textEn: opt.textEn ?? '',
        textTa: opt.textTa,
        imageUrl: opt.imageUrl,
        isCorrect: opt.isCorrect,
        position: opt.position,
      })),
    }));

    const durationMinutes = Math.max(8, Math.ceil(questions.length * 1.5));
    const totalMarks = questions.reduce((sum, q) => sum + q.correctMarks, 0);

    return {
      testId: `DEMO-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: testTitle,
      code: 'NEET-DEMO-2026',
      instructionsEn:
        'Standard NTA NEET exam format with bilingual (English + Tamil) instructions. +4 marks for correct response, -1 mark deduction for incorrect response, 0 for skipped questions.',
      instructionsTa:
        'நிலையான NTA NEET தேர்வு மாதிரி. தமிழ் மற்றும் ஆங்கிலத்தில் வினாக்கள். சரியான விடைக்கு +4 மதிப்பெண்கள், தவறான விடைக்கு -1 மதிப்பெண், விடையளிக்காத வினாக்களுக்கு மதிப்பெண் குறைப்பு இல்லை.',
      durationMinutes,
      totalMarks,
      questionCount: questions.length,
      subjects: subjectsMeta,
      questions,
    };
  }
}
