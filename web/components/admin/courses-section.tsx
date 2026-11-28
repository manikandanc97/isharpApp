"use client";

import { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import type { Course } from "./admin-types";
import { CurriculumWorkspace } from "./curriculum/curriculum-workspace";

export interface CoursesSectionProps {
  courses: Course[];
  onCreate?: (data: {
    code: string;
    title: string;
    description: string;
  }) => Promise<void>;
  onToggle?: (course: Course) => Promise<void>;
}

export function CoursesSection({
  courses,
  onCreate: _onCreate,
  onToggle: _onToggle,
}: CoursesSectionProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [academicYear] = useState<string>("2026-2027");

  // Directly select the active course (default to first available course)
  const activeCourse = useMemo(() => {
    return (
      courses.find((c) => c.id === selectedCourseId) || courses[0] || null
    );
  }, [courses, selectedCourseId]);

  if (!activeCourse) {
    return (
      <div className="flex flex-col items-center justify-center p-14 rounded-2xl border border-dashed border-slate-200 bg-white">
        <BookOpen className="size-8 text-slate-300" />
        <p className="mt-2 text-sm font-semibold text-slate-700">
          No Course Found
        </p>
        <p className="text-xs text-slate-400">
          Curriculum records are being indexed. Please refresh in a moment.
        </p>
      </div>
    );
  }

  // Directly render the 70/30 Split Layout Workspace
  return (
    <CurriculumWorkspace
      course={activeCourse}
      allCourses={courses}
      onSelectCourse={setSelectedCourseId}
      academicYear={academicYear}
    />
  );
}
