"use client";

import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  DemoBlueprint,
  DemoTestConfiguration,
} from "@/components/demo-test/demo-test.types";

const DEFAULT_BLUEPRINTS: DemoBlueprint[] = [
  {
    id: "quick-demo",
    label: "Quick Demo",
    count: 6,
    durationMinutes: 10,
    maxMarks: 24,
    subjectDistribution: { PHYSICS: 2, CHEMISTRY: 1, BIOLOGY: 3 },
  },
  {
    id: "standard-demo",
    label: "Standard Demo",
    count: 9,
    durationMinutes: 15,
    maxMarks: 36,
    subjectDistribution: { PHYSICS: 3, CHEMISTRY: 2, BIOLOGY: 4 },
  },
  {
    id: "extended-demo",
    label: "Extended Demo",
    count: 12,
    durationMinutes: 20,
    maxMarks: 48,
    subjectDistribution: { PHYSICS: 3, CHEMISTRY: 3, BIOLOGY: 6 },
  },
];

interface Props {
  config: DemoTestConfiguration;
  onChange: (next: DemoTestConfiguration) => void;
}

export function DemoBlueprintsTab({ config, onChange }: Props) {
  const blueprints: DemoBlueprint[] =
    config.blueprints && config.blueprints.length > 0
      ? config.blueprints
      : DEFAULT_BLUEPRINTS;

  const updateBlueprint = (index: number, patch: Partial<DemoBlueprint>) => {
    const next = [...blueprints];
    const updated = { ...next[index], ...patch };
    updated.maxMarks = updated.count * 4;
    next[index] = updated;
    onChange({
      ...config,
      blueprints: next,
      countOptions: next.map((bp) => ({
        count: bp.count,
        durationMinutes: bp.durationMinutes,
        label: bp.label,
      })),
    });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Configurable Exam Blueprints
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            Configure paper lengths, exact durations, maximum marks (+4 per question), and subject distribution for All-3-Subjects papers.
          </p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {blueprints.map((bp, index) => {
            const distSum =
              bp.subjectDistribution.PHYSICS +
              bp.subjectDistribution.CHEMISTRY +
              bp.subjectDistribution.BIOLOGY;
            const isValidDist = distSum === bp.count;

            return (
              <div
                key={bp.id || index}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/40 p-4"
              >
                <div className="space-y-3">
                  <div className="grid gap-1">
                    <Label className="text-3xs font-semibold text-slate-600">
                      Blueprint Name
                    </Label>
                    <Input
                      className="h-9 rounded-xl border-slate-300 bg-white text-xs font-semibold"
                      value={bp.label}
                      onChange={(e) =>
                        updateBlueprint(index, { label: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="grid gap-1">
                      <Label className="text-3xs font-medium text-slate-500">
                        Questions
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={200}
                        className="h-9 rounded-xl border-slate-300 bg-white text-xs"
                        value={bp.count}
                        onChange={(e) => {
                          const count = Math.max(1, Number(e.target.value) || 1);
                          updateBlueprint(index, { count });
                        }}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-3xs font-medium text-slate-500">
                        Minutes
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={600}
                        className="h-9 rounded-xl border-slate-300 bg-white text-xs"
                        value={bp.durationMinutes}
                        onChange={(e) =>
                          updateBlueprint(index, {
                            durationMinutes: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-3xs font-medium text-slate-500">
                        Max Marks
                      </Label>
                      <Input
                        readOnly
                        className="h-9 rounded-xl border-slate-200 bg-slate-100 text-xs font-bold text-slate-700"
                        value={bp.count * 4}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-200 pt-2.5">
                    <p className="text-3xs font-bold uppercase tracking-wider text-slate-500">
                      Mixed Subject Split
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["PHYSICS", "CHEMISTRY", "BIOLOGY"] as const).map(
                        (subj) => (
                          <div key={subj} className="grid gap-1">
                            <Label className="text-3xs text-slate-500">
                              {subj.slice(0, 4)}
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              max={200}
                              className="h-8 rounded-lg border-slate-300 bg-white text-xs"
                              value={bp.subjectDistribution[subj]}
                              onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value) || 0);
                                updateBlueprint(index, {
                                  subjectDistribution: {
                                    ...bp.subjectDistribution,
                                    [subj]: val,
                                  },
                                });
                              }}
                            />
                          </div>
                        ),
                      )}
                    </div>
                    {!isValidDist && (
                      <p className="flex items-center gap-1 text-3xs font-semibold text-rose-600">
                        <AlertCircle className="size-3" />
                        Split sums to {distSum} (must equal {bp.count})
                      </p>
                    )}
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2 border-t border-slate-200 pt-2.5 text-xs font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="default-blueprint"
                    className="size-4 cursor-pointer accent-brand-blue"
                    checked={config.defaultQuestionCount === bp.count}
                    onChange={() =>
                      onChange({ ...config, defaultQuestionCount: bp.count })
                    }
                  />
                  Default Blueprint
                </label>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
