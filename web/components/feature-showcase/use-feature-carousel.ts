"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { features, ROTATION_INTERVAL_MS } from "@/data/features";

export function useFeatureCarousel() {
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

  return {
    activeIndex,
    activeFeature,
    shouldPause,
    progress,
    goTo,
    handleTabKeyDown,
    setIsPointerOver,
    setHasFocus,
  };
}

