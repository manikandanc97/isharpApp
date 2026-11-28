"use client";

import { forwardRef, useImperativeHandle } from "react";
import { AlertTriangle } from "lucide-react";
import { TestDetailsTab } from "./live-test-editor/components/test-details-tab";
import { TestSubjectsTab } from "./live-test-editor/components/test-subjects-tab";
import { TestQuestionsTab } from "./live-test-editor/components/test-questions-tab";
import { TestSettingsTab } from "./live-test-editor/components/test-settings-tab";
import { TestEditorDialogs } from "./live-test-editor/components/test-editor-dialogs";
import {
  TestEditorEmptyState,
  TestEditorHeader,
  TestEditorLoadingState,
} from "./live-test-editor/components/test-editor-header";
import { TestEditorFooter } from "./live-test-editor/components/test-editor-footer";
import { useLiveTestEditor } from "./live-test-editor/use-live-test-editor";
import type {
  EditorMode,
  EditorTab,
  LiveTestEditorHandle,
  LiveTestEditorProps,
} from "./live-test-editor/test-editor.types";

export type { EditorMode, EditorTab, LiveTestEditorHandle };

export const LiveTestEditor = forwardRef<
  LiveTestEditorHandle,
  LiveTestEditorProps
>(function LiveTestEditor(
  {
    mode,
    selectedTest,
    categories,
    selectedCategoryId,
    examConfig,
    inDialog = false,
    onDirtyChange,
    onCancelCreate,
    onClose,
    onCreateTestClick,
    onSaved,
    onError,
  },
  ref,
) {
  const editor = useLiveTestEditor({
    mode,
    selectedTest,
    categories,
    selectedCategoryId,
    examConfig,
    onDirtyChange,
    onSaved,
    onError,
  });

  useImperativeHandle(
    ref,
    () => ({
      save: editor.handleSave,
      discard: editor.handleDiscard,
    }),
    [editor.handleSave, editor.handleDiscard],
  );

  if (mode === "empty") {
    return <TestEditorEmptyState onCreateTestClick={onCreateTestClick} />;
  }

  if (editor.loadingDetail || !editor.form || !examConfig) {
    return <TestEditorLoadingState inDialog={inDialog} />;
  }

  const { form, metrics } = editor;

  return (
    <div
      className={
        inDialog
          ? "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white"
          : "flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs"
      }
    >
      <TestEditorHeader
        mode={mode}
        title={form.title}
        selectedTitle={selectedTest?.title}
        categoryId={form.categoryId}
        categories={categories}
        isActive={form.isActive}
        isDirty={editor.isDirty}
        inDialog={inDialog}
        activeTab={editor.activeTab}
        onTabChange={editor.setActiveTab}
        assignedCount={editor.loadedQuestions.length}
        totalQuestions={metrics.totalQuestions}
      />

      <div className="min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto p-5">
        {editor.hasAttempts && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div>
              <strong>
                {selectedTest?.attemptCount} student attempt(s) recorded:
              </strong>{" "}
              Questions, duration, and marking scheme are locked. Duplicate the
              test to create a modified version.
            </div>
          </div>
        )}

        {mode === "edit" &&
          (selectedTest?.configurationWarnings?.length ?? 0) > 0 && (
            <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="size-3.5 text-amber-600" />
                Configuration Inconsistency Detected
              </div>
              {selectedTest?.configurationWarnings?.map((w, i) => (
                <div key={i}>• {w}</div>
              ))}
            </div>
          )}

        {editor.activeTab === "details" && (
          <TestDetailsTab
            form={form}
            categories={categories}
            examConfig={examConfig}
            hasAttempts={editor.hasAttempts}
            totalQuestions={metrics.totalQuestions}
            assignedCount={editor.loadedQuestions.length}
            effectiveDuration={metrics.effectiveDuration}
            maxMarks={metrics.maxMarks}
            effectiveCorrectMarks={metrics.effectiveCorrectMarks}
            effectiveNegativeMarks={metrics.effectiveNegativeMarks}
            subjectAllocationTotal={metrics.subjectAllocationTotal}
            enabledSubjects={metrics.enabledSubjects}
            updateForm={editor.updateForm}
            onRequestDefaultPattern={() => editor.setConfirmDefaultOpen(true)}
          />
        )}

        {editor.activeTab === "subjects" && (
          <TestSubjectsTab
            form={form}
            examConfig={examConfig}
            hasAttempts={editor.hasAttempts}
            subjectAllocationTotal={metrics.subjectAllocationTotal}
            allocationErrors={editor.allocationErrors}
            expandedSubjects={editor.expandedSubjects}
            setExpandedSubjects={editor.setExpandedSubjects}
            chapterSearch={editor.chapterSearch}
            setChapterSearch={editor.setChapterSearch}
            updateForm={editor.updateForm}
          />
        )}

        {editor.activeTab === "questions" && (
          <TestQuestionsTab
            form={form}
            examConfig={examConfig}
            hasAttempts={editor.hasAttempts}
            totalQuestions={metrics.totalQuestions}
            loadedQuestions={editor.loadedQuestions}
            setLoadedQuestions={editor.setLoadedQuestions}
            selectedIdSet={editor.selectedIdSet}
            generating={editor.generating}
            shortages={editor.shortages}
            allocationErrors={editor.allocationErrors}
            replaceTargetId={editor.replaceTargetId}
            setReplaceTargetId={editor.setReplaceTargetId}
            bankQuery={editor.bankQuery}
            setBankQuery={editor.setBankQuery}
            bankSubject={editor.bankSubject}
            setBankSubject={editor.setBankSubject}
            bankChapter={editor.bankChapter}
            setBankChapter={editor.setBankChapter}
            bankDifficulty={editor.bankDifficulty}
            setBankDifficulty={editor.setBankDifficulty}
            bankPage={editor.bankPage}
            setBankPage={editor.setBankPage}
            bankItems={editor.bankItems}
            bankTotal={editor.bankTotal}
            bankTotalPages={editor.bankTotalPages}
            bankLoading={editor.bankLoading}
            availableChaptersForBank={editor.availableChaptersForBank}
            onGenerateQuestions={editor.handleGenerateQuestions}
            onBulkSelectPage={editor.handleBulkSelectPage}
            onToggleManualQuestion={editor.toggleManualQuestion}
            onPreviewQuestion={editor.setPreviewQuestion}
            updateForm={editor.updateForm}
          />
        )}

        {editor.activeTab === "settings" && (
          <TestSettingsTab
            form={form}
            hasAttempts={editor.hasAttempts}
            effectiveDuration={metrics.effectiveDuration}
            effectiveCorrectMarks={metrics.effectiveCorrectMarks}
            effectiveNegativeMarks={metrics.effectiveNegativeMarks}
            updateForm={editor.updateForm}
          />
        )}
      </div>

      <TestEditorFooter
        mode={mode}
        saving={editor.saving}
        isDirty={editor.isDirty}
        activationErrors={editor.activationErrors}
        onCancelCreate={onCancelCreate}
        onClose={onClose}
        onDiscard={editor.handleDiscard}
        onSave={() => void editor.handleSave()}
      />

      <TestEditorDialogs
        confirmDefaultOpen={editor.confirmDefaultOpen}
        onConfirmDefaultOpenChange={editor.setConfirmDefaultOpen}
        onApplyDefaultPattern={editor.applyDefaultNeetPattern}
        previewQuestion={editor.previewQuestion}
        onClosePreview={() => editor.setPreviewQuestion(null)}
      />
    </div>
  );
});
