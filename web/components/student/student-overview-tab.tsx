"use client";

import { useState } from "react";
import {
  BookCheck,
  Check,
  Copy,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTimeGreeting } from "./student-helpers";
import type { StudentPortalData, TabId } from "./student-types";
import { StudentActivitySection } from "./tabs/student-activity-section";
import { StudentOverviewStatGrid } from "./tabs/student-overview-stat-grid";
import { StudentSyllabusSection } from "./tabs/student-syllabus-section";
import { StudentUpcomingMockCard } from "./tabs/student-upcoming-mock-card";

export { StudentActivitySection } from "./tabs/student-activity-section";
export { StudentOverviewStatGrid } from "./tabs/student-overview-stat-grid";
export { StudentSyllabusSection } from "./tabs/student-syllabus-section";
export { StudentUpcomingMockCard } from "./tabs/student-upcoming-mock-card";

interface StudentOverviewTabProps {
  data: StudentPortalData;
  onTabChange: (tab: TabId) => void;
  onOpenMockDetails?: (mock: StudentPortalData["mockTests"][number]) => void;
}

export function StudentOverviewTab({
  data,
  onTabChange,
  onOpenMockDetails,
}: StudentOverviewTabProps) {
  const [copiedId, setCopiedId] = useState(false);
  const { greeting, icon: greetingIcon } = getTimeGreeting();

  const handleCopyStudentId = async () => {
    try {
      await navigator.clipboard.writeText(data.student.studentId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Fallback
    }
  };

  const isInternal = data.student.category === "INTERNAL";
  const upcomingMock = data.mockTests[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Academy Welcome Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-brand-red/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 size-72 rounded-full bg-brand-blue/5 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  isInternal
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-indigo-200 bg-indigo-50 text-brand-blue"
                }`}
              >
                <ShieldCheck className="size-3.5" />
                <span>{isInternal ? "Internal Student" : "External Student"}</span>
              </Badge>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {greeting}, {data.student.displayName} {greetingIcon}
            </h1>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-600">
              Access your daily practice problems, scheduled tests, results, and study materials.
            </p>

            {/* Quick Metadata Chips */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-mono shadow-2xs">
                <span className="text-slate-400">ROLL:</span>
                <span className="font-semibold text-slate-900">{data.student.studentId}</span>
                <button
                  type="button"
                  onClick={handleCopyStudentId}
                  className="ml-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Copy Student ID"
                  aria-label="Copy Student ID"
                >
                  {copiedId ? (
                    <Check className="size-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
                <span className="text-slate-400">Access: </span>
                <span className="font-semibold text-emerald-700">
                  {isInternal ? "Full Institutional Pass" : data.student.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Button Box */}
          <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col lg:items-end shrink-0">
            <Button
              onClick={() => onTabChange("dpp")}
              className="rounded-full bg-brand-red px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-primary hover:bg-brand-red-hover transition active:scale-95 cursor-pointer"
            >
              <Zap className="mr-1.5 size-4" />
              <span>Practice DPP Questions</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => onTabChange("mocks")}
              className="rounded-full border-slate-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-95 cursor-pointer"
            >
              <BookCheck className="mr-1.5 size-4 text-brand-blue" />
              <span>Explore Mock Tests</span>
            </Button>
          </div>
        </div>
      </section>

      {/* 5-Column Stats Grid */}
      <StudentOverviewStatGrid summary={data.summary} onTabChange={onTabChange} />

      {/* Dual Highlights: Upcoming Mocks & Curriculum Snapshot */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StudentUpcomingMockCard
          upcomingMock={upcomingMock}
          totalMocksCount={data.mockTests.length}
          onTabChange={onTabChange}
          onOpenMockDetails={onOpenMockDetails}
        />
        <StudentSyllabusSection
          courses={data.courses}
          onTabChange={onTabChange}
        />
      </div>

      {/* Study Habit, Streak & Practice Target Ribbon */}
      <StudentActivitySection onTabChange={onTabChange} />
    </div>
  );
}
