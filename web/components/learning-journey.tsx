import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Target,
  Trophy,
  Volume2,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ContentSection,
  PageContainer,
  Stack,
} from "@/components/layout/layout-primitives";

type JourneyStep = {
  number: string;
  verb: string;
  title: string;
  description: string;
  note: string;
  icon: LucideIcon;
  accent: "blue" | "red";
  metrics: string;
};

const journey = [
  {
    number: "01",
    verb: "Learn",
    title: "Deep Concept Clarity",
    description:
      "Master foundational principles through bilingual lectures (Tamil + English) and curated formula summaries.",
    note: "Concept-First Foundation",
    icon: BookOpen,
    accent: "red",
    metrics: "Bilingual Lecture Audio",
  },
  {
    number: "02",
    verb: "Practice",
    title: "Daily Reflex Conditioning",
    description:
      "15 targeted DPPs daily to turn problem-solving from conscious cognitive effort into rapid exam reflex.",
    note: "Consistent Daily Drills",
    icon: BrainCircuit,
    accent: "red",
    metrics: "15 DPPs Daily",
  },
  {
    number: "03",
    verb: "Analyse",
    title: "Precision Telemetry",
    description:
      "Instant breakdown of question solve times, accuracy percentiles, and sub-topic negative-mark gap radar.",
    note: "Targeted Diagnostics",
    icon: BarChart3,
    accent: "blue",
    metrics: "Sub-Topic Gap Radar",
  },
  {
    number: "04",
    verb: "Achieve",
    title: "Real Exam Simulation",
    description:
      "Full-length NTA simulated tests with national percentile calibration and targeted final milestone revision.",
    note: "Rank-Securing Finish",
    icon: Trophy,
    accent: "red",
    metrics: "Calibrated NTA Difficulty",
  },
] satisfies readonly JourneyStep[];

function StepPreview({ step }: { step: JourneyStep }) {
  if (step.number === "01") {
    return (
      <div className="grid gap-2.5 rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Volume2 className="size-3.5 text-brand-red" />
            <span className="text-xs font-semibold text-slate-800">Mechanics &amp; Optics</span>
          </div>
          <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs font-semibold text-brand-red">
            தமிழ் + EN
          </span>
        </div>
        <div className="grid gap-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Core Derivations Complete</span>
            <span className="font-semibold text-slate-700">78%</span>
          </div>
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-4/5 rounded-full bg-brand-red" />
          </div>
        </div>
      </div>
    );
  }

  if (step.number === "02") {
    return (
      <div className="space-y-2 rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 uppercase tracking-wide">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5 text-brand-blue" /> DPP #48 · 15 Qs
          </span>
          <span className="text-brand-blue flex items-center gap-1">
            <Flame className="size-3.5 fill-current" /> 14-Day Streak
          </span>
        </div>
        <div className="flex items-center gap-1 pt-0.5">
          {[1, 2, 3, 4, 5].map((item) => (
            <span
              key={item}
              className={cn(
                "grid size-6 flex-1 place-items-center rounded text-xs font-semibold transition",
                item <= 4
                  ? "bg-brand-blue text-white"
                  : "border border-slate-200 text-slate-400 bg-slate-50",
              )}
            >
              {item <= 4 ? <Check className="size-3" strokeWidth={3} /> : item}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (step.number === "03") {
    return (
      <div className="grid gap-2 rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-800">Speed vs Accuracy</span>
          <span className="font-mono text-brand-blue font-semibold">96.4% Accuracy</span>
        </div>
        <div className="flex h-8 items-end justify-between gap-1.5 px-0.5">
          {[42, 65, 52, 88, 74, 95].map((height, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <span
                className={cn(
                  "w-full rounded-t-xs",
                  index >= 4 ? "bg-brand-blue" : "bg-blue-200",
                )}
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
        <p className="text-center text-xs font-medium text-emerald-700">
          ✓ -4 Negative Marks Eliminated
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-rose-200/80 bg-rose-50/80 p-3 shadow-2xs">
      <span className="grid size-9 place-items-center rounded-lg bg-brand-red text-white shadow-2xs">
        <Trophy className="size-4.5" aria-hidden="true" />
      </span>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <span className="block text-xs font-semibold text-slate-900">NTA Standard Simulated Exam</span>
        <span className="flex items-center gap-1 text-xs font-semibold text-brand-red">
          <CheckCircle2 className="size-3.5" /> Projected AIR &lt; 500
        </span>
      </div>
    </div>
  );
}

export function LearningJourney() {
  return (
    <ContentSection
      id="journey"
      aria-labelledby="learning-journey-title"
      className="relative overflow-hidden border-b border-slate-200/80 bg-slate-50"
    >
      <PageContainer className="relative">
        <Stack gap="lg">
        {/* Section Heading & Stage Indicator */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Stack gap="sm" className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-0.5 text-xs font-semibold tracking-wide text-brand-red uppercase">
              <Target className="size-3 text-brand-red" aria-hidden="true" />
              <span>The 4-Stage Methodology</span>
            </div>
            <h2
              id="learning-journey-title"
              className="type-page-title text-slate-900"
            >
              From First Concept to{" "}
              <span className="text-brand-red">
                Exam-Day Mastery.
              </span>
            </h2>
            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              An interconnected enterprise preparation pipeline engineered to cultivate daily discipline and deliver verifiable rank results.
            </p>
          </Stack>

          <div className="flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Closed-Loop Mastery Engine</span>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="relative">
          {/* Desktop Connecting Beam */}
          <div
            className="pointer-events-none absolute top-10 right-10 left-10 hidden h-0.5 bg-slate-200 lg:block"
            aria-hidden="true"
          />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {journey.map((step, index) => {
              const Icon = step.icon;
              const isBlue = step.accent === "blue";

              return (
                <article
                  key={step.number}
                  className="group relative flex flex-col justify-between gap-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition duration-200 hover:border-slate-300 hover:shadow-sm"
                >
                  {/* Top Bar: Stage Number & Icon */}
                  <Stack>
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "grid size-10 place-items-center rounded-xl text-xs font-bold text-white shadow-2xs",
                          isBlue ? "bg-brand-blue" : "bg-brand-red",
                        )}
                      >
                        {step.number}
                      </span>
                      <span
                        className={cn(
                          "grid size-9 place-items-center rounded-lg",
                          isBlue
                            ? "bg-blue-50 text-brand-blue"
                            : "bg-rose-50 text-brand-red",
                        )}
                      >
                        <Icon className="size-4.5" strokeWidth={2} aria-hidden="true" />
                      </span>
                    </div>

                    <Stack gap="xs">
                      <span
                        className={cn(
                          "text-xs font-semibold tracking-wide uppercase",
                          isBlue ? "text-brand-blue" : "text-brand-red",
                        )}
                      >
                        Stage {step.number} · {step.verb}
                      </span>
                      <h3 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
                        {step.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-slate-600">
                        {step.description}
                      </p>
                    </Stack>

                    <StepPreview step={step} />
                  </Stack>

                  {/* Card Bottom Meta */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs font-medium text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wide">{step.note}</span>
                    {index < journey.length - 1 ? (
                      <ArrowRight
                        className={cn(
                          "size-3.5 transition-transform duration-200 group-hover:translate-x-1",
                          isBlue ? "text-brand-blue" : "text-brand-red",
                        )}
                        aria-hidden="true"
                      />
                    ) : (
                      <Trophy className="size-4 text-amber-500" aria-hidden="true" />
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        </Stack>
      </PageContainer>
    </ContentSection>
  );
}
