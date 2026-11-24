import { describe, expect, it } from 'vitest';
import { getQuestionDuplicateKey } from './question-duplicate-utils';
import type { Question } from './types';

describe('QuestionBankList getQuestionDuplicateKey Tests', () => {
  it('does NOT mark two distinct diagram questions as duplicates even if they share the exact same prompt text', () => {
    // User scenario:
    // Question 1: Electric Charges and Fields (PHY-018)
    const question1: Question = {
      id: 'q-phy-018',
      externalId: 'PHY-018',
      type: 'SINGLE_CORRECT',
      language: 'BILINGUAL',
      difficulty: 'HARD',
      textEn: 'Identify the structure or arrangement shown in the diagram.',
      textTa: 'படத்தில் காட்டப்பட்டுள்ள அமைப்பை அடையாளம் காண்க.',
      questionImageUrl: '/uploads/question-media/2026/circuit-series.png',
      solutionEn: 'In series, both resistors lie on one current path.',
      solutionTa: 'தொடர் இணைப்பில் ஒரே மின்னோட்டப் பாதையில் இரு மின்தடைகளும் உள்ளன.',
      solutionImageUrl: null,
      numericalAnswer: null,
      source: 'NEET',
      correctMarks: 4,
      negativeMarks: 1,
      options: [
        { label: '1', textEn: 'Series', textTa: 'Series', imageUrl: null, isCorrect: true },
        { label: '2', textEn: 'Parallel', textTa: 'Parallel', imageUrl: null, isCorrect: false },
        { label: '3', textEn: 'Open circuit', textTa: 'Open circuit', imageUrl: null, isCorrect: false },
        { label: '4', textEn: 'Short circuit', textTa: 'Short circuit', imageUrl: null, isCorrect: false },
      ],
      courseSubject: {
        course: { code: 'NEET' },
        subject: { code: 'PHYSICS', name: 'Physics' },
      },
      chapter: { title: 'Electric Charges and Fields' },
    };

    // Question 2: Ray Optics (PHY-017)
    const question2: Question = {
      id: 'q-phy-017',
      externalId: 'PHY-017',
      type: 'SINGLE_CORRECT',
      language: 'BILINGUAL',
      difficulty: 'MEDIUM',
      textEn: 'Identify the structure or arrangement shown in the diagram.',
      textTa: 'படத்தில் காட்டப்பட்டுள்ள அமைப்பை அடையாளம் காண்க.',
      questionImageUrl: '/uploads/question-media/2026/convex-lens.png',
      solutionEn: 'A convex lens is thicker at the centre.',
      solutionTa: 'குவி லென்ஸ் நடுவில் தடிமனாக இருக்கும்.',
      solutionImageUrl: null,
      numericalAnswer: null,
      source: 'NEET',
      correctMarks: 4,
      negativeMarks: 1,
      options: [
        { label: '1', textEn: 'Convex lens', textTa: 'Convex lens', imageUrl: null, isCorrect: true },
        { label: '2', textEn: 'Concave lens', textTa: 'Concave lens', imageUrl: null, isCorrect: false },
        { label: '3', textEn: 'Plane mirror', textTa: 'Plane mirror', imageUrl: null, isCorrect: false },
        { label: '4', textEn: 'Prism', textTa: 'Prism', imageUrl: null, isCorrect: false },
      ],
      courseSubject: {
        course: { code: 'NEET' },
        subject: { code: 'PHYSICS', name: 'Physics' },
      },
      chapter: { title: 'Ray Optics' },
    };

    const key1 = getQuestionDuplicateKey(question1);
    const key2 = getQuestionDuplicateKey(question2);

    expect(key1.exactKey).not.toBe(key2.exactKey);
    expect(key1.equivKey).not.toBe(key2.equivKey);
  });

  it('correctly marks exact duplicates as having identical keys', () => {
    const original: Question = {
      id: 'q-original',
      externalId: 'PHY-001',
      type: 'SINGLE_CORRECT',
      language: 'BILINGUAL',
      difficulty: 'MEDIUM',
      textEn: 'What is force?',
      textTa: 'விசை என்றால் என்ன?',
      questionImageUrl: null,
      solutionEn: null,
      solutionTa: null,
      solutionImageUrl: null,
      numericalAnswer: null,
      source: null,
      correctMarks: 4,
      negativeMarks: 1,
      options: [
        { label: '1', textEn: 'Push or Pull', textTa: 'தள்ளுதல் அல்லது இழுத்தல்', imageUrl: null, isCorrect: true },
        { label: '2', textEn: 'Energy', textTa: 'ஆற்றல்', imageUrl: null, isCorrect: false },
      ],
      courseSubject: {
        course: { code: 'NEET' },
        subject: { code: 'PHYSICS', name: 'Physics' },
      },
      chapter: { title: 'Laws of Motion' },
    };

    const copy: Question = {
      ...original,
      id: 'q-copy',
      externalId: 'PHY-001-COPY',
    };

    const key1 = getQuestionDuplicateKey(original);
    const key2 = getQuestionDuplicateKey(copy);

    expect(key1.exactKey).toBe(key2.exactKey);
    expect(key1.equivKey).toBe(key2.equivKey);
  });

  it('correctly detects equivalent duplicates with permuted options', () => {
    const q1: Question = {
      id: 'q1',
      externalId: 'CHE-001',
      type: 'SINGLE_CORRECT',
      language: 'EN',
      difficulty: 'EASY',
      textEn: 'What is water?',
      textTa: null,
      questionImageUrl: null,
      solutionEn: null,
      solutionTa: null,
      solutionImageUrl: null,
      numericalAnswer: null,
      source: null,
      correctMarks: 4,
      negativeMarks: 1,
      options: [
        { label: '1', textEn: 'H2O', textTa: null, imageUrl: null, isCorrect: true },
        { label: '2', textEn: 'CO2', textTa: null, imageUrl: null, isCorrect: false },
      ],
      courseSubject: {
        course: { code: 'NEET' },
        subject: { code: 'CHEMISTRY', name: 'Chemistry' },
      },
      chapter: null,
    };

    const q2: Question = {
      ...q1,
      id: 'q2',
      externalId: 'CHE-002',
      options: [
        { label: '1', textEn: 'CO2', textTa: null, imageUrl: null, isCorrect: false },
        { label: '2', textEn: 'H2O', textTa: null, imageUrl: null, isCorrect: true },
      ],
    };

    const key1 = getQuestionDuplicateKey(q1);
    const key2 = getQuestionDuplicateKey(q2);

    expect(key1.exactKey).not.toBe(key2.exactKey); // order differs
    expect(key1.equivKey).toBe(key2.equivKey); // equivalent match!
  });
});
