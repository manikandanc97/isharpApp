"use client";

import { features } from "@/data/features";
import { cn } from "@/lib/utils";
import {
  ContentSection,
  PageContainer,
  Stack,
} from "@/components/layout/layout-primitives";
import { useFeatureCarousel } from "./feature-showcase/use-feature-carousel";
import { FeatureShowcaseTabs } from "./feature-showcase/feature-showcase-tabs";
import { FeatureSlideItem } from "./feature-showcase/feature-slide-item";
import { FeatureShowcaseControls } from "./feature-showcase/feature-showcase-controls";

export function FeatureShowcase() {
  const {
    activeIndex,
    activeFeature,
    shouldPause,
    progress,
    goTo,
    handleTabKeyDown,
    setIsPointerOver,
    setHasFocus,
  } = useFeatureCarousel();

  return (
    <ContentSection
      id="experience"
      aria-labelledby="feature-showcase-title"
      className="relative overflow-hidden border-b border-slate-200/80 bg-white"
    >
      <PageContainer>
        <Stack gap="lg">
          {/* Section Header */}
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <Stack gap="sm">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 shadow-2xs">
                <span
                  className={cn(
                    "size-2 rounded-full animate-pulse",
                    activeFeature.accent === "red"
                      ? "bg-brand-red"
                      : "bg-brand-blue",
                  )}
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold tracking-wide text-slate-800 uppercase">
                  The I-Sharp Learning Ecosystem
                </span>
              </div>

              <h2
                id="feature-showcase-title"
                className="type-page-title text-slate-900"
              >
                Crafted for clarity.{" "}
                <span className="text-slate-500 font-semibold">
                  Engineered for rank.
                </span>
              </h2>
            </Stack>

            <p className="max-w-md text-xs leading-relaxed text-slate-600 sm:text-right sm:text-sm">
              A structured bilingual learning architecture uniting daily reflex conditioning, simulated test rigor, and precision diagnostic radar.
            </p>
          </div>

          {/* Carousel & Showcase Shell */}
          <div
            role="region"
            aria-roledescription="carousel"
            aria-labelledby="feature-showcase-title"
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300"
            onMouseEnter={() => setIsPointerOver(true)}
            onMouseLeave={() => setIsPointerOver(false)}
            onFocusCapture={() => setHasFocus(true)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setHasFocus(false);
              }
            }}
          >
            {/* Segmented Navigation Tabs */}
            <FeatureShowcaseTabs
              activeIndex={activeIndex}
              shouldPause={shouldPause}
              progress={progress}
              onGoTo={goTo}
              onTabKeyDown={handleTabKeyDown}
            />

            {/* Sliding Track */}
            <div className="relative overflow-hidden">
              <div
                className="flex w-full transition-transform duration-500 ease-out motion-reduce:transition-none"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {features.map((feature, index) => (
                  <FeatureSlideItem
                    key={feature.id}
                    feature={feature}
                    index={index}
                    activeIndex={activeIndex}
                  />
                ))}
              </div>
            </div>

            {/* Carousel Controls Bar */}
            <FeatureShowcaseControls
              activeIndex={activeIndex}
              activeFeature={activeFeature}
              onGoTo={goTo}
            />
          </div>
        </Stack>
      </PageContainer>
    </ContentSection>
  );
}
