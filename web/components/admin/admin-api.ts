import { handleSessionExpired } from "@/lib/session-manager";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });

  if (response.status === 401) {
    handleSessionExpired({ destination: "/administration" });
    throw new Error("Session expired. Redirecting to login...");
  }

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
  };
  if (!response.ok) throw new Error(payload.message ?? "Request failed");
  return payload as T;
}
