import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Languages,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { AccessPortal } from "@/components/access-portal";
import { AchievementBanner } from "@/components/achievement-banner";
import { AvailableCourses } from "@/components/available-courses";
import { FeatureShowcase } from "@/components/feature-showcase";
import { LearningJourney } from "@/components/learning-journey";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const enterpriseHighlights = [
  {
    icon: Flame,
    title: "15 Daily Practice Sets (DPP)",
    sub: "Timed reflex drills with instant video solutions",
  },
  {
    icon: Languages,
    title: "தமிழ் + English Bilingual Clarity",
    sub: "Conceptual depth in native tongue paired with standard scientific terms",
  },
  {
    icon: ShieldCheck,
    title: "Real NTA Pattern Simulations",
    sub: "Calibrated 720-mark tests with sub-topic diagnostic percentile rank",
  },
] as const;

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900 selection:bg-[#e51d35] selection:text-white antialiased">
      {/* 01. ENTERPRISE SITE HEADER */}
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        {/* 02. SECTION 1: ARCHITECTURAL ENTERPRISE HERO */}
        <section className="relative overflow-hidden border-b border-slate-200/80 bg-slate-50/70 py-12 sm:py-16 lg:py-20">
          {/* Subtle Enterprise Architectural Grid Background */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60"
            aria-hidden="true"
          />

          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-8 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Authoritative Academic Value Proposition */}
            <div className="flex flex-col lg:col-span-7">
              {/* Enterprise Eyebrow Badge Group */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white px-3 py-1 text-3xs font-bold tracking-wider text-slate-800 shadow-2xs uppercase">
                  <span className="size-2 rounded-full bg-[#e51d35] animate-pulse" />
                  <span>Premier Bilingual NEET &amp; JEE Platform</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-3xs font-semibold text-[#2525b8]">
                  <Sparkles className="size-3" />
                  Batch 2026 Active
                </span>
              </div>

              {/* Enterprise Headline */}
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-[44px] lg:leading-[1.15]">
                Practical learning engineered for{" "}
                <span className="text-[#e51d35]">
                  top percentile success.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-3.5 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Build unbroken daily study consistency with calibrated Daily Practice Problems (DPP),
                rigorous concept clarity taught in <strong className="font-semibold text-slate-900">தமிழ் + English</strong>,
                and real-time diagnostic performance telemetry.
              </p>

              {/* Enterprise Capability Pillars */}
              <div className="mt-6 space-y-2.5">
                {enterpriseHighlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs transition hover:border-slate-300"
                    >
                      <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#2525b8]">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 sm:text-sm">
                            {item.title}
                          </p>
                        </div>
                        <p className="text-3xs text-slate-500 sm:text-xs">
                          {item.sub}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Primary & Secondary Call to Actions */}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="#academy"
                  className={cn(
                    buttonVariants({ size: "default" }),
                    "h-11 px-6 text-xs sm:text-sm font-semibold bg-[#2525b8] hover:bg-[#1a187a] text-white shadow-xs gap-2 border-0 transition",
                  )}
                >
                  <span>Explore Academy Portal</span>
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="#courses"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "h-11 px-5 text-xs sm:text-sm font-semibold border-slate-300 bg-white hover:bg-slate-100 text-slate-800 shadow-2xs",
                  )}
                >
                  View 2026 Curriculums
                </Link>
              </div>

              {/* Enterprise Social Proof & Telemetry Strip */}
              <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-5 border-t border-slate-200/90 pt-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="size-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="font-bold text-slate-900">4.9/5 Rating</span>
                </div>
                <span className="h-3 w-px bg-slate-200" aria-hidden="true" />
                <div className="flex items-center gap-1.5 font-medium">
                  <Users className="size-3.5 text-[#2525b8]" />
                  <span>Over 1,000+ daily active aspirants</span>
                </div>
                <span className="h-3 w-px bg-slate-200" aria-hidden="true" />
                <div className="flex items-center gap-1.5 font-medium text-emerald-700">
                  <CheckCircle2 className="size-3.5" />
                  <span>Verified 2024–25 Selections</span>
                </div>
              </div>
            </div>

            {/* Right Column: High-Security Academic Gateway Card */}
            <div id="academy" className="scroll-mt-24 lg:col-span-5">
              <AccessPortal />
            </div>
          </div>
        </section>

        {/* 03. SECTION 2: THE I-SHARP EXPERIENCE (SHOWCASE CAROUSEL) */}
        <FeatureShowcase />

        {/* 04. SECTION 3: VERIFIED ACADEMIC TRACK RECORD & TRUST VAULT */}
        <AchievementBanner />

        {/* 05. SECTION 4: 4-STAGE METHODOLOGY */}
        <LearningJourney />

        {/* 06. SECTION 5: CURATED ACADEMY COURSES CATALOG */}
        <AvailableCourses />
      </main>

      {/* 07. ENTERPRISE SITE FOOTER */}
      <SiteFooter />
    </div>
  );
}
