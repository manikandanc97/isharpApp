"use client";

import dynamic from "next/dynamic";
import { CoursesSection } from "@/components/admin/courses-section";
import { OverviewSection } from "@/components/admin/overview-section";
import { StudentsSection } from "@/components/admin/students-section";
import { AdminWorkspaceContentSkeleton } from "@/components/skeletons/admin-layout-skeleton";
import type { AdminDashboardSection } from "@/components/admin/admin-types";
import { useAdminDashboardContext } from "./admin/admin-dashboard-context";

const TestSeriesSection = dynamic(
  () =>
    import("@/components/admin/test-series/test-series-section").then(
      (m) => m.TestSeriesSection,
    ),
  { loading: () => <AdminWorkspaceContentSkeleton section="test-series" /> },
);

const QuestionBankManager = dynamic(
  () =>
    import("@/components/question-bank-manager").then(
      (m) => m.QuestionBankManager,
    ),
  { loading: () => <AdminWorkspaceContentSkeleton section="questions" /> },
);

const ResultsSection = dynamic(
  () =>
    import("@/components/admin/results/results-section").then(
      (m) => m.ResultsSection,
    ),
  { loading: () => <AdminWorkspaceContentSkeleton section="results" /> },
);

const RolesSection = dynamic(
  () =>
    import("@/components/admin/roles/roles-section").then(
      (m) => m.RolesSection,
    ),
  { loading: () => <AdminWorkspaceContentSkeleton section="roles" /> },
);

const SettingsSection = dynamic(
  () =>
    import("@/components/admin/settings/settings-section").then(
      (m) => m.SettingsSection,
    ),
  { loading: () => <AdminWorkspaceContentSkeleton section="settings" /> },
);

const AuditLogsSection = dynamic(
  () =>
    import("@/components/admin/audit-logs/audit-logs-section").then(
      (m) => m.AuditLogsSection,
    ),
  { loading: () => <AdminWorkspaceContentSkeleton section="audit-logs" /> },
);

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
          canManagePrivileged={Boolean(
            session?.roles.some((role) => role === "ADMIN" || role === "SUPERADMIN"),
          )}
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
