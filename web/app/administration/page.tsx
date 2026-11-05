import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Database,
  FileCheck2,
  Lock,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { PageContainer } from "@/components/layout/layout-primitives";
import { AdminLoginForm } from "./admin-login-form";

export const metadata: Metadata = {
  title: "Administration Portal | I-Sharp Academy",
  description: "Secure gateway for I-Sharp Academy administrators.",
};

const adminPillars = [
  {
    icon: ShieldCheck,
    title: "Granular RBAC Security",
    desc: "Strictly segregated roles for Superadmin and Academy Administrators.",
  },
  {
    icon: Database,
    title: "Question Bank & DPP Repository",
    desc: "Manage 15-Year PYQ mastery banks, timed drills and NTA calibrated solutions.",
  },
  {
    icon: FileCheck2,
    title: "720-Mark Mock Test Oversight",
    desc: "Schedule simulated all-India tests, publish answer keys and monitor diagnostic telemetry.",
  },
] as const;

export default function AdministrationPage() {
  return (
    <div className="flex min-h-svh flex-col bg-slate-50/70 font-sans text-slate-900 selection:bg-brand-navy selection:text-white antialiased lg:h-svh lg:overflow-hidden">
      {/* 01. NAVIGATION HEADER (h-16, max-w-6xl aligned across the application) */}
      <header className="sticky top-0 z-50 shrink-0 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-xs">
        <PageContainer className="flex h-(--layout-site-header-height) items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <BrandLogo priority className="h-8.5 sm:h-9.5 w-auto" />
            <span
              className="hidden h-5 w-px bg-slate-200 sm:block"
              aria-hidden="true"
            />
            {/* Admin capsule */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-slate-300/80 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800 shadow-2xs">
              <Shield className="size-3 text-brand-navy" />
              <span>Institutional Portal</span>
              <span className="h-2 w-px bg-slate-300" aria-hidden="true" />
              <span className="text-slate-500 font-normal">Administration</span>
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
              href="/login"
              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-brand-blue transition hover:bg-blue-100 hover:border-blue-300"
            >
              <span>Student LMS</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </PageContainer>
      </header>

      {/* 02. MAIN CONTENT AREA - Perfectly fitted for laptop viewports */}
      <main className="relative flex min-h-0 flex-1 items-center overflow-y-auto py-(--space-content) lg:overflow-hidden lg:py-0">
        <PageContainer className="relative grid grid-cols-[minmax(0,1fr)] items-center gap-(--space-layout) lg:grid-cols-12 lg:gap-10 xl:gap-14">
          {/* Left Column: Academic Brand Presentation (Compact for laptop screen) */}
          <section
            aria-labelledby="admin-heading"
            className="layout-stack justify-center lg:col-span-6 xl:col-span-7"
          >
            {/* Eyebrow Pill */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/90 bg-white px-2.5 py-0.5 text-xs font-semibold tracking-wide text-slate-800 shadow-2xs uppercase">
                <ShieldCheck className="size-3.5 text-brand-navy" />
                <span>Institutional Governance</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Admin SSO Verified
              </span>
            </div>

            {/* Main Headline */}
            <h1
              id="admin-heading"
              className="type-hero text-slate-900"
            >
              Administrative Operations Portal.
            </h1>

            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              Secure administrative gateway for academy leaders to manage bilingual NEET &amp; JEE learning operations.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {adminPillars.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white/90 p-3 shadow-2xs transition hover:shadow-xs hover:border-slate-300"
                  >
                    <div>
                      <div className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-brand-navy">
                        <Icon className="size-3.5" />
                      </div>
                      <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-900 leading-tight">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Security Compliance Trust Strip */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Lock className="size-3 text-emerald-600" />
                <span>256-Bit TLS Audit Logging</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-blue-600" />
                <span>Enterprise Supabase RBAC</span>
              </span>
              <span>•</span>
              <span className="text-slate-600 font-medium">Coimbatore Campus Hub</span>
            </div>
          </section>

          {/* Right Column: Admin Login Form */}
          <section
            aria-label="Admin Credentials Sign In"
            className="flex justify-center lg:col-span-6 xl:col-span-5"
          >
            <AdminLoginForm />
          </section>
        </PageContainer>
      </main>
    </div>
  );
}

