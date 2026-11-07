"use client";

import { AlertCircle, Check } from "lucide-react";
import { PageContainer } from "@/components/layout/layout-primitives";
import { CoursesSection } from "@/components/admin/courses-section";
import { OverviewSection } from "@/components/admin/overview-section";
import { StudentsSection } from "@/components/admin/students-section";
import { QuestionBankManager } from "@/components/question-bank-manager";
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog";
import { AdminWorkspaceContentSkeleton } from "@/components/skeletons/admin-layout-skeleton";
import type { AdminDashboardSection } from "@/components/admin/admin-types";
import { useAdminDashboard } from "./admin/use-admin-dashboard";
import { AdminSidebar } from "./admin/admin-sidebar";
import { AdminHeader } from "./admin/admin-header";

export type { AdminDashboardSection };

export function AdminDashboard({
  initialSection: section = "overview",
}: {
  initialSection?: AdminDashboardSection;
}) {
  const {
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
  } = useAdminDashboard();

  return (
    <div className="relative min-h-svh overflow-x-clip bg-slate-50 font-sans text-slate-900 antialiased selection:bg-brand-red selection:text-white">
      {/* MODERN LUXURY SOLID SIDEBAR */}
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
          refreshing={refreshing}
          onRefresh={() => void loadAll(true)}
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
          <PageContainer size="workspace" className="py-(--space-layout)">
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

      {/* Confirmation Dialog for Administrator Signout */}
      <LogoutConfirmationDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        onConfirm={signOut}
        isLoading={signingOut}
        title="Sign out of Admin Console?"
        description="Are you sure you want to log out? Unsaved course updates or question bank edits will be discarded."
      />
    </div>
  );
}
