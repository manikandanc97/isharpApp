"use client";

import dynamic from "next/dynamic";
import { Award, LoaderCircle, MonitorCog } from "lucide-react";
import { AdminWorkspaceContentSkeleton } from "@/components/skeletons/admin-layout-skeleton";
import { CategoryPanel } from "./category-panel";
import { TestsTable } from "./tests-table";
import { TestSeriesDialogs } from "./test-series-dialogs";
import { useTestSeriesSection } from "./use-test-series-section";

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

interface TestSeriesSectionProps {
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}

export function TestSeriesSection({
  onNotice,
  onError,
}: TestSeriesSectionProps) {
  const vm = useTestSeriesSection({ onNotice, onError });

  if (vm.initialLoading) {
    return <AdminWorkspaceContentSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-brand-blue">
          Examination Management
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Test Series
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Organize categories, configure NEET examinations, and manage question
          sets in one workspace.
        </p>
      </div>

      <div className="flex items-center gap-6 border-b border-slate-200">
        <button
          type="button"
          onClick={() => vm.handleTabSwitch("tests")}
          className={`flex cursor-pointer items-center gap-2 border-b-2 pb-2.5 text-xs font-semibold transition ${
            vm.activeTab === "tests"
              ? "border-brand-blue text-brand-blue"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Award className="size-4" />
          Tests by Category
        </button>

        <button
          type="button"
          onClick={() => vm.handleTabSwitch("login-demo")}
          className={`flex cursor-pointer items-center gap-2 border-b-2 pb-2.5 text-xs font-semibold transition ${
            vm.activeTab === "login-demo"
              ? "border-brand-blue text-brand-blue"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <MonitorCog className="size-4" />
          Login Demo Control
        </button>
      </div>

      {vm.activeTab === "login-demo" ? (
        <LoginDemoControlTab onNotice={onNotice} onError={onError} />
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 lg:min-h-[480px]">
            <TestsTable
              categoryName={vm.selectedCategory?.name ?? "Select a Category"}
              tests={vm.tests}
              selectedTestId={vm.selectedTestId}
              subjects={vm.examConfig?.subjects ?? []}
              loading={vm.testsLoading}
              error={vm.testsError}
              search={vm.search}
              onSearchChange={vm.setSearch}
              subjectFilter={vm.subjectFilter}
              onSubjectFilterChange={(v) => {
                vm.setSubjectFilter(v);
                vm.setPage(1);
              }}
              statusFilter={vm.statusFilter}
              onStatusFilterChange={(v) => {
                vm.setStatusFilter(v);
                vm.setPage(1);
              }}
              page={vm.page}
              totalPages={vm.totalPages}
              totalCount={vm.totalCount}
              onPageChange={vm.setPage}
              onRetry={() => void vm.loadTests()}
              onCreateTest={vm.handleCreateTestClick}
              onSelectTest={vm.handleSelectTest}
              onPreviewTest={(test) => vm.setPreviewTestId(test.id)}
              onRenameTest={vm.handleRenameTest}
              onToggleActive={vm.handleToggleActive}
              onDeleteTest={vm.handleDeleteTest}
            />
          </div>

          <div className="w-full shrink-0 lg:w-72 xl:w-80">
            <CategoryPanel
              categories={vm.categories}
              selectedCategoryId={vm.selectedCategoryId}
              onSelectCategory={vm.handleSelectCategory}
              onAddCategory={vm.handleAddCategory}
              onRenameCategory={vm.handleRenameCategory}
              onDeleteCategory={vm.handleDeleteCategory}
            />
          </div>
        </div>
      )}

      <TestSeriesDialogs
        editorRef={vm.editorRef}
        editorMode={vm.editorMode}
        selectedTest={vm.selectedTest}
        categories={vm.categories}
        selectedCategoryId={vm.selectedCategoryId}
        examConfig={vm.examConfig}
        previewTestId={vm.previewTestId}
        pendingAction={vm.pendingAction}
        onDirtyChange={vm.setIsEditorDirty}
        onCloseEditor={vm.closeEditor}
        onGuardUnsaved={vm.guardUnsaved}
        onCreateTestClick={vm.handleCreateTestClick}
        onSaved={async (message) => {
          onNotice(message);
          vm.closeEditor();
          await Promise.all([vm.loadBootstrap(), vm.loadTests()]);
        }}
        onError={onError}
        onClosePreview={() => vm.setPreviewTestId(null)}
        onClearPendingAction={() => vm.setPendingAction(null)}
      />
    </div>
  );
}
