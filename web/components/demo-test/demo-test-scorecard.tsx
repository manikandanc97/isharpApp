"use client";

import type { DemoQuestion, ScorecardReport, UserAnswerRecord } from "./demo-test.types";
import { ScorecardCtaCard } from "./scorecard-cta-card";
import { ScorecardQuestionReview } from "./scorecard-question-review";
import { ScorecardSubjectGrid } from "./scorecard-subject-grid";
import { ScorecardSummaryCard } from "./scorecard-summary-card";

interface DemoTestScorecardProps {
  report: ScorecardReport;
  questions: DemoQuestion[];
  answers: Record<string, UserAnswerRecord>;
  initialLanguage?: "en" | "ta";
  onRetake: () => void;
  onClose: () => void;
}

export function getRankCategory(pct: number) {
  if (pct >= 85)
    return {
      label: "Strong Demo Performance — Keep Practicing Full-Length Papers",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  if (pct >= 65)
    return {
      label: "Good Concept Accuracy — Continue Daily Practice",
      color: "text-blue-700 bg-blue-50 border-blue-200",
    };
  if (pct >= 40)
    return {
      label: "Developing Foundation — Review Solutions Below",
      color: "text-amber-700 bg-amber-50 border-amber-200",
    };
  return {
    label: "Early Stage Practice — Strengthen Core Concepts",
    color: "text-rose-700 bg-rose-50 border-rose-200",
  };
}

export function DemoTestScorecard({
  report,
  questions,
  answers,
  initialLanguage = "ta",
  onRetake,
  onClose,
}: DemoTestScorecardProps) {
  const rankInfo = getRankCategory(report.percentage);

  return (
    <div className="flex flex-col min-h-screen w-full overflow-y-auto bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      {/* 01. TOP HEADER BANNER & SCORE METRICS */}
      <ScorecardSummaryCard
        report={report}
        rankInfo={rankInfo}
        onRetake={onRetake}
        onClose={onClose}
      />

      {/* 02. SUBJECT-WISE BREAKDOWN & TIME ANALYTICS */}
      <ScorecardSubjectGrid report={report} />

      {/* 03. CONVERSION / REGISTRATION CTA CARD */}
      <ScorecardCtaCard />

      {/* 04. DETAILED SOLUTIONS & EXPLANATIONS REVIEW */}
      <ScorecardQuestionReview
        questions={questions}
        answers={answers}
        report={report}
        initialLanguage={initialLanguage}
      />
    </div>
  );
}
