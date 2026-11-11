export type ApiClientOptions = {
  baseUrl: string;
  defaultTimeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export type ApiRequestOptions = Omit<
  RequestInit,
  'body' | 'headers' | 'signal'
> & {
  accessToken?: string;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export function createApiClient({
  baseUrl,
  defaultTimeoutMs = 15_000,
  fetchImpl = fetch,
}: ApiClientOptions) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  return {
    async request<T>(
      path: string,
      options: ApiRequestOptions = {},
    ): Promise<T> {
      const {
        accessToken,
        body,
        headers: requestHeaders,
        signal: externalSignal,
        timeoutMs: requestTimeoutMs,
        ...requestInit
      } = options;
      const controller = new AbortController();
      const timeoutMs = requestTimeoutMs ?? defaultTimeoutMs;
      const onExternalAbort = () => controller.abort(externalSignal?.reason);
      if (externalSignal?.aborted) onExternalAbort();
      else externalSignal?.addEventListener('abort', onExternalAbort, { once: true });
      const timeout = setTimeout(
        () => controller.abort(new DOMException('Request timed out', 'TimeoutError')),
        timeoutMs,
      );

      const headers = new Headers(requestHeaders);
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
      if (body !== undefined && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      try {
        const fullUrl = joinUrl(normalizedBaseUrl, path);
        const response = await fetchImpl(fullUrl, {
          ...requestInit,
          body: body === undefined ? undefined : JSON.stringify(body),
          headers,
          signal: controller.signal,
        });
        const payload = await parseJsonResponse(response);
        if (!response.ok) {
          throw new ApiClientError(
            getErrorMessage(payload, response.status),
            response.status,
            payload,
          );
        }
        return payload as T;
      } catch (error) {
        if (error instanceof ApiClientError) throw error;
        if (controller.signal.aborted && !externalSignal?.aborted) {
          throw new ApiClientError('API request timed out', 408);
        }
        throw new ApiClientError('API request failed', 0);
      } finally {
        clearTimeout(timeout);
        externalSignal?.removeEventListener('abort', onExternalAbort);
      }
    },
  };
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiClientError('API returned an invalid JSON response', response.status);
  }
}

function getErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message.join(', ');
    }
  }
  return `API request failed with status ${status}`;
}

export function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) return '';
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error('API base URL must be an absolute HTTP(S) URL');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('API base URL must be an absolute HTTP(S) URL');
  }
  return trimmed.replace(/\/+$/, '');
}

/**
 * Joins a base URL and an endpoint path while preventing duplicated `/api` segments
 * (e.g. `https://domain.com/api` + `/api/health` -> `https://domain.com/api/health`).
 */
export function joinUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.trim().replace(/\/+$/, '');
  let cleanPath = path.trim().replace(/^\/+/, '');

  if (!cleanBase) {
    return `/${cleanPath}`;
  }

  // Deduplicate /api prefix if baseUrl ends with /api and path starts with api/
  if (cleanBase.endsWith('/api') && (cleanPath === 'api' || cleanPath.startsWith('api/'))) {
    cleanPath = cleanPath.slice(3).replace(/^\/+/, '');
  }

  return cleanPath ? `${cleanBase}/${cleanPath}` : cleanBase;
}

/**
 * Returns the public browser-accessible API base URL (NEXT_PUBLIC_API_URL),
 * or empty string if not configured (allowing relative path fallback to Next.js BFF routes).
 */
export function getBrowserApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.trim()?.replace(/\/+$/, '') ?? '';
}

/**
 * Centralized API client instance configured for general application use.
 * Automatically resolves the appropriate base URL across browser and server contexts.
 */
export const apiClient = createApiClient({
  get baseUrl() {
    if (typeof window !== 'undefined') {
      return process.env.NEXT_PUBLIC_API_URL?.trim() ?? '';
    }
    return (
      process.env.API_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_API_URL?.trim() ||
      ''
    );
  },
  defaultTimeoutMs: 15_000,
});
