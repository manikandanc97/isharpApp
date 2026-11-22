import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { collectEmbeddedImages } from './excel-embedded-images';

describe('collectEmbeddedImages', () => {
  it('maps a picture to its anchored row and image column', () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Questions');
    const headers = ['external_id', 'question_image'];
    sheet.addRow(headers);
    sheet.addRow(['Q-1', '']);
    // Valid PNG with test payload (> 100 bytes)
    const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGNgAAAAAgAB4iG8MwAAACB0RVh0Q29tbWVudABUZXN0IGVtYmVkZGVkIGltYWdlIHBheWxvYWQgZGF0YUKie4cAAAAASUVORK5CYII=';
    const imageId = workbook.addImage({ base64: validPngBase64, extension: 'png' });
    sheet.addImage(imageId, 'B2:B2');
    const images = collectEmbeddedImages(workbook, sheet, headers);
    expect(images).toHaveLength(1);
    expect(images[0]).toMatchObject({ rowNumber: 2, columnName: 'question_image', mimeType: 'image/png' });
    expect(images[0].bytes.byteLength).toBeGreaterThan(0);
  });

  it('filters out tiny dummy 1x1 placeholder pixels (<= 100 bytes)', () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Questions');
    const headers = ['external_id', 'question_image'];
    sheet.addRow(headers);
    sheet.addRow(['Q-1', '']);
    // 68-byte 1x1 transparent PNG placeholder
    const dummy1x1Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const imageId = workbook.addImage({ base64: dummy1x1Base64, extension: 'png' });
    sheet.addImage(imageId, 'B2:B2');
    const images = collectEmbeddedImages(workbook, sheet, headers);
    expect(images).toHaveLength(0);
  });

  it('accepts a passive embedded SVG for later PNG rasterization', () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Questions');
    const headers = ['external_id', 'question_image'];
    sheet.addRow(headers);
    sheet.addRow(['Q-1', '']);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="190" height="110" viewBox="0 0 190 110"><rect width="190" height="110" fill="white"/><path d="M10 10 L180 100" stroke="#173b67" stroke-width="3"/></svg>';
    const imageId = workbook.addImage({
      base64: Buffer.from(svg).toString('base64'),
      // ExcelJS can read SVG media but its public addImage type is narrower.
      extension: 'svg' as 'png',
    });
    sheet.addImage(imageId, 'B2:B2');

    const images = collectEmbeddedImages(workbook, sheet, headers);

    expect(images).toHaveLength(1);
    expect(images[0]).toMatchObject({
      rowNumber: 2,
      columnName: 'question_image',
      mimeType: 'image/svg+xml',
      extension: 'svg',
    });
  });

  it('rejects active content in an embedded SVG', () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Questions');
    const headers = ['external_id', 'question_image'];
    sheet.addRow(headers);
    sheet.addRow(['Q-1', '']);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="190" height="110"><rect width="190" height="110"/><script>alert("unsafe")</script></svg>';
    const imageId = workbook.addImage({
      base64: Buffer.from(svg).toString('base64'),
      extension: 'svg' as 'png',
    });
    sheet.addImage(imageId, 'B2:B2');

    expect(() => collectEmbeddedImages(workbook, sheet, headers)).toThrow(
      'contains unsupported external or active content',
    );
  });
});
