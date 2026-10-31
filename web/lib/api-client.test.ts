import { describe, expect, it, vi } from 'vitest';

import { ApiClientError, createApiClient } from './api-client';

describe('API client', () => {
  it('normalizes the base URL and parses JSON responses', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const client = createApiClient({
      baseUrl: 'http://localhost:3001/',
      fetchImpl,
    });

    await expect(client.request('/api/health')).resolves.toEqual({
      status: 'ok',
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:3001/api/health',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('adds bearer authentication and serializes JSON bodies', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ saved: true })));
    const client = createApiClient({ baseUrl: '', fetchImpl });

    await client.request('/api/profile', {
      method: 'POST',
      accessToken: 'supabase-access-token',
      body: { displayName: 'Learner' },
    });

    const [, request] = fetchImpl.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(request.headers);
    expect(headers.get('Authorization')).toBe(
      'Bearer supabase-access-token',
    );
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(request.body).toBe(JSON.stringify({ displayName: 'Learner' }));
  });

  it('returns typed HTTP errors with the server message', async () => {
    const client = createApiClient({
      baseUrl: 'http://localhost:3001',
      fetchImpl: vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Insufficient permissions' }), {
          status: 403,
        }),
      ),
    });

    await expect(client.request('/api/admin/content')).rejects.toEqual(
      expect.objectContaining<ApiClientError>({
        name: 'ApiClientError',
        message: 'Insufficient permissions',
        status: 403,
      }),
    );
  });

  it('rejects invalid JSON instead of silently accepting it', async () => {
    const client = createApiClient({
      baseUrl: 'http://localhost:3001',
      fetchImpl: vi.fn().mockResolvedValue(new Response('not-json')),
    });

    await expect(client.request('/api/health')).rejects.toThrow(
      'invalid JSON response',
    );
  });

  it('aborts requests that exceed the configured timeout', async () => {
    const fetchImpl = vi.fn((_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'));
        });
      }),
    );
    const client = createApiClient({
      baseUrl: 'http://localhost:3001',
      defaultTimeoutMs: 5,
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(client.request('/api/health')).rejects.toEqual(
      expect.objectContaining({ message: 'API request timed out', status: 408 }),
    );
  });
});
