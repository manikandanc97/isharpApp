"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileQuestion,
  HelpCircle,
  LoaderCircle,
  Play,
  Power,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/admin/admin-helpers";
import { AdminWorkspaceContentSkeleton } from "@/components/skeletons/admin-layout-skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  ExamStatus,
  ScheduledExam,
  StudentAssignmentTarget,
  StudentExamAttempt,
} from "@/lib/exam-management-store";

interface ExamManagementSectionProps {
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}

export function ExamManagementSection({
  onNotice,
  onError,
}: ExamManagementSectionProps) {
  const [activeTab, setActiveTab] = useState<ExamStatus | "ALL">("LIVE");
  const [exams, setExams] = useState<ScheduledExam[]>([]);
  const [attempts, setAttempts] = useState<StudentExamAttempt[]>([]);
  const [stats, setStats] = useState({
    totalExams: 0,
    liveExams: 0,
    upcomingExams: 0,
    completedExams: 0,
    activeTestTakers: 0,
    totalAttempts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [examPage, setExamPage] = useState(1);
  const examPageSize = 10;
  const [attemptPage, setAttemptPage] = useState(1);
  const attemptPageSize = 10;

  // Reset exam page on filter or search query change
  useEffect(() => {
    setExamPage(1);
  }, [activeTab, searchQuery]);

  // Assignment dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedExamForAssign, setSelectedExamForAssign] = useState<ScheduledExam | null>(null);
  const [targetType, setTargetType] = useState<StudentAssignmentTarget>("ALL");

  const loadData = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    try {
      const [examsRes, attemptsRes] = await Promise.all([
        fetch("/api/admin/exams", { cache: "no-store" }),
        fetch("/api/admin/exams/attempts", { cache: "no-store" }),
      ]);

      if (examsRes.ok) {
        const data = await examsRes.json();
        setExams(data.exams || []);
        if (data.stats) setStats(data.stats);
      }
      if (attemptsRes.ok) {
        const data = await attemptsRes.json();
        setAttempts(data || []);
      }
    } catch {
      onError("Failed to load exam management data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleUpdateStatus = async (examId: string, status: ExamStatus) => {
    try {
      const res = await fetch("/api/admin/exams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: examId, status }),
      });
      if (!res.ok) throw new Error("Failed to update exam status");
      onNotice(`Exam status updated to ${status}`);
      await loadData(true);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error updating status");
    }
  };

  const handleSaveAssignment = async () => {
    if (!selectedExamForAssign) return;
    try {
      const res = await fetch("/api/admin/exams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedExamForAssign.id,
          assignmentTarget: targetType,
          assignedStudentIds: [],
        }),
      });
      if (!res.ok) throw new Error("Failed to update student assignment");
      onNotice("Student assignment updated successfully");
      setAssignDialogOpen(false);
      await loadData(true);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error saving assignment");
    }
  };

  const handleAttemptAction = async (attemptId: string, action: "AUTO_SUBMIT" | "GRANT_REATTEMPT" | "RESET") => {
    try {
      const res = await fetch("/api/admin/exams/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, action }),
      });
      if (!res.ok) throw new Error("Action failed");
      const msg =
        action === "AUTO_SUBMIT"
          ? "Test submitted successfully on behalf of student"
          : action === "GRANT_REATTEMPT"
          ? "Granted +1 additional reattempt to student"
          : "Attempt reset successfully";
      onNotice(msg);
      await loadData(true);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Attempt action error");
    }
  };

  const filteredExams = exams.filter((e) => {
    if (activeTab !== "ALL" && e.status !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.testName.toLowerCase().includes(q) ||
        e.testCode.toLowerCase().includes(q) ||
        e.categoryName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalExamPages = Math.max(1, Math.ceil(filteredExams.length / examPageSize));
  const currentExamPage = Math.min(examPage, totalExamPages);
  const paginatedExams = useMemo(() => {
    const start = (currentExamPage - 1) * examPageSize;
    return filteredExams.slice(start, start + examPageSize);
  }, [filteredExams, currentExamPage, examPageSize]);

  const totalAttemptPages = Math.max(1, Math.ceil(attempts.length / attemptPageSize));
  const currentAttemptPage = Math.min(attemptPage, totalAttemptPages);
  const paginatedAttempts = useMemo(() => {
    const start = (currentAttemptPage - 1) * attemptPageSize;
    return attempts.slice(start, start + attemptPageSize);
  }, [attempts, currentAttemptPage, attemptPageSize]);

  if (loading) return <AdminWorkspaceContentSkeleton section="exams" />;

  return (
    <div className="space-y-6">
      {/* Real-time Metric Cards & Sync */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-3xs font-semibold uppercase tracking-wider text-brand-blue">
              Live Proctoring &amp; Scheduling
            </p>
            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Exam Management
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Monitor live test windows, scheduled exams &amp; student attempts.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={refreshing}
            onClick={() => void loadData(true)}
            className="w-fit gap-1.5 rounded-full"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </Button>
        </div>

        {/* Real-time Metric Cards */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-blue-700">
              <span>Live Exams</span>
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-blue-950">{stats.liveExams}</p>
            <p className="mt-0.5 text-3xs text-blue-800 font-medium">{stats.activeTestTakers} active test takers connected</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-700">
              <span>Upcoming</span>
              <Clock className="size-4 text-amber-600" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-amber-950">{stats.upcomingExams}</p>
            <p className="mt-0.5 text-3xs text-amber-800 font-medium">Scheduled for future testing</p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-700">
              <span>Completed</span>
              <CheckCircle2 className="size-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-emerald-950">{stats.completedExams}</p>
            <p className="mt-0.5 text-3xs text-emerald-800 font-medium">Archived test windows</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span>Total Attempts</span>
              <Users className="size-4 text-slate-500" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{stats.totalAttempts}</p>
            <p className="mt-0.5 text-3xs text-slate-500 font-medium">Internal & External learners</p>
          </div>
        </div>
      </section>

      {/* Tabs and Exam List */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-200 bg-[#fbfbfa] p-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: "LIVE", label: `Live Exams (${stats.liveExams})` },
                { key: "UPCOMING", label: `Upcoming (${stats.upcomingExams})` },
                { key: "COMPLETED", label: `Completed (${stats.completedExams})` },
                { key: "CANCELLED", label: "Cancelled" },
                { key: "ALL", label: `All Exams (${exams.length})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as never)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                    activeTab === tab.key
                      ? "bg-brand-blue text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exams..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs outline-none focus:border-indigo-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition focus:outline-none"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Exams Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-3xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Test Code & Name</th>
                <th className="px-5 py-3">Target Category</th>
                <th className="px-5 py-3">Schedule Window</th>
                <th className="px-5 py-3">Duration & Marks</th>
                <th className="px-5 py-3">Student Eligibility</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedExams.map((exam) => {
                const statusTone =
                  exam.status === "LIVE"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : exam.status === "UPCOMING"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : exam.status === "COMPLETED"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-rose-50 text-rose-700 border-rose-200";

                return (
                  <tr key={exam.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-3xs font-bold uppercase tracking-wider ${statusTone}`}>
                        {exam.status === "LIVE" && <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                        {exam.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      <div>
                        <span className="font-bold text-indigo-700">{exam.testCode}</span>
                        <p className="text-slate-900 font-semibold">{exam.testName}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-3xs font-semibold">
                        {exam.categoryName}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-3xs">
                      <div>{new Date(exam.startTime).toLocaleDateString()}</div>
                      <div className="font-mono text-slate-400">
                        {new Date(exam.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                        {new Date(exam.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <div>{exam.durationMinutes} mins · {exam.totalQuestions} Qs</div>
                      <span className="font-semibold text-slate-900">{exam.totalMarks} Marks</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExamForAssign(exam);
                          setTargetType(exam.assignmentTarget);
                          setAssignDialogOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-3xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <UserCheck className="size-3 text-brand-blue" />
                        <span>
                          {exam.assignmentTarget === "ALL"
                            ? "All Learners"
                            : exam.assignmentTarget === "INTERNAL_ONLY"
                            ? "Internal Only"
                            : "External Only"}
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {exam.status === "UPCOMING" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(exam.id, "LIVE")}
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-3xs font-semibold text-white hover:bg-emerald-700"
                          >
                            <Play className="size-3" />
                            <span>Go Live</span>
                          </button>
                        )}
                        {exam.status === "LIVE" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(exam.id, "COMPLETED")}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-3xs font-semibold text-white hover:bg-blue-700"
                          >
                            <CheckCircle2 className="size-3" />
                            <span>Conclude</span>
                          </button>
                        )}
                        {exam.status !== "CANCELLED" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(exam.id, "CANCELLED")}
                            className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-3xs font-semibold text-rose-700 hover:bg-rose-100"
                            title="Cancel exam window"
                          >
                            <XCircle className="size-3" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredExams.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                    No scheduled exams found matching this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Exams Pagination Footer */}
        {filteredExams.length > 0 && (
          <div className="border-t border-slate-200 bg-[#fbfbfa] px-5 py-3.5">
            <TablePagination
              page={currentExamPage}
              pageSize={examPageSize}
              totalItems={filteredExams.length}
              onPageChange={setExamPage}
            />
          </div>
        )}
      </section>

      {/* Live Attempt Monitoring Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-200 bg-[#fbfbfa] p-5 sm:px-7">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Live Student Attempt Monitoring & Proctoring
              </h3>
              <p className="text-xs text-slate-500">
                Track live test submissions, time spent, question progress, force auto-submissions, and configure reattempts
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {attempts.length} Total Attempts Logged
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-3xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Student ID & Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Test Paper</th>
                <th className="px-5 py-3">Started At</th>
                <th className="px-5 py-3">Attempt Status</th>
                <th className="px-5 py-3">Questions & Score</th>
                <th className="px-5 py-3 text-right">Attempt Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedAttempts.map((att) => {
                const statusTone =
                  att.status === "IN_PROGRESS"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : att.status === "EVALUATED" || att.status === "SUBMITTED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600";

                return (
                  <tr key={att.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <div>
                        <span className="font-bold text-slate-900">{att.studentName}</span>
                        <p className="font-mono text-3xs text-indigo-700">{att.studentId}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-3xs font-bold ${
                          att.studentCategory === "INTERNAL"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {att.studentCategory}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium max-w-[200px] truncate">
                      {att.testName}
                    </td>
                    <td className="px-5 py-3.5 text-3xs text-slate-500">
                      {new Date(att.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-3xs font-bold uppercase tracking-wider ${statusTone}`}>
                        {att.status === "IN_PROGRESS" && <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />}
                        {att.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {att.status === "IN_PROGRESS" ? (
                        <span className="text-slate-600 text-3xs font-medium">
                          {att.questionsAttempted} / {att.totalQuestions} Attempted
                        </span>
                      ) : (
                        <div>
                          <span className="font-bold text-emerald-700 text-xs">{att.score}</span>
                          <span className="text-slate-400 text-3xs"> / {att.totalMarks} ({att.percentage}%)</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {att.status === "IN_PROGRESS" && (
                          <button
                            type="button"
                            onClick={() => handleAttemptAction(att.id, "AUTO_SUBMIT")}
                            className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2 py-1 text-3xs font-semibold text-white hover:bg-amber-700 shadow-2xs"
                            title="Force auto-submit for timed out or unresponsive student"
                          >
                            <ShieldAlert className="size-3" />
                            <span>Auto-Submit</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAttemptAction(att.id, "GRANT_REATTEMPT")}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-3xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                          title="Grant +1 attempt"
                        >
                          <span>+ Reattempt</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttemptAction(att.id, "RESET")}
                          className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-3xs font-semibold text-rose-700 hover:bg-rose-100 shadow-2xs"
                          title="Reset student test progress"
                        >
                          <span>Reset</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedAttempts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                    No student attempts logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Attempts Pagination Footer */}
        {attempts.length > 0 && (
          <div className="border-t border-slate-200 bg-[#fbfbfa] px-5 py-3.5">
            <TablePagination
              page={currentAttemptPage}
              pageSize={attemptPageSize}
              totalItems={attempts.length}
              onPageChange={setAttemptPage}
            />
          </div>
        )}
      </section>

      {/* Student Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Exam Audience</DialogTitle>
            <DialogDescription>
              Configure student eligibility for {selectedExamForAssign?.testName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Target Cohort</label>
              <div className="space-y-2">
                {[
                  { key: "ALL", label: "All Enrolled Students (Internal & External)", desc: "Any authenticated student can sit this exam" },
                  { key: "INTERNAL_ONLY", label: "Internal Academy Students Only", desc: "Restricted to verified ISA enrolled batch" },
                  { key: "EXTERNAL_ONLY", label: "External Learners Only", desc: "Open to general external subscribers" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                      targetType === item.key ? "border-brand-blue bg-blue-50/50" : "border-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === item.key}
                      onChange={() => setTargetType(item.key as never)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{item.label}</p>
                      <p className="text-3xs text-slate-500">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAssignment} className="bg-brand-blue text-white">
              Save Eligibility
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
