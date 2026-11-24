import { randomBytes } from 'node:crypto';

export interface ShuffledOption {
  canonicalOptionId: string;
  shuffledPosition: number;
  displayedLabel: string;
}

export function generateSecureSeed(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Modern Fisher-Yates shuffle using cryptographically secure random values
 */
export function secureShuffle<T>(items: T[]): T[] {
  const result = [...items];
  const bytes = randomBytes(result.length * 2);

  for (let i = result.length - 1; i > 0; i--) {
    const random16 = bytes.readUInt16LE((result.length - 1 - i) * 2);
    const j = random16 % (i + 1);
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

const OPTION_LABELS = ['1', '2', '3', '4', '5', '6'];

/**
 * Creates randomized option mappings for a question's options
 */
export function createOptionMappings(
  options: Array<{ id: string; position: number }>,
  shouldRandomize = true,
): ShuffledOption[] {
  const ordered = shouldRandomize ? secureShuffle(options) : [...options].sort((a, b) => a.position - b.position);

  return ordered.map((opt, index) => ({
    canonicalOptionId: opt.id,
    shuffledPosition: index + 1,
    displayedLabel: OPTION_LABELS[index] || String(index + 1),
  }));
}
