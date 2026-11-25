"use client";

import { useCallback, useEffect, useState } from "react";
import { Award, MonitorCog, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TestSeriesOverview } from "./test-series-overview";
import { TestSeriesTable } from "./test-series-table";
import { TestSeriesDialog } from "./test-series-dialog";
import { CategoryManagerDialog } from "./category-manager-dialog";
import { TestSeriesDetailsView } from "./test-series-details-view";
import { MockTestsTab } from "./mock-tests-tab";
import { LoginDemoControlTab } from "./login-demo-control-tab";
import { AdminWorkspaceContentSkeleton } from "@/components/skeletons/admin-layout-skeleton";
import type {
  IndividualTest,
  TestSeries,
  TestSeriesCategory,
  TestSeriesOverviewStats,
} from "./types";

interface TestSeriesSectionProps {
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}

export function TestSeriesSection({ onNotice, onError }: TestSeriesSectionProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"series" | "mock-tests" | "login-demo">("series");
  const [categories, setCategories] = useState<TestSeriesCategory[]>([]);
  const [seriesList, setSeriesList] = useState<TestSeries[]>([]);
  const [stats, setStats] = useState<TestSeriesOverviewStats>({
    totalSeries: 0,
    publishedSeries: 0,
    draftSeries: 0,
    totalTests: 0,
    scheduledTests: 0,
  });

  const [activeSeries, setActiveSeries] = useState<TestSeries | null>(null);
  const [seriesDialogOpen, setSeriesDialogOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<TestSeries | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  // Load from API
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/test-series", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.series) setSeriesList(data.series);
        if (data.categories) setCategories(data.categories);
        if (data.stats) setStats(data.stats);
        if (activeSeries) {
          const refreshed = (data.series as TestSeries[]).find((s) => s.id === activeSeries.id);
          if (refreshed) setActiveSeries(refreshed);
        }
      }
    } catch {
      // Keep initial seed data on error
    } finally {
      setLoading(false);
    }
  }, [activeSeries]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  // Category handlers
  const handleAddCategory = async (cat: { name: string; slug: string; description: string }) => {
    const res = await fetch("/api/admin/test-series/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cat),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to add category");
    }
    await loadData();
  };

  const handleUpdateCategory = async (id: string, updates: Partial<TestSeriesCategory>) => {
    const res = await fetch("/api/admin/test-series/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update category");
    }
    await loadData();
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await fetch(`/api/admin/test-series/categories?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to delete category");
    }
    await loadData();
  };

  // Series handlers
  const handleSaveSeries = async (data: Partial<TestSeries>) => {
    if (editingSeries) {
      const res = await fetch(`/api/admin/test-series/${editingSeries.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update series");
      }
    } else {
      const res = await fetch("/api/admin/test-series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create series");
      }
    }
    await loadData();
  };

  const handleTogglePublishSeries = async (series: TestSeries) => {
    const nextStatus = series.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const res = await fetch(`/api/admin/test-series/${series.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to toggle publish status");
      onNotice(`Test Series "${series.name}" marked as ${nextStatus}`);
      await loadData();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to toggle status");
    }
  };

  const handleDuplicateSeries = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/test-series/${id}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to duplicate test series");
      onNotice("Test series duplicated successfully");
      await loadData();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to duplicate");
    }
  };

  const handleDeleteSeries = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/test-series/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete test series");
      onNotice("Test series deleted successfully");
      if (activeSeries?.id === id) setActiveSeries(null);
      await loadData();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to delete series");
    }
  };

  // Test handlers
  const handleAddTest = async (testData: Partial<IndividualTest>) => {
    if (!activeSeries) return;
    const res = await fetch(`/api/admin/test-series/${activeSeries.id}/tests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to add test");
    }
    await loadData();
  };

  const handleUpdateTest = async (testId: string, testData: Partial<IndividualTest>) => {
    if (!activeSeries) return;
    const res = await fetch(`/api/admin/test-series/${activeSeries.id}/tests/${testId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update test");
    }
    await loadData();
  };

  const handleDeleteTest = async (testId: string) => {
    if (!activeSeries) return;
    const res = await fetch(`/api/admin/test-series/${activeSeries.id}/tests/${testId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to delete test");
    }
    onNotice("Test deleted successfully");
    await loadData();
  };

  const handleDuplicateTest = async (testId: string) => {
    if (!activeSeries) return;
    const res = await fetch(`/api/admin/test-series/${activeSeries.id}/tests/${testId}`, {
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to duplicate test");
    }
    onNotice("Test duplicated successfully");
    await loadData();
  };

  const handleReorderTests = async (orderedTestIds: string[]) => {
    if (!activeSeries) return;
    const res = await fetch(`/api/admin/test-series/${activeSeries.id}/tests`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedTestIds }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to reorder tests");
    }
    await loadData();
  };

  if (loading) return <AdminWorkspaceContentSkeleton section="test-series" />;

  return (
    <div className="space-y-6">
      {/* If a test series details view is open, render details */}
      {activeSeries ? (
        <TestSeriesDetailsView
          series={activeSeries}
          categories={categories}
          onBack={() => setActiveSeries(null)}
          onUpdateSeries={async (updates) => {
            await handleSaveSeries(updates);
            const updated = seriesList.find((s) => s.id === activeSeries.id);
            if (updated) setActiveSeries(updated);
          }}
          onAddTest={handleAddTest}
          onUpdateTest={handleUpdateTest}
          onDeleteTest={handleDeleteTest}
          onDuplicateTest={handleDuplicateTest}
          onReorderTests={handleReorderTests}
          onNotice={onNotice}
          onError={onError}
        />
      ) : (
        <>
          {/* Header & Overview Stats */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-brand-red border border-rose-200">
                  TEST & ASSESSMENT HUB
                </span>
                <span className="text-xs text-slate-500">
                  Unified Assessment Blueprint, Series & Mock Engine
                </span>
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Tests & Test Series Management
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                All test operations in one unified workspace: curated cohort series, automated NEET mock tests, blueprints, and questions.
              </p>
            </div>

            {activeTab === "series" && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCategoryDialogOpen(true)}
                  className="h-9 rounded-full border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                >
                  Categories
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingSeries(null);
                    setSeriesDialogOpen(true);
                  }}
                  className="h-9 gap-1.5 rounded-full bg-brand-red text-xs font-semibold text-white shadow-primary hover:bg-brand-red-hover"
                >
                  <Plus className="size-3.5" /> Create Test Series
                </Button>
              </div>
            )}
          </div>

          {/* Unified Test Tab Bar */}
          <div className="flex w-full border-b border-slate-200 bg-white px-2 rounded-xl shadow-2xs">
            <button
              onClick={() => setActiveTab("series")}
              className={`relative flex items-center gap-2 px-5 py-3 text-xs font-bold transition ${
                activeTab === "series"
                  ? "text-indigo-700"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Award className="size-4" />
              <span>Test Series Packages</span>
              <span
                className={`rounded-full px-2 py-0.5 text-3xs font-bold ${
                  activeTab === "series"
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {seriesList.length}
              </span>
              {activeTab === "series" && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-indigo-600" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("login-demo")}
              className={`relative flex items-center gap-2 px-5 py-3 text-xs font-bold transition ${
                activeTab === "login-demo" ? "text-indigo-700" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <MonitorCog className="size-4 text-emerald-600" />
              <span>Login Demo Control</span>
              {activeTab === "login-demo" && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-indigo-600" />}
            </button>

            <button
              onClick={() => setActiveTab("mock-tests")}
              className={`relative flex items-center gap-2 px-5 py-3 text-xs font-bold transition ${
                activeTab === "mock-tests"
                  ? "text-indigo-700"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Sparkles className="size-4 text-amber-500" />
              <span>Quick Mock Tests & Auto-Builder</span>
              {activeTab === "mock-tests" && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-indigo-600" />
              )}
            </button>
          </div>

          {/* Tab 1: Test Series Packages */}
          {activeTab === "series" && (
            <div className="space-y-6">
              <TestSeriesOverview stats={stats} />
              <TestSeriesTable
                series={seriesList}
                categories={categories}
                onViewSeries={(s) => setActiveSeries(s)}
                onEditSeries={(s) => {
                  setEditingSeries(s);
                  setSeriesDialogOpen(true);
                }}
                onDuplicateSeries={handleDuplicateSeries}
                onTogglePublishSeries={handleTogglePublishSeries}
                onDeleteSeries={handleDeleteSeries}
                onOpenCategoryManager={() => setCategoryDialogOpen(true)}
              />
            </div>
          )}

          {/* Tab 2: Quick Mock Tests & Builder */}
          {activeTab === "mock-tests" && (
            <MockTestsTab onNotice={onNotice} onError={onError} />
          )}

          {activeTab === "login-demo" && (
            <LoginDemoControlTab onNotice={onNotice} onError={onError} />
          )}
        </>
      )}

      {/* Series Create / Edit Dialog */}
      <TestSeriesDialog
        open={seriesDialogOpen}
        onOpenChange={setSeriesDialogOpen}
        categories={categories}
        initialData={editingSeries}
        onSave={handleSaveSeries}
        onNotice={onNotice}
        onError={onError}
      />

      {/* Category Manager Dialog */}
      <CategoryManagerDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        categories={categories}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onNotice={onNotice}
        onError={onError}
      />
    </div>
  );
}
