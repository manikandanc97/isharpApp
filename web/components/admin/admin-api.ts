import { ApiClientError } from "@/lib/api-client";
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
  const cleanPath = path.replace(/^\/+/, "");
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;
  const headers = new Headers(init?.headers);
  if (!isFormData && init?.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (isFormData) {
    headers.delete("Content-Type");
  }

  const requestInit: RequestInit = {
    ...init,
    headers,
    cache: "no-store",
  };
  let response = await fetch(`/api/admin/${cleanPath}`, requestInit);

  const method = (requestInit.method ?? "GET").toUpperCase();
  const isSafeMethod =
    method === "GET" || method === "HEAD" || method === "OPTIONS";

  if (response.status === 401) {
    const refreshed = await tryRefreshAdminSession();
    if (refreshed && isSafeMethod) {
      response = await fetch(`/api/admin/${cleanPath}`, requestInit);
    } else if (refreshed) {
      throw new ApiClientError(
        "Session refreshed. Please retry your request.",
        401,
      );
    }
    if (response.status === 401) {
      handleSessionExpired({ destination: "/administration" });
      throw new ApiClientError("Session expired. Redirecting to login...", 401);
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let payload: unknown = undefined;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : "Request failed";
    throw new ApiClientError(message, response.status, payload);
  }
  return payload as T;
}
