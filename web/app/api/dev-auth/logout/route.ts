import { cookies } from 'next/headers';

import { DEV_AUTH_COOKIE, isDummyAuthEnabled } from '@/lib/dev-auth-config';
import { getNestApiClient } from '@/lib/nest-api';

export async function POST() {
  if (!isDummyAuthEnabled()) {
    return Response.json({ message: 'Not found' }, { status: 404 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(DEV_AUTH_COOKIE)?.value;
  if (token) {
    try {
      await getNestApiClient().request('/api/dev-auth/logout', {
        method: 'POST',
        accessToken: token,
        cache: 'no-store',
      });
    } catch {
      // Clearing the browser cookie is still safe if the in-memory API session
      // has already expired or the local API has restarted.
    }
  }
  cookieStore.delete(DEV_AUTH_COOKIE);
  return Response.json({ signedOut: true });
}
