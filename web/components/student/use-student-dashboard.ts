"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AuthenticatedSession } from "@/lib/auth-session";
import type { LanguageMode, StudentPortalData, TabId } from "./student-types";

export type StudentDashboardStatus =
  | "loading"
  | "ready"
  | "unauthenticated"
  | "forbidden"
  | "payment-required"
  | "error";

const DASHBOARD_LOAD_TIMEOUT_MS = 15_000;

export function useStudentDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<AuthenticatedSession | null>(null);
  const [portalData, setPortalData] = useState<StudentPortalData | null>(null);
  const [status, setStatus] = useState<StudentDashboardStatus>("loading");
  const [statusMessage, setStatusMessage] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedLanguage, setSelectedLanguage] =
    useState<LanguageMode>("bilingual");
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => controller.abort(),
      DASHBOARD_LOAD_TIMEOUT_MS,
    );

    async function load() {
      try {
        const dashboardResponse = await fetch("/api/student/dashboard", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await dashboardResponse.json().catch(() => ({}))) as
          | StudentPortalData
          | { message?: string };

        if (dashboardResponse.status === 401) {
          if (active) setStatus("unauthenticated");
          return;
        }
        if (dashboardResponse.status === 403) {
          if (active) {
            const message =
              "message" in payload
                ? payload.message ?? "Student access is required"
                : "Student access is required";
            setStatusMessage(message);
            setStatus(
              message === "Insufficient permissions"
                ? "forbidden"
                : "payment-required",
            );
          }
          return;
        }
        if (!dashboardResponse.ok || !("student" in payload)) {
          throw new Error(
            "message" in payload
              ? payload.message ?? "Student data could not be loaded"
              : "Student data could not be loaded",
          );
        }

        if (active) {
          setSession(payload.session);
          setPortalData(payload);
          setStatus("ready");
        }
      } catch (error) {
        if (active) {
          setStatusMessage(
            error instanceof DOMException && error.name === "AbortError"
              ? "Student dashboard request timed out. Please try again."
              : error instanceof Error
                ? error.message
                : "Student data could not be loaded",
          );
          setStatus("error");
        }
      }
    }

    void load();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [reloadKey]);

  function retryLoad() {
    setPortalData(null);
    setStatusMessage("");
    setStatus("loading");
    setReloadKey((current) => current + 1);
  }

  async function confirmSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Unable to sign out");
      setLogoutDialogOpen(false);
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  function openProfile() {
    setProfileName(portalData?.student.displayName ?? "");
    setProfileError("");
    setProfileOpen(true);
  }

  async function saveProfile() {
    const displayName = profileName.trim();
    if (!displayName) {
      setProfileError("Please enter your name");
      return;
    }
    if (displayName.length > 150) {
      setProfileError("Name must be 150 characters or fewer");
      return;
    }

    setSavingProfile(true);
    setProfileError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        displayName?: string;
        message?: string;
      };
      if (!response.ok) throw new Error(payload.message ?? "Unable to update profile");

      const savedName = payload.displayName ?? displayName;
      setSession((current) =>
        current ? { ...current, displayName: savedName } : current,
      );
      setPortalData((current) =>
        current
          ? { ...current, student: { ...current.student, displayName: savedName } }
          : current,
      );
      setProfileOpen(false);
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Unable to update profile",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  return {
    session,
    portalData,
    status,
    statusMessage,
    profileOpen,
    setProfileOpen,
    profileName,
    setProfileName,
    profileError,
    savingProfile,
    activeTab,
    setActiveTab,
    selectedLanguage,
    setSelectedLanguage,
    logoutDialogOpen,
    setLogoutDialogOpen,
    isSigningOut,
    confirmSignOut,
    promptSignOut: () => setLogoutDialogOpen(true),
    openProfile,
    saveProfile,
    retryLoad,
  };
}
