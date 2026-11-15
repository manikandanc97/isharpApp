import { BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSubjectTheme } from "../student-helpers";
import type { StudentPortalData, TabId } from "../student-types";

export interface StudentSyllabusSectionProps {
  courses: StudentPortalData["courses"];
  onTabChange: (tab: TabId) => void;
}

export function StudentSyllabusSection({
  courses,
  onTabChange,
}: StudentSyllabusSectionProps) {
  return (
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
            className="rounded-full text-xs font-semibold text-brand-blue hover:bg-indigo-50 cursor-pointer"
          >
            Browse all
          </Button>
        </div>

        {courses.length ? (
          <div className="mt-5 space-y-3">
            {courses.map((course) => (
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
          className="rounded-full text-xs font-semibold cursor-pointer"
        >
          Open DPP Bank
        </Button>
      </div>
    </section>
  );
}
