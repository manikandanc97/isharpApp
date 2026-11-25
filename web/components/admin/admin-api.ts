import { handleSessionExpired } from "@/lib/session-manager";
import { createClient } from "@/lib/supabase/client";

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshAdminSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.refreshSession();
      return !error && Boolean(data.session);
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const requestInit: RequestInit = {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  };
  let response = await fetch(`/api/admin/${path}`, requestInit);

  if (response.status === 401) {
    const refreshed = await tryRefreshAdminSession();
    if (refreshed) {
      response = await fetch(`/api/admin/${path}`, requestInit);
    }
    if (response.status === 401) {
      handleSessionExpired({ destination: "/administration" });
      throw new Error("Session expired. Redirecting to login...");
    }
  }

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
  };
  if (!response.ok) throw new Error(payload.message ?? "Request failed");
  return payload as T;
}
