import type { Metadata } from "next";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Headphones,
  LockKeyhole,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { PlansAccessRedirect } from "@/components/plans-access-redirect";
import { SignOutButton } from "@/components/sign-out-button";
import { PageContainer, Stack } from "@/components/layout/layout-primitives";

export const metadata: Metadata = {
  title: "Activate Student Access | I-Sharp Academy",
  description:
    "Activate paid access to the I-Sharp Academy student learning portal.",
};

const planBenefits = [
  "Full student learning dashboard",
  "Daily practice problems and video lectures",
  "Mock tests with performance insights",
] as const;

const accessSteps = [
  {
    title: "Student account created",
    description: "Your secure login is ready to use.",
    state: "complete",
  },
  {
    title: "External plan assigned",
    description: "This email is not in the active I-Sharp student roster.",
    state: "complete",
  },
  {
    title: "Payment approval pending",
    description: "Contact the academy to activate dashboard access.",
    state: "current",
  },
] as const;

export default function PlansPage() {
  return (
    <div className="flex min-h-svh flex-col bg-slate-50/70 font-sans text-slate-900 antialiased selection:bg-brand-red selection:text-white">
      <PlansAccessRedirect />
      <header className="sticky top-0 z-50 shrink-0 border-b border-slate-200/80 bg-white/90 shadow-xs backdrop-blur-xl">
        <PageContainer className="flex h-(--layout-site-header-height) items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo priority className="h-9 w-auto" />
            <span className="hidden h-5 w-px bg-slate-200 sm:block" />
            <span className="hidden text-xs font-semibold uppercase tracking-wide text-slate-500 sm:inline">
              Student access
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <Link
              href="/"
              className="hidden items-center gap-1 text-xs font-semibold text-slate-600 transition hover:text-slate-950 sm:inline-flex"
            >
              <ArrowLeft className="size-3.5" />
              Back to Academy
            </Link>
            <span className="hidden h-4 w-px bg-slate-200 sm:block" />
            <SignOutButton className="h-8.5 gap-1.5 px-3.5 text-xs font-semibold">
              <LogOut className="size-3.5" />
              Sign out
            </SignOutButton>
          </div>
        </PageContainer>
      </header>

      <main className="flex flex-1 items-center py-(--space-layout)">
        <PageContainer className="grid grid-cols-[minmax(0,1fr)] items-center gap-(--space-layout) lg:grid-cols-12 lg:gap-14">
          <section
            aria-labelledby="access-heading"
            className="layout-stack lg:col-span-6 xl:col-span-7"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              <CheckCircle2 className="size-3.5" />
              Account created successfully
            </div>

            <h1
              id="access-heading"
              className="max-w-2xl type-hero text-slate-950"
            >
              Your account is ready. Activate your learning access.
            </h1>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              Your login email is not currently listed in the I-Sharp student
              roster, so an external student plan has been assigned. Complete
              payment approval to unlock the dashboard.
            </p>

            <ol
              className="max-w-xl"
              aria-label="Account activation progress"
            >
              {accessSteps.map((step, index) => (
                <li
                  key={step.title}
                  className="relative flex gap-3.5 pb-5 last:pb-0"
                >
                  {index < accessSteps.length - 1 && (
                    <span
                      className="absolute left-4 top-8 h-[calc(100%-2rem)] w-px bg-slate-200"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={
                      step.state === "current"
                        ? "relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                        : "relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    }
                  >
                    {step.state === "current" ? (
                      <Clock3 className="size-4" />
                    ) : (
                      <Check className="size-4 stroke-[3]" />
                    )}
                  </span>
                  <div className="grid gap-0.5 pt-0.5">
                    <h2 className="text-sm font-semibold text-slate-900">
                      {step.title}
                    </h2>
                    <p className="text-xs leading-5 text-slate-500">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="flex max-w-xl items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs leading-5 text-blue-950">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-blue" />
              <p>
                <strong>Already studying at I-Sharp?</strong> Ask the academy to
                add this exact login email to the internal roster. Your free
                access will be applied automatically the next time you sign in.
              </p>
            </div>
          </section>

          <section
            aria-labelledby="plan-heading"
            className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card lg:col-span-6 xl:col-span-5"
          >
            <div className="border-b border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
              <Stack gap="sm">
              <div className="flex items-start justify-between gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-brand-blue ring-1 ring-blue-100">
                  <CreditCard className="size-5" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  Approval pending
                </span>
              </div>

              <p className="pt-(--space-cluster) text-xs font-semibold uppercase tracking-wide text-brand-red">
                External student plan
              </p>
              <h2
                id="plan-heading"
                className="type-page-title text-slate-950"
              >
                Activate paid access
              </h2>
              <p className="text-xs leading-5 text-slate-500">
                Online checkout is not available yet. Contact the academy using
                your login email; an administrator will confirm payment and
                activate your account.
              </p>
              </Stack>
            </div>

            <Stack className="px-5 py-5 sm:px-7 sm:py-6">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Sparkles className="size-4 text-brand-blue" />
                  Included with access
                </div>
                <ul className="space-y-2.5 pt-(--space-cluster)">
                  {planBenefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start gap-2 text-xs leading-5 text-slate-600"
                    >
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-start gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-brand-red">
                  <Headphones className="size-4" />
                </div>
                <div className="grid gap-0.5">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Contact the academy
                  </h3>
                  <p className="text-xs leading-5 text-slate-500">
                    Keep your registered email ready so the team can find your
                    account quickly.
                  </p>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <a
                  href="tel:+919894850370"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-red px-4 text-xs font-semibold text-white shadow-primary transition hover:bg-brand-red-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red"
                >
                  <Phone className="size-4" />
                  Call the academy
                </a>
                <a
                  href="mailto:isharpacademy@gmail.com"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                >
                  <Mail className="size-4" />
                  Send an email
                </a>
              </div>

              <div className="flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
                <LockKeyhole className="size-3.5 shrink-0" />
                Dashboard access stays protected until approval.
              </div>
            </Stack>
          </section>
        </PageContainer>
      </main>
    </div>
  );
}
