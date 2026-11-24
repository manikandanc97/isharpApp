"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, LoaderCircle, MonitorCog, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { DemoTestConfiguration, LanguageMode, SubjectMode } from "@/components/demo-test/demo-test.types";
import type { Question } from "@/components/question-bank/types";
import { request } from "@/components/question-bank/helpers";

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

interface Props { onNotice: (message: string) => void; onError: (message: string) => void }

export function LoginDemoControlTab({ onNotice, onError }: Props) {
  const [config, setConfig] = useState<DemoTestConfiguration | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextConfig, nextQuestions] = await Promise.all([
        request<DemoTestConfiguration>("demo-test"),
        request<Question[]>("questions"),
      ]);
      setConfig(nextConfig);
      setSelected(nextConfig.selectedQuestionIds ?? []);
      setQuestions(nextQuestions);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to load login demo controls");
    } finally { setLoading(false); }
  }, [onError]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const visibleQuestions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return questions;
    return questions.filter((question) =>
      [question.externalId, question.textEn, question.textTa, question.courseSubject.subject.name]
        .some((value) => value?.toLowerCase().includes(term)),
    );
  }, [query, questions]);

  const toggleArrayValue = <T extends string>(values: T[], value: T): T[] =>
    values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

  const save = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await request("demo-test", { method: "PATCH", body: JSON.stringify(config) });
      await request("demo-test/questions", {
        method: "PUT",
        body: JSON.stringify({ questionIds: selected }),
      });
      onNotice("Login page demo test controls updated successfully.");
      await load();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to save demo controls");
    } finally { setSaving(false); }
  };

  if (loading || !config) return (
    <div className="grid min-h-80 place-items-center rounded-2xl border border-slate-200 bg-white">
      <LoaderCircle className="size-7 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><MonitorCog className="size-5" /></span>
          <div>
            <h3 className="font-bold text-slate-950">Login Page Demo Test Control</h3>
            <p className="mt-1 text-xs text-slate-500">Controls the subject, language, paper length, timing and question pool shown at /demo-test.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Checkbox checked={config.isEnabled} onCheckedChange={(value) => setConfig({ ...config, isEnabled: Boolean(value) })} />
            Demo enabled
          </label>
          <Button onClick={() => void save()} disabled={saving} className="gap-2 rounded-full bg-brand-red text-white hover:bg-brand-red-hover">
            {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />} Save Demo Control
          </Button>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900">Identity & Instructions</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold text-slate-700">Test title<input className="rounded-lg border border-slate-300 px-3 py-2.5" value={config.title} onChange={(e) => setConfig({ ...config, title: e.target.value })} /></label>
            <label className="grid gap-1.5 text-xs font-semibold text-slate-700">Test code<input className="rounded-lg border border-slate-300 px-3 py-2.5" value={config.code} onChange={(e) => setConfig({ ...config, code: e.target.value })} /></label>
          </div>
          <label className="grid gap-1.5 text-xs font-semibold text-slate-700">English instructions<textarea rows={3} className="rounded-lg border border-slate-300 px-3 py-2.5" value={config.instructionsEn} onChange={(e) => setConfig({ ...config, instructionsEn: e.target.value })} /></label>
          <label className="grid gap-1.5 text-xs font-semibold text-slate-700">Tamil instructions<textarea rows={3} className="rounded-lg border border-slate-300 px-3 py-2.5" value={config.instructionsTa} onChange={(e) => setConfig({ ...config, instructionsTa: e.target.value })} /></label>
        </section>

        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div><h4 className="text-sm font-bold text-slate-900">Lobby Options</h4><p className="mt-1 text-xs text-slate-500">Choose exactly what visitors can select.</p></div>
          <div><p className="mb-2 text-xs font-semibold text-slate-700">Subjects</p><div className="grid grid-cols-2 gap-2">{SUBJECTS.map((item) => <label key={item.code} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 text-xs"><Checkbox checked={config.allowedSubjects.includes(item.code)} onCheckedChange={() => setConfig({ ...config, allowedSubjects: toggleArrayValue(config.allowedSubjects, item.code) })} />{item.label}</label>)}</div></div>
          <div><p className="mb-2 text-xs font-semibold text-slate-700">Languages</p><div className="grid grid-cols-2 gap-2">{LANGUAGES.map((item) => <label key={item.code} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 text-xs"><Checkbox checked={config.allowedLanguages.includes(item.code)} onCheckedChange={() => setConfig({ ...config, allowedLanguages: toggleArrayValue(config.allowedLanguages, item.code) })} />{item.label}</label>)}</div></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold text-slate-700">Default subject<select className="rounded-lg border border-slate-300 px-3 py-2.5" value={config.defaultSubject} onChange={(e) => setConfig({ ...config, defaultSubject: e.target.value as SubjectMode })}>{SUBJECTS.filter((item) => config.allowedSubjects.includes(item.code)).map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
            <label className="grid gap-1.5 text-xs font-semibold text-slate-700">Default language<select className="rounded-lg border border-slate-300 px-3 py-2.5" value={config.defaultLanguage} onChange={(e) => setConfig({ ...config, defaultLanguage: e.target.value as LanguageMode })}>{LANGUAGES.filter((item) => config.allowedLanguages.includes(item.code)).map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between"><div><h4 className="text-sm font-bold text-slate-900">Paper Length & Time</h4><p className="mt-1 text-xs text-slate-500">These cards replace the fixed 6 / 9 / 12 options on the demo lobby.</p></div></div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">{config.countOptions.map((option, index) => <div key={index} className="grid gap-2 rounded-xl border border-slate-200 p-3"><input className="rounded-lg border border-slate-300 px-3 py-2 text-xs" value={option.label} onChange={(e) => { const next = [...config.countOptions]; next[index] = { ...option, label: e.target.value }; setConfig({ ...config, countOptions: next }); }} /><div className="grid grid-cols-2 gap-2"><label className="text-3xs text-slate-500">Questions<input type="number" min={1} max={200} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-xs" value={option.count} onChange={(e) => { const next = [...config.countOptions]; next[index] = { ...option, count: Number(e.target.value) }; setConfig({ ...config, countOptions: next }); }} /></label><label className="text-3xs text-slate-500">Minutes<input type="number" min={1} max={600} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-xs" value={option.durationMinutes} onChange={(e) => { const next = [...config.countOptions]; next[index] = { ...option, durationMinutes: Number(e.target.value) }; setConfig({ ...config, countOptions: next }); }} /></label></div><label className="flex items-center gap-2 text-3xs font-semibold text-slate-600"><input type="radio" name="default-count" checked={config.defaultQuestionCount === option.count} onChange={() => setConfig({ ...config, defaultQuestionCount: option.count })} /> Default option</label></div>)}</div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h4 className="text-sm font-bold text-slate-900">Demo Question Pool</h4><p className="mt-1 text-xs text-slate-500">Selected: {selected.length}. Leave empty to use all active questions.</p></div><label className="relative"><Search className="absolute left-3 top-2.5 size-4 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions" className="rounded-full border border-slate-300 py-2 pl-9 pr-4 text-xs" /></label></div>
        <div className="mt-4 grid max-h-96 gap-2 overflow-y-auto pr-1 md:grid-cols-2">{visibleQuestions.map((question) => { const checked = selected.includes(question.id); return <button type="button" key={question.id} onClick={() => setSelected(toggleArrayValue(selected, question.id))} className={`flex items-start gap-3 rounded-xl border p-3 text-left ${checked ? "border-indigo-300 bg-indigo-50" : "border-slate-200"}`}><span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded ${checked ? "bg-indigo-600 text-white" : "bg-slate-100"}`}>{checked && <Check className="size-3.5" />}</span><span><span className="text-3xs font-bold text-indigo-700">{question.externalId} · {question.courseSubject.subject.name}</span><span className="mt-1 line-clamp-2 block text-xs text-slate-700">{question.textEn || question.textTa}</span></span></button>; })}</div>
      </section>
    </div>
  );
}
