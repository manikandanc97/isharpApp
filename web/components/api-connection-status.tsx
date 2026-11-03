'use client';

import { CircleAlert, LoaderCircle, RefreshCw, Server } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ApiClientError, createApiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type ConnectionState =
  | { status: 'loading' }
  | { status: 'connected' }
  | { status: 'error'; message: string };

const frontendApi = createApiClient({ baseUrl: '', defaultTimeoutMs: 6_000 });

async function checkApiConnection(
  signal?: AbortSignal,
): Promise<ConnectionState | null> {
  try {
    await frontendApi.request('/api/health', { cache: 'no-store', signal });
    return { status: 'connected' };
  } catch (error) {
    if (signal?.aborted) return null;
    return {
      status: 'error',
      message:
        error instanceof ApiClientError
          ? error.message
          : 'Unable to check API connection.',
    };
  }
}

export function ApiConnectionStatus() {
  const [state, setState] = useState<ConnectionState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    void checkApiConnection(controller.signal).then((nextState) => {
      if (nextState) setState(nextState);
    });
    return () => controller.abort();
  }, []);

  const connected = state.status === 'connected';
  const loading = state.status === 'loading';

  return (
    <div
      aria-live="polite"
      className={cn(
        'inline-flex min-h-7 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
        connected && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        loading && 'border-amber-400/30 bg-amber-400/10 text-amber-200',
        state.status === 'error' && 'border-rose-400/30 bg-rose-400/10 text-rose-200',
      )}
      title={state.status === 'error' ? state.message : undefined}
    >
      {loading ? (
        <LoaderCircle className="size-3 animate-spin" />
      ) : connected ? (
        <Server className="size-3" />
      ) : (
        <CircleAlert className="size-3" />
      )}
      <span>
        {loading
          ? 'Checking API connection'
          : connected
            ? 'API & database connected'
            : 'API connection unavailable'}
      </span>
      {state.status === 'error' && (
        <button
          type="button"
          onClick={() => {
            setState({ status: 'loading' });
            void checkApiConnection().then((nextState) => {
              if (nextState) setState(nextState);
            });
          }}
          className="ml-1 inline-flex cursor-pointer items-center gap-1 font-semibold text-white hover:underline"
        >
          <RefreshCw className="size-2.5" />
          Retry
        </button>
      )}
    </div>
  );
}
