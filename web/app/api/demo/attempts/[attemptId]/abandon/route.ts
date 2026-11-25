import type { NextRequest } from 'next/server';
import { proxyDemoRequest } from '@/lib/demo-api-proxy';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ attemptId: string }> },
) {
  const { attemptId } = await context.params;
  return proxyDemoRequest(
    request,
    `/api/demo/attempts/${encodeURIComponent(attemptId)}/abandon`,
    'POST',
  );
}
