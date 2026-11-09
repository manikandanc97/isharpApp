"use client";

import { useState } from "react";
import { StudentAnalyticsTab } from "./student-analytics-tab";
import { StudentDppTab } from "./student-dpp-tab";
import { MockInstructionsDialog } from "./student-mock-instructions-dialog";
import { StudentMocksTab } from "./student-mocks-tab";
import { StudentOverviewTab } from "./student-overview-tab";
import { StudentSubjectsTab } from "./student-subjects-tab";
import type { LanguageMode, StudentPortalData, TabId } from "./student-types";

interface StudentPortalContentProps {
  data: StudentPortalData;
  activeTab: TabId;
  language: LanguageMode;
  onTabChange: (tab: TabId) => void;
}

export function StudentPortalContent({
  data,
  activeTab,
  language,
  onTabChange,
}: StudentPortalContentProps) {
  const [dppSubjectFilter, setDppSubjectFilter] = useState<string>("ALL");
  const [selectedMock, setSelectedMock] = useState<StudentPortalData["mockTests"][number] | null>(null);
  const [mockDialogOpen, setMockDialogOpen] = useState(false);

  const handlePracticeSubject = (subjectName: string) => {
    setDppSubjectFilter(subjectName);
    onTabChange("dpp");
  };

  const handleOpenMockDetails = (mock: StudentPortalData["mockTests"][number]) => {
    setSelectedMock(mock);
    setMockDialogOpen(true);
  };

  return (
    <div className="w-full transition-opacity duration-200">
      {activeTab === "overview" && (
        <StudentOverviewTab
          data={data}
          onTabChange={onTabChange}
          onOpenMockDetails={handleOpenMockDetails}
        />
      )}

      {activeTab === "dpp" && (
        <StudentDppTab
          data={data}
          globalLanguage={language}
          initialSubjectFilter={dppSubjectFilter}
        />
      )}

      {activeTab === "mocks" && <StudentMocksTab data={data} />}

      {activeTab === "subjects" && (
        <StudentSubjectsTab
          data={data}
          onPracticeSubject={handlePracticeSubject}
        />
      )}

      {activeTab === "analytics" && (
        <StudentAnalyticsTab data={data} onTabChange={onTabChange} />
      )}

      {/* Global Mock Test Instructions Dialog */}
      <MockInstructionsDialog
        mock={selectedMock}
        open={mockDialogOpen}
        onOpenChange={setMockDialogOpen}
      />
    </div>
  );
}
