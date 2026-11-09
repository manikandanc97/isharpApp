import type { JWTPayload } from 'jose';
import type { Prisma } from '../generated/prisma/client.js';

export const studentProfileSelect = {
  id: true,
  email: true,
  phone: true,
  displayName: true,
  isActive: true,
  userRoles: { select: { role: { select: { name: true } } } },
  institutionMembership: {
    select: {
      id: true,
      studentId: true,
      status: true,
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

export function cleanPhone(payload: JWTPayload): string | null {
  const metadata =
    payload.user_metadata && typeof payload.user_metadata === 'object'
      ? (payload.user_metadata as Record<string, unknown>)
      : null;
  const value =
    typeof payload.phone === 'string'
      ? payload.phone
      : typeof metadata?.phone === 'string'
        ? metadata.phone
        : null;
  if (!value) return null;
  const normalized = value.trim().replace(/[\s()-]/g, '');
  return /^\+?[0-9]{8,15}$/.test(normalized) ? normalized : null;
}

export function extractDisplayName(
  payload: JWTPayload,
  identifier: string,
): string {
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
  return identifier.split('@')[0].slice(0, 150);
}
