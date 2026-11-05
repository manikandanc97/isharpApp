import {
  CheckCircle2,
  Clock3,
  Languages,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Course } from "@/data/courses";
import { cn } from "@/lib/utils";
import { Stack } from "@/components/layout/layout-primitives";

export function CourseCard({ course }: { course: Course }) {
  const Icon = course.icon;
  const isBlue = course.accent === "blue";

  return (
    <Card
      key={course.id}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-(--layout-card-padding) shadow-xs transition-all duration-300 hover:border-slate-300 hover:shadow-md"
    >
      {/* Subtle Top Accent Strip */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-x-0 top-0 h-1.5 rounded-t-2xl transition-opacity",
          isBlue ? "bg-brand-blue" : "bg-brand-red",
        )}
      />

      <Stack>
        {/* Top Row: Shadcn Badge + Clean Solid Icon */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <Badge
            variant="outline"
            className={cn(
              "rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wide",
              isBlue
                ? "border-blue-200 bg-blue-50 text-brand-blue"
                : "border-rose-200 bg-rose-50 text-brand-red",
            )}
          >
            {course.badge}
          </Badge>

          <div
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl text-white shadow-xs",
              isBlue ? "bg-brand-blue" : "bg-brand-red",
            )}
          >
            <Icon className="size-4.5" strokeWidth={2} aria-hidden="true" />
          </div>
        </div>

        {/* Course Title */}
        <Stack gap="sm">
          <h3
            className={cn(
              "text-base font-bold leading-snug tracking-tight text-slate-900 transition-colors sm:text-lg",
              isBlue ? "group-hover:text-brand-blue" : "group-hover:text-brand-red",
            )}
          >
            {course.title}
          </h3>
          <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
            {course.description}
          </p>
        </Stack>

        {/* Metadata Chips: Language & Duration */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1.5 rounded-md border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            <Languages className="size-3.5 text-slate-500" />
            <span>{course.language}</span>
          </Badge>
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1.5 rounded-md border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            <Clock3 className="size-3.5 text-slate-500" />
            <span>{course.duration}</span>
          </Badge>
        </div>

        {/* Separator between header and deliverables */}
        <Separator className="bg-slate-100" />

        {/* Key Highlights / Deliverables */}
        <Stack gap="sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Program Inclusions:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-600">
            {course.deliverables.slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-tight">
                <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{item}</span>
              </li>
            ))}
          </ul>
        </Stack>
      </Stack>

      {/* Card Footer: Clean Target Audience & Batch Status */}
      <div className="border-t border-slate-100 pt-3.5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium truncate pr-2">
            {course.targetAudience}
          </span>
          <span className="inline-flex items-center gap-1.5 shrink-0 text-xs font-semibold text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Batch 2026</span>
          </span>
        </div>
      </div>
    </Card>
  );
}

