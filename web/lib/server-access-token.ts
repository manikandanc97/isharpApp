import 'server-only';

import type { NextRequest } from 'next/server';

import { selectAccessToken } from '@/lib/auth-token';
import { DEV_AUTH_COOKIE } from '@/lib/dev-auth-config';
import { createClient } from '@/lib/supabase/server';

export async function getRequestAccessToken(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const developmentToken = request.cookies.get(DEV_AUTH_COOKIE)?.value;
  const directToken = selectAccessToken({ authorization, developmentToken });
  if (directToken) return directToken;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return selectAccessToken({ supabaseToken: data.session?.access_token });
  } catch {
    return null;
  }
}
