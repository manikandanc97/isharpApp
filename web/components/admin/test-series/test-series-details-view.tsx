"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  FileQuestion,
  Layers,
  Loader2,
  MoreVertical,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { IndividualTest, IndividualTestStatus, TestSeries, TestSeriesCategory } from "./types";
import { TestEditorDialog } from "./test-editor-dialog";
import { QuestionSelectorDialog } from "./question-selector-dialog";
import { TestSeriesDialog } from "./test-series-dialog";
import { BlueprintBuilderDialog } from "./blueprint-builder-dialog";

interface TestSeriesDetailsViewProps {
  series: TestSeries;
  categories: TestSeriesCategory[];
  onBack: () => void;
  onUpdateSeries: (data: Partial<TestSeries>) => Promise<void>;
  onAddTest: (testData: Partial<IndividualTest>) => Promise<void>;
  onUpdateTest: (testId: string, testData: Partial<IndividualTest>) => Promise<void>;
  onDeleteTest: (testId: string) => Promise<void>;
  onDuplicateTest: (testId: string) => Promise<void>;
  onReorderTests: (orderedTestIds: string[]) => Promise<void>;
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}

export function TestSeriesDetailsView({
  series,
  categories,
  onBack,
  onUpdateSeries,
  onAddTest,
  onUpdateTest,
  onDeleteTest,
  onDuplicateTest,
  onReorderTests,
  onNotice,
  onError,
}: TestSeriesDetailsViewProps) {
  const [seriesDialogOpen, setSeriesDialogOpen] = useState(false);
  const [testEditorOpen, setTestEditorOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<IndividualTest | null>(null);
  const [questionSelectorOpen, setQuestionSelectorOpen] = useState(false);
  const [selectedTestForQuestions, setSelectedTestForQuestions] = useState<IndividualTest | null>(null);
  const [blueprintDialogOpen, setBlueprintDialogOpen] = useState(false);
  const [selectedTestForBlueprint, setSelectedTestForBlueprint] = useState<IndividualTest | null>(null);
  const [mutatingTestId, setMutatingTestId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const tests = series.tests || [];

  const handleOpenAddTest = () => {
    setEditingTest(null);
    setTestEditorOpen(true);
  };

  const handleOpenEditTest = (test: IndividualTest) => {
    setEditingTest(test);
    setTestEditorOpen(true);
  };

  const handleOpenQuestions = (test: IndividualTest) => {
    setSelectedTestForQuestions(test);
    setQuestionSelectorOpen(true);
  };

  const handleOpenBlueprint = (test: IndividualTest) => {
    setSelectedTestForBlueprint(test);
    setBlueprintDialogOpen(true);
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tests.length) return;

    const reordered = [...tests];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    setIsReordering(true);
    try {
      await onReorderTests(reordered.map((t) => t.id));
      onNotice("Test sequence updated successfully");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to reorder tests");
    } finally {
      setIsReordering(false);
    }
  };

  const handleTogglePublishTest = async (test: IndividualTest) => {
    const nextStatus: IndividualTestStatus =
      test.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setMutatingTestId(test.id);
    try {
      await onUpdateTest(test.id, { status: nextStatus });
      onNotice(`Test "${test.name}" marked as ${nextStatus}`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update test status");
    } finally {
      setMutatingTestId(null);
    }
  };

  const handleSaveQuestions = async (
    questionIds: string[]
  ) => {
    if (!selectedTestForQuestions) return;
    // Preserve configured target totalQuestions and totalMarks from the blueprint
    await onUpdateTest(selectedTestForQuestions.id, {
      questionIds,
    });
  };

  const category = categories.find((c) => c.id === series.categoryId);

  return (
    <div className="space-y-6">
      {/* Back button and breadcrumb navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          onClick={onBack}
          className="flex cursor-pointer items-center gap-1 font-semibold text-slate-700 hover:text-slate-950 transition"
        >
          <ArrowLeft className="size-3.5" /> Back to Test Series
        </button>
        <span>/</span>
        <span className="font-medium text-slate-400 truncate">{series.name}</span>
      </div>

      {/* Series Hero Details Banner */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-brand-blue border border-blue-200">
                {category?.name || "NEET Series"}
              </span>
              <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-3xs font-semibold text-slate-600">
                AY {series.academicYear}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-3xs font-bold ${
                  series.status === "PUBLISHED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : series.status === "DRAFT"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {series.status}
              </span>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {series.name}
            </h2>

            {series.description && (
              <p className="max-w-3xl text-xs text-slate-600 leading-relaxed">
                {series.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSeriesDialogOpen(true)}
              className="h-9 gap-1.5 rounded-full border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              <Edit2 className="size-3.5" /> Edit Series
            </Button>
            <Button
              size="sm"
              onClick={handleOpenAddTest}
              className="h-9 gap-1.5 rounded-full bg-brand-red text-xs font-semibold text-white shadow-primary hover:bg-brand-red-hover"
            >
              <Plus className="size-3.5" /> Add Individual Test
            </Button>
          </div>
        </div>

        {/* Aggregate Series Specs Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <div>
            <span className="text-3xs font-semibold uppercase text-slate-500">Total Tests</span>
            <p className="text-lg font-bold text-slate-900">{tests.length} Papers</p>
          </div>
          <div>
            <span className="text-3xs font-semibold uppercase text-slate-500">Total Marks</span>
            <p className="text-lg font-bold text-brand-blue">{series.totalMarks} Marks</p>
          </div>
          <div>
            <span className="text-3xs font-semibold uppercase text-slate-500">Standard Duration</span>
            <p className="text-lg font-bold text-slate-900">{series.durationMinutes} Mins</p>
          </div>
          <div>
            <span className="text-3xs font-semibold uppercase text-slate-500">Published Status</span>
            <p className="text-lg font-bold text-emerald-700">
              {tests.filter((t) => t.status === "PUBLISHED").length} / {tests.length} Active
            </p>
          </div>
        </div>
      </section>

      {/* Individual Tests Roster */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Individual Assessment Papers ({tests.length})
            </h3>
            <p className="text-xs text-slate-500">
              Reorder sequence, assign questions from Question Bank, and set exam timetable.
            </p>
          </div>
        </div>

        {tests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <FileQuestion className="mx-auto size-10 text-slate-300" />
            <h4 className="mt-3 text-sm font-bold text-slate-800">No tests created yet</h4>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Add chapter-wise, subject-wise or full-syllabus tests to this series.
            </p>
            <Button
              size="sm"
              onClick={handleOpenAddTest}
              className="mt-4 rounded-full bg-brand-red text-xs font-semibold text-white shadow-primary"
            >
              <Plus className="mr-1.5 size-3.5" /> Add First Test
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map((test, index) => {
              const qCount = test.questionIds?.length || test.totalQuestions || 0;

              return (
                <div
                  key={test.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition hover:border-slate-300 hover:shadow-card"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3">
                      {/* Order Controls */}
                      <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-slate-50 border border-slate-200 px-1 py-1 shrink-0">
                        <button
                          disabled={index === 0 || isReordering}
                          onClick={() => handleMove(index, "up")}
                          className="cursor-pointer rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-25"
                          title="Move up in sequence"
                        >
                          <ArrowUp className="size-3" />
                        </button>
                        <span className="font-mono text-3xs font-bold text-slate-700">
                          {test.orderIndex || index + 1}
                        </span>
                        <button
                          disabled={index === tests.length - 1 || isReordering}
                          onClick={() => handleMove(index, "down")}
                          className="cursor-pointer rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-25"
                          title="Move down in sequence"
                        >
                          <ArrowDown className="size-3" />
                        </button>
                      </div>

                      {/* Test Info */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500">
                            {test.code}
                          </span>
                          <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-3xs font-semibold text-brand-blue border border-indigo-100">
                            {test.testType}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-3xs font-bold ${
                              test.status === "PUBLISHED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : test.status === "SCHEDULED"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : test.status === "COMPLETED"
                                ? "bg-slate-100 text-slate-600 border border-slate-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {test.status}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900">{test.name}</h4>

                        {test.description && (
                          <p className="text-xs text-slate-500 line-clamp-1">{test.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-3xs text-slate-500">
                          <span className="flex items-center gap-1 font-semibold text-purple-700">
                            <FileQuestion className="size-3" />
                            {qCount} Questions ({test.totalMarks} Marks)
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {test.durationMinutes} Mins
                          </span>
                          {test.testDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {test.testDate} {test.startTime && `• ${test.startTime}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenQuestions(test)}
                        className="h-8 gap-1.5 rounded-full border-purple-200 bg-purple-50 text-xs font-semibold text-purple-700 hover:bg-purple-100"
                      >
                        <FileQuestion className="size-3.5" />
                        Manage Questions ({qCount})
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditTest(test)}
                        className="h-8 rounded-full border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          disabled={mutatingTestId === test.id}
                          className="grid size-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 outline-none cursor-pointer disabled:opacity-50"
                          aria-label="More actions"
                        >
                          {mutatingTestId === test.id ? (
                            <Loader2 className="size-4 animate-spin text-brand-red" />
                          ) : (
                            <MoreVertical className="size-4" />
                          )}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1.5 shadow-lg">
                          <DropdownMenuItem
                            onClick={() => handleOpenBlueprint(test)}
                            className="cursor-pointer text-xs font-medium"
                          >
                            <Layers className="mr-2 size-3.5 text-purple-600" /> Paper Blueprint
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleTogglePublishTest(test)}
                            className="cursor-pointer text-xs font-medium"
                          >
                            <CheckCircle2 className="mr-2 size-3.5 text-emerald-600" />
                            {test.status === "PUBLISHED" ? "Unpublish Test" : "Publish Test"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              setMutatingTestId(test.id);
                              try {
                                await onDuplicateTest(test.id);
                              } finally {
                                setMutatingTestId(null);
                              }
                            }}
                            className="cursor-pointer text-xs font-medium"
                          >
                            <Copy className="mr-2 size-3.5 text-blue-600" /> Duplicate Test
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={async () => {
                              if (confirm(`Delete test "${test.name}"?`)) {
                                setMutatingTestId(test.id);
                                try {
                                  await onDeleteTest(test.id);
                                } finally {
                                  setMutatingTestId(null);
                                }
                              }
                            }}
                            className="cursor-pointer text-xs font-medium text-rose-600 hover:text-rose-700"
                          >
                            <Trash2 className="mr-2 size-3.5" /> Delete Test
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Edit Series Dialog */}
      <TestSeriesDialog
        open={seriesDialogOpen}
        onOpenChange={setSeriesDialogOpen}
        categories={categories}
        initialData={series}
        onSave={onUpdateSeries}
        onNotice={onNotice}
        onError={onError}
      />

      {/* Add / Edit Individual Test Dialog */}
      <TestEditorDialog
        open={testEditorOpen}
        onOpenChange={setTestEditorOpen}
        seriesName={series.name}
        initialData={editingTest}
        onSave={async (data) => {
          if (editingTest) {
            await onUpdateTest(editingTest.id, data);
          } else {
            await onAddTest(data);
          }
        }}
        onNotice={onNotice}
        onError={onError}
      />

      {/* Question Selector Dialog */}
      {selectedTestForQuestions && (
        <QuestionSelectorDialog
          open={questionSelectorOpen}
          onOpenChange={setQuestionSelectorOpen}
          test={selectedTestForQuestions}
          onSaveQuestions={handleSaveQuestions}
          onNotice={onNotice}
          onError={onError}
        />
      )}

      {/* Blueprint Builder Dialog */}
      {selectedTestForBlueprint && (
        <BlueprintBuilderDialog
          open={blueprintDialogOpen}
          onOpenChange={setBlueprintDialogOpen}
          test={selectedTestForBlueprint}
          onNotice={onNotice}
          onError={onError}
        />
      )}
    </div>
  );
}
