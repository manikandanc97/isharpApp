import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  PageContainer,
  PageContent,
  Stack,
} from "@/components/layout/layout-primitives";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900 selection:bg-brand-red selection:text-white antialiased">
      {/* 01. ENTERPRISE SITE HEADER */}
      <SiteHeader />

      <PageContent className="flex flex-col">
        {/* 02. SECTION 1: ARCHITECTURAL ENTERPRISE HERO (Optimized for 100% Laptop Viewport Fit) */}
        <section className="relative flex min-h-[calc(100svh-var(--layout-site-header-height))] flex-col justify-center overflow-hidden border-b border-slate-200 bg-slate-50 py-(--space-layout) lg:py-0">
          <PageContainer className="relative grid grid-cols-[minmax(0,1fr)] items-center gap-(--space-layout) lg:grid-cols-12 lg:gap-14">
            {/* Left Column: Authoritative Academic Value Proposition */}
            <Stack gap="lg" className="lg:col-span-7">
              {/* Luxury Refined Eyebrow Capsule with Shadcn Badge */}
              <div className="flex items-center">
                <Badge
                  variant="outline"
                  className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-2xl border-rose-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-800 shadow-xs sm:rounded-full"
                >
                  <span className="flex size-2 rounded-full bg-brand-red animate-pulse shadow-sm shadow-brand-red/50" />
                  <span className="tracking-wide">Premier Bilingual NEET &amp; JEE Platform</span>
                  <span className="h-3.5 w-px bg-slate-200" aria-hidden="true" />
                  <span className="text-brand-red font-semibold">Batch 2026</span>
                </Badge>
              </div>

              {/* Authoritative Headline */}
              <h1 className="type-hero text-slate-900">
                Practical learning engineered for{" "}
                <span className="text-brand-red">
                  top percentile success.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Build unbroken daily study consistency with timed Daily Practice Problems (DPP),
                concept clarity taught in <strong className="font-semibold text-slate-900">தமிழ் + English</strong>,
                and calibrated 720-mark simulated mock tests.
              </p>

              {/* Academic Highlights (Clean, spacious, uncluttered checks) */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs font-semibold text-slate-700 sm:text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />
                  <span>15 Daily DPP Drills</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />
                  <span>தமிழ் + English Clarity</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />
                  <span>720-Mark NTA Tests</span>
                </div>
              </div>

              {/* Primary & Secondary Call to Actions using Shadcn Button */}
              <div className="flex flex-wrap items-center gap-3.5">
                <Button
                  nativeButton={false}
                  render={
                    <Link
                      href="#academy"
                      className="group inline-flex items-center gap-2 rounded-full bg-brand-red hover:bg-brand-red-hover px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-primary hover:shadow-primary-hover transition-all duration-200 active:scale-95"
                    >
                      <span>Explore Academy Portal</span>
                      <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  }
                />
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={
                    <Link
                      href="#courses"
                      className="inline-flex items-center rounded-full border-slate-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs transition-all duration-200 hover:bg-blue-50/50 hover:border-brand-blue/30 hover:text-brand-blue active:scale-95"
                    >
                      <span>View 2026 Curriculums</span>
                    </Link>
                  }
                />
              </div>

              {/* Social Proof & Trust Strip using Shadcn Separator */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200/80 pt-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="size-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="font-semibold text-slate-900">4.9/5 Rating</span>
                </div>
                <Separator orientation="vertical" className="h-3.5 bg-slate-300" />
                <div className="flex items-center gap-1.5 font-medium">
                  <Users className="size-3.5 text-brand-blue" />
                  <span>1,000+ Active Daily Aspirants</span>
                </div>
                <Separator orientation="vertical" className="h-3.5 bg-slate-300" />
                <div className="flex items-center gap-1.5 font-medium text-emerald-700">
                  <CheckCircle2 className="size-3.5" />
                  <span>Verified 2024–25 Selections</span>
                </div>
              </div>
            </Stack>

            {/* Right Column: Clean Academic Gateway Card */}
            <div id="academy" className="scroll-mt-24 lg:col-span-5">
              <AccessPortal />
            </div>
          </PageContainer>

          {/* Subtle Scroll Cue on Laptop/Desktop */}
          <div className="pointer-events-none absolute bottom-2.5 left-1/2 hidden -translate-x-1/2 items-center gap-1 text-xs font-medium text-slate-400/90 lg:flex">
            <span>Scroll to explore</span>
            <ChevronDown className="size-3 animate-bounce text-slate-400" />
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
      </PageContent>

      {/* 07. ENTERPRISE SITE FOOTER */}
      <SiteFooter />
    </div>
  );
}
