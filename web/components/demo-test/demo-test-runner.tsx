"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DemoTestHeader } from "./demo-test-header";
import {
  ExitConfirmDialog,
  MobilePaletteDialog,
  SubmitConfirmDialog,
} from "./demo-test-modals";
import { DemoTestPaletteSidebar, type SummaryCounts } from "./demo-test-palette";
import { DemoTestQuestionView } from "./demo-test-question-view";
import type {
  DemoQuestion,
  DemoTestPackage,
  QuestionStatus,
  UserAnswerRecord,
} from "./demo-test.types";
import { useDemoTestTimer } from "./use-demo-test-timer";
import { useFullscreenToggle } from "./use-fullscreen-toggle";

interface DemoTestRunnerProps {
  testPackage: DemoTestPackage;
  initialLanguage?: "en" | "ta";
  onSubmit: (answers: Record<string, UserAnswerRecord>, timeSpentSeconds: number) => void;
  onExit: () => void;
}

export function DemoTestRunner({
  testPackage,
  initialLanguage = "ta",
  onSubmit,
  onExit,
}: DemoTestRunnerProps) {
  const { questions, durationMinutes, remainingSeconds } = testPackage;
  const totalSeconds =
    typeof remainingSeconds === "number" && remainingSeconds > 0
      ? remainingSeconds
      : durationMinutes * 60;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSubject, setActiveSubject] = useState<string>("ALL");
  const [langMode, setLangMode] = useState<"en" | "ta">(initialLanguage);
  const [answers, setAnswers] = useState<Record<string, UserAnswerRecord>>(() => {
    const initial: Record<string, UserAnswerRecord> = {};
    questions.forEach((q, idx) => {
      initial[q.id] = {
        questionId: q.id,
        selectedOptionId: q.savedState?.selectedOptionId ?? undefined,
        markedForReview: Boolean(q.savedState?.isMarkedForReview),
        visited: q.savedState?.isVisited ?? idx === 0,
        timeSpentSeconds: q.savedState?.timeSpentSeconds ?? 0,
      };
    });
    return initial;
  });

  const attemptId = testPackage.attemptId || testPackage.testId;
  const persistAnswer = useCallback(
    (
      questionId: string,
      patch: {
        selectedOptionId?: string | null;
        isMarkedForReview?: boolean;
        isVisited?: boolean;
        timeSpentSeconds?: number;
      },
    ) => {
      if (!attemptId) return;
      void fetch(`/api/demo/attempts/${encodeURIComponent(attemptId)}/answer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, ...patch }),
        keepalive: true,
      }).catch(() => {});
    },
    [attemptId],
  );

  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);

  const { isFullscreen, toggleFullscreen } = useFullscreenToggle();

  // Filtered indices based on subject tab
  const visibleIndices = useMemo(() => {
    if (activeSubject === "ALL") return questions.map((_, i) => i);
    return questions
      .map((q, i) => (q.subjectCode === activeSubject ? i : -1))
      .filter((i) => i !== -1);
  }, [questions, activeSubject]);

  // Current question
  const currentQuestion: DemoQuestion = questions[currentIndex] || questions[0];
  const currentRecord: UserAnswerRecord = answers[currentQuestion.id] || {
    questionId: currentQuestion.id,
    visited: true,
    markedForReview: false,
    timeSpentSeconds: 0,
  };

  const answersRef = useRef(answers);
  const onSubmitRef = useRef(onSubmit);

  useEffect(() => {
    answersRef.current = answers;
    onSubmitRef.current = onSubmit;
  }, [answers, onSubmit]);

  const handleAutoSubmit = useCallback(() => {
    onSubmitRef.current(answersRef.current, totalSeconds);
  }, [totalSeconds]);

  const { secondsRemaining, isLowTime, isSubmittedRef, markSubmitted } = useDemoTestTimer({
    totalSeconds,
    currentQuestionId: currentQuestion.id,
    setAnswers,
    onAutoSubmit: handleAutoSubmit,
  });

  const markVisited = useCallback(
    (targetIndex: number) => {
      const targetQ = questions[targetIndex];
      if (targetQ) {
        setAnswers((prev) => {
          if (prev[targetQ.id]?.visited) return prev;
          return {
            ...prev,
            [targetQ.id]: {
              ...(prev[targetQ.id] || {
                questionId: targetQ.id,
                markedForReview: false,
                timeSpentSeconds: 0,
              }),
              visited: true,
            },
          };
        });
      }
    },
    [questions]
  );

  const handleSelectOption = useCallback(
    (optionId: string) => {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          ...prev[currentQuestion.id],
          selectedOptionId: optionId,
          visited: true,
        },
      }));
      persistAnswer(currentQuestion.id, {
        selectedOptionId: optionId,
        isVisited: true,
      });
    },
    [currentQuestion.id, persistAnswer]
  );

  const handleClearResponse = useCallback(() => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        selectedOptionId: undefined,
      },
    }));
    persistAnswer(currentQuestion.id, { selectedOptionId: null });
  }, [currentQuestion.id, persistAnswer]);

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
    const nextMarked = !answers[currentQuestion.id]?.markedForReview;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        markedForReview: nextMarked,
      },
    }));
    persistAnswer(currentQuestion.id, { isMarkedForReview: nextMarked });
    handleNext();
  }, [answers, currentQuestion.id, handleNext, persistAnswer]);

  const handleJumpTo = useCallback(
    (index: number) => {
      markVisited(index);
      setCurrentIndex(index);
    },
    [markVisited]
  );

  // Keyboard navigation shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isSubmitDialogOpen || isExitDialogOpen) return;
      if (["1", "2", "3", "4"].includes(e.key)) {
        const optIdx = parseInt(e.key, 10) - 1;
        const opt = currentQuestion.options[optIdx];
        if (opt) handleSelectOption(opt.id);
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentQuestion,
    handleNext,
    handlePrev,
    handleSelectOption,
    isExitDialogOpen,
    isSubmitDialogOpen,
  ]);

  const handleConfirmSubmit = () => {
    if (isSubmittedRef.current) return;
    markSubmitted();
    setIsSubmitDialogOpen(false);
    const elapsed = Math.max(0, totalSeconds - secondsRemaining);
    onSubmit(answersRef.current, elapsed);
  };

  // Compute status for palette
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

  // Status counts
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
      <DemoTestHeader
        code={testPackage.code}
        title={testPackage.title}
        secondsRemaining={secondsRemaining}
        isLowTime={isLowTime}
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

        {testPackage.subjects.map((sub) => {
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
        {/* Left: Active Question Card */}
        <DemoTestQuestionView
          currentQuestion={currentQuestion}
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          currentRecord={currentRecord}
          langMode={langMode}
          onSelectOption={handleSelectOption}
          onClearResponse={handleClearResponse}
          onToggleMarkForReview={handleToggleMarkForReview}
          onPrev={handlePrev}
          onNext={handleNext}
        />

        {/* Right: NTA-Standard Question Palette Sidebar */}
        <DemoTestPaletteSidebar
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
        onConfirmSubmit={handleConfirmSubmit}
      />

      {/* 05. EXIT CONFIRMATION DIALOG */}
      <ExitConfirmDialog
        open={isExitDialogOpen}
        onOpenChange={setIsExitDialogOpen}
        onExit={onExit}
      />
    </div>
  );
}
