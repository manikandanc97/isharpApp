import { describe, expect, it, vi } from 'vitest';

import { ApiClientError, createApiClient, joinUrl, normalizeBaseUrl } from './api-client';

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

  describe('joinUrl & deduplication', () => {
    it('prevents duplicated /api/api/... paths', () => {
      expect(joinUrl('https://isharpapp.onrender.com/api', '/api/health')).toBe(
        'https://isharpapp.onrender.com/api/health',
      );
      expect(joinUrl('https://isharpapp.onrender.com/api/', 'api/student/dashboard')).toBe(
        'https://isharpapp.onrender.com/api/student/dashboard',
      );
    });

    it('joins standard paths without duplication', () => {
      expect(joinUrl('https://isharpapp.onrender.com', '/api/health')).toBe(
        'https://isharpapp.onrender.com/api/health',
      );
      expect(joinUrl('', '/api/session')).toBe('/api/session');
    });

    it('normalizes base URLs correctly', () => {
      expect(normalizeBaseUrl('https://isharpapp.onrender.com///')).toBe(
        'https://isharpapp.onrender.com',
      );
    });
  });

  describe('FormData, empty responses, cancellation & binary downloads', () => {
    it('does not set Content-Type manually for FormData uploads', async () => {
      const fetchImpl = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ uploaded: true })));
      const client = createApiClient({ baseUrl: '', fetchImpl });
      const form = new FormData();
      form.append('file', new Blob(['hello']), 'test.txt');

      await expect(
        client.request('/api/upload', { method: 'POST', body: form }),
      ).resolves.toEqual({ uploaded: true });

      const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
      const headers = new Headers(init.headers);
      expect(headers.has('Content-Type')).toBe(false);
      expect(init.body).toBe(form);
    });

    it('handles 204 No Content empty responses cleanly', async () => {
      const fetchImpl = vi
        .fn()
        .mockResolvedValue(new Response(null, { status: 204 }));
      const client = createApiClient({ baseUrl: '', fetchImpl });

      await expect(
        client.request('/api/admin/item', { method: 'DELETE' }),
      ).resolves.toBeUndefined();
    });

    it('propagates external AbortSignal cancellation without converting to timeout', async () => {
      const external = new AbortController();
      const fetchImpl = vi.fn((_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('User cancelled', 'AbortError'));
          });
        }),
      );
      const client = createApiClient({
        baseUrl: '',
        defaultTimeoutMs: 5000,
        fetchImpl: fetchImpl as typeof fetch,
      });

      const promise = client.request('/api/search', { signal: external.signal });
      external.abort();

      await expect(promise).rejects.toThrow('User cancelled');
    });

    it('downloads binary blobs via requestBlob without JSON parsing', async () => {
      const bytes = new Uint8Array([80, 75, 3, 4]);
      const fetchImpl = vi.fn().mockResolvedValue(
        new Response(bytes, {
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        }),
      );
      const client = createApiClient({ baseUrl: '', fetchImpl });
      const blob = await client.requestBlob('/api/admin/questions/template');
      expect(blob.size).toBe(4);
    });
  });
});
