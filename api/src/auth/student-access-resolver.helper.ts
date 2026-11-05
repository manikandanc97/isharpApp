import type { JWTPayload } from 'jose';
import type { Prisma } from '../generated/prisma/client.js';

export const studentProfileSelect = {
  id: true,
  email: true,
  displayName: true,
  isActive: true,
  userRoles: { select: { role: { select: { name: true } } } },
  institutionMembership: {
    select: {
      id: true,
      studentId: true,
      studentCategory: true,
      paymentStatus: true,
      paidAccessUntil: true,
      trustedRecordId: true,
    },
  },
} as const;

export type ResolvedProfile = Prisma.UserProfileGetPayload<{
  select: typeof studentProfileSelect;
}> | null;

export function cleanEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320
    ? email
    : null;
}

export function externalStudentId(authUserId: string): string {
  return `EXT-${authUserId.toUpperCase()}`;
}

export function extractDisplayName(payload: JWTPayload, email: string): string {
  const metadata = payload.user_metadata;
  if (metadata && typeof metadata === 'object') {
    const record = metadata as Record<string, unknown>;
    const name =
      typeof record.full_name === 'string'
        ? record.full_name
        : typeof record.name === 'string'
          ? record.name
          : '';
    if (name.trim()) return name.trim().slice(0, 150);
  }
  return email.split('@')[0].slice(0, 150);
}

