"use client";

import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Award, LoaderCircle, MonitorCog } from "lucide-react";
import { AdminWorkspaceContentSkeleton } from "@/components/skeletons/admin-layout-skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/components/admin/admin-api";
import { CategoryPanel } from "./category-panel";
import type { EditorMode, LiveTestEditorHandle } from "./live-test-editor";
import { TestsTable } from "./tests-table";
import type {
  CategoryTestItem,
  ExamPatternConfigResponse,
  TestSeriesCategory,
} from "./types";

const LiveTestEditor = lazy(() =>
  import("./live-test-editor").then((m) => ({ default: m.LiveTestEditor })),
);

const LoginDemoControlTab = dynamic(
  () =>
    import("./login-demo-control-tab").then((m) => m.LoginDemoControlTab),
  {
    loading: () => (
      <div className="flex min-h-60 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-xs text-slate-500">
        <LoaderCircle className="mr-2 size-4 animate-spin" />
        Loading demo controls...
      </div>
    ),
  },
);

const TestPreviewDialog = dynamic(
  () => import("./test-preview-dialog").then((m) => m.TestPreviewDialog),
  { ssr: false },
);

interface TestSeriesSectionProps {
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}

export function TestSeriesSection({ onNotice, onError }: TestSeriesSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editorRef = useRef<LiveTestEditorHandle>(null);

  const [activeTab, setActiveTab] = useState<"tests" | "login-demo">("tests");
  const [initialLoading, setInitialLoading] = useState(true);
  const [categories, setCategories] = useState<TestSeriesCategory[]>([]);
  const [examConfig, setExamConfig] =
    useState<ExamPatternConfigResponse | null>(null);

  const urlCategoryId = searchParams.get("category");
  const urlTestId = searchParams.get("test");

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    urlCategoryId,
  );

  // Tests list state
  const [tests, setTests] = useState<CategoryTestItem[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [testsError, setTestsError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Right Editor state
  const [editorMode, setEditorMode] = useState<EditorMode>(
    urlTestId ? "edit" : "empty",
  );
  const [selectedTestId, setSelectedTestId] = useState<string | null>(
    urlTestId,
  );
  const [isEditorDirty, setIsEditorDirty] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [previewTestId, setPreviewTestId] = useState<string | null>(null);

  const testsAbortRef = useRef<AbortController | null>(null);
  const selectedTestIdRef = useRef<string | null>(selectedTestId);
  const editorModeRef = useRef<EditorMode>(editorMode);

  useEffect(() => {
    selectedTestIdRef.current = selectedTestId;
    editorModeRef.current = editorMode;
  }, [selectedTestId, editorMode]);

  // Debounce search input
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Warn on browser tab close / refresh when unsaved changes exist
  useEffect(() => {
    if (!isEditorDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isEditorDirty]);

  const syncUrlParams = useCallback(
    (categoryId: string | null, testId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (categoryId) params.set("category", categoryId);
      else params.delete("category");
      if (testId) params.set("test", testId);
      else params.delete("test");
      const next = params.toString();
      if (next !== searchParams.toString()) {
        router.replace(`?${next}`, { scroll: false });
      }
    },
    [router, searchParams],
  );
  const syncUrlParamsRef = useRef(syncUrlParams);
  useEffect(() => {
    syncUrlParamsRef.current = syncUrlParams;
  }, [syncUrlParams]);

  const loadBootstrap = useCallback(async () => {
    try {
      const [cats, cfg] = await Promise.all([
        api<TestSeriesCategory[]>("test-series/categories"),
        api<ExamPatternConfigResponse>("test-series/config/exam-pattern"),
      ]);
      setCategories(cats);
      setSelectedCategoryId((prev) => {
        if (prev && cats.some((c) => c.id === prev)) return prev;
        return cats[0]?.id ?? null;
      });
      setExamConfig(cfg);
    } catch {
      onError("Failed to load Test Series configuration");
    } finally {
      setInitialLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    const id = requestAnimationFrame(() => void loadBootstrap());
    return () => cancelAnimationFrame(id);
  }, [loadBootstrap]);

  const loadTests = useCallback(
    async () => {
      if (!selectedCategoryId) {
        setTests([]);
        setTotalCount(0);
        setTotalPages(1);
        return;
      }

      testsAbortRef.current?.abort();
      const controller = new AbortController();
      testsAbortRef.current = controller;

      setTestsLoading(true);
      setTestsError(null);
      try {
        const params = new URLSearchParams({
          categoryId: selectedCategoryId,
          page: String(page),
          limit: "15",
        });
        if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
        if (subjectFilter !== "ALL") params.set("subjectCode", subjectFilter);
        if (statusFilter === "ACTIVE") params.set("isActive", "true");
        if (statusFilter === "INACTIVE") params.set("isActive", "false");

        const data = await api<{
          items?: CategoryTestItem[];
          total?: number;
          totalPages?: number;
        }>(`test-series/tests?${params.toString()}`, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        const items: CategoryTestItem[] = data.items ?? [];
        setTests(items);
        setTotalCount(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);

        const activeTestId = selectedTestIdRef.current;
        if (activeTestId && editorModeRef.current === "edit") {
          const match = items.find((t) => t.id === activeTestId);
          if (!match) {
            setSelectedTestId(null);
            setEditorMode("empty");
            syncUrlParamsRef.current(selectedCategoryId, null);
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setTestsError(
            err instanceof Error ? err.message : "Failed to load tests",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setTestsLoading(false);
        }
      }
    },
    [
      selectedCategoryId,
      page,
      debouncedSearch,
      subjectFilter,
      statusFilter,
    ],
  );

  useEffect(() => {
    if (selectedCategoryId) {
      const id = requestAnimationFrame(() => void loadTests());
      return () => {
        cancelAnimationFrame(id);
        testsAbortRef.current?.abort();
      };
    }
  }, [selectedCategoryId, loadTests]);

  // Guard helper for unsaved changes
  const guardUnsaved = useCallback(
    (action: () => void) => {
      if (isEditorDirty) {
        setPendingAction(() => action);
      } else {
        action();
      }
    },
    [isEditorDirty],
  );

  const closeEditor = useCallback(() => {
    setSelectedTestId(null);
    setEditorMode("empty");
    setIsEditorDirty(false);
    syncUrlParams(selectedCategoryId, null);
  }, [selectedCategoryId, syncUrlParams]);

  const handleSelectCategory = (id: string) => {
    if (id === selectedCategoryId) return;
    guardUnsaved(() => {
      setSelectedCategoryId(id);
      setPage(1);
      setSelectedTestId(null);
      setEditorMode("empty");
      setIsEditorDirty(false);
      syncUrlParams(id, null);
    });
  };

  const handleSelectTest = (test: CategoryTestItem) => {
    guardUnsaved(() => {
      setSelectedTestId(test.id);
      setEditorMode("edit");
      setIsEditorDirty(false);
      syncUrlParams(selectedCategoryId, test.id);
    });
  };

  const handleCreateTestClick = () => {
    guardUnsaved(() => {
      setSelectedTestId(null);
      setEditorMode("create");
      setIsEditorDirty(false);
      syncUrlParams(selectedCategoryId, null);
    });
  };

  const handleTabSwitch = (tab: "tests" | "login-demo") => {
    if (tab === activeTab) return;
    guardUnsaved(() => {
      setActiveTab(tab);
    });
  };

  // Category CRUD
  const handleAddCategory = async (name: string) => {
    const data = await api<{ id?: string; name: string }>(
      "test-series/categories",
      {
        method: "POST",
        body: JSON.stringify({ name }),
      },
    );
    onNotice(`Category "${data.name}" added`);
    await loadBootstrap();
    if (data.id) {
      setSelectedCategoryId(data.id);
      setSelectedTestId(null);
      setEditorMode("empty");
      syncUrlParams(data.id, null);
    }
  };

  const handleRenameCategory = async (id: string, name: string) => {
    await api("test-series/categories", {
      method: "PATCH",
      body: JSON.stringify({ id, name }),
    });
    onNotice(`Category renamed to "${name}"`);
    await loadBootstrap();
  };

  const handleDeleteCategory = async (
    id: string,
    moveToCategoryId?: string,
  ) => {
    const query = moveToCategoryId
      ? `&moveToCategoryId=${encodeURIComponent(moveToCategoryId)}`
      : "";
    await api(
      `test-series/categories?id=${encodeURIComponent(id)}${query}`,
      { method: "DELETE" },
    );
    onNotice("Category deleted");
    if (selectedCategoryId === id) {
      const nextCat =
        moveToCategoryId ??
        categories.find((c) => c.id !== id)?.id ??
        null;
      setSelectedCategoryId(nextCat);
      setSelectedTestId(null);
      setEditorMode("empty");
      syncUrlParams(nextCat, null);
    }
    await loadBootstrap();
  };

  // Test actions
  const handleRenameTest = async (test: CategoryTestItem, newTitle: string) => {
    await api(`test-series/tests/${encodeURIComponent(test.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ title: newTitle }),
    });
    onNotice(`Test renamed to "${newTitle}"`);
    await loadTests();
  };

  const handleToggleActive = async (test: CategoryTestItem) => {
    try {
      await api(`test-series/tests/${encodeURIComponent(test.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !test.isActive }),
      });
      onNotice(
        test.isActive
          ? `"${test.title}" deactivated`
          : `"${test.title}" activated`,
      );
      await loadTests();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDeleteTest = async (test: CategoryTestItem) => {
    try {
      await api(`test-series/tests/${encodeURIComponent(test.id)}`, {
        method: "DELETE",
      });
      onNotice(`"${test.title}" deleted`);
      if (selectedTestId === test.id) {
        setSelectedTestId(null);
        setEditorMode("empty");
        syncUrlParams(selectedCategoryId, null);
      }
      await Promise.all([loadBootstrap(), loadTests()]);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to delete test");
    }
  };

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const selectedTest = useMemo(
    () =>
      selectedTestId
        ? tests.find((t) => t.id === selectedTestId) ?? null
        : null,
    [tests, selectedTestId],
  );

  if (initialLoading) {
    return <AdminWorkspaceContentSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-brand-blue">
          Examination Management
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Test Series
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Organize categories, configure NEET examinations, and manage question sets in one workspace.
        </p>
      </div>

      {/* Primary Module Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200">
        <button
          type="button"
          onClick={() => handleTabSwitch("tests")}
          className={`flex cursor-pointer items-center gap-2 border-b-2 pb-2.5 text-xs font-semibold transition ${
            activeTab === "tests"
              ? "border-brand-blue text-brand-blue"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Award className="size-4" />
          Tests by Category
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch("login-demo")}
          className={`flex cursor-pointer items-center gap-2 border-b-2 pb-2.5 text-xs font-semibold transition ${
            activeTab === "login-demo"
              ? "border-brand-blue text-brand-blue"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <MonitorCog className="size-4" />
          Login Demo Control
        </button>
      </div>

      {activeTab === "login-demo" ? (
        <LoginDemoControlTab onNotice={onNotice} onError={onError} />
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          {/* Left Panel: Main Tests Table */}
          <div className="min-w-0 flex-1 lg:min-h-[480px]">
            <TestsTable
              categoryName={selectedCategory?.name ?? "Select a Category"}
              tests={tests}
              selectedTestId={selectedTestId}
              subjects={examConfig?.subjects ?? []}
              loading={testsLoading}
              error={testsError}
              search={search}
              onSearchChange={setSearch}
              subjectFilter={subjectFilter}
              onSubjectFilterChange={(v) => {
                setSubjectFilter(v);
                setPage(1);
              }}
              statusFilter={statusFilter}
              onStatusFilterChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={setPage}
              onRetry={() => void loadTests()}
              onCreateTest={handleCreateTestClick}
              onSelectTest={handleSelectTest}
              onPreviewTest={(test) => setPreviewTestId(test.id)}
              onRenameTest={handleRenameTest}
              onToggleActive={handleToggleActive}
              onDeleteTest={handleDeleteTest}
            />
          </div>

          {/* Right Panel: Compact Categories Sidebar */}
          <div className="w-full shrink-0 lg:w-72 xl:w-80">
            <CategoryPanel
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleSelectCategory}
              onAddCategory={handleAddCategory}
              onRenameCategory={handleRenameCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          </div>
        </div>
      )}

      {/* Create / Edit Test Modal */}
      <Dialog
        open={editorMode !== "empty"}
        onOpenChange={(open) => {
          if (!open) guardUnsaved(closeEditor);
        }}
      >
        <DialogContent className="flex h-[min(85vh,720px)] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
          <DialogTitle className="sr-only">
            {editorMode === "create" ? "Create Test" : "Edit Test"}
          </DialogTitle>
          {editorMode !== "empty" && (
            <Suspense
              fallback={
                <div className="flex flex-1 items-center justify-center p-8 text-xs text-slate-500">
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                  Loading test editor...
                </div>
              }
            >
              <LiveTestEditor
                ref={editorRef}
                inDialog
                mode={editorMode}
                selectedTest={selectedTest}
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                examConfig={examConfig}
                onDirtyChange={setIsEditorDirty}
                onCancelCreate={closeEditor}
                onClose={() => guardUnsaved(closeEditor)}
                onCreateTestClick={handleCreateTestClick}
                onSaved={async (_savedId, _wasCreate, message) => {
                  onNotice(message);
                  closeEditor();
                  await Promise.all([loadBootstrap(), loadTests()]);
                }}
                onError={onError}
              />
            </Suspense>
          )}
        </DialogContent>
      </Dialog>

      {/* Test Preview Dialog */}
      {Boolean(previewTestId) && (
        <TestPreviewDialog
          testId={previewTestId}
          onClose={() => setPreviewTestId(null)}
        />
      )}

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes in the test editor. Would you like to
              save them before continuing?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingAction(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => {
                const action = pendingAction;
                editorRef.current?.discard();
                setIsEditorDirty(false);
                setPendingAction(null);
                action?.();
              }}
            >
              Discard Changes
            </Button>
            <Button
              type="button"
              onClick={async () => {
                const ok = await editorRef.current?.save();
                if (ok) {
                  const action = pendingAction;
                  setPendingAction(null);
                  action?.();
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
