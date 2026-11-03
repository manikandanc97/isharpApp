import 'server-only';

import { createApiClient } from '@/lib/api-client';

export function getNestApiClient() {
  const baseUrl = getNestApiBaseUrl();
  return createApiClient({ baseUrl, defaultTimeoutMs: 8_000 });
}

export function getNestApiBaseUrl() {
  const baseUrl = process.env.API_BASE_URL?.trim();
  if (!baseUrl) throw new Error('API_BASE_URL is not configured');
  return baseUrl.replace(/\/$/, '');
}
