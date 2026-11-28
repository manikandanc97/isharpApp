"use client";

import { useEffect, useRef, useState } from "react";

interface UseExamTimerOptions {
  expiresAt: string;
  initialSecondsRemaining: number;
  onAutoSubmit: () => void;
}

export function useExamTimer({
  expiresAt,
  initialSecondsRemaining,
  onAutoSubmit,
}: UseExamTimerOptions) {
  // Use wall-clock target from server expiresAt
  const targetTimeRef = useRef<number>(new Date(expiresAt).getTime());

  // Calculate accurate remaining seconds based on server target wall-clock time
  const getSecondsLeft = (): number => {
    const diff = Math.floor((targetTimeRef.current - Date.now()) / 1000);
    return Math.max(0, diff);
  };

  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const wallLeft = Math.floor(
      (new Date(expiresAt).getTime() - Date.now()) / 1000,
    );
    return Number.isFinite(wallLeft)
      ? Math.max(0, wallLeft)
      : initialSecondsRemaining;
  });

  const onAutoSubmitRef = useRef(onAutoSubmit);
  const isSubmittedRef = useRef(false);

  useEffect(() => {
    onAutoSubmitRef.current = onAutoSubmit;
    targetTimeRef.current = new Date(expiresAt).getTime();
  }, [expiresAt, onAutoSubmit]);

  useEffect(() => {
    const timer = setInterval(() => {
      const left = getSecondsLeft();
      setSecondsRemaining(left);

      if (left <= 0 && !isSubmittedRef.current) {
        isSubmittedRef.current = true;
        clearInterval(timer);
        onAutoSubmitRef.current();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const markSubmitted = () => {
    isSubmittedRef.current = true;
  };

  const isLowTime = secondsRemaining <= 300; // <= 5 minutes

  return {
    secondsRemaining,
    isLowTime,
    isSubmittedRef,
    markSubmitted,
  };
}

export function formatExamTimer(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}
