"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand-logo";
import { DemoOtpGate } from "./demo-otp-gate";
import { DemoTestLobby } from "./demo-test-lobby";
import { DemoTestRunner } from "./demo-test-runner";
import { DemoTestScorecard } from "./demo-test-scorecard";
import { DemoTestScreenSkeleton } from "@/components/skeletons/demo-test-skeleton";
import type { LanguageMode, SubjectMode } from "./demo-test.types";
import { useDemoTestWorkflow } from "./use-demo-test-workflow";

interface DemoTestScreenProps {
  initialSubject?: SubjectMode;
  initialLanguage?: LanguageMode;
  initialQuestionCount?: number;
}

export function DemoTestScreen({
  initialSubject = "ALL",
  initialLanguage = "ta",
  initialQuestionCount = 9,
}: DemoTestScreenProps) {
  const router = useRouter();

  const {
    phase,
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
    handleOtpVerified,
    handleRetake,
    countOptions,
    estimatedMinutes,
    totalPossibleMarks,
    subjectMeta,
    configuration,
  } = useDemoTestWorkflow({
    initialSubject,
    initialLanguage,
    initialQuestionCount,
  });

  const handleExitToHome = () => {
    router.push("/");
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 font-sans text-slate-900 selection:bg-brand-red selection:text-white antialiased">
      {/* 01. LOADING PHASE */}
      {phase === "loading" && <DemoTestScreenSkeleton />}

      {/* 01b. OTP VERIFICATION GATE */}
      {phase === "otp" && (
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3 shadow-xs">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <BrandLogo priority className="h-8 sm:h-9 w-auto" />
                <span className="hidden sm:block h-5 w-px bg-slate-200" aria-hidden="true" />
                <Badge
                  variant="outline"
                  className="border-rose-200 bg-rose-50 text-brand-red text-2xs font-bold uppercase tracking-wider"
                >
                  Free Demo Test
                </Badge>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back to Login</span>
              </Link>
            </div>
          </header>
          <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
              <DemoOtpGate
                otpStatus={configuration?.otpStatus}
                onVerified={handleOtpVerified}
                onCancel={handleExitToHome}
              />
            </div>
          </main>
        </div>
      )}

      {/* 02. LOBBY PHASE (FULL-SCREEN EXPERIENCE) */}
      {phase === "lobby" && (
        <div className="flex flex-1 flex-col">
          {/* Top Examination Portal Header */}
          <header className="sticky top-0 z-40 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3 shadow-xs">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <BrandLogo priority className="h-8 sm:h-9 w-auto" />
                <span className="hidden sm:block h-5 w-px bg-slate-200" aria-hidden="true" />
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-rose-200 bg-rose-50 text-brand-red text-2xs font-bold uppercase tracking-wider"
                  >
                    Full-Screen CBT Console
                  </Badge>
                  <span className="hidden md:inline text-xs font-semibold text-slate-600">
                    {configuration?.title ?? "Bilingual NEET Entrance Simulation"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Return to Home</span>
                </Link>
              </div>
            </div>
          </header>

          {/* Main Full-Screen Lobby Grid */}
          <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-5 lg:p-6 space-y-4">
            <DemoTestLobby
              variant="screen"
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
              onCancel={handleExitToHome}
              allowedSubjects={configuration?.allowedSubjects}
              allowedLanguages={configuration?.allowedLanguages}
              testCode={configuration?.code}
            />
          </main>
        </div>
      )}

      {/* 03. FULL-SCREEN RUNNER PHASE */}
      {phase === "runner" && testPackage && (
        <DemoTestRunner
          testPackage={testPackage}
          initialLanguage={languageMode}
          onSubmit={handleExamSubmit}
          onExit={handleExitToHome}
        />
      )}

      {/* 04. FULL-SCREEN SCORECARD PHASE */}
      {phase === "scorecard" && report && testPackage && (
        <DemoTestScorecard
          report={report}
          questions={testPackage.questions}
          answers={submittedAnswers}
          initialLanguage={languageMode}
          onRetake={handleRetake}
          onClose={handleExitToHome}
        />
      )}
    </div>
  );
}
