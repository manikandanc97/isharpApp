"use client";

import { useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DemoTestLobby } from "./demo-test-lobby";
import { DemoTestRunner } from "./demo-test-runner";
import { DemoTestScorecard } from "./demo-test-scorecard";
import { DemoTestDialogSkeleton } from "@/components/skeletons/demo-test-skeleton";
import { useDemoTestWorkflow } from "./use-demo-test-workflow";

interface DemoTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuestionCount?: number;
}

export function DemoTestDialog({
  open,
  onOpenChange,
  initialQuestionCount = 9,
}: DemoTestDialogProps) {
  const {
    phase,
    setPhase,
    subjectMode,
    languageMode,
    setLanguageMode,
    questionCount,
    setQuestionCount,
    testPackage,
    report,
    submittedAnswers,
    errorMsg,
    handleSubjectChange,
    handleStartExam,
    handleExamSubmit,
    handleRetake,
    resetWorkflow,
    countOptions,
    estimatedMinutes,
    totalPossibleMarks,
    subjectMeta,
  } = useDemoTestWorkflow({
    initialSubject: "ALL",
    initialLanguage: "ta",
    initialQuestionCount,
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      resetWorkflow();
    }, 200);
  };

  useEffect(() => {
    if (open && phase === "scorecard") {
      queueMicrotask(() => setPhase("lobby"));
    }
  }, [open, phase, setPhase]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[94vh] rounded-3xl p-0 overflow-hidden border border-slate-200/90 shadow-2xl bg-white"
      >
        {/* 01. LOADING PHASE */}
        {phase === "loading" && <DemoTestDialogSkeleton />}

        {/* 02. LOBBY / INSTRUCTIONS PHASE */}
        {phase === "lobby" && (
          <div className="flex flex-col h-full max-h-[92vh] overflow-y-auto">
            {/* Header Strip */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sm:px-8 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <span className="flex size-2 rounded-full bg-brand-red animate-pulse" />
                <div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-rose-200 bg-rose-50 text-brand-red text-2xs font-bold uppercase tracking-wider"
                    >
                      Batch 2026 Simulation
                    </Badge>
                    <span className="text-2xs font-semibold text-slate-500">
                      Official Candidate Diagnostic
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight mt-0.5">
                    NEET Diagnostic Demo Assessment
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="grid size-8 place-items-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                title="Close"
              >
                <X className="size-4.5" />
              </button>
            </div>

            <DemoTestLobby
              variant="dialog"
              subjectMode={subjectMode}
              onSubjectChange={handleSubjectChange}
              languageMode={languageMode}
              onLanguageChange={setLanguageMode}
              questionCount={questionCount}
              onQuestionCountChange={setQuestionCount}
              countOptions={countOptions}
              totalPossibleMarks={totalPossibleMarks}
              estimatedMinutes={estimatedMinutes}
              subjectMeta={subjectMeta}
              errorMsg={errorMsg}
              onStartExam={handleStartExam}
              onCancel={handleClose}
            />
          </div>
        )}

        {/* 03. ACTIVE RUNNER PHASE */}
        {phase === "runner" && testPackage && (
          <DemoTestRunner
            testPackage={testPackage}
            initialLanguage={languageMode}
            onSubmit={handleExamSubmit}
            onExit={handleClose}
          />
        )}

        {/* 04. SCORECARD / DIAGNOSTIC REPORT PHASE */}
        {phase === "scorecard" && report && testPackage && (
          <DemoTestScorecard
            report={report}
            questions={testPackage.questions}
            answers={submittedAnswers}
            initialLanguage={languageMode}
            onRetake={handleRetake}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
