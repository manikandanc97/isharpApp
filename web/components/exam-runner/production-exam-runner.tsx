"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExamHeader } from "./exam-header";
import {
  ExitConfirmDialog,
  MobilePaletteDialog,
  SubmitConfirmDialog,
} from "./exam-modals";
import { ExamPaletteSidebar, type SummaryCounts } from "./exam-palette";
import { ExamQuestionView } from "./exam-question-view";
import type {
  ExamQuestion,
  ExamResultPayload,
  LanguageMode,
  QuestionStatus,
  SanitizedAttemptPayload,
  StudentAnswerState,
} from "./exam.types";
import { useExamAutosave } from "./use-exam-autosave";
import { useExamTimer } from "./use-exam-timer";
import { useFullscreenToggle } from "@/components/demo-test/use-fullscreen-toggle";

interface ProductionExamRunnerProps {
  initialAttempt: SanitizedAttemptPayload;
  onSubmitted: (result: ExamResultPayload) => void;
}

export function ProductionExamRunner({
  initialAttempt,
  onSubmitted,
}: ProductionExamRunnerProps) {
  const router = useRouter();
  const { questions, attemptId, expiresAt, secondsRemaining: initialSeconds } =
    initialAttempt;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSubject, setActiveSubject] = useState<string>("ALL");
  const [langMode, setLangMode] = useState<LanguageMode>("en");

  // Initialize student answers from server-restored savedAnswer state
  const [answers, setAnswers] = useState<Record<string, StudentAnswerState>>(() => {
    const map: Record<string, StudentAnswerState> = {};
    questions.forEach((q, idx) => {
      const saved = q.savedAnswer;
      map[q.id] = {
        questionId: q.id,
        selectedOptionId: saved?.selectedOptionId || undefined,
        numericalAnswer: saved?.numericalAnswer || undefined,
        markedForReview: Boolean(saved?.isMarkedForReview),
        visited: idx === 0 ? true : Boolean(saved?.isVisited),
        timeSpentSeconds: saved?.timeSpentSeconds || 0,
      };
    });
    return map;
  });

  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isFullscreen, toggleFullscreen } = useFullscreenToggle();
  const { saveStatus, saveAnswer } = useExamAutosave({ attemptId });

  // Time tracking per current question
  const currentQuestion: ExamQuestion = questions[currentIndex] || questions[0];
  const currentAnswer: StudentAnswerState = answers[currentQuestion.id] || {
    questionId: currentQuestion.id,
    visited: true,
    markedForReview: false,
    timeSpentSeconds: 0,
  };

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Tick time spent on current question every second
  useEffect(() => {
    const qId = currentQuestion.id;
    const interval = setInterval(() => {
      setAnswers((prev) => {
        const existing = prev[qId];
        if (!existing) return prev;
        return {
          ...prev,
          [qId]: {
            ...existing,
            timeSpentSeconds: (existing.timeSpentSeconds || 0) + 1,
          },
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestion.id]);

  // Handle final submission to server
  const handleFinalSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/exam/attempts/${attemptId}/submit`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit examination");
      }

      setIsSubmitDialogOpen(false);
      onSubmitted(data);
    } catch (err) {
      console.error("Submission error:", err);
      // If error, fetch the result endpoint as attempt might have auto-submitted on server
      try {
        const resultRes = await fetch(`/api/exam/attempts/${attemptId}/result`);
        if (resultRes.ok) {
          const resultData = await resultRes.json();
          onSubmitted(resultData);
          return;
        }
      } catch {
        // Fallback
      }
      setIsSubmitting(false);
    }
  }, [attemptId, isSubmitting, onSubmitted]);

  // Server-synchronized timer
  const { secondsRemaining, isLowTime, markSubmitted } = useExamTimer({
    expiresAt,
    initialSecondsRemaining: initialSeconds,
    onAutoSubmit: () => {
      markSubmitted();
      handleFinalSubmit();
    },
  });

  // Filtered indices by subject
  const visibleIndices = useMemo(() => {
    if (activeSubject === "ALL") return questions.map((_, i) => i);
    return questions
      .map((q, i) => (q.subjectCode === activeSubject ? i : -1))
      .filter((i) => i !== -1);
  }, [questions, activeSubject]);

  // Visited marking with autosave
  const markVisited = useCallback(
    (targetIndex: number) => {
      const targetQ = questions[targetIndex];
      if (!targetQ) return;

      setAnswers((prev) => {
        const existing = prev[targetQ.id];
        if (existing?.visited) return prev;
        const updated = {
          ...(existing || {
            questionId: targetQ.id,
            markedForReview: false,
            timeSpentSeconds: 0,
          }),
          visited: true,
        };
        // Background sync visited status
        saveAnswer(updated);
        return { ...prev, [targetQ.id]: updated };
      });
    },
    [questions, saveAnswer]
  );

  // Option selection with immediate server autosave
  const handleSelectOption = useCallback(
    (optionId: string) => {
      setAnswers((prev) => {
        const existing = prev[currentQuestion.id] || {
          questionId: currentQuestion.id,
          markedForReview: false,
          visited: true,
          timeSpentSeconds: 0,
        };
        const updated: StudentAnswerState = {
          ...existing,
          selectedOptionId: optionId,
          visited: true,
        };
        saveAnswer(updated);
        return { ...prev, [currentQuestion.id]: updated };
      });
    },
    [currentQuestion.id, saveAnswer]
  );

  // Clear response with server autosave
  const handleClearResponse = useCallback(() => {
    setAnswers((prev) => {
      const existing = prev[currentQuestion.id];
      if (!existing) return prev;
      const updated: StudentAnswerState = {
        ...existing,
        selectedOptionId: undefined,
      };
      saveAnswer(updated);
      return { ...prev, [currentQuestion.id]: updated };
    });
  }, [currentQuestion.id, saveAnswer]);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    setCurrentIndex((idx) => {
      const nextIdx = idx > 0 ? idx - 1 : idx;
      markVisited(nextIdx);
      return nextIdx;
    });
  }, [markVisited]);

  const handleNext = useCallback(() => {
    setCurrentIndex((idx) => {
      const nextIdx = idx < questions.length - 1 ? idx + 1 : idx;
      markVisited(nextIdx);
      return nextIdx;
    });
  }, [markVisited, questions.length]);

  const handleToggleMarkForReview = useCallback(() => {
    setAnswers((prev) => {
      const existing = prev[currentQuestion.id] || {
        questionId: currentQuestion.id,
        visited: true,
        timeSpentSeconds: 0,
      };
      const updated: StudentAnswerState = {
        ...existing,
        markedForReview: !existing.markedForReview,
      };
      saveAnswer(updated);
      return { ...prev, [currentQuestion.id]: updated };
    });
    handleNext();
  }, [currentQuestion.id, handleNext, saveAnswer]);

  const handleJumpTo = useCallback(
    (index: number) => {
      markVisited(index);
      setCurrentIndex(index);
    },
    [markVisited]
  );

  // Palette status calculator
  const getQuestionStatus = useCallback(
    (qId: string): QuestionStatus => {
      const rec = answers[qId];
      if (!rec || !rec.visited) return "not_visited";
      const hasAnswer = Boolean(rec.selectedOptionId);
      if (hasAnswer && rec.markedForReview) return "answered_and_marked";
      if (rec.markedForReview) return "marked_for_review";
      if (hasAnswer) return "answered";
      return "unanswered";
    },
    [answers]
  );

  // Summary counts
  const summaryCounts: SummaryCounts = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let marked = 0;
    let answeredAndMarked = 0;
    let notVisited = 0;

    questions.forEach((q) => {
      const st = getQuestionStatus(q.id);
      if (st === "answered") answered++;
      else if (st === "unanswered") notAnswered++;
      else if (st === "marked_for_review") marked++;
      else if (st === "answered_and_marked") answeredAndMarked++;
      else notVisited++;
    });

    return { answered, notAnswered, marked, answeredAndMarked, notVisited };
  }, [getQuestionStatus, questions]);

  const attemptedCount = summaryCounts.answered + summaryCounts.answeredAndMarked;
  const remainingCount = summaryCounts.notAnswered + summaryCounts.notVisited;
  const progressPercent = Math.round((attemptedCount / questions.length) * 100);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 font-sans text-slate-900 select-none overflow-hidden">
      {/* 01. EXAMINATION TOP CONTROL BAR */}
      <ExamHeader
        code={initialAttempt.code}
        title={initialAttempt.title}
        secondsRemaining={secondsRemaining}
        isLowTime={isLowTime}
        saveStatus={saveStatus}
        langMode={langMode}
        onLangChange={setLangMode}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        attemptedCount={attemptedCount}
        totalQuestions={questions.length}
        onOpenMobilePalette={() => setIsMobilePaletteOpen(true)}
        onOpenSubmitDialog={() => setIsSubmitDialogOpen(true)}
        onOpenExitDialog={() => setIsExitDialogOpen(true)}
      />

      {/* 02. SUBJECT SECTION TABS */}
      <div className="flex shrink-0 items-center gap-1.5 border-b border-slate-200 bg-white px-4 py-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveSubject("ALL")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 transition ${
            activeSubject === "ALL"
              ? "bg-brand-blue text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>All Subjects</span>
          <span className="rounded-full bg-slate-700/50 px-1.5 py-0.2 font-mono text-2xs text-white">
            {questions.length}
          </span>
        </button>

        {initialAttempt.subjects.map((sub) => {
          const isSelected = activeSubject === sub.code;
          return (
            <button
              key={sub.code}
              type="button"
              onClick={() => setActiveSubject(sub.code)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 transition ${
                isSelected
                  ? "bg-brand-red text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{sub.name}</span>
              <span className="rounded-full bg-slate-200 px-1.5 py-0.2 font-mono text-2xs">
                {sub.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 03. MAIN BODY: LEFT QUESTION VIEWPORT & RIGHT PALETTE */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ExamQuestionView
          currentQuestion={currentQuestion}
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          currentAnswer={currentAnswer}
          langMode={langMode}
          onSelectOption={handleSelectOption}
          onClearResponse={handleClearResponse}
          onToggleMarkForReview={handleToggleMarkForReview}
          onPrev={handlePrev}
          onNext={handleNext}
        />

        <ExamPaletteSidebar
          questions={questions}
          visibleIndices={visibleIndices}
          currentIndex={currentIndex}
          summaryCounts={summaryCounts}
          attemptedCount={attemptedCount}
          remainingCount={remainingCount}
          progressPercent={progressPercent}
          getQuestionStatus={getQuestionStatus}
          onJumpTo={handleJumpTo}
          onSubmitClick={() => setIsSubmitDialogOpen(true)}
        />
      </div>

      {/* 03b. MOBILE QUESTION PALETTE DIALOG */}
      <MobilePaletteDialog
        open={isMobilePaletteOpen}
        onOpenChange={setIsMobilePaletteOpen}
        questions={questions}
        visibleIndices={visibleIndices}
        currentIndex={currentIndex}
        summaryCounts={summaryCounts}
        attemptedCount={attemptedCount}
        remainingCount={remainingCount}
        progressPercent={progressPercent}
        getQuestionStatus={getQuestionStatus}
        onJumpTo={handleJumpTo}
        onSubmitClick={() => setIsSubmitDialogOpen(true)}
      />

      {/* 04. SUBMIT CONFIRMATION DIALOG */}
      <SubmitConfirmDialog
        open={isSubmitDialogOpen}
        onOpenChange={setIsSubmitDialogOpen}
        answeredCount={attemptedCount}
        unattemptedCount={remainingCount}
        markedCount={summaryCounts.marked}
        secondsRemaining={secondsRemaining}
        isSubmitting={isSubmitting}
        onConfirmSubmit={handleFinalSubmit}
      />

      {/* 05. EXIT CONFIRMATION DIALOG */}
      <ExitConfirmDialog
        open={isExitDialogOpen}
        onOpenChange={setIsExitDialogOpen}
        onExit={() => router.push("/dashboard/student")}
      />
    </div>
  );
}
