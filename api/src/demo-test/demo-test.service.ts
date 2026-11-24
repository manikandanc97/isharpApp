import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { DemoTestConfigurationService } from './demo-test-configuration.service.js';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly configuration?: DemoTestConfigurationService,
  ) {}

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

  private async fetchConfiguredLoginDemo() {
    return this.prisma.mockTest.findFirst({
      where: { isLoginDemo: true },
      include: {
        questions: {
          orderBy: { position: 'asc' },
          include: {
            question: {
              include: {
                options: { orderBy: { position: 'asc' } },
                chapter: true,
                courseSubject: { include: { subject: true } },
              },
            },
          },
        },
      },
    });
  }

  private async generateConfiguredLoginDemo(): Promise<DemoTestPayload | null> {
    const test = await this.fetchConfiguredLoginDemo();
    if (!test?.questions.length) return null;

    const subjects = new Map<
      string,
      { name: string; code: string; count: number }
    >();
    const questions: DemoTestQuestion[] = test.questions
      .filter((item) => item.question.isActive)
      .map((item) => {
        const q = item.question;
        const subjectCode = q.courseSubject?.subject?.code ?? 'GENERAL';
        const subjectName = q.courseSubject?.subject?.name ?? 'General';
        const subject = subjects.get(subjectCode);
        if (subject) subject.count += 1;
        else
          subjects.set(subjectCode, {
            name: subjectName,
            code: subjectCode,
            count: 1,
          });

        return {
          id: q.id,
          externalId: q.externalId,
          subject: subjectName,
          subjectCode,
          chapterTitle: q.chapter?.title ?? null,
          difficulty: q.difficulty,
          textEn: q.textEn ?? '',
          textTa: q.textTa,
          questionImageUrl: q.questionImageUrl,
          solutionEn: q.solutionEn,
          solutionTa: q.solutionTa,
          correctMarks: item.correctMarks,
          negativeMarks: item.negativeMarks,
          options: q.options.map((option, index) => ({
            id: option.id,
            label: String(option.position ?? index + 1),
            textEn: option.textEn ?? '',
            textTa: option.textTa,
            imageUrl: option.imageUrl,
            isCorrect: option.isCorrect,
            position: option.position ?? index + 1,
          })),
        };
      });

    if (!questions.length) return null;
    return {
      testId: test.id,
      title: test.title,
      code: test.code,
      instructionsEn:
        test.instructionsEn ??
        'Answer every question carefully. Correct and negative marks are shown in the test interface.',
      instructionsTa:
        test.instructionsTa ??
        'ஒவ்வொரு வினாவையும் கவனமாகப் படித்து பதிலளிக்கவும். மதிப்பெண் விவரங்கள் தேர்வு திரையில் காட்டப்படும்.',
      durationMinutes: test.durationMinutes,
      totalMarks: questions.reduce(
        (total, question) => total + question.correctMarks,
        0,
      ),
      questionCount: questions.length,
      subjects: Array.from(subjects.values()),
      questions,
    };
  }

  async generateDemoTest(
    targetCount = 9,
    subject?: string,
  ): Promise<DemoTestPayload> {
    if (!this.configuration) {
      const legacyConfiguredDemo = await this.generateConfiguredLoginDemo();
      if (legacyConfiguredDemo) return legacyConfiguredDemo;
    }
    const config = this.configuration
      ? await this.configuration.get(true)
      : {
          isEnabled: true,
          title: '',
          code: 'NEET-DEMO-2026',
          instructionsEn: '',
          instructionsTa: '',
          allowedSubjects: ['ALL', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY'],
          allowedLanguages: ['en', 'ta'],
          defaultSubject: 'ALL',
          defaultLanguage: 'ta',
          defaultQuestionCount: targetCount,
          countOptions: [
            {
              count: targetCount,
              durationMinutes: Math.max(8, Math.ceil(targetCount * 1.5)),
              label: 'Demo',
            },
          ],
          selectedQuestionIds: [],
        };
    if (!config.isEnabled)
      throw new ServiceUnavailableException('The demo test is currently disabled');
    const requestedSubject = subject?.trim().toUpperCase() ?? '';
    const configuredSubject = config.allowedSubjects.includes(requestedSubject)
      ? requestedSubject
      : config.defaultSubject;
    const selectedCount = config.countOptions.some(
      (option) => option.count === targetCount,
    )
      ? targetCount
      : config.defaultQuestionCount;
    const activeQuestions = await this.fetchActiveQuestions();
    const configuredIds = new Set(config.selectedQuestionIds ?? []);
    const rawQuestions = configuredIds.size
      ? activeQuestions.filter((question) => configuredIds.has(question.id))
      : activeQuestions;

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

    const normalizedSubject = configuredSubject;
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
      const count = Math.max(1, Math.min(selectedCount, subjectPool.length));
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
      const count = Math.max(3, Math.min(selectedCount, rawQuestions.length));
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
      options: q.options.map((opt, optIdx) => {
        const neetLabel =
          opt.position != null
            ? String(opt.position)
            : opt.label === 'A'
              ? '1'
              : opt.label === 'B'
                ? '2'
                : opt.label === 'C'
                  ? '3'
                  : opt.label === 'D'
                    ? '4'
                    : opt.label || String(optIdx + 1);
        return {
          id: opt.id,
          label: neetLabel,
          textEn: opt.textEn ?? '',
          textTa: opt.textTa,
          imageUrl: opt.imageUrl,
          isCorrect: opt.isCorrect,
          position: opt.position ?? optIdx + 1,
        };
      }),
    }));

    const durationMinutes =
      config.countOptions.find((option) => option.count === selectedCount)
        ?.durationMinutes ?? Math.max(8, Math.ceil(questions.length * 1.5));
    const totalMarks = questions.reduce((sum, q) => sum + q.correctMarks, 0);

    return {
      testId: `DEMO-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: config.title || testTitle,
      code: config.code,
      instructionsEn:
        config.instructionsEn ||
        'Standard NTA NEET exam format with bilingual (English + Tamil) instructions. +4 marks for correct response, -1 mark deduction for incorrect response, 0 for skipped questions.',
      instructionsTa:
        config.instructionsTa ||
        'நிலையான NTA NEET தேர்வு மாதிரி. தமிழ் மற்றும் ஆங்கிலத்தில் வினாக்கள். சரியான விடைக்கு +4 மதிப்பெண்கள், தவறான விடைக்கு -1 மதிப்பெண், விடையளிக்காத வினாக்களுக்கு மதிப்பெண் குறைப்பு இல்லை.',
      durationMinutes,
      totalMarks,
      questionCount: questions.length,
      subjects: subjectsMeta,
      questions,
    };
  }
}
