"use client";

import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface StudentSubjectsTabProps {
  onOpenDrill: () => void;
}

export function StudentSubjectsTab({ onOpenDrill }: StudentSubjectsTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {[
        {
          name: "Physics (இயற்பியல்)",
          desc: "Mechanics, Heat & Thermodynamics, Electromagnetism, Modern Physics, Optics",
          chapters: "28 Chapters",
          completed: "22 Completed",
          progress: 78,
          accent: "border-l-4 border-l-blue-600",
        },
        {
          name: "Chemistry (வேதியியல்)",
          desc: "Physical Chemistry, Inorganic Coordination Compounds, Organic Reaction Mechanisms",
          chapters: "30 Chapters",
          completed: "25 Completed",
          progress: 83,
          accent: "border-l-4 border-l-rose-500",
        },
        {
          name: "Botany (தாவரவியல்)",
          desc: "Diversity of Living Organisms, Cell Biology, Plant Physiology, Genetics, Ecology",
          chapters: "21 Chapters",
          completed: "19 Completed",
          progress: 90,
          accent: "border-l-4 border-l-emerald-600",
        },
        {
          name: "Zoology (விலங்கியல்)",
          desc: "Human Physiology, Reproduction, Evolution, Biotechnology Applications, Health",
          chapters: "21 Chapters",
          completed: "18 Completed",
          progress: 86,
          accent: "border-l-4 border-l-amber-500",
        },
      ].map((subj, idx) => (
        <div
          key={idx}
          className={cn(
            "rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs hover:shadow-card transition-all",
            subj.accent
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{subj.name}</h3>
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">{subj.desc}</p>
            </div>
            <Badge variant="outline" className="text-3xs font-semibold text-slate-700 shrink-0">
              {subj.chapters}
            </Badge>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>{subj.completed}</span>
              <span>{subj.progress}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-slate-900" style={{ width: `${subj.progress}%` }} />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              <BookOpen className="mr-1 size-3.5" /> View Chapters
            </Button>
            <Button
              size="sm"
              onClick={onOpenDrill}
              className="rounded-full bg-brand-red px-3.5 text-xs font-semibold text-white hover:bg-brand-red-hover"
            >
              Chapter Test
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

