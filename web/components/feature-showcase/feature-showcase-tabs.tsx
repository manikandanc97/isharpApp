"use client";

import type { KeyboardEvent } from "react";
import { features } from "@/data/features";
import { cn } from "@/lib/utils";

interface FeatureShowcaseTabsProps {
  activeIndex: number;
  shouldPause: boolean;
  progress: number;
  onGoTo: (index: number) => void;
  onTabKeyDown: (event: KeyboardEvent<HTMLButtonElement>, index: number) => void;
}

export function FeatureShowcaseTabs({
  activeIndex,
  shouldPause,
  progress,
  onGoTo,
  onTabKeyDown,
}: FeatureShowcaseTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Experience Highlights"
      className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 sm:grid-cols-4"
    >
      {features.map((feature, index) => {
        const isSelected = index === activeIndex;
        const TabIcon = feature.icon;

        return (
          <button
            key={feature.id}
            id={`feature-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={`feature-slide-${feature.id}`}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onGoTo(index)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
            className={cn(
              "relative flex items-center justify-between px-3.5 py-3 text-left transition-all duration-300 sm:px-5 sm:py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30 focus-visible:ring-inset",
              isSelected
                ? "bg-white text-foreground shadow-xs"
                : "text-muted-foreground hover:bg-white/60 hover:text-foreground",
            )}
          >
            {/* Top indicator bar with smooth live progress */}
            <div className="absolute inset-x-0 top-0 h-0.75 bg-transparent">
              {isSelected && (
                <div
                  className={cn(
                    "h-full transition-all duration-100 ease-linear",
                    feature.accent === "red" ? "bg-brand-red" : "bg-brand-blue",
                  )}
                  style={{
                    width: shouldPause ? "100%" : `${progress}%`,
                  }}
                />
              )}
            </div>

            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={cn(
                  "text-xs font-mono font-semibold tracking-wide shrink-0 transition-colors duration-300",
                  isSelected
                    ? feature.accent === "red"
                      ? "text-brand-red"
                      : "text-brand-blue"
                    : "text-muted-foreground/60",
                )}
              >
                {feature.number}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold sm:text-sm text-foreground">
                  {feature.tabTitle}
                </p>
                <p className="hidden text-xs text-muted-foreground sm:block truncate">
                  {feature.tabSubtitle}
                </p>
              </div>
            </div>

            <TabIcon
              className={cn(
                "size-3.5 shrink-0 transition-all duration-300 ml-2 hidden sm:block",
                isSelected
                  ? feature.accent === "red"
                    ? "text-brand-red scale-110"
                    : "text-brand-blue scale-110"
                  : "text-muted-foreground/40",
              )}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}

