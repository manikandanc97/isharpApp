"use client";

import { AlertCircle, Check } from "lucide-react";
import { PageContainer } from "@/components/layout/layout-primitives";
import { CoursesSection } from "@/components/admin/courses-section";
import { OverviewSection } from "@/components/admin/overview-section";
import { StudentsSection } from "@/components/admin/students-section";
import { TestSeriesSection } from "@/components/admin/test-series/test-series-section";
import { QuestionBankManager } from "@/components/question-bank-manager";
import { ExamManagementSection } from "@/components/admin/exams/exam-management-section";
import { ResultsSection } from "@/components/admin/results/results-section";
import { RolesSection } from "@/components/admin/roles/roles-section";
import { SettingsSection } from "@/components/admin/settings/settings-section";
import { AuditLogsSection } from "@/components/admin/audit-logs/audit-logs-section";
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
          <PageContainer size="workspace" className="pt-4 pb-8 sm:pt-5 sm:pb-10">
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
                {/* 1. Overview */}
                {section === "overview" && overview && (
                  <OverviewSection
                    overview={overview}
                    users={users}
                    courses={courses}
                    onNavigate={navigateToSection}
                  />
                )}

                {/* 2. Students */}
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
                      onConverted={() => void loadAll(true)}
                      onNotice={showNotice}
                      onError={setError}
                    />
                  </div>
                )}

                {/* 3. Courses (Curriculum Management ONLY) */}
                {section === "courses" && (
                  <CoursesSection
                    courses={courses}
                    onCreate={createCourse}
                    onToggle={toggleCourse}
                  />
                )}

                {/* 4. Question Bank (Dedicated Module) */}
                {section === "questions" && (
                  <QuestionBankManager />
                )}

                {/* 5. Test Series */}
                {(section === "test-series" || section === "tests") && (
                  <TestSeriesSection
                    onNotice={showNotice}
                    onError={setError}
                  />
                )}

                {/* 6. Exam Management */}
                {section === "exams" && (
                  <ExamManagementSection
                    onNotice={showNotice}
                    onError={setError}
                  />
                )}

                {/* 7. Results & Analytics */}
                {section === "results" && (
                  <ResultsSection
                    onNotice={showNotice}
                    onError={setError}
                  />
                )}

                {/* 8. Roles & Permissions */}
                {section === "roles" && (
                  <RolesSection
                    onNotice={showNotice}
                    onError={setError}
                  />
                )}

                {/* 9. Settings */}
                {section === "settings" && (
                  <SettingsSection
                    onNotice={showNotice}
                    onError={setError}
                  />
                )}

                {/* 10. Audit Logs */}
                {section === "audit-logs" && (
                  <AuditLogsSection
                    onNotice={showNotice}
                    onError={setError}
                  />
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
        description="Are you sure you want to log out? Unsaved changes will be discarded."
      />
    </div>
  );
}
