import { describe, expect, it } from 'vitest';
import { mapQuestionRow } from './question-import';
describe('mapQuestionRow', () => {
  it('maps bilingual options and multiple correct answers', () => { const result = mapQuestionRow({ external_id: 'Q1', course_code: 'NEET', subject_code: 'PHYSICS', question_type: 'MULTIPLE_CORRECT', option_a_en: 'A', option_b_en: 'B', correct_options: 'A, B' }); expect(result.options).toHaveLength(2); expect(result.options.map((option) => option.isCorrect)).toEqual([true, true]); });
  it('keeps numerical questions optionless', () => { const result = mapQuestionRow({ external_id: 'N1', question_type: 'NUMERICAL', numerical_answer: '9.8' }); expect(result.options).toEqual([]); expect(result.numericalAnswer).toBe('9.8'); });
});
