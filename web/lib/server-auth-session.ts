import "server-only";

import { cookies } from "next/headers";

import type { AuthenticatedSession } from "@/lib/auth-session";
import { DEV_AUTH_COOKIE, isDummyAuthEnabled } from "@/lib/dev-auth-config";
import { getNestApiClient } from "@/lib/nest-api";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function getServerAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  const accessTokens: string[] = [];
  const cookieStore = await cookies();
  const developmentToken = cookieStore.get(DEV_AUTH_COOKIE)?.value;

  if (developmentToken && isDummyAuthEnabled()) {
    accessTokens.push(developmentToken);
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.getSession();
      const token = error ? null : data.session?.access_token;
      if (token && !accessTokens.includes(token)) accessTokens.push(token);
    } catch {
      // A broken or expired Supabase cookie is an unauthenticated session.
    }
  }

  for (const accessToken of accessTokens) {
    try {
      return await getNestApiClient().request<AuthenticatedSession>(
        "/api/auth/me",
        { accessToken, cache: "no-store" },
      );
    } catch {
      // A stale development cookie must not hide a valid Supabase session.
    }
  }

  return null;
}
