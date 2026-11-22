import { describe, expect, it, vi } from 'vitest';

import { ApiClientError } from './api-client';
import { retryTransientAuth } from './auth-verification';

describe('retryTransientAuth', () => {
  it('retries a temporary service failure', async () => {
    const request = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new ApiClientError('timed out', 408))
      .mockResolvedValue('authenticated');

    await expect(
      retryTransientAuth(request, { delayMs: 0 }),
    ).resolves.toBe('authenticated');
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('does not retry invalid or unauthorized sessions', async () => {
    const request = vi
      .fn<() => Promise<string>>()
      .mockRejectedValue(new ApiClientError('unauthorized', 401));

    await expect(
      retryTransientAuth(request, { delayMs: 0 }),
    ).rejects.toMatchObject({ status: 401 });
    expect(request).toHaveBeenCalledTimes(1);
  });
});
