"use client";

import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  Lock,
  ShieldCheck,
  UserPlus,
  Users,
  KeyRound,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type PortalLink = {
  title: string;
  role: string;
  badge: string;
  description: string;
  href: string;
  icon: LucideIcon;
  solidBg: string;
  badgeBg: string;
  badgeText: string;
  accentBorder: string;
};

const portalLinks: readonly PortalLink[] = [
  {
    title: "Student LMS Portal",
    role: "Enrolled Learners",
    badge: "Active LMS",
    description: "Daily DPP drills, bilingual lectures & simulated tests",
    href: "/login",
    icon: Users,
    solidBg: "bg-[#2525b8]",
    badgeBg: "bg-blue-50 border-blue-200/80",
    badgeText: "text-[#2525b8]",
    accentBorder: "hover:border-[#2525b8]/40",
  },
  {
    title: "New Student Admission",
    role: "Fresh Applications",
    badge: "2026 Cohort",
    description: "Enroll in Tamil Medium & Bilingual NEET/JEE batches",
    href: "/register",
    icon: UserPlus,
    solidBg: "bg-[#e51d35]",
    badgeBg: "bg-rose-50 border-rose-200/80",
    badgeText: "text-[#e51d35]",
    accentBorder: "hover:border-[#e51d35]/40",
  },
  {
    title: "Faculty & Administration",
    role: "Instructors & Staff",
    badge: "SSO Secure",
    description: "Syllabus tracking, test telemetry & question bank",
    href: "/administration",
    icon: ShieldCheck,
    solidBg: "bg-slate-900",
    badgeBg: "bg-slate-100 border-slate-300",
    badgeText: "text-slate-800",
    accentBorder: "hover:border-slate-400",
  },
];

export function AccessPortal() {
  return (
    <section
      aria-labelledby="access-portal-title"
      className="relative rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-all hover:shadow-md"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-3xs font-bold tracking-wider text-emerald-700 uppercase">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Academic Gateway · Single Sign-On</span>
          </div>
          <h2
            id="access-portal-title"
            className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
          >
            Academic Gateway
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Secure authenticated access to your personalized learning workspace
          </p>
        </div>

        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-900 text-white shadow-2xs">
          <GraduationCap aria-hidden="true" className="size-5.5" strokeWidth={2} />
        </div>
      </div>

      {/* Portal Links */}
      <nav aria-label="Account access" className="mt-4">
        <ul className="space-y-3">
          {portalLinks.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition duration-200 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2525b8]",
                    item.accentBorder,
                  )}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-lg text-white shadow-2xs transition-transform duration-200 group-hover:scale-105",
                        item.solidBg,
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4.5" strokeWidth={2} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-[#2525b8] sm:text-sm transition-colors">
                          {item.title}
                        </span>
                        <span
                          className={cn(
                            "rounded border px-1.5 py-0.5 text-3xs font-bold uppercase tracking-wider",
                            item.badgeBg,
                            item.badgeText,
                          )}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p className="mt-0.5 text-3xs text-slate-500 sm:text-xs truncate">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid size-7.5 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 group-hover:border-[#2525b8] group-hover:bg-[#2525b8] group-hover:text-white transition-all shadow-2xs">
                    <ArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Security & Authentication Protocol Footnote */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-3xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <Lock className="size-3 text-emerald-600" aria-hidden="true" />
          <span>256-Bit TLS 1.3 Encryption</span>
        </div>
        <div className="flex items-center gap-2 font-semibold">
          <span className="text-slate-400">Auth:</span>
          <span className="text-[#2525b8] flex items-center gap-1">
            <CheckCircle2 className="size-3 text-[#2525b8]" /> Official I-Sharp ID
          </span>
        </div>
      </div>
    </section>
  );
}
