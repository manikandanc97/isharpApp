"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/components/admin/admin-api";
import {
  isStudentAccount,
  sectionPaths,
  type Course,
  type InternalStudent,
  type Membership,
  type Metrics,
  type Section,
  type User,
} from "@/components/admin/admin-types";
import type { AuthenticatedSession } from "@/lib/auth-session";
import { hasRequiredRole } from "@/lib/role-policy";

export function useAdminDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<AuthenticatedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [overview, setOverview] = useState<{
    metrics: Metrics;
    recentVerifications: Membership[];
  } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [internalStudents, setInternalStudents] = useState<InternalStudent[]>(
    [],
  );
  const [courses, setCourses] = useState<Course[]>([]);

  const navigateToSection = useCallback(
    (nextSection: Section) => {
      router.push(sectionPaths[nextSection], { scroll: false });
    },
    [router],
  );

  const loadAll = useCallback(
    async (quiet = false) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const sessionResponse = await fetch("/api/session", {
          cache: "no-store",
        });
        if (sessionResponse.status === 401) {
          router.replace("/administration");
          return;
        }
        if (!sessionResponse.ok)
          throw new Error("Authentication service is unavailable");
        const currentSession =
          (await sessionResponse.json()) as AuthenticatedSession;
        if (!hasRequiredRole(currentSession.roles, "ADMIN")) {
          throw new Error("This account does not have admin access");
        }
        setSession(currentSession);
        const [overviewData, userData, rosterData, courseData] =
          await Promise.all([
            api<{ metrics: Metrics; recentVerifications: Membership[] }>(
              "overview",
            ),
            api<User[]>("users"),
            api<InternalStudent[]>("internal-students"),
            api<Course[]>("catalog"),
          ]);
        setOverview(overviewData);
        // Keep the UI student-only if an older API instance briefly returns a
        // broader profile list during a rolling deployment.
        setUsers(userData.filter(isStudentAccount));
        setInternalStudents(rosterData);
        setCourses(courseData);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load admin dashboard",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAll(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAll]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Sign out failed. Please try again.");
      router.replace("/administration");
      router.refresh();
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "Sign out failed. Please try again.",
      );
      setSigningOut(false);
    }
  }

  const pendingNotificationCount = overview?.metrics.pendingVerifications ?? 0;
  const recentPendingVerifications = useMemo(
    () =>
      overview?.recentVerifications
        .filter((membership) => membership.status === "PENDING")
        .slice(0, 4) ?? [],
    [overview],
  );

  const administratorLabel = session?.displayName || "Academy Administrator";

  async function setUserActive(user: User) {
    try {
      const nextActive = !user.isActive;
      await api(`users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: nextActive }),
      });
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, isActive: nextActive } : item,
        ),
      );
      showNotice(
        `${user.displayName} account ${user.isActive ? "suspended" : "activated"}`,
      );
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "User status update failed",
      );
    }
  }

  async function manageStudentAccess(user: User) {
    const membership = user.institutionMembership;
    if (!membership) return;
    const category = window
      .prompt("Student type: INTERNAL or EXTERNAL", membership.studentCategory)
      ?.trim()
      .toUpperCase();
    if (category !== "INTERNAL" && category !== "EXTERNAL") return;
    let paymentStatus = "NOT_REQUIRED";
    let paidAccessUntil = "";
    if (category === "EXTERNAL") {
      const payment = window
        .prompt(
          "Payment status: PENDING, PAID, EXPIRED or CANCELLED",
          membership.paymentStatus === "NOT_REQUIRED"
            ? "PENDING"
            : membership.paymentStatus,
        )
        ?.trim()
        .toUpperCase();
      if (
        !payment ||
        !["PENDING", "PAID", "EXPIRED", "CANCELLED"].includes(payment)
      )
        return;
      paymentStatus = payment;
      if (payment === "PAID")
        paidAccessUntil =
          window
            .prompt(
              "Paid access expiry (YYYY-MM-DD). Leave blank for no expiry.",
              membership.paidAccessUntil?.slice(0, 10) ?? "",
            )
            ?.trim() ?? "";
    }
    const reason = window.prompt(
      "Reason for access change:",
      category === "INTERNAL"
        ? "Confirmed internal academy student"
        : "External student payment access updated",
    );
    if (!reason) return;
    try {
      await api(`memberships/${membership.id}/access`, {
        method: "PATCH",
        body: JSON.stringify({
          studentCategory: category,
          paymentStatus,
          paidAccessUntil: paidAccessUntil
            ? `${paidAccessUntil}T23:59:59.999Z`
            : null,
          reason,
        }),
      });
      showNotice(
        `${user.displayName}: ${category === "INTERNAL" ? "internal free access" : `external ${paymentStatus.toLowerCase()} access`}`,
      );
      await loadAll(true);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Student access update failed",
      );
    }
  }

  async function createCourse(data: {
    code: string;
    title: string;
    description: string;
  }) {
    await api("courses", { method: "POST", body: JSON.stringify(data) });
    showNotice(`Course "${data.title}" successfully created`);
    await loadAll(true);
  }

  async function toggleCourse(course: Course) {
    try {
      await api(`courses/${course.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !course.isActive }),
      });
      setCourses((current) =>
        current.map((item) =>
          item.id === course.id ? { ...item, isActive: !item.isActive } : item,
        ),
      );
      showNotice(
        `Course "${course.title}" ${course.isActive ? "archived" : "published"}`,
      );
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Course update failed",
      );
    }
  }

  return {
    router,
    session,
    loading,
    refreshing,
    signingOut,
    logoutDialogOpen,
    setLogoutDialogOpen,
    sidebarOpen,
    setSidebarOpen,
    error,
    setError,
    notice,
    setNotice,
    overview,
    users,
    setUsers,
    internalStudents,
    setInternalStudents,
    courses,
    navigateToSection,
    loadAll,
    showNotice,
    signOut,
    pendingNotificationCount,
    recentPendingVerifications,
    administratorLabel,
    setUserActive,
    manageStudentAccess,
    createCourse,
    toggleCourse,
  };
}
