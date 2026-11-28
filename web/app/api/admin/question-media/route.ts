import type { NextRequest } from 'next/server';
import { getNestApiBaseUrl } from '@/lib/nest-api';
import { getRequestAccessToken } from '@/lib/server-access-token';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export async function POST(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) return Response.json({ message: 'Authentication is required' }, { status: 401 });
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return Response.json({ message: 'Image file is required' }, { status: 400 });

  // 1. Try Nest API upstream
  try {
    const upstream = new FormData();
    upstream.set('file', file);
    const response = await fetch(`${getNestApiBaseUrl()}/api/admin/question-media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: upstream,
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const payload = await response.json();
      if (payload?.url) {
        return Response.json(payload, { status: 200, headers: { 'Cache-Control': 'no-store, private' } });
      }
    }
  } catch {
    // Proceed to local fallback
  }

  // 2. Fallback: Save directly to public/uploads/question-media
  try {
    const year = new Date().getUTCFullYear();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const filename = `${randomUUID()}.${ext}`;
    const targetDir = path.join(process.cwd(), 'public', 'uploads', 'question-media', String(year));
    await fs.mkdir(targetDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(targetDir, filename), buffer);
    return Response.json(
      {
        url: `/uploads/question-media/${year}/${filename}`,
        path: `questions/${year}/${filename}`,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store, private' } },
    );
  } catch {
    return Response.json({ message: 'Image upload failed' }, { status: 500 });
  }
}
