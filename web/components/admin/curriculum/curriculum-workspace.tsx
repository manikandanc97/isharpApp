"use client";

import { useState } from "react";
import {
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import type { Course } from "@/components/admin/admin-types";
import { useCurriculum } from "./use-curriculum";
import { SubjectPanel } from "./subject-panel";
import { ChapterTable } from "./chapter-table";

interface CurriculumWorkspaceProps {
  course: Course;
  allCourses?: Course[];
  onSelectCourse?: (courseId: string) => void;
  academicYear?: string;
}

export function CurriculumWorkspace({
  course,
  allCourses,
  onSelectCourse,
}: CurriculumWorkspaceProps) {
  const [notice, setNotice] = useState("");

  const triggerNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3500);
  };

  const {
    subjects,
    selectedSubject,
    selectedSubjectId,
    setSelectedSubjectId,
    activeChapters,
    totalChaptersAcrossAllSubjects,
    addSubject,
    editSubject,
    reorderSubject,
    deleteSubject,
    addChapter,
    editChapter,
    toggleChapterActive,
    reorderChapter,
    deleteChapter,
    addTopic,
    editTopic,
    deleteTopic,
    reorderTopic,
  } = useCurriculum(course);

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 shadow-2xs">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Top Breadcrumb & Header Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            <BookOpenCheck className="size-3.5" />
            Academic Curriculum & Chapter Management
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 border border-indigo-100">
              {course.code}
            </span>
            {allCourses && allCourses.length > 1 ? (
              <div className="relative">
                <select
                  value={course.id}
                  onChange={(e) => onSelectCourse?.(e.target.value)}
                  className="appearance-none text-xl font-bold tracking-tight text-slate-900 sm:text-2xl bg-transparent pr-7 cursor-pointer outline-none hover:text-indigo-700"
                >
                  {allCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              </div>
            ) : (
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {course.title}
              </h1>
            )}
          </div>
          <p className="max-w-3xl text-xs text-slate-500 sm:text-[13px] leading-relaxed">
            {course.description || "I-Sharp Academy NEET Coaching Curriculum & Syllabus Management"}
          </p>
        </div>
      </div>

      {/* Curriculum Coverage Summary Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Total Chapters</span>
            <BookOpen className="size-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalChaptersAcrossAllSubjects}</p>
          <p className="mt-0.5 text-3xs text-slate-500">
            Across {subjects.length} mapped disciplines
          </p>
        </div>

        {subjects.slice(0, 3).map((sub) => {
          const tone =
            sub.code === "PHYSICS"
              ? "text-blue-700 bg-blue-50"
              : sub.code === "CHEMISTRY"
              ? "text-emerald-700 bg-emerald-50"
              : "text-rose-700 bg-rose-50";

          const barColor =
            sub.code === "PHYSICS"
              ? "bg-blue-600"
              : sub.code === "CHEMISTRY"
              ? "bg-emerald-600"
              : "bg-rose-600";

          return (
            <div
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs cursor-pointer hover:border-indigo-300 transition"
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
                <span className="truncate">{sub.name} Coverage</span>
                <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${tone}`}>
                  {sub.chaptersCount} Ch
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">100%</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: "100%" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Subject Dropdown Selector (Only visible on small mobile screens < 768px) */}
      <div className="lg:hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <label className="text-3xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
          Select Subject to Manage:
        </label>
        <div className="relative">
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name} ({sub.code}) – {sub.chaptersCount} Chapters
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* 
        SPLIT-PANEL LAYOUT:
        - LEFT PANEL: 70% width (Chapter Management, visually dominant)
        - RIGHT PANEL: 30% width (Curriculum / Subject Management)
        IMPORTANT: Left 70%, Right 30%. Never reversed.
      */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-10 items-start">
        {/* LEFT PANEL: 70% width (lg:col-span-7) */}
        <div className="lg:col-span-7 order-1 min-w-0">
          <ChapterTable
            subject={selectedSubject}
            chapters={activeChapters}
            onAddChapter={(subId, data) => {
              addChapter(subId, data);
              triggerNotice(`Chapter "${data.title}" added to ${selectedSubject?.name}`);
            }}
            onEditChapter={(chId, data) => {
              editChapter(chId, data);
              triggerNotice("Chapter details updated");
            }}
            onToggleActive={(chId) => {
              toggleChapterActive(chId);
              triggerNotice("Chapter status updated");
            }}
            onReorder={reorderChapter}
            onDeleteChapter={(chId) => {
              deleteChapter(chId);
              triggerNotice("Chapter removed from curriculum");
            }}
            onAddTopic={(chId, data) => {
              addTopic(chId, data);
              triggerNotice("Curriculum topic added");
            }}
            onEditTopic={(chId, tId, data) => {
              editTopic(chId, tId, data);
              triggerNotice("Topic updated");
            }}
            onDeleteTopic={(chId, tId) => {
              deleteTopic(chId, tId);
              triggerNotice("Topic removed");
            }}
            onReorderTopic={reorderTopic}
          />
        </div>

        {/* RIGHT PANEL: 30% width (lg:col-span-3) - Sticky on desktop while scrolling chapters */}
        <div className="lg:col-span-3 order-2 min-w-0 lg:sticky lg:top-[calc(var(--layout-app-header-height,4rem)+1.25rem)] lg:self-start">
          <SubjectPanel
            subjects={subjects}
            selectedSubjectId={selectedSubjectId}
            onSelectSubject={setSelectedSubjectId}
            onAddSubject={(data) => {
              addSubject(data);
              triggerNotice(`Subject "${data.name}" successfully created`);
            }}
            onEditSubject={(subId, data) => {
              editSubject(subId, data);
              triggerNotice("Subject details updated");
            }}
            onReorder={reorderSubject}
            onDeleteSubject={(subId) => {
              deleteSubject(subId);
              triggerNotice("Subject removed from curriculum");
            }}
          />
        </div>
      </div>
    </div>
  );
}
