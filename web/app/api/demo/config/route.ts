import { NextResponse } from 'next/server';
import { getNestApiClient } from '@/lib/nest-api';

export async function GET() {
  try {
    const config = await getNestApiClient().request('/api/demo/config', {
      cache: 'no-store',
    });
    return NextResponse.json(config, {
      headers: { 'Cache-Control': 'no-store, private' },
    });
  } catch {
    return NextResponse.json(
      { message: 'Demo configuration is unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store, private' } },
    );
  }
}
