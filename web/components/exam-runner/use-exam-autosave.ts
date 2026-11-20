"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StudentAnswerState } from "./exam.types";

export type SaveStatus = "saved" | "saving" | "error" | "offline";

interface UseExamAutosaveOptions {
  attemptId: string;
}

export function useExamAutosave({ attemptId }: UseExamAutosaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date());
  const [saveError, setSaveError] = useState<string | null>(null);

  // Monotonic sequence counters per question to prevent out-of-order race conditions
  const seqRef = useRef<Map<string, number>>(new Map());
  // Pending queue for retry when offline
  const retryQueueRef = useRef<Map<string, StudentAnswerState>>(new Map());
  const isOnlineRef = useRef<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  // Network offline / online detection
  useEffect(() => {
    function handleOnline() {
      isOnlineRef.current = true;
      setSaveStatus("saving");
      // Flush retry queue
      flushRetryQueue();
    }

    function handleOffline() {
      isOnlineRef.current = false;
      setSaveStatus("offline");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const flushRetryQueue = async () => {
    if (retryQueueRef.current.size === 0) {
      setSaveStatus("saved");
      return;
    }

    const items = Array.from(retryQueueRef.current.values());
    for (const item of items) {
      await saveAnswer(item);
    }
  };

  const saveAnswer = useCallback(
    async (answer: StudentAnswerState): Promise<boolean> => {
      const qId = answer.questionId;
      const nextSeq = (seqRef.current.get(qId) || 0) + 1;
      seqRef.current.set(qId, nextSeq);

      if (!isOnlineRef.current || (typeof navigator !== "undefined" && !navigator.onLine)) {
        retryQueueRef.current.set(qId, answer);
        setSaveStatus("offline");
        return false;
      }

      setSaveStatus("saving");
      setSaveError(null);

      try {
        const payload = {
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId || null,
          numericalAnswer: answer.numericalAnswer || null,
          isMarkedForReview: answer.markedForReview,
          isVisited: answer.visited,
          timeSpentSeconds: answer.timeSpentSeconds,
        };

        const res = await fetch(`/api/exam/attempts/${attemptId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // Check if a newer request for this question was initiated while this one was in-flight
        if (seqRef.current.get(qId) !== nextSeq) {
          // Superseded by newer request
          return true;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to save answer");
        }

        // Successfully saved
        retryQueueRef.current.delete(qId);
        setSaveStatus("saved");
        setLastSavedAt(new Date());
        return true;
      } catch (err) {
        // Only set error if this was the latest attempt for this question
        if (seqRef.current.get(qId) === nextSeq) {
          retryQueueRef.current.set(qId, answer);
          setSaveStatus("error");
          setSaveError(err instanceof Error ? err.message : "Network error while saving response");
        }
        return false;
      }
    },
    [attemptId]
  );

  return {
    saveStatus,
    lastSavedAt,
    saveError,
    saveAnswer,
    retryFailedSaves: flushRetryQueue,
  };
}
