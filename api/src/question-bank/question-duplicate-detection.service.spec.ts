import { describe, expect, it } from 'vitest';
import {
  hashImageBytes,
  normalizeNumericalAnswer,
  normalizeText,
  QuestionDuplicateDetectionService,
} from './question-duplicate-detection.service.js';

describe('QuestionDuplicateDetectionService & Normalization', () => {
  const service = new QuestionDuplicateDetectionService();

  describe('Text normalization', () => {
    it('normalizes harmless whitespace but preserves case and scientific notation', () => {
      const text1 = '  Calculate the   pH of 0.1 M   NaCl solution at 25 °C.  ';
      const text2 = 'Calculate the pH of 0.1 M NaCl solution at 25 °C.';
      expect(normalizeText(text1)).toBe(normalizeText(text2));

      // Case sensitive distinction preserved
      expect(normalizeText('NaCl')).not.toBe(normalizeText('nacl'));
      expect(normalizeText('CO2')).not.toBe(normalizeText('co2'));
      expect(normalizeText('pH')).not.toBe(normalizeText('ph'));
    });

    it('preserves unicode characters, greek letters, superscripts and subscripts', () => {
      const q = 'Determine the value of α + β² - γ₃ ≥ 0';
      expect(normalizeText(q)).toBe('Determine the value of α + β² - γ₃ ≥ 0');
    });

    it('normalizes null or whitespace to null', () => {
      expect(normalizeText(null)).toBeNull();
      expect(normalizeText(undefined)).toBeNull();
      expect(normalizeText('   ')).toBeNull();
    });
  });

  describe('Numerical answer normalization', () => {
    it('preserves precision while trimming safe whitespace', () => {
      expect(normalizeNumericalAnswer('  12.50  ')).toBe('12.50');
      expect(normalizeNumericalAnswer('+12.5')).toBe('12.5');
      expect(normalizeNumericalAnswer('12.5')).not.toBe(
        normalizeNumericalAnswer('12.8'),
      );
    });
  });

  describe('Image hashing & SVG normalization', () => {
    it('hashes identical raster image bytes to identical hash regardless of filename or URL', () => {
      const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const hash1 = hashImageBytes(bytes, 'image/png');
      const hash2 = hashImageBytes(new Uint8Array(bytes), 'image/png');
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('normalizes SVG whitespace and comments but preserves geometry and text', () => {
      const svg1 = `<?xml version="1.0"?>
<!-- Diagram of circuit -->
<svg width="100" height="100">
  <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
</svg>`;
      const svg2 = `
<svg width="100" height="100">
  <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
</svg>`;
      const hash1 = hashImageBytes(Buffer.from(svg1), 'image/svg+xml');
      const hash2 = hashImageBytes(Buffer.from(svg2), 'image/svg+xml');
      expect(hash1).toBe(hash2);

      // Different diagram content produces different hash
      const svgDifferent = `
<svg width="100" height="100">
  <circle cx="50" cy="50" r="20" stroke="green" stroke-width="4" fill="yellow" />
</svg>`;
      expect(hashImageBytes(Buffer.from(svgDifferent), 'image/svg+xml')).not.toBe(
        hash1,
      );
    });
  });

  describe('Fingerprint Generation & Scenarios', () => {
    // Scenario 1: Completely identical question and options
    it('Scenario 1: generates identical fingerprints for completely identical question and options', () => {
      const q1 = {
        type: 'SINGLE_CORRECT',
        textEn: 'What is the speed of light in vacuum?',
        options: [
          { textEn: '3 x 10^8 m/s', isCorrect: true },
          { textEn: '3 x 10^6 m/s', isCorrect: false },
        ],
      };
      const q2 = {
        type: 'SINGLE_CORRECT',
        textEn: '  What is the speed of light in vacuum? ',
        options: [
          { textEn: '3 x 10^8 m/s', isCorrect: true },
          { textEn: '3 x 10^6 m/s', isCorrect: false },
        ],
      };
      const fp1 = service.calculateFingerprints(q1);
      const fp2 = service.calculateFingerprints(q2);
      expect(fp1.contentFingerprint).toBe(fp2.contentFingerprint);
      expect(fp1.equivalentFingerprint).toBe(fp2.equivalentFingerprint);
    });

    // Scenario 2: Same question with different options
    it('Scenario 2: generates different fingerprints for same question with different options', () => {
      const q1 = {
        type: 'SINGLE_CORRECT',
        textEn: 'Which is an inert gas?',
        options: [
          { textEn: 'Helium', isCorrect: true },
          { textEn: 'Oxygen', isCorrect: false },
        ],
      };
      const q2 = {
        type: 'SINGLE_CORRECT',
        textEn: 'Which is an inert gas?',
        options: [
          { textEn: 'Argon', isCorrect: true },
          { textEn: 'Nitrogen', isCorrect: false },
        ],
      };
      const fp1 = service.calculateFingerprints(q1);
      const fp2 = service.calculateFingerprints(q2);
      expect(fp1.contentFingerprint).not.toBe(fp2.contentFingerprint);
      expect(fp1.equivalentFingerprint).not.toBe(fp2.equivalentFingerprint);
    });

    // Scenario 3: Same question/options with different correct answers
    it('Scenario 3: flags same question/options with different answers (optionsContentFingerprint matches but contentFingerprint differs)', () => {
      const q1 = {
        type: 'SINGLE_CORRECT',
        textEn: 'Is zero an even number?',
        options: [
          { textEn: 'Yes', isCorrect: true },
          { textEn: 'No', isCorrect: false },
        ],
      };
      const q2 = {
        type: 'SINGLE_CORRECT',
        textEn: 'Is zero an even number?',
        options: [
          { textEn: 'Yes', isCorrect: false },
          { textEn: 'No', isCorrect: true },
        ],
      };
      const fp1 = service.calculateFingerprints(q1);
      const fp2 = service.calculateFingerprints(q2);
      // Content fingerprints must NOT match
      expect(fp1.contentFingerprint).not.toBe(fp2.contentFingerprint);
      expect(fp1.equivalentFingerprint).not.toBe(fp2.equivalentFingerprint);
      // But option multiset fingerprints MATCH (indicating an answer conflict!)
      expect(fp1.optionsContentFingerprint).toBe(fp2.optionsContentFingerprint);
    });

    // Scenario 4: Same question with different question images
    it('Scenario 4: generates different fingerprints for same question with different question images', () => {
      const q1 = {
        type: 'SINGLE_CORRECT',
        textEn: 'Identify the circuit component in the diagram:',
        questionImageHash: 'hash-resistor-1234',
        options: [
          { textEn: 'Resistor', isCorrect: true },
          { textEn: 'Capacitor', isCorrect: false },
        ],
      };
      const q2 = {
        type: 'SINGLE_CORRECT',
        textEn: 'Identify the circuit component in the diagram:',
        questionImageHash: 'hash-capacitor-5678',
        options: [
          { textEn: 'Resistor', isCorrect: true },
          { textEn: 'Capacitor', isCorrect: false },
        ],
      };
      const fp1 = service.calculateFingerprints(q1);
      const fp2 = service.calculateFingerprints(q2);
      expect(fp1.contentFingerprint).not.toBe(fp2.contentFingerprint);
    });

    // Scenario 5: Same option text with different option images
    it('Scenario 5: generates different fingerprints for same option text with different option images', () => {
      const q1 = {
        type: 'SINGLE_CORRECT',
        textEn: 'Which graph represents linear motion?',
        options: [
          { textEn: 'Graph A', imageHash: 'graph-linear-1111', isCorrect: true },
          { textEn: 'Graph B', imageHash: 'graph-curve-2222', isCorrect: false },
        ],
      };
      const q2 = {
        type: 'SINGLE_CORRECT',
        textEn: 'Which graph represents linear motion?',
        options: [
          { textEn: 'Graph A', imageHash: 'graph-parabolic-3333', isCorrect: true },
          { textEn: 'Graph B', imageHash: 'graph-curve-2222', isCorrect: false },
        ],
      };
      const fp1 = service.calculateFingerprints(q1);
      const fp2 = service.calculateFingerprints(q2);
      expect(fp1.contentFingerprint).not.toBe(fp2.contentFingerprint);
    });

    // Scenario 11 & 12: Reordered options with correctly and incorrectly remapped answers
    it('Scenario 11: detects Level B equivalent duplicate when options are reordered and answer is remapped', () => {
      // Question 1: A: Apple, B: Mango (Correct), C: Orange, D: Banana
      const q1 = {
        type: 'SINGLE_CORRECT',
        textEn: 'Pick the national fruit of India:',
        options: [
          { textEn: 'Apple', isCorrect: false },
          { textEn: 'Mango', isCorrect: true },
          { textEn: 'Orange', isCorrect: false },
          { textEn: 'Banana', isCorrect: false },
        ],
      };
      // Question 2: A: Banana, B: Orange, C: Mango (Correct), D: Apple
      const q2 = {
        type: 'SINGLE_CORRECT',
        textEn: 'Pick the national fruit of India:',
        options: [
          { textEn: 'Banana', isCorrect: false },
          { textEn: 'Orange', isCorrect: false },
          { textEn: 'Mango', isCorrect: true },
          { textEn: 'Apple', isCorrect: false },
        ],
      };
      const fp1 = service.calculateFingerprints(q1);
      const fp2 = service.calculateFingerprints(q2);

      // Exact fingerprints differ because option order changed
      expect(fp1.contentFingerprint).not.toBe(fp2.contentFingerprint);
      // Equivalent fingerprints MATCH because Mango is the correct answer in both!
      expect(fp1.equivalentFingerprint).toBe(fp2.equivalentFingerprint);
    });

    it('Scenario 12: rejects equivalence when options are reordered but answer is incorrectly remapped', () => {
      const q1 = {
        type: 'SINGLE_CORRECT',
        textEn: 'Pick the national fruit of India:',
        options: [
          { textEn: 'Apple', isCorrect: false },
          { textEn: 'Mango', isCorrect: true },
          { textEn: 'Orange', isCorrect: false },
        ],
      };
      // In Question 2, Orange is mistakenly marked correct
      const q2 = {
        type: 'SINGLE_CORRECT',
        textEn: 'Pick the national fruit of India:',
        options: [
          { textEn: 'Orange', isCorrect: true },
          { textEn: 'Mango', isCorrect: false },
          { textEn: 'Apple', isCorrect: false },
        ],
      };
      const fp1 = service.calculateFingerprints(q1);
      const fp2 = service.calculateFingerprints(q2);

      expect(fp1.contentFingerprint).not.toBe(fp2.contentFingerprint);
      expect(fp1.equivalentFingerprint).not.toBe(fp2.equivalentFingerprint);
      // Options are the same, answer conflict is detected
      expect(fp1.optionsContentFingerprint).toBe(fp2.optionsContentFingerprint);
    });

    // Scenario 13: Multiple-correct questions
    it('Scenario 13: handles multiple-correct questions accurately', () => {
      const q1 = {
        type: 'MULTIPLE_CORRECT',
        textEn: 'Select prime numbers:',
        options: [
          { textEn: '2', isCorrect: true },
          { textEn: '3', isCorrect: true },
          { textEn: '4', isCorrect: false },
          { textEn: '5', isCorrect: true },
        ],
      };
      // Permuted order with same subset correct
      const q2 = {
        type: 'MULTIPLE_CORRECT',
        textEn: 'Select prime numbers:',
        options: [
          { textEn: '4', isCorrect: false },
          { textEn: '5', isCorrect: true },
          { textEn: '2', isCorrect: true },
          { textEn: '3', isCorrect: true },
        ],
      };
      const fp1 = service.calculateFingerprints(q1);
      const fp2 = service.calculateFingerprints(q2);

      expect(fp1.contentFingerprint).not.toBe(fp2.contentFingerprint);
      expect(fp1.equivalentFingerprint).toBe(fp2.equivalentFingerprint);
    });

    // Scenario 14: Numerical questions with different values
    it('Scenario 14: numerical questions with different values produce different fingerprints', () => {
      const q1 = {
        type: 'NUMERICAL',
        textEn: 'Calculate the acceleration due to gravity in m/s^2:',
        numericalAnswer: '9.8',
      };
      const q2 = {
        type: 'NUMERICAL',
        textEn: 'Calculate the acceleration due to gravity in m/s^2:',
        numericalAnswer: '9.81',
      };
      const fp1 = service.calculateFingerprints(q1);
      const fp2 = service.calculateFingerprints(q2);

      expect(fp1.contentFingerprint).not.toBe(fp2.contentFingerprint);
      expect(fp1.equivalentFingerprint).not.toBe(fp2.equivalentFingerprint);
    });

    // Scenario 15: English / Tamil bilingual questions
    it('Scenario 15: bilingual questions match only when both language texts match', () => {
      const q1 = {
        type: 'SINGLE_CORRECT',
        textEn: 'What is water?',
        textTa: 'தண்ணீர் என்றால் என்ன?',
        options: [
          { textEn: 'Liquid', textTa: 'திரவம்', isCorrect: true },
          { textEn: 'Solid', textTa: 'திடம்', isCorrect: false },
        ],
      };
      const q2 = {
        type: 'SINGLE_CORRECT',
        textEn: 'What is water?',
        textTa: 'தண்ணீர் என்றால் என்ன?',
        options: [
          { textEn: 'Liquid', textTa: 'திரவம்', isCorrect: true },
          { textEn: 'Solid', textTa: 'திடம்', isCorrect: false },
        ],
      };
      const qDifferentTamil = {
        type: 'SINGLE_CORRECT',
        textEn: 'What is water?',
        textTa: 'நீர் என்றால் என்ன?',
        options: [
          { textEn: 'Liquid', textTa: 'திரவம்', isCorrect: true },
          { textEn: 'Solid', textTa: 'திடம்', isCorrect: false },
        ],
      };
      const fp1 = service.calculateFingerprints(q1);
      const fp2 = service.calculateFingerprints(q2);
      const fp3 = service.calculateFingerprints(qDifferentTamil);

      expect(fp1.contentFingerprint).toBe(fp2.contentFingerprint);
      expect(fp1.contentFingerprint).not.toBe(fp3.contentFingerprint);
    });

    // Scenario 16: Image-only questions
    it('Scenario 16: image-only questions with no text match on image hash', () => {
      const q1 = {
        type: 'SINGLE_CORRECT',
        textEn: null,
        textTa: null,
        questionImageHash: 'sha256-diagram-xyz',
        options: [
          { textEn: 'Option 1', isCorrect: true },
          { textEn: 'Option 2', isCorrect: false },
        ],
      };
      const q2 = {
        type: 'SINGLE_CORRECT',
        textEn: null,
        textTa: null,
        questionImageHash: 'sha256-diagram-xyz',
        options: [
          { textEn: 'Option 1', isCorrect: true },
          { textEn: 'Option 2', isCorrect: false },
        ],
      };
      const fp1 = service.calculateFingerprints(q1);
      const fp2 = service.calculateFingerprints(q2);

      expect(fp1.contentFingerprint).toBe(fp2.contentFingerprint);
    });

    // Scenario 17: Image-only options
    it('Scenario 17: image-only options with no text match on option image hash', () => {
      const q1 = {
        type: 'SINGLE_CORRECT',
        textEn: 'Select the correct molecular structure:',
        options: [
          { textEn: null, imageHash: 'mol-structure-A-hash', isCorrect: true },
          { textEn: null, imageHash: 'mol-structure-B-hash', isCorrect: false },
        ],
      };
      const q2 = {
        type: 'SINGLE_CORRECT',
        textEn: 'Select the correct molecular structure:',
        options: [
          { textEn: null, imageHash: 'mol-structure-A-hash', isCorrect: true },
          { textEn: null, imageHash: 'mol-structure-B-hash', isCorrect: false },
        ],
      };
      const fp1 = service.calculateFingerprints(q1);
      const fp2 = service.calculateFingerprints(q2);

      expect(fp1.contentFingerprint).toBe(fp2.contentFingerprint);
    });

    // Scenario 18: Missing or unreadable image marks comparison as unverified
    it('Scenario 18: unreadable image is flagged in fingerprints as unverifiedImages', () => {
      const q = {
        type: 'SINGLE_CORRECT',
        textEn: 'Refer to the diagram above:',
        questionImageUrl: 'https://storage.example.com/unreachable-image.png',
        questionImageHash: null,
        options: [
          { textEn: 'A', isCorrect: true },
          { textEn: 'B', isCorrect: false },
        ],
      };
      const fp = service.calculateFingerprints(q);
      expect(fp.unresolvedImages).toBe(true);
    });

    // Scenario 19: Diagram questions with identical prompt text but different diagrams or options
    it('Scenario 19: does NOT detect duplicate when diagram questions share identical prompt text but have different diagrams/options', () => {
      const qCircuit = {
        type: 'SINGLE_CORRECT',
        textEn: 'Identify the structure or arrangement shown in the diagram.',
        textTa: 'படத்தில் காட்டப்பட்டுள்ள அமைப்பை அடையாளம் காண்க.',
        questionImageUrl: '/uploads/question-media/2026/circuit.png',
        questionImageHash: 'circuit-diagram-hash-abc',
        options: [
          { textEn: 'Series', textTa: 'Series', isCorrect: true },
          { textEn: 'Parallel', textTa: 'Parallel', isCorrect: false },
          { textEn: 'Open circuit', textTa: 'Open circuit', isCorrect: false },
          { textEn: 'Short circuit', textTa: 'Short circuit', isCorrect: false },
        ],
      };

      const qLens = {
        type: 'SINGLE_CORRECT',
        textEn: 'Identify the structure or arrangement shown in the diagram.',
        textTa: 'படத்தில் காட்டப்பட்டுள்ள அமைப்பை அடையாளம் காண்க.',
        questionImageUrl: '/uploads/question-media/2026/lens.png',
        questionImageHash: 'lens-diagram-hash-xyz',
        options: [
          { textEn: 'Convex lens', textTa: 'Convex lens', isCorrect: true },
          { textEn: 'Concave lens', textTa: 'Concave lens', isCorrect: false },
          { textEn: 'Plane mirror', textTa: 'Plane mirror', isCorrect: false },
          { textEn: 'Prism', textTa: 'Prism', isCorrect: false },
        ],
      };

      const fpCircuit = service.calculateFingerprints(qCircuit);
      const fpLens = service.calculateFingerprints(qLens);

      expect(fpCircuit.contentFingerprint).not.toBe(fpLens.contentFingerprint);
      expect(fpCircuit.equivalentFingerprint).not.toBe(fpLens.equivalentFingerprint);
      expect(fpCircuit.optionsContentFingerprint).not.toBe(fpLens.optionsContentFingerprint);
    });

    // Scenario 20: Diagram fallback to imageUrl when hash is null prevents false duplicate collision
    it('Scenario 20: falls back to imageUrl when imageHash is null to keep distinct diagram questions separate', () => {
      const q1 = {
        type: 'SINGLE_CORRECT',
        textEn: 'Identify the structure or arrangement shown in the diagram.',
        questionImageUrl: '/uploads/question-media/2026/diagram-A.png',
        options: [{ textEn: 'Choice 1', isCorrect: true }],
      };
      const q2 = {
        type: 'SINGLE_CORRECT',
        textEn: 'Identify the structure or arrangement shown in the diagram.',
        questionImageUrl: '/uploads/question-media/2026/diagram-B.png',
        options: [{ textEn: 'Choice 1', isCorrect: true }],
      };

      const fp1 = service.calculateFingerprints(q1);
      const fp2 = service.calculateFingerprints(q2);

      expect(fp1.contentFingerprint).not.toBe(fp2.contentFingerprint);
    });
  });

  describe('Bounded imageHashCache & SSRF protection', () => {
    it('caches image hashes with ETag revalidation, evicts LRU entries past max size, and never caches failures', async () => {
      service.configureImageCache(2, 60_000);

      const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('fail')) {
          return new Response(null, { status: 500 });
        }
        const headers = init?.headers as Record<string, string> | undefined;
        if (headers?.['If-None-Match'] === `etag-${url}`) {
          return new Response(null, { status: 304 });
        }
        return new Response(Buffer.from(`img-${url}`), {
          status: 200,
          headers: {
            'content-type': 'image/png',
            etag: `etag-${url}`,
          },
        });
      });
      vi.stubGlobal('fetch', fetchMock);

      try {
        const h1 = await service.resolveImageHash('https://example.com/1.png');
        const h1Revalidated = await service.resolveImageHash('https://example.com/1.png');
        expect(h1).toBeTruthy();
        expect(h1Revalidated).toBe(h1);
        expect(fetchMock).toHaveBeenCalledTimes(2);

        await service.resolveImageHash('https://example.com/2.png');
        expect(service.getImageHashCacheSize()).toBe(2);

        // Touch 1.png so 2.png becomes LRU, then insert 3.png -> 2.png evicted
        await service.resolveImageHash('https://example.com/1.png');
        await service.resolveImageHash('https://example.com/3.png');
        expect(service.getImageHashCacheSize()).toBe(2);

        // Failed fetch returns null and is not cached
        const failed = await service.resolveImageHash('https://example.com/fail.png');
        expect(failed).toBeNull();
        expect(service.getImageHashCacheSize()).toBe(2);
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('bypasses cache when remote server omits ETag/Last-Modified so changed content at same URL is detected', async () => {
      let version = 1;
      const fetchMock = vi.fn(async () =>
        new Response(Buffer.from(`mutable-v${version}`), {
          status: 200,
          headers: { 'content-type': 'image/png' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      try {
        const h1 = await service.resolveImageHash('https://example.com/mutable.png');
        version = 2;
        const h2 = await service.resolveImageHash('https://example.com/mutable.png');
        expect(h1).toBeTruthy();
        expect(h2).toBeTruthy();
        expect(h1).not.toBe(h2);
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('blocks private, loopback, and metadata URLs to prevent SSRF', async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      try {
        expect(await service.resolveImageHash('http://127.0.0.1/secret.png')).toBeNull();
        expect(await service.resolveImageHash('http://169.254.169.254/latest/meta-data/')).toBeNull();
        expect(await service.resolveImageHash('http://localhost:3001/admin.png')).toBeNull();
        expect(await service.resolveImageHash('http://10.0.0.5/internal.png')).toBeNull();
        expect(fetchMock).not.toHaveBeenCalled();
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });
});
