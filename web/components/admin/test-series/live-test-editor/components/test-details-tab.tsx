"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  ExamPatternConfigResponse,
  SubjectAllocationItem,
  TestSeriesCategory,
} from "../../types";
import type { EditorFormState } from "../test-editor.types";

interface TestDetailsTabProps {
  form: EditorFormState;
  categories: TestSeriesCategory[];
  examConfig: ExamPatternConfigResponse;
  hasAttempts: boolean;
  totalQuestions: number;
  assignedCount: number;
  effectiveDuration: number;
  maxMarks: number;
  effectiveCorrectMarks: number;
  effectiveNegativeMarks: number;
  subjectAllocationTotal: number;
  enabledSubjects: SubjectAllocationItem[];
  updateForm: (updater: (prev: EditorFormState) => EditorFormState) => void;
  onRequestDefaultPattern: () => void;
}

export function TestDetailsTab({
  form,
  categories,
  examConfig,
  hasAttempts,
  totalQuestions,
  assignedCount,
  effectiveDuration,
  maxMarks,
  effectiveCorrectMarks,
  effectiveNegativeMarks,
  subjectAllocationTotal,
  enabledSubjects,
  updateForm,
  onRequestDefaultPattern,
}: TestDetailsTabProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="editor-test-title" className="text-xs">
            Test Name *
          </Label>
          <Input
            id="editor-test-title"
            value={form.title}
            onChange={(e) =>
              updateForm((p) => ({ ...p, title: e.target.value }))
            }
            placeholder="e.g. NEET Full Syllabus Mock Test 01"
            className="h-9 text-xs"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Select
              value={form.categoryId}
              onValueChange={(val) =>
                val && updateForm((p) => ({ ...p, categoryId: val }))
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end pb-1.5">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
              <Checkbox
                checked={form.isActive}
                onCheckedChange={(v) =>
                  updateForm((p) => ({ ...p, isActive: Boolean(v) }))
                }
              />
              Active (Available to students)
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="editor-test-desc" className="text-xs">
            Description (Optional)
          </Label>
          <Textarea
            id="editor-test-desc"
            value={form.description}
            onChange={(e) =>
              updateForm((p) => ({ ...p, description: e.target.value }))
            }
            rows={2}
            placeholder="Syllabus notes or instructions..."
            className="text-xs"
          />
        </div>
      </div>

      {/* Exam Pattern */}
      <div className="rounded-xl border border-slate-200 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-slate-900">Exam Pattern</div>
            <div className="text-[11px] text-slate-500">
              {examConfig.defaultPattern.version}
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-800">
            <Checkbox
              checked={form.examPatternMode === "DEFAULT_NEET"}
              disabled={hasAttempts}
              onCheckedChange={(v) => {
                if (Boolean(v)) onRequestDefaultPattern();
                else
                  updateForm((p) => ({
                    ...p,
                    examPatternMode: "MANUAL",
                  }));
              }}
            />
            Use Default NEET Pattern
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs sm:grid-cols-4">
          <div>
            <div className="text-[10px] text-slate-500">Configured</div>
            <div className="font-bold text-slate-900">{totalQuestions} Qs</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">Assigned</div>
            <div
              className={`font-bold ${
                assignedCount === totalQuestions
                  ? "text-emerald-700"
                  : "text-amber-700"
              }`}
            >
              {assignedCount} Qs
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">Duration</div>
            <div className="font-bold text-slate-900">
              {effectiveDuration} min
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">Max Marks</div>
            <div className="font-bold text-slate-900">
              {maxMarks} (+{effectiveCorrectMarks}/-{effectiveNegativeMarks})
            </div>
          </div>
        </div>

        {/* Subject Distribution Summary */}
        <div>
          <div className="mb-1.5 text-[11px] font-semibold text-slate-600">
            Subject Distribution (Total: {subjectAllocationTotal} Qs)
          </div>
          {enabledSubjects.length === 0 ? (
            <p className="text-[11px] text-amber-700">
              No subjects configured. Open the Subjects &amp; Chapters tab or
              apply the Default NEET Pattern.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {enabledSubjects.map((s) => (
                <span
                  key={s.courseSubjectId}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700"
                >
                  {s.subjectName} – <strong>{s.questionCount}</strong> Qs
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Question Selection Mode */}
      <div className="rounded-xl border border-slate-200 p-3 space-y-2">
        <div className="text-xs font-bold text-slate-900">
          Question Selection Mode
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={hasAttempts}
            onClick={() =>
              updateForm((p) => ({
                ...p,
                questionSelectionMode: "AUTOMATIC",
              }))
            }
            className={`rounded-lg border p-2.5 text-left text-xs transition ${
              form.questionSelectionMode === "AUTOMATIC"
                ? "border-brand-blue bg-blue-50/50 font-semibold text-brand-blue"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Automatic Selection
          </button>
          <button
            type="button"
            disabled={hasAttempts}
            onClick={() =>
              updateForm((p) => ({
                ...p,
                questionSelectionMode: "MANUAL",
              }))
            }
            className={`rounded-lg border p-2.5 text-left text-xs transition ${
              form.questionSelectionMode === "MANUAL"
                ? "border-brand-blue bg-blue-50/50 font-semibold text-brand-blue"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Manual Selection
          </button>
        </div>
      </div>
    </div>
  );
}
