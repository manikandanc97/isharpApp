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

type AchievementItem = {
  value: string;
  label: string;
  detail: string;
  icon: LucideIcon;
  accent: "amber" | "ruby" | "sapphire" | "emerald";
  tag: string;
  trend: string;
};

const achievements: readonly AchievementItem[] = [
  {
    value: "300+",
    label: "Top Rank Selections",
    detail: "Admissions into premier Govt. Medical & Engineering colleges",
    icon: Award,
    accent: "amber",
    tag: "Verified",
    trend: "+42% YoY",
  },
  {
    value: "1,000+",
    label: "Active Daily Aspirants",
    detail: "Consistent daily momentum with DPP drills & full test mocks",
    icon: Users,
    accent: "ruby",
    tag: "Batch 2026",
    trend: "94% Habit Retention",
  },
  {
    value: "100+",
    label: "Colleges Represented",
    detail: "Alumni network spanning AIIMS, MMC, Stanley, JIPMER & NITs",
    icon: Building2,
    accent: "sapphire",
    tag: "Pan-India",
    trend: "12 Premier Universities",
  },
  {
    value: "15+",
    label: "Districts & Regional Hubs",
    detail:
      "Expanded learning footprint across Tamil Nadu and regional centers",
    icon: Globe2,
    accent: "emerald",
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
    <section
      id="achievements"
      aria-labelledby="achievement-banner-title"
      className="relative overflow-hidden border-b border-slate-800 bg-slate-950 py-12 text-white sm:py-16 lg:py-20"
    >
      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 items-center">
          {/* Left Column: Prestigious Statement & Verification */}
          <div className="flex flex-col lg:col-span-5">
            <div>
              {/* Enterprise Obsidian Eyebrow */}
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-3xs font-bold tracking-wider uppercase text-amber-300">
                <Trophy className="size-3 text-amber-400" aria-hidden="true" />
                <span>Audited Academic Track Record</span>
              </div>

              {/* Headline */}
              <h2
                id="achievement-banner-title"
                className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-3xl lg:leading-snug"
              >
                Learn with purpose.{" "}
                <span className="block mt-1 text-slate-300 font-semibold">
                  Achieve with absolute confidence.
                </span>
              </h2>

              <p className="mt-3.5 text-xs leading-relaxed text-slate-400 sm:text-sm">
                Top percentiles aren’t born from luck. They are engineered
                through disciplined daily repetition, bilingual conceptual
                clarity, and relentless exam-condition simulation.
              </p>
            </div>

            {/* Trust Pillars */}
            <div className="mt-6 space-y-3.5 border-t border-slate-800 pt-5">
              {trustPillars.map((pillar) => (
                <div key={pillar.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      {pillar.title}
                    </h3>
                    <p className="mt-0.5 text-3xs text-slate-400 sm:text-xs leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: 2x2 Enterprise Metric Cards */}
          <div className="lg:col-span-7">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {achievements.map((item) => {
                const Icon = item.icon;
                const isAmber = item.accent === "amber";
                const isRuby = item.accent === "ruby";
                const isSapphire = item.accent === "sapphire";

                return (
                  <div
                    key={item.label}
                    className="relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-xs transition duration-200 hover:border-slate-700 hover:bg-slate-900"
                  >
                    {/* Top Row: Icon & Tag */}
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "flex size-10 items-center justify-center rounded-lg border",
                          isAmber &&
                            "border-amber-400/30 bg-amber-400/10 text-amber-400",
                          isRuby &&
                            "border-rose-500/30 bg-rose-500/10 text-rose-400",
                          isSapphire &&
                            "border-blue-400/30 bg-blue-400/10 text-blue-400",
                          !isAmber &&
                            !isRuby &&
                            !isSapphire &&
                            "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
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
                            "rounded-full border px-2.5 py-0.5 text-3xs font-bold uppercase tracking-wider",
                            isAmber &&
                              "border-amber-400/30 bg-amber-400/10 text-amber-300",
                            isRuby &&
                              "border-rose-500/30 bg-rose-500/10 text-rose-300",
                            isSapphire &&
                              "border-blue-400/30 bg-blue-400/10 text-blue-300",
                            !isAmber &&
                              !isRuby &&
                              !isSapphire &&
                              "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
                          )}
                        >
                          {item.tag}
                        </span>
                      </div>
                    </div>

                    {/* Number & Info */}
                    <div className="mt-5">
                      <div className="flex items-baseline justify-between">
                        <dd
                          className={cn(
                            "text-3xl font-extrabold tracking-tight font-mono sm:text-4xl",
                            isAmber && "text-amber-300",
                            isRuby && "text-rose-300",
                            isSapphire && "text-blue-300",
                            !isAmber &&
                              !isRuby &&
                              !isSapphire &&
                              "text-emerald-300",
                          )}
                        >
                          {item.value}
                        </dd>
                        <span className="flex items-center gap-1 text-3xs font-semibold text-slate-400">
                          <TrendingUp className="size-3 text-emerald-400" />
                          {item.trend}
                        </span>
                      </div>

                      <dt className="mt-2 text-sm font-bold tracking-tight text-white">
                        {item.label}
                      </dt>
                      <p className="mt-1 text-3xs text-slate-400 sm:text-xs leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
