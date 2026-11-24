export const QUESTION_HEADERS = [
  'external_id', 'course_code', 'subject_code', 'chapter_title', 'question_type', 'difficulty',
  'question_text_en', 'question_text_ta', 'question_image',
  'option_1_en', 'option_1_ta', 'option_1_image', 'option_2_en', 'option_2_ta', 'option_2_image',
  'option_3_en', 'option_3_ta', 'option_3_image', 'option_4_en', 'option_4_ta', 'option_4_image',
  'correct_options', 'numerical_answer', 'solution_en', 'solution_ta', 'solution_image',
  'correct_marks', 'negative_marks', 'source',
] as const;

export const TEMPLATE_HEADERS = [
  'subject_code', 'chapter_title', 'question_type', 'difficulty',
  'question_text_en', 'question_text_ta', 'question_image',
  'option_1_en', 'option_1_ta', 'option_1_image', 'option_2_en', 'option_2_ta', 'option_2_image',
  'option_3_en', 'option_3_ta', 'option_3_image', 'option_4_en', 'option_4_ta', 'option_4_image',
  'correct_options', 'numerical_answer', 'solution_en', 'solution_ta', 'solution_image',
  'correct_marks', 'negative_marks', 'source',
] as const;

export function generateExternalId(courseCode?: string, subjectCode?: string, index = 1): string {
  const sub = (subjectCode || 'GEN').trim().substring(0, 3).toUpperCase();
  const num = String(index).padStart(3, '0');
  const batch = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${sub}-${batch}-${num}`;
}

type CellMap = Record<string, unknown>;
const value = (row: CellMap, key: string) => String(row[key] ?? '').trim();
const imageValue = (row: CellMap, key: string) => value(row, `${key}_image`) || value(row, `${key}_image_url`);
const imageHashValue = (row: CellMap, key: string) => value(row, `${key}_image_hash`) || undefined;

export function mapQuestionRow(row: CellMap, index = 1) {
  const correct = new Set(value(row, 'correct_options').toUpperCase().split(',').map((item) => item.trim()).filter(Boolean));
  const options = ['1', '2', '3', '4'].map((numLabel, idx) => {
    const legacyLetter = ['A', 'B', 'C', 'D'][idx];
    const legacyKey = legacyLetter.toLowerCase();
    const isCorrect = correct.has(numLabel) || correct.has(legacyLetter);
    const imageUrl =
      imageValue(row, `option_${numLabel}`) ||
      imageValue(row, `option_${legacyKey}`);
    const imageHash =
      imageHashValue(row, `option_${numLabel}`) ||
      imageHashValue(row, `option_${legacyKey}`);
    return {
      label: numLabel,
      textEn: value(row, `option_${numLabel}_en`) || value(row, `option_${legacyKey}_en`),
      textTa: value(row, `option_${numLabel}_ta`) || value(row, `option_${legacyKey}_ta`),
      imageUrl,
      imageHash,
      isCorrect,
    };
  }).filter((option) => option.textEn || option.textTa || option.imageUrl || option.imageHash);

  const courseCode = value(row, 'course_code') || 'NEET';
  const subjectCode = value(row, 'subject_code') || 'PHYSICS';
  const externalId = value(row, 'external_id') || generateExternalId(courseCode, subjectCode, index);
  const source = value(row, 'source') || 'NEET practice';

  const rawCorrect = value(row, 'correct_marks');
  const correctMarks = rawCorrect && !isNaN(Number(rawCorrect))
    ? String(Math.abs(Number(rawCorrect)))
    : '4';

  const rawNegative = value(row, 'negative_marks');
  const negativeMarks = rawNegative && !isNaN(Number(rawNegative))
    ? String(Math.abs(Number(rawNegative)))
    : '1';

  return {
    externalId,
    courseCode,
    subjectCode,
    chapterTitle: value(row, 'chapter_title'),
    type: value(row, 'question_type') || 'SINGLE_CORRECT',
    language: value(row, 'language') || 'BILINGUAL',
    difficulty: value(row, 'difficulty') || 'MEDIUM',
    textEn: value(row, 'question_text_en'),
    textTa: value(row, 'question_text_ta'),
    questionImageUrl: imageValue(row, 'question'),
    questionImageHash: imageHashValue(row, 'question'),
    options,
    numericalAnswer: value(row, 'numerical_answer'),
    solutionEn: value(row, 'solution_en'),
    solutionTa: value(row, 'solution_ta'),
    solutionImageUrl: imageValue(row, 'solution'),
    solutionImageHash: imageHashValue(row, 'solution'),
    correctMarks,
    negativeMarks,
    source,
  };
}
