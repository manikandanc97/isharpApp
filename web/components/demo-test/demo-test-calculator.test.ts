import { describe, expect, it } from 'vitest';
import { calculateScorecard, formatSecondsOrMinutes, formatTime } from './demo-test-calculator';
import type { DemoQuestion, UserAnswerRecord } from './demo-test.types';

describe('demo-test-calculator', () => {
  const sampleQuestions: DemoQuestion[] = [
    {
      id: 'q1',
      externalId: 'PHY-01',
      subject: 'Physics',
      subjectCode: 'PHYSICS',
      difficulty: 'EASY',
      textEn: 'Question 1',
      correctMarks: 4,
      negativeMarks: 1,
      options: [
        { id: 'opt1', label: 'A', textEn: 'Choice A', isCorrect: true, position: 1 },
        { id: 'opt2', label: 'B', textEn: 'Choice B', isCorrect: false, position: 2 },
      ],
    },
    {
      id: 'q2',
      externalId: 'CHEM-01',
      subject: 'Chemistry',
      subjectCode: 'CHEMISTRY',
      difficulty: 'MEDIUM',
      textEn: 'Question 2',
      correctMarks: 4,
      negativeMarks: 1,
      options: [
        { id: 'opt3', label: 'A', textEn: 'Choice A', isCorrect: true, position: 1 },
        { id: 'opt4', label: 'B', textEn: 'Choice B', isCorrect: false, position: 2 },
      ],
    },
  ];

  it('calculates score correctly for 1 correct and 1 wrong answer (+4 and -1 = 3)', () => {
    const userAnswers: Record<string, UserAnswerRecord> = {
      q1: {
        questionId: 'q1',
        selectedOptionId: 'opt1', // Correct (+4)
        markedForReview: false,
        visited: true,
        timeSpentSeconds: 30,
      },
      q2: {
        questionId: 'q2',
        selectedOptionId: 'opt4', // Wrong (-1)
        markedForReview: false,
        visited: true,
        timeSpentSeconds: 40,
      },
    };

    const scorecard = calculateScorecard(sampleQuestions, userAnswers, 70);

    expect(scorecard.totalQuestions).toBe(2);
    expect(scorecard.attempted).toBe(2);
    expect(scorecard.correctCount).toBe(1);
    expect(scorecard.wrongCount).toBe(1);
    expect(scorecard.skippedCount).toBe(0);
    expect(scorecard.totalScore).toBe(3); // 4 - 1
    expect(scorecard.maxScore).toBe(8);
    expect(scorecard.accuracy).toBe(50);
    expect(scorecard.subjectStats).toHaveLength(2);
    expect(scorecard.subjectStats[0]?.timeSpentSeconds).toBe(30);
    expect(scorecard.subjectStats[1]?.timeSpentSeconds).toBe(40);
    expect(scorecard.timeAnalytics?.avgTimePerQuestion).toBe(35);
    expect(scorecard.timeAnalytics?.avgTimeCorrect).toBe(30);
    expect(scorecard.timeAnalytics?.avgTimeWrong).toBe(40);
    expect(scorecard.timeAnalytics?.fastestQuestion?.seconds).toBe(30);
    expect(scorecard.timeAnalytics?.slowestQuestion?.seconds).toBe(40);
  });

  it('formats time correctly', () => {
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(900)).toBe('15:00');
    expect(formatSecondsOrMinutes(45)).toBe('45s');
    expect(formatSecondsOrMinutes(95)).toBe('1m 35s');
    expect(formatSecondsOrMinutes(120)).toBe('2m');
  });
});

