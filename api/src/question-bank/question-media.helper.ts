import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export async function uploadQuestionImage(
  config: ConfigService,
  file?: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
  },
) {
  if (!file) throw new BadRequestException('Image file is required');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
    throw new BadRequestException('Only JPG, PNG and WebP images are allowed');
  if (file.size > 5 * 1024 * 1024)
    throw new BadRequestException('Image must be 5 MB or smaller');

  const baseUrl = config.get<string>('SUPABASE_URL')?.replace(/\/$/, '');
  const serviceKey = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
  const bucket =
    config.get<string>('QUESTION_MEDIA_BUCKET')?.trim() || 'question-media';

  const extension = ({
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  } as Record<string, string>)[file.mimetype] || 'png';

  const year = new Date().getUTCFullYear();
  const fileId = randomUUID();
  const pathPart = `questions/${year}/${fileId}.${extension}`;

  // 1. Try Supabase storage if configured
  if (baseUrl && serviceKey) {
    try {
      const response = await fetch(
        `${baseUrl}/storage/v1/object/${bucket}/${pathPart}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            apikey: serviceKey,
            'Content-Type': file.mimetype,
            'x-upsert': 'false',
          },
          body: new Uint8Array(file.buffer),
          signal: AbortSignal.timeout(4000),
        },
      );
      if (response.ok) {
        return {
          url: `${baseUrl}/storage/v1/object/public/${bucket}/${pathPart}`,
          path: pathPart,
        };
      }
    } catch {
      // Supabase storage unavailable/timeout, fallback to local storage
    }
  }

  // 2. Fallback: Save to local public/uploads directory
  try {
    const candidateDirs = [
      path.resolve(process.cwd(), '..', 'web', 'public', 'uploads', 'question-media', String(year)),
      path.resolve(process.cwd(), 'public', 'uploads', 'question-media', String(year)),
    ];

    for (const dir of candidateDirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
        const filePath = path.join(dir, `${fileId}.${extension}`);
        await fs.writeFile(filePath, file.buffer);
        return {
          url: `/uploads/question-media/${year}/${fileId}.${extension}`,
          path: pathPart,
        };
      } catch {
        continue;
      }
    }
  } catch {
    // Continue to data URL fallback
  }

  // 3. Ultimate fallback: data URL so image is never lost and questions can always be saved
  return {
    url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
    path: pathPart,
  };
}
