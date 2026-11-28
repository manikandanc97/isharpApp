import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/components/admin/admin-api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { EditorMode, LiveTestEditorHandle } from "./live-test-editor";
import type {
  CategoryTestItem,
  ExamPatternConfigResponse,
  TestSeriesCategory,
} from "./types";

interface UseTestSeriesSectionOptions {
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}

export function useTestSeriesSection({
  onNotice,
  onError,
}: UseTestSeriesSectionOptions) {
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

  const [tests, setTests] = useState<CategoryTestItem[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [testsError, setTestsError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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

  const loadTests = useCallback(async () => {
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
  }, [
    selectedCategoryId,
    page,
    debouncedSearch,
    subjectFilter,
    statusFilter,
  ]);

  useEffect(() => {
    if (selectedCategoryId) {
      const id = requestAnimationFrame(() => void loadTests());
      return () => {
        cancelAnimationFrame(id);
        testsAbortRef.current?.abort();
      };
    }
  }, [selectedCategoryId, loadTests]);

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
    guardUnsaved(() => setActiveTab(tab));
  };

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
        moveToCategoryId ?? categories.find((c) => c.id !== id)?.id ?? null;
      setSelectedCategoryId(nextCat);
      setSelectedTestId(null);
      setEditorMode("empty");
      syncUrlParams(nextCat, null);
    }
    await loadBootstrap();
  };

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
        ? (tests.find((t) => t.id === selectedTestId) ?? null)
        : null,
    [tests, selectedTestId],
  );

  return {
    editorRef,
    activeTab,
    initialLoading,
    categories,
    examConfig,
    selectedCategoryId,
    selectedCategory,
    selectedTest,
    tests,
    testsLoading,
    testsError,
    search,
    setSearch: (val: string) => {
      setSearch(val);
      setPage(1);
    },
    subjectFilter,
    setSubjectFilter,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    totalPages,
    totalCount,
    editorMode,
    selectedTestId,
    setIsEditorDirty,
    pendingAction,
    setPendingAction,
    previewTestId,
    setPreviewTestId,
    loadBootstrap,
    loadTests,
    guardUnsaved,
    closeEditor,
    handleSelectCategory,
    handleSelectTest,
    handleCreateTestClick,
    handleTabSwitch,
    handleAddCategory,
    handleRenameCategory,
    handleDeleteCategory,
    handleRenameTest,
    handleToggleActive,
    handleDeleteTest,
  };
}
