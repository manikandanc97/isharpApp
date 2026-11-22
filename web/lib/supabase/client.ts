'use client';

import { createBrowserClient } from '@supabase/ssr';

import { getSupabaseConfig } from '@/lib/supabase/config';
import { authCookieOptions } from '@/lib/supabase/session-config';

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (!browserClient) {
    const { url, key } = getSupabaseConfig();
    browserClient = createBrowserClient(url, key, {
      cookieOptions: authCookieOptions,
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    });
  }
  return browserClient;
}
