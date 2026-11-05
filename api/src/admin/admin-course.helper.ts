import { BadRequestException } from '@nestjs/common';

export type ParsedCourseData = {
  code: string;
  title: string;
  description?: string | null;
  isActive?: boolean;
};

export function parseCoursePayload(
  body: unknown,
  creating: boolean,
): ParsedCourseData {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('A course object is required');
  }
  const input = body as Record<string, unknown>;
  const allowed = ['code', 'title', 'description', 'isActive'];
  if (Object.keys(input).some((key) => !allowed.includes(key))) {
    throw new BadRequestException('Unsupported course field');
  }
  const data: {
    code?: string;
    title?: string;
    description?: string | null;
    isActive?: boolean;
  } = {};
  if (creating || 'code' in input) {
    if (
      typeof input.code !== 'string' ||
      !/^[A-Za-z0-9_-]{2,50}$/.test(input.code.trim())
    ) {
      throw new BadRequestException(
        'code must contain 2 to 50 letters, numbers, _ or -',
      );
    }
    data.code = input.code.trim().toUpperCase();
  }
  if (creating || 'title' in input) {
    if (
      typeof input.title !== 'string' ||
      input.title.trim().length < 2 ||
      input.title.trim().length > 200
    ) {
      throw new BadRequestException('title must contain 2 to 200 characters');
    }
    data.title = input.title.trim();
  }
  if ('description' in input) {
    if (input.description !== null && typeof input.description !== 'string') {
      throw new BadRequestException('description must be text or null');
    }
    data.description =
      typeof input.description === 'string'
        ? input.description.trim().slice(0, 4000) || null
        : null;
  }
  if ('isActive' in input) {
    if (typeof input.isActive !== 'boolean') {
      throw new BadRequestException('isActive must be a boolean');
    }
    data.isActive = input.isActive;
  }
  if (!creating && Object.keys(data).length === 0) {
    throw new BadRequestException('At least one course field is required');
  }
  return data as ParsedCourseData;
}

