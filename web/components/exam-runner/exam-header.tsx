"use client";

import {
  CheckCircle2,
  Clock,
  CloudCheck,
  CloudOff,
  Flame,
  Globe2,
  Languages,
  LayoutGrid,
  Loader2,
  Maximize2,
  Minimize2,
  Send,
  WifiOff,
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LanguageMode } from "./exam.types";
import { formatExamTimer } from "./use-exam-timer";
import type { SaveStatus } from "./use-exam-autosave";

interface ExamHeaderProps {
  code: string;
  title: string;
  secondsRemaining: number;
  isLowTime: boolean;
  saveStatus: SaveStatus;
  langMode: LanguageMode;
  onLangChange: (lang: LanguageMode) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  attemptedCount: number;
  totalQuestions: number;
  onOpenMobilePalette: () => void;
  onOpenSubmitDialog: () => void;
  onOpenExitDialog: () => void;
}

export function ExamHeader({
  code,
  title,
  secondsRemaining,
  isLowTime,
  saveStatus,
  langMode,
  onLangChange,
  isFullscreen,
  onToggleFullscreen,
  attemptedCount,
  totalQuestions,
  onOpenMobilePalette,
  onOpenSubmitDialog,
  onOpenExitDialog,
}: ExamHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 py-2 sm:px-6 sm:py-2.5 shadow-2xs z-20">
      {/* Brand & Test Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative h-7 w-24 shrink-0 sm:h-8 sm:w-28">
          <Image
            src="/isharp-logo.png"
            alt="I-Sharp Academy"
            fill
            className="object-contain object-left"
            priority
          />
        </div>
        <div className="hidden h-5 w-px bg-slate-200 md:block" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-brand-red/10 px-1.5 py-0.5 font-mono text-3xs font-bold text-brand-red">
              {code}
            </span>
            <Badge
              variant="outline"
              className="hidden lg:inline-flex border-indigo-200 bg-indigo-50 text-3xs font-semibold text-brand-blue"
            >
              Official CBT
            </Badge>
          </div>
          <h1 className="truncate text-xs font-bold text-slate-800 sm:text-sm">
            {title}
          </h1>
        </div>
      </div>

      {/* Middle & Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Autosave Status Pill */}
        <div className="hidden xl:flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-3xs font-semibold">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-amber-600">
              <Loader2 className="size-3 animate-spin" />
              <span>Autosaving...</span>
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-emerald-600">
              <CloudCheck className="size-3.5" />
              <span>Answers Saved</span>
            </span>
          )}
          {saveStatus === "offline" && (
            <span className="flex items-center gap-1 text-rose-600">
              <WifiOff className="size-3.5" />
              <span>Offline (Queueing)</span>
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1 text-rose-600">
              <CloudOff className="size-3.5" />
              <span>Sync Error</span>
            </span>
          )}
        </div>

        {/* Live Timer Clock */}
        <div
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 font-mono text-xs sm:text-sm font-bold transition-all ${
            isLowTime
              ? "border-rose-300 bg-rose-50 text-rose-700 animate-pulse"
              : "border-slate-200 bg-slate-50 text-slate-800"
          }`}
        >
          {isLowTime ? (
            <Flame className="size-3.5 text-rose-600" />
          ) : (
            <Clock className="size-3.5 text-brand-blue" />
          )}
          <span>{formatExamTimer(secondsRemaining)}</span>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center rounded-full bg-slate-100 p-0.5 text-2xs font-semibold">
          <button
            type="button"
            onClick={() => onLangChange("ta")}
            className={`rounded-full px-2 py-0.5 transition ${
              langMode === "ta"
                ? "bg-brand-red text-white shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            தமிழ்
          </button>
          <button
            type="button"
            onClick={() => onLangChange("en")}
            className={`rounded-full px-2 py-0.5 transition ${
              langMode === "en"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            EN
          </button>
        </div>

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="hidden sm:grid size-8 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="size-3.5" />
          ) : (
            <Maximize2 className="size-3.5" />
          )}
        </button>

        {/* Mobile Palette Open Button */}
        <button
          type="button"
          onClick={onOpenMobilePalette}
          className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 md:hidden"
          title="Question Palette"
        >
          <LayoutGrid className="size-4" />
        </button>

        {/* Submit Examination Button */}
        <Button
          onClick={onOpenSubmitDialog}
          className="rounded-full bg-brand-red px-3 sm:px-4 py-1.5 text-xs font-bold text-white shadow-primary hover:bg-brand-red-hover"
        >
          <Send className="mr-1 size-3 sm:size-3.5" />
          <span>Submit Test</span>
        </Button>
      </div>
    </header>
  );
}
