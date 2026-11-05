import { BadRequestException } from '@nestjs/common';

export type Data = Record<string, unknown>;

export const TYPES = ['SINGLE_CORRECT', 'MULTIPLE_CORRECT', 'NUMERICAL'] as const;
export const LANGUAGES = ['ENGLISH', 'TAMIL', 'BILINGUAL'] as const;
export const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;
export const NEET_SUBJECTS = ['PHYSICS', 'CHEMISTRY', 'BIOLOGY'];

export function obj(value: unknown): Data {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new BadRequestException('Invalid request body');
  return value as Data;
}

export function str(
  value: unknown,
  name: string,
  required = false,
  max = 20_000,
) {
  const result = typeof value === 'string' ? value.trim() : '';
  if (required && !result) throw new BadRequestException(`${name} is required`);
  if (result.length > max) throw new BadRequestException(`${name} is too long`);
  return result || null;
}

export function enumValue<T extends readonly string[]>(
  value: unknown,
  values: T,
  fallback: T[number],
): T[number] {
  const result =
    typeof value === 'string' ? value.trim().toUpperCase() : fallback;
  if (!values.includes(result as T[number]))
    throw new BadRequestException(`Invalid value: ${result}`);
  return result as T[number];
}

export function int(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  const result =
    value === undefined || value === null || value === ''
      ? fallback
      : Number(value);
  if (!Number.isInteger(result) || result < min || result > max)
    throw new BadRequestException(`Number must be between ${min} and ${max}`);
  return result;
}

export function httpUrl(value: unknown, name: string) {
  const result = str(value, name, false, 2_000);
  if (!result) return null;
  try {
    if (!['http:', 'https:'].includes(new URL(result).protocol))
      throw new Error();
  } catch {
    throw new BadRequestException(`${name} must be an HTTP(S) URL`);
  }
  return result;
}

export function isUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return 'code' in error && error.code === 'P2002';
}

export function isTransactionConflict(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) return false;
  return error.code === 'P2034';
}

