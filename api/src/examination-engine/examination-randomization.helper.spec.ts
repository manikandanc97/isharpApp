import { describe, expect, it } from 'vitest';
import {
  createOptionMappings,
  generateSecureSeed,
  secureShuffle,
} from './examination-randomization.helper.js';

describe('Examination Randomization Helper', () => {
  it('should generate a 32-character hexadecimal secure seed', () => {
    const seed = generateSecureSeed();
    expect(seed).toMatch(/^[0-9a-f]{32}$/);
    const secondSeed = generateSecureSeed();
    expect(seed).not.toBe(secondSeed);
  });

  it('should shuffle array without losing or duplicating elements', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = secureShuffle(original);

    expect(shuffled.length).toBe(original.length);
    expect(new Set(shuffled).size).toBe(original.length);
    expect(shuffled.sort((a, b) => a - b)).toEqual(original);
  });

  it('should create randomized option mappings with correct labels A, B, C, D', () => {
    const options = [
      { id: 'opt-1', position: 1 },
      { id: 'opt-2', position: 2 },
      { id: 'opt-3', position: 3 },
      { id: 'opt-4', position: 4 },
    ];

    const mappings = createOptionMappings(options, true);

    expect(mappings.length).toBe(4);
    const positions = mappings.map((m) => m.shuffledPosition);
    expect(positions.sort()).toEqual([1, 2, 3, 4]);

    const labels = mappings.map((m) => m.displayedLabel);
    expect(labels).toEqual(['A', 'B', 'C', 'D']);

    const canonicalIds = mappings.map((m) => m.canonicalOptionId);
    expect(new Set(canonicalIds).size).toBe(4);
  });

  it('should preserve original order when randomization is disabled', () => {
    const options = [
      { id: 'opt-1', position: 1 },
      { id: 'opt-2', position: 2 },
      { id: 'opt-3', position: 3 },
      { id: 'opt-4', position: 4 },
    ];

    const mappings = createOptionMappings(options, false);
    expect(mappings[0].canonicalOptionId).toBe('opt-1');
    expect(mappings[0].displayedLabel).toBe('A');
    expect(mappings[1].canonicalOptionId).toBe('opt-2');
    expect(mappings[2].canonicalOptionId).toBe('opt-3');
    expect(mappings[3].canonicalOptionId).toBe('opt-4');
  });
});
