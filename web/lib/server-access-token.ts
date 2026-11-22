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
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return null;

    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) return null;

    return selectAccessToken({ supabaseToken: data.session.access_token });
  } catch {
    return null;
  }
}
