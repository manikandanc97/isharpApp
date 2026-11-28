const LETTER_TO_POSITION: Record<string, string> = {
  A: '1',
  B: '2',
  C: '3',
  D: '4',
  E: '5',
  F: '6',
};

/**
 * Normalizes option labels (`A..F` or `1..6`) to canonical numeric string (`1..6`).
 */
export function normalizeOptionLabel(label: string | null | undefined): string {
  const normalized = (label ?? '').trim().toUpperCase();
  return LETTER_TO_POSITION[normalized] ?? normalized;
}
