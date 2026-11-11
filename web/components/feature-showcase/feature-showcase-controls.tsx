"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { features, type FeatureItem } from "@/data/features";
import { cn } from "@/lib/utils";

interface FeatureShowcaseControlsProps {
  activeIndex: number;
  activeFeature: FeatureItem;
  onGoTo: (index: number) => void;
}

export function FeatureShowcaseControls({
  activeIndex,
  activeFeature,
  onGoTo,
}: FeatureShowcaseControlsProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-black/6 bg-surface-subtle/70 px-4 py-2.5 sm:px-6 backdrop-blur-md">
      {/* Slide Index Counter */}
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className="font-mono font-semibold text-foreground">
          0{activeIndex + 1}
        </span>
        <span>/</span>
        <span className="font-mono">0{features.length}</span>
        <span className="mx-2 hidden h-3 w-px bg-slate-300 sm:inline-block" />
        <span className="hidden text-xs sm:inline-block font-medium">
          {activeFeature.category}
        </span>
      </div>

      {/* Micro Indicator Dots */}
      <div className="flex items-center gap-1">
        {features.map((feature, index) => (
          <button
            key={feature.id}
            type="button"
            aria-label={`Jump to slide ${index + 1}: ${feature.tabTitle}`}
            onClick={() => onGoTo(index)}
            className="group p-1 focus-visible:outline-none"
          >
            <span
              className={cn(
                "block h-1.5 rounded-full transition-all duration-300",
                index === activeIndex
                  ? activeFeature.accent === "red"
                    ? "w-6 bg-brand-red"
                    : "w-6 bg-brand-blue"
                  : "w-2 bg-slate-200 group-hover:bg-slate-300",
              )}
            />
          </button>
        ))}
      </div>

      {/* Arrow Navigation */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => onGoTo(activeIndex - 1)}
          className="grid size-7.5 place-items-center rounded-full border border-black/10 bg-white text-foreground shadow-xs transition hover:border-black/20 hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-label="Next slide"
          onClick={() => onGoTo(activeIndex + 1)}
          className="grid size-7.5 place-items-center rounded-full bg-foreground text-white shadow-xs transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30"
        >
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
