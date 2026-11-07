"use client";

import { useState } from "react";
import { Shuffle } from "lucide-react";
import type { MockTest, Question } from "./types";
import { buildBalancedAutoSelection, Field, request } from "./helpers";

export function MockTestsBuilder({
  tests,
  questions,
  selected,
  onSelectionChange,
  onCreated,
  onError,
  onNotice,
}: {
  tests: MockTest[];
  questions: Question[];
  selected: string[];
  onSelectionChange: (value: string[]) => void;
  onCreated: () => Promise<void>;
  onError: (value: string) => void;
  onNotice: (value: string) => void;
}) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [autoCount, setAutoCount] = useState(180);
  const [creating, setCreating] = useState(false);

  const selectedQuestions = questions.filter((question) =>
    selected.includes(question.id),
  );

  const subjectSelection = {
    Physics: selectedQuestions.filter(
      (question) => question.courseSubject.subject.code === "PHYSICS",
    ).length,
    Chemistry: selectedQuestions.filter(
      (question) => question.courseSubject.subject.code === "CHEMISTRY",
    ).length,
    Biology: selectedQuestions.filter(
      (question) => question.courseSubject.subject.code === "BIOLOGY",
    ).length,
  };

  const autoSelect = () => {
    if (!questions.length) {
      onError("Add questions to the Question Bank before auto selection.");
      return;
    }
    const nextSelection = buildBalancedAutoSelection(questions, autoCount);
    onSelectionChange(nextSelection);
    onNotice(
      `${nextSelection.length} questions auto-selected using the NEET subject ratio.`,
    );
  };

  const create = async () => {
    if (!selected.length) {
      onError("Select at least one question for the mock test.");
      return;
    }
    setCreating(true);
    try {
      const test = await request<MockTest>("mock-tests", {
        method: "POST",
        body: JSON.stringify({
          code,
          title,
          durationMinutes: 180,
          totalMarks: 720,
        }),
      });
      if (selected.length) {
        await request(`mock-tests/${test.id}/questions`, {
          method: "POST",
          body: JSON.stringify({
            questions: selected.map((questionId) => ({ questionId })),
          }),
        });
      }
      setCode("");
      setTitle("");
      onNotice(`Mock test created with ${selected.length} selected questions.`);
      await onCreated();
    } catch (cause) {
      onError(
        cause instanceof Error ? cause.message : "Mock test creation failed",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
      <div className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="font-semibold text-slate-950">Build NEET mock test</h3>
        <p className="mt-1 text-xs text-slate-500">
          Automatically choose a balanced set of questions, then create a
          180-minute / 720-mark draft.
        </p>
        <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="Number of questions">
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={autoCount}
                  onChange={(event) =>
                    setAutoCount(
                      Math.min(200, Math.max(1, Number(event.target.value) || 1)),
                    )
                  }
                />
              </Field>
              <button
                type="button"
                onClick={autoSelect}
                disabled={!questions.length}
                className="inline-flex h-[42px] items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Shuffle className="size-4" />
                {selected.length ? "Regenerate selection" : "Select questions"}
              </button>
            </div>
            <p className="mt-2 text-xs leading-4 text-slate-500">
              Uses the NEET ratio: 25% Physics, 25% Chemistry and 50% Biology.
              Up to {Math.min(200, questions.length)} available questions can be
              selected.
            </p>
        </div>

        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-blue">
                {selected.length} questions selected
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {Object.entries(subjectSelection)
                  .map(([subject, count]) => `${subject} ${count}`)
                  .join(" · ")}
              </p>
            </div>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onSelectionChange([])}
                className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-blue hover:bg-blue-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
          <Field label="Test code">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="NEET-FULL-001"
            />
          </Field>
          <Field label="Test title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="NEET Full Syllabus Mock 01"
            />
          </Field>
          <button
            type="button"
            onClick={() => void create()}
            disabled={!code || !title || !selected.length || creating}
            className="w-full rounded-full bg-brand-red px-4 py-3 font-semibold text-white shadow-primary transition hover:bg-brand-red-hover active:scale-95 disabled:opacity-40"
          >
            {creating ? "Creating mock test…" : "Create draft mock test"}
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Assessment drafts
            </p>
            <h3 className="mt-1 text-sm font-semibold text-slate-950">
              Created mock tests
            </h3>
          </div>
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {tests.length} drafts
          </span>
        </div>
        {!tests.length && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs leading-5 text-slate-500">
            No mock tests yet. Select questions and create your first draft.
          </div>
        )}
        {tests.map((test) => (
          <div
            key={test.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-indigo-700">
                  {test.code}
                </div>
                <h4 className="mt-1 font-semibold text-slate-950">
                  {test.title}
                </h4>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                {test.status}
              </span>
            </div>
            <div className="mt-3 flex gap-4 text-xs text-slate-500">
              <span>{test._count.questions} questions</span>
              <span>{test.durationMinutes} min</span>
              <span>{test.totalMarks} marks</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

