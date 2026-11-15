"use client";

import { Clock, LayoutGrid, Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTime } from "./demo-test-calculator";

export interface DemoTestHeaderProps {
  code: string;
  title: string;
  secondsRemaining: number;
  isLowTime: boolean;
  langMode: "en" | "ta";
  onLangChange: (lang: "en" | "ta") => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  attemptedCount: number;
  totalQuestions: number;
  onOpenMobilePalette: () => void;
  onOpenSubmitDialog: () => void;
  onOpenExitDialog: () => void;
}

export function DemoTestHeader({
  code,
  title,
  secondsRemaining,
  isLowTime,
  langMode,
  onLangChange,
  isFullscreen,
  onToggleFullscreen,
  attemptedCount,
  totalQuestions,
  onOpenMobilePalette,
  onOpenSubmitDialog,
  onOpenExitDialog,
}: DemoTestHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-6 shadow-xs">
      {/* Brand & Test Title */}
      <div className="flex items-center gap-3">
        <span className="flex size-2 rounded-full bg-brand-red animate-pulse" />
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-brand-red/10 px-2 py-0.5 font-mono text-2xs font-extrabold text-brand-red">
            {code}
          </span>
          <span className="hidden sm:inline text-xs font-bold text-slate-800">
            {title}
          </span>
        </div>
      </div>

      {/* Center Timer Indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs sm:text-sm font-bold shadow-2xs transition ${
            isLowTime
              ? "border-rose-400 bg-rose-50 text-rose-700 animate-pulse"
              : "border-slate-300 bg-slate-50 text-slate-800"
          }`}
        >
          <Clock
            className={`size-3.5 sm:size-4 ${
              isLowTime ? "text-rose-600" : "text-brand-blue"
            }`}
          />
          <span>Time Left: {formatTime(secondsRemaining)}</span>
        </div>
      </div>

      {/* Right Tools & Language & Submit */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <div className="hidden md:inline-flex rounded-full bg-slate-100 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onLangChange("en")}
            className={`rounded-full px-2.5 py-1 transition ${
              langMode === "en"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            English (Only)
          </button>
          <button
            type="button"
            onClick={() => onLangChange("ta")}
            className={`rounded-full px-2.5 py-1 transition ${
              langMode === "ta"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            தமிழ் + English (Both)
          </button>
        </div>

        {/* Fullscreen Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFullscreen}
          className="hidden sm:inline-flex size-8 p-0 rounded-full border-slate-300 text-slate-600 hover:text-slate-900"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 className="size-3.5" />
          ) : (
            <Maximize2 className="size-3.5" />
          )}
        </Button>

        {/* Mobile Palette Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenMobilePalette}
          className="lg:hidden rounded-full border-slate-300 text-xs font-semibold px-2.5 py-1 text-slate-700 hover:text-slate-900"
          title="Open Question Palette"
        >
          <LayoutGrid className="size-3.5 mr-1 text-brand-red" />
          <span>
            Palette ({attemptedCount}/{totalQuestions})
          </span>
        </Button>

        {/* Submit Test Button */}
        <Button
          onClick={onOpenSubmitDialog}
          className="rounded-full bg-brand-red px-4 py-1.5 text-xs font-bold text-white shadow-primary hover:bg-brand-red-hover"
        >
          Submit Test
        </Button>

        {/* Exit Button */}
        <button
          type="button"
          onClick={onOpenExitDialog}
          className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition"
          title="Exit Test"
        >
          <X className="size-4" />
        </button>
      </div>
    </header>
  );
}
