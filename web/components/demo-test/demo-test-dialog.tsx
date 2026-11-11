"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Atom,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Dna,
  FileQuestion,
  FlaskConical,
  Globe,
  Languages,
  Layers,
  Loader2,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { calculateScorecard } from "./demo-test-calculator";
import { DemoTestRunner } from "./demo-test-runner";
import { DemoTestScorecard } from "./demo-test-scorecard";
import type {
  DemoTestPackage,
  LanguageMode,
  ScorecardReport,
  SubjectMode,
  UserAnswerRecord,
} from "./demo-test.types";

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
  const [phase, setPhase] = useState<"lobby" | "loading" | "runner" | "scorecard">("lobby");
  const [subjectMode, setSubjectMode] = useState<SubjectMode>("ALL");
  const [languageMode, setLanguageMode] = useState<LanguageMode>("ta");
  const [questionCount, setQuestionCount] = useState<number>(initialQuestionCount);
  const [testPackage, setTestPackage] = useState<DemoTestPackage | null>(null);
  const [report, setReport] = useState<ScorecardReport | null>(null);
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, UserAnswerRecord>>({});
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Update default question count when switching between mixed and single subject
  const handleSubjectChange = (mode: SubjectMode) => {
    setSubjectMode(mode);
    if (mode === "ALL") {
      setQuestionCount(9);
    } else {
      setQuestionCount(6);
    }
  };

  // Load test questions
  const loadQuestions = async (count: number, subject: SubjectMode) => {
    setPhase("loading");
    setErrorMsg("");
    try {
      const res = await fetch(
        `/api/demo/questions?count=${count}&subject=${encodeURIComponent(subject)}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        throw new Error("Failed to load demo questions.");
      }
      const data: DemoTestPackage = await res.json();
      setTestPackage(data);
      setPhase("runner");
    } catch {
      setErrorMsg("Failed to connect to the test service. Please try again.");
      setPhase("lobby");
    }
  };

  const handleStartExam = () => {
    loadQuestions(questionCount, subjectMode);
  };

  const handleExamSubmit = (
    answers: Record<string, UserAnswerRecord>,
    timeSpentSeconds: number
  ) => {
    if (!testPackage) return;
    const computed = calculateScorecard(testPackage.questions, answers, timeSpentSeconds);
    setSubmittedAnswers(answers);
    setReport(computed);
    setPhase("scorecard");
  };

  const handleRetake = () => {
    loadQuestions(questionCount, subjectMode);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setPhase("lobby");
      setReport(null);
      setTestPackage(null);
    }, 200);
  };

  useEffect(() => {
    if (open && phase === "scorecard") {
      queueMicrotask(() => setPhase("lobby"));
    }
  }, [open, phase]);

  // Question count options based on subject mode
  const countOptions =
    subjectMode === "ALL"
      ? [
          { count: 6, label: "Quick Drill", time: "10 Mins", desc: "2 Qs / subject" },
          { count: 9, label: "Standard NEET", time: "15 Mins", desc: "3 Qs / subject" },
          { count: 12, label: "Deep Mock", time: "20 Mins", desc: "4 Qs / subject" },
        ]
      : [
          { count: 4, label: "Quick Drill", time: "6 Mins", desc: "Rapid concept check" },
          { count: 6, label: "Standard Paper", time: "10 Mins", desc: "Full topic test" },
          { count: 8, label: "Complete Paper", time: "12 Mins", desc: "All 8 questions" },
        ];

  const estimatedMinutes = Math.ceil(questionCount * 1.5);
  const totalPossibleMarks = questionCount * 4;

  const subjectMeta = {
    ALL: { name: "All 3 Subjects (Phy + Chem + Bio)", sub: "Complete Balanced NEET Simulation" },
    PHYSICS: { name: "Physics Drill", sub: "Mechanics, Thermodynamics & Measurements" },
    CHEMISTRY: { name: "Chemistry Drill", sub: "Bonding, Solutions & Chemical Reactions" },
    BIOLOGY: { name: "Biology Drill", sub: "Physiology, Cytology & Living Systems" },
  }[subjectMode];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[94vh] rounded-3xl p-0 overflow-hidden border border-slate-200/90 shadow-2xl bg-white"
      >
        {/* 01. LOADING PHASE */}
        {phase === "loading" && (
          <div className="flex flex-col items-center justify-center p-16 sm:p-24 text-center space-y-4">
            <div className="grid size-14 place-items-center rounded-2xl bg-rose-50 text-brand-red animate-pulse shadow-sm">
              <Loader2 className="size-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Calibrating Your Randomized NEET Test...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                {subjectMode === "ALL"
                  ? "Selecting balanced bilingual questions from Physics, Chemistry, and Biology banks."
                  : `Selecting random authentic ${subjectMode.toLowerCase()} questions with step-by-step solutions.`}
              </p>
            </div>
          </div>
        )}

        {/* 02. LOBBY / INSTRUCTIONS PHASE (ENTERPRISE 2-COLUMN LAYOUT) */}
        {phase === "lobby" && (
          <div className="flex flex-col h-full max-h-[92vh] overflow-y-auto">
            {/* Header Strip */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sm:px-8 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <span className="flex size-2 rounded-full bg-brand-red animate-pulse" />
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-rose-200 bg-rose-50 text-brand-red text-2xs font-bold uppercase tracking-wider">
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

            {errorMsg && (
              <div className="mx-6 mt-4 sm:mx-8 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 2-Column Responsive Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8">
              {/* Left Column: Configuration Controls (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. SUBJECT SELECTION */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Layers className="size-3.5 text-brand-red" />
                      <span>1. Select Subject (பாடத் தேர்வு)</span>
                    </label>
                    <span className="text-2xs font-semibold text-slate-400">Separate or Mixed</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        id: "ALL" as SubjectMode,
                        title: "All 3 Subjects",
                        desc: "Phy + Chem + Bio",
                        icon: Layers,
                        badge: "NEET Mock",
                        color: "text-brand-red",
                      },
                      {
                        id: "PHYSICS" as SubjectMode,
                        title: "Physics Only",
                        desc: "இயற்பியல்",
                        icon: Atom,
                        badge: "Subject Drill",
                        color: "text-blue-600",
                      },
                      {
                        id: "CHEMISTRY" as SubjectMode,
                        title: "Chemistry Only",
                        desc: "வேதியியல்",
                        icon: FlaskConical,
                        badge: "Subject Drill",
                        color: "text-emerald-600",
                      },
                      {
                        id: "BIOLOGY" as SubjectMode,
                        title: "Biology Only",
                        desc: "உயிரியல்",
                        icon: Dna,
                        badge: "Subject Drill",
                        color: "text-purple-600",
                      },
                    ].map((item) => {
                      const isSelected = subjectMode === item.id;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSubjectChange(item.id)}
                          className={`group relative flex flex-col justify-between rounded-2xl border p-3 text-left transition-all duration-150 ${
                            isSelected
                              ? "border-brand-red bg-rose-50/40 ring-2 ring-brand-red/30 shadow-xs"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={`grid size-7 place-items-center rounded-lg ${isSelected ? "bg-brand-red text-white" : "bg-slate-100 text-slate-600"}`}>
                              <Icon className="size-4" />
                            </span>
                            <span className={`text-2xs font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                              isSelected ? "bg-rose-100 text-brand-red" : "bg-slate-100 text-slate-500"
                            }`}>
                              {item.badge}
                            </span>
                          </div>
                          <div className="mt-2.5">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                              {item.title}
                            </p>
                            <p className="text-2xs text-slate-500 font-medium font-sans">
                              {item.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. LANGUAGE PREFERENCE */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Languages className="size-3.5 text-brand-blue" />
                      <span>2. Language Preference (மொழித் தேர்வு)</span>
                    </label>
                    <span className="text-2xs font-semibold text-slate-400">Strictly English vs Dual</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setLanguageMode("en")}
                      className={`flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all ${
                        languageMode === "en"
                          ? "border-brand-red bg-rose-50/40 ring-2 ring-brand-red/30 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="size-4 text-brand-blue" />
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            English Only
                          </span>
                        </div>
                        {languageMode === "en" && <Check className="size-4 text-brand-red" />}
                      </div>
                      <p className="mt-1.5 text-2xs text-slate-500 leading-relaxed">
                        Pure English questions, options, and explanations without Tamil.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLanguageMode("ta")}
                      className={`flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all ${
                        languageMode === "ta"
                          ? "border-brand-red bg-rose-50/40 ring-2 ring-brand-red/30 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Languages className="size-4 text-amber-600" />
                          <span className="font-bold text-xs sm:text-sm text-slate-900 font-sans">
                            தமிழ் + English
                          </span>
                        </div>
                        {languageMode === "ta" && <Check className="size-4 text-brand-red" />}
                      </div>
                      <p className="mt-1.5 text-2xs text-slate-500 leading-relaxed">
                        Bilingual dual view: Tamil translation with English terminology.
                      </p>
                    </button>
                  </div>
                </div>

                {/* 3. QUESTION PAPER LENGTH */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Clock className="size-3.5 text-emerald-600" />
                      <span>3. Paper Length &amp; Time (வினாக்கள் &amp; நேரம்)</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {countOptions.map((item) => {
                      const isChosen = questionCount === item.count;
                      return (
                        <button
                          key={item.count}
                          type="button"
                          onClick={() => setQuestionCount(item.count)}
                          className={`rounded-2xl border p-3 text-left transition-all ${
                            isChosen
                              ? "border-brand-red bg-rose-50/40 ring-2 ring-brand-red/30 shadow-xs"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                          }`}
                        >
                          <div className="flex items-baseline justify-between gap-1">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 whitespace-nowrap">
                              {item.count} Qs
                            </span>
                            <span className="rounded-md bg-rose-100/80 px-1.5 py-0.5 font-mono text-2xs font-extrabold text-brand-red">
                              {item.time}
                            </span>
                          </div>
                          <p className="mt-1 text-2xs text-slate-500 font-medium truncate">{item.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Examination Admit Blueprint & Launch Card (lg:col-span-5) */}
              <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-slate-50/80 p-5 space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4.5 text-brand-red" />
                      <span className="text-xs font-extrabold uppercase tracking-wide text-slate-900">
                        Exam Admit Blueprint
                      </span>
                    </div>
                    <span className="font-mono text-2xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      NEET-DEMO-2026
                    </span>
                  </div>

                  {/* Summary Spec Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <span className="text-2xs font-semibold uppercase text-slate-400">Total Marks</span>
                      <p className="text-lg font-black text-slate-900 mt-0.5">{totalPossibleMarks} Marks</p>
                      <span className="text-2xs text-emerald-600 font-medium">+4 for correct</span>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <span className="text-2xs font-semibold uppercase text-slate-400">Duration</span>
                      <p className="text-lg font-black text-brand-blue mt-0.5">{estimatedMinutes} Mins</p>
                      <span className="text-2xs text-slate-500 font-medium">Timed countdown</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-1">
                    <span className="text-2xs font-semibold uppercase text-slate-400">Configured Format</span>
                    <p className="text-xs font-bold text-slate-900">
                      {subjectMeta.name}
                    </p>
                    <p className="text-2xs text-slate-500">
                      Language: <strong className="text-slate-800">{languageMode === "en" ? "English Only" : "தமிழ் + English Both"}</strong>
                    </p>
                  </div>

                  {/* NTA Rules Pill */}
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 space-y-1 text-2xs text-amber-900">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950">
                      <ShieldAlert className="size-3.5 text-amber-600" />
                      <span>NTA Marking Protocol</span>
                    </div>
                    <ul className="list-inside list-disc space-y-0.5 text-amber-800">
                      <li>+4 Marks awarded for each correct attempt.</li>
                      <li>-1 Mark deducted for wrong attempts.</li>
                      <li>0 Marks for skipped questions.</li>
                    </ul>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2 space-y-2">
                  <Button
                    onClick={handleStartExam}
                    className="w-full rounded-full bg-brand-red hover:bg-brand-red-hover py-3 text-xs sm:text-sm font-bold text-white shadow-primary hover:shadow-primary-hover active:scale-95 transition-all"
                  >
                    <Play className="size-4 mr-2 fill-current" />
                    <span>Start Timed Demo Test Now</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleClose}
                    className="w-full rounded-full text-xs font-semibold text-slate-500 hover:text-slate-900"
                  >
                    Cancel &amp; Return
                  </Button>
                </div>
              </div>
            </div>
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
