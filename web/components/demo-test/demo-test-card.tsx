"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  Clock,
  Languages,
  Play,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DemoTestCardProps {
  className?: string;
  compact?: boolean;
}

export function DemoTestCard({ className = "", compact = false }: DemoTestCardProps) {
  if (compact) {
    return (
      <Link
        href="/demo-test"
        className={`group flex items-center justify-between gap-3 rounded-2xl border border-rose-200/90 bg-rose-50/50 p-3 sm:p-3.5 transition-all duration-200 hover:bg-white hover:border-brand-red/50 hover:shadow-card ${className}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="grid size-9.5 shrink-0 place-items-center rounded-xl bg-brand-red text-white shadow-2xs group-hover:scale-105 transition-transform">
            <Zap className="size-4.5 fill-current" />
          </span>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-brand-red transition-colors">
                Take Free Full-Screen Demo Test
              </span>
              <Badge variant="outline" className="border-rose-300 bg-rose-100/70 text-brand-red text-2xs uppercase font-extrabold">
                Live CBT
              </Badge>
            </div>
            <p className="text-2xs sm:text-xs text-slate-500 truncate">
              Authentic bilingual NEET questions • Full-screen examination
            </p>
          </div>
        </div>

        <div className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-red text-white shadow-2xs group-hover:translate-x-0.5 transition-transform">
          <Play className="size-3 fill-current ml-0.5" />
        </div>
      </Link>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-rose-200/90 bg-linear-to-br from-white via-rose-50/30 to-amber-50/20 p-5 shadow-card transition-all hover:shadow-card-hover ${className}`}
    >
      {/* Top Luxury Accent Strip */}
      <div
        className="pointer-events-none absolute -top-px left-8 right-8 h-1 bg-linear-to-r from-brand-red via-amber-500 to-brand-blue opacity-80"
        aria-hidden="true"
      />

      <div className="space-y-4">
        {/* Header Strip */}
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1.5 rounded-full border-rose-300 bg-rose-50 px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-brand-red"
          >
            <span className="size-1.5 rounded-full bg-brand-red animate-pulse" />
            <span>Full-Screen Candidate Drill</span>
          </Badge>

          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-2xs font-semibold text-slate-600">
            No Login Required
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            Bilingual NEET Full-Screen Test Console
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Experience the actual I-Sharp exam engine. Practice randomized questions from Physics, Chemistry &amp; Biology with authentic NTA negative marking in a full-screen CBT console.
          </p>
        </div>

        {/* Highlights Row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-slate-200/80 bg-white/80 p-2 shadow-2xs">
            <Clock className="mx-auto size-3.5 text-brand-blue" />
            <p className="mt-1 text-2xs font-bold text-slate-900">15 Mins</p>
            <p className="text-2xs text-slate-400">Timed Exam</p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white/80 p-2 shadow-2xs">
            <Languages className="mx-auto size-3.5 text-brand-red" />
            <p className="mt-1 text-2xs font-bold text-slate-900">தமிழ் + Eng</p>
            <p className="text-2xs text-slate-400">Dual Toggle</p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white/80 p-2 shadow-2xs">
            <Award className="mx-auto size-3.5 text-emerald-600" />
            <p className="mt-1 text-2xs font-bold text-slate-900">+4 / -1</p>
            <p className="text-2xs text-slate-400">NTA Marking</p>
          </div>
        </div>

        {/* Launch Button -> Navigates to Full Screen Test */}
        <Link
          href="/demo-test"
          className="group flex w-full items-center justify-center gap-2 rounded-full bg-brand-red hover:bg-brand-red-hover py-2.5 text-xs sm:text-sm font-bold text-white shadow-primary hover:shadow-primary-hover transition-all active:scale-95"
        >
          <Play className="size-3.5 fill-current" />
          <span>Launch Full-Screen Demo Test</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
