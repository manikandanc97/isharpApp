import type { NextRequest } from 'next/server';
import { proxyDemoRequest } from '@/lib/demo-api-proxy';

export async function POST(request: NextRequest) {
  return proxyDemoRequest(request, '/api/demo/events/cta', 'POST');
}
