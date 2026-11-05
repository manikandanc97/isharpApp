import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';

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
  if (!baseUrl || !serviceKey)
    throw new Error('Question media storage is not configured');
  const extension = ({
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  } as Record<string, string>)[file.mimetype];
  const path = `questions/${new Date().getUTCFullYear()}/${randomUUID()}.${extension}`;
  const response = await fetch(
    `${baseUrl}/storage/v1/object/${bucket}/${path}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        'Content-Type': file.mimetype,
        'x-upsert': 'false',
      },
      body: new Uint8Array(file.buffer),
    },
  );
  if (!response.ok)
    throw new BadRequestException('Image storage upload failed');
  return {
    url: `${baseUrl}/storage/v1/object/public/${bucket}/${path}`,
    path,
  };
}

