export const QUESTION_HEADERS = [
  'external_id', 'course_code', 'subject_code', 'chapter_title', 'question_type', 'language', 'difficulty',
  'question_text_en', 'question_text_ta', 'question_image',
  'option_a_en', 'option_a_ta', 'option_a_image', 'option_b_en', 'option_b_ta', 'option_b_image',
  'option_c_en', 'option_c_ta', 'option_c_image', 'option_d_en', 'option_d_ta', 'option_d_image',
  'correct_options', 'numerical_answer', 'solution_en', 'solution_ta', 'solution_image',
  'correct_marks', 'negative_marks', 'source',
] as const;

type CellMap = Record<string, unknown>;
const value = (row: CellMap, key: string) => String(row[key] ?? '').trim();
const imageValue = (row: CellMap, key: string) => value(row, `${key}_image`) || value(row, `${key}_image_url`);

export function mapQuestionRow(row: CellMap) {
  const correct = new Set(value(row, 'correct_options').toUpperCase().split(',').map((item) => item.trim()).filter(Boolean));
  const options = ['A', 'B', 'C', 'D'].map((label, idx) => {
    const key = label.toLowerCase();
    const numLabel = String(idx + 1);
    const isCorrect = correct.has(label) || correct.has(numLabel);
    return { label: numLabel, textEn: value(row, `option_${key}_en`), textTa: value(row, `option_${key}_ta`), imageUrl: imageValue(row, `option_${key}`), isCorrect };
  }).filter((option) => option.textEn || option.textTa || option.imageUrl);
  return {
    externalId: value(row, 'external_id'), courseCode: value(row, 'course_code'), subjectCode: value(row, 'subject_code'), chapterTitle: value(row, 'chapter_title'),
    type: value(row, 'question_type') || 'SINGLE_CORRECT', language: value(row, 'language') || 'BILINGUAL', difficulty: value(row, 'difficulty') || 'MEDIUM',
    textEn: value(row, 'question_text_en'), textTa: value(row, 'question_text_ta'), questionImageUrl: imageValue(row, 'question'),
    options, numericalAnswer: value(row, 'numerical_answer'), solutionEn: value(row, 'solution_en'), solutionTa: value(row, 'solution_ta'), solutionImageUrl: imageValue(row, 'solution'),
    correctMarks: value(row, 'correct_marks') || '4', negativeMarks: value(row, 'negative_marks') || '1', source: value(row, 'source'),
  };
}
