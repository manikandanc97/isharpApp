"use client";

import { useMemo, useState } from "react";
import {
  Check,
  LoaderCircle,
  Save,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  DemoSelectionRules,
  DemoTestConfiguration,
  LanguageMode,
  SubjectMode,
} from "@/components/demo-test/demo-test.types";
import {
  DemoSettingsOptionsEditor,
  type CountOptionItem,
} from "./demo-settings-options-editor";

export interface DemoSettingsSavePayload {
  isEnabled: boolean;
  title: string;
  code: string;
  allowedSubjects: SubjectMode[];
  defaultSubject: SubjectMode;
  allowedLanguages: LanguageMode[];
  defaultLanguage: LanguageMode;
  defaultQuestionCount: number;
  defaultDurationMinutes: number;
  countOptions: { count: number; durationMinutes: number; label: string }[];
  selectionRules: DemoSelectionRules;
  guestAccessEnabled: boolean;
  showResultsImmediately: boolean;
  showSolutionsAfterSubmit: boolean;
  admissionCtaEnabled: boolean;
}

interface SettingsBaseline {
  isEnabled: boolean;
  countOptions: CountOptionItem[];
  defaultCount: number;
}

interface Props {
  config: DemoTestConfiguration;
  onSave: (next: DemoSettingsSavePayload) => Promise<void>;
}

const DEFAULT_SELECTION_RULES: DemoSelectionRules = {
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

const PRESET_SUGGESTIONS: CountOptionItem[] = [
  { count: 9, durationMinutes: 20, label: "Quick Sprint" },
  { count: 15, durationMinutes: 20, label: "Standard Demo" },
  { count: 30, durationMinutes: 40, label: "Mini Mock" },
  { count: 45, durationMinutes: 60, label: "Subject Mock" },
  { count: 90, durationMinutes: 90, label: "Half NEET" },
];

function normalizeCountOptions(
  config: DemoTestConfiguration,
): CountOptionItem[] {
  if (config.countOptions?.length) {
    return config.countOptions.map((o) => ({
      count: o.count,
      durationMinutes: o.durationMinutes,
      label: o.label || `${o.count} Questions`,
    }));
  }
  const fallbackCount = config.defaultQuestionCount || 15;
  return [
    {
      count: fallbackCount,
      durationMinutes: config.defaultDurationMinutes || 20,
      label: `${fallbackCount} Questions`,
    },
  ];
}

export function DemoSettingsTab({ config, onSave }: Props) {
  const initialOptions = useMemo(() => normalizeCountOptions(config), [config]);
  const initialDefaultCount =
    config.defaultQuestionCount || initialOptions[0]?.count || 15;

  const [baseline, setBaseline] = useState<SettingsBaseline>(() => ({
    isEnabled: config.isEnabled,
    countOptions: initialOptions,
    defaultCount: initialDefaultCount,
  }));

  const [isEnabled, setIsEnabled] = useState(config.isEnabled);
  const [countOptions, setCountOptions] =
    useState<CountOptionItem[]>(initialOptions);
  const [defaultCount, setDefaultCount] = useState<number>(initialDefaultCount);

  const [validationError, setValidationError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const isDirty = useMemo(() => {
    if (isEnabled !== baseline.isEnabled) return true;
    if (defaultCount !== baseline.defaultCount) return true;
    if (countOptions.length !== baseline.countOptions.length) return true;

    return countOptions.some((opt, idx) => {
      const base = baseline.countOptions[idx];
      if (!base) return true;
      return (
        opt.count !== base.count ||
        opt.durationMinutes !== base.durationMinutes ||
        opt.label !== base.label
      );
    });
  }, [isEnabled, defaultCount, countOptions, baseline]);

  const clearSavedNotice = () => {
    if (savedNotice) setSavedNotice(false);
  };

  const handleAddOption = () => {
    if (countOptions.length >= 8) return;
    clearSavedNotice();
    const usedCounts = new Set(countOptions.map((o) => o.count));
    const suggested = PRESET_SUGGESTIONS.find(
      (p) => !usedCounts.has(p.count),
    ) ?? {
      count: Math.min(
        180,
        (countOptions[countOptions.length - 1]?.count || 15) + 15,
      ),
      durationMinutes: Math.min(
        240,
        (countOptions[countOptions.length - 1]?.durationMinutes || 20) + 15,
      ),
      label: "Custom Pack",
    };

    let nextCount = suggested.count;
    while (usedCounts.has(nextCount) && nextCount < 180) {
      nextCount += 1;
    }

    setCountOptions((prev) => [
      ...prev,
      {
        count: nextCount,
        durationMinutes: suggested.durationMinutes,
        label: suggested.label,
      },
    ]);
  };

  const handleRemoveOption = (index: number) => {
    if (countOptions.length <= 1) return;
    clearSavedNotice();
    const removed = countOptions[index];
    const next = countOptions.filter((_, idx) => idx !== index);
    setCountOptions(next);
    if (defaultCount === removed.count) {
      setDefaultCount(next[0].count);
    }
  };

  const updateOption = (index: number, patch: Partial<CountOptionItem>) => {
    clearSavedNotice();
    setCountOptions((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, ...patch };
        if (patch.count !== undefined && defaultCount === item.count) {
          setDefaultCount(patch.count);
        }
        return updated;
      }),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty || saving) return;

    setValidationError("");
    setSavedNotice(false);

    const seenCounts = new Set<number>();
    for (const opt of countOptions) {
      if (opt.count < 1 || opt.count > 180) {
        setValidationError(
          "Question count in each option must be between 1 and 180.",
        );
        return;
      }
      if (opt.durationMinutes < 1 || opt.durationMinutes > 240) {
        setValidationError(
          "Duration in each option must be between 1 and 240 minutes.",
        );
        return;
      }
      if (seenCounts.has(opt.count)) {
        setValidationError(
          `Duplicate question count (${opt.count} Qs). Each option must have a unique question count.`,
        );
        return;
      }
      seenCounts.add(opt.count);
    }

    const normalizedOptions = countOptions.map((o) => ({
      count: o.count,
      durationMinutes: o.durationMinutes,
      label: o.label.trim() || `${o.count} Questions`,
    }));

    const defaultOpt =
      normalizedOptions.find((o) => o.count === defaultCount) ??
      normalizedOptions[0];

    const filteredSubjects = config.allowedSubjects.filter(
      (s): s is "PHYSICS" | "CHEMISTRY" | "BIOLOGY" =>
        s === "PHYSICS" || s === "CHEMISTRY" || s === "BIOLOGY",
    );
    const allowedSubjects: SubjectMode[] = filteredSubjects.length
      ? filteredSubjects
      : ["PHYSICS", "CHEMISTRY", "BIOLOGY"];
    const allowedLanguages: LanguageMode[] = config.allowedLanguages?.length
      ? config.allowedLanguages
      : ["en", "ta"];

    setSaving(true);
    try {
      await onSave({
        isEnabled,
        title: config.title?.trim() || "NEET Bilingual Diagnostic Demo Test",
        code: config.code?.trim() || "NEET-DEMO-2026",
        allowedSubjects,
        defaultSubject: config.defaultSubject || "ALL",
        allowedLanguages,
        defaultLanguage: config.defaultLanguage || "ta",
        defaultQuestionCount: defaultOpt.count,
        defaultDurationMinutes: defaultOpt.durationMinutes,
        countOptions: normalizedOptions,
        selectionRules: {
          ...DEFAULT_SELECTION_RULES,
          ...(config.selectionRules ?? {}),
        },
        guestAccessEnabled: config.guestAccessEnabled ?? true,
        showResultsImmediately: config.showResultsImmediately ?? true,
        showSolutionsAfterSubmit: config.showSolutionsAfterSubmit ?? true,
        admissionCtaEnabled: config.admissionCtaEnabled ?? true,
      });

      setCountOptions(normalizedOptions);
      setDefaultCount(defaultOpt.count);
      setBaseline({
        isEnabled,
        countOptions: normalizedOptions,
        defaultCount: defaultOpt.count,
      });
      setSavedNotice(true);
    } catch {
      // Error notice is handled by parent onError
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="w-full space-y-5">
      {validationError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          {validationError}
        </div>
      )}

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <SlidersHorizontal className="size-4" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-slate-950">
              Demo Test Availability
            </h4>
            <p className="mt-0.5 text-xs text-slate-500">
              Control whether prospective students can access the public Demo
              Test.
            </p>
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:bg-slate-50">
          <div>
            <p className="text-xs font-bold text-slate-900">
              Enable Public Demo Test
            </p>
            <p className="mt-0.5 text-2xs text-slate-500">
              Allow prospective students to verify their mobile number and
              attend the demo test.
            </p>
          </div>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => {
              clearSavedNotice();
              setIsEnabled(e.target.checked);
            }}
            className="size-4 rounded border-slate-300 text-brand-red focus:ring-brand-red"
          />
        </label>
      </section>

      <DemoSettingsOptionsEditor
        countOptions={countOptions}
        defaultCount={defaultCount}
        onAddOption={handleAddOption}
        onRemoveOption={handleRemoveOption}
        onUpdateOption={updateOption}
        onSetDefaultCount={(count) => {
          clearSavedNotice();
          setDefaultCount(count);
        }}
      />

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-brand-red">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-950">
              Randomization &amp; Non-Repeat Engine Active
            </h4>
            <p className="mt-0.5 text-2xs text-slate-500">
              Questions &amp; options are automatically shuffled per attempt,
              repeat questions are prevented per visitor, and all 3 subjects
              follow NEET-weighted distribution.
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-2xs font-semibold text-emerald-700 sm:self-center">
          <Check className="size-3" />
          Auto-Managed
        </span>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          {savedNotice && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/90 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-2xs">
              <Check className="size-4 text-emerald-600" />
              <span>Settings saved successfully.</span>
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={!isDirty || saving}
          className="gap-2 rounded-full bg-brand-red px-6 text-xs font-bold text-white hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
