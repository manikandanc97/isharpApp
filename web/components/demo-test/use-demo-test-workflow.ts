"use client";

import { useCallback, useState } from "react";
import { calculateScorecard } from "./demo-test-calculator";
import type {
  DemoTestPackage,
  LanguageMode,
  ScorecardReport,
  SubjectMode,
  UserAnswerRecord,
} from "./demo-test.types";

export interface CountOption {
  count: number;
  label: string;
  time: string;
  desc: string;
}

export interface UseDemoTestWorkflowOptions {
  initialSubject?: SubjectMode;
  initialLanguage?: LanguageMode;
  initialQuestionCount?: number;
}

export function useDemoTestWorkflow(options: UseDemoTestWorkflowOptions = {}) {
  const {
    initialSubject = "ALL",
    initialLanguage = "ta",
    initialQuestionCount = 9,
  } = options;

  const [phase, setPhase] = useState<"lobby" | "loading" | "runner" | "scorecard">("lobby");
  const [subjectMode, setSubjectMode] = useState<SubjectMode>(initialSubject);
  const [languageMode, setLanguageMode] = useState<LanguageMode>(initialLanguage);
  const [questionCount, setQuestionCount] = useState<number>(initialQuestionCount);
  const [testPackage, setTestPackage] = useState<DemoTestPackage | null>(null);
  const [report, setReport] = useState<ScorecardReport | null>(null);
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, UserAnswerRecord>>({});
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleSubjectChange = useCallback((mode: SubjectMode) => {
    setSubjectMode(mode);
    if (mode === "ALL") {
      setQuestionCount(9);
    } else {
      setQuestionCount(6);
    }
  }, []);

  const loadQuestions = useCallback(async (count: number, subject: SubjectMode) => {
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
  }, []);

  const handleStartExam = useCallback(() => {
    void loadQuestions(questionCount, subjectMode);
  }, [loadQuestions, questionCount, subjectMode]);

  const handleExamSubmit = useCallback(
    (answers: Record<string, UserAnswerRecord>, timeSpentSeconds: number) => {
      if (!testPackage) return;
      const computed = calculateScorecard(testPackage.questions, answers, timeSpentSeconds);
      setSubmittedAnswers(answers);
      setReport(computed);
      setPhase("scorecard");
    },
    [testPackage]
  );

  const handleRetake = useCallback(() => {
    void loadQuestions(questionCount, subjectMode);
  }, [loadQuestions, questionCount, subjectMode]);

  const resetWorkflow = useCallback(() => {
    setPhase("lobby");
    setSubjectMode(initialSubject);
    setReport(null);
    setTestPackage(null);
    setSubmittedAnswers({});
    setErrorMsg("");
  }, [initialSubject]);

  const countOptions: CountOption[] =
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

  return {
    phase,
    setPhase,
    subjectMode,
    setSubjectMode,
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
  };
}
