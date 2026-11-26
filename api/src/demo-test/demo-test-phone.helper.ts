import { BadRequestException } from '@nestjs/common';

/**
 * Normalizes an Indian mobile number to E.164 format (+91XXXXXXXXXX).
 * Accepts 10-digit numbers starting with 6-9, optionally prefixed with +91, 91, or 0,
 * and strips whitespace, hyphens, dots, and parentheses.
 */
export function normalizeIndianMobile(rawInput: string): string {
  if (typeof rawInput !== 'string') {
    throw new BadRequestException('Please enter a valid 10-digit Indian mobile number.');
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new BadRequestException('Mobile number is required.');
  }

  // Strip spaces, hyphens, parentheses, dots
  let digits = trimmed.replace(/[\s\-().]/g, '');

  if (digits.startsWith('+')) {
    digits = digits.slice(1);
  }

  // Handle leading 91 (country code) or 0 (trunk prefix)
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new BadRequestException(
      'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
    );
  }

  return `+91${digits}`;
}

/**
 * Masks a normalized phone number for safe logging (e.g. +91******3210).
 */
export function maskPhoneNumber(normalizedPhone: string): string {
  if (!normalizedPhone || normalizedPhone.length < 6) return '***';
  const prefix = normalizedPhone.slice(0, 3);
  const suffix = normalizedPhone.slice(-4);
  return `${prefix}******${suffix}`;
}
