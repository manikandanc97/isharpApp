"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExamResultView } from "@/components/exam-runner/exam-result-view";
import { ProductionExamRunner } from "@/components/exam-runner/production-exam-runner";
import type { ExamResultPayload, SanitizedAttemptPayload } from "@/components/exam-runner/exam.types";

export default function ExamAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params?.attemptId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<SanitizedAttemptPayload | null>(null);
  const [result, setResult] = useState<ExamResultPayload | null>(null);

  useEffect(() => {
    if (!attemptId) return;

    let isMounted = true;

    async function loadAttempt() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/exam/attempts/${attemptId}`);
        const data = await res.json();

        if (!isMounted) return;

        if (!res.ok) {
          throw new Error(data.message || "Failed to load examination attempt");
        }

        // Check if the attempt was already submitted / evaluated
        if (data.status === "EVALUATED" || data.status === "SUBMITTED" || data.score !== undefined) {
          // Attempt is evaluated, fetch or use result payload
          const resultRes = await fetch(`/api/exam/attempts/${attemptId}/result`);
          const resultData = await resultRes.json();
          if (isMounted) {
            setResult(resultRes.ok ? resultData : data);
            setLoading(false);
          }
          return;
        }

        // Active IN_PROGRESS attempt
        setAttempt(data);
        setLoading(false);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load examination");
          setLoading(false);
        }
      }
    }

    loadAttempt();

    return () => {
      isMounted = false;
    };
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <Loader2 className="size-8 animate-spin text-brand-red" />
          <h2 className="text-base font-bold text-slate-800">
            Initializing CBT Assessment Engine...
          </h2>
          <p className="text-xs text-slate-500 max-w-xs text-center">
            Synchronizing cryptographic paper mapping, countdown timer, and student security state.
          </p>
        </div>
      </div>
    );
  }

  if (error || (!attempt && !result)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-4">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <div className="grid size-12 place-items-center rounded-full bg-rose-100 text-rose-600">
            <ShieldAlert className="size-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Examination Access Error
            </h2>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              {error || "Unable to access this examination attempt."}
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/student")}
            className="rounded-full bg-brand-red text-xs font-semibold text-white shadow-primary hover:bg-brand-red-hover"
          >
            <ArrowLeft className="mr-1.5 size-3.5" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (result) {
    return <ExamResultView result={result} />;
  }

  if (attempt) {
    return (
      <ProductionExamRunner
        initialAttempt={attempt}
        onSubmitted={(res) => {
          setResult(res);
        }}
      />
    );
  }

  return null;
}
