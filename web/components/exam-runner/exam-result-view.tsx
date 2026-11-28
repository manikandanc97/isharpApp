"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ExamResultPayload } from "./exam.types";
import { ExamResultReviewList } from "./exam-result-review-list";

interface ExamResultViewProps {
  result: ExamResultPayload;
}

export function ExamResultView({ result }: ExamResultViewProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 pb-16 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/student")}
              className="gap-1.5 rounded-full text-xs font-semibold"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Dashboard</span>
            </Button>
            <div className="hidden h-5 w-px bg-slate-200 sm:block" />
            <div>
              <span className="rounded bg-brand-red/10 px-2 py-0.5 font-mono text-3xs font-bold text-brand-red">
                {result.test.code}
              </span>
              <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                {result.test.title} – Performance Report
              </h1>
            </div>
          </div>

          <Badge className="bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
            <ShieldCheck className="mr-1 size-3.5" />
            EVALUATED
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-indigo-50/40 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                  OFFICIAL NEET SCORING
                </span>
                <span className="text-xs text-slate-500">
                  Calculated: {new Date(result.calculatedAt).toLocaleString()}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
                Examination Outcome
              </h2>
              <p className="max-w-xl text-xs text-slate-600 sm:text-sm">
                Performance recorded with server-authoritative marking scheme
                (+4 for correct, -1 for incorrect).
              </p>
            </div>

            <div className="flex items-center gap-4 self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="grid size-16 place-items-center rounded-2xl bg-brand-red/10 text-brand-red">
                <Award className="size-8" />
              </div>
              <div>
                <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">
                  Marks Scored
                </p>
                <p className="font-mono text-3xl font-black text-slate-900">
                  {result.score}{" "}
                  <span className="text-sm font-semibold text-slate-400">
                    / {result.maxMarks}
                  </span>
                </p>
                <p className="mt-0.5 text-xs font-bold text-emerald-600">
                  {Math.round(result.percentage)}% Aggregate Score
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-200/80 pt-6 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-2xs">
              <CheckCircle2 className="mx-auto size-5 text-emerald-600" />
              <p className="mt-1 font-mono text-xl font-bold text-emerald-700">
                {result.correctCount}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Correct Answers
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-2xs">
              <XCircle className="mx-auto size-5 text-rose-600" />
              <p className="mt-1 font-mono text-xl font-bold text-rose-700">
                {result.incorrectCount}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Incorrect Answers
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-2xs">
              <HelpCircle className="mx-auto size-5 text-slate-500" />
              <p className="mt-1 font-mono text-xl font-bold text-slate-700">
                {result.unansweredCount}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Unanswered
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-2xs">
              <TrendingUp className="mx-auto size-5 text-brand-blue" />
              <p className="mt-1 font-mono text-xl font-bold text-brand-blue">
                {Math.round(result.accuracy)}%
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Accuracy Rate
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
            Subject-Wise Score Breakdown
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {result.physicsScore !== undefined && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="text-3xs font-bold uppercase text-blue-600">
                  Physics
                </span>
                <p className="mt-1 font-mono text-xl font-black text-slate-900">
                  {result.physicsScore}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    Marks
                  </span>
                </p>
              </div>
            )}
            {result.chemistryScore !== undefined && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="text-3xs font-bold uppercase text-amber-600">
                  Chemistry
                </span>
                <p className="mt-1 font-mono text-xl font-black text-slate-900">
                  {result.chemistryScore}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    Marks
                  </span>
                </p>
              </div>
            )}
            {result.biologyScore !== undefined && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="text-3xs font-bold uppercase text-emerald-600">
                  Biology
                </span>
                <p className="mt-1 font-mono text-xl font-black text-slate-900">
                  {result.biologyScore}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    Marks
                  </span>
                </p>
              </div>
            )}
          </div>
        </section>

        <ExamResultReviewList
          result={result}
          onBackToDashboard={() => router.push("/dashboard/student")}
        />
      </main>
    </div>
  );
}
