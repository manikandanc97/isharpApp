"use client";

import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog";
import { PageContainer } from "@/components/layout/layout-primitives";
import { StudentAccessGate } from "@/components/student/student-access-gate";
import { StudentHeader } from "@/components/student/student-header";
import { StudentPortalContent } from "@/components/student/student-portal-content";
import { StudentProfileDialog } from "@/components/student/student-profile-dialog";
import { LuxuryDashboardSkeleton } from "@/components/student/student-skeleton";
import { StudentTabNav } from "@/components/student/student-tab-nav";
import { useStudentDashboard } from "@/components/student/use-student-dashboard";

export function StudentDashboard() {
  const dashboard = useStudentDashboard();
  const logoutDialog = (
    <LogoutConfirmationDialog
      open={dashboard.logoutDialogOpen}
      onOpenChange={dashboard.setLogoutDialogOpen}
      onConfirm={dashboard.confirmSignOut}
      isLoading={dashboard.isSigningOut}
      title="Sign out of Student Portal?"
      description="Are you sure you want to end your current session?"
    />
  );

  if (dashboard.status === "loading") {
    return (
      <>
        <LuxuryDashboardSkeleton />
        {logoutDialog}
      </>
    );
  }

  if (dashboard.status !== "ready" || !dashboard.portalData) {
    return (
      <>
        <StudentAccessGate
          status={dashboard.status}
          statusMessage={dashboard.statusMessage}
          onSignOut={dashboard.promptSignOut}
          onRetry={dashboard.retryLoad}
        />
        {logoutDialog}
      </>
    );
  }

  const { student } = dashboard.portalData;

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fc] font-sans text-slate-900 antialiased selection:bg-brand-red selection:text-white">
      <StudentHeader
        session={dashboard.session}
        isInternal={student.category === "INTERNAL"}
        selectedLanguage={dashboard.selectedLanguage}
        onLanguageChange={dashboard.setSelectedLanguage}
        displayName={student.displayName}
        studentIdDisplay={student.studentId}
        studentCategory={student.category}
        profileInitial={student.displayName.charAt(0).toUpperCase()}
        onOpenProfile={dashboard.openProfile}
        onPromptSignOut={dashboard.promptSignOut}
      />

      <main className="flex-1">
        <PageContainer size="workspace" className="space-y-6 py-(--space-content)">
          <StudentTabNav
            activeTab={dashboard.activeTab}
            onTabChange={dashboard.setActiveTab}
            counts={{
              dpp: dashboard.portalData.summary.activeQuestions,
              mocks: dashboard.portalData.summary.publishedMocks,
              subjects: dashboard.portalData.summary.activeSubjects,
            }}
          />
          <StudentPortalContent
            data={dashboard.portalData}
            activeTab={dashboard.activeTab}
            language={dashboard.selectedLanguage}
            onTabChange={dashboard.setActiveTab}
          />
        </PageContainer>
      </main>

      <StudentProfileDialog
        open={dashboard.profileOpen}
        onOpenChange={dashboard.setProfileOpen}
        session={dashboard.session}
        profileName={dashboard.profileName}
        setProfileName={dashboard.setProfileName}
        profileError={dashboard.profileError}
        savingProfile={dashboard.savingProfile}
        onSave={dashboard.saveProfile}
      />

      {logoutDialog}
    </div>
  );
}
