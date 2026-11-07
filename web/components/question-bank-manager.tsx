"use client";

import { X } from "lucide-react";
import { Stack } from "@/components/layout/layout-primitives";
import { MockTestsBuilder } from "./question-bank/mock-tests-builder";
import { QuestionEditorDialog } from "./question-bank/question-editor-dialog";
import { QuestionImportDialog } from "./question-bank/question-import-dialog";
import { QuestionBankHeader } from "./question-bank/question-bank-header";
import { QuestionBankTabsAndSubjects } from "./question-bank/question-bank-tabs-and-subjects";
import { QuestionBankList } from "./question-bank/question-bank-list";
import { useQuestionBank } from "./question-bank/use-question-bank";

export function QuestionBankManager() {
  const {
    questions,
    tests,
    draft,
    setDraft,
    query,
    setQuery,
    selected,
    setSelected,
    tab,
    setTab,
    subjectFilter,
    setSubjectFilter,
    editingId,
    editorOpen,
    setEditorOpen,
    importOpen,
    setImportOpen,
    importFile,
    setImportFile,
    importReport,
    setImportReport,
    importBusy,
    busy,
    error,
    setError,
    notice,
    setNotice,
    load,
    patchOption,
    chooseCorrect,
    uploadImage,
    save,
    editQuestion,
    createQuestion,
    applyDemoQuestion,
    deleteQuestion,
    selectImportFile,
    importExcel,
    subjectCounts,
    showingExamples,
    libraryQuestions,
    visible,
  } = useQuestionBank();

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)]">
      <QuestionBankHeader
        questionsCount={questions.length}
        testsCount={tests.length}
        selectedCount={selected.length}
        onCreateQuestion={createQuestion}
        onOpenImport={() => {
          setImportOpen(true);
          setImportFile(null);
          setImportReport(null);
          setError("");
        }}
      />

      <QuestionImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        importFile={importFile}
        selectImportFile={selectImportFile}
        importReport={importReport}
        setImportReport={setImportReport}
        setImportFile={setImportFile}
        importBusy={importBusy}
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
          className={`mx-5 mt-5 flex items-center justify-between rounded-xl border p-3 text-sm sm:mx-7 ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
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
            tab={tab}
            onTabChange={setTab}
            questionsCount={questions.length}
            testsCount={tests.length}
            subjectFilter={subjectFilter}
            onSubjectChange={setSubjectFilter}
            subjectCounts={subjectCounts}
          />

          {tab === "bank" ? (
            <QuestionBankList
              subjectFilter={subjectFilter}
              showingExamples={showingExamples}
              visibleCount={visible.length}
              query={query}
              onQueryChange={setQuery}
              busy={busy}
              libraryQuestions={libraryQuestions}
              onEdit={(q) =>
                showingExamples ? applyDemoQuestion(q) : editQuestion(q)
              }
              onDelete={
                showingExamples
                  ? undefined
                  : (q) => void deleteQuestion(q)
              }
            />
          ) : (
            <MockTestsBuilder
              tests={tests}
              questions={questions}
              selected={selected}
              onSelectionChange={setSelected}
              onCreated={load}
              onError={setError}
              onNotice={setNotice}
            />
          )}
        </Stack>
      </div>
    </section>
  );
}
