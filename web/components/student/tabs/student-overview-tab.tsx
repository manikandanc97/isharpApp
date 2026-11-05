"use client";

import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  HelpCircle,
  Play,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TabId } from "@/components/student/student-types";
import { cn } from "@/lib/utils";

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}

export interface StudentOverviewTabProps {
  onOpenDrill: () => void;
  setActiveTab: (tab: TabId) => void;
}

export function StudentOverviewTab({
  onOpenDrill,
  setActiveTab,
}: StudentOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left Column: Today's High-Yield Plan (8 cols) */}
      <div className="space-y-6 lg:col-span-8">
        {/* Active DPP Card */}
        <div className="flex flex-col gap-5 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-rose-50 text-brand-red">
                <Flame className="size-5 fill-brand-red text-brand-red" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Today&apos;s High-Yield DPP #48
                </h2>
                <p className="text-xs text-slate-500">
                  Rotational Dynamics • Thermodynamics • Plant Physiology
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-brand-red font-semibold text-xs">
              15 Bilingual Questions
            </Badge>
          </div>

          {/* Problem highlights preview */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-3xs font-semibold uppercase tracking-wide text-slate-400">
                  Preview Question (Physics)
                </span>
                <p className="text-xs sm:text-sm font-medium text-slate-800">
                  A solid sphere of mass M and radius R rolls without slipping down an inclined plane...
                </p>
                <p className="font-tamil text-xs text-slate-600">
                  திண்மக் கோளம் சாய்தளத்தில் நழுவாமல் உருளுகிறது. முடுக்கம் என்ன?
                </p>
              </div>
              <Button
                size="sm"
                onClick={onOpenDrill}
                className="rounded-full bg-brand-red px-4 text-xs font-semibold text-white shadow-primary hover:bg-brand-red-hover shrink-0"
              >
                <Play className="mr-1 size-3 fill-current" /> Solve
              </Button>
            </div>
          </div>

          {/* Today's Schedule Timeline */}
          <div className="grid gap-4 border-t border-slate-100 pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              இன்றைய ஆய்வு அட்டவணை (Today&apos;s Roadmap)
            </h3>
            <div className="space-y-3">
              {[
                {
                  time: "06:00 - 08:00 AM",
                  title: "Physics Mechanics Drill & Formula Recall",
                  tag: "Completed",
                  tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
                },
                {
                  time: "02:00 - 03:30 PM",
                  title: "15 DPP Drills #48 (Live Evaluation)",
                  tag: "In Progress",
                  tagColor: "bg-amber-50 text-amber-700 border-amber-200",
                },
                {
                  time: "07:00 - 08:30 PM",
                  title: "Chemistry: Aldehydes & Ketones NCERT Exemplar",
                  tag: "Upcoming",
                  tagColor: "bg-slate-100 text-slate-700 border-slate-200",
                },
                {
                  time: "09:00 - 10:00 PM",
                  title: "Biology 360 Drills: Plant Growth Regulators",
                  tag: "Upcoming",
                  tagColor: "bg-slate-100 text-slate-700 border-slate-200",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-2xs hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-medium text-slate-500 w-28 shrink-0">
                      {item.time}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      {item.title}
                    </span>
                  </div>
                  <Badge variant="outline" className={cn("text-3xs font-semibold", item.tagColor)}>
                    {item.tag}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subject Mastery Progress Strip */}
        <div className="flex flex-col gap-5 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Curriculum Syllabus Coverage
              </h2>
              <p className="text-xs text-slate-500">
                NEET 2026 High-Yield Chapter Milestones
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("subjects")}
              className="text-xs font-semibold text-brand-red hover:text-brand-red-hover hover:bg-rose-50"
            >
              View All Subjects <ChevronRight className="ml-1 size-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { name: "Physics", progress: 76, chapters: "22/28 Chapters", color: "from-blue-600 to-indigo-600" },
              { name: "Chemistry", progress: 84, chapters: "25/30 Chapters", color: "from-rose-500 to-red-600" },
              { name: "Botany", progress: 91, chapters: "19/21 Chapters", color: "from-emerald-500 to-teal-600" },
              { name: "Zoology", progress: 88, chapters: "18/21 Chapters", color: "from-amber-500 to-orange-600" },
            ].map((subj) => (
              <div key={subj.name} className="grid gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs sm:text-sm text-slate-900">{subj.name}</span>
                  <span className="text-xs font-semibold text-slate-700">{subj.progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={cn("h-full rounded-full bg-gradient-to-r", subj.color)}
                    style={{ width: `${subj.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-3xs text-slate-500">
                  <span>{subj.chapters}</span>
                  <span className="font-semibold text-emerald-700">On Track</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Upcoming Simulated Mock & Quick Tools (4 cols) */}
      <div className="space-y-6 lg:col-span-4">
        {/* Simulated Mock Card */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-900 via-slate-900 to-brand-navy p-6 text-white shadow-elevated">
          <div className="flex items-center justify-between">
            <Badge className="bg-brand-red text-white text-3xs font-semibold uppercase tracking-wide border-none">
              NTA Simulator Live
            </Badge>
            <Clock3 className="size-4 text-slate-400" />
          </div>

          <h3 className="type-section-title text-white">
            Grand Mock Test #04
          </h3>
          <p className="text-xs text-slate-300">
            Full NEET Syllabus • 720 Marks • 200 Questions (Bilingual தமிழ் + EN)
          </p>

          <div className="space-y-2 rounded-2xl bg-white/10 p-3.5 text-xs backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-300">
              <span>Date &amp; Time:</span>
              <span className="font-semibold text-white">This Sunday, 02:00 PM</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Duration:</span>
              <span className="font-semibold text-white">180 Minutes (3 Hrs)</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Negative Penalty:</span>
              <span className="font-semibold text-rose-300">-1 for incorrect</span>
            </div>
          </div>

          <Button
            onClick={() => setActiveTab("mocks")}
            className="w-full rounded-full bg-brand-red py-2.5 text-xs font-semibold text-white shadow-brand hover:bg-brand-red-hover active:scale-95"
          >
            <span>View Mock Test Details</span>
            <ChevronRight className="ml-1 size-3.5" />
          </Button>
        </div>

        {/* Academy Quick Vault Resources */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Academic Study Vault
          </h3>

          <div className="space-y-2.5">
            {[
              { title: "NEET Formula Sheets (PDF)", desc: "Physics & Physical Chem", icon: BookOpen },
              { title: "NCERT Highlighted Notes", desc: "Bilingual தமிழ் + English", icon: FileTextIcon },
              { title: "Doubt Clearance Desk", desc: "Ask i-SHARP Faculty", icon: HelpCircle },
              { title: "High-Yield PYQ Archive", desc: "2015–2025 Solved Bank", icon: Sparkles },
            ].map((item, idx) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={idx}
                  className="group flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:border-slate-200 hover:bg-slate-50/80 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-rose-50 group-hover:text-brand-red transition-colors">
                      <ItemIcon className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                      <p className="text-3xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="size-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Academy Verified Notice */}
        <div className="grid gap-1 rounded-3xl border border-emerald-200/80 bg-emerald-50/50 p-5 text-emerald-950">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4.5 text-emerald-700 shrink-0" />
            <span className="text-xs font-semibold">Verified Student Portal</span>
          </div>
          <p className="text-2xs leading-relaxed text-emerald-900/80">
            Access to daily tests, simulated mocks, and academic question archives is confirmed for your academic session.
          </p>
        </div>
      </div>
    </div>
  );
}

