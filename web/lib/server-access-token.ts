import 'server-only';

import type { NextRequest } from 'next/server';

import { selectAccessToken } from '@/lib/auth-token';
import { createClient } from '@/lib/supabase/server';

export async function getRequestAccessToken(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const directToken = selectAccessToken({ authorization });
  if (directToken) return directToken;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) return null;

    const expiresAt = data.session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    if (typeof expiresAt === 'number' && expiresAt <= now) {
      const { data: refreshed, error: refreshError } =
        await supabase.auth.refreshSession();
      if (refreshError || !refreshed.session?.access_token) return null;
      return selectAccessToken({
        supabaseToken: refreshed.session.access_token,
      });
    }

    return selectAccessToken({ supabaseToken: data.session.access_token });
  } catch {
    return null;
  }
}
