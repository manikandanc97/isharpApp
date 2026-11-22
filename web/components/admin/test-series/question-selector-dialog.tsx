"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Eye,
  FileQuestion,
  Filter,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDisplayQuestionId } from "@/lib/question-format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import type { Question } from "@/components/question-bank/types";
import type { IndividualTest } from "./types";

interface QuestionSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: IndividualTest;
  onSaveQuestions: (questionIds: string[]) => Promise<void>;
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}

type SubjectCategory = "ALL" | "PHYSICS" | "CHEMISTRY" | "BIOLOGY";

export function QuestionSelectorDialog({
  open,
  onOpenChange,
  test,
  onSaveQuestions,
  onNotice,
  onError,
}: QuestionSelectorDialogProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sectionMap, setSectionMap] = useState<Record<string, string>>({});
  const [subjectFilter, setSubjectFilter] = useState<SubjectCategory>("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null);

  // 1. Determine Blueprint Quotas based on NEET UG 2026 standards (Physics 45, Chemistry 45, Biology 90)
  const isNeetFullMock =
    test.testType === "FULL_SYLLABUS" || test.testType === "GRAND_TEST";

  const quotas = useMemo(() => {
    // If blueprint items are explicitly assigned to test, derive quotas from them
    if (test.blueprints && test.blueprints.length > 0) {
      let phy = 0;
      let che = 0;
      let bio = 0;
      test.blueprints.forEach((b) => {
        const code = (b.subjectCode || "").toUpperCase();
        const count = b.totalQuestions || b.mandatoryCount || 0;
        if (code === "PHY" || code.includes("PHYSIC")) phy += count;
        else if (code === "CHE" || code.includes("CHEMIS")) che += count;
        else bio += count;
      });
      const total = phy + che + bio || test.totalQuestions || 180;
      return {
        physics: phy || (isNeetFullMock ? 45 : Math.round(total / 3)),
        chemistry: che || (isNeetFullMock ? 45 : Math.round(total / 3)),
        biology: bio || (isNeetFullMock ? 90 : Math.round(total / 3)),
        totalRequired: total,
      };
    }

    // Official NEET UG 2026 default examination blueprint (3 subjects: 45 + 45 + 90 = 180)
    if (isNeetFullMock) {
      return {
        physics: 45,
        chemistry: 45,
        biology: 90,
        totalRequired: 180,
      };
    }

    // Subject-wise test
    if (test.testType === "SUBJECT_WISE") {
      const qCount = test.totalQuestions || 45;
      return {
        physics: qCount,
        chemistry: qCount,
        biology: qCount,
        totalRequired: qCount,
      };
    }

    // Chapter-wise, unit test, part test, revision test, or custom
    const customCount = test.totalQuestions || 45;
    return {
      physics: customCount,
      chemistry: customCount,
      biology: customCount,
      totalRequired: customCount,
    };
  }, [test, isNeetFullMock]);

  // Load questions from actual Question Bank API and existing assigned questions
  useEffect(() => {
    if (!open) return;

    async function loadData() {
      setLoading(true);
      setQuotaWarning(null);
      try {
        // 1. Fetch questions from actual Question Bank API
        const res = await fetch("/api/admin/questions?limit=500", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const items: Question[] = Array.isArray(data) ? data : data.questions || [];
          setQuestions(items);
        } else {
          setQuestions([]);
        }

        // 2. Fetch existing assigned questions for this test from backend
        const testRes = await fetch(
          `/api/admin/test-series/${test.testSeriesId}/tests/${test.id}`,
          { cache: "no-store" }
        );
        if (testRes.ok) {
          const testData = await testRes.json();
          if (testData.questions && Array.isArray(testData.questions)) {
            const assignedIds = testData.questions.map((q: any) => q.questionId || q.id);
            setSelectedIds(assignedIds);
            const initialSections: Record<string, string> = {};
            testData.questions.forEach((q: any) => {
              if (q.questionId && q.section) {
                initialSections[q.questionId] = q.section;
              }
            });
            setSectionMap(initialSections);
            return;
          }
        }

        // Default: zero auto-selected questions for new test papers
        setSelectedIds(test.questionIds || []);
      } catch (err) {
        setQuestions([]);
        onError(err instanceof Error ? err.message : "Failed to load questions from Question Bank");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [open, test]);

  // Helper to resolve physics vs chemistry vs biology (strictly Biology, no Botany/Zoology split)
  const resolveSubject = (q: Question): "PHYSICS" | "CHEMISTRY" | "BIOLOGY" => {
    const code = (q.courseSubject?.subject?.code || "").toUpperCase();
    const name = (q.courseSubject?.subject?.name || "").toUpperCase();

    if (code.includes("PHY") || name.includes("PHYSIC")) return "PHYSICS";
    if (code.includes("CHE") || name.includes("CHEMIS")) return "CHEMISTRY";
    return "BIOLOGY";
  };

  // Group all questions by subject for inventory and shortage check
  const questionInventory = useMemo(() => {
    let phy = 0;
    let che = 0;
    let bio = 0;
    questions.forEach((q) => {
      const sub = resolveSubject(q);
      if (sub === "PHYSICS") phy++;
      else if (sub === "CHEMISTRY") che++;
      else bio++;
    });
    return {
      physics: phy,
      chemistry: che,
      biology: bio,
      total: questions.length,
    };
  }, [questions]);

  // Current selections grouped by subject
  const selectedCounts = useMemo(() => {
    const byId = new Map(questions.map((q) => [q.id, q]));
    let phy = 0;
    let che = 0;
    let bio = 0;
    selectedIds.forEach((id) => {
      const q = byId.get(id);
      if (!q) return;
      const sub = resolveSubject(q);
      if (sub === "PHYSICS") phy++;
      else if (sub === "CHEMISTRY") che++;
      else bio++;
    });
    return {
      physics: phy,
      chemistry: che,
      biology: bio,
      total: selectedIds.length,
    };
  }, [selectedIds, questions]);

  // Filtered question list
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const qSubj = resolveSubject(q);
      if (subjectFilter !== "ALL" && qSubj !== subjectFilter) return false;
      if (difficultyFilter !== "ALL" && q.difficulty !== difficultyFilter) return false;
      if (typeFilter !== "ALL" && q.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchText =
          (q.externalId?.toLowerCase() ?? "").includes(query) ||
          (q.textEn?.toLowerCase() ?? "").includes(query) ||
          (q.textTa?.toLowerCase() ?? "").includes(query) ||
          (q.chapter?.title?.toLowerCase() ?? "").includes(query);
        if (!matchText) return false;
      }
      return true;
    });
  }, [questions, subjectFilter, difficultyFilter, typeFilter, searchQuery]);

  const isSelected = (id: string) => selectedIds.includes(id);

  // Toggle selection with quota enforcement
  const toggleSelect = (q: Question) => {
    setQuotaWarning(null);
    if (isSelected(q.id)) {
      setSelectedIds((prev) => prev.filter((item) => item !== q.id));
      return;
    }

    // Check total capacity
    if (selectedIds.length >= quotas.totalRequired) {
      setQuotaWarning(
        `Total required question capacity (${quotas.totalRequired} Questions) has been reached. Deselect an existing question to add this item.`
      );
      return;
    }

    // Check subject capacity for NEET full mock (Physics 45, Chemistry 45, Biology 90)
    if (isNeetFullMock) {
      const sub = resolveSubject(q);
      if (sub === "PHYSICS" && selectedCounts.physics >= quotas.physics) {
        setQuotaWarning(
          `Physics quota full (${quotas.physics} / ${quotas.physics} selected). Deselect an existing Physics question first.`
        );
        return;
      }
      if (sub === "CHEMISTRY" && selectedCounts.chemistry >= quotas.chemistry) {
        setQuotaWarning(
          `Chemistry quota full (${quotas.chemistry} / ${quotas.chemistry} selected). Deselect an existing Chemistry question first.`
        );
        return;
      }
      if (sub === "BIOLOGY" && selectedCounts.biology >= quotas.biology) {
        setQuotaWarning(
          `Biology quota full (${quotas.biology} / ${quotas.biology} selected). Deselect an existing Biology question first.`
        );
        return;
      }
    }

    setSelectedIds((prev) => [...prev, q.id]);
  };

  // Quota-aware select all filtered
  const handleSelectAllFiltered = () => {
    setQuotaWarning(null);
    const unselectedFiltered = filteredQuestions.filter((q) => !isSelected(q.id));
    if (unselectedFiltered.length === 0) return;

    let availableSlots = quotas.totalRequired - selectedIds.length;
    if (availableSlots <= 0) {
      setQuotaWarning(`Total question capacity (${quotas.totalRequired}) already reached.`);
      return;
    }

    const toAdd: string[] = [];
    const currentCounts = { ...selectedCounts };

    for (const q of unselectedFiltered) {
      if (availableSlots <= 0) break;
      const sub = resolveSubject(q);

      if (isNeetFullMock) {
        if (sub === "PHYSICS" && currentCounts.physics >= quotas.physics) continue;
        if (sub === "CHEMISTRY" && currentCounts.chemistry >= quotas.chemistry) continue;
        if (sub === "BIOLOGY" && currentCounts.biology >= quotas.biology) continue;

        if (sub === "PHYSICS") currentCounts.physics++;
        else if (sub === "CHEMISTRY") currentCounts.chemistry++;
        else if (sub === "BIOLOGY") currentCounts.biology++;
      }

      toAdd.push(q.id);
      availableSlots--;
    }

    if (toAdd.length > 0) {
      setSelectedIds((prev) => [...prev, ...toAdd]);
      onNotice(`Selected ${toAdd.length} questions matching filter within blueprint quotas.`);
    } else {
      setQuotaWarning("Subject or paper quotas are full for the filtered questions.");
    }
  };

  // Deselect all filtered
  const handleDeselectAllFiltered = () => {
    setQuotaWarning(null);
    const filteredIdsSet = new Set(filteredQuestions.map((q) => q.id));
    setSelectedIds((prev) => prev.filter((id) => !filteredIdsSet.has(id)));
    onNotice(`Deselected filtered questions.`);
  };

  // Clear all selections
  const handleClearAll = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Remove all ${selectedIds.length} currently selected questions from this paper?`)) {
      setSelectedIds([]);
      setQuotaWarning(null);
      onNotice("All selections cleared.");
    }
  };

  // Calculations for display
  const requiredQuestions = quotas.totalRequired;
  const currentSelectedCount = selectedIds.length;
  const remainingQuestions = Math.max(0, requiredQuestions - currentSelectedCount);
  const correctMarks = test.correctMarks || 4;
  const totalRequiredMarks = test.totalMarks || requiredQuestions * correctMarks;
  const selectedMarks = currentSelectedCount * correctMarks;

  // Selected questions objects for preview
  const selectedQuestions = useMemo(() => {
    const byId = new Map(questions.map((q) => [q.id, q]));
    return selectedIds.map((id) => byId.get(id)).filter(Boolean) as Question[];
  }, [selectedIds, questions]);

  // Save selected questions
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const questionsPayload = selectedIds.map((id, index) => {
        const qObj = questions.find((item) => item.id === id);
        const sub = qObj ? resolveSubject(qObj) : "PHYSICS";
        return {
          questionId: id,
          position: index + 1,
          section: sectionMap[id] || (sub === "PHYSICS" || sub === "CHEMISTRY" ? "Section A" : "Section A"),
          correctMarks: test.correctMarks || 4,
          negativeMarks: test.negativeMarks || 1,
        };
      });

      const res = await fetch(
        `/api/admin/test-series/${test.testSeriesId}/tests/${test.id}/questions`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: questionsPayload }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save questions to test paper");
      }

      await onSaveQuestions(selectedIds);

      if (remainingQuestions > 0) {
        onNotice(
          `Draft paper saved with ${currentSelectedCount} of ${requiredQuestions} questions (${selectedMarks} marks). ${remainingQuestions} more questions required before final publishing.`
        );
      } else {
        onNotice(
          `Complete paper saved with all ${requiredQuestions} questions (${totalRequiredMarks} marks) successfully associated with ${test.name || test.title}!`
        );
      }

      onOpenChange(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save questions");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden flex flex-col max-h-[92vh]">
          {/* 1. Header with Authoritative Blueprint Matrix */}
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100 shrink-0 bg-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-purple-50 text-purple-700">
                  <BookOpen className="size-5" />
                </span>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                    Question Paper Builder &amp; Blueprint
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Paper: <span className="font-semibold text-slate-800">{test.name || test.title}</span> ({test.code}) •{" "}
                    <span className="font-medium text-brand-blue">{test.testType}</span>
                  </DialogDescription>
                </div>
              </div>

              {/* Header Blueprint Metrics Matrix */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-center">
                  <span className="text-3xs uppercase font-semibold text-slate-500 block">Required</span>
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {requiredQuestions} Qs
                  </span>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-center">
                  <span className="text-3xs uppercase font-semibold text-brand-blue block">Selected</span>
                  <span className="font-mono text-xs font-bold text-brand-blue">
                    {currentSelectedCount} Qs
                  </span>
                </div>

                <div
                  className={`rounded-xl border px-3 py-1.5 text-center ${
                    remainingQuestions > 0
                      ? "border-amber-300 bg-amber-50 text-amber-900"
                      : "border-emerald-300 bg-emerald-50 text-emerald-900"
                  }`}
                >
                  <span className="text-3xs uppercase font-semibold block">Remaining</span>
                  <span className="font-mono text-xs font-bold">
                    {remainingQuestions} Qs
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-center">
                  <span className="text-3xs uppercase font-semibold text-slate-500 block">Marks</span>
                  <span className="font-mono text-xs font-bold text-emerald-700">
                    {selectedMarks} / {totalRequiredMarks}
                  </span>
                </div>
              </div>
            </div>

            {/* Subject Blueprint Progress Bar Matrix */}
            {isNeetFullMock && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-3xs font-semibold">
                <div className="flex items-center justify-between rounded-lg bg-blue-50/80 px-3 py-1.5 text-brand-blue border border-blue-100">
                  <span>Physics:</span>
                  <span className="font-mono font-bold">
                    {selectedCounts.physics} / {quotas.physics}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-amber-50/80 px-3 py-1.5 text-amber-800 border border-amber-100">
                  <span>Chemistry:</span>
                  <span className="font-mono font-bold">
                    {selectedCounts.chemistry} / {quotas.chemistry}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-emerald-50/80 px-3 py-1.5 text-emerald-800 border border-emerald-100">
                  <span>Biology:</span>
                  <span className="font-mono font-bold">
                    {selectedCounts.biology} / {quotas.biology}
                  </span>
                </div>
              </div>
            )}
          </DialogHeader>

          {/* 2. Insufficient Questions Deficit Alert Banner */}
          {questionInventory.total < requiredQuestions && (
            <div className="mx-6 mt-3 flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-900 shrink-0">
              <AlertTriangle className="size-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">
                  Insufficient Questions in Question Bank – {requiredQuestions - questionInventory.total} More Questions Required
                </p>
                <p className="text-3xs text-amber-800">
                  Question Bank contains <strong>{questionInventory.total}</strong> eligible questions (Physics: {questionInventory.physics}/{quotas.physics}, Chemistry: {questionInventory.chemistry}/{quotas.chemistry}, Biology: {questionInventory.biology}/{quotas.biology}), while the NEET blueprint requires <strong>{requiredQuestions}</strong>. You can save partial draft progress, but additional questions must be added in Question Bank to finalize this 180-question paper.
                </p>
              </div>
            </div>
          )}

          {/* Quota Warning Banner */}
          {quotaWarning && (
            <div className="mx-6 mt-2 flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-700 shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span>{quotaWarning}</span>
              </div>
              <button
                type="button"
                onClick={() => setQuotaWarning(null)}
                className="text-rose-500 hover:text-rose-700 font-bold"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* 3. Subject Tabs & Filters Bar */}
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/60 space-y-2.5 shrink-0">
            {/* Subject Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(["ALL", "PHYSICS", "CHEMISTRY", "BIOLOGY"] as const).map((sub) => {
                let badgeText = "";
                if (sub === "ALL") badgeText = `${currentSelectedCount}/${requiredQuestions}`;
                else if (sub === "PHYSICS") badgeText = `${selectedCounts.physics}/${quotas.physics}`;
                else if (sub === "CHEMISTRY") badgeText = `${selectedCounts.chemistry}/${quotas.chemistry}`;
                else if (sub === "BIOLOGY") badgeText = `${selectedCounts.biology}/${quotas.biology}`;

                const isSelectedTab = subjectFilter === sub;

                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      setSubjectFilter(sub);
                      setQuotaWarning(null);
                    }}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-2xs font-bold transition cursor-pointer ${
                      isSelectedTab
                        ? "bg-brand-red text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{sub === "ALL" ? "All Subjects" : sub}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 font-mono text-3xs ${
                        isSelectedTab ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {badgeText}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filter Inputs using official shadcn/ui Select */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2 relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search question text, external ID, or chapter..."
                  className="pl-8 pr-8 text-xs h-9 bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition focus:outline-none"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* shadcn Select: Difficulty */}
              <Select value={difficultyFilter} onValueChange={(val) => setDifficultyFilter(val || "ALL")}>
                <SelectTrigger className="h-9 text-xs bg-white">
                  <SelectValue placeholder="All Difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Difficulties</SelectItem>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>

              {/* shadcn Select: Question Type */}
              <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val || "ALL")}>
                <SelectTrigger className="h-9 text-xs bg-white">
                  <SelectValue placeholder="All Question Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Question Types</SelectItem>
                  <SelectItem value="SINGLE_CORRECT">Single Correct MCQ</SelectItem>
                  <SelectItem value="MULTIPLE_CORRECT">Multiple Correct MCQ</SelectItem>
                  <SelectItem value="NUMERICAL">Numerical</SelectItem>
                  <SelectItem value="ASSERTION_REASON">Assertion &amp; Reason</SelectItem>
                  <SelectItem value="STATEMENT_BASED">Statement Based</SelectItem>
                  <SelectItem value="MATCH_FOLLOWING">Match The Following</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions & Count Matrix */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-2xs text-slate-500 pt-0.5">
              <span>
                Showing <strong>{filteredQuestions.length}</strong> matching questions in Question Bank
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="font-semibold text-brand-blue hover:underline cursor-pointer"
                >
                  Select All Filtered ({filteredQuestions.length})
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleDeselectAllFiltered}
                  className="font-semibold text-slate-600 hover:underline cursor-pointer"
                >
                  Deselect Filtered
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={selectedIds.length === 0}
                  className="font-semibold text-rose-600 hover:underline cursor-pointer disabled:opacity-40"
                >
                  Clear All ({selectedIds.length})
                </button>
              </div>
            </div>
          </div>

          {/* 4. Question Cards List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
                <RefreshCw className="size-6 animate-spin text-brand-red" />
                <p className="text-xs font-semibold text-slate-600">
                  Loading Question Bank catalog...
                </p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2 text-center">
                <FileQuestion className="size-8 text-slate-300" />
                <p className="text-xs font-semibold text-slate-700">No matching questions found</p>
                <p className="text-3xs text-slate-500 max-w-sm">
                  Adjust your search query or subject filters to find items in your Question Bank.
                </p>
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const selected = isSelected(q.id);
                const sub = resolveSubject(q);

                return (
                  <div
                    key={q.id}
                    onClick={() => toggleSelect(q)}
                    className={`rounded-2xl border p-3.5 transition cursor-pointer select-none ${
                      selected
                        ? "border-brand-red bg-rose-50/40 shadow-xs ring-1 ring-brand-red/20"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        {selected ? (
                          <CheckSquare className="size-4.5 text-brand-red" />
                        ) : (
                          <Square className="size-4.5 text-slate-300" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span title={`ID: ${q.externalId}`} className="font-mono text-3xs font-bold text-brand-red">
                            {formatDisplayQuestionId(q.externalId)}
                          </span>
                          <Badge variant="outline" className="text-3xs px-2 py-0 border-slate-200">
                            {sub}
                          </Badge>
                          {q.chapter && (
                            <span className="text-3xs text-slate-500 truncate max-w-[220px]">
                              {q.chapter.title}
                            </span>
                          )}
                          <span
                            className={`rounded px-1.5 py-0.2 text-3xs font-semibold ${
                              q.difficulty === "EASY"
                                ? "bg-emerald-50 text-emerald-700"
                                : q.difficulty === "MEDIUM"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {q.difficulty}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.2 text-3xs font-medium text-slate-600">
                            {q.type}
                          </span>
                        </div>

                        <p className="text-xs font-medium text-slate-900 line-clamp-2 leading-relaxed">
                          {q.textEn}
                        </p>

                        {q.textTa && (
                          <p className="text-3xs text-slate-500 font-sans italic line-clamp-1">
                            {q.textTa}
                          </p>
                        )}

                        {q.questionImageUrl && (
                          <span className="inline-flex items-center gap-1 text-3xs text-indigo-600 font-medium">
                            [Image Diagram Attached]
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 5. Footer with Preview & Save Action */}
          <DialogFooter className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(true)}
                disabled={selectedIds.length === 0}
                className="rounded-full text-xs font-semibold gap-1.5"
              >
                <Eye className="size-3.5 text-brand-blue" />
                <span>Preview Selected Paper ({currentSelectedCount})</span>
              </Button>

              <span className="text-2xs text-slate-500 font-medium hidden sm:inline">
                {currentSelectedCount} of {requiredQuestions} questions selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
                className="rounded-full text-xs font-medium"
              >
                Cancel
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-full bg-brand-red text-xs font-bold text-white shadow-primary hover:bg-brand-red-hover disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Saving Paper Questions...
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 size-3.5" />
                    {remainingQuestions === 0
                      ? "Save Complete Paper (180 Qs)"
                      : `Save Paper (${currentSelectedCount} / ${requiredQuestions})`}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] p-6 flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Eye className="size-4 text-brand-blue" />
              <span>Question Paper Preview ({selectedQuestions.length} Selected)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Test: {test.name || test.title} • Target: {requiredQuestions} Questions
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1">
            {selectedQuestions.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">No questions selected yet.</p>
            ) : (
              selectedQuestions.map((q, idx) => (
                <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span title={`ID: ${q.externalId}`} className="font-mono font-bold text-brand-red">
                      Q{idx + 1}. ({formatDisplayQuestionId(q.externalId)})
                    </span>
                    <Badge variant="outline" className="text-3xs">
                      {resolveSubject(q)}
                    </Badge>
                  </div>
                  <p className="font-medium text-slate-800 leading-relaxed">{q.textEn}</p>
                  {q.textTa && <p className="text-slate-500 text-3xs font-sans italic">{q.textTa}</p>}
                </div>
              ))
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewOpen(false)}
              className="rounded-full text-xs font-medium"
            >
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
