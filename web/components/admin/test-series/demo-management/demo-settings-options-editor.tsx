"use client";

import { CheckCircle2, Clock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CountOptionItem {
  count: number;
  durationMinutes: number;
  label: string;
}

interface DemoSettingsOptionsEditorProps {
  countOptions: CountOptionItem[];
  defaultCount: number;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onUpdateOption: (index: number, patch: Partial<CountOptionItem>) => void;
  onSetDefaultCount: (count: number) => void;
}

export function DemoSettingsOptionsEditor({
  countOptions,
  defaultCount,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  onSetDefaultCount,
}: DemoSettingsOptionsEditorProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <Clock className="size-4" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-slate-950">
              Question Count &amp; Duration Options (Multi-Type)
            </h4>
            <p className="mt-0.5 text-xs text-slate-500">
              Configure multiple test length options for students to choose from
              under &ldquo;Choose Test Duration&rdquo;.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddOption}
          disabled={countOptions.length >= 8}
          className="gap-1.5 rounded-full text-xs font-semibold"
        >
          <Plus className="size-3.5" />
          Add Option
        </Button>
      </div>

      <div className="space-y-3">
        {countOptions.map((opt, idx) => {
          const isDefault = defaultCount === opt.count;
          return (
            <div
              key={idx}
              className={`grid grid-cols-1 gap-3 rounded-xl border p-3.5 sm:grid-cols-12 sm:items-end ${
                isDefault
                  ? "border-indigo-300 bg-indigo-50/40"
                  : "border-slate-200 bg-slate-50/50"
              }`}
            >
              <div className="sm:col-span-4">
                <label className="block text-2xs font-semibold text-slate-600">
                  Option Label
                </label>
                <input
                  type="text"
                  maxLength={60}
                  placeholder={`${opt.count} Questions`}
                  value={opt.label}
                  onChange={(e) =>
                    onUpdateOption(idx, { label: e.target.value })
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-2xs font-semibold text-slate-600">
                  Questions (1–180)
                </label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={opt.count}
                  onChange={(e) =>
                    onUpdateOption(idx, {
                      count: Math.max(
                        1,
                        Math.min(180, Number(e.target.value) || 1),
                      ),
                    })
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-2xs font-semibold text-slate-600">
                  Mins (1–240)
                </label>
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={opt.durationMinutes}
                  onChange={(e) =>
                    onUpdateOption(idx, {
                      durationMinutes: Math.max(
                        1,
                        Math.min(240, Number(e.target.value) || 1),
                      ),
                    })
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2 sm:col-span-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => onSetDefaultCount(opt.count)}
                  className={`inline-flex h-9 items-center gap-1 rounded-lg border px-2.5 text-2xs font-bold transition-colors ${
                    isDefault
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <CheckCircle2 className="size-3.5" />
                  {isDefault ? "Default" : "Set Default"}
                </button>

                <button
                  type="button"
                  onClick={() => onRemoveOption(idx)}
                  disabled={countOptions.length <= 1}
                  title="Remove option"
                  className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
