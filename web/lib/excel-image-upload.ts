import sharp from 'sharp';
import type { EmbeddedExcelImage } from './excel-embedded-images';

export type UploadableExcelImage = Pick<
  EmbeddedExcelImage,
  'bytes' | 'mimeType' | 'extension'
>;

export async function prepareEmbeddedImageForUpload(
  image: EmbeddedExcelImage,
): Promise<UploadableExcelImage> {
  if (image.extension !== 'svg') return image;

  const png = await sharp(Buffer.from(image.bytes), {
    density: 144,
    limitInputPixels: 16_000_000,
  })
    .png({ compressionLevel: 9 })
    .toBuffer();

  if (!png.byteLength || png.byteLength > 5 * 1024 * 1024)
    throw new Error(`Rasterized image at row ${image.rowNumber} exceeds 5 MB`);

  return {
    bytes: new Uint8Array(png),
    mimeType: 'image/png',
    extension: 'png',
  };
}
