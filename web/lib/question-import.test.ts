import { describe, expect, it } from 'vitest';
import { mapQuestionRow, QUESTION_HEADERS, TEMPLATE_HEADERS } from './question-import';

describe('bilingual spreadsheet column order', () => {
  it('places Tamil before English for every bilingual field', () => {
    for (const headers of [QUESTION_HEADERS, TEMPLATE_HEADERS]) {
      const headerList = Array.from(headers, String);
      expect(headerList.indexOf('question_text_ta')).toBeLessThan(headerList.indexOf('question_text_en'));
      expect(headerList.indexOf('solution_ta')).toBeLessThan(headerList.indexOf('solution_en'));

      for (const option of [1, 2, 3, 4]) {
        expect(headerList.indexOf(`option_${option}_ta`)).toBeLessThan(
          headerList.indexOf(`option_${option}_en`),
        );
      }
    }
  });
});

describe('mapQuestionRow', () => {
  it('maps bilingual options and multiple correct answers with 1, 2 numeric labels', () => {
    const resultNum = mapQuestionRow({
      external_id: 'Q1',
      course_code: 'NEET',
      subject_code: 'PHYSICS',
      question_type: 'MULTIPLE_CORRECT',
      option_1_en: 'Option One',
      option_2_en: 'Option Two',
      correct_options: '1, 2',
    });
    expect(resultNum.options).toHaveLength(2);
    expect(resultNum.options[0].label).toBe('1');
    expect(resultNum.options[1].label).toBe('2');
    expect(resultNum.options.map((option) => option.isCorrect)).toEqual([true, true]);
  });
  it('maps bilingual options and multiple correct answers with backward compatible letters', () => {
    const result = mapQuestionRow({
      external_id: 'Q1',
      course_code: 'NEET',
      subject_code: 'PHYSICS',
      question_type: 'MULTIPLE_CORRECT',
      option_a_en: 'A',
      option_b_en: 'B',
      correct_options: 'A, B',
    });
    expect(result.options).toHaveLength(2);
    expect(result.options[0].label).toBe('1');
    expect(result.options[1].label).toBe('2');
    expect(result.options.map((option) => option.isCorrect)).toEqual([true, true]);
  });
  it('keeps numerical questions optionless', () => {
    const result = mapQuestionRow({
      external_id: 'N1',
      question_type: 'NUMERICAL',
      numerical_answer: '9.8',
    });
    expect(result.options).toEqual([]);
    expect(result.numericalAnswer).toBe('9.8');
  });
});
