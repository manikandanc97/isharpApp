"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AuthenticatedSession } from "@/lib/auth-session";
import { hasRequiredRole } from "@/lib/role-policy";
import type { LanguageMode, TabId } from "./student-types";

export type StudentDashboardStatus =
  | "loading"
  | "ready"
  | "unauthenticated"
  | "forbidden"
  | "payment-required"
  | "error";

export function useStudentDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<AuthenticatedSession | null>(null);
  const [status, setStatus] = useState<StudentDashboardStatus>("loading");
  const [statusMessage, setStatusMessage] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedLanguage, setSelectedLanguage] =
    useState<LanguageMode>("bilingual");

  // Interactive DPP Drill Runner state
  const [drillOpen, setDrillOpen] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [solvedCount, setSolvedCount] = useState(12);

  // Logout confirmation modal state
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Authenticate session and check student RBAC access
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const sessionResponse = await fetch("/api/session", {
          cache: "no-store",
        });
        if (sessionResponse.status === 401) {
          if (active) setStatus("unauthenticated");
          return;
        }
        if (!sessionResponse.ok)
          throw new Error("Authentication API connection failed");
        const currentSession =
          (await sessionResponse.json()) as AuthenticatedSession;
        if (active) setSession(currentSession);

        if (!hasRequiredRole(currentSession.roles, "STUDENT")) {
          if (active) setStatus("forbidden");
          return;
        }

        const accessResponse = await fetch("/api/access/student", {
          cache: "no-store",
        });
        const payload = (await accessResponse.json()) as { message?: string };
        if (accessResponse.status === 401) {
          if (active) setStatus("unauthenticated");
          return;
        }
        if (accessResponse.status === 403) {
          if (active) {
            setStatusMessage(
              payload.message ?? "An active access plan is required",
            );
            setStatus("payment-required");
          }
          return;
        }
        if (!accessResponse.ok)
          throw new Error(payload.message ?? "API connection failed");
        if (active) {
          setStatusMessage(payload.message ?? "API access confirmed");
          setStatus("ready");
        }
      } catch (error) {
        if (active) {
          setStatusMessage(
            error instanceof Error ? error.message : "API connection failed",
          );
          setStatus("error");
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  async function confirmSignOut() {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setLogoutDialogOpen(false);
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  function promptSignOut() {
    setLogoutDialogOpen(true);
  }

  function openProfile() {
    setProfileName(session?.displayName ?? "");
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
      if (!response.ok)
        throw new Error(payload.message ?? "Unable to update profile");
      setSession((current) =>
        current
          ? { ...current, displayName: payload.displayName ?? displayName }
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

  const studentCategory = session?.studentAccess?.category ?? "INTERNAL";
  const isInternal = studentCategory === "INTERNAL";
  const displayName = session?.displayName?.trim() || "Student";
  const studentIdDisplay =
    session?.studentAccess?.studentId || "Student ID unavailable";
  const profileInitial = displayName.charAt(0).toUpperCase();
  const greetingName = displayName.split(/\s+/)[0];

  return {
    router,
    session,
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
    drillOpen,
    setDrillOpen,
    currentQIndex,
    setCurrentQIndex,
    selectedAnswer,
    setSelectedAnswer,
    showExplanation,
    setShowExplanation,
    solvedCount,
    setSolvedCount,
    logoutDialogOpen,
    setLogoutDialogOpen,
    isSigningOut,
    confirmSignOut,
    promptSignOut,
    openProfile,
    saveProfile,
    studentCategory,
    isInternal,
    displayName,
    studentIdDisplay,
    profileInitial,
    greetingName,
  };
}

