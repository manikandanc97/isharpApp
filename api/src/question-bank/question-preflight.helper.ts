import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { obj, str } from './question-validation.helper.js';

export async function runImportPreflight(
  prisma: PrismaService,
  body: unknown,
) {
  const values = obj(body).externalIds;
  if (!Array.isArray(values) || values.length > 500)
    throw new BadRequestException('externalIds must contain up to 500 items');
  const externalIds = values
    .map((value) => str(value, 'externalId', false, 64))
    .filter((value): value is string => Boolean(value));
  const unique = [
    ...new Map(
      externalIds.map((value) => [value.toLocaleLowerCase('en-US'), value]),
    ).values(),
  ];
  if (!unique.length) return { existingExternalIds: [] };
  const existing = await prisma.question.findMany({
    where: {
      externalId: { in: unique },
    },
    select: { externalId: true },
  });
  return { existingExternalIds: existing.map((item) => item.externalId) };
}

