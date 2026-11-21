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
});
