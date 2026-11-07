"use client";

import { PageContainer, Stack } from "@/components/layout/layout-primitives";
import { DppDrillDialog } from "@/components/student/dpp-drill-dialog";
import { StudentProfileDialog } from "@/components/student/student-profile-dialog";
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog";
import { LuxuryDashboardSkeleton } from "@/components/student/student-skeleton";
import { StudentAnalyticsTab } from "@/components/student/tabs/student-analytics-tab";
import { StudentDppTab } from "@/components/student/tabs/student-dpp-tab";
import { StudentMocksTab } from "@/components/student/tabs/student-mocks-tab";
import { StudentOverviewTab } from "@/components/student/tabs/student-overview-tab";
import { StudentSubjectsTab } from "@/components/student/tabs/student-subjects-tab";
import { StudentHeader } from "@/components/student/student-header";
import { StudentHeroBanner } from "@/components/student/student-hero-banner";
import { StudentMetricsGrid } from "@/components/student/student-metrics-grid";
import { StudentTabNav } from "@/components/student/student-tab-nav";
import { StudentAccessGate } from "@/components/student/student-access-gate";
import { useStudentDashboard } from "@/components/student/use-student-dashboard";

export function StudentDashboard() {
  const {
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
  } = useStudentDashboard();

  if (status === "loading") {
    return <LuxuryDashboardSkeleton />;
  }

  if (status !== "ready") {
    return (
      <StudentAccessGate
        status={status}
        statusMessage={statusMessage}
        onSignOut={promptSignOut}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fc] font-sans text-slate-900 antialiased selection:bg-brand-red selection:text-white">
      {/* 01. PRESTIGIOUS LUXURY TOP NAVIGATION */}
      <StudentHeader
        session={session}
        isInternal={isInternal}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        displayName={displayName}
        studentIdDisplay={studentIdDisplay}
        studentCategory={studentCategory}
        profileInitial={profileInitial}
        onOpenProfile={openProfile}
        onPromptSignOut={promptSignOut}
      />

      {/* 02. MAIN CONTENT CONTAINER */}
      <main className="flex-1">
        <PageContainer size="workspace" className="py-(--space-content)">
          <Stack gap="lg">
            {/* Luxury Hero Banner */}
            <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/60 to-rose-50/30 p-(--layout-card-padding) shadow-card">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 size-72 rounded-full bg-gradient-to-bl from-brand-red/8 via-brand-blue/5 to-transparent blur-3xl pointer-events-none" />
              <Stack gap="lg" className="relative">
                <StudentHeroBanner
                  greetingName={greetingName}
                  onResumeDrill={() => setDrillOpen(true)}
                  onOpenMocks={() => setActiveTab("mocks")}
                />

                {/* 03. LUXURY METRICS GRID */}
                <StudentMetricsGrid
                  solvedCount={solvedCount}
                  isInternal={isInternal}
                  studentIdDisplay={studentIdDisplay}
                />
              </Stack>
            </section>

            {/* 04. LUXURY NAVIGATION TABS */}
            <StudentTabNav
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* 05. TAB PANELS */}
            <div>
              {activeTab === "overview" && (
                <StudentOverviewTab
                  onOpenDrill={() => setDrillOpen(true)}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === "dpp" && (
                <StudentDppTab
                  onOpenDrill={() => setDrillOpen(true)}
                  selectedAnswer={selectedAnswer}
                  setSelectedAnswer={setSelectedAnswer}
                  showExplanation={showExplanation}
                  setShowExplanation={setShowExplanation}
                />
              )}

              {activeTab === "mocks" && <StudentMocksTab />}

              {activeTab === "subjects" && (
                <StudentSubjectsTab onOpenDrill={() => setDrillOpen(true)} />
              )}

              {activeTab === "analytics" && <StudentAnalyticsTab />}
            </div>
          </Stack>
        </PageContainer>
      </main>

      {/* Interactive Daily DPP Drill Runner Modal */}
      <DppDrillDialog
        open={drillOpen}
        onOpenChange={setDrillOpen}
        currentQIndex={currentQIndex}
        setCurrentQIndex={setCurrentQIndex}
        selectedAnswer={selectedAnswer}
        setSelectedAnswer={setSelectedAnswer}
        showExplanation={showExplanation}
        setShowExplanation={setShowExplanation}
        setSolvedCount={setSolvedCount}
      />

      {/* Profile Modification Dialog */}
      <StudentProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        session={session}
        profileName={profileName}
        setProfileName={setProfileName}
        profileError={profileError}
        savingProfile={savingProfile}
        onSave={saveProfile}
      />

      {/* Safe Signout Confirmation Modal */}
      <LogoutConfirmationDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        onConfirm={confirmSignOut}
        isLoading={isSigningOut}
        title="Sign out of Student Portal?"
        description="Are you sure you want to end your current learning session? Your daily DPP streak and solved progress will be saved."
      />
    </div>
  );
}
