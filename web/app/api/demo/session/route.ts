import type { NextRequest } from 'next/server';
import { proxyDemoRequest } from '@/lib/demo-api-proxy';

export async function GET(request: NextRequest) {
  return proxyDemoRequest(request, '/api/demo/session', 'GET');
}
