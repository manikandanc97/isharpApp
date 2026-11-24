import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { collectEmbeddedImages } from './excel-embedded-images';
import { calculateFingerprints, hashImageBytes } from './question-duplicate-detection';
import { mapQuestionRow, TEMPLATE_HEADERS } from './question-import';

describe('Real Excel Embedded Image & Duplicate Detection Test', () => {
  it('detects embedded images, hashes them and catches within-file duplicates', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Questions');

    // Add headers
    sheet.addRow(TEMPLATE_HEADERS);

    // 1x1 transparent PNG bytes (expanded slightly to exceed dummy threshold > 100 bytes)
    const validPngBytes = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2P8z/D/PwMDAwMDEwMAAvgD/Vl+3vEAAAAASUVORK5CYII=' +
      'extra-padding-bytes-to-make-image-size-sufficient-for-test-validation-and-hashing-1234567890',
      'utf-8',
    );
    const expectedHash = hashImageBytes(validPngBytes, 'image/png');

    const imageId1 = workbook.addImage({
      base64: validPngBytes.toString('base64'),
      extension: 'png',
    });

    // Row 2: Question with embedded question image
    sheet.addRow([
      'PHYSICS', 'Kinematics', 'SINGLE_CORRECT', 'MEDIUM',
      'Find velocity:', '', '', // question_image in col 7
      '10 m/s', '', '',
      '20 m/s', '', '',
      '30 m/s', '', '',
      '40 m/s', '', '',
      'A', '', 'Solution text', '', '',
      '4', '1', 'NEET practice',
    ]);
    sheet.addImage(imageId1, {
      tl: { col: 6, row: 1 }, // 0-indexed col 6 is question_image (7th column), row 1 is row 2
      ext: { width: 100, height: 100 },
    });

    // Row 3: Distinct question
    sheet.addRow([
      'PHYSICS', 'Kinematics', 'SINGLE_CORRECT', 'MEDIUM',
      'Find acceleration:', '', '',
      '5 m/s^2', '', '',
      '10 m/s^2', '', '',
      '15 m/s^2', '', '',
      '20 m/s^2', '', '',
      'B', '', 'Solution text', '', '',
      '4', '1', 'NEET practice',
    ]);

    // Row 4: Duplicate of row 2 (same question, same image, same options)
    sheet.addRow([
      'PHYSICS', 'Kinematics', 'SINGLE_CORRECT', 'MEDIUM',
      'Find velocity:', '', '',
      '10 m/s', '', '',
      '20 m/s', '', '',
      '30 m/s', '', '',
      '40 m/s', '', '',
      'A', '', 'Solution text', '', '',
      '4', '1', 'NEET practice',
    ]);
    sheet.addImage(imageId1, {
      tl: { col: 6, row: 3 }, // Row 4
      ext: { width: 100, height: 100 },
    });

    // Row 5: Reordered options (Level B equivalent duplicate of Row 3)
    // Row 3 has: A=5, B=10 (correct), C=15, D=20
    // Row 5 has: A=20, B=15, C=10 (correct), D=5 -> correct answer maps to 10 in both!
    sheet.addRow([
      'PHYSICS', 'Kinematics', 'SINGLE_CORRECT', 'MEDIUM',
      'Find acceleration:', '', '',
      '20 m/s^2', '', '',
      '15 m/s^2', '', '',
      '10 m/s^2', '', '',
      '5 m/s^2', '', '',
      'C', '', 'Solution text', '', '',
      '4', '1', 'NEET practice',
    ]);

    // 1. Collect images
    const headers = sheet.getRow(1).values as string[];
    const names = headers.slice(1);
    const collected = collectEmbeddedImages(workbook, sheet, names);

    expect(collected.length).toBeGreaterThanOrEqual(2);
    expect(collected[0].columnName).toBe('question_image');
    expect(collected[0].imageHash).toBe(expectedHash);

    // 2. Map row records and simulate within-workbook duplicate check
    const records = new Map<number, Record<string, unknown>>();
    sheet.eachRow((excelRow, number) => {
      if (number === 1) return;
      const rec: Record<string, unknown> = {};
      names.forEach((name, idx) => {
        const cell = excelRow.getCell(idx + 1).value;
        rec[name] = cell;
      });
      records.set(number, rec);
    });

    for (const img of collected) {
      const rec = records.get(img.rowNumber);
      if (rec) {
        rec[`${img.columnName}_hash`] = img.imageHash;
      }
    }

    const rows = [...records.entries()].map(([rowNumber, rec]) => {
      const mapped = mapQuestionRow(rec, rowNumber);
      const fps = calculateFingerprints(mapped);
      return { rowNumber, mapped, fps };
    });

    // Check Row 4 vs Row 2: exact match
    expect(rows[0].fps.contentFingerprint).toBe(rows[2].fps.contentFingerprint);

    // Check Row 5 vs Row 3: equivalent match (reordered options with correct answer remapped to 10 m/s^2)
    expect(rows[1].fps.contentFingerprint).not.toBe(rows[3].fps.contentFingerprint); // exact differs
    expect(rows[1].fps.equivalentFingerprint).toBe(rows[3].fps.equivalentFingerprint); // equivalent matches!
  });

  it('correctly handles image-only questions and options in Excel import mapping', () => {
    const record: Record<string, unknown> = {
      subject_code: 'BIOLOGY',
      chapter_title: 'Cell Biology',
      question_type: 'SINGLE_CORRECT',
      question_image_hash: 'img-cell-structure-hash',
      option_a_image_hash: 'img-mitochondria-hash',
      option_b_image_hash: 'img-chloroplast-hash',
      correct_options: 'A',
      solution_en: 'Mitochondria is powerhouse of cell',
    };

    const mapped = mapQuestionRow(record, 2);
    expect(mapped.options).toHaveLength(2);
    expect(mapped.options[0].imageHash).toBe('img-mitochondria-hash');
    expect(mapped.options[0].isCorrect).toBe(true);

    const fps = calculateFingerprints(mapped);
    expect(fps.contentFingerprint).toBeTruthy();
    expect(fps.canonicalData.questionImageHash).toBe('img-cell-structure-hash');
    expect(fps.canonicalData.options[0].imageHash).toBe('img-mitochondria-hash');
  });

  it('does NOT mark diagram questions with identical prompt as duplicates when diagrams or options differ', () => {
    // Exact user scenario:
    // Prompt 1 & 2: "Identify the structure or arrangement shown in the diagram." / "படத்தில் காட்டப்பட்டுள்ள அமைப்பை அடையாளம் காண்க."
    // Question 1: Electric Charges and Fields, resistor circuit diagram, options: Series, Parallel, Open circuit, Short circuit
    // Question 2: Ray Optics, convex lens diagram, options: Convex lens, Concave lens, Plane mirror, Prism
    const q1Mapped = {
      type: 'SINGLE_CORRECT',
      textEn: 'Identify the structure or arrangement shown in the diagram.',
      textTa: 'படத்தில் காட்டப்பட்டுள்ள அமைப்பை அடையாளம் காண்க.',
      questionImageUrl: '/uploads/question-media/2026/resistor-circuit.png',
      questionImageHash: 'resistor-circuit-hash-111',
      options: [
        { label: '1', textEn: 'Series', textTa: 'Series', isCorrect: true },
        { label: '2', textEn: 'Parallel', textTa: 'Parallel', isCorrect: false },
        { label: '3', textEn: 'Open circuit', textTa: 'Open circuit', isCorrect: false },
        { label: '4', textEn: 'Short circuit', textTa: 'Short circuit', isCorrect: false },
      ],
    };

    const q2Mapped = {
      type: 'SINGLE_CORRECT',
      textEn: 'Identify the structure or arrangement shown in the diagram.',
      textTa: 'படத்தில் காட்டப்பட்டுள்ள அமைப்பை அடையாளம் காண்க.',
      questionImageUrl: '/uploads/question-media/2026/convex-lens.png',
      questionImageHash: 'convex-lens-hash-222',
      options: [
        { label: '1', textEn: 'Convex lens', textTa: 'Convex lens', isCorrect: true },
        { label: '2', textEn: 'Concave lens', textTa: 'Concave lens', isCorrect: false },
        { label: '3', textEn: 'Plane mirror', textTa: 'Plane mirror', isCorrect: false },
        { label: '4', textEn: 'Prism', textTa: 'Prism', isCorrect: false },
      ],
    };

    const fps1 = calculateFingerprints(q1Mapped);
    const fps2 = calculateFingerprints(q2Mapped);

    // Fingerprints MUST differ
    expect(fps1.contentFingerprint).not.toBe(fps2.contentFingerprint);
    expect(fps1.equivalentFingerprint).not.toBe(fps2.equivalentFingerprint);
    expect(fps1.optionsContentFingerprint).not.toBe(fps2.optionsContentFingerprint);
  });
});
