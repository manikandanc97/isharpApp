"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Database,
  ExternalLink,
  LayoutDashboard,
  LoaderCircle,
  MonitorCog,
  Save,
  Settings,
  Shuffle,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginDemoControlSkeleton } from "@/components/skeletons/admin/test-series-tab-skeletons";
import type { DemoTestConfiguration } from "@/components/demo-test/demo-test.types";
import { request } from "@/components/question-bank/helpers";
import type {
  DemoAnalyticsData,
  DemoPoolHealth,
} from "./demo-management/demo-admin.types";
import { DemoOverviewTab } from "./demo-management/demo-overview-tab";
import { DemoGeneralConfigTab } from "./demo-management/demo-general-config-tab";
import { DemoQuestionPoolTab } from "./demo-management/demo-question-pool-tab";
import { DemoBlueprintsTab } from "./demo-management/demo-blueprints-tab";
import { DemoRandomizationTab } from "./demo-management/demo-randomization-tab";
import { DemoAnalyticsTab } from "./demo-management/demo-analytics-tab";

type SubTab =
  | "overview"
  | "general"
  | "pool"
  | "blueprints"
  | "randomization"
  | "analytics";

const TABS: {
  id: SubTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "general", label: "General Config", icon: Settings },
  { id: "pool", label: "Question Pool", icon: Database },
  { id: "blueprints", label: "Exam Blueprints", icon: Sliders },
  { id: "randomization", label: "Randomization Rules", icon: Shuffle },
  { id: "analytics", label: "Demo Analytics", icon: BarChart3 },
];

interface Props {
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}

export function LoginDemoControlTab({ onNotice, onError }: Props) {
  const [activeTab, setActiveTab] = useState<SubTab>("overview");
  const [config, setConfig] = useState<DemoTestConfiguration | null>(null);
  const [health, setHealth] = useState<DemoPoolHealth | null>(null);
  const [analytics, setAnalytics] = useState<DemoAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextConfig, nextHealth, nextAnalytics] = await Promise.all([
        request<DemoTestConfiguration>("demo-test"),
        request<DemoPoolHealth>("demo-test/health").catch(() => null),
        request<DemoAnalyticsData>("demo-test/analytics").catch(() => null),
      ]);
      setConfig(nextConfig);
      setHealth(nextHealth);
      setAnalytics(nextAnalytics);
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "Failed to load demo management console",
      );
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const updated = await request<DemoTestConfiguration>("demo-test", {
        method: "PATCH",
        body: JSON.stringify(config),
      });
      setConfig(updated);
      onNotice("Demo test configuration saved.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to save configuration");
    } finally {
      setSaving(false);
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
              Demo Test Management
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Manage the question pool, exam blueprints, randomization rules, and analytics for /demo-test.
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
          <Button
            onClick={() => void saveConfig()}
            disabled={saving}
            className="gap-2 rounded-full bg-brand-red text-xs font-bold text-white hover:bg-brand-red-hover"
          >
            {saving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save Changes
          </Button>
        </div>
      </section>

      {/* Internal Navigation Tabs */}
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
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
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
      {activeTab === "overview" && (
        <DemoOverviewTab
          config={config}
          health={health}
          analytics={analytics}
          onRefresh={() => void load()}
          onNavigateTab={(t) => setActiveTab(t as SubTab)}
        />
      )}
      {activeTab === "general" && (
        <DemoGeneralConfigTab config={config} onChange={setConfig} />
      )}
      {activeTab === "pool" && (
        <DemoQuestionPoolTab
          onNotice={onNotice}
          onError={onError}
          onPoolChanged={() => void load()}
        />
      )}
      {activeTab === "blueprints" && (
        <DemoBlueprintsTab config={config} onChange={setConfig} />
      )}
      {activeTab === "randomization" && (
        <DemoRandomizationTab config={config} onChange={setConfig} />
      )}
      {activeTab === "analytics" && <DemoAnalyticsTab onError={onError} />}
    </div>
  );
}
