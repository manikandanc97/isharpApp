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
    accent: "blue",
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
      <div className="mt-4 rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Volume2 className="size-3.5 text-[#2525b8]" />
            <span className="text-2xs font-bold text-slate-800">Mechanics &amp; Optics</span>
          </div>
          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-3xs font-bold text-[#2525b8]">
            தமிழ் + EN
          </span>
        </div>
        <div className="mt-2.5">
          <div className="flex items-center justify-between text-3xs text-slate-500">
            <span>Core Derivations Complete</span>
            <span className="font-semibold text-slate-700">78%</span>
          </div>
          <div className="mt-1 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[78%] rounded-full bg-[#2525b8]" />
          </div>
        </div>
      </div>
    );
  }

  if (step.number === "02") {
    return (
      <div className="mt-4 space-y-2 rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
        <div className="flex items-center justify-between text-3xs font-bold text-slate-600 uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <Clock className="size-3 text-[#e51d35]" /> DPP #48 · 15 Qs
          </span>
          <span className="text-[#e51d35] flex items-center gap-1">
            <Flame className="size-3 fill-current" /> 14-Day Streak
          </span>
        </div>
        <div className="flex items-center gap-1 pt-0.5">
          {[1, 2, 3, 4, 5].map((item) => (
            <span
              key={item}
              className={cn(
                "grid size-6 flex-1 place-items-center rounded text-3xs font-bold transition",
                item <= 4
                  ? "bg-[#e51d35] text-white"
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
      <div className="mt-4 rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
        <div className="flex items-center justify-between text-3xs">
          <span className="font-bold text-slate-800">Speed vs Accuracy</span>
          <span className="font-mono text-[#2525b8] font-bold">96.4% Accuracy</span>
        </div>
        <div className="mt-2 flex h-8 items-end justify-between gap-1.5 px-0.5">
          {[42, 65, 52, 88, 74, 95].map((height, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <span
                className={cn(
                  "w-full rounded-t-xs",
                  index >= 4 ? "bg-[#2525b8]" : "bg-blue-200",
                )}
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-center text-3xs text-emerald-700 font-medium">
          ✓ -4 Negative Marks Eliminated
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-center gap-3 rounded-xl border border-rose-200/80 bg-rose-50/80 p-3 shadow-2xs">
      <span className="grid size-9 place-items-center rounded-lg bg-[#e51d35] text-white shadow-2xs">
        <Trophy className="size-4.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="block text-xs font-bold text-slate-900">NTA Standard Simulated Exam</span>
        <span className="mt-0.5 flex items-center gap-1 text-2xs font-semibold text-[#e51d35]">
          <CheckCircle2 className="size-3" /> Projected AIR &lt; 500
        </span>
      </div>
    </div>
  );
}

export function LearningJourney() {
  return (
    <section
      id="journey"
      aria-labelledby="learning-journey-title"
      className="relative overflow-hidden border-b border-slate-200/80 bg-[#f8fafc] px-4 py-12 sm:px-8 sm:py-16 lg:py-20"
    >
      <div className="relative mx-auto w-full max-w-6xl">
        {/* Section Heading & Stage Indicator */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-3xs font-bold tracking-wider text-[#2525b8] uppercase">
              <Target className="size-3 text-[#2525b8]" aria-hidden="true" />
              <span>The 4-Stage Methodology</span>
            </div>
            <h2
              id="learning-journey-title"
              className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-[32px]"
            >
              From First Concept to{" "}
              <span className="text-[#e51d35]">
                Exam-Day Mastery.
              </span>
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
              An interconnected enterprise preparation pipeline engineered to cultivate daily discipline and deliver verifiable rank results.
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Closed-Loop Mastery Engine</span>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="relative mt-10">
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
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition duration-200 hover:border-slate-300 hover:shadow-sm"
                >
                  {/* Top Bar: Stage Number & Icon */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "grid size-10 place-items-center rounded-xl font-mono text-xs font-bold text-white shadow-2xs",
                          isBlue ? "bg-[#2525b8]" : "bg-[#e51d35]",
                        )}
                      >
                        {step.number}
                      </span>
                      <span
                        className={cn(
                          "grid size-9 place-items-center rounded-lg",
                          isBlue
                            ? "bg-blue-50 text-[#2525b8]"
                            : "bg-rose-50 text-[#e51d35]",
                        )}
                      >
                        <Icon className="size-4.5" strokeWidth={2} aria-hidden="true" />
                      </span>
                    </div>

                    <div className="mt-4">
                      <span
                        className={cn(
                          "text-3xs font-bold tracking-wider uppercase",
                          isBlue ? "text-[#2525b8]" : "text-[#e51d35]",
                        )}
                      >
                        Stage {step.number} · {step.verb}
                      </span>
                      <h3 className="mt-1 text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                        {step.description}
                      </p>
                    </div>

                    <StepPreview step={step} />
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs font-medium text-slate-500">
                    <span className="text-3xs font-semibold uppercase tracking-wider">{step.note}</span>
                    {index < journey.length - 1 ? (
                      <ArrowRight
                        className={cn(
                          "size-3.5 transition-transform duration-200 group-hover:translate-x-1",
                          isBlue ? "text-[#2525b8]" : "text-[#e51d35]",
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
      </div>
    </section>
  );
}
