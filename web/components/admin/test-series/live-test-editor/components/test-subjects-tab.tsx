"use client";

import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ExamPatternConfigResponse,
  SubjectAllocationItem,
} from "../../types";
import type { EditorFormState } from "../test-editor.types";

interface TestSubjectsTabProps {
  form: EditorFormState;
  examConfig: ExamPatternConfigResponse;
  hasAttempts: boolean;
  subjectAllocationTotal: number;
  allocationErrors: string[];
  expandedSubjects: Record<string, boolean>;
  setExpandedSubjects: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  chapterSearch: Record<string, string>;
  setChapterSearch: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  updateForm: (updater: (prev: EditorFormState) => EditorFormState) => void;
}

export function TestSubjectsTab({
  form,
  examConfig,
  hasAttempts,
  subjectAllocationTotal,
  allocationErrors,
  expandedSubjects,
  setExpandedSubjects,
  chapterSearch,
  setChapterSearch,
  updateForm,
}: TestSubjectsTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">
          {form.examPatternMode === "DEFAULT_NEET"
            ? "Managed by Default NEET Pattern. Disable toggle in Test Details to customize."
            : "Enable subjects and configure chapter allocations."}
        </span>
        <Badge variant="outline">Total: {subjectAllocationTotal} Qs</Badge>
      </div>

      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {form.subjectAllocations.map((sub) => {
          const meta = examConfig.subjects.find(
            (m) => m.courseSubjectId === sub.courseSubjectId,
          );
          const chapters = meta?.chapters ?? [];
          const isExpanded = Boolean(expandedSubjects[sub.courseSubjectId]);
          const q = (chapterSearch[sub.courseSubjectId] ?? "").toLowerCase();
          const filteredChapters = chapters.filter((c) =>
            c.title.toLowerCase().includes(q),
          );
          const isLocked =
            form.examPatternMode === "DEFAULT_NEET" || hasAttempts;

          const updateSub = (
            fn: (s: SubjectAllocationItem) => SubjectAllocationItem,
          ) =>
            updateForm((p) => ({
              ...p,
              subjectAllocations: p.subjectAllocations.map((item) =>
                item.courseSubjectId === sub.courseSubjectId ? fn(item) : item,
              ),
            }));

          return (
            <div key={sub.courseSubjectId} className="p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Checkbox
                    checked={sub.enabled}
                    disabled={isLocked}
                    onCheckedChange={(v) =>
                      updateSub((prev) => ({
                        ...prev,
                        enabled: Boolean(v),
                        questionCount: Boolean(v)
                          ? prev.questionCount || 15
                          : 0,
                      }))
                    }
                  />
                  {sub.subjectName}
                  <span className="font-normal text-[11px] text-slate-400">
                    ({meta?.availableQuestions ?? 0} avail)
                  </span>
                </label>

                {sub.enabled && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Select
                      value={sub.chapterMode}
                      disabled={isLocked}
                      onValueChange={(val) =>
                        val &&
                        updateSub((prev) => ({
                          ...prev,
                          chapterMode: val as "ALL" | "SELECTED",
                          chapterIds:
                            val === "ALL"
                              ? chapters.map((c) => c.id)
                              : prev.chapterIds,
                        }))
                      }
                    >
                      <SelectTrigger className="h-7 w-auto min-w-[152px] px-2.5 text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Chapters</SelectItem>
                        <SelectItem value="SELECTED">
                          Selected Chapters
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      min={0}
                      max={meta?.availableQuestions ?? 500}
                      value={sub.questionCount}
                      disabled={isLocked}
                      onChange={(e) =>
                        updateSub((prev) => ({
                          ...prev,
                          questionCount: Math.max(
                            0,
                            parseInt(e.target.value || "0", 10),
                          ),
                        }))
                      }
                      className="h-7 w-16 text-xs"
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      onClick={() =>
                        setExpandedSubjects((prev) => ({
                          ...prev,
                          [sub.courseSubjectId]: !isExpanded,
                        }))
                      }
                    >
                      {isExpanded ? (
                        <ChevronDown className="mr-1 size-3" />
                      ) : (
                        <ChevronRight className="mr-1 size-3" />
                      )}
                      Chapters
                    </Button>
                  </div>
                )}
              </div>

              {sub.enabled && isExpanded && (
                <div className="mt-2.5 space-y-2 rounded-lg bg-slate-50 p-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="relative w-44">
                      <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={chapterSearch[sub.courseSubjectId] ?? ""}
                        onChange={(e) =>
                          setChapterSearch((prev) => ({
                            ...prev,
                            [sub.courseSubjectId]: e.target.value,
                          }))
                        }
                        placeholder="Search chapters..."
                        className="h-7 bg-white pl-6.5 pr-7 text-[11px]"
                      />
                      {chapterSearch[sub.courseSubjectId] && (
                        <button
                          type="button"
                          onClick={() =>
                            setChapterSearch((prev) => ({
                              ...prev,
                              [sub.courseSubjectId]: "",
                            }))
                          }
                          aria-label="Clear chapter search"
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>
                    {!isLocked && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Select
                          value={sub.chapterAllocationMode}
                          onValueChange={(val) =>
                            val &&
                            updateSub((prev) => ({
                              ...prev,
                              chapterAllocationMode: val as
                                | "AUTOMATIC"
                                | "MANUAL",
                            }))
                          }
                        >
                          <SelectTrigger className="h-7 w-auto min-w-[148px] bg-white px-2.5 text-[11px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AUTOMATIC">
                              Auto Distribute
                            </SelectItem>
                            <SelectItem value="MANUAL">
                              Manual Counts
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[10px]"
                          onClick={() =>
                            updateSub((prev) => ({
                              ...prev,
                              chapterMode: "SELECTED",
                              chapterIds: chapters.map((c) => c.id),
                            }))
                          }
                        >
                          Select All
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="max-h-44 space-y-1 overflow-y-auto">
                    {filteredChapters.map((ch) => {
                      const isChecked =
                        sub.chapterMode === "ALL" ||
                        sub.chapterIds.includes(ch.id);
                      const manualCount =
                        sub.chapterAllocations.find(
                          (a) => a.chapterId === ch.id,
                        )?.count ?? 0;

                      return (
                        <div
                          key={ch.id}
                          className="flex items-center justify-between gap-2 rounded bg-white px-2 py-1 text-[11px]"
                        >
                          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                            <Checkbox
                              checked={isChecked}
                              disabled={isLocked}
                              onCheckedChange={(v) => {
                                updateSub((prev) => {
                                  const baseIds =
                                    prev.chapterMode === "ALL"
                                      ? chapters.map((c) => c.id)
                                      : prev.chapterIds;
                                  const nextIds = Boolean(v)
                                    ? Array.from(new Set([...baseIds, ch.id]))
                                    : baseIds.filter((id) => id !== ch.id);
                                  return {
                                    ...prev,
                                    chapterMode: "SELECTED",
                                    chapterIds: nextIds,
                                    chapterAllocations: Boolean(v)
                                      ? prev.chapterAllocations
                                      : prev.chapterAllocations.filter(
                                          (a) => a.chapterId !== ch.id,
                                        ),
                                  };
                                });
                              }}
                            />
                            <span className="truncate">{ch.title}</span>
                          </label>
                          <span className="text-[10px] text-slate-400">
                            ({ch.availableQuestions})
                          </span>
                          {!isLocked &&
                            sub.chapterAllocationMode === "MANUAL" &&
                            isChecked && (
                              <Input
                                type="number"
                                min={0}
                                max={ch.availableQuestions}
                                value={manualCount}
                                onChange={(e) => {
                                  const val = Math.max(
                                    0,
                                    parseInt(e.target.value || "0", 10),
                                  );
                                  updateSub((prev) => {
                                    const others =
                                      prev.chapterAllocations.filter(
                                        (a) => a.chapterId !== ch.id,
                                      );
                                    return {
                                      ...prev,
                                      chapterAllocations:
                                        val > 0
                                          ? [
                                              ...others,
                                              { chapterId: ch.id, count: val },
                                            ]
                                          : others,
                                    };
                                  });
                                }}
                                className="h-6 w-12 text-[11px]"
                              />
                            )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allocationErrors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
          {allocationErrors.map((err, i) => (
            <div key={i}>• {err}</div>
          ))}
        </div>
      )}
    </div>
  );
}
