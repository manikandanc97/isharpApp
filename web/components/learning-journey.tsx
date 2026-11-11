import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ContentSection,
  PageContainer,
} from "@/components/layout/layout-primitives";

type JourneyStep = {
  step: string;
  stage: string;
  title: string;
  description: string;
  phase: string;
  icon: LucideIcon;
  featureTitle: string;
  featureBadge: string;
  highlights: readonly string[];
  theme: {
    badge: string;
    iconBg: string;
    iconColor: string;
    checkColor: string;
    hoverBorder: string;
    topStrip: string;
  };
};

const steps: readonly JourneyStep[] = [
  {
    step: "01",
    stage: "Learn",
    title: "Deep Concept Clarity",
    description:
      "Master core principles through bilingual video lessons and curated formula cheat sheets.",
    phase: "Concept Foundation",
    icon: BookOpen,
    featureTitle: "Bilingual Lectures",
    featureBadge: "தமிழ் + English",
    highlights: ["Formula Cheat Sheets", "Chapter Concept Checks"],
    theme: {
      badge: "border-rose-200 bg-rose-50 text-brand-red",
      iconBg: "bg-rose-50 text-brand-red ring-1 ring-rose-200/60",
      iconColor: "text-brand-red",
      checkColor: "text-brand-red",
      hoverBorder: "hover:border-rose-300",
      topStrip: "bg-brand-red",
    },
  },
  {
    step: "02",
    stage: "Practice",
    title: "Daily Reflex Conditioning",
    description:
      "Transform problem solving into second-nature reflex with 15 targeted daily practice problems.",
    phase: "Daily Practice Drills",
    icon: BrainCircuit,
    featureTitle: "Daily DPP Drills",
    featureBadge: "15 Qs / Day",
    highlights: ["Timed Speed Reflex", "Habit Streak Tracking"],
    theme: {
      badge: "border-blue-200 bg-blue-50 text-brand-blue",
      iconBg: "bg-blue-50 text-brand-blue ring-1 ring-blue-200/60",
      iconColor: "text-brand-blue",
      checkColor: "text-brand-blue",
      hoverBorder: "hover:border-blue-300",
      topStrip: "bg-brand-blue",
    },
  },
  {
    step: "03",
    stage: "Analyse",
    title: "Precision Telemetry",
    description:
      "Pinpoint weak areas and eliminate negative marking with real-time solve-time analytics.",
    phase: "Targeted Diagnostics",
    icon: BarChart3,
    featureTitle: "Diagnostic Telemetry",
    featureBadge: "Real-Time Radar",
    highlights: ["Negative Mark Radar", "Speed vs Accuracy Audit"],
    theme: {
      badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
      iconBg: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60",
      iconColor: "text-indigo-700",
      checkColor: "text-indigo-600",
      hoverBorder: "hover:border-indigo-300",
      topStrip: "bg-indigo-600",
    },
  },
  {
    step: "04",
    stage: "Achieve",
    title: "Real Exam Simulation",
    description:
      "Calibrate under true exam conditions with full-length NTA simulated tests and national percentiles.",
    phase: "Rank-Securing Finish",
    icon: Trophy,
    featureTitle: "NTA Pattern Mocks",
    featureBadge: "AIR Benchmark",
    highlights: ["Full-Length Simulations", "National Percentile Rank"],
    theme: {
      badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
      iconBg: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
      iconColor: "text-emerald-700",
      checkColor: "text-emerald-600",
      hoverBorder: "hover:border-emerald-300",
      topStrip: "bg-emerald-600",
    },
  },
];

export function LearningJourney() {
  return (
    <ContentSection
      id="journey"
      aria-labelledby="learning-journey-title"
      className="relative overflow-hidden border-b border-slate-200/80 bg-[#f8fafc] py-16 sm:py-20 lg:py-24"
    >
      <PageContainer className="relative">
        <div className="flex flex-col gap-10 lg:gap-14">
          {/* Centered, Clean Section Header */}
          <div className="mx-auto max-w-2xl text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/90 bg-rose-50/90 px-3.5 py-1 text-xs font-semibold tracking-wide text-brand-red uppercase shadow-2xs">
              <Sparkles className="size-3.5 text-brand-red" aria-hidden="true" />
              <span>The 4-Stage Methodology</span>
            </div>

            <h2
              id="learning-journey-title"
              className="type-page-title text-slate-900 tracking-tight"
            >
              From First Concept to{" "}
              <span className="text-brand-red">Exam-Day Mastery.</span>
            </h2>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 max-w-xl mx-auto">
              A structured preparation pipeline engineered to cultivate daily discipline, eliminate negative marks, and deliver top rank results.
            </p>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.step}
                  className={cn(
                    "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 lg:p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                    step.theme.hoverBorder,
                  )}
                >
                  {/* Top Clean Accent Strip */}
                  <div
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-0 top-0 h-1 transition-opacity",
                      step.theme.topStrip,
                    )}
                  />

                  <div>
                    {/* Top Row: Step Tag + Icon */}
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                          step.theme.badge,
                        )}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        Stage {step.step} · {step.stage}
                      </span>

                      <div
                        className={cn(
                          "flex size-9 items-center justify-center rounded-xl shadow-2xs transition-transform duration-300 group-hover:scale-105",
                          step.theme.iconBg,
                        )}
                      >
                        <Icon className="size-4.5" strokeWidth={2.2} aria-hidden="true" />
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="mt-5 space-y-1.5">
                      <h3 className="text-base font-bold tracking-tight text-slate-900 group-hover:text-slate-950 sm:text-lg">
                        {step.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                        {step.description}
                      </p>
                    </div>

                    {/* Neat Visual Feature Card */}
                    <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/80 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">
                          {step.featureTitle}
                        </span>
                        <span className="rounded-md border border-slate-200/90 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700 shadow-2xs">
                          {step.featureBadge}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {step.highlights.map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200/60 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600"
                          >
                            <CheckCircle2
                              className={cn(
                                "size-3 shrink-0",
                                step.theme.checkColor,
                              )}
                            />
                            <span>{item}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Meta Footer */}
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-3.5">
                    <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                      {step.phase}
                    </span>

                    <span
                      className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all duration-200 group-hover:bg-slate-900 group-hover:text-white"
                      aria-hidden="true"
                    >
                      {index < steps.length - 1 ? (
                        <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                      ) : (
                        <Trophy className="size-3.5" />
                      )}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </PageContainer>
    </ContentSection>
  );
}
