import type { NextRequest } from 'next/server';
import { getNestApiBaseUrl } from '@/lib/nest-api';
import { getRequestAccessToken } from '@/lib/server-access-token';

export async function POST(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) return Response.json({ message: 'Authentication is required' }, { status: 401 });
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return Response.json({ message: 'Image file is required' }, { status: 400 });
  try {
    const upstream = new FormData(); upstream.set('file', file);
    const response = await fetch(`${getNestApiBaseUrl()}/api/admin/question-media`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: upstream, cache: 'no-store' });
    const payload = await response.json().catch(() => ({ message: 'Image upload failed' }));
    return Response.json(payload, { status: response.status, headers: { 'Cache-Control': 'no-store, private' } });
  } catch { return Response.json({ message: 'Question media service is unavailable' }, { status: 503 }); }
}
