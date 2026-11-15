"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { UserAnswerRecord } from "./demo-test.types";

interface UseDemoTestTimerOptions {
  totalSeconds: number;
  currentQuestionId: string;
  setAnswers: Dispatch<SetStateAction<Record<string, UserAnswerRecord>>>;
  onAutoSubmit: () => void;
}

export function useDemoTestTimer({
  totalSeconds,
  currentQuestionId,
  setAnswers,
  onAutoSubmit,
}: UseDemoTestTimerOptions) {
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const currentQuestionIdRef = useRef(currentQuestionId);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  const isSubmittedRef = useRef(false);

  useEffect(() => {
    currentQuestionIdRef.current = currentQuestionId;
  }, [currentQuestionId]);

  useEffect(() => {
    onAutoSubmitRef.current = onAutoSubmit;
  }, [onAutoSubmit]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });

      // Track active dwell time on current question
      const activeQId = currentQuestionIdRef.current;
      setAnswers((prev) => {
        const existing = prev[activeQId];
        if (!existing) return prev;
        return {
          ...prev,
          [activeQId]: {
            ...existing,
            timeSpentSeconds: (existing.timeSpentSeconds || 0) + 1,
          },
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [setAnswers]);

  // Safe auto-submit when timer expires
  useEffect(() => {
    if (secondsRemaining <= 0 && !isSubmittedRef.current) {
      isSubmittedRef.current = true;
      onAutoSubmitRef.current();
    }
  }, [secondsRemaining]);

  const markSubmitted = () => {
    isSubmittedRef.current = true;
  };

  const isLowTime = secondsRemaining <= 120; // 2 minutes

  return {
    secondsRemaining,
    isLowTime,
    isSubmittedRef,
    markSubmitted,
  };
}
