import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { collectEmbeddedImages } from './excel-embedded-images';

describe('collectEmbeddedImages', () => {
  it('maps a picture to its anchored row and image column', () => {
    const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet('Questions'); const headers = ['external_id', 'question_image'];
    sheet.addRow(headers); sheet.addRow(['Q-1', '']);
    const imageId = workbook.addImage({ base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', extension: 'png' });
    sheet.addImage(imageId, 'B2:B2');
    const images = collectEmbeddedImages(workbook, sheet, headers);
    expect(images).toHaveLength(1); expect(images[0]).toMatchObject({ rowNumber: 2, columnName: 'question_image', mimeType: 'image/png' }); expect(images[0].bytes.byteLength).toBeGreaterThan(0);
  });
});
