"use client";

import { GraduationCap, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/components/course-card";
import { courses } from "@/data/courses";
import {
  ContentSection,
  PageContainer,
  PageHeader,
  ResponsiveGrid,
  Stack,
} from "@/components/layout/layout-primitives";

export function AvailableCourses() {
  return (
    <ContentSection
      id="courses"
      aria-labelledby="available-courses-title"
      className="relative overflow-hidden border-b border-slate-200/80 bg-white"
    >
      <PageContainer className="relative">
        {/* Header Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <PageHeader className="max-w-2xl">
            <Badge
              variant="outline"
              className="inline-flex items-center gap-1.5 rounded-full border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold tracking-wide text-brand-red"
            >
              <GraduationCap className="size-3.5 text-brand-red" aria-hidden="true" />
              <span>Curated Academic Programs</span>
            </Badge>
            <Stack gap="sm">
              <h2
                id="available-courses-title"
                className="type-page-title text-slate-900"
              >
                Academic Programs &amp; Test Series
              </h2>
              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                Purpose-built preparation for NEET &amp; JEE with guided practice, verified NTA pattern rigor, and dual-language clarity.
              </p>
            </Stack>
          </PageHeader>

          {/* Right Action: Batch Badge */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Badge
              variant="outline"
              className="flex items-center gap-2 rounded-full border-slate-200 bg-slate-50/80 px-3.5 py-1.5 text-xs text-slate-700 shadow-2xs"
            >
              <Users className="size-3.5 text-brand-red" />
              <span>Batch 2026</span>
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </Badge>
          </div>
        </div>

        {/* Clean, Theme-Matched Luxury Cards Grid */}
        <ResponsiveGrid min="lg" className="pt-(--space-layout)">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </ResponsiveGrid>
      </PageContainer>
    </ContentSection>
  );
}
