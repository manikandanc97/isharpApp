"use client";

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
import { AdminWorkspaceContentSkeleton } from "@/components/skeletons/admin-layout-skeleton";
import type { AdminDashboardSection } from "@/components/admin/admin-types";
import { useAdminDashboardContext } from "./admin/admin-dashboard-context";

export type { AdminDashboardSection };

export function AdminSectionView({
  section = "overview",
}: {
  section?: AdminDashboardSection;
}) {
  const {
    session,
    loading,
    setError,
    overview,
    users,
    internalStudents,
    setInternalStudents,
    courses,
    navigateToSection,
    loadAll,
    showNotice,
    setUserActive,
    manageStudentAccess,
    createCourse,
    toggleCourse,
  } = useAdminDashboardContext();

  if (loading) {
    return <AdminWorkspaceContentSkeleton section={section} />;
  }

  if (section === "overview") {
    return overview ? (
      <OverviewSection
        overview={overview}
        users={users}
        courses={courses}
        onNavigate={navigateToSection}
      />
    ) : null;
  }

  if (section === "students") {
    return (
      <div className="space-y-6">
        <StudentsSection
          users={users}
          internalStudents={internalStudents}
          currentProfileId={session?.profileId}
          canManagePrivileged={session?.roles.includes("SUPERADMIN") ?? false}
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
    );
  }

  if (section === "courses") {
    return (
      <CoursesSection
        courses={courses}
        onCreate={createCourse}
        onToggle={toggleCourse}
      />
    );
  }

  if (section === "questions") {
    return <QuestionBankManager />;
  }

  if (section === "test-series" || section === "tests") {
    return <TestSeriesSection onNotice={showNotice} onError={setError} />;
  }

  if (section === "exams") {
    return <ExamManagementSection onNotice={showNotice} onError={setError} />;
  }

  if (section === "results") {
    return <ResultsSection onNotice={showNotice} onError={setError} />;
  }

  if (section === "roles") {
    return <RolesSection onNotice={showNotice} onError={setError} />;
  }

  if (section === "settings") {
    return <SettingsSection onNotice={showNotice} onError={setError} />;
  }

  if (section === "audit-logs") {
    return <AuditLogsSection onNotice={showNotice} onError={setError} />;
  }

  return null;
}
