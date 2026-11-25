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
import type {
  DemoSelectionRules,
  DemoTestConfiguration,
  PoolMode,
} from "@/components/demo-test/demo-test.types";

const DEFAULT_RULES: DemoSelectionRules = {
  autoRandomSelection: true,
  visitorRepeatPrevention: true,
  equivalentRepeatPrevention: true,
  globalExposureBalancing: true,
  recentPaperUniqueness: true,
  recentPaperWindow: 25,
  maxPaperOverlapRatio: 0.5,
  shuffleQuestions: true,
  shuffleOptions: true,
  cooldownHours: 24,
  strictNoRepeat: false,
  smartReuseAfterExhaustion: true,
  minUniquePoolSize: 12,
  chapterDiversity: true,
  questionTypeDiversity: true,
  minImageQuestions: 0,
  difficultyDistribution: { EASY: 40, MEDIUM: 40, HARD: 20 },
  weightingMode: "WEIGHTED",
};

interface Props {
  config: DemoTestConfiguration;
  onChange: (next: DemoTestConfiguration) => void;
}

export function DemoRandomizationTab({ config, onChange }: Props) {
  const rules = config.selectionRules ?? DEFAULT_RULES;

  const updateRules = (patch: Partial<DemoSelectionRules>) => {
    onChange({
      ...config,
      selectionRules: { ...rules, ...patch },
    });
  };

  const diffSum =
    rules.difficultyDistribution.EASY +
    rules.difficultyDistribution.MEDIUM +
    rules.difficultyDistribution.HARD;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Pool Mode &amp; Repeat Prevention
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            Control how eligible questions are selected and how repeat exposure is prevented.
          </p>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold text-slate-700">
            Demo Question Pool Mode
          </Label>
          <Select
            value={config.poolMode ?? "HYBRID"}
            onValueChange={(v) => {
              if (v) onChange({ ...config, poolMode: v as PoolMode });
            }}
          >
            <SelectTrigger className="h-9 rounded-xl border-slate-300 bg-white text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HYBRID">
                Hybrid Pool (Recommended) — Approved Pool + Dynamic Generation
              </SelectItem>
              <SelectItem value="MANUAL">
                Manual Pool — Strictly Approved Questions Only
              </SelectItem>
              <SelectItem value="AUTOMATIC">
                Automatic Pool — All Eligible Non-Restricted Questions
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {(
            [
              ["autoRandomSelection", "Automatic random selection"],
              ["visitorRepeatPrevention", "Visitor-level repeat prevention"],
              ["equivalentRepeatPrevention", "Equivalent question prevention"],
              ["globalExposureBalancing", "Global exposure balancing"],
              ["recentPaperUniqueness", "Recent paper uniqueness"],
              ["shuffleQuestions", "Shuffle question order"],
              ["shuffleOptions", "Shuffle option order (safe)"],
              ["chapterDiversity", "Chapter diversity"],
              ["questionTypeDiversity", "Question type diversity"],
              ["strictNoRepeat", "Strict no-repeat mode"],
              ["smartReuseAfterExhaustion", "Smart reuse after exhaustion"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Checkbox
                checked={Boolean(rules[key])}
                onCheckedChange={(v) => updateRules({ [key]: Boolean(v) })}
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Thresholds, Cooldowns &amp; Difficulty Mix
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            Fine-tune overlap limits, cooldown windows, and difficulty distribution.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <Label className="text-xs font-semibold text-slate-700">
              Recent Paper Window
            </Label>
            <Input
              type="number"
              min={1}
              max={200}
              className="h-9 rounded-xl border-slate-300 bg-white text-xs"
              value={rules.recentPaperWindow}
              onChange={(e) =>
                updateRules({ recentPaperWindow: Number(e.target.value) || 25 })
              }
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs font-semibold text-slate-700">
              Max Paper Overlap (0 - 1)
            </Label>
            <Input
              type="number"
              step="0.05"
              min={0}
              max={1}
              className="h-9 rounded-xl border-slate-300 bg-white text-xs"
              value={rules.maxPaperOverlapRatio}
              onChange={(e) =>
                updateRules({
                  maxPaperOverlapRatio: Math.max(
                    0,
                    Math.min(1, Number(e.target.value) || 0.5),
                  ),
                })
              }
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs font-semibold text-slate-700">
              Question Cooldown (Hours)
            </Label>
            <Input
              type="number"
              min={0}
              max={720}
              className="h-9 rounded-xl border-slate-300 bg-white text-xs"
              value={rules.cooldownHours}
              onChange={(e) =>
                updateRules({ cooldownHours: Math.max(0, Number(e.target.value) || 0) })
              }
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs font-semibold text-slate-700">
              Min Unique Pool Requirement
            </Label>
            <Input
              type="number"
              min={1}
              max={1000}
              className="h-9 rounded-xl border-slate-300 bg-white text-xs"
              value={rules.minUniquePoolSize}
              onChange={(e) =>
                updateRules({
                  minUniquePoolSize: Math.max(1, Number(e.target.value) || 12),
                })
              }
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs font-semibold text-slate-700">
              Min Image Questions / Paper
            </Label>
            <Input
              type="number"
              min={0}
              max={50}
              className="h-9 rounded-xl border-slate-300 bg-white text-xs"
              value={rules.minImageQuestions}
              onChange={(e) =>
                updateRules({
                  minImageQuestions: Math.max(0, Number(e.target.value) || 0),
                })
              }
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs font-semibold text-slate-700">
              Mixed Subject Weighting
            </Label>
            <Select
              value={rules.weightingMode}
              onValueChange={(v) => {
                if (v === "WEIGHTED" || v === "EQUAL") {
                  updateRules({ weightingMode: v });
                }
              }}
            >
              <SelectTrigger className="h-9 rounded-xl border-slate-300 bg-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEIGHTED">NEET-Inspired Weighted</SelectItem>
                <SelectItem value="EQUAL">Equal Subject Split</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-700">
              Difficulty Distribution (%)
            </Label>
            <span
              className={`text-xs font-bold ${diffSum === 100 ? "text-emerald-600" : "text-rose-600"}`}
            >
              Total: {diffSum}%
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(["EASY", "MEDIUM", "HARD"] as const).map((level) => (
              <div key={level} className="grid gap-1">
                <Label className="text-3xs text-slate-500">{level}</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  className="h-9 rounded-xl border-slate-300 bg-white text-xs"
                  value={rules.difficultyDistribution[level]}
                  onChange={(e) =>
                    updateRules({
                      difficultyDistribution: {
                        ...rules.difficultyDistribution,
                        [level]: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
