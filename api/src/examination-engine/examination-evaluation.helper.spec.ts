import { describe, expect, it } from 'vitest';
import {
  evaluateStudentAttempt,
  type AttemptQuestionEvaluationInput,
} from './examination-evaluation.helper.js';

describe('Examination Evaluation Helper', () => {
  it('should calculate standard NEET scoring: +4 for correct, -1 for incorrect, 0 for skipped', () => {
    const questions: AttemptQuestionEvaluationInput[] = [
      {
        questionId: 'q1',
        position: 1,
        section: 'A',
        correctMarks: 4,
        negativeMarks: 1,
        isDropped: false,
        selectedOptionId: 'opt-correct',
        canonicalCorrectOptionId: 'opt-correct',
        subjectCode: 'PHY',
      },
      {
        questionId: 'q2',
        position: 2,
        section: 'A',
        correctMarks: 4,
        negativeMarks: 1,
        isDropped: false,
        selectedOptionId: 'opt-wrong',
        canonicalCorrectOptionId: 'opt-correct',
        subjectCode: 'PHY',
      },
      {
        questionId: 'q3',
        position: 3,
        section: 'A',
        correctMarks: 4,
        negativeMarks: 1,
        isDropped: false,
        selectedOptionId: null,
        canonicalCorrectOptionId: 'opt-correct',
        subjectCode: 'PHY',
      },
    ];

    const result = evaluateStudentAttempt(questions, true);

    expect(result.totalMarksScored).toBe(3); // 4 - 1 + 0 = 3
    expect(result.maxMarks).toBe(12);
    expect(result.correctCount).toBe(1);
    expect(result.incorrectCount).toBe(1);
    expect(result.unansweredCount).toBe(1);
    expect(result.accuracyPercentage).toBe(50.0); // 1 out of 2 attempted = 50%
    expect(result.physicsScore).toBe(3);
  });

  it('should award full marks for dropped questions regardless of student answer', () => {
    const questions: AttemptQuestionEvaluationInput[] = [
      {
        questionId: 'q1',
        position: 1,
        section: 'A',
        correctMarks: 4,
        negativeMarks: 1,
        isDropped: true, // Dropped by exam authority
        selectedOptionId: null, // Student did not answer
        canonicalCorrectOptionId: 'opt-correct',
        subjectCode: 'CHE',
      },
    ];

    const result = evaluateStudentAttempt(questions, true);

    expect(result.totalMarksScored).toBe(4);
    expect(result.droppedCount).toBe(1);
    expect(result.chemistryScore).toBe(4);
  });

  it('should break down scores by subject and chapter accurately for a full NEET paper', () => {
    const questions: AttemptQuestionEvaluationInput[] = [
      // Physics: 2 correct
      {
        questionId: 'p1',
        position: 1,
        section: 'A',
        correctMarks: 4,
        negativeMarks: 1,
        isDropped: false,
        selectedOptionId: 'opt-p1',
        canonicalCorrectOptionId: 'opt-p1',
        subjectCode: 'PHY',
      },
      {
        questionId: 'p2',
        position: 2,
        section: 'A',
        correctMarks: 4,
        negativeMarks: 1,
        isDropped: false,
        selectedOptionId: 'opt-p2',
        canonicalCorrectOptionId: 'opt-p2',
        subjectCode: 'PHY',
      },
      // Chemistry: 1 correct, 1 incorrect
      {
        questionId: 'c1',
        position: 3,
        section: 'A',
        correctMarks: 4,
        negativeMarks: 1,
        isDropped: false,
        selectedOptionId: 'opt-c1',
        canonicalCorrectOptionId: 'opt-c1',
        subjectCode: 'CHE',
      },
      {
        questionId: 'c2',
        position: 4,
        section: 'A',
        correctMarks: 4,
        negativeMarks: 1,
        isDropped: false,
        selectedOptionId: 'opt-wrong',
        canonicalCorrectOptionId: 'opt-c2',
        subjectCode: 'CHE',
      },
      // Botany: 1 correct
      {
        questionId: 'b1',
        position: 5,
        section: 'A',
        correctMarks: 4,
        negativeMarks: 1,
        isDropped: false,
        selectedOptionId: 'opt-b1',
        canonicalCorrectOptionId: 'opt-b1',
        subjectCode: 'BOT',
      },
      // Zoology: 1 correct
      {
        questionId: 'z1',
        position: 6,
        section: 'A',
        correctMarks: 4,
        negativeMarks: 1,
        isDropped: false,
        selectedOptionId: 'opt-z1',
        canonicalCorrectOptionId: 'opt-z1',
        subjectCode: 'ZOO',
      },
    ];

    const result = evaluateStudentAttempt(questions, true);

    expect(result.physicsScore).toBe(8); // 4 + 4
    expect(result.chemistryScore).toBe(3); // 4 - 1
    expect(result.botanyScore).toBe(4);
    expect(result.zoologyScore).toBe(4);
    expect(result.biologyScore).toBe(8); // Botany + Zoology = 8
    expect(result.totalMarksScored).toBe(19); // 8 + 3 + 4 + 4 = 19
    expect(result.maxMarks).toBe(24);
  });
});
