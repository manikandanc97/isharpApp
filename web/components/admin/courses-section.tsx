"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  BookOpenCheck,
  Check,
  ChevronRight,
  GraduationCap,
  Layers3,
  Plus,
  Search,
  X,
} from "lucide-react";
import { CourseCreateForm } from "./course-create-form";
import type { Course } from "./admin-types";

export interface CoursesSectionProps {
  courses: Course[];
  onCreate: (data: {
    code: string;
    title: string;
    description: string;
  }) => Promise<void>;
  onToggle?: (course: Course) => Promise<void>;
}

export function CoursesSection({
  courses,
  onCreate,
}: CoursesSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");

  const totalSubjects = courses.reduce(
    (total, course) => total + course.courseSubjects.length,
    0,
  );
  const totalChapters = courses.reduce(
    (total, course) =>
      total +
      course.courseSubjects.reduce(
        (sum, subject) => sum + subject._count.chapters,
        0,
      ),
    0,
  );
  const visibleCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return courses;
    }
    return courses.filter((course) =>
      `${course.code} ${course.title} ${course.description ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [courses, query]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)]">
      <div className="border-b border-slate-200 bg-[#fbfbfa] px-5 py-7 sm:px-7 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid max-w-2xl gap-3">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              <BookOpenCheck className="size-3.5" />
              Academic operations
            </div>
            <div className="grid gap-2">
              <h2 className="type-page-title text-slate-950">
                Curriculum workspace
              </h2>
              <p className="max-w-xl text-sm leading-6 text-slate-500">
                Govern course availability, syllabus coverage and academic content
                from one operational view.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition active:scale-95 ${
              showForm
                ? "border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50"
                : "bg-brand-red text-white shadow-primary hover:bg-brand-red-hover"
            }`}
          >
            {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
            <span>{showForm ? "Close form" : "Create course"}</span>
          </button>
        </div>
      </div>

      {showForm && (
        <CourseCreateForm
          onCreate={onCreate}
          onSuccess={() => setShowForm(false)}
        />
      )}

      <div className="grid border-b border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total courses",
            value: courses.length,
            icon: BookOpen,
            tone: "text-indigo-700 bg-indigo-50",
          },
          {
            label: "Active courses",
            value: courses.filter((c) => c.isActive).length,
            icon: Check,
            tone: "text-emerald-700 bg-emerald-50",
          },
          {
            label: "Subjects mapped",
            value: totalSubjects,
            icon: Layers3,
            tone: "text-violet-700 bg-violet-50",
          },
          {
            label: "Chapters indexed",
            value: totalChapters,
            icon: GraduationCap,
            tone: "text-rose-700 bg-rose-50",
          },
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className={`flex items-center gap-3 px-5 py-4 sm:px-6 ${index ? "border-t border-slate-100 sm:border-l sm:border-t-0" : ""}`}
            >
              <div
                className={`grid size-10 place-items-center rounded-lg ${metric.tone}`}
              >
                <Icon className="size-4.5" />
              </div>
              <div>
                <p className="type-metric text-slate-950">
                  {metric.value}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {metric.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-5 bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-1">
            <h3 className="type-card-title text-slate-950">
              Course registry
            </h3>
            <p className="text-xs text-slate-500">
              {visibleCourses.length} of {courses.length} curriculum records
            </p>
          </div>
          <div className="relative min-w-0 sm:w-80">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search code or course name"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs font-medium outline-none transition focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="grid gap-3">
          {visibleCourses.map((course) => {
            const chapters = course.courseSubjects.reduce(
              (total, item) => total + item._count.chapters,
              0,
            );
            return (
              <article
                key={course.id}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-200 hover:border-slate-300 hover:shadow-[0_12px_30px_-24px_rgba(15,23,42,0.4)]"
              >
                <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.85fr)_auto] lg:items-center lg:p-6">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                      <BookOpen className="size-5.5" />
                    </div>
                    <div className="grid min-w-0 gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold tracking-wide text-slate-600">
                          {course.code}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Active Course
                        </span>
                      </div>
                      <div className="grid gap-1">
                        <h4 className="truncate type-card-title text-slate-950">
                          {course.title}
                        </h4>
                        <p className="line-clamp-2 text-xs leading-5 text-slate-500">
                          {course.description ||
                            "No course description provided yet."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <span>Curriculum coverage</span>
                      <span>{chapters} chapters</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {course.courseSubjects.length ? (
                        course.courseSubjects.slice(0, 4).map((item) => (
                          <span
                            key={item.id}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600"
                          >
                            {item.subject.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs font-medium text-slate-400">
                          No subjects mapped
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 lg:justify-end">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-950">
                        {course.courseSubjects.length}
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Subjects
                      </p>
                    </div>
                    <ChevronRight className="hidden size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500 sm:block" />
                  </div>
                </div>
              </article>
            );
          })}
          {!visibleCourses.length && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
                <BookOpen className="size-5" />
              </div>
              <div className="grid gap-1">
                <p className="text-sm font-semibold text-slate-800">
                  No matching courses
                </p>
                <p className="text-xs text-slate-500">
                  Adjust the search or status filter, or create a new curriculum
                  record.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
