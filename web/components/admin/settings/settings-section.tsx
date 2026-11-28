"use client";

import { useEffect, useState } from "react";
import {
  LoaderCircle,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminWorkspaceContentSkeleton } from "@/components/skeletons/admin-layout-skeleton";

interface SettingsSectionProps {
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}

export function SettingsSection({ onNotice, onError }: SettingsSectionProps) {
  const [form, setForm] = useState({
    institutionName: "I-SHARP Academy",
    tagline: "Premier NEET & Medical Entrance Coaching Centre",
    supportEmail: "support@isharpacademy.in",
    supportPhone: "+91 94440 12345",
    currentAcademicYear: "2026-2027",
    defaultTestDurationMinutes: 180,
    defaultPositiveMarks: 4,
    defaultNegativeMarks: 1,
    passingScorePercentage: 50,
    autoSubmitOnTimeout: true,
    resultReleasePolicy: "SCHEDULED" as "IMMEDIATE" | "SCHEDULED" | "MANUAL",
    bilingualDefault: true,
    allowStudentReviewAfterRelease: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/settings", { cache: "no-store" })
      .then(async (res) => {
        if (active && res.ok) {
          const data = await res.json();
          setForm((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {
        if (active) onError("Failed to load system settings");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      onNotice("System configuration updated successfully");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error saving configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminWorkspaceContentSkeleton section="settings" />;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-3xs font-semibold uppercase tracking-wider text-brand-blue">
            Platform Configuration
          </p>
          <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Settings
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Academy branding, academic year &amp; default test policies.
          </p>
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="gap-2 rounded-full bg-brand-red font-semibold text-white shadow-primary hover:bg-brand-red-hover active:scale-95"
        >
          {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
          <span>Save Settings</span>
        </Button>
      </div>

      {/* Academy Identity & Branding */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          Academy Branding & Contact Details
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Institution Name</Label>
            <Input
              value={form.institutionName}
              onChange={(e) => setForm({ ...form, institutionName: e.target.value })}
              className="h-10 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Current Academic Year</Label>
            <Input
              value={form.currentAcademicYear}
              onChange={(e) => setForm({ ...form, currentAcademicYear: e.target.value })}
              className="h-10 text-xs font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Support Email</Label>
            <Input
              value={form.supportEmail}
              onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
              className="h-10 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Support Phone</Label>
            <Input
              value={form.supportPhone}
              onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
              className="h-10 text-xs"
            />
          </div>
        </div>
      </section>

      {/* CBT Assessment & Examination Defaults */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          CBT Examination Engine & Marking Defaults
        </h3>
        <p className="text-xs text-slate-500">
          These parameters automatically initialize new tests and test series
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Standard Test Duration (Mins)</Label>
            <Input
              type="number"
              value={form.defaultTestDurationMinutes}
              onChange={(e) => setForm({ ...form, defaultTestDurationMinutes: Number(e.target.value) })}
              className="h-10 text-xs font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Correct Answer Marks (+ve)</Label>
            <Input
              type="number"
              value={form.defaultPositiveMarks}
              onChange={(e) => setForm({ ...form, defaultPositiveMarks: Number(e.target.value) })}
              className="h-10 text-xs font-bold text-emerald-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Negative Penalty (-ve)</Label>
            <Input
              type="number"
              value={form.defaultNegativeMarks}
              onChange={(e) => setForm({ ...form, defaultNegativeMarks: Number(e.target.value) })}
              className="h-10 text-xs font-bold text-rose-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Passing Score Cutoff (%)</Label>
            <Input
              type="number"
              value={form.passingScorePercentage}
              onChange={(e) => setForm({ ...form, passingScorePercentage: Number(e.target.value) })}
              className="h-10 text-xs font-bold text-indigo-700"
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          <Label className="text-xs font-semibold text-slate-700">Scorecard & Result Release Policy</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { key: "SCHEDULED", label: "Scheduled Release", desc: "Results released at exam window end time" },
              { key: "IMMEDIATE", label: "Immediate Release", desc: "Student sees scorecard right after submission" },
              { key: "MANUAL", label: "Manual Administrator Release", desc: "Scores held until manual admin verification" },
            ].map((item) => (
              <label
                key={item.key}
                className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition ${
                  form.resultReleasePolicy === item.key ? "border-brand-blue bg-blue-50/50" : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  name="releasePolicy"
                  checked={form.resultReleasePolicy === item.key}
                  onChange={() => setForm({ ...form, resultReleasePolicy: item.key as never })}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">{item.label}</p>
                  <p className="text-3xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Checkbox toggles */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={form.autoSubmitOnTimeout}
              onCheckedChange={(c) => setForm({ ...form, autoSubmitOnTimeout: Boolean(c) })}
            />
            <span className="text-xs font-medium text-slate-800">
              Auto-Submit active examinations immediately when countdown timer expires
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={form.bilingualDefault}
              onCheckedChange={(c) => setForm({ ...form, bilingualDefault: Boolean(c) })}
            />
            <span className="text-xs font-medium text-slate-800">
              Default CBT Question Display to Bilingual Mode (தமிழ் + English side-by-side)
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={form.allowStudentReviewAfterRelease}
              onCheckedChange={(c) => setForm({ ...form, allowStudentReviewAfterRelease: Boolean(c) })}
            />
            <span className="text-xs font-medium text-slate-800">
              Allow students to review question-by-question solutions and explanations once released
            </span>
          </label>
        </div>
      </section>
    </form>
  );
}
