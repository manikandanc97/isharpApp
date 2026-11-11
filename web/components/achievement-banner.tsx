import {
  Award,
  Building2,
  CheckCircle2,
  Globe2,
  Trophy,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ContentSection,
  PageContainer,
  Stack,
} from "@/components/layout/layout-primitives";

type AchievementItem = {
  value: string;
  label: string;
  detail: string;
  icon: LucideIcon;
  accent: "red" | "blue";
  tag: string;
  trend: string;
};

const achievements: readonly AchievementItem[] = [
  {
    value: "300+",
    label: "Top Rank Selections",
    detail: "Admissions into premier Govt. Medical & Engineering colleges",
    icon: Award,
    accent: "red",
    tag: "Verified",
    trend: "+42% YoY",
  },
  {
    value: "1,000+",
    label: "Active Daily Aspirants",
    detail: "Consistent daily momentum with DPP drills & full test mocks",
    icon: Users,
    accent: "blue",
    tag: "Batch 2026",
    trend: "94% Habit Retention",
  },
  {
    value: "100+",
    label: "Colleges Represented",
    detail: "Alumni network spanning AIIMS, MMC, Stanley, JIPMER & NITs",
    icon: Building2,
    accent: "blue",
    tag: "Pan-India",
    trend: "12 Premier Universities",
  },
  {
    value: "15+",
    label: "Districts & Regional Hubs",
    detail:
      "Expanded learning footprint across Tamil Nadu and regional centers",
    icon: Globe2,
    accent: "red",
    tag: "Footprint",
    trend: "100% Bilingual Access",
  },
];

const trustPillars = [
  {
    title: "NTA Standard Calibrated Testing",
    desc: "Every mock paper mirrors exact exam question weighting, marking schemes, and difficulty levels.",
  },
  {
    title: "Bilingual Tamil + English Clarity",
    desc: "Complex scientific fundamentals explained in intuitive native language with standard global terminology.",
  },
  {
    title: "Zero-Guesswork Performance Telemetry",
    desc: "Detailed chapter weakness heatmaps, speed benchmarks, and predictive rank trajectory.",
  },
] as const;

export function AchievementBanner() {
  return (
    <ContentSection
      id="achievements"
      aria-labelledby="achievement-banner-title"
      className="relative overflow-hidden border-y border-blue-900/40 bg-gradient-to-br from-[#151d5c] via-[#1a2574] to-[#111749] text-white"
    >
      {/* Brand Ambient Glows - Royal Blue and Crimson Red only */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-brand-blue/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-brand-red/20 blur-3xl"
        aria-hidden="true"
      />

      <PageContainer className="relative">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 items-center">
          {/* Left Column: Prestigious Statement & Verification */}
          <Stack gap="lg" className="lg:col-span-5">
            <Stack gap="sm">
              {/* Refined Eyebrow */}
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-rose-400/40 bg-rose-500/15 px-3.5 py-1 text-xs font-semibold tracking-wide uppercase text-rose-200 shadow-2xs">
                <Trophy className="size-3.5 text-rose-300" aria-hidden="true" />
                <span>Audited Academic Track Record</span>
              </div>

              {/* Headline */}
              <h2
                id="achievement-banner-title"
                className="type-page-title text-white"
              >
                Learn with purpose.{" "}
                <span className="block font-semibold text-rose-300">
                  Achieve with absolute confidence.
                </span>
              </h2>

              <p className="text-xs leading-relaxed text-blue-100/80 sm:text-sm">
                Top percentiles aren’t born from luck. They are engineered
                through disciplined daily repetition, bilingual conceptual
                clarity, and relentless exam-condition simulation.
              </p>
            </Stack>

            {/* Trust Pillars */}
            <div className="space-y-3.5 border-t border-white/15 pt-5">
              {trustPillars.map((pillar, idx) => {
                const isRed = idx % 2 === 0;
                return (
                  <div key={pillar.title} className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border shadow-2xs",
                        isRed
                          ? "border-rose-400/40 bg-rose-500/20 text-rose-300"
                          : "border-blue-300/40 bg-blue-400/20 text-blue-200"
                      )}
                    >
                      <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    </span>
                    <div className="grid gap-0.5">
                      <h3 className="text-xs sm:text-sm font-semibold text-white">
                        {pillar.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-blue-100/75">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Stack>

          {/* Right Column: 2x2 Metric Cards (Only Logo Red & Blue) */}
          <div className="lg:col-span-7">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {achievements.map((item) => {
                const Icon = item.icon;
                const isRed = item.accent === "red";

                return (
                  <div
                    key={item.label}
                    className={cn(
                      "group relative flex flex-col justify-between gap-5 rounded-2xl border p-5 shadow-lg backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5",
                      isRed
                        ? "border-white/15 bg-white/[0.07] hover:border-rose-400/50 hover:bg-white/[0.12]"
                        : "border-white/15 bg-white/[0.07] hover:border-blue-300/50 hover:bg-white/[0.12]"
                    )}
                  >
                    {/* Top highlight bar */}
                    <div
                      className={cn(
                        "pointer-events-none absolute top-0 left-6 right-6 h-0.5 rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100",
                        isRed ? "bg-brand-red" : "bg-blue-300"
                      )}
                      aria-hidden="true"
                    />

                    {/* Top Row: Icon & Tag */}
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "flex size-10 items-center justify-center rounded-xl border shadow-2xs transition-colors",
                          isRed
                            ? "border-rose-400/40 bg-rose-500/20 text-rose-300 group-hover:bg-brand-red group-hover:text-white"
                            : "border-blue-300/40 bg-blue-400/20 text-blue-200 group-hover:bg-brand-blue group-hover:text-white"
                        )}
                      >
                        <Icon
                          className="size-5"
                          aria-hidden="true"
                          strokeWidth={2}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
                            isRed
                              ? "border-rose-400/40 bg-rose-500/20 text-rose-200"
                              : "border-blue-300/40 bg-blue-400/20 text-blue-200"
                          )}
                        >
                          {item.tag}
                        </span>
                      </div>
                    </div>

                    {/* Number & Info */}
                    <Stack gap="sm">
                      <div className="flex items-baseline justify-between">
                        <dd
                          className={cn(
                            "type-metric font-extrabold tracking-tight",
                            isRed ? "text-rose-300" : "text-white"
                          )}
                        >
                          {item.value}
                        </dd>
                        <span
                          className={cn(
                            "flex items-center gap-1 text-xs font-semibold",
                            isRed ? "text-rose-300" : "text-blue-200"
                          )}
                        >
                          <TrendingUp className="size-3.5" />
                          {item.trend}
                        </span>
                      </div>

                      <div className="grid gap-1">
                        <dt className="text-sm font-semibold tracking-tight text-white">
                          {item.label}
                        </dt>
                        <p className="text-xs leading-relaxed text-blue-100/70">
                          {item.detail}
                        </p>
                      </div>
                    </Stack>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
      </PageContainer>
    </ContentSection>
  );
}
