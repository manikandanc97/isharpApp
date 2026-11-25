"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Ban,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Image as ImageIcon,
  LoaderCircle,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { request } from "@/components/question-bank/helpers";
import type { PoolListResponse, PoolQuestionItem } from "./demo-admin.types";

interface Props {
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
  onPoolChanged: () => void;
}

interface QuestionPreviewData {
  id: string;
  externalId: string;
  type: string;
  difficulty: string;
  textEn: string | null;
  textTa: string | null;
  questionImageUrl: string | null;
  solutionEn: string | null;
  solutionTa: string | null;
  solutionImageUrl: string | null;
  numericalAnswer: string | null;
  chapter?: { title: string } | null;
  courseSubject?: { subject?: { name: string } | null } | null;
  options: Array<{
    id: string;
    label: string;
    textEn: string | null;
    textTa: string | null;
    imageUrl: string | null;
    isCorrect: boolean;
    position: number;
  }>;
}

export function DemoQuestionPoolTab({ onNotice, onError, onPoolChanged }: Props) {
  const [data, setData] = useState<PoolListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);

  // Filters
  const [page, setPage] = useState(1);
  const [queryInput, setQueryInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [subject, setSubject] = useState("ALL");
  const [difficulty, setDifficulty] = useState("ALL");
  const [language, setLanguage] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [mediaFilter, setMediaFilter] = useState("ALL");
  const [activeFilter, setActiveFilter] = useState("ACTIVE");
  const [approvalFilter, setApprovalFilter] = useState("ALL");
  const [usageFilter, setUsageFilter] = useState("ALL");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAllFiltered, setSelectAllFiltered] = useState(false);

  // Preview Modal
  const [previewData, setPreviewData] = useState<QuestionPreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(queryInput);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  const currentFilters = useCallback(
    () => ({
      page,
      limit: 25,
      query: debouncedQuery || undefined,
      subject: subject !== "ALL" ? subject : undefined,
      difficulty: difficulty !== "ALL" ? difficulty : undefined,
      language: language !== "ALL" ? language : undefined,
      type: type !== "ALL" ? type : undefined,
      mediaFilter: mediaFilter !== "ALL" ? mediaFilter : undefined,
      activeFilter,
      approvalFilter,
      usageFilter,
    }),
    [
      page,
      debouncedQuery,
      subject,
      difficulty,
      language,
      type,
      mediaFilter,
      activeFilter,
      approvalFilter,
      usageFilter,
    ],
  );

  const loadPool = useCallback(async () => {
    setLoading(true);
    try {
      const f = currentFilters();
      const params = new URLSearchParams();
      params.set("page", String(f.page));
      params.set("limit", String(f.limit));
      if (f.query) params.set("query", f.query);
      if (f.subject) params.set("subject", f.subject);
      if (f.difficulty) params.set("difficulty", f.difficulty);
      if (f.language) params.set("language", f.language);
      if (f.type) params.set("type", f.type);
      if (f.mediaFilter) params.set("mediaFilter", f.mediaFilter);
      params.set("activeFilter", f.activeFilter);
      params.set("approvalFilter", f.approvalFilter);
      params.set("usageFilter", f.usageFilter);

      const res = await request<PoolListResponse>(
        `demo-test/pool?${params.toString()}`,
      );
      setData(res);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to load question pool");
    } finally {
      setLoading(false);
    }
  }, [currentFilters, onError]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPool(), 0);
    return () => window.clearTimeout(timer);
  }, [loadPool]);

  const runBulkAction = async (
    action: "APPROVE" | "REMOVE" | "RESTRICT" | "UNRESTRICT",
    idsOverride?: string[],
  ) => {
    const ids = idsOverride ?? selectedIds;
    if (!selectAllFiltered && ids.length === 0) return;

    setMutating(true);
    try {
      const res = await request<{ updatedCount: number; skippedCount: number }>(
        "demo-test/pool/bulk",
        {
          method: "POST",
          body: JSON.stringify({
            action,
            questionIds: selectAllFiltered && !idsOverride ? undefined : ids,
            selectAllFiltered: selectAllFiltered && !idsOverride,
            filters: selectAllFiltered && !idsOverride ? currentFilters() : undefined,
          }),
        },
      );
      onNotice(
        `${action}: ${res.updatedCount} question(s) updated${res.skippedCount ? ` (${res.skippedCount} ineligible skipped)` : ""}.`,
      );
      setSelectedIds([]);
      setSelectAllFiltered(false);
      await loadPool();
      onPoolChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Bulk pool update failed");
    } finally {
      setMutating(false);
    }
  };

  const openPreview = async (questionId: string) => {
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const res = await request<QuestionPreviewData>(
        `demo-test/pool/${questionId}/preview`,
      );
      setPreviewData(res);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to load question preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const items = data?.items ?? [];
  const allPageSelected =
    items.length > 0 && items.every((item) => selectedIds.includes(item.id));

  const togglePageSelection = () => {
    setSelectAllFiltered(false);
    if (allPageSelected) {
      const pageIds = new Set(items.map((i) => i.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const merged = new Set([...selectedIds, ...items.map((i) => i.id)]);
      setSelectedIds([...merged]);
    }
  };

  const toggleItem = (id: string) => {
    setSelectAllFiltered(false);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Search ID, English or Tamil text..."
              className="h-9 rounded-xl border-slate-300 pl-8 pr-8 text-xs"
            />
            {queryInput && (
              <button
                type="button"
                onClick={() => setQueryInput("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              disabled={mutating || (!selectAllFiltered && selectedIds.length === 0)}
              onClick={() => void runBulkAction("APPROVE")}
              className="gap-1.5 rounded-full bg-emerald-600 text-xs text-white hover:bg-emerald-700"
            >
              <CheckCircle2 className="size-3.5" /> Approve Selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={mutating || (!selectAllFiltered && selectedIds.length === 0)}
              onClick={() => void runBulkAction("REMOVE")}
              className="gap-1.5 rounded-full text-xs text-rose-700 hover:bg-rose-50"
            >
              <Trash2 className="size-3.5" /> Remove from Pool
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={mutating || (!selectAllFiltered && selectedIds.length === 0)}
              onClick={() => void runBulkAction("RESTRICT")}
              className="gap-1.5 rounded-full text-xs"
            >
              <Ban className="size-3.5" /> Restrict
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          <FilterSelect
            value={subject}
            onChange={(v) => { setSubject(v); setPage(1); }}
            options={[
              ["ALL", "All Subjects"],
              ["PHYSICS", "Physics"],
              ["CHEMISTRY", "Chemistry"],
              ["BIOLOGY", "Biology"],
            ]}
          />
          <FilterSelect
            value={difficulty}
            onChange={(v) => { setDifficulty(v); setPage(1); }}
            options={[
              ["ALL", "All Difficulty"],
              ["EASY", "Easy"],
              ["MEDIUM", "Medium"],
              ["HARD", "Hard"],
            ]}
          />
          <FilterSelect
            value={language}
            onChange={(v) => { setLanguage(v); setPage(1); }}
            options={[
              ["ALL", "All Languages"],
              ["en", "English"],
              ["ta", "Bilingual (TA+EN)"],
            ]}
          />
          <FilterSelect
            value={type}
            onChange={(v) => { setType(v); setPage(1); }}
            options={[
              ["ALL", "All Types"],
              ["SINGLE_CORRECT", "Single Correct"],
              ["ASSERTION_REASON", "Assertion & Reason"],
              ["STATEMENT_BASED", "Statement-Based"],
              ["NUMERICAL", "Numerical"],
              ["MATCH_FOLLOWING", "Match Following"],
            ]}
          />
          <FilterSelect
            value={mediaFilter}
            onChange={(v) => { setMediaFilter(v); setPage(1); }}
            options={[
              ["ALL", "All Media"],
              ["TEXT_ONLY", "Text Only"],
              ["DIAGRAM", "Diagram-Based"],
              ["IMAGE_OPTIONS", "Image Options"],
            ]}
          />
          <FilterSelect
            value={activeFilter}
            onChange={(v) => { setActiveFilter(v); setPage(1); }}
            options={[
              ["ACTIVE", "Active Only"],
              ["INACTIVE", "Inactive Only"],
              ["ALL", "Active & Inactive"],
            ]}
          />
          <FilterSelect
            value={approvalFilter}
            onChange={(v) => { setApprovalFilter(v); setPage(1); }}
            options={[
              ["ALL", "All Approval"],
              ["APPROVED", "Approved in Pool"],
              ["UNAPPROVED", "Not in Pool"],
              ["RESTRICTED", "Restricted"],
            ]}
          />
          <FilterSelect
            value={usageFilter}
            onChange={(v) => { setUsageFilter(v); setPage(1); }}
            options={[
              ["ALL", "All Usage"],
              ["UNUSED", "Unused (0)"],
              ["RARELY_USED", "Rarely Used (1-4)"],
              ["FREQUENT", "Frequently Used (5+)"],
            ]}
          />
        </div>

        {(selectedIds.length > 0 || selectAllFiltered) && data && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-xs text-indigo-900">
            <span>
              {selectAllFiltered
                ? `All ${data.total} matching filtered question(s) selected.`
                : `${selectedIds.length} question(s) selected on current selection.`}
            </span>
            <div className="flex items-center gap-3">
              {!selectAllFiltered && data.total > items.length && (
                <button
                  type="button"
                  onClick={() => setSelectAllFiltered(true)}
                  className="font-bold text-indigo-700 underline hover:text-indigo-900"
                >
                  Select all {data.total} matching filtered results
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedIds([]);
                  setSelectAllFiltered(false);
                }}
                className="font-semibold text-slate-600 hover:text-slate-900"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Enterprise Data Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-3xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="w-10 px-3 py-3">
                  <Checkbox
                    checked={allPageSelected}
                    onCheckedChange={togglePageSelection}
                    aria-label="Select all on page"
                  />
                </th>
                <th className="px-3 py-3">ID &amp; Question</th>
                <th className="px-3 py-3">Subject / Chapter</th>
                <th className="px-3 py-3">Difficulty &amp; Type</th>
                <th className="px-3 py-3">Lang / Media</th>
                <th className="px-3 py-3">Pool Status</th>
                <th className="px-3 py-3">Usage</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <LoaderCircle className="mx-auto mb-2 size-5 animate-spin text-indigo-600" />
                    Loading question pool...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No questions match your current filters.
                  </td>
                </tr>
              ) : (
                items.map((item: PoolQuestionItem) => {
                  const isChecked = selectAllFiltered || selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-slate-50/70 ${isChecked ? "bg-indigo-50/30" : ""}`}
                    >
                      <td className="px-3 py-3 align-top">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleItem(item.id)}
                          aria-label={`Select ${item.externalId}`}
                        />
                      </td>
                      <td className="max-w-xs px-3 py-3 align-top">
                        <div className="font-mono text-3xs font-bold text-indigo-700">
                          {item.externalId}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-700">
                          {item.textPreview || "(Image-based question)"}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="font-semibold text-slate-900">{item.subject}</div>
                        <div className="text-3xs text-slate-500">
                          {item.chapterTitle || "—"}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <Badge variant="outline" className="text-3xs">
                          {item.difficulty}
                        </Badge>
                        <div className="mt-1 text-3xs text-slate-500">
                          {item.type.replaceAll("_", " ")}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <Badge
                          variant="outline"
                          className={
                            item.languageAvailability === "BILINGUAL"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : item.languageAvailability === "ENGLISH"
                                ? "border-slate-200 bg-slate-50 text-slate-700"
                                : "border-rose-200 bg-rose-50 text-rose-700"
                          }
                        >
                          {item.languageAvailability}
                        </Badge>
                        {(item.hasQuestionImage || item.hasOptionImages) && (
                          <div className="mt-1 flex items-center gap-1 text-3xs text-slate-500">
                            <ImageIcon className="size-3" /> Images
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        {item.isRestrictedForDemo ? (
                          <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">
                            Restricted
                          </Badge>
                        ) : item.isApproved ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                            <Check className="mr-1 size-3" /> Approved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500">
                            Not in Pool
                          </Badge>
                        )}
                        {!item.isDemoEligible && (
                          <p className="mt-1 text-3xs text-rose-600">
                            {item.eligibilityIssues[0]}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="font-semibold text-slate-800">
                          {item.globalExposureCount}x
                        </div>
                        <div className="text-3xs text-slate-400">
                          {item.lastUsedAt
                            ? new Date(item.lastUsedAt).toLocaleDateString()
                            : "Never"}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void openPreview(item.id)}
                            title="Preview question"
                            className="h-7 px-2 text-xs"
                          >
                            <Eye className="size-3.5" />
                          </Button>
                          {item.isApproved ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={mutating}
                              onClick={() => void runBulkAction("REMOVE", [item.id])}
                              className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
                            >
                              Remove
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={mutating || !item.isDemoEligible}
                              onClick={() => void runBulkAction("APPROVE", [item.id])}
                              className="h-7 px-2 text-xs text-emerald-700 hover:bg-emerald-50"
                            >
                              Approve
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-600">
            <span>
              Showing page <strong>{data.page}</strong> of{" "}
              <strong>{data.totalPages}</strong> ({data.total} total questions)
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 rounded-lg px-2.5 text-xs"
              >
                <ChevronLeft className="size-3.5" /> Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                className="h-8 rounded-lg px-2.5 text-xs"
              >
                Next <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Admin Preview Modal */}
      <Dialog
        open={previewLoading || Boolean(previewData)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewData(null);
            setPreviewLoading(false);
          }
        }}
      >
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-indigo-600" />
              Admin Question Preview{" "}
              {previewData && (
                <Badge variant="outline" className="font-mono text-2xs">
                  {previewData.externalId}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {previewLoading ? (
            <div className="py-10 text-center text-xs text-slate-500">
              <LoaderCircle className="mx-auto mb-2 size-5 animate-spin text-indigo-600" />
              Loading question details...
            </div>
          ) : (
            previewData && (
              <div className="space-y-4 text-xs">
                <div className="flex flex-wrap gap-2">
                  <Badge>{previewData.courseSubject?.subject?.name ?? "General"}</Badge>
                  <Badge variant="outline">{previewData.difficulty}</Badge>
                  <Badge variant="outline">{previewData.type}</Badge>
                  {previewData.chapter?.title && (
                    <Badge variant="outline">{previewData.chapter.title}</Badge>
                  )}
                </div>

                {previewData.textEn && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <p className="mb-1 text-3xs font-bold uppercase text-slate-500">
                      English
                    </p>
                    <p className="whitespace-pre-wrap text-slate-900">
                      {previewData.textEn}
                    </p>
                  </div>
                )}

                {previewData.textTa && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <p className="mb-1 text-3xs font-bold uppercase text-slate-500">
                      Tamil
                    </p>
                    <p className="whitespace-pre-wrap text-slate-900">
                      {previewData.textTa}
                    </p>
                  </div>
                )}

                {previewData.questionImageUrl && (
                  <div>
                    <img
                      src={previewData.questionImageUrl}
                      alt="Question diagram"
                      className="max-h-56 rounded-xl border border-slate-200 object-contain"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-3xs font-bold uppercase text-slate-500">
                    Options (Correct Answer Highlighted for Admin)
                  </p>
                  {previewData.options.map((opt, idx) => (
                    <div
                      key={opt.id}
                      className={`rounded-xl border p-2.5 ${opt.isCorrect ? "border-emerald-300 bg-emerald-50" : "border-slate-200"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold">
                          ({idx + 1}) {opt.textEn || ""}
                        </span>
                        {opt.isCorrect && (
                          <Badge className="bg-emerald-600 text-white">Correct</Badge>
                        )}
                      </div>
                      {opt.textTa && (
                        <p className="mt-0.5 text-slate-600">{opt.textTa}</p>
                      )}
                      {opt.imageUrl && (
                        <img
                          src={opt.imageUrl}
                          alt={`Option ${idx + 1}`}
                          className="mt-1.5 max-h-24 rounded border border-slate-200 object-contain"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {(previewData.solutionEn ||
                  previewData.solutionTa ||
                  previewData.solutionImageUrl) && (
                  <div className="space-y-2 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3">
                    <p className="text-3xs font-bold uppercase text-indigo-700">
                      Solution
                    </p>
                    {previewData.solutionEn && (
                      <p className="whitespace-pre-wrap text-slate-800">
                        {previewData.solutionEn}
                      </p>
                    )}
                    {previewData.solutionTa && (
                      <p className="whitespace-pre-wrap text-slate-700">
                        {previewData.solutionTa}
                      </p>
                    )}
                    {previewData.solutionImageUrl && (
                      <img
                        src={previewData.solutionImageUrl}
                        alt="Solution"
                        className="max-h-48 rounded border border-slate-200 object-contain"
                      />
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (val: string) => void;
  options: [string, string][];
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v);
      }}
    >
      <SelectTrigger className="h-8 rounded-xl border-slate-300 bg-white px-2.5 text-2xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([val, label]) => (
          <SelectItem key={val} value={val} className="text-xs">
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
