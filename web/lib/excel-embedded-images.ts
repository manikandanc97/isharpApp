import type ExcelJS from 'exceljs';

export type EmbeddedExcelImage = {
  rowNumber: number;
  columnName: string;
  bytes: Uint8Array;
  mimeType: 'image/jpeg' | 'image/png';
  extension: 'jpg' | 'png';
};

export function collectEmbeddedImages(workbook: ExcelJS.Workbook, sheet: ExcelJS.Worksheet, headers: string[]): EmbeddedExcelImage[] {
  return sheet.getImages().map(({ imageId, range }) => {
    const columnName = headers[range.tl.nativeCol];
    const rowNumber = range.tl.nativeRow + 1;
    if (!columnName || rowNumber < 2) throw new Error('An embedded image is outside the question data rows');
    const image = workbook.getImage(Number(imageId));
    if (!image || !['jpeg', 'png'].includes(image.extension)) throw new Error(`Embedded image at row ${rowNumber} must be JPG or PNG`);
    const bytes = image.buffer ? new Uint8Array(image.buffer) : image.base64 ? Uint8Array.from(Buffer.from(image.base64.replace(/^data:[^;]+;base64,/, ''), 'base64')) : null;
    if (!bytes?.byteLength) throw new Error(`Embedded image at row ${rowNumber} could not be read`);
    if (bytes.byteLength > 5 * 1024 * 1024) throw new Error(`Embedded image at row ${rowNumber} exceeds 5 MB`);
    return { rowNumber, columnName, bytes, mimeType: image.extension === 'jpeg' ? 'image/jpeg' : 'image/png', extension: image.extension === 'jpeg' ? 'jpg' : 'png' };
  });
}
