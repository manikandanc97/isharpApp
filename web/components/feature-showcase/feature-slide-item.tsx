"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import type { FeatureItem } from "@/data/features";
import { cn } from "@/lib/utils";

interface FeatureSlideItemProps {
  feature: FeatureItem;
  index: number;
  activeIndex: number;
}

export function FeatureSlideItem({
  feature,
  index,
  activeIndex,
}: FeatureSlideItemProps) {
  const isCurrent = index === activeIndex;
  const FeatureIcon = feature.icon;
  const MetricIcon = feature.metricBadge.icon;
  const HighlightIcon = feature.highlightBadge.icon;

  return (
    <article
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
                  : "bg-brand-blue/10 text-brand-blue border border-brand-blue/20",
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
                    feature.accent === "red" ? "bg-brand-red" : "bg-brand-blue",
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
                : "bg-brand-blue hover:bg-brand-blue/90 focus-visible:ring-brand-blue",
            )}
          >
            <span>{feature.ctaText}</span>
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <HighlightIcon
              className={cn(
                "size-3.5 transition-colors duration-300",
                feature.accent === "red" ? "text-brand-red" : "text-brand-blue",
              )}
              aria-hidden="true"
            />
            <span className="text-xs">{feature.highlightBadge.label}</span>
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
                isCurrent
                  ? "scale-100 group-hover/frame:scale-105"
                  : "scale-105",
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
                  feature.accent === "red" ? "bg-brand-red" : "bg-cyan-400",
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
                      : "bg-brand-blue text-white",
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
}
