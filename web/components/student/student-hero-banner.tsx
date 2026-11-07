"use client";

import { BookCheck, Zap } from "lucide-react";
import { Stack } from "@/components/layout/layout-primitives";
import { Button } from "@/components/ui/button";

interface StudentHeroBannerProps {
  greetingName: string;
  onResumeDrill: () => void;
  onOpenMocks: () => void;
}

export function StudentHeroBanner({
  greetingName,
  onResumeDrill,
  onOpenMocks,
}: StudentHeroBannerProps) {
  return (
    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
      <Stack gap="sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-white px-3.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs">
          <span className="size-2 rounded-full bg-brand-red animate-pulse" />
          <span>Premier Bilingual NEET &amp; JEE Preparation</span>
          <span className="text-slate-300">•</span>
          <span className="text-brand-red font-semibold">
            இன்றைய இலக்கு (Today&apos;s Target)
          </span>
        </div>

        <h1 className="type-page-title text-slate-900">
          வணக்கம், {greetingName}! Top percentile-ஐ நோக்கி முன்னேறுங்கள்.
        </h1>
        <p className="max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-sm">
          Consistency is key: 15 Daily DPP Drills, Calibrated 720-mark NTA Mocks,
          and uncompromised concept clarity in{" "}
          <strong className="text-slate-900 font-semibold">
            தமிழ் + English
          </strong>
          .
        </p>
      </Stack>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <Button
          onClick={onResumeDrill}
          className="group rounded-full bg-brand-red px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-primary transition-all duration-200 hover:bg-brand-red-hover active:scale-95"
        >
          <Zap className="mr-1.5 size-4 transition-transform group-hover:scale-110" />
          <span>Resume Daily DPP</span>
        </Button>

        <Button
          variant="outline"
          onClick={onOpenMocks}
          className="rounded-full border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs transition-all hover:border-brand-blue/40 hover:text-brand-blue active:scale-95"
        >
          <BookCheck className="mr-1.5 size-4 text-brand-blue" />
          <span>Mock Test Arena</span>
        </Button>
      </div>
    </div>
  );
}

