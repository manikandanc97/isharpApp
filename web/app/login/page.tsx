import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowLeft,
  ArrowRight,
  FileCheck2,
  Flame,
  Languages,
  Sparkles,
  Star,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { DemoTestCard } from "@/components/demo-test";
import {
  PageContainer,
  Stack,
} from "@/components/layout/layout-primitives";
import { LoginForm, OAuthAwareLoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Student LMS Login | I-Sharp Academy",
  description: "Sign in to the I-Sharp Academy bilingual NEET/JEE learning portal.",
};

const portalHighlights = [
  {
    icon: Flame,
    title: "15 Daily Practice Problems (DPP)",
    sub: "Timed concept drills with step-by-step video solution keys.",
  },
  {
    icon: Languages,
    title: "தமிழ் + English Bilingual Lectures",
    sub: "Clear intuitive explanations in Tamil aligned with NTA English terminology.",
  },
  {
    icon: FileCheck2,
    title: "Simulated All-India Mock Tests",
    sub: "Full 720-mark NEET & 300-mark JEE papers with sub-topic diagnostic rank.",
  },
] as const;

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col bg-slate-50/70 font-sans text-slate-900 selection:bg-brand-red selection:text-white antialiased">
      {/* 01. NAVIGATION HEADER (h-16, max-w-6xl aligned with main content & homepage) */}
      <header className="sticky top-0 z-50 shrink-0 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-xs">
        <PageContainer className="flex h-(--layout-site-header-height) items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <BrandLogo priority className="h-8.5 sm:h-9.5 w-auto" />
            <span
              className="hidden h-5 w-px bg-slate-200 sm:block"
              aria-hidden="true"
            />
            {/* Dual instruction capsule */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs">
              <span className="size-1.5 rounded-full bg-brand-red animate-pulse" />
              <span className="font-semibold text-slate-900">தமிழ்</span>
              <span className="text-slate-400">+</span>
              <span className="font-semibold text-slate-900">English</span>
              <span className="h-2 w-px bg-slate-200" aria-hidden="true" />
              <span className="text-slate-500">Student LMS</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              aria-label="Back to Academy"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">Back to Academy</span>
            </Link>
            <span className="hidden h-3.5 w-px bg-slate-200 sm:block" aria-hidden="true" />
            <Link
              href="/register"
              className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-brand-red transition hover:bg-rose-100 hover:border-rose-300"
            >
              <span className="hidden xs:inline">Activate Account</span>
              <span className="xs:hidden">Register</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </PageContainer>
      </header>

      {/* 02. MAIN CONTENT AREA */}
      <main className="relative flex min-h-0 flex-1 items-center py-(--space-content) sm:py-8 lg:py-10">
        <PageContainer className="relative grid grid-cols-[minmax(0,1fr)] items-center gap-(--space-layout) lg:grid-cols-12 lg:gap-10 xl:gap-14">
          {/* Left Column: Academic Brand Presentation (Compact for laptop screen) */}
          <section
            aria-labelledby="brand-heading"
            className="layout-stack justify-center lg:col-span-6 xl:col-span-7"
          >
            {/* Eyebrow Pill */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/80 bg-white px-2.5 py-0.5 text-xs font-semibold tracking-wide text-slate-800 shadow-2xs uppercase">
                <span className="size-1.5 rounded-full bg-brand-red animate-pulse" />
                <span>Built for Ambitious Minds</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-brand-blue">
                <Sparkles className="size-3" />
                Batch 2026 Admissions Open
              </span>
            </div>

            {/* Headline */}
            <h1
              id="brand-heading"
              className="type-hero text-slate-900"
            >
              Your journey to{" "}
              <span className="text-brand-red">excellence</span> starts here.
            </h1>

            <p className="max-w-xl text-xs leading-relaxed text-slate-600 sm:text-sm">
              Focused preparation, calibrated practice, and steady progress for every
              NEET &amp; JEE aspirant ready to secure top medical and engineering ranks.
            </p>

            {/* Feature Highlight Cards (Tightly spaced) */}
            <Stack gap="sm" className="max-w-xl">
              {portalHighlights.map((item, idx) => {
                const Icon = item.icon;
                const isRed = idx % 2 === 0;
                return (
                  <div
                    key={item.title}
                    className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white/90 px-3 py-2 shadow-2xs backdrop-blur-xs transition hover:border-slate-300"
                  >
                    <div className={`grid size-7.5 shrink-0 place-items-center rounded-lg ${isRed ? "bg-rose-50 text-brand-red" : "bg-blue-50 text-brand-blue"}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate sm:text-clip">
                        {item.sub}
                      </p>
                    </div>
                  </div>
                );
              })}
            </Stack>

            {/* Interactive Demo Test Trigger Card */}
            <div className="max-w-xl">
              <DemoTestCard />
            </div>

            {/* Trust Metrics Pill */}
            <div className="flex max-w-md flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2 shadow-2xs backdrop-blur-xs">
              <div className="flex -space-x-1.5">
                <span className="inline-grid size-7 place-items-center rounded-full bg-brand-navy text-xs font-semibold text-white ring-2 ring-white">
                  99%
                </span>
                <span className="inline-grid size-7 place-items-center rounded-full bg-brand-blue text-xs font-semibold text-white ring-2 ring-white">
                  AIR
                </span>
                <span className="inline-grid size-7 place-items-center rounded-full bg-brand-red text-xs font-semibold text-white ring-2 ring-white">
                  NEET
                </span>
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-3 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-1 text-xs font-semibold text-slate-800">4.9 / 5.0</span>
                </div>
                <p className="text-xs text-slate-500">
                  Trusted by 1,200+ NEET &amp; JEE aspirants across Tamil Nadu
                </p>
              </div>
            </div>
          </section>

          {/* Right Column: Refined LoginForm */}
          <div className="flex w-full min-w-0 flex-col items-center lg:col-span-6 lg:items-end xl:col-span-5">
            <Suspense fallback={<LoginForm />}>
              <OAuthAwareLoginForm />
            </Suspense>
          </div>
        </PageContainer>
      </main>
    </div>
  );
}
