"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Clock,
  Eraser,
  Eye,
  Flag,
  Globe,
  HelpCircle,
  Maximize2,
  Minimize2,
  ShieldAlert,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatTime } from "./demo-test-calculator";
import type {
  DemoOption,
  DemoQuestion,
  DemoTestPackage,
  QuestionStatus,
  UserAnswerRecord,
} from "./demo-test.types";

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
  const { questions, durationMinutes } = testPackage;
  const totalSeconds = durationMinutes * 60;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSubject, setActiveSubject] = useState<string>("ALL");
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [langMode, setLangMode] = useState<"en" | "ta">(initialLanguage);
  const [answers, setAnswers] = useState<Record<string, UserAnswerRecord>>(() => {
    const initial: Record<string, UserAnswerRecord> = {};
    questions.forEach((q, idx) => {
      initial[q.id] = {
        questionId: q.id,
        selectedOptionId: undefined,
        markedForReview: false,
        visited: idx === 0,
        timeSpentSeconds: 0,
      };
    });
    return initial;
  });

  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
  answersRef.current = answers;

  const currentQuestionIdRef = useRef(currentQuestion.id);
  currentQuestionIdRef.current = currentQuestion.id;

  // Mark visited whenever currentIndex changes
  useEffect(() => {
    setAnswers((prev) => {
      const existing = prev[currentQuestion.id];
      if (existing?.visited) return prev;
      return {
        ...prev,
        [currentQuestion.id]: {
          ...(existing || {
            questionId: currentQuestion.id,
            markedForReview: false,
            timeSpentSeconds: 0,
          }),
          visited: true,
        },
      };
    });
  }, [currentIndex, currentQuestion.id]);

  // Timer countdown and reliable question dwell time tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit using current answers snapshot
          onSubmit(answersRef.current, totalSeconds);
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
  }, [totalSeconds, onSubmit]);

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
  });

  const handleSelectOption = (optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        selectedOptionId: optionId,
        visited: true,
      },
    }));
  };

  const handleClearResponse = () => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        selectedOptionId: undefined,
      },
    }));
  };

  const handleToggleMarkForReview = () => {
    setAnswers((prev) => {
      const isMarked = !prev[currentQuestion.id]?.markedForReview;
      return {
        ...prev,
        [currentQuestion.id]: {
          ...prev[currentQuestion.id],
          markedForReview: isMarked,
        },
      };
    });
    handleNext();
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleJumpTo = (index: number) => {
    setCurrentIndex(index);
  };

  const handleConfirmSubmit = () => {
    setIsSubmitDialogOpen(false);
    const elapsed = totalSeconds - secondsRemaining;
    onSubmit(answers, elapsed);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Compute status for palette
  const getQuestionStatus = (qId: string): QuestionStatus => {
    const rec = answers[qId];
    if (!rec || !rec.visited) return "not_visited";
    const hasAnswer = Boolean(rec.selectedOptionId);
    if (hasAnswer && rec.markedForReview) return "answered_and_marked";
    if (rec.markedForReview) return "marked_for_review";
    if (hasAnswer) return "answered";
    return "unanswered";
  };

  // Status counts
  const summaryCounts = useMemo(() => {
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
  }, [answers, questions]);

  const isLowTime = secondsRemaining <= 120; // 2 minutes

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 font-sans text-slate-900 select-none overflow-hidden">
      {/* 01. EXAMINATION TOP CONTROL BAR */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-6 shadow-xs">
        {/* Brand & Test Title */}
        <div className="flex items-center gap-3">
          <span className="flex size-2 rounded-full bg-brand-red animate-pulse" />
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-brand-red/10 px-2 py-0.5 font-mono text-2xs font-extrabold text-brand-red">
              {testPackage.code}
            </span>
            <span className="hidden sm:inline text-xs font-bold text-slate-800">
              {testPackage.title}
            </span>
          </div>
        </div>

        {/* Center Timer Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs sm:text-sm font-bold shadow-2xs transition ${
              isLowTime
                ? "border-rose-400 bg-rose-50 text-rose-700 animate-pulse"
                : "border-slate-300 bg-slate-50 text-slate-800"
            }`}
          >
            <Clock className={`size-3.5 sm:size-4 ${isLowTime ? "text-rose-600" : "text-brand-blue"}`} />
            <span>Time Left: {formatTime(secondsRemaining)}</span>
          </div>
        </div>

        {/* Right Tools & Language & Submit */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="hidden md:inline-flex rounded-full bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLangMode("en")}
              className={`rounded-full px-2.5 py-1 transition ${
                langMode === "en" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              English (Only)
            </button>
            <button
              type="button"
              onClick={() => setLangMode("ta")}
              className={`rounded-full px-2.5 py-1 transition ${
                langMode === "ta" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              தமிழ் + English (Both)
            </button>
          </div>

          {/* Fullscreen Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="hidden sm:inline-flex size-8 p-0 rounded-full border-slate-300 text-slate-600 hover:text-slate-900"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </Button>

          {/* Submit Test Button */}
          <Button
            onClick={() => setIsSubmitDialogOpen(true)}
            className="rounded-full bg-brand-red px-4 py-1.5 text-xs font-bold text-white shadow-primary hover:bg-brand-red-hover"
          >
            Submit Test
          </Button>

          {/* Exit Button */}
          <button
            type="button"
            onClick={() => setIsExitDialogOpen(true)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition"
            title="Exit Test"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      {/* 02. SUBJECT SECTION TABS */}
      <div className="flex shrink-0 items-center gap-1.5 border-b border-slate-200 bg-white px-4 py-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveSubject("ALL")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 transition ${
            activeSubject === "ALL"
              ? "bg-slate-900 text-white shadow-xs"
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
              <span className="rounded-full bg-black/15 px-1.5 py-0.2 font-mono text-2xs">
                {sub.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 03. MAIN BODY: LEFT QUESTION VIEWPORT & RIGHT PALETTE */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Active Question Card */}
        <main className="flex flex-1 flex-col justify-between overflow-y-auto bg-white p-4 sm:p-6 lg:p-8">
          <div className="space-y-4">
            {/* Question Header Meta */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-white">
                  Question {currentIndex + 1}
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {currentQuestion.subject}
                </span>
                {currentQuestion.chapterTitle && (
                  <span className="hidden sm:inline text-xs text-slate-400">
                    • {currentQuestion.chapterTitle}
                  </span>
                )}
                <Badge variant="outline" className="text-2xs font-semibold uppercase bg-slate-50 border-slate-200 text-slate-600">
                  {currentQuestion.difficulty}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-2xs font-semibold">
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200/90 px-2.5 py-0.5 text-slate-700 font-mono text-2xs">
                  <Clock className="size-3 text-brand-blue" />
                  <span>Time on Q: <strong className="text-slate-900">{formatTime(currentRecord.timeSpentSeconds || 0)}</strong></span>
                </span>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700 border border-emerald-200">
                  +{currentQuestion.correctMarks} Marks
                </span>
                <span className="rounded-md bg-rose-50 px-2 py-0.5 text-rose-700 border border-rose-200">
                  -{currentQuestion.negativeMarks} Marks
                </span>
              </div>
            </div>

            {/* Question Stem Text */}
            <div className="space-y-2 text-sm sm:text-base font-medium text-slate-900 leading-relaxed">
              {langMode === "en" ? (
                <p>{currentQuestion.textEn}</p>
              ) : (
                <div className="space-y-1.5">
                  {currentQuestion.textTa && (
                    <p className="text-slate-950 font-sans font-bold text-sm sm:text-base leading-relaxed">
                      {currentQuestion.textTa}
                    </p>
                  )}
                  <p className="text-slate-600 text-xs sm:text-sm border-l-2 border-brand-red/40 pl-2.5 italic">
                    {currentQuestion.textEn}
                  </p>
                </div>
              )}
            </div>

            {/* Options List */}
            <div className="mt-4 space-y-2.5">
              {currentQuestion.options.map((opt, optIdx) => {
                const isSelected = currentRecord.selectedOptionId === opt.id;
                return (
                  <label
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 sm:p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-brand-red bg-rose-50/60 ring-2 ring-brand-red/30 shadow-xs"
                        : "border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="mt-0.5 flex items-center">
                      <span
                        className={`grid size-6 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold transition ${
                          isSelected
                            ? "bg-brand-red text-white shadow-2xs"
                            : "bg-white text-slate-700 border border-slate-300"
                        }`}
                      >
                        {opt.label}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1 text-xs sm:text-sm text-slate-800">
                      {langMode === "en" ? (
                        <p className={isSelected ? "font-semibold text-slate-950" : "font-normal"}>
                          {opt.textEn}
                        </p>
                      ) : (
                        <div className="space-y-0.5">
                          {opt.textTa && (
                            <p className={isSelected ? "font-bold text-slate-950 font-sans" : "font-semibold text-slate-900 font-sans"}>
                              {opt.textTa}
                            </p>
                          )}
                          <p className="text-2xs sm:text-xs text-slate-500 font-sans">
                            {opt.textEn}
                          </p>
                        </div>
                      )}
                    </div>

                    <span className="hidden sm:inline-block text-2xs font-mono text-slate-400 self-center">
                      [Key {optIdx + 1}]
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Control Bar */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearResponse}
                disabled={!currentRecord.selectedOptionId}
                className="rounded-full text-xs font-semibold text-slate-600 border-slate-300 hover:text-rose-600 hover:border-rose-300"
              >
                <Eraser className="size-3.5 mr-1" />
                Clear Response
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleMarkForReview}
                className={`rounded-full text-xs font-semibold ${
                  currentRecord.markedForReview
                    ? "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200"
                    : "text-purple-700 border-purple-200 hover:bg-purple-50"
                }`}
              >
                <Flag className="size-3.5 mr-1" />
                {currentRecord.markedForReview ? "Marked for Review" : "Mark for Review & Next"}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="rounded-full text-xs font-semibold text-slate-700 border-slate-300"
              >
                <ArrowLeft className="size-3.5 mr-1" />
                Previous
              </Button>

              <Button
                size="sm"
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
                className="rounded-full bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Save &amp; Next
                <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </main>

        {/* Right: NTA-Standard Question Palette */}
        <aside className="hidden lg:flex w-72 shrink-0 flex-col border-l border-slate-200 bg-slate-50/70 p-4 justify-between">
          <div className="space-y-4">
            {/* Status Legend */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2">
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                Question Status Palette
              </p>
              <div className="grid grid-cols-2 gap-2 text-2xs font-semibold">
                <div className="flex items-center gap-1.5 text-emerald-800">
                  <span className="size-3 rounded-full bg-emerald-500" />
                  <span>Answered ({summaryCounts.answered})</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-700">
                  <span className="size-3 rounded-full bg-rose-500" />
                  <span>Not Answered ({summaryCounts.notAnswered})</span>
                </div>
                <div className="flex items-center gap-1.5 text-purple-700">
                  <span className="size-3 rounded-full bg-purple-600" />
                  <span>Marked ({summaryCounts.marked})</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="size-3 rounded-full bg-slate-300" />
                  <span>Not Visited ({summaryCounts.notVisited})</span>
                </div>
              </div>
            </div>

            {/* Question Buttons Matrix */}
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Questions ({visibleIndices.length})
              </p>
              <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1">
                {visibleIndices.map((idx) => {
                  const q = questions[idx];
                  const status = getQuestionStatus(q.id);
                  const isCurrent = idx === currentIndex;

                  let btnStyle = "bg-slate-200 text-slate-700 border-slate-300";
                  if (status === "answered") {
                    btnStyle = "bg-emerald-600 text-white border-emerald-700";
                  } else if (status === "marked_for_review") {
                    btnStyle = "bg-purple-600 text-white border-purple-700";
                  } else if (status === "answered_and_marked") {
                    btnStyle = "bg-purple-700 text-white border-purple-800 ring-2 ring-emerald-400";
                  } else if (status === "unanswered") {
                    btnStyle = "bg-rose-500 text-white border-rose-600";
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleJumpTo(idx)}
                      className={`grid size-9 place-items-center rounded-xl font-mono text-xs font-bold border transition ${btnStyle} ${
                        isCurrent ? "ring-2 ring-slate-900 ring-offset-2 scale-105" : "hover:opacity-90"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Submit Block */}
          <div className="border-t border-slate-200 pt-3 space-y-2">
            <div className="text-2xs text-slate-500 flex justify-between">
              <span>Attempted: {summaryCounts.answered + summaryCounts.answeredAndMarked} / {questions.length}</span>
              <span>Remaining: {summaryCounts.notAnswered + summaryCounts.notVisited}</span>
            </div>
            <Button
              onClick={() => setIsSubmitDialogOpen(true)}
              className="w-full rounded-full bg-brand-red py-2 text-xs font-bold text-white shadow-primary hover:bg-brand-red-hover"
            >
              Finish &amp; View Scorecard
            </Button>
          </div>
        </aside>
      </div>

      {/* 04. SUBMIT CONFIRMATION DIALOG */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader className="space-y-2">
            <div className="mx-auto grid size-10 place-items-center rounded-full bg-rose-50 text-brand-red">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-slate-900">
              Submit Demo Test?
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-500">
              Review your attempt status below before final submission.
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
              <span className="text-2xs text-slate-500 uppercase">Answered</span>
              <p className="text-base font-bold text-emerald-700">
                {summaryCounts.answered + summaryCounts.answeredAndMarked}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
              <span className="text-2xs text-slate-500 uppercase">Unattempted</span>
              <p className="text-base font-bold text-rose-600">
                {summaryCounts.notAnswered + summaryCounts.notVisited}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
              <span className="text-2xs text-slate-500 uppercase">Marked for Review</span>
              <p className="text-base font-bold text-purple-700">
                {summaryCounts.marked}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
              <span className="text-2xs text-slate-500 uppercase">Time Remaining</span>
              <p className="text-base font-bold text-brand-blue font-mono">
                {formatTime(secondsRemaining)}
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSubmitDialogOpen(false)}
              className="flex-1 rounded-full text-xs font-semibold"
            >
              Resume Test
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              className="flex-1 rounded-full bg-brand-red text-xs font-bold text-white shadow-primary hover:bg-brand-red-hover"
            >
              Yes, Submit Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 05. EXIT CONFIRMATION DIALOG */}
      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-slate-900">
              Exit Demo Test?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Your ongoing progress will not be graded if you exit without submitting.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsExitDialogOpen(false)}
              className="flex-1 rounded-full text-xs font-semibold"
            >
              Keep Answering
            </Button>
            <Button
              variant="destructive"
              onClick={onExit}
              className="flex-1 rounded-full text-xs font-semibold"
            >
              Exit Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

