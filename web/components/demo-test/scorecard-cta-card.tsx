"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";

export function ScorecardCtaCard() {
  return (
    <div className="my-6 rounded-3xl bg-linear-to-r from-brand-navy via-slate-900 to-brand-navy p-6 text-white shadow-xl relative overflow-hidden">
      <div className="absolute right-0 top-0 -mt-6 -mr-6 size-48 rounded-full bg-brand-red/20 blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wide uppercase text-emerald-400">
              iSharp Academy Admissions Open
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold">
            Ready to take your preparation to the next level?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Join iSharp Academy for structured NEET &amp; JEE coaching, bilingual test series, daily practice problems, and personalized faculty mentorship.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Link
            href="/register"
            onClick={() => {
              void fetch("/api/demo/events/cta", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ctaName: "join_isharp_academy" }),
              }).catch(() => {});
            }}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-brand-red hover:bg-brand-red-hover px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg transition active:scale-95"
          >
            <GraduationCap className="size-4" />
            <span>Join iSharp Academy</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
