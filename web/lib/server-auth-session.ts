import "server-only";

import type { AuthenticatedSession } from "@/lib/auth-session";
import { getNestApiClient } from "@/lib/nest-api";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function getServerAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getSession();
    const accessToken = error ? null : data.session?.access_token;
    if (!accessToken) return null;
    return await getNestApiClient().request<AuthenticatedSession>(
      "/api/auth/me",
      { accessToken, cache: "no-store" },
    );
  } catch {
    return null;
  }
}
