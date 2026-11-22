import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { collectEmbeddedImages } from './excel-embedded-images';
import { prepareEmbeddedImageForUpload } from './excel-image-upload';

describe('prepareEmbeddedImageForUpload', () => {
  it('rasterizes an Excel SVG diagram to a real PNG', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Questions');
    const headers = ['external_id', 'question_image'];
    sheet.addRow(headers);
    sheet.addRow(['Q-1', '']);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="190" height="110" viewBox="0 0 190 110"><rect width="190" height="110" fill="white"/><circle cx="95" cy="55" r="40" fill="none" stroke="#173b67" stroke-width="3"/></svg>';
    const imageId = workbook.addImage({
      base64: Buffer.from(svg).toString('base64'),
      extension: 'svg' as 'png',
    });
    sheet.addImage(imageId, 'B2:B2');
    const [image] = collectEmbeddedImages(workbook, sheet, headers);

    const result = await prepareEmbeddedImageForUpload(image);

    expect(result.mimeType).toBe('image/png');
    expect(result.extension).toBe('png');
    expect(Buffer.from(result.bytes).subarray(0, 8)).toEqual(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
    expect(result.bytes.byteLength).toBeGreaterThan(100);
  });
});
