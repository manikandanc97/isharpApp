"use client";

import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { PageContainer } from "@/components/layout/layout-primitives";
import { CoursesSection } from "@/components/admin/courses-section";
import { OverviewSection } from "@/components/admin/overview-section";
import { StudentsSection } from "@/components/admin/students-section";
import { QuestionBankManager } from "@/components/question-bank-manager";
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog";
import { AdminWorkspaceContentSkeleton } from "@/components/skeletons/admin-layout-skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/components/admin/admin-api";
import {
  formatDate,
  initials,
  LightStatusBadge,
} from "@/components/admin/admin-helpers";
import {
  isStudentAccount,
  sectionMeta,
  sectionPaths,
  type AdminDashboardSection,
  type Course,
  type InternalStudent,
  type Membership,
  type Metrics,
  type Section,
  type User,
} from "@/components/admin/admin-types";
import type { AuthenticatedSession } from "@/lib/auth-session";
import { hasRequiredRole } from "@/lib/role-policy";

export type { AdminDashboardSection };

export function AdminDashboard({
  initialSection: section = "overview",
}: {
  initialSection?: AdminDashboardSection;
}) {
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

  return (
    <div className="relative min-h-svh overflow-x-clip bg-slate-50 font-sans text-slate-900 antialiased selection:bg-brand-red selection:text-white">
      {/* MODERN LUXURY SOLID SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-(--layout-sidebar-width) flex-col border-r border-slate-200 bg-white shadow-xs transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header with Brand Logo */}
        <div className="flex h-(--layout-app-header-height) items-center justify-between border-b border-slate-100 px-(--layout-page-inline)">
          <BrandLogo priority className="h-9 w-auto" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Section Navigation Links */}
        <div className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
          <div className="mb-2 px-3 text-3xs font-semibold uppercase tracking-wide text-slate-400">
            Platform Operations
          </div>
          {(Object.keys(sectionMeta) as Section[]).map((key) => {
            const meta = sectionMeta[key];
            const Icon = meta.icon;
            const isActive = section === key;
            const badgeCount =
              key === "students" ? pendingNotificationCount : 0;
            return (
              <button
                key={key}
                onClick={() => {
                  navigateToSection(key);
                  setSidebarOpen(false);
                }}
                className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-950"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`grid size-8 place-items-center rounded-lg transition-colors ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-900"
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="grid gap-1">
                    <p className="text-xs font-semibold leading-none">{meta.label}</p>
                    <p
                      className={`text-3xs ${
                        isActive ? "text-slate-300" : "text-slate-400"
                      }`}
                    >
                      {meta.description}
                    </p>
                  </div>
                </div>
                {badgeCount > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isActive
                        ? "bg-brand-red text-white"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer with Administrator Profile */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-xs font-semibold text-brand-blue">
                {initials(administratorLabel)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-800">
                  {administratorLabel}
                </p>
                <p className="truncate text-3xs text-slate-400">
                  {session?.roles.join(" · ") || "ADMIN"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setLogoutDialogOpen(true)}
              disabled={signingOut}
              title="Sign out securely"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-red-600 hover:shadow-xs transition"
            >
              {signingOut ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="min-w-0 lg:pl-(--layout-sidebar-width)">
        {/* Top Navbar Header */}
        <header className="sticky top-0 z-20 flex h-(--layout-app-header-height) items-center justify-between border-b border-slate-200/80 bg-white/95 px-(--layout-page-inline) backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation sidebar"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Admin Console
                </span>
              </div>
              <h1 className="type-section-title text-slate-900">
                {sectionMeta[section].label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              disabled={refreshing}
              onClick={() => void loadAll(true)}
              className="h-9 gap-2 rounded-lg border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw
                className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">
                {refreshing ? "Syncing…" : "Refresh"}
              </span>
            </Button>

            {/* Notification drop */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="relative grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 hover:text-slate-800 outline-none transition focus-visible:ring-2 focus-visible:ring-brand-blue/30"
                aria-label="Open notifications"
              >
                <Users className="size-4" />
                {pendingNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 grid size-4.5 place-items-center rounded-full bg-amber-500 text-3xs font-semibold text-white shadow-xs">
                    {pendingNotificationCount}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="rounded-2xl border border-slate-200 bg-white p-0 shadow-xl"
                style={{ width: "min(24rem, calc(100vw - 2rem))" }}
              >
                <div className="border-b border-slate-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Student verifications
                      </p>
                      <p className="text-xs text-slate-500">
                        Manual review queue
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      {pendingNotificationCount} pending
                    </span>
                  </div>
                </div>

                <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto p-2">
                  {recentPendingVerifications.length ? (
                    recentPendingVerifications.map((item) => (
                      <DropdownMenuItem
                        key={item.id}
                        onClick={() => navigateToSection("students")}
                        className="cursor-pointer items-start gap-3 rounded-xl p-3 focus:bg-slate-50"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-50 text-xs font-semibold text-amber-800">
                          {initials(item.user.displayName)}
                        </span>
                        <span className="grid min-w-0 flex-1 gap-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-xs font-semibold text-slate-900">
                              {item.user.displayName}
                            </span>
                            <LightStatusBadge status={item.status} />
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            Student ID: {item.studentId}
                          </span>
                          <span className="block text-3xs text-slate-400">
                            Updated {formatDate(item.updatedAt)}
                          </span>
                        </span>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem
                      onClick={() => navigateToSection("students")}
                      className="cursor-pointer items-center justify-between rounded-xl p-3 text-left focus:bg-slate-50"
                    >
                      <span className="flex items-center gap-3">
                        <span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                          <Check className="size-4" />
                        </span>
                        <span className="block">
                          <span className="block text-xs font-semibold text-slate-900">
                            Queue clear
                          </span>
                          <span className="block text-xs text-slate-500">
                            No student claims require action
                          </span>
                        </span>
                      </span>
                      <ChevronRight className="size-3.5 text-slate-300" />
                    </DropdownMenuItem>
                  )}
                </div>

                <DropdownMenuSeparator className="m-0" />
                <div className="p-2">
                  <DropdownMenuItem
                    onClick={() => navigateToSection("students")}
                    className="cursor-pointer justify-center rounded-lg px-3 py-2.5 text-xs font-semibold text-brand-blue focus:bg-blue-50 focus:text-brand-blue"
                  >
                    Open student management
                    <ArrowRight className="ml-1 size-3.5" />
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Administrator account menu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="group ml-0.5 flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pr-2 pl-1.5 shadow-2xs outline-none transition hover:border-brand-blue/40 focus-visible:ring-2 focus-visible:ring-brand-blue/30 data-popup-open:border-brand-blue/40 sm:ml-1 sm:pr-3"
                aria-label="Open administrator account menu"
              >
                <span className="grid size-7 place-items-center rounded-full bg-blue-50 text-brand-blue">
                  <CircleUserRound className="size-4.5" />
                </span>
                <span className="hidden text-xs font-semibold text-slate-800 sm:inline">
                  Admin
                </span>
                <ChevronDown className="hidden size-3 text-slate-400 transition-transform group-data-popup-open:rotate-180 sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
                style={{ width: "min(19rem, calc(100vw - 2rem))" }}
              >
                <div className="px-2 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-blue text-white shadow-xs">
                      <ShieldCheck className="size-4.5" />
                    </span>
                    <span className="grid min-w-0 gap-0.5">
                      <span className="block truncate text-sm font-semibold text-slate-950">
                        {administratorLabel}
                      </span>
                      <span className="block truncate text-3xs text-slate-500">
                        {session?.roles.join(" · ") || "ADMIN"} · Secure session
                      </span>
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigateToSection("overview")}
                  className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2.5 text-xs font-semibold focus:bg-blue-50"
                >
                  <LayoutDashboard className="size-4 text-slate-500" />
                  Dashboard overview
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigateToSection("students")}
                  className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2.5 text-xs font-semibold focus:bg-blue-50"
                >
                  <Users className="size-4 text-slate-500" />
                  Student management
                  {pendingNotificationCount > 0 && (
                    <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-3xs font-semibold text-amber-800">
                      {pendingNotificationCount}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigateToSection("courses")}
                  className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2.5 text-xs font-semibold focus:bg-blue-50"
                >
                  <BookOpen className="size-4 text-slate-500" />
                  Course management
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLogoutDialogOpen(true)}
                  disabled={signingOut}
                  variant="destructive"
                  className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2.5 text-xs font-semibold"
                >
                  {signingOut ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <LogOut className="size-4" />
                  )}
                  {signingOut ? "Signing out…" : "Sign out securely"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Workspace Body */}
        <main>
          <PageContainer size="workspace" className="py-(--space-layout)">
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
                <OverviewSection
                  overview={overview}
                  users={users}
                  courses={courses}
                  onNavigate={navigateToSection}
                />
              )}
              {section === "students" && (
                <div className="space-y-6">
                  <StudentsSection
                    users={users}
                    internalStudents={internalStudents}
                    currentProfileId={session?.profileId}
                    canManagePrivileged={
                      session?.roles.includes("SUPERADMIN") ?? false
                    }
                    onToggle={setUserActive}
                    onManageAccess={manageStudentAccess}
                    onRosterCreated={(student) => {
                      setInternalStudents((current) => [
                        student,
                        ...current.filter((item) => item.id !== student.id),
                      ]);
                      void loadAll(true);
                    }}
                    onRosterDeleted={(studentId) => {
                      setInternalStudents((current) =>
                        current.filter((item) => item.id !== studentId),
                      );
                      void loadAll(true);
                    }}
                    onNotice={showNotice}
                    onError={setError}
                  />
                </div>
              )}
              {section === "courses" && (
                <div className="space-y-8">
                  <CoursesSection
                    courses={courses}
                    onCreate={createCourse}
                    onToggle={toggleCourse}
                  />
                  <QuestionBankManager />
                </div>
              )}
            </>
          )}
          </PageContainer>
        </main>
      </div>

      <LogoutConfirmationDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        onConfirm={signOut}
        isLoading={signingOut}
        title="Log out of Admin Console?"
        description="Are you sure you want to log out? Unsaved course updates or question bank edits will be discarded."
      />
    </div>
  );
}
