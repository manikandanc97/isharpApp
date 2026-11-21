"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BookCheck,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileQuestion,
  Info,
  Play,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "./student-helpers";
import { MockInstructionsDialog } from "./student-mock-instructions-dialog";
import type { StudentPortalData } from "./student-types";

interface StudentMocksTabProps {
  data: StudentPortalData;
}

export function StudentMocksTab({ data }: StudentMocksTabProps) {
  const router = useRouter();
  const [subTab, setSubTab] = useState<"series" | "papers">("series");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSeriesId, setExpandedSeriesId] = useState<string>("");
  const [selectedMock, setSelectedMock] = useState<StudentPortalData["mockTests"][number] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Published test series from real backend data
  const publishedSeries = useMemo(() => {
    return data.testSeries || [];
  }, [data.testSeries]);

  const filteredMocks = useMemo(() => {
    if (!searchQuery.trim()) return data.mockTests;
    const q = searchQuery.toLowerCase();
    return data.mockTests.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        (m.description?.toLowerCase().includes(q) ?? false)
    );
  }, [data.mockTests, searchQuery]);

  const handleOpenInstructions = (mock: StudentPortalData["mockTests"][number]) => {
    setSelectedMock(mock);
    setDialogOpen(true);
  };

  const handleStartIndividualTest = (test: any, series: any) => {
    const mockPayload: StudentPortalData["mockTests"][number] = {
      id: test.id,
      code: test.code,
      title: test.title || test.name,
      description: test.description || series.title || series.name,
      durationMinutes: test.durationMinutes,
      totalMarks: test.totalMarks,
      instructionsEn: test.instructionsEn || test.instructions || null,
      instructionsTa: test.instructionsTa || null,
      scheduledAt: test.scheduledAt || (test.testDate ? `${test.testDate}T10:00:00.000Z` : null),
      availableUntil: test.availableUntil || null,
      questionCount: test.questionCount || test.totalQuestions,
      activeAttemptId: test.activeAttemptId,
      availabilityStatus: test.availabilityStatus,
      latestResult: test.latestResult,
    };
    setSelectedMock(mockPayload);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Exam Instructions Hero */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-700">
                OFFICIAL NEET TEST SERIES
              </span>
              <span className="text-xs text-slate-500">
                Class 11, Class 12 & Repeater Cohorts
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              Assessment Series & Mock Papers
            </h2>
            <p className="mt-1 text-xs text-slate-600 max-w-xl">
              Experience the pressure, pacing, and negative marking of real NTA examinations. All papers feature authentic bilingual questions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSubTab("series")}
                className={`cursor-pointer rounded-full px-4 py-1.5 transition ${
                  subTab === "series"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Test Series ({publishedSeries.length})
              </button>
              <button
                type="button"
                onClick={() => setSubTab("papers")}
                className={`cursor-pointer rounded-full px-4 py-1.5 transition ${
                  subTab === "papers"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                All Mock Papers ({data.mockTests.length})
              </button>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-5 relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search test series or mock papers by name..."
            className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-9 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition focus:outline-none"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </section>

      {/* SUB-TAB 1: TEST SERIES VIEW */}
      {subTab === "series" && (
        <div className="space-y-4">
          {publishedSeries.map((series) => {
            const isExpanded = expandedSeriesId === series.id;
            const tests = series.tests || [];
            const completedCount = tests.filter((t) => t.status === "COMPLETED").length;
            const upcomingCount = tests.filter(
              (t) => t.status === "SCHEDULED" || t.status === "PUBLISHED"
            ).length;
            const progressPct = tests.length
              ? Math.round((completedCount / tests.length) * 100)
              : 0;

            return (
              <article
                key={series.id}
                className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xs transition hover:border-slate-300"
              >
                {/* Series Summary Banner */}
                <div
                  onClick={() =>
                    setExpandedSeriesId(isExpanded ? "" : series.id)
                  }
                  className="flex cursor-pointer flex-col justify-between gap-4 p-5 sm:p-6 sm:flex-row sm:items-center hover:bg-slate-50/50 transition"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-brand-blue border border-blue-200">
                        {series.categoryName ||
                          (series.title?.includes("Class 11")
                            ? "Class 11"
                            : series.title?.includes("Class 12")
                            ? "Class 12"
                            : "Repeater Course")}
                      </span>
                      <span className="text-3xs font-semibold text-slate-400 font-mono">
                        AY {series.academicYear}
                      </span>
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 text-3xs font-bold">
                        ENROLLED ACCESS
                      </Badge>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {series.title}
                    </h3>

                    {series.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 max-w-3xl">
                        {series.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="pt-2 max-w-md">
                      <div className="flex items-center justify-between text-3xs font-semibold text-slate-500 mb-1">
                        <span>Overall Completion</span>
                        <span>
                          {completedCount} of {tests.length} Tests Done ({progressPct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stats & Expand Button */}
                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="hidden lg:grid grid-cols-2 gap-3 text-center border-l border-slate-100 pl-4">
                      <div>
                        <span className="text-3xs text-slate-400">UPCOMING</span>
                        <p className="font-bold text-slate-800 text-sm">{upcomingCount}</p>
                      </div>
                      <div>
                        <span className="text-3xs text-slate-400">COMPLETED</span>
                        <p className="font-bold text-emerald-700 text-sm">{completedCount}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                      aria-label="Toggle series tests"
                    >
                      {isExpanded ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Individual Test List */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/40 p-4 sm:p-6 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Tests in this Series ({tests.length})
                    </h4>

                    <div className="space-y-2.5">
                      {tests.map((test) => {
                        const isAvailable =
                          test.status === "PUBLISHED" ||
                          test.status === "SCHEDULED" ||
                          test.availabilityStatus === "LIVE" ||
                          test.availabilityStatus === "RESUMABLE";
                        const isCompleted =
                          test.status === "COMPLETED" || test.availabilityStatus === "COMPLETED";
                        const hasActiveAttempt = Boolean(test.activeAttemptId);

                        return (
                          <div
                            key={test.id}
                            className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:flex-row sm:items-center hover:shadow-card transition"
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-brand-red">
                                  {test.code}
                                </span>
                                <span className="rounded bg-indigo-50 px-2 py-0.5 text-3xs font-semibold text-brand-blue">
                                  {test.testType}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-3xs font-bold ${
                                    hasActiveAttempt
                                      ? "bg-amber-100 text-amber-800"
                                      : isCompleted
                                      ? "bg-slate-100 text-slate-700"
                                      : "bg-emerald-50 text-emerald-700"
                                  }`}
                                >
                                  {hasActiveAttempt
                                    ? "IN PROGRESS"
                                    : test.availabilityStatus || test.status}
                                </span>
                                {test.latestResult && (
                                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-3xs font-bold text-emerald-800 border border-emerald-200">
                                    Score: {test.latestResult.score}/{test.totalMarks} (
                                    {Math.round(test.latestResult.percentage)}%)
                                  </span>
                                )}
                              </div>

                              <h5 className="text-sm font-bold text-slate-900">
                                {test.title || test.name}
                              </h5>

                              <div className="flex flex-wrap items-center gap-3 text-3xs text-slate-500 pt-0.5">
                                <span className="flex items-center gap-1 font-semibold text-purple-700">
                                  <FileQuestion className="size-3" />
                                  {test.questionCount || test.questionIds?.length || test.totalQuestions} Questions
                                </span>
                                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                                  <Award className="size-3" />
                                  {test.totalMarks} Marks
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="size-3" />
                                  {test.durationMinutes} Mins
                                </span>
                                {(test.scheduledAt || test.testDate) && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    {formatDate(test.scheduledAt || test.testDate)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {hasActiveAttempt ? (
                                <Button
                                  size="sm"
                                  onClick={() => router.push(`/exam/${test.activeAttemptId}`)}
                                  className="h-8 gap-1.5 rounded-full bg-amber-600 text-xs font-semibold text-white shadow-primary hover:bg-amber-700"
                                >
                                  <Play className="size-3.5 fill-white" />
                                  Resume Exam
                                </Button>
                              ) : isCompleted && test.latestResult ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStartIndividualTest(test, series)}
                                  className="h-8 gap-1 rounded-full border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                                  View Result
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  disabled={!isAvailable}
                                  onClick={() => handleStartIndividualTest(test, series)}
                                  className="h-8 gap-1.5 rounded-full bg-brand-red text-xs font-semibold text-white shadow-primary hover:bg-brand-red-hover disabled:opacity-50"
                                >
                                  <Play className="size-3.5 fill-white" />
                                  Start Test
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* SUB-TAB 2: ALL MOCK PAPERS (EXISTING TAB) */}
      {subTab === "papers" && (
        <div className="space-y-4">
          {filteredMocks.length ? (
            filteredMocks.map((mock) => {
              return (
                <article
                  key={mock.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs transition-all hover:border-slate-300 hover:shadow-card"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-brand-red/10 px-2.5 py-0.5 font-mono text-xs font-bold text-brand-red">
                          {mock.code}
                        </span>
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 text-3xs font-semibold">
                          ACTIVE TEST PAPER
                        </Badge>
                        <span className="text-xs text-slate-400 font-medium">
                          Schedule: <strong className="text-slate-700">{formatDate(mock.scheduledAt)}</strong>
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">
                        {mock.title}
                      </h3>

                      {mock.description && (
                        <p className="max-w-3xl text-xs sm:text-sm leading-relaxed text-slate-600">
                          {mock.description}
                        </p>
                      )}

                      {/* Metric Pills */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                        <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                          <Clock className="size-3.5 text-brand-blue" />
                          <span>{mock.durationMinutes} Minutes</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                          <Award className="size-3.5 text-emerald-600" />
                          <span>{mock.totalMarks} Total Marks</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                          <FileQuestion className="size-3.5 text-purple-600" />
                          <span>{mock.questionCount} Questions</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1 text-slate-500">
                          <ShieldCheck className="size-3.5 text-slate-400" />
                          <span>+4 / -1 Marking Rule</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0 sm:flex-row lg:flex-col lg:items-end">
                      {mock.activeAttemptId ? (
                        <Button
                          onClick={() => router.push(`/exam/${mock.activeAttemptId}`)}
                          className="rounded-full bg-amber-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-primary hover:bg-amber-700 transition active:scale-95 cursor-pointer"
                        >
                          <Play className="mr-1.5 size-4 fill-white" />
                          <span>Resume Exam</span>
                        </Button>
                      ) : mock.latestResult ? (
                        <Button
                          onClick={() => handleOpenInstructions(mock)}
                          className="rounded-full bg-emerald-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-primary hover:bg-emerald-700 transition active:scale-95 cursor-pointer"
                        >
                          <CheckCircle2 className="mr-1.5 size-4" />
                          <span>View Result</span>
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleOpenInstructions(mock)}
                          className="rounded-full bg-brand-red px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-primary hover:bg-brand-red-hover transition active:scale-95 cursor-pointer"
                        >
                          <Play className="mr-1.5 size-4 fill-white" />
                          <span>Take Test</span>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenInstructions(mock)}
                        className="rounded-full border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Info className="mr-1 size-3.5 text-brand-blue" />
                        <span>View Guidelines</span>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <BookCheck className="mx-auto size-10 text-slate-400" />
              <h3 className="mt-3 text-base font-bold text-slate-800">
                No mock tests found
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                No published mock tests match your search query.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Guidelines Modal */}
      <MockInstructionsDialog
        mock={selectedMock}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
