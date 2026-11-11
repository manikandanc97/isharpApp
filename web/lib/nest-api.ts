import 'server-only';

import { createApiClient } from '@/lib/api-client';

function isLocalhost(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    return (
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname === '0.0.0.0' ||
      url.hostname === '::1'
    );
  } catch {
    return false;
  }
}

/**
 * Resolves the server-side NestJS API base URL.
 *
 * Rules:
 * - In production: strictly disallows localhost. Prioritizes NEXT_PUBLIC_API_URL or API_BASE_URL
 *   if it points to the remote production backend.
 * - In development: preserves localhost backend support while allowing override with API_BASE_URL
 *   or NEXT_PUBLIC_API_URL.
 */
export function getNestApiBaseUrl(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const apiBaseUrl = process.env.API_BASE_URL?.trim();
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  // In production, strictly reject localhost and use the remote production URL
  if (isProduction) {
    if (publicApiUrl && !isLocalhost(publicApiUrl)) {
      if (!apiBaseUrl || isLocalhost(apiBaseUrl)) {
        return publicApiUrl.replace(/\/+$/, '');
      }
    }
    if (apiBaseUrl && !isLocalhost(apiBaseUrl)) {
      return apiBaseUrl.replace(/\/+$/, '');
    }
  }

  // Development / local or explicit configuration
  const selected = apiBaseUrl || publicApiUrl;
  if (!selected) {
    if (!isProduction) {
      return 'http://localhost:3001';
    }
    throw new Error(
      'Neither API_BASE_URL nor NEXT_PUBLIC_API_URL is configured for production',
    );
  }

  return selected.replace(/\/+$/, '');
}

/**
 * Creates or retrieves a server-only API client pointing to the NestJS backend.
 */
export function getNestApiClient(options?: { timeoutMs?: number }) {
  const baseUrl = getNestApiBaseUrl();
  return createApiClient({
    baseUrl,
    defaultTimeoutMs: options?.timeoutMs ?? 15_000,
  });
}
