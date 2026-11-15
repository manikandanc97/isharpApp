import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  FileQuestion,
  GraduationCap,
  Layers3,
} from "lucide-react";
import type { StudentPortalData, TabId } from "../student-types";

export interface StudentOverviewStatGridProps {
  summary: StudentPortalData["summary"];
  onTabChange: (tab: TabId) => void;
}

export function StudentOverviewStatGrid({
  summary,
  onTabChange,
}: StudentOverviewStatGridProps) {
  const statCards = [
    {
      label: "Active Courses",
      value: summary.activeCourses,
      icon: GraduationCap,
      accent: "from-blue-500/10 to-indigo-500/10 text-brand-blue border-blue-100",
      iconBg: "bg-blue-50 text-brand-blue",
      actionTab: "subjects" as TabId,
      subtext: "Enrolled programs",
    },
    {
      label: "Academic Subjects",
      value: summary.activeSubjects,
      icon: BookOpen,
      accent: "from-emerald-500/10 to-teal-500/10 text-emerald-700 border-emerald-100",
      iconBg: "bg-emerald-50 text-emerald-600",
      actionTab: "subjects" as TabId,
      subtext: "Core science topics",
    },
    {
      label: "Curriculum Chapters",
      value: summary.activeChapters,
      icon: Layers3,
      accent: "from-purple-500/10 to-pink-500/10 text-purple-700 border-purple-100",
      iconBg: "bg-purple-50 text-purple-600",
      actionTab: "subjects" as TabId,
      subtext: "Syllabus modules",
    },
    {
      label: "Practice Questions",
      value: summary.activeQuestions,
      icon: FileQuestion,
      accent: "from-rose-500/10 to-orange-500/10 text-brand-red border-rose-100",
      iconBg: "bg-rose-50 text-brand-red",
      actionTab: "dpp" as TabId,
      subtext: "DPP problem bank",
    },
    {
      label: "Live & Upcoming Mocks",
      value: summary.publishedMocks,
      icon: CalendarClock,
      accent: "from-amber-500/10 to-yellow-500/10 text-amber-700 border-amber-100",
      iconBg: "bg-amber-50 text-amber-600",
      actionTab: "mocks" as TabId,
      subtext: "Timed test papers",
    },
  ];

  return (
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
  );
}
