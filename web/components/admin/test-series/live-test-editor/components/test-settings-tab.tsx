"use client";

import { Calendar, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EditorFormState } from "../test-editor.types";

interface TestSettingsTabProps {
  form: EditorFormState;
  hasAttempts: boolean;
  effectiveDuration: number;
  effectiveCorrectMarks: number;
  effectiveNegativeMarks: number;
  updateForm: (updater: (prev: EditorFormState) => EditorFormState) => void;
}

export function TestSettingsTab({
  form,
  hasAttempts,
  effectiveDuration,
  effectiveCorrectMarks,
  effectiveNegativeMarks,
  updateForm,
}: TestSettingsTabProps) {
  return (
    <div className="space-y-4">
      {/* Duration */}
      <div className="rounded-xl border border-slate-200 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">Duration</span>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
            <Checkbox
              checked={
                form.examPatternMode === "DEFAULT_NEET" ||
                form.durationMode === "AUTOMATIC"
              }
              disabled={form.examPatternMode === "DEFAULT_NEET" || hasAttempts}
              onCheckedChange={(v) =>
                updateForm((p) => ({
                  ...p,
                  durationMode: Boolean(v) ? "AUTOMATIC" : "MANUAL",
                }))
              }
            />
            Automatically Calculate Duration
          </label>
        </div>
        <div className="relative">
          <Clock className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            type="number"
            min={1}
            value={effectiveDuration}
            readOnly={
              form.examPatternMode === "DEFAULT_NEET" ||
              form.durationMode === "AUTOMATIC" ||
              hasAttempts
            }
            onChange={(e) =>
              updateForm((p) => ({
                ...p,
                manualDuration: Math.max(
                  1,
                  parseInt(e.target.value || "1", 10),
                ),
              }))
            }
            className={`h-8 pl-8 text-xs font-semibold ${
              form.examPatternMode === "DEFAULT_NEET" ||
              form.durationMode === "AUTOMATIC"
                ? "bg-slate-50"
                : "bg-white"
            }`}
          />
        </div>
      </div>

      {/* Marking Scheme */}
      <div className="rounded-xl border border-slate-200 p-3 space-y-3">
        <div className="text-xs font-bold text-slate-900">Marking Scheme</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-[11px]">Correct (+)</Label>
            <Input
              type="number"
              min={1}
              value={effectiveCorrectMarks}
              readOnly={form.examPatternMode === "DEFAULT_NEET" || hasAttempts}
              onChange={(e) =>
                updateForm((p) => ({
                  ...p,
                  correctMarks: Math.max(
                    1,
                    parseInt(e.target.value || "1", 10),
                  ),
                }))
              }
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Incorrect (-)</Label>
            <Input
              type="number"
              min={0}
              value={effectiveNegativeMarks}
              readOnly={
                form.examPatternMode === "DEFAULT_NEET" ||
                !form.hasNegativeMarking ||
                hasAttempts
              }
              onChange={(e) =>
                updateForm((p) => ({
                  ...p,
                  negativeMarks: Math.max(
                    0,
                    parseInt(e.target.value || "0", 10),
                  ),
                }))
              }
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Unanswered</Label>
            <Input value={0} readOnly className="h-8 bg-slate-50 text-xs" />
          </div>
        </div>
        {form.examPatternMode === "MANUAL" && !hasAttempts && (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
            <Checkbox
              checked={form.hasNegativeMarking}
              onCheckedChange={(v) =>
                updateForm((p) => ({
                  ...p,
                  hasNegativeMarking: Boolean(v),
                }))
              }
            />
            Enable negative marking
          </label>
        )}
      </div>

      {/* Exam Delivery & Scheduling */}
      <div className="rounded-xl border border-slate-200 p-3 space-y-3">
        <div className="text-xs font-bold text-slate-900">
          Delivery &amp; Scheduling
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
            <Checkbox
              checked={form.randomizeQuestions}
              disabled={hasAttempts}
              onCheckedChange={(v) =>
                updateForm((p) => ({
                  ...p,
                  randomizeQuestions: Boolean(v),
                }))
              }
            />
            Shuffle question order per student
          </label>

          <div className="flex items-center gap-2">
            <Label className="text-[11px] whitespace-nowrap">
              Max Attempts:
            </Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={form.maxAttempts}
              disabled={hasAttempts}
              onChange={(e) =>
                updateForm((p) => ({
                  ...p,
                  maxAttempts: Math.max(
                    1,
                    parseInt(e.target.value || "1", 10),
                  ),
                }))
              }
              className="h-7 w-16 text-xs"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            updateForm((p) => ({ ...p, showScheduling: !p.showScheduling }))
          }
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:underline"
        >
          <Calendar className="size-3.5" />
          {form.showScheduling
            ? "Hide Availability Window"
            : "Set Optional Availability Window"}
        </button>

        {form.showScheduling && (
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-[10px]">Available From</Label>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) =>
                  updateForm((p) => ({ ...p, scheduledAt: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Available Until</Label>
              <Input
                type="datetime-local"
                value={form.availableUntil}
                onChange={(e) =>
                  updateForm((p) => ({
                    ...p,
                    availableUntil: e.target.value,
                  }))
                }
                className="h-8 text-xs"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
