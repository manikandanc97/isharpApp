import type ExcelJS from 'exceljs';
import '@/lib/excel-patch';

export type EmbeddedExcelImage = {
  rowNumber: number;
  columnName: string;
  bytes: Uint8Array;
  mimeType: 'image/jpeg' | 'image/png';
  extension: 'jpg' | 'png';
};

export function collectEmbeddedImages(
  workbook: ExcelJS.Workbook,
  sheet: ExcelJS.Worksheet,
  headers: string[],
): EmbeddedExcelImage[] {
  const result: EmbeddedExcelImage[] = [];
  const rawImages = typeof sheet.getImages === 'function' ? sheet.getImages() : [];

  for (const { imageId, range } of rawImages) {
    if (!range || !range.tl) continue;
    const colIdx =
      typeof range.tl.nativeCol === 'number'
        ? range.tl.nativeCol
        : (range.tl as any).col;
    const rowIdx =
      typeof range.tl.nativeRow === 'number'
        ? range.tl.nativeRow
        : (range.tl as any).row;
    if (typeof colIdx !== 'number' || typeof rowIdx !== 'number') continue;
    const columnName = headers[colIdx];
    const rowNumber = rowIdx + 1;
    if (!columnName || rowNumber < 2) continue;
    const image = workbook.getImage(Number(imageId));
    if (!image || !['jpeg', 'png'].includes(image.extension)) continue;
    const bytes: Uint8Array | null = image.buffer
      ? new Uint8Array(image.buffer)
      : image.base64
        ? Uint8Array.from(
            Buffer.from(
              image.base64.replace(/^data:[^;]+;base64,/, ''),
              'base64',
            ),
          )
        : null;
    if (!bytes?.byteLength) continue;
    if (bytes.byteLength > 5 * 1024 * 1024)
      throw new Error(`Embedded image at row ${rowNumber} exceeds 5 MB`);

    result.push({
      rowNumber,
      columnName,
      bytes,
      mimeType: image.extension === 'jpeg' ? 'image/jpeg' : 'image/png',
      extension: image.extension === 'jpeg' ? 'jpg' : 'png',
    });
  }

  return result;
}
