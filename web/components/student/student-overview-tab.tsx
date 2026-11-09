"use client";

import { useState } from "react";
import {
  ArrowRight,
  BookCheck,
  BookOpen,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  Copy,
  FileQuestion,
  Flame,
  GraduationCap,
  Layers3,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, getSubjectTheme, getTimeGreeting } from "./student-helpers";
import type { StudentPortalData, TabId } from "./student-types";

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

  const statCards = [
    {
      label: "Active Courses",
      value: data.summary.activeCourses,
      icon: GraduationCap,
      accent: "from-blue-500/10 to-indigo-500/10 text-brand-blue border-blue-100",
      iconBg: "bg-blue-50 text-brand-blue",
      actionTab: "subjects" as TabId,
      subtext: "Enrolled programs",
    },
    {
      label: "Academic Subjects",
      value: data.summary.activeSubjects,
      icon: BookOpen,
      accent: "from-emerald-500/10 to-teal-500/10 text-emerald-700 border-emerald-100",
      iconBg: "bg-emerald-50 text-emerald-600",
      actionTab: "subjects" as TabId,
      subtext: "Core science topics",
    },
    {
      label: "Curriculum Chapters",
      value: data.summary.activeChapters,
      icon: Layers3,
      accent: "from-purple-500/10 to-pink-500/10 text-purple-700 border-purple-100",
      iconBg: "bg-purple-50 text-purple-600",
      actionTab: "subjects" as TabId,
      subtext: "Syllabus modules",
    },
    {
      label: "Practice Questions",
      value: data.summary.activeQuestions,
      icon: FileQuestion,
      accent: "from-rose-500/10 to-orange-500/10 text-brand-red border-rose-100",
      iconBg: "bg-rose-50 text-brand-red",
      actionTab: "dpp" as TabId,
      subtext: "DPP problem bank",
    },
    {
      label: "Live & Upcoming Mocks",
      value: data.summary.publishedMocks,
      icon: CalendarClock,
      accent: "from-amber-500/10 to-yellow-500/10 text-amber-700 border-amber-100",
      iconBg: "bg-amber-50 text-amber-600",
      actionTab: "mocks" as TabId,
      subtext: "Timed test papers",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Academy Welcome Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-brand-red/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 size-72 rounded-full bg-brand-blue/5 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50/80 px-3 py-1 text-xs font-semibold text-brand-red">
                <Sparkles className="size-3.5" />
                <span>i-SHARP Academy Portal</span>
              </span>
              <Badge
                variant="outline"
                className={`gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  isInternal
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-indigo-200 bg-indigo-50 text-brand-blue"
                }`}
              >
                <ShieldCheck className="size-3.5" />
                <span>{data.student.category} SCHOLAR</span>
              </Badge>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {greeting}, {data.student.displayName} {greetingIcon}
            </h1>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-600">
              Welcome to your dedicated NEET/JEE learning dashboard. Access daily practice problems, official mock assessments, and verified syllabus modules crafted by top faculty.
            </p>

            {/* Quick Metadata Chips */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-mono shadow-2xs">
                <span className="text-slate-400">ROLL:</span>
                <span className="font-semibold text-slate-900">{data.student.studentId}</span>
                <button
                  type="button"
                  onClick={handleCopyStudentId}
                  className="ml-1 text-slate-400 hover:text-slate-700"
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
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              onClick={() => onTabChange(card.actionTab)}
              className="group cursor-pointer rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {card.label}
                </span>
                <div className={`rounded-xl p-2 ${card.iconBg} transition-transform group-hover:scale-110`}>
                  <Icon className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {card.value}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>{card.subtext}</span>
                <ArrowRight className="size-3 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Dual Highlights: Upcoming Mocks & Curriculum Snapshot */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Mock Spotlight */}
        <section className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                  <CalendarClock className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Assessment Series</h2>
                  <p className="text-xs text-slate-500">Timed full-length exam simulations</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTabChange("mocks")}
                className="rounded-full text-xs font-semibold text-brand-red hover:bg-rose-50"
              >
                View all ({data.mockTests.length})
              </Button>
            </div>

            {upcomingMock ? (
              <div className="mt-5 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-amber-50/20 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-brand-red">
                    {upcomingMock.code}
                  </span>
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 text-3xs font-semibold">
                    AVAILABLE FOR PRACTICE
                  </Badge>
                </div>
                <h3 className="mt-2 text-base font-bold text-slate-900">
                  {upcomingMock.title}
                </h3>
                {upcomingMock.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                    {upcomingMock.description}
                  </p>
                )}

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center text-xs">
                  <div>
                    <span className="text-slate-400 text-3xs uppercase font-medium">Duration</span>
                    <p className="font-semibold text-slate-800">{upcomingMock.durationMinutes} mins</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-3xs uppercase font-medium">Marks</span>
                    <p className="font-semibold text-emerald-600">{upcomingMock.totalMarks} pts</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-3xs uppercase font-medium">Questions</span>
                    <p className="font-semibold text-slate-800">{upcomingMock.questionCount} Qs</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">
                    Scheduled: <strong className="text-slate-700">{formatDate(upcomingMock.scheduledAt)}</strong>
                  </span>
                  {onOpenMockDetails ? (
                    <Button
                      size="sm"
                      onClick={() => onOpenMockDetails(upcomingMock)}
                      className="rounded-full bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      <span>Test Rules</span>
                      <ArrowRight className="ml-1 size-3" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => onTabChange("mocks")}
                      className="rounded-full bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      <span>Take Test</span>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <Calendar className="mx-auto size-7 text-slate-400" />
                <p className="mt-2 text-sm font-semibold text-slate-700">No mock tests currently scheduled</p>
                <p className="mt-1 text-xs text-slate-500">New academy assessment papers will appear here automatically.</p>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>Mock test attempts simulate the exact NTA exam pattern with negative marking.</span>
          </div>
        </section>

        {/* Curriculum At A Glance */}
        <section className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-indigo-50 p-2 text-brand-blue">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Enrolled Curriculum</h2>
                  <p className="text-xs text-slate-500">Active subjects & chapter blueprints</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTabChange("subjects")}
                className="rounded-full text-xs font-semibold text-brand-blue hover:bg-indigo-50"
              >
                Browse all
              </Button>
            </div>

            {data.courses.length ? (
              <div className="mt-5 space-y-3">
                {data.courses.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-brand-red">
                        {course.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        {course.subjects.length} Subjects
                      </span>
                    </div>
                    <h3 className="mt-1 text-sm font-bold text-slate-900">{course.title}</h3>

                    {/* Subject Pills */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {course.subjects.map((sub) => {
                        const theme = getSubjectTheme(sub.name);
                        return (
                          <span
                            key={sub.id}
                            className={`rounded-lg border px-2 py-0.5 text-xs font-medium ${theme.badgeBg}`}
                          >
                            {sub.name} ({sub.questionCount} Qs)
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <GraduationCap className="mx-auto size-7 text-slate-400" />
                <p className="mt-2 text-sm font-semibold text-slate-700">Curriculum not published yet</p>
                <p className="mt-1 text-xs text-slate-500">Your institution courses will be synced shortly.</p>
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <span>Ready to practice questions by topic?</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onTabChange("dpp")}
              className="rounded-full text-xs font-semibold"
            >
              Open DPP Bank
            </Button>
          </div>
        </section>
      </div>

      {/* Study Habit, Streak & Practice Target Ribbon */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Daily Streak Tracker */}
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-orange-50 p-3 text-orange-600">
              <Flame className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Study Streak</p>
              <h3 className="text-xl font-bold text-slate-900">Consistent Scholar</h3>
              <p className="mt-1 text-xs text-slate-500">
                Regular daily practice is key to top scores in NEET / JEE.
              </p>
              <div className="mt-3 flex items-center gap-1.5">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => (
                  <span
                    key={idx}
                    className={`flex size-6 items-center justify-center rounded-full text-3xs font-bold ${
                      idx < 5 ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Daily DPP Goal */}
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-indigo-50 p-3 text-brand-blue">
              <Target className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Goal</p>
              <h3 className="text-xl font-bold text-slate-900">25 Questions / Day</h3>
              <p className="mt-1 text-xs text-slate-500">
                Solve at least 25 problems every session to build numerical accuracy.
              </p>
              <div className="mt-3 w-full bg-slate-100 rounded-full h-2">
                <div className="bg-brand-blue h-2 rounded-full w-3/4" />
              </div>
            </div>
          </div>

          {/* Expert NEET/JEE Tip */}
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-purple-50 p-3 text-purple-600">
              <Sparkles className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Advice</p>
              <h3 className="text-base font-bold text-slate-900">Formula & Diagram Revision</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Review mistakes from your mock attempts immediately to convert weak areas into strengths.
              </p>
              <button
                type="button"
                onClick={() => onTabChange("analytics")}
                className="mt-2 text-xs font-semibold text-brand-blue hover:underline"
              >
                View Study Roadmap →
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
