"use client";

import {
  AlertCircle,
  Archive,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  BookOpenCheck,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  Layers3,
  LoaderCircle,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { QuestionBankManager } from "@/components/question-bank-manager";
import { AdminWorkspaceContentSkeleton } from "@/components/skeletons/admin-layout-skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AuthenticatedSession } from "@/lib/auth-session";
import { hasRequiredRole } from "@/lib/role-policy";

export type AdminDashboardSection = "overview" | "students" | "courses";
type Section = AdminDashboardSection;
const sectionPaths: Record<Section, string> = {
  overview: "/admin",
  students: "/admin/students",
  courses: "/admin/courses",
};
type Metrics = {
  users: number;
  activeUsers: number;
  pendingVerifications: number;
  courses: number;
  subjects: number;
};
type Membership = {
  id: string;
  studentId: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "REVOKED";
  method?: string | null;
  createdAt?: string;
  updatedAt: string;
  studentCategory: "INTERNAL" | "EXTERNAL";
  paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
  paidAccessUntil: string | null;
  user: {
    id: string;
    displayName: string;
    isActive?: boolean;
    userRoles?: { role: { name: string } }[];
  };
};
type User = {
  id: string;
  displayName: string;
  isActive: boolean;
  createdAt: string;
  roles: string[];
  institutionMembership: {
    id: string;
    studentId: string;
    status: Membership["status"];
    studentCategory: Membership["studentCategory"];
    paymentStatus: Membership["paymentStatus"];
    paidAccessUntil: string | null;
  } | null;
};
type Course = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  isActive: boolean;
  updatedAt: string;
  courseSubjects: {
    id: string;
    subject: { id: string; code: string; name: string };
    _count: { chapters: number };
  }[];
};
type InternalStudent = {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  authUserId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function isStudentAccount(user: User) {
  return (
    user.roles.includes("STUDENT") &&
    !user.roles.some((role) => role === "ADMIN" || role === "SUPERADMIN")
  );
}

const sectionMeta = {
  overview: {
    label: "Overview",
    icon: LayoutDashboard,
    description: "Executive Dashboard & Metrics",
  },
  students: {
    label: "Students",
    icon: Users,
    description: "Directory & Account Permissions",
  },
  courses: {
    label: "Courses",
    icon: BookOpen,
    description: "Academic Catalog Management",
  },
} satisfies Record<
  Section,
  { label: string; icon: typeof LayoutDashboard; description: string }
>;

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
  };
  if (!response.ok) throw new Error(payload.message ?? "Request failed");
  return payload as T;
}

export function AdminDashboard({
  initialSection: section = "overview",
}: {
  initialSection?: AdminDashboardSection;
}) {
  const router = useRouter();
  const [session, setSession] = useState<AuthenticatedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/administration");
    router.refresh();
  }

  async function setUserActive(user: User) {
    try {
      await api(`users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, isActive: !item.isActive } : item,
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

  return (
    <div className="relative min-h-svh overflow-x-clip bg-slate-50 font-sans text-slate-900 antialiased selection:bg-brand-red selection:text-white">
      {/* MODERN LUXURY SOLID SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white shadow-xs transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header with Brand Logo */}
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <BrandLogo priority className="h-8 w-auto" />
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Live Operational Status Indicator */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/80 px-3.5 py-2">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
              </span>
              <span className="text-2xs font-bold text-slate-700">
                Command Engine
              </span>
            </div>
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-emerald-700">
              Active
            </span>
          </div>
        </div>

        {/* Navigation Workspace Links */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
          <p className="px-3 text-2xs font-bold uppercase tracking-eyebrow text-slate-400">
            Workspace
          </p>
          <nav className="mt-2.5 space-y-1.5">
            {(Object.keys(sectionMeta) as Section[]).map((key) => {
              const item = sectionMeta[key];
              const Icon = item.icon;
              const isActive = section === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    navigateToSection(key);
                    if (sidebarOpen) setSidebarOpen(false);
                  }}
                  className={`group relative flex w-full items-center gap-3.5 rounded-2xl border px-3.5 py-3 text-sm font-semibold select-none transition-colors duration-150 ${
                    isActive
                      ? "border-brand-red bg-brand-red text-white shadow-brand"
                      : "border-transparent text-slate-600 hover:bg-rose-50/70 hover:text-slate-900"
                  }`}
                >
                  <div
                    className={`grid size-9 shrink-0 place-items-center rounded-xl transition-colors duration-150 ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-rose-100 group-hover:text-brand-red"
                    }`}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  <div className="flex flex-col items-start text-left min-w-0">
                    <span className="font-bold leading-5 truncate">
                      {item.label}
                    </span>
                    <span
                      className={`text-2xs font-medium leading-4 truncate transition-colors duration-150 ${isActive ? "text-rose-100" : "text-slate-400"}`}
                    >
                      {key === "overview" && "Metrics & telemetry"}
                      {key === "students" && `${users.length} accounts`}
                      {key === "courses" && `${courses.length} courses`}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Administrator Profile Card */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-blue text-white shadow-xs">
              <ShieldCheck className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-bold text-slate-900">
                  Administrator
                </p>
                <span className="rounded bg-rose-50 px-1 py-0.2 text-3xs font-black uppercase tracking-wider text-brand-red">
                  ROOT
                </span>
              </div>
              <p className="truncate text-2xs text-slate-500">
                {session?.roles.join(" · ") ?? "Admin Session"}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="size-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile */}
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="lg:pl-72">
        {/* Sticky Executive Topbar */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xs font-bold uppercase tracking-label text-brand-red">
                  Admin Console
                </span>
                <span className="text-slate-300">/</span>
                <span className="text-2xs font-bold uppercase tracking-label text-slate-400">
                  {sectionMeta[section].label}
                </span>
              </div>
              <h1 className="mt-0.5 text-xl font-black tracking-tight text-slate-900">
                {sectionMeta[section].label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Operational Status */}
            <div className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-1 sm:flex shadow-2xs">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
              </span>
              <span className="text-xs font-semibold text-slate-700">
                Live Operational Data
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => void loadAll(true)}
              disabled={refreshing}
              className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-brand-blue/40 hover:text-brand-blue active:scale-95"
              title="Refresh dashboard"
              aria-label="Refresh dashboard"
            >
              <RefreshCw
                className={`size-4 ${refreshing ? "animate-spin text-brand-blue" : ""}`}
              />
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => navigateToSection("students")}
              className="relative grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-brand-blue/40 hover:text-brand-blue active:scale-95"
              title={`${internalStudents.filter((item) => item.isActive).length} active internal students`}
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {internalStudents.some((item) => item.isActive) && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand-red ring-2 ring-white" />
              )}
            </button>

            {/* Profile Pill */}
            <div className="ml-1 hidden items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pr-3 pl-1.5 sm:flex shadow-2xs">
              <div className="grid size-7 place-items-center rounded-full bg-blue-50 text-brand-blue">
                <CircleUserRound className="size-4.5" />
              </div>
              <span className="text-xs font-bold text-slate-800">Admin</span>
              <ChevronDown className="size-3 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="mx-auto max-w-7xl p-4 sm:p-8">
          {/* Notice Toast */}
          {notice && (
            <div className="fixed right-6 top-24 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-3">
              <Check className="size-4" />
              <span>{notice}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-xs">
              <span className="flex items-center gap-2.5">
                <AlertCircle className="size-4.5 shrink-0 text-red-600" />
                <span>{error}</span>
              </span>
              <button
                onClick={() => setError("")}
                className="rounded-lg p-1 text-red-600 hover:bg-red-100"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {loading ? (
            <AdminWorkspaceContentSkeleton section={section} />
          ) : (
            <>
              {section === "overview" && overview && (
                <Overview
                  overview={overview}
                  users={users}
                  courses={courses}
                  onNavigate={navigateToSection}
                />
              )}
              {section === "students" && (
                <div className="space-y-6">
                  <Students
                    users={users}
                    currentProfileId={session?.profileId}
                    canManagePrivileged={
                      session?.roles.includes("SUPERADMIN") ?? false
                    }
                    onToggle={setUserActive}
                    onManageAccess={manageStudentAccess}
                    onChanged={() => loadAll(true)}
                    onNotice={showNotice}
                    onError={setError}
                  />
                </div>
              )}
              {section === "courses" && (
                <div className="space-y-8">
                  <Courses
                    courses={courses}
                    onCreate={createCourse}
                    onToggle={toggleCourse}
                  />
                  <QuestionBankManager />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function Overview({
  overview,
  users,
  courses,
  onNavigate,
}: {
  overview: { metrics: Metrics; recentVerifications: Membership[] };
  users: User[];
  courses: Course[];
  onNavigate: (section: Section) => void;
}) {
  const accessRate = overview.metrics.users
    ? Math.round((overview.metrics.activeUsers / overview.metrics.users) * 100)
    : 0;

  return (
    <div className="space-y-7">
      {/* Executive Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50/50 px-3 py-1 text-xs font-semibold text-rose-700">
              <Sparkles className="size-3 text-brand-red" />
              <span>Admin Console</span>
              <span className="h-3 w-px bg-slate-200" />
              <span className="font-bold text-brand-red">Live Operations</span>
            </div>
            <h2 className="mt-2.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Good to see you, Admin
            </h2>
            <p className="mt-1 text-sm text-slate-500 max-w-xl">
              Here is what is happening across i-SHARP today. Review pending
              student identity claims and supervise institutional courses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate("students")}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-red hover:bg-brand-red-hover px-4 py-2.5 text-xs font-bold text-white shadow-primary transition active:scale-95"
            >
              <span>Review Verification Queue</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards - Modern Luxury Light Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total Students - Primary Brand Spotlight */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:border-rose-300 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Total students
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                {overview.metrics.users}
              </p>
            </div>
            <div className="grid size-11 place-items-center rounded-xl bg-rose-50 text-brand-red">
              <Users className="size-5" />
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-2xs font-bold text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {overview.metrics.activeUsers} active
            </span>
            <span className="text-2xs text-slate-400">registered learners</span>
          </div>
        </div>

        {/* Card 2: Pending Reviews */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:border-amber-200 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Internal students
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                {
                  users.filter(
                    (user) =>
                      user.institutionMembership?.studentCategory ===
                      "INTERNAL",
                  ).length
                }
              </p>
            </div>
            <div className="grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <Clock3 className="size-5" />
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-2">
            {users.some(
              (user) =>
                user.institutionMembership?.studentCategory === "INTERNAL",
            ) ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-2xs font-bold text-amber-700">
                Requires attention
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-2xs font-bold text-emerald-700">
                <Check className="size-3" /> All verified
              </span>
            )}
            <span className="text-2xs text-slate-400">
              automatic free access
            </span>
          </div>
        </div>

        {/* Card 3: Active Courses */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:border-emerald-200 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Active courses
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                {overview.metrics.courses}
              </p>
            </div>
            <div className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <BookOpen className="size-5" />
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-2xs font-bold text-emerald-700">
              {overview.metrics.subjects} subjects
            </span>
            <span className="text-2xs text-slate-400">syllabus offerings</span>
          </div>
        </div>

        {/* Card 4: Platform Access */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:border-rose-200 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Platform access
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                {accessRate}%
              </p>
            </div>
            <div className="grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-700">
              <BarChart3 className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-red transition-all duration-500"
                style={{ width: `${accessRate}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-2xs text-slate-400">
              <span>Active accounts</span>
              <span className="font-bold text-slate-600">
                {overview.metrics.activeUsers}/{overview.metrics.users || 1}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Pipeline & Quick Controls */}
      <div className="grid gap-5 xl:grid-cols-12">
        {/* Verification Activity Panel */}
        <LightLuxuryPanel
          className="xl:col-span-7"
          title="Recent student access activity"
          description="Latest internal and external student access records"
          action="View queue"
          onAction={() => onNavigate("students")}
        >
          <div className="divide-y divide-slate-100">
            {overview.recentVerifications.length ? (
              overview.recentVerifications.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-50 text-xs font-bold text-brand-red">
                      {initials(item.user.displayName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {item.user.displayName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.studentId} · {formatDate(item.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <LightStatusBadge status={item.status} />
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                  <ShieldCheck className="size-6 text-emerald-600" />
                </div>
                <p className="mt-3 text-sm font-bold text-slate-800">
                  No student access activity yet
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  All student membership claims have been processed.
                </p>
              </div>
            )}
          </div>
        </LightLuxuryPanel>

        {/* Quick Controls */}
        <LightLuxuryPanel
          className="xl:col-span-5"
          title="Quick controls"
          description="Administrative shortcuts and frequent navigation"
        >
          <div className="grid gap-3">
            <QuickControlButton
              icon={UserCheck}
              title="Review student IDs"
              subtitle="Manage internal emails"
              onClick={() => onNavigate("students")}
            />
            <QuickControlButton
              icon={Users}
              title="Manage accounts"
              subtitle={`${users.length} loaded`}
              onClick={() => onNavigate("students")}
            />
            <QuickControlButton
              icon={GraduationCap}
              title="Manage curriculum"
              subtitle={`${courses.length} courses`}
              onClick={() => onNavigate("courses")}
            />
          </div>
        </LightLuxuryPanel>
      </div>
    </div>
  );
}

function Students({
  users,
  currentProfileId,
  canManagePrivileged,
  onToggle,
  onManageAccess,
  onChanged,
  onNotice,
  onError,
}: {
  users: User[];
  currentProfileId?: string | null;
  canManagePrivileged: boolean;
  onToggle: (user: User) => void;
  onManageAccess: (user: User) => void;
  onChanged: () => Promise<void>;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [studentType, setStudentType] = useState<
    "ALL" | "INTERNAL" | "EXTERNAL"
  >("ALL");
  const filtered = useMemo(
    () =>
      users.filter(
        (user) =>
          (studentType === "ALL" ||
            user.institutionMembership?.studentCategory === studentType) &&
          `${user.displayName} ${user.institutionMembership?.studentId ?? ""}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [query, studentType, users],
  );
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedUsers = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <LightLuxuryPanel
      title="Student accounts"
      description="Search student logins, inspect access and suspend or restore eligible students."
      headerAction={
        <InternalStudentManager
          onChanged={onChanged}
          onNotice={onNotice}
          onError={onError}
        />
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <LightSearchBox
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="Search name or student ID…"
        />
        <span className="text-xs font-semibold text-slate-500">
          Showing{" "}
          <span className="font-bold text-slate-800">
            {paginatedUsers.length}
          </span>{" "}
          of {filtered.length} students
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["ALL", "INTERNAL", "EXTERNAL"] as const).map((type) => (
          <button
            key={type}
            onClick={() => {
              setStudentType(type);
              setPage(1);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${studentType === type ? "border-brand-blue bg-brand-blue text-white shadow-xs" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-brand-blue"}`}
          >
            {type === "ALL"
              ? "All students"
              : type === "INTERNAL"
                ? "Internal"
                : "External"}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-4xl text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-2xs uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4 font-bold">User</th>
              <th className="py-3 px-4 font-bold">Student ID</th>
              <th className="py-3 px-4 font-bold">Role</th>
              <th className="py-3 px-4 font-bold">Student Type</th>
              <th className="py-3 px-4 font-bold">Verification</th>
              <th className="py-3 px-4 font-bold">Access</th>
              <th className="py-3 px-4 text-right font-bold">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedUsers.map((user) => {
              const privileged = user.roles.some(
                (role) => role === "ADMIN" || role === "SUPERADMIN",
              );
              const manageable =
                user.id !== currentProfileId &&
                (!privileged || canManagePrivileged);
              return (
                <tr key={user.id} className="transition hover:bg-slate-50/60">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-rose-50 text-xs font-bold text-brand-red">
                        {initials(user.displayName)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {user.displayName}
                        </p>
                        <p className="text-2xs text-slate-400">
                          Joined {formatDate(user.createdAt)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                    {user.institutionMembership?.studentId ?? "—"}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                    {user.roles.length ? (
                      <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-2xs font-bold text-slate-700">
                        {user.roles.join(", ")}
                      </span>
                    ) : (
                      "Unassigned"
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {user.institutionMembership ? (
                      <span
                        className={`rounded-full px-2.5 py-1 text-2xs font-extrabold ${user.institutionMembership.studentCategory === "INTERNAL" ? "bg-blue-50 text-brand-blue border border-blue-200/80" : "bg-violet-50 text-violet-700"}`}
                      >
                        {user.institutionMembership.studentCategory ===
                        "INTERNAL"
                          ? "INTERNAL · FREE"
                          : "EXTERNAL · PAID"}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {user.institutionMembership ? (
                      <LightStatusBadge
                        status={user.institutionMembership.status}
                      />
                    ) : (
                      <span className="text-xs text-slate-400">
                        Not submitted
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                        user.isActive ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-red-500"}`}
                      />
                      {user.isActive ? "Active" : "Suspended"}
                    </span>
                    {user.institutionMembership && (
                      <p
                        className={`mt-1 text-2xs font-bold ${user.institutionMembership.studentCategory === "INTERNAL" || user.institutionMembership.paymentStatus === "PAID" ? "text-emerald-600" : "text-amber-600"}`}
                      >
                        {user.institutionMembership.studentCategory ===
                        "INTERNAL"
                          ? "Free access"
                          : user.institutionMembership.paymentStatus === "PAID"
                            ? `Paid${user.institutionMembership.paidAccessUntil ? ` · until ${formatDate(user.institutionMembership.paidAccessUntil)}` : ""}`
                            : `Payment ${user.institutionMembership.paymentStatus.toLowerCase()}`}
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {user.institutionMembership && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!manageable}
                        onClick={() => onManageAccess(user)}
                        className="mr-2 hover:bg-rose-50 hover:text-brand-red hover:border-rose-200"
                      >
                        Access
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!manageable}
                      onClick={() => onToggle(user)}
                      className={
                        user.isActive
                          ? "hover:bg-red-50 hover:text-red-700"
                          : "hover:bg-emerald-50 hover:text-emerald-700"
                      }
                    >
                      {user.isActive ? "Suspend" : "Activate"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && <LightEmpty text="No matching users found." />}
      </div>
      <TablePagination
        page={currentPage}
        pageSize={pageSize}
        totalItems={filtered.length}
        onPageChange={setPage}
      />
    </LightLuxuryPanel>
  );
}

function InternalStudentManager({
  onChanged,
  onNotice,
  onError,
}: {
  onChanged: () => Promise<void>;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [editing, setEditing] = useState<"new" | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", studentId: "" });
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm({ fullName: "", email: "", studentId: "" });
    setEditing("new");
  }

  async function saveStudent() {
    if (!editing) return;
    setSaving(true);
    try {
      await api("internal-students", {
          method: "POST",
          body: JSON.stringify({
            fullName: form.fullName,
            email: form.email,
            studentId: form.studentId,
          }),
        });
      setEditing(null);
      onNotice("Internal student added.");
      await onChanged();
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "Internal student could not be saved",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        onClick={openCreate}
        className="h-10 shrink-0 bg-brand-red px-4 text-white hover:bg-brand-red-hover"
      >
        <UserPlus className="mr-2 size-4" />
        Add internal student
      </Button>
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open && !saving) setEditing(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:max-w-lg"
        >
          {editing && (
            <>
              <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-2xs font-black uppercase tracking-label text-brand-red">
                  Internal student
                </p>
                <DialogTitle className="mt-1 text-xl leading-tight font-black text-slate-900">
                  Add internal student
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs leading-5 text-slate-500">
                  The login is connected automatically when this email signs in.
                </DialogDescription>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setEditing(null)}
                className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                aria-label="Close student form"
              >
                <X className="size-4" />
              </button>
              </div>

              <div className="mt-6 space-y-4">
              <label className="grid gap-1.5 text-xs font-bold text-slate-700">
                Student name
                <input
                  autoFocus
                  className="h-11 rounded-xl border border-slate-300 px-3.5 font-medium outline-none transition focus:border-brand-blue focus:ring-3 focus:ring-blue-100"
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  placeholder="Student name"
                />
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-slate-700">
                Login email
                <input
                  className="h-11 rounded-xl border border-slate-300 px-3.5 font-medium outline-none transition focus:border-brand-blue focus:ring-3 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="student@example.com"
                />
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-slate-700">
                Student ID{" "}
                <span className="font-medium text-slate-400">(optional)</span>
                <input
                  className="h-11 rounded-xl border border-slate-300 px-3.5 font-medium uppercase outline-none transition focus:border-brand-blue focus:ring-3 focus:ring-blue-100"
                  value={form.studentId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      studentId: event.target.value,
                    }))
                  }
                  placeholder="Auto-generated when empty"
                />
              </label>
              </div>

              <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-5">
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
              <Button
                disabled={
                  saving ||
                  form.fullName.trim().length < 2 ||
                  !form.email.includes("@")
                }
                onClick={() => void saveStudent()}
                className="bg-brand-red text-white hover:bg-brand-red-hover"
              >
                {saving && (
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                )}
                Add student
              </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Legacy verification UI is retained temporarily for existing audit-history compatibility.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Verification({
  memberships,
  onDecide,
}: {
  memberships: Membership[];
  onDecide: (
    membership: Membership,
    status: "VERIFIED" | "REJECTED" | "REVOKED",
  ) => void;
}) {
  const [filter, setFilter] = useState<"ALL" | Membership["status"]>("PENDING");
  const visible =
    filter === "ALL"
      ? memberships
      : memberships.filter((item) => item.status === filter);

  return (
    <LightLuxuryPanel
      title="Institution verification"
      description="Review membership claims. Every decision requires a reason and is audit logged."
    >
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["PENDING", "VERIFIED", "REJECTED", "REVOKED", "ALL"] as const).map(
          (status) => {
            const count =
              status === "ALL"
                ? memberships.length
                : memberships.filter((item) => item.status === status).length;
            const isSelected = filter === status;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  isSelected
                    ? "border border-brand-blue bg-brand-blue text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>
                  {status === "ALL" ? "All claims" : titleCase(status)}
                </span>
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.2 text-2xs ${isSelected ? "bg-white/20" : "bg-slate-100"}`}
                >
                  {count}
                </span>
              </button>
            );
          },
        )}
      </div>

      {/* Cards List */}
      <div className="mt-5 grid gap-3">
        {visible.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4.5 shadow-2xs transition hover:border-slate-300 sm:flex-row sm:items-center"
          >
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-50 font-black text-brand-red">
              {initials(item.user.displayName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-slate-900">
                  {item.user.displayName}
                </p>
                <LightStatusBadge status={item.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Student ID:{" "}
                <span className="font-bold text-slate-700">
                  {item.studentId}
                </span>{" "}
                · Updated {formatDate(item.updatedAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {item.status !== "VERIFIED" && (
                <Button
                  size="sm"
                  onClick={() => onDecide(item, "VERIFIED")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <Check className="mr-1 size-3.5" />
                  Approve
                </Button>
              )}
              {item.status === "PENDING" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDecide(item, "REJECTED")}
                  className="hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                >
                  Reject
                </Button>
              )}
              {item.status === "VERIFIED" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDecide(item, "REVOKED")}
                >
                  Revoke
                </Button>
              )}
            </div>
          </div>
        ))}
        {!visible.length && <LightEmpty text="No requests in this view." />}
      </div>
    </LightLuxuryPanel>
  );
}

function Courses({
  courses,
  onCreate,
  onToggle,
}: {
  courses: Course[];
  onCreate: (data: {
    code: string;
    title: string;
    description: string;
  }) => Promise<void>;
  onToggle: (course: Course) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | "PUBLISHED" | "ARCHIVED">("ALL");
  const [form, setForm] = useState({ code: "", title: "", description: "" });

  const publishedCourses = courses.filter((course) => course.isActive).length;
  const totalSubjects = courses.reduce(
    (total, course) => total + course.courseSubjects.length,
    0,
  );
  const totalChapters = courses.reduce(
    (total, course) =>
      total +
      course.courseSubjects.reduce(
        (sum, subject) => sum + subject._count.chapters,
        0,
      ),
    0,
  );
  const visibleCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesStatus =
        status === "ALL" ||
        (status === "PUBLISHED" ? course.isActive : !course.isActive);
      const matchesQuery =
        !normalizedQuery ||
        `${course.code} ${course.title} ${course.description ?? ""}`
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [courses, query, status]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onCreate(form);
      setForm({ code: "", title: "", description: "" });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(course: Course) {
    setUpdatingId(course.id);
    try {
      await onToggle(course);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)]">
      <div className="border-b border-slate-200 bg-[#fbfbfa] px-5 py-7 sm:px-7 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700">
              <BookOpenCheck className="size-3.5" />
              Academic operations
            </div>
            <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">
              Curriculum workspace
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Govern course availability, syllabus coverage and academic content
              from one operational view.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition active:scale-95 ${
              showForm
                ? "border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50"
                : "bg-brand-red text-white shadow-primary hover:bg-brand-red-hover"
            }`}
          >
            {showForm ? (
              <X className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
            <span>{showForm ? "Close form" : "Create course"}</span>
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="border-b border-slate-200 bg-[#fbfbfa] p-5 sm:p-7"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-950">
                Create curriculum record
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Add the course identity first. Subjects and chapters can be
                managed after creation.
              </p>
            </div>
            <span className="hidden rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 sm:inline-flex">
              Required fields marked *
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-12">
            <LightField
              className="lg:col-span-2"
              label="Course code *"
              value={form.code}
              onChange={(value) => setForm({ ...form, code: value })}
              placeholder="NEET-01"
            />
            <LightField
              className="lg:col-span-4"
              label="Course title *"
              value={form.title}
              onChange={(value) => setForm({ ...form, title: value })}
              placeholder="NEET Coaching Programme"
            />
            <LightField
              className="lg:col-span-4"
              label="Description"
              value={form.description}
              onChange={(value) => setForm({ ...form, description: value })}
              placeholder="Programme scope and learner outcome"
            />
            <div className="flex items-end lg:col-span-2">
              <button
                disabled={saving || !form.code.trim() || !form.title.trim()}
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand-red font-bold text-white shadow-primary transition hover:bg-brand-red-hover disabled:opacity-50 active:scale-95"
              >
                {saving ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                <span>Create</span>
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid border-b border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total courses",
            value: courses.length,
            icon: BookOpen,
            tone: "text-indigo-700 bg-indigo-50",
          },
          {
            label: "Published",
            value: publishedCourses,
            icon: Check,
            tone: "text-emerald-700 bg-emerald-50",
          },
          {
            label: "Subjects mapped",
            value: totalSubjects,
            icon: Layers3,
            tone: "text-violet-700 bg-violet-50",
          },
          {
            label: "Chapters indexed",
            value: totalChapters,
            icon: GraduationCap,
            tone: "text-rose-700 bg-rose-50",
          },
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className={`flex items-center gap-3 px-5 py-4 sm:px-6 ${index ? "border-t border-slate-100 sm:border-l sm:border-t-0" : ""}`}
            >
              <div
                className={`grid size-10 place-items-center rounded-lg ${metric.tone}`}
              >
                <Icon className="size-4.5" />
              </div>
              <div>
                <p className="text-2xl font-black tracking-tight text-slate-950">
                  {metric.value}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {metric.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-black text-slate-950">
              Course registry
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {visibleCourses.length} of {courses.length} curriculum records
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 sm:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search code or course name"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs font-medium outline-none transition focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["ALL", "PUBLISHED", "ARCHIVED"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStatus(item)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    status === item
                      ? "border-brand-blue bg-brand-blue text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-brand-blue"
                  }`}
                >
                  {item === "ALL" ? "All courses" : titleCase(item)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {visibleCourses.map((course) => {
            const chapters = course.courseSubjects.reduce(
              (total, item) => total + item._count.chapters,
              0,
            );
            return (
              <article
                key={course.id}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-200 hover:border-slate-300 hover:shadow-[0_12px_30px_-24px_rgba(15,23,42,0.4)]"
              >
                <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.85fr)_auto] lg:items-center lg:p-6">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                      <BookOpen className="size-5.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-black tracking-wide text-slate-600">
                          {course.code}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${course.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${course.isActive ? "bg-emerald-500" : "bg-slate-400"}`}
                          />
                          {course.isActive ? "Published" : "Archived"}
                        </span>
                      </div>
                      <h4 className="mt-2 truncate text-base font-black text-slate-950 sm:text-lg">
                        {course.title}
                      </h4>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {course.description ||
                          "No course description provided yet."}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Curriculum coverage</span>
                      <span>{chapters} chapters</span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {course.courseSubjects.length ? (
                        course.courseSubjects.slice(0, 4).map((item) => (
                          <span
                            key={item.id}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600"
                          >
                            {item.subject.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs font-medium text-slate-400">
                          No subjects mapped
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 lg:justify-end">
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-950">
                        {course.courseSubjects.length}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Subjects
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={updatingId === course.id}
                      onClick={() => void toggle(course)}
                      className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold transition active:scale-95 disabled:opacity-60 ${
                        course.isActive
                          ? "border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-brand-red"
                          : "border-brand-blue bg-brand-blue text-white shadow-xs hover:bg-brand-blue-hover"
                      }`}
                    >
                      {updatingId === course.id ? (
                        <LoaderCircle className="size-3.5 animate-spin" />
                      ) : course.isActive ? (
                        <Archive className="size-3.5" />
                      ) : (
                        <Check className="size-3.5" />
                      )}
                      <span>{course.isActive ? "Archive" : "Publish"}</span>
                    </button>
                    <ChevronRight className="hidden size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500 sm:block" />
                  </div>
                </div>
              </article>
            );
          })}
          {!visibleCourses.length && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
                <BookOpen className="size-5" />
              </div>
              <p className="mt-4 text-sm font-black text-slate-800">
                No matching courses
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Adjust the search or status filter, or create a new curriculum
                record.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function LightLuxuryPanel({
  title,
  description,
  action,
  onAction,
  headerAction,
  className = "",
  children,
}: {
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
  headerAction?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs ${className}`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900">{title}</h3>
          {description && (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          )}
        </div>
        {headerAction ?? (action && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:text-brand-blue-hover hover:underline"
          >
            <span>{action}</span>
            <ChevronRight className="size-3.5" />
          </button>
        ))}
      </div>
      {children}
    </section>
  );
}

function QuickControlButton({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: typeof Users;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 text-left transition hover:border-blue-200 hover:bg-blue-50/50 active:scale-95"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="grid size-9 place-items-center rounded-lg bg-blue-50 text-brand-blue transition group-hover:bg-brand-blue group-hover:text-white">
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-slate-800 group-hover:text-brand-blue transition-colors">
            {title}
          </p>
          <p className="truncate text-2xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <ArrowRight className="size-3.5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-blue" />
    </button>
  );
}

function LightSearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block w-full max-w-md">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder-slate-400 focus:border-brand-blue focus:bg-white focus:ring-3 focus:ring-blue-100"
      />
    </label>
  );
}

function LightField({
  label,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-2xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand-blue focus:ring-3 focus:ring-blue-100"
      />
    </label>
  );
}

function LightStatusBadge({ status }: { status: Membership["status"] }) {
  const styles = {
    PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
    VERIFIED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    REJECTED: "bg-red-50 text-red-700 ring-red-200",
    REVOKED: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-3xs font-black uppercase tracking-wider ring-1 ${styles[status]}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === "VERIFIED"
            ? "bg-emerald-500"
            : status === "PENDING"
              ? "bg-amber-500"
              : status === "REJECTED"
                ? "bg-red-500"
                : "bg-slate-400"
        }`}
      />
      {titleCase(status)}
    </span>
  );
}

function LightEmpty({ text }: { text: string }) {
  return (
    <div className="py-10 text-center text-xs font-semibold text-slate-400">
      {text}
    </div>
  );
}

function TablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => {
      if (totalPages <= 5) return index + 1;
      const start = Math.min(Math.max(page - 2, 1), totalPages - 4);
      return start + index;
    },
  );

  return (
    <nav
      className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Table pagination"
    >
      <p className="text-xs font-semibold text-slate-500">
        Showing <span className="font-bold text-slate-800">{firstItem}</span>–
        <span className="font-bold text-slate-800">{lastItem}</span> of{" "}
        <span className="font-bold text-slate-800">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={`grid size-9 place-items-center rounded-lg border text-xs font-bold transition ${
              pageNumber === page
                ? "border-brand-blue bg-brand-blue text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-brand-blue"
            }`}
            aria-label={`Go to page ${pageNumber}`}
            aria-current={pageNumber === page ? "page" : undefined}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </nav>
  );
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}
