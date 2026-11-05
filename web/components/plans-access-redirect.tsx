"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import type { AuthenticatedSession } from "@/lib/auth-session";

const ACCESS_REFRESH_INTERVAL_MS = 15_000;

export function PlansAccessRedirect() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function refreshAccess() {
      try {
        const response = await fetch("/api/session", { cache: "no-store" });
        if (!response.ok || !active) return;

        const session = (await response.json()) as AuthenticatedSession;
        if (
          session.roles.includes("STUDENT") &&
          session.studentAccess?.hasLearningAccess
        ) {
          router.replace("/dashboard/student");
          router.refresh();
        }
      } catch {
        // Keep the activation page usable while the API is temporarily down.
      }
    }

    void refreshAccess();
    const interval = window.setInterval(
      () => void refreshAccess(),
      ACCESS_REFRESH_INTERVAL_MS,
    );
    const onFocus = () => void refreshAccess();
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [router]);

  return null;
}
