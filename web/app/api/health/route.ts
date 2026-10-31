import { ApiClientError } from '@/lib/api-client';
import { getNestApiClient } from '@/lib/nest-api';

// Route is inherently dynamic (no-store, reads live API health)

type ApiHealth = {
  status: 'ok';
  api: 'up';
  database: 'up';
};

export async function GET() {
  try {
    const health = await getNestApiClient().request<ApiHealth>('/api/health', {
      cache: 'no-store',
    });
    return Response.json(health, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message =
      error instanceof ApiClientError && error.status === 503
        ? 'API is running, but its database health check failed.'
        : 'Unable to reach the I-Sharp API.';
    return Response.json(
      { status: 'error', api: 'down', database: 'unknown', message },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
