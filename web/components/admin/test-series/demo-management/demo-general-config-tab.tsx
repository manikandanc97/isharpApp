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
  DemoTestConfiguration,
  LanguageMode,
  SubjectMode,
} from "@/components/demo-test/demo-test.types";

const SUBJECTS: { code: SubjectMode; label: string }[] = [
  { code: "ALL", label: "All 3 Subjects" },
  { code: "PHYSICS", label: "Physics" },
  { code: "CHEMISTRY", label: "Chemistry" },
  { code: "BIOLOGY", label: "Biology" },
];

const LANGUAGES: { code: LanguageMode; label: string }[] = [
  { code: "en", label: "English Only" },
  { code: "ta", label: "Tamil + English" },
];

const INPUT_CLS =
  "h-9 rounded-xl border-slate-300 bg-white px-3 text-xs text-slate-900 hover:border-slate-400 focus-visible:border-brand-blue focus-visible:ring-brand-blue/15 sm:text-sm";
const TEXTAREA_CLS =
  "rounded-xl border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 hover:border-slate-400 focus-visible:border-brand-blue focus-visible:ring-brand-blue/15 sm:text-sm";

interface Props {
  config: DemoTestConfiguration;
  onChange: (next: DemoTestConfiguration) => void;
}

export function DemoGeneralConfigTab({ config, onChange }: Props) {
  const toggleArrayValue = <T extends string>(values: T[], value: T): T[] =>
    values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">
            Identity &amp; Instructions
          </h4>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
            <Checkbox
              checked={config.isEnabled}
              onCheckedChange={(v) =>
                onChange({ ...config, isEnabled: Boolean(v) })
              }
            />
            Demo Enabled
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="demo-title" className="text-xs font-semibold text-slate-700">
              Test Title
            </Label>
            <Input
              id="demo-title"
              className={INPUT_CLS}
              value={config.title}
              onChange={(e) => onChange({ ...config, title: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="demo-code" className="text-xs font-semibold text-slate-700">
              Test Code
            </Label>
            <Input
              id="demo-code"
              className={INPUT_CLS}
              value={config.code}
              onChange={(e) => onChange({ ...config, code: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="demo-inst-en" className="text-xs font-semibold text-slate-700">
            English Instructions
          </Label>
          <Textarea
            id="demo-inst-en"
            rows={3}
            className={TEXTAREA_CLS}
            value={config.instructionsEn}
            onChange={(e) =>
              onChange({ ...config, instructionsEn: e.target.value })
            }
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="demo-inst-ta" className="text-xs font-semibold text-slate-700">
            Tamil Instructions
          </Label>
          <Textarea
            id="demo-inst-ta"
            rows={3}
            className={TEXTAREA_CLS}
            value={config.instructionsTa}
            onChange={(e) =>
              onChange({ ...config, instructionsTa: e.target.value })
            }
          />
        </div>
      </section>

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Lobby Options &amp; Access Controls
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            Configure allowed subjects, languages, guest access, and post-submission visibility.
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-slate-700">Allowed Subjects</p>
          <div className="grid grid-cols-2 gap-2">
            {SUBJECTS.map((item) => (
              <label
                key={item.code}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-2.5 text-xs transition-colors hover:border-slate-300 hover:bg-slate-50/70"
              >
                <Checkbox
                  checked={config.allowedSubjects.includes(item.code)}
                  onCheckedChange={() => {
                    const nextAllowed = toggleArrayValue(
                      config.allowedSubjects,
                      item.code,
                    );
                    if (!nextAllowed.length) return;
                    const nextDefault = nextAllowed.includes(config.defaultSubject)
                      ? config.defaultSubject
                      : nextAllowed[0];
                    onChange({
                      ...config,
                      allowedSubjects: nextAllowed,
                      defaultSubject: nextDefault,
                    });
                  }}
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-slate-700">Allowed Languages</p>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((item) => (
              <label
                key={item.code}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-2.5 text-xs transition-colors hover:border-slate-300 hover:bg-slate-50/70"
              >
                <Checkbox
                  checked={config.allowedLanguages.includes(item.code)}
                  onCheckedChange={() => {
                    const nextAllowed = toggleArrayValue(
                      config.allowedLanguages,
                      item.code,
                    );
                    if (!nextAllowed.length) return;
                    const nextDefault = nextAllowed.includes(config.defaultLanguage)
                      ? config.defaultLanguage
                      : nextAllowed[0];
                    onChange({
                      ...config,
                      allowedLanguages: nextAllowed,
                      defaultLanguage: nextDefault,
                    });
                  }}
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-slate-700">Default Subject</Label>
            <Select
              value={config.defaultSubject}
              onValueChange={(v) => {
                if (v) onChange({ ...config, defaultSubject: v as SubjectMode });
              }}
            >
              <SelectTrigger className="h-9 rounded-xl border-slate-300 bg-white px-3 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.filter((s) =>
                  config.allowedSubjects.includes(s.code),
                ).map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-slate-700">Default Language</Label>
            <Select
              value={config.defaultLanguage}
              onValueChange={(v) => {
                if (v) onChange({ ...config, defaultLanguage: v as LanguageMode });
              }}
            >
              <SelectTrigger className="h-9 rounded-xl border-slate-300 bg-white px-3 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.filter((l) =>
                  config.allowedLanguages.includes(l.code),
                ).map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2.5 border-t border-slate-100 pt-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
            <Checkbox
              checked={config.guestAccessEnabled !== false}
              onCheckedChange={(v) =>
                onChange({ ...config, guestAccessEnabled: Boolean(v) })
              }
            />
            Allow anonymous guest access
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
            <Checkbox
              checked={config.showResultsImmediately !== false}
              onCheckedChange={(v) =>
                onChange({ ...config, showResultsImmediately: Boolean(v) })
              }
            />
            Show results immediately
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
            <Checkbox
              checked={config.showSolutionsAfterSubmit !== false}
              onCheckedChange={(v) =>
                onChange({ ...config, showSolutionsAfterSubmit: Boolean(v) })
              }
            />
            Show solutions after submission
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
            <Checkbox
              checked={config.admissionCtaEnabled !== false}
              onCheckedChange={(v) =>
                onChange({ ...config, admissionCtaEnabled: Boolean(v) })
              }
            />
            Show admission enquiry CTA
          </label>
        </div>
      </section>
    </div>
  );
}
