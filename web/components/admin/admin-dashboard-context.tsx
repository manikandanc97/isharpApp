"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, type ReactNode } from "react";
import { AlertCircle, Check } from "lucide-react";
import { PageContainer } from "@/components/layout/layout-primitives";
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";
import { sectionPaths, type Section } from "./admin-types";
import { useAdminDashboard } from "./use-admin-dashboard";

type AdminDashboardContextValue = ReturnType<typeof useAdminDashboard>;

const AdminDashboardContext =
  createContext<AdminDashboardContextValue | null>(null);

const pathToSectionEntries = (
  Object.entries(sectionPaths) as [Section, string][]
).filter(([key]) => key !== "tests");

function resolveSectionFromPathname(pathname: string | null): Section {
  if (!pathname) return "overview";
  if (pathname === "/admin/tests" || pathname.startsWith("/admin/tests/")) {
    return "tests";
  }
  const match = pathToSectionEntries.find(
    ([key, path]) =>
      key !== "overview" &&
      (pathname === path || pathname.startsWith(`${path}/`)),
  );
  return match?.[0] ?? "overview";
}

export function useAdminDashboardContext(): AdminDashboardContextValue {
  const context = useContext(AdminDashboardContext);
  if (!context) {
    throw new Error(
      "useAdminDashboardContext must be used within AdminDashboardShell",
    );
  }
  return context;
}

export function AdminDashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const section = resolveSectionFromPathname(pathname);
  const dashboard = useAdminDashboard();

  const {
    session,
    signingOut,
    logoutDialogOpen,
    setLogoutDialogOpen,
    sidebarOpen,
    setSidebarOpen,
    error,
    setError,
    notice,
    setNotice,
    navigateToSection,
    signOut,
    pendingNotificationCount,
    recentPendingVerifications,
    administratorLabel,
  } = dashboard;

  return (
    <AdminDashboardContext.Provider value={dashboard}>
      <div className="relative min-h-svh overflow-x-clip bg-slate-50 font-sans text-slate-900 antialiased selection:bg-brand-red selection:text-white">
        {/* SOLID SIDEBAR */}
        <AdminSidebar
          sidebarOpen={sidebarOpen}
          onCloseSidebar={() => setSidebarOpen(false)}
          section={section}
          onNavigate={navigateToSection}
          pendingNotificationCount={pendingNotificationCount}
          administratorLabel={administratorLabel}
          session={session}
          signingOut={signingOut}
          onOpenLogoutDialog={() => setLogoutDialogOpen(true)}
        />

        {/* MAIN CONTENT WRAPPER */}
        <div className="min-w-0 lg:pl-(--layout-sidebar-width)">
          {/* Top Navbar Header */}
          <AdminHeader
            section={section}
            onOpenSidebar={() => setSidebarOpen(true)}
            pendingNotificationCount={pendingNotificationCount}
            recentPendingVerifications={recentPendingVerifications}
            onNavigate={navigateToSection}
            administratorLabel={administratorLabel}
            session={session}
            signingOut={signingOut}
            onOpenLogoutDialog={() => setLogoutDialogOpen(true)}
          />

          {/* Workspace Body */}
          <main>
            <PageContainer
              size="workspace"
              className="pt-4 pb-8 sm:pt-5 sm:pb-10"
            >
              {/* Alert Notice Banner */}
              {notice && (
                <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200/90 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600" />
                    <span>{notice}</span>
                  </div>
                  <button
                    onClick={() => setNotice("")}
                    className="cursor-pointer text-emerald-700 hover:text-emerald-900"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Error Banner */}
              {error && (
                <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200/90 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-4 text-red-600" />
                    <span>{error}</span>
                  </div>
                  <button
                    onClick={() => setError("")}
                    className="cursor-pointer text-red-700 hover:text-red-900"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Main Area Switching */}
              {children}
            </PageContainer>
          </main>
        </div>

        {/* Confirmation Dialog for Administrator Signout */}
        <LogoutConfirmationDialog
          open={logoutDialogOpen}
          onOpenChange={setLogoutDialogOpen}
          onConfirm={signOut}
          isLoading={signingOut}
          title="Sign out of Admin Console?"
          description="Are you sure you want to log out? Unsaved changes will be discarded."
        />
      </div>
    </AdminDashboardContext.Provider>
  );
}
