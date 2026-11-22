import type ExcelJS from 'exceljs';
import './excel-patch';

export type EmbeddedExcelImage = {
  rowNumber: number;
  columnName: string;
  bytes: Uint8Array;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/svg+xml';
  extension: 'jpg' | 'png' | 'webp' | 'svg';
};

function assertSafeSvg(bytes: Uint8Array, rowNumber: number) {
  const source = Buffer.from(bytes).toString('utf8');
  const unsafe =
    !/<svg\b/i.test(source) ||
    /<!doctype|<!entity|<script\b|<foreignObject\b|<iframe\b|<object\b|<embed\b|<image\b|@import/i.test(source) ||
    /\son[a-z]+\s*=/i.test(source) ||
    /(?:href|xlink:href)\s*=\s*["'](?!#)/i.test(source) ||
    /url\(\s*["']?(?!#)/i.test(source);
  if (unsafe)
    throw new Error(`Embedded SVG at row ${rowNumber} contains unsupported external or active content`);
}

export function collectEmbeddedImages(
  workbook: ExcelJS.Workbook,
  sheet: ExcelJS.Worksheet,
  headers: string[],
): EmbeddedExcelImage[] {
  const result: EmbeddedExcelImage[] = [];
  const rawImages = typeof sheet.getImages === 'function' ? sheet.getImages() : [];

  for (const { imageId, range } of rawImages) {
    if (!range || !range.tl) continue;
    const anchor = range.tl as { col?: number; row?: number; nativeCol?: number; nativeRow?: number };
    const rawCol = typeof anchor.nativeCol === 'number' ? anchor.nativeCol : anchor.col;
    const rawRow = typeof anchor.nativeRow === 'number' ? anchor.nativeRow : anchor.row;
    if (typeof rawCol !== 'number' || typeof rawRow !== 'number') continue;
    const colIdx = Math.floor(rawCol);
    const rowIdx = Math.floor(rawRow);
    const columnName = headers[colIdx];
    const rowNumber = rowIdx + 1;
    if (!columnName || rowNumber < 2) continue;
    const image = workbook.getImage(Number(imageId));
    if (!image) continue;
    const ext = String(image.extension || '').toLowerCase();
    if (!['jpeg', 'jpg', 'png', 'webp', 'svg'].includes(ext)) continue;
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
    // Skip 1x1 transparent dummy pixels (usually <= 100 bytes)
    if (bytes.byteLength <= 100) continue;
    if (bytes.byteLength > 5 * 1024 * 1024)
      throw new Error(`Embedded image at row ${rowNumber} exceeds 5 MB`);

    if (ext === 'svg') assertSafeSvg(bytes, rowNumber);

    const mimeType = ext === 'png'
      ? 'image/png'
      : ext === 'webp'
        ? 'image/webp'
        : ext === 'svg'
          ? 'image/svg+xml'
          : 'image/jpeg';
    const extension = ext === 'png' ? 'png' : ext === 'webp' ? 'webp' : ext === 'svg' ? 'svg' : 'jpg';

    result.push({
      rowNumber,
      columnName,
      bytes,
      mimeType,
      extension,
    });
  }

  return result;
}
