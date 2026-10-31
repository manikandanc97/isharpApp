"use client";

import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  Lock,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type PortalLink = {
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  href: string;
  icon: LucideIcon;
  solidBg: string;
  accentBorder: string;
};

const portalLinks: readonly PortalLink[] = [
  {
    title: "Student LMS Portal",
    badge: "Enrolled",
    badgeColor: "bg-blue-50 text-[#2525b8] border-blue-200/80",
    description: "Daily DPP drills, lectures & simulated tests",
    href: "/login",
    icon: Users,
    solidBg: "bg-[#2525b8]",
    accentBorder: "hover:border-[#2525b8]/50 hover:shadow-blue-500/5",
  },
  {
    title: "New Student",
    badge: "Batch 2026",
    badgeColor: "bg-rose-50 text-[#e51d35] border-rose-200/80",
    description: "Enroll in Tamil Medium & Bilingual batches",
    href: "/register",
    icon: UserPlus,
    solidBg: "bg-[#e51d35]",
    accentBorder: "hover:border-[#e51d35]/50 hover:shadow-rose-500/5",
  },
  {
    title: "Faculty & Administration",
    badge: "Staff",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    description: "Curriculum tracking & question bank",
    href: "/administration",
    icon: ShieldCheck,
    solidBg: "bg-slate-900",
    accentBorder: "hover:border-slate-400 hover:shadow-slate-500/5",
  },
];

export function AccessPortal() {
  return (
    <Card
      aria-labelledby="access-portal-title"
      className="relative rounded-3xl border border-slate-200/85 bg-white p-5 sm:p-6 shadow-[0_16px_44px_-12px_rgba(25,23,71,0.09),0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_20px_52px_-12px_rgba(25,23,71,0.13)]"
    >
      {/* Top subtle luxury accent line */}
      <div
        className="pointer-events-none absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#2525b8]/40 to-transparent"
        aria-hidden="true"
      />

      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div>
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1.5 rounded-full border-emerald-200/80 bg-emerald-50/80 px-2.5 py-0.5 text-3xs font-bold tracking-wider text-emerald-700 uppercase"
          >
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Academic Gateway</span>
          </Badge>
          <h2
            id="access-portal-title"
            className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
          >
            Portal Access
          </h2>
          <p className="text-xs text-slate-500">
            Select your portal to continue to your workspace
          </p>
        </div>

        <div className="grid size-10.5 shrink-0 place-items-center rounded-2xl bg-[#2525b8] text-white shadow-xs">
          <GraduationCap aria-hidden="true" className="size-5" strokeWidth={2} />
        </div>
      </div>

      {/* Portal Links */}
      <nav aria-label="Account access" className="mt-3.5">
        <ul className="space-y-2.5">
          {portalLinks.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 sm:p-3.5 transition-all duration-200 hover:bg-white hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2525b8]",
                    item.accentBorder,
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        "grid size-9.5 shrink-0 place-items-center rounded-xl text-white shadow-2xs transition-transform duration-200 group-hover:scale-105",
                        item.solidBg,
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4.5" strokeWidth={2} />
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-[#2525b8] sm:text-sm transition-colors leading-snug">
                          {item.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full border px-2 py-0.2 text-3xs font-semibold uppercase tracking-wider",
                            item.badgeColor,
                          )}
                        >
                          {item.badge}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-3xs text-slate-500 sm:text-xs leading-tight">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid size-7 shrink-0 place-items-center rounded-full border border-slate-200/80 bg-white text-slate-400 group-hover:border-[#2525b8] group-hover:bg-[#2525b8] group-hover:text-white transition-all shadow-2xs">
                    <ArrowRight
                      aria-hidden="true"
                      className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                      strokeWidth={2.5}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Subtle security & network footnote */}
      <Separator className="mt-3.5 bg-slate-100" />
      <div className="pt-3 flex items-center justify-between text-3xs text-slate-400">
        <div className="flex items-center gap-1.5 font-medium text-slate-500">
          <Lock className="size-3 text-emerald-600" aria-hidden="true" />
          <span>256-Bit Encrypted Access</span>
        </div>
        <div className="flex items-center gap-1 font-semibold text-slate-600">
          <ShieldCheck className="size-3.5 text-[#2525b8]" />
          <span>Official I-Sharp ID</span>
        </div>
      </div>
    </Card>
  );
}
