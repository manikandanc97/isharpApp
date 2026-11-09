"use client";

import {
  ArrowRight,
  BookOpen,
  FileQuestion,
  GraduationCap,
  Layers3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSubjectTheme } from "./student-helpers";
import type { StudentPortalData } from "./student-types";

interface StudentSubjectsTabProps {
  data: StudentPortalData;
  onPracticeSubject: (subjectName: string) => void;
}

export function StudentSubjectsTab({
  data,
  onPracticeSubject,
}: StudentSubjectsTabProps) {
  if (!data.courses.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <GraduationCap className="mx-auto size-10 text-slate-400" />
        <h3 className="mt-3 text-base font-bold text-slate-800">
          No active curriculum courses
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Courses and subjects will appear here once activated by the administration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-brand-blue">
                ACADEMIC BLUEPRINT
              </span>
              <span className="text-xs text-slate-500">
                Curriculum Structure & Subject Modules
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Courses & Subject Syllabus
            </h2>
            <p className="mt-1 text-xs text-slate-600 max-w-xl">
              Master individual science topics chapter by chapter. Each subject includes practice problem banks calibrated to competitive exam standards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2 text-center text-xs">
              <span className="text-slate-400 font-medium">TOTAL SUBJECTS</span>
              <p className="font-bold text-brand-blue text-base">
                {data.summary.activeSubjects} Active
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Course List with Subjects */}
      <div className="space-y-6">
        {data.courses.map((course) => {
          const totalQuestionsInCourse = course.subjects.reduce(
            (acc, s) => acc + s.questionCount,
            0
          );
          const totalChaptersInCourse = course.subjects.reduce(
            (acc, s) => acc + s.chapterCount,
            0
          );

          return (
            <section
              key={course.id}
              className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs transition-all hover:border-slate-300"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-red">
                      {course.code}
                    </span>
                    <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-brand-blue text-3xs font-semibold">
                      VERIFIED CURRICULUM
                    </Badge>
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="mt-1 text-xs text-slate-600 max-w-2xl">
                      {course.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-1 font-medium">
                    {course.subjects.length} Subjects
                  </span>
                  <span className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-1 font-medium">
                    {totalChaptersInCourse} Chapters
                  </span>
                  <span className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-1 font-medium">
                    {totalQuestionsInCourse} Questions
                  </span>
                </div>
              </div>

              {/* Subject Cards Grid */}
              {course.subjects.length ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {course.subjects.map((subject) => {
                    const theme = getSubjectTheme(subject.name);
                    return (
                      <div
                        key={subject.id}
                        className={`group flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-card ${theme.borderHover}`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span
                              className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${theme.badgeBg}`}
                            >
                              {subject.code || "SUBJECT"}
                            </span>
                            <BookOpen className={`size-4 ${theme.textColor}`} />
                          </div>

                          <h4 className="mt-3 text-base font-bold text-slate-900">
                            {subject.name}
                          </h4>

                          {subject.description ? (
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                              {subject.description}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-slate-400">
                              Comprehensive NCERT and entrance-level syllabus.
                            </p>
                          )}

                          <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Layers3 className="size-3.5 text-slate-400" />
                              <span>{subject.chapterCount} Chapters</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <FileQuestion className="size-3.5 text-slate-400" />
                              <span>{subject.questionCount} Questions</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 border-t border-slate-100 pt-3">
                          <Button
                            size="sm"
                            onClick={() => onPracticeSubject(subject.name)}
                            className="w-full justify-between rounded-full bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            <span>Practice DPP</span>
                            <ArrowRight className="size-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-500">
                  No active subjects are linked to this course.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
