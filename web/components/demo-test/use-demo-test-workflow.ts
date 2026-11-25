"use client";

import { useCallback, useEffect, useState } from "react";
import { calculateScorecard } from "./demo-test-calculator";
import type {
  DemoTestConfiguration,
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
  durationMinutes: number;
}

export interface UseDemoTestWorkflowOptions {
  initialSubject?: SubjectMode;
  initialLanguage?: LanguageMode;
  initialQuestionCount?: number;
}

const ACTIVE_ATTEMPT_KEY = "isharp_active_demo_attempt_id";

const AUTHORITATIVE_DEFAULT_OPTIONS = [
  { count: 6, durationMinutes: 10, label: "Quick Demo" },
  { count: 9, durationMinutes: 15, label: "Standard Demo" },
  { count: 12, durationMinutes: 20, label: "Extended Demo" },
];

export function useDemoTestWorkflow(options: UseDemoTestWorkflowOptions = {}) {
  const {
    initialSubject = "ALL",
    initialLanguage = "ta",
    initialQuestionCount = 9,
  } = options;

  const [phase, setPhase] = useState<
    "lobby" | "loading" | "runner" | "scorecard"
  >("lobby");
  const [subjectMode, setSubjectMode] = useState<SubjectMode>(initialSubject);
  const [languageMode, setLanguageMode] =
    useState<LanguageMode>(initialLanguage);
  const [questionCount, setQuestionCount] =
    useState<number>(initialQuestionCount);
  const [testPackage, setTestPackage] = useState<DemoTestPackage | null>(null);
  const [report, setReport] = useState<ScorecardReport | null>(null);
  const [submittedAnswers, setSubmittedAnswers] = useState<
    Record<string, UserAnswerRecord>
  >({});
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [configuration, setConfiguration] =
    useState<DemoTestConfiguration | null>(null);

  const hydrateAnswersFromPackage = useCallback((pkg: DemoTestPackage) => {
    const map: Record<string, UserAnswerRecord> = {};
    for (const q of pkg.questions) {
      map[q.id] = {
        questionId: q.id,
        selectedOptionId: q.savedState?.selectedOptionId ?? undefined,
        markedForReview: Boolean(q.savedState?.isMarkedForReview),
        visited: Boolean(q.savedState?.isVisited),
        timeSpentSeconds: q.savedState?.timeSpentSeconds ?? 0,
      };
    }
    return map;
  }, []);

  useEffect(() => {
    let active = true;

    const resumeIfPresent = async () => {
      try {
        const storedAttemptId =
          typeof window !== "undefined"
            ? window.sessionStorage.getItem(ACTIVE_ATTEMPT_KEY)
            : null;
        if (storedAttemptId) {
          const res = await fetch(
            `/api/demo/attempts/${encodeURIComponent(storedAttemptId)}`,
            { cache: "no-store" },
          );
          if (res.ok && active) {
            const pkg = (await res.json()) as DemoTestPackage;
            if (pkg.status === "IN_PROGRESS" && (pkg.remainingSeconds ?? 0) > 0) {
              setTestPackage(pkg);
              setPhase("runner");
              return;
            } else if (
              (pkg.status === "SUBMITTED" || pkg.status === "EXPIRED") &&
              pkg.result
            ) {
              setTestPackage(pkg);
              setSubmittedAnswers(hydrateAnswersFromPackage(pkg));
              setReport(pkg.result);
              setPhase("scorecard");
              return;
            }
          }
          if (typeof window !== "undefined") {
            window.sessionStorage.removeItem(ACTIVE_ATTEMPT_KEY);
          }
        }
      } catch {
        // Ignore resume failure and show lobby
      }
    };

    void fetch("/api/demo/config", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<DemoTestConfiguration>;
      })
      .then((config) => {
        if (!active) return;
        setConfiguration(config);
        setSubjectMode(config.defaultSubject);
        setLanguageMode(config.defaultLanguage);
        setQuestionCount(config.defaultQuestionCount);
        if (!config.isEnabled) {
          setErrorMsg("The demo test is currently unavailable.");
        }
      })
      .catch(() => active && setErrorMsg("Demo configuration could not be loaded."));

    void resumeIfPresent();

    return () => {
      active = false;
    };
  }, [hydrateAnswersFromPackage]);

  const handleSubjectChange = useCallback(
    (mode: SubjectMode) => {
      setSubjectMode(mode);
      if (configuration) {
        setQuestionCount(configuration.defaultQuestionCount);
      }
    },
    [configuration],
  );

  const startNewAttempt = useCallback(
    async (count: number, subject: SubjectMode, language: LanguageMode) => {
      setPhase("loading");
      setErrorMsg("");
      try {
        const idempotencyKey =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        const res = await fetch("/api/demo/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject,
            language,
            questionCount: count,
            idempotencyKey,
          }),
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            data?.message || "Failed to start demo test. Please try again.",
          );
        }

        const pkg = data as DemoTestPackage;
        if (typeof window !== "undefined" && (pkg.attemptId || pkg.testId)) {
          window.sessionStorage.setItem(
            ACTIVE_ATTEMPT_KEY,
            pkg.attemptId || pkg.testId,
          );
        }
        setTestPackage(pkg);
        setReport(null);
        setSubmittedAnswers({});
        setPhase("runner");
      } catch (err) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Failed to connect to the test service. Please try again.",
        );
        setPhase("lobby");
      }
    },
    [],
  );

  const handleStartExam = useCallback(() => {
    if (configuration && !configuration.isEnabled) return;
    void startNewAttempt(questionCount, subjectMode, languageMode);
  }, [configuration, startNewAttempt, questionCount, subjectMode, languageMode]);

  const handleExamSubmit = useCallback(
    async (
      answers: Record<string, UserAnswerRecord>,
      timeSpentSeconds: number,
    ) => {
      if (!testPackage) return;
      const attemptId = testPackage.attemptId || testPackage.testId;
      try {
        const res = await fetch(
          `/api/demo/attempts/${encodeURIComponent(attemptId)}/submit`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers }),
            cache: "no-store",
          },
        );
        if (res.ok) {
          const finalized = (await res.json()) as DemoTestPackage;
          setTestPackage(finalized);
          setSubmittedAnswers(answers);
          if (finalized.result) {
            setReport(finalized.result);
          } else {
            setReport(
              calculateScorecard(
                finalized.questions,
                answers,
                timeSpentSeconds,
              ),
            );
          }
          if (typeof window !== "undefined") {
            window.sessionStorage.removeItem(ACTIVE_ATTEMPT_KEY);
          }
          setPhase("scorecard");
          return;
        }
      } catch {
        // Fallback only if network totally fails during submit
      }

      const computed = calculateScorecard(
        testPackage.questions,
        answers,
        timeSpentSeconds,
      );
      setSubmittedAnswers(answers);
      setReport(computed);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(ACTIVE_ATTEMPT_KEY);
      }
      setPhase("scorecard");
    },
    [testPackage],
  );

  const handleRetake = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(ACTIVE_ATTEMPT_KEY);
    }
    void startNewAttempt(questionCount, subjectMode, languageMode);
  }, [startNewAttempt, questionCount, subjectMode, languageMode]);

  const resetWorkflow = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(ACTIVE_ATTEMPT_KEY);
    }
    setPhase("lobby");
    setSubjectMode(configuration?.defaultSubject ?? initialSubject);
    setReport(null);
    setTestPackage(null);
    setSubmittedAnswers({});
    setErrorMsg("");
  }, [configuration?.defaultSubject, initialSubject]);

  const rawOptions =
    configuration?.countOptions?.length
      ? configuration.countOptions
      : AUTHORITATIVE_DEFAULT_OPTIONS;

  const countOptions: CountOption[] = rawOptions.map((option) => ({
    count: option.count,
    label: option.label,
    time: `${option.durationMinutes} Mins`,
    desc: `${option.count} Questions · ${option.durationMinutes} Mins`,
    durationMinutes: option.durationMinutes,
  }));

  // Single authoritative duration lookup — fixes the 15m -> 14m bug!
  const matchedOption =
    rawOptions.find((option) => option.count === questionCount) ??
    rawOptions[0];
  const estimatedMinutes = matchedOption.durationMinutes;
  const totalPossibleMarks = questionCount * 4;

  const subjectMeta = {
    ALL: {
      name: "All 3 Subjects (Physics + Chemistry + Biology)",
      sub: "Balanced NEET Simulation",
    },
    PHYSICS: {
      name: "Physics",
      sub: "Mechanics, Thermodynamics & Optics",
    },
    CHEMISTRY: {
      name: "Chemistry",
      sub: "Physical, Organic & Inorganic",
    },
    BIOLOGY: {
      name: "Biology",
      sub: "Botany & Zoology",
    },
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
    configuration,
  };
}
