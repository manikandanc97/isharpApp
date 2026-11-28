"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { Stack } from "@/components/layout/layout-primitives";
import { QuestionBankHeader } from "./question-bank/question-bank-header";
import { QuestionBankTabsAndSubjects } from "./question-bank/question-bank-tabs-and-subjects";
import { QuestionBankList } from "./question-bank/question-bank-list";
import { useQuestionBank } from "./question-bank/use-question-bank";
import { exportQuestionsToExcel } from "@/lib/question-export";

const QuestionEditorDialog = dynamic(
  () =>
    import("./question-bank/question-editor-dialog").then(
      (m) => m.QuestionEditorDialog,
    ),
  { ssr: false },
);

const QuestionImportDialog = dynamic(
  () =>
    import("./question-bank/question-import-dialog").then(
      (m) => m.QuestionImportDialog,
    ),
  { ssr: false },
);

export function QuestionBankManager() {
  const {
    questions,
    draft,
    setDraft,
    query,
    setQuery,
    subjectFilter,
    setSubjectFilter,
    chapterFilter,
    setChapterFilter,
    difficultyFilter,
    setDifficultyFilter,
    typeFilter,
    setTypeFilter,
    languageFilter,
    setLanguageFilter,
    availableChapters,
    editingId,
    editorOpen,
    setEditorOpen,
    importOpen,
    setImportOpen,
    importFile,
    importReport,
    importBusy,
    retryExportBusy,
    retryMode,
    importError,
    setImportError,
    importProgress,
    busy,
    error,
    setError,
    notice,
    setNotice,
    patchOption,
    chooseCorrect,
    uploadImage,
    save,
    editQuestion,
    createQuestion,
    deleteQuestion,
    bulkDeleteQuestions,
    selectImportFile,
    selectFailedRowsFile,
    downloadFailedRows,
    completePartialImport,
    importExcel,
    subjectCounts,
    showingExamples,
    libraryQuestions,
    visible,
  } = useQuestionBank();

  const [exportBusy, setExportBusy] = useState(false);

  const handleExportExcel = async () => {
    if (exportBusy) return;
    setExportBusy(true);
    try {
      const toExport = visible.length > 0 ? visible : questions;
      await exportQuestionsToExcel(
        toExport,
        `isharp-neet-questions-export-${Date.now()}.xlsx`
      );
    } catch {
      setError("Failed to export questions to Excel.");
    } finally {
      setExportBusy(false);
    }
  };

  const handleDuplicateQuestion = (q: (typeof questions)[number]) => {
    editQuestion({
      ...q,
      id: "",
      externalId: `${q.externalId}-COPY`,
    });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)]">
      <QuestionBankHeader
        questionsCount={questions.length}
        selectedCount={visible.length}
        onCreateQuestion={createQuestion}
        onOpenImport={() => {
          setImportOpen(true);
          selectImportFile(null);
          setImportError(null);
          setError("");
        }}
        onExportExcel={handleExportExcel}
      />

      <QuestionImportDialog
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setImportError(null);
        }}
        importFile={importFile}
        selectImportFile={selectImportFile}
        importReport={importReport}
        importBusy={importBusy}
        retryExportBusy={retryExportBusy}
        retryMode={retryMode}
        importError={importError}
        setImportError={setImportError}
        importProgress={importProgress}
        selectFailedRowsFile={selectFailedRowsFile}
        onDownloadFailedRows={downloadFailedRows}
        onCompletePartial={completePartialImport}
        onImport={importExcel}
      />

      <QuestionEditorDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        editingId={editingId}
        subjectFilter={subjectFilter}
        draft={draft}
        setDraft={setDraft}
        patchOption={patchOption}
        chooseCorrect={chooseCorrect}
        uploadImage={uploadImage}
        onSave={save}
        busy={busy}
      />

      {(error || notice) && (
        <div
          className={`mx-5 mt-5 flex items-center justify-between rounded-xl border p-3 text-sm sm:mx-7 ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <span>{error || notice}</span>
          <button
            onClick={() => {
              setError("");
              setNotice("");
            }}
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="bg-[#fdfdfc] p-5 sm:p-7">
        <Stack>
          <QuestionBankTabsAndSubjects
            subjectFilter={subjectFilter}
            onSubjectChange={setSubjectFilter}
            subjectCounts={subjectCounts}
          />

          <QuestionBankList
            subjectFilter={subjectFilter}
            showingExamples={showingExamples}
            visibleCount={visible.length}
            totalSubjectCount={subjectCounts[subjectFilter]}
            query={query}
            onQueryChange={setQuery}
            chapterFilter={chapterFilter}
            onChapterChange={setChapterFilter}
            difficultyFilter={difficultyFilter}
            onDifficultyChange={setDifficultyFilter}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            languageFilter={languageFilter}
            onLanguageChange={setLanguageFilter}
            availableChapters={availableChapters}
            busy={busy}
            libraryQuestions={libraryQuestions}
            onEdit={editQuestion}
            onDuplicate={handleDuplicateQuestion}
            onDelete={(q) => void deleteQuestion(q)}
            onBulkDelete={bulkDeleteQuestions}
            onCreateQuestion={createQuestion}
            onOpenImport={() => {
              setImportOpen(true);
              selectImportFile(null);
              setImportError(null);
              setError("");
            }}
            onClearFilters={() => {
              setQuery("");
              setChapterFilter("ALL");
              setDifficultyFilter("ALL");
              setTypeFilter("ALL");
              setLanguageFilter("ALL");
            }}
          />
        </Stack>
      </div>
    </section>
  );
}
