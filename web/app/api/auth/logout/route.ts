import { cookies } from 'next/headers';

import { DEV_AUTH_COOKIE, isDummyAuthEnabled } from '@/lib/dev-auth-config';
import { getNestApiClient } from '@/lib/nest-api';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const cookieStore = await cookies();
  const developmentToken = cookieStore.get(DEV_AUTH_COOKIE)?.value;

  if (developmentToken && isDummyAuthEnabled()) {
    await getNestApiClient()
      .request('/api/dev-auth/logout', {
        method: 'POST',
        accessToken: developmentToken,
        cache: 'no-store',
      })
      .catch(() => undefined);
    cookieStore.delete(DEV_AUTH_COOKIE);
  }

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Missing Supabase configuration must not prevent local dummy logout.
  }

  return Response.json(
    { signedOut: true },
    { headers: { 'Cache-Control': 'no-store, private' } },
  );
}
