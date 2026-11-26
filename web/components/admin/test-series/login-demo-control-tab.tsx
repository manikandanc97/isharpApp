"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ExternalLink,
  MonitorCog,
  Settings,
  Users,
} from "lucide-react";
import { LoginDemoControlSkeleton } from "@/components/skeletons/admin/test-series-tab-skeletons";
import type {
  DemoSelectionRules,
  DemoTestConfiguration,
  LanguageMode,
  SubjectMode,
} from "@/components/demo-test/demo-test.types";
import { request } from "@/components/question-bank/helpers";
import { DemoLeadsTab } from "./demo-management/demo-leads-tab";
import { DemoSettingsTab } from "./demo-management/demo-settings-tab";

type SubTab = "leads" | "settings";

const TABS: {
  id: SubTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "leads", label: "Demo Leads", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

interface Props {
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}

export function LoginDemoControlTab({ onNotice, onError }: Props) {
  const [activeTab, setActiveTab] = useState<SubTab>("leads");
  const [config, setConfig] = useState<DemoTestConfiguration | null>(null);
  const [loading, setLoading] = useState(true);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const nextConfig = await request<DemoTestConfiguration>("demo-test");
      setConfig(nextConfig);
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "Failed to load demo test settings",
      );
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadConfig(), 0);
    return () => window.clearTimeout(timer);
  }, [loadConfig]);

  const handleSaveSettings = async (next: {
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
  }) => {
    try {
      const updated = await request<DemoTestConfiguration>("demo-test", {
        method: "PATCH",
        body: JSON.stringify(next),
      });
      setConfig(updated);
      onNotice("Demo test settings saved.");
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Failed to save settings",
      );
      throw error;
    }
  };

  if (loading || !config) return <LoginDemoControlSkeleton />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
            <MonitorCog className="size-5" />
          </span>
          <div>
            <h3 className="font-bold text-slate-950">
              Demo Test &amp; Lead Management
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Manage prospective student leads and basic configuration for the public Demo Test.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/demo-test"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ExternalLink className="size-3.5" /> View Demo Page
          </a>
        </div>
      </section>

      {/* Two-Tab Navigation: Demo Leads & Settings */}
      <nav
        aria-label="Demo Test Management Sections"
        className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                active
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Active Tab Content */}
      {activeTab === "leads" && (
        <DemoLeadsTab onNotice={onNotice} onError={onError} />
      )}
      {activeTab === "settings" && (
        <DemoSettingsTab config={config} onSave={handleSaveSettings} />
      )}
    </div>
  );
}
