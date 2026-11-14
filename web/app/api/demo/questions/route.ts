import { NextResponse, type NextRequest } from 'next/server';
import { getNestApiClient } from '@/lib/nest-api';
import localQuestions from '@/lib/demo-questions.data.json';

interface RawOption {
  id: string;
  label: string;
  textEn: string;
  textTa?: string | null;
  imageUrl?: string | null;
  isCorrect: boolean;
  position: number;
}

interface RawQuestion {
  id: string;
  externalId: string;
  difficulty: string;
  textEn: string;
  textTa?: string | null;
  questionImageUrl?: string | null;
  solutionEn?: string | null;
  solutionTa?: string | null;
  correctMarks: number;
  negativeMarks: number;
  options: RawOption[];
  chapter?: { title: string } | null;
  courseSubject?: { subject?: { name: string; code: string } | null } | null;
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

function generateLocalDemoTest(targetCount = 9, subject?: string) {
  const allQs = localQuestions as unknown as RawQuestion[];
  if (!allQs.length) {
    return {
      testId: `DEMO-${Date.now()}`,
      title: 'I-Sharp Academy NEET Demo Test',
      code: 'NEET-DEMO-2026',
      instructionsEn: 'No questions available.',
      instructionsTa: 'வினாக்கள் கிடைக்கவில்லை.',
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

  let selected: RawQuestion[] = [];
  const subjectsMeta: { name: string; code: string; count: number }[] = [];
  let testTitle = 'NEET Bilingual Diagnostic Demo Test';

  if (isSingleSubject) {
    const subjectPool = allQs.filter(
      (q) =>
        q.courseSubject?.subject?.code?.toUpperCase() === normalizedSubject,
    );

    const subjectName =
      subjectPool[0]?.courseSubject?.subject?.name ??
      normalizedSubject.charAt(0) + normalizedSubject.slice(1).toLowerCase();

    testTitle = `NEET ${subjectName} Practice Drill`;
    const count = Math.max(1, Math.min(targetCount, subjectPool.length));
    selected = shuffle(subjectPool).slice(0, count);

    subjectsMeta.push({
      name: subjectName,
      code: normalizedSubject,
      count: selected.length,
    });
  } else {
    // Group questions by subject
    const bySubject = new Map<string, RawQuestion[]>();
    for (const q of allQs) {
      const code = q.courseSubject?.subject?.code ?? 'GENERAL';
      const list = bySubject.get(code) ?? [];
      list.push(q);
      bySubject.set(code, list);
    }

    const subjectCodes = Array.from(bySubject.keys()).sort();
    const count = Math.max(3, Math.min(targetCount, allQs.length));
    const perSubject = Math.max(1, Math.floor(count / subjectCodes.length));

    for (const code of subjectCodes) {
      const pool = shuffle(bySubject.get(code) || []);
      const picked = pool.slice(0, perSubject);
      selected.push(...picked);

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
    if (selected.length < count) {
      const selectedIds = new Set(selected.map((q) => q.id));
      const remaining = shuffle(allQs.filter((q) => !selectedIds.has(q.id)));
      const toAdd = remaining.slice(0, count - selected.length);
      selected.push(...toAdd);

      for (const item of toAdd) {
        const itemCode = item.courseSubject?.subject?.code ?? 'GENERAL';
        const meta = subjectsMeta.find((s) => s.code === itemCode);
        if (meta) {
          meta.count += 1;
        }
      }
    }
  }

  const shuffledQuestions = shuffle(selected);

  const formattedQuestions = shuffledQuestions.map((q) => ({
    id: q.id,
    externalId: q.externalId,
    subject: q.courseSubject?.subject?.name ?? 'General',
    subjectCode: q.courseSubject?.subject?.code ?? 'GENERAL',
    chapterTitle: q.chapter?.title ?? null,
    difficulty: q.difficulty,
    textEn: q.textEn,
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
        textEn: opt.textEn,
        textTa: opt.textTa,
        imageUrl: opt.imageUrl,
        isCorrect: opt.isCorrect,
        position: opt.position ?? optIdx + 1,
      };
    }),
  }));

  const durationMinutes = Math.max(8, Math.ceil(formattedQuestions.length * 1.5));
  const totalMarks = formattedQuestions.reduce(
    (sum, q) => sum + q.correctMarks,
    0,
  );

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
    questionCount: formattedQuestions.length,
    subjects: subjectsMeta,
    questions: formattedQuestions,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const countParam = searchParams.get('count');
  const subjectParam = searchParams.get('subject') ?? 'ALL';
  const count = countParam ? parseInt(countParam, 10) : 9;

  try {
    const upstream = await getNestApiClient().request(
      `/api/demo/questions?count=${encodeURIComponent(count)}&subject=${encodeURIComponent(subjectParam)}`,
      { cache: 'no-store' },
    );
    return NextResponse.json(upstream, {
      headers: { 'Cache-Control': 'no-store, private' },
    });
  } catch {
    // High-resilience fallback: served immediately from authentic questions database bundle
    const fallbackTest = generateLocalDemoTest(
      Number.isNaN(count) ? 9 : count,
      subjectParam,
    );
    return NextResponse.json(fallbackTest, {
      headers: { 'Cache-Control': 'no-store, private' },
    });
  }
}
