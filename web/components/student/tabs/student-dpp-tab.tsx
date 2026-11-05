"use client";

import { CheckCircle2, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { sampleDPPQuestions } from "@/data/sample-dpp";
import { cn } from "@/lib/utils";

export interface StudentDppTabProps {
  onOpenDrill: () => void;
  selectedAnswer: string | null;
  setSelectedAnswer: (answer: string | null) => void;
  showExplanation: boolean;
  setShowExplanation: (show: boolean) => void;
}

export function StudentDppTab({
  onOpenDrill,
  selectedAnswer,
  setSelectedAnswer,
  showExplanation,
  setShowExplanation,
}: StudentDppTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
        <div className="grid gap-1">
          <h2 className="type-section-title text-slate-900">
            Daily Practice Problem Drills (DPP)
          </h2>
          <p className="text-xs text-slate-600 sm:text-sm">
            15 calibrated questions daily engineered for rapid problem-solving speed and concept retention.
          </p>
        </div>
        <Button
          onClick={onOpenDrill}
          className="rounded-full bg-brand-red px-6 py-2.5 text-xs font-semibold text-white shadow-primary hover:bg-brand-red-hover active:scale-95 shrink-0"
        >
          <Play className="mr-1.5 size-3.5 fill-current" />
          <span>Start Drill Room</span>
        </Button>
      </div>

      {/* Subject DPP Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            subject: "Physics DPP #48",
            topic: "Rotational Dynamics & Gravitation",
            count: "5 / 5 Solved",
            status: "Completed",
            color: "border-emerald-200 bg-emerald-50 text-emerald-800",
            score: "Score: 20/20",
          },
          {
            subject: "Chemistry DPP #48",
            topic: "Aldehydes, Ketones & Carboxylic Acids",
            count: "4 / 5 Solved",
            status: "In Progress",
            color: "border-amber-200 bg-amber-50 text-amber-800",
            score: "Score: 16/20",
          },
          {
            subject: "Biology DPP #48",
            topic: "Plant Growth & Hormonal Regulation",
            count: "3 / 5 Solved",
            status: "Pending Finish",
            color: "border-blue-200 bg-blue-50 text-brand-blue",
            score: "2 Questions Remaining",
          },
        ].map((dpp, idx) => (
          <div key={idx} className="grid gap-2 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">{dpp.subject}</span>
              <Badge variant="outline" className={cn("text-3xs font-semibold", dpp.color)}>
                {dpp.status}
              </Badge>
            </div>
            <p className="text-xs font-medium text-slate-600">{dpp.topic}</p>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="font-semibold text-slate-700">{dpp.count}</span>
              <span className="font-mono text-3xs text-slate-500">{dpp.score}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Sample Live Question Interactive Box */}
      <div className="grid gap-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-brand-red font-semibold text-xs">
              Question of the Day
            </Badge>
            <span className="text-xs font-semibold text-slate-500">Physics • NEET Calibrated</span>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-600">+4 / -1 Marks</span>
        </div>

        <div className="space-y-3">
          <p className="text-sm sm:text-base font-semibold text-slate-900">
            {sampleDPPQuestions[0].questionEn}
          </p>
          <p className="text-xs sm:text-sm text-slate-700 font-tamil leading-relaxed">
            {sampleDPPQuestions[0].questionTa}
          </p>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {sampleDPPQuestions[0].options.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  setSelectedAnswer(opt.label);
                  setShowExplanation(true);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3.5 text-left text-xs sm:text-sm font-medium transition-all",
                  selectedAnswer === opt.label
                    ? opt.label === sampleDPPQuestions[0].correctOption
                      ? "border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold"
                      : "border-rose-400 bg-rose-50 text-rose-950"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <span className="flex size-6 items-center justify-center rounded-md bg-slate-100 font-semibold text-slate-700 text-xs shrink-0">
                  {opt.label}
                </span>
                <div className="flex flex-col">
                  <span>{opt.textEn}</span>
                </div>
              </button>
            ))}
          </div>

          {showExplanation && (
            <div className="grid gap-1 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-950 sm:text-sm">
              <p className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-700" /> Correct Option: {sampleDPPQuestions[0].correctOption}
              </p>
              <p className="text-slate-700">{sampleDPPQuestions[0].explanationEn}</p>
              <p className="font-tamil text-slate-700">{sampleDPPQuestions[0].explanationTa}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

