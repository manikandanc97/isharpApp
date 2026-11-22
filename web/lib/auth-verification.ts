import { ApiClientError } from './api-client';

const TRANSIENT_AUTH_STATUSES = new Set([0, 408, 429, 502, 503, 504]);

type RetryAuthOptions = {
  attempts?: number;
  delayMs?: number;
};

/**
 * Retries only temporary transport/service failures. Authentication and
 * authorization failures are returned immediately and are never retried.
 */
export async function retryTransientAuth<T>(
  request: () => Promise<T>,
  { attempts = 2, delayMs = 250 }: RetryAuthOptions = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
      const isTransient =
        error instanceof ApiClientError &&
        (TRANSIENT_AUTH_STATUSES.has(error.status) || error.status >= 500);

      if (!isTransient || attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
