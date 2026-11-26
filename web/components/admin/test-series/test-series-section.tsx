"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Award, MonitorCog, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TestSeriesOverview } from "./test-series-overview";
import { TestSeriesTable } from "./test-series-table";
import { TestSeriesDialog } from "./test-series-dialog";
import { CategoryManagerDialog } from "./category-manager-dialog";
import { TestSeriesDetailsView } from "./test-series-details-view";
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
  const [activeTab, setActiveTab] = useState<"series" | "login-demo">("series");
  const [categories, setCategories] = useState<TestSeriesCategory[]>([]);
  const [seriesList, setSeriesList] = useState<TestSeries[]>([]);
  const [stats, setStats] = useState<TestSeriesOverviewStats>({
    totalSeries: 0,
    totalTests: 0,
    upcomingTests: 0,
    completedTests: 0,
  });

  const [activeSeriesId, setActiveSeriesId] = useState<string | null>(null);
  const [seriesDialogOpen, setSeriesDialogOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<TestSeries | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const activeSeries = useMemo(
    () => (activeSeriesId ? seriesList.find((s) => s.id === activeSeriesId) ?? null : null),
    [seriesList, activeSeriesId]
  );

  // Load from API
  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/test-series", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.series) setSeriesList(data.series);
        if (data.categories) setCategories(data.categories);
        if (data.stats) setStats(data.stats);
      }
    } catch {
      // Keep initial seed data on error
    } finally {
      setLoading(false);
    }
  }, []);

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
  const handleSaveSeries = async (data: Partial<TestSeries>, targetSeriesId?: string) => {
    const seriesId = targetSeriesId ?? editingSeries?.id;
    if (seriesId) {
      const res = await fetch(`/api/admin/test-series/${seriesId}`, {
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
      if (activeSeriesId === id) setActiveSeriesId(null);
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
          onBack={() => setActiveSeriesId(null)}
          onUpdateSeries={(updates) => handleSaveSeries(updates, activeSeries.id)}
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
          <div className="flex flex-col gap-1">
            <p className="text-3xs font-semibold uppercase tracking-wider text-indigo-600">
              Assessment Packages
            </p>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Test Series
            </h2>
            <p className="text-xs text-slate-500">
              Organize mock test packages, categories &amp; login demo configurations.
            </p>
          </div>

          {/* Unified Test Tab Bar */}
          <div className="flex w-full flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-2 rounded-xl shadow-2xs">
            <div className="flex items-center">
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
            </div>

            {activeTab === "series" && (
              <div className="flex items-center gap-2 py-1.5 pr-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCategoryDialogOpen(true)}
                  className="h-8.5 rounded-full border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                >
                  Categories
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingSeries(null);
                    setSeriesDialogOpen(true);
                  }}
                  className="h-8.5 gap-1.5 rounded-full bg-brand-red text-xs font-semibold text-white shadow-primary hover:bg-brand-red-hover"
                >
                  <Plus className="size-3.5" /> Create Test Series
                </Button>
              </div>
            )}
          </div>

          {/* Tab 1: Test Series Packages */}
          {activeTab === "series" && (
            <div className="space-y-6">
              <TestSeriesOverview stats={stats} />
              <TestSeriesTable
                series={seriesList}
                categories={categories}
                onViewSeries={(s) => setActiveSeriesId(s.id)}
                onEditSeries={(s) => {
                  setEditingSeries(s);
                  setSeriesDialogOpen(true);
                }}
                onDuplicateSeries={handleDuplicateSeries}
                onDeleteSeries={handleDeleteSeries}
                onOpenCategoryManager={() => setCategoryDialogOpen(true)}
              />
            </div>
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
