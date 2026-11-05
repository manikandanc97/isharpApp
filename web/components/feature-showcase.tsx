"use client";

import {
  useEffect,
  useState,
  useRef,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { features, ROTATION_INTERVAL_MS } from "@/data/features";
import { cn } from "@/lib/utils";
import {
  ContentSection,
  PageContainer,
  Stack,
} from "@/components/layout/layout-primitives";

export function FeatureShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPointerOver, setIsPointerOver] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [progress, setProgress] = useState(0);

  const shouldPause = isPointerOver || hasFocus;
  const activeFeature = features[activeIndex];

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Smooth live progress bar indicator for the active slide tab
  useEffect(() => {
    if (shouldPause) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const rafId = requestAnimationFrame(() => setProgress(0));
    const updateFrequency = 40; // ms for ultra-smooth 60fps indicator
    const increment = (updateFrequency / ROTATION_INTERVAL_MS) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + increment;
      });
    }, updateFrequency);

    return () => {
      cancelAnimationFrame(rafId);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [activeIndex, shouldPause]);

  // Slide rotation timer
  useEffect(() => {
    if (
      shouldPause ||
      (typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    ) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setActiveIndex((current) => (current + 1) % features.length);
      setProgress(0);
    }, ROTATION_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeIndex, shouldPause]);

  const goTo = (index: number) => {
    setActiveIndex((index + features.length) % features.length);
    setProgress(0);
  };

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number;

    switch (event.key) {
      case "ArrowLeft":
        nextIndex = (index - 1 + features.length) % features.length;
        break;
      case "ArrowRight":
        nextIndex = (index + 1) % features.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = features.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    goTo(nextIndex);
    event.currentTarget.parentElement
      ?.querySelector<HTMLButtonElement>(`#feature-tab-${nextIndex}`)
      ?.focus();
  }

  return (
    <ContentSection
      id="experience"
      aria-labelledby="feature-showcase-title"
      className="relative overflow-hidden border-b border-slate-200/80 bg-white"
    >
      <PageContainer>
        <Stack gap="lg">
        {/* Compact, High-Impact Section Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <Stack gap="sm">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 shadow-2xs">
              <span
                className={cn(
                  "size-2 rounded-full animate-pulse",
                  activeFeature.accent === "red"
                    ? "bg-brand-red"
                    : "bg-brand-blue"
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
          {/* Sleek Segmented Navigation Tabs */}
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
                  onClick={() => goTo(index)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  className={cn(
                    "relative flex items-center justify-between px-3.5 py-3 text-left transition-all duration-300 sm:px-5 sm:py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/30 focus-visible:ring-inset",
                    isSelected
                      ? "bg-white text-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-white/60 hover:text-foreground"
                  )}
                >
                  {/* Top indicator bar with smooth live progress */}
                  <div className="absolute inset-x-0 top-0 h-0.75 bg-transparent">
                    {isSelected && (
                      <div
                        className={cn(
                          "h-full transition-all duration-100 ease-linear",
                          feature.accent === "red"
                            ? "bg-brand-red"
                            : "bg-brand-blue"
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
                          : "text-muted-foreground/60"
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
                        : "text-muted-foreground/40"
                    )}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>

          {/* Smooth Sliding Track: 100% Equal Height & Buttery Smooth Motion */}
          <div className="relative overflow-hidden">
            <div
              className="flex w-full transition-transform duration-500 ease-out motion-reduce:transition-none"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {features.map((feature, index) => {
                const isCurrent = index === activeIndex;
                const FeatureIcon = feature.icon;
                const MetricIcon = feature.metricBadge.icon;
                const HighlightIcon = feature.highlightBadge.icon;

                return (
                  <article
                    key={feature.id}
                    id={`feature-slide-${feature.id}`}
                    role="tabpanel"
                    aria-roledescription="slide"
                    aria-labelledby={`feature-tab-${index}`}
                    aria-hidden={!isCurrent}
                    className="grid w-full shrink-0 lg:grid-cols-12 items-stretch"
                  >
                    {/* Left Narrative Column - Strict Fixed Content Height */}
                    <div className="relative flex flex-col justify-between p-5 sm:p-7 lg:col-span-7 lg:p-8 border-b lg:border-b-0 lg:border-r border-slate-200">
                      <div className="relative z-10 flex flex-col gap-3.5 sm:gap-4">
                        {/* Category & Phase Pill */}
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase transition-colors duration-300",
                              feature.accent === "red"
                                ? "bg-brand-red/10 text-brand-red border border-brand-red/20"
                                : "bg-brand-blue/10 text-brand-blue border border-brand-blue/20"
                            )}
                          >
                            <FeatureIcon className="size-3" aria-hidden="true" />
                            {feature.category}
                          </span>

                          <span className="text-xs font-medium text-muted-foreground">
                            Phase {feature.number} of 04
                          </span>
                        </div>

                        {/* Title & Description - Perfectly Symmetrical Height */}
                        <div>
                          <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-2xl leading-tight min-h-14 flex items-center">
                            {feature.title}
                          </h3>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm min-h-10 flex items-center">
                            {feature.description}
                          </p>
                        </div>

                        {/* Value Highlights: 3 Symmetrical Rows with Identical Heights */}
                        <div className="space-y-2 pt-1">
                          {feature.highlights.map((point) => (
                            <div
                              key={point}
                              className="flex items-center gap-2.5 rounded-xl border border-black/5 bg-surface-soft/80 px-3 py-2 text-xs transition-colors hover:bg-surface-soft sm:text-xs"
                            >
                              <span
                                className={cn(
                                  "grid size-4 shrink-0 place-items-center rounded-full text-white transition-colors duration-300",
                                  feature.accent === "red"
                                    ? "bg-brand-red"
                                    : "bg-brand-blue"
                                )}
                              >
                                <CheckCircle2 className="size-3" aria-hidden="true" />
                              </span>
                              <span className="font-medium text-foreground truncate">
                                {point}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Action Row */}
                      <div className="relative z-10 mt-5 flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-black/6">
                        <Link
                          href={feature.ctaHref}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:gap-2.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:text-sm",
                            feature.accent === "red"
                              ? "bg-brand-red hover:bg-brand-red/90 focus-visible:ring-brand-red"
                              : "bg-brand-blue hover:bg-brand-blue/90 focus-visible:ring-brand-blue"
                          )}
                        >
                          <span>{feature.ctaText}</span>
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <HighlightIcon
                            className={cn(
                              "size-3.5 transition-colors duration-300",
                              feature.accent === "red"
                                ? "text-brand-red"
                                : "text-brand-blue"
                            )}
                            aria-hidden="true"
                          />
                          <span className="text-xs">
                            {feature.highlightBadge.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Visual Column - Identical Frame Dimensions */}
                    <div className="relative flex items-center justify-center p-4 sm:p-6 lg:col-span-5 bg-slate-50">
                      <div className="group/frame relative w-full max-w-95 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm transition-transform duration-500 hover:scale-102">
                        {/* 3D Generated Luxury Image */}
                        <div className="relative h-64 sm:h-70 lg:h-75 w-full overflow-hidden">
                          <Image
                            src={feature.image}
                            alt={feature.imageAlt}
                            fill
                            priority={index === 0}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 400px"
                            className={cn(
                              "object-cover transition-transform duration-700 ease-out",
                              isCurrent ? "scale-100 group-hover/frame:scale-105" : "scale-105"
                            )}
                          />
                          {/* Solid clean subtle overlay */}
                          <div
                            className="pointer-events-none absolute inset-0 bg-black/30"
                            aria-hidden="true"
                          />
                        </div>

                        {/* Overlaid Floating Glass Metric Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 backdrop-blur-md text-white shadow-sm">
                            <span
                              className={cn(
                                "size-1.5 rounded-full animate-ping",
                                feature.accent === "red"
                                  ? "bg-brand-red"
                                  : "bg-cyan-400"
                              )}
                              aria-hidden="true"
                            />
                            <span className="text-xs font-semibold tracking-wide uppercase">
                              Live Environment
                            </span>
                          </div>

                          <span className="text-xs font-mono font-medium text-white/80 bg-black/45 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                            IS-{feature.id.toUpperCase()}
                          </span>
                        </div>

                        {/* Bottom glassmorphic showcase banner */}
                        <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/15 bg-white/10 p-2.5 sm:p-3 backdrop-blur-xl shadow-lg text-white">
                          <div className="flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={cn(
                                  "grid size-7 shrink-0 place-items-center rounded-lg transition-colors duration-300",
                                  feature.accent === "red"
                                    ? "bg-brand-red text-white"
                                    : "bg-brand-blue text-white"
                                )}
                              >
                                <MetricIcon className="size-3.5" aria-hidden="true" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-white/70 uppercase tracking-wide">
                                  {feature.metricBadge.label}
                                </p>
                                <p className="text-xs font-semibold tracking-tight text-white">
                                  {feature.metricBadge.value}
                                </p>
                              </div>
                            </div>

                            <span className="inline-block rounded bg-white/15 px-1.5 py-0.5 text-xs font-semibold text-white uppercase tracking-wide">
                              Verified
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Compact Bottom Luxury Carousel Controls Bar */}
          <div className="flex items-center justify-between gap-3 border-t border-black/6 bg-surface-subtle/70 px-4 py-2.5 sm:px-6 backdrop-blur-md">
            {/* Slide Index Counter */}
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <span className="font-mono font-semibold text-foreground">
                0{activeIndex + 1}
              </span>
              <span>/</span>
              <span className="font-mono">0{features.length}</span>
              <span className="mx-2 hidden h-3 w-px bg-black/15 sm:inline-block" />
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
                  onClick={() => goTo(index)}
                  className="group p-1 focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      "block h-1.5 rounded-full transition-all duration-300",
                      index === activeIndex
                        ? activeFeature.accent === "red"
                          ? "w-6 bg-brand-red"
                          : "w-6 bg-brand-blue"
                        : "w-2 bg-black/15 group-hover:bg-black/30"
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
                onClick={() => goTo(activeIndex - 1)}
                className="grid size-7.5 place-items-center rounded-full border border-black/10 bg-white text-foreground shadow-xs transition hover:border-black/20 hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30"
              >
                <ChevronLeft className="size-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                aria-label="Next slide"
                onClick={() => goTo(activeIndex + 1)}
                className="grid size-7.5 place-items-center rounded-full bg-foreground text-white shadow-xs transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30"
              >
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        </Stack>
      </PageContainer>
    </ContentSection>
  );
}
