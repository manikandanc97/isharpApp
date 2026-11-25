"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ClipboardCheck,
  FileQuestion,
  LoaderCircle,
  Plus,
  RefreshCw,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MockTestsTabSkeleton } from "@/components/skeletons/admin/test-series-tab-skeletons";
import type { Question } from "@/components/question-bank/types";
import { buildBalancedAutoSelection, Field, request } from "@/components/question-bank/helpers";

export interface MockTestItem {
  id: string;
  code: string;
  title: string;
  durationMinutes: number;
  totalMarks: number;
  instructionsEn?: string | null;
  instructionsTa?: string | null;
  createdAt?: string;
  questions?: { questionId: string }[];
  _count?: { questions: number };
}

interface MockTestsTabProps {
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}

export function MockTestsTab({ onNotice, onError }: MockTestsTabProps) {
  const [tests, setTests] = useState<MockTestItem[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [autoCount, setAutoCount] = useState(180);
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [instructionsEn, setInstructionsEn] = useState("");
  const [instructionsTa, setInstructionsTa] = useState("");
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    try {
      const [testData, questionData] = await Promise.all([
        request<MockTestItem[]>("mock-tests"),
        request<Question[]>("questions").catch(() => []),
      ]);
      setTests(testData || []);
      setQuestions(questionData || []);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Failed to load mock tests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onError]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const selectedQuestions = questions.filter((question) =>
    selected.includes(question.id)
  );

  const subjectSelection = {
    Physics: selectedQuestions.filter(
      (question) => question.courseSubject.subject.code === "PHYSICS"
    ).length,
    Chemistry: selectedQuestions.filter(
      (question) => question.courseSubject.subject.code === "CHEMISTRY"
    ).length,
    Biology: selectedQuestions.filter(
      (question) => question.courseSubject.subject.code === "BIOLOGY"
    ).length,
  };

  const autoSelect = () => {
    if (!questions.length) {
      onError("No questions found in repository to auto-select.");
      return;
    }
    const nextSelection = buildBalancedAutoSelection(questions, autoCount);
    setSelected(nextSelection);
    onNotice(`${nextSelection.length} questions auto-selected using NEET subject ratio (25% Phy, 25% Chem, 50% Bio).`);
  };

  const handleCreate = async () => {
    if (!code.trim() || !title.trim()) {
      onError("Please provide test code and title.");
      return;
    }
    if (!selected.length) {
      onError("Select at least one question for the mock test.");
      return;
    }
    setCreating(true);
    try {
      const test = await request<MockTestItem>("mock-tests", {
        method: "POST",
        body: JSON.stringify({
          code: code.trim(),
          title: title.trim(),
          durationMinutes,
          totalMarks: selectedQuestions.reduce(
            (total, question) => total + (question.correctMarks || 4),
            0
          ),
          instructionsEn: instructionsEn.trim(),
          instructionsTa: instructionsTa.trim(),
        }),
      });

      if (selected.length && test?.id) {
        await request(`mock-tests/${test.id}/questions`, {
          method: "POST",
          body: JSON.stringify({
            questions: selected.map((questionId) => ({ questionId })),
          }),
        });
      }

      setCode("");
      setTitle("");
      setInstructionsEn("");
      setInstructionsTa("");
      setSelected([]);
      onNotice(`Mock test created successfully with ${selected.length} questions.`);
      await loadData(true);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Mock test creation failed");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <MockTestsTabSkeleton />;

  return (
    <div className="space-y-6">
      {/* Top action / overview banner */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
            <ClipboardCheck className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-slate-900">{tests.length}</p>
            <p className="text-3xs font-semibold uppercase tracking-wider text-slate-400">
              Mock Test Papers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
            <FileQuestion className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-slate-900">{questions.length}</p>
            <p className="text-3xs font-semibold uppercase tracking-wider text-slate-400">
              Available Question Pool
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <Shuffle className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-slate-900">{selected.length}</p>
            <p className="text-3xs font-semibold uppercase tracking-wider text-slate-400">
              Questions Selected
            </p>
          </div>
        </div>
      </div>

      {/* Builder & Drafts Grid */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(350px,0.8fr)]">
        {/* Left: Quick Mock Test Builder */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-950">Quick NEET Mock Test Builder</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Generate standard 180-min / 720-mark NEET mock papers with balanced subject ratios.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={refreshing || loading}
              onClick={() => void loadData(true)}
              className="gap-1.5 rounded-full"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Auto Selector Section */}
          <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="Number of questions">
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={autoCount}
                  onChange={(e) =>
                    setAutoCount(Math.min(200, Math.max(1, Number(e.target.value) || 1)))
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold"
                />
              </Field>
              <button
                type="button"
                onClick={autoSelect}
                disabled={!questions.length}
                className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-4 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-40"
              >
                <Shuffle className="size-3.5" />
                {selected.length ? "Re-generate Selection" : "Auto-Select Questions"}
              </button>
            </div>
            <p className="mt-2 text-3xs text-slate-500">
              Standard NEET ratio: 25% Physics (45 Qs), 25% Chemistry (45 Qs), 50% Biology (90 Qs).
            </p>
          </div>

          {/* Selection breakdown */}
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-blue-900">
                  {selected.length} questions currently selected
                </p>
                <p className="mt-1 text-3xs font-medium text-blue-700">
                  Physics: {subjectSelection.Physics} · Chemistry: {subjectSelection.Chemistry} · Biology: {subjectSelection.Biology}
                </p>
              </div>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="rounded-full border border-blue-200 bg-white px-3 py-1 text-3xs font-bold text-blue-700 hover:bg-blue-50"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Form fields */}
          <div className="mt-5 space-y-3.5 border-t border-slate-100 pt-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Test Code">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. NEET-MOCK-2026-01"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </Field>
              <Field label="Duration (minutes)">
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={durationMinutes}
                  onChange={(e) =>
                    setDurationMinutes(Math.min(600, Math.max(1, Number(e.target.value) || 1)))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </Field>
            </div>

            <Field label="Test Title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. NEET All India Grand Mock Test 01"
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </Field>

            <Field label="Instructions (English, optional)">
              <textarea
                rows={2}
                value={instructionsEn}
                onChange={(e) => setInstructionsEn(e.target.value)}
                placeholder="Candidate instructions before test initiation"
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </Field>

            <Field label="Instructions (Tamil, optional)">
              <textarea
                rows={2}
                value={instructionsTa}
                onChange={(e) => setInstructionsTa(e.target.value)}
                placeholder="தேர்வுக்கு முந்தைய தமிழ் வழிமுறைகள்"
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </Field>

            <Button
              type="button"
              onClick={() => void handleCreate()}
              disabled={!code.trim() || !title.trim() || !selected.length || creating}
              className="w-full gap-2 rounded-full bg-brand-red py-2.5 text-xs font-semibold text-white shadow-primary hover:bg-brand-red-hover disabled:opacity-40"
            >
              {creating ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  <span>Creating Mock Test…</span>
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  <span>Create Mock Test ({selected.length} Qs)</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right: Existing Mock Test Papers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-950">Mock Test Papers</h3>
              <p className="text-xs text-slate-500">Configured mock test papers</p>
            </div>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {tests.length} tests
            </span>
          </div>

          {tests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <ClipboardCheck className="mx-auto size-8 text-slate-300" />
              <p className="mt-2 text-xs font-semibold text-slate-700">No mock tests created yet</p>
              <p className="mt-1 text-3xs text-slate-400">
                Use the builder on the left to auto-select NEET questions and create mock tests.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
              {tests.map((test) => {
                const questionCount = test.questions?.length ?? test._count?.questions ?? 0;
                return (
                  <div
                    key={test.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-indigo-300"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-3xs font-extrabold text-indigo-700">
                          {test.code}
                        </span>
                      </div>

                      <h4 className="mt-2 text-sm font-bold text-slate-900 leading-snug">
                        {test.title}
                      </h4>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-3xs text-slate-500">
                        <span>{questionCount} Questions</span>
                        <span>·</span>
                        <span>{test.durationMinutes} Mins</span>
                        <span>·</span>
                        <span>{test.totalMarks} Marks</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
